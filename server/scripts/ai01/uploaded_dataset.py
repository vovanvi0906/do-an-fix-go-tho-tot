"""Append-only imports in Admin state. Never modifies the immutable raw inventory."""
import base64
import hashlib
import fcntl
import io
import json
import os
import shutil
import uuid
import warnings
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageOps
import cv2
import numpy as np
from review_core import Invalid

MAX_BYTES=10*1024*1024

def canonical(value):return json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':'))
def sha(value):return hashlib.sha256(value).hexdigest()

def decode_image(payload,mime):
    if not 1<=len(payload)<=MAX_BYTES:raise Invalid('Mỗi ảnh tối đa 10 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error',Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(payload)) as im:
                if im.format not in ['JPEG','PNG','WEBP'] or {'JPEG':'image/jpeg','PNG':'image/png','WEBP':'image/webp'}[im.format]!=mime:raise ValueError('mime')
                if getattr(im,'n_frames',1)!=1 or min(im.size)<32 or max(im.size)>8192 or im.width*im.height>25_000_000:raise ValueError('dimensions')
                orientation=im.getexif().get(274,1);im.load();rgb=ImageOps.exif_transpose(im).convert('RGB');rgb.info.clear()
                buffer=io.BytesIO();rgb.save(buffer,format='PNG');normalized=buffer.getvalue()
    except Exception:raise Invalid('Không đọc được ảnh JPG/PNG/WebP tĩnh đúng MIME; cần 32–8192px/cạnh, tối đa 25 megapixel.')
    if len(normalized)>20*1024*1024:raise Invalid('Ảnh giải mã quá lớn (bản chuẩn hóa tối đa 20 MB).')
    image=cv2.imdecode(np.frombuffer(normalized,np.uint8),cv2.IMREAD_COLOR)
    pixel=sha(image.tobytes()+str(image.shape).encode());gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
    low=cv2.dct(cv2.resize(gray,(32,32)).astype(np.float32))[:8,:8].flatten();bits=low[1:]>np.median(low[1:]);phash=f'{sum(int(b)<<i for i,b in enumerate(bits)):016x}'
    return rgb,normalized,pixel,phash,orientation

class UploadedDataset:
    def __init__(self,parent):
        self.parent=parent;self.root=parent.home.parent/'uploaded-dataset-v1'
        self.root.mkdir(mode=0o700,exist_ok=True)
        if self.root.resolve().parent!=parent.home.parent.resolve():raise Invalid('Vùng nhập ảnh không hợp lệ.')
        self.log=self.root/'events.jsonl';self.rows={};self.requests={};self.head='0'*64
        if self.log.resolve().parent!=self.root.resolve():raise Invalid('Audit nhập ảnh không hợp lệ.')
        if self.log.exists():
            for line in self.log.read_text().splitlines():
                event=json.loads(line);entry={k:v for k,v in event.items() if k!='eventHash'}
                if entry['previousHash']!=self.head or sha(canonical(entry).encode())!=event['eventHash']:raise Invalid('Audit nhập ảnh không toàn vẹn.')
                self.head=event['eventHash'];self.rows[event['id']]=event;self.requests[event['uploadId']]=event
        self.log_hash=sha(self.log.read_bytes()) if self.log.exists() else None
        for event in self.rows.values():self.install(event)

    def check_audit(self):
        if (sha(self.log.read_bytes()) if self.log.exists() else None)!=self.log_hash:raise Invalid('Audit nhập ảnh đã đổi ngoài writer; cần đối chiếu trước khi tiếp tục.')

    def file(self,name):
        p=(self.root/name).resolve()
        if not p.is_relative_to(self.root.resolve()):raise Invalid('Đường dẫn ảnh ngoài vùng nhập.')
        return p

    def install(self,e):
        if e['id'] in self.parent.rows and self.parent.rows[e['id']].get('sourceKind')!='admin_upload':raise Invalid('Mã ảnh nhập trùng inventory mới; cần đối chiếu trước khi tiếp tục.')
        self.parent.rows[e['id']]={**e,'index':int(e['id'][4:]),'dataset':'admin_upload','path':'uploads/'+e['imageFile'],
            'classIds':[],'annotations':[],'annotationIssues':[],'annotationSha256':e['annotationSha256'],'reference':False,'split':'development',
            'sourceFamilyCandidate':e['groupKey'],'aiPrediction':None}
        self.parent.counts=__import__('collections').Counter(r['pixelSha256'] for r in self.parent.rows.values())
        if e['nearCandidates']:self.parent.duplicates[str(int(e['id'][4:]))]={'nearDegree':len(e['nearCandidates']),'nearNeighbors':e['nearCandidates']}

    def verify(self,i):
        self.check_audit();e=self.rows.get(i)
        if not e:raise Invalid('Không có ảnh nhập này.')
        if any(sha(self.file(e[field]).read_bytes())!=e[hashfield] for field,hashfield in [('imageFile','sha256'),('originalFile','originalSha256'),('labelFile','annotationSha256')]):raise Invalid('Checksum ảnh nhập hoặc ảnh gốc đã đổi.')
        return e

    def blockers(self,i,review=None):
        e=self.rows[i];review=review or self.parent.quality.latest.get(i,{})
        check=review.get('duplicateReview') or {}
        expected=sorted(c['imageId'] for c in e['nearCandidates'])
        if review.get('status')=='confirmed' and check.get('decision')=='independent' and isinstance(check.get('evidence'),str) and 20<=len(check['evidence'].strip())<=3000 and sorted(check.get('imageIds',[]))==expected and len(expected)<=100:return []
        return ['Ảnh gần trùng thuộc nhóm khác; cần đối chiếu nhóm/split trước khi xuất.'] if e['nearCandidates'] else []

    def packet_hash(self,i):return self.rows[i]['eventHash']

    def detail(self,i):
        e=self.verify(i);target=next((t for t in self.parent.tax['targets'] if t['id']==e.get('targetId')),None)
        candidate=[] if not target else [{'targetId':target['id'],'targetName':target['name'],'categoryId':target['categoryId']}]
        boxes=(self.parent.quality.latest.get(i) or {}).get('boxes',[])
        if not self.parent.quality.latest.get(i):
            boxes=[{'xyxy':b['xyxy'],'kind':'object' if b.get('candidateTargetId') else 'sign','label':b.get('candidateTargetId') or b.get('candidateSign')} for b in e.get('sourceReferences',[])]
        signs=self.parent.quality.load()['signs']
        annotations=[];display=[]
        for index,b in enumerate(boxes):
            x1,y1,x2,y2=b['xyxy'];annotations.append({'classId':index,'format':'bbox','coordinates':[(x1+x2)/2,(y1+y2)/2,x2-x1,y2-y1]})
            label=next((t['name'] for t in self.parent.tax['targets'] if t['id']==b['label']),b['label']) if b['kind']=='object' else signs.get(b['label'],{}).get('name',b['label'])
            display.append({'classId':index,'displayVi':{'labelVi':label},'catalogTargetCandidates':[]})
        return dict(id=i,dataset='admin_upload',sourceOverlay=not bool(self.parent.quality.latest.get(i)),imported=True,sourceKind='admin_upload',sha256=e['sha256'],annotations=annotations,sourceLabels=[b['sourceLabel'] for b in e.get('sourceReferences',[])],sourceLabelsVi=[b.get('sourceLabelVi',b['sourceLabel']) for b in e.get('sourceReferences',[])],sourceMappings=display,candidates=candidate,mappingKeys=[],
            source={'url':e['sourceReference'],'licenseDeclared':{'owned':'Ảnh tự chụp / sở hữu','licensed':'Có giấy phép khai báo','permission':'Được cho phép khai báo'}[e['rightsType']]},annotation=self.parent.latest.get(i),duplicateCount=self.parent.counts[e['pixelSha256']],
            imagePath='uploads/'+e['imageFile'],annotationSha256=e['annotationSha256'],duplicateEvidence={'nearCandidates':e['nearCandidates']},
            history=[x for x in self.parent.events if x.get('imageId')==i],developmentCheck=self.parent.checks.get(i),ai=None,importMetadata={k:e.get(k) for k in ['originalName','sourceType','sourceReference','rightsType','rightsEvidence','groupKey','categoryId','targetId','timestamp','userId','eventHash','generatorTool','generatedAt','prompt','batchId','datasetName','synthetic']})

    def presentation(self,i):
        e=self.rows[i];image=self.parent.latest.get(i);box=self.parent.quality.latest.get(i)
        current=box if box and (not image or box['timestamp']>image['timestamp']) else image
        status=(current or {}).get('decision',(current or {}).get('status','pending'))
        if current is box and box:ids=sorted({b['label'] for b in box['boxes'] if b['kind']=='object'})
        elif current is image and image:ids=image.get('targetIds',[])
        else:ids=sorted(({e['targetId']} if e['targetId'] else set())|{b['candidateTargetId'] for b in e.get('sourceReferences',[]) if b.get('candidateTargetId')})
        labels=[t['name'] for t in self.parent.tax['targets'] if t['id'] in ids]
        if current is box and box:labels.extend(self.parent.quality.load()['signs'].get(b['label'],{}).get('name',b['label']) for b in box['boxes'] if b['kind']=='sign')
        elif image:labels.extend(self.parent.quality.load()['signs'].get(k,{}).get('name',k) for k in image.get('visibleSigns') or [])
        return dict(imported=True,categoryHintId=e['categoryId'],targetHintId=e['targetId'],currentTargetIds=ids,sourceType=e['sourceType'],batchId=e.get('batchId'),datasetName=e.get('datasetName'),currentLabelsVi=labels if current else [b.get('sourceLabelVi',b['sourceLabel']) for b in e.get('sourceReferences',[])],labelConfirmed=status=='confirmed',status=status if status in ['confirmed','uncertain','rejected'] else 'pending')

    def quality_row(self,i,verify=True):
        e=self.verify(i) if verify else self.rows[i]
        return {**e,'dataset':'admin_upload','path':'uploads/'+e['imageFile'],'annotationPath':'uploads/'+e['labelFile'],
            'annotationSha256':e['annotationSha256'],'yamlSha256':None,'developmentSplit':e['developmentSplit'],
            'sourceReferences':e.get('sourceReferences',[]),'copyPath':e['imageFile'],'sourceModelAnalysis':None,'sourceFamilyCandidate':e['groupKey'],
            'source':{'url':e['sourceReference'],'license':e['rightsType']},'sourceKind':'admin_upload','importEventHash':e['eventHash']}


    def upload(self,uid,p):
        lock=os.open(self.root/'upload.lock',os.O_CREAT|os.O_RDWR|os.O_NOFOLLOW,0o600)
        try:
            fcntl.flock(lock,fcntl.LOCK_EX)
            return self._upload(uid,p)
        finally:os.close(lock)

    def _upload(self,uid,p):
        self.check_audit();self.parent.quality.check_audit()
        if not self.parent.quality.load():raise Invalid('Chưa có taxonomy/dấu hiệu cho công cụ bbox. Cần cấu hình quality dataset trước khi nhập ảnh.')
        required={'uploadId','filename','mime','content','categoryId','targetId','sourceType','sourceReference','rightsType','rightsEvidence','groupKey','developmentOnly','catalog'}
        if not required.issubset(p) or set(p)-(required|{'generatorTool','generatedAt','prompt','batchId','datasetName','sourceMetadata','sourceReferences','sourceLabelContent','sourceYaml','metadataProvenance'}):raise Invalid('Thông tin nhập ảnh thiếu hoặc có trường không hợp lệ.')
        try:uuid.UUID(p['uploadId'])
        except (ValueError,TypeError):raise Invalid('Mã lần tải ảnh không hợp lệ.')
        if p['developmentOnly'] is not True:raise Invalid('Chỉ nhập ảnh phát triển, không nhận ảnh thuộc test/benchmark độc lập.')
        for field in ['filename','sourceReference','rightsEvidence','groupKey']:
            if not isinstance(p[field],str) or len(p[field].strip())<(1 if field=='filename' else 3) or len(p[field])>(200 if field in ['filename','groupKey'] else 3000):raise Invalid('Cần tên ảnh, nguồn, bằng chứng quyền ảnh và mã nhóm cùng thiết bị/phiên chụp.')
        if (p['sourceType'] not in ['roboflow','own_photo','licensed','permission','synthetic_ai'] or p['rightsType'] not in ['owned','licensed','permission'] or p['sourceType'] in ['own_photo','licensed','permission'] and {'own_photo':'owned','licensed':'licensed','permission':'permission'}[p['sourceType']]!=p['rightsType']):raise Invalid('Nguồn/quyền ảnh không hợp lệ.')
        if p['sourceType']=='synthetic_ai' and (not p.get('generatorTool') or not p.get('generatedAt')):raise Invalid('Ảnh AI cần công cụ và ngày tạo.')
        catalog=p['catalog'];category=next((c for c in catalog['categories'] if c['id']==p['categoryId']),None)
        target=next((t for t in catalog['targets'] if t['id']==p['targetId'] and t['categoryId']==p['categoryId']),None) if p['targetId'] else None
        if not category or (p['targetId'] and not target):raise Invalid('Danh mục/đối tượng không hoạt động hoặc không khớp nhau.')
        if category['id'] not in {c['id'] for c in self.parent.tax['categories']} or (target and target['id'] not in {t['id'] for t in self.parent.tax['targets']}):raise Invalid('Taxonomy dataset chưa đồng bộ đối tượng mới. Cần cập nhật snapshot trước khi nhập.')
        try:payload=base64.b64decode(p['content'],validate=True)
        except (ValueError,TypeError):raise Invalid('Nội dung file không hợp lệ.')
        if not 1<=len(payload)<=MAX_BYTES:raise Invalid('Mỗi ảnh tối đa 10 MB.')
        original_hash=sha(payload)
        if p['uploadId'] in self.requests:
            old=self.requests[p['uploadId']]
            if old['originalSha256']!=original_hash or old['userId']!=uid or any(old[k]!=p[k].strip() for k in ['categoryId','targetId','sourceType','sourceReference','rightsType','rightsEvidence','groupKey']):raise Invalid('Mã lần tải đã dùng với ảnh/tài khoản khác.')
            self.verify(old['id']);return {'status':'existing','imageId':old['id'],'message':'Ảnh đã được nhập ở lần tải trước.'}
        rgb,normalized,pixel,phash,_=decode_image(payload,p['mime'])
        for reference in self.parent.reference_rows:
            if reference['sha256']==original_hash or reference['pixelSha256']==pixel or (reference.get('phash') and (int(reference['phash'],16)^int(phash,16)).bit_count()<=6):raise Invalid('Ảnh trùng/gần trùng tập tham chiếu được bảo vệ; không được nhập vào dữ liệu phát triển.')
        for row in self.parent.rows.values():
            if row['sha256']==original_hash or row['pixelSha256']==pixel:
                if row['id'] in self.rows:self.verify(row['id'])
                return {'status':'duplicate','imageId':row['id'],'message':'Ảnh trùng chính xác với ảnh đã có; không tạo bản sao.'}
        group=sha(('fixgo-upload-group-v1:'+p['groupKey'].strip().casefold()).encode())
        leakage='upload-group-'+group[:24];split='val' if int(group[:8],16)/0xffffffff<.2 else 'train'
        existing_splits={r['developmentSplit'] for r in self.rows.values() if r['leakageGroup']==leakage}
        if len(existing_splits)>1:raise Invalid('Nhóm nguồn đã xung đột split; cần đối chiếu.')
        if existing_splits:split=next(iter(existing_splits))
        if p['sourceType']=='synthetic_ai':
            if existing_splits and split!='train':raise Invalid('Ảnh AI cùng nhóm nguồn đang ở validation; cần đối chiếu, không đổi split tự động.')
            split='train'
        near=[]
        for row in self.parent.rows.values():
            if row.get('phash') and (int(row['phash'],16)^int(phash,16)).bit_count()<=6:
                if row.get('leakageGroup')==leakage:continue
                near.append({'imageId':row['id'],'distance':(int(row['phash'],16)^int(phash,16)).bit_count()})
        if shutil.disk_usage(self.root).free-len(normalized)-len(payload)<2*1024**3:raise Invalid('Cần giữ ít nhất 2 GiB đĩa trống sau khi nhập.')
        index=max([int(i[4:]) for i in self.parent.rows]+[int(r['id'][4:]) for r in self.parent.reference_rows])+1
        if index>99999:raise Invalid('Đã hết dải mã ảnh; cần nâng cấp inventory trước khi nhập thêm.')
        image_id=f'img-{index:05d}';token=uuid.uuid4().hex;folder=self.file('images/'+token);folder.mkdir(parents=True,mode=0o700)
        event={'kind':'image_import','id':image_id,'uploadId':p['uploadId'],'userId':uid,'timestamp':datetime.now(timezone.utc).isoformat(),
            'originalName':Path(p['filename'].replace('\\','/')).name,'originalMime':p['mime'],'sourceType':p['sourceType'],'sourceReference':p['sourceReference'].strip(),'rightsType':p['rightsType'],'rightsEvidence':p['rightsEvidence'].strip(),
            'groupKey':p['groupKey'].strip(),'leakageGroup':leakage,'developmentSplit':split,'categoryId':category['id'],'targetId':target['id'] if target else '',
            'width':rgb.width,'height':rgb.height,'originalSha256':original_hash,'sha256':sha(normalized),'pixelSha256':pixel,'phash':phash,
            'imageFile':str(folder.relative_to(self.root)/'image.png'),'originalFile':str(folder.relative_to(self.root)/'original.bin'),'labelFile':str(folder.relative_to(self.root)/'empty.txt'),'annotationSha256':sha(b''),
            'nearCandidates':near,'reviewStatus':'pending','partition':'quarantine','approvedGroundTruth':False,'sourceKind':'admin_upload','previousHash':self.head}
        if p.get('batchId') or p['sourceType']=='synthetic_ai':
            event.update({k:p.get(k) for k in ['batchId','datasetName','generatorTool','generatedAt','prompt','sourceMetadata','sourceReferences','sourceYaml','metadataProvenance']})
        event.update(synthetic=p['sourceType']=='synthetic_ai',benchmarkEligible=False,independentlyReviewed=False)
        label_bytes=p.get('sourceLabelContent','').encode('utf-8');event['annotationSha256']=sha(label_bytes)
        event['eventHash']=sha(canonical(event).encode())
        try:
            for name,data in [('image.png',normalized),('original.bin',payload),('empty.txt',label_bytes)]:
                with (folder/name).open('xb') as f:f.write(data);f.flush();os.fsync(f.fileno())
            with self.log.open('a') as f:f.write(json.dumps(event,ensure_ascii=False)+'\n');f.flush();os.fsync(f.fileno())
        except Exception:
            # Keep an uncommitted folder for recovery if the journal write was interrupted.
            raise Invalid('Không lưu được ảnh/audit. Hãy tải lại và kiểm tra trạng thái trước khi thử lại.')
        self.head=event['eventHash'];self.log_hash=sha(self.log.read_bytes());self.rows[image_id]=event;self.requests[p['uploadId']]=event;self.install(event)
        return {'status':'imported','imageId':image_id,'nearDuplicateCount':len(near),'partition':'quarantine','message':'Đã thêm ảnh, chưa xác nhận nhãn hoặc đủ điều kiện huấn luyện.'}
