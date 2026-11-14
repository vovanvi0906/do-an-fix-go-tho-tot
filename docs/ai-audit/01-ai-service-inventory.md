# Kiểm kê mã nguồn và tài nguyên AI

Ngày lập: 13/11/2026 (Asia/Ho_Chi_Minh). Baseline: `integration/fixgo-sprint-02`, HEAD `5baac7bfb97e4349eee263af7520a001792fff78`.

Quy ước: **VERIFIED** = xác nhận bằng code/artifact hoặc phép thử được nêu; **INFERRED** = suy luận còn cần kiểm chứng; **NOT VERIFIED** = chưa đủ bằng chứng; **RECOMMENDED** = đề xuất, chưa triển khai. VERIFIED về code không đồng nghĩa PASS E2E hoặc độ chính xác thực địa.

## Cấu trúc và trách nhiệm

| File/thư mục | Trách nhiệm xác nhận từ code |
|---|---|
| `main.py` | FastAPI app, lifespan, schema; diagnose, compare, face, sync, health; aliases `/api/v1/ai/*` |
| `clip_classifier.py` | Load Hugging Face CLIP, embedding chuẩn hóa, prompt averaging, DB target sync, similarity/softmax |
| `category_helper.py` | Chuẩn hóa category, keyword và suy nhãn từ path; không phải model |
| `target_helper.py` | Keyword đối tượng từ mô tả |
| `target_catalog.py` | Target prompts fallback tĩnh |
| `service_catalog.py` | Category prompts và dịch vụ/giá/slug tĩnh; không phải toàn bộ catalog DB |
| `training/prepare_dataset.py` | Vẽ ảnh OpenCV, xây split; hàm build xóa dataset cũ — không chạy trong audit |
| `training/train.py` | Fine-tune YOLO classify rồi copy best checkpoint |
| `training/train_colab.ipynb` | Hướng dẫn Colab; execution count trống trong các cell đầu, không là chứng cứ run hiện tại |
| `scripts/download_models.py` | URL tải detector/YuNet/SFace; không chạy audit |
| `scripts/test_ui.html`, `.test.cjs` | UI thử dịch vụ và kiểm tra bằng Node |
| `eval/audit_dataset.py` | Đếm file/hash và leakage exact giữa split |
| `eval/test_diagnose_contract.py` | 5 test deterministic qua AST endpoint, không nạp model |
| `eval/eval_cls.py` | Đánh giá classifier; chặn khi dataset leakage |
| `eval/classify_dataset.py` | Batch classifier có path hint và confidence .92; không dùng làm benchmark pixel độc lập |
| `eval/benchmark.py` | Sinh ảnh tổng hợp, thử endpoint, ghi kết quả; smoke test, không là test set thực địa |
| `weights/` | Bốn checkpoint local; manifest SHA-256 kèm theo |
| `runs/classify/fixgo_cls_v1/` | args.yaml, results.csv, confusion matrices, ảnh batch, best/last checkpoint |
| `dataset/{train,val,test}` | Sáu class, ảnh JPEG và metadata nguồn tự khai |
| `yolov8n-cls.pt` | Base classifier tại root; fallback có kiểm tra tồn tại |
| `requirements.txt`, `Dockerfile` | Dependencies và container chạy Uvicorn CPU |

**VERIFIED:** Danh sách toàn bộ 23 file nguồn/config/notebook/log dạng văn bản, số dòng, checksum và symbol nằm trong [source-inventory.json](evidence/source-inventory.json). File nhị phân/dataset được kiểm riêng trong manifests. Thư viện `.venv` và cache bytecode không được coi là mã ứng dụng.

## Môi trường và dependencies

**VERIFIED:** Requirements dùng lower bound, không lock phiên bản; Docker base Python 3.10-slim, cài torch/torchvision từ index CPU; build image tải CLIP từ Hugging Face. Runtime `load_clip` dùng `from_pretrained` không pin revision, có thể dùng cache hoặc tải nếu thiếu. `httpx` và `torch` được import trực tiếp nhưng không khai trực tiếp trong requirements (torch được Docker cài riêng).

Phiên bản trong `.venv` đọc bằng importlib.metadata: [python-environment.json](evidence/python-environment.json). **NOT VERIFIED:** Đây có phải chính interpreter của process live hay container production không; snapshot metadata không phải lockfile tái lập.

## Weights và nguồn

**VERIFIED:** [weights.json](evidence/weights.json) ghi kích thước/SHA-256 cả checkpoint run và deploy. Detector 6.549.796 byte; classifier FixGo 2.974.408 byte; YuNet 232.589 byte; SFace 38.696.353 byte. Các URL trong downloader chứng minh nguồn dự định (Ultralytics assets/OpenCV Zoo), chưa chứng minh chain of custody của từng byte local. Ngưỡng minimum size của downloader YuNet là 300.000 byte, lớn hơn file hiện có; đây là lệch kiểm tra kích thước cần rà soát.

**VERIFIED:** CLIP ID `openai/clip-vit-base-patch32` trong code. **NOT VERIFIED:** Revision Hugging Face dùng cho run hiện tại, license manifest từng ảnh và annotation thực địa, artifact registry, lineage chắc chắn giữa checkpoint deploy và dataset được ghi metadata. Không mở pickle weights bằng cơ chế deserialize không cần thiết; hash so sánh là bằng chứng an toàn hơn.
