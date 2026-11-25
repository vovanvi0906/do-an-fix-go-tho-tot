"""Package completed experimental artifacts; verify all protected inputs again."""
import csv
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from task04a import RUN,REPO,PREP,RAW,protected,sha,save,stamp
from train_prepared import validate

def top(scores):return max((scores or {}).items(),key=lambda x:x[1],default=('',0))

def main():
 full=json.loads((RUN/'full_development-metrics.json').read_text());balanced=json.loads((RUN/'balanced_development-metrics.json').read_text());pre=json.loads((RUN/'preflight.json').read_text())
 with (RUN/'training/results.csv').open() as f: epoch_rows=list(csv.DictReader(f))
 if [int(r['epoch']) for r in epoch_rows]!=list(range(1,6)):raise RuntimeError('Expected exactly five optimization epochs')
 save(RUN/'optimization-epochs.json',{'optimizationEpochs':5,'csvRows':5,'note':'The extra on_fit_epoch_end callback after best-checkpoint validation is not an additional optimization epoch; raw progress/logs are preserved.'})
 records=[json.loads(l) for l in (RUN/'qualitative-comparison.jsonl').read_text().splitlines()]
 if protected()!=json.loads((RUN/'protected-before.json').read_text()):raise RuntimeError('Protected files changed')
 post=validate(PREP,RAW);save(RUN/'audit-postrun.json',post)
 for rel,expected in json.loads((RUN/'data-manifest.json').read_text()).items():
  if sha(RUN/rel)!=expected:raise RuntimeError('Experiment image/label was modified')
 classes=json.loads((RUN/'class-map.json').read_text());rows=[]
 for r in records:
  baseline=r['currentBaseline'];raw=baseline['rawV2Prediction'];resolved=baseline['diagnosisResolver'];match=r['sourceMatchAtIoU50']
  rows.append({'imageId':r['imageId'],'sourceClassNames':', '.join(sorted({classes[str(b['classId'])]['name'] for b in r['sourceBoxes']})),
    'detectorPredictions':'; '.join(f"{p['name']}={p['confidence']:.3f}" for p in r['detectorPrediction']),
    'sourceMatched':match['sourceMatched'],'unmatchedPredictions':match['unmatchedPredictions'],'sourceMissed':match['sourceMissed'],
    'rawYoloTopCategory':str(top(baseline['rawYoloClassificationScores'])),'rawClipTopCategory':str(top(baseline['rawClipCategoryScores'])),
    'rawV2Target':raw.get('suggestedTargetId'),'rawV2DecisionSource':raw.get('decision_source'),
    'resolverStatus':resolved.get('status'),'resolverDecisionSource':resolved.get('decisionSource'),'resolverTarget':str(resolved.get('target')),'resolverRequiresManualSelection':resolved.get('requiresManualSelection')})
 with (RUN/'examples.csv').open('x',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
 matches=[r for r in records if r['sourceMatchAtIoU50']['sourceMatched'] and not r['sourceMatchAtIoU50']['unmatchedPredictions'] and not r['sourceMatchAtIoU50']['sourceMissed']]
 misses=sorted(records,key=lambda r:(-r['sourceMatchAtIoU50']['sourceMissed'],-r['sourceMatchAtIoU50']['unmatchedPredictions'],r['imageId']))
 chosen=[]
 for r in matches[:2]+misses[:2]:
  if r['imageId'] not in [p['imageId'] for p in chosen]:chosen.append(r)
 canvas=Image.new('RGB',(1000,600*max(1,(len(chosen)+1)//2)),'white');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
 for i,r in enumerate(chosen):
  image=Image.open(RUN/'examples'/(r['imageId']+'.jpg')).convert('RGB');image.thumbnail((480,500));x=(i%2)*500;y=(i//2)*600
  canvas.paste(image,(x+(500-image.width)//2,y+75));s=r['sourceMatchAtIoU50'];text=f"{r['imageId']} matched={s['sourceMatched']} FP={s['unmatchedPredictions']} missed={s['sourceMissed']}"
  draw.text((x+8,y+8),text,fill='black',font=font);draw.text((x+8,y+33),'GREEN = unverified source; RED = prediction',fill='black',font=font)
 canvas.save(RUN/'examples-contact-sheet.jpg')
 save(RUN/'selected-examples.json',[{'imageId':r['imageId'],'sourceMatchAtIoU50':r['sourceMatchAtIoU50'],'artifact':'examples/'+r['imageId']+'.jpg'} for r in chosen])
 lines=['FIXGO AI-01 TASK04A — EXPERIMENTAL OBJECT DETECTION','',
  'Scope: source-supervised DEVELOPMENT validation only. Not independent accuracy/F1, not approved Ground Truth.',
  'No production deployment, API/database/schema change, or replacement of production weights.', '',
  'Model: local pretrained YOLOv8n detector -> 7 FixGo object classes; CPU, 4 threads, 320px, batch 4, 5 epochs, seed 23, AdamW lr 0.001.',
  f"Training: {pre['training']['train']} images; balanced development val {pre['training']['val']}; full development val {pre['fullValidationImages']}.",
  'results.csv contains exactly 5 optimization epochs. The last raw callback counter 6 is the toolkit final best-checkpoint validation, not a sixth training epoch.',
  'The balanced validation is a SUBSET of full development validation, used for best-checkpoint selection; neither is an independent test.',
  'Whole images containing the nonpriority sink class were excluded, rather than dropping its boxes into background.',
  'Source ambiguity, invalid/empty labels, suspicious layouts, and suspicious geometry were excluded by the pinned preparation gates.',
  'Train caps: 300/class; val caps: 100/class; diverse source groups preferred. Selection frozen before training, never tuned on predictions.',
  'SHA/pixel/pHash<=6/source-family groups do not cross train/validation. Physical camera/session identities remain unavailable.', '',
  'DEVELOPMENT VALIDATION (Ultralytics detection convention; P/R at its selected confidence operating point)',
  f"Balanced: Precision {balanced['precision']:.6f}, Recall {balanced['recall']:.6f}, mAP50 {balanced['mAP50']:.6f}, mAP50-95 {balanced['mAP50_95']:.6f}",
  f"Full: Precision {full['precision']:.6f}, Recall {full['recall']:.6f}, mAP50 {full['mAP50']:.6f}, mAP50-95 {full['mAP50_95']:.6f}",
  'mAP is averaged across represented classes; this is not image classification accuracy. Full validation is dominated by outlet photos.', '',
  'PER CLASS (full source validation)']
 for c in full['perClass']:lines.append(f"{c['name']}: P={c['precision']:.4f} R={c['recall']:.4f} AP50={c['AP50']:.4f} AP50-95={c['AP50_95']:.4f}")
 lines += ['', 'QUALITATIVE COMPARISON',f'{len(records)} fixed images, chosen before predictions: fresh detector and fresh current YOLO-cls+CLIP.',
  'examples.csv and qualitative-comparison.jsonl keep raw YOLO category scores, raw CLIP category scores, fused raw V2 output, and Diagnosis Resolver output SEPARATELY.',
  'Baseline ran in an isolated local ASGI app; resolver ran the existing JS code with frozen TASK03B catalog and legacy symptom flag false. No live production API/DB call.',
  'Different tasks: new detector returns object boxes; old YOLO-cls+CLIP returns image-level category/target suggestions. No equal-task mAP comparison is claimed.',
  'qualitative-selection.classIds are original prepared-v1 indices; comparison sourceBoxes use the remapped 7-class experiment indices.',
  'Example TP/FP/missed counts are only relative to unverified source boxes. Ads/stock photos or incomplete boxes can still be present despite automatic screening.',
  'Green overlays are source boxes (unverified), red overlays are experimental predictions at confidence 0.25 / IoU NMS 0.7.', '',
  'ARTIFACTS','training/weights/best.pt, last.pt; train-config.json, training/args.yaml, results.csv/results.png, train.log.',
  'validation-full_development/ and validation-balanced_development/: confusion matrices, PR curves, fresh predictions JSON, validation batch plots.',
  'selection.jsonl, qualitative-selection.json, data-manifest.json, protected-before/after.json, audit-prepared/audit-postrun.json and experiment-manifest.json.',
  'Original prepared data and raw files revalidated after the experiment. Training caches live only under this experiment.', '',
  'NEXT STEP: curate a group-diverse set of real field photos per object; review uncertain plumbing claims before labeling visible signs such as drip/wetness/crack.',
  'Train visible-sign detection as a separate experiment; do not equate an object detection with a repair cause/service. Keep independently annotated test data separate.']
 (RUN/'REPORT.txt').write_text('\n'.join(lines)+'\n')
 for f in ['task04a.py','task04a_compare.py','task04a_finalize.py','train_prepared.py']:
  p=RUN/'code'/f;p.parent.mkdir(exist_ok=True);shutil.copyfile(REPO/'server/scripts/ai01'/f,p)
 save(RUN/'protected-after.json',protected())
 save(RUN/'status.json',{'phase':'complete','finishedAt':stamp(),'trained':True,'deployed':False,'officialBenchmark':False,'protectedFilesUnchanged':True,'rawAndPreparedRevalidated':True})
 manifest={str(p.relative_to(RUN)):sha(p) for p in RUN.rglob('*') if p.is_file() and p.name!='experiment-manifest.json'}
 save(RUN/'experiment-manifest.json',{'scope':'experimental source-supervised development only','approvedGroundTruth':False,'deployed':False,'files':manifest})
 print(json.dumps({'status':'complete','fullDevelopment':full,'chosenExamples':[r['imageId'] for r in chosen]},ensure_ascii=False))

if __name__=='__main__':main()
