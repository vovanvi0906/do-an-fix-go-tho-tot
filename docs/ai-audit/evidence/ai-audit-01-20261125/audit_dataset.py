import json,csv,hashlib,collections,math
from pathlib import Path
from PIL import Image
import yaml
R=Path('/home/vanvi/Work/do-an-fix-go-tho-tot');O=R/'docs/ai-audit/evidence/ai-audit-01-20261125'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'auditDate':'2026-11-25','scope':'read-only existing files; no labels changed; actual byte/decode checks; source rights and real-vs-synthetic cannot be inferred from pixels','classification':{},'externalPrepared':{},'rawSourceYamls':[],'experiments':[]}
cls=R/'ai-service/dataset';rows=[];splits=collections.Counter();dup=collections.defaultdict(list);pixels=collections.defaultdict(list);bad=[]
for p in sorted(cls.rglob('*')):
 if p.suffix.lower() not in ['.jpg','.jpeg','.png','.webp']:continue
 rel=p.relative_to(cls);split=rel.parts[0];label=rel.parts[1];splits[split+':'+label]+=1
 try:
  with Image.open(p) as im:im.load();pix=hashlib.sha256(im.convert('RGB').tobytes()+str(im.size).encode()).hexdigest();size=list(im.size)
  digest=sha(p);dup[digest].append(str(rel));pixels[pix].append(str(rel));rows.append({'path':str(rel),'sha256':digest,'size':size})
 except Exception as e:bad.append({'path':str(rel),'error':type(e).__name__})
report['classification']={'root':str(cls),'actualImages':sum(splits.values()),'bySplitClass':dict(splits),'decodeErrors':bad,'exactDuplicateGroups':sum(len(v)>1 for v in dup.values()),'exactCrossSplitDuplicateGroups':sum(len({x.split('/')[0] for x in v})>1 for v in dup.values()),'pixelCrossSplitDuplicateGroups':sum(len({x.split('/')[0] for x in v})>1 for v in pixels.values()),'declaredSources':'dataset_info claims multiple named corpora; training/prepare_dataset.py actually draws synthetic OpenCV fixtures','imageManifestSha256':hashlib.sha256(json.dumps(rows,sort_keys=True).encode()).hexdigest()}
raw=Path('/home/vanvi/Work/datasetai/01-raw');prep=raw.parent/'02-development/ai01-prepared-v1';records=[json.loads(l) for l in (prep/'records.jsonl').read_text().splitlines()];pins=json.loads((prep/'SHA256SUMS.json').read_text())
counts=collections.Counter();splitcounts=collections.Counter();classcount=collections.Counter();formats=collections.Counter();sourceStatus=collections.Counter();actualsha=collections.defaultdict(list);pixel=collections.defaultdict(list);groups=collections.defaultdict(set);issues=[];verify=0;decoded=0;synthetic=collections.Counter()
for r in records:
 counts[r['dataset']]+=1;splitcounts[r['developmentSplit']]+=1;sourceStatus[r.get('sourceVerification','unknown')]+=1
 for a in r.get('annotations',[]):classcount[r['dataset']+':'+str(a['classId'])]+=1;formats[a.get('format','unknown')]+=1
 groups[r['leakageGroup']].add(r['developmentSplit']);p=raw/r['path']
 try:
  digest=sha(p);verify+=1
  if digest!=r['sha256']:issues.append({'path':r['path'],'issue':'sha_mismatch'})
  actualsha[digest].append({'path':r['path'],'split':r['developmentSplit'],'sourceSplit':r.get('sourceSplit')})
  with Image.open(p) as im:im.load();decoded+=1
  pixel[r['pixelSha256']].append({'path':r['path'],'split':r['developmentSplit'],'sourceSplit':r.get('sourceSplit')})
 except Exception as e:issues.append({'path':r['path'],'issue':type(e).__name__})
 synthetic[str(r.get('synthetic','not_declared'))]+=1
report['externalPrepared']={'root':str(prep),'records':len(records),'recordPinsMatch':sha(prep/'records.jsonl')==pins.get('records.jsonl'),'byDataset':dict(counts),'developmentSplits':dict(splitcounts),'annotationCountsBySourceClass':dict(classcount),'annotationFormats':dict(formats),'sourceVerification':dict(sourceStatus),'syntheticDeclaration':dict(synthetic),'imageBytesHashed':verify,'imagesDecoded':decoded,'imageIssues':issues,'exactDuplicateGroups':sum(len(v)>1 for v in actualsha.values()),'exactCrossDevelopmentSplitGroups':sum(len({x['split'] for x in v})>1 for v in actualsha.values()),'exactCrossOriginalSplitGroups':sum(len({x['sourceSplit'] for x in v})>1 for v in actualsha.values()),'pixelCrossDevelopmentSplitGroupsByPreparedHash':sum(len({x['split'] for x in v})>1 for v in pixel.values()),'leakageGroupsCrossDevelopmentSplits':sum(len(v)>1 for v in groups.values()),'pixelHashCaveat':'Uses prepared pixel hash; actual file SHA/decode independently checked, pixel hash not recomputed for this entire corpus','nearDuplicateCaveat':'No new exhaustive pairwise pHash search; existing near-pairs artifact and policy inspected'}
rawimages=[p for p in raw.rglob('*') if p.suffix.lower() in ['.jpg','.jpeg','.png','.webp']];known={str(raw/r['path']) for r in records};report['externalPrepared']['rawImagesOnDisk']=len(rawimages);report['externalPrepared']['rawImagesOutsidePreparedManifest']=len([p for p in rawimages if str(p) not in known])
for p in sorted(raw.rglob('data.yaml')):
 try:report['rawSourceYamls'].append({'path':str(p),'sha256':sha(p),'data':yaml.safe_load(p.read_text())})
 except Exception as e:report['rawSourceYamls'].append({'path':str(p),'error':type(e).__name__})
for root in [R/'ai-service/runs',raw.parent/'03-experiments']:
 for p in sorted(root.rglob('results.csv')):
  with p.open() as f:data=list(csv.DictReader(f))
  report['experiments'].append({'path':str(p),'sha256':sha(p),'loggedEpochs':len(data),'lastLoggedMetrics':data[-1] if data else None,'caveat':'Historical logs only; not a new independent benchmark'})
(O/'dataset-inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'classificationImages':sum(splits.values()),'externalRecords':len(records),'decoded':decoded,'issues':len(issues),'rawImages':len(rawimages),'exactCrossSplit':report['externalPrepared']['exactCrossDevelopmentSplitGroups']},ensure_ascii=False))
