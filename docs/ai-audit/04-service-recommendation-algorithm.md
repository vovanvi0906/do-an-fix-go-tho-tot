# Audit thuật toán đề xuất dịch vụ

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Category và score

**VERIFIED:** CLIP encode prompt từng class, chuẩn hóa L2, lấy trung bình rồi chuẩn hóa lại. Với image embedding z và text embedding t, logits = exp(logit_scale) × z·t; softmax theo candidate set. Không phải xác suất lỗi đã calibration.

**VERIFIED:** YOLO classification trả probs category. Khi hai model đồng thuận hoặc chưa giải quyết xung đột, code bỏ other_unclear khỏi YOLO rồi chuẩn hóa lại; trọng số model tỷ lệ bình phương top confidence: w_clip=c_clip²/(c_clip²+c_yolo²). Score = w_clip*p_clip + w_yolo*p_yolo_renormalized. Các nhánh override dùng .40/.50/.60/.65 và chênh .18. Form description có thể cộng .35 (cap 1) cho một class, không chuẩn hóa lại cả vector.

**VERIFIED:** Acceptance dùng minimum .48 nếu source chứa clip/text hoặc margin>=.15, nếu không .55; margin .10 với clip/text, nếu không CLIP_MIN_MARGIN mặc định .15. Backend áp thêm .6. `CLASSIFIER_MODE` và `CLIP_MIN_CONF` được cấu hình nhưng diagnose không dùng để chọn model/ngưỡng như tên gợi ý. **NOT VERIFIED:** Có benchmark tối ưu các hằng số này hay confidence calibration.

## Đối tượng, triệu chứng và dịch vụ

| Câu hỏi | Kết luận có giới hạn |
|---|---|
| YOLO hay CLIP nhận đối tượng? | **VERIFIED:** CLIP target embeddings; YOLO classifier chỉ category. Detector được nạp nhưng không gọi trong diagnose. |
| Có model lỗi riêng? | **VERIFIED:** Không thấy checkpoint/head/label triệu chứng riêng trong pipeline đang đọc. Dịch vụ là prompt similarity hoặc fallback; **NOT VERIFIED:** chẩn đoán lỗi thực địa. |
| Ảnh thiết bị không hỏng? | **VERIFIED:** Không có bộ phân loại healthy/fault riêng. Backend vẫn yêu cầu triệu chứng/dịch vụ, nhưng FastAPI có thể gợi ý static service từ thiết bị lành. |
| CLIP so sánh gì? | **VERIFIED:** Cả category, đối tượng từ DB/fallback và prompt dịch vụ tĩnh; không phải embedding đủ 693 dịch vụ DB. |
| DB sync 70 targets? | **VERIFIED:** fetch /service-targets lấy slug/category/aiPrompts; fallback prompt tên thiết bị nếu thiếu. Số thực runtime cần snapshot; health 6/6 không chứa số target. |
| Target filter? | **VERIFIED:** Softmax toàn bộ targets rồi mới lọc category hint; nếu không ứng viên phù hợp thì lấy global argmax. Không renormalize sau lọc. |
| Service filter/ranking? | **VERIFIED:** CLIP rank toàn bộ services tĩnh trong category; không filter theo target vừa nhận. `predict_clip_full` còn ghi đè target của service bằng target_info. Có thể đúng targetName nhưng service thuộc đối tượng khác. |
| Backend filter? | **VERIFIED:** Active categoryId và serviceId membership; rule symptom slug tồn tại. Không filter targetId trong resolver; availableServices không trả targetId. |
| Có ID bịa không? | **VERIFIED:** AI trả slug trong bảng tĩnh, có thể lệch DB; Backend không tin slug service đó, chỉ trả ID DB khách/rule xác nhận. Không chứng minh endpoint AI dùng trực tiếp bởi client khác an toàn tương tự. |
| Confidence thấp? | **VERIFIED:** Category null/manual; unavailable khi không engine; có chọn lại. Target/service confidence không được Backend dùng để quyết định. |
| Sai triệu chứng/nguy hiểm điện? | **INFERRED:** Tương đồng ngoại hình dễ gợi dịch vụ sai triệu chứng, nhất là lỗi ẩn. **RECOMMENDED:** Giữ quyền sửa của khách, hỏi triệu chứng và chuyển kiểm tra tại chỗ khi không đủ bằng chứng; không hiển thị hướng dẫn thao tác điện từ score. |

## Thử nghiệm và tình huống đại diện

**VERIFIED:** Đã chạy inference live với 12 ảnh tổng hợp có sẵn (hai ảnh mỗi class). Không sinh dữ liệu mới, không train, không thay weights. Kết quả/latency từng ảnh ở [live-synthetic-cases.json](evidence/live-synthetic-cases.json); bảng tự động nằm dưới. Đây là smoke test trên dữ liệu có leakage, không công bố accuracy tổng quát.

| Tình huống cần ảnh thật | Trạng thái | Điều cần xác minh |
|---|---|---|
| Ổ cắm cháy nhìn thấy | NOT VERIFIED | target ổ cắm; triệu chứng cháy được khách xác nhận |
| Ổ cắm bình thường không điện | NOT VERIFIED | không suy ra cháy/chập từ ảnh lành |
| Công tắc bình thường | NOT VERIFIED | không tự gán lỗi khi không có triệu chứng |
| Máy lạnh chảy nước | NOT VERIFIED | tách nhận thiết bị và bằng chứng nước |
| Máy lạnh không lạnh, mặt ngoài bình thường | NOT VERIFIED | hỏi triệu chứng, không đoán thiếu gas |
| Ống nước rò nhìn thấy | NOT VERIFIED | target và vị trí nước, xác nhận service |
| Tủ lạnh cạnh máy giặt | NOT VERIFIED | nhiều thiết bị; hỏi chọn target cần sửa |
| Ảnh chân dung/vật nuôi sai ngành | NOT VERIFIED | abstain/other_unclear |
| Ảnh tối, nhòe hoặc bị che | NOT VERIFIED | yêu cầu chụp lại hoặc chọn tay |
| Thiết bị mới chưa có prompt | NOT VERIFIED | cập nhật catalog không tạo ID giả |
| Vườn không có sự cố | NOT VERIFIED | nhu cầu bảo dưỡng do khách chọn, không gọi là hỏng |
| Bếp có mã lỗi nhưng ảnh khó đọc | NOT VERIFIED | không tự nhận OCR khi pipeline không có OCR |

Dataset tổng hợp không cung cấp ground truth hợp lệ cho các tình huống này; không thay ảnh bằng dữ liệu tự tạo rồi báo kết quả thật.

## Output inference live đã ghi nhận — VERIFIED

| Ảnh tổng hợp có sẵn | Category trả về | Score | ms |
|---|---|---|---|
| `ai-service/dataset/test/dien_lanh/dien_lanh_0001.jpg` | dien-lanh | 0.9968 | 206.37 |
| `ai-service/dataset/test/dien_lanh/dien_lanh_0002.jpg` | dien-lanh | 0.9968 | 113.3 |
| `ai-service/dataset/test/lam_vuon/lam_vuon_0001.jpg` | lam-vuon | 0.9812 | 99.48 |
| `ai-service/dataset/test/lam_vuon/lam_vuon_0002.jpg` | lam-vuon | 0.9887 | 103.6 |
| `ai-service/dataset/test/other_unclear/other_unclear_0001.jpg` | None | 0.2949 | 86.73 |
| `ai-service/dataset/test/other_unclear/other_unclear_0002.jpg` | dien-lanh | 0.519 | 90.82 |
| `ai-service/dataset/test/sua_dien/sua_dien_0001.jpg` | sua-dien | 0.9999 | 87.07 |
| `ai-service/dataset/test/sua_dien/sua_dien_0002.jpg` | sua-dien | 0.9999 | 103.27 |
| `ai-service/dataset/test/sua_nuoc/sua_nuoc_0001.jpg` | sua-nuoc | 0.9419 | 87.55 |
| `ai-service/dataset/test/sua_nuoc/sua_nuoc_0002.jpg` | sua-nuoc | 0.9078 | 85.52 |
| `ai-service/dataset/test/thiet_bi/thiet_bi_0001.jpg` | thiet-bi | 0.9316 | 96.6 |
| `ai-service/dataset/test/thiet_bi/thiet_bi_0002.jpg` | thiet-bi | 0.9344 | 109.32 |

**VERIFIED:** `other_unclear_0002.jpg` được gợi ý điện lạnh, còn ảnh other_unclear đầu abstain. Không suy tỷ lệ lỗi sản phẩm từ hai ảnh; đây là ví dụ failure thực của pipeline trên ảnh tổng hợp. Các request đều HTTP 200; không có ground truth symptom/service độc lập.
