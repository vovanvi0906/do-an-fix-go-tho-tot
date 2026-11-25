"""TASK04B: source-copy quality audit and prioritized correction queue. NEVER trains."""
import csv, gzip, hashlib, json, shutil
from collections import Counter, defaultdict
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
from train_prepared import validate

ROOT=Path.home()/'Work/datasetai'
RAW=ROOT/'01-raw';PREP=ROOT/'02-development/ai01-prepared-v1';RUN=ROOT/'03-experiments/ai01-task04a-strict-v2';OUT=ROOT/'02-development/ai01-quality-v1'
REPO=Path(__file__).resolve().parents[3]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def iou(a,b):
 w=max(0,min(a[2],b[2])-max(a[0],b[0]));h=max(0,min(a[3],b[3])-max(a[1],b[1]));z=w*h
 return z/max(1e-12,(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-z)
def xyxy(v):x,y,w,h=v;return [max(0,x-w/2),max(0,y-h/2),min(1,x+w/2),min(1,y+h/2)]

SIGNS={
 'water_dripping':{'name':'Nước nhỏ giọt','evidenceRule':'Thấy giọt/tia ngắt quãng rõ vị trí; không coi vòi xả bình thường là lỗi rò.','negativeExample':'Vòi đang được mở để sử dụng, ảnh không thấy giọt.'},
 'wet_surface':{'name':'Bề mặt ướt','evidenceRule':'Thấy vùng ẩm/nước trên bề mặt; không suy nguồn nước hay nguyên nhân.','negativeExample':'Vết ố khô, bóng phản chiếu hoặc bề mặt sáng.'},
 'crack':{'name':'Vết nứt','evidenceRule':'Thấy đường đứt/nứt vật liệu; không nhầm mối nối hoặc bóng.','negativeExample':'Mối ghép, rãnh thiết kế, bóng đổ.'},
 'burn_mark':{'name':'Vết cháy/xém','evidenceRule':'Thấy vùng cháy/xém có bằng chứng ảnh; không suy chập điện hoặc nguyên nhân.','negativeExample':'Bụi, vết bẩn tối, màu vật liệu bình thường.'},
 'water_spray':{'name':'Tia nước nhìn thấy','evidenceRule':'Thấy tia nước; ghi vị trí và bối cảnh, không tự kết luận ống vỡ.','negativeExample':'Ảnh chỉ có ống hoặc vòi, không thấy tia nước.'},
 'stain_or_discoloration':{'name':'Vết ố/đổi màu','evidenceRule':'Vùng đổi màu nhìn thấy, không suy là ướt hoặc do rò nước.','negativeExample':'Màu sơn/vật liệu hoặc bóng đổ.'},
 'broken_part':{'name':'Chi tiết gãy/vỡ','evidenceRule':'Thấy phần gãy/vỡ thật, không dùng tên lỗi nguồn làm bằng chứng.','negativeExample':'Ảnh quảng cáo thiết bị nguyên vẹn.'},
 'surface_soiling':{'name':'Bụi/bẩn bám','evidenceRule':'Thấy chất bẩn bám trên bề mặt.','negativeExample':'Nhiễu ảnh hoặc màu vật liệu.'},
 'bird_droppings':{'name':'Vết giống phân chim','evidenceRule':'Thấy vết phù hợp, chưa kết luận nguyên nhân/vệ sinh nếu chưa rõ.','negativeExample':'Vết sơn hoặc phản sáng.'},
 'leaf_debris':{'name':'Lá/rác lá bám','evidenceRule':'Thấy lá/rác lá trên bề mặt, không suy bệnh cây.','negativeExample':'Cây/lá thuộc cảnh nền không phải rác bám.'}}

REASONS={'faucet_rare':'Vòi nước ít mẫu, cần kiểm box vật thể', 'fault_region_scope':'Box nguồn có thể là vùng sự cố; phải vẽ riêng vật thể',
 'source_empty':'Nhãn rỗng, chưa phải ảnh âm', 'geometry':'Khung nguồn bất thường', 'duplicate_conflict':'Trùng ảnh nhưng nhãn nguồn mâu thuẫn',
 'layout':'Nghi quảng cáo/ảnh ghép — kiểm trước khi dùng', 'source_overlap':'Box cùng lớp chồng lấn/vật thể và bộ phận có thể bị trộn',
 'model_missed':'Model bỏ sót so với nhãn nguồn', 'model_localization':'Box model không khớp vị trí nguồn', 'model_confusion':'Model nhầm lớp so với nguồn',
 'model_extra':'Model trả box không khớp nguồn (có thể nguồn thiếu nhãn)'}

def build():
 if (OUT/'summary.json').exists():raise RuntimeError('Quality run already exists; do not overwrite')
 validate(PREP,RAW)
 report_pins=json.loads((RUN/'experiment-manifest.json').read_text())['files']
 for rel in ['full_development-metrics.json','validation-full_development/predictions.json','class-map.json','selection.jsonl']:
  if sha(RUN/rel)!=report_pins[rel]:raise RuntimeError('Strict-v2 artifact changed: '+rel)
 rows=[json.loads(l) for l in (PREP/'records.jsonl').read_text().splitlines()];by_id={r['id']:r for r in rows}
 source_mapping=json.loads((PREP/'normalized-mapping.json').read_text());mapping={(e['dataset'],e['classId']):e for e in source_mapping['entries']}
 classes=json.loads((RUN/'class-map.json').read_text());target_to_class={c['key']:int(i) for i,c in classes.items()}
 predictions=defaultdict(list)
 for p in json.loads((RUN/'validation-full_development/predictions.json').read_text()):
  x,y,w,h=p['bbox'];image_id=str(p['image_id']);r=by_id[image_id];W,H=r['width'],r['height']
  # Ultralytics 8.4 non-COCO JSON exports category_id = model_index + 1.
  c=int(p['category_id'])-1
  if not 0<=c<5:raise ValueError('Prediction category map mismatch')
  predictions[image_id].append({'classId':c,'score':p['score'],'xyxy':[x/W,y/H,(x+w)/W,(y+h)/H]})
 analyses={};aggregate={i:Counter() for i in range(5)};faucet_diag=[]
 val_paths={p.stem for p in (RUN/'data/labels/full_val').glob('*.txt')}
 for image_id in sorted(val_paths):
  r=by_id[image_id];source=[]
  for line in (RUN/'data/labels/full_val'/(image_id+'.txt')).read_text().splitlines():
   a=list(map(float,line.split()));source.append({'classId':int(a[0]),'xyxy':xyxy(a[1:])})
  pred=sorted((p for p in predictions[image_id] if p['score']>=.25),key=lambda p:-p['score']);used=set();tp=[];fp=[]
  for p in pred:
   opts=[(iou(p['xyxy'],s['xyxy']),j) for j,s in enumerate(source) if j not in used and p['classId']==s['classId']]
   score,j=max(opts,default=(0,-1))
   if score>=.5:used.add(j);tp.append((p,j));aggregate[p['classId']]['tp']+=1
   else:fp.append(p);aggregate[p['classId']]['fp']+=1
  missed=[s for j,s in enumerate(source) if j not in used];reasons=[]
  for s in source:aggregate[s['classId']]['sourceBoxes']+=1
  for s in missed:
   aggregate[s['classId']]['fn']+=1
   overlaps=[p for p in pred if p['classId']==s['classId'] and iou(p['xyxy'],s['xyxy'])>.1]
   confused=[p for p in pred if p['classId']!=s['classId'] and iou(p['xyxy'],s['xyxy'])>=.5]
   reasons.append('model_localization' if overlaps else 'model_confusion' if confused else 'model_missed')
  if fp:reasons.append('model_extra')
  analyses[image_id]={'reasons':sorted(set(reasons)),'matched':len(tp),'missed':len(missed),'extra':len(fp),'predictionsAt025':pred[:30]}
  for s in source:
   if s['classId']==1:
    candidates=[p for p in predictions[image_id] if p['classId']==1 and iou(p['xyxy'],s['xyxy'])>=.5]
    b=s['xyxy'];faucet_diag.append({'imageId':image_id,'bestCorrectlyLocalizedScore':max((p['score'] for p in candidates),default=0),'shortSideAt320':round(min((b[2]-b[0])*r['width'],(b[3]-b[1])*r['height'])*320/max(r['width'],r['height']),2)})
 index={};drafts={};rights=[]
 for ds in sorted({r['dataset'] for r in rows}):
  r=next(r for r in rows if r['dataset']==ds)
  rights.append({'dataset':ds,'declaredLicense':r['source']['license'],'sourceUrl':r['source']['url'],'rightsVerified':False,'underlyingImageOwnershipVerified':False,'status':'needs_user_license_attribution_evidence'})
 for r in rows:
  reasons=[];scope_ambiguous=r['dataset']=='suanuoc' and any(c!=3 for c in r['sourceClassIds'])
  if r['dataset']=='suanuoc' and 3 in r['sourceClassIds']:reasons.append('faucet_rare')
  if scope_ambiguous:reasons.append('fault_region_scope')
  if r['errors']:reasons.append('source_empty')
  if r['geometryWarnings']:reasons.append('geometry')
  if r['duplicateLabelConflict']:reasons.append('duplicate_conflict')
  if r['visualCandidates']:reasons.append('layout')
  refs=[]
  for j,a in enumerate(r['annotations']):
   m=mapping[(r['dataset'],a['classId'])];literal=m['mappingState']=='usable_source_candidate' and (r['dataset']!='suanuoc' or a['classId']==3)
   refs.append({'sourceIndex':j,'sourceClassId':a['classId'],'sourceLabel':m['sourceLabel'],'xyxy':xyxy(a['bbox']),
    'scope':'direct_object_candidate' if literal else 'unresolved_region',
    'candidateTargetId':m['catalogTargetCandidates'][0]['targetId'] if literal else None,
    'sourceClaim':m['semantics']['sourceFaultOrDiseaseClaim'],'originalFormat':a['format'],'originalCoordinates':a['coordinates']})
  if any(a['sourceClassId']==b['sourceClassId'] and iou(a['xyxy'],b['xyxy'])>.65 for j,a in enumerate(refs) for b in refs[j+1:]):reasons.append('source_overlap')
  analysis=analyses.get(r['id'])
  if analysis:reasons+=analysis['reasons']
  if not reasons and r['dataset']!='suanuoc':continue
  if not reasons:reasons=['fault_region_scope']
  priority=0 if 'faucet_rare' in reasons else 1 if 'fault_region_scope' in reasons else 2 if any(x in reasons for x in ['source_overlap','model_localization','model_confusion','model_missed']) else 3
  index[r['id']]={'priority':priority,'reasons':sorted(set(reasons)),'sourceBoxes':len(refs),'needsGeometryReview':True,'pilot':False}
  drafts[r['id']]={k:r.get(k) for k in ['id','path','dataset','sha256','annotationPath','annotationSha256','yamlSha256','width','height','source','leakageGroup','sourceFamilyCandidate','phash','pixelSha256','developmentSplit']}
  drafts[r['id']].update(sourceReferences=refs,sourceModelAnalysis=analysis,workingBoxes=[],status='pending_human_geometry_review',approvedGroundTruth=False,rightsVerified=False)
 # Pilot: all source faucet frames (including mixed labels) + diverse plumbing
 # regions + localization errors. Pick source groups, never 160 augment siblings.
 pilot=[];seen=set()
 for image_id in sorted(index,key=lambda i:(index[i]['priority'],0 if by_id[i]['dataset']=='suanuoc' and 7 in by_id[i]['sourceClassIds'] else 1,hashlib.sha256(('q04b:'+i).encode()).hexdigest())):
  group=by_id[image_id]['leakageGroup']
  if group in seen:continue
  seen.add(group);pilot.append(image_id);index[image_id]['pilot']=True
  if len(pilot)>=160:break
 # Reserve non-plumbing localization/overlap examples so the first pilot also
 # checks fridge/washer/AC, rather than spending all remaining slots on pipes.
 nonplumb=[i for i in sorted(index,key=lambda i:(index[i]['priority'],i)) if by_id[i]['dataset']!='suanuoc' and any(k.startswith('model_') or k=='source_overlap' for k in index[i]['reasons'])]
 if len(nonplumb)>=20:
  replacements=[]
  for i in nonplumb:
   if by_id[i]['leakageGroup'] not in seen:replacements.append(i);seen.add(by_id[i]['leakageGroup'])
   if len(replacements)==20:break
  removable=[i for i in reversed(pilot) if 'faucet_rare' not in index[i]['reasons']][:len(replacements)]
  for i in removable:pilot.remove(i);index[i]['pilot']=False
  for i in replacements:pilot.append(i);index[i]['pilot']=True
 for n,(image_id,d) in enumerate(drafts.items()):
  if shutil.disk_usage(OUT).free<2*1024**3:raise RuntimeError('Stop: require 2GiB disk reserve')
  p=RAW/d['path'];dest=OUT/'images'/(image_id+Path(d['path']).suffix.lower());dest.parent.mkdir(exist_ok=True);shutil.copyfile(p,dest)
  if sha(dest)!=d['sha256']:raise ValueError('Copy hash mismatch')
  d['copyPath']=str(dest.relative_to(OUT))
  if n%1000==0:print('copied quality images',n,'/',len(drafts),flush=True)
 with (OUT/'drafts.jsonl').open('x') as f:
  for d in drafts.values():f.write(json.dumps(d,ensure_ascii=False)+'\n')
 metrics=json.loads((RUN/'full_development-metrics.json').read_text())
 error={'scope':'strict-v2 developmental source validation, not independent truth','predictionJsonCategoryIdBase':1,'fixedConfidence':.25,'matchIou':.5,
  'perClass':[dict(metrics['perClass'][i],fixedThresholdCounts=dict(aggregate[i])) for i in range(5)],'faucetCases':faucet_diag,
  'faucetEvidence':{'trainImages':23,'valImages':9,'allDirectSourceImages':sum(r['dataset']=='suanuoc' and 3 in r['sourceClassIds'] for r in rows),
  'bestCorrectlyLocalizedScoreAcrossVal':max((d['bestCorrectlyLocalizedScore'] for d in faucet_diag),default=0),'shortSideAt320Median':float(np.median([d['shortSideAt320'] for d in faucet_diag])),
  'evidence':['Only 23 train / 9 val direct faucet images survived semantic filtering.','Fixed-confidence errors and source box sizes measured from existing full-validation predictions.','Fault-labeled source plumbing regions cannot safely supplement whole-object training boxes automatically.'],
  'hypothesesNotProven':['5 epochs may underfit the new faucet head; no ablation was run.','320px and thin/occluded/reflective faucets may hurt localization; verify on corrected field data.']}}
 save(OUT/'error-analysis.json',error);save(OUT/'queue-index.json',index);save(OUT/'reason-labels.json',REASONS)
 save(OUT/'sign-ontology.json',{'signs':SIGNS,'legacyAliasForDisplayOnly':{'water_drip':'water_dripping'},'allPositiveBoxesNeedHumanEvidence':True,'approvedGroundTruth':False})
 save(OUT/'rights-audit.json',{'sources':rights,'sourcePageCheck':{'airConditioner':'Roboflow page displays CC BY 4.0; this is a declaration, not verification of image ownership.','otherFive':'Source pages inaccessible to web tool; local YAML still declares CC BY 4.0.'},'allImagesRightsUnverified':True,'autoRightsApproval':False})
 save(OUT/'next-training-proposal.json',{'trainingEnabled':False,'reason':'Corrected boxes, source/license/group evidence and class support must be checked first.','model':'explicit local YOLOv8n detector weights','imgsz':416,'batch':2,'workers':0,'cache':False,'epochs':15,'seed':23,'device':'cpu','effectiveThreads':4,'threadPolicy':'set process-local Ultralytics CPU NUM_THREADS AND torch.set_num_threads to 4; environment alone is insufficient','outputRoot':str(ROOT/'03-experiments'),'reserveDiskGiB':2,'noAutomaticLaunch':True,'suggestedBalancedTrainCapPerClass':400,'minimumReviewedSupport':{'trainImages':20,'valImages':5,'trainGroups':2,'valGroups':1},'independentTest':False})
 counts={'candidateImages':len(index),'candidateSourceBoxes':sum(x['sourceBoxes'] for x in index.values()),'pilotImages':len(pilot),'pilotSourceBoxes':sum(index[i]['sourceBoxes'] for i in pilot),
  'faucetImages':sum('faucet_rare' in x['reasons'] for x in index.values()),'scopeAmbiguousImages':sum('fault_region_scope' in x['reasons'] for x in index.values()),
  'scopeAmbiguousBoxes':sum(sum(b['scope']=='unresolved_region' for b in drafts[i]['sourceReferences']) for i in index if 'fault_region_scope' in index[i]['reasons']),
  'modelErrorImages':sum(any(k.startswith('model_') for k in x['reasons']) for x in index.values()),'geometricWarnings':sum('geometry' in x['reasons'] for x in index.values()),'humanCorrectedImages':0,'readyCorrectedImages':0}
 summary={'schemaVersion':'fixgo.ai01.quality.v1','createdAt':datetime.now(timezone.utc).isoformat(),'status':'prepared_for_human_bbox_review','root':str(OUT),'counts':counts,
  'reasonCounts':dict(Counter(k for x in index.values() for k in x['reasons'])),'coverage':{'weakSourceClassesWithPriorTrialSupport':['may-lanh-dieu-hoa','tu-lanh-tu-lanh-side-by-side','o-cam-dien','may-giat-may-giat-say'],'faucet':'23 train/9 val, low support and zero recall at reported operating point','plumbingIncidentLabels':'require newly drawn/checked object boxes; never auto convert incident regions','curatedClassesReady':0,'signClassesReady':0},
  'duplicatesAndLeakage':json.loads((PREP/'summary.json').read_text())['counts'] | {'knownCrossSplitSha':0,'knownCrossSplitPixel':0,'knownCrossSplitPhashPairs':0,'knownCrossSplitFamily':0,'policy':'Preserve frozen development groups; no independent benchmark.'},
  'rightsVerifiedImages':0,'automaticSemanticCorrections':0,'formatPolicy':'Source polygons -> enclosing reference bbox, originals preserved. Working boxes start empty; only human actions create corrected object/sign labels.',
  'sourcePins':{'preparedManifest':sha(PREP/'SHA256SUMS.json'),'strictManifest':sha(RUN/'experiment-manifest.json'),'catalog':sha(OUT/'catalog-db.json')},'trained':False,'deployed':False,'approvedGroundTruth':False}
 save(OUT/'summary.json',summary)
 pins={str(p.relative_to(OUT)):sha(p) for p in OUT.rglob('*') if p.is_file() and p.name!='SHA256SUMS.json'};save(OUT/'SHA256SUMS.json',pins)
 print(json.dumps({'counts':counts,'faucet':error['faucetEvidence']},ensure_ascii=False),flush=True)

if __name__=='__main__':build()
