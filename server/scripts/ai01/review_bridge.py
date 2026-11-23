"""Internal stdio adapter; never a network server. Reuses immutable TASK 03C Store."""
import os,sys,json,hashlib,shutil,fcntl,base64,contextlib,traceback
from pathlib import Path
from datetime import datetime,timezone
PILOT=Path(os.environ['AI01_PILOT_DIR']).resolve();STATE=Path(os.environ['AI01_REVIEW_STATE_DIR']).resolve();ROLE_MAP={'coordinator':'coordinator','reviewer_a':'annotator_a','reviewer_b':'annotator_b','adjudicator':'adjudicator','viewer':'viewer'}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
manifest=json.loads((PILOT/'SHA256SUMS.json').read_text());pins=manifest.get('files',manifest)
for name in ['review_core.py','pilot-proposal.json','taxonomy-reference.json']:
 if sha(PILOT/name)!=pins.get(name):raise RuntimeError('TASK03C artifact integrity check failed')
if STATE==PILOT/'reviews' or STATE.is_relative_to(PILOT) or STATE.is_relative_to(Path.home()/'Work/datasetai/01-raw'):raise RuntimeError('Admin state must be separate from historical review/raw data')
STATE.mkdir(parents=True,exist_ok=True);lock=(STATE/'.writer.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
# Copy-on-write baseline: retain exact event bytes and original identities, never rewrite source.
if not (STATE/'baseline.json').exists():
 if (STATE/'events.jsonl').exists() and (STATE/'events.jsonl').stat().st_size:raise RuntimeError('Uninitialized nonempty admin history; manual reconciliation required')
 src=PILOT/'reviews/events.jsonl';before=sha(src);payload=src.read_bytes()
 if sha(src)!=before:raise RuntimeError('Historical log changed while copying; retry')
 (STATE/'events.jsonl').write_bytes(payload)
 (STATE/'baseline.json').write_text(json.dumps({'sourceEventsSha256':before,'copiedAt':datetime.now(timezone.utc).isoformat(),'source':'TASK03C review log; original IDs retained; no automatic identity reassignment'},indent=2))
sys.path.insert(0,str(PILOT));from review_core import Store,Invalid,RAW
class AdminStore(Store):
 def __init__(self):self.bindings={};self.currentPolicyRevision=None;super().__init__(data=STATE)
 def apply(self,e):
  if e['kind']=='principal_binding':
   b=e['data'];self.bindings[b['reviewerId']]=b;self.users[b['reviewerId']]=b
  else:super().apply(e)
 def bind(self,p):
  uid=p.get('id');role=ROLE_MAP.get(p.get('role'));self.currentPolicyRevision=p.get('policyRevision')
  if not isinstance(uid,str) or not uid or not role:raise Invalid('Danh tính/quyền FixGo không hợp lệ.')
  existing=self.bindings.get(uid)
  if existing and (existing['role']!=role or existing['expert']!=(p.get('expert') is True)):raise Invalid('Quyền đã gắn lịch sử không được đổi tự động; cần quy trình chuyển giao được duyệt.')
  if not existing:
   if uid in self.users:raise Invalid('ID trùng danh tính lịch sử; cần đối chiếu thủ công.')
   if role in ['annotator_a','annotator_b'] and any(b['role']==role for b in self.bindings.values()):raise Invalid('Slot reviewer đã có user khác; không tự thay người trong cùng pilot.')
   data={'reviewerId':uid,'name':uid,'role':role,'expert':p.get('expert') is True,'identityAssurance':'FixGo authenticated principal; role assigned by approved server policy','registeredAt':datetime.now(timezone.utc).isoformat(),'policyRevision':p['policyRevision']}
   self.append('principal_binding',uid,data)
  return uid
 def append(self,kind,who,data):
  if kind!='principal_binding' and who in self.bindings:data=dict(data,authenticatedPrincipal={'userId':who,'role':self.bindings[who]['role'],'identityAssurance':'FixGo JWT principal from NestJS','policyRevision':self.currentPolicyRevision})
  return super().append(kind,who,data)
 def pair(self,i):
  # Legacy records remain in log; unverified local aliases cannot become FixGo GT identities.
  return [e for e in super().pair(i) if e['reviewerId'] in self.bindings and e['data'].get('authenticatedPrincipal',{}).get('userId')==e['reviewerId']]
 def blockers(self,i,verify_files=False):
  out=super().blockers(i,verify_files);a=self.adjudications.get(i)
  if a and (a['reviewerId'] not in self.bindings or a['data'].get('authenticatedPrincipal',{}).get('userId')!=a['reviewerId']):out.append('Phân xử lịch sử chưa được gắn user FixGo; cần phân xử lại, không sửa lịch sử.')
  for k in self.items[i]['mappingKeys']:
   m=self.maps.get(k)
   if m and (m['reviewerId'] not in self.bindings or m['data'].get('authenticatedPrincipal',{}).get('userId')!=m['reviewerId']):out.append('Mapping lịch sử cần điều phối FixGo xác nhận lại: '+k)
  prov=self.provenance.get(i)
  if prov and (prov['reviewerId'] not in self.bindings or prov['data'].get('authenticatedPrincipal',{}).get('userId')!=prov['reviewerId']):out.append('Nguồn/quyền lịch sử cần điều phối FixGo xác nhận lại.')
  return out
 def register(self,*args):raise Invalid('Dùng tài khoản FixGo; không đăng ký reviewer riêng.')
 def login(self,*args):raise Invalid('Chỉ nhận authenticated principal từ NestJS.')
store=AdminStore();rows_cache=None
OPS={'overview':set(ROLE_MAP),'items':set(ROLE_MAP),'catalog':set(ROLE_MAP),'image':set(ROLE_MAP),'mapping':{'coordinator'},'mappings':{'coordinator'},'adjudication':{'coordinator','adjudicator'},'adjudicate':{'coordinator','adjudicator'},'provenance':{'coordinator'},'save_provenance':{'coordinator'},'related':{'coordinator','adjudicator'},'related_image':{'coordinator','adjudicator'},'readiness':{'coordinator','adjudicator'},'export':{'coordinator'},'download':{'coordinator'},'history':{'coordinator'}}
DROP={'path','annotationPath','originalImage','credentials','passwordHash','salt','sourceFamily','sourceFamilyCandidate'}
def clean(v):
 if isinstance(v,dict):return {k:clean(x) for k,x in v.items() if k not in DROP}
 if isinstance(v,list):return [clean(x) for x in v]
 if isinstance(v,str):
  for root in [str(PILOT),str(STATE),str(RAW),str(Path.home())]:v=v.replace(root,'[đường dẫn nội bộ]')
 return v
def neutral(r):return {k:r[k] for k in ['id','dataset','version','sha256','annotationSha256','width','height','classIds','annotations','sourceLabels','source']}
def handle(req):
 global rows_cache
 p=req['principal'];op=req['op'];payload=req.get('payload') or {};role=p.get('role')
 if op not in OPS or role not in OPS[op]:raise Invalid('Không có quyền AI cho thao tác này.')
 uid=store.bind(p)
 if op=='overview':
  own=[e for (i,r),e in store.annotations.items() if r==uid];result={'pilotImages':len(store.items),'mappingClasses':len(store.entries),'counts':store.pilot['counts'],'purpose':'Pilot development; không phải test mới','ownAnnotations':len(own),'historicalLogPreserved':True,'approvedGroundTruthCount':sum(not store.blockers(i) for i in store.items) if role in ['coordinator','adjudicator'] else None}
 elif op=='catalog':result=store.tax
 elif op=='items':
  result={'items':[dict(neutral(r),ownAnnotation=store.annotations.get((r['id'],uid))) if role in ['reviewer_a','reviewer_b'] else neutral(r) if role=='viewer' else dict(neutral(r),mappingKeys=r['mappingKeys'],duplicateEvidence=r['duplicateEvidence'],agreement=store.agreement(r['id']),partition=r['partition']) for r in store.items.values()]}
 elif op=='mappings':
  display=json.loads((PILOT/'mapping-display-vi.json').read_text());result={'entries':[dict(e,displayVi=display.get(k),humanReview=store.maps.get(k)) for k,e in store.entries.items()]}
 elif op=='mapping':result=store.mapping(uid,payload)
 elif op=='adjudication':
  i=payload['imageId'];store.item(i);pair=store.pair(i);result={'annotations':pair if len(pair)==2 else [],'adjudication':store.adjudications.get(i) if len(pair)==2 else None,'agreement':store.agreement(i),'mappingEvents':{k:store.maps.get(k) for k in store.items[i]['mappingKeys']}}
 elif op=='adjudicate':result=store.adjudicate(uid,payload)
 elif op=='provenance':store.item(payload['imageId']);result={'event':store.provenance.get(payload['imageId'])}
 elif op=='save_provenance':result=store.record_provenance(uid,payload)
 elif op=='readiness':result={'items':store.readiness(),'annotationCount':len([e for e in store.annotations.values() if e['reviewerId'] in store.bindings]),'adjudicationCount':len(store.adjudications)}
 elif op=='history':result={'events':store.events}
 elif op=='export':result=store.export(uid,payload)
 elif op=='download':
  name=payload['file']
  if Path(name).name!=name or not name.startswith('approved-development-') or not name.endswith('.jsonl'):raise Invalid('Artifact không hợp lệ.')
  event=next((e for e in store.events if e['kind']=='export' and e['data']['file']==name),None);f=STATE/'exports'/name
  if not event or not f.is_file() or sha(f)!=event['data']['sha256']:raise Invalid('Artifact không có audit hợp lệ hoặc hash đổi.')
  return {'binary':base64.b64encode(f.read_bytes()).decode(),'contentType':'application/x-ndjson','filename':name}
 elif op=='image':
  r=store.item(payload['imageId']);store.check_files(r['id']);f=(RAW/r['path']).resolve()
  if not f.is_relative_to(RAW.resolve()):raise Invalid('Ảnh ngoài dataset.')
  import mimetypes
  return {'binary':base64.b64encode(f.read_bytes()).decode(),'contentType':mimetypes.guess_type(f.name)[0] or 'image/jpeg'}
 elif op in ['related','related_image']:
  if rows_cache is None:rows_cache=[json.loads(l) for l in (PILOT.parent/'ai01-label-review-v1/images.jsonl').read_text().splitlines()]
  i=payload['imageId'];r=store.item(i);members=r['duplicateEvidence']['members']
  if op=='related':result={'members':[{'id':str(idx),'dataset':rows_cache[idx]['dataset'],'sha256':rows_cache[idx]['sha256'],'phash':rows_cache[idx]['phash'],'reference':rows_cache[idx]['reference']} for idx in members]}
  else:
   idx=int(payload['memberId'])
   if idx not in members or rows_cache[idx]['reference']:raise Invalid('Ảnh không thuộc family được phép.')
   row=rows_cache[idx];f=(RAW/row['path']).resolve()
   if not f.is_relative_to(RAW.resolve()) or sha(f)!=row['sha256']:raise Invalid('Ảnh family sai hash.')
   import mimetypes
   return {'binary':base64.b64encode(f.read_bytes()).decode(),'contentType':mimetypes.guess_type(f.name)[0] or 'image/jpeg'}
 elif op=='annotate':raise Invalid('Operation not configured')
 else:raise Invalid('Không có operation.')
 return clean(result)
OPS['annotate']={'reviewer_a','reviewer_b'}
original_handle=handle
solo_store=None
def solo_handle(req):
 global solo_store,rows_cache
 from solo_review import SoloStore
 p=req['principal'];op=req['op'];payload=req.get('payload') or {}
 if p.get('admin') is not True or p.get('role')!='coordinator':raise Invalid('Cần tài khoản ADMIN active cho chế độ một người.')
 if solo_store is None:
  solo_root=(STATE/'solo-thesis').resolve()
  if solo_root.parent!=STATE:raise Invalid('Vùng một người phải nằm riêng trong state Admin, không dùng symlink ra ngoài.')
  solo_store=SoloStore(solo_root)
 uid=solo_store.bind_admin(p)
 if op=='solo_catalog':return clean(solo_store.tax)
 if op=='solo_items':return clean({'items':[dict(neutral(r),phash=r['phash'],mappingKeys=r['mappingKeys'],duplicateEvidence=r['duplicateEvidence']) for r in solo_store.items.values()]})
 if op=='solo_mappings':
  display=json.loads((PILOT/'mapping-display-vi.json').read_text())
  return clean({'entries':[dict(e,displayVi=display.get(k),humanReview=solo_store.maps.get(k)) for k,e in solo_store.entries.items()]})
 if op=='solo_mapping':return clean(solo_store.mapping(uid,payload))
 if op=='solo_save_provenance':return clean(solo_store.record_provenance(uid,payload))
 if op=='solo_annotate':return clean(solo_store.save_annotation(uid,payload))
 if op=='solo_confirm':return clean(solo_store.confirm(uid,payload))
 if op=='solo_export':return solo_store.export_solo(uid,payload)
 if op=='solo_download':return solo_store.download(payload.get('file'))
 if op=='solo_detail':
  i=payload['imageId'];solo_store.item(i)
  keys=solo_store.item(i)['mappingKeys']
  return clean({'annotation':solo_store.annotations_solo.get(i),'confirmation':solo_store.confirmations.get(i),'provenance':solo_store.provenance.get(i),'blockers':solo_store.blockers(i,True),'history':[e for e in solo_store.events if e['data'].get('imageId')==i or e['data'].get('mappingKey') in keys]})
 if op=='solo_readiness':
  result=[]
  for i in solo_store.items:
   blockers=solo_store.blockers(i,True)
   if solo_store.annotations_solo.get(i,{}).get('reviewerId') not in [None,uid]:blockers.append('Bản nhãn thuộc Admin khác; không xuất như dữ liệu một người của bạn.')
   result.append({'imageId':i,'blockers':blockers,'eligible':not blockers})
  return clean({'items':result})
 if op=='solo_image':
  i=payload['imageId'];r=solo_store.item(i);solo_store.check_files(i);f=(RAW/r['path']).resolve()
  if not f.is_relative_to(RAW.resolve()):raise Invalid('Ảnh ngoài dataset.')
  import mimetypes
  return {'binary':base64.b64encode(f.read_bytes()).decode(),'contentType':mimetypes.guess_type(f.name)[0] or 'image/jpeg'}
 if op in ['solo_related','solo_related_image']:
  if rows_cache is None:rows_cache=[json.loads(l) for l in (PILOT.parent/'ai01-label-review-v1/images.jsonl').read_text().splitlines()]
  r=solo_store.item(payload['imageId']);members=r['duplicateEvidence']['members']
  if op=='solo_related':return clean({'members':[{'id':str(idx),'dataset':rows_cache[idx]['dataset'],'sha256':rows_cache[idx]['sha256'],'phash':rows_cache[idx]['phash'],'reference':rows_cache[idx]['reference']} for idx in members]})
  idx=int(payload['memberId'])
  if idx not in members or rows_cache[idx]['reference']:raise Invalid('Ảnh không thuộc nhóm được phép.')
  row=rows_cache[idx];f=(RAW/row['path']).resolve()
  if not f.is_relative_to(RAW.resolve()) or sha(f)!=row['sha256']:raise Invalid('Ảnh nhóm sai hash.')
  import mimetypes
  return {'binary':base64.b64encode(f.read_bytes()).decode(),'contentType':mimetypes.guess_type(f.name)[0] or 'image/jpeg'}
 raise Invalid('Không có thao tác một người này.')
fast_store=None
def dispatch(req):
 global fast_store
 if req["op"].startswith("fast_"):
  p=req["principal"]
  if p.get("admin") is not True or p.get("role")!="coordinator":raise Invalid("Chỉ ADMIN active được gán nhãn nhanh.")
  if fast_store is None:
   from fast_review import FastReview
   fast_store=FastReview(PILOT,STATE,RAW)
  return fast_store.handle(p["id"],req["op"],req.get("payload") or {})
 if req['op'].startswith('solo_'):return solo_handle(req)
 if req['op']=='annotate':
  p=req['principal']
  if p.get('role') not in OPS['annotate']:raise Invalid('Chỉ Reviewer A/B được nộp nhãn độc lập.')
  uid=store.bind(p);return clean(store.annotate(uid,req.get('payload') or {}))
 return original_handle(req)
for line in sys.stdin:
 try:
  req=json.loads(line)
  with contextlib.redirect_stdout(sys.stderr):result=dispatch(req)
  response={'id':req['id'],'ok':True,'result':result}
 except Invalid as e:response={'id':req.get('id'),'ok':False,'code':'REVIEW_REJECTED','message':str(e)}
 except Exception:
  traceback.print_exc(file=sys.stderr);response={'id':req.get('id'),'ok':False,'code':'ENGINE_ERROR','message':'Review Engine chưa sẵn sàng hoặc dữ liệu không toàn vẹn; kiểm tra cấu hình nội bộ.'}
 sys.stdout.write(json.dumps(response,ensure_ascii=False)+'\n');sys.stdout.flush()
