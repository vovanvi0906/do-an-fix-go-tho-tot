#!/usr/bin/env python3
"""Source-only candidate review, outside detector development data; no model inference."""
import collections,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
from multiservice_data import BASE,sha
from prepare_observable_v2 import features,similarity
ROOT=BASE/'03-tests/multiservice-challenge-v1'
SCOPES={'broken_part':['Broken Windows','Broken Tile','Broken Door'],
        'exposed_conductor':['exposed-wires'],
        'peeling_surface':['Needs Paint-Refinished','Exterior Wall Damage','Wall Damage'],
        'socket_damage_or_displacement':['damaged-socket'],
        'stain_or_discoloration':['damp','Baseboard Water Damage','Ceiling Water Damage'],
        'crack':['crack'],'negative':['normal-outlet']}

def main():
    if ROOT.exists():raise ValueError('Challenge candidate review already exists')
    audit=json.loads((BASE/'02-curated/multiservice-source-audit-v1/audit.json').read_text());old=json.loads((BASE/'02-curated/fixgo-multiservice-ai-v1/manifest.json').read_text());extra=json.loads((BASE/'02-curated/fixgo-crack-reviewed-v5/manifest.json').read_text())['records']
    refs=old['records']+[{'path':r['image'],'sha256':r['sourceSha256']} for r in extra if r['imageId'].startswith('dc-')]
    used_hash={r['sha256'] for r in refs};used_pixels={r['pixelSha256'] for r in old['records']};families={r.get('groupFamily') for r in old['records']};metadata={s['id']:s['metadata'].get('project','') for s in audit['sources']}
    variants=[]
    for r in refs:
        _,gray=features(Path(r['path']).read_bytes())
        variants.extend((r['imageId'] if 'imageId' in r else r['path'],g) for k in range(4) for g in [np.rot90(gray,k),np.rot90(gray,k)[:,::-1]])
    small=np.stack([cv2.resize(g,(8,8)) for _,g in variants]);candidates=[];excluded=[];selected=[]
    def close(gray):
        coarse=cv2.resize(gray,(8,8));indices=np.where(np.abs(small-coarse).mean(axis=(1,2))<=18)[0]
        for i in indices:
            ident,g=variants[int(i)]
            if np.abs(gray-g).mean()<=18 and similarity(gray,g)>=.90:return ident
        return None
    for scope,classes in SCOPES.items():
        count=0;target=12 if scope=='negative' else 6
        pool=sorted([r for r in audit['records'] if any(a['sourceClass'] in classes for a in r['annotations'])],key=lambda r:sha(('quality-challenge-v1!'+scope+'!'+r['imageId']).encode()))
        for row in pool:
            if count>=target:break
            family=metadata[row['sourceKey']]+'!'+Path(row['member']).name.split('.rf.')[0]
            if row['sha256'] in used_hash or row['pixelSha256'] in used_pixels or family in families or row['imageId'] in selected:continue
            pixel,gray=features(Path(row['path']).read_bytes());match=close(gray)
            if match:excluded.append({'imageId':row['imageId'],'scope':scope,'reason':'POSSIBLE_DEVELOPMENT_NEAR_DUPLICATE','match':match});continue
            if any(np.abs(gray-g).mean()<=18 and similarity(gray,g)>=.90 for _,g in [(r['imageId'],features(Path(r['path']).read_bytes())[1]) for r in candidates]):continue
            count+=1;selected.append(row['imageId']);used_hash.add(row['sha256']);used_pixels.add(pixel);families.add(family);candidates.append({**row,'scope':scope,'reviewId':f'Q{len(candidates)+1:03}','sourceFamily':family,'reviewStatus':'PENDING_SOURCE_ONLY_REVIEW'})
    ROOT.mkdir(parents=True);fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    from PIL import ImageFont
    font=ImageFont.truetype(fontpath,18)
    for page in range((len(candidates)+5)//6):
        sheet=Image.new('RGB',(1200,1800),'#15212b');d=ImageDraw.Draw(sheet)
        for j,r in enumerate(candidates[page*6:page*6+6]):
            im=Image.open(r['path']).convert('RGB');draw=ImageDraw.Draw(im)
            for a in r['annotations']:
                if a['sourceClass'] not in SCOPES[r['scope']]:continue
                x,y,xx,yy=a['xyxy'];draw.rectangle((x*im.width,y*im.height,xx*im.width-1,yy*im.height-1),outline='magenta',width=max(2,im.width//200))
            im.thumbnail((580,530));x=j%2*600;y=j//2*600;sheet.paste(im,(x,y+55));d.text((x+3,y+3),r['reviewId']+' '+r['scope'],font=font,fill='white');d.text((x+3,y+28),r['imageId'],font=font,fill='white');r['sheet']=f'review-{page+1:02}.jpg'
        sheet.save(ROOT/f'review-{page+1:02}.jpg',quality=94)
    report={'schema':'fixgo.challenge-candidate-review.v1','status':'SOURCE_ONLY_REVIEW_NOT_YET_TEST','independentExpertLabels':False,'developmentImagesExcluded':len(refs),'parentDevelopmentManifestSha256':sha((BASE/'02-curated/fixgo-multiservice-ai-v1/manifest.json').read_bytes()),'records':candidates,'nearDuplicatesExcluded':excluded,'limitations':['CLIP screening may previously have seen these source images; not independently collected data.','No YOLO observer inference on these selected candidates before labels/final protocol freeze.','Duplicate screening is conservative and can miss related scenes.']}
    (ROOT/'candidate-index.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'candidates':len(candidates),'scopes':dict(collections.Counter(r['scope'] for r in candidates)),'nearDuplicatesExcluded':len(excluded)},indent=2))
if __name__=='__main__':main()
