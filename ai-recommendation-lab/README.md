# FixGo Recommendation Lab

Web độc lập cho developer QA của AI Recommendation V3. Không tạo đơn, không sửa catalog, không gọi catalog sync. Chỉ upload ảnh khi người kiểm thử chủ động chạy; backend hiện lưu ảnh vào Cloudinary.

```bash
cd ai-recommendation-lab
npm ci
npm run dev
```

Mở http://127.0.0.1:5178. Vite chỉ bind loopback. Backend mặc định `http://127.0.0.1:3000/api`, AI `http://127.0.0.1:8000`. Đổi origins bằng biến môi trường của shell:

```bash
LAB_BACKEND_ORIGIN=http://127.0.0.1:3100 LAB_AI_ORIGIN=http://127.0.0.1:8100 npm run dev
```

Proxy `/backend` → backend `/api`; `/inference` → AI. Không cần CORS cho local dev. Kết nối API trên UI cho phép đổi base và nhập token chỉ trong bộ nhớ. Token chỉ gửi tới backend. Nếu dùng URL khác origin trực tiếp, phải cấu hình CORS phía service. Build tĩnh không chứa proxy: reverse proxy phải triển khai hai prefix tương tự khi dùng `npm run preview`/hosting. Không public Lab hoặc AI endpoint bằng `--host 0.0.0.0`.

## Luồng kiểm thử

1. Chọn JPG/PNG/WebP ≤10 MB; mô tả tùy chọn; chạy phân tích. Kiểm signature và giải mã ảnh trong browser. Backend upload và V2 inspector là **hai inference độc lập**, chạy song song.
2. Model inspector xem V2 fusion/top-K. Nút V1 inspector chạy **lần thứ ba độc lập** để lấy `clip_probs`, `all_probs`; không gán kết quả này thành intermediate telemetry của V2. Confidence giữ nguyên API; không đổi threshold.
3. Diagnosis inspector chọn category nếu cần, chọn target, **xác nhận thiết bị**, sau đó lấy triệu chứng từ public endpoint. API đã lọc APPROVED/active nhưng không expose hai trường đó; UI nêu rõ trạng thái này dựa contract.
4. Chọn tối đa 10 triệu chứng; lấy tối đa 3 dịch vụ. Response bị từ chối nếu service inactive, khác category/target, không liên quan symptom, sai provenance hoặc hơn 3. Không có mapping thì ghi `NO_ACTIVE_MAPPING`; lỗi flag/data hiển thị đúng stage.
5. Debug xem model/catalog reachability, timeline, status, ID server nếu có, ID client riêng và raw response đã redact. Thời gian đo client gồm network; không suy ra latency từng model. GET service-categories thành công là bằng chứng catalog đọc được DB, không thay kiểm tra DB độc lập.

## Benchmark

Bắt đầu từ `manifest.example.json`, thay toàn bộ placeholder bằng ground truth đã review. `provenance` do chủ dataset khai `real` hoặc `synthetic`; Lab không tự xác minh nguồn ảnh. Không dùng fixture benchmark cũ để tuyên bố chất lượng inference.

Chọn manifest JSON và thư mục ảnh. `image` là path tương đối từ **bên trong** thư mục đã chọn; không URL, absolute path hoặc `..`. Browser hỗ trợ `webkitdirectory` (Chromium/Firefox hiện đại) là cần thiết. Tối đa 1.000 sample mỗi run.

Mỗi sample: validate/hash ảnh → V2 HTTP inference → backend upload/inference/catalog → xác nhận target **do backend gợi ý**, không thay bằng target ground truth → validate symptom IDs đã được người dùng khai báo → GET recommendations. Không lấy `serviceIds` ground truth làm predictions. Với sample OOD, đặt category/target null và hai mảng IDs rỗng. Với category/target-only, để serviceIds/symptomIds rỗng.

Metrics:

- Category accuracy: V2 accepted category slug so với ground truth; abstention null được tính đúng khi GT null.
- Target top-3: V2 top-3 target IDs/slugs, alias canonical từ catalog cùng category khi có; chỉ mẫu GT target khác null. Không dùng backend target thay V2 prediction.
- Service recall@3: macro average `|GT ∩ predicted[:3]| / |GT|`, chỉ sample có GT services; dựa backend mapping sau xác nhận target gợi ý và lời khai symptom của manifest.
- Accuracy/recall giữ tất cả mẫu đủ GT trong mẫu số, kể cả lỗi; prediction đã quan sát trước lỗi vẫn được giữ. Error rate/count tách riêng.
- Abstention: chỉ sample hoàn tất không lỗi; `engine=model` và V2 không accepted category. Offline/model unavailable là lỗi.
- Latency p50/p95: nearest rank trên end-to-end sample gồm validation/upload/network/catalog. `inferenceMs` đo HTTP V2, không phải pure compute. Không cộng thời gian simulated.

Results lưu per sample với thời gian, model version khai báo, weights/ảnh hash khi khả dụng, source dataset, predictions, lỗi/stage và traces. Trong browser benchmark chỉ có hash ảnh; weights hash chỉ có trong CLI smoke evidence. Save local/Restore dùng localStorage, chỉ khi chủ động bấm; token/ảnh/mô tả không được lưu. JSON có metrics + rows; CSV có rows/metrics từng sample và chống formula injection. Không gộp các run khác model/provenance khi so sánh; JSON mỗi sample giữ version để lọc. Stop dừng sau request/sample hiện tại; không giả vờ hủy upload đã gửi.

## Kiểm thử

```bash
npm test
npm run build
```

Tests dùng HTTP/model doubles, được đặt riêng trong `tests/`; không phải benchmark evidence. Real-pixel smoke runner: xem [báo cáo bàn giao](../docs/ai-labs/recommendation-lab-report.md).

## Runtime QA (AI-REC-LAB-02)

Có bootstrap test trong `runtime/` để mount production diagnosis/catalog controllers mà không khởi động toàn bộ order/queue runtime. DB operations luôn được bọc transaction read-only. AI adapter chỉ load CLIP/YOLO offline, không chạy main Face lifespan. Config hiện hữu được đọc vào memory qua `LAB_CONFIG_FILE`; không tự đổi shared flag/migrate/approve.

Xem [báo cáo Lab-02](../docs/ai-labs/recommendation-lab-report.md) để replay, endpoint/test matrix và screenshot Chromium desktop/mobile. Các scripts HTTP/browser thật có upload ảnh synthetic vào Cloudinary đã cấu hình. Approved symptom/service success vẫn cần DB test có schema và catalog đã được chủ dữ liệu duyệt.

## Runtime đầy đủ với fixtures TEST (AI-REC-LAB-03)

[Final report](../docs/ai-labs/recommendation-lab-final-report.md) là runbook hiện hành. DB test: `127.0.0.1:55448/fixgo_recommendation_lab`, container `fixgo-rec-lab03-postgres`, hoàn toàn khác DB chính. `runtime/test-db.cjs` guard identity trước ghi, tạo baseline catalog-only + migration symptom thật, copy catalog public read-only, upsert deterministic TEST fixtures và tạo token local nếu chưa có. Không tự approve production.

Sau khi DB sẵn sàng, chạy backend với `LAB_DATABASE_MODE=isolated`; flag được bật chỉ trong process test. AI `runtime/ai.py` dùng weights/cache local và cùng test catalog. Proxy Vite tới :3108/:8108. Xem final report để lấy đầy đủ lệnh và đường dẫn dependency trên máy này.

Chọn category **Làm vườn**, target **Cây bóng mát / Cây lớn** và các symptom `[TEST] one / three / many / empty` để kiểm tra lần lượt 1/3/cap3/empty. Price/reason đến từ DB test. Đổi target sẽ reset downstream.

Trong Model inspector hoặc Debug, nút **Đo telemetry cùng request** gọi endpoint internal có auth. Token debug riêng được sinh tại `.runtime/debug-token` (ignored, mode 0600); nhập trong Bearer token của phiên UI. Không lưu/chia sẻ token trong export hoặc report. Endpoint default-off và luôn tắt ở production. Tùy chọn **Thu model/config telemetry cho benchmark** chạy thêm một inference có nhãn `telemetrySampledSeparately=true`, không giả là telemetry trung gian của request V2 khác.

Benchmark bổ sung target top1, false recommendation count, failure rate và fingerprint/config/catalog metadata. Manifest version 2 kiểm tra source/review/hash và train/eval leakage, đối chiếu SHA ảnh thật khi chạy. Version 1 smoke cũ vẫn tương thích. Xem [real-photo protocol](../docs/ai-labs/real-photo-benchmark.md). Chưa có reviewed real-photo dataset: **BLOCKED_DATA**, không dùng metric synthetic để tuyên bố chất lượng thực.

`.runtime/` chứa SQL sinh tự động, fixtures và token local; không stage thư mục này. Dừng chỉ PID/container do phiên test tạo, không dùng pkill pattern rộng hoặc port/runtime của agent khác.
