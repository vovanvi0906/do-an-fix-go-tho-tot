jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const request=require('supertest'),fs=require('fs'),path=require('path');
describe('Read-only paginated AI01 label browser',()=>{
 let h,api,token,options;
 const read=(op,query={})=>api.get('/api/admin/ai01/data/'+op).set('Authorization','Bearer '+token).query(query);
 const save=(imageId,expectedHash=null)=>api.post('/api/admin/ai01/actions/fast_save').set('Authorization','Bearer '+token).send({payload:{imageId,expectedHash,decision:'uncertain',targetIds:[],reason:'Isolated browser queue test',reviewAction:'uncertain',imageFlags:[],visualCondition:'not_reviewed',visibleSigns:null}});
 beforeAll(async()=>{h=await createHarness();api=request(h.app.getHttpServer());token=(await api.post('/api/auth/login').send({email:'unassigned@ai01.invalid',password:h.password})).body.accessToken;options=(await read('fast_label_options').expect(200)).body.data;});
 afterAll(async()=>{await h.close();});
 test('uses database taxonomy, bounded pages, counts, stable ordering; reads never annotate',async()=>{
  expect(options.catalog.categories).toHaveLength(6);expect(options.total).toBe(21437);
  const a=(await read('fast_label_items',{page:1,pageSize:12}).expect(200)).body.data,b=(await read('fast_label_items',{page:2,pageSize:12}).expect(200)).body.data;
  expect(a.items).toHaveLength(12);expect(a.total).toBe(21437);expect(b.items).toHaveLength(12);expect(new Set([...a.items,...b.items].map(r=>r.id)).size).toBe(24);
  expect(fs.existsSync(path.join(h.home,'reviews/fast-label-development/events.jsonl'))).toBe(false);
  expect(options.filters.quality.map(o=>o.id)).not.toContain('clear');expect(options.filters.imageType.map(o=>o.id)).not.toContain('real');
 });
 test('validates all query parameters and authenticates new read operations',async()=>{
  for(const query of [{page:0},{pageSize:51},{page:1.5},{sort:'sha'},{unexpected:'yes'},{category:['a','b']},{queueId:'fake'},{imageId:'../../a'}])await read('fast_label_items',query).expect(400);
  await read('fast_label_items',{status:'invented'}).expect(409);
  await api.get('/api/admin/ai01/data/fast_label_items').expect(401);
  const reviewer=(await api.post('/api/auth/login').send({email:'reviewer_a@ai01.invalid',password:h.password})).body.accessToken;
  await api.get('/api/admin/ai01/data/fast_label_options').set('Authorization','Bearer '+reviewer).expect(403);
 });
 test('combines real category, target, status, suspect bbox and P0; paginates filtered results',async()=>{
  const category=options.catalog.categories.find(c=>c.name==='Sửa nước').id,target=options.catalog.targets.find(t=>t.categoryId===category&&/vòi/i.test(t.name)).id;
  const query={category,target,status:'pending',bbox:'suspect',priority:'0',sort:'priority',pageSize:3};
  const r=(await read('fast_label_items',query).expect(200)).body.data;expect(r.total).toBeGreaterThan(0);expect(r.items.length).toBeLessThanOrEqual(3);
  for(const row of r.items){expect(row.categoryIds).toContain(category);expect(row.targetIds).toContain(target);expect(row.status).toBe('pending');expect(row.bbox).toContain('suspect');expect(row.priority).toBe(0);}
  const n=(await read('fast_label_items',{...query,page:2}).expect(200)).body.data;if(n.page===2)expect(n.items.some(row=>r.items.some(a=>a.id===row.id))).toBe(false);
 });
 test('source, sign proposals, duplicate flags, queues and quick filters operate on recorded evidence',async()=>{
  for(const field of ['dataset','sourceLabel','sign','labelType','quality','bbox','imageType','duplicate','queue','priority','usage','quick']){
   const choice=options.filters[field][0];if(!choice)continue;
   const r=(await read('fast_label_items',{[field]:choice.id,pageSize:2}).expect(200)).body.data;expect(r.total).toBeGreaterThan(0);
   const column={sourceLabel:'sourceKeys',sign:'signIds'}[field]||field;
   for(const row of r.items)expect(field==='dataset'||field==='priority'?String(row[column])===choice.id:row[column].includes(choice.id)).toBe(true);
  }
 });
 test('save-and-next follows original filtered order across page boundaries when rows disappear',async()=>{
  const query={status:'pending',sort:'status',pageSize:2};const initial=(await read('fast_label_items',query).expect(200)).body.data;
  let queue=(await read('fast_label_queue',{...query,imageId:initial.items[0].id}).expect(200)).body.data;
  await save(queue.imageId).expect(201);
  queue=(await read('fast_label_queue',{queueId:queue.queueId,imageId:queue.imageId,move:'next'}).expect(200)).body.data;expect(queue.imageId).toBe(initial.items[1].id);
  const remaining=(await read('fast_label_items',{...query,pageSize:4}).expect(200)).body.data;
  await save(queue.imageId).expect(201);queue=(await read('fast_label_queue',{queueId:queue.queueId,imageId:queue.imageId,move:'next'}).expect(200)).body.data;
  expect(queue.imageId).toBe(remaining.items[1].id);expect(queue.position).toBe(3);
  const page=(await read('fast_label_items',query).expect(200)).body.data;expect(page.items[0].id).toBe(queue.imageId);expect(page.total).toBe(initial.total-2);
 });
 test('descending priority sessions skip externally edited rows, bind owner and handle final image',async()=>{
  const query={q:'img-1935',status:'pending',sort:'priority',direction:'desc',pageSize:50};const items=(await read('fast_label_items',query).expect(200)).body.data.items;expect(items.length).toBeGreaterThan(2);
  const queue=(await read('fast_label_queue',{...query,imageId:items[0].id}).expect(200)).body.data;await save(items[1].id).expect(201);
  const next=(await read('fast_label_queue',{queueId:queue.queueId,imageId:items[0].id}).expect(200)).body.data;expect(next.imageId).toBe(items[2].id);
  const end=(await read('fast_label_queue',{queueId:queue.queueId,imageId:items.at(-1).id}).expect(200)).body.data;expect(end.imageId).toBeNull();
  const other=(await api.post('/api/auth/login').send({email:'manager@ai01.invalid',password:h.password})).body.accessToken;
  await api.get('/api/admin/ai01/data/fast_label_queue').set('Authorization','Bearer '+other).query({queueId:queue.queueId,imageId:items[0].id}).expect(409);
 });
 test('status sorting preserves session order even when saved images move later in the unfiltered table',async()=>{
  const query={q:'img-1950',sort:'status',pageSize:50};const original=(await read('fast_label_items',query).expect(200)).body.data.items;
  let queue=(await read('fast_label_queue',{...query,imageId:original[0].id}).expect(200)).body.data;
  await save(original[0].id).expect(201);
  queue=(await read('fast_label_queue',{queueId:queue.queueId,imageId:original[0].id}).expect(200)).body.data;expect(queue.imageId).toBe(original[1].id);
  const end=(await read('fast_label_queue',{queueId:queue.queueId,imageId:original.at(-1).id}).expect(200)).body.data;expect(end.imageId).toBeNull();
 });
 test('current saved taxonomy and corrected status override source suggestion without promoting Ground Truth',async()=>{
  const item=(await read('fast_label_items',{pageSize:1,q:'img-10000'}).expect(200)).body.data.items[0],target=options.catalog.targets.find(t=>!item.targetIds.includes(t.id));
  const r=await api.post('/api/admin/ai01/actions/fast_save').set('Authorization','Bearer '+token).send({payload:{imageId:item.id,expectedHash:null,decision:'confirmed',targetIds:[target.id],reason:'Temporary correction fixture',reviewAction:'correct',imageFlags:[],visualCondition:'no_visible_fault',visibleSigns:[]}}).expect(201);
  expect(r.body.data.approvedGroundTruth).toBe(false);
  const page=(await read('fast_label_items',{target:target.id,status:'corrected',q:item.id}).expect(200)).body.data;expect(page.total).toBe(1);expect(page.items[0].labelOrigin).toBe('admin');expect(page.items[0].targetIds).toEqual([target.id]);expect(page.items[0].usage).toContain('quarantine');
 });
});
