#!/usr/bin/env python3
"""Build a derived sign-only development dataset from saved Studio reviews.
Does not modify reviews, approve labels, train a model or create independent test.
"""
import argparse,collections,hashlib,io,json,math,shutil,tempfile,urllib.request
from pathlib import Path
import yaml
from PIL import Image
from core import read_asset,digest,canonical,now

def iou(a,b):
    inter=max(0,min(a[2],b[2])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[1],b[1]))
    return inter/max(1e-12,(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-inter)

def main():
    p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:8769');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    dest=a.output.resolve()
    if dest.exists():raise ValueError('Output already exists; choose a new version')
    def get(route):
        with urllib.request.urlopen(a.url+'/api/'+route,timeout=15) as response:return json.load(response)
    profiles=get('source-profiles');config=get('config');ids=[];page=0
    while True:
        data=get('items?page='+str(page));ids.extend(r['imageId'] for r in data['items'])
        if len(ids)>=data['total']:break
        page+=1
    details=[get('detail?id='+i) for i in ids];selected=[];excluded=[];snapshots=[];payloads={};used_profiles={}
    for d in details:
        row=d['row'];h=d.get('human');image_id=row['image_id'];why=[]
        snapshots.append({'imageId':image_id,'row':row,'human':h})
        if not h or h['reviewStatus']!='HUMAN_VERIFIED':why.append('NO_CONFIRMED_REVIEW')
        profile=(d.get('datasetSource') or {}).get('profile')
        if not profile or profile['licenseStatus']!='VERIFIED' or not profile['licenseConfirmed']:why.append('NO_CONFIRMED_DATASET_RIGHTS')
        if h and h.get('licenseStatus')=='RESTRICTED':why.append('IMAGE_RIGHTS_RESTRICTED')
        signs=[b for b in (h or {}).get('boundingBoxes',[]) if b['kind']=='sign']
        if h and h.get('outcome') not in ['NORMAL','ABNORMAL']:why.append('UNRESOLVED_OR_OUT_OF_SCOPE')
        if h and ((h['outcome']=='NORMAL' and signs) or (h['outcome']=='ABNORMAL' and not signs)):why.append('OUTCOME_SIGN_CONFLICT')
        for index,b in enumerate(signs):
            if b['label'] not in config['signs']:why.append('UNKNOWN_SIGN')
            for other in signs[index+1:]:
                if b['label']!=other['label'] and iou(b['xyxy'],other['xyxy'])>.8:why.append('DIFFERENT_SIGNS_SAME_REGION_REVIEW_REQUIRED')
        if why:excluded.append({'imageId':image_id,'reasons':sorted(set(why))});continue
        payload=read_asset(row['path'])
        if digest(payload)!=row['sha256']:raise ValueError('Source changed: '+image_id)
        with Image.open(io.BytesIO(payload)) as image:
            image.load()
            if image.size!=(int(row['width']),int(row['height'])) or image.getexif().get(274,1)!=1:raise ValueError('Image frame mismatch')
            rgb=image.convert('RGB');pixel_hash=digest(str(rgb.size).encode()+rgb.tobytes());small=rgb.convert('L').resize((9,8));v=list(small.get_flattened_data());dhash=sum((v[y*9+x]>v[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8))
        # Retain one of duplicate same-code boxes, with deterministic ordering.
        kept=[]
        for b in signs:
            if not any(b['label']==old['label'] and iou(b['xyxy'],old['xyxy'])>.8 for old in kept):kept.append(b)
        record={'imageId':image_id,'contentHash':row['sha256'],'pixelHash':pixel_hash,'dhash':dhash,'originalSplit':row.get('original_split'),'sourceComponent':row.get('proposed_source_component'),'humanEventHash':h['eventHash'],'outcome':h['outcome'],'signs':kept,'removedDuplicateSigns':len(signs)-len(kept),'omittedObjectBoxes':sum(b['kind']=='object' for b in h['boundingBoxes']),'datasetProfileHash':profile['eventHash']}
        selected.append(record);payloads[image_id]=payload;used_profiles[profile['eventHash']]=profile
    if not any(r['signs'] for r in selected):raise ValueError('No positive sign annotations eligible')
    # Conservatively keep exact/near copies in the same development partition.
    parent=list(range(len(selected)))
    def root(n):
        while parent[n]!=n:parent[n]=parent[parent[n]];n=parent[n]
        return n
    for i,r in enumerate(selected):
        for j,other in enumerate(selected[:i]):
            if r['pixelHash']==other['pixelHash'] or r['sourceComponent']==other['sourceComponent'] or (r['dhash']^other['dhash']).bit_count()<=4:parent[root(i)]=root(j)
    groups=collections.defaultdict(list)
    for i,r in enumerate(selected):groups[root(i)].append(r)
    for records in groups.values():
        key=min(r['imageId'] for r in records)
        split='val' if int(hashlib.sha256(('fixgo-signs-dev:'+key).encode()).hexdigest()[:8],16)%5==0 else 'train'
        for r in records:r.update(split=split,groupId=key)
    # These user-reviewed development images are explicitly repartitioned;
    # original source 'test' is never represented as independent evaluation.
    sign_codes=sorted({b['label'] for r in selected for b in r['signs']})
    for code in sign_codes:
        matching=[g for g in groups.values() if any(b['label']==code for r in g for b in r['signs'])]
        matching.sort(key=lambda g:min(r['imageId'] for r in g))
        if not any(g[0]['split']=='train' for g in matching):
            for r in matching[0]:r['split']='train'
        if len(matching)>1 and not any(g[0]['split']=='val' for g in matching):
            # Move a group only when all its labels retain training examples elsewhere.
            for g in matching:
                labels={b['label'] for r in g for b in r['signs']}
                if all(any(other is not g and other[0]['split']=='train' and any(b['label']==label for r in other for b in r['signs']) for other in groups.values()) for label in labels):
                    for r in g:r['split']='val'
                    break
    names=sorted({b['label'] for r in selected for b in r['signs']});counts={split:collections.Counter() for split in ['train','val']}
    dest.parent.mkdir(parents=True,exist_ok=True);tmp=Path(tempfile.mkdtemp(prefix='.building-signs-',dir=dest.parent))
    try:
        for split in ['train','val']:
            (tmp/'images'/split).mkdir(parents=True);(tmp/'labels'/split).mkdir(parents=True)
        for r in selected:
            i=r['imageId'];split=r['split'];payload=payloads[i]
            with Image.open(io.BytesIO(payload)) as im:ext={'JPEG':'jpg','PNG':'png','WEBP':'webp'}.get(im.format)
            if not ext:raise ValueError('Unsupported image encoding')
            (tmp/'images'/split/(i+'.'+ext)).write_bytes(payload);lines=[]
            for b in r['signs']:
                x,y,xx,yy=b['xyxy'];lines.append(f'{names.index(b["label"])} {(x+xx)/2:.9f} {(y+yy)/2:.9f} {xx-x:.9f} {yy-y:.9f}');counts[split][b['label']]+=1
            (tmp/'labels'/split/(i+'.txt')).write_text('\n'.join(lines)+ ('\n' if lines else ''))
        summary={'sourceImages':len(ids),'includedImages':len(selected),'excludedImages':len(excluded),'negativeImages':sum(not r['signs'] for r in selected),'splitImages':dict(collections.Counter(r['split'] for r in selected)),'signBoxes':{s:dict(c) for s,c in counts.items()},'classes':names,'omittedObjectBoxes':sum(r['omittedObjectBoxes'] for r in selected),'classesMissingTrain':[n for n in names if not counts['train'][n]],'classesMissingValidation':[n for n in names if not counts['val'][n]]}
        manifest={'schema':'fixgo.derived-reviewed-signs.v1','createdAt':now(),'task':'sign_detection_only','independentTest':False,'trainingExecuted':False,'approvedGroundTruth':False,'summary':summary,'records':selected,'excluded':excluded,'sourceProfiles':list(used_profiles.values()),'limitations':['Small development set; no independent accuracy claim.','Labels inherit user reviews and may retain accepted AI errors.','Device classes intentionally omitted; no device labels auto-corrected.','Different signs with IoU > 0.8 excluded for review; true co-occurrence is possible.','All images repartitioned as development train/validation; original source split retained in records. No independent test.','Perceptual grouping is heuristic, not proof all related images were found.','Dataset rights applied at derived export time; original review journal unchanged.']}
        (tmp/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(tmp/'review-snapshot.json').write_text(json.dumps(snapshots,ensure_ascii=False,indent=2)+'\n')
        (tmp/'data.yaml').write_text(yaml.safe_dump({'path':str(dest),'train':'images/train','val':'images/val','names':dict(enumerate(names))},sort_keys=False))
        from source_profiles import attribution
        (tmp/'ATTRIBUTION.txt').write_text(attribution(list(used_profiles.values())))
        (tmp/'README.txt').write_text('Derived sign-only development dataset. Not independently evaluated. No training executed. See manifest.json for exclusions, source attribution and limitations. Original images copied byte-for-byte; original human reviews are unchanged.\n')
        # Detect review/profile edits during snapshot creation before publishing.
        for d in details:
            current=get('detail?id='+d['row']['image_id'])
            if (current.get('human') or {}).get('eventHash')!=(d.get('human') or {}).get('eventHash'):raise ValueError('Review changed while preparing export')
        if canonical(get('source-profiles'))!=canonical(profiles):raise ValueError('Source profile changed while preparing export')
        tmp.rename(dest);print(json.dumps({'path':str(dest),'summary':summary},ensure_ascii=False,indent=2))
    except BaseException:shutil.rmtree(tmp);raise

if __name__=='__main__':main()
