// Runs the current resolver against a GET-only catalog snapshot, never the project database.
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const parser=require(path.join(root,'server/node_modules/@babel/parser'));
const gen=require(path.join(root,'server/node_modules/@babel/generator')).default;
const source=fs.readFileSync(path.join(root,'server/src/modules/orders/diagnosis/diagnosis-resolver.js'),'utf8');
const ast=parser.parse(source,{sourceType:'module'});
const declarations=ast.program.body.filter(n=>n.type==='ExportNamedDeclaration').map(n=>gen(n.declaration).code).join('\n');
const resolve=vm.runInNewContext(declarations+'\nresolveDiagnosis',{BadRequestException:Error,randomUUID:()=> 'audit-fixture-request'});
const snapshot=JSON.parse(fs.readFileSync(path.join(__dirname,'catalog-snapshot.json')));
const rows=snapshot.rows, selected=rows.find(s=>s.serviceSlug==='sua-cong-tac-khong-hoat-dong');
assert(selected);
const services=rows.filter(s=>s.categoryId===selected.categoryId).map(s=>({id:s.serviceId,slug:s.serviceSlug,name:s.serviceName,basePrice:s.basePrice,unit:s.unit,categoryId:s.categoryId,targetId:s.targetId}));
const category={id:selected.categoryId,slug:selected.categorySlug,name:selected.categoryName};
const prisma={serviceCategory:{findMany:async()=>[category]},service:{findMany:async()=>services}};
let calls=0;
const ai={confidenceThreshold:.6,diagnoseIncident:async()=>{calls++;return {engine:'model',confidence:.8,suggestedCategoryId:selected.categorySlug,suggestedTargetId:'fixture-ignored-target',suggestedServiceId:'fixture-ignored-service'};}};
(async()=>{
 const first=await resolve(prisma,ai,{imageUrl:'fixture-not-downloaded'});
 assert.equal(first.status,'needs_more_info');assert.equal(first.suggestedServiceId,null);
 const second=await resolve(prisma,ai,{imageUrl:'fixture-not-downloaded',answers:{categoryId:selected.categoryId,symptom:'switch_power'}});
 assert.equal(second.suggestedServiceId,selected.serviceId);assert.equal(second.source,'rules');assert.equal(calls,1);
 console.log(JSON.stringify({verification:'VERIFIED_RESOLVER_EXECUTION_WITH_REAL_CATALOG_SNAPSHOT',inference:'STUBBED_NOT_A_REAL_IMAGE_PREDICTION',databaseWrites:0,firstResponse:{status:first.status,serviceId:first.suggestedServiceId,availableServices:first.availableServices.length,hasTargetId:Object.hasOwn(first,'suggestedTargetId')},customerConfirmedSymptom:'switch_power',secondResponse:{status:second.status,source:second.source,categoryId:second.suggestedCategoryId,serviceId:second.suggestedServiceId,serviceName:second.suggestedServiceName,price:second.estimatedPriceMin,unit:second.service.unit},resolvedTargetFromCatalog:{id:selected.targetId,name:selected.targetName},booking:'NOT_SUBMITTED_STATIC_CALL_CHAIN_ONLY'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
