#!/usr/bin/env python3
"""Compare crack specialist with previous multiservice model; reserve tests on regression."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import json,shutil,time
from pathlib import Path
import torch
from ultralytics import YOLO
from multiservice_data import BASE,sha
from evaluate_multiservice_trial import measure
from train_crack_specialist import OUT,DATA,verify
TEST=BASE/'03-tests/deepcrack-reserved-v2-clean'

def eligible_for_reserved_test(candidate,baseline):
    # Proposed development targets; passing does not establish deployment readiness.
    return (candidate['F1']>baseline['F1'] and candidate['recall']>=baseline['recall']
            and candidate['precision']>=.8 and candidate['recall']>=.8
            and candidate['negativeImagesWithAlerts']==0)

def infer(model,images,size):
    predictions={};latencies=[]
    for p in model.predict(source=str(images),imgsz=size,conf=.05,device='cpu',stream=True,verbose=False,save=False):
        predictions[Path(p.path).stem]=[{'classId':0,'score':float(s),'xyxy':xy} for c,s,xy in zip(p.boxes.cls.tolist(),p.boxes.conf.tolist(),p.boxes.xyxyn.tolist()) if model.names[int(c)]=='sign:crack'];latencies.append(p.speed['inference'])
    return predictions,{'meanInferenceMs':sum(latencies)/len(latencies),'maxInferenceMs':max(latencies)}

def labels(folder):
    truth={}
    for path in folder.glob('*.txt'):
        boxes=[]
        for line in path.read_text().splitlines():
            _,x,y,w,h=map(float,line.split());boxes.append({'classId':0,'xyxy':[x-w/2,y-h/2,x+w/2,y+h/2]})
        truth[path.stem]=boxes
    return truth

def main():
    reportpath=OUT/'comparison.json'
    if reportpath.exists():raise ValueError('Comparison exists')
    verify();torch.set_num_threads(2);truth=labels(DATA/'labels/val');old=BASE/'05-models/fixgo-observable-v1';manifest=json.loads((old/'model-manifest.json').read_text());initial=old/manifest['weights'];weights=Path(json.loads((OUT/'run.json').read_text())['weights']);results={};allpred={}
    runs=[('baseline',initial,manifest['imgsz']),('head',weights,416)]
    refinement=OUT/'refinement-run.json'
    if refinement.exists():runs.append(('refinement',Path(json.loads(refinement.read_text())['weights']),416))
    for version,path,size in runs:
        model=YOLO(str(path));predictions,latency=infer(model,DATA/'images/val',size);allpred[version]=predictions
        search=[measure(predictions,truth,t,{0:'sign:crack'}) for t in [.1,.15,.2,.25,.3,.4,.5,.6,.7,.8]]
        best=max(search,key=lambda r:(r['F1'],r['precision']));results[version]={'weights':str(path),'weightsSha256':sha(path.read_bytes()),'imgsz':size,'fixedPoint015':measure(predictions,truth,.15,{0:'sign:crack'}),'bestDevelopmentPoint':best,'thresholdSearch':search,**latency}
        (OUT/(version+'-validation-predictions.json')).write_text(json.dumps(predictions,indent=2)+'\n')
    selected=max([v for v in results if v!='baseline'],key=lambda v:(results[v]['bestDevelopmentPoint']['F1'],results[v]['bestDevelopmentPoint']['precision']))
    results['candidate']=results[selected];weights=Path(results[selected]['weights'])
    c=results['candidate']['bestDevelopmentPoint'];b=results['baseline']['bestDevelopmentPoint'];improved=c['F1']>b['F1'] and c['recall']>=b['recall']
    protocol={'schema':'fixgo.crack-reviewed-v5-final-test.v1','weightsSha256':sha(weights.read_bytes()),'imgsz':416,'threshold':c['confidence'],'baselineThreshold':b['confidence'],'testPinsSha256':sha((TEST/'SHA256SUMS.json').read_bytes()),'scope':'crack positive images only; not full FixGo acceptance','selection':'Weights and threshold chosen only on development validation','labelLimit':'Manual source-mask bounding envelopes; localization proxy'}
    test={'status':'reserved_not_used','reason':'Preserve fresh test unless candidate improves validation F1/recall, reaches proposed P/R 0.8 targets and has no alerts on development negatives.'}
    if eligible_for_reserved_test(c,b):
        pins=json.loads((TEST/'SHA256SUMS.json').read_text())
        if not all(sha((TEST/p).read_bytes())==digest for p,digest in pins.items()):raise ValueError('Reserved data changed')
        with (TEST/'final-protocol.json').open('x') as f:json.dump(protocol,f,indent=2)
        testtruth=labels(TEST/'labels/test');test={'status':'evaluated_once','images':len(testtruth),'negativeImages':0,'limitations':['No false-positive estimate on independent negatives.','Same source as additional training, not an external service deployment sample.']}
        for version in ['baseline','candidate']:
            r=results[version];p,latency=infer(YOLO(r['weights']),TEST/'images/test',r['imgsz']);threshold=r['bestDevelopmentPoint']['confidence'];test[version]={'operatingPoint':measure(p,testtruth,threshold,{0:'sign:crack'}),'imageDetections':sum(any(b['score']>=threshold for b in boxes) for boxes in p.values()),**latency};(OUT/(version+'-test-predictions.json')).write_text(json.dumps(p,indent=2)+'\n')
    blockers=['Crack-only specialist cannot replace existing category/device and other sign classes.','Independent negative images absent; only 3 development negatives.','Additional source is non-commercial research/education only; no commercial activation.']
    if c['precision']<.8 or c['recall']<.8:blockers.append('Development precision/recall below proposed 0.8 targets.')
    if not improved:blockers.append('Candidate did not improve development F1 and recall.')
    report={'schema':'fixgo.crack-reviewed-v5-comparison.v1','selectedStage':selected,'development':results,'candidateImprovedOnDevelopment':improved,'test':test,'readyForPrimaryActivation':False,'productionActivated':False,'blockers':blockers,'dataUnchanged':True,'labelStatus':'AI_AND_SOURCE_MASK_LABELS_NOT_EXPERT_VERIFIED'}
    reportpath.write_text(json.dumps(report,indent=2)+'\n')
    bundle=BASE/'05-models/fixgo-crack-reviewed-v5';(bundle/'weights').mkdir(parents=True,exist_ok=False);shutil.copy2(weights,bundle/'weights/best.pt')
    taxonomy=json.loads((old/'taxonomy.json').read_text());taxonomy['classes']=[v for v in taxonomy['classes'] if v['code']=='crack'];(bundle/'taxonomy.json').write_text(json.dumps(taxonomy,ensure_ascii=False,indent=2)+'\n');shutil.copy2(old/'ontology.json',bundle/'ontology.json')
    m={**manifest,'classes':[{'kind':'sign','code':'crack','name':'sign:crack'}],'weightsSha256':sha(weights.read_bytes()),'threshold':c['confidence'],'imgsz':416,'researchOnly':True,'commercialProductionEligible':False,'independentTest':test['status']=='evaluated_once','independentTestScope':'Reserved positive crack images from source-mask dataset only; no independent negatives or other services.','note':'Crack-only research candidate; not a main device/category model replacement. Independent test, if run, contains only positive source-mask envelopes.'}
    shutil.copy2(DATA.parent/'fixgo-multiservice-ai-v2-clean/SOURCE-REPOSITORY-README.md',bundle/'SOURCE-REPOSITORY-README.md')
    (bundle/'model-manifest.json').write_text(json.dumps(m,indent=2)+'\n');(bundle/'evaluation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
