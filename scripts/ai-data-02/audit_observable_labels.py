#!/usr/bin/env python3
"""Immutable structural audit and source-only review sheets; no test/model predictions."""
import collections,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from multiservice_data import BASE,sha
from evaluate_multiservice_trial import overlap
ROOT=BASE/'02-curated/observable-label-review-v1'
PARENT=BASE/'02-curated/fixgo-multiservice-ai-v1'

def main():
    if ROOT.exists():raise ValueError('Review version exists')
    ROOT.mkdir(parents=True);m=json.loads((PARENT/'manifest.json').read_text());entries=[]
    for row in m['records']:
        annotations=row['proposedAnnotations'];flags=[]
        for i,a in enumerate(annotations):
            x,y,xx,yy=a['xyxy'];area=(xx-x)*(yy-y)
            if area>.65:flags.append({'type':'LARGE_SIGN_REGION_REQUIRES_VISUAL_REVIEW','index':i,'area':area})
            if a['code']=='scorched_outlet':flags.append({'type':'WHOLE_OBJECT_LABEL_NOT_LOCAL_BURN_REGION','index':i})
            for j,b in enumerate(annotations[:i]):
                if overlap(a['xyxy'],b['xyxy'])>.8:flags.append({'type':'SAME_CLASS_DUPLICATE' if a['code']==b['code'] else 'CONFLICTING_CLASS_OVERLAP','indices':[j,i]})
        entries.append({'imageId':row['imageId'],'split':row['split'],'groupId':row['groupId'],'sourceSha256':row['sha256'],'flags':flags,'visualReview':'PENDING_OR_QUARANTINE','originalAnnotations':annotations})
    (ROOT/'structural-audit.json').write_text(json.dumps({'parentManifestSha256':sha((PARENT/'manifest.json').read_bytes()),'images':len(entries),'labelStatus':'AI_UNVERIFIED','independentTest':False,'records':entries},indent=2)+'\n')
    codes=[('B','scorched_outlet'),('W','visible_water'),('S','surface_soiling'),('C','crack')];index=[];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
    for prefix,code in codes:
        rows=sorted([r for r in m['records'] if any(a['code']==code for a in r['proposedAnnotations'])],key=lambda r:r['imageId']);page_size=6 if prefix=='B' else 8
        for page in range((len(rows)+page_size-1)//page_size):
            sheet=Image.new('RGB',(1200,600*(page_size//2)),'#17212b');draw=ImageDraw.Draw(sheet)
            for slot,row in enumerate(rows[page*page_size:page*page_size+page_size]):
                number=page*page_size+slot+1;review_id=prefix+str(number).zfill(3);payload=Path(row['path']).read_bytes()
                if sha(payload)!=row['sha256']:raise ValueError('Source bytes changed')
                im=Image.open(row['path']).convert('RGB');d=ImageDraw.Draw(im)
                for a in row['proposedAnnotations']:
                    x,y,xx,yy=a['xyxy'];d.rectangle([x*im.width,y*im.height,xx*im.width-1,yy*im.height-1],outline='cyan' if a['code']!=code else 'magenta',width=max(2,im.width//250))
                im.thumbnail((580,530));x=(slot%2)*600;y=(slot//2)*600;sheet.paste(im,(x,y+45));draw.text((x+5,y+3),review_id+' | '+row['split']+' | '+code,font=font,fill='white');draw.text((x+5,y+25),row['imageId'],font=font,fill='white')
                index.append({'reviewId':review_id,'imageId':row['imageId'],'path':row['path'],'width':row.get('width'),'height':row.get('height'),'split':row['split'],'groupId':row['groupId'],'focusCode':code,'sheet':prefix+'-'+str(page+1).zfill(2)+'.jpg'})
            sheet.save(ROOT/(prefix+'-'+str(page+1).zfill(2)+'.jpg'),quality=93)
    (ROOT/'review-index.json').write_text(json.dumps(index,indent=2)+'\n');print(json.dumps({'images':len(entries),'flaggedImages':sum(bool(r['flags']) for r in entries),'focusImages':dict(collections.Counter(r['focusCode'] for r in index))},indent=2))

if __name__=='__main__':main()
