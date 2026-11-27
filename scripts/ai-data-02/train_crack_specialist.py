#!/usr/bin/env python3
"""Research-only crack specialist from reviewed scopes and manual source masks."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import json,time
import torch
from ultralytics import YOLO
from multiservice_data import BASE,sha
from prepare_crack_specialist import OUT as DATA
OUT=BASE/'04-training/fixgo-crack-reviewed-v5'

def verify():
    for path,digest in json.loads((DATA/'SHA256SUMS.json').read_text()).items():
        if sha((DATA/path).read_bytes())!=digest:raise ValueError('Data changed')

def main():
    if OUT.exists():raise ValueError('Run already exists')
    verify();torch.set_num_threads(2);OUT.mkdir(parents=True)
    weights=__import__('pathlib').Path(__file__).resolve().parents[2]/'ai-service/weights/yolov8n.pt'
    settings={'epochs':25,'patience':7,'imgsz':416,'batch':8,'device':'cpu','workers':0,'optimizer':'AdamW','lr0':.001,'lrf':.1,'weight_decay':.0005,'warmup_epochs':2,'warmup_bias_lr':.001,'freeze':10,'mosaic':0,'mixup':0,'scale':.1,'translate':.03,'fliplr':.5,'hsv_h':.01,'hsv_s':.2,'hsv_v':.2,'seed':42,'deterministic':True}
    (OUT/'request.json').write_text(json.dumps({'initialWeightsSha256':sha(weights.read_bytes()),'dataPinsSha256':sha((DATA/'SHA256SUMS.json').read_bytes()),'settings':settings,'scope':'crack only; not a category/device model replacement','productionActivated':False},indent=2)+'\n')
    start=time.time();model=YOLO(str(weights));model.train(data=str(DATA/'data.yaml'),project=str(OUT),name='candidate',exist_ok=False,plots=True,**settings);verify()
    (OUT/'run.json').write_text(json.dumps({'weights':str(model.trainer.save_dir/'weights/best.pt'),'elapsedSeconds':time.time()-start,'productionActivated':False},indent=2)+'\n')
if __name__=='__main__':main()
