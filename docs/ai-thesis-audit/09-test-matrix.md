# 09 — Ma trận kiểm thử và kết quả audit

Ngày 19/11/2026; baseline ở [00](00-executive-summary.md). Không cài dependency, download weights, train, seed/migration/reset, upload Cloudinary, gọi mutation DB hoặc start/stop service. Không có test fake score dùng để tuyên bố model hoạt động. Các dữ liệu fixture sẵn chỉ dùng kiểm khả năng thực thi/các nhánh, không đo accuracy thực địa.

## Đã thực hiện trong audit này

| ID | Kiểm tra và đầu vào | Kết quả thực đo | Nhãn bằng chứng / giới hạn |
|---|---|---|---|
| T01 | Tìm `*.docx`/AGENTS trong workspace | Không có DOCX; AGENTS chỉ ở dependency recharts; đã hỏi và nhận toàn văn T trong hội thoại | Source/document verified; không có quy chế trường riêng |
| T02 | Git status/branch/HEAD | Sạch lúc đầu; branch `update/face-id-cho-workerapp`, HEAD `1432f67264f4d67bd5718b50642f6b4c9d5289ce` | Không checkout/reset/commit |
| T03 | Metadata deps venv + ls/hash weights | Các phiên bản, size/hash trong [02](02-current-ai-architecture.md) | Artifact existence verified; không suy ra startup deployment |
| T04 | SHA256 của 1.200 JPG train/val/test | 840/240/120 files; 646/213/114 unique; intersections 210/109/109 | FAIL tiêu chí split độc lập; không đo near-duplicate trong audit này |
| T05 | YOLO classifier thật, `sample_appliance.jpg` | Load thành công; 6 names; top1 `dien_lanh`, score .63174957 | MODEL_VERIFIED cho một inference, không accuracy |
| T06 | CLIP cache offline thật, appliance + hai text prompt | Logits shape `[1,2]`, finite; load+infer khoảng 1751 ms trong probe đơn lẻ | MODEL_VERIFIED; model ở chế độ mặc định của probe primitive, không benchmark p50/p95 production |
| T07 | `python -B -m unittest eval.test_live_inference` với offline env | **4 tests / 6.284s / OK**, không skip. Appliance, garden, face OOD, invalid path | MODEL_VERIFIED + INTEGRATION_VERIFIED cho FastAPI TestClient/v2 wrapper thật; không Nest/Cloudinary/DB/mobile. Thời gian suite gồm setup, không là latency mỗi request |
| T08 | Catalog trong T07 | Backend GET connection refused; CLIP dùng target_catalog fallback | Không thể xác nhận service/target đang có trên DB live |
| T09 | Gọi `compare_before_after` thật với request object state rỗng và payload URLs rỗng | `matchScore=.92`, `passed=true`, `engine=heuristic`, notes tuyên bố đạt/an toàn | **FAIL**, tái hiện nhánh fallback không cần ảnh/model; function-level, không HTTP binding |
| T10 | CV thật cùng ảnh `sample_before.jpg` | inliers 1000; SSIM 1; diff 0; score .42; passed false | Primitive CV chạy thật; không có nhãn sửa chữa |
| T11 | CV thật `sample_before.jpg`/`sample_after.jpg` | inliers 689; SSIM .953; diff .036; cleanliness .98; match .98; passed true | Không chứng minh việc sửa đã tốt/an toàn; chỉ output thuật toán |
| T12 | `load_face_models('ai-service/weights')` | YuNet/SFace ready true, error null, đúng pinned model version | MODEL_VERIFIED cho loader, chưa identity pair inference |
| T13 | `extract_embedding` trên `eval/images/sample_face.jpg` | `NO_FACE`; không tạo feature; không chạy genuine self-match | MODEL_VERIFIED detector trên một fixture; **NOT_VERIFIED matching accuracy**, không gán identity success |
| T14 | `configured_pad(os.environ).capabilities()` sau import main đọc config local | experimental ready true; evaluated false; threshold .85; pinned MN3 version; reference null | Loader/capabilities probe, chưa score/attack evaluation. Có child-process warning từ stdin, xem dưới |
| T15 | Đọc source Customer/Worker/client/server/AI + tài liệu cũ | Đối chiếu D/B/F IDs trong báo cáo; phát hiện face/daily/review cũ không còn đúng | Static audit; không thay runtime hoặc đo chất lượng |

**Giới hạn T14:** Python 3.14/OpenVINO probe chạy từ here-document stdin phát traceback child `multiprocessing.forkserver` do không tìm được đường dẫn `<stdin>`; process cha vẫn trả capabilities và exit 0. Không coi ready=true là test inference PAD thành công hoặc kết luận đây là lỗi production. Cần lệnh module/file có `if __name__ == '__main__'` và test timeout/worker thực trước khi kết luận. Không che cảnh báo này bằng kết quả suite khác.

T07 trả appliance category `thiet-bi` score .5271, target `lo-vi-song`; garden `lam-vuon` score .8009; face OOD không category/confidence. Test appliance chấp nhận nhiều category nên OK không chứng minh đúng thiết bị/triệu chứng. Nest default threshold .6 khác v2 threshold .48; tại mặc định case appliance phải hỏi thêm. Không lấy 4/4 làm accuracy 100%.

## Lệnh tái lập đọc-only đã dùng

T07 chạy từ `ai-service/` với dependencies/cache sẵn, không tải model:

```bash
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 PYTHONDONTWRITEBYTECODE=1 \
  .venv/bin/python -B -m unittest eval.test_live_inference
```

Hash split (chạy từ root; chỉ đọc file):

```python
from pathlib import Path
from hashlib import sha256
splits = {}
for name in ('train', 'val', 'test'):
    files = list(Path('ai-service/dataset', name).glob('*/*.jpg'))
    splits[name] = {sha256(p.read_bytes()).hexdigest() for p in files}
    print(name, len(files), len(splits[name]))
for a, b in (('train','val'), ('train','test'), ('val','test')):
    print(a, b, len(splits[a] & splits[b]))
```

T09–T11 thực thi bằng venv hiện có, import main nhưng **không chạy lifespan/server**; không gọi URL/network:

```python
import sys, asyncio
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0, str(Path('ai-service').resolve()))
import main
request = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace()))
result = asyncio.run(main.compare_before_after(
    request,
    payload=main.CompareBeforeAfterRequest(beforeImageUrl='', afterImageUrl=''),
    beforeImageUrl=None, afterImageUrl=None, beforeFile=None, afterFile=None))
print(result.model_dump())
import cv2
b = cv2.imread('ai-service/eval/images/sample_before.jpg')
a = cv2.imread('ai-service/eval/images/sample_after.jpg')
print(main.analyze_before_after_opencv(b, b))
print(main.analyze_before_after_opencv(b, a))
```

Request `SimpleNamespace` chỉ cung cấp context của lời gọi hàm, không thay thuật toán hoặc dựng inference output; T09 không phải route HTTP integration. Numeric outputs ở bảng là quan sát từ lần chạy hiện tại; có thể chênh theo dependency/hardware, không tự đặt số làm expected quality score.

## Chưa thực hiện: ma trận cần cho nghiệm thu

| ID | Case cần kiểm | Kỳ vọng hợp lý / evidence cần thu | Hiện trạng |
|---|---|---|---|
| N01 | Customer camera/gallery → upload → AI → active DB IDs → booking | Bytes/resource thật, requestId liên tục, đúng dịch vụ/giá, lưu ISSUE đúng đơn | NOT_VERIFIED |
| N02 | Model missing/load fail/corrupt weights/decode fail/AI offline | Diagnosis unavailable, không success/confidence giả, manual selection dùng được | Source có cho diagnosis, chưa fault injection E2E |
| N03 | Model uncertain/OOD/normal ảnh thật, text trái ảnh | Abstain hoặc hỏi thêm, provenance đúng, đo false recommendation | Một fixture OOD đạt; thực địa NOT_VERIFIED |
| N04 | Service/target inactive, mismatch, không tồn tại DB | Không publish/booking ID không hợp lệ; giá luôn server | Source guard có; DB integration NOT_VERIFIED |
| N05 | Before/After thiếu ảnh, URL hỏng, AI offline, payload thiếu score | Không tự passed; hiển thị cannot assess/manual | **FAIL theo T09/source**; cần sửa trước nghiệm thu |
| N06 | Cùng thiết bị khác góc/sáng, khác thiết bị, ảnh cũ, sửa ẩn, làm hỏng thêm | Đối chiếu nhãn người; abstain khi không đủ ảnh, không suy an toàn từ similarity | NOT_VERIFIED |
| N07 | BEFORE/AFTER camera thật + thời điểm/ownership/storage | BEFORE ARRIVED, AFTER sau start; persistence/ACK/retry/relaunch đúng | BEFORE source có; AFTER route job NOT_IMPLEMENTED |
| N08 | Customer accept/dispute khi AI uncertain/offline | Khách quyết định, server owner/FSM; không tự settled từ AI pass | Source có quyền; E2E NOT_VERIFIED |
| N09 | Genuine/impostor/no face/multiple face/blur/crop/light | Không proof khi mismatch/quality fail; ghi decision/reason, đo FMR/FNMR/FTA | Source có; người thật NOT_VERIFIED |
| N10 | Print/screen/video replay/camera injection | Đo PAD theo threat/thiết bị, không claim chống mọi tấn công | NOT_VERIFIED; experimental không thay evaluated |
| N11 | Face wrong token/worker/session/template/model/malformed result | Fail-closed, không proof/timestamp mới | Source validation có; chưa runtime ở task này |
| N12 | Face proof hết hạn/revoke/đổi account/order/race/double Start | DB clock, scope/epoch, consume một lần, rollback nếu BEFORE/quote sai | Source có; DB concurrency NOT_VERIFIED |
| N13 | Enrollment → verify nhiều lần → reset/revoke | Không ghi đè template lúc verify; version tăng/reset đúng, storage/crypto không lộ | Source có; người thật/DB NOT_VERIFIED |
| N14 | Main lifespan/container cold start + model health | Từng capability ready, đúng entrypoint; face-only không quảng cáo diagnosis | NOT_VERIFIED |
| N15 | Model benchmark cold/warm/concurrent | Raw monotonic timings, p50/p95, failure/unavailable rates, model/catalog hash | NOT_VERIFIED; không dùng latency fixture |
| N16 | Payment → commission → worker wallet, retry/concurrency | Chứng từ provider/sandbox + ledger đúng, không cộng lặp; đầy đủ chuẩn đầu ra T | Ngoài kiểm thử AI hiện tại, NOT_VERIFIED |

## Các kết quả lịch sử không tái xác nhận

`docs/worker-implementation/09-progress-tracker.md`, `10-arc01-report.md`, `docs/faceid/SELF-ENROLLMENT-IMPLEMENTATION.md`, `EXPERIMENTAL-PAD-FLOW.md` có kết quả suites/backend/disposable DB/mobile mocks. Audit này đọc để đối chiếu và nhận diện phạm vi; không rerun, không cộng số pass lịch sử vào T07, không xem fixture proof/PAD gateway là matching thực.

Trong `eval/test_face_security.py` và một phần `test_face_models.py`, Detector/Recognizer/decoded images là fake/patch: TESTED_WITH_MOCK khi suite đó thực thi; trong audit này execution mới của chúng là NOT_VERIFIED. API/Prisma integration cũ có thể INTEGRATION_VERIFIED trong baseline/môi trường đã ghi, không chứng nhận branch hiện tại hoặc deployment.

**Kết luận:** source/artifact và primitive đã có bằng chứng hẹp; chưa có đủ integration E2E hoặc dataset độc lập để công nhận cả ba chức năng AI hoàn thành. Báo cáo không tạo hay suy ra tỷ lệ chính xác mới.
