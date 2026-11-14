# FixGo AI Recommendation V3 — implementation report

> Cập nhật Phase C ngày 14/11/2026: code/schema/API/Admin/Customer và disposable tests đã triển khai trên `feat/ai-recommendation-v3-phase-c`. Xem [báo cáo Phase C](phase-c-implementation-report.md). Các mục Phase C trong báo cáo dưới đây là thiết kế tại mốc A/B; database dự án vẫn chưa migrate/import.

Ngày: 14/11/2026 (Asia/Ho_Chi_Minh). Repository triển khai: `/home/vanvi/Work/do-an-fix-go-tho-tot`, branch `integration/fixgo-sprint-02`, base HEAD `b50075f`. Không push/merge/commit tự động.

## 1. Phạm vi và trạng thái

Đã triển khai Phase A/B trong working tree: chuẩn hóa target, validation theo target, bỏ stale target local, xác nhận thiết bị trước triệu chứng, tối đa 3 thẻ gợi ý (hiện chọn 1 exact match), danh sách thủ công riêng có search theo target, retry và chống response cũ. Đây là kết quả automated/catalog integration; **chưa nghiệm thu thao tác Android thật**.

Đã đọc toàn bộ đặc tả thực tế tại `ai-recommendation/fixgo-ai-recommendation-v3-update-plan.md`. Đường dẫn `docs/ai-recommendation/fixgo-ai-recommendation-v3-update-plan.md` trong yêu cầu chưa tồn tại. Giữ nguyên thư mục đặc tả chưa được git track của người dùng. Workspace IDE ban đầu là worktree S03 khác; không sửa worktree đó.

Phase C chỉ là đặc tả dưới đây; không sửa Prisma schema, không chạy migration/disposable migration/seed/reset/db push. Dùng skill `.agents/skills/db-migration/SKILL.md` để xem hướng dẫn quan hệ và an toàn; yêu cầu chỉ thiết kế của người dùng được ưu tiên hơn các bước đồng bộ DB trong skill. Phase D kiểm tra artifact và dataset hiện có, không train/download model.

## 2. Audit pipeline và root cause HTTP 400

### Call path thực tế

1. `AiScanModal.tsx` gọi `diagnoseIssueImage(uri)`.
2. `aiService.ts`: URI local → multipart `/orders/diagnose-upload`, chứa `image`, `description`, JSON `answers`. URL remote → JSON `/orders/diagnose`.
3. `OrdersController.diagnoseUpload`: Cloudinary incident storage lấy URL ảnh, parse answers; cả hai route gọi cùng `OrdersService.diagnose` → `resolveDiagnosis`. HTTP 201 là mặc định POST NestJS, không chứng minh đúng model và không đồng nghĩa đã tạo đơn.
4. Khi chưa chọn category, `FastApiAiClient.diagnoseIncident` thử `/ai/v2/diagnose`, lỗi/response không dùng được mới thử `/ai/diagnose` V1, tuần tự. V2 thành công sẽ return ngay, **không có hai response V1/V2 cùng ghi state** ở client này.
5. FastAPI V2 decode ảnh → CLIP + YOLO category fusion → match target theo category bằng embedding → response V2. Catalog backend không đọc được sẽ dùng `TARGET_PROMPTS` dự phòng.
6. Khi người dùng chọn category/target/symptom/service, resolver dùng catalog DB, bỏ qua inference nếu đã có `answers.categoryId`. Endpoint này không gọi tạo order.

### Lỗi tái hiện được từ implementation

Trước sửa, target matcher trả `meta.id || key`: catalog DB có UUID, static fallback chỉ có slug. Resolver trả nguyên `ai.suggestedTargetId` cho Customer khi chưa có target người dùng xác nhận. UI gửi lại giá trị này trong `answers.targetId`, nhưng resolver chỉ tìm `targets.find(t => t.id === answers.targetId)`. Vì vậy target slug hợp lệ về ngữ nghĩa bị từ chối: **`Thiết bị không thuộc danh mục`**. Đây là lỗi contract slug ↔ database ID, không phải bằng chứng model train sai.

Ví dụ catalog thật (đọc trong transaction `SET TRANSACTION READ ONLY`):

| Trường | Giá trị |
|---|---|
| Category ID | `8ba77998-c7aa-4b53-875f-b14b8fba78f7` |
| Target ID | `521d7ce8-9e72-492e-b0cd-4eb88508f58d` |
| Target slug | `tu-lanh-tu-lanh-side-by-side` |
| Target name | Tủ lạnh / Tủ lạnh side-by-side |

Payload trước sửa có thể là `{categoryId: "8ba77998-c7aa-4b53-875f-b14b8fba78f7", targetId: "tu-lanh-tu-lanh-side-by-side"}`. Sau sửa response gợi ý chỉ phát UUID thuộc category active; request xác nhận dùng UUID trên. AI target unknown/ngoài category bị loại, không tự lấy target đầu tiên.

Các lỗi bổ sung đã tìm thấy:

- `DiagnosisChoices` khởi tạo `targetId` bằng `useState(result.suggestedTargetId)` rồi không đồng bộ đầy đủ khi result/retry/category đổi. Category từ props và target từ state riêng có thể lệch.
- Không có target mà UI vẫn hiển thị symptom cả category; `availableServices` chứa mọi service category, UI render toàn bộ.
- Resolver tìm service/symptom trên mọi service category kể cả khi target đã chọn.
- `rankServices` fallback về cả category nếu pool target rỗng; fallback symptom lấy tên service làm triệu chứng.
- Boolean state `busy` chưa đủ chặn hai lần bấm trước React render; thiếu guard cho request của component Choices bị unmount/đổi ảnh.

**Giới hạn quy kết sự cố lịch sử:** không có body hai request 400, response FastAPI hoặc trace catalog snapshot lúc người dùng gặp lỗi. Đã chứng minh đường lỗi bằng code, regression và catalog integration với AI stub; chưa chứng minh hai request lịch sử chắc chắn dùng slug thay UUID, hay V1 fallback đã xảy ra lúc đó. Không gán nguyên nhân lịch sử từ status code đơn lẻ.

## 3. Phase A — thay đổi

- Map AI target ID/slug sang target DB active của đúng category trước khi publish. Không nới validation của `answers.targetId`.
- Mismatch trả HTTP 400 với `code: TARGET_CATEGORY_MISMATCH` và hướng dẫn chọn lại thiết bị.
- Lọc service theo target cho cả options, manual selection, symptom resolution và ranking; không fallback sang thiết bị khác.
- Catalog có targets thì bắt xác nhận target trước khi chọn symptom/service. Giữ contract category-only cũ cho catalog không có targets ở backend.
- Bỏ state target riêng ở Choices; chỉ dùng `result.target.id` đã được server xác nhận. Category/target/retry request chỉ mang selection của bước hiện tại; downstream service selection/price/ranking bị vô hiệu hóa trước request.
- Ref lock chặn double tap; generation guard bỏ response sau đổi ảnh/unmount. Modal vô hiệu generation khi đóng/ẩn; Choices unmount khi ẩn/retake. Legacy DiagnoseScreen cũng loại response initial scan cũ sau đổi ảnh/thao tác lựa chọn.
- Retry giữ đúng answer thất bại. Giữ ảnh/mô tả để sửa lựa chọn hoặc phân tích lại. Không tạo đơn trong các thao tác này.

## 4. Phase B — UX thực tế

1. Chụp/chọn ảnh; loading hiện có và quyền camera/thư viện. Image picker dùng `mediaTypes: ['images']` đúng types SDK đang cài.
2. Hiển thị AI gợi ý thiết bị, nút xác nhận hoặc đổi; category-only thì chọn target ngay. Có thao tác đổi category riêng.
3. Chỉ sau xác nhận target mới hiện triệu chứng theo mapping có service active; tối đa 3 lựa chọn chính, phân biệt thông tin người dùng xác nhận với gợi ý AI.
4. Với exact symptom mapping, trả **1** service thật. Component phòng thủ giới hạn tối đa 3, lọc targetId. Không render full catalog ngay sau scan.
5. “Không biết lỗi gì / Chọn dịch vụ thủ công” và “Xem thêm dịch vụ cho thiết bị này” mở modal riêng có FlatList, search và nút quay lại. Chỉ lúc mở mới gọi `/services?categoryId=...&targetId=...`, lọc active/target/category thêm ở client. Không gọi full `/services` để render modal chính. Endpoint hiện tại chưa có pagination; FlatList virtualize và search local trong kết quả đã lọc target.
6. Sau khi người dùng xác nhận triệu chứng có exact service mapping hoặc chọn service thủ công, mới bật CTA xác nhận dịch vụ. CTA chính của AI modal nằm ngoài ScrollView; không tự tạo order.
7. Error/empty/loading/retry có cho catalog browse. Initial inference lỗi vẫn vào luồng thủ công, tải category từ API; mất mạng toàn bộ server thì phải kết nối lại để lấy catalog thật.
8. Bỏ confidence % ở target, modal và legacy screen; sửa copy không hứa báo giá tức thì. Giá lấy DB; null price ghi thợ báo giá sau kiểm tra, không biến null thành 0.

### Triệu chứng đóng tuyết trong quick win

Read-only DB xác nhận có service active `sua-ngan-mat-dong-tuyet`, ID `64cbc5b0-7aa0-4a12-a710-67f453fb7331`, tên **Sửa ngăn mát đóng tuyết**, basePrice **180000**, maxPrice null. Thêm rule `fridge_frost` → service slug này và `fridge_leak` → service rò nước đã xác minh. Rule chỉ xuất hiện khi service thật active trong target. Đây là **triệu chứng do người dùng chọn**, không phải AI đã phát hiện tuyết. Không đồng nhất ngăn đá đóng tuyết với lỗi ngăn mát hoặc tự chẩn đoán hỏng bộ xả đá/cảm biến; người dùng có thể dùng mô tả và manual browse.

## 5. Kiểm thử

| Kiểm tra | Kết quả | Evidence/phạm vi |
|---|---|---|
| Customer toàn bộ Jest | PASS | `npm test -- --runInBand`: 21 suites, 119 tests |
| Customer regression diagnosis + aiService | PASS | 4 suites, 29 tests; includes canonical context, retry, stale image response, double tap, target confirmation, top-3, target browse/search, network retry |
| Backend diagnosis regression | PASS | `npm test -- --runInBand diagnosis`: 4 suites, 37 tests |
| Backend Babel build | PASS | `npm run build`: 156 files |
| Customer TypeScript | PASS | `npx tsc --noEmit` |
| Android JS export | PASS | `npx expo export --platform android --output-dir /tmp/fixgo-v3-android-final`; không phải native E2E |
| Catalog integration DB thật, read-only | PASS | `cd server && node --env-file=.env scripts/verify-diagnosis-v3.cjs`; AI stub rõ ràng |
| AI contract/pipeline | PASS | `.venv/bin/python -m unittest eval.test_recommendation_pipeline eval.test_diagnose_contract`: 13 tests |
| Artifact label inspection | PASS | Load local YOLO artifact; xem mục 7 |
| Dataset hash audit | PASS (phát hiện leakage) | Tính lại SHA-256 toàn bộ 1.200 ảnh; xem mục 7 |
| Native Android thao tác thật | SKIP | `adb devices -l`: danh sách trống |
| HTTP upload → inference ảnh tủ lạnh thực | SKIP | Chưa có ảnh test thực được cung cấp và native device; catalog integration không thay thế bước này |
| Đánh giá frost held-out precision/recall | SKIP | Không có tập real-photo frost có nhãn độc lập |
| Migration disposable | SKIP | Phase C chỉ thiết kế, chưa có phê duyệt chạy migration |

Regression backend gồm slug→UUID round trip, unknown target abstain, valid target, wrong category 400, service/symptom target khác bị từ chối, inactive service, exact price DB, không suy lỗi nội bộ từ ảnh. Script catalog chạy trong read-only transaction, dùng target/service thực để kiểm chứng exact frost mapping, giá và mismatch; không upload ảnh, không inference thật, không ghi DB.

Lần chạy Customer ban đầu có test mock thiếu `catalogService` khiến AsyncStorage native module lỗi; đã bổ sung mock ở test liên quan, các lần chạy sau PASS. Full suite còn warning React `act(...)` từ test auth/animation hiện hữu; không coi là native UI evidence.

## 6. Phase C — đề xuất schema/API/Admin (chưa triển khai)

### Schema dựa trên Prisma hiện tại

Hiện có `ServiceCategory`, `ServiceTarget(categoryId)`, `Service(categoryId, targetId nullable)`, chưa có Symptom. Bổ sung additive:

```text
Symptom
  id UUID PK
  targetId FK -> ServiceTarget.id (restrict deletion)
  code String (stable per target)
  name String
  aliases String[] default []
  description String?
  kind enum VISUAL_OBSERVABLE | USER_REPORTED | REQUIRES_TECHNICIAN_CHECK
  isActive Boolean default true
  sortOrder Int default 0
  createdAt, updatedAt, createdBy?, updatedBy?
  unique(targetId, code), unique(id, targetId), index(targetId, isActive, sortOrder)

SymptomService
  symptomId UUID
  serviceId UUID
  targetId UUID NOT NULL
  priority Int default 0
  reason String?
  isActive Boolean default true
  createdAt, updatedAt
  PK(symptomId, serviceId)
  composite FK(symptomId, targetId) -> Symptom(id, targetId)
  composite FK(serviceId, targetId) -> Service(id, targetId)
  index(targetId, isActive, priority)
```

`Service` cần thêm unique `(id, targetId)` cho composite FK, target nullable hiện tại vẫn giữ để compatibility; service target null không được map vào symptom. Không thêm quan hệ join chỉ dựa trên hai ID rồi bỏ kiểm tra target. Đối chiếu Prisma composite relation/overlapping scalar trên file schema thử riêng trước khi chốt DDL. Có thể dùng SQL constraint nếu Prisma version không biểu diễn đủ. Kiểm category–target ở transaction write/ranking; quan hệ category hiện dư thừa ở Service cần audit dữ liệu trước khi đề xuất composite FK `(targetId, categoryId)` → Target `(id, categoryId)`.

Không đổi Order, Order FSM, payment, wallet hoặc Face models. Không thêm snapshot symptom vào Order trong P0; nếu cần lưu lịch sử sau này phải có ADR riêng và giữ booking cũ hoạt động.

### API đề xuất

| API | Contract/validation |
|---|---|
| `GET /api/service-targets/:id/symptoms` | Target/category active; trả id/code/name/kind/aliases theo sortOrder; chỉ active. Không ghi nhận dấu hiệu từ ảnh ở đây. |
| `GET /api/services/recommendations?targetId=&symptomIds=&limit=3` | Validate target, category active, mọi symptom cùng target active. Giới hạn 1–3, unknown/foreign IDs báo 400. No-match trả items=[] và manual path. |
| `GET /api/services?categoryId=&targetId=&search=&cursor=&limit=` | Mở rộng route thật hiện có; search/pagination backend cho danh sách thủ công; giữ compatibility query cũ. |
| Admin symptoms CRUD + mapping transaction | Áp RBAC/policy admin hiện hữu sau khi audit; archive thay hard-delete; validate service active và same target; audit author/changes. |

Response recommendation: `items[{serviceId,name,description,price:{min,max,unit,type},reason,symptomIds,source:'confirmed_symptom_catalog'}]`, `hasMore`, `requiresUserConfirmation:true`. Price min/max nullable, không suy upper price; không đưa static AI service catalog prices vào response.

`TARGET_CATEGORY_MISMATCH`, `SYMPTOM_TARGET_MISMATCH`, `SYMPTOM_NOT_AVAILABLE`, `SERVICE_NOT_AVAILABLE` là mã đề xuất; hiện mới bổ sung mã mismatch category-target trong quick win. Top-K ranking deterministic: mapping active + priority, stable ID tie-break; không dùng cosine/text similarity như calibrated probability. Không có symptom thì không gắn nhãn gợi ý AI cho catalog browse. Text người dùng là user_reported, visualFinding nếu thêm phải có source/model version/evidence riêng.

### Admin UX

Cây category → target → symptoms, search/filter active/archived; form tên/code/alias/kind, sắp xếp, link/unlink services đúng target, priority/reason, preview top-3. Cảnh báo symptom không có mapping active, mapping chéo, service inactive. Save transaction + audit, archive không phá lịch sử. Không tự import/backfill/seed catalog dự án. QA import/export có validation và preview diff trước apply.

### Migration/disposable plan

1. Thu thập metadata/catalog audit read-only, số orphan và mismatch; review schema hai phía relation và index/FK.
2. Tạo database/container disposable có tên khác hẳn `ondemand_db`; script guard từ chối tên DB dự án trước bất kỳ DDL. Không dùng default DATABASE_URL đang cấu hình.
3. Trên disposable, áp baseline migrations đã review, tạo fixture cục bộ, generate additive migration. Kiểm Prisma format/validate/client generation trên schema copy; kiểm composite constraints bằng SQL và API tests.
4. Test valid mapping, cross-target/category rejection, null-target legacy service, deactivate symptom/service, empty mapping, rollback/reapply trên disposable và restore backup. Test concurrent admin changes/recommendation cache invalidation.
5. Backfill chỉ các mappings được chủ catalog xác nhận; không tự suy từ toàn bộ tên dịch vụ. Giữ rules V2 như compatibility layer trong giai đoạn chuyển đổi; feature flag API mới sau khi test.
6. Review migration SQL/backup/restore riêng trước triển khai bất kỳ DB thật nào. Rollback ứng dụng về V2 có thể để bảng additive tồn tại; không drop dữ liệu để rollback nóng.

## 7. Phase D — model/dataset evidence

### Nhãn artifact thực tế

Load `YOLO('weights/yolov8n-cls-fixgo.pt').names` từ virtualenv hiện có:

```text
0 dien_lanh
1 lam_vuon
2 other_unclear
3 sua_dien
4 sua_nuoc
5 thiet_bi
SHA256 959d3e9823c55ae0948ce08d75261dca630678d22228404ae03dd4ee7dc7532d
```

Đây là category classifier, không có class `frost_buildup`, không có đầu ra nhãn triệu chứng độc lập. Không thể lấy score `dien_lanh` làm chứng cứ frost.

CLIP implementation là ViT-B/32. `service_catalog.py` có prompt category về ice/frost HVAC và legacy service `sua-tu-lanh-khong-lanh` có prompt `heavy frost and ice buildup inside refrigerator freezer`. **Không kết luận không có prompt frost**. Tuy nhiên route V2 chỉ dùng `category_probs`/`img_feat` để fusion category và match target; `observableSigns` chỉ được xây từ tên category/target. Schema `DiagnosisV2Response` không có visual_findings/frost head. Vì thế prompt legacy này không đồng nghĩa V2 đã phát hiện `frost_buildup`. Static legacy service còn có giá 200000–550000 khác DB hiện tại 180000/max null; quick win chỉ lấy DB.

Description boost trong `category_classifier.py` ảnh hưởng category, không tạo visual symptom. User-selected `fridge_frost` được lưu `reportedSymptoms`, source rules/customer confirmation; không thêm vào `observableSigns`. Không train lại hoặc đổi prompt/model trong nhiệm vụ.

### Kiểm tra dataset thực nghiệm

`dataset_info.json` khai nguồn ảnh bên ngoài, nhưng manifest audit hiện có ghi `synthetic_ratio=1.0`, `origin=synthetic_opencv_templates`, leakage. Tính lại hash trực tiếp các file hiện tại:

| Split | Ảnh | SHA-256 unique |
|---|---:|---:|
| train | 840 | 646 |
| val | 240 | 213 |
| test | 120 | 114 |

Hash giao nhau train–val **210**, train–test **109**, val–test **109**. Do đó benchmark dataset này không chứng minh generalization ảnh Android thật hoặc khả năng nhận frost. Metadata nguồn cần chỉnh sau review dữ liệu; báo cáo này không tự sửa provenance gốc.

**Kết luận frost:** pipeline hiện chưa cung cấp output visual frost được kiểm chứng; chưa có metric thực ảnh có nhãn. Không báo PASS nhận diện đóng tuyết. Load artifact/contract tests là bằng chứng cấu trúc, không thay precision/recall.

### Đánh giá tiếp theo, không huấn luyện ở lượt này

- Thu thập ảnh được phép: ngăn mát/ngăn đá bình thường, tuyết mức nhẹ/dày, góc che khuất, ánh sáng yếu, ảnh mờ, AC iced coils, máy giặt và OOD. Tách dấu hiệu quan sát khỏi nguyên nhân hỏng.
- Hai annotator độc lập gán target, vùng thấy được, `frost_buildup` present/absent/uncertain và vị trí ngăn mát/ngăn đá; adjudication bất đồng. Text tách riêng để tránh gọi nhãn user text là visual finding.
- Split theo thiết bị/hộ gia đình/nguồn; deduplicate exact hash và perceptual hash trước split, test held-out khóa trước tuning.
- Baseline CLIP prompt tương phản frost/normal/AC/washer/OOD, threshold reject chọn trên validation; so image-only, text-only, image+text. Đo frost precision/recall/F1/PR, confusion by appliance, abstain/OOD false acceptance, target top-1/top-3, latency p50/p95 trên Android thật, bootstrap CI theo nhóm thiết bị.
- Nếu baseline không đạt tiêu chí đã thống nhất, đề xuất train visual multi-label head/segmentation riêng tùy annotation. Kế hoạch và dataset review riêng; không dùng category accuracy thay symptom accuracy.

## 8. Checklist Android thực tế — tất cả chưa tick

- [ ] Ghi device/model/Android version, app build/Metro/repo HEAD, kích thước màn, font scale; `adb devices -l` phải thấy máy.
- [ ] ADB reverse backend/Metro đúng instance; chụp ảnh tủ lạnh thật không mô tả. Lưu response V2 đã bỏ URL ảnh riêng tư và request payload category/target. Xác nhận ID mapping, không suy từ HTTP 200/201.
- [ ] Chọn Tủ lạnh: symptom chính không có máy lạnh/máy giặt; không có service trước xác nhận; tối đa 3 sau triệu chứng. Không tự kết luận đóng tuyết hay nguyên nhân hỏng.
- [ ] Chọn “Ngăn mát tủ lạnh đóng tuyết”: đúng service DB/giá hiện hành; ảnh ngăn đá không tự gán lỗi ngăn mát.
- [ ] Đổi category/target nhiều lần, double tap, retry nhanh, đổi ảnh khi chậm, đóng/mở modal, background/foreground. Response cũ không bật booking CTA.
- [ ] Cặp category-target sai qua test API vẫn HTTP 400/code rõ; cặp đúng thành công.
- [ ] Mất mạng/FastAPI timeout/5xx; retry và manual path. Backend offline không bịa catalog; thử lại khi có mạng.
- [ ] Empty target/service, service bị deactivate trên QA; manual empty rõ ràng; không fallback sang thiết bị khác.
- [ ] Màn nhỏ + font lớn + keyboard: CTA ngoài scroll dễ tìm, không che nội dung; modal browse back/search/scroll và system Back hoạt động.
- [ ] OOD/ảnh tối/mờ; không hiển thị phần trăm chưa calibration hoặc suy lỗi nội bộ.
- [ ] Chỉ xác nhận service chưa tạo order; chỉ flow đặt lịch hiện có sau đó mới tạo đơn. Không đổi FSM/payment/wallet.
- [ ] Chụp screenshot/video và log đã bỏ PII cho từng case; ghi PASS/FAIL thật, không dùng Jest/export thay evidence native.

## 9. Files thay đổi

- `customer-app/src/components/diagnosis/DiagnosisChoices.jsx`: flow/context/generation/retry/manual categories.
- `customer-app/src/components/diagnosis/TargetCandidateSection.jsx`: target picker khi chưa nhận diện, bỏ %/confidence giả, phân biệt confirmed.
- `customer-app/src/components/diagnosis/SymptomQuestionSection.jsx`: giới hạn 3 options chính.
- `customer-app/src/components/diagnosis/ServiceRecommendationSection.jsx`: top-3, modal target-filtered/search/loading/empty/retry.
- `customer-app/src/features/home/components/AiScanModal.tsx`: error manual path, lifecycle guards, CTA ngoài scroll, copy, bỏ %, image picker API.
- `customer-app/src/screens/order/DiagnoseScreen.jsx`: bảo vệ response scan cũ và copy/% ở luồng legacy.
- `customer-app/src/services/api/catalogService.ts`: bổ sung type targetId service đúng contract hiện tại.
- `customer-app/src/components/diagnosis/DiagnosisChoices.test.jsx` và `DiagnosisChoicesTargetFlow.test.jsx`: regression state/context/retry/race.
- `customer-app/src/components/diagnosis/ServiceRecommendationSection.test.jsx`: mới, test top-3/manual target/search/error retry.
- `server/src/modules/orders/diagnosis/diagnosis-resolver.js`: canonical target, strict target scope/validation, 1 exact recommendation.
- `server/src/modules/orders/diagnosis/symptom-taxonomy.js`: rules từ catalog xác minh, bỏ service-name fallback triệu chứng.
- `server/src/modules/orders/diagnosis/service-ranker.js`: không target fallback; cap top-K; null-price handling.
- `server/src/modules/orders/diagnosis/diagnosis-target-service.spec.js`: slug roundtrip/unknown target/wrong-target regression.
- `server/scripts/verify-diagnosis-v3.cjs`: mới, read-only catalog integration với AI stub.
- `docs/ai-recommendation/v3-implementation-report.md`: báo cáo này.

## 10. Blocker và công việc tiếp theo

1. Không có thiết bị ADB kết nối và ảnh frost held-out được cung cấp: chưa thể đóng native acceptance/real-photo accuracy hoặc quy kết chính xác request 400 lịch sử.
2. Chưa triển khai Symptom DB/API/Admin. Quick win dùng rule có kiểm tra active DB; chỉ có các triệu chứng đã map, không giả tạo taxonomy đầy đủ.
3. Endpoint services hiện trả toàn bộ kết quả **trong target**, chưa server pagination/search. Bổ sung khi catalog target lớn và sau contract review; modal chính đã không dump catalog.
4. Catalog sync/provenance V1 fallback chưa có tracing xuyên ba service hoàn chỉnh. Request IDs hiện có vẫn cần thu thập trong Android QA; không khẳng định đã trace live V2 inference ở lần chạy này.
5. Dataset synthetic/leakage không dùng để tuyên bố chất lượng model. Cần tập ảnh độc lập và evaluation riêng trước kế hoạch train.
6. Catalog legacy không có target vẫn được backend hỗ trợ category-only; UI V3 hướng tới catalog có target, cần audit/backfill có review nếu bổ sung nhóm thiết bị mới không có target.

Không thay Face Core/PAD/security gates, Order FSM ARC-01, payment hoặc wallet; không chạy lệnh phá dữ liệu/git reset/clean, không sửa dữ liệu thật. Chỉ đọc DB trong transaction read-only cho audit/integration.
