import os,json,time,base64,zipfile,hashlib
from pathlib import Path
os.environ['YOLO_CONFIG_DIR']='/tmp/fixgo-audit-yolo-settings';os.environ['MPLCONFIGDIR']='/tmp/fixgo-audit-mpl';os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
import requests,numpy as np,cv2
from ultralytics import YOLO
R=Path('/home/vanvi/Work/do-an-fix-go-tho-tot');P=R/'docs/ai-audit/inference-results.json';d=json.loads(P.read_text());catalog=json.load(open(R/'docs/ai-audit/evidence/ai-audit-01-20261125/catalog-snapshot.json'))
weights=Path('/home/vanvi/Work/datasetai/03-experiments/ai01-task04a-strict-v2/training/weights/best.pt');m=YOLO(str(weights));samples=[]
for n in ['sample_appliance.jpg','sample_garden.jpg','sample_before.jpg']:
 p=R/'ai-service/eval/images'/n;samples.append((str(p),p.read_bytes()))
zpath=Path('/home/vanvi/Downloads/fixgo_suadien_outlet_burnmark_20.zip')
with zipfile.ZipFile(zpath) as z:
 n=next(n for n in z.namelist() if n.endswith('outlet_burn_001.jpg'));samples.append((str(zpath)+'!/'+n,z.read(n)))
for i,(p,b) in enumerate(samples):
 image=cv2.imdecode(np.frombuffer(b,np.uint8),1);t=time.perf_counter();pred=m.predict(image,device='cpu',conf=.25,save=False,verbose=False)[0]
 d['cases'].append({'caseId':'STRICT-'+str(i+1),'imagePath':p,'modelPath':str(weights),'modelSha256':hashlib.sha256(weights.read_bytes()).hexdigest(),'group':'offline_source_supervised_object_trial','elapsedMs':round((time.perf_counter()-t)*1000,3),'groundTruth':None,'correctness':None,'boxes':[{'label':m.names[int(c)],'confidence':float(v),'xyxyNormalized':xy} for c,v,xy in zip(pred.boxes.cls.tolist(),pred.boxes.conf.tolist(),pred.boxes.xyxyn.tolist())],'predictedDefect':None,'predictedService':None,'notes':'Actual CPU object inference with existing trial weights; not loaded by production API; no independent GT'})
s=requests.Session();s.trust_env=False
outlet=next(t for t in catalog['targets'] if t['slug']=='o-cam-dien');svc=next(v for v in catalog['services'] if v['targetId']==outlet['id'])
for i,(name,impath,answers) in enumerate([
 ('garden_pixels',R/'ai-service/eval/images/sample_garden.jpg',{}),
 ('before_pixels',R/'ai-service/eval/images/sample_before.jpg',{}),
 ('manual_existing_service',None,{'categoryId':outlet['categoryId'],'targetId':outlet['id'],'serviceId':svc['id']}),
 ('wrong_target_service',None,{'categoryId':outlet['categoryId'],'targetId':outlet['id'],'serviceId':next(x['id'] for x in catalog['services'] if x['categoryId']!=outlet['categoryId'])})]):
 data={'imageUrl':'data:image/jpeg;base64,'+base64.b64encode(impath.read_bytes()).decode() if impath else 'https://example.invalid/audit-not-fetched.jpg','description':'','answers':answers};t=time.perf_counter()
 try:
  response=s.post('http://127.0.0.1:3000/api/orders/diagnose',json=data,timeout=30);body=response.json()
  if isinstance(body,dict) and 'imageUrl' in body:body['imageUrl']='[omitted: input image only; hash/source path recorded]'
  row={'caseId':'BACKEND-'+str(i+1),'group':name,'imagePath':str(impath) if impath else None,'endpoint':'/api/orders/diagnose','httpStatus':response.status_code,'elapsedHttpMs':round((time.perf_counter()-t)*1000,3),'answers':answers,'result':body,'groundTruth':None,'correctness':None,'scope':'live read-only resolver; no order or upload/storage mutation'}
 except Exception as e:row={'caseId':'BACKEND-'+str(i+1),'error':type(e).__name__}
 d['cases'].append(row)
P.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Added 4 offline trial + 4 live backend resolver cases; total',len(d['cases']))
