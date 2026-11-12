# AI-AUDIT-01 — Tóm tắt điều hành

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Kết luận chính

- **VERIFIED:** Có classifier YOLO fine-tuned, CLIP pretrained, YOLO detector, YuNet, SFace và xử lý OpenCV. `/health` live báo 6/6 cờ; một cờ là OpenCV, không phải sáu mạng được huấn luyện riêng.
- **VERIFIED:** Pipeline `main.py:diagnose` dùng CLIP và YOLO classification; không gọi YOLO detector để tạo box. Nhận diện danh mục và tương đồng ảnh–văn bản không phải chẩn đoán nguyên nhân hỏng.
- **VERIFIED:** CLIP đồng bộ đối tượng từ DB, nhưng embedding dịch vụ vẫn đến từ `SUB_SERVICES_CATALOG` tĩnh. Backend `resolveDiagnosis` bỏ qua service/target từ AI, lọc dịch vụ đang hoạt động theo danh mục DB, yêu cầu khách chọn triệu chứng hoặc dịch vụ. Không có chuỗi ánh xạ tự động đã được xác minh từ 70 đối tượng sang toàn bộ 693 dịch vụ.
- **VERIFIED:** Dataset hiện có 1.200 ảnh, sáu class, 840/240/120 theo train/val/test. Audit SHA-256 phát hiện giao hash train/val=210, train/test=109, val/test=109. Script tạo ảnh tổng hợp; các tên nguồn Kaggle/Roboflow trong metadata chưa có manifest chứng minh ảnh tải từ đó.
- **VERIFIED:** `results.csv` lưu accuracy top1/top5=1 ở epoch cuối của run năm epoch. **NOT VERIFIED:** Chất lượng trên dữ liệu độc lập/ảnh điện thoại. Không dùng kết quả này làm độ chính xác sản phẩm vì leakage và domain gap.
- **VERIFIED:** Multipart từ host tới Backend trả HTTP 201, `needs_more_info`, 5,163095 giây. **NOT VERIFIED:** Root cause `ERR_NETWORK` trên V2536A; không có máy trong `adb devices` khi kiểm tra.
- **VERIFIED:** AI face fallback trả `verified=True, confidence=.95` khi model/ảnh không dùng được; compare fallback có thể trả passed=.92 theo URL. Đây là hành vi heuristic, không phải xác thực danh tính, liveness hoặc kiểm định an toàn kỹ thuật. Giữ read-only theo phạm vi audit.

## Quyết định cần người phụ trách phê duyệt

1. **RECOMMENDED:** Ưu tiên phương án phân tầng: nhận diện category/object → hỏi triệu chứng → truy hồi dịch vụ DB; giữ CLIP pretrained làm baseline. Chưa train hay đổi weights trong đợt này.
2. **RECOMMENDED:** Thu thập tập ảnh thật được cấp quyền; chia theo hộ gia đình/thiết bị/phiên chụp trước khi augmentation; ngừng dùng split hiện tại để công bố metrics.
3. **RECOMMENDED:** Mở task riêng cho face/compare fallback theo nguyên tắc thất bại phải chuyển kiểm duyệt, vì nằm ngoài phạm vi Customer QA và Worker/FSM.
4. **RECOMMENDED:** Cấp phiên retest Android với logcat và request ID để khép CUS-QA-01; không tuyên bố đã sửa P0 từ phép thử curl.

Báo cáo chi tiết: [kiến trúc](02-current-architecture.md), [thuật toán](04-service-recommendation-algorithm.md), [dataset](05-dataset-training-audit.md), [evidence index](09-evidence-index.md).
