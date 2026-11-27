#!/usr/bin/env python3
"""Compare local candidates on the same development validation split, not test."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-training-ultralytics')
import hashlib,json,shutil
from pathlib import Path
import torch,yaml
from ultralytics import YOLO
from train_signs_trial import DATA,OUT,fingerprint

def main():
    torch.set_num_threads(2);assert fingerprint()==json.loads((OUT/'data-pin.json').read_text())
    candidates={'baseline_5epochs':OUT.parent/'signs-smoke-v1/weights/best.pt','baseline_50epochs':OUT.parent/'signs-50epochs-v1/weights/best.pt'}
    for name in ['frozen','finetune']:
        p=OUT/(name+'-run.json')
        if p.exists():candidates[name]=Path(json.loads(p.read_text())['modelPath'])
    names=yaml.safe_load(DATA.read_text())['names'];val=DATA.parent/'images/val';labels=DATA.parent/'labels/val';counts={i:0 for i in names}
    for p in labels.glob('*.txt'):
        for line in p.read_text().splitlines():counts[int(line.split()[0])]+=1
    scores=[]
    expanded={name+'_'+str(size):(path,size) for name,path in candidates.items() for size in [320,480]}
    for name,(path,imgsz) in expanded.items():
        model=YOLO(str(path));metrics=model.val(data=str(DATA),split='val',imgsz=imgsz,batch=4,device='cpu',workers=0,plots=False,project=str(OUT/'evaluation'),name=name,exist_ok=False,verbose=False)
        row={'name':name,'imgsz':imgsz,'model':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'precision':float(metrics.box.mp),'recall':float(metrics.box.mr),'mAP50':float(metrics.box.map50),'mAP50_95':float(metrics.box.map),'classes':[]}
        for index,cls in enumerate(metrics.box.ap_class_index):row['classes'].append({'class':names[int(cls)],'validationInstances':counts[int(cls)],'precision':float(metrics.box.p[index]),'recall':float(metrics.box.r[index]),'mAP50':float(metrics.box.ap50[index])})
        prediction=model.predict(source=str(val),imgsz=imgsz,conf=.25,device='cpu',verbose=False,save=False)
        negatives=[];positives=[]
        for pred in prediction:
            p=Path(pred.path);count=len(pred.boxes);record={'image':p.name,'detections':count}
            (negatives if not (labels/(p.stem+'.txt')).read_text().strip() else positives).append(record)
        row['fixedConf025']={'negativeImages':len(negatives),'negativeImagesWithDetections':sum(r['detections']>0 for r in negatives),'detectionsOnNegativeImages':sum(r['detections'] for r in negatives),'positiveImages':len(positives),'positiveImagesWithDetections':sum(r['detections']>0 for r in positives)}
        scores.append(row)
    scores.sort(key=lambda x:(x['mAP50_95'],x['mAP50']),reverse=True);best=scores[0]
    selected=OUT/'selected';selected.mkdir(exist_ok=True);shutil.copy2(best['model'],selected/'best.pt')
    report={'evaluation':'development validation reused for model selection, NOT independent test','evaluatedImageSizes':[320,480],'validationImages':12,'validationInstances':counts,'rankingMetric':'mAP50_95 then mAP50','scores':scores,'selected':best,'datasetUnchanged':fingerprint()==json.loads((OUT/'data-pin.json').read_text()),'limitations':['Only 7 validation instances; scores highly uncertain.','burn_mark absent from validation; no accuracy claim for that class.','No label re-review or relabeling performed.','Confidence 0.25 diagnostics are operating-point counts, not mAP precision/recall.','Selected model not deployed to production or Studio.']}
    (OUT/'comparison.json').write_text(json.dumps(report,indent=2)+'\n');(selected/'selection.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
