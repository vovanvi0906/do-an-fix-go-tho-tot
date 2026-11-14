# Kiểm kê model, checkpoint, dữ liệu và API

Baseline **`be082dc91bc05ff3c05177acd72fe786fc478f6a`**, branch `integration/fixgo-sprint-02`; ngày 13/11/2026, Asia/Ho_Chi_Minh. Hai commit `1a5ef38`, `a173810` là ancestor; working tree sạch trước audit.

**VERIFIED**: code/artifact hoặc phép kiểm nêu rõ; **INFERRED**: hệ quả hợp lý chưa đo; **NOT VERIFIED**: thiếu chứng cứ; **RECOMMENDED**: đề xuất chưa triển khai. “VERIFIED theo code” không có nghĩa đã khai thác live, benchmark chính xác hoặc PASS Android E2E. Evidence IDs dẫn tới file, symbol và dòng tại baseline trong [chỉ mục](13-evidence-index.md).

## Model và tensors

| Thành phần | Weights / training thực có | Input → output và đường gọi | Giới hạn xác minh |
|---|---|---|---|
| YOLOv8n classification | `weights/yolov8n-cls-fixgo.pt`; ưu tiên trước best.pt/base fallback; script fine-tune base yolov8n-cls.pt | BGR ndarray→`model.predict`→probs theo prediction.names; run imgsz=224, 6 class dataset | N×6 là cấu hình nhãn dự kiến, không deserialize checkpoint để xác nhận graph/output thực. Không phân biệt 70 target. [E22](13-evidence-index.md#e22) [E18](13-evidence-index.md#e18) [E01](13-evidence-index.md#e01) |
| YOLOv8n detection | `weights/yolov8n.pt`; downloader mô tả pretrained COCO | lifespan load; không có `.predict` detector trong diagnose; compare nhận parameter yolo_model nhưng không dùng | Box/class/score là nhiệm vụ model, không là output được tạo trong pipeline hiện tại; lý do load còn là di sản/chuẩn bị bổ trợ INFERRED. [E22](13-evidence-index.md#e22) [E46](13-evidence-index.md#e46) [E59](13-evidence-index.md#e59) |
| CLIP ViT-B/32 | Hugging Face `openai/clip-vit-base-patch32`, không thấy train riêng | Config cache: image 224×224, patch32, projection512; processor thường N×3×224×224 → ảnh/text embedding N×512 → category/target/service softmax | Code không pin revision; cache có một revision không chứng minh process dùng đúng revision. [E02](13-evidence-index.md#e02) [E03](13-evidence-index.md#e03) |
| YuNet | `face_detection_yunet_2023mar.onnx`, pretrained theo downloader | Set size ban đầu 320×320, sau đó kích thước ảnh; detect→bbox, landmarks, score (mỗi face 15 giá trị theo API OpenCV) | Không có model PAD; không loại multi-face. [E22](13-evidence-index.md#e22) [E23](13-evidence-index.md#e23) |
| SFace | `face_recognition_sface_2021dec.onnx`, pretrained theo downloader | alignCrop cho cả hai ảnh→feature→cosine; embedding 128 chiều theo tài liệu/model mô tả, không export template | Không có lưu/load embedding DB thực thi; shape ONNX local chưa inspect vì không có package onnx và không cài mới. [E23](13-evidence-index.md#e23) [E34](13-evidence-index.md#e34) |
| OpenCV comparison | Không train/weights | Resize400×400, ORB/RANSAC, SSIM, diff, brightness/Canny→score composite | `engine=model` ở đây vẫn là rule/CV, không có model chẩn đoán chất lượng sửa. [E46](13-evidence-index.md#e46) |
| Keyword/rules | `category_helper.py`, `target_helper.py`, `SYMPTOM_RULES` | Text→category/target và symptom→DB slug | Hardcoded .95 cho target từ mô tả; score không phải inference đã calibration. [E01](13-evidence-index.md#e01) [E05](13-evidence-index.md#e05) |

**VERIFIED:** [weights-manifest.json](evidence/weights-manifest.json) lưu bốn file local với bytes/SHA256. Classifier 2.974.408 bytes; detector 6.549.796; YuNet 232.589; SFace 38.696.353. Nguồn downloader là nguồn dự định, không chứng minh chain of custody; không tải weights. [clip-cache-config.json](evidence/clip-cache-config.json) ghi mean/std/crop config, không chứa embedding/ảnh người.

## Mã và dữ liệu

`main.py` entrypoint/lifespan và bốn nhóm routes; `clip_classifier.py` inference/embeddings/DB target sync; `service_catalog.py` 25 dịch vụ tĩnh trong 6 category, CLIP 7 class gồm other_unclear; target_catalog fallback. `training/prepare_dataset.py`, `train.py`, Colab notebook là công cụ; dataset có sáu class, thiếu `giup_viec` so với CLIP. `runs/` giữ run args/results/confusion matrices. `eval/` có leakage guard và contract test, nhưng classify_dataset dùng path label. `scripts/test_ui*` là UI kiểm thử; download_models không chạy trong audit. [E01](13-evidence-index.md#e01) [E02](13-evidence-index.md#e02) [E04](13-evidence-index.md#e04) [E17](13-evidence-index.md#e17) [E18](13-evidence-index.md#e18) [E19](13-evidence-index.md#e19) [E21](13-evidence-index.md#e21) [E56](13-evidence-index.md#e56) [E59](13-evidence-index.md#e59)

**VERIFIED:** requirements dùng minimum versions, thiếu direct declaration httpx/torch; Docker cài torch CPU riêng, prefetch CLIP ở build, Python3.10 base. `.venv` versions đọc lại ở [python-env.json](evidence/python-env.json); không kết luận đây là interpreter live. Không thấy lockfile Python đảm bảo tái lập toàn môi trường. [E53](13-evidence-index.md#e53) [E58](13-evidence-index.md#e58)

## API contracts

| Endpoint | Auth / input | Kết quả và side effect từ code |
|---|---|---|
| `/api/orders/diagnose` | Public; JSON imageUrl/description/answers | Resolver chỉ đọc catalog; trả manual/needs_more_info/suggested/unavailable |
| `/api/orders/diagnose-upload` | Public; multipart `image`, description, answers JSON | Cloudinary trước handler; imageUrl→resolver; không tạo order |
| FastAPI `/ai/diagnose`, alias `/api/v1/ai/diagnose` | Không thấy auth; multipart `file` hoặc JSON imageUrl | Category + target/service slugs từ AI, không DB IDs service |
| `/api/workers/verify-face-daily` | JWT WORKER; multipart image ≤5MB | Ghi timestamp WorkerProfile khi pass; reference FaceProfile |
| `/api/orders/:id/face-verify[-upload]` | JWT WORKER + ownership/stage ở service; upload thêm guard | Ghi timestamp/kycStatus; không order proof |
| `/api/ai/verify-face` | JWT, không Roles WORKER riêng | Sai thứ tự/số args client và dùng `.matched`; không ghi daily/order proof |
| FastAPI `/ai/face-verify`, alias `/api/v1/ai/verify-face` | Không thấy auth; static selfie/reference/workerId | YuNet/SFace hoặc heuristic; không DB enrollment |
| `/ai/compare-before-after`, alias `/api/v1/ai/analyze-before-after` | Before/after files hoặc urls/payload | CV rules hoặc heuristic; Backend verifyCompletion lưu score ảnh |
| `/ai/sync-targets`, `/api/v1/ai/sync-targets` | POST không thấy auth | Reload target embeddings RAM; audit không gọi vì thay runtime state |
| `/health`, `/` | GET | Cờ nạp engine, không chứng minh accuracy/security |

Nguồn contracts: [E06](13-evidence-index.md#e06) [E07](13-evidence-index.md#e07) [E24](13-evidence-index.md#e24) [E27](13-evidence-index.md#e27) [E31](13-evidence-index.md#e31) [E23](13-evidence-index.md#e23) [E46](13-evidence-index.md#e46) [E13](13-evidence-index.md#e13). Các routes `/api/ai/analyze-incident`, `/api/ai/analyze-before-after` là wrapper riêng; side effect phụ thuộc field issueDetected/completed mà response model chính không cung cấp tương ứng, không gộp với order resolver. [E32](13-evidence-index.md#e32)

## Đối chiếu audit cũ

**VERIFIED:** 23 source/config/artifact entries cũ không đổi checksum; xem [prior-audit-reconciliation.json](evidence/prior-audit-reconciliation.json). Không vì vậy tin mọi câu chữ cũ: `passed=.92` phải sửa thành `passed=true, matchScore=.92`; failure branch per-order chỉ ghi kycStatus PENDING, không ghi timestamp mới dù comment nói ngược. Snapshot hiện xác nhận 70/693 và 25 static slugs đều tồn tại, không kết luận đang có slug service giả ở DB. [E26](13-evidence-index.md#e26) [E46](13-evidence-index.md#e46)
