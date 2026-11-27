#!/usr/bin/env python3
"""Compare candidate without modifying primary weights; reserve test for one final pass."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import argparse,collections,json,shutil
from pathlib import Path
import torch,yaml
from ultralytics import YOLO
from multiservice_data import BASE,sha
from prepare_observable_v2 import OUT as DATA,TEST
from train_observable_v2 import OUT
from evaluate_multiservice_trial import measure
CANDIDATE_SIZE=416
CANDIDATE_VERSION='v2'
BUNDLE_NAME='fixgo-observable-v2'

def truth(root,split):
    result={}
    for p in (root/'labels'/split).glob('*.txt'):
        boxes=[]
        for line in p.read_text().splitlines():
            c,x,y,w,h=map(float,line.split());boxes.append({'classId':int(c),'xyxy':[x-w/2,y-h/2,x+w/2,y+h/2]})
        result[p.stem]=boxes
    return result

def predict(model,root,split,size,confidence):
    return {Path(p.path).stem:[{'classId':int(c),'score':float(s),'xyxy':xy} for c,s,xy in zip(p.boxes.cls.tolist(),p.boxes.conf.tolist(),p.boxes.xyxyn.tolist())] for p in model.predict(source=str(root/'images'/split),imgsz=size,conf=confidence,device='cpu',stream=True,verbose=False,save=False)}

def evaluate():
    torch.set_num_threads(2);reportpath=OUT/'comparison.json'
    if reportpath.exists():raise ValueError('Comparison already completed')
    for root in [DATA,TEST]:
        if not all(sha((root/p).read_bytes())==digest for p,digest in json.loads((root/'SHA256SUMS.json').read_text()).items()):raise ValueError('Pinned data changed')
    old=BASE/'05-models/fixgo-observable-v1';manifest=json.loads((old/'model-manifest.json').read_text());names=yaml.safe_load((DATA/'data.yaml').read_text())['names'];runs=[('v1',old/manifest['weights'],manifest['imgsz']),(CANDIDATE_VERSION,Path(json.loads((OUT/'run.json').read_text())['weights']),CANDIDATE_SIZE)]
    scores=[];parenttruth=truth(BASE/'02-curated/fixgo-multiservice-ai-v1','val')
    for version,weights,size in runs:
        model=YOLO(str(weights));m=model.val(data=str(DATA/'data.yaml'),split='val',imgsz=size,batch=8,device='cpu',workers=0,plots=False,project=str(OUT/'evaluation'),name=version,verbose=False)
        per=[{'class':names[int(c)],'mAP50':float(m.box.ap50[i]),'mAP50_95':float(m.box.ap[i].mean())} for i,c in enumerate(m.box.ap_class_index)]
        p=predict(model,DATA,'val',size,.15);oldp={k:p[k] for k in parenttruth};score={'version':version,'weights':str(weights),'weightsSha256':sha(weights.read_bytes()),'imgsz':size,'mAP50':float(m.box.map50),'mAP50_95':float(m.box.map),'perClass':per,'fixedThreshold':.15,'allValidation':measure(p,truth(DATA,'val'),.15,names),'originalValidation':measure(oldp,parenttruth,.15,names)};scores.append(score)
        (OUT/(version+'-validation-predictions.json')).write_text(json.dumps(p,indent=2)+'\n')
    candidate=scores[1];baseline=scores[0]
    # No threshold optimization on the new test. Freeze candidate settings before one test pass.
    protocol={'schema':'fixgo.observable-v2-final-test.v1','candidateVersion':CANDIDATE_VERSION,'weightsSha256':candidate['weightsSha256'],'imgsz':CANDIDATE_SIZE,'confidence':.15,'classScope':'crack only','testPinsSha256':sha((TEST/'SHA256SUMS.json').read_bytes()),'selection':'Training best checkpoint selected only on development validation','limitations':['Same new source as added training data, official test separated by family and duplicate screening.','Only crack is annotated, no negative images.','BBox envelope derived from source segmentation; localization proxy.','No threshold or checkpoint search using test scores.']}
    protocolpath=TEST/'final-protocol.json';testpred={}
    improved=candidate['mAP50_95']>baseline['mAP50_95'] and candidate['originalValidation']['F1']>=baseline['originalValidation']['F1']
    if improved:
        with protocolpath.open('x') as f:json.dump(protocol,f,indent=2)
        model=YOLO(candidate['weights']);testpred=predict(model,TEST,'test',CANDIDATE_SIZE,.15);crack=next(i for i,n in names.items() if n=='sign:crack');crackpred={k:[b for b in p if b['classId']==crack] for k,p in testpred.items()};testtruth=truth(TEST,'test');testscore=measure(crackpred,testtruth,.15,{crack:names[crack]})
        baseline_model=YOLO(baseline['weights']);baseline_pred=predict(baseline_model,TEST,'test',baseline['imgsz'],.15);baseline_cracks={k:[b for b in p if b['classId']==crack] for k,p in baseline_pred.items()}
        testreport={'status':'evaluated_once','images':len(testtruth),'imageDetections':sum(bool(p) for p in crackpred.values()),'bboxOperatingPoint':testscore,'baselineImageDetections':sum(bool(p) for p in baseline_cracks.values()),'baselineBBoxOperatingPoint':measure(baseline_cracks,testtruth,.15,{crack:names[crack]}),'scope':'crack only; not a ten-class or all-service test','protocol':str(protocolpath)}
        (OUT/'baseline-new-test-predictions.json').write_text(json.dumps(baseline_pred,indent=2)+'\n')
        (OUT/'new-test-predictions.json').write_text(json.dumps(testpred,indent=2)+'\n')
    else:testreport={'status':'reserved_not_used','reason':'Candidate did not improve both validation mAP50-95 and original-validation micro-F1. Preserve fresh test for a better candidate.'}
    report={'schema':'fixgo.observable-v2-comparison.v1','labelStatus':'AI_AND_SOURCE_UNVERIFIED','scores':scores,'test':testreport,'productionActivated':False,'limitations':protocol['limitations']}
    reportpath.write_text(json.dumps(report,indent=2)+'\n')
    bundle=BASE/'05-models'/BUNDLE_NAME
    (bundle/'weights').mkdir(parents=True,exist_ok=False);shutil.copy2(candidate['weights'],bundle/'weights/best.pt')
    for name in ['taxonomy.json','ontology.json','ATTRIBUTION.txt']:shutil.copy2(old/name,bundle/name)
    shutil.copy2(DATA/'SOURCE-REPOSITORY-README.md',bundle/'SOURCE-DEEPCRACK-README.md')
    m={**manifest,'weightsSha256':candidate['weightsSha256'],'imgsz':CANDIDATE_SIZE,'threshold':.15,'status':'EXPERIMENTAL_NOT_DEPLOYED','researchOnly':True,'commercialProductionEligible':False,'note':CANDIDATE_VERSION+': additional non-commercial research data. Only crack has a newly reserved test. Primary FixGo models unchanged.'}
    (bundle/'model-manifest.json').write_text(json.dumps(m,indent=2)+'\n');(bundle/'evaluation.json').write_text(json.dumps(report,indent=2)+'\n')
    # Concrete missing conditions, rather than manufacturing a reviewed production manifest.
    blockers=['No independent positive/negative test for all ten sign classes.','No sign-to-device geometry evaluation; this is a sign-only model, not a replacement for category/device models.','Gardening sign data absent.','Additional source permits non-commercial research/education only; commercial production rights not established.']
    for name in names.values():
        c=candidate['originalValidation']['perClass'][name]
        if c['precision']<.8 or c['recall']<.8:blockers.append('Below proposed P/R 0.8 development target: '+name)
    readiness={'schema':'fixgo.observable-activation-readiness.v1','readyForPrimaryActivation':False,'activated':False,'policyStatus':'Proposed engineering targets, not an established product acceptance specification','proposedPrecision':.8,'proposedRecall':.8,'blockers':blockers,'comparison':str(reportpath),'candidateBundle':str(bundle),'primaryModelsUnchanged':True}
    (OUT/'activation-readiness.json').write_text(json.dumps(readiness,indent=2)+'\n');(bundle/'activation-readiness.json').write_text(json.dumps(readiness,indent=2)+'\n')
    print(json.dumps({'baselineAP50':baseline['mAP50'],'candidateAP50':candidate['mAP50'],'baselineAP50_95':baseline['mAP50_95'],'candidateAP50_95':candidate['mAP50_95'],'test':report['test'],'readiness':readiness},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--stable',action='store_true');args=parser.parse_args()
    if args.stable:OUT=BASE/'04-training/fixgo-observable-v3-stable';CANDIDATE_SIZE=320;CANDIDATE_VERSION='v3-stable';BUNDLE_NAME='fixgo-observable-v3-stable'
    evaluate()
