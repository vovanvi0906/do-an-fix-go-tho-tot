#!/usr/bin/env python3
"""Train isolated higher-resolution research candidate; no automatic activation."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='4'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import json,time
from pathlib import Path
import torch
from ultralytics import YOLO
from multiservice_data import BASE,sha
from prepare_observable_v2 import OUT as DATA
OUT=BASE/'04-training/fixgo-observable-v2'

def verify():
    pins=json.loads((DATA/'SHA256SUMS.json').read_text())
    if not all(sha((DATA/p).read_bytes())==digest for p,digest in pins.items()):raise ValueError('Candidate data changed')

def main():
    if OUT.exists():raise ValueError('Training version already exists')
    verify();torch.set_num_threads(4);OUT.mkdir(parents=True)
    bundle=BASE/'05-models/fixgo-observable-v1';m=json.loads((bundle/'model-manifest.json').read_text());weights=bundle/m['weights']
    if sha(weights.read_bytes())!=m['weightsSha256']:raise ValueError('Parent weights changed')
    settings={'epochs':20,'patience':5,'imgsz':416,'batch':8,'device':'cpu','workers':0,'optimizer':'AdamW','lr0':.0002,'lrf':.1,'weight_decay':.0005,'warmup_epochs':2,'warmup_bias_lr':.0002,'freeze':0,'mosaic':0,'mixup':0,'scale':.15,'translate':.05,'fliplr':.5,'hsv_h':.01,'hsv_s':.3,'hsv_v':.2,'seed':42,'deterministic':True}
    (OUT/'request.json').write_text(json.dumps({'parentWeightsSha256':m['weightsSha256'],'dataPinsSha256':sha((DATA/'SHA256SUMS.json').read_bytes()),'settings':settings,'status':'RESEARCH_ONLY_NOT_PRODUCTION'},indent=2)+'\n')
    start=time.time();model=YOLO(str(weights));model.train(data=str(DATA/'data.yaml'),project=str(OUT),name='candidate',plots=True,exist_ok=False,**settings);verify()
    report={'weights':str(Path(model.trainer.save_dir)/'weights/best.pt'),'elapsedSeconds':round(time.time()-start,1),'dataUnchanged':True,'labelStatus':'AI_AND_SOURCE_UNVERIFIED','productionActivated':False}
    (OUT/'run.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)

if __name__=='__main__':main()
