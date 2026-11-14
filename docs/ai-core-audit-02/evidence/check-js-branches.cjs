// Offline audit of extracted method bodies. Never imports application modules or calls live APIs.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const parser = require(path.join(root, 'server/node_modules/@babel/parser'));
const generate = require(path.join(root, 'server/node_modules/@babel/generator')).default;
class AuditError extends Error {}
function method(file, cls, name, globals = {}) {
  const ast = parser.parse(fs.readFileSync(path.join(root,file),'utf8'), {sourceType:'module',plugins:['decorators-legacy','classProperties']});
  const node = ast.program.body.map(n=>n.declaration||n).find(n=>n.type==='ClassDeclaration' && n.id.name===cls);
  const member = node.body.body.find(n=>n.key.name===name);
  const code = generate(member, { comments: false }).code;
  return vm.runInNewContext(`({${code}}).${name}`, {BadRequestException:AuditError,NotFoundException:AuditError,ForbiddenException:AuditError,ConflictException:AuditError,Number,Date,console:{warn(){},log(){}},...globals});
}
(async()=>{
 const rows=[];
 const daily=method('server/src/modules/workers/workers.service.js','WorkersService','verifyFaceDaily');
 for(const engine of ['heuristic','model']) {
  const writes=[];
  const ctx={prisma:{workerProfile:{findUnique:async()=>({id:'fixture-worker',faceProfile:{facePhotoUrl:'fixture-reference'}}),update:async x=>{writes.push(x);return x;}}},fastApiAiClient:{confidenceThreshold:.6,verifyFace:async()=>({verified:true,confidence:.95,engine})}};
  await daily.call(ctx,'fixture-user','fixture-photo');assert.equal(writes.length,1);
  rows.push({case:`daily_accepts_${engine}_without_method_proof`,writes:1});
 }
 const client=method('server/src/infrastructure/external/ai/fastapi-ai.client.js','FastApiAiClient','verifyFace',{
   fetch:async()=>{throw new Error('fixture network failure');},
   getFallbackFaceVerify:()=>({verified:true,confidence:.95})
 });
 const down=await client.call({baseUrl:'fixture-not-network'},'fixture-worker','fixture-photo','fixture-reference',{allowFallback:false});
 const fallback=await client.call({baseUrl:'fixture-not-network'},'fixture-worker','fixture-photo','fixture-reference');
 assert.equal(down.verified,false);assert.equal(fallback.verified,true);
 rows.push({case:'transport_failure_daily_false_order_fallback_true',daily:down.verified,order:fallback.verified,fetch:'stubbed_exception'});
 const perOrder=method('server/src/modules/orders/orders.service.js','OrdersService','verifyFace');
 for(const result of [{verified:true,confidence:.95,engine:'heuristic'},{verified:false,confidence:.2,engine:'model'},{verified:true,confidence:'not-a-number',engine:'model'}]) {
  const writes=[];
  const ctx={orderWorkflowService:{access:async()=>({order:{status:'ARRIVED'}})},prisma:{workerProfile:{findUnique:async()=>({id:'fixture-worker'}),update:async x=>{writes.push(x.data);return x.data;}}},fastApiAiClient:{confidenceThreshold:.6,verifyFace:async()=>result}};
  const response=await perOrder.call(ctx,'fixture-order','fixture-user',{photoUrl:'fixture-photo'});
  const granted=writes.some(x=>x.faceVerifiedAt);
  assert.equal(granted,result.verified);
  rows.push({case:`order_${result.engine}_${String(result.confidence)}`,granted,needsManualReview:response.needsManualReview,writtenFields:Object.keys(writes[0])});
 }
 const verify=method('server/src/modules/ai/ai.service.js','AiService','verifyFace');
 let args;
 await verify.call({fastApiAiClient:{verifyFace:async(...x)=>{args=x;return {verified:true};}},prisma:{}},'fixture-user','fixture-photo','fixture-reference');
 assert.deepEqual(args,['fixture-photo','fixture-reference']);
 rows.push({case:'generic_ai_signature_mismatch',forwardedArgumentCount:args.length,expectedArgumentCount:3});
 const compare=method('server/src/modules/orders/orders.service.js','OrdersService','verifyCompletion');
 let saved;
 const out=await compare.call({orderWorkflowService:{access:async()=>({order:{status:'AWAITING_ACCEPTANCE'}})},prisma:{orderImage:{findMany:async()=>[{id:'before',type:'BEFORE',url:'fixture-before'},{id:'after',type:'AFTER',url:'fixture-after'}],update:async x=>{saved=x.data;}}},fastApiAiClient:{compareBeforeAfter:async()=>({passed:true,matchScore:.92,engine:'heuristic'})}},'fixture-order','fixture-user');
 assert.equal(out.passed,true);assert.equal(saved.aiMatchScore,.92);
 rows.push({case:'completion_persists_heuristic_score',passed:out.passed,orderTransitionObserved:false});
 console.log(JSON.stringify({assertions:'PASS_CURRENT_BEHAVIOR_NOT_SECURITY_PASS',network:'none',database:'in_memory_stubs_only',checks:rows.length,results:rows},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
