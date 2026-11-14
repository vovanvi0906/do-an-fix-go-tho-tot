"""Generate review-only documents from a read-only catalog snapshot; never connects to DB."""
import csv, hashlib, json, re, sys, unicodedata, uuid
from pathlib import Path
source = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
data = json.loads(source.read_text())
cats = {c['id']: c for c in data['categories']}
targets = {t['id']: t for t in data['targets']}
issues = []
for t in targets.values():
    if t['categoryId'] not in cats: issues.append(('TARGET_CATEGORY_MISSING', t['id']))
    for field in ['name', 'slug', 'description']:
        if not t.get(field): issues.append(('TARGET_MISSING_' + field.upper(), t['id']))
for s in data['services']:
    t = targets.get(s.get('targetId'))
    if not s.get('targetId'): issues.append(('SERVICE_WITHOUT_TARGET', s['id']))
    elif not t: issues.append(('SERVICE_TARGET_MISSING', s['id']))
    elif t['categoryId'] != s['categoryId']: issues.append(('CATEGORY_TARGET_MISMATCH', s['id']))
    if not s['isActive']: issues.append(('SERVICE_INACTIVE', s['id']))
    for field in ['name', 'slug', 'description', 'unit', 'basePrice']:
        if s.get(field) is None or s.get(field) == '': issues.append(('SERVICE_MISSING_' + field.upper(), s['id']))
    if s.get('basePrice') is not None and float(s['basePrice']) < 0: issues.append(('NEGATIVE_PRICE', s['id']))
    if s.get('maxPrice') is not None and float(s['maxPrice']) < float(s['basePrice']): issues.append(('INVALID_PRICE_RANGE', s['id']))
    if t and not t['isActive']: issues.append(('SERVICE_TARGET_INACTIVE', s['id']))
    if s['categoryId'] in cats and not cats[s['categoryId']]['isActive']: issues.append(('SERVICE_CATEGORY_INACTIVE', s['id']))
symptoms, mappings = [], []
for s in data['services']:
    t = targets.get(s.get('targetId'))
    if not t or t['categoryId'] != s['categoryId']: continue
    raw = s['name'].strip()
    text = re.sub(r'^(sửa chữa|sửa|xử lý|khắc phục)\s+', '', raw, flags=re.I)
    is_failure = bool(re.search(r'không |yếu|hỏng|rò|rỉ|tắc|nghẹt|chảy nước|đóng tuyết|kêu|rung|nứt|vỡ|báo lỗi|mất |chập|cháy', text, re.I))
    internal = bool(re.search(r'cảm biến|máy nén|bo mạch|bảng mạch|tụ điện|block|môi chất|xả đá|động cơ|van điện|gas', text, re.I))
    kind = 'REQUIRES_TECHNICIAN_CHECK' if internal else 'USER_REPORTED'
    if is_failure and not internal and re.search(r'đóng tuyết|rò nước|chảy nước|nứt|vỡ', text, re.I): kind = 'VISUAL_OBSERVABLE'
    name = text[0].upper() + text[1:] if is_failure and not internal else 'Cần ' + raw[0].lower() + raw[1:]
    slug = s.get('slug') or re.sub('[^a-z0-9]+', '-', unicodedata.normalize('NFKD', raw.replace('đ','d')).encode('ascii','ignore').decode().lower())
    code = ('request_' if not is_failure or internal else 'symptom_') + slug.replace('-', '_')[:62]
    symptom_id = str(uuid.uuid5(uuid.NAMESPACE_URL, 'fixgo:symptom-proposal:' + t['id'] + ':' + s['id']))
    warning = 'INFERRED_FROM_SERVICE_NAME;VERIFY_SCOPE_AND_LABEL'
    if internal: warning += ';TECHNICIAN_CHECK_NOT_VISUAL_DIAGNOSIS'
    if not is_failure: warning += ';SCOPE_REQUEST_NOT_FAILURE_SYMPTOM'
    if not s['isActive'] or not t['isActive'] or not cats[t['categoryId']]['isActive']: warning += ';INACTIVE_CATALOG'
    symptoms.append(dict(symptom_id=symptom_id, code=code, name=name, aliases=json.dumps([raw, t['name']], ensure_ascii=False), kind=kind, target_id=t['id'], target_name=t['name'], category_id=t['categoryId'], description=s.get('description') or '', is_active='false', sort_order=0, review_status='NEEDS_REVIEW', review_notes=warning))
    mappings.append(dict(symptom_id=symptom_id, service_id=s['id'], service_name=raw, target_id=t['id'], priority=0, is_active='false', review_status='NEEDS_REVIEW', reason='Đề xuất từ phạm vi dịch vụ; cần người quản trị xác nhận', review_notes=warning))
for filename, rows in [('symptoms.csv', symptoms), ('symptom-service-mappings.csv', mappings)]:
    with (out/filename).open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else [], lineterminator="\n")
        writer.writeheader(); writer.writerows(rows)
counts = {}
for code, _ in issues: counts[code] = counts.get(code, 0) + 1
lines = ['# Catalog audit — read-only', '', f"Snapshot UTC: {data['capturedAt']}. SHA256 input: `{hashlib.sha256(source.read_bytes()).hexdigest()}`.", '', 'Truy vấn cả active/inactive trong một transaction `SET TRANSACTION READ ONLY`. Không sửa/seed/import DB.', '', f"Tổng: **{len(cats)} danh mục, {len(targets)} đối tượng, {len(data['services'])} dịch vụ**.", '', '## Kết quả kiểm tra', '', '| Loại | Số lượng |', '|---|---:|']
for key in ['SERVICE_WITHOUT_TARGET','SERVICE_TARGET_MISSING','CATEGORY_TARGET_MISMATCH','SERVICE_INACTIVE','NEGATIVE_PRICE','INVALID_PRICE_RANGE'] + sorted(set(counts)-{'SERVICE_WITHOUT_TARGET','SERVICE_TARGET_MISSING','CATEGORY_TARGET_MISMATCH','SERVICE_INACTIVE','NEGATIVE_PRICE','INVALID_PRICE_RANGE'}): lines.append(f'| {key} | {counts.get(key,0)} |')
optional = {'service.maxPrice': sum(s.get('maxPrice') is None for s in data['services']), 'service.estimatedDurationMin': sum(s.get('estimatedDurationMin') is None for s in data['services']), 'target.aiPrompts_empty': sum(not t.get('aiPrompts') for t in targets.values()), 'category.description': sum(not c.get('description') for c in cats.values()), 'target.inactive': sum(not t['isActive'] for t in targets.values()), 'category.inactive': sum(not c['isActive'] for c in cats.values())}
lines += ['', '### Trường tùy chọn/trạng thái bổ sung', '', '| Trường hoặc trạng thái | Số bản ghi trống/inactive |', '|---|---:|'] + [f'| {key} | {value} |' for key,value in optional.items()]
lines += ['', 'maxPrice null là giá trên chưa xác định, không tự coi là dữ liệu sai. Không có Symptom table trong audit nguồn ban đầu; bộ đề xuất chỉ nằm trong CSV.', '', '## Toàn bộ danh mục và đối tượng', '', '| Category (ID) | Target (ID) | Active | Services active / tổng |', '|---|---|---|---:|']
for c in cats.values():
    for t in [t for t in targets.values() if t['categoryId']==c['id']]:
        services=[s for s in data['services'] if s.get('targetId')==t['id']]
        lines.append(f"| {c['name']} `{c['id']}` | {t['name']} `{t['id']}` | {t['isActive']} | {sum(s['isActive'] for s in services)} / {len(services)} |")
lines += ['', '## Chi tiết bản ghi cần xử lý', '', '| Loại | Record ID |', '|---|---|'] + [f'| {code} | `{rid}` |' for code,rid in issues]
(out/'catalog-audit.md').write_text('\n'.join(lines)+'\n')
lines=['# Đề xuất triệu chứng — chưa import', '', f"Nguồn: snapshot catalog {data['capturedAt']}; {len(symptoms)} symptom candidates và {len(mappings)} mapping candidates.", '', '**Tất cả NEEDS_REVIEW, is_active=false**. Đây là tài liệu biên tập từ tên/mô tả/phạm vi dịch vụ, không phải dữ liệu đã duyệt hoặc nhãn AI. Không import tự động. Một candidate mỗi dịch vụ giúp trace service ID; reviewer cần gộp alias/trùng triệu chứng và tách yêu cầu bảo dưỡng/lắp đặt khỏi sự cố trước phê duyệt.', '', 'Code ổn định theo slug dịch vụ, ID đề xuất UUIDv5 theo target/service. Mapping chỉ trỏ ID đã có; service không target hoặc mismatch được đưa vào audit, không tự đoán target.', '', '`VISUAL_OBSERVABLE` chỉ là dấu hiệu có thể quan sát bởi người dùng; không xác nhận model nhìn được. `USER_REPORTED` cần người dùng mô tả. `REQUIRES_TECHNICIAN_CHECK` không được khẳng định từ ảnh; tên yêu cầu dùng “Cần …” để tránh gọi nguyên nhân hỏng là dấu hiệu quan sát.', '', '## Quy trình duyệt', '', '1. Chủ catalog kiểm phạm vi công việc, tên/alias, kind, gộp candidate cùng dấu hiệu và loại scope request không phù hợp.', '2. Duyệt từng liên kết dịch vụ, priority và active; loại candidate từ service inactive. Không tự APPROVED chỉ vì trùng tên.', '3. Kiểm tra CSV bằng disposable import riêng sau review; không có lệnh import DB thật trong nhiệm vụ này.', '4. Review migration, backup/restore và feature flag trước triển khai thật. Public API chỉ đọc active + APPROVED cho cả symptom và mapping.', '', '## Danh sách theo từng đối tượng', '']
for t in targets.values():
    lines += [f"### {t['name']} — `{t['id']}`", '', '| Code / triệu chứng đề xuất | Kind | Service ID | Review |', '|---|---|---|---|']
    pairs=[(s,m) for s,m in zip(symptoms,mappings) if s['target_id']==t['id']]
    if not pairs: lines.append('| Chưa có dịch vụ hợp lệ để đề xuất | — | — | NEEDS_REVIEW |')
    for s,m in pairs: lines.append(f"| `{s['code']}` — {s['name'].replace('|','/')} | {s['kind']} | `{m['service_id']}` | NEEDS_REVIEW |")
    lines.append('')
(out/'symptoms-proposal.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'categories':len(cats),'targets':len(targets),'services':len(data['services']),'symptomProposals':len(symptoms),'mappingProposals':len(mappings),'issues':counts},ensure_ascii=False))
