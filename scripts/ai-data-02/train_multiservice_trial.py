#!/usr/bin/env python3
"""Bounded sequential CPU experiments on immutable AI-screened data."""
import os
for name in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[name]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import argparse,hashlib,json,time
from pathlib import Path
import torch,ultralytics
from ultralytics import YOLO
from multiservice_data import BASE
DATA=BASE/'02-curated/fixgo-multiservice-ai-v1/data.yaml'
OUT=BASE/'04-training/fixgo-multiservice-v1'

def pin_data():
    return {str(p.relative_to(DATA.parent)):hashlib.sha256(p.read_bytes()).hexdigest() for pattern in ['data.yaml','images/*/*','labels/*/*.txt'] for p in sorted(DATA.parent.glob(pattern)) if p.is_file()}

def main():
    p=argparse.ArgumentParser();p.add_argument('--stage',choices=['head','finetune'],required=True);a=p.parse_args();torch.set_num_threads(2)
    OUT.mkdir(parents=True,exist_ok=True)
    if (OUT/(a.stage+'-run.json')).exists():raise ValueError('Stage already completed; use a new trial version')
    before=pin_data();pin=OUT/'data-pin.json'
    if pin.exists():assert json.loads(pin.read_text())==before,'Data changed'
    else:pin.write_text(json.dumps(before,indent=2)+'\n')
    if a.stage=='head':initial=Path(__file__).resolve().parents[2]/'ai-service/weights/yolov8n.pt';settings={'epochs':20,'freeze':10,'lr0':.001}
    else:initial=Path(json.loads((OUT/'head-run.json').read_text())['weights']);settings={'epochs':15,'freeze':0,'lr0':.0001}
    started=time.time();model=YOLO(str(initial))
    model.train(data=str(DATA),device='cpu',imgsz=320,batch=8,workers=0,optimizer='AdamW',lrf=.1,weight_decay=.0005,warmup_epochs=2,warmup_bias_lr=(.01 if a.stage=='head' else .0001),
                mosaic=0,mixup=0,scale=.15,translate=.05,fliplr=.5,hsv_h=.01,hsv_s=.3,hsv_v=.2,patience=6,seed=42,deterministic=True,
                plots=True,project=str(OUT),name=a.stage,exist_ok=False,**settings)
    assert pin_data()==before,'Training data changed'
    report={'stage':a.stage,'weights':str(Path(model.trainer.save_dir)/'weights/best.pt'),'settings':settings,'initialWeights':str(initial),'initialWeightsSha256':hashlib.sha256(initial.read_bytes()).hexdigest(),'elapsedSeconds':round(time.time()-started,1),'ultralytics':ultralytics.__version__,'torch':torch.__version__,'dataUnchanged':True,'labelStatus':'AI_UNVERIFIED','independentTest':False}
    (OUT/(a.stage+'-run.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
if __name__=='__main__':main()
