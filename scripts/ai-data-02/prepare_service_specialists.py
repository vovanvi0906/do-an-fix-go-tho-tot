#!/usr/bin/env python3
"""Small scoped research trials with explicit AI-reviewed negatives; preserve all old splits."""
import collections,json,shutil
from pathlib import Path
from datetime import datetime,timezone
from multiservice_data import BASE,sha
ROOT=BASE/'02-curated/fixgo-service-specialists-v1'
REVIEW=BASE/'02-curated/observable-normal-review-v1'
ACCEPTED={'N001','N003','N008','N011','N012','N013','N014','N015'}

def main():
    if ROOT.exists():raise ValueError('Immutable version exists')
    normal=json.loads((REVIEW/'index.json').read_text());decisions=[]
    for r in normal:decisions.append({'reviewId':r['reviewId'],'imageId':r['imageId'],'sha256':r['sha256'],'status':'AI_VISUAL_REVIEW_NOT_EXPERT_VERIFIED','negativeScopes':['burn_mark','surface_soiling'] if r['reviewId'] in ACCEPTED else [],'note':'No local charring or loose dust/fiber buildup visible; no claim of a fault-free device.' if r['reviewId'] in ACCEPTED else 'Exclude editorial/stock/illustration/marketing or duplicate family; not automatically a negative.'})
    (REVIEW/'decisions.json').write_text(json.dumps({'reviewedAtUtc':datetime.now(timezone.utc).isoformat(),'decisions':decisions},indent=2)+'\n')
    ROOT.mkdir(parents=True);summary={}
    for code in ['burn_mark','surface_soiling','water_spray']:
        original=json.loads((BASE/f'02-curated/fixgo-sign-review-v6/{code}/manifest.json').read_text());records=original['records']
        if code!='water_spray':
            for r in normal:
                if r['reviewId'] not in ACCEPTED:continue
                records.append({'imageId':r['imageId'],'image':r['path'],'sourceSha256':r['sha256'],'split':r['split'],'groupId':r['groupId'],'boxes':[],'reviewId':r['reviewId']})
        root=ROOT/code;counts=collections.Counter();groups={};hashes={}
        for r in records:
            if sha(Path(r['image']).read_bytes())!=r['sourceSha256']:raise ValueError('Source bytes changed')
            for mapping,key in [(groups,r['groupId']),(hashes,r['sourceSha256'])]:
                if key in mapping and mapping[key]!=r['split']:raise ValueError('Cross-split group/hash')
                mapping[key]=r['split']
            image=root/'images'/r['split']/(r['imageId']+Path(r['image']).suffix);label=root/'labels'/r['split']/(r['imageId']+'.txt');image.parent.mkdir(parents=True,exist_ok=True);label.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r['image'],image)
            label.write_text(''.join('0 '+' '.join(f'{v:.8f}' for v in ((b[0]+b[2])/2,(b[1]+b[3])/2,b[2]-b[0],b[3]-b[1]))+'\n' for b in r['boxes']));r['image']=str(image);r['label']=str(label);counts[r['split']+('_positive' if r['boxes'] else '_negative')]+=1
        (root/'data.yaml').write_text(f'path: {root}\ntrain: images/train\nval: images/val\nnames: [sign:{code}]\n');(root/'manifest.json').write_text(json.dumps({'scope':code,'counts':dict(counts),'records':records,'independentTest':False,'labelStatus':'AI_VISUAL_REVIEW_NOT_EXPERT_VERIFIED','limitations':['Small reused development validation, especially burn and soil.','Scoped image negatives do not mean normal device.','No independent test or production-quality claim.']},indent=2)+'\n')
        (root/'SHA256SUMS.json').write_text(json.dumps({str(p.relative_to(root)):sha(p.read_bytes()) for p in root.rglob('*') if p.is_file()},indent=2)+'\n');summary[code]=dict(counts)
    print(json.dumps(summary,indent=2))
if __name__=='__main__':main()
