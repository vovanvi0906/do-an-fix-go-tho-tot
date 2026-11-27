#!/usr/bin/env python3
"""Train a small scoped research expert; no independent or production accuracy claim."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import argparse,json,shutil,time
from pathlib import Path
import torch
from ultralytics import YOLO
import ultralytics.utils.torch_utils as torch_utils
from multiservice_data import BASE,sha
from evaluate_multiservice_trial import measure
from evaluate_crack_specialist import labels
ROOT=Path(__file__).resolve().parents[2]
META={'burn_mark':('Vết nghi cháy/xém','Vùng có dấu cháy/xém nhìn thấy; không kết luận chập điện hay nguyên nhân.'),'water_spray':('Tia/dòng nước nhìn thấy','Tia hoặc dòng nước nhìn thấy; chưa kết luận nguồn rò hoặc thiết bị hỏng.'),'surface_soiling':('Bụi/bẩn bám','Vùng có bụi, xơ hoặc chất bẩn nhìn thấy; không kết luận thiết bị hỏng.')}

def main(code):
    data=BASE/'02-curated/fixgo-service-specialists-v1'/code;out=BASE/'04-training/service-specialists-v1'/code;bundle=BASE/'05-models'/('fixgo-'+code+'-v1')
    if out.exists() or bundle.exists():raise ValueError('Version exists')
    pins=json.loads((data/'SHA256SUMS.json').read_text());assert all(sha((data/p).read_bytes())==d for p,d in pins.items());out.mkdir(parents=True);torch_utils.NUM_THREADS=2;torch.set_num_threads(2)
    settings={'epochs':25 if code=='water_spray' else 35,'patience':7,'imgsz':320,'batch':8,'device':'cpu','workers':0,'optimizer':'AdamW','lr0':.001,'lrf':.1,'weight_decay':.0005,'warmup_epochs':1,'warmup_bias_lr':.001,'freeze':10,'mosaic':0,'mixup':0,'scale':.05,'translate':.02,'fliplr':.5,'hsv_h':.01,'hsv_s':.2,'hsv_v':.15,'seed':42,'deterministic':True}
    initial=ROOT/'ai-service/weights/yolov8n.pt';(out/'request.json').write_text(json.dumps({'initialWeightsSha256':sha(initial.read_bytes()),'dataPinsSha256':sha((data/'SHA256SUMS.json').read_bytes()),'settings':settings},indent=2)+'\n');start=time.time();model=YOLO(str(initial));model.train(data=str(data/'data.yaml'),project=str(out),name='candidate',exist_ok=False,plots=True,**settings)
    weights=Path(model.trainer.save_dir)/'weights/best.pt';model=YOLO(str(weights));pred={}
    for p in model.predict(source=str(data/'images/val'),imgsz=320,conf=.05,device='cpu',stream=True,verbose=False,save=False):pred[Path(p.path).stem]=[{'classId':0,'score':float(s),'xyxy':xy} for s,xy in zip(p.boxes.conf.tolist(),p.boxes.xyxyn.tolist())]
    truth=labels(data/'labels/val');search=[measure(pred,truth,t,{0:'sign:'+code}) for t in [.1,.15,.2,.25,.3,.4,.5,.6,.7,.8]];best=max(search,key=lambda r:(r['F1'],r['precision']));assert all(sha((data/p).read_bytes())==d for p,d in pins.items())
    report={'scope':code,'dataCounts':json.loads((data/'manifest.json').read_text())['counts'],'operatingPoint':best,'thresholdSearch':search,'elapsedSeconds':time.time()-start,'independentTest':False,'productionValidated':False,'labelStatus':'AI_VISUAL_REVIEW_NOT_EXPERT_VERIFIED','limitations':['Very small reused development validation; performance can be optimistic.','No claim of independent accuracy or approved service diagnosis.']}
    (out/'evaluation.json').write_text(json.dumps(report,indent=2)+'\n');(out/'validation-predictions.json').write_text(json.dumps(pred,indent=2)+'\n');(bundle/'weights').mkdir(parents=True);shutil.copy2(weights,bundle/'weights/best.pt')
    old=BASE/'05-models/fixgo-observable-v1';ontology=json.loads((old/'ontology.json').read_text());ontology.setdefault('signs',{})[code]={'name':META[code][0],'evidenceRule':META[code][1],'status':'EXPERIMENTAL_AI_LABEL_SEMANTICS'};(bundle/'ontology.json').write_text(json.dumps(ontology,ensure_ascii=False,indent=2)+'\n');(bundle/'taxonomy.json').write_text(json.dumps({'classes':[{'code':code,'displayNameVi':META[code][0],'definition':META[code][1]}]},ensure_ascii=False,indent=2)+'\n')
    manifest={'schema':'fixgo.studio.pseudo-detector.v1','task':'detect','status':'EXPERIMENTAL_NOT_DEPLOYED','labelStatus':'AI_UNVERIFIED','weights':'weights/best.pt','weightsSha256':sha(weights.read_bytes()),'taxonomyPath':'taxonomy.json','ontologyPath':'ontology.json','imgsz':320,'threshold':best['confidence'],'classes':[{'kind':'sign','code':code,'name':'sign:'+code}],'independentTest':False,'note':'Small scoped research expert; not expert-verified or production validated.'};(bundle/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(bundle/'evaluation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'code':code,'operatingPoint':best},indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('code',choices=list(META));main(p.parse_args().code)
