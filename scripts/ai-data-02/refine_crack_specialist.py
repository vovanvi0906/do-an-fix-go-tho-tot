#!/usr/bin/env python3
"""Short full-backbone refinement; select between stages on development validation only."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import json,time
from pathlib import Path
import torch
from ultralytics import YOLO
from multiservice_data import sha
from train_crack_specialist import OUT,DATA,verify

def main():
    output=OUT/'refinement-run.json'
    if output.exists() or (OUT/'refinement').exists():raise ValueError('Refinement already exists')
    verify();torch.set_num_threads(2);initial=Path(json.loads((OUT/'run.json').read_text())['weights'])
    settings={'epochs':8,'patience':4,'imgsz':416,'batch':8,'device':'cpu','workers':0,'optimizer':'AdamW','lr0':.0001,'lrf':.1,'weight_decay':.0005,'warmup_epochs':1,'warmup_bias_lr':.0001,'freeze':0,'mosaic':0,'mixup':0,'scale':.05,'translate':.02,'fliplr':.5,'hsv_h':.01,'hsv_s':.2,'hsv_v':.15,'seed':42,'deterministic':True}
    (OUT/'refinement-request.json').write_text(json.dumps({'initialWeightsSha256':sha(initial.read_bytes()),'settings':settings,'purpose':'Evaluate whether adapting crack features helps recall/precision; no test-based selection.'},indent=2)+'\n')
    start=time.time();model=YOLO(str(initial));model.train(data=str(DATA/'data.yaml'),project=str(OUT),name='refinement',exist_ok=False,plots=True,**settings);verify()
    output.write_text(json.dumps({'weights':str(model.trainer.save_dir/'weights/best.pt'),'elapsedSeconds':time.time()-start,'productionActivated':False},indent=2)+'\n')
if __name__=='__main__':main()
