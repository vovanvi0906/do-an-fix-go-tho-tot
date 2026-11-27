#!/usr/bin/env python3
"""One frozen comparison on reviewed unseen-detector images and reserved crack positives."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import argparse,json,sys,time
from datetime import datetime,timezone
from pathlib import Path
import cv2,httpx,torch,yaml
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'ai-service'))
from multiservice_data import BASE,sha
from prepare_observer_challenge import ROOT as CHALLENGE
from evaluate_multiservice_trial import measure
from recommendation.multiservice_observer import load_observer,scope_observations
OUT=BASE/'04-training/multiservice-challenge-v1'
RESERVED=BASE/'03-tests/deepcrack-reserved-v2-clean'
NAMES=['broken_part','crack','exposed_conductor','peeling_surface','socket_damage_or_displacement','stain_or_discoloration']

def should_promote(baseline,candidate):
    return (candidate['precision']>=baseline['precision'] and candidate['F0_5']>=baseline['F0_5']
            and candidate['negativeScopeImagesWithAlerts']<=baseline['negativeScopeImagesWithAlerts']
            and (candidate['F0_5']>baseline['F0_5'] or candidate['FP']<baseline['FP']))

def score(cases,predictions,codes,suite=None):
    result={};total={'TP':0,'FP':0,'FN':0};neg_count=neg_alerts=0
    for code in codes:
        rows=[r for r in cases if code in r['scopes'] and (suite is None or r['suite']==suite)];truth={r['caseId']:[{'classId':0,'xyxy':a['xyxy']} for a in r['annotations'] if a['code']==code] for r in rows};p={r['caseId']:[{'classId':0,'xyxy':a['xyxy'],'score':a['confidence']} for a in predictions[r['caseId']]['proposals'] if a['code']==code] for r in rows}
        m=measure(p,truth,0,{0:code});m.pop('perClass')
        for key in ['TP','FP','FN']:m.setdefault(key,0)
        m['positiveImages']=sum(bool(v) for v in truth.values());m['scoredImages']=len(rows);m['positiveImagesWithAnyProposal']=sum(bool(truth[k]) and bool(p[k]) for k in truth);m['precisionDefined']=m['TP']+m['FP']>0;m['recallDefined']=m['TP']+m['FN']>0;result[code]=m
        for k in total:total[k]+=m[k]
        neg_count+=m['negativeImages'];neg_alerts+=m['negativeImagesWithAlerts']
    tp,fp,fn=(total[k] for k in ['TP','FP','FN']);precision=tp/max(1,tp+fp);recall=tp/max(1,tp+fn)
    return {'perClass':result,'pooledScoped':{**total,'precision':precision,'recall':recall,'F1':2*tp/max(1,2*tp+fp+fn),'F0_5':1.25*tp/max(1,1.25*tp+.25*fn+fp),'negativeScopeImages':neg_count,'negativeScopeImagesWithAlerts':neg_alerts}}

def main(summarize=False):
    if OUT.exists() and not summarize:raise ValueError('Evaluation already started/completed; use --summarize to score existing predictions only')
    if (OUT/'report.json').exists():raise ValueError('Completed report exists')
    reviewed=json.loads((CHALLENGE/'reviewed-labels.json').read_text());cases=[{**r,'caseId':'challenge:'+r['reviewId']} for r in reviewed['records']]
    reserved_pins=json.loads((RESERVED/'SHA256SUMS.json').read_text())
    if not all(sha((RESERVED/p).read_bytes())==d for p,d in reserved_pins.items()):raise ValueError('Reserved files changed')
    if (RESERVED/'final-protocol.json').exists() and not summarize:raise ValueError('Reserved test already exposed')
    for image in sorted((RESERVED/'images/test').glob('*')):
        annotations=[]
        for line in (RESERVED/'labels/test'/(image.stem+'.txt')).read_text().splitlines():
            cls,x,y,w,h=map(float,line.split())
            if yaml.safe_load((RESERVED/'data.yaml').read_text())['names'][int(cls)]!='sign:crack':raise ValueError('Non-crack reserved label')
            annotations.append({'code':'crack','xyxy':[x-w/2,y-h/2,x+w/2,y+h/2]})
        cases.append({'caseId':'reserved:'+image.stem,'imageId':image.stem,'image':str(image),'sha256':sha(image.read_bytes()),'suite':'reserved_crack_source_mask','scopes':['crack'],'annotations':annotations,'labelStatus':'SOURCE_MANUAL_MASK_ENVELOPE_PROXY'})
    releases={v:ROOT/f'ai-service/weights/multiservice-observer-{v}/release.json' for v in ['v2','v3']};meta={v:json.loads(p.read_text()) for v,p in releases.items()};shared=[c for c in NAMES if all(m['classes'][c]['enabled'] for m in meta.values())]
    protocol={'schema':'fixgo.multiservice-challenge-protocol.v1','frozenAtUtc':datetime.now(timezone.utc).isoformat(),'reviewedLabelsSha256':sha((CHALLENGE/'reviewed-labels.json').read_bytes()),'releaseSha256':{v:sha(p.read_bytes()) for v,p in releases.items()},'reservedPinsSha256':sha((RESERVED/'SHA256SUMS.json').read_bytes()),'cases':len(cases),'sharedEnabledCodes':shared,'IoU':.5,'evaluationMode':'v2 via live API; v3 real observer with unchanged v2 category context. No threshold search on this set.','pilotPromotionRule':'On clean + reserved data, shared-class precision and F0.5 must not fall and scoped negative alerts must not increase. Improvement in F0.5 or fewer false positives required. This only approves a pilot policy update, never production accuracy.','limitations':reviewed['limitations']+['Reserved test has crack positives only, no independently collected normal images.','Same-source/family duplicate screening can miss related scenes.','Very few clean positives for some signs; separate watermarked diagnostic scores.']}
    if not summarize:
        OUT.mkdir(parents=True);(OUT/'protocol.json').write_text(json.dumps(protocol,indent=2)+'\n')
        with (RESERVED/'final-protocol.json').open('x') as f:json.dump({**protocol,'status':'EXPOSED_BY_FROZEN_OBSERVER_V3_COMPARISON','report':str(OUT/'report.json')},f,indent=2)
    else:
        frozen=json.loads((OUT/'protocol.json').read_text())
        for key in ['reviewedLabelsSha256','releaseSha256','reservedPinsSha256','cases','sharedEnabledCodes','pilotPromotionRule']:
            if frozen[key]!=protocol[key]:raise ValueError('Frozen experiment changed')
        protocol=frozen
        if json.loads((RESERVED/'final-protocol.json').read_text()).get('report')!=str(OUT/'report.json'):raise ValueError('Reserved test belongs to another experiment')
    os.environ['MULTISERVICE_OBSERVER_MANIFEST']=str(releases['v3']);os.environ['MULTISERVICE_OBSERVER_ENABLED']='true';torch.set_num_threads(2);candidate=load_observer() if not summarize else None
    if candidate is None and not summarize:raise ValueError('Frozen candidate unavailable')
    predictions={'v2':{},'v3':{}};latencies=[]
    if summarize:
        entries=[json.loads(line) for line in (OUT/'predictions.jsonl').read_text().splitlines()]
        if len(entries)!=len(cases) or {r['caseId'] for r in entries}!={r['caseId'] for r in cases}:raise ValueError('Predictions incomplete; no automatic re-inference')
        for entry in entries:
            for version in predictions:predictions[version][entry['caseId']]=entry[version]
    else:
        run_inference(cases,protocol,candidate,predictions,latencies)
    results={}
    for version,p in predictions.items():results[version]={'clean':score(cases,p,NAMES,'clean'),'watermarkedDiagnostic':score(cases,p,NAMES,'watermarked_diagnostic_only'),'reservedCrack':score(cases,p,['crack'],'reserved_crack_source_mask'),'sharedCleanAndReserved':score([r for r in cases if r['suite']!='watermarked_diagnostic_only'],p,shared)}
    a=results['v2']['sharedCleanAndReserved']['pooledScoped'];b=results['v3']['sharedCleanAndReserved']['pooledScoped'];promote=should_promote(a,b)
    report={'schema':'fixgo.multiservice-quality-comparison.v1','completedAtUtc':datetime.now(timezone.utc).isoformat(),'cases':len(cases),'suiteCounts':{s:sum(r['suite']==s for r in cases) for s in ['clean','watermarked_diagnostic_only','reserved_crack_source_mask']},'results':results,'promoteConservativePilot':promote,'productionValidated':False,'testNowExposed':True,'weightsChanged':False,'meanPairEvaluationSeconds':sum(latencies)/len(latencies) if latencies else None,'limitations':protocol['limitations']}
    (OUT/'cases.json').write_text(json.dumps(cases,indent=2)+'\n');(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'promoteConservativePilot':promote,'v2':a,'v3':b,'reservedV2':results['v2']['reservedCrack']['pooledScoped'],'reservedV3':results['v3']['reservedCrack']['pooledScoped']},indent=2))

def run_inference(cases,protocol,candidate,predictions,latencies):
    with httpx.Client(base_url='http://127.0.0.1:8000',timeout=60) as client,(OUT/'predictions.jsonl').open('x') as journal:
        for i,row in enumerate(cases):
            image=Path(row['image']);payload=image.read_bytes()
            if sha(payload)!=row['sha256']:raise ValueError('Source image changed')
            started=time.perf_counter();r=client.post('/ai/v2/diagnose',files={'file':(image.name,payload,'image/jpeg')});r.raise_for_status();response=r.json();baseline=response['observableAnalysis']
            if baseline.get('releaseSha256')!=protocol['releaseSha256']['v2']:raise ValueError('Live baseline release changed')
            decoded=cv2.imread(str(image));new=scope_observations(candidate.predict(decoded),candidate,response.get('suggestedCategoryId'))
            if baseline['status'] not in ['proposed','no_detection'] or new['status'] not in ['proposed','no_detection'] or baseline['degradedModels'] or new['degradedModels']:raise ValueError('Incomplete inference is not scored as no detection')
            predictions['v2'][row['caseId']]=baseline;predictions['v3'][row['caseId']]=new;latencies.append(time.perf_counter()-started)
            journal.write(json.dumps({'caseId':row['caseId'],'suite':row['suite'],'categorySlug':response.get('suggestedCategoryId'),'v2':baseline,'v3':new},ensure_ascii=False)+'\n');journal.flush()
            if (i+1)%10==0:print(f'Evaluated {i+1}/{len(cases)}',flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--summarize',action='store_true');main(p.parse_args().summarize)
