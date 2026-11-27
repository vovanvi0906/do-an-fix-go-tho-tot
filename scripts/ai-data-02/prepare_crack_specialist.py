#!/usr/bin/env python3
"""Add existing source-mask development data to reviewed crack scopes, preserving tests."""
import collections,json,shutil
from pathlib import Path
import numpy as np
from prepare_observable_v2 import features,similarity
from multiservice_data import BASE,sha
from build_reviewed_scope_packs import checked
SOURCE=BASE/'02-curated/fixgo-sign-review-v5/crack'
MASKS=BASE/'02-curated/fixgo-multiservice-ai-v2-clean'
OUT=BASE/'02-curated/fixgo-crack-reviewed-v5'

def main():
    if OUT.exists():raise ValueError('Immutable version exists')
    records=json.loads((SOURCE/'manifest.json').read_text())['records'];pins=json.loads((MASKS/'SHA256SUMS.json').read_text())
    if not all(sha((MASKS/p).read_bytes())==digest for p,digest in pins.items()):raise ValueError('Pinned source dataset changed')
    manifest=json.loads((MASKS/'manifest.json').read_text())
    for r in records:r['labelOrigin']='AI_VISUALLY_REVIEWED_SOURCE'
    for r in manifest['newRecords']:
        if r['split']=='test':continue
        image=MASKS/'images'/r['split']/(r['imageId']+Path(r['member']).suffix)
        if sha(image.read_bytes())!=r['sha256'] or sha(image.read_bytes())!=pins[str(image.relative_to(MASKS))]:raise ValueError('Mask development source changed')
        records.append({'imageId':r['imageId'],'split':r['split'],'groupId':r['groupId'],'sourceSha256':r['sha256'],'image':str(image),'boxes':[r['xyxy']],'labelOrigin':r['annotationStatus']})
    refs={r['imageId']:features(Path(r['image']).read_bytes()) for r in records};exclude=[]
    for a in [r for r in records if r['split']=='train']:
        pixel,gray=refs[a['imageId']]
        for b in [r for r in records if r['split']=='val']:
            op,og=refs[b['imageId']]
            same=pixel==op or a['groupId']==b['groupId']
            if not same:
                same=any(np.abs(gray-g).mean()<=12 and similarity(gray,g)>=.94 for k in range(4) for g in [np.rot90(og,k),np.rot90(og,k)[:,::-1]])
            if same:exclude.append({'imageId':a['imageId'],'reason':'CONSERVATIVE_CROSS_SPLIT_DUPLICATE','validationImageId':b['imageId']});break
    removed={r['imageId'] for r in exclude};records=[r for r in records if r['imageId'] not in removed];OUT.mkdir(parents=True);counts=collections.Counter()
    for r in records:
        image=OUT/'images'/r['split']/(r['imageId']+Path(r['image']).suffix);label=OUT/'labels'/r['split']/(r['imageId']+'.txt');image.parent.mkdir(parents=True,exist_ok=True);label.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(r['image'],image)
        boxes=[checked(b) for b in r['boxes']]
        label.write_text(''.join('0 '+' '.join(f'{v:.8f}' for v in ((b[0]+b[2])/2,(b[1]+b[3])/2,b[2]-b[0],b[3]-b[1]))+'\n' for b in boxes));r['image']=str(image);r['label']=str(label);counts[r['split']+('_positive' if boxes else '_negative')]+=1
    (OUT/'data.yaml').write_text(f'path: {OUT}\ntrain: images/train\nval: images/val\nnames: [sign:crack]\n')
    report={'classCode':'crack','counts':dict(counts),'records':records,'excluded':exclude,'reviewManifestSha256':sha((SOURCE/'manifest.json').read_bytes()),'labelStatus':'AI_AND_SOURCE_MASK_LABELS_NOT_EXPERT_VERIFIED','independentTest':False,'commercialProductionEligible':False,'limitations':['DeepCrack non-commercial research/education source.','Source mask envelopes are localization proxies, not native detection boxes.','Three development negatives are too few for production false-alert estimation.','No inference on reserved test during preparation.']}
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n');(OUT/'SHA256SUMS.json').write_text(json.dumps({str(p.relative_to(OUT)):sha(p.read_bytes()) for p in OUT.rglob('*') if p.is_file()},indent=2)+'\n');print(json.dumps({'counts':dict(counts),'excluded':exclude},indent=2))
if __name__=='__main__':main()
