#!/usr/bin/env python3
"""Frozen, external-source crack evaluation; no training or threshold search."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-multiservice-yolo')
import argparse,collections,hashlib,json,shutil,subprocess
from datetime import datetime,timezone
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import yaml
from multiservice_data import BASE,sha
from evaluate_multiservice_trial import measure

RAW=BASE/'01-raw/crackforest-external-test-ed57c2d'
TEST=BASE/'03-tests/crackforest-external-v1'
BUNDLE=BASE/'05-models/fixgo-observable-v1'
COMMIT='ed57c2d96754e6c7d105805cd29aeeb3a799f267'

def read_seg(path):
    lines=Path(path).read_text().splitlines();start=lines.index('data');header={p[0]:p[1] for line in lines[:start] if len(p:=line.split())==2}
    w,h=int(header['width']),int(header['height'])
    if 'format ascii cr' not in lines:raise ValueError('Unsupported segmentation format')
    segments=int(header.get('segments','2'));mask=np.full((h,w),-1,dtype=np.int16)
    for line in lines[start+1:]:
        label,y,x,xx=map(int,line.split())
        if not 0<=label<segments or not (0<=y<h and 0<=x<=xx<w) or (mask[y,x:xx+1]!=-1).any():raise ValueError('Invalid/overlapping segmentation run')
        mask[y,x:xx+1]=label
    if (mask<0).any():raise ValueError('Incomplete segmentation')
    return mask>0

def image_features(path):
    with Image.open(path) as im:
        im=im.convert('RGB');v=list(im.convert('L').resize((9,8)).get_flattened_data())
        dh=sum((v[y*9+x]>v[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8))
        return sha(str(im.size).encode()+im.tobytes()),dh,np.asarray(im.resize((32,32)),dtype=np.int16),np.asarray(im.transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((32,32)),dtype=np.int16)

def prepare():
    from scipy.io import loadmat
    if TEST.exists():raise ValueError('Frozen test already exists')
    revision=subprocess.check_output(['git','-C',str(RAW),'rev-parse','HEAD'],text=True).strip()
    if revision!=COMMIT:raise ValueError('External source revision mismatch')
    manifest=json.loads((BUNDLE/'model-manifest.json').read_text());weights=BUNDLE/manifest['weights']
    if sha(weights.read_bytes())!=manifest['weightsSha256']:raise ValueError('Model hash mismatch')
    audit=json.loads((BASE/'02-curated/multiservice-source-audit-v1/audit.json').read_text())
    dev=json.loads((BASE/'02-curated/fixgo-multiservice-ai-v1/manifest.json').read_text())
    # Check against ALL previously inspected source images, not only training rows.
    previous={r['path']:r for r in audit['records']+dev['records']};references=[]
    for r in previous.values():
        pixel,dh,thumb,flip=image_features(r['path']);references.append((r['imageId'],pixel,dh,thumb,flip))
    crack_id=next(i for i,c in enumerate(manifest['classes']) if c['code']=='crack');rows=[];excluded=[];seen=set()
    for seg in sorted((RAW/'seg').glob('*.seg')):
        image=RAW/'image'/(seg.stem+'.jpg')
        if not image.is_file():excluded.append({'id':seg.stem,'reason':'MISSING_IMAGE'});continue
        mask=read_seg(seg);mat=RAW/'groundTruth'/(seg.stem+'.mat')
        ground=loadmat(mat,simplify_cells=True)['groundTruth']['Segmentation']
        if not np.array_equal(mask,ground>1):raise ValueError('ASCII mask differs from source MATLAB ground truth')
        with Image.open(image) as im:
            if im.size!=(mask.shape[1],mask.shape[0]):raise ValueError('Image/mask dimensions differ')
        pixel,dh,thumb,flip=image_features(image);matches=[]
        for image_id,other,other_dh,other_thumb,other_flip in references:
            if pixel==other or ((dh^other_dh).bit_count()<=5 and np.abs(thumb-other_thumb).mean()<=15) or np.abs(thumb-other_flip).mean()<=8:matches.append(image_id)
        if matches or pixel in seen:excluded.append({'id':seg.stem,'reason':'EXACT_OR_NEAR_DUPLICATE','matches':matches});continue
        seen.add(pixel);ys,xs=np.where(mask);boxes=[]
        if len(xs):boxes=[{'classId':crack_id,'xyxy':[float(xs.min()/mask.shape[1]),float(ys.min()/mask.shape[0]),float((xs.max()+1)/mask.shape[1]),float((ys.max()+1)/mask.shape[0])]}]
        rows.append({'id':'cfd-'+seg.stem,'image':str(image),'seg':str(seg),'mat':str(mat),'imageSha256':sha(image.read_bytes()),'segSha256':sha(seg.read_bytes()),'matSha256':sha(mat.read_bytes()),'pixelSha256':pixel,'truth':boxes,'positivePixels':int(mask.sum())})
    if not rows:raise ValueError('No eligible test images')
    (TEST/'images/test').mkdir(parents=True);(TEST/'labels/test').mkdir(parents=True);(TEST/'masks').mkdir()
    for r in rows:
        shutil.copy2(r['image'],TEST/'images/test'/(r['id']+'.jpg'));Image.fromarray(read_seg(r['seg']).astype('uint8')*255).save(TEST/'masks'/(r['id']+'.png'))
        lines=[]
        for b in r['truth']:
            x,y,xx,yy=b['xyxy'];lines.append(f'{crack_id} {(x+xx)/2:.8f} {(y+yy)/2:.8f} {xx-x:.8f} {yy-y:.8f}')
        (TEST/'labels/test'/(r['id']+'.txt')).write_text('\n'.join(lines)+('\n' if lines else ''))
    names={i:c['name'] for i,c in enumerate(manifest['classes'])}
    (TEST/'data.yaml').write_text(yaml.safe_dump({'path':str(TEST),'train':'images/test','val':'images/test','test':'images/test','names':names},sort_keys=False))
    shutil.copy2(RAW/'README.md',TEST/'SOURCE-README.md')
    protocol={'schema':'fixgo.external-crack-test.v1','frozenAtUtc':datetime.now(timezone.utc).isoformat(),'sourceUrl':'https://github.com/cuilimeng/CrackForest-dataset','sourceCommit':revision,'license':'NON_COMMERCIAL_RESEARCH_ONLY; see SOURCE-README.md','modelSha256':manifest['weightsSha256'],'modelManifestSha256':sha((BUNDLE/'model-manifest.json').read_bytes()),'imgsz':manifest['imgsz'],'confidence':manifest['threshold'],'classId':crack_id,'classes':names,'records':rows,'excluded':excluded,'policy':['Freeze data, source truth, model, size and confidence before inference; no tuning on this test.','Use ALL image/seg pairs passing duplicate and structural checks; no CLIP filtering or prediction-based selection.','Compare against all previous source and development images using exact pixels and conservative near-duplicate checks.','Source manual segmentation converted to ONE enclosing bbox per image (all crack branches); derived localization proxy, not native object-detection ground truth.','Evaluate ONLY crack: other classes are not exhaustively annotated.','Also report crack image recall and crack-mask pixel coverage by predicted crack boxes at the frozen threshold.','No negative crack images means false-positive rate on crack-free scenes cannot be estimated.','External source is road pavement, not household wall; cannot establish performance across all FixGo services.','No image reuse in future training while this test version is reserved.','Unknown overlap with original pretrained-model data cannot be ruled out.']}
    (TEST/'protocol.json').write_text(json.dumps(protocol,indent=2)+'\n')
    pins={str(p.relative_to(TEST)):sha(p.read_bytes()) for p in TEST.rglob('*') if p.is_file()}
    (TEST/'SHA256SUMS.json').write_text(json.dumps(pins,indent=2)+'\n')
    print(json.dumps({'frozenImages':len(rows),'excluded':excluded,'positiveImages':sum(bool(r['truth']) for r in rows),'crackClassId':crack_id,'protocol':str(TEST/'protocol.json')},indent=2))

def evaluate():
    import torch
    from ultralytics import YOLO
    torch.set_num_threads(2);protocol=json.loads((TEST/'protocol.json').read_text());pins=json.loads((TEST/'SHA256SUMS.json').read_text())
    def unchanged():return all(sha((TEST/p).read_bytes())==digest for p,digest in pins.items())
    if not unchanged():raise ValueError('Frozen test changed')
    manifest=json.loads((BUNDLE/'model-manifest.json').read_text());weights=BUNDLE/manifest['weights']
    if sha(weights.read_bytes())!=protocol['modelSha256'] or sha((BUNDLE/'model-manifest.json').read_bytes())!=protocol['modelManifestSha256']:raise ValueError('Frozen model changed')
    out=TEST/'results'
    if out.exists():raise ValueError('Test already evaluated; do not tune/reuse silently')
    out.mkdir();model=YOLO(str(weights));names={int(k):v for k,v in protocol['classes'].items()}
    if model.names!=names:raise ValueError('Class mapping differs')
    predictions={};truth={r['id']:r['truth'] for r in protocol['records']};rows=[];cls=protocol['classId'];latencies=[]
    by_id={r['id']:r for r in protocol['records']}
    for prediction in model.predict(source=str(TEST/'images/test'),imgsz=protocol['imgsz'],conf=protocol['confidence'],device='cpu',stream=True,verbose=False,save=False):
        image_id=Path(prediction.path).stem;cracks=[{'classId':int(c),'score':float(s),'xyxy':xy} for c,s,xy in zip(prediction.boxes.cls.tolist(),prediction.boxes.conf.tolist(),prediction.boxes.xyxyn.tolist()) if int(c)==cls];predictions[image_id]=cracks;latencies.append(prediction.speed['inference'])
        mask=np.asarray(Image.open(TEST/'masks'/(image_id+'.png')))>0;covered=np.zeros_like(mask)
        for b in cracks:
            x,y,xx,yy=b['xyxy'];covered[max(0,int(y*mask.shape[0])):min(mask.shape[0],int(np.ceil(yy*mask.shape[0]))),max(0,int(x*mask.shape[1])):min(mask.shape[1],int(np.ceil(xx*mask.shape[1])))]=True
        rows.append({'id':image_id,'crackDetections':len(cracks),'positivePixels':int(mask.sum()),'coveredCrackPixels':int((mask&covered).sum()),'predictedBoxPixels':int(covered.sum())})
    operating=measure(predictions,truth,protocol['confidence'],{cls:names[cls]})
    # AP sweeps detection confidence internally as a metric, never changes deployed threshold.
    metric=model.val(data=str(TEST/'data.yaml'),split='test',imgsz=protocol['imgsz'],batch=8,device='cpu',workers=0,plots=False,project=str(out),name='bbox-proxy',verbose=False)
    pixel_total=sum(r['positivePixels'] for r in rows);covered_total=sum(r['coveredCrackPixels'] for r in rows)
    ap={'mAP50':float(metric.box.map50),'mAP50_95':float(metric.box.map),'note':'ONE source-mask enclosing bbox per image; proxy only, not segmentation IoU or native detection benchmark.'}
    positive=sum(bool(r['truth']) for r in by_id.values());detected=sum(bool(predictions[k]) for k,r in by_id.items() if r['truth'])
    report={'schema':'fixgo.external-crack-evaluation.v1','externalSourceTest':True,'scope':'crack on road pavement ONLY','images':len(rows),'positiveImages':positive,'negativeImages':len(rows)-positive,'modelSha256':protocol['modelSha256'],'confidenceFrozen':protocol['confidence'],'imgszFrozen':protocol['imgsz'],'imageRecall':{'detected':detected,'total':positive,'recall':detected/max(1,positive),'note':'Any crack box counts, even if poorly located; not accuracy.'},'bboxProxyAP':ap,'bboxOperatingPoint':operating,'maskCoverage':{'coveredCrackPixels':covered_total,'totalCrackPixels':pixel_total,'coverage':covered_total/max(1,pixel_total),'note':'Coverage by rectangular crack detections, not segmentation IoU. Large boxes can inflate coverage.'},'meanInferenceMs':sum(latencies)/len(latencies),'frozenDataUnchanged':unchanged(),'limitations':protocol['policy'],'perImage':rows}
    (out/'predictions.json').write_text(json.dumps(predictions,indent=2)+'\n');(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    # Fixed first eight images, selected by ID rather than prediction quality.
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16);sheet=Image.new('RGB',(1000,1480),'#17212b');draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(protocol['records'][:8]):
        im=Image.open(r['image']).convert('RGB');d=ImageDraw.Draw(im)
        for b in r['truth']:d.rectangle([b['xyxy'][0]*im.width,b['xyxy'][1]*im.height,b['xyxy'][2]*im.width-1,b['xyxy'][3]*im.height-1],outline='lime',width=2)
        for b in predictions[r['id']]:d.rectangle([b['xyxy'][0]*im.width,b['xyxy'][1]*im.height,b['xyxy'][2]*im.width-1,b['xyxy'][3]*im.height-1],outline='magenta',width=3)
        im.thumbnail((490,330));x=(i%2)*500;y=(i//2)*370;sheet.paste(im,(x,y+28));draw.text((x+5,y+4),r['id']+' | source=green prediction=purple',font=font,fill='white')
    sheet.save(out/'first-eight.jpg')
    print(json.dumps({k:v for k,v in report.items() if k not in ['perImage','limitations']},indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('stage',choices=['prepare','evaluate']);a=p.parse_args();prepare() if a.stage=='prepare' else evaluate()
