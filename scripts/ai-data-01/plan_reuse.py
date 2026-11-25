#!/usr/bin/env python3
"""Normalize audit metadata and write review/pilot plans; never export training data."""
import argparse,collections,csv,hashlib,json,shutil
from pathlib import Path
from common import canonical,digest,read_asset,parse_yolo,choose_pilot
J=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':'))
REPO=Path(__file__).resolve().parents[2]

def writecsv(p,rows):
    with p.open('x',encoding='utf-8',newline='') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def table(head,rows):
    safe=lambda v:str(v).replace('|','/').replace('\n',' ')
    return '| '+' | '.join(head)+' |\n|'+'|'.join('---' for _ in head)+'|\n'+''.join('| '+' | '.join(safe(v) for v in row)+' |\n' for row in rows)

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--scan',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args();src=a.scan.resolve();out=a.output.resolve()
    if src==out or src.is_relative_to(out) or out.is_relative_to(src):raise SystemExit('Use a separate new output directory')
    expected=['README.md','image-inventory.csv','duplicate-groups.csv','dataset-leakage-report.md','object-coverage.csv','reusable-dataset-report.md','missing-data-report.md','pilot-dataset-plan.md']
    if any((out/n).exists() for n in expected):raise SystemExit('Refusing to overwrite a previous audit report')
    out.mkdir(parents=True,exist_ok=True);e=out/'evidence';e.mkdir(exist_ok=True)
    for p in (src/'evidence').iterdir():
        if p.is_file():
            dest=e/p.name
            if dest.exists():raise SystemExit('Existing evidence: '+str(dest))
            shutil.copyfile(p,dest)
    summary=json.loads((src/'evidence/summary.json').read_text());catalog=json.loads((e/'catalog.json').read_text());targets={t['id']:t for t in catalog['targets']};cats={c['id']:c for c in catalog['categories']};signs=json.loads((e/'ontology.json').read_text())['signs']
    with (src/'image-inventory.csv').open(newline='') as f:rows=list(csv.DictReader(f))
    # Existing saved annotation overlays are kept separate from immutable raw TXT.
    review_base=Path.home()/'Work/datasetai/06-benchmarks/ai01-admin-v1/reviews'
    latest={};upload_records={};journal_pins=[]
    for log,kind in [(review_base/'bbox-quality-v1/events.jsonl','bbox'),(review_base/'uploaded-dataset-v1/events.jsonl','upload')]:
        if not log.exists():continue
        journal_pins.append({'path':str(log),'sha256':digest(log.read_bytes())});head='0'*64
        for line in log.read_text().splitlines():
            event=json.loads(line)
            if event.get('previousHash')!=head or digest(canonical({k:v for k,v in event.items() if k!='eventHash'}).encode())!=event['eventHash']:raise ValueError('Existing journal chain mismatch')
            head=event['eventHash']
            if kind=='bbox' and event.get('kind')=='bbox_revision':latest[event['imageId']]=event
            elif kind=='upload':upload_records[event['id']]=event
    for r in rows:
        original_id=r['image_id'].removeprefix('upload-') if r['corpus']=='admin_upload' else r['image_id'];overlay=latest.get(original_id,{})
        r['existing_admin_review_status']=overlay.get('status','NO_SAVED_OVERLAY')
        r['existing_admin_boxes_json']=J(overlay.get('boxes',[]));r['existing_admin_overlay_sha_matches']=str(bool(overlay) and overlay.get('sha256')==r.get('sha256')).lower()
        r['existing_review_declares_rights_verified']=str(overlay.get('rightsVerified',False)).lower();r['existing_review_status_is_not_independent_gt']='true'
        if r['corpus']=='admin_upload' and original_id in upload_records:
            u=upload_records[original_id];label=review_base/'uploaded-dataset-v1'/u['labelFile'];payload=label.read_bytes();anns,issues=parse_yolo(payload.decode('utf-8-sig'),[],int(r['width']),int(r['height']))
            r.update(annotation_path=str(label),annotation_sha256=digest(payload),annotation_sha256_expected=u['annotationSha256'],annotation_sha256_matches=str(digest(payload)==u['annotationSha256']),annotations_json=J(anns),annotation_issues_json=J(issues),annotation_status='NEEDS_REVIEW' if issues else 'EMPTY_UNREVIEWED' if not anns else 'PARSED_SOURCE_UNVERIFIED')
    (e/'existing-review-journals.json').write_text(json.dumps({'journal_pins':journal_pins,'latest_bbox_image_records':len(latest),'scope':'Existing statuses/boxes copied as separate overlay; no identities, no automatic rights/GT approval'},ensure_ascii=False,indent=2)+'\n')
    # Exclude ambiguous source fault regions from automatic whole-object bbox reuse.
    for r in rows:
        anns=json.loads(r['annotations_json']);names={x['source_label'] for x in anns};risk='NOT_REVIEWED'
        if r['corpus']=='raw_source':
            if r['dataset']=='suanuoc' and names-{'faucet'}:risk='PLUMBING_FAULT_REGION_NOT_VERIFIED_WHOLE_OBJECT'
            elif r['dataset']=='lamvuon':risk='LEAF_REGION_NOT_VERIFIED_WHOLE_PLANT'
            elif r['dataset']=='giupviec':risk='SURFACE_SIGN_REGION_TARGET_CONTEXT_UNRESOLVED'
            elif len(json.loads(r['direct_object_candidate_ids_json']))==1:risk='DIRECT_SOURCE_OBJECT_CANDIDATE_EXTENT_UNVERIFIED'
        elif r['corpus']=='classification_fixture':risk='CLASSIFICATION_ONLY_NO_OBJECT_BBOX'
        r['object_scope_status']=risk
        whole_labels={('dienlanh','CASSETTE TYPE'):'may-lanh-dieu-hoa',('dienlanh','CELLING TYPE'):'may-lanh-dieu-hoa',('dienlanh','ROOM AIR'):'may-lanh-dieu-hoa',('suadien','OUTLET'):'o-cam-dien',('thietbigiadinh','refrigerator'):'tu-lanh-tu-lanh-side-by-side',('thietbigiadinh','washing_machine'):'may-giat-may-giat-say',('suanuoc','faucet'):'voi-nuoc-voi-sen'}
        box_candidates=[]
        if r['corpus']=='raw_source' and r['decode_status']=='OK':
            for index,ann in enumerate(anns):
                slug=whole_labels.get((r['dataset'],ann['source_label']))
                if slug:
                    xy=ann['coordinates']
                    if ann['format']=='bbox':
                        x,y,w,h=xy;box=[x-w/2,y-h/2,x+w/2,y+h/2];transform='SOURCE_BBOX_GEOMETRY'
                    else:box=[min(xy[::2]),min(xy[1::2]),max(xy[::2]),max(xy[1::2])];transform='ENCLOSING_BBOX_DERIVED_FROM_SOURCE_POLYGON_NOT_HUMAN_VERIFIED'
                    box_candidates.append({'source_annotation_index':index,'source_annotation_format':ann['format'],'candidate_enclosing_xyxy':box,'geometry_transform':transform,'target_id':next(t['id'] for t in targets.values() if t['slug']==slug),'target_slug':slug,'status':'SOURCE_OBJECT_REGION_CANDIDATE_NOT_VERIFIED'})
        r['object_box_reuse_candidates_json']=J(box_candidates)
        current=json.loads(r['proposed_task_buckets_json']);candidate=(r['decode_status']=='OK' and r['annotation_status']=='PARSED_SOURCE_UNVERIFIED' and json.loads(r['prepared_tasks_json']).get('object_detection',{}).get('included',False) and risk=='DIRECT_SOURCE_OBJECT_CANDIDATE_EXTENT_UNVERIFIED')
        if not candidate and 'Object Detection' in current:current.remove('Object Detection')
        if r['existing_admin_overlay_sha_matches']=='true' and json.loads(r['existing_admin_boxes_json']):
            overlay_boxes=json.loads(r['existing_admin_boxes_json'])
            if any(b['kind']=='object' for b in overlay_boxes):current.append('Object Detection')
            if any(b['kind']=='sign' for b in overlay_boxes):current.extend(['Defect Classification','Defect Detection'])
        current=sorted(set(current))
        r['practical_object_bbox_candidate']=str(candidate).lower();r['proposed_task_buckets_json']=J(current)
        r['reuse_blockers_json']=J(['SOURCE_AND_RIGHTS_UNVERIFIED','LABELS_NOT_INDEPENDENT_GT','GROUP_SOURCE_SCENE_NEEDS_REVIEW']+([risk] if risk not in ['DIRECT_SOURCE_OBJECT_CANDIDATE_EXTENT_UNVERIFIED'] else ['OBJECT_EXTENT_NEEDS_HUMAN_CHECK'])+(['GEOMETRY_NEEDS_REVIEW'] if r['annotation_status']=='NEEDS_GEOMETRY_REVIEW' else []))
    writecsv(out/'image-inventory.csv',rows);shutil.copyfile(src/'duplicate-groups.csv',out/'duplicate-groups.csv')
    coverage=[]
    for tid,t in sorted(targets.items(),key=lambda v:(cats[v[1]['categoryId']]['name'],v[1]['name'])):
        raw=[r for r in rows if r['corpus']=='raw_source' and tid in json.loads(r['candidate_target_ids_json'])];direct=[r for r in raw if tid in json.loads(r['direct_object_candidate_ids_json'])];practical=[r for r in raw if r['practical_object_bbox_candidate']=='true' and tid in json.loads(r['direct_object_candidate_ids_json'])]
        coverage.append(dict(category_id=t['categoryId'],category_name=cats[t['categoryId']]['name'],target_id=tid,target_slug=t['slug'],target_name=t['name'],raw_candidate_images=len(raw),raw_direct_mapping_candidate_images=len(direct),practical_object_bbox_candidate_images=len(practical),candidate_distinct_pixels=len({r['pixel_sha256'] for r in raw}),candidate_source_components=len({r['proposed_source_component'] for r in raw}),ambiguous_target_candidate_images=sum(len(json.loads(r['candidate_target_ids_json']))>1 for r in raw),source_sign_candidate_images=sum(bool(json.loads(r['sign_candidates_json'])) for r in raw),partial_source_object_box_images=sum(any(b['target_id']==tid for b in json.loads(r['object_box_reuse_candidates_json'])) for r in rows if r['corpus']=='raw_source'),existing_admin_overlay_images=sum(any(b.get('kind')=='object' and b.get('label')==tid for b in json.loads(r['existing_admin_boxes_json'])) for r in rows if r['existing_admin_overlay_sha_matches']=='true'),partial_source_object_boxes=sum(b['target_id']==tid for r in rows if r['corpus']=='raw_source' for b in json.loads(r['object_box_reuse_candidates_json'])),verified_reusable_images='NOT_ESTABLISHED',verified_normal_images='NOT_ASSESSED',verified_defect_images='NOT_ASSESSED',independent_test_released_images=0,related_services=sum(s['targetId']==tid for s in catalog['services']),gap='NO_MATCHING_SOURCE_TAG_IN_SCANNED_CANONICAL_CORPUS' if not raw else 'SOURCE_SCOPE_RIGHTS_LABEL_REVIEW_REQUIRED'))
    writecsv(out/'object-coverage.csv',coverage)
    raw=[r for r in rows if r['corpus']=='raw_source'];cls=[r for r in rows if r['corpus']=='classification_fixture'];ziprows=[r for r in rows if r['corpus']=='user_synthetic_zip'];allb=collections.Counter(k for r in rows for k in json.loads(r['proposed_task_buckets_json']));rawb=collections.Counter(k for r in raw for k in json.loads(r['proposed_task_buckets_json']));rawsign=collections.Counter(s for r in raw for s in json.loads(r['sign_candidates_json']));zip_sign={s:len({r['sha256'] for r in ziprows if s in json.loads(r['sign_candidates_json'])}) for s in signs}
    summary['task_buckets_before_semantic_policy']=summary['task_buckets'];summary['task_buckets']=dict(allb);summary['raw_task_buckets']=dict(rawb);summary['practical_bbox_target_count']=sum(r['practical_object_bbox_candidate_images']>0 for r in coverage);summary['practical_bbox_image_count']=sum(r['practical_object_bbox_candidate']=='true' for r in raw)
    prepared_leak={}
    for key in ['sha256','pixel_sha256','phash_component_id','proposed_source_component']:
        group=collections.defaultdict(set)
        for r in raw:
            if r.get(key):group[r[key]].add(r['prepared_development_split'])
        prepared_leak[key]=sum(len(v)>1 for v in group.values())
    summary['fresh_groups_cross_prepared_development_splits']=prepared_leak
    summary['partial_source_object_box_images']=sum(bool(json.loads(r['object_box_reuse_candidates_json'])) for r in raw)
    summary['partial_source_object_boxes']=sum(len(json.loads(r['object_box_reuse_candidates_json'])) for r in raw)
    # Dataset/source split is a scoped key; train from two distinct projects is not one split.
    bysource=[]
    for corpus in sorted({r['corpus'] for r in rows}):
        subset=[r for r in rows if r['corpus']==corpus]
        for dataset in sorted({r['dataset'] for r in subset}):
            rr=[r for r in subset if r['dataset']==dataset]
            for key in ['sha256','phash_component_id','proposed_source_component']:
                groups=collections.defaultdict(set)
                for r in rr:
                    if r.get(key):groups[r[key]].add(r['original_split'])
                bysource.append(dict(corpus=corpus,dataset=dataset,group_type=key,cross_original_split_groups=sum(len(v)>1 for v in groups.values())))
    writecsv(e/'leakage-by-source.csv',bysource)
    sources=collections.Counter(r['dataset'] for r in raw);no_tag=[r for r in coverage if not r['raw_candidate_images']]
    folders=list(csv.DictReader((e/'discovered-directories.csv').open()));reports=json.loads((e/'input-reports.json').read_text())
    def put(name,text):(out/name).write_text(text.strip()+'\n',encoding='utf-8')
    put('README.md',f'''# AI-DATA-01 — Audit và chuẩn hóa metadata dataset hiện có

Ngày25/11/2026. Đã đọc {len(reports)} báo cáo Markdown trong docs/ai-audit/ (gồm lịch sử); dùng báo cáo mới và đối chiếu ảnh/annotation thật thay cho tin số liệu cũ. Hash các báo cáo đầu vào: [input-reports.json](evidence/input-reports.json).

## Kết quả

- **21.437/21.437 ảnh nguồn** được kiểm kê từng dòng; thêm1.200 classification fixtures,40 ZIP entries thuộc hai bản gói20 ảnh và3 admin-upload records: **22.680 stored entries**, **22.090 SHA ảnh khác nhau**. Không cộng bản sao prepared/trial vào ảnh độc lập mới.
- Hash/decode và TXT annotation đọc lại trực tiếp. Raw0 lỗi decode,0 lệch SHA ảnh/label,0 lệch pixel hash/pHash so prepared; **148 TXT rỗng chưa được coi ảnh âm**,21.289 có annotation parse được. Quyền/nguồn và nhãn đều còn cần review.
- **288 exact SHA groups** (878 stored entries); **1.269 pHash connected candidate groups** (4.196 entries). Nhóm pHash không phải kết luận cùng ảnh; không xóa hay tự gộp GT.
- Classification xác nhận **210 exact groups xuyên split**, liên quan703 stored entries; đây là số nhóm/cá thể tham gia, không phải accuracy hoặc chỉ210 ảnh.
- **14/70 target có source candidate tags**, **{summary['practical_bbox_target_count']}/70 có bbox whole-object candidate sau policy bảo thủ**;56 target chưa có tag trong raw metadata đã quét. Không có nghĩa56 target chắc chắn không xuất hiện trong pixel của mọi thư mục.
- Pilot **50 ảnh để kiểm duyệt/regression development**, không phải independent test. **0 independent test images được phát hành**; chưa có quyền/GT/exposure clearance đầy đủ.

## Các file

- [image-inventory.csv](image-inventory.csv): một dòng/một stored image; đường dẫn, nguồn/license khai báo, kích thước/hash, nhãn/annotation gốc và candidate task/target/sign, exposure, nhóm và blocker.
- [duplicate-groups.csv](duplicate-groups.csv): một dòng/member/type; một ảnh có thể xuất hiện trong nhóm SHA, pixels và pHash, không cộng các dòng thành ảnh độc lập.
- [dataset-leakage-report.md](dataset-leakage-report.md): các split gốc, prepared và đề xuất group-aware.
- [object-coverage.csv](object-coverage.csv): đủ70target, tổng693dịch vụ, tách weak/direct mapping/whole-object candidates và verified.
- [reusable-dataset-report.md](reusable-dataset-report.md): vai trò dữ liệu, phạm vi tái sử dụng và điều kiện.
- [missing-data-report.md](missing-data-report.md):56target chưa có tag và10sign ontology theo bằng chứng hiện có.
- [pilot-dataset-plan.md](pilot-dataset-plan.md): queue50 và điều kiện test thật độc lập.

## Công cụ local

Scripts riêng tại [scripts/ai-data-01](../../scripts/ai-data-01/README.md), không thay production scripts. Dùng Python .venv hiện có (Pillow/OpenCV/NumPy/PyYAML), không tải model/dataset. Reviewer chạy:

```bash
ai-service/.venv/bin/python -B scripts/ai-data-01/review.py --inventory docs/ai-data-audit/image-inventory.csv --state /tmp/fixgo-ai-data-review --port 8766
```

Mở http://127.0.0.1:8766: lọc theo target/source/group, xem ảnh/annotation nguồn nét đứt, đánh dấu nhiều ảnh, vẽ bbox riêng từng ảnh. Chỉ lưu append-only proposals tại state riêng; không sửa ảnh/TXT, không tự xác minh quyền/groundtruth/independent test. Không nhập nhật ký này vào production như approved export. Dừng Ctrl+C.

## Phạm vi phát hiện dữ liệu

Tìm toàn bộ thư mục ảnh và manifest/annotation trong workspace và ~/Work/datasetai, bỏ dependency/build/cache/symlink. **{len(folders)} thư mục liên quan** ở [discovered-directories.csv](evidence/discovered-directories.csv). Prepared copies, train/val trial copies, screenshots, evidence và Face có inventory thư mục riêng, không tự làm ảnh incident độc lập. Hai ZIP cũ ở Downloads được đọc tại chỗ, không giải nén/sửa. Không quét toàn bộ ổ đĩa cá nhân hoặc tải cloud URLs; ảnh chỉ ở Cloudinary chưa có local không thể audit pixel trong lượt này.

Không thay DB/schema/app/model/raw; không train/download hàng loạt/commit/push. CSV này là ledger phân tích, không metadata.csv18cột import; không chạy model hoặc dùng dự đoán mới làm nhãn. Labels source luôn là ứng viên; việc technically parsed không đồng nghĩa đúng về ngữ nghĩa hay có quyền.
''')
    leak=summary['leakage']
    put('dataset-leakage-report.md',f'''# Duplicate và data leakage

## Phép kiểm mới

SHA-256 byte file, pixel SHA sau EXIF transpose/BGR, pHash63bit theo DCT32×32 top8×8 bỏ DC/median. BK-tree tìm **đúng toàn bộ giá trị pHash trong radius6**, không ANN; mỗi unique hash chỉ query một lần, các ảnh cùng hash được nối vào cùng nhóm. Audit ghi3.375 cạnh giữa các giá trị hash khác nhau; không được gọi số này là mọi cặp ảnh. [near-hash-edges.csv.gz](evidence/near-hash-edges.csv.gz) có representative IDs, Hamming pHash, dHash và RMSE thumbnail32×32 làm bằng chứng phụ, không score đồng nhất ngữ nghĩa.

Connected component có thể có hai thành viên cách nhau >6 qua chuỗi; pHash/cosine/thumbnail giống không chứng minh cùng thiết bị/cảnh. Không xóa/gán nhãn theo pHash. Black-and-white templates/background giống nhau có false positives; cần người xem. Ngưỡng6 là queue grouping, không được dùng như tiêu chí ảnh thực/giấy phép.

'''+table(['Kiểu nhóm','Số nhóm','Entries tham gia','Lớn nhất'],[[k,v['groups'],v['entries'],v['largest']] for k,v in summary['duplicates'].items()])+'''
Một ảnh trong nhiều group types, không cộng membership rows. CSV group conflict là dấu hiệu cần xem annotation khác nhau trên ảnh giống nhau, không tự sửa label.

## Leakage theo corpus và split gốc

'''+table(['Corpus','Exact cross split groups','pHash candidate cross split groups','Combined-source cross split groups'],[[c,v['sha256']['cross_original_split_groups'],v['phash_component']['cross_original_split_groups'],v['combined_source']['cross_original_split_groups']] for c,v in leak.items()])+f'''
Raw theo corpus có5 exact groups đi qua original splits; classification210 groups /703 entries exact. Số pHash cross-split thấp hơn số exact group có thể do nhiều exact groups được nối thành một near component, không phải ít ảnh leakage hơn. ZIP original split đều unassigned nên số cross-split0 không chứng minh độc lập. [leakage-by-source.csv](evidence/leakage-by-source.csv) tách thêm từng dataset; không đánh đồng train của hai nguồn khác nhau với cùng một test set.

## Prepared development split

So lại nhóm mới trên raw với prepared developmentSplit:

'''+table(['Khóa nhóm mới','Nhóm giao prepared train/val'],prepared_leak.items())+'''
Kết quả0 theo khóa/hash đã kiểm (nếu0 trong bảng) chỉ xác nhận metadata split/group nhất quán ở ngưỡng này; không xác minh physical device/session hoặc independent benchmark. Việc raw original test chuyển thành development không biến nó thành independent test.

## Exposure và chia tập đề xuất

Đọc selection.jsonl của cả hai object experiments và hash ảnh classification: `direct_experiment_exposure_json` ghi actual selected SHA và train/val role; `component_exposure_json` lan qua nhóm exact/pHash/source-family/priorgroup để tránh crop/biến thể của ảnh train lọt test. `prepared_ai_exposed_declaration=true` được giữ riêng: đó là tuyên bố nguồn, không giả là log inference từng ảnh. Các experiment không có log đầy đủ vẫn có exposure UNKNOWN, không mặc định safe.

`proposed_source_component` nối exact bytes, normalized pixels, near candidates, source family/nhóm prior. Nhóm filename/source-family là giả thuyết bảo thủ cần đối chiếu nguồn, không chứng nhận các cảnh độc lập. Chia mới giữ toàn component ở một tập, augmentation chỉ sau split. Nếu near edge false positive cần người duyệt bằng chứng rồi tạo revision mới, không âm thầm đổi group để đủ quota.

- Đã train hoặc biến thể cùng nhóm: legacy_model_train_exposed, giữ cho development/regression hoặc training sau gate; không làm independent test hiện tại.
- Đã validation/tuning: legacy_model_validation_exposed; không gọi blind test của model đã dùng nó.
- Chưa thấy selection log: quarantine_source_and_exposure_review; không phải test sạch. Còn cần nguồn, quyền, semantic labels và clearance exposure.
- Khi có dữ liệu mới/được xác minh chưa dùng: chốt group source/site/device/session trước; phân bổ development train/val theo group có stratification target/sign (ví dụ80/20 là lựa chọn cần duyệt, không tỷ lệ đã thực hiện). Test thật độc lập khóa riêng từ nguồn chưa train/tune/model-exposed, không lấy phần ngẫu nhiên raw cũ.

Không đổi train/val/test folders hoặc chuẩn bị training dataset mới trong audit. Large component có thể làm quota không đạt; phải bổ sung nguồn/cảnh thật sau review, không tách ngẫu nhiên ảnh trong nhóm. 0 independent test được cấp từ ledger này.
''')
    put('reusable-dataset-report.md',f'''# Khả năng tái sử dụng dataset

## Kiểm kê chuẩn hóa trên nguồn hiện có

21.437 raw,1.200 classification,40ZIPentries(20uniqueSHA) và3uploads; CSV có22.680dòng. Raw kiểm lại tất cả file SHA, dimensions, decoder, pixel/pHash và TXT. Source có cả bbox lẫn polygon; không gọi toàn bộ là bbox gốc. BBox/Polygon giữ raw normalized coordinates, không chuyển bbox vùng lỗi thành toàn thiết bị. Định dạng thống nhất JSON trong ô CSV giúp local reviewer sử dụng nhưng không ghi lại TXT/raw.

'''+table(['Nguồn raw','Ảnh','Source/license claim'],[[k,n,'Roboflow YAML khai CC BY4.0; UNVERIFIED rights/attribution'] for k,n in sorted(sources.items())])+f'''
Cả6source YAML đều khai CC BY4.0, nhưng chưa có xác minh hồ sơ quyền/attribution từng ảnh, contributor và điều kiện nguồn. Không báo license approved. `source_claim_json` giữ workspace/project/version/url và declaration; image-level captured date, generator/prompt và consent không được bịa.

Raw21.437 chưa xác định ảnh thực/synthetic theo bằng chứng cá thể; classification1.200 có evidence generator OpenCV và đặc trưng fixture nhưng không khẳng định full lineage một run cụ thể. ZIP20unique khai synthetic;3uploads khai own_photo chưa xác minh capture/rights. TXT nguồn empty.txt được kiểm riêng; một ảnh có latest admin review confirmed2boxes, rightsVerified=false. CSV giữ existing_admin_boxes_json/status và SHA match tách khỏi annotation gốc; không phủ nhận annotation đã lưu hoặc tự nâng nó thành independent GT. Không dùng tên file hoặc model để phân biệt real/synthetic.

## Vai trò ứng viên (có thể overlap)

'''+table(['Nhóm','Entries tất cả','Raw source','Ý nghĩa'],[[k,allb.get(k,0),rawb.get(k,0),{'Object Recognition':'candidate target/category, chưa GT','Object Detection':'whole-object bbox candidate sau semantic policy, chưa extent/rights verified','Defect Classification':'có tag sign nguồn trực tiếp, không suy lỗi vận hành','Defect Detection':'box/polygon vùng sign nguồn cần đối chiếu pixel/target','Normal/Negative':'chưa có ảnh được xác minh quan sát âm; không dùng TXT rỗng','Out-of-scope':'claim/static mapping/layout candidate, cần người xem','Unknown/Needs Review':'mọi source còn thiếu rights/semantic review','Duplicate':'phash/exact candidate membership; không tự xóa','Unusable':'decoder/policy lỗi kỹ thuật được ghi rõ'}[k]] for k in ['Object Recognition','Object Detection','Defect Classification','Defect Detection','Normal/Negative','Out-of-scope','Unknown/Needs Review','Duplicate','Unusable']])+f'''
**{summary['practical_bbox_image_count']} raw whole-object region candidate images (bbox hoặc polygon)** sau policy, trải trên{summary['practical_bbox_target_count']}target; chưa phải số verified training-eligible. Prepared từng đánh ObjectDetection13.086 nguồn, nhưng vùng lỗi plumbing non-faucet bị giữ review trong audit mới thay vì tự dùng làm bbox cả vòi/chậu/ống/bồn cầu. `prepared_tasks_json` giữ quyết định cũ để đối chiếu, `practical_object_bbox_candidate` ghi policy audit mới.

Ngoài full-image policy, có **{summary['partial_source_object_box_images']} ảnh với {summary['partial_source_object_boxes']} vùng nguồn riêng lẻ có thể cứu để người kiểm xem**. Cột object_box_reuse_candidates_json ghi đúng source_annotation_index và target ứng viên cho OUTLET, AC subtype, refrigerator, washing_machine hoặc faucet. Ảnh có cả faucet và leaking_pipe không bị bỏ toàn ảnh: giữ vùng faucet như candidate riêng; vùng leaking_pipe không tự trở thành cả ống. Nếu nguồn là polygon, candidate_enclosing_xyxy chỉ là min/max từ tọa độ polygon đã có, ghi geometry_transform rõ ràng; không bịa tọa độ hoặc sửa polygon gốc, không coi là bbox đã được người kiểm xác nhận. Không tự xuất tập object-only bỏ qua vật thể khác chưa xem hoặc tính negative từ các nhãn không lấy.

Leaf annotations không là bbox toàn cây; Dirt/Birdpoop/Leaf trên bề mặt chưa chốt target inverter/panel hay sàn. Caption/source class disease không đủ xác nhận nguyên nhân hay bệnh. Ngoại hình thiết bị không chứng minh lỗi chức năng. 148emptyTXT không tự là normal.

## Điều kiện trước tái sử dụng

1. Kiểm nguồn/quyền/attribution thật và ghi bằng chứng; không xác nhận theo YAML hoặc dự đoán AI.
2. Người xem pixel chốt target/extent, sign quan sát được, normal/OOS; sửa label ở proposal/copy mới, giữ source immutable.
3. Review exact/near/conflicting labels/source-family groups; không xóa ảnh để giải quyết leakage.
4. Kiểm actual training/tuning exposure; giữ development và independent test riêng. Không phát hành test từ nhóm model đã dùng.
5. Muốn vào training vẫn qua FixGo review/export gates hiện hành, đúng audit/hash/revision/owner; local proposals không thay gate. Synthetic không vào real benchmark/test.

## Phạm vi tìm kiếm và các bản sao

Đã tìm{len(folders)}data-related directories trong repo và ~/Work/datasetai; ledger thư mục ghi số ảnh/annotation/manifests. Prepared/trial/benchmark copies và training plots không làm tăng số source độc lập. Screenshots/UI assets không tự thành dữ liệu gán nhãn; Face/PAD giữ riêng, không duyệt danh tính hoặc dùng ảnh mặt làm incident training. Hai ZIP đọc tại chỗ từ Downloads, không rewrite archive. Cloud-only assets không tải hàng loạt.

Không tìm thấy cơ sở để ghi một con số “đã verified usable/normal/defect” toàn kho; các cột đó NOT_ASSESSED/NOT_ESTABLISHED. Con số candidate không được dùng thay cho chất lượng hoặc quyền. Catalog snapshot6categories/70targets/693services giữ riêng ở evidence.
''')
    missingtable=table(['Category','Target','Slug','Raw candidate tags','Whole-object bbox candidates'],[[r['category_name'],r['target_name'],r['target_slug'],r['raw_candidate_images'],r['practical_object_bbox_candidate_images']] for r in coverage])
    signtable=table(['Code sign hiện hành','Raw tag candidate images','ZIP unique candidate SHA','Existing admin overlay images','Nhãn/bbox đã verified'],[[s,rawsign[s],zip_sign[s],sum(any(b.get('kind')=='sign' and b.get('label')==s for b in json.loads(r['existing_admin_boxes_json'])) for r in rows if r['existing_admin_overlay_sha_matches']=='true'),'NOT_ASSESSED;0 released by this task'] for s in signs])
    put('missing-data-report.md',f'''# Dữ liệu còn thiếu theo catalog và ontology

## Cách hiểu “thiếu”

Đã đối chiếu **70target,693service**. **14target có source candidate**,56target không có matching target tag trong canonical raw đã quét; không khẳng định chúng không xuất hiện ở pixel của source image, screenshot hoặc nguồn chưa có local. Chỉ{summary['practical_bbox_target_count']}target có ứng viên bbox vật thể sau policy; tất cả còn cần review/rights. Không thể trừ candidate khỏi quota rồi gọi phần còn lại là số ảnh cần thu chính xác.

{missingtable}
## Dấu hiệu quan sát

{signtable}
Bird_droppings/surface_soiling/leaf_debris là tag source vùng bề mặt, không xác minh target hoặc dấu hiệu bằng mắt trong task. Burn_mark của20SHA ZIP chỉ là nhãn ChatGPT đề xuất, chưa bbox/rights/prompt hợp chuẩn. Một admin upload có saved overlay confirmed2boxes khớp SHA, nhưng quyền trong review còn rightsVerified=false; nó là nguồn cần hoàn thiện, không phải independent GT được audit cấp. RawOUTLET11.204 có thể gồm bình thường/lỗi chưa gán; **0tag burn_mark không nghĩa0ảnh thật có vết xém**. Cần người xem kho ổ cắm trước khi yêu cầu tạo thêm ảnh.

Chưa có confirmed normal/negative benchmark. EmptyTXT148, ảnh không thấy rõ hoặc không có class không được dùng như negative tự động. Source category fixture không mô tả defect GT.

## Ontology/modality gaps

Theo ontology hiện tại chưa có code bbox riêng cho exposed_conductor/exposed_wire, corrosion/rust, deformation, standing water, frost, error-code OCR hay bệnh cây. Không tự thêm YAML hoặc thay bằng class gần nghĩa. Mất điện, dòng rò, quá tải, nhiệt độ, áp lực, mùi, âm thanh và root cause cần questionnaire/đo/thợ kiểm, không “thiếu ảnh là sinh ảnh lỗi vô hình”.

## Thứ tự bổ sung sau review

1. Rà10ảnh/target của pilot50, ưu tiên ổ cắm; chốt target extent và nhãn bình thường/xém/nứt thực sự. Tái sử dụng source có quyền/GT trước.
2. Rà source signs bề mặt với context phù hợp, xử lý leaf/fault-region scope. Không gọi class source là object luôn đúng.
3. Rà56target không có tag, phân biệt thiết bị cụ thể và phạm vi hệ thống/khu vực; chỉ đặt quota mới sau biết số verified unique groups.
4. Bổ sung **test thật độc lập** và normal/hard-negative sau clearance; hiện0 test được phát hành. Không lấy ảnh train hoặc synthetic để đủ test.
5. Quyền/ngày/nguồn/prompt/ảnh thực-synthetic chưa có căn cứ phải để UNKNOWN, không điền thay để qua import/export.

Không phát sinh yêu cầu thu/sinh13.340ảnh tự động từ kế hoạch cũ; đây là báo cáo gap metadata và review, không chứng minh tổng ảnh tối ưu để đạt accuracy.
''')
    pilot=choose_pilot(rows,targets);writecsv(e/'pilot-review-queue-current.csv',pilot);(e/'pilot-review-queue-current.csv').replace(e/'pilot-review-queue.csv');pilotcounts=collections.Counter(r['target_slug'] for r in pilot)
    put('pilot-dataset-plan.md',f'''# Pilot tận dụng ảnh sẵn có

## Pilot A — development review/regression, KHÔNG independent test

Đề xuất **{len(pilot)} entry** từ source đang có,10mỗi target của strict-v2 detector. [pilot-review-queue.csv](evidence/pilot-review-queue.csv) ghi từng ID/path/target/group/exposure; không copy/sửa ảnh. Ưu tiên preparedval để rà performance của tập development đã biết, **không gọi val đó test độc lập**. Mỗi target chọn10component khác nhau; component là conservative grouping, chưa chứng minh10thiết bị độc lập.

'''+table(['Target','Số entry đề xuất'],sorted(pilotcounts.items()))+'''
Queue không chứa GT đã xác minh: người xem phải đối chiếu nguồn/quyền, target/extent, normal/sign/OOS, xóa nhãn proposal sai bằng revision mới trong state riêng. Không báo accuracy/mAP từ source label hoặc kết quả model. Bản thân ảnh đã được training/tuning/AI exposure khai báo hoặc quan hệ nhóm chưa giải quyết nên independent_test_eligible=false.

Sau review đủ quyền/labels có thể dùng so sánh **development-only** CLIP/YOLO classifier/checkpoint hiện có, ghi rõ model/hash/version và giới hạn. Lượt này không chạy model hoặc metrics.

## Pilot B — independent evaluation, hiện BLOCKED

Không chọn ảnh train/val hoặc biến thể/cùngsource group vào independent test. Chỉ mở sau có nguồn thật được phép dùng, history chứng minh chưa train/tune, không near/source link tới development và nhãn được người kiểm độc lập. Nguồn chưa thấy trong selection log không tự đủ điều kiện. Không dùng hai ZIPsynthetic làm test thực tế.

Cỡ ban đầu đề xuất để lập nguồn lực:5target×(50ảnh đối tượng+25normal/hard-negative) +50OOS dùng chung =425ảnh thật nếu disjoint. Đây là quota kế hoạch, không425ảnh hiện có hay bảo đảm statistical power; có thể bắt đầu batch nhỏ rồi tăng theo CI/domain coverage. Dataset review cần ít nhất groups thiết bị/phiên/địa điểm thật, không nhóm giả từ filename. Sign evaluation đòi bbox và real negatives riêng; mẫu có thể overlap object set sau gán nhãn, không cộng thànhảnhunique giả.

## Protocol trước evaluation

- Khóa group/source/split và model/prompt/threshold trước mở holdout.
- Nhãn category/target/sign/unknown, evidence/rights/reviewer; service đáp án chuyên gia dựa symptoms/context chứ không pixels đơn.
- Đo precision/recall/mAP chỉ với bboxGT hợp lệ; classification macroF1 và OOS FAR/FRR, tách model unavailable khỏi unknown.
- Không chọn target/service từ model rồi dùng làm GT; không lấy việc API thành công là đúng semantic.
- Local review export vẫn proposals, không là approved production dataset hoặc chứng nhận independent review.

Dừng tại kế hoạch/kiểm kê. Không train, không inference mới, không deploy, không sửa application/DB/raw/weights hoặc commit/push.
''')
    # Rehash every selected image after normalization to validate actual source integrity, including ZIP entries.
    changed=[]
    for r in rows:
        if r.get('sha256') and digest(read_asset(r['path']))!=r['sha256']:changed.append(r['image_id'])
    if any(digest(Path(p['path']).read_bytes())!=p['sha256'] for p in journal_pins):raise RuntimeError('Existing review journal changed during snapshot; retry in new output')
    if changed:raise RuntimeError('Sources changed during audit: '+J(changed[:20]))
    (e/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    (e/'normalization-validation.json').write_text(json.dumps({'selected_entries':len(rows),'raw_entries':len(raw),'raw_ids_unique':len({r['image_id'] for r in raw}),'all_image_hashes_rechecked_after':True,'source_images_changed':changed,'ground_truth_approved':False,'independent_test_released':0,'normalization_policy':'Conservative metadata only, no source geometry rewrite','practical_object_bbox_candidates':summary['practical_bbox_image_count']},ensure_ascii=False,indent=2)+'\n')
    assert len(raw)==21437 and len({r['image_id'] for r in raw})==21437 and len(coverage)==70 and sum(r['related_services'] for r in coverage)==693
    print(J({'entries':len(rows),'raw':len(raw),'whole_object_bbox_candidate_images':summary['practical_bbox_image_count'],'whole_object_bbox_candidate_targets':summary['practical_bbox_target_count'],'independent_test_released':0,'source_hashes_unchanged':True}))

if __name__=='__main__':main()
