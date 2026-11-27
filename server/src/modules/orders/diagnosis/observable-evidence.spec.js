import { observableEvidenceFromAI } from './observable-evidence';
import { resolveDiagnosis } from './diagnosis-resolver';
const evidence = () => ({ status: 'proposed', labelStatus: 'AI_UNVERIFIED', modelVersion: 'fixture', releaseSha256: 'a'.repeat(64), models: [{ id: 'general', weightsSha256: 'b'.repeat(64) }], proposals: [{ code: 'visible_water', name: 'Nước nhìn thấy', definition: 'TEST FIXTURE', xyxy: [.1,.2,.8,.9], confidence: .8, modelId: 'general', objectId: 'untrusted', relatedServiceGroups: ['sua-nuoc'] }], coverage: [{ categorySlug: 'lam-vuon', status: 'no_domain_dataset', signCodes: ['visible_water'] }] });
it('passes image regions as unverified proposals without parent or service claims',()=>{
 const result=observableEvidenceFromAI({observableAnalysis:evidence()});
 expect(result.proposals[0].objectId).toBeNull();expect(result.labelStatus).toBe('AI_UNVERIFIED');expect(result.coverage[0].signCodes).toEqual([]);expect(result.suggestedServiceId).toBeUndefined();
});
it.each([p=>{p.xyxy=[.8,0,.1,1];},p=>{p.confidence=NaN;},p=>{p.modelId='foreign';},p=>{p.code='diagnosed_short_circuit';}])('rejects malformed or unsupported proposals',change=>{
 const value=evidence();change(value.proposals[0]);expect(observableEvidenceFromAI({observableAnalysis:value}).status).toBe('unavailable');
});
it('does not call lack of detections normal',()=>{
 const value={...evidence(),status:'no_detection',proposals:[]};const result=observableEvidenceFromAI({observableAnalysis:value});expect(result.absenceMeans).toBe('NOT_DETECTED_DOES_NOT_MEAN_NORMAL');expect(result.proposals).toEqual([]);
});
it('preserves proposals when category confidence abstains',async()=>{
 const prisma={serviceCategory:{findMany:jest.fn().mockResolvedValue([{id:'water',slug:'sua-nuoc',name:'Sửa nước'}])}};
 const ai={diagnoseIncident:jest.fn().mockResolvedValue({engine:'model',confidence:null,observableAnalysis:evidence()})};
 const result=await resolveDiagnosis(prisma,ai,{imageUrl:'https://example.test/water.jpg'});
 expect(result.observableAnalysis.proposals).toHaveLength(1);expect(result.suggestedServiceId).toBeNull();expect(result.reportedSymptoms).toEqual([]);expect(result.visualServiceSuggestions).toEqual([]);
});
it('manual choices never reuse user-supplied proposals',async()=>{
 const prisma={serviceCategory:{findMany:jest.fn().mockResolvedValue([{id:'water',slug:'sua-nuoc',name:'Sửa nước'}])},service:{findMany:jest.fn().mockResolvedValue([])}};
 const ai={diagnoseIncident:jest.fn()};const result=await resolveDiagnosis(prisma,ai,{imageUrl:'https://example.test/water.jpg',answers:{categoryId:'water'},observableAnalysis:evidence()});
 expect(ai.diagnoseIncident).not.toHaveBeenCalled();expect(result.observableAnalysis.proposals).toEqual([]);
});
it('preserves unsupported-class information and context without creating a service',()=>{
 const value={...evidence(),contextStatus:'unsupported_category',unavailableSigns:[{code:'visible_water',name:'Nước',reason:'insufficient_development_quality'}]};
 const result=observableEvidenceFromAI({observableAnalysis:value});expect(result.unavailableSigns[0].code).toBe('visible_water');expect(result.contextStatus).toBe('unsupported_category');expect(result.suggestedServiceId).toBeUndefined();
});
it('passes evaluated scope only with release provenance and a valid positive sample count',()=>{
 const value={...evidence(),evaluationStatus:'limited_scope_evaluated',evaluationSampleCount:91};
 expect(observableEvidenceFromAI({observableAnalysis:value})).toMatchObject({evaluationStatus:'limited_scope_evaluated',evaluationSampleCount:91});
 value.evaluationSampleCount=NaN;expect(observableEvidenceFromAI({observableAnalysis:value}).evaluationStatus).toBe('development_only');
});
