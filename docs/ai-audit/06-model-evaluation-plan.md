# Kế hoạch đánh giá định lượng

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Test set độc lập — RECOMMENDED

Thu ảnh có quyền sử dụng, ghi source/license/consent, household_id, device_id, capture_session_id, timestamp, camera và catalog_version. Chia theo nhóm household/device/session để ảnh cùng thiết bị không vào cả train/test; dedup SHA-256 và perceptual similarity có reviewer. Test đóng băng, không chỉnh prompt/ngưỡng bằng test. Nhãn category, target, triệu chứng thấy được/khách khai, tập service ID chấp nhận được, healthy/unknown, chất lượng ảnh và nhiều thiết bị; hai người gán nhãn và phân xử bất đồng. Số ảnh tối thiểu phải theo coverage/CI và nguồn lực, không lấy số giả làm dataset hiện có.

| Phép đo cần làm | Cách tính/ghi nhận |
|---|---|
| Category Accuracy, macro/micro F1 | Nhãn đúng/tổng; báo từng class, confusion matrix và abstention riêng |
| Target Accuracy/F1 | Cả end-to-end và conditional khi category đúng; không che lỗi upstream |
| Detection precision/recall/mAP | Chỉ đo nếu box phục vụ chọn nhiều thiết bị; annotation box và IoU rõ; pipeline hiện không dùng detector |
| Service Recall@1/3/5 | Có giao top-k với tập service được annotator chấp nhận; chốt catalog snapshot, không dùng nhãn prompt làm truth |
| Đúng target sai service | Số dự đoán target đúng nhưng service ngoài tập chấp nhận / số target đúng; thêm tỷ lệ toàn bộ |
| Abstention/manual | Tỷ lệ needs_more_info, manual_selection, unavailable; cùng accuracy trên phần accepted |
| CPU latency p50/p95 | Cố định CPU/RAM/thread/model hash; warmup, đủ mẫu; tách upload, download, preprocess, encode, DB và E2E |
| Timeout/failure rate | Request timeout/HTTP lỗi/contract lỗi trên tổng, timeout budget cố định; phân loại Cloudinary/AI/network |
| Calibration | Reliability diagram, ECE, Brier score khi score có nghĩa xác suất; không coi softmax thay đổi theo catalog là certainty |
| Catalog growth | Snapshot trước/sau thêm target/service; tập cũ và đối tượng mới; đo hồi quy ranking và OOD |

**RECOMMENDED:** Chạy baseline YOLO-only, CLIP-only, ensemble và category/object + user symptom; cùng tập ảnh, không thay metadata filename để cứu nhãn. Bootstrap CI theo device/session; báo seed và số mẫu. Acceptance criteria phải chốt với chủ nhiệm trước khi mở test, đặc biệt lỗi nguy hiểm điện và abstention.

**VERIFIED:** eval_cls có guard leakage; audit_dataset exit 1 trên dữ liệu hiện tại. classify_dataset dùng path_normalization/keyword_rescue/conf=.92, không phù hợp đo khả năng nhận diện từ pixel. benchmark.py tạo ảnh tổng hợp và kiểm score>=.6, không đo đúng dịch vụ và không phải chứng minh safety.

**NOT VERIFIED:** Các metric thực địa nêu trên, latency p95 production, failure rate dài hạn, chất lượng sau thêm catalog. 12 request tổng hợp tuần tự chỉ là smoke trace; không phải benchmark CPU có kiểm soát.
