#!/usr/bin/env python3
"""Export scoped AI-reviewed development labels; never infer missing-class negatives."""
import argparse,collections,json,math,shutil
from pathlib import Path
from multiservice_data import BASE,sha
REVIEW=BASE/'02-curated/observable-label-review-v1'
PARENT=BASE/'02-curated/fixgo-multiservice-ai-v1/manifest.json'
OUT=BASE/'02-curated/fixgo-sign-review-v4'

def latest_events(path):
    latest={};head='0'*64
    for line in path.read_text().splitlines():
        event=json.loads(line);digest=event.pop('eventHash')
        if event['previousHash']!=head or sha(json.dumps(event,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())!=digest:raise ValueError('Broken review chain')
        if event['reviewId'] in latest and event.get('supersedesEventHash')!=latest[event['reviewId']]['eventHash']:raise ValueError('Invalid revision')
        event['eventHash']=digest;latest[event['reviewId']]=event;head=digest
    return latest,head

def canonical(code):return {'scorched_outlet':'burn_mark','standing_water':'surface_water'}.get(code,code)
def checked(box):
    if len(box)!=4 or not all(isinstance(v,(float,int)) and math.isfinite(v) for v in box):raise ValueError('Invalid coordinates')
    x,y,xx,yy=box
    if not (0<=x<xx<=1 and 0<=y<yy<=1):raise ValueError('Invalid box bounds')
    return list(box)

def main():
    if OUT.exists():raise ValueError('Immutable output already exists')
    events,head=latest_events(REVIEW/'visual-review-events.jsonl');rows={r['imageId']:r for r in json.loads(PARENT.read_text())['records']};accepted=[];quarantine=[];packs=collections.defaultdict(dict)
    for event in events.values():
        row=rows[event['imageId']];d=event['decision'];action=d['action'];annotations=[]
        if action!='QUARANTINE':
            code=canonical(d.get('classCode',event['scope']))
            boxes=d.get('boxes') if action=='REVISE_SIGN_REGIONS' else [a['xyxy'] for a in row['proposedAnnotations'] if a['code']==d.get('sourceCodeForGeometry',event['scope'])]
            if not boxes:raise ValueError('Accepted decision has no boxes')
            annotations=[{'code':code,'xyxy':checked(b)} for b in boxes]
            accepted.append({'reviewId':event['reviewId'],'imageId':row['imageId'],'split':row['split'],'annotations':annotations})
            packs[code][row['imageId']]={'row':row,'boxes':[a['xyxy'] for a in annotations],'reviewId':event['reviewId'],'deviceContexts':d.get('deviceContexts',[]),'geometryStatus':d.get('geometryStatus','UNSPECIFIED')}
        else:quarantine.append({'reviewId':event['reviewId'],'imageId':row['imageId'],'reason':d['reason']})
        for scope in d.get('negativeScopes',[]):
            code=canonical(scope)
            if any(a['code']==code for a in annotations):raise ValueError('Positive/negative conflict')
            packs[code].setdefault(row['imageId'],{'row':row,'boxes':[],'reviewId':event['reviewId']})
    OUT.mkdir(parents=True);summary={}
    for code,items in packs.items():
        counts=collections.Counter();records=[];groups={};hashes={}
        for item in items.values():
            r=item['row'];split=r['split']
            if split not in ('train','val'):raise ValueError('Unexpected split')
            for mapping,key in [(groups,r['groupId']),(hashes,r['sha256'])]:
                if key in mapping and mapping[key]!=split:raise ValueError('Cross-split leakage')
                mapping[key]=split
            if sha(Path(r['path']).read_bytes())!=r['sha256']:raise ValueError('Source changed')
            target=OUT/code;image=target/split/'images'/Path(r['path']).name;label=target/split/'labels'/(image.stem+'.txt')
            image.parent.mkdir(parents=True,exist_ok=True);label.parent.mkdir(parents=True,exist_ok=True)
            if image.exists():raise ValueError('Filename collision')
            shutil.copy2(r['path'],image)
            label.write_text(''.join('0 '+' '.join(f'{v:.8f}' for v in ((b[0]+b[2])/2,(b[1]+b[3])/2,b[2]-b[0],b[3]-b[1]))+'\n' for b in item['boxes']))
            counts[split+('_positive' if item['boxes'] else '_negative')]+=1
            records.append({'imageId':r['imageId'],'split':split,'groupId':r['groupId'],'sourceSha256':r['sha256'],'reviewId':item['reviewId'],'boxes':item['boxes'],'deviceContexts':item.get('deviceContexts',[]),'geometryStatus':item.get('geometryStatus','EXPLICIT_SCOPE_NEGATIVE'),'image':str(image),'label':str(label)})
        target=OUT/code;(target/'data.yaml').write_text(f'path: {target}\ntrain: train/images\nval: val/images\nnames: [sign:{code}]\n')
        ready=all(counts[k]>=n for k,n in {'train_positive':20,'val_positive':5,'train_negative':5,'val_negative':2}.items())
        summary[code]={'counts':dict(counts),'developmentMinimumMet':ready,'geometryQA':'PENDING','productionReady':False}
        (target/'manifest.json').write_text(json.dumps({'classCode':code,'labelStatus':'AI_VISUAL_REVIEW_NOT_EXPERT_GROUND_TRUTH','independentTest':False,'records':records},indent=2)+'\n')
    report={'reviewedScopes':len(events),'reviewedUniqueImages':len({e['imageId'] for e in events.values()}),'acceptedScopes':len(accepted),'quarantinedScopes':len(quarantine),'notVisuallyReviewedImages':len(set(rows)-{e['imageId'] for e in events.values()}),'reviewHead':head,'parentManifestSha256':sha(PARENT.read_bytes()),'packs':summary,'accepted':accepted,'quarantine':quarantine,'limitations':['Development splits retain previous model exposure; not independent test.','No implicit negative labels for missing classes.','Approximate AI geometry requires QA before training.','No assertion of underlying image rights or fault cause.'],'productionActivated':False}
    (OUT/'review-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ['accepted','quarantine']},indent=2))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,default=OUT);parser.add_argument('--review',type=Path,default=REVIEW);args=parser.parse_args();OUT=args.out.resolve();REVIEW=args.review.resolve();main()
