import os,json,time
from pathlib import Path
os.environ['YOLO_CONFIG_DIR']='/tmp/fixgo-audit-yolo-settings';os.environ['MPLCONFIGDIR']='/tmp/fixgo-audit-mpl'
from ultralytics import YOLO
R=Path('/home/vanvi/Work/do-an-fix-go-tho-tot');P=R/'docs/ai-audit/inference-results.json';data=json.loads(P.read_text());w='/home/vanvi/Work/datasetai/03-experiments/ai01-task04a-strict-v2/training/weights/best.pt';m=YOLO(w);needed=set(m.names.values());seen=set()
for l in Path('/home/vanvi/Work/datasetai/02-development/ai01-prepared-v1/records.jsonl').open():
 r=json.loads(l)
 for p in r.get('sourceNormalizedProposals',[]):
  if p.get('mappingState')!='usable_source_candidate':continue
  for t in p.get('objectCandidates',[]):
   slug=t['targetSlug']
   if slug not in needed or slug in seen:continue
   seen.add(slug);image=Path('/home/vanvi/Work/datasetai/01-raw')/r['path'];start=time.perf_counter();pred=m.predict(str(image),conf=.25,device='cpu',save=False,verbose=False)[0]
   data['cases'].append({'caseId':'SOURCE-'+str(len(seen)),'imagePath':str(image),'modelPath':w,'group':'source_member_smoke_NOT_INDEPENDENT','sourceTargetCandidate':slug,'sourceDevelopmentSplit':r['developmentSplit'],'groundTruth':None,'groundTruthStatus':'SOURCE_UNVERIFIED_AND_MODEL_EXPOSED_NOT_INDEPENDENT','correctness':None,'elapsedMs':round((time.perf_counter()-start)*1000,3),'boxes':[{'label':m.names[int(c)],'confidence':float(v),'xyxyNormalized':xy} for c,v,xy in zip(pred.boxes.cls.tolist(),pred.boxes.conf.tolist(),pred.boxes.xyxyn.tolist())],'predictedDefect':None,'predictedService':None})
 if seen==needed:break
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('source smoke examples',len(seen))
