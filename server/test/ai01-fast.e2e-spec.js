jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const request=require('supertest'),fs=require('fs'),path=require('path'),crypto=require('crypto');
describe('Unified SOLO management and development export gates',()=>{
 let h,api,token,item,target,event,check,artifact,before,other;
 const read=op=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+token);
 const post=(op,payload)=>api.post('/api/admin/ai01/actions/'+op).set('Authorization','Bearer '+token).send({payload});
 const label=(decision='confirmed',expectedHash=event?.eventHash||null)=>({imageId:item.id,decision,targetIds:[target],reason:'TEMP fixture only — not a real annotation',expectedHash});
 const evidence=()=>({imageId:item.id,annotationEventHash:event.eventHash,rightsEvidence:'TEMP fixture rights, not real evidence',sourceEvidence:'TEMP fixture source',groupEvidence:'TEMP fixture duplicate review',reason:'TEMP fixture human recheck'});
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());token=(await api.post('/api/auth/login').send({email:'unassigned@ai01.invalid',password:h.password})).body.accessToken;other=(await api.post('/api/auth/login').send({email:'manager@ai01.invalid',password:h.password})).body.accessToken;await read('history');before=fs.readFileSync(path.join(h.home,'reviews/events.jsonl'),'utf8');});
 afterAll(async()=>{try{expect(fs.readFileSync(path.join(h.home,'reviews/events.jsonl'),'utf8')).toBe(before);}finally{await h.close();}});
 test('ADMIN only; all 21437 images and 54 mappings',async()=>{
  await api.get('/api/admin/ai01/data/fast_items').expect(401);const reviewer=(await api.post('/api/auth/login').send({email:'reviewer_a@ai01.invalid',password:h.password})).body.accessToken;
  for(const op of ['fast_items','fast_mappings','fast_readiness','fast_preparation','management_status'])await api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+reviewer).expect(403);
  const r=await read('fast_items').expect(200);expect(r.body.data.items).toHaveLength(21437);expect(r.body.data.mappingCount).toBe(54);item=r.body.data.items[0];expect((await read('fast_mappings').expect(200)).body.data.entries).toHaveLength(54);
 });
 test('prepared source report/queue are read-only and never create human annotations',async()=>{
  const r=(await read('fast_preparation').expect(200)).body.data;expect(r.available).toBe(true);expect(r.summary).toMatchObject({status:'prepared_not_trained',trained:false,deployed:false,approvedGroundTruth:false,humanApprovedMappings:0,catalogVerifiedReadOnly:true});expect(r.summary.counts).toMatchObject({scanned:21437,usableAnyTask:18901});
  const rows=(await read('fast_items').expect(200)).body.data.items,flagged=rows.find(i=>i.preparationReview);expect(flagged).toBeTruthy();const detail=(await read('fast_detail').query({imageId:flagged.id}).expect(200)).body.data;expect(detail.preparationReview.reasons.length).toBeGreaterThan(0);expect(detail.annotation).toBeNull();expect(fs.existsSync(path.join(h.home,'reviews/fast-label-development/events.jsonl'))).toBe(false);
 });
 test('real YAML/labels/image without automatic annotation',async()=>{const r=await read('fast_detail').query({imageId:item.id}).expect(200);expect(r.body.data.annotations.length).toBeGreaterThan(0);expect(r.body.data.annotation).toBeNull();expect(r.body.data.history).toEqual([]);expect(r.body.data.blockers.length).toBeGreaterThan(0);target=r.body.data.candidates[0].targetId;await api.get('/api/admin/ai01/fast/images/'+item.id).set('Authorization','Bearer '+token).expect(200);});
 test('SOLO does not depend on bootstrap, assignments, or valid legacy policy',async()=>{
  const original=fs.readFileSync(h.policyFile);try{
   for(const content of ['invalid legacy policy',JSON.stringify({version:1,users:[{userId:h.users.find(u=>u.email==='unassigned@ai01.invalid').id,role:'reviewer_a',expert:false}]})]){
    fs.writeFileSync(h.policyFile,content);expect((await api.get('/api/admin/ai01/access').set('Authorization','Bearer '+token).expect(200)).body.data.canUseSolo).toBe(true);await read('management_status').expect(200);await read('fast_items').expect(200);
   }
  }finally{fs.writeFileSync(h.policyFile,original);}
 });
 test('live database status/role beats old JWT and role claims',async()=>{
  const admin=h.users.find(u=>u.email==='unassigned@ai01.invalid');try{admin.status='BLOCKED';await read('management_status').expect(401);admin.status='ACTIVE';admin.role='CUSTOMER';await read('management_status').expect(403);}finally{admin.status='ACTIVE';admin.role='ADMIN';}
  const customer=h.users.find(u=>u.role==='CUSTOMER'),forged=h.jwt.sign({sub:customer.id,role:'ADMIN'});await api.get('/api/admin/ai01/data/management_status').set('Authorization','Bearer '+forged).expect(403);
 });
 test('unsupported operations are truthful and cannot trigger jobs',async()=>{
  const r=(await read('management_status').expect(200)).body.data;for(const name of ['training','evaluation','deployment'])expect(r[name]).toMatchObject({supported:false,status:'not_integrated'});expect(r.evaluation).toMatchObject({precision:null,recall:null,f1:null,officialRuns:[]});
  for(const op of ['training','train','evaluate','deploy','rollback'])await post(op,{}).expect(400);
 });
 test('validation and optimistic concurrency',async()=>{await post('fast_save',{...label(),userId:'fake'}).expect(400);await post('fast_save',{...label(),targetIds:[]}).expect(409);await post('fast_save',{...label(),targetIds:['bad']}).expect(409);event=(await post('fast_save',label()).expect(201)).body.data;await post('fast_save',label('confirmed',null)).expect(409);expect(event.userId).toBeTruthy();expect(event.timestamp).toBeTruthy();expect(event.approvedGroundTruth).toBe(false);});
 test('confirmed label stays quarantined until real explicit evidence recheck',async()=>{
  await post('fast_export',{}).expect(409);await post('fast_export',{imageIds:[item.id]}).expect(409);
  const r=(await read('fast_readiness').expect(200)).body.data;expect(r.eligibleCount).toBe(0);expect(r.quarantineCount).toBe(1);
  await post('fast_check',{...evidence(),rightsEvidence:''}).expect(409);await post('fast_check',{...evidence(),annotationEventHash:'stale'}).expect(409);
  await api.post('/api/admin/ai01/actions/fast_check').set('Authorization','Bearer '+other).send({payload:evidence()}).expect(409);
  check=(await post('fast_check',evidence()).expect(201)).body.data;expect(check.partition).toBe('development');expect(check.approvedGroundTruth).toBe(false);
 });
 test('audited immutable download is solo-development only; owner and hash enforced',async()=>{
  artifact=(await post('fast_export',{}).expect(201)).body.data;expect(artifact.images).toBe(1);expect(artifact.datasetType).toBe('solo-development');
  const route='/api/admin/ai01/fast/exports/'+artifact.file,r=await api.get(route).set('Authorization','Bearer '+token).expect(200),text=r.text||r.body.toString(),record=JSON.parse(text);
  expect(crypto.createHash('sha256').update(text).digest('hex')).toBe(artifact.sha256);expect(record).toMatchObject({approvedGroundTruth:false,independentlyReviewed:false,blindTest:false,split:'development',partition:'development',datasetType:'solo-development',sourceGeometryHumanVerified:false});expect(record.developmentCheck.eventHash).toBe(check.eventHash);
  await api.get(route).set('Authorization','Bearer '+other).expect(409);
  await api.get('/api/admin/ai01/exports/'+artifact.file).set('Authorization','Bearer '+token).expect(400);
 });
 test('edits invalidate checks; rejected/skipped/uncertain/out-of-scope never export',async()=>{
  event=(await post('fast_save',label()).expect(201)).body.data;await post('fast_export',{}).expect(409);await post('fast_check',{...evidence(),annotationEventHash:check.annotationEventHash}).expect(409);
  for(const decision of ['uncertain','rejected','skipped','out_of_scope']){event=(await post('fast_save',label(decision)).expect(201)).body.data;await post('fast_check',evidence()).expect(409);await post('fast_export',{}).expect(409);}
 });
 test('history/checks survive process restart; tampered download rejected',async()=>{
  const history=(await read('fast_detail').query({imageId:item.id}).expect(200)).body.data.history;expect(history.length).toBe(7);h.service.engine.close();expect((await read('fast_detail').query({imageId:item.id}).expect(200)).body.data.history).toEqual(history);
  fs.appendFileSync(path.join(h.home,'reviews/fast-label-development/exports',artifact.file),'TAMPERED');await api.get('/api/admin/ai01/fast/exports/'+artifact.file).set('Authorization','Bearer '+token).expect(409);
 });
 test('does not satisfy independent benchmark/export gate',async()=>{await post('export',{imageIds:[item.id]}).expect(409);});
 test('detects audit tampering before reads or exports',async()=>{fs.appendFileSync(path.join(h.home,'reviews/fast-label-development/events.jsonl'),'{}\n');await read('fast_readiness').expect(409);await post('fast_export',{}).expect(409);});
});
