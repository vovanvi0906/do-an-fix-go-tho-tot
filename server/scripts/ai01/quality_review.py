"""SOLO bbox corrections on copies, isolated from source/AI/image-label journals."""
import base64, hashlib, json, math, mimetypes, os, shutil
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from review_core import Invalid

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def canonical(v):return json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':'))

class QualityReview:
 def __init__(self,parent):
  self.parent=parent;self.root=parent.raw.parent/'02-development/ai01-quality-v1';self.pack=None;self.signature=None
  self.home=parent.home.parent/'bbox-quality-v1'
  if self.home.resolve().parent!=parent.home.parent.resolve():raise Invalid('State bbox không được trỏ ra ngoài vùng Admin.')
  self.home.mkdir(exist_ok=True,mode=0o700);self.log=self.home/'events.jsonl'
  if self.log.resolve().parent!=self.home.resolve():raise Invalid('Audit bbox không hợp lệ.')
  self.events=[];self.latest={};self.head='0'*64
  if self.log.exists():
   for line in self.log.read_text().splitlines():
    e=json.loads(line);h=e.pop('eventHash')
    if e['previousHash']!=self.head or hashlib.sha256(canonical(e).encode()).hexdigest()!=h:raise Invalid('Audit bbox bị thay đổi; dừng, không tự sửa log.')
    e['eventHash']=h;self.head=h;self.events.append(e)
    if e['kind']=='bbox_revision':self.latest[e['imageId']]=e
  self.log_hash=digest(self.log) if self.log.exists() else None
 def check_audit(self):
  if (digest(self.log) if self.log.exists() else None)!=self.log_hash:raise Invalid('Audit bbox đã đổi ngoài writer; tải lại/đối chiếu trước khi ghi.')
 def load(self):
  if not (self.root/'SHA256SUMS.json').exists():return None
  names=['summary.json','queue-index.json','drafts.jsonl','catalog-db.json','sign-ontology.json','reason-labels.json']
  sig=tuple((self.root/n).stat().st_mtime_ns for n in ['SHA256SUMS.json']+names)
  if self.pack is not None and self.signature==sig:return self.pack
  pins=json.loads((self.root/'SHA256SUMS.json').read_text())
  for n in names:
   if digest(self.root/n)!=pins.get(n):raise Invalid('Checksum quality dataset không khớp: '+n)
  self.pack={'summary':json.loads((self.root/'summary.json').read_text()),'queue':json.loads((self.root/'queue-index.json').read_text()),
    'rows':{r['id']:r for r in map(json.loads,(self.root/'drafts.jsonl').read_text().splitlines())},'catalog':json.loads((self.root/'catalog-db.json').read_text()),
    'signs':json.loads((self.root/'sign-ontology.json').read_text())['signs'],'reasons':json.loads((self.root/'reason-labels.json').read_text()),'pins':pins,'revision':digest(self.root/'SHA256SUMS.json')}
  self.signature=sig;return self.pack
 def row(self,i,verify=True):
  if hasattr(self.parent,'imports') and i in self.parent.imports.rows:return self.parent.imports.quality_row(i,verify)
  p=self.load()
  if not p or i not in p['rows']:raise Invalid('Ảnh chưa thuộc hàng đợi sửa bbox.')
  r=p['rows'][i]
  if r['developmentSplit'] not in ['train','val']:raise Invalid('Chỉ sửa dữ liệu development, không nhận tập test độc lập.')
  if verify:
   image=self.parent.file(r['path']);label=self.parent.file(r['annotationPath']);yml=self.parent.file(r['dataset']+'/data.yaml');copy=(self.root/r['copyPath']).resolve()
   if not copy.is_relative_to(self.root.resolve()) or digest(image)!=r['sha256'] or (digest(label) if label.exists() else None)!=r['annotationSha256'] or digest(yml)!=r['yamlSha256'] or digest(copy)!=r['sha256']:raise Invalid('Ảnh/nhãn/YAML hoặc bản sao đã đổi; không lưu/xuất bbox.')
  return r
 def queue_info(self,i,pack=None):
  if hasattr(self.parent,'imports') and i in self.parent.imports.rows:
   e=self.latest.get(i);return dict(priority=2,reasons=['new_upload'],imported=True,sourceBoxes=0,needsGeometryReview=False,pilot=False,status=e['status'] if e else 'pending',pending=not e or e['status'] not in ['confirmed','rejected'])
  p=pack if pack is not None else self.load()
  if not p or i not in p['queue']:return None
  e=self.latest.get(i)
  return dict(p['queue'][i],status=e['status'] if e else 'pending',pending=not e or e['status'] not in ['confirmed','rejected'])
 def append(self,data):
  self.check_audit();e=dict(data,previousHash=self.head,timestamp=datetime.now(timezone.utc).isoformat(),mode='SOLO_THESIS',approvedGroundTruth=False,independentlyReviewed=False)
  e['eventHash']=hashlib.sha256(canonical(e).encode()).hexdigest()
  with self.log.open('a') as f:f.write(json.dumps(e,ensure_ascii=False)+'\n');f.flush();os.fsync(f.fileno())
  self.head=e['eventHash'];self.log_hash=digest(self.log);self.events.append(e)
  if e['kind']=='bbox_revision':self.latest[e['imageId']]=e
  return e
 def packet_hash(self,i):
  return self.parent.imports.packet_hash(i) if hasattr(self.parent,'imports') and i in self.parent.imports.rows else self.load()['revision']
 def image_file(self,r):
  return self.parent.imports.file(r['imageFile']) if r.get('sourceKind')=='admin_upload' else self.root/r['copyPath']
 def blockers(self,e,uid):
  if not e:return ['Chưa có bản sửa bbox.']
  out=self.parent.imports.blockers(e['imageId'],e) if hasattr(self.parent,'imports') and e['imageId'] in self.parent.imports.rows else []
  if e['status']!='confirmed':out.append('Bbox chưa được người xác nhận.')
  if e['userId']!=uid:out.append('Bản sửa thuộc Admin khác.')
  if e['packetHash']!=self.packet_hash(e['imageId']):out.append('Quality snapshot đã đổi; cần xem lại bản sửa.')
  if not e['rightsVerified'] or not e['rightsEvidence'].strip():out.append('Thiếu xác minh quyền ảnh/license/attribution.')
  if not e['sourceEvidence'].strip():out.append('Thiếu bằng chứng kiểm nguồn.')
  if not e['groupEvidence'].strip():out.append('Thiếu kiểm nhóm trùng/cùng cảnh.')
  if e['imageId'] in getattr(getattr(self.parent,'imports',None),'rows',{}) and (e['objectReview'] not in ['complete','none_visible'] or e['signReview'] not in ['positive','none_visible']):out.append('Ảnh mới cần xem cả vật thể và dấu hiệu trước khi xuất; không tự coi thiếu nhãn là ảnh âm.')
  if e['objectReview'] not in ['complete','none_visible'] and e['signReview'] not in ['positive','none_visible']:out.append('Chưa hoàn tất vật thể hoặc dấu hiệu.')
  return out
 def validate_payload(self,p):
  required={'imageId','expectedHash','status','boxes','objectReview','objectExtentReviewed','signReview','rightsVerified','rightsEvidence','sourceEvidence','groupEvidence','reason'}
  imported=p.get('imageId') in getattr(getattr(self.parent,'imports',None),'rows',{})
  if set(p)-(required|({'duplicateReview'} if imported else set())) or not required.issubset(p):raise Invalid('Payload sửa bbox thiếu/thừa trường.')
  if imported and p.get('duplicateReview') is not None:
   review=p['duplicateReview'];candidates=self.parent.imports.rows[p['imageId']]['nearCandidates']
   if not isinstance(review,dict) or set(review)!={'decision','evidence','imageIds'} or review['decision']!='independent' or not isinstance(review['evidence'],str) or not 20<=len(review['evidence'].strip())<=3000 or not isinstance(review['imageIds'],list) or any(not isinstance(i,str) for i in review['imageIds']) or sorted(review['imageIds'])!=sorted(c['imageId'] for c in candidates) or len(candidates)>100:raise Invalid('Cần đối chiếu đầy đủ ứng viên gần trùng và ghi bằng chứng ảnh độc lập tối thiểu 20 ký tự.')
  r=self.row(p['imageId']);old=self.latest.get(p['imageId'])
  if p['expectedHash']!=(old['eventHash'] if old else None):raise Invalid('Bản bbox đã đổi; tải lại trước khi lưu.')
  if p['status'] not in ['draft','confirmed','uncertain','rejected']:raise Invalid('Chọn nháp/xác nhận/chưa chắc/loại ảnh.')
  if p['objectReview'] not in ['not_reviewed','complete','none_visible','uncertain'] or p['signReview'] not in ['not_reviewed','positive','none_visible','uncertain']:raise Invalid('Trạng thái xem vật thể/dấu hiệu không hợp lệ.')
  if type(p['rightsVerified']) is not bool or type(p['objectExtentReviewed']) is not bool:raise Invalid('Xác minh phải là boolean thật.')
  for k in ['rightsEvidence','sourceEvidence','groupEvidence','reason']:
   if not isinstance(p[k],str) or len(p[k])>3000:raise Invalid('Bằng chứng/ghi chú phải là chuỗi tối đa 3000 ký tự.')
  if not p['reason'].strip():raise Invalid('Ghi lý do sửa hoặc quyết định.')
  if not isinstance(p['boxes'],list) or len(p['boxes'])>100:raise Invalid('Tối đa 100 box cho một ảnh.')
  pack=self.load();cats={c['id'] for c in pack['catalog']['categories'] if c['isActive']};allowed={t['id'] for t in pack['catalog']['targets'] if t['isActive'] and t['categoryId'] in cats}
  ids=set();geometry=set()
  for b in p['boxes']:
   if not isinstance(b,dict) or set(b)!={'id','kind','label','xyxy','origin','sourceIndex','evidence'}:raise Invalid('Box thiếu/thừa trường.')
   if not isinstance(b['id'],str) or not 1<=len(b['id'])<=100 or b['id'] in ids:raise Invalid('ID box bị trùng/không hợp lệ.')
   ids.add(b['id'])
   if b['kind'] not in ['object','sign']:raise Invalid('Chỉ có box vật thể hoặc box dấu hiệu; vùng nguồn chưa rõ chỉ để tham chiếu.')
   if not isinstance(b['label'],str) or b['label'] not in (allowed if b['kind']=='object' else pack['signs']):raise Invalid('Nhãn vật thể/dấu hiệu không hợp lệ.')
   v=b['xyxy']
   if not isinstance(v,list) or len(v)!=4 or any(type(x) not in [int,float] or not math.isfinite(x) or not 0<=x<=1 for x in v):raise Invalid('Box cần 4 tọa độ xyxy chuẩn hóa trong [0,1].')
   if v[2]-v[0]<2/r['width'] or v[3]-v[1]<2/r['height']:raise Invalid('Box phải có diện tích dương và ít nhất 2 pixel mỗi chiều.')
   key=(b['kind'],b['label'],tuple(round(x,8) for x in v))
   if key in geometry:raise Invalid('Box trùng vị trí/nhãn; xóa bản thừa trước lưu.')
   geometry.add(key)
   if not isinstance(b['evidence'],str) or len(b['evidence'])>1500:raise Invalid('Bằng chứng từng box phải là chuỗi.')
   if b['origin']=='source_object_candidate':
    ix=b['sourceIndex']
    if type(ix) is not int or not 0<=ix<len(r['sourceReferences']):raise Invalid('Box nguồn không có chỉ số hợp lệ.')
    ref=r['sourceReferences'][ix]
    if b['kind']!='object' or ref['scope']!='direct_object_candidate' or ref['candidateTargetId']!=b['label'] or any(abs(a-z)>1e-7 for a,z in zip(v,ref['xyxy'])):raise Invalid('Không được tự chuyển box vùng sự cố thành vật thể hoặc giả provenance nguồn.')
   elif b['origin']!='human' or b['sourceIndex'] is not None:raise Invalid('Box mới/sửa phải có origin human; không giả là box nguồn.')
  obj=[b for b in p['boxes'] if b['kind']=='object'];sign=[b for b in p['boxes'] if b['kind']=='sign']
  if p['objectReview']=='none_visible' and obj:raise Invalid('Không có vật thể thì danh sách box vật thể phải rỗng.')
  if p['signReview']=='none_visible' and sign:raise Invalid('Không thấy dấu hiệu thì không được có box dấu hiệu dương.')
  if p['status']=='confirmed':
   if imported and (p['objectReview'] not in ['complete','none_visible'] or p['signReview'] not in ['positive','none_visible']):raise Invalid('Ảnh mới cần xem cả vật thể và dấu hiệu trước khi xác nhận; không coi thiếu nhãn là ảnh âm.')
   if p['objectReview'] not in ['complete','none_visible'] and p['signReview'] not in ['positive','none_visible']:raise Invalid('Cần hoàn tất xem vật thể hoặc dấu hiệu trước xác nhận.')
   if obj and (p['objectReview']!='complete' or not p['objectExtentReviewed']):raise Invalid('Xác nhận đã khoanh toàn bộ phần vật thể nhìn thấy, không phải vùng nước/sự cố.')
   if p['objectReview']=='complete' and not obj:raise Invalid('Hoàn tất vật thể cần ít nhất một box, hoặc chọn không có vật thể.')
   if sign and (p['signReview']!='positive' or any(not b['evidence'].strip() for b in sign)):raise Invalid('Mỗi dấu hiệu dương cần bằng chứng nhìn thấy cụ thể.')
   if p['signReview']=='positive' and not sign:raise Invalid('Có dấu hiệu cần ít nhất một box có bằng chứng.')
  return r
 def overview(self,uid):
  p=self.load()
  if not p:return {'available':False}
  eligible=[e for e in self.latest.values() if not self.blockers(e,uid)]
  counts=Counter(b['label'] for e in eligible for b in e['boxes'])
  coverage={};ready={'object':0,'sign':0}
  for kind in ['object','sign']:
   for key in sorted({b['label'] for e in eligible for b in e['boxes'] if b['kind']==kind}):
    supporting=[e for e in eligible if any(b['kind']==kind and b['label']==key for b in e['boxes'])]
    splits={s:{'images':len({self.row(e['imageId'],False)['pixelSha256'] for e in supporting if e['split']==s}),'groups':len({e['leakageGroup'] for e in supporting if e['split']==s})} for s in ['train','val']}
    sufficient=splits['train']['images']>=20 and splits['val']['images']>=5 and splits['train']['groups']>=2 and splits['val']['groups']>=1
    coverage[kind+':'+key]=dict(splits,meetsEngineeringMinimum=sufficient)
    ready[kind]+=int(sufficient)
  return {'available':True,'summary':p['summary'],'reasonLabels':p['reasons'],'savedImages':len(self.latest),'confirmedImages':sum(e['status']=='confirmed' for e in self.latest.values()),'exportEligibleImages':len(eligible),'exportEligibleBoxCounts':dict(counts),'reviewedCoverage':coverage,'classesMeetingTrialMinimum':ready,'trained':False}
 def handle(self,uid,op,p):
  self.check_audit()
  if op=='fast_quality_overview':return self.overview(uid)
  if op=='fast_quality_detail':
   r=self.row(p['imageId']);pack=self.load();e=self.latest.get(r['id'])
   display=dict(r,sourceReferences=[dict(b,sourceLabelVi=b.get('sourceLabelVi',b['sourceLabel']) if r.get('sourceKind')=='admin_upload' else self.parent.source_translations.get((r['dataset'],b['sourceClassId']),'Nhãn chưa rõ')) for b in r['sourceReferences']])
   return {'item':display,'queue':self.queue_info(r['id'],pack),'reasonLabels':pack['reasons'],'catalog':pack['catalog'],'signs':pack['signs'],'annotation':e,'blockers':self.blockers(e,uid),'history':[x for x in self.events if x.get('imageId')==r['id']]}
  if op=='fast_quality_image':
   r=self.row(p['imageId']);f=self.image_file(r);return {'binary':base64.b64encode(f.read_bytes()).decode(),'contentType':mimetypes.guess_type(f.name)[0] or 'image/jpeg'}
  if op=='fast_quality_save':
   r=self.validate_payload(p)
   return self.append({k:v for k,v in p.items() if k!='expectedHash'}|{'kind':'bbox_revision','userId':uid,'previousAnnotationHash':p['expectedHash'],'packetHash':self.packet_hash(p['imageId']),
    'sha256':r['sha256'],'sourceAnnotationSha256':r['annotationSha256'],'sourceYamlSha256':r['yamlSha256'],'split':r['developmentSplit'],'leakageGroup':r['leakageGroup'],'catalogSha256':digest(self.root/'catalog-db.json'),'datasetType':'solo-bbox-development',**({'sourceKind':'admin_upload','importEventHash':r['importEventHash'],'sourceType':r['sourceType'],'synthetic':r.get('synthetic',False),'sourceProvenance':{k:r.get(k) for k in ['batchId','datasetName','generatorTool','generatedAt','prompt','sourceMetadata','sourceReferences','sourceYaml','metadataProvenance']}} if r.get('sourceKind')=='admin_upload' else {})})
  if op=='fast_quality_export':return self.export(uid,p)
  raise Invalid('Không có thao tác quality này.')
 def export(self,uid,p):
  if set(p)-{'imageIds'}:raise Invalid('Chỉ chọn subset imageIds để xuất bbox.')
  ids=p.get('imageIds',[i for i,e in self.latest.items() if not self.blockers(e,uid)])
  if not isinstance(ids,list) or not ids or any(not isinstance(i,str) for i in ids) or len(ids)!=len(set(ids)):raise Invalid('Chưa có ảnh sửa đủ điều kiện xuất.')
  events=[];pixels={};skipped=[]
  for i in ids:
   r=self.row(i);e=self.latest.get(i);blocked=self.blockers(e,uid)
   if blocked:raise Invalid('Ảnh '+i+' chưa đủ điều kiện: '+'; '.join(blocked))
   signature=canonical({'boxes':[{k:v for k,v in b.items() if k in ['kind','label','xyxy']} for b in e['boxes']],'objectReview':e['objectReview'],'signReview':e['signReview']})
   if r['pixelSha256'] in pixels:
    if pixels[r['pixelSha256']]!=signature:raise Invalid('Ảnh trùng pixel có bản sửa khác nhau; cần đối chiếu trước xuất.')
    skipped.append(i);continue
   pixels[r['pixelSha256']]=signature;events.append(e)
  estimated=sum(self.image_file(self.row(e['imageId'],False)).stat().st_size*2 for e in events)
  if shutil.disk_usage(self.home).free-estimated<2*1024**3:raise Invalid('Cần giữ ít nhất 2GiB đĩa trống sau khi xuất.')
  exports=self.home/'exports'
  if exports.resolve().parent!=self.home.resolve():raise Invalid('Thư mục xuất bbox không hợp lệ.')
  exports.mkdir(exist_ok=True);folder=exports/('bbox-development-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'));folder.mkdir(mode=0o700)
  records=[];task_summary={}
  for kind,reviewfield,positive in [('object','objectReview','complete'),('sign','signReview','positive')]:
   chosen=[e for e in events if e[reviewfield] in [positive,'none_visible']]
   keys=sorted({b['label'] for e in chosen for b in e['boxes'] if b['kind']==kind});classes={k:j for j,k in enumerate(keys)}
   if not chosen:continue
   groups=defaultdict(set);counts=Counter()
   for e in chosen:
    r=self.row(e['imageId']);split=e['split'];groups[e['leakageGroup']].add(split)
    if len(groups[e['leakageGroup']])>1:raise Invalid('Nhóm source đi qua split; không xuất.')
    dest=folder/kind/'images'/split/(r['id']+Path(r['path']).suffix.lower());dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(self.image_file(r),dest)
    label=folder/kind/'labels'/split/(r['id']+'.txt');label.parent.mkdir(parents=True,exist_ok=True);lines=[]
    for b in e['boxes']:
     if b['kind']!=kind:continue
     x1,y1,x2,y2=b['xyxy'];lines.append(f'{classes[b["label"]]} {(x1+x2)/2:.8f} {(y1+y2)/2:.8f} {x2-x1:.8f} {y2-y1:.8f}');counts[(b['label'],split)]+=1
    label.write_text('\n'.join(lines)+('\n' if lines else ''))
   import yaml
   names={j:k for k,j in classes.items()};(folder/kind/'data.yaml').write_text(yaml.safe_dump({'path':str(folder/kind),'train':'images/train','val':'images/val','names':names,'description':'SOLO human-confirmed development only; NOT independent Ground Truth'}))
   task_summary[kind]={'images':len(chosen),'classIds':classes,'negativeOnly':not keys,'trainingEnabled':False,'counts':{k:{s:counts[k,s] for s in ['train','val']} for k in keys}}
  for e in events:records.append(dict(e,approvedGroundTruth=False,independentlyReviewed=False,aiExposed=True,benchmarkEligible=False))
  with (folder/'records.jsonl').open('x') as f:
   for record in records:f.write(json.dumps(record,ensure_ascii=False)+'\n')
  (folder/'summary.json').write_text(json.dumps({'images':len(events),'deduplicatedImageIds':skipped,'tasks':task_summary,'trainingEnabled':False,'approvedGroundTruth':False},ensure_ascii=False,indent=2))
  manifest={str(f.relative_to(folder)):digest(f) for f in folder.rglob('*') if f.is_file()};(folder/'SHA256SUMS.json').write_text(json.dumps(manifest,indent=2));h=digest(folder/'SHA256SUMS.json')
  self.append({'kind':'bbox_export','userId':uid,'imageIds':[e['imageId'] for e in events],'folder':folder.name,'sha256':h,'trainingEnabled':False})
  return {'folder':str(folder),'images':len(events),'sha256':h,'trainingEnabled':False,'approvedGroundTruth':False}
