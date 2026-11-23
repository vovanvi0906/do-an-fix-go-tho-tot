import json,sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from PIL import Image
root=Path.home()/'Work/datasetai';q=root/'02-development/ai01-quality-v1';rows={r['id']:r for r in map(json.loads,(q/'drafts.jsonl').read_text().splitlines())}
ids=['img-19358','img-20263','img-00217',next(r['id'] for r in rows.values() if r['dataset']=='thietbigiadinh' and any(s['sourceLabel']=='washing_machine' for s in r['sourceReferences']))]
fault=next(r['id'] for r in rows.values() if r['dataset']=='suanuoc' and any(s['sourceLabel']=='toilet_issue' for s in r['sourceReferences']))
pipe=next(r['id'] for r in rows.values() if r['dataset']=='suanuoc' and any(s['sourceLabel']=='leaking_pipe' for s in r['sourceReferences']))
ids +=[fault,pipe];fig,axs=plt.subplots(2,3,figsize=(14,9));
for ax,i in zip(axs.flat,ids):
 r=rows[i];im=Image.open(q/r['copyPath']);ax.imshow(im);w,h=im.size
 for s in r['sourceReferences']:
  x,y,x2,y2=s['xyxy'];ax.add_patch(Rectangle((x*w,y*h),(x2-x)*w,(y2-y)*h,fill=False,ec='yellow',ls='--',lw=1.5))
 for s in (r['sourceModelAnalysis'] or {}).get('predictionsAt025',[]):
  x,y,x2,y2=s['xyxy'];ax.add_patch(Rectangle((x*w,y*h),(x2-x)*w,(y2-y)*h,fill=False,ec='cyan',lw=1.2))
 ax.set_title(i+' | '+','.join(s['sourceLabel'] for s in r['sourceReferences'])[:45],fontsize=9);ax.axis('off')
fig.suptitle('SOURCE REFERENCES (yellow dashed, unverified) vs strict-v2 >=0.25 (cyan)\nNot human corrections or independent ground truth',fontsize=12);fig.tight_layout();fig.savefig('docs/ai01-admin/evidence/quality/source-model-cases.png',dpi=130)
print(ids)
