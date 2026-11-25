jest.mock('../src/config/firebase.config', () => ({ getFirebaseAuth: jest.fn(), getFirebaseAdmin: jest.fn() }));
const { createHarness } = require('./ai01-admin-harness.cjs');
const request = require('supertest');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
describe('AI-ADMIN-01 JWT + real Review Engine (isolated in-memory principals, no DB writes)',()=>{
 let h,api,tokens={},before,history;
 const post=(role,op,payload)=>api.post('/api/admin/ai01/actions/'+op).set('Authorization','Bearer '+tokens[role]).send({payload});
 const get=(role,op,query={})=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+tokens[role]).query(query);
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());history=path.join(process.env.AI01_PILOT_DIR,'reviews/events.jsonl');before=sha(history);for(const user of h.users.filter(u=>u.status==='ACTIVE')){const r=await api.post('/api/auth/login').send({email:user.email,password:h.password}).expect(201);tokens[user.email.split('@')[0]]=r.body.accessToken;}},30000);
 afterAll(async()=>{expect(sha(history)).toBe(before);await h.close();});
 test('Swagger document builds with explicit JavaScript DTO property types',()=>{const {SwaggerModule,DocumentBuilder}=require('@nestjs/swagger');const document=SwaggerModule.createDocument(h.app,new DocumentBuilder().setTitle('TEST ONLY').build());expect(document.paths['/api/admin/ai01/permissions/grant']).toBeTruthy();});
 test('existing AuthController login rejects wrong password and blocked account',async()=>{await api.post('/api/auth/login').send({email:'coordinator@ai01.invalid',password:'wrong'}).expect(401);await api.post('/api/auth/login').send({email:'blocked@ai01.invalid',password:h.password}).expect(403);});
 test('JWT and active DB role required; forged role claim, refresh and mock token fail',async()=>{
  await api.get('/api/admin/ai01/access').expect(401);await api.get('/api/admin/ai01/access').set('Authorization','Bearer mock-token').expect(401);
  const customer=h.users.find(u=>u.role==='CUSTOMER');const forged=h.jwt.sign({sub:customer.id,role:'ADMIN'});const forgedAccess=await api.get('/api/admin/ai01/access').set('Authorization','Bearer '+forged).expect(200);expect(forgedAccess.body.data.canManagePermissions).toBe(false);await api.get('/api/admin/ai01/permissions').set('Authorization','Bearer '+forged).expect(403);
  await api.get('/api/admin/ai01/access').set('Authorization','Bearer '+h.jwt.sign({sub:h.users[0].id,type:'refresh'})).expect(401);
 });
 test('AI module refuses fallback/short JWT secret without changing login',async()=>{const original=process.env.JWT_SECRET;try{process.env.JWT_SECRET='super-secret';await api.get('/api/admin/ai01/access').set('Authorization','Bearer '+tokens.coordinator).expect(503);}finally{process.env.JWT_SECRET=original;}});
 test('active Admin manages automatically, never auto-reviewer; Viewer cannot mutate',async()=>{const r=await api.get('/api/admin/ai01/access').set('Authorization','Bearer '+tokens.unassigned).expect(200);expect(r.body.data).toMatchObject({assigned:true,role:'coordinator',canManagePermissions:true});await get('unassigned','items').expect(200);await post('unassigned','annotate',{}).expect(403);await post('viewer','mapping',{}).expect(403);});
 test('coordinator reads all 54 mappings and makes individual decision using real principal',async()=>{const r=await get('coordinator','mappings').expect(200);expect(r.body.data.entries).toHaveLength(54);await post('coordinator','mapping',{mappingKey:'suadien/v1/0',decision:'uncertain',reason:'ISOLATED TEST ONLY'}).expect(201);});
 test('reviewer responses omit AI proposals, filesystem paths and other labels',async()=>{const r=await get('reviewer_a','items').expect(200);expect(r.body.data.items).toHaveLength(150);const text=JSON.stringify(r.body);for(const k of ['aiPrediction','catalogTargetCandidates','samplingBucketProposed','/home/','annotationPath','originalImage'])expect(text).not.toContain(k);for(const op of ['mappings','adjudication','provenance','history','readiness'])await get('reviewer_a',op,{imageId:r.body.data.items[0].id}).expect(403);});
 test('principal spoofing fails at wrapper and nested payload; coordinator cannot impersonate A',async()=>{await api.post('/api/admin/ai01/actions/mapping').set('Authorization','Bearer '+tokens.coordinator).send({reviewerId:h.users[1].id,payload:{}}).expect(400);await post('coordinator','mapping',{reviewerId:h.users[1].id}).expect(400);await post('reviewer_a','annotate',{labels:{role:'coordinator'}}).expect(400);await post('coordinator','annotate',{}).expect(403);});
 test('A/B isolated, third person adjudicates, export blocked without gates',async()=>{
  const r=await get('reviewer_a','items').expect(200),i=r.body.data.items[0].id;
  const payload={imageId:i,labels:{category:null,target:null,visibleFault:null,symptom:null,recommendedService:null,unknown:null,needsInspection:null},visualCondition:'difficult',decision:'uncertain',reason:'ISOLATED TEST ONLY',independentAttestation:true};
  const a=await post('reviewer_a','annotate',payload).expect(201);expect(a.body.data.reviewerId).toBe(h.users[1].id);
  let j=await get('adjudicator','adjudication',{imageId:i}).expect(200);expect(j.body.data.annotations).toHaveLength(0);
  const bItems=await get('reviewer_b','items').expect(200);expect(bItems.body.data.items[0].ownAnnotation).toBeNull();await post('reviewer_b','annotate',{...payload,decision:'needsExpertReview'}).expect(201);
  j=await get('adjudicator','adjudication',{imageId:i}).expect(200);expect(j.body.data.annotations.map(e=>e.reviewerId)).toEqual([h.users[1].id,h.users[2].id]);
  await post('reviewer_a','adjudicate',{}).expect(403);
  await post('adjudicator','adjudicate',{...payload,decision:'needsExpertReview',annotationEventHashes:j.body.data.annotations.map(e=>e.eventHash)}).expect(201);
  await post('coordinator','export',{imageIds:[i]}).expect(409);await post('reviewer_a','export',{imageIds:[i]}).expect(403);
  const events=await get('coordinator','history').expect(200);expect(events.body.data.events.some(e=>e.kind==='annotation'&&e.data.authenticatedPrincipal?.userId===h.users[1].id)).toBe(true);
 });
 test('approved subset uses TASK01 contract and authenticated UUIDs only (temporary test state)',async()=>{
  const items=(await get('reviewer_a','items').expect(200)).body.data.items,item=items.find(r=>r.dataset==='suadien'),id=item.id;
  const tax=(await get('coordinator','catalog').expect(200)).body.data,t=tax.targets.find(r=>r.slug==='o-cam-dien');
  await post('coordinator','mapping',{mappingKey:'suadien/v1/0',decision:'accepted',reason:'TEMPORARY CONTRACT TEST ONLY'}).expect(201);
  const labels={category:t.categoryId,target:t.id,visibleFault:[],symptom:null,recommendedService:[],unknown:false,needsInspection:true};
  const annotation={imageId:id,labels,decision:'submitted',visualCondition:'no_abnormality_visible',reason:'TEMPORARY CONTRACT TEST ONLY',independentAttestation:true};
  await post('reviewer_a','annotate',annotation).expect(201);await post('reviewer_b','annotate',annotation).expect(201);
  const pair=(await get('adjudicator','adjudication',{imageId:id}).expect(200)).body.data.annotations;
  await post('adjudicator','adjudicate',{imageId:id,labels,decision:'approved',visualCondition:'no_abnormality_visible',reason:'TEMPORARY CONTRACT TEST ONLY',annotationEventHashes:pair.map(e=>e.eventHash)}).expect(201);
  await post('coordinator','export',{imageIds:[id]}).expect(409);
  const prov={imageId:id,rightsVerified:true,licenseOrConsent:'UNIT TEST ONLY',rightsEvidence:'SIMULATED TEST EVIDENCE',sourceVerified:true,sourceEvidence:'SIMULATED TEST SOURCE',origin:'licensed_external',deviceId:null,sessionId:null,siteId:null,duplicateGroup:'UNIT-TEST-GROUP',groupReviewComplete:true,groupEvidence:'SIMULATED TEST GROUP',identitiesProvidedBySource:false,identityEvidence:'',partition:'validation'};
  await post('coordinator','save_provenance',prov).expect(201);await post('coordinator','export',{imageIds:[id]}).expect(409);
  await post('coordinator','save_provenance',{...prov,deviceId:'UNIT-TEST-DEVICE',sessionId:'UNIT-TEST-SESSION',identitiesProvidedBySource:true,identityEvidence:'SIMULATED TEST SOURCE IDENTITIES'}).expect(201);
  const artifact=(await post('coordinator','export',{imageIds:[id]}).expect(201)).body.data;
  const result=await api.get('/api/admin/ai01/exports/'+artifact.file).set('Authorization','Bearer '+tokens.coordinator).expect(200);
  const record=JSON.parse(result.text||result.body.toString());expect(record.review.annotatorIds).toEqual([h.users[1].id,h.users[2].id]);expect(record.review.adjudicatorId).toBe(h.users[3].id);expect(record.split).toBe('validation');expect(JSON.stringify(record)).not.toContain('/home/');
  await api.get('/api/admin/ai01/exports/'+artifact.file).set('Authorization','Bearer '+tokens.viewer).expect(403);
 });
 test('image hash matches original and traversal cannot be used',async()=>{const r=await get('viewer','items').expect(200),item=r.body.data.items[0];const image=await api.get('/api/admin/ai01/images/'+item.id).set('Authorization','Bearer '+tokens.viewer).expect(200);expect(crypto.createHash('sha256').update(image.body).digest('hex')).toBe(item.sha256);await api.get('/api/admin/ai01/images/not-an-id').set('Authorization','Bearer '+tokens.viewer).expect(400);});
 test('changing assignment cannot reuse same user as another reviewer',async()=>{const p=JSON.parse(fs.readFileSync(h.policyFile));p.users.find(u=>u.userId===h.users[1].id).role='adjudicator';fs.writeFileSync(h.policyFile,JSON.stringify(p));await get('reviewer_a','adjudication',{imageId:'img-19228'}).expect(409);p.users.find(u=>u.userId===h.users[1].id).role='reviewer_a';fs.writeFileSync(h.policyFile,JSON.stringify(p));});
 test('Admin automatically manages assignments with audit and no self grant',async()=>{
  const root='/api/admin/ai01/permissions';const manage=()=>api.get(root).set('Authorization','Bearer '+tokens.manager);
  await api.get(root).set('Authorization','Bearer '+tokens.coordinator).expect(200);
  await api.post(root+'/grant').set('Authorization','Bearer '+tokens.unassigned).send({}).expect(400);await api.get(root).set('Authorization','Bearer '+tokens.reviewer_a).expect(403);
  let state=(await manage().expect(200)).body.data;expect(JSON.stringify(state)).not.toContain('passwordHash');
  const actor=h.users.find(u=>u.email==='manager@ai01.invalid'),target=h.users.find(u=>u.email==='customer@ai01.invalid');
  const payload={targetUserId:target.id,role:'viewer',expert:false,reason:'ISOLATED PERMISSION TEST ONLY',expectedRevision:state.revision};
  await api.post(root+'/grant').set('Authorization','Bearer '+tokens.manager).send({...payload,targetUserId:actor.id}).expect(403);
  await api.post(root+'/grant').set('Authorization','Bearer '+tokens.manager).send({...payload,permissionManagers:[actor.id]}).expect(400);
  await api.post(root+'/grant').set('Authorization','Bearer '+tokens.manager).send({...payload,role:'reviewer_a'}).expect(409);await api.post(root+'/grant').set('Authorization','Bearer '+tokens.manager).send({...payload,targetUserId:h.users[0].id,role:'reviewer_b'}).expect(400);
  await api.post(root+'/grant').set('Authorization','Bearer '+tokens.manager).send(payload).expect(201);
  await get('customer','overview').expect(200);
  await api.post(root+'/revoke').set('Authorization','Bearer '+tokens.manager).send({targetUserId:target.id,reason:payload.reason,expectedRevision:payload.expectedRevision}).expect(409);
  state=(await manage().expect(200)).body.data;
  await api.post(root+'/revoke').set('Authorization','Bearer '+tokens.manager).send({targetUserId:target.id,reason:payload.reason,expectedRevision:state.revision}).expect(201);
  await get('customer','overview').expect(403);
  const audit=fs.readFileSync(path.join(h.home,'reviews/permission-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);expect(audit).toHaveLength(2);expect(audit.every(e=>e.actorUserId===actor.id)).toBe(true);expect(audit[1].previousHash).toBe(audit[0].eventHash);
 });
 test('permission audit corruption blocks changes without rewriting policy',async()=>{
  const file=path.join(h.home,'reviews/permission-events.jsonl'),original=fs.readFileSync(file),policy=fs.readFileSync(h.policyFile);
  try {
   const rows=original.toString().trim().split('\n').map(JSON.parse);rows[0].reason='TAMPERED FIXTURE';fs.writeFileSync(file,rows.map(JSON.stringify).join('\n')+'\n');
   const state=(await api.get('/api/admin/ai01/permissions').set('Authorization','Bearer '+tokens.manager).expect(200)).body.data;
   await api.post('/api/admin/ai01/permissions/grant').set('Authorization','Bearer '+tokens.manager).send({targetUserId:h.users.find(u=>u.email==='customer@ai01.invalid').id,role:'viewer',expert:false,reason:'TEST ONLY corruption guard',expectedRevision:state.revision}).expect(503);
   expect(fs.readFileSync(h.policyFile).equals(policy)).toBe(true);
  } finally {fs.writeFileSync(file,original);}
 });
 test('empty policy needs no bootstrap; JWT uses live database status and role',async()=>{
  const original=fs.readFileSync(h.policyFile);const admin=h.users.find(u=>u.email==='unassigned@ai01.invalid');
  try {
   fs.writeFileSync(h.policyFile,JSON.stringify({version:1,users:[]}));
   const access=await api.get('/api/admin/ai01/access').set('Authorization','Bearer '+tokens.unassigned).expect(200);
   expect(access.body.data).toMatchObject({assigned:true,canManagePermissions:true,role:'coordinator',expert:false});
   await api.get('/api/admin/ai01/permissions').set('Authorization','Bearer '+tokens.unassigned).expect(200);
   await post('unassigned','annotate',{}).expect(403);
   admin.status='BLOCKED';await get('unassigned','overview').expect(401);
   admin.status='ACTIVE';admin.role='CUSTOMER';await get('unassigned','overview').expect(403);
   await api.get('/api/admin/ai01/permissions').set('Authorization','Bearer '+tokens.unassigned).expect(403);
  } finally {admin.status='ACTIVE';admin.role='ADMIN';fs.writeFileSync(h.policyFile,original);}
 });
 test('promoting a bound reviewer never exposes coordinator labels',async()=>{
  const reviewer=h.users[1];try{reviewer.role='ADMIN';await get('reviewer_a','mappings').expect(503);}finally{reviewer.role='WORKER';}
 });
 test('engine restart replays audit log, no lost labels and no legacy data rewritten',async()=>{const beforeRead=await get('coordinator','history').expect(200);h.service.engine.close();const afterRead=await get('coordinator','history').expect(200);expect(afterRead.body.data.events.map(e=>e.eventHash)).toEqual(beforeRead.body.data.events.map(e=>e.eventHash));expect(sha(history)).toBe(before);},30000);
});
