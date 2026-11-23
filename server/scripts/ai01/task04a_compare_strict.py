"""Qualitative fresh detector vs current YOLO-cls+CLIP and offline resolver.
No production HTTP call, database access, or ground-truth promotion.
"""
import csv
import gc
import hashlib
import json
import os
import sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from task04a_strict import RUN, REPO, runtime, sha, save, protected
sys.path[:0]=[str(REPO/'ai-service/eval/ai01'),str(REPO/'ai-service')]

def iou(a,b):
 x1,y1,x2,y2=max(a[0],b[0]),max(a[1],b[1]),min(a[2],b[2]),min(a[3],b[3]);inter=max(0,x2-x1)*max(0,y2-y1)
 return inter/max(1e-9,(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-inter)

def match(pred, source):
 used=set();matched=[];false=[]
 for p in sorted(pred,key=lambda p:-p['confidence']):
  choices=[(iou(p['xyxy'],s['xyxy']),j) for j,s in enumerate(source) if j not in used and s['classId']==p['classId']]
  score,j=max(choices,default=(0,-1))
  if score>=.5:used.add(j);matched.append({'prediction':p,'sourceIndex':j,'iou':score})
  else:false.append(p)
 return {'sourceMatched':len(matched),'unmatchedPredictions':len(false),'sourceMissed':len(source)-len(used),'matches':matched}

def visualize(path,source,pred,dest):
 im=Image.open(path).convert('RGB');draw=ImageDraw.Draw(im);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',max(12,im.width//45))
 for boxes,color,prefix in [(source,'#10b981','SOURCE?'),(pred,'#e11d48','PRED')]:
  for box in boxes:
   xy=box['xyxy'];draw.rectangle(xy,outline=color,width=max(2,im.width//250))
   text=f"{prefix} {box['classId']}"+(f" {box['confidence']:.2f}" if 'confidence' in box else '')
   draw.text((max(0,xy[0]),max(0,xy[1]-16)),text,fill=color,font=font,stroke_width=1,stroke_fill='white')
 im.thumbnail((1000,1000));dest.parent.mkdir(exist_ok=True);im.save(dest)

def main():
 runtime();from ultralytics import YOLO
 selection=json.loads((RUN/'qualitative-selection.json').read_text());classes=json.loads((RUN/'class-map.json').read_text())
 detector=YOLO(str(RUN/'training/weights/best.pt'));records=[]
 for row in selection:
  matches=list((RUN/'data/images/val').glob(row['id']+'.*'));path=matches[0];image=cv2.imread(str(path));h,w=image.shape[:2]
  source=[]
  for line in (RUN/'data/labels/val'/(row['id']+'.txt')).read_text().splitlines():
   c,x,y,bw,bh=map(float,line.split());source.append({'classId':int(c),'xyxy':[(x-bw/2)*w,(y-bh/2)*h,(x+bw/2)*w,(y+bh/2)*h]})
  out=detector.predict(image,imgsz=320,device='cpu',conf=.25,iou=.7,verbose=False)[0]
  pred=[{'classId':int(c),'name':out.names[int(c)],'confidence':float(conf),'xyxy':[float(v) for v in xy]} for xy,c,conf in zip(out.boxes.xyxy.tolist(),out.boxes.cls.tolist(),out.boxes.conf.tolist())]
  record={'imageId':row['id'],'image':str(path),'imageSha256':sha(path),'sourceOriginalImage':row['path'],'sourceVerification':'unverified','sourceBoxes':source,'detectorPrediction':pred,'sourceMatchAtIoU50':match(pred,source),'confidenceForExamples':.25,'officialBenchmark':False}
  visualize(path,source,pred,RUN/'examples'/(row['id']+'.jpg'));records.append(record)
 del detector;gc.collect()
 from runner import setup_models,Resolver
 catalog=Path.home()/'Work/datasetai/06-benchmarks/ai01-label-review-v1/catalog-db-snapshot.json'
 client,artifact=setup_models(REPO/'ai-service/weights/yolov8n-cls-fixgo.pt');resolver=Resolver(catalog)
 try:
  for record in records:
   path=Path(record['image'])
   with path.open('rb') as f:response=client.post('/ai/v2/diagnose',files={'file':('image.jpg',f,'application/octet-stream')},data={'description':''})
   response.raise_for_status();raw=response.json();debug=client.app.state.last_debug
   if debug.get('stageOutcomes',{}).get('clip')!='ready' or debug.get('stageOutcomes',{}).get('yolo')!='ready':raise RuntimeError('Fresh baseline model stage unavailable')
   record['currentBaseline']={'rawYoloClassificationScores':debug.get('yoloScores'),'rawClipCategoryScores':debug.get('clipScores'),'rawV2Prediction':raw,
      'diagnosisResolver':resolver.call(raw,path,'',.6)['result'],'resolverScope':'same JS resolver offline; frozen TASK03B catalog; legacy symptom flag false, not live DB/production API'}
   print('COMPARED',record['imageId'],json.dumps(record['sourceMatchAtIoU50']|{'matches':[]}),flush=True)
 finally:resolver.close();client.close()
 with (RUN/'qualitative-comparison.jsonl').open('x') as f:
  for r in records:f.write(json.dumps(r,ensure_ascii=False)+'\n')
 save(RUN/'comparison-context.json',{'samples':len(records),'sampleRule':'frozen before training: 3 source-group-diverse images per priority class','newModel':'five-class YOLOv8n detector','oldModel':'production YOLOv8n-cls + cached local CLIP ViT-B/32, fresh inference in isolated ASGI app','clipArtifact':artifact,'catalogSha256':sha(catalog),
   'noDescriptionOrSourceLabelsGivenToModels':True,'noProductionApiOrDatabaseCalled':True,'limits':'Different output tasks: detector boxes vs image-level classification/target suggestions. Qualitative only, not an equal mAP comparison. Source boxes are not independently verified GT.'})
 if protected()!=json.loads((RUN/'protected-before.json').read_text()):raise RuntimeError('Protected files changed')

if __name__=='__main__':main()
