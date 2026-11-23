jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const request=require('supertest'),fs=require('fs'),path=require('path'),crypto=require('crypto');
describe('TASK04B human bbox corrections: isolated, authenticated, source-safe',()=>{
 let h,api,token,detail,target,event,sourceHash,sourcePath,rawLabelHash,rawLabel;
 const get=op=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+token);
 const post=(op,payload)=>api.post('/api/admin/ai01/actions/'+op).set('Authorization','Bearer '+token).send({payload});
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const payload=()=>({imageId:detail.item.id,expectedHash:event?.eventHash||null,status:'draft',boxes:[{id:'fixture-human-box',kind:'object',label:target,xyxy:[.15,.15,.8,.8],origin:'human',sourceIndex:null,evidence:'TEST ONLY synthetic box, no real annotation'}],objectReview:'complete',objectExtentReviewed:true,signReview:'not_reviewed',rightsVerified:false,rightsEvidence:'',sourceEvidence:'',groupEvidence:'',reason:'ISOLATED TEST ONLY; not a user annotation'});
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());token=(await api.post('/api/auth/login').send({email:'unassigned@ai01.invalid',password:h.password})).body.accessToken;detail=(await get('fast_quality_detail').query({imageId:'img-19358'}).expect(200)).body.data;target=detail.catalog.targets.find(t=>t.slug==='voi-nuoc-voi-sen').id;sourcePath=path.join(process.env.HOME,'Work/datasetai/01-raw',detail.item.path);rawLabel=path.join(process.env.HOME,'Work/datasetai/01-raw',detail.item.annotationPath);sourceHash=hash(sourcePath);rawLabelHash=hash(rawLabel);});
 afterAll(async()=>{await h.close();});
 test('overview and copy require ACTIVE ADMIN JWT',async()=>{
  await api.get('/api/admin/ai01/data/fast_quality_overview').expect(401);
  const worker=(await api.post('/api/auth/login').send({email:'reviewer_a@ai01.invalid',password:h.password})).body.accessToken;
  await api.get('/api/admin/ai01/data/fast_quality_overview').set('Authorization','Bearer '+worker).expect(403);
  await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+worker).send({payload:payload()}).expect(403);
  const o=(await get('fast_quality_overview').expect(200)).body.data;expect(o).toMatchObject({available:true,savedImages:0,exportEligibleImages:0,trained:false});expect(o.summary.counts.candidateImages).toBe(4203);
  const image=await api.get('/api/admin/ai01/fast/quality/images/'+detail.item.id).set('Authorization','Bearer '+token).expect(200);expect(crypto.createHash('sha256').update(image.body).digest('hex')).toBe(sourceHash);expect(detail.annotation).toBeNull();expect(detail.item.workingBoxes).toEqual([]);
 });
 test('rejects forged identity, invalid geometry/ontology and source-region promotion',async()=>{
  await post('fast_quality_save',{...payload(),userId:'forged'}).expect(400);
  for(const xyxy of [[-.1,0,1,1],[.8,.1,.2,.4],[0,0,.00001,.00001],['.1',0,.5,.5],[0,0,1,1,1]]){const p=payload();p.boxes[0].xyxy=xyxy;await post('fast_quality_save',p).expect(409);}
  const p=payload();p.boxes[0].kind='incident';await post('fast_quality_save',p).expect(409);
  p.boxes[0].kind='object';p.boxes[0].label='water_dripping';await post('fast_quality_save',p).expect(409);
  p.boxes[0].label=target;p.boxes[0].origin='source_object_candidate';p.boxes[0].sourceIndex=0;await post('fast_quality_save',p).expect(409);
  const rows=fs.readFileSync(path.join(process.env.HOME,'Work/datasetai/02-development/ai01-quality-v1/drafts.jsonl'),'utf8').trim().split('\n').map(JSON.parse),r=rows.find(r=>r.sourceReferences.some(b=>b.scope==='unresolved_region')),ref=r.sourceReferences.find(b=>b.scope==='unresolved_region');
  await post('fast_quality_save',{...payload(),imageId:r.id,boxes:[{...payload().boxes[0],origin:'source_object_candidate',sourceIndex:ref.sourceIndex,xyxy:ref.xyxy}]}).expect(409);
 });
 test('requires explicit extent review and per-sign visual evidence',async()=>{
  await post('fast_quality_save',{...payload(),status:'confirmed',objectExtentReviewed:false}).expect(409);
  const p={...payload(),status:'confirmed',signReview:'positive'};p.boxes.push({id:'sign',kind:'sign',label:'water_dripping',xyxy:[.2,.2,.3,.3],origin:'human',sourceIndex:null,evidence:''});await post('fast_quality_save',p).expect(409);
  await post('fast_quality_save',{...payload(),status:'confirmed',objectReview:'none_visible'}).expect(409);
  await post('fast_quality_export',{}).expect(409);
 });
 test('saves draft and confirmed revisions with immutable provenance, not approved GT',async()=>{
  event=(await post('fast_quality_save',payload()).expect(201)).body.data;expect(event).toMatchObject({kind:'bbox_revision',status:'draft',approvedGroundTruth:false,independentlyReviewed:false,sourceAnnotationSha256:rawLabelHash,userId:h.users.find(u=>u.email==='unassigned@ai01.invalid').id});expect(event.timestamp).toBeTruthy();
  await post('fast_quality_export',{imageIds:[detail.item.id]}).expect(409);
  const p={...payload(),status:'confirmed'};event=(await post('fast_quality_save',p).expect(201)).body.data;
  await post('fast_quality_save',p).expect(409);
  await post('fast_quality_export',{imageIds:[detail.item.id]}).expect(409);
  expect(hash(sourcePath)).toBe(sourceHash);expect(hash(rawLabel)).toBe(rawLabelHash);
  expect(fs.existsSync(path.join(h.home,'reviews/fast-label-development/events.jsonl'))).toBe(false);
  const d=(await get('fast_detail').query({imageId:detail.item.id}).expect(200)).body.data;expect(d.annotation).toBeNull();expect(d.qualityReview.status).toBe('confirmed');
 });
 test('exports only explicit checked corrections into development detection, preserves group/split and replay',async()=>{
  const p={...payload(),status:'confirmed',rightsVerified:true,rightsEvidence:'ISOLATED TEST proof only',sourceEvidence:'ISOLATED TEST source only',groupEvidence:'ISOLATED TEST group only',signReview:'positive'};p.boxes.push({id:'sign',kind:'sign',label:'water_dripping',xyxy:[.2,.2,.3,.3],origin:'human',sourceIndex:null,evidence:'ISOLATED TEST drops only'});
  event=(await post('fast_quality_save',p).expect(201)).body.data;
  const out=(await post('fast_quality_export',{imageIds:[detail.item.id]}).expect(201)).body.data;expect(out).toMatchObject({images:1,trainingEnabled:false,approvedGroundTruth:false});expect(out.folder.startsWith(h.home)).toBe(true);
  const record=JSON.parse(fs.readFileSync(path.join(out.folder,'records.jsonl'),'utf8').trim());expect(record).toMatchObject({eventHash:event.eventHash,aiExposed:true,benchmarkEligible:false,leakageGroup:detail.item.leakageGroup,split:detail.item.developmentSplit});
  const label=fs.readFileSync(path.join(out.folder,'object/labels',record.split,detail.item.id+'.txt'),'utf8').trim().split(' ').map(Number);expect(label).toEqual([0,.475,.475,.65,.65]);expect(fs.existsSync(path.join(out.folder,'sign/data.yaml'))).toBe(true);
  const pins=JSON.parse(fs.readFileSync(path.join(out.folder,'SHA256SUMS.json')));for(const [file,sha] of Object.entries(pins))expect(hash(path.join(out.folder,file))).toBe(sha);
  h.service.engine.close();const d=(await get('fast_quality_detail').query({imageId:detail.item.id}).expect(200)).body.data;expect(d.annotation.eventHash).toBe(event.eventHash);expect(d.history).toHaveLength(3);expect(d.blockers).toEqual([]);expect(hash(rawLabel)).toBe(rawLabelHash);
 });
 test('tampering with correction audit fails closed',async()=>{
  const file=path.join(h.home,'reviews/bbox-quality-v1/events.jsonl');fs.appendFileSync(file,'{}\n');await get('fast_quality_overview').expect(409);
 });
});
