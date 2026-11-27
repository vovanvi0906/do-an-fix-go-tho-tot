#!/usr/bin/env python3
"""Source-only priority review and inventory accounting; no old test reuse or AI labels assumed true."""
import collections,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from multiservice_data import BASE,sha
ROOT=BASE/'02-curated/fixgo-priority-review-v1'
SCOPES=[('B','broken_part'),('S','socket_damage_or_displacement'),('E','exposed_conductor')]

def main():
    if ROOT.exists():raise ValueError('Review version exists')
    source=BASE/'02-curated/fixgo-multiservice-ai-v1/manifest.json';old=json.loads(source.read_text());audit=json.loads((BASE/'02-curated/multiservice-source-audit-v1/audit.json').read_text());used_tests=set()
    for p in [BASE/'04-training/multiservice-challenge-v1/cases.json']:
        used_tests.update(r['sha256'] for r in json.loads(p.read_text()))
    cf=BASE/'03-tests/crackforest-external-v1'
    for p in cf.rglob('*.jpg'):used_tests.add(sha(p.read_bytes()))
    ROOT.mkdir(parents=True);index=[];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
    for prefix,code in SCOPES:
        rows=sorted([r for r in old['records'] if r['sha256'] not in used_tests and any(a['code']==code for a in r['proposedAnnotations'])],key=lambda r:r['imageId'])
        for page in range((len(rows)+5)//6):
            sheet=Image.new('RGB',(1200,1800),'#15212b');d=ImageDraw.Draw(sheet)
            for j,r in enumerate(rows[page*6:page*6+6]):
                if sha(Path(r['path']).read_bytes())!=r['sha256']:raise ValueError('Source changed')
                review_id='P-'+prefix+str(page*6+j+1).zfill(3);im=Image.open(r['path']).convert('RGB');draw=ImageDraw.Draw(im)
                for a in r['proposedAnnotations']:
                    x,y,xx,yy=a['xyxy'];draw.rectangle((x*im.width,y*im.height,xx*im.width-1,yy*im.height-1),outline='magenta' if a['code']==code else 'cyan',width=max(2,im.width//200))
                im.thumbnail((580,530));x=j%2*600;y=j//2*600;sheet.paste(im,(x,y+55));d.text((x+3,y+3),review_id+' '+r['split']+' '+code,font=font,fill='white');d.text((x+3,y+28),r['imageId'],font=font,fill='white');index.append({'reviewId':review_id,'imageId':r['imageId'],'path':r['path'],'split':r['split'],'groupId':r['groupId'],'focusCode':code,'sheet':prefix+'-'+str(page+1).zfill(2)+'.jpg'})
            sheet.save(ROOT/(prefix+'-'+str(page+1).zfill(2)+'.jpg'),quality=94)
    ledger={'sourceManifestSha256':sha(source.read_bytes()),'sourceInventoryImages':len(audit['records']),'oldDevelopmentImages':len(old['records']),'priorityScopes':dict(collections.Counter(r['focusCode'] for r in index)),'testHashesExcluded':len(used_tests),'newReviewImageIds':len({r['imageId'] for r in index}),'remainingSourceRecordsNotVisuallyReviewed':[r['imageId'] for r in audit['records'] if r['imageId'] not in {r['imageId'] for r in index}],'labelStatus':'SOURCE_ONLY_PENDING_AI_REVIEW','scope':'Three pending priority groups; crack has a previous reviewed development set. Other source records remain pending/deferred, never automatic negatives.'}
    (ROOT/'inventory-accounting.json').write_text(json.dumps(ledger,indent=2)+'\n');(ROOT/'review-index.json').write_text(json.dumps(index,indent=2)+'\n');print(json.dumps({k:v for k,v in ledger.items() if k!='remainingSourceRecordsNotVisuallyReviewed'},indent=2))
if __name__=='__main__':main()
