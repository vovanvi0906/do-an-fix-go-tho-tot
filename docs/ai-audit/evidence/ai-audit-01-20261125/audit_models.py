import os,json,hashlib,time,importlib.metadata
from pathlib import Path
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1';os.environ['YOLO_CONFIG_DIR']='/tmp/fixgo-audit-yolo-settings';os.environ['MPLCONFIGDIR']='/tmp/fixgo-audit-mpl'
from ultralytics import YOLO
from dotenv import dotenv_values
R=Path('/home/vanvi/Work/do-an-fix-go-tho-tot');O=R/'docs/ai-audit/evidence/ai-audit-01-20261125'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'auditDate':'2026-11-25','offlineOnly':True,'models':[],'offlineInferences':[],'packageVersions':{},'configFilesWhitelistOnly':{}}
for package in ['ultralytics','torch','transformers','opencv-python-headless','openvino','fastapi']:
 try:report['packageVersions'][package]=importlib.metadata.version(package)
 except Exception:report['packageVersions'][package]=None
flags=['CLASSIFIER_MODE','CLIP_MIN_CONF','CLIP_MIN_MARGIN','AI_CONFIDENCE_THRESHOLD','SYMPTOM_CATALOG_ENABLED','VISUAL_SERVICE_SUGGESTIONS_ENABLED','VISUAL_SERVICE_DETECTOR_ENABLED','VISUAL_SERVICE_MODEL_MANIFEST','VISUAL_SERVICE_MIN_CONFIDENCE','FACE_PAD_MODEL_PATH','FACE_PAD_MODE']
paths=[]
for root in [R/'ai-service/weights',R/'ai-service/runs',Path('/home/vanvi/Work/datasetai/03-experiments'),R/'worker-app/public/faceid']:
 for p in root.rglob('*'):
  if p.is_file() and p.suffix.lower() in ['.pt','.onnx','.tflite','.safetensors']:paths.append(p)
paths.append(R/'ai-service/yolov8n-cls.pt')
for name in ['server/.env','ai-service/.env']:
 env=dotenv_values(R/name);report['configFilesWhitelistOnly'][name]={k:env[k] for k in flags if k in env}
 if env.get('FACE_PAD_MODEL_PATH'):
  p=Path(env['FACE_PAD_MODEL_PATH']);paths+=[p] if p.is_file() else []
 if env.get('VISUAL_SERVICE_MODEL_MANIFEST'):
  p=Path(env['VISUAL_SERVICE_MODEL_MANIFEST']);report['configuredVisualManifestExists']=p.is_file()
# HF cache symlinks need explicit glob; all reads remain local.
cache=Path.home()/'.cache/huggingface/hub/models--openai--clip-vit-base-patch32/snapshots'
for snap in cache.glob('*'):
 for n in ['model.safetensors','pytorch_model.bin']:
  p=snap/n
  if p.is_file():paths.append(p)
for p in sorted(set(paths)):
 row={'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p),'kind':p.suffix,'loadedOfflineForAudit':False}
 if p.suffix=='.pt':
  try:
   m=YOLO(str(p));row.update(task=m.task,labels=m.names,loadedOfflineForAudit=True,architecture=str(type(m.model).__name__),train_args=getattr(m,'ckpt',{}).get('train_args'),checkpointVersion=getattr(m,'ckpt',{}).get('version'),checkpointDate=getattr(m,'ckpt',{}).get('date'))
   if p==R/'ai-service/weights/yolov8n.pt':
    for image in ['sample_appliance.jpg','sample_garden.jpg','sample_before.jpg']:
     imagepath=R/'ai-service/eval/images'/image;t=time.perf_counter();pred=m.predict(str(imagepath),device='cpu',conf=.25,save=False,verbose=False)[0]
     boxes=[{'label':m.names[int(c)],'confidence':float(conf),'xyxy':xy} for c,conf,xy in zip(pred.boxes.cls.tolist(),pred.boxes.conf.tolist(),pred.boxes.xyxy.tolist())]
     report['offlineInferences'].append({'imagePath':str(imagepath),'modelPath':str(p),'elapsedMs':round((time.perf_counter()-t)*1000,3),'boxes':boxes,'groundTruth':None,'correctness':None,'scope':'actual COCO inference; not called by V2 category/target route'})
  except Exception as e:row['loadError']=type(e).__name__+': '+str(e)[:240]
 assert sha(p)==row['sha256'];report['models'].append(row)
(O/'model-artifacts.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,default=str)+'\n')
print(json.dumps({'artifacts':len(report['models']),'loadedPT':sum(r['loadedOfflineForAudit'] for r in report['models']),'COCOInferenceCases':len(report['offlineInferences'])}))
