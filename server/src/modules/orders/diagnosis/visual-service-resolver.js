import { listTargetSymptoms, recommendServices } from '../../symptoms/symptom-catalog';

const boxValid = box => Array.isArray(box) && box.length === 4 && box.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1) && box[0] < box[2] && box[1] < box[3];
function inside(sign, object) {
  const overlap = Math.max(0, Math.min(sign[2],object[2])-Math.max(sign[0],object[0])) * Math.max(0, Math.min(sign[3],object[3])-Math.max(sign[1],object[1]));
  return overlap / ((sign[2]-sign[0])*(sign[3]-sign[1])) >= .8;
}

// Called only with the AI response for THIS image. Never read evidence from input.answers.
export async function resolveVisualServices(prisma, ai, category, targets) {
  const unavailable = {status:'disabled', suggestions:[], observations:[]};
  if (process.env.VISUAL_SERVICE_SUGGESTIONS_ENABLED !== 'true' || process.env.SYMPTOM_CATALOG_ENABLED !== 'true') return unavailable;
  const analysis = ai?.visualAnalysis;
  if (analysis?.status !== 'detected') return {...unavailable,status:['disabled','no_evidence'].includes(analysis?.status)?analysis.status:'unavailable'};
  const minimum = Number(process.env.VISUAL_SERVICE_MIN_CONFIDENCE ?? '.75');
  if (!Number.isFinite(minimum) || minimum < .5 || minimum > 1 || !analysis.modelVersion || !/^[a-f0-9]{64}$/.test(analysis.weightsSha256 || '') || !Array.isArray(analysis.detections) || analysis.detections.length > 100) return {...unavailable,status:'unavailable'};
  const ids = analysis.detections.map(b=>b.id);
  if (ids.some(id=>typeof id!=='string'||!id||id.length>100) || new Set(ids).size!==ids.length) return {...unavailable,status:'unavailable'};
  const detections = analysis.detections.filter(b=>boxValid(b.xyxy) && typeof b.confidence==='number' && Number.isFinite(b.confidence) && b.confidence>=minimum && b.confidence<=1 && b.categorySlug===category.slug);
  const objects = detections.filter(b=>b.kind==='object' && targets.some(t=>t.slug===b.targetSlug));
  const groups = new Map();
  for (const sign of detections.filter(b=>b.kind==='sign')) {
    const candidates = objects.filter(b=>b.targetSlug===sign.targetSlug && inside(sign.xyxy,b.xyxy));
    if (candidates.length!==1 || candidates[0].id!==sign.objectId || typeof sign.code!=='string') continue;
    const target = targets.find(t=>t.slug===sign.targetSlug);
    if (!groups.has(target.id)) groups.set(target.id,{target,signs:[]});
    groups.get(target.id).signs.push(sign);
  }
  const all = [], observations = [];
  for (const {target,signs} of [...groups.values()].slice(0,5)) {
    const symptoms = (await listTargetSymptoms(prisma,target.id,category.id)).filter(s=>s.kind==='VISUAL_OBSERVABLE' && signs.some(b=>b.code===s.code));
    if (!symptoms.length) continue;
    const recommendations = await recommendServices(prisma,{targetId:target.id,categoryId:category.id,symptomIds:symptoms.slice(0,10).map(s=>s.id)});
    const evidence = symptoms.map(s=>({code:s.code,name:s.name,boxes:signs.filter(b=>b.code===s.code).map(b=>({xyxy:b.xyxy,confidence:b.confidence,objectId:b.objectId}))}));
    observations.push(...symptoms.map(s=>`${target.name}: ${s.name}`));
    for (const service of recommendations.items) all.push({...service,categoryId:category.id,targetId:target.id,targetName:target.name,
      provenance:'visual_approved_catalog',confidence:null,requiresUserConfirmation:true,requiresInspection:true,
      reason:`Gợi ý từ dấu hiệu trong ảnh: ${symptoms.filter(s=>service.symptomIds.includes(s.id)).map(s=>s.name).join(', ')}. Cần thợ kiểm tra trước khi kết luận cách xử lý.`,
      visualEvidence:evidence,modelVersion:analysis.modelVersion,weightsSha256:analysis.weightsSha256});
  }
  return {status:all.length?'suggestions':'no_approved_match',suggestions:all.slice(0,3),observations:[...new Set(observations)]};
}
