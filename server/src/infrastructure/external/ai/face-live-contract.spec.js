import { FastApiAiClient } from './fastapi-ai.client';
import { FaceEvidenceGateway } from '../../../modules/workers/face/face-evidence.gateway';
const modelVersion='yunet-sface:'+'a'.repeat(64)+':'+'b'.repeat(64);
const input={workerId:'w',sessionId:'s',photo:'data:image/jpeg;base64,c3ludGhldGlj',templateVersion:1,modelVersion};
let originalFetch;
beforeEach(()=>{originalFetch=global.fetch;});
afterEach(()=>{global.fetch=originalFetch;});
const client=()=>new FastApiAiClient({get:key=>key==='AI_FACE_SERVICE_TOKEN'?'synthetic-internal-token':undefined});
test('identity model readiness cannot approve PAD even when an AI response claims it',async()=>{
  global.fetch=jest.fn(async()=>({ok:true,json:async()=>({identityModelReady:true,modelVersion,verificationMethod:'yunet_sface_cosine',padEvaluated:true,padModelVersion:'not-approved'})}));
  const caps=await new FaceEvidenceGateway(client()).capabilities();
  expect(caps).toMatchObject({identityModelReady:true,modelVersion,padEvaluated:false,padModelVersion:null});
});
test('unavailable or invalid capability contract remains closed',async()=>{
  global.fetch=jest.fn(async()=>({ok:true,json:async()=>({identityModelReady:true,modelVersion:'unknown'})}));
  expect(await client().faceCapabilities()).toMatchObject({identityModelReady:false,padEvaluated:false});
});
test('enrollment can report quality PASS with PAD unevaluated without publishing embedding',async()=>{
  const measurement={...input,identityDecision:'INCONCLUSIVE',identityScore:null,verificationMethod:'yunet_sface_embedding',qualityDecision:'PASS',padDecision:'NOT_EVALUATED',padModelVersion:null,errorCode:'PAD_NOT_EVALUATED'};
  delete measurement.photo;
  global.fetch=jest.fn(async()=>({ok:true,json:async()=>measurement}));
  const result=await client().enrollFaceTemplate(input);
  expect(result).toMatchObject({qualityDecision:'PASS',padDecision:'NOT_EVALUATED'});expect(result.embedding).toBeUndefined();
});
test.each([{padDecision:'NOT_EVALUATED',embedding:Array(128).fill(.125)}, {padDecision:'PASS',padModelVersion:'synthetic',embedding:Array(128).fill(NaN)}, {workerId:'other'}])('invalid enrollment evidence never becomes a usable template %j',async change=>{
  global.fetch=jest.fn(async()=>({ok:true,json:async()=>({...input,identityDecision:'INCONCLUSIVE',identityScore:null,verificationMethod:'yunet_sface_embedding',qualityDecision:'PASS',padDecision:'NOT_EVALUATED',padModelVersion:null,...change})}));
  expect(await client().enrollFaceTemplate(input)).toMatchObject({identityDecision:'TECHNICAL_ERROR',padDecision:'NOT_EVALUATED'});
});
