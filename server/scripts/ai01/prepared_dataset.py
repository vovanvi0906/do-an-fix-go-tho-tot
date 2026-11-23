"""Read-only preparation sidecar for the existing SOLO Admin workspace."""
import hashlib
import json
from pathlib import Path

LABELS = {
 'invalid_or_missing_annotation':'Nhãn lỗi định dạng hoặc bị thiếu', 'unusual_geometry':'Khung/vùng nhãn bất thường',
 'advertisement_filename_candidate':'Tên file có dấu hiệu quảng cáo', 'advertisement_layout_candidate':'Bố cục nghi quảng cáo — cần xem ảnh',
 'composite_layout_candidate':'Bố cục nghi ảnh ghép — cần xem ảnh', 'mapping_needs_context':'Mapping đối tượng cần ngữ cảnh',
 'out_of_scope_candidate':'Nhãn nguồn ngoài taxonomy hiện tại', 'source_fault_claim_needs_confirmation':'Tên lỗi/bệnh do nguồn công bố, chưa xác nhận dấu hiệu',
 'conflicting_labels_same_pixels':'Cùng ảnh nhưng nhãn nguồn khác nhau', 'near_duplicate_candidate':'Ảnh gần trùng, đã giữ cùng nhóm split',
 'source_label_spot_check':'Kiểm tra mẫu nhãn nguồn, không cần gán lại toàn bộ',
}


class PreparedDataset:
    def __init__(self, raw):
        self.root = raw.parent / '02-development/ai01-prepared-v1'
        self.cache = None
        self.signature = None

    def load(self):
        summary, manifest = self.root/'summary.json', self.root/'SHA256SUMS.json'
        if not summary.exists() or not manifest.exists():
            progress = self.root/'progress.json'
            return {'available':False,'progress':json.loads(progress.read_text()) if progress.exists() else None,'reviewIndex':{},'reasonLabels':LABELS}
        signature = (summary.stat().st_mtime_ns, manifest.stat().st_mtime_ns, (self.root/'review-index.json').stat().st_mtime_ns)
        if self.cache is not None and signature == self.signature: return self.cache
        pins = json.loads(manifest.read_text())
        for name in ['summary.json','review-index.json','normalized-mapping.json','catalog-db.json']:
            if hashlib.sha256((self.root/name).read_bytes()).hexdigest() != pins.get(name):
                raise ValueError('Checksum prepared dataset mismatch: '+name)
        data = json.loads(summary.read_text())
        if data.get('approvedGroundTruth') is not False or data.get('trained') is not False:
            raise ValueError('Invalid preparation state')
        self.cache = {'available':True,'summary':data,'reviewIndex':json.loads((self.root/'review-index.json').read_text()),'reasonLabels':LABELS}
        self.signature = signature
        return self.cache

    def overview(self, reviewed_ids):
        data = self.load()
        return {k:v for k,v in data.items() if k!='reviewIndex'} | {'queueCount':len(data['reviewIndex']),
                'reviewedQueueImages':sum(i in reviewed_ids for i in data['reviewIndex'])}
