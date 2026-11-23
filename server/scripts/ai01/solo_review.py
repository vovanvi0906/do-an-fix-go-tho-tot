"""Separate one-person development workflow. Never writes independent Store events."""
import base64
import json
import os
import re
from datetime import datetime, timezone

from review_core import Store, Invalid, canonical, file_sha

MODE = 'SOLO_THESIS'
PURPOSE = 'Một người tự gán và xác nhận nhãn; chỉ phát triển, không phải GT duyệt độc lập hoặc blind test.'


class SoloStore(Store):
    def __init__(self, root):
        self.annotations_solo = {}
        self.confirmations = {}
        self.actor = None
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        super().__init__(data=root)

    def apply(self, event):
        if event['kind'] == 'solo_annotation':
            self.annotations_solo[event['data']['imageId']] = event
        elif event['kind'] == 'solo_confirmation':
            self.confirmations[event['data']['imageId']] = event
        else:
            super().apply(event)

    def snapshots(self):
        # The append-only event chain is authoritative. No independent review snapshots.
        pass

    def append(self, kind, who, data):
        data = dict(data, mode=MODE, authenticatedPrincipal={
            'userId': who, 'role': 'ADMIN', 'expert': self.actor.get('expert') is True,
            'policyRevision': self.actor['policyRevision']})
        return super().append(kind, who, data)

    def bind_admin(self, principal):
        if principal.get('admin') is not True or principal.get('role') != 'coordinator':
            raise Invalid('Chế độ một người chỉ dành cho ADMIN active đã xác thực.')
        self.actor = principal
        uid = principal['id']
        # Actual authenticated actor, not a fabricated A/B identity or registration.
        self.users[uid] = {'role': 'coordinator', 'expert': principal.get('expert') is True}
        return uid

    def current_hashes(self, image_id):
        return {k: self.maps[k]['eventHash'] if k in self.maps else None
                for k in self.item(image_id)['mappingKeys']}

    def save_annotation(self, uid, payload):
        allowed = {'imageId', 'labels', 'visualCondition', 'decision', 'reason',
                   'objectDescription', 'symptomEvidence', 'serviceEvidence',
                   'possibleCausesHypothesis', 'expectedAnnotationHash'}
        if set(payload) - allowed:
            raise Invalid('Nội dung nhãn một người có trường không hợp lệ.')
        image_id = payload.get('imageId')
        self.check_files(image_id)
        previous = self.annotations_solo.get(image_id)
        if payload.get('expectedAnnotationHash') != (previous['eventHash'] if previous else None):
            raise Invalid('Nhãn đã đổi; tải lại trước khi lưu.')
        status = payload.get('decision')
        if status not in ['submitted', 'uncertain', 'needsExpertReview', 'reject']:
            raise Invalid('Chọn đã gán nhãn, chưa chắc, cần chuyên gia hoặc loại ảnh.')
        if not isinstance(payload.get('reason'), str) or not payload['reason'].strip():
            raise Invalid('Cần lý do/bằng chứng cho nhãn một người.')
        labels = self.validate_labels(payload.get('labels'), strict=status == 'submitted')
        condition = payload.get('visualCondition')
        if condition not in ['abnormal_visible', 'no_abnormality_visible', 'difficult', 'out_of_scope']:
            raise Invalid('Cần chọn tình trạng quan sát.')
        if status == 'submitted':
            self.validate_condition(labels, condition)
        if labels['symptom'] and not str(payload.get('symptomEvidence') or '').strip():
            raise Invalid('Triệu chứng cần bằng chứng thực tế.')
        if labels['recommendedService'] and (not self.users[uid]['expert'] or not str(payload.get('serviceEvidence') or '').strip()):
            raise Invalid('Dịch vụ dương cần chuyên môn đã xác minh và bằng chứng.')
        data = dict(self.binding(image_id), labels=labels, decision=status,
                    visualCondition=condition, reason=payload['reason'].strip(),
                    previousAnnotationHash=previous['eventHash'] if previous else None)
        for key in ['objectDescription', 'symptomEvidence', 'serviceEvidence', 'possibleCausesHypothesis']:
            if payload.get(key) is not None and not isinstance(payload[key], str):
                raise Invalid('Bằng chứng/mô tả phải là chuỗi.')
            data[key] = (payload.get(key) or '').strip()
        return self.append('solo_annotation', uid, data)

    @staticmethod
    def validate_condition(labels, condition):
        if (condition == 'out_of_scope') != bool(labels['unknown']):
            raise Invalid('Tình trạng ngoài phạm vi phải khớp unknown.')
        if condition == 'abnormal_visible' and not labels['visibleFault']:
            raise Invalid('Có bất thường phải ghi dấu hiệu cụ thể.')
        if condition == 'no_abnormality_visible' and labels['visibleFault']:
            raise Invalid('Không thấy bất thường thì dấu hiệu phải rỗng.')

    def confirm(self, uid, payload):
        if set(payload) != {'imageId', 'annotationEventHash', 'reason'}:
            raise Invalid('Xác nhận cần imageId, hash bản nhãn và lý do.')
        image_id = payload['imageId']
        self.check_files(image_id)
        annotation = self.annotations_solo.get(image_id)
        if not annotation or annotation['eventHash'] != payload['annotationEventHash']:
            raise Invalid('Bản nhãn đã đổi hoặc chưa tồn tại; tải lại.')
        if annotation['reviewerId'] != uid:
            raise Invalid('Chỉ tự xác nhận bản nhãn do chính tài khoản của mình thực hiện.')
        if annotation['data']['decision'] != 'submitted':
            raise Invalid('Nhãn chưa chắc/cần chuyên gia/loại ảnh không được tự xác nhận để xuất.')
        if not isinstance(payload['reason'], str) or not payload['reason'].strip():
            raise Invalid('Cần lý do tự kiểm tra và xác nhận.')
        self.validate_labels(annotation['data']['labels'], strict=True)
        if annotation['data']['labels']['recommendedService'] and not self.users[uid]['expert']:
            raise Invalid('Dịch vụ dương cần chuyên môn đang được xác minh.')
        return self.append('solo_confirmation', uid, dict(self.binding(image_id),
            annotationEventHash=annotation['eventHash'], mappingEventHashes=self.current_hashes(image_id),
            provenanceEventHash=self.provenance.get(image_id, {}).get('eventHash'),
            decision='self_confirmed', reason=payload['reason'].strip()))

    def blockers(self, image_id, verify_files=False):
        row = self.item(image_id)
        out = []
        annotation = self.annotations_solo.get(image_id)
        confirmation = self.confirmations.get(image_id)
        if not annotation or annotation['data']['decision'] != 'submitted':
            out.append('Chưa có bản nhãn một người hoàn chỉnh (không uncertain/reject).')
        if not confirmation:
            out.append('Chưa tự kiểm tra và xác nhận nhãn.')
        elif (not annotation or confirmation['data']['annotationEventHash'] != annotation['eventHash']
              or confirmation['reviewerId'] != annotation['reviewerId']):
            out.append('Nhãn đã đổi sau xác nhận; cần tự kiểm tra lại.')
        if annotation:
            labels = annotation['data']['labels']
            try:
                self.validate_labels(labels, strict=True)
                self.validate_condition(labels, annotation['data']['visualCondition'])
            except Invalid as error:
                out.append(str(error))
            if labels['recommendedService'] and not self.actor.get('expert'):
                out.append('Dịch vụ dương cần người thực hiện có chuyên môn đang được xác minh.')
            for key in row['mappingKeys']:
                mapping = self.maps.get(key)
                if not mapping or mapping['data']['decision'] == 'uncertain':
                    out.append('Mapping SOLO chưa duyệt: ' + key)
                elif not labels['unknown'] and (mapping['data']['decision'] == 'rejected' or labels['target'] not in mapping['data']['allowedTargetIds']):
                    out.append('Nhãn ngoài mapping SOLO; cần sửa/duyệt lại mapping: ' + key)
        if confirmation and confirmation['data']['mappingEventHashes'] != self.current_hashes(image_id):
            out.append('Mapping SOLO đã đổi; cần xác nhận nhãn lại.')
        provenance = self.provenance.get(image_id)
        if not provenance:
            out.append('Chưa kiểm nguồn/quyền/nhóm ảnh SOLO.')
        else:
            data = provenance['data']
            if data.get('rightsVerified') is not True or not str(data.get('licenseOrConsent') or '').strip() or not str(data.get('rightsEvidence') or '').strip():
                out.append('Thiếu quyền sử dụng/license và bằng chứng.')
            if data.get('sourceVerified') is not True or not str(data.get('sourceEvidence') or '').strip() or data.get('origin') not in ['field_photo', 'licensed_external']:
                out.append('Nguồn ảnh chưa xác minh.')
            if not data.get('deviceId') or not data.get('sessionId') or data.get('identitiesProvidedBySource') is not True or not str(data.get('identityEvidence') or '').strip():
                out.append('Thiếu device/session thật từ nguồn; không tự tạo metadata.')
            if data.get('groupReviewComplete') is not True or not data.get('duplicateGroup') or not str(data.get('groupEvidence') or '').strip():
                out.append('Chưa kiểm SHA/pHash/ảnh trùng và nhóm nguồn.')
            if data.get('partition') != 'validation':
                out.append('Ảnh còn cách ly, chưa đủ điều kiện phát triển.')
        if confirmation and confirmation['data']['provenanceEventHash'] != (provenance['eventHash'] if provenance else None):
            out.append('Nguồn/metadata đã đổi; cần xác nhận nhãn lại.')
        if verify_files:
            try:
                self.check_files(image_id)
            except (Invalid, OSError):
                out.append('Hash ảnh/annotation/YAML đã đổi hoặc không đọc được.')
        return sorted(set(out))

    def export_solo(self, uid, payload):
        if set(payload) != {'imageIds'}:
            raise Invalid('Chỉ gửi danh sách ảnh cần xuất SOLO.')
        ids = payload['imageIds']
        if not isinstance(ids, list) or not ids or any(not isinstance(i, str) for i in ids) or len(ids) != len(set(ids)):
            raise Invalid('Cần subset ảnh không rỗng, không trùng.')
        failures = {i: self.blockers(i, True) for i in ids}
        for i in ids:
            if self.annotations_solo.get(i, {}).get('reviewerId') != uid:
                failures[i].append('Chỉ xuất nhãn do chính Admin này thực hiện trong chế độ một người.')
        if any(failures.values()):
            raise Invalid('Chưa đủ điều kiện xuất solo-development: ' + canonical({i: b for i, b in failures.items() if b}))
        records = []
        for image_id in ids:
            row = self.item(image_id)
            a = self.annotations_solo[image_id]
            c = self.confirmations[image_id]
            provenance = self.provenance[image_id]
            records.append({'schemaVersion': 'fixgo.ai01.solo-development.v1',
                'mode': MODE, 'datasetType': 'solo-development', 'split': 'development',
                'purpose': PURPOSE, 'id': image_id, 'image': row['path'], 'sha256': row['sha256'],
                'annotationSha256': row['annotationSha256'], 'phash': row['phash'],
                'labels': a['data']['labels'], 'visualCondition': a['data']['visualCondition'],
                'source': row['source'], 'aiExposure': row['aiExposure'],
                'provenance': {k: v for k, v in provenance['data'].items() if k != 'originalImage'},
                'review': {'status': 'self_confirmed', 'annotatorIds': [uid], 'confirmedBy': uid,
                    'annotatedAt': a['timestamp'], 'confirmedAt': c['timestamp'],
                    'independentlyReviewed': False, 'blindTest': False,
                    'annotationEventHash': a['eventHash'], 'confirmationEventHash': c['eventHash'],
                    'mappingEventHashes': c['data']['mappingEventHashes'],
                    'provenanceEventHash': provenance['eventHash'], 'reason': a['data']['reason'],
                    'confirmationReason': c['data']['reason']}})
        folder = self.home / 'exports'
        folder.mkdir(exist_ok=True, mode=0o700)
        name = 'solo-development-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.jsonl'
        target = folder / name
        with target.open('x') as file:
            for record in records:
                file.write(json.dumps(record, ensure_ascii=False) + '\n')
            file.flush()
            os.fsync(file.fileno())
        digest = file_sha(target)
        self.append('solo_export', uid, {'file': name, 'sha256': digest, 'imageIds': ids, 'purpose': PURPOSE})
        return {'file': name, 'sha256': digest, 'images': len(ids), 'datasetType': 'solo-development', 'purpose': PURPOSE}

    def download(self, filename):
        if not isinstance(filename, str) or not re.fullmatch(r'solo-development-[0-9TZ]+\.jsonl', filename):
            raise Invalid('Tên bản xuất một người không hợp lệ.')
        event = next((e for e in self.events if e['kind'] == 'solo_export' and e['data']['file'] == filename), None)
        target = self.home / 'exports' / filename
        if not event or not target.is_file() or file_sha(target) != event['data']['sha256']:
            raise Invalid('Bản xuất SOLO không có audit hoặc hash đã đổi.')
        return {'binary': base64.b64encode(target.read_bytes()).decode(),
                'contentType': 'application/x-ndjson', 'filename': filename}
