#!/usr/bin/env python3
"""Package existing development models as an explicitly unverified local pilot release."""
import argparse,json,shutil
from pathlib import Path
from multiservice_data import BASE,sha
from evaluate_multiservice_trial import measure
from evaluate_observable_v2 import truth
ROOT=Path(__file__).resolve().parents[2]
VERSION='v2'
CONSERVATIVE=False
OUT=ROOT/('ai-service/weights/multiservice-observer-'+VERSION)
GROUPS={'sua-dien':['scorched_outlet','socket_damage_or_displacement','exposed_conductor'],
        'sua-nuoc':['visible_water','stain_or_discoloration'],
        'dien-lanh':['surface_soiling','stain_or_discoloration'],
        'thiet-bi':['broken_part','surface_soiling','peeling_surface','crack'],
        'giup-viec':['surface_soiling','stain_or_discoloration','mold_like_growth']}

def conservative_point(points):
    eligible=[p for p in points if p['precision']>=.75 and p['recall']>=.25 and p['TP']>=2]
    return (max(eligible,key=lambda p:(p['F1'],p['precision'])),True) if eligible else (max(points,key=lambda p:(p['F1'],p['precision'])),False)

def main():
    if OUT.exists():raise ValueError('Release already exists; create a new version')
    old=BASE/'05-models/fixgo-observable-v1';specialist=BASE/'05-models/fixgo-crack-reviewed-v5'
    report=json.loads((BASE/'04-training/fixgo-multiservice-v1/report.json').read_text())
    oldmanifest=json.loads((old/'model-manifest.json').read_text())
    crack_report=json.loads((specialist/'evaluation.json').read_text())['development']['candidate']
    crack_metrics=crack_report['bestDevelopmentPoint'];crack_enabled=True
    if CONSERVATIVE:
        crack_metrics,crack_enabled=conservative_point([{**p['perClass']['sign:crack'],'threshold':p['confidence']} for p in crack_report['thresholdSearch']])
    if report['selected']['sha256']!=oldmanifest['weightsSha256']:raise ValueError('Prediction/model provenance mismatch')
    raw=json.loads((BASE/'04-training/fixgo-multiservice-v1/validation-predictions.json').read_text());names={int(k):v for k,v in raw['classes'].items()};labels=truth(BASE/'02-curated/fixgo-multiservice-ai-v1','val')
    search=[measure(raw['predictions'],labels,t,names) for t in [.15,.2,.25,.3,.4,.5,.6,.7,.8]]
    thresholds={};metrics={};availability={}
    for c in oldmanifest['classes']:
        name=c['name'];best=max(search,key=lambda r:(r['perClass'][name]['F1'],r['perClass'][name]['precision']))
        point={**best['perClass'][name],'threshold':best['confidence']};active=point['precision']>=.5 and point['TP']>0
        if CONSERVATIVE:point,active=conservative_point([{**r['perClass'][name],'threshold':r['confidence']} for r in search])
        thresholds[c['code']]=point['threshold'];metrics[c['code']]=point;availability[c['code']]=active
    OUT.mkdir(parents=True);models=[];classes={}
    for key,folder in [('general',old),('crack',specialist)]:
        m=json.loads((folder/'model-manifest.json').read_text());weights=folder/m['weights']
        if sha(weights.read_bytes())!=m['weightsSha256']:raise ValueError('Model checksum changed')
        target=OUT/key;shutil.copytree(folder,target)
        taxonomy={v['code']:v for v in json.loads((folder/m['taxonomyPath']).read_text())['classes']}
        include=[c['code'] for c in m['classes'] if key=='crack' or c['code']!='crack']
        models.append({'id':key,'manifest':str((target/'model-manifest.json').relative_to(OUT)),'manifestSha256':sha((target/'model-manifest.json').read_bytes()),'includeCodes':include,'thresholds':{c:(crack_metrics.get('threshold',m['threshold']) if key=='crack' else thresholds[c]) for c in include}})
        for code in include:
            meta=taxonomy[code];point=crack_metrics if code=='crack' else metrics[code]
            classes[code]={'name':meta['displayNameVi'],'definition':meta['definition'],'enabled':point['precision']>=.5 and point['TP']>0,'contextMode':'category' if code in ['exposed_conductor','scorched_outlet','socket_damage_or_displacement','surface_soiling','visible_water'] else 'generic','unscopedThreshold':.5 if code in ['crack','broken_part'] else .8,'geometryType':'device_context' if code in ['scorched_outlet','socket_damage_or_displacement'] else 'visible_region','relatedServiceGroups':[g for g,codes in GROUPS.items() if code in codes]}
            if CONSERVATIVE:classes[code]['enabled']=crack_enabled if code=='crack' else availability[code]
    rejected=[]
    for code in ['burn_mark','surface_soiling','water_spray']:
        p=BASE/f'04-training/service-specialists-v1/{code}/evaluation.json'
        if p.exists():rejected.append({'code':code,'evaluation':json.loads(p.read_text()),'activated':False})
    release={'schema':'fixgo.multiservice-observer.v1','modelVersion':'fixgo-multiservice-observer-'+VERSION,'status':'PILOT_AI_UNVERIFIED','models':models,'classes':classes,'coverage':[{'categorySlug':group,'status':'experimental_sign_proposals','signCodes':codes,'availableSignCodes':[c for c in codes if classes[c]['enabled']],'unavailableSignCodes':[c for c in codes if not classes[c]['enabled']]} for group,codes in GROUPS.items()]+[{'categorySlug':'lam-vuon','status':'no_domain_dataset','signCodes':[],'availableSignCodes':[],'unavailableSignCodes':[]}],'quality':{'productionValidated':False,'independentMultiserviceTest':False,'pilotMinimumDevelopmentPrecision':.5,'note':'Pilot filtering only, not production acceptance or calibrated accuracy.','generalDevelopmentOperatingPoints':metrics,'crackEvaluation':crack_metrics,'rejectedSpecialists':rejected},'limitations':['AI/source labels; per-class thresholds selected on reused development validation.','Service groups describe possible relevance, never a diagnosis, object link or service recommendation.','Some boxes surround a damaged device rather than its local damage.','Crack expert uses research/education source data; release is a research pilot.','Gardening sign dataset absent.']}
    if CONSERVATIVE:release['quality'].update(pilotMinimumDevelopmentPrecision=.75,pilotMinimumDevelopmentRecall=.25,pilotMinimumTruePositives=2,policy='Thresholds/classes selected only using previous development validation, before challenge inference.')
    (OUT/'release.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'release':str(OUT/'release.json'),'classes':list(classes),'status':release['status']},ensure_ascii=False))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--version',default='v2');p.add_argument('--conservative',action='store_true');args=p.parse_args()
    if not args.version.isalnum():raise ValueError('Invalid version')
    VERSION=args.version;CONSERVATIVE=args.conservative;OUT=ROOT/('ai-service/weights/multiservice-observer-'+VERSION);main()
