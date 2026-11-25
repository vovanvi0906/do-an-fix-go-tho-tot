"""Bounded, private staging of ZIP/images, immutable source hints, per-image resumable commit."""
import base64, csv, hashlib, io, json, math, os, re, shutil, stat, uuid, zipfile
from datetime import datetime, timezone, date
from pathlib import Path, PurePosixPath
import yaml
from yaml.tokens import AliasToken, AnchorToken
from review_core import Invalid
from uploaded_dataset import decode_image, sha
from dataset_package import VERSION, check_layout, row_errors

MIMES={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'}
SOURCES={'roboflow','own_photo','licensed','permission','synthetic_ai'}

def atomic(path,value):
    tmp=path.with_suffix('.tmp')
    with tmp.open('w',encoding='utf-8') as f:json.dump(value,f,ensure_ascii=False);f.flush();os.fsync(f.fileno())
    os.replace(tmp,path)

def safe_name(name):
    if not isinstance(name,str) or not name or len(name)>240 or '\\' in name or '\x00' in name or ':' in name:raise Invalid('ZIP có đường dẫn không an toàn.')
    p=PurePosixPath(name)
    if p.is_absolute() or any(v in ['..','.'] for v in name.split('/')):raise Invalid('ZIP path traversal bị chặn.')
    return str(p)

def text(path,maximum=2*1024*1024):
    if path.stat().st_size>maximum:raise Invalid('Metadata/nhãn quá lớn.')
    try:return path.read_text(encoding='utf-8-sig')
    except UnicodeError:raise Invalid('Metadata và nhãn cần UTF-8.')

def normalize(s):return str(s).strip().casefold().replace('_','-')

ALIASES={'image':'filename','file_name':'filename','image_path':'filename','image_file':'filename','sourceType':'source_type','source':'source_type','sourceReference':'source_reference','source_group':'group_key','groupKey':'group_key','rightsType':'rights_type','rightsEvidence':'rights_evidence','generatorTool':'generator_tool','generatedAt':'generated_at','sign_label_candidate':'sign_label','benchmarkEligible':'benchmark_eligible'}

def comparable(value):
    if value is None or value=='':return None
    if isinstance(value,str):
        value=value.strip().replace('\r\n','\n')
        if not value:return None
        if value.lower() in ['true','false']:return value.lower()
        if value[:1] in ['[','{']:
            try:return comparable(json.loads(value))
            except (ValueError,TypeError):pass
        return value
    if isinstance(value,bool):return str(value).lower()
    if isinstance(value,(int,float)):return str(value)
    if isinstance(value,list):return [comparable(v) for v in value]
    if isinstance(value,dict):return {k:comparable(v) for k,v in sorted(value.items())}
    return value

def canonical_record(row):
    result={}
    for key,value in row.items():
        key=ALIASES.get(key,key)
        if key=='filename':continue
        value=comparable(value)
        if value is not None:
            if key in ['labels','signs','object_labels','sign_labels'] and isinstance(value,list):value=sorted(value,key=lambda x:json.dumps(x,sort_keys=True))
            result[key]=value
    return result

def read_metadata(path,images,assets,limits):
    content=text(path);records=[]
    try:
        if path.suffix.lower()=='.csv':
            csv.field_size_limit(10000);reader=csv.DictReader(io.StringIO(content))
            if not reader.fieldnames or len(reader.fieldnames)!=len(set(reader.fieldnames)):raise Invalid('CSV thiếu header hoặc trùng cột.')
            for row in reader:
                if len(records)>=limits['maxImages']:raise Invalid('Metadata quá nhiều dòng.')
                if None in row or any(v is None for v in row.values()):raise Invalid('CSV có dòng thừa/thiếu ô.')
                records.append(row)
        else:
            for line in content.splitlines():
                if not line.strip():continue
                if len(records)>=limits['maxImages']:raise Invalid('Metadata quá nhiều dòng.')
                records.append(json.loads(line))
    except (ValueError,csv.Error):raise Invalid('metadata.csv/jsonl không hợp lệ.')
    output={};base=path.parent.relative_to(assets)
    for original in records:
        if not isinstance(original,dict) or any(not isinstance(k,str) for k in original) or len(json.dumps(original))>20000:raise Invalid('Dòng metadata không hợp lệ hoặc quá dài.')
        row=dict(original);normalized={}
        for key,value in original.items():
            canonical_key=ALIASES.get(key,key)
            if canonical_key in normalized and comparable(normalized[canonical_key])!=comparable(value):raise Invalid('Hai cột metadata cùng nghĩa nhưng khác giá trị: '+canonical_key)
            normalized[canonical_key]=value
        row.update(normalized)
        for key in ['filename','source_type','generator_tool','generated_at','prompt','group_key','target_id','target_slug','rights_type','rights_evidence','source_reference','split']:
            if row.get(key) is not None and not isinstance(row[key],str):raise Invalid('Metadata cần chuỗi cho trường '+key)
        name=safe_name(row.get('filename'))
        exact=[i for i in images if i==name or i==str(base/name)]
        matches=exact or [i for i in images if i.endswith('/'+name)] or [i for i in images if Path(i).name==Path(name).name]
        if len(matches)!=1:raise Invalid('Metadata không khớp duy nhất một ảnh: '+name)
        resolved=matches[0]
        if resolved in output:raise Invalid('Metadata trùng ảnh: '+name)
        output[resolved]=row
    return output

def compare_metadata(candidates):
    files=[{k:v for k,v in c.items() if k!='records'} for c in candidates.values()]
    if not candidates:return {'mode':'none','selected':None,'requiresSelection':False,'files':[],'differences':[],'differentImages':0}
    if len(candidates)==1:
        kind=next(iter(candidates));return {'mode':'single','selected':kind,'requiresSelection':False,'files':files,'differences':[],'differentImages':0}
    csv_data=candidates['csv'];json_data=candidates['jsonl'];diff=[];count=0
    for filename in sorted(set(csv_data['records'])|set(json_data['records'])):
        left=csv_data['records'].get(filename);right=json_data['records'].get(filename)
        a=canonical_record(left) if left is not None else {};b=canonical_record(right) if right is not None else {}
        fields=sorted(k for k in set(a)|set(b) if a.get(k)!=b.get(k))
        if left is None or right is None:fields=['record']+fields
        if fields:
            count+=1
            if len(diff)<20:diff.append({'filename':filename,'fields':fields[:10],'csv':{k:str(a.get(k,'Không có record/trường'))[:240] for k in fields[:5]},'jsonl':{k:str(b.get(k,'Không có record/trường'))[:240] for k in fields[:5]}})
    conflict=count>0 or any(c.get('error') for c in candidates.values())
    return {'mode':'conflict' if conflict else 'equivalent','selected':None if conflict else 'csv','requiresSelection':conflict,'files':files,'differences':diff,'differentImages':count}

class DatasetImport:
    def __init__(self,parent):
        self.parent=parent;self.root=parent.home.parent/'dataset-import-v1';self.root.mkdir(exist_ok=True,mode=0o700)
    def folder(self,id):
        try:uuid.UUID(id)
        except (ValueError,TypeError):raise Invalid('Mã lô dataset không hợp lệ.')
        folder=(self.root/id).resolve()
        if folder.parent!=self.root.resolve():raise Invalid('Đường dẫn lô không hợp lệ.')
        return folder
    def load(self,uid,id):
        folder=self.folder(id)
        try:data=json.loads((folder/'batch.json').read_text())
        except (FileNotFoundError,ValueError):raise Invalid('Không tìm thấy lô kiểm tra. Hãy chọn lại file.')
        if data['owner']!=uid:raise Invalid('Lô dataset thuộc Admin khác.')
        return folder,data
    def response(self,data):
        return {k:v for k,v in data.items() if k not in ['owner','inputs','metadata','metadataCandidates','yaml','assetPaths']}
    def handle(self,uid,op,p):
        if op=='fast_dataset_preview':return self.preview(uid,p)
        folder,data=self.load(uid,p['batchId'])
        if op=='fast_dataset_status':return self.response(data)
        if op=='fast_dataset_validate':
            if data['results']:raise Invalid('Lô đã bắt đầu nhập; không đổi mapping/nguồn. Tiếp tục lô hoặc tạo lô mới.')
            return self.validate(folder,data,p['options'],p['catalog'])
        if op=='fast_dataset_commit':return self.commit(uid,folder,data,p)
        raise Invalid('Thao tác dataset không hợp lệ.')
    def preview(self,uid,p):
        folder=self.folder(p['batchId']);limits=p['limits'];inputs=p['inputs']
        if (folder/'batch.json').exists():raise Invalid('Lô đã tồn tại.')
        if not inputs or len(inputs)>limits['maxImages'] or sum(i['size'] for i in inputs)>limits['maxUploadBytes']:raise Invalid('Vượt giới hạn file/dung lượng.')
        if shutil.disk_usage(folder).free-sum(i['size'] for i in inputs)<2*1024**3:raise Invalid('Cần giữ 2 GiB đĩa trống.')
        assets=folder/'assets';assets.mkdir(mode=0o700)
        zips=[i for i in inputs if i['name'].lower().endswith('.zip')]
        if zips and len(inputs)!=1:raise Invalid('Mỗi lượt chỉ chọn một ZIP hoặc nhiều ảnh.')
        if zips:
            original=folder/'input'/zips[0]['stored']
            try:
                with zipfile.ZipFile(original) as z:
                    entries=z.infolist();seen=set();expanded=0
                    if len(entries)>limits['maxEntries']:raise Invalid('ZIP có quá nhiều entry.')
                    for e in entries:
                        name=safe_name(e.filename);key=name.casefold();mode=e.external_attr>>16
                        if key in seen:raise Invalid('ZIP có đường dẫn trùng hoặc khác chữ hoa/thường.')
                        seen.add(key)
                        if e.flag_bits&1 or stat.S_ISLNK(mode) or stat.S_IFMT(mode) not in [0,stat.S_IFREG,stat.S_IFDIR]:raise Invalid('ZIP mã hóa/symlink/file đặc biệt không được hỗ trợ.')
                        if e.is_dir():continue
                        expanded+=e.file_size
                        if e.file_size>limits['maxImageBytes'] or expanded>limits['maxExpandedBytes'] or e.file_size/max(1,e.compress_size)>limits['maxRatio']:raise Invalid('ZIP vượt giới hạn giải nén hoặc nghi ZIP bomb.')
                        if Path(name).suffix.lower() not in set(MIMES)|{'.csv','.jsonl','.txt','.yaml','.yml','.md'}:raise Invalid('ZIP có file không hỗ trợ hoặc ZIP lồng nhau: '+name)
                    if shutil.disk_usage(folder).free-expanded<2*1024**3:raise Invalid('Cần giữ 2 GiB đĩa trống sau giải nén.')
                    for e in entries:
                        if e.is_dir():continue
                        dest=assets/safe_name(e.filename);dest.parent.mkdir(parents=True,exist_ok=True)
                        # Never extractall: validate every name, declared AND actual streaming sizes.
                        read=0
                        with z.open(e) as src,dest.open('xb') as out:
                            while True:
                                block=src.read(65536)
                                if not block:break
                                read+=len(block)
                                if read>e.file_size or read>limits['maxImageBytes']:raise Invalid('ZIP có kích thước giải nén không hợp lệ.')
                                out.write(block)
            except (zipfile.BadZipFile,RuntimeError,NotImplementedError,EOFError):raise Invalid('ZIP hỏng hoặc dùng kiểu nén không hỗ trợ.')
        else:
            seen=set()
            for i in inputs:
                name=safe_name(i['name'])
                if '/' in name or name.casefold() in seen:raise Invalid('Tên ảnh trùng hoặc không hợp lệ.')
                seen.add(name.casefold())
                if Path(name).suffix.lower() not in MIMES:raise Invalid('Chỉ chọn ảnh JPG/PNG/WebP.')
                shutil.copyfile(folder/'input'/i['stored'],assets/name)
        images=sorted(str(x.relative_to(assets)) for x in assets.rglob('*') if x.is_file() and x.suffix.lower() in MIMES)
        if not images or len(images)>limits['maxImages']:raise Invalid('ZIP không có ảnh hoặc vượt số ảnh tối đa.')
        # Nested YOLO directory layouts accepted; never follow YAML train/val/test filesystem paths.
        yamls=[x for x in assets.rglob('*') if x.name.casefold() in ['data.yaml','data.yml']]
        if len(yamls)>1:raise Invalid('Chỉ hỗ trợ một data.yaml để tránh class mapping mơ hồ.')
        source_yaml=text(yamls[0],1024*1024) if yamls else ''
        dataset_metadata={};package_version=None
        if source_yaml:
            try:
                if any(isinstance(t,(AliasToken,AnchorToken)) for t in yaml.scan(source_yaml)):raise Invalid('YAML alias/anchor không được hỗ trợ.')
                y=yaml.safe_load(source_yaml)
            except yaml.YAMLError:raise Invalid('data.yaml sai định dạng.')
            if not isinstance(y,dict):raise Invalid('data.yaml cần object có names/nc.')
            if 'fixgo_package_version' in y:package_version=check_layout(assets,images,y,text)
            fields=['source_type','sourceType','source_reference','rights_type','rights_evidence','group_key','groupKey','generator_tool','generatorTool','generated_at','generatedAt','prompt','split','benchmarkEligible','benchmark_eligible','synthetic']
            extra=y.get('metadata',{})
            if not isinstance(extra,dict):raise Invalid('metadata trong YAML cần object.')
            dataset_metadata={k:extra.get(k,y.get(k)) for k in fields if k in extra or k in y}
            for key in ['generated_at','generatedAt']:
                if isinstance(dataset_metadata.get(key),date):dataset_metadata[key]=dataset_metadata[key].isoformat()
            rf=y.get('roboflow')
            if rf:
                if not isinstance(rf,dict):raise Invalid('roboflow trong YAML cần object.')
                dataset_metadata.setdefault('source_type','roboflow')
                if isinstance(rf.get('url'),str):dataset_metadata.setdefault('source_reference',rf['url'])
                # License declarations are provenance, never invented rights evidence.
                dataset_metadata['roboflow']=rf
            for key,value in dataset_metadata.items():
                if key not in ['roboflow','synthetic','benchmarkEligible','benchmark_eligible'] and value is not None and not isinstance(value,str):raise Invalid('YAML metadata cần chuỗi cho trường '+key)
            if str(dataset_metadata.get('split','')).lower() in ['test','benchmark','reference'] or str(dataset_metadata.get('benchmarkEligible','')).lower()=='true' or str(dataset_metadata.get('benchmark_eligible','')).lower()=='true':raise Invalid('Metadata YAML khai test/benchmark; không nhập development.')
            names=y.get('names',[])
            if isinstance(names,dict):
                if set(str(k) for k in names)!=set(str(i) for i in range(len(names))):raise Invalid('Class ID data.yaml phải liên tục từ 0.')
                names=[names.get(i,names.get(str(i))) for i in range(len(names))]
            if not isinstance(names,list) or len(names)>200 or any(not isinstance(n,str) or not n.strip() or len(n)>200 for n in names) or len(set(names))!=len(names) or y.get('nc',len(names))!=len(names):raise Invalid('names/nc trong data.yaml không hợp lệ.')
        else:names=[]
        metadata={};warnings=[];candidates={};synthetic_images=set()
        meta_files=sorted(x for x in assets.rglob('*') if x.name.casefold() in ['metadata.csv','metadata.jsonl'])
        for file in meta_files:
            kind=file.suffix.lower()[1:]
            if kind in candidates:raise Invalid('Có nhiều file metadata.'+kind+'; cần giữ một file cho mỗi định dạng.')
            candidate={'id':kind,'filename':str(file.relative_to(assets)),'sha256':sha(file.read_bytes()),'records':{}}
            try:candidate['records']=read_metadata(file,images,assets,limits)
            except Invalid as err:candidate['error']=str(err)
            candidate['recordCount']=len(candidate['records']);candidates[kind]=candidate
            for image,row in candidate['records'].items():
                # A source selector cannot bypass protected test membership or downgrade known synthetic claims.
                if str(row.get('split','')).lower() in ['test','benchmark','reference'] or str(row.get('benchmark_eligible','')).lower()=='true':raise Invalid('Metadata khai test/benchmark; không nhập vào development.')
                if row.get('source_type')=='synthetic_ai' or str(row.get('synthetic','')).lower()=='true':synthetic_images.add(image)
        if not meta_files:warnings.append('Không có metadata CSV/JSONL; nếu YAML cũng thiếu thông tin, bổ sung trong Thông tin nâng cao.')
        if not names and not source_yaml:
            discovered=set()
            for path in assets.rglob('*.txt'):
                if path.name.lower().startswith(('readme','license')):continue
                for line in text(path,100000).splitlines():
                    fields=line.split()
                    if fields and fields[0].isdigit():
                        value=int(fields[0])
                        if value>=200:raise Invalid('Class ID vượt giới hạn 0–199.')
                        discovered.add(value)
            names=['Class '+str(i) for i in range(max(discovered)+1)] if discovered else []
        hashes={str(x.relative_to(assets)):sha(x.read_bytes()) for x in assets.rglob('*') if x.is_file()}
        data={'packageVersion':package_version,'batchId':p['batchId'],'owner':uid,'createdAt':datetime.now(timezone.utc).isoformat(),'inputs':inputs,'assetPaths':images,'assetHashes':hashes,'metadata':metadata,'metadataCandidates':candidates,'metadataSyntheticImages':sorted(synthetic_images),'datasetMetadata':dataset_metadata,'yaml':source_yaml,'classNames':names,'results':{},'warnings':warnings,'limits':limits,'options':p['options']}
        return self.validate(folder,data,p['options'],p['catalog'])
    def validate(self,folder,data,options,catalog):
        if options.get('sourceType','') not in SOURCES|{''} or options.get('rightsType','') not in ['','owned','licensed','permission'] or options.get('developmentOnly') is not True:raise Invalid('Nguồn/quyền ảnh hoặc xác nhận development không hợp lệ.')
        if 'metadataCandidates' in data:
            candidates=data['metadataCandidates'];comparison=compare_metadata(candidates)
            requested=options.get('metadataSource','auto')
            if requested not in ['auto','csv','jsonl']:raise Invalid('Nguồn metadata không hợp lệ.')
            selected=comparison['selected']
            if comparison['mode']=='conflict' and requested!='auto':selected=requested
            if selected and selected not in candidates:raise Invalid('Không có nguồn metadata đã chọn trong ZIP.')
            if selected and candidates[selected].get('error'):raise Invalid('Nguồn metadata đã chọn bị lỗi: '+candidates[selected]['error'])
            comparison.update(selected=selected,requiresSelection=comparison['mode']=='conflict' and not selected)
            data['metadataComparison']=comparison;data['metadata']=candidates[selected]['records'] if selected else {}
            for row in data['metadata'].values():
                if str(row.get('split','')).lower() in ['test','benchmark','reference'] or str(row.get('benchmark_eligible','')).lower()=='true':raise Invalid('Metadata khai test/benchmark; không nhập development.')
        categories={c['id']:c for c in catalog['categories'] if c.get('isActive') is not False};targets={t['id']:t for t in catalog['targets'] if t.get('isActive') is not False}
        if options.get('categoryId') and options['categoryId'] not in categories or options.get('targetId') and (options['targetId'] not in targets or targets[options['targetId']]['categoryId']!=options.get('categoryId')):raise Invalid('Danh mục/đối tượng không khớp taxonomy hiện tại.')
        signs=self.parent.quality.load()['signs'];mapping=options.get('classMapping',{});classes=[]
        if not isinstance(mapping,dict):raise Invalid('Class mapping cần object.')
        if any(not str(k).isdigit() or int(k)>=200 for k in mapping):raise Invalid('Class mapping cần ID 0–199.')
        if data['classNames'] and any(int(k)>=len(data['classNames']) for k in mapping):raise Invalid('Class mapping ngoài names của data.yaml.')
        if len(mapping)>200:raise Invalid('Quá nhiều class mapping.')
        for ix,name in enumerate(data['classNames']):
            m=mapping.get(str(ix))
            if str(ix) not in mapping:
                t=next((t for t in targets.values() if normalize(name) in [normalize(t['name']),normalize(t.get('slug','')),normalize(t['id'])]),None)
                sign=next((k for k,v in signs.items() if normalize(name) in [normalize(k),normalize(v['name'])]),None)
                m={'kind':'object','label':t['id']} if t else {'kind':'sign','label':sign} if sign else None
            if m and (not isinstance(m,dict) or set(m)!=set(['kind','label']) or not isinstance(m.get('kind'),str) or not isinstance(m.get('label'),str) or m['kind'] not in ['object','sign'] or m['label'] not in (targets if m['kind']=='object' else signs)):raise Invalid('Class mapping không hợp lệ: '+name)
            classes.append({'id':str(ix),'name':name,'mapping':m})
        # Explicit numeric mappings may stand in for absent YAML, with no inferred source class names.
        if not data['classNames'] and mapping:
            keys=sorted(mapping,key=lambda k:int(k) if str(k).isdigit() else -1)
            if keys!=[str(i) for i in range(len(keys))]:raise Invalid('Class mapping cần ID liên tục từ 0.')
            for k in keys:
                m=mapping[k]
                if not isinstance(m,dict) or set(m)!={'kind','label'} or not isinstance(m.get('kind'),str) or not isinstance(m.get('label'),str) or m['kind'] not in ['object','sign'] or m['label'] not in (targets if m['kind']=='object' else signs):raise Invalid('Class mapping không hợp lệ.')
                classes.append({'id':k,'name':'Class '+k,'mapping':m})
        if data.get('packageVersion')==VERSION:
            for klass in classes:
                name=klass['name'];m=klass['mapping']
                expected=next(({'kind':'object','label':t['id']} for t in targets.values() if name==t.get('slug')),None)
                if name in signs:expected={'kind':'sign','label':name}
                if not expected or m!=expected:raise Invalid('data.yaml names/class mapping v1 cần slug đối tượng hoặc code dấu hiệu chính xác: '+name)
        assets=folder/'assets';items=[];within={}
        txts=[p for p in data['assetHashes'] if p.lower().endswith('.txt') and not Path(p).name.lower().startswith(('readme','license')) and (not data.get('packageVersion') or p.startswith('labels/'))]
        for ix,name in enumerate(data['assetPaths']):
            row={'id':f'item-{ix:04d}','filename':name,'errors':[],'warnings':[],'labelCount':0,'validLabelCount':0,'sourceReferences':[],'sha256':data['assetHashes'][name]}
            meta=data.get('datasetMetadata',{})|data['metadata'].get(name,{})
            source='synthetic_ai' if name in data.get('metadataSyntheticImages',[]) or str(data.get('datasetMetadata',{}).get('synthetic','')).lower()=='true' or data.get('datasetMetadata',{}).get('source_type')=='synthetic_ai' or data.get('datasetMetadata',{}).get('sourceType')=='synthetic_ai' or options['sourceType']=='synthetic_ai' or meta.get('source_type')=='synthetic_ai' or meta.get('sourceType')=='synthetic_ai' or str(meta.get('synthetic','')).lower()=='true' else meta.get('source_type') or meta.get('sourceType') or options['sourceType']
            if data.get('metadataComparison',{}).get('requiresSelection'):row['errors'].append('CSV và JSONL khác nhau; chọn nguồn metadata và kiểm tra lại trước khi nhập.')
            if name in data.get('metadataSyntheticImages',[]) and meta.get('source_type') not in [None,'','synthetic_ai']:
                row['warnings'].append('Một nguồn metadata khai ảnh AI; giữ synthetic_ai để tránh chuyển thành ảnh thật. Cần kiểm chứng nguồn trước khi xuất.')
            row['metadataLabels']=[str(meta[k]) for k in ['object_label','sign_label','condition','target_slug'] if meta.get(k)]
            row.update(categoryId=meta.get('category_id') or options.get('categoryId',''),targetId=meta.get('target_id') or options.get('targetId',''),sourceType=source,sourceReference=str(meta.get('source_reference') or options['sourceReference']),rightsType=str(meta.get('rights_type') or options['rightsType']),rightsEvidence=str(meta.get('rights_evidence') or options['rightsEvidence']),groupKey=str(meta.get('group_key') or meta.get('groupKey') or options['groupKey']),generatorTool=str(meta.get('generator_tool') or meta.get('generatorTool') or options.get('generatorTool','')),generatedAt=str(meta.get('generated_at') or meta.get('generatedAt') or options.get('generatedAt','')),prompt=str(meta.get('prompt') or options.get('prompt','')),sourceMetadata=meta)
            if not row['targetId']:
                requested=meta.get('target_id') or meta.get('target_slug') or meta.get('object_label')
                if requested:
                    found=next((t for t in targets.values() if t['categoryId']==row['categoryId'] and normalize(requested) in [normalize(t['id']),normalize(t['name']),normalize(t.get('slug',''))]),None)
                    if found:row['targetId']=found['id']
                    else:row['warnings'].append('Đối tượng metadata chưa khớp taxonomy; cần chọn lại.')
            if row['categoryId'] not in categories:row['errors'].append('category_id: thiếu hoặc không có trong taxonomy hiện tại.')
            if row['targetId'] and (row['targetId'] not in targets or targets[row['targetId']]['categoryId']!=row['categoryId']):row['errors'].append('target_id: không thuộc category_id hoặc không hoạt động.')
            if meta.get('sign_label') and meta['sign_label'] not in signs:row['errors'].append('sign_label: không có trong ontology bbox hiện tại.')
            row['missingInfo']=[]
            for key in ['sourceType','sourceReference','rightsType','rightsEvidence','groupKey']:
                if not row.get(key) or key in ['sourceReference','rightsEvidence','groupKey'] and len(row[key].strip())<3:row['missingInfo'].append(key)
            if source=='synthetic_ai':
                row['missingInfo'].extend(k for k in ['generatorTool','generatedAt'] if not row[k].strip())
            if source not in SOURCES:row['errors'].append('Loại nguồn ảnh không hỗ trợ.')
            if source=='synthetic_ai':
                try:
                    when=datetime.fromisoformat(row['generatedAt'].replace('Z','+00:00'))
                    if when.date()>datetime.now(timezone.utc).date():raise ValueError()
                except (ValueError,TypeError):row['errors'].append('Ảnh AI cần ngày tạo ISO hợp lệ, không ở tương lai.')
                if not row['generatorTool'].strip():row['errors'].append('Ảnh AI cần tên công cụ tạo.')
            if row['rightsType'] not in ['owned','licensed','permission']:row['errors'].append('Quyền sử dụng không hợp lệ.')
            if source in ['own_photo','licensed','permission'] and {'own_photo':'owned','licensed':'licensed','permission':'permission'}[source]!=row['rightsType']:row['errors'].append('Loại nguồn không khớp quyền sử dụng.')
            for k in ['sourceReference','rightsEvidence','groupKey']:
                if not 3<=len(row[k].strip())<=(200 if k=='groupKey' else 3000):row['errors'].append('Thông tin nguồn/quyền/nhóm thiếu hoặc quá dài.')
            if len(row['prompt'])>10000 or len(row['generatorTool'])>200:row['errors'].append('Prompt/công cụ quá dài.')
            row['mime']=MIMES[Path(name).suffix.lower()]
            try:
                path=assets/name
                if sha(path.read_bytes())!=data['assetHashes'][name]:raise Invalid('Checksum staging đã đổi.')
                rgb,normalized,pixel,phash,orientation=decode_image(path.read_bytes(),row['mime']);row.update(width=rgb.width,height=rgb.height,pixelSha256=pixel)
                references=[r for r in self.parent.reference_rows if r['sha256']==row['sha256'] or r['pixelSha256']==pixel or r.get('phash') and (int(r['phash'],16)^int(phash,16)).bit_count()<=6]
                if references:row['errors'].append('Trùng/gần trùng tập tham chiếu được bảo vệ.')
                dupe=next((r['id'] for r in self.parent.rows.values() if r['sha256']==row['sha256'] or r['pixelSha256']==pixel),None)
                if dupe:row['duplicateImageId']=dupe
                elif pixel in within:row['duplicateOf']=within[pixel]
                else:within[pixel]=row['id']
                candidates=[p for p in txts if Path(p).stem==Path(name).stem]
                preferred=str(PurePosixPath(name).with_suffix('.txt')).replace('images/','labels/',1)
                if preferred in candidates:candidates=[preferred]
                if len(candidates)>1:raise Invalid('Có nhiều file nhãn cùng tên; cần layout images/labels rõ ràng.')
                label_content=text(assets/candidates[0],100000) if candidates else ''
                row['sourceLabelPath']=candidates[0] if candidates else None
                if candidates and sha((assets/candidates[0]).read_bytes())!=data['assetHashes'][candidates[0]]:raise Invalid('Checksum nhãn staging đã đổi.')
                if not candidates:row['warnings'].append('Không có nhãn YOLO; không coi là ảnh bình thường.')
                if candidates and not label_content.strip():row['warnings'].append('Nhãn rỗng chưa xác minh ảnh âm.')
                geometries=set()
                for line in label_content.splitlines():
                    if not line.strip():continue
                    row['labelCount']+=1
                    try:
                        v=line.split()
                        if len(v)!=5 or not re.fullmatch(r'\d+',v[0]):raise Invalid('YOLO detection cần class x_center y_center width height (5 trường).')
                        klass=int(v[0]);x,y,w,h=map(float,v[1:]);xy=[x-w/2,y-h/2,x+w/2,y+h/2]
                        if not all(math.isfinite(t) and 0<=t<=1 for t in xy) or w*rgb.width<2 or h*rgb.height<2:raise Invalid('BBox vượt ảnh, NaN hoặc nhỏ hơn 2 pixel.')
                        geometry=(klass,tuple(round(n,8) for n in xy))
                        if geometry in geometries:raise Invalid('Nhãn bbox trùng class/vị trí trong cùng ảnh.')
                        geometries.add(geometry)
                        if orientation!=1:raise Invalid('Ảnh có EXIF xoay; cần chuẩn hóa ảnh/nhãn đồng bộ trước khi nhập bbox.')
                        if klass>=len(classes) or not classes[klass]['mapping']:raise Invalid('Class chưa có mapping; chọn rõ object/sign trước khi nhập.')
                        m=classes[klass]['mapping']
                        if m['kind']=='object' and targets[m['label']]['categoryId']!=row['categoryId']:raise Invalid('Class đối tượng không thuộc danh mục đã chọn.')
                        ref={'sourceIndex':len(row['sourceReferences']),'sourceClassId':klass,'sourceLabel':classes[klass]['name'],'sourceLabelVi':targets[m['label']]['name'] if m['kind']=='object' else signs[m['label']]['name'],'xyxy':xy,'scope':'direct_object_candidate' if m['kind']=='object' else 'direct_sign_candidate','candidateTargetId':m['label'] if m['kind']=='object' else None,'candidateSign':m['label'] if m['kind']=='sign' else None,'sourceClaim':None,'originalFormat':'bbox','originalCoordinates':[x,y,w,h]}
                        row['sourceReferences'].append(ref);row['validLabelCount']+=1
                    except (ValueError,Invalid) as err:row['errors'].append(str(err) or 'Nhãn YOLO không hợp lệ.')
                if data.get('packageVersion')==VERSION:
                    row['errors'].extend(row_errors(data['metadata'].get(name,{}),name,row['sha256'],categories,targets,signs,row['sourceLabelPath'],row['labelCount']))
                    for ref in row['sourceReferences']:
                        if ref.get('candidateTargetId') and ref['candidateTargetId']!=meta.get('target_id'):row['errors'].append('target_id: bbox đối tượng không khớp metadata.')
                        if ref.get('candidateSign') and ref['candidateSign']!=meta.get('sign_label'):row['errors'].append('sign_label: bbox dấu hiệu không khớp metadata.')
                if row['labelCount']>100:row['errors'].append('Tối đa 100 box/ảnh.')
            except (Invalid,OSError) as err:row['errors'].append(str(err))
            row['errors'].extend(k+': thiếu thông tin' for k in row['missingInfo'])
            row['status']='invalid' if row['errors'] else 'duplicate' if row.get('duplicateImageId') else 'ready'
            items.append(row)
        data.update(options=options,classes=classes,items=items,catalog=catalog,signs=signs)
        atomic(folder/'batch.json',data)
        return self.response(data)
    def commit(self,uid,folder,data,p):
        item=next((r for r in data['items'] if r['id']==p['itemId']),None)
        if not item:raise Invalid('Không có ảnh này trong lô.')
        if data.get('metadataComparison',{}).get('requiresSelection'):raise Invalid('CSV và JSONL khác nhau. Cần chọn nguồn metadata rồi kiểm tra lại.')
        previous=data['results'].get(item['id'])
        if previous and previous['status'] in ['imported','existing','duplicate']:return previous
        if item['status']=='invalid':result={'status':'failed','message':'; '.join(item['errors'])}
        else:
            try:
                asset=folder/'assets'/item['filename'];content=asset.read_bytes()
                if sha(content)!=item['sha256']:raise Invalid('Checksum ảnh staging đã đổi.')
                label_path=item.get('sourceLabelPath');label_content=text(folder/'assets'/label_path,100000) if label_path else ''
                if label_path and sha((folder/'assets'/label_path).read_bytes())!=data['assetHashes'][label_path]:raise Invalid('Checksum nhãn staging đã đổi.')
                payload={k:item[k] for k in ['categoryId','targetId','sourceType','sourceReference','rightsType','rightsEvidence','groupKey','generatorTool','generatedAt','prompt','sourceMetadata','sourceReferences']}
                payload.update(uploadId=str(uuid.uuid5(uuid.UUID(data['batchId']),item['id'])),filename=Path(item['filename']).name,mime=item['mime'],content=base64.b64encode(content).decode(),developmentOnly=True,catalog=p['catalog'],batchId=data['batchId'],metadataProvenance={**data.get('metadataComparison',{}),'files':data.get('metadataComparison',{}).get('files',[])},datasetName=data['options'].get('datasetName') or data['inputs'][0]['name'],sourceLabelContent=label_content,sourceYaml=data['yaml'])
                result=self.parent.imports.upload(uid,payload)
            except (Invalid,OSError) as err:result={'status':'failed','message':str(err)}
        data['results'][item['id']]=result;atomic(folder/'batch.json',data)
        return result
