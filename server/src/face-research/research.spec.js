import {validateMeasurement,PAD_VERSION} from './research.service';
const session={id:'s',purpose:'ENROLLMENT',order_id:null,worker_id:'w',model_version:'yunet-sface:test',pad_version:PAD_VERSION};
const sample=()=>({researchOnly:true,verified:false,enrolled:false,proof:null,sessionId:'s',workerId:'w',modelVersion:session.model_version,padModelVersion:PAD_VERSION,identityDecision:'MEASURED',identityScore:.7,padDecision:'NOT_EVALUATED',padRealScore:.8,padSpoofScore:.2,referencePadRealScore:.8,referencePadSpoofScore:.2,quality:{decision:'PASS',faceCount:1,brightness:100,sharpness:80},referenceQuality:{decision:'PASS'},cropVersion:'yunet-tight-bbox-floor-ceil-clamped-linear-128-v1',preprocessingVersion:'bgr-u8-128-to-rgb-nchw-normalized-v1',policyVersion:'research-no-decision-v1',latencyMs:{totalMs:20},errorCode:null});
test('research score never acquires authority or persists unexpected embedding',()=>{const r=validateMeasurement({...sample(),embedding:Array(128).fill(.125)},session);expect(r.verified).toBe(false);expect(r.enrolled).toBe(false);expect(r.proof).toBeNull();expect(r.embedding).toBeUndefined();});
test.each([{workerId:'other'},{sessionId:'other'},{modelVersion:'other'},{padModelVersion:'other'},{verified:true},{enrolled:true},{proof:{id:'fake'}},{padDecision:'PASS'},{identityScore:NaN},{identityScore:Infinity},{padRealScore:NaN},{padRealScore:.9},{identityDecision:'MATCH'},{preprocessingVersion:'RGB'},{latencyMs:{totalMs:-1}},{quality:{decision:'PASS',sharpness:NaN}}])('invalid evidence fails closed: %j',change=>{expect(()=>validateMeasurement({...sample(),...change},session)).toThrow('RESEARCH_EVIDENCE_REJECTED');});
describe('FaceID Lab diagnostics whitelist',()=>{
  const diag=()=>({...sample(),quality:{decision:'FAIL',faceCount:1,brightness:20,sharpness:10,reasons:['TOO_DARK','BLUR']},
    detection:{faceCount:1,imageWidth:640,imageHeight:480,score:.93,box:[10,20,120,130],landmarks:[[1,2]]},referenceDetection:null,
    alignment:{method:'sface_align_crop_5pt',performed:true},
    padPolicy:{decision:'NOT_EVALUATED',reason:'PAD_EVALUATION_NOT_APPROVED',evaluated:false,threshold:null,evaluationReference:null},
    identityPolicy:{threshold:.6,status:'PROVISIONAL_UNCALIBRATED',method:'yunet_sface_cosine'},
    qualityPolicy:{minFacePixels:80,minBrightness:40,maxBrightness:220,minSharpness:60,minDetectionScore:.6}});
  test('keeps debug geometry/reasons but strips landmarks',()=>{
    const r=validateMeasurement(diag(),session);
    expect(r.quality.reasons).toEqual(['TOO_DARK','BLUR']);
    expect(r.detection).toEqual({faceCount:1,imageWidth:640,imageHeight:480,score:.93,box:[10,20,120,130]});
    expect(r.padPolicy.decision).toBe('NOT_EVALUATED');expect(r.padDecision).toBe('NOT_EVALUATED');
    expect(JSON.stringify(r)).not.toMatch(/landmark|embedding/);
  });
  test('legacy AI result without diagnostics still accepted with nulls',()=>{
    const r=validateMeasurement(sample(),session);expect(r.detection).toBeNull();expect(r.padPolicy).toBeNull();expect(r.quality.reasons).toEqual([]);
  });
  test.each([
    ['PAD PASS via policy',{padPolicy:{decision:'PASS',reason:'X',evaluated:true,threshold:.5,evaluationReference:'r'}}],
    ['PAD FAIL via policy',{padPolicy:{decision:'FAIL',reason:'X',evaluated:false,threshold:null,evaluationReference:null}}],
    ['evaluated flag smuggled',{padPolicy:{decision:'NOT_EVALUATED',reason:'X',evaluated:true,threshold:null,evaluationReference:null}}],
    ['unknown quality reason',{quality:{decision:'FAIL',reasons:['<script>']}}],
    ['NaN box',{detection:{faceCount:1,imageWidth:1,imageHeight:1,score:.9,box:[NaN,0,1,1]}}],
    ['detector score > 1',{detection:{faceCount:1,imageWidth:1,imageHeight:1,score:2,box:null}}],
    ['calibrated threshold claim',{identityPolicy:{threshold:.6,status:'CALIBRATED',method:'yunet_sface_cosine'}}],
    ['alignment method changed',{alignment:{method:'other',performed:true}}],
  ])('rejects %s',(_,change)=>{expect(()=>validateMeasurement({...diag(),...change},session)).toThrow('RESEARCH_EVIDENCE_REJECTED');});
});
