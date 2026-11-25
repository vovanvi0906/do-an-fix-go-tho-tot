jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const request=require('supertest'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const python=path.resolve(__dirname,'../../ai-service/.venv/bin/python');
function fixture(kind='valid',seed=5100,count=20){return execFileSync(python,['-B','-c',`
import io,zipfile,random,json,csv,sys
from PIL import Image
kind,seed,count=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 if kind=='traversal':z.writestr('../escape.jpg',b'x')
 elif kind=='symlink':
  info=zipfile.ZipInfo('images/link.png');info.create_system=3;info.external_attr=0o120777<<16;z.writestr(info,'/etc/passwd')
 elif kind=='bomb':z.writestr('images/bomb.png',b'0'*1000000)
 elif kind=='duplicatepath':z.writestr('A.png',b'x');z.writestr('a.png',b'x')
 else:
  for i in range(count):
   random.seed(seed+i);im=Image.frombytes('RGB',(96,96),random.randbytes(96*96*3));b=io.BytesIO();im.save(b,format='PNG');z.writestr('images/socket-%02d.png'%i,b.getvalue())
   if kind not in ['no_metadata','plain']:
    label='0 0.5 0.5 0.8 0.8\\n1 0.5 0.4 0.2 0.2\\n'
    if kind=='invalid' and i==0:label='1 0.9 0.9 0.8 0.8\\n'
    z.writestr('labels/socket-%02d.txt'%i,label)
  if kind not in ['no_metadata','plain','no_yaml']:
   y='nc: 2\\nnames: [o-cam-dien, burn_mark]\\n'
   if kind=='yaml_metadata':y+='metadata:\\n  source_type: synthetic_ai\\n  source_reference: ISOLATED TEST YAML source\\n  rights_type: owned\\n  rights_evidence: ISOLATED TEST explicit YAML rights\\n  group_key: TEST YAML same scene\\n  generator_tool: ISOLATED TEST generator\\n  generated_at: 2026-11-20\\n'
   if kind=='roboflow_yaml':y+='roboflow:\\n  workspace: test\\n  project: test-project\\n  url: https://example.test/test-project\\n  license: CC BY 4.0\\n'
   z.writestr('data.yaml',y)
  if kind not in ['no_metadata','plain','yaml_metadata','roboflow_yaml']:
   data=[{'filename':'socket-%02d.png'%i,'source_type':'synthetic_ai','generator_tool':'ISOLATED TEST generator','generated_at':'2026-11-20','prompt':'ISOLATED TEST prompt','group_key':'TEST batch source','sign_label':'burn_mark'} for i in range(count)]
   if kind in ['complete','complete_csv','missing_rights']:
    for row in data:row.update(source_reference='ISOLATED TEST metadata source',rights_type='owned',rights_evidence='ISOLATED TEST explicit output rights')
   if kind=='missing_rights':
    for row in data:row.pop('rights_evidence')
   if kind=='test_split':data[0]['split']='test'
   if kind in ['csv','complete_csv']:
    buf=io.StringIO();w=csv.DictWriter(buf,fieldnames=list(data[0]));w.writeheader();w.writerows(data);z.writestr('metadata.csv',buf.getvalue())
   else:z.writestr('metadata.jsonl','\\n'.join(json.dumps(r) for r in data))
sys.stdout.buffer.write(out.getvalue())
`,kind,String(seed),String(count)],{maxBuffer:10*1024**2});}
function twoMetadata(bytes,change=null){return execFileSync(python,['-B','-c',`
import sys,zipfile,io,json,csv
source=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));out=io.BytesIO()
records=[json.loads(l) for l in source.read('metadata.jsonl').decode().splitlines() if l.strip()]
kind=sys.argv[1]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name in source.namelist():
  if name not in ['metadata.jsonl','metadata.csv']:z.writestr(name,source.read(name))
 buf=io.StringIO();writer=csv.DictWriter(buf,fieldnames=list(records[0]));writer.writeheader();writer.writerows(records);z.writestr('metadata.csv',buf.getvalue())
 if kind=='labels':records[0]['sign_label']='crack'
 if kind=='rights':records[0]['rights_evidence']='Different JSONL rights declaration'
 if kind=='membership':records[0]['split']='test'
 if kind=='missing':records.pop()
 if kind=='reordered':records=list(reversed(records))
 z.writestr('metadata.jsonl','\\n'.join(json.dumps(r) for r in records))
sys.stdout.buffer.write(out.getvalue())
`,change||'same'],{input:bytes,maxBuffer:20*1024**2});}
function packageV1(bytes,category,target,mode='valid'){return execFileSync(python,['-B','-c',`
import sys,io,csv,json,zipfile,hashlib
sys.path.insert(0,sys.argv[4])
# Only the column constant is needed; installed backend pilot supplies Invalid.
sys.path.insert(0,sys.argv[5])
from dataset_package import COLUMNS
source=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));out=io.BytesIO();category,target,mode=sys.argv[1:4]
rows=[]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name in source.namelist():
  if not name.startswith('images/'):continue
  content=source.read(name);z.writestr(name,content)
  row=dict(zip(COLUMNS,[name,category,target,'o-cam-dien','burn_mark','synthetic_ai','ISOLATED TEST generation record','owned','ISOLATED TEST rights declaration','declared_unverified','TEST generator','2026-11-20','ISOLATED TEST actual prompt','TEST scene '+name,'unreviewed','not_annotated','unassigned',hashlib.sha256(content).hexdigest()]))
  if mode=='bad_sha':row['sha256']='0'*64
  if mode=='bad_sign':row['sign_label']='exposed_wire'
  if mode=='missing_prompt':row['prompt']=''
  if mode=='claimed_verified':row['rights_status']='verified'
  if mode=='proposed':
   row['bbox_status']='proposed';z.writestr(name.replace('images/','labels/').replace('.png','.txt'),'0 0.5 0.5 0.8 0.8\\n1 0.5 0.4 0.2 0.2\\n')
  rows.append(row)
 buf=io.StringIO();w=csv.DictWriter(buf,fieldnames=COLUMNS);w.writeheader();w.writerows(rows);z.writestr('metadata.csv',buf.getvalue())
 if mode=='dual':z.writestr('metadata.jsonl','{}')
 z.writestr('data.yaml','fixgo_package_version: fixgo.dataset.v1\\npath: .\\ntrain: images\\nnc: 2\\nnames: [o-cam-dien, burn_mark]\\n')
sys.stdout.buffer.write(out.getvalue())
`,category,target,mode,path.resolve(__dirname,'../scripts/ai01'),path.join(require('os').homedir(),'Work/datasetai/06-benchmarks/ai01-pilot-v1')],{input:bytes,maxBuffer:20*1024**2});}
describe('Dataset staged ZIP import',()=>{
 let h,api,token,category,target,batch;
 const fields=()=>({categoryId:category.id,targetId:target.id,sourceType:'synthetic_ai',sourceReference:'ISOLATED TEST source',rightsType:'owned',rightsEvidence:'ISOLATED TEST output rights',groupKey:'TEST batch source',developmentOnly:'true',generatorTool:'TEST generator',generatedAt:'2026-11-20',datasetName:'ISOLATED TEST outlet dataset'});
 function preview(bytes,options=fields(),auth=token){let req=api.post('/api/admin/ai01/dataset/preview');if(auth)req=req.set('Authorization','Bearer '+auth);for(const [k,v] of Object.entries(options))req=req.field(k,String(v));return req.attach('files',bytes,{filename:'outlet-20.zip',contentType:'application/zip'});}
 const status=id=>api.get('/api/admin/ai01/dataset/batches/'+id).set('Authorization','Bearer '+token);
 const commit=(id,item)=>api.post(`/api/admin/ai01/dataset/batches/${id}/items/${item}`).set('Authorization','Bearer '+token);
 const read=(op,q)=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+token).query(q||{});
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());token=(await api.post('/api/auth/login').send({email:'unassigned@ai01.invalid',password:h.password})).body.accessToken;const catalog=(await read('fast_catalog').expect(200)).body.data;category=catalog.categories.find(c=>c.name==='Sửa điện');target=catalog.targets.find(t=>t.slug==='o-cam-dien');});
 afterAll(async()=>h.close());
 test('requires Admin auth and enforces upload bounds',async()=>{await preview(fixture('plain',5100,1),fields(),null).expect(401);process.env.AI01_IMPORT_MAX_UPLOAD_MB='1';await preview(Buffer.alloc(1024**2+1)).expect(413);delete process.env.AI01_IMPORT_MAX_UPLOAD_MB;});
 test('previews 20 images, YOLO and JSONL metadata without adding them to library',async()=>{batch=(await preview(fixture()).expect(201)).body.data;expect(batch.items).toHaveLength(20);expect(batch.items.every(r=>r.status==='ready'&&r.validLabelCount===2&&r.sourceType==='synthetic_ai')).toBe(true);expect((await read('fast_label_items',{dataset:'admin_upload'})).body.data.total).toBe(0);});
 test('imports sequentially, resumes after engine restart, and never auto approves source labels',async()=>{
  const first=(await commit(batch.batchId,'item-0000').expect(201)).body.data;expect(first.status).toBe('imported');
  h.service.engine.close();expect((await status(batch.batchId).expect(200)).body.data.results['item-0000'].imageId).toBe(first.imageId);
  const retry=(await commit(batch.batchId,'item-0000').expect(201)).body.data;expect(retry.imageId).toBe(first.imageId);
  for(let i=1;i<20;i++)expect((await commit(batch.batchId,`item-${String(i).padStart(4,'0')}`).expect(201)).body.data.status).toBe('imported');
  const rows=(await read('fast_label_items',{sourceType:'synthetic_ai',category:category.id,target:target.id})).body.data;expect(rows.total).toBe(20);expect(rows.items.every(r=>r.status==='pending')).toBe(true);
  const detail=(await read('fast_quality_detail',{imageId:first.imageId}).expect(200)).body.data;expect(detail.annotation).toBeNull();expect(detail.item.sourceReferences).toHaveLength(2);expect(detail.item).toMatchObject({sourceType:'synthetic_ai',synthetic:true,developmentSplit:'train',benchmarkEligible:false});
  expect(detail.item.sourceMetadata.prompt).toBe('ISOLATED TEST prompt');expect(detail.item.generatorTool).toBe('ISOLATED TEST generator');
  await api.get('/api/admin/ai01/fast/quality/images/'+first.imageId).set('Authorization','Bearer '+token).expect(200);
  await api.post('/api/admin/ai01/actions/fast_quality_export').set('Authorization','Bearer '+token).send({payload:{imageIds:[first.imageId]}}).expect(409);
 });
 test('does not import duplicates and reports malformed labels per image',async()=>{
  const again=(await preview(fixture()).expect(201)).body.data;expect(again.items.every(r=>r.status==='duplicate')).toBe(true);expect((await commit(again.batchId,'item-0000')).body.data.status).toBe('duplicate');
  const bad=(await preview(fixture('invalid',5300,2)).expect(201)).body.data;expect(bad.items[0].status).toBe('invalid');expect((await commit(bad.batchId,bad.items[0].id)).body.data.status).toBe('failed');expect((await commit(bad.batchId,bad.items[1].id)).body.data.status).toBe('imported');
 });
 test('handles ZIP without metadata/labels, and CSV metadata',async()=>{const plain=(await preview(fixture('no_metadata',5400,2)).expect(201)).body.data;expect(plain.warnings.join()).toContain('Không có metadata');expect(plain.items.every(r=>r.validLabelCount===0&&r.status==='ready')).toBe(true);const csv=(await preview(fixture('csv',5450,2)).expect(201)).body.data;expect(csv.items.every(r=>r.validLabelCount===2)).toBe(true);});
 test('requires explicit class mappings if data.yaml is absent',async()=>{
  const noYaml=(await preview(fixture('no_yaml',5500,1)).expect(201)).body.data;expect(noYaml.classes).toHaveLength(2);expect(noYaml.items[0].status).toBe('invalid');
  const checked=(await api.post(`/api/admin/ai01/dataset/batches/${noYaml.batchId}/validate`).set('Authorization','Bearer '+token).send({...fields(),developmentOnly:true,classMapping:{0:{kind:'object',label:target.id},1:{kind:'sign',label:'burn_mark'}}}).expect(201)).body.data;expect(checked.items[0].status).toBe('ready');
 });
 test.each(['traversal','symlink','bomb','duplicatepath','test_split'])('rejects unsafe ZIP: %s',async kind=>{await preview(fixture(kind,5600,1)).expect(409);});
 test('rejects invalid MIME content and imports multiple images through the same staged flow',async()=>{
  let r=api.post('/api/admin/ai01/dataset/preview').set('Authorization','Bearer '+token);for(const[k,v]of Object.entries(fields()))r=r.field(k,String(v));r=r.attach('files',Buffer.from('fake image'),{filename:'fake.png',contentType:'image/png'});const invalid=(await r.expect(201)).body.data;expect(invalid.items[0].status).toBe('invalid');
  const zip=fixture('plain',5700,2),images=execFileSync(python,['-c',"import zipfile,io,sys,json,base64;z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));print(json.dumps([base64.b64encode(z.read(n)).decode() for n in z.namelist()]))"],{input:zip,encoding:'utf8'});r=api.post('/api/admin/ai01/dataset/preview').set('Authorization','Bearer '+token);for(const[k,v]of Object.entries(fields()))r=r.field(k,String(v));JSON.parse(images).forEach((b,i)=>{r=r.attach('files',Buffer.from(b,'base64'),{filename:`multi-${i}.png`,contentType:'image/png'});});const multiple=(await r.expect(201)).body.data;expect(multiple.items).toHaveLength(2);expect((await commit(multiple.batchId,'item-0000')).body.data.status).toBe('imported');
 });
 test('isolates batches by principal, disallows mapping changes after commit, and catches tampered staging',async()=>{
  const other=(await api.post('/api/auth/login').send({email:'manager@ai01.invalid',password:h.password})).body.accessToken;
  await api.get('/api/admin/ai01/dataset/batches/'+batch.batchId).set('Authorization','Bearer '+other).expect(409);
  await api.post(`/api/admin/ai01/dataset/batches/${batch.batchId}/validate`).set('Authorization','Bearer '+token).send({...fields(),developmentOnly:true}).expect(409);
  const fresh=(await preview(fixture('plain',5800,1)).expect(201)).body.data;
  fs.appendFileSync(path.join(h.service.config.stateDir,'dataset-import-v1',fresh.batchId,'assets/images/socket-00.png'),'tampered');
  expect((await commit(fresh.batchId,'item-0000')).body.data).toMatchObject({status:'failed',message:expect.stringContaining('Checksum')});
 });
 test('metadata synthetic source cannot be downgraded by the form; generators remain recorded',async()=>{
  const response=(await preview(fixture('valid',5900,1),{...fields(),sourceType:'own_photo',generatorTool:'',generatedAt:''}).expect(201)).body.data;
  expect(response.items[0]).toMatchObject({sourceType:'synthetic_ai',generatorTool:'ISOLATED TEST generator',generatedAt:'2026-11-20',status:'ready'});
 });
 test('checks expanded image count and rejects missing/invalid class mappings',async()=>{
  process.env.AI01_IMPORT_MAX_IMAGES='1';try{await preview(fixture('plain',5950,2)).expect(409);}finally{delete process.env.AI01_IMPORT_MAX_IMAGES;}
  const b=(await preview(fixture('valid',5960,1)).expect(201)).body.data;
  await api.post(`/api/admin/ai01/dataset/batches/${b.batchId}/validate`).set('Authorization','Bearer '+token).send({...fields(),developmentOnly:true,classMapping:{0:{kind:'sign',label:'not_a_real_sign'}}}).expect(409);
 });
 test('a human draft with deleted boxes never resurrects source boxes as saved Admin labels',async()=>{
  const b=(await preview(fixture('valid',5970,1)).expect(201)).body.data;
  const id=(await commit(b.batchId,'item-0000')).body.data.imageId;
  await api.post('/api/admin/ai01/actions/fast_quality_save').set('Authorization','Bearer '+token).send({payload:{imageId:id,expectedHash:null,status:'draft',boxes:[],objectReview:'not_reviewed',objectExtentReviewed:false,signReview:'not_reviewed',rightsVerified:false,rightsEvidence:'',sourceEvidence:'',groupEvidence:'',reason:'ISOLATED TEST explicitly deleted source boxes',duplicateReview:null}}).expect(201);
  const detail=(await read('fast_detail',{imageId:id})).body.data;expect(detail.annotations).toEqual([]);expect(detail.sourceOverlay).toBe(false);
 });

 test.each(['complete','complete_csv','yaml_metadata'])('reads all provenance from %s with the minimal UI options, preserving gates',async kind=>{
  const minimal={categoryId:category.id,targetId:target.id,developmentOnly:'true'};
  const b=(await preview(fixture(kind,6100+['complete','complete_csv','yaml_metadata'].indexOf(kind)*30,20),minimal).expect(201)).body.data;
  expect(b.items).toHaveLength(20);expect(b.items.every(r=>r.status==='ready'&&r.missingInfo.length===0)).toBe(true);
  const committed=(await commit(b.batchId,'item-0000')).body.data;expect(committed.status).toBe('imported');
  const detail=(await read('fast_quality_detail',{imageId:committed.imageId})).body.data;
  expect(detail.annotation).toBeNull();expect(detail.item).toMatchObject({sourceType:'synthetic_ai',rightsType:'owned',benchmarkEligible:false,developmentSplit:'train'});
  expect(detail.item.rightsEvidence).toContain('ISOLATED TEST explicit');
 });
 test('shows ZIP without metadata before requiring advanced information; does not fabricate provenance',async()=>{
  const minimal={categoryId:category.id,developmentOnly:'true'},bytes=fixture('plain',6300,2);
  const b=(await preview(bytes,minimal).expect(201)).body.data;
  expect(b.items[0]).toMatchObject({status:'invalid',sourceType:'',rightsEvidence:'',groupKey:''});expect(b.items[0].missingInfo).toContain('rightsEvidence');
  const checked=(await api.post(`/api/admin/ai01/dataset/batches/${b.batchId}/validate`).set('Authorization','Bearer '+token).send({...fields(),sourceType:'own_photo',rightsType:'owned',developmentOnly:true}).expect(201)).body.data;
  expect(checked.items.every(r=>r.status==='ready')).toBe(true);
 });
 test('retains missing-rights blocking even when metadata otherwise supplies source and labels',async()=>{
  const b=(await preview(fixture('missing_rights',6350,1),{categoryId:category.id,developmentOnly:'true'}).expect(201)).body.data;
  expect(b.items[0].status).toBe('invalid');expect(b.items[0].missingInfo).toEqual(['rightsEvidence']);
  expect((await commit(b.batchId,'item-0000')).body.data.status).toBe('failed');
 });
 test('recognizes Roboflow YAML without inventing rights evidence or independent groups',async()=>{
  const b=(await preview(fixture('roboflow_yaml',6360,1),{categoryId:category.id,developmentOnly:'true'}).expect(201)).body.data;
  expect(b.items[0]).toMatchObject({sourceType:'roboflow',sourceReference:'https://example.test/test-project',rightsEvidence:'',groupKey:'',status:'invalid'});
 });

 test.each(['same','reordered'])('deduplicates equivalent CSV/JSONL (%s) and records CSV selection',async mode=>{
  const b=(await preview(twoMetadata(fixture('complete',6500+(mode==='same'?0:5),2),mode),{categoryId:category.id,developmentOnly:'true'}).expect(201)).body.data;
  expect(b.metadataComparison).toMatchObject({mode:'equivalent',selected:'csv',requiresSelection:false});expect(b.items).toHaveLength(2);
  const result=(await commit(b.batchId,'item-0000')).body.data;expect(result.status).toBe('imported');
  const detail=(await read('fast_quality_detail',{imageId:result.imageId})).body.data;expect(detail.item.metadataProvenance.selected).toBe('csv');expect(detail.item.metadataProvenance.files).toHaveLength(2);
  expect((await commit(b.batchId,'item-0000')).body.data.imageId).toBe(result.imageId);
 });
 test.each(['labels','rights','missing'])('requires explicit metadata source for differences: %s',async difference=>{
  const b=(await preview(twoMetadata(fixture('complete',6600+['labels','rights','missing'].indexOf(difference)*3,2),difference),{categoryId:category.id,developmentOnly:'true'}).expect(201)).body.data;
  expect(b.metadataComparison).toMatchObject({mode:'conflict',selected:null,requiresSelection:true});expect(b.metadataComparison.differences.length).toBeGreaterThan(0);
  await commit(b.batchId,'item-0000').expect(409);
  const chosen=(await api.post(`/api/admin/ai01/dataset/batches/${b.batchId}/validate`).set('Authorization','Bearer '+token).send({categoryId:category.id,developmentOnly:true,metadataSource:'csv'}).expect(201)).body.data;
  expect(chosen.metadataComparison).toMatchObject({selected:'csv',requiresSelection:false});expect(chosen.items.every(r=>r.status==='ready')).toBe(true);
  expect((await commit(b.batchId,'item-0000')).body.data.status).toBe('imported');
 });
 test('cannot hide protected test membership by selecting the other metadata file',async()=>{
  await preview(twoMetadata(fixture('complete',6680,1),'membership'),{categoryId:category.id,developmentOnly:'true',metadataSource:'csv'}).expect(409);
 });
 test('checks the user ZIP read-only in disposable state and uses CSV once',async()=>{
  const filename=path.join(require('os').homedir(),'Downloads/fixgo_suadien_outlet_burnmark_20.zip');
  if(!fs.existsSync(filename))return;
  const bytes=fs.readFileSync(filename),before=require('crypto').createHash('sha256').update(bytes).digest('hex');
  const b=(await preview(bytes,{categoryId:category.id,targetId:target.id,developmentOnly:'true'}).expect(201)).body.data;
  expect(b.items).toHaveLength(20);expect(b.metadataComparison).toMatchObject({mode:'equivalent',selected:'csv',requiresSelection:false});
  expect(b.items.every(r=>r.sourceType==='synthetic_ai'&&r.sourceMetadata.image_file&&r.sourceMetadata.source_group)).toBe(true);
  expect(b.items.every(r=>r.validLabelCount===0&&r.missingInfo.includes('rightsEvidence'))).toBe(true);
  const report={file:filename,archiveSha256:before,images:b.items.length,metadata:b.metadataComparison,missingInfo:b.items[0].missingInfo,source:b.items[0].sourceType,sourceLabelCount:b.items.reduce((n,r)=>n+r.labelCount,0),temporaryStateOnly:true};fs.writeFileSync('/tmp/fixgo-real-zip-metadata-result.json',JSON.stringify(report,null,2));
  expect(require('crypto').createHash('sha256').update(fs.readFileSync(filename)).digest('hex')).toBe(before);
 });

 test('v1 reads 20 complete rows without any form taxonomy/provenance; absent boxes stay pending',async()=>{
  const b=(await preview(packageV1(fixture('plain',7100,20),category.id,target.id),{developmentOnly:'true'}).expect(201)).body.data;
  expect(b.packageVersion).toBe('fixgo.dataset.v1');expect(b.items).toHaveLength(20);
  expect(b.items.every(r=>r.status==='ready'&&r.categoryId===category.id&&r.targetId===target.id&&r.validLabelCount===0)).toBe(true);
  const result=(await commit(b.batchId,b.items[0].id)).body.data;expect(result.status).toBe('imported');
  const detail=(await read('fast_quality_detail',{imageId:result.imageId})).body.data;
  expect(detail.annotation).toBeNull();expect(detail.item).toMatchObject({benchmarkEligible:false,approvedGroundTruth:false,independentlyReviewed:false});
 });
 test('v1 accepts explicit object/sign proposal mapping without approving boxes',async()=>{
  const b=(await preview(packageV1(fixture('plain',7150,1),category.id,target.id,'proposed'),{developmentOnly:'true'}).expect(201)).body.data;
  expect(b.items[0]).toMatchObject({status:'ready',validLabelCount:2});
 });
 test.each(['bad_sha','bad_sign','missing_prompt','claimed_verified'])('v1 reports invalid per-image metadata: %s',async mode=>{
  const b=(await preview(packageV1(fixture('plain',7200,1),category.id,target.id,mode),{developmentOnly:'true'}).expect(201)).body.data;
  expect(b.items[0].status).toBe('invalid');expect((await commit(b.batchId,b.items[0].id)).body.data.status).toBe('failed');
 });
 test('v1 refuses a second metadata source',async()=>{await preview(packageV1(fixture('plain',7250,1),category.id,target.id,'dual'),{developmentOnly:'true'}).expect(409);});


 test('offline CLI and backend agree on valid v1 and invalid hashes',async()=>{
  for(const mode of ['valid','bad_sha']){
   const zip=path.join(h.home,`preflight-${mode}.zip`);fs.writeFileSync(zip,packageV1(fixture('plain',7300,2),category.id,target.id,mode));
   let result;
   try{result=execFileSync(python,['-B',path.resolve(__dirname,'../scripts/ai01/validate_fixgo_dataset.py'),zip],{encoding:'utf8'});}catch(e){expect(mode).toBe('bad_sha');expect(e.status).toBe(1);result=e.stdout;}
   const report=JSON.parse(result);expect(report.valid).toBe(mode==='valid');expect(report.trainingEligible).toBe(false);expect(report.imageCount).toBe(2);
   const b=(await preview(fs.readFileSync(zip),{developmentOnly:'true'}).expect(201)).body.data;
   expect(b.items.every(r=>r.status==='ready')).toBe(report.valid);
  }
 });

});
