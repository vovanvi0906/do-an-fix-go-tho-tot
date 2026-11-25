jest.mock('../src/config/firebase.config', () => ({ getFirebaseAuth: jest.fn(), getFirebaseAdmin: jest.fn() }));
const {createHarness} = require('./ai01-admin-harness.cjs');
const request = require('supertest');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const empty = {category:null,target:null,visibleFault:null,symptom:null,recommendedService:null,unknown:null,needsInspection:null};

describe('SOLO_THESIS: separate one-person history/export with original independent gates intact',()=>{
 let h,api,tokens={},item,tax,annotation,independentBefore,sourceBefore,artifact;
 const get=(role,op,query={})=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+tokens[role]).query(query);
 const post=(role,op,payload)=>api.post('/api/admin/ai01/actions/'+op).set('Authorization','Bearer '+tokens[role]).send({payload});
 const soloFile=()=>path.join(h.home,'reviews/solo-thesis/events.jsonl');
 const latest=async()=> (await get('unassigned','solo_detail',{imageId:item.id}).expect(200)).body.data;
 const valid=()=>({imageId:item.id,labels:{category:tax.targets.find(t=>t.slug==='o-cam-dien').categoryId,target:tax.targets.find(t=>t.slug==='o-cam-dien').id,visibleFault:[],symptom:null,recommendedService:[],unknown:false,needsInspection:true},decision:'submitted',visualCondition:'no_abnormality_visible',reason:'TEMPORARY SOLO CONTRACT FIXTURE, NOT REAL LABEL',expectedAnnotationHash:annotation?.eventHash||null});
 beforeAll(async()=>{
  h=await createHarness();api=request(h.app.getHttpServer());
  for(const role of ['unassigned','coordinator','reviewer_a','viewer','customer','manager']){
   const r=await api.post('/api/auth/login').send({email:role+'@ai01.invalid',password:h.password}).expect(201);tokens[role]=r.body.accessToken;
  }
  await get('coordinator','history').expect(200);
  await get('unassigned','history').expect(200);
  independentBefore=sha(path.join(h.home,'reviews/events.jsonl'));sourceBefore=sha(path.join(process.env.AI01_PILOT_DIR,'reviews/events.jsonl'));
  const rows=(await get('unassigned','solo_items').expect(200)).body.data.items;item=rows.find(r=>r.dataset==='suadien');tax=(await get('unassigned','solo_catalog').expect(200)).body.data;
 },30000);
 afterAll(async()=>{
  try{expect(sha(path.join(h.home,'reviews/events.jsonl'))).toBe(independentBefore);expect(sha(path.join(process.env.AI01_PILOT_DIR,'reviews/events.jsonl'))).toBe(sourceBefore);}finally{await h.close();}
 });
 test('only live ACTIVE ADMIN can use SOLO; frontend role and spoofed identity do not grant it',async()=>{
  await api.get('/api/admin/ai01/data/solo_items').expect(401);
  for(const role of ['reviewer_a','viewer','customer']){await get(role,'solo_items').expect(403);await post(role,'solo_annotate',{}).expect(403);}
  const user=h.users.find(u=>u.email==='customer@ai01.invalid');const forged=h.jwt.sign({sub:user.id,role:'ADMIN'});await api.get('/api/admin/ai01/data/solo_items').set('Authorization','Bearer '+forged).expect(403);
  await post('unassigned','solo_annotate',{userId:h.users[0].id}).expect(400);
  await post('unassigned','annotate',{}).expect(403);
  const admin=h.users.find(u=>u.email==='unassigned@ai01.invalid');
  try{admin.status='BLOCKED';await get('unassigned','solo_items').expect(401);}finally{admin.status='ACTIVE';}
 });
 test('uncertain/reject remain audited and cannot be confirmed or exported; optimistic concurrency prevents stale edits',async()=>{
  const payload={imageId:item.id,labels:empty,visualCondition:'difficult',decision:'uncertain',reason:'TEMPORARY uncertain fixture',expectedAnnotationHash:null};
  annotation=(await post('unassigned','solo_annotate',payload).expect(201)).body.data;
  expect(annotation.data.mode).toBe('SOLO_THESIS');expect(annotation.reviewerId).toBe(h.users.find(u=>u.email==='unassigned@ai01.invalid').id);expect(annotation.timestamp).toBeTruthy();
  await post('unassigned','solo_confirm',{imageId:item.id,annotationEventHash:annotation.eventHash,reason:'Cannot confirm uncertain'}).expect(409);
  await post('unassigned','solo_export',{imageIds:[item.id]}).expect(409);
  await post('unassigned','solo_annotate',payload).expect(409);
  annotation=(await post('unassigned','solo_annotate',{...payload,decision:'reject',reason:'TEMPORARY rejected fixture',expectedAnnotationHash:annotation.eventHash}).expect(201)).body.data;
  await post('unassigned','solo_confirm',{imageId:item.id,annotationEventHash:annotation.eventHash,reason:'Cannot confirm reject'}).expect(409);
  const history=(await latest()).history;expect(history.filter(e=>e.kind==='solo_annotation').map(e=>e.data.decision)).toEqual(['uncertain','reject']);
 });
 test('taxonomy, observation and service evidence checks are enforced without fake A/B attestations',async()=>{
  await post('unassigned','solo_annotate',{...valid(),labels:{...valid().labels,target:'not-a-taxonomy-id'}}).expect(409);
  await post('unassigned','solo_annotate',{...valid(),visualCondition:'out_of_scope'}).expect(409);
  await post('unassigned','solo_annotate',{...valid(),independentAttestation:true}).expect(409);
  annotation=(await post('unassigned','solo_annotate',valid()).expect(201)).body.data;
  expect(annotation.data).not.toHaveProperty('independentAttestation');expect(annotation.data).not.toHaveProperty('blindToToolAI');
  await post('manager','solo_confirm',{imageId:item.id,annotationEventHash:annotation.eventHash,reason:'Other Admin cannot self-confirm this annotation'}).expect(409);
 });
 test('mapping/provenance remain separate, metadata is never invented, and source changes invalidate confirmation',async()=>{
  const target=valid().labels.target;
  for(const key of item.mappingKeys)await post('unassigned','solo_mapping',{mappingKey:key,decision:'revised',allowedTargetIds:[target],revisedMeaning:'TEMPORARY mapping fixture',reason:'TEMPORARY SOLO CONTRACT TEST ONLY'}).expect(201);
  const provenance={imageId:item.id,rightsVerified:true,licenseOrConsent:'TEMPORARY TEST RIGHTS',rightsEvidence:'SIMULATED TEST EVIDENCE',sourceVerified:true,sourceEvidence:'SIMULATED TEST SOURCE',origin:'licensed_external',deviceId:null,sessionId:null,siteId:null,duplicateGroup:'TEMPORARY-TEST-GROUP',groupReviewComplete:true,groupEvidence:'SIMULATED TEST GROUP',identitiesProvidedBySource:false,identityEvidence:'',partition:'validation'};
  await post('unassigned','solo_save_provenance',provenance).expect(201);
  await post('unassigned','solo_confirm',{imageId:item.id,annotationEventHash:annotation.eventHash,reason:'TEMPORARY self check fixture'}).expect(201);
  await post('unassigned','solo_export',{imageIds:[item.id]}).expect(409);
  await post('unassigned','solo_save_provenance',{...provenance,deviceId:'FAKE-NO-EVIDENCE'}).expect(409);
  await post('unassigned','solo_save_provenance',{...provenance,deviceId:'TEMPORARY-TEST-DEVICE',sessionId:'TEMPORARY-TEST-SESSION',identitiesProvidedBySource:true,identityEvidence:'TEMPORARY CONTRACT FIXTURE ONLY; NOT REAL METADATA'}).expect(201);
  expect((await latest()).blockers.some(b=>b.includes('Nguồn/metadata đã đổi'))).toBe(true);
  await post('unassigned','solo_export',{imageIds:[item.id]}).expect(409);
 });
 test('solo export has its own schema, one real principal, audited hash and cannot enter approved export routes',async()=>{
  await post('unassigned','solo_confirm',{imageId:item.id,annotationEventHash:annotation.eventHash,reason:'TEMPORARY final self check fixture'}).expect(201);
  const before=fs.readFileSync(soloFile(),'utf8');
  await post('unassigned','solo_export',{imageIds:[item.id,'img-19228']}).expect(409);
  expect(fs.readFileSync(soloFile(),'utf8')).toBe(before);
  await post('manager','solo_export',{imageIds:[item.id]}).expect(409);
  artifact=(await post('unassigned','solo_export',{imageIds:[item.id]}).expect(201)).body.data;
  expect(artifact.file).toMatch(/^solo-development-/);
  const r=await api.get('/api/admin/ai01/solo/exports/'+artifact.file).set('Authorization','Bearer '+tokens.unassigned).expect(200);
  const text=r.text||r.body.toString(),record=JSON.parse(text);
  expect(record).toMatchObject({schemaVersion:'fixgo.ai01.solo-development.v1',mode:'SOLO_THESIS',split:'development',datasetType:'solo-development',review:{status:'self_confirmed',independentlyReviewed:false,blindTest:false}});
  expect(record.review.annotatorIds).toHaveLength(1);expect(record.review.confirmedBy).toBe(record.review.annotatorIds[0]);expect(text).not.toContain('/home/');expect(text).not.toContain('adjudicated');
  await api.get('/api/admin/ai01/exports/'+artifact.file).set('Authorization','Bearer '+tokens.unassigned).expect(400);
  await api.get('/api/admin/ai01/solo/exports/approved-development-123Z.jsonl').set('Authorization','Bearer '+tokens.unassigned).expect(400);
  await api.get('/api/admin/ai01/solo/exports/'+artifact.file).set('Authorization','Bearer '+tokens.reviewer_a).expect(403);
  await post('unassigned','export',{imageIds:[item.id]}).expect(409);
 });
 test('edits invalidate confirmation, mapping revisions require recheck, restart preserves history and tampered exports fail',async()=>{
  const old=annotation.eventHash;annotation=(await post('unassigned','solo_annotate',{...valid(),reason:'TEMPORARY label correction'}).expect(201)).body.data;
  expect(annotation.data.previousAnnotationHash).toBe(old);await post('unassigned','solo_export',{imageIds:[item.id]}).expect(409);
  await post('unassigned','solo_confirm',{imageId:item.id,annotationEventHash:old,reason:'Stale hash'}).expect(409);
  await post('unassigned','solo_confirm',{imageId:item.id,annotationEventHash:annotation.eventHash,reason:'TEMPORARY recheck'}).expect(201);
  await post('unassigned','solo_mapping',{mappingKey:item.mappingKeys[0],decision:'uncertain',reason:'TEMPORARY mapping uncertainty'}).expect(201);
  expect((await latest()).blockers.some(b=>b.includes('Mapping SOLO đã đổi'))).toBe(true);
  await post('unassigned','solo_export',{imageIds:[item.id]}).expect(409);
  const hashes=(await latest()).history.map(e=>e.eventHash);h.service.engine.close();expect((await latest()).history.map(e=>e.eventHash)).toEqual(hashes);
  fs.appendFileSync(path.join(h.home,'reviews/solo-thesis/exports',artifact.file),'TAMPERED');
  await api.get('/api/admin/ai01/solo/exports/'+artifact.file).set('Authorization','Bearer '+tokens.unassigned).expect(409);
 });
 test('SOLO image paths and related images enforce ID/membership/hash checks',async()=>{
  const r=await api.get('/api/admin/ai01/solo/images/'+item.id).set('Authorization','Bearer '+tokens.unassigned).expect(200);
  expect(crypto.createHash('sha256').update(r.body).digest('hex')).toBe(item.sha256);
  await api.get('/api/admin/ai01/solo/images/not-an-image').set('Authorization','Bearer '+tokens.unassigned).expect(400);
  await api.get('/api/admin/ai01/solo/images/'+item.id+'/related/999999').set('Authorization','Bearer '+tokens.unassigned).expect(409);
 });
 test('corrupted SOLO audit is rejected on replay without repairing or rewriting history',async()=>{
  const original=fs.readFileSync(soloFile());
  try{
   const rows=original.toString().trim().split('\n').map(JSON.parse);rows[0].data.reason='TAMPERED TEMPORARY LOG';
   fs.writeFileSync(soloFile(),rows.map(JSON.stringify).join('\n')+'\n');h.service.engine.close();
   await get('unassigned','solo_items').expect(503);
   expect(fs.readFileSync(soloFile()).equals(original)).toBe(false);
  }finally{fs.writeFileSync(soloFile(),original);h.service.engine.close();}
  await get('unassigned','solo_items').expect(200);
 });
 test('SOLO state refuses a symlink outside Admin state without writing to the target',async()=>{
  const folder=path.join(h.home,'reviews/solo-thesis'),backup=folder+'-backup',outside=path.join(h.home,'outside-solo');
  h.service.engine.close();fs.mkdirSync(outside);fs.renameSync(folder,backup);fs.symlinkSync(outside,folder);
  try{await get('unassigned','solo_items').expect(409);expect(fs.readdirSync(outside)).toEqual([]);}
  finally{h.service.engine.close();fs.unlinkSync(folder);fs.renameSync(backup,folder);}
  await get('unassigned','solo_items').expect(200);
 });
});
