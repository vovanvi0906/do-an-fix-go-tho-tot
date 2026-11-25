"""FixGo package v1 rules shared by staged import and the offline CLI."""
import csv
import io
import re
from pathlib import PurePosixPath
from review_core import Invalid

VERSION = 'fixgo.dataset.v1'
COLUMNS = ('filename','category_id','target_id','object_label','sign_label','source_type',
           'source_reference','rights_type','rights_evidence','rights_status','generator_tool',
           'generated_at','prompt','group_key','review_status','bbox_status','split','sha256')

def check_layout(assets, images, yaml_data, read_text):
    if yaml_data.get('fixgo_package_version') != VERSION:
        raise Invalid('data.yaml: fixgo_package_version phải là '+VERSION)
    if not (assets/'metadata.csv').is_file() or not (assets/'data.yaml').is_file():
        raise Invalid('Gói v1 cần metadata.csv và data.yaml ở gốc ZIP, không bọc thư mục ngoài.')
    if any(p.name.lower() in ['metadata.jsonl','metadata.csv'] and p != assets/'metadata.csv' for p in assets.rglob('*')):
        raise Invalid('Gói v1 chỉ dùng một nguồn metadata: metadata.csv ở gốc ZIP; bỏ JSONL/CSV khác.')
    if set(yaml_data)!={'fixgo_package_version','path','train','nc','names'}:
        raise Invalid('data.yaml v1 chỉ nhận fixgo_package_version,path,train,nc,names.')
    if type(yaml_data.get('nc')) is not int or not 1<=yaml_data['nc']<=200:raise Invalid('data.yaml: nc cần số nguyên 1–200.')
    if yaml_data.get('metadata') or any(k in yaml_data for k in COLUMNS):
        raise Invalid('Nguồn/quyền/nhãn từng ảnh chỉ khai trong metadata.csv, không khai metadata trong YAML.')
    if yaml_data.get('test') or yaml_data.get('val') or yaml_data.get('train') != 'images' or yaml_data.get('path') != '.':
        raise Invalid('data.yaml: path=".", train="images"; không khai val/test cho gói chờ review.')
    reader=csv.DictReader(io.StringIO(read_text(assets/'metadata.csv')))
    if reader.fieldnames != list(COLUMNS):
        raise Invalid('metadata.csv: header cần đúng thứ tự: '+','.join(COLUMNS))
    for name in images:
        if not name.startswith('images/') or len(PurePosixPath(name).parts)!=2:
            raise Invalid(name+': ảnh v1 cần đường dẫn images/<tên file>.')
    stems=[PurePosixPath(n).stem.casefold() for n in images]
    if len(stems)!=len(set(stems)):raise Invalid('images: stem tên ảnh phải duy nhất để đối chiếu YOLO.')
    expected={str(PurePosixPath(n).with_suffix('.txt')).replace('images/','labels/',1) for n in images}
    for p in (p for p in assets.rglob('*') if p.is_file() and p.suffix.lower()=='.txt'):
        name=str(p.relative_to(assets))
        if name not in expected and not name.startswith('evidence/') and not p.name.lower().startswith(('readme','license')):raise Invalid(name+': TXT nhãn cần labels/<stem>.txt và phải có ảnh tương ứng.')
    return VERSION

def row_errors(meta, name, digest, categories, targets, signs, label_path, label_count):
    errors=[]
    def fail(field, message):errors.append(field+': '+message)
    for key in COLUMNS:
        if key not in meta:fail(key,'thiếu cột/dòng metadata cho '+name)
    for key in COLUMNS:
        if key not in ['sign_label'] and not str(meta.get(key,'')).strip():fail(key,'thiếu giá trị')
    if meta.get('filename')!=name:fail('filename','phải là đường dẫn chính xác từ gốc ZIP')
    category=meta.get('category_id');target=targets.get(meta.get('target_id'))
    if category not in categories:fail('category_id','ID không hoạt động trong database')
    if not target or target['categoryId']!=category:fail('target_id','ID không thuộc category_id')
    elif meta.get('object_label')!=target.get('slug'):fail('object_label','phải bằng slug của target_id')
    if meta.get('sign_label') and meta['sign_label'] not in signs:fail('sign_label','không có trong ontology bbox')
    if meta.get('source_type')!='synthetic_ai':fail('source_type','gói AI v1 cần synthetic_ai')
    if meta.get('rights_status')!='declared_unverified':fail('rights_status','chỉ nhận declared_unverified; xác minh thực hiện trong FixGo')
    if meta.get('review_status')!='unreviewed':fail('review_status','chỉ nhận unreviewed')
    if meta.get('split')!='unassigned':fail('split','chỉ nhận unassigned; backend phân nhóm development')
    if not re.fullmatch('[0-9a-f]{64}',meta.get('sha256','')) or meta.get('sha256')!=digest:fail('sha256','không khớp byte ảnh trong ZIP')
    bbox=meta.get('bbox_status')
    if bbox not in ['not_annotated','proposed']:fail('bbox_status','cần not_annotated hoặc proposed')
    if bbox=='not_annotated' and label_path:fail('bbox_status','not_annotated phải bỏ file YOLO, kể cả file rỗng')
    if bbox=='proposed' and (not label_path or not label_count):fail('bbox_status','proposed cần file YOLO có bbox đề xuất')
    return errors
