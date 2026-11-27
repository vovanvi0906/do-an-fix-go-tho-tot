#!/usr/bin/env python3
"""CPU training experiment, preserving user-reviewed labels and development split."""
import os
for k in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[k]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-training-ultralytics')
import argparse,hashlib,json,time
from pathlib import Path
import torch
from ultralytics import YOLO
import ultralytics
ROOT=Path('/home/vanvi/Work/datasetai')
DATA=ROOT/'02-curated/fixgo-signs-dev-v2/data.yaml'
WEIGHTS=Path(__file__).resolve().parents[2]/'ai-service/weights/yolov8n.pt'
OUT=ROOT/'04-training/signs-managed-v1'

def fingerprint():
    folder=DATA.parent
    return {str(p.relative_to(folder)):hashlib.sha256(p.read_bytes()).hexdigest() for pattern in ['data.yaml','labels/train/*.txt','labels/val/*.txt','images/train/*','images/val/*'] for p in sorted(folder.glob(pattern)) if p.is_file()}

def main():
    p=argparse.ArgumentParser();p.add_argument('--experiment',choices=['frozen','finetune'],required=True);a=p.parse_args()
    torch.set_num_threads(2)
    OUT.mkdir(parents=True,exist_ok=True);pin=OUT/'data-pin.json';before=fingerprint()
    if pin.exists():assert json.loads(pin.read_text())==before,'Dataset changed; use a new experiment'
    else:pin.write_text(json.dumps(before,indent=2)+'\n')
    settings={'frozen':dict(freeze=10,lr0=.001,epochs=40),'finetune':dict(freeze=0,lr0=.0001,epochs=40)}[a.experiment]
    initialization=WEIGHTS if a.experiment=='frozen' else ROOT/'04-training/signs-smoke-v1/weights/best.pt'
    start=time.time();model=YOLO(str(initialization))
    model.train(data=str(DATA),device='cpu',workers=0,batch=4,imgsz=480,optimizer='AdamW',lrf=.1,weight_decay=.0005,warmup_epochs=3,warmup_bias_lr=.01,
                mosaic=0,mixup=0,scale=.1,translate=.05,fliplr=.5,hsv_h=.01,hsv_s=.3,hsv_v=.2,
                patience=15,seed=42,deterministic=True,plots=True,project=str(OUT),name=a.experiment,exist_ok=False,**settings)
    assert fingerprint()==before,'Data changed while training'
    result={'experiment':a.experiment,'elapsedSeconds':round(time.time()-start,2),'settings':settings,'initialWeights':str(initialization),'initialWeightsSha256':hashlib.sha256(initialization.read_bytes()).hexdigest(),'imgsz':480,'modelPath':str(Path(model.trainer.save_dir)/'weights/best.pt'),'datasetUnchanged':True,'ultralytics':ultralytics.__version__,'torch':torch.__version__,'independentTest':False}
    (OUT/(a.experiment+'-run.json')).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if __name__=='__main__':main()
