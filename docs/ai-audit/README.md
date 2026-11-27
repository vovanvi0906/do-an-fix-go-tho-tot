# AI-AUDIT-01 — Audit hiện trạng AI FixGo

Audit mới ngày **25/11/2026**, tập trung source và kiểm thử read-only. Bắt đầu tại [00-executive-summary.md](00-executive-summary.md).

Các báo cáo đánh số theo task hiện hành:

- [00-executive-summary.md](00-executive-summary.md)
- [01-current-ai-architecture.md](01-current-ai-architecture.md)
- [02-model-inventory.md](02-model-inventory.md)
- [03-ai-inference-pipeline.md](03-ai-inference-pipeline.md)
- [04-object-recognition-audit.md](04-object-recognition-audit.md)
- [05-catalog-coverage-matrix.md](05-catalog-coverage-matrix.md)
- [06-defect-diagnosis-audit.md](06-defect-diagnosis-audit.md)
- [07-service-recommendation-audit.md](07-service-recommendation-audit.md)
- [08-dataset-inventory.md](08-dataset-inventory.md)
- [09-model-evaluation-report.md](09-model-evaluation-report.md)
- [10-gap-analysis.md](10-gap-analysis.md)
- [11-dataset-requirements.md](11-dataset-requirements.md)
- [12-ai-improvement-roadmap.md](12-ai-improvement-roadmap.md)
- [13-evidence-index.md](13-evidence-index.md)

Dữ liệu kèm: [catalog-coverage.csv](catalog-coverage.csv), [model-inventory.csv](model-inventory.csv), [dataset-requirements.csv](dataset-requirements.csv), [inference-results.json](inference-results.json). Inference JSON chỉ được tạo sau khi đã thực sự chạy request/model. Bằng chứng mới tại `evidence/ai-audit-01-20261125/`.

Các file cũ khác tên (01-ai-service-inventory, 02-current-architecture, v.v.) giữ như lịch sử, không được coi là audit mới hoặc số đo hiện hành. Bản executive cũ được lưu riêng trong evidence. Tài liệu master generation trước đây là quota kế hoạch, không chứng minh cần tạo toàn bộ số ảnh đó ngay.

## Quy ước trạng thái

VERIFIED = phép kiểm cụ thể đã thực hiện; IMPLEMENTED = có source và đường gọi; PARTIAL = thiếu một phần; MISSING = không tìm thấy trong phạm vi; MOCK = mô phỏng; RULE_BASED = luật; NOT_VERIFIED = chưa có bằng chứng; BLOCKED = thiếu điều kiện. VERIFIED load/inference không đồng nghĩa VERIFIED accuracy. Dữ liệu source/unreviewed không trở thành ground truth độc lập khi chạy lại model.

Không sửa application code, DB/schema/model/raw dataset; không train/fine-tune, không download model/dataset, không commit/push. Chỉ artifacts/docs, test isolated, GET và pure diagnosis inference; không gọi tạo đơn, upload Cloudinary, enroll face, sync hoặc approval.
