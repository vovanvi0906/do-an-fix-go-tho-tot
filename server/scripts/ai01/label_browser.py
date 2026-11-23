"""Read-only, paginated label workspace; no dataset or annotation mutations."""
import json
import time
import uuid
from collections import Counter
from review_core import Invalid

STATUS = {'pending': 'Chưa kiểm tra', 'confirmed': 'Đã xác nhận', 'corrected': 'Đã sửa', 'uncertain': 'Chưa chắc chắn', 'rejected': 'Đã loại'}
LABELS = {
 'labelType': {'object': 'Nhãn đối tượng', 'sign': 'Nhãn dấu hiệu', 'both': 'Cả hai'},
 'quality': {'ambiguous': 'Mơ hồ — đã đánh dấu / mapping cần ngữ cảnh', 'missing': 'Thiếu nhãn nguồn', 'bbox': 'Cần sửa bbox'},
 'bbox': {'has': 'Có bbox', 'none': 'Không có bbox', 'suspect': 'Bbox nghi sai — hàng đợi chưa hoàn tất', 'corrected': 'Bbox đã sửa và xác nhận'},
 'imageType': {'advertisement': 'Nghi quảng cáo / đã đánh dấu quảng cáo', 'composite': 'Nghi ảnh ghép / đã đánh dấu ảnh ghép', 'out_of_scope': 'Ngoài phạm vi — nhãn nguồn hoặc Admin'},
 'duplicate': {'none': 'Không phát hiện trùng', 'exact': 'Trùng chính xác (pixel)', 'near': 'Gần trùng (ứng viên)', 'source_group': 'Cùng nhóm nguồn (ứng viên)'},
 'queue': {'task04b': 'TASK 04B', 'prepared': 'Ảnh cần chuẩn hóa', 'unprocessed': 'Ảnh chưa xử lý'},
 'usage': {'needs_check': 'Cần kiểm tra điều kiện sử dụng', 'quarantine': 'Quarantine', 'eligible': 'Đủ điều kiện xuất SOLO (cần kiểm hash khi xuất)'},
 'quick': {'pending': 'Chưa kiểm tra', 'needs_fix': 'Cần sửa', 'priority': 'Ưu tiên (P0/P1)', 'completed': 'Đã hoàn thành kiểm tra nhãn'},
}
SIGN_NAMES = {'water_drip':'Nước nhỏ giọt','water_spray':'Nước phun/rò nhìn thấy','wet_surface':'Bề mặt ướt','stain_or_discoloration':'Vết ố/đổi màu','crack':'Vết nứt','broken_part':'Chi tiết gãy/vỡ','surface_soiling':'Bụi/bẩn','bird_droppings':'Vết giống phân chim','leaf_debris':'Lá/rác bám','leaf_spots_or_damage':'Đốm/tổn thương lá','burn_mark':'Vết cháy','exposed_wire':'Dây điện hở','other_visible_sign':'Dấu hiệu khác','standing_water':'Nước đọng / ứ nước'}

class LabelBrowser:
    def __init__(self, parent):
        self.parent = parent
        self.sessions = {}
        self.cache_key = None
        self.records = []

    def records_for(self, uid, catalog):
        f = self.parent
        f.quality.check_audit()
        prep = f.prepared.load()
        pack = f.quality.load()
        key = (uid, f.head, f.quality.head, f.prepared.signature, f.quality.signature, json.dumps(catalog, sort_keys=True))
        if key == self.cache_key:
            return self.records
        targets = {t['id']: t for t in catalog['targets']}
        mapping = {(m['dataset'], m['classId']): m for m in f.mapping['entries']}
        families = Counter(r.get('sourceFamilyCandidate') for r in (pack or {}).get('rows', {}).values() if r.get('sourceFamilyCandidate'))
        records = []
        for raw in f.rows.values():
            image_id = raw['id']
            event, box_event = f.latest.get(image_id), f.quality.latest.get(image_id)
            source = [mapping[(raw['dataset'], c)] for c in raw['classIds'] if (raw['dataset'], c) in mapping]
            quality = f.quality.queue_info(image_id, pack)
            preparation = prep['reviewIndex'].get(image_id)
            reasons = (preparation or {}).get('reasons', [])
            working = (pack or {}).get('rows', {}).get(image_id, {})
            target_ids = event.get('targetIds', []) if event else sorted({t['targetId'] for m in source for t in m['catalogTargetCandidates']})
            # Bbox and image labels are separate journals: preserve and expose both.
            target_ids = sorted(set(target_ids) | {b['label'] for b in (box_event or {}).get('boxes', []) if b['kind'] == 'object'})
            sign_ids = set((event or {}).get('visibleSigns') or [])
            sign_ids.update(b['label'] for b in (box_event or {}).get('boxes', []) if b['kind'] == 'sign')
            sign_names = dict(SIGN_NAMES)
            sign_names.update({k: v['name'] for k, v in (pack or {}).get('signs', {}).items()})
            source_signs = {p for m in source for p in m.get('visibleSignProposals') or []}
            flags = set((event or {}).get('imageFlags') or [])
            image_types = set()
            if 'advertisement' in flags or any(r.startswith('advertisement_') for r in reasons): image_types.add('advertisement')
            if 'composite' in flags or 'composite_layout_candidate' in reasons: image_types.add('composite')
            if (event or {}).get('decision') == 'out_of_scope' or 'out_of_scope_candidate' in reasons: image_types.add('out_of_scope')
            boxes = (box_event or {}).get('boxes', [])
            has_bbox = any(a['format'] == 'bbox' for a in raw['annotations']) or bool(boxes)
            bbox_states = {'has' if has_bbox else 'none'}
            if quality and quality['pending'] and quality.get('needsGeometryReview'): bbox_states.add('suspect')
            if box_event and box_event['status'] == 'confirmed': bbox_states.add('corrected')
            priority = (quality or {}).get('priority', (preparation or {}).get('priority'))
            duplicates = f.duplicates.get(str(raw['index']), {})
            duplicate_types = set()
            if f.counts[raw['pixelSha256']] > 1: duplicate_types.add('exact')
            if duplicates.get('nearDegree', 0) > 0: duplicate_types.add('near')
            if families.get(working.get('sourceFamilyCandidate'), 0) > 1: duplicate_types.add('source_group')
            if not duplicate_types: duplicate_types.add('none')
            decision = (event or {}).get('decision', 'pending')
            state = 'corrected' if decision == 'confirmed' and event.get('reviewAction') == 'correct' else decision
            if box_event and (not event or box_event['timestamp'] > event['timestamp']):
                if box_event['status'] in ['confirmed', 'uncertain', 'rejected']:
                    state = 'corrected' if box_event['status'] == 'confirmed' else box_event['status']
            if state == 'out_of_scope': state = 'rejected'
            if state not in STATUS: state = 'pending'
            qualities = set()
            if decision == 'uncertain' or 'mapping_needs_context' in reasons: qualities.add('ambiguous')
            if not raw['annotations']: qualities.add('missing')
            if quality and quality['pending']: qualities.add('bbox')
            queues = set()
            if quality: queues.add('task04b')
            if preparation: queues.add('prepared')
            if not event and not box_event: queues.add('unprocessed')
            eligible = not f.blockers(uid, image_id)
            usage = {'eligible'} if eligible else {'quarantine', 'needs_check'}
            obj = bool(target_ids) or any(m.get('normalizedObjectProposal') for m in source)
            signs = bool(sign_ids or source_signs)
            label_types = ({'object'} if obj else set()) | ({'sign'} if signs else set())
            if obj and signs: label_types.add('both')
            current_labels = [targets[t]['name'] for t in target_ids if t in targets] + [sign_names.get(s, s) for s in sorted(sign_ids)]
            if event and event.get('visualCondition') == 'no_visible_fault': current_labels.append('Không thấy dấu hiệu lỗi')
            source_labels = [f.source_translations.get((raw['dataset'], c), 'Nhãn chưa có bản dịch') for c in raw['classIds']]
            quick = set()
            if state == 'pending': quick.add('pending')
            if qualities & {'bbox', 'missing'}: quick.add('needs_fix')
            if priority is not None and priority <= 1: quick.add('priority')
            if state in ['confirmed', 'corrected', 'rejected'] and not (quality and quality['pending']): quick.add('completed')
            records.append(dict(id=image_id, dataset=raw['dataset'], categoryIds=sorted({targets[t]['categoryId'] for t in target_ids if t in targets}), targetIds=target_ids,
                labels=current_labels if event or box_event else source_labels, labelOrigin='admin' if event or box_event else 'source',
                sourceLabelsVi=source_labels, sourceKeys=[m['mappingKey'] for m in source], status=state, priority=priority,
                signIds=sorted(sign_ids | {'proposal:' + s for s in source_signs}), labelType=sorted(label_types), quality=sorted(qualities), bbox=sorted(bbox_states),
                imageType=sorted(image_types), duplicate=sorted(duplicate_types), queue=sorted(queues), usage=sorted(usage), quick=sorted(quick),
                qualityReview=quality, eligible=eligible))
        self.cache_key, self.records = key, records
        return records

    def options(self, records, catalog):
        f = self.parent
        options = {'status': [{'id': k, 'name': v} for k, v in STATUS.items()]}
        for field, names in LABELS.items():
            present = {v for row in records for v in row[field]}
            options[field] = [{'id': k, 'name': v} for k, v in names.items() if field == 'quick' or k in present]
        datasets = {r['dataset'] for r in records}
        options['dataset'] = [{'id': d['dataset'], 'name': ('Roboflow · ' if d.get('yaml', {}).get('roboflow') else '') + d['source'].get('project', d['dataset'])} for d in f.mapping['datasets'] if d['dataset'] in datasets]
        keys = {key for r in records for key in r['sourceKeys']}
        options['sourceLabel'] = [{'id': m['mappingKey'], 'name': f.source_translations.get((m['dataset'], m['classId']), m['sourceLabel']) + ' · ' + m['sourceLabel'] + ' (' + m['dataset'] + ')'} for m in f.mapping['entries'] if m['mappingKey'] in keys]
        sign_ids = {s for r in records for s in r['signIds']}
        pack = f.quality.load()
        names = SIGN_NAMES | {k: v['name'] for k, v in (pack or {}).get('signs', {}).items()}
        proposals = {'proposal:' + p: f.display_vi.get(m['mappingKey'], {}).get('signVi') or p for m in f.mapping['entries'] for p in m.get('visibleSignProposals') or []}
        options['sign'] = [{'id': s, 'name': (proposals.get(s, s) + ' · nguồn đề xuất') if s.startswith('proposal:') else names.get(s, s) + ' · Admin đã lưu'} for s in sorted(sign_ids)]
        options['priority'] = [{'id': str(p), 'name': 'P' + str(p)} for p in sorted({r['priority'] for r in records if r['priority'] is not None})]
        return dict(catalog=catalog, filters=options, total=len(records))

    @staticmethod
    def filtered(records, query):
        result = records
        for field in ['category', 'target', 'status', 'dataset', 'sourceLabel', 'sign', 'labelType', 'quality', 'bbox', 'imageType', 'duplicate', 'queue', 'priority', 'usage', 'quick']:
            value = query.get(field, 'all')
            if value == 'all': continue
            column = {'category':'categoryIds', 'target':'targetIds', 'sourceLabel':'sourceKeys', 'sign':'signIds'}.get(field, field)
            if field == 'priority': result = [r for r in result if str(r['priority']) == value]
            else: result = [r for r in result if value in r[column]] if field not in ['status', 'dataset'] else [r for r in result if r[column] == value]
        search = query.get('q', '').strip().lower()
        return [r for r in result if search in r['id'].lower()]

    def handle(self, uid, op, query):
        catalog = query.get('catalog') or self.parent.tax
        records = self.records_for(uid, catalog)
        options = self.options(records, catalog)
        for key in ['category', 'target']:
            value = query.get(key, 'all')
            if value != 'all' and value not in {v['id'] for v in catalog['categories' if key == 'category' else 'targets']}:
                raise Invalid('Bộ lọc taxonomy không hợp lệ.')
        for key, values in options['filters'].items():
            value = query.get(key, 'all')
            # Saved-label filters can become empty after an edit: retain their semantics.
            allowed = set(STATUS if key == 'status' else LABELS.get(key, {})) | {v['id'] for v in values}
            if key in ['sourceLabel', 'dataset']: allowed |= {m['mappingKey'] if key == 'sourceLabel' else m['dataset'] for m in self.parent.mapping['entries']}
            if key == 'sign': allowed |= set(SIGN_NAMES) | set((self.parent.quality.load() or {}).get('signs', {})) | {'proposal:' + p for m in self.parent.mapping['entries'] for p in m.get('visibleSignProposals') or []}
            if key == 'priority': allowed |= {'0','1','2','3'}
            if value != 'all' and value not in allowed: raise Invalid('Giá trị bộ lọc không được hỗ trợ: ' + key)
        if op == 'fast_label_options': return options
        filtered = self.filtered(records, query)
        order = query.get('sort', 'id')
        if order not in ['id', 'status', 'priority'] or query.get('direction', 'asc') not in ['asc', 'desc']: raise Invalid('Thứ tự sắp xếp không hợp lệ.')
        rank = {s: n for n, s in enumerate(STATUS)}
        filtered.sort(key=lambda r: ((r['priority'] if r['priority'] is not None else 999) if order == 'priority' else rank[r['status']] if order == 'status' else 0, r['id']), reverse=query.get('direction') == 'desc')
        if order == 'priority':
            filtered = [r for r in filtered if r['priority'] is not None] + [r for r in filtered if r['priority'] is None]
        if op == 'fast_label_items':
            page, size = query.get('page', 1), query.get('pageSize', 12)
            if type(page) is not int or type(size) is not int or not 1 <= page <= 100000 or not 1 <= size <= 50: raise Invalid('Phân trang không hợp lệ.')
            pages = max(1, (len(filtered) + size - 1) // size)
            page = min(page, pages)
            return dict(items=filtered[(page-1)*size:page*size], total=len(filtered), page=page, pageSize=size, pages=pages)
        now = time.monotonic()
        self.sessions = {k:v for k,v in self.sessions.items() if now-v['created'] < 3600}
        token = query.get('queueId')
        if not token:
            image_id = query.get('imageId')
            ids = [r['id'] for r in filtered]
            if image_id not in ids: raise Invalid('Ảnh không còn trong bộ lọc. Hãy tải lại danh sách.')
            if len(self.sessions) >= 64: self.sessions.pop(min(self.sessions, key=lambda k:self.sessions[k]['created']))
            token = str(uuid.uuid4())
            self.sessions[token] = dict(uid=uid, ids=ids, query={k:v for k,v in query.items() if k not in ['imageId', 'catalog']}, created=now)
            return dict(queueId=token, imageId=image_id, position=ids.index(image_id)+1, total=len(ids))
        session = self.sessions.get(token)
        if not session or session['uid'] != uid: raise Invalid('Phiên duyệt hết hạn. Đóng chi tiết và mở lại từ bảng.')
        ids = session['ids']
        current = query.get('imageId')
        if current not in ids: raise Invalid('Ảnh không thuộc phiên duyệt này.')
        matches = {r['id'] for r in self.filtered(records, session['query'])}
        step = -1 if query.get('move') == 'previous' else 1
        index = ids.index(current) + step
        while 0 <= index < len(ids):
            if ids[index] in matches: return dict(queueId=token, imageId=ids[index], position=index+1, total=len(ids))
            index += step
        return dict(queueId=token, imageId=None, position=ids.index(current)+1, total=len(ids))
