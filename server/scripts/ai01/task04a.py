"""TASK04A: isolated, explicitly requested seven-object CPU experiment. No deploy."""
import argparse
import csv
import gc
import gzip
import hashlib
import importlib.metadata
import json
import os
import platform
import shutil
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
import psutil
import yaml
from train_prepared import validate

REPO=Path(__file__).resolve().parents[3]
PREP=Path.home()/'Work/datasetai/02-development/ai01-prepared-v1'
RAW=Path.home()/'Work/datasetai/01-raw'
RUN=Path.home()/'Work/datasetai/03-experiments/ai01-task04a-v1'
KEEP=[0,2,3,4,5,6,7]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def stamp():return datetime.now(timezone.utc).isoformat()

def resources():
 return {'diskFreeGiB':round(shutil.disk_usage(RUN.parent).free/2**30,3),'ramAvailableGiB':round(psutil.virtual_memory().available/2**30,3),'processRssGiB':round(psutil.Process().memory_info().rss/2**30,3)}

def protected():
 files=list((REPO/'ai-service/weights').glob('*'))
 files += [REPO/'ai-service'/s for s in ['main.py','clip_classifier.py','category_helper.py','target_catalog.py','service_catalog.py']]
 files += list((REPO/'ai-service/recommendation').glob('*.py'))+list((REPO/'server/src/modules/orders/diagnosis').glob('*.js'))
 files += [REPO/'server/prisma/schema.prisma',PREP/'SHA256SUMS.json']
 return {str(p):sha(p) for p in files if p.is_file()}

def select_balanced(rows,limit,remap):
 counts=Counter();selected={};by_class=defaultdict(list)
 for r in rows:
  for c in r['classIds']:by_class[c].append(r)
 for c in sorted(remap,key=lambda c:(len(by_class[c]),c)):
  target=min(limit,len(by_class[c]));groups=set(r['leakageGroup'] for r in selected.values() if c in r['classIds'])
  ranked=sorted(by_class[c],key=lambda r:hashlib.sha256(('task04a-seed23:'+r['id']).encode()).hexdigest())
  for diverse in [True,False]:
   for r in ranked:
    if counts[c]>=target:break
    if r['id'] in selected or (diverse and r['leakageGroup'] in groups):continue
    selected[r['id']]=r;counts.update(r['classIds']);groups.add(r['leakageGroup'])
 return sorted(selected.values(),key=lambda r:r['id'])

def prepare():
 RUN.mkdir(parents=True,exist_ok=False)
 save(RUN/'status.json',{'phase':'audit','startedAt':stamp(),'trained':False,'deployed':False})
 initial=protected();save(RUN/'protected-before.json',initial)
 r=resources()
 if r['diskFreeGiB']<3 or r['ramAvailableGiB']<3:raise RuntimeError('Preflight requires >=3GiB disk and >=3GiB available RAM')
 report=validate(PREP,RAW);save(RUN/'audit-prepared.json',report)
 metadata=json.loads((PREP/'object_detection/class-map.json').read_text());remap={c:i for i,c in enumerate(KEEP)}
 defs={int(i):next(c for c in metadata['classes'] if c['key']==key) for i,key in metadata['classIndexToKey'].items()}
 candidates={'train':[],'val':[]};exclusions=Counter()
 records=[json.loads(l) for l in (PREP/'records.jsonl').read_text().splitlines()]
 by_id={r['id']:r for r in records}
 for row in records:
  if not row['tasks']['object_detection']['included']:continue
  split=row['developmentSplit'];label=PREP/'object_detection/labels'/split/(row['id']+'.txt')
  labels=[list(map(float,l.split())) for l in label.read_text().splitlines()]
  cls={int(l[0]) for l in labels}
  if not cls.issubset(remap):exclusions['whole_images_containing_nonpriority_sink']+=1;continue
  if row['partition']!='development_unverified' or row['errors'] or row['geometryWarnings'] or row['visualCandidates'] or row['duplicateLabelConflict']:raise ValueError('Ineligible image passed preparation gate')
  candidates[split].append(dict(row,classIds=sorted(cls),derivedLabels=labels))
 selected={'train':select_balanced(candidates['train'],300,remap),'val':select_balanced(candidates['val'],100,remap)}
 support={};task_manifest=[]
 for c in KEEP:
  counts={s:sum(c in r['classIds'] for r in selected[s]) for s in selected}
  group_counts={s:len({r['leakageGroup'] for r in selected[s] if c in r['classIds']}) for s in selected}
  if counts['train']<20 or counts['val']<5 or group_counts['train']<2 or group_counts['val']<1:raise ValueError('Priority class lacks trial support: '+defs[c]['slug'])
  support[defs[c]['slug']]=dict(name=defs[c]['name'],**counts,groups=group_counts)
 # Keep original split for full developmental validation, never put a val group in train.
 all_rows={r['id']:r for r in candidates['train']+candidates['val']}
 for field in ['sha256','pixelSha256','sourceFamilyCandidate','leakageGroup']:
  a={r[field] for r in selected['train']};b={r[field] for r in candidates['val']}
  if a&b:raise ValueError('Train/full-validation leakage: '+field)
 train_ids={r['id'] for r in selected['train']};val_ids={r['id'] for r in candidates['val']}
 with gzip.open(PREP/'near-pairs.csv.gz','rt') as f:
  for p in csv.DictReader(f):
   if (p['a_id'] in train_ids and p['b_id'] in val_ids) or (p['b_id'] in train_ids and p['a_id'] in val_ids):raise ValueError('pHash crosses experiment split')
 # Copies isolate Ultralytics' caches from BOTH raw and the immutable prepared run.
 for partition,rows in [('train',selected['train']),('val',selected['val']),('full_val',candidates['val'])]:
  for row in rows:
   source=PREP/'object_detection/images'/row['developmentSplit']/(row['id']+Path(row['path']).suffix.lower())
   dest=RUN/'data/images'/partition/source.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
   if sha(dest)!=row['sha256']:raise ValueError('Copied experiment image mismatch')
   label=RUN/'data/labels'/partition/(row['id']+'.txt');label.parent.mkdir(parents=True,exist_ok=True)
   label.write_text('\n'.join(str(remap[int(a[0])])+' '+' '.join(f'{v:.8f}' for v in a[1:]) for a in row['derivedLabels'])+'\n')
   if partition!='full_val':task_manifest.append({k:row[k] for k in ['id','path','sha256','annotationSha256','leakageGroup','sourceFamilyCandidate','phash','pixelSha256']}|{'split':partition,'classIds':[remap[c] for c in row['classIds']],'approvedGroundTruth':False,'sourceVerification':'unverified'})
 with (RUN/'selection.jsonl').open('x') as f:
  for row in task_manifest:f.write(json.dumps(row,ensure_ascii=False)+'\n')
 names={remap[c]:defs[c]['slug'] for c in KEEP}
 data={'path':str(RUN/'data'),'train':'images/train','val':'images/val','names':names,'description':'TASK04A source-supervised DEVELOPMENT ONLY; NOT independent GT'}
 (RUN/'data.yaml').write_text(yaml.safe_dump(data,sort_keys=False))
 (RUN/'full-validation.yaml').write_text(yaml.safe_dump(dict(data,val='images/full_val'),sort_keys=False))
 save(RUN/'class-map.json',{str(remap[c]):defs[c] for c in KEEP})
 # Fixed qualitative set BEFORE any experimental model predictions: 3 images/class.
 qual={}
 for c in KEEP:
  groups=set()
  for row in sorted(selected['val'],key=lambda r:hashlib.sha256(('qual23:'+r['id']).encode()).hexdigest()):
   if c in row['classIds'] and row['leakageGroup'] not in groups:
    qual[row['id']]={k:row[k] for k in ['id','path','sha256','classIds','leakageGroup']};groups.add(row['leakageGroup'])
    if len(groups)>=3:break
 save(RUN/'qualitative-selection.json',list(qual.values()))
 cfg={'model':str(REPO/'ai-service/weights/yolov8n.pt'),'task':'detect','data':str(RUN/'data.yaml'),'epochs':5,'imgsz':320,'batch':4,'device':'cpu','workers':0,'cache':False,
      'optimizer':'AdamW','lr0':.001,'nbs':16,'weight_decay':.0005,'warmup_epochs':.5,'cos_lr':True,'seed':23,'deterministic':True,'amp':False,
      'mosaic':.5,'close_mosaic':1,'mixup':0.0,'save':True,'save_period':-1,'plots':True,'patience':10,'project':str(RUN),'name':'training','exist_ok':False,'verbose':False}
 save(RUN/'train-config.json',cfg)
 save(RUN/'preflight.json',{'status':'passed','resources':r,'python':sys.version,'platform':platform.platform(),'cpuThreads':4,
    'dependencies':{p:importlib.metadata.version(p) for p in ['torch','torchvision','ultralytics','opencv-python-headless','numpy']},
    'initialWeightsSha256':sha(Path(cfg['model'])),'preparedManifestSha256':sha(PREP/'SHA256SUMS.json'),'training':{s:len(v) for s,v in selected.items()},
    'fullValidationImages':len(candidates['val']),'support':support,'exclusions':dict(exclusions),'balancedCaps':{'trainPerClass':300,'valPerClass':100},
    'selectionRule':'frozen seed23 and source group diversity; never tuned using predictions','allLeakageChecksPassed':True,'officialBenchmark':False,'approvedGroundTruth':False})
 save(RUN/'data-manifest.json',{str(p.relative_to(RUN)):sha(p) for p in (RUN/'data').rglob('*') if p.is_file()})
 print('PREFLIGHT_PASSED',json.dumps({'support':support,'resources':resources()},ensure_ascii=False),flush=True)

def runtime():
 os.environ.update(YOLO_OFFLINE='true',HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',YOLO_CONFIG_DIR=str(RUN/'runtime-config'),OMP_NUM_THREADS='4',MKL_NUM_THREADS='4',MPLBACKEND='Agg')
 (RUN/'runtime-config').mkdir(exist_ok=True)
 font=Path.home()/'.config/Ultralytics/Arial.ttf'
 if font.exists():shutil.copyfile(font,RUN/'runtime-config/Arial.ttf')
 import torch
 torch.set_num_threads(4);torch.set_num_interop_threads(1)
 from ultralytics import settings
 settings.update({k:False for k in ['sync','clearml','comet','dvc','mlflow','raytune','tensorboard','wandb']})
 return torch

def metrics_dict(metrics):
 return {'precision':float(metrics.box.mp),'recall':float(metrics.box.mr),'mAP50':float(metrics.box.map50),'mAP50_95':float(metrics.box.map),
         'perClass':[{'classId':int(cid),'name':metrics.names[int(cid)],'precision':float(metrics.box.p[j]),'recall':float(metrics.box.r[j]),'AP50':float(metrics.box.ap50[j]),'AP50_95':float(metrics.box.ap[j])} for j,cid in enumerate(metrics.box.ap_class_index)],
         'scope':'development validation against UNVERIFIED source boxes; not independent accuracy/F1','speed':metrics.speed}

def train():
 torch=runtime();from ultralytics import YOLO
 cfg=json.loads((RUN/'train-config.json').read_text());model=YOLO(cfg.pop('model'))
 if model.task!='detect':raise ValueError('Base weights are not a detector')
 if torch.cuda.is_available():print('CUDA present but CPU was explicitly frozen for this run',flush=True)
 # A pure forward sanity check, before any optimization.
 with torch.inference_mode():model.model.eval()(torch.zeros(1,3,320,320))
 print('FORWARD_OK',json.dumps(resources()),flush=True)
 if resources()['ramAvailableGiB']<2 or resources()['diskFreeGiB']<2.5:raise RuntimeError('Insufficient reserve after forward check; stopped before training')
 samples=[]
 def guard(trainer):
  r=resources()
  if r['diskFreeGiB']<2 or r['ramAvailableGiB']<.75:raise RuntimeError('Resource reserve breached; stop experimental run')
 def epoch(trainer):
  r=resources();event={'epoch':trainer.epoch+1,'timestamp':stamp(),'resources':r,'metrics':{k:float(v) for k,v in (trainer.metrics or {}).items()}}
  samples.append(event);save(RUN/'progress.json',{'phase':'training','epochs':samples})
  print('TASK04A_EPOCH',json.dumps(event),flush=True)
 model.add_callback('on_train_batch_start',guard);model.add_callback('on_fit_epoch_end',epoch)
 save(RUN/'status.json',{'phase':'training','startedAt':stamp(),'trained':False,'deployed':False})
 model.train(**cfg)
 save(RUN/'status.json',{'phase':'trained','finishedAt':stamp(),'trained':True,'deployed':False})
 del model;gc.collect()

def evaluate():
 runtime();from ultralytics import YOLO
 best=RUN/'training/weights/best.pt'
 if not best.is_file():raise RuntimeError('No completed candidate weights')
 model=YOLO(str(best))
 for scope,config in [('balanced_development','data.yaml'),('full_development','full-validation.yaml')]:
  metrics=model.val(data=str(RUN/config),imgsz=320,batch=4,device='cpu',workers=0,conf=.001,iou=.7,max_det=300,
                    plots=True,save_json=True,project=str(RUN),name='validation-'+scope,exist_ok=False,verbose=False)
  save(RUN/(scope+'-metrics.json'),metrics_dict(metrics))
  print('TASK04A_METRICS',scope,json.dumps(metrics_dict(metrics)),flush=True)
 initial=json.loads((RUN/'protected-before.json').read_text());after=protected()
 if initial!=after:raise RuntimeError('Protected production/prepared files changed')
 save(RUN/'protected-after.json',after)
 save(RUN/'status.json',{'phase':'evaluated_development','finishedAt':stamp(),'trained':True,'deployed':False,'protectedFilesUnchanged':True,'officialBenchmark':False})

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',choices=['prepare','train','evaluate']);a=p.parse_args()
 try:{'prepare':prepare,'train':train,'evaluate':evaluate}[a.stage]()
 except Exception as e:
  if RUN.exists():save(RUN/'failure.json',{'stage':a.stage,'type':type(e).__name__,'message':str(e),'at':stamp()})
  raise
