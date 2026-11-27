"""Render proposed corrected geometry for audit; does not certify labels."""
import json,html
from PIL import Image,ImageDraw
from build_reviewed_scope_packs import OUT

def main():
    report=json.loads((OUT/'review-report.json').read_text());dest=OUT/'geometry-preview';dest.mkdir(exist_ok=True);cards=[]
    for pack in sorted(report['packs']):
        manifest=json.loads((OUT/pack/'manifest.json').read_text())
        positives=[r for r in manifest['records'] if r['boxes']]
        for start in range(0,len(positives),6):
            sheet=Image.new('RGB',(1200,1800),'#15212b');d=ImageDraw.Draw(sheet)
            for j,row in enumerate(positives[start:start+6]):
                im=Image.open(row['image']).convert('RGB');draw=ImageDraw.Draw(im)
                for x,y,xx,yy in row['boxes']:draw.rectangle((x*im.width,y*im.height,xx*im.width-1,yy*im.height-1),outline='#00ff88',width=max(2,im.width//180))
                im.thumbnail((580,550));x=j%2*600;y=j//2*600;sheet.paste(im,(x,y+40));d.text((x+4,y+4),row['reviewId']+' '+row['split']+' '+pack,fill='white')
            name=f'{pack}-{start//6+1:02}.jpg';sheet.save(dest/name,quality=94);cards.append(f'<figure><figcaption>{html.escape(name)}</figcaption><img loading="lazy" src="{name}" width="100%"></figure>')
    (dest/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>AI label geometry review</title><style>body{background:#15212b;color:white;font:18px sans-serif;max-width:1200px;margin:auto}figure{margin:30px 0}</style><h1>Proposed corrected regions</h1><p>AI reviewed development labels; approximate geometry, not expert ground truth. Green boxes are proposed sign regions. No test images.</p>'+''.join(cards))
    print(str(dest/'index.html'))
if __name__=='__main__':main()
