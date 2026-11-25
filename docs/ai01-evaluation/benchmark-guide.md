# Chạy benchmark thật và khóa thí nghiệm

## Phạm vi

Runner [runner.py](../../ai-service/eval/ai01/runner.py) load weights YOLO FixGo và CLIP cache thật; gọi **router v2 production thật** trong FastAPI TestClient, rồi truyền output mới sang [adapter JS](../../server/scripts/ai01-resolver-offline.cjs) gọi `resolveDiagnosis` source thật. Adapter chỉ có `findMany/findUnique` trên snapshot, không import Prisma, bootstrap Nest, đọc `.env`, gọi API ghi dữ liệu hay kết nối DB. Chạy symptom rules baseline với `SYMPTOM_CATALOG_ENABLED=false`; chưa hỗ trợ đánh giá catalog v3.

Không dùng `benchmark_recommendation.py`, `benchmark_fixtures.json`, predicted_cat/target_rank/service_rank/simulated_latency_ms, class từ path hay `classify_dataset.py`. Đường dẫn ảnh multipart đặt tên trung tính `image.jpg`. Không fallback sang kết quả dựng sẵn nếu model lỗi; cả YOLO và CLIP phải ready. Raw debug chứa scores và stage outcomes thật.

Dependencies dùng venv và `server/node_modules` đã có, không đổi requirements/package. Cần torch, ultralytics, transformers, OpenCV, FastAPI, httpx, pydantic và local HF cache `openai/clip-vit-base-patch32`; Node + Babel/Nest deps của server. Thiếu cache/weights thì setup failed, không tự tải/thay model. CLIP dùng offline mode; GET target backend bị hướng tới loopback port không phục vụ, dùng static fallback hiện hành.

## Smoke: kiểm công cụ, không đo độ chính xác

Chạy từ repo root, chọn thư mục output **chưa tồn tại**:

```bash
PYTHONDONTWRITEBYTECODE=1 ai-service/.venv/bin/python -B ai-service/eval/ai01/runner.py \
  --dataset docs/ai01-evaluation/artifacts/smoke-manifest.jsonl \
  --image-root ai-service \
  --catalog docs/ai01-evaluation/artifacts/taxonomy.json \
  --smoke --out /tmp/ai01-smoke-new
```

Bản đã chạy lưu ở `artifacts/smoke-run/`. Không gán ground truth cho ảnh smoke; mọi quality metric null. Text đang rỗng nên không được suy ra tác động text. Thời gian trong raw log chỉ là phép đo integration offline trên máy chạy, không latency mobile/deployment.

## Đánh giá ảnh thật

1. Gán nhãn và duyệt theo [annotation-collection.md](annotation-collection.md). Manifest phải chứa toàn bộ splits để kiểm SHA/group leakage, không chỉ truyền test subset rồi gọi nó độc lập.
2. Chạy inventory exact/pixel/near trên toàn ảnh, duyệt near pairs và điền duplicateGroup. Tạo split manifest mới với split.py; mọi device/session/site/duplicateGroup/hash dùng chung phải cùng split. Runner chặn cross-split trên các key này, kiểm hash ảnh và path nằm trong image-root, yêu cầu device/session/duplicateGroup cho train/validation/test. Công cụ không tự chứng minh ID nhóm được khai đúng.
3. Chỉ dùng train/validation để phát triển. Chọn threshold/prompt/rules bằng development, lưu rationale. Các sửa model/prompt production thuộc task sau; task này không thay đổi. Thu subset có đủ nhóm cho các lớp muốn công bố.
4. Khóa manifest, catalog, weights, CLIP cache và source bằng protocol trước khi đánh giá test. Người giữ test không tham gia điều chỉnh prompt/threshold. Ghi protocol SHA256 và thời điểm khóa vào nhật ký nghiên cứu độc lập để chứng minh chronology; file tự tạo không chứng minh chưa xem test.

```bash
ai-service/.venv/bin/python ai-service/eval/ai01/protocol.py \
  --dataset /path/frozen-all-splits.jsonl \
  --catalog docs/ai01-evaluation/artifacts/taxonomy.json \
  --weights ai-service/weights/yolov8n-cls-fixgo.pt \
  --split test --threshold 0.6 \
  --rationale 'Giữ mặc định resolver; không chọn bằng test; kèm đường dẫn development record' \
  --out /path/test-protocol.json

PYTHONDONTWRITEBYTECODE=1 ai-service/.venv/bin/python -B ai-service/eval/ai01/runner.py \
  --dataset /path/frozen-all-splits.jsonl --image-root /path/photos \
  --catalog docs/ai01-evaluation/artifacts/taxonomy.json \
  --protocol /path/test-protocol.json --out /path/new-test-run
```

`protocol.py` mở output kiểu `x`, không ghi đè. Runner kiểm hashes manifest/catalog/weights/source/CLIP trước chạy; từ chối dữ liệu chưa review hoặc synthetic/unverified trong split đánh giá. Dùng `--split validation` để lập protocol development riêng. Không tạo lại test protocol để hợp thức hóa thay đổi sau khi thấy lỗi. Nếu đã dùng test để điều chỉnh, gắn nhãn exploratory và thu holdout mới. Không dùng ảnh test để fine-tune.

Catalog hiện tại là bằng chứng lịch sử: có thể benchmark offline nhưng chưa đủ chứng minh DB active hiện hành. Muốn công bố phạm vi deployment phải bổ sung snapshot catalog có timestamp/source/active/approved đầy đủ từ quy trình riêng được phép; task này không ghi hay truy vấn DB.

## Ba nhánh và cách tách đóng góp

- **image-only:** bytes thật, description rỗng → YOLO/CLIP/fusion thật → resolver, không cấp category/target/triệu chứng GT.
- **text-only:** không đưa ảnh vào model; gọi `category_helper.match_category_by_keywords` thật, ghi `engine=heuristic`, confidence null. Resolver thật từ chối nhánh này vì chỉ chấp nhận engine=model. Không chế pixel rỗng, score 1.0 hay gắn model cho keyword. Đây là đối chứng keyword hiện có, không phải một text model đối xứng với CLIP.
- **image+text:** cùng bytes ảnh và mô tả nguyên bản → v2 thật với text boost → resolver. So trên cùng sample IDs; báo cáo raw category/target và resolver gate riêng. `pairedAblation.categoryTop1Delta` = combined minus text-only; không suy causal image gain nếu mô tả rỗng hoặc tập không cân đối. Báo thêm combined minus image-only từ bảng metric để thấy text boost.

`resolver` = phiên đầu tự động, không answers. `assistedResolver` = phiên bổ sung với observation.confirmedAnswers đã thu thực tế, báo riêng service; cả ba nhánh có cùng observed answers nếu có. Answers có categoryId có thể bypass AI theo thiết kế resolver, vì vậy metric assisted **không chứng minh ảnh đóng góp**. Runner không đọc labels để tạo prediction/answers; không cho serviceId đầu vào để tránh đánh giá chọn lại đáp án có sẵn.

## Metrics và mẫu số

`metrics.py` chuẩn hóa UUID/slug theo snapshot, không lấy predicted label có sẵn từ dataset. Những label null bỏ khỏi mẫu số tương ứng và báo n; [] cho service vẫn là negative đã review. Error giữ trong mẫu số, không đếm thành abstention hay âm thầm loại khỏi accuracy.

| Metric | Định nghĩa |
|---|---|
| Macro-F1 category/target | Mean F1 các lớp có GT support; F1=2TP/(2TP+FP+FN), miss/abstain là FN. Báo support, precision/recall/F1 từng lớp |
| Raw Top-1 | ID được model chọn khớp GT / số nhãn category/target đã review |
| Raw Top-3 | GT trong 3 candidate đầu / số nhãn đã review, kể cả khi final gate từ chối; là retrieval metric, không là quyết định accepted |
| Resolver category F1/Top-1 | Trên category cuối sau threshold/catalog, riêng raw model |
| Accepted category accuracy | Đúng / số category resolver accepted có GT; luôn đi kèm coverage |
| Category coverage | Resolver phát category / toàn ca reviewed của modality |
| Category abstention | Ca xử lý thành công nhưng không phát category / toàn ca reviewed; unavailable/transport exception là error riêng |
| Service Top-1/Top-3 | Ít nhất một service GT hợp lệ trúng vị trí đầu/trong 3 / số ca service đã review. Tập GT rỗng không tạo hit |
| Service coverage | Có suggestedService(s) / số ca service đã review; availableServices không phải prediction |
| False recommendation | Có service ngoài tập hợp lệ, hoặc phát repair khi unknown/needsInspection / số ca service đã review; báo thêm chia số ca thực sự phát service |
| Error rate | Ca có lỗi inference/resolver/adapter / toàn ca reviewed; lưu type/message và partial raw output |
| p50/p95 | Nội suy tuyến tính quantile đo bằng perf_counter/performance.now; lưu n và từng timing raw, không cộng latency fixture |

`inferenceMs` gồm đọc bytes + ASGI/decode/model/fusion, `resolverMs` là JS resolver trong bộ nhớ (không gồm Babel process startup), `totalMs` gồm giao tiếp Python→Node và assisted call nếu có. Không gọi các số này là network/mobile end-to-end. `modelSetupMs` riêng, sequence/latencyPhase đánh dấu first_request/subsequent_request. Có thể lọc raw để báo warm riêng; suite này chưa benchmark concurrency hoặc cold-start distribution. Giữ error latency riêng khi phân tích thay vì coi request lỗi nhanh là model chạy nhanh. Không có fault/symptom prediction ở production v2 nên F1 cho chúng ghi null/unsupported, không đánh giá chuỗi “Nhận diện danh mục” như visibleFault.

## Raw evidence và tái lập

Mỗi run tạo thư mục mới: `run.json` có git HEAD, hash source (bao gồm prompt/catalog/metric/adapter), config, thời gian UTC, Python/package/platform, model SHA/revision và catalog evidence. `predictions.jsonl` lưu sampleId/image hash/modality, input text/confirmed answers, ground truth, raw response, full CLIP/YOLO scores/debug stages/gates/catalog/model metadata, resolver output, lỗi và monotonic timings. `metrics.json` là phép tổng hợp lại từ raw. Dataset frozen hash liên kết provenance/review đầy đủ. Không chứa ảnh mới hay bí mật DB.

Package versions/source hash giúp truy vết; chưa có lock môi trường Python/container tái tạo bit-for-bit. Hardware/OS scheduling làm latency dao động. Lưu CPU/RAM/thread config, artifact dependency lock, lệnh và nguồn snapshot khi chạy nghiên cứu chính thức. Source path/UID trong log phải được rà trước công khai; ảnh và consent giữ trong kho riêng.

## Điều kiện còn thiếu để công bố học thuật

- Ảnh thực có quyền, ground truth độc lập/đa người, agreement và adjudication; đủ nhóm và phủ lớp đã công bố.
- Test mới sạch với dữ liệu từng train YOLO và với development; near duplicate đã duyệt; không xem kết quả test để tuning.
- Catalog active/approved và prompt/model/dependency snapshot xác minh đầy đủ; catalog v3 còn thiếu symptom/link evidence. Không tự nhận 693 service đã được kiểm đúng thực địa.
- Chạy benchmark chất lượng thật, công bố số lượng/exclusions, macro-F1/Top-k/coverage/abstention/error/false recommendation và confidence intervals theo **device/session cluster**, không bootstrap từng ảnh phụ thuộc. CI/cluster bootstrap và multi-run concurrency chưa được triển khai trong task này.
- Thí nghiệm ablation có mô tả người dùng thật, phân nhóm normal/OOD/hidden faults/unknown, báo failure modes, giới hạn pretraining contamination và text heuristic baseline.
- p50/p95 warm/cold và E2E camera–storage–API–catalog–booking trên môi trường triển khai riêng; smoke offline không thay bằng chứng này.
- Đối chiếu ngưỡng nghiệm thu, phạm vi “phát hiện sự cố” và contribution với giảng viên. Hiện model nhận category/target, chưa có đầu ra nhãn fault để chứng minh fault detection. Không có con số chất lượng nào trong task này để công bố như accuracy nghiên cứu.
