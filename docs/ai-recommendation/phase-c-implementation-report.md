# AI Recommendation V3 — Phase C implementation

Ngày 14/11/2026, Asia/Ho_Chi_Minh. Repo `/home/vanvi/Work/do-an-fix-go-tho-tot`.

Branch làm việc: `feat/ai-recommendation-v3-phase-c`, tạo từ `integration/fixgo-sprint-02` / `b50075f`, bảo toàn toàn bộ thay đổi A/B chưa commit. Không push/merge/commit tự động. Báo cáo A/B trước đây là mốc lịch sử, phần thiết kế C trong đó được thay bằng implementation này.

## 1. Kết quả và trạng thái chạy thực

| Phần | Đã triển khai / kiểm chứng | Trạng thái database dự án |
|---|---|---|
| Catalog audit | Đọc đủ 6 category, 70 target, 693 service trong transaction read-only | Không sửa dữ liệu; snapshot trước/sau giống nhau |
| Symptom/SymptomService | Prisma schema, SQL additive, composite FK, approval, indexes, audit | **Chưa migrate `ondemand_db`** |
| APIs mới | HTTP/JWT/RBAC chạy thật với PostgreSQL disposable | Mặc định `SYMPTOM_CATALOG_ENABLED=false`, API triệu chứng trả 503 có code rõ |
| Admin | `/admin/symptoms`: CRUD/archive, mapping/priority, filters, preview top-3; RTL/build PASS | Chờ migration và bật feature; không có dữ liệu proposal tự import |
| Customer | Chọn symptom ID, top-3, xác nhận service riêng, manual server search/paging, reset downstream | Flag false giữ quick win A/B; không query bảng mới |
| Dữ liệu đề xuất | 693 candidates + 693 mapping candidates, đủ 70 target | **Tất cả NEEDS_REVIEW / inactive, chỉ trong file** |
| Migration/rollback/reapply | Đã chạy trên PostgreSQL riêng; kiểm FK/check/legacy preservation | Không chạy DDL trên database dự án |
| Face Core / ARC-01 | Existing DB/security/FSM regressions PASS sau additive migration trong container riêng | Không đổi source/gates/flags runtime Face/PAD |

Các kết quả “chạy thực” bên dưới là tiến trình test cô lập, không phải tuyên bố backend/Admin/Metro đang phục vụ người dùng đã được deploy/reload. Không restart dịch vụ dự án hoặc bật tính năng trên DB chưa migrate.

## 2. Audit catalog và dữ liệu đề xuất

Files:

- [catalog-audit.md](data/catalog-audit.md): số liệu, trường optional thiếu, toàn bộ category/target và service counts.
- [symptoms-proposal.md](data/symptoms-proposal.md): đề xuất cho từng target, phân loại, service IDs và quy trình review.
- [symptoms.csv](data/symptoms.csv): symptom_id UUIDv5, code, name, aliases JSON, kind, target_id/category_id, description, is_active, sort_order, review_status, review_notes.
- [symptom-service-mappings.csv](data/symptom-service-mappings.csv): symptom_id, service_id thật, target_id, priority, review_status/reason và ghi chú.

Nguồn được lấy bằng `server/scripts/audit-catalog-readonly.cjs`, transaction `SET TRANSACTION READ ONLY`, bao gồm inactive records. Không tìm thấy service null-target, dangling target, category-target mismatch, inactive service, thiếu name/slug/description/unit/basePrice hoặc giá âm/sai khoảng. Tất cả 693 `maxPrice` đang null: không giả tạo giá trên. Category/target đều active ở snapshot này. So sánh deep-equality cả 3 tập record trước/sau triển khai: **không đổi**.

Bộ đề xuất là vòng biên tập đầu, dựa tên/mô tả/phạm vi service, không phải taxonomy đã duyệt. Mỗi service có một candidate để trace nguồn; các candidate trùng dấu hiệu cần gộp và các yêu cầu bảo dưỡng/lắp đặt có thể cần đưa sang manual catalog thay vì symptom. Tất cả đều `NEEDS_REVIEW` và `is_active=false`; không mặc định APPROVED ngay cả mapping trùng tên.

Kinds hiện đề xuất: 639 USER_REPORTED, 25 VISUAL_OBSERVABLE, 29 REQUIRES_TECHNICIAN_CHECK. Loại VISUAL chỉ nói con người có thể quan sát dấu hiệu, **không xác nhận model nhận diện được**. Lỗi/công việc nội bộ dùng wording “Cần …” và cờ review, không suy nguyên nhân từ ảnh. Service không có target/mismatch nếu có sẽ bị loại khỏi đề xuất và đưa vào audit, không tự gán target.

`propose-symptoms.py` chỉ đọc snapshot file, ghi docs/CSV, không có kết nối DB. `test-symptom-proposals.py` xác minh IDs/codes duy nhất, đủ targets, service IDs tồn tại, cùng target/category, JSON aliases và tất cả chưa duyệt. Không có lệnh import vào PostgreSQL thật.

## 3. Schema và migration review

Prisma hiện có thêm:

- `Symptom`: targetId, code/name/description, aliases, kind, reviewStatus, isActive=false, sortOrder, creator/updater/timestamps. Unique `(targetId, code)` và `(id, targetId)`.
- `SymptomService`: composite PK `(symptomId, serviceId)`, targetId, priority/reason, reviewStatus, isActive=false, actor/timestamps.
- `SymptomCatalogAudit`: actor/action/entity/JSON changes/timestamp; mutation và audit cùng transaction.
- `ServiceTarget.symptoms`, `Service.symptomMappings`, unique `Service(id, targetId)` để composite FK tham chiếu.

SQL: `server/prisma/migrations/20261114000000_symptom_catalog_v3/migration.sql`.

Review kỹ thuật của lượt này:

1. Chỉ CREATE 2 enums, 3 bảng mới, indexes và thêm unique index trên Service. Không alter/drop cột Service, Order, Face, payment hoặc wallet.
2. Hai FK `(symptomId,targetId)` và `(serviceId,targetId)` cùng trỏ unique composite tương ứng. Join targetId NOT NULL nên service target null không được map; không thể chèn mapping chéo target bằng SQL/ORM hoặc đổi target của service đã có mapping.
3. FK mới `RESTRICT` khi update/delete; archive dữ liệu đang tham chiếu, không làm mất catalog/history. Retarget một service đã có mapping cần quy trình biên tập mới; API không tự dời triệu chứng sang target khác.
4. CHECK active ⇒ APPROVED ở cả symptom và mapping; sortOrder/priority phải 0–100000. Đây là CHECK SQL bổ sung ngoài biểu diễn Prisma; phải giữ khi tái tạo migration.
5. SQL gói trong BEGIN/COMMIT; tạo index trên Service có thể khóa ghi khi triển khai thật. Cần đánh giá thời gian/maintenance window và backup trước production; không coi việc test disposable là duyệt triển khai production.
6. Prisma format/validate/generate PASS. Kiểm Prisma diff giữa schema và disposable có Face guards + symptom migration là rỗng.

Rollback SQL: `server/prisma/rollback/symptom_catalog_v3.sql`. File destructive chỉ dành disposable hoặc kế hoạch restore đã duyệt, xóa bảng symptom/audit mới và index thêm, không xóa Service/Target/Order. **Rollback vận hành ưu tiên flag=false và giữ nguyên bảng mới** để không mất symptom/audit; không chạy DROP production chỉ để rollback ứng dụng.

## 4. Backend API và contract

### Public/catalog

| Route | Hành vi |
|---|---|
| `GET /api/service-targets/:id/symptoms?categoryId=` | Target/category active, symptom active + APPROVED, sắp sortOrder/id; không lộ actor metadata |
| `GET /api/services/recommendations?targetId=&categoryId=&symptomIds=id1,id2&limit=3` | Validate 1–10 IDs không lặp, cùng target/category, active/approved. limit chỉ 1–3. Lọc mapping + service active, đúng category/target, parent active |
| `GET /api/services?categoryId=&targetId=&search=&page=1&limit=20` | Search backend tên/mô tả insensitive, offset pagination (limit 1–100), tie-break name/id. Validate target/category. Có search/page/limit thì trả envelope phân trang |
| `GET /api/services` hoặc filter cũ không search/page/limit | Giữ response array cũ để không phá booking/catalog callers |

Recommendation response:

```json
{
  "items": [
    {
      "id": "catalog-service-id",
      "name": "database-service-name",
      "targetId": "confirmed-target-id",
      "basePrice": 180000,
      "maxPrice": null,
      "unit": "lần",
      "priority": 40,
      "symptomIds": ["approved-symptom-id"],
      "reason": "Theo triệu chứng bạn xác nhận: tên triệu chứng từ database",
      "provenance": "confirmed_symptom_catalog",
      "confidence": null
    }
  ],
  "hasMore": false,
  "requiresUserConfirmation": true,
  "source": "confirmed_symptom_catalog"
}
```

Ví dụ contract, không phải dữ liệu seed. `id` là ID service thật; giá lấy `Service.basePrice/maxPrice` trong DB. Ranking: số triệu chứng khớp giảm dần → priority cao hơn → service ID ổn định; dedupe service. No-match trả items=[], không fallback sang category hoặc giá/static AI catalog.

### Admin

Tất cả dùng `JwtAuthGuard + RolesGuard + @Roles('ADMIN')` theo policy hiện tại. JWT strategy đọc role/account từ DB, không tin role claim. POST/PATCH/PUT validate DTO bằng class-validator với whitelist/forbid unknown; JSON null không được dùng để bypass validation. Target của symptom immutable; code unique per target; active cần APPROVED. Mutation/audit cùng transaction; create/update/map dùng Serializable, conflict FK/serialization trả lỗi tải lại.

| Route | Vai trò |
|---|---|
| `GET /api/admin/symptoms?categoryId=&targetId=&search=&isActive=&reviewStatus=&page=&limit=` | Admin list/paging, search name/code insensitive hoặc alias exact; includes mappings/service và warnings |
| `POST /api/admin/symptoms` | Tạo draft inactive/NEEDS_REVIEW; actor lấy JWT |
| `PATCH /api/admin/symptoms/:id` | Sửa thông tin, review/active/sortOrder; archive bằng isActive=false |
| `PUT /api/admin/symptoms/:id/services/:serviceId` | Upsert mapping, review/active/priority/reason; từ chối khác target/category, service inactive |
| `DELETE /api/admin/symptoms/:id/services/:serviceId` | Archive link; giữ record/audit; có thể archive link của service đã inactive |

Các mã lỗi gồm `SYMPTOM_CATALOG_NOT_ENABLED` (503), `TARGET_REQUIRED`, `TARGET_CATEGORY_MISMATCH`, `SYMPTOM_TARGET_MISMATCH`, `SYMPTOM_NOT_AVAILABLE`, `SERVICE_TARGET_MISMATCH`, `SERVICE_SYMPTOM_MISMATCH`, `SERVICE_NOT_AVAILABLE`, `REVIEW_REQUIRED`, `DUPLICATE_SYMPTOM_CODE`, `CATALOG_CHANGED`, `INVALID_PAGINATION`.

### Diagnosis tích hợp

`POST /orders/diagnose` / upload vẫn dùng resolver hiện có, không tạo Order. Flag true và target đã xác nhận: đọc symptoms thật, trả questions `id:'symptomId'` và options `value: symptom.id`. Chọn symptom trả tối đa 3 `suggestedServices`, `selectedSymptomIds` và **status needs_more_info / suggestedServiceId=null**, yêu cầu chọn service riêng. Khi xác nhận service gợi ý, gửi `symptomIds + serviceId`, backend kiểm mapping lại. Chọn service thủ công thì bỏ symptomIds, vẫn kiểm category/target/service active. Đổi category/target không mang IDs downstream cũ.

Flag false không query bảng mới. Caller legacy có thể gửi `symptom` từ rule đã biết hoặc serviceId manual; không nhận symptom tùy ý chỉ vì trùng slug dịch vụ. Luồng Order/FSM không đổi. Legacy rule là compatibility path, không phải mapping DB đã được duyệt và không phải visual evidence.

## 5. Admin và Customer UI

Admin route `/admin/symptoms` nằm trong protected ADMIN layout/menu, tách page/container, form, mapping editor, constants và API service theo CONTRIBUTING hiện có. Có:

- Category → Target picker, search, lọc active/review, paging 20 triệu chứng.
- Tạo/sửa code/name/description/aliases/kind/sortOrder, duyệt và active/archive.
- Mapping service đúng target, ưu tiên/rationale/review/active; disable link inactive/wrong target, archive bằng nút bỏ liên kết.
- Cảnh báo không có mapping active, parent inactive, service sai target/category hoặc inactive.
- Preview qua cùng public recommendation API top-3; no-match giải thích Customer fallback. Preview cũ bị bỏ khi đổi category/target/symptom.
- Loading, empty, error/retry, mutation lock và thông báo lưu thành công. Không có importer proposal vào DB thật.

Customer giữ flow A/B, dùng data DB qua diagnosis để không tạo thêm nguồn target/symptom state riêng. Giới hạn 3 symptom chính, có modal riêng tìm triệu chứng còn lại (không biến modal chính thành danh sách dài). Sau symptom mới hiện top-3 services; service selection từ gợi ý giữ symptom IDs để backend validate; manual selection bỏ symptom IDs. Empty symptoms/mapping có manual path.

Manual service modal dùng server search debounce 300ms và page 20, có tải thêm và retry, request scope category+target. Không tải full catalog vào modal chính, không suy giá/tên bằng AI, không hiển thị confidence % chưa calibration. Loại REQUIRES_TECHNICIAN_CHECK có nhắc cần thợ kiểm tra, ảnh chưa xác nhận nguyên nhân.

## 6. Test PASS / FAIL / SKIP

| Check | Kết quả | Evidence |
|---|---|---|
| Read-only catalog audit + proposal validation | PASS | 6/70/693; 693 symptoms + 693 mappings hợp lệ về IDs/scope, tất cả chờ duyệt |
| Prisma format/validate/generate | PASS | Schema hợp lệ; chỉ sinh client local |
| Migration + HTTP/JWT/DB integration | PASS | 11 tests; PostgreSQL riêng port 55439, FK/check, max-3, inactive, forged-role, CRUD/archive/audit, search/paging, no Order creation |
| Rollback + reapply | PASS | Original column metadata (gồm Order/Face) giống baseline; Service/Order counts không đổi; legacy null-target Service/Order giữ nguyên. Resolver manual chạy khi bảng symptom đã bị rollback |
| Backend full Jest | PASS | 17 suites / 181 tests |
| Backend build | PASS | Babel 161 source files |
| Existing Face DB integration sau symptom migration | PASS | 64 tests; custom SQL guards hiện hữu được kiểm tra, không thay Face code |
| Existing ARC-01 HTTP/Socket/PostgreSQL | PASS | 19 tests sau symptom migration; Redis pubsub không nằm trong test này |
| Customer full Jest | PASS | 21 suites / 121 tests; gồm new symptom IDs, context reset, empty symptoms/manual, top-3, retry/race và manual server search |
| Customer TypeScript | PASS | `npx tsc --noEmit` |
| Android JS export | PASS | `/tmp/fixgo-phase-c-android`; không phải native UX test |
| Admin RTL/jsdom | PASS | 4 tests: draft scope, mapping priority/review/preview/archive, wrong/inactive guards, đổi target/error |
| Admin production build | PASS | Vite build |
| Project catalog/schema untouched | PASS | Snapshot 6/70/693 trước/sau deep-equal; `to_regclass` symptoms/symptom_services trên DB dự án đều null |
| Native Android thao tác thật | SKIP | `adb devices -l` trống |
| Browser visual E2E / screenshot | SKIP | UI tests dùng jsdom; chưa xác nhận bố cục bằng browser thật |
| Migrate/import DB dự án | SKIP theo giới hạn | Không được chạy; cần review/cho phép riêng |
| Accuracy dấu hiệu ảnh/model | SKIP | Phase C không train/evaluate ảnh; không dùng synthetic để công bố accuracy |

Không có FAIL còn mở trong các bộ test đã chạy. Lần thử compatibility runner đầu gặp startup PostgreSQL tạm bằng Unix socket; runner đã đổi readiness check sang TCP 127.0.0.1 và cleanup không che lỗi gốc, lần chạy cuối PASS.

Admin được bổ sung Vitest/Testing Library/jsdom dev dependencies và test script; giữ nguyên Vite app major. Npm audit cuối còn advisories ở Vite/esbuild/follow-redirects trong dependency graph hiện hữu (1 moderate, 2 high); không chạy upgrade major ngoài phạm vi. Vite cảnh báo bundle >500KB và Customer có warning act(...) hiện hữu; build/tests vẫn PASS. Không dùng các PASS này làm chứng cứ PAD/Face inference production hoặc Android native.

Tóm tắt machine-readable và hash artifacts: [phase-c/test-results.json](phase-c/test-results.json). Guard negative controls đã từ chối URL trống, ondemand_db, port dự án và host khác loopback.

## 7. Reproduce an toàn

Các lệnh audit sau **chỉ đọc** DB từ cấu hình dự án:

```bash
cd server
node --env-file=.env scripts/audit-catalog-readonly.cjs /tmp/fixgo-phase-c-catalog.json
cd ..
python3 server/scripts/propose-symptoms.py /tmp/fixgo-phase-c-catalog.json docs/ai-recommendation/data
python3 server/scripts/test-symptom-proposals.py /tmp/fixgo-phase-c-catalog.json
```

Tạo container **riêng**, không dùng ondemand_postgres, không map port 5432:

```bash
docker run --rm -d --name fixgo-phase-c-disposable \
  -p 127.0.0.1:55439:5432 \
  -e POSTGRES_USER=fixgo_disposable \
  -e POSTGRES_PASSWORD=fixgo_disposable_only \
  -e POSTGRES_DB=fixgo_symptoms_disposable \
  postgis/postgis:16-3.4-alpine
```

Sau khi TCP pg_isready báo ready:

```bash
cd server
DISPOSABLE_DATABASE_URL='postgresql://fixgo_disposable:fixgo_disposable_only@127.0.0.1:55439/fixgo_symptoms_disposable' \
  npm run test:symptoms:disposable
npm run test:symptoms:compat
npm test -- --runInBand
npm run build
cd ../customer-app
npm test -- --runInBand
npx tsc --noEmit
npx expo export --platform android --output-dir /tmp/fixgo-phase-c-android
cd ../client
npm test
npm run build
```

Disposable runner **reset schema của disposable** để tái lập baseline, không load .env/fallback DATABASE_URL; từ chối URL nếu khác host 127.0.0.1, port 55439, DB fixgo_symptoms_disposable hoặc user fixgo_disposable; kiểm cả current_database trước DDL. Compatibility runner tự tạo/xóa container ngẫu nhiên riêng có Face SQL guards, chạy existing tests; không chạm container dự án. Các password trên chỉ là fixture disposable, không phải credentials dự án. Container `fixgo-phase-c-disposable` do lượt này tạo đã được dừng sau kiểm thử; có thể tạo lại bằng lệnh trên.

## 8. Chuyển đổi dữ liệu và rollout — còn chờ

1. Chủ catalog review 693 candidates: gộp triệu chứng trùng, loại yêu cầu lắp/bảo dưỡng không nên là symptom, xác minh kind/aliases/scope và từng mapping/priority. Không tự APPROVED tất cả.
2. Chạy thử import bộ đã duyệt trên disposable/QA riêng. Task này **không tạo/running importer DB thật**; IDs dịch vụ phải được kiểm lại tại thời điểm import, không lấy CSV cũ làm nguồn sự thật vĩnh viễn.
3. Review migration SQL, thời gian tạo index, backup/restore và dữ liệu legacy null-target. Thực hiện migration dự án chỉ sau cho phép riêng, giữ flag false trong lúc schema/dữ liệu chưa sẵn sàng.
4. Sau schema và dữ liệu approved/active hợp lệ trên QA, bật `SYMPTOM_CATALOG_ENABLED=true`, regenerate client/build backend, kiểm HTTP/public/Admin và Customer ở QA. Giữ fallback manual nếu target chưa có symptom/mapping.
5. Android thật: ảnh tủ lạnh, chọn/đổi category/target/symptom, top-3, không có mapping, airplane mode/timeout/retry, tap nhanh, back/dismiss/background, font lớn/keyboard/màn nhỏ. Ghi video/screenshot và body IDs đã bỏ PII. Không gọi export/Jest là native PASS.
6. Rollout thật cần theo dõi 400 mismatch, no-match/manual rate và latency; rollback bằng flag=false nếu lỗi. Không thay Face/PAD/ARC-01/payment/wallet.

## 9. Files Phase C

- `server/prisma/schema.prisma`, `migrations/20261114000000_symptom_catalog_v3/migration.sql`, `rollback/symptom_catalog_v3.sql`.
- `server/src/modules/symptoms/`: catalog helpers, DTO, service, public/admin controllers và module.
- `server/src/app.module.js`, `modules/services/services.{controller,service}.js`: đăng ký API và search/paging tương thích.
- `server/src/modules/orders/diagnosis/diagnosis-{resolver,input-validator}.js`, `dto/diagnose-order.dto.js`: symptom IDs và validation; giữ legacy known rules.
- `server/.env.example`, `server/package.json`: feature flag và script test an toàn.
- `server/test/symptoms/`: URL guard, Jest config, real PostgreSQL/HTTP/JWT regression.
- `server/scripts/audit-catalog-readonly.cjs`, `propose-symptoms.py`, `test-symptom-proposals.py`, `test-symptoms-disposable.cjs`, `test-symptoms-compatibility.cjs`.
- `client/src/features/symptoms/`: page, form/mapping components, constants/service và RTL tests.
- `client/src/routers/{routes.jsx,menuConfig.js}`, `client/{package.json,package-lock.json,vitest.config.js}`.
- `customer-app/src/components/diagnosis/{DiagnosisChoices,SymptomQuestionSection,ServiceRecommendationSection}.jsx` và tests, `services/api/{aiService,catalogService}.ts`.
- `docs/ai-recommendation/data/*`, `phase-c-implementation-report.md` và ghi chú liên kết trên báo cáo A/B.

Các thay đổi A/B đã tồn tại trước Phase C được giữ nguyên trong working tree, không reset hoặc gom mất lịch sử nội dung. Chưa commit nên git diff tổng còn bao gồm A/B.
