#!/usr/bin/env python3
"""Stable 320px head adaptation on candidate data, starting from the better v1 model."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import json,time
from pathlib import Path
import torch
from ultralytics import YOLO
from multiservice_data import BASE,sha
from train_observable_v2 import DATA,verify
OUT=BASE/'04-training/fixgo-observable-v3-stable'

def freeze_backbone_statistics(trainer):
    for layer in trainer.model.model[:10]:layer.eval()

def main():
    if OUT.exists():raise ValueError('Trial exists')
    verify();torch.set_num_threads(2);OUT.mkdir(parents=True);bundle=BASE/'05-models/fixgo-observable-v1';m=json.loads((bundle/'model-manifest.json').read_text());initial=bundle/m['weights']
    if sha(initial.read_bytes())!=m['weightsSha256']:raise ValueError('Parent weights changed')
    settings={'epochs':12,'patience':4,'imgsz':320,'batch':8,'device':'cpu','workers':0,'optimizer':'AdamW','lr0':.0001,'lrf':.1,'weight_decay':.0005,'warmup_epochs':1,'warmup_bias_lr':.0001,'freeze':10,'mosaic':0,'mixup':0,'scale':.05,'translate':.02,'fliplr':.5,'hsv_h':.01,'hsv_s':.2,'hsv_v':.15,'seed':42,'deterministic':True}
    request={'parentWeightsSha256':m['weightsSha256'],'dataPinsSha256':sha((DATA/'SHA256SUMS.json').read_bytes()),'settings':settings,'frozenBackboneBatchNorm':True,'newTestUnexposed':True,'purpose':'Follow-up development experiment after v2 regression, not primary activation.'}
    (OUT/'request.json').write_text(json.dumps(request,indent=2)+'\n')
    start=time.time();model=YOLO(str(initial));model.add_callback('on_train_batch_start',freeze_backbone_statistics)
    model.train(data=str(DATA/'data.yaml'),project=str(OUT),name='candidate',plots=True,exist_ok=False,**settings);verify()
    (OUT/'run.json').write_text(json.dumps({'weights':str(Path(model.trainer.save_dir)/'weights/best.pt'),'elapsedSeconds':time.time()-start,'dataUnchanged':True,'productionActivated':False},indent=2)+'\n')

if __name__=='__main__':main()
