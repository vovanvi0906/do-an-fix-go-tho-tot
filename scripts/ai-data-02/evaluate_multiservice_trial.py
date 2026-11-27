#!/usr/bin/env python3
"""Evaluate experimental sign models against AI/source labels; package local candidate."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import collections,hashlib,json,shutil,time
from pathlib import Path
import torch,yaml
from ultralytics import YOLO
from train_multiservice_trial import DATA,OUT,pin_data
from multiservice_data import BASE

def overlap(a,b):
    x=max(0,min(a[2],b[2])-max(a[0],b[0]));y=max(0,min(a[3],b[3])-max(a[1],b[1]));inter=x*y
    return inter/max(1e-12,(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-inter)

def measure(predictions,truth,threshold,names):
    if set(predictions)!=set(truth):raise ValueError('Prediction/truth image IDs differ')
    per=collections.defaultdict(lambda:collections.Counter(TP=0,FP=0,FN=0));negative_images=0;negative_alerts=0
    for image_id,boxes in predictions.items():
        labels=truth[image_id];matched=set();accepted=[b for b in boxes if b['score']>=threshold]
        if not labels:negative_images+=1;negative_alerts+=bool(accepted)
        for b in sorted(accepted,key=lambda x:x['score'],reverse=True):
            choices=[(overlap(b['xyxy'],g['xyxy']),i) for i,g in enumerate(labels) if i not in matched and b['classId']==g['classId']]
            best=max(choices,default=(0,-1))
            if best[0]>=.5:matched.add(best[1]);per[b['classId']]['TP']+=1
            else:per[b['classId']]['FP']+=1
        for i,g in enumerate(labels):
            if i not in matched:per[g['classId']]['FN']+=1
    totals=collections.Counter()
    for counts in per.values():totals.update(counts)
    def calc(c):
        tp,fp,fn=c['TP'],c['FP'],c['FN'];p=tp/max(1,tp+fp);r=tp/max(1,tp+fn)
        return {**dict(c),'precision':p,'recall':r,'F1':2*p*r/max(1e-12,p+r)}
    return {'confidence':threshold,'IoU':.5,**calc(totals),'negativeImages':negative_images,'negativeImagesWithAlerts':negative_alerts,'perClass':{names[k]:calc(per[k]) for k in names}}

def main():
    torch.set_num_threads(2);assert pin_data()==json.loads((OUT/'data-pin.json').read_text())
    dataset=json.loads((DATA.parent/'manifest.json').read_text());names=yaml.safe_load(DATA.read_text())['names'];scores=[]
    truth={}
    for path in (DATA.parent/'labels/val').glob('*.txt'):
        gs=[]
        for line in path.read_text().splitlines():
            cls,x,y,w,h=map(float,line.split());gs.append({'classId':int(cls),'xyxy':[x-w/2,y-h/2,x+w/2,y+h/2]})
        truth[path.stem]=gs
    for stage in ['head','finetune']:
        run=OUT/(stage+'-run.json')
        if not run.exists():continue
        weights=Path(json.loads(run.read_text())['weights'])
        for imgsz in [320,480]:
            model=YOLO(str(weights));m=model.val(data=str(DATA),split='val',imgsz=imgsz,batch=8,device='cpu',workers=0,plots=False,project=str(OUT/'evaluation'),name=stage+'-'+str(imgsz),exist_ok=False,verbose=False)
            per=[]
            for i,cls in enumerate(m.box.ap_class_index):per.append({'class':names[int(cls)],'precision':float(m.box.p[i]),'recall':float(m.box.r[i]),'mAP50':float(m.box.ap50[i]),'mAP50_95':float(m.box.ap[i].mean())})
            scores.append({'stage':stage,'imgsz':imgsz,'weights':str(weights),'sha256':hashlib.sha256(weights.read_bytes()).hexdigest(),'mAP50':float(m.box.map50),'mAP50_95':float(m.box.map),'precision':float(m.box.mp),'recall':float(m.box.mr),'classes':per,'speedMs':m.speed})
    scores.sort(key=lambda r:(r['mAP50_95'],r['mAP50']),reverse=True);chosen=scores[0];model=YOLO(chosen['weights']);assert model.names==names
    predictions={};latencies=[]
    for p in model.predict(source=str(DATA.parent/'images/val'),imgsz=chosen['imgsz'],conf=.05,device='cpu',save=False,verbose=False,stream=True):
        predictions[Path(p.path).stem]=[{'classId':int(c),'score':float(s),'xyxy':xy} for c,s,xy in zip(p.boxes.cls.tolist(),p.boxes.conf.tolist(),p.boxes.xyxyn.tolist())];latencies.append(p.speed['inference'])
    (OUT/'validation-predictions.json').write_text(json.dumps({'status':'DEVELOPMENT_VALIDATION_ONLY','classes':names,'minimumConfidence':.05,'predictions':predictions},indent=2)+'\n')
    thresholds=[measure(predictions,truth,t,names) for t in [.1,.15,.2,.25,.3,.4,.5,.6,.7,.8]]
    best=max(thresholds,key=lambda r:(r['F1'],r['precision']));bundle=BASE/'05-models/fixgo-observable-v1'
    if bundle.exists():raise ValueError('Model bundle exists')
    (bundle/'weights').mkdir(parents=True);shutil.copy2(chosen['weights'],bundle/'weights/best.pt');shutil.copy2(DATA.parent/'taxonomy.json',bundle/'taxonomy.json');shutil.copy2(DATA.parent/'ATTRIBUTION.txt',bundle/'ATTRIBUTION.txt')
    original_ontology=json.loads((Path(__file__).resolve().parents[2]/'docs/ai-data-audit/evidence/ontology.json').read_text())
    for c in dataset['taxonomy']['classes']:original_ontology['signs'][c['code']]={'name':c['displayNameVi'],'evidenceRule':c['definition'],'status':'EXPERIMENTAL_AI_LABEL_SEMANTICS'}
    (bundle/'ontology.json').write_text(json.dumps(original_ontology,ensure_ascii=False,indent=2)+'\n')
    classes=[{'kind':'sign','code':names[i].removeprefix('sign:'),'name':names[i]} for i in sorted(names)]
    manifest={'schema':'fixgo.studio.pseudo-detector.v1','task':'detect','weights':'weights/best.pt','weightsSha256':chosen['sha256'],'classes':classes,'threshold':best['confidence'],'imgsz':chosen['imgsz'],'ontologyPath':'ontology.json','taxonomyPath':'taxonomy.json','labelStatus':'AI_UNVERIFIED','status':'EXPERIMENTAL_NOT_DEPLOYED','independentTest':False,'note':'New class codes require the bundled experimental ontology. Do not silently load into an older Studio ontology. Confidence selected on development validation; not calibrated probability.'}
    (bundle/'model-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    report={'schema':'fixgo.multiservice-training-report.v1','datasetSummary':dataset['summary'],'labelStatus':'AI_UNVERIFIED','independentTest':False,'scores':scores,'selected':chosen,'operatingPoint':best,'thresholdSearch':thresholds,'meanInferenceMs':sum(latencies)/len(latencies),'dataUnchanged':pin_data()==json.loads((OUT/'data-pin.json').read_text()),'modelBundle':str(bundle),'limitations':['Validation labels are source/AI proposals, not independent expert ground truth.','Validation reused to select checkpoint, size and threshold. Scores may be optimistic.','No new unseen real-world test; not evidence of fault diagnosis.','New observable class ontology staged in bundle, production code/database unchanged.','Source licenses and visible watermark findings preserved in dataset manifest; remaining per-item rights not verified.','Rare classes can have only a few validation examples.']}
    (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(bundle/'evaluation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'bundle':str(bundle),'selected':chosen,'operatingPoint':best,'dataUnchanged':report['dataUnchanged']},indent=2))
if __name__=='__main__':main()
