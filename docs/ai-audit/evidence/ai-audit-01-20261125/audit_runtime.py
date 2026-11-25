import json,time,hashlib,io,zipfile
from pathlib import Path
import requests,cv2
R=Path('/home/vanvi/Work/do-an-fix-go-tho-tot');O=R/'docs/ai-audit/evidence/ai-audit-01-20261125';base='http://127.0.0.1:8000'
session=requests.Session();session.trust_env=False
health=session.get(base+'/health',timeout=10).json();catalog=session.get(base+'/ai/v2/catalog/status',timeout=10).json()
(O/'runtime-status.json').write_text(json.dumps({'observedAtClientDate':'2026-11-25','baseUrl':base,'health':health,'catalog':catalog,'scope':'read-only GET and pure inference; no sync/train/business order calls'},ensure_ascii=False,indent=2)+'\n')
cases=[]
for fn,group in [('sample_appliance.jpg','appliance_fixture'),('sample_garden.jpg','garden_fixture'),('sample_before.jpg','before_fixture'),('sample_after.jpg','after_fixture'),('sample_face.jpg','ood_fixture')]:
 p=R/'ai-service/eval/images'/fn
 if p.exists():cases.append((str(p),group,p.read_bytes(),'original',''))
p=R/'ai-service/eval/images/sample_appliance.jpg';im=cv2.imdecode(__import__('numpy').frombuffer(p.read_bytes(),__import__('numpy').uint8),1)
for name,v in [('low_light',cv2.convertScaleAbs(im,alpha=.25,beta=0)),('blur',cv2.GaussianBlur(im,(31,31),9))]:
 cases.append((str(p),name,cv2.imencode('.jpg',v)[1].tobytes(),name,'in-memory transform, base source unchanged'))
zip_path=Path('/home/vanvi/Downloads/fixgo_suadien_outlet_burnmark_20.zip')
if zip_path.exists():
 with zipfile.ZipFile(zip_path) as z:
  n=next(n for n in z.namelist() if n.endswith('outlet_burn_001.jpg'));cases.append((str(zip_path)+'!/'+n,'synthetic_burn_candidate',z.read(n),'original','User package candidate only; not verified burn/object GT'))
# Pick an existing prepared image with multiple source annotations, without using model predictions as truth.
raw=Path('/home/vanvi/Work/datasetai/01-raw');records=Path('/home/vanvi/Work/datasetai/02-development/ai01-prepared-v1/records.jsonl')
for l in records.open():
 r=json.loads(l)
 if len(r.get('annotations',[]))>=3 and (raw/r['path']).exists():
  p=raw/r['path'];cases.append((str(p),'multiple_source_annotations',p.read_bytes(),'original','Source annotations unverified; multi-object semantics not independently judged'));break
results=[]
for i,(path,group,payload,variant,note) in enumerate(cases):
 start=time.perf_counter()
 try:
  resp=session.post(base+'/ai/v2/diagnose',files={'file':('audit-image.jpg',payload,'image/jpeg')},data={'description':''},timeout=45)
  result=resp.json();err=None
 except Exception as e:result=None;err=type(e).__name__;resp=None
 row={'caseId':f'AUD-{i+1:02d}','imagePath':path,'group':group,'variant':variant,'inputSha256':hashlib.sha256(payload).hexdigest(),'requestDescription':'','model':'live /ai/v2/diagnose (CLIP + YOLO classifier; visual detector per health)','httpStatus':resp.status_code if resp is not None else None,'elapsedHttpMs':round((time.perf_counter()-start)*1000,3),'groundTruth':None,'groundTruthStatus':'NOT_VERIFIED_NO_INDEPENDENT_GT','correctness':None,'notes':note,'result':result,'error':err}
 results.append(row);print(row['caseId'],group,result.get('suggestedCategoryId') if result else err,flush=True)
for path,data in [('/ai/v2/diagnose',{'imageUrl':'/no-such-audit-image.jpg','description':'ổ cắm cháy'}),('/ai/compare-before-after',{'beforeImageUrl':'/no-such-before.jpg','afterImageUrl':'/no-such-after.jpg'})]:
 t=time.perf_counter();response=session.post(base+path,json=data,timeout=15)
 results.append({'caseId':'FAIL-'+str(len(results)+1),'endpoint':path,'imagePath':data,'group':'invalid_image_handling','groundTruth':None,'correctness':None,'elapsedHttpMs':round((time.perf_counter()-t)*1000,3),'httpStatus':response.status_code,'result':response.json()})
(R/'docs/ai-audit/inference-results.json').write_text(json.dumps({'observedAtClientDate':'2026-11-25','scope':'actual local HTTP inference, not authenticated customer-to-business E2E; no accuracy computed','runtime':health,'cases':results},ensure_ascii=False,indent=2)+'\n')
