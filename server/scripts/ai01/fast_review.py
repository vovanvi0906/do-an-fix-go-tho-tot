"""AI-assisted development labels; isolated from every independent-review store."""
import base64
import hashlib
import json
import math
import mimetypes
import os
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import yaml
from review_core import Invalid


VISIBLE_SIGNS = {'water_drip', 'water_spray', 'wet_surface', 'stain_or_discoloration', 'crack', 'broken_part', 'surface_soiling', 'bird_droppings', 'leaf_debris', 'leaf_spots_or_damage', 'burn_mark', 'exposed_wire', 'other_visible_sign', 'standing_water'}


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


class FastReview:
    def __init__(self, pilot, state, raw):
        self.raw = raw.resolve()
        from prepared_dataset import PreparedDataset
        self.prepared = PreparedDataset(self.raw)
        folder = pilot.parent / 'ai01-label-review-v1'
        pins = json.loads((folder / 'SHA256SUMS.json').read_text())
        for name in ['images.jsonl', 'dataset-mapping-proposal.json', 'duplicate-lookup.json']:
            if digest(folder / name) != pins.get(name):
                raise Invalid('Checksum TASK03B không khớp: ' + name)
        self.snapshot_hash = digest(folder / 'dataset-mapping-proposal.json')
        self.mapping = json.loads((folder / 'dataset-mapping-proposal.json').read_text())
        self.display_vi = json.loads((pilot / 'mapping-display-vi.json').read_text())
        # Presentation-only translations; source labels and mapping snapshots stay intact.
        self.display_vi['dienlanh/v1/1']['labelVi'] = 'Điều hòa áp trần (loại máy cần xác minh)'
        self.display_vi['dienlanh/v1/2']['labelVi'] = 'Điều hòa trong phòng (loại máy cần xác minh)'
        self.display_vi['lamvuon/v1/0']['labelVi'] = 'Nhãn nguồn chưa rõ nghĩa'
        self.display_vi['lamvuon/v1/16']['labelVi'] = 'Lá đậu tương'
        self.display_vi['lamvuon/v1/17']['labelVi'] = 'Lá đậu tương'
        self.source_translations = {(e['dataset'], e['classId']): self.display_vi.get(e['mappingKey'], {}).get('labelVi', 'Nhãn chưa có bản dịch') for e in self.mapping['entries']}
        self.tax = json.loads((pilot / 'taxonomy-reference.json').read_text())
        self.rows = {r['id']: r for r in map(json.loads, (folder / 'images.jsonl').read_text().splitlines()) if not r['reference']}
        self.duplicates = json.loads((folder / 'duplicate-lookup.json').read_text())
        self.counts = Counter(r['pixelSha256'] for r in self.rows.values())
        self.home = state / 'fast-label-development'
        if self.home.resolve().parent != state.resolve():
            raise Invalid('State gán nhãn nhanh không được trỏ ra ngoài vùng Admin.')
        self.home.mkdir(exist_ok=True, mode=0o700)
        self.log = self.home / 'events.jsonl'
        if self.log.resolve().parent != self.home.resolve():
            raise Invalid('Audit SOLO không được trỏ ra ngoài vùng state.')
        self.latest = {}
        self.checks = {}
        self.events = []
        self.head = '0' * 64
        if self.log.exists():
            for line in self.log.read_text().splitlines():
                e = json.loads(line); h = e.pop('eventHash')
                if e['previousHash'] != self.head or self.hash(e) != h:
                    raise Invalid('Audit gán nhãn nhanh không toàn vẹn.')
                e['eventHash'] = h; self.head = h
                self.apply(e)

        self.log_digest = digest(self.log) if self.log.exists() else None
        from quality_review import QualityReview
        self.quality = QualityReview(self)

    def check_audit(self):
        current = digest(self.log) if self.log.exists() else None
        if current != self.log_digest:
            raise Invalid('Audit đã đổi ngoài writer; dừng ghi/xuất và đối chiếu lịch sử.')

    def apply(self, event):
        self.events.append(event)
        if event.get('kind') == 'development_check':
            self.checks[event['imageId']] = event
        elif event.get('imageId'):
            self.latest[event['imageId']] = event

    def append(self, event):
        self.check_audit()
        event = dict(event, previousHash=self.head)
        event['eventHash'] = self.hash(event)
        with self.log.open('a') as f:
            f.write(json.dumps(event, ensure_ascii=False) + '\n'); f.flush(); os.fsync(f.fileno())
        self.head = event['eventHash']
        self.log_digest = digest(self.log)
        self.apply(event)
        return event

    def blockers(self, uid, image_id, verify_files=False):
        label = self.latest.get(image_id)
        check = self.checks.get(image_id)
        out = []
        if not label or label['decision'] != 'confirmed': out.append('Chưa có nhãn người xác nhận.')
        if label and label['userId'] != uid: out.append('Nhãn thuộc Admin khác; cần tự kiểm và lưu nhãn của bạn.')
        if not check: out.append('Quarantine: chưa kiểm nguồn, quyền ảnh và nhóm trùng.')
        elif (not label or check['annotationEventHash'] != label['eventHash']
              or check['userId'] != uid or check['mappingSnapshotSha256'] != self.snapshot_hash):
            out.append('Nhãn/mapping/người kiểm đã đổi; cần kiểm tra lại.')
        elif check.get('partition') != 'development': out.append('Ảnh còn quarantine.')
        if verify_files and not out:
            try: self.detail(image_id)
            except (Invalid, OSError, ValueError): out.append('Hash ảnh/YOLO/YAML không còn khớp hoặc không đọc được.')
        return out

    @staticmethod
    def hash(e):
        return hashlib.sha256(json.dumps(e, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

    def file(self, relative):
        p = (self.raw / relative).resolve()
        if not p.is_relative_to(self.raw):
            raise Invalid('Đường dẫn ngoài raw dataset.')
        return p

    def detail(self, image_id):
        if image_id not in self.rows:
            raise Invalid('Không có ảnh phát triển này.')
        r = self.rows[image_id]
        image = self.file(r['path']); label = self.file(r['annotationPath'])
        meta = next(d for d in self.mapping['datasets'] if d['dataset'] == r['dataset'])
        yml = self.file(r['dataset'] + '/data.yaml')
        if digest(image) != r['sha256'] or digest(label) != r['annotationSha256'] or digest(yml) != meta['yamlSha256']:
            raise Invalid('Raw/YAML đã đổi so với TASK03B; cần lập inventory mới trước khi duyệt.')
        names = yaml.safe_load(yml.read_text())['names']
        annotations = []
        for line in label.read_text().splitlines():
            if not line.strip(): continue
            values = list(map(float, line.split())); cid = int(values[0]); coords = values[1:]
            if values[0] != cid or (len(coords) != 4 and (len(coords) < 6 or len(coords) % 2)) or any(not math.isfinite(v) or v < 0 or v > 1 for v in coords):
                raise Invalid('YOLO label không hợp lệ; cần sửa trong bản sao phát triển.')
            annotations.append({'classId': cid, 'format': 'bbox' if len(coords) == 4 else 'polygon', 'coordinates': coords})
        entries = [e for e in self.mapping['entries'] if e['dataset'] == r['dataset'] and e['classId'] in r['classIds']]
        candidates = {c['targetId']: c for e in entries for c in e['catalogTargetCandidates']}
        prediction = r.get('aiPrediction') or {}
        # Reuse only recorded YOLO+CLIP output bound to these exact image bytes.
        ai = prediction.get('prediction') if prediction.get('imageSha256') == r['sha256'] else None
        return dict(id=image_id, dataset=r['dataset'], sha256=r['sha256'], annotations=annotations,
                    sourceLabels=[names[c] if isinstance(names, list) else names[c] for c in r['classIds']], source={'url': meta['source']['url'], 'licenseDeclared': meta['source']['license']},
                    sourceLabelsVi=[self.display_vi.get(e['mappingKey'], {}).get('labelVi', 'Nhãn chưa có bản dịch') for e in entries],
                    sourceMappings=[dict(e, displayVi=self.display_vi.get(e['mappingKey'])) for e in entries],
                    candidates=list(candidates.values()), mappingKeys=[e['mappingKey'] for e in entries],
                    ai=ai, annotation=self.latest.get(image_id), duplicateCount=self.counts[r['pixelSha256']],
                    imagePath=r['path'], annotationSha256=r['annotationSha256'], duplicateEvidence=self.duplicates.get(str(r['index']), {}),
                    history=[e for e in self.events if e.get('imageId') == image_id],
                    developmentCheck=self.checks.get(image_id))

    def handle(self, uid, op, p):
        self.check_audit()
        if op.startswith('fast_quality_'): return self.quality.handle(uid,op,p)
        if op == 'fast_preparation': return self.prepared.overview(self.latest)
        if op == 'fast_catalog': return self.tax
        if op == 'fast_mappings': return {'entries': [dict(e, displayVi=self.display_vi.get(e['mappingKey'])) for e in self.mapping['entries']]}
        if op == 'fast_readiness':
            rows = []
            for i, e in self.latest.items():
                blockers = self.blockers(uid, i, verify_files=True)
                rows.append(dict(imageId=i, decision=e['decision'], eligible=not blockers, blockers=blockers))
            return {'items': rows, 'eligibleCount': sum(r['eligible'] for r in rows), 'quarantineCount': sum(not r['eligible'] for r in rows), 'totalImages': len(self.rows)}
        if op == 'fast_items':
            preparation = self.prepared.load()
            quality = self.quality.load()
            return {'items': [dict(id=r['id'], dataset=r['dataset'], difficult=bool(r['annotationIssues']) or len(r['annotations']) > 5,
                                  duplicate=self.counts[r['pixelSha256']] > 1 or bool(self.duplicates.get(str(r['index']))),
                                  uncertain=not (r.get('aiPrediction') or {}).get('prediction', {}).get('suggestedTargetId'),
                                  qualityReview=self.quality.queue_info(r['id'],quality),
                                  preparationReview=preparation['reviewIndex'].get(r['id']),
                                  sourceLabelsVi=[self.source_translations.get((r['dataset'], cid), 'Nhãn chưa có bản dịch') for cid in r['classIds']],
                                  status=self.latest.get(r['id'], {}).get('decision', 'pending'),
                                  eligible=not self.blockers(uid, r['id'])) for r in self.rows.values()], 'mappingCount': len(self.mapping['entries'])}
        if op in ['fast_detail', 'fast_image']:
            d = self.detail(p.get('imageId'))
            if op == 'fast_detail':
                preparation = self.prepared.load()
                return dict(d, qualityReview=self.quality.queue_info(p['imageId']), blockers=self.blockers(uid, p['imageId']), preparationReview=preparation['reviewIndex'].get(p['imageId']), preparationReasonLabels=preparation['reasonLabels'])
            f = self.file(d['imagePath'])
            return {'binary': base64.b64encode(f.read_bytes()).decode(), 'contentType': mimetypes.guess_type(f.name)[0] or 'image/jpeg'}
        if op == 'fast_save':
            self.check_audit()
            required = {'imageId', 'decision', 'targetIds', 'reason', 'expectedHash'}
            optional = {'reviewAction', 'imageFlags', 'visualCondition', 'visibleSigns'}
            if not required.issubset(p) or set(p) - required - optional: raise Invalid('Payload nhãn nhanh không hợp lệ.')
            extra = set(p) & optional
            if extra and extra != optional: raise Invalid('Cần gửi đủ quyết định, loại ảnh và tình trạng quan sát.')
            d = self.detail(p['imageId']); previous = self.latest.get(p['imageId'])
            if p['expectedHash'] != (previous['eventHash'] if previous else None): raise Invalid('Nhãn đã đổi; tải lại ảnh.')
            if p['decision'] not in ['confirmed', 'rejected', 'skipped', 'uncertain', 'out_of_scope']: raise Invalid('Quyết định không hợp lệ.')
            ids = p['targetIds']; allowed = {t['id'] for t in self.tax['targets']}
            if not isinstance(ids, list) or any(not isinstance(t, str) or t not in allowed for t in ids) or len(ids) != len(set(ids)): raise Invalid('Đối tượng FixGo không hợp lệ.')
            if p['decision'] == 'confirmed' and not ids: raise Invalid('Chọn ít nhất một đối tượng hoặc đánh dấu ngoài phạm vi.')
            if not isinstance(p['reason'], str) or not p['reason'].strip(): raise Invalid('Cần ghi chú quyết định.')
            observation = {}
            if extra:
                action = p['reviewAction']
                if not isinstance(action, str) or {'confirm': 'confirmed', 'correct': 'confirmed', 'uncertain': 'uncertain', 'reject': 'rejected'}.get(action) != p['decision']:
                    raise Invalid('Quyết định xem/sửa nhãn không khớp trạng thái lưu.')
                flags = p['imageFlags']
                if not isinstance(flags, list) or any(not isinstance(v, str) or v not in ['advertisement', 'composite'] for v in flags) or len(flags) != len(set(flags)):
                    raise Invalid('Chỉ đánh dấu ảnh quảng cáo hoặc ảnh tổng hợp.')
                condition = p['visualCondition']; signs = p['visibleSigns']
                if not isinstance(condition, str) or condition not in ['not_reviewed', 'abnormal_visible', 'no_visible_fault', 'uncertain']:
                    raise Invalid('Chọn tình trạng quan sát hợp lệ.')
                if signs is not None and (not isinstance(signs, list) or any(not isinstance(v, str) or v not in VISIBLE_SIGNS for v in signs) or len(signs) != len(set(signs))):
                    raise Invalid('Dấu hiệu quan sát không hợp lệ.')
                if condition == 'abnormal_visible' and not signs: raise Invalid('Chọn dấu hiệu thực sự nhìn thấy trong ảnh.')
                if condition == 'no_visible_fault' and signs != []: raise Invalid('Không thấy dấu hiệu lỗi thì danh sách dấu hiệu phải rỗng.')
                if condition in ['not_reviewed', 'uncertain'] and signs is not None: raise Invalid('Chưa xem/chưa chắc không được ghi thành đã xác nhận dấu hiệu.')
                if p['decision'] == 'confirmed' and condition == 'not_reviewed': raise Invalid('Cần xem và chọn tình trạng quan sát trước khi xác nhận nhãn.')
                if action == 'correct' and not p['reason'].strip(): raise Invalid('Cần ghi lý do sửa nhãn.')
                observation = dict(reviewAction=action, imageFlags=flags, visualCondition=condition, visibleSigns=signs,
                    categoryIds=sorted({t['categoryId'] for t in self.tax['targets'] if t['id'] in ids}))
            e = dict(imageId=p['imageId'], decision=p['decision'], targetIds=ids, reason=p['reason'].strip(), userId=uid,
                     timestamp=datetime.now(timezone.utc).isoformat(), mode='SOLO_THESIS', datasetType='ai-assisted-development',
                     independentlyReviewed=False, approvedGroundTruth=False, aiExposed=True, split='development',
                     labelScope='image_targets', sourceGeometryHumanVerified=False,
                     image=d['imagePath'], sha256=d['sha256'], annotationSha256=d['annotationSha256'],
                     sourceFamilyCandidate=self.rows[p['imageId']].get('sourceFamilyCandidate'),
                     phash=self.rows[p['imageId']]['phash'], pixelSha256=self.rows[p['imageId']]['pixelSha256'],
                     nearCandidateGroup=self.duplicates.get(str(self.rows[p['imageId']]['index']), {}).get('nearCandidateGroup'),
                     mappingKeys=d['mappingKeys'], duplicateGroup=self.duplicates.get(str(self.rows[p['imageId']]['index']), {}).get('identityGroup') or self.rows[p['imageId']]['pixelSha256'], previousHash=self.head)
            return self.append(dict(e, **observation))
        if op == 'fast_check':
            if set(p) != {'imageId', 'annotationEventHash', 'rightsEvidence', 'sourceEvidence', 'groupEvidence', 'reason'}:
                raise Invalid('Cần hash nhãn và đủ bằng chứng kiểm tra SOLO.')
            self.detail(p['imageId'])
            label = self.latest.get(p['imageId'])
            if not label or label['decision'] != 'confirmed' or label['userId'] != uid or label['eventHash'] != p['annotationEventHash']:
                raise Invalid('Chỉ kiểm bản nhãn đã xác nhận mới nhất do chính bạn lưu.')
            for k in ['rightsEvidence', 'sourceEvidence', 'groupEvidence', 'reason']:
                if not isinstance(p[k], str) or not p[k].strip(): raise Invalid('Thiếu bằng chứng: ' + k)
            return self.append(dict(p, kind='development_check', userId=uid,
                timestamp=datetime.now(timezone.utc).isoformat(), partition='development',
                mappingSnapshotSha256=self.snapshot_hash, approvedGroundTruth=False,
                independentlyReviewed=False, mode='SOLO_THESIS'))
        if op == 'fast_export':
            if set(p) - {'imageIds'}: raise Invalid('Chỉ chọn subset imageIds cần xuất.')
            ids = p.get('imageIds', [i for i in self.latest if not self.blockers(uid, i)])
            if not isinstance(ids, list) or not ids or any(not isinstance(i, str) or i not in self.rows for i in ids) or len(ids) != len(set(ids)):
                raise Invalid('Chưa có subset SOLO đủ điều kiện xuất.')
            failures = {i: self.blockers(uid, i) for i in ids if self.blockers(uid, i)}
            if failures: raise Invalid('Chưa đủ điều kiện xuất: ' + json.dumps(failures, ensure_ascii=False))
            records = []
            for i in ids:
                self.detail(i)
                e = self.latest[i]; check = self.checks[i]
                records.append(dict(e, datasetType='solo-development', schemaVersion='fixgo.ai01.solo-targets.v2',
                    developmentCheck=check, mappingSnapshotSha256=self.snapshot_hash,
                    partition='development', blindTest=False))
            folder = self.home / 'exports'
            if folder.resolve().parent != self.home.resolve(): raise Invalid('Vùng xuất SOLO không hợp lệ.')
            folder.mkdir(exist_ok=True, mode=0o700)
            name = 'solo-development-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.jsonl'
            file = folder / name
            with file.open('x') as f:
                for record in records: f.write(json.dumps(record, ensure_ascii=False) + '\n')
                f.flush(); os.fsync(f.fileno())
            event = self.append(dict(kind='export', userId=uid, timestamp=datetime.now(timezone.utc).isoformat(),
                                     imageIds=ids, file=name, sha256=digest(file)))
            return {'file': name, 'sha256': event['sha256'], 'images': len(records), 'datasetType': 'solo-development',
                    'split': 'development', 'approvedGroundTruth': False, 'exportAuditHash': event['eventHash']}
        if op == 'fast_download':
            name = p.get('file')
            if not isinstance(name, str) or not re.fullmatch(r'solo-development-[0-9TZ]+\.jsonl', name): raise Invalid('Tên bản xuất không hợp lệ.')
            event = next((e for e in self.events if e.get('kind') == 'export' and e.get('file') == name and e['userId'] == uid), None)
            file = self.home / 'exports' / name
            if file.resolve().parent != (self.home / 'exports').resolve() or not event or not file.is_file() or digest(file) != event['sha256']: raise Invalid('Bản xuất không có audit/hash hợp lệ của bạn.')
            return {'binary': base64.b64encode(file.read_bytes()).decode(), 'contentType': 'application/x-ndjson', 'filename': name}
        raise Invalid('Không có thao tác gán nhãn nhanh.')
