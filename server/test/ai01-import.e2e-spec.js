jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const request=require('supertest'),crypto=require('crypto'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const sample=(seed=829)=>Buffer.from(execFileSync(path.resolve(__dirname,'../../ai-service/.venv/bin/python'),['-B','-c',`import io,random,base64;from PIL import Image;random.seed(${seed});im=Image.frombytes('RGB',(96,96),random.randbytes(96*96*3));out=io.BytesIO();im.save(out,format='PNG');print(base64.b64encode(out.getvalue()).decode())`],{encoding:'utf8'}).trim(),'base64');
describe('Admin dataset image import → labeling → gated export',()=>{
 let h,api,token,catalog,category,target,image,id,event;
 const read=(op,q={})=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+token).query(q);
 const metadata=()=>({uploadId:crypto.randomUUID(),categoryId:category.id,targetId:target.id,sourceType:'own_photo',sourceReference:'ISOLATED TEST photographer',rightsType:'owned',rightsEvidence:'ISOLATED TEST rights declaration',groupKey:'ISOLATED TEST device session',developmentOnly:'true'});
 function upload(buffer=image,fields=metadata(),auth=token,mime='image/png'){let r=api.post('/api/admin/ai01/dataset/images');if(auth)r=r.set('Authorization','Bearer '+auth);for(const [k,v] of Object.entries(fields))r=r.field(k,v);return r.attach('image',buffer,{filename:'socket-test.png',contentType:mime});}
 const boxPayload=()=>({imageId:id,expectedHash:event?.eventHash||null,status:'confirmed',objectReview:'complete',objectExtentReviewed:true,signReview:'positive',rightsVerified:false,rightsEvidence:'',sourceEvidence:'',groupEvidence:'',reason:'ISOLATED TEST, not real image labels',boxes:[{id:'obj',kind:'object',label:target.id,xyxy:[.1,.1,.9,.9],origin:'human',sourceIndex:null,evidence:''},{id:'sign',kind:'sign',label:'burn_mark',xyxy:[.2,.2,.4,.4],origin:'human',sourceIndex:null,evidence:'ISOLATED TEST fixture'}]});
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());token=(await api.post('/api/auth/login').send({email:'unassigned@ai01.invalid',password:h.password})).body.accessToken;catalog=(await read('fast_catalog').expect(200)).body.data;category=catalog.categories.find(c=>c.name==='Sửa điện');target=catalog.targets.find(t=>t.categoryId===category.id&&t.slug==='o-cam-dien');image=sample();});
 afterAll(async()=>{await h.close();});
 test('requires authenticated ACTIVE ADMIN and validates file/body before import',async()=>{
  await upload(image,metadata(),null).expect(401);const reviewer=(await api.post('/api/auth/login').send({email:'reviewer_a@ai01.invalid',password:h.password})).body.accessToken;await upload(image,metadata(),reviewer).expect(403);
  await upload(image,{...metadata(),developmentOnly:'false'}).expect(400);await upload(image,{...metadata(),approvedGroundTruth:'true'}).expect(400);await upload(image,{...metadata(),targetId:catalog.targets.find(t=>t.categoryId!==category.id).id}).expect(409);
  await upload(Buffer.from('NOT AN IMAGE')).expect(409);await upload(image,metadata(),token,'image/svg+xml').expect(400);await upload(Buffer.alloc(10*1024*1024+1)).expect(413);
 });
 test('does not admit protected reference images into development or reuse their IDs',async()=>{
  const inventory=fs.readFileSync(path.join(path.dirname(h.service.config.pilotDir),'ai01-label-review-v1/images.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const reference=inventory.find(r=>r.reference&&fs.existsSync(path.resolve(__dirname,'../../ai-service/dataset',r.path)));expect(reference).toBeTruthy();
  const protectedBytes=fs.readFileSync(path.resolve(__dirname,'../../ai-service/dataset',reference.path));
  const response=await upload(protectedBytes,metadata(),token,'image/jpeg').expect(409);expect(response.body.message).toContain('tham chiếu được bảo vệ');
 });
 test('adds a quarantined image with no auto labels; taxonomy hint, list, image and bbox editor work',async()=>{
  const result=(await upload().expect(201)).body.data;expect(result).toMatchObject({status:'imported',partition:'quarantine',nearDuplicateCount:0});id=result.imageId;
  const library=(await read('fast_items').expect(200)).body.data.items.find(r=>r.id===id);expect(library).toMatchObject({imported:true,status:'pending',labelConfirmed:false});
  const detail=(await read('fast_detail',{imageId:id}).expect(200)).body.data;expect(detail).toMatchObject({imported:true,annotation:null,sourceLabels:[],annotations:[]});expect(detail.qualityReview.imported).toBe(true);expect(detail.candidates[0].targetId).toBe(target.id);expect(detail.blockers.length).toBeGreaterThan(0);
  const list=(await read('fast_label_items',{dataset:'admin_upload',category:category.id,target:target.id}).expect(200)).body.data;expect(list.total).toBe(1);expect(list.items[0].status).toBe('pending');
  await api.get('/api/admin/ai01/fast/images/'+id).set('Authorization','Bearer '+token).expect('Content-Type',/image\/png/).expect(200);
  const bbox=(await read('fast_quality_detail',{imageId:id}).expect(200)).body.data;expect(bbox.item.sourceReferences).toEqual([]);expect(bbox.annotation).toBeNull();
 });
 test('duplicate exact pixels do not create copies; request retries are idempotent',async()=>{
  const result=(await upload().expect(201)).body.data;expect(result).toMatchObject({status:'duplicate',imageId:id});
  const fields=metadata();const response=(await upload(sample(830),fields).expect(201)).body.data;
  const retry=(await upload(sample(830),fields).expect(201)).body.data;expect(retry).toMatchObject({status:'existing',imageId:response.imageId});
  const options=(await read('fast_label_items',{dataset:'admin_upload'}).expect(200)).body.data;expect(options.total).toBe(2);
 });
 test('saved bbox is still blocked without source/rights/group evidence and optimistic concurrency',async()=>{
  event=(await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload:boxPayload()}).expect(201)).body.data;expect(event).toMatchObject({sourceKind:'admin_upload',approvedGroundTruth:false});
  await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[id]}}).expect(409);
  await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload:{...boxPayload(),expectedHash:null}}).expect(409);
 });
 test('export verifies current bytes and evidence, preserving separate imported provenance',async()=>{
  event=(await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload:{...boxPayload(),rightsVerified:true,rightsEvidence:'ISOLATED TEST evidence',sourceEvidence:'ISOLATED TEST original image',groupEvidence:'ISOLATED TEST group review'}}).expect(201)).body.data;
  const result=(await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[id]}}).expect(201)).body.data;expect(result.images).toBe(1);expect(result.approvedGroundTruth).toBe(false);
  const record=JSON.parse(fs.readFileSync(path.join(result.folder,'records.jsonl'),'utf8').trim());expect(record.sourceKind).toBe('admin_upload');expect(record.importEventHash).toBeTruthy();
  expect(fs.existsSync(path.join(result.folder,'object/images',event.split,id+'.png'))).toBe(true);expect(fs.existsSync(path.join(result.folder,'sign/labels',event.split,id+'.txt'))).toBe(true);
  const detail=(await read('fast_detail',{imageId:id}).expect(200)).body.data;expect(detail.annotations).toHaveLength(2);const library=(await read('fast_items').expect(200)).body.data.items.find(r=>r.id===id);expect(library).toMatchObject({status:'confirmed',labelConfirmed:true});expect(library.currentLabelsVi).toContain(target.name);
 });
 test('trial preparation recognizes the imported provenance but blocks insufficient training data',async()=>{
  const result=(await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[id]}}).expect(201)).body.data;
  const {spawnSync}=require('child_process');const run=spawnSync(path.resolve(__dirname,'../../ai-service/.venv/bin/python'),['-B',path.resolve(__dirname,'../../ai-service/training/visual_service_training.py'),'--state',path.join(h.home,'reviews'),'--export',result.folder,'--raw',path.join(require('os').homedir(),'Work/datasetai/01-raw'),'--out',path.join(h.home,'new-trial'),'--target-slug',target.slug,'--signs','burn_mark'],{encoding:'utf8'});
  expect(run.status).toBe(2);const report=JSON.parse(run.stdout.trim());expect(report.readyForTrialTraining).toBe(false);expect(report.classSupport['sign:burn_mark']).toBeTruthy();expect(fs.existsSync(path.join(h.home,'new-trial'))).toBe(false);
 });
 test('near duplicate candidates remain blocked until explicit audited independent-image review',async()=>{
  const variant=Buffer.from(execFileSync(path.resolve(__dirname,'../../ai-service/.venv/bin/python'),['-B','-c',"import io,sys,base64;from PIL import Image;im=Image.open(io.BytesIO(base64.b64decode(sys.stdin.read()))).convert('RGB');p=im.getpixel((0,0));im.putpixel((0,0),((p[0]+1)%256,p[1],p[2]));out=io.BytesIO();im.save(out,format='PNG');print(base64.b64encode(out.getvalue()).decode())"],{input:image.toString('base64'),encoding:'utf8'}).trim(),'base64');
  const imported=(await upload(variant,{...metadata(),groupKey:'ISOLATED TEST different session'}).expect(201)).body.data;expect(imported.nearDuplicateCount).toBeGreaterThan(0);
  const detail=(await read('fast_quality_detail',{imageId:imported.imageId}).expect(200)).body.data;
  let payload={...boxPayload(),imageId:imported.imageId,expectedHash:null,rightsVerified:true,rightsEvidence:'TEST evidence',sourceEvidence:'TEST source',groupEvidence:'TEST group'};
  let saved=(await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload}).expect(201)).body.data;
  await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[imported.imageId]}}).expect(409);
  payload={...payload,expectedHash:saved.eventHash,duplicateReview:{decision:'independent',evidence:'ISOLATED TEST fixture review, not a real assessment',imageIds:detail.item.nearCandidates.map(c=>c.imageId)}};
  await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload:{...payload,duplicateReview:{...payload.duplicateReview,imageIds:[]}}}).expect(409);
  await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload}).expect(201);
  await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[imported.imageId]}}).expect(201);
 });
 test('normalizes camera orientation and removes EXIF from the served copy while retaining original bytes',async()=>{
  const camera=Buffer.from(execFileSync(path.resolve(__dirname,'../../ai-service/.venv/bin/python'),['-B','-c',"import io,random,base64;from PIL import Image;random.seed(129);im=Image.frombytes('RGB',(96,72),random.randbytes(96*72*3));exif=Image.Exif();exif[274]=6;exif[270]='PRIVATE-EXIF-FIXTURE';out=io.BytesIO();im.save(out,format='JPEG',exif=exif);print(base64.b64encode(out.getvalue()).decode())"],{encoding:'utf8'}).trim(),'base64');
  const added=(await upload(camera,metadata(),token,'image/jpeg').expect(201)).body.data;expect(added.status).toBe('imported');
  const imageResponse=await api.get('/api/admin/ai01/fast/images/'+added.imageId).set('Authorization','Bearer '+token).expect(200);expect(imageResponse.body.readUInt32BE(16)).toBe(72);expect(imageResponse.body.readUInt32BE(20)).toBe(96);expect(imageResponse.body.includes(Buffer.from('PRIVATE-EXIF-FIXTURE'))).toBe(false);
  const imports=fs.readFileSync(path.join(h.home,'reviews/uploaded-dataset-v1/events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);const entry=imports.find(e=>e.id===added.imageId);expect(fs.readFileSync(path.join(h.home,'reviews/uploaded-dataset-v1',entry.originalFile)).equals(camera)).toBe(true);
 });
 test('persists across engine restart and detects mutated original bytes',async()=>{
  h.service.engine.close();const detail=(await read('fast_quality_detail',{imageId:id}).expect(200)).body.data;expect(detail.annotation.eventHash).toBe(event.eventHash);
  const log=fs.readFileSync(path.join(h.home,'reviews/uploaded-dataset-v1/events.jsonl'),'utf8').trim().split('\n').map(JSON.parse),entry=log.find(e=>e.id===id);
  const file=path.join(h.home,'reviews/uploaded-dataset-v1',entry.originalFile),before=fs.readFileSync(file);try{fs.writeFileSync(file,'CHANGED');await read('fast_detail',{imageId:id}).expect(409);await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[id]}}).expect(409);}finally{fs.writeFileSync(file,before);}
 });
});
