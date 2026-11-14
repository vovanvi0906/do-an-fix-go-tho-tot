# Kiến trúc AI hiện tại

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Phân biệt nhiệm vụ

**VERIFIED:** Classification trả phân phối nhãn toàn ảnh; detection trả vị trí vật thể; CLIP image–text similarity xếp độ tương đồng với prompt; chẩn đoán lỗi cần chứng cứ triệu chứng/nguyên nhân. Không thể gọi ba nhiệm vụ đầu là đã xác định lỗi điện bên trong.

| Thành phần | Mục đích/input → output | Checkpoint/training | Inference và hậu xử lý | Metrics/hạn chế |
|---|---|---|---|---|
| YOLOv8 classification | BGR ảnh → probs category | `weights/yolov8n-cls-fixgo.pt`; code fine-tune base `yolov8n-cls.pt` | `main.py:diagnose`, `model.predict`; chuẩn nhãn `_`, ensemble với CLIP | Run val có top1/top5; leakage khiến không suy rộng; không box/triệu chứng |
| YOLOv8 detection | Ảnh → box/class (khả năng checkpoint) | `weights/yolov8n.pt`, downloader mô tả pretrained COCO | lifespan nạp `app.state.yolo_model`; diagnose hiện không gọi detector | Chưa có mAP task FixGo; loaded không chứng minh đã tham gia diagnose |
| CLIP ViT-B/32 | Ảnh + prompt → normalized embeddings, softmax scores | Hugging Face ID trong inventory; không thấy train riêng CLIP | `_encode_image`, `_embed_prompts`, `predict_clip_full`; category/target/service | Chưa calibration, score phụ thuộc candidate set; không phát hiện lỗi chuyên biệt |
| YuNet | Ảnh mặt → landmarks/face detection score | ONNX local, OpenCV Zoo theo downloader | `face_verify`: setInputSize, detect, chọn face đầu | Chưa FAR/FRR; face detected không chứng minh liveness/danh tính |
| SFace | Hai crop đã align → embedding/cosine | ONNX local, OpenCV Zoo theo downloader | alignCrop, feature, match cosine >=.60 | Chưa kiểm chuẩn threshold tại miền dữ liệu FixGo; cosine bị clamp thành confidence |
| OpenCV so ảnh | Before/after → alignment, SSIM, histogram, diff, composite score | Không checkpoint/train | `analyze_before_after_opencv`: ORB/RANSAC, SSIM, Canny, sáng và diff; score=.35 alignment+.35 change+.30 cleanliness | Chưa ground truth kỹ thuật; ảnh khác không chứng minh sửa đạt an toàn |
| Keyword/rules | Text/answers → category/target/slug service | Bảng tĩnh | category/target helpers; Backend `SYMPTOM_RULES` | Chưa precision/recall; chỉ rule khớp dịch vụ DB đang active mới dùng |

**VERIFIED:** Model tải một lần trong lifespan, lưu app.state. CLIP giữ module globals, embeddings target được reload qua endpoint; không thấy snapshot/version catalog trong output. Hàm async chứa inference và requests đồng bộ: **INFERRED** có thể chặn event loop dưới tải; cần load test để xác minh.

## Các fallback thực tế

- **VERIFIED:** Diagnose không decode/model → engine unavailable, không confidence; Backend trả unavailable và cho chọn thủ công. Low score/category slug không khớp DB → manual_selection.
- **VERIFIED:** CLIP target sync lỗi → `TARGET_PROMPTS` tĩnh; sub-service luôn từ catalog tĩnh. Nếu category accepted nhưng không có sub-service, FastAPI lấy dịch vụ đầu danh mục và đặt confidence=score*.92; không phải dự đoán lỗi.
- **VERIFIED:** Face lỗi/không model có thể trả verified true .95; chỉ URL chứa fake/unmatched/low_confidence mới heuristic fail. Một selfie được detect có thể verified true mà chưa so danh tính. Đây không chứng minh liveness.
- **VERIFIED:** Compare không chạy được CV có thể passed true .92; URL dirty/chua_xong mới fail. Backend còn `aiFallbackHelper` khi network lỗi. Cần audit an toàn riêng, chưa sửa do giới hạn read-only AI/Worker/FSM.
