jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const request=require('supertest'),fs=require('fs'),path=require('path');
describe('Vietnamese inline labeling observations are human decisions, not GT',()=>{
 let h,api,token,item,target,event,prefix;
 const get=op=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+token);
 const post=(op,payload)=>api.post('/api/admin/ai01/actions/'+op).set('Authorization','Bearer '+token).send({payload});
 const file=()=>path.join(h.home,'reviews/fast-label-development/events.jsonl');
 const payload=()=>({imageId:item.id,decision:'confirmed',targetIds:[target],reason:'TEMP test only — human correction',expectedHash:event?.eventHash||null,reviewAction:'correct',imageFlags:['advertisement','composite'],visualCondition:'no_visible_fault',visibleSigns:[]});
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());token=(await api.post('/api/auth/login').send({email:'unassigned@ai01.invalid',password:h.password})).body.accessToken;item=(await get('fast_items').expect(200)).body.data.items[0];target=(await get('fast_detail').query({imageId:item.id}).expect(200)).body.data.candidates[0].targetId;});
 afterAll(async()=>{await h.close();});
 test('all 54 labels have Vietnamese presentation while original source codes remain',async()=>{
  const entries=(await get('fast_mappings').expect(200)).body.data.entries;expect(entries).toHaveLength(54);expect(entries.every(e=>typeof e.displayVi?.labelVi==='string'&&e.displayVi.labelVi.length>0)).toBe(true);
  const d=(await get('fast_detail').query({imageId:item.id}).expect(200)).body.data;expect(d.sourceLabels).toContain('CASSETTE TYPE');expect(d.sourceLabelsVi).toContain('Điều hòa âm trần cassette');expect(item.sourceLabelsVi).toEqual(d.sourceLabelsVi);expect(d.annotation).toBeNull();expect(d.sourceMappings[0].catalogTargetCandidates[0].categoryId).toBeTruthy();
 });
 test('legacy label event is retained byte for byte with no invented observation',async()=>{
  const p=payload();for(const k of ['reviewAction','imageFlags','visualCondition','visibleSigns'])delete p[k];event=(await post('fast_save',p).expect(201)).body.data;expect(event.visualCondition).toBeUndefined();prefix=fs.readFileSync(file());
 });
 test('rejects inconsistent observations, unknown markers and forged category',async()=>{
  await post('fast_save',{...payload(),reviewAction:'reject'}).expect(409);
  await post('fast_save',{...payload(),visibleSigns:['water_drip']}).expect(409);
  await post('fast_save',{...payload(),visualCondition:'abnormal_visible',visibleSigns:[]}).expect(409);
  await post('fast_save',{...payload(),visualCondition:'not_reviewed',visibleSigns:null}).expect(409);
  await post('fast_save',{...payload(),imageFlags:['not-a-kind']}).expect(409);
  await post('fast_save',{...payload(),imageFlags:['advertisement','advertisement']}).expect(409);
  await post('fast_save',{...payload(),categoryIds:['fake']}).expect(409);
  const partial=payload();delete partial.visibleSigns;await post('fast_save',partial).expect(409);
  expect(fs.readFileSync(file()).equals(prefix)).toBe(true);
 });
 test('stores explicit no-visible-fault, ad/composite flags and derives category without changing raw or history',async()=>{
  event=(await post('fast_save',payload()).expect(201)).body.data;expect(event).toMatchObject({reviewAction:'correct',imageFlags:['advertisement','composite'],visualCondition:'no_visible_fault',visibleSigns:[],approvedGroundTruth:false,sourceGeometryHumanVerified:false});
  const tax=(await get('fast_catalog').expect(200)).body.data;expect(event.categoryIds).toEqual([tax.targets.find(t=>t.id===target).categoryId]);expect(fs.readFileSync(file()).subarray(0,prefix.length).equals(prefix)).toBe(true);await post('fast_export',{}).expect(409);
 });
 test('new observations survive replay/export with human check and no independent GT',async()=>{
  await post('fast_check',{imageId:item.id,annotationEventHash:event.eventHash,rightsEvidence:'TEMP fixture only',sourceEvidence:'TEMP fixture only',groupEvidence:'TEMP fixture only',reason:'TEMP fixture only'}).expect(201);
  const out=(await post('fast_export',{}).expect(201)).body.data,r=await api.get('/api/admin/ai01/fast/exports/'+out.file).set('Authorization','Bearer '+token).expect(200),record=JSON.parse(r.text||r.body.toString());
  expect(record).toMatchObject({visibleSigns:[],visualCondition:'no_visible_fault',imageFlags:['advertisement','composite'],approvedGroundTruth:false,independentlyReviewed:false,datasetType:'solo-development'});
  const history=(await get('fast_detail').query({imageId:item.id}).expect(200)).body.data.history;h.service.engine.close();const next=(await get('fast_detail').query({imageId:item.id}).expect(200)).body.data;expect(next.history).toEqual(history);expect(next.annotation.eventHash).toBe(event.eventHash);expect(fs.readFileSync(file()).subarray(0,prefix.length).equals(prefix)).toBe(true);
 });
 test('positive visible signs are saved only when the human explicitly selects them',async()=>{
  event=(await post('fast_save',{...payload(),visualCondition:'abnormal_visible',visibleSigns:['water_drip','wet_surface'],imageFlags:[]}).expect(201)).body.data;
  const d=(await get('fast_detail').query({imageId:item.id}).expect(200)).body.data;expect(d.annotation.visibleSigns).toEqual(['water_drip','wet_surface']);expect(d.annotation.imageFlags).toEqual([]);expect(d.blockers.length).toBeGreaterThan(0);await post('fast_export',{}).expect(409);
 });
 test('uncertain and rejected remain separate from confirmed even with observations',async()=>{
  event=(await post('fast_save',{...payload(),decision:'uncertain',reviewAction:'uncertain',visualCondition:'uncertain',visibleSigns:null}).expect(201)).body.data;expect(event.visibleSigns).toBeNull();await post('fast_export',{}).expect(409);
  event=(await post('fast_save',{...payload(),decision:'rejected',reviewAction:'reject',visualCondition:'not_reviewed',visibleSigns:null}).expect(201)).body.data;await post('fast_export',{}).expect(409);
 });
});
