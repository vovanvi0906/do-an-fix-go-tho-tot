jest.mock('../src/config/firebase.config',()=>({getFirebaseAuth:jest.fn(),getFirebaseAdmin:jest.fn()}));
const {createHarness}=require('./ai01-admin-harness.cjs');
const {SwaggerModule,DocumentBuilder}=require('@nestjs/swagger');
describe('AI01 Swagger bootstrap',()=>{
 let h;
 beforeAll(async()=>{h=await createHarness();});
 afterAll(async()=>{await h?.close();});
 test('generates the controller document with explicit JavaScript DTO types',()=>{
  const doc=SwaggerModule.createDocument(h.app,new DocumentBuilder().setTitle('Isolated AI01 test').addBearerAuth().build());
  const schema=doc.components.schemas.DatasetOptionsDto;
  expect(schema.properties.categoryId).toMatchObject({type:'string',format:'uuid'});
  expect(schema.properties.developmentOnly.type).toBe('boolean');
  expect(schema.properties.classMapping).toMatchObject({type:'object',additionalProperties:{type:'object'}});
  expect(schema.properties.sourceType.enum).toContain('synthetic_ai');
  expect(doc.paths['/api/admin/ai01/dataset/batches/{batchId}/validate'].post.requestBody).toBeTruthy();
 });
});
