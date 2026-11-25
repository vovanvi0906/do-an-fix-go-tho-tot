import {resolveVisualServices} from './visual-service-resolver';
import {resolveDiagnosis} from './diagnosis-resolver';
const category={id:'c',slug:'sua-dien',name:'Sửa điện'},target={id:'t',slug:'o-cam-dien',name:'Ổ cắm',categoryId:'c',isActive:true,category:{...category,isActive:true}};
const object={id:'o',kind:'object',categorySlug:'sua-dien',targetSlug:'o-cam-dien',code:'o-cam-dien',confidence:.95,xyxy:[.1,.1,.9,.9]};
const sign={id:'s',kind:'sign',categorySlug:'sua-dien',targetSlug:'o-cam-dien',code:'burn_mark',objectId:'o',confidence:.9,xyxy:[.2,.2,.4,.4]};
const symptom={id:'sym',targetId:'t',code:'burn_mark',name:'Vết cháy sém',kind:'VISUAL_OBSERVABLE',isActive:true,reviewStatus:'APPROVED'};
const service={id:'svc',targetId:'t',categoryId:'c',name:'Kiểm tra ổ cắm',slug:'kiem-tra-o-cam',basePrice:100000,isActive:true};
let prisma,ai,oldEnv;
beforeEach(()=>{oldEnv={...process.env};process.env.VISUAL_SERVICE_SUGGESTIONS_ENABLED='true';process.env.SYMPTOM_CATALOG_ENABLED='true';delete process.env.VISUAL_SERVICE_MIN_CONFIDENCE;
 prisma={serviceCategory:{findMany:jest.fn().mockResolvedValue([category])},serviceTarget:{findMany:jest.fn().mockResolvedValue([target]),findUnique:jest.fn().mockResolvedValue(target)},service:{findMany:jest.fn().mockResolvedValue([service])},symptom:{findMany:jest.fn().mockResolvedValue([symptom])},symptomService:{findMany:jest.fn().mockResolvedValue([{service,symptom,symptomId:'sym',priority:1}])}};
 ai={engine:'model',confidence:.95,suggestedCategoryId:'sua-dien',suggestedTargetId:'o-cam-dien',visualAnalysis:{status:'detected',modelVersion:'TEST-FIXTURE',weightsSha256:'a'.repeat(64),detections:[object,sign]}};
});
afterEach(()=>{process.env=oldEnv;});
it('offers immediate service previews from approved visual catalog; never claims confirmed symptoms or books',async()=>{
 const result=await resolveDiagnosis(prisma,{diagnoseIncident:async()=>ai},{imageUrl:'https://example.test/fixture.jpg'});
 expect(result.visualServiceSuggestions[0]).toMatchObject({id:'svc',categoryId:'c',targetId:'t',confidence:null,requiresUserConfirmation:true,requiresInspection:true,provenance:'visual_approved_catalog'});
 expect(result.status).toBe('needs_more_info');expect(result.suggestedServiceId).toBeNull();expect(result.selectedSymptomIds).toEqual([]);expect(result.reportedSymptoms).toEqual([]);expect(result.target).toBeNull();
 expect(result.visualServiceSuggestions[0].reason).not.toContain('bạn xác nhận');
});
it('honors feature flags without touching catalog',async()=>{process.env.VISUAL_SERVICE_SUGGESTIONS_ENABLED='false';expect((await resolveVisualServices(prisma,ai,category,[target])).suggestions).toEqual([]);expect(prisma.symptom.findMany).not.toHaveBeenCalled();});
it.each(['USER_REPORTED','REQUIRES_TECHNICIAN_CHECK'])('does not infer invisible symptom %s',async kind=>{prisma.symptom.findMany.mockResolvedValue([{...symptom,kind}]);expect((await resolveVisualServices(prisma,ai,category,[target])).suggestions).toEqual([]);});
it('does not substitute first service when catalog has no approved link',async()=>{prisma.symptomService.findMany.mockResolvedValue([]);expect((await resolveVisualServices(prisma,ai,category,[target])).suggestions).toEqual([]);});
it.each([
 [object,{...sign,confidence:.5}], [object,{...sign,objectId:'foreign'}], [object,{...sign,xyxy:[.95,.95,1,1]}], [object,{...sign,targetSlug:'voi-nuoc'}], [object,{...sign,categorySlug:'sua-nuoc'}], [object,{...object,id:'o2'},sign], [object,{...sign,xyxy:[NaN,0,1,1]}],
])('rejects weak, malformed or spatially ambiguous evidence',async(...detections)=>{ai.visualAnalysis.detections=detections;expect((await resolveVisualServices(prisma,ai,category,[target])).suggestions).toEqual([]);});
it('user supplied evidence cannot spoof model output',async()=>{delete ai.visualAnalysis;const result=await resolveDiagnosis(prisma,{diagnoseIncident:async()=>ai},{imageUrl:'https://example.test/fixture.jpg',visualAnalysis:{status:'detected',detections:[object,sign]}});expect(result.visualServiceSuggestions).toEqual([]);});
it('manual choices use old validation and never rely on a stale model response',async()=>{const client={diagnoseIncident:jest.fn(async()=>ai)};const result=await resolveDiagnosis(prisma,client,{imageUrl:'https://example.test/fixture.jpg',answers:{categoryId:'c',targetId:'t',serviceId:'svc'}});expect(result.status).toBe('suggested');expect(result.source).toBe('manual');expect(client.diagnoseIncident).not.toHaveBeenCalled();expect(result.visualServiceSuggestions).toEqual([]);});
