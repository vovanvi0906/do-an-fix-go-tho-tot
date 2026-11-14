# Android QA — Phase C environment

Ngày 14/11/2026, Asia/Ho_Chi_Minh. Repo `/home/vanvi/Work/do-an-fix-go-tho-tot`, branch `feat/ai-recommendation-v3-phase-c`. Không commit/merge/push.

## Kết quả hiện tại

**QA environment đã được tạo và đang chạy**: Backend 3000, FastAPI 8000, Admin 5173, Customer Metro 8081, Worker Metro 8082. PostgreSQL và Redis là container QA riêng. Cả hai APK debug đã build, chưa tự cài vào Vivo hoặc thao tác UI trên máy.

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| Vivo V2507 | PASS | `10HF8GFBU200050`, ADB `device`, ABI arm64-v8a tương thích |
| Reverse 3000 / 8081 / 8082 | PASS | Existing script `dev-usb-connect.sh --device ...` xác minh từng mapping |
| QA schema | PASS | Prisma schema diff rỗng; dependencies và các Face SQL guards hiện hữu có đủ |
| Database preflight | PASS trên QA | Original `usb-runtime-preflight.cjs`, read-only, missing application/Face columns = 0 |
| Backend health | PASS | `GET /api/health` → 200 `{status:"ok"}` |
| Backend Swagger | PASS | `GET /api/docs-json` → 200, đăng ký routes triệu chứng |
| FastAPI | PASS | `/openapi.json` chứa POST `/ai/v2/diagnose`; POST probe không ảnh → 200/abstain |
| AI local engines | READY | Startup load YOLO cls/detect, CLIP và local Face detector/recognizer. Không download model. READY không có nghĩa PAD/visual symptom accuracy PASS |
| PAD | Fail-closed PASS | `/ai/face-capabilities`: padEvaluated=false, padDecision=NOT_EVALUATED |
| Redis/BullMQ | PASS | QA Redis 56381 PONG; Backend queue/worker khởi động bằng REDIS_HOST/PORT QA |
| Catalog | PASS | Fixture 1 category / 2 targets / 3 services; server target filter/search/pagination hoạt động |
| Manual diagnosis | PASS | Chọn service đúng target → 201, giá 100000 từ QA DB; không tạo Order; target sai → 400 |
| Password login Customer/Worker/Admin | PASS | Tài khoản synthetic trong QA DB, không sao chép user thật |
| Metro status và Android JS bundles | PASS | Hai cổng running; JS bundle Customer 10451219 bytes, Worker 9496357 bytes |
| Native debug build Customer | PASS | `com.fixgo.app`, versionCode 1, minSdk 24, targetSdk 34 |
| Native debug build Worker | PASS | `com.fixgo.worker`, versionCode 1, minSdk 24, targetSdk 34 |
| Install / native UI acceptance | NOT RUN | Không install/uninstall, clear data, mở app hoặc thao tác UI tự động |
| Symptom feature | FALSE có chủ đích | 3 symptom + 3 mapping draft NEEDS_REVIEW/inactive; guard từ chối bật khi chưa có approved mapping |
| Config/container dự án | PASS không đổi | Hash server/.env và hai app/.env.local không đổi; IDs ondemand_postgres/ondemand_redis giữ nguyên |

Evidence machine-readable, không chứa credentials: [android-qa/setup-results.json](android-qa/setup-results.json). Logs, PID files và config riêng ở `.android-qa/`, quyền private và gitignored.

## Audit lỗi khởi động ban đầu

`dev-local-usb.sh` giữ việc reuse các container dự án, validate/generate Prisma rồi gọi preflight read-only. Preflight so sánh **toàn bộ scalar fields của Prisma Client** với information_schema, không bỏ qua bảng Phase C chỉ vì flag=false. Khi schema repo có Symptom nhưng `localhost:5432/ondemand_db` chưa migrate, lỗi `APPLICATION_SCHEMA_INCOMPATIBLE_NO_AUTOMATIC_MIGRATION` là đúng. Đã chạy lại preflight cũ để xác nhận bằng metadata, không chạy migration/seed trên DB đó.

Không sửa hoặc tắt preflight. Dùng entrypoint QA mới thay vì đổi `.env` hoặc chỉnh preflight để che thiếu schema.

Một vấn đề khác chỉ xuất hiện khi bootstrap backend thật: DTO symptom dùng `@ApiProperty()` thiếu `type` trong JS/Babel khiến Swagger báo circular dependency ở `targetId` và backend dừng trước listen. Đã bổ sung String/Boolean/Number metadata trong `server/src/modules/symptoms/dto/symptom.dto.js`, thêm `symptom-swagger.spec.js` và chạy test PASS. Sau sửa, backend và Swagger thực đã khởi động PASS. Không đổi Face/PAD/Order/payment/wallet code.

## Cách tách môi trường

| Thành phần | QA | Dự án hiện hữu |
|---|---|---|
| PostgreSQL container | `fixgo-android-qa-postgres`, label fixgo.android-qa=true | Không sửa `ondemand_postgres` |
| PostgreSQL endpoint | `127.0.0.1:55440/fixgo_android_qa` | Không migrate `localhost:5432/ondemand_db` |
| Redis container | `fixgo-android-qa-redis` | Không sửa `ondemand_redis` |
| Redis endpoint | `127.0.0.1:56381/0` | Không dùng 6379/6380 cho QA |
| Backend config | `.android-qa/runtime.json`, `.android-qa/.env` | Không ghi đè `server/.env` |
| Mobile endpoints | Process env localhost 3000, EXPO_NO_DOTENV=1 | Không ghi đè app/.env.local |
| Accounts/password | `.android-qa/accounts.txt`, chmod 600 | Không đọc/copy PII từ DB dự án |

Backend chạy compiled `server/dist/main.js` với working directory `.android-qa`, DOTENV_CONFIG_PATH trỏ `.android-qa/.env`; vì vậy cả dotenv và ConfigModule đọc config QA. Runtime xóa các biến DB/Redis/security/service integration kế thừa trước khi áp config QA. Redis URL **và** HOST/PORT đều trỏ QA vì RedisService và BullMQ sử dụng hai cơ chế cấu hình khác nhau. Không để worker QA tiêu thụ delayed jobs của dự án.

Mobile chỉ kế thừa EXPO_PUBLIC settings từ app để giữ cấu hình public đã có, rồi override API/socket bằng USB localhost. Không dùng template keys, JWT hoặc DB credentials của dự án cho mobile. Worker ép FACE_RESEARCH_APP=false, giữ package `com.fixgo.worker`.

FastAPI chạy từ `ai-service/.venv`, dùng weights/cache hiện có, HF_HUB_OFFLINE/TRANSFORMERS_OFFLINE và ULTRALYTICS_AUTOINSTALL=false. Catalog sync về Backend QA. AI_FACE_SERVICE_TOKEN là token riêng của QA; không copy token hoặc face template keys từ server/.env.

## Schema dependencies và seed

Repo có schema catalog hiện hành nhưng initial migration cũ không bao phủ hết evolution của catalog. Không dùng migration deploy mù quáng hoặc db push. Trên **DB QA trống**:

1. Sinh baseline SQL từ schema snapshot có provenance `9e77da5:server/prisma/schema.prisma`, gồm catalog, PostGIS và registration_proofs dependencies, không có dữ liệu user.
2. Áp SQL migration có sẵn `20261113190000_face_core_v2`.
3. Áp `20261113200000_face_binding_hardening`, giữ các triggers/FKs bảo vệ Face.
4. Áp `20261114000000_symptom_catalog_v3`.
5. Prisma diff với schema hiện tại phải rỗng; kiểm 7 custom biometric SQL guards và chạy nguyên database preflight.

Manifest SHA-256 của baseline/migrations: `.android-qa/schema-history.json`; SQL/apply log cũng ở thư mục private. Đây là bootstrap lineage cho QA, không giả mạo migration history của database dự án.

`prepare` chỉ nhận URL đúng localhost port 55440, database/user `fixgo_android_qa`, kiểm current_database/current_user và ownership label container. DB đã có schema nhưng không có manifest sẽ bị từ chối, không reset tự động. Chạy lại setup là validate/reuse, không overwrite seed đã có.

Seed chỉ có:

- Customer, Worker, Admin email `*.android.qa@example.invalid`, password random lưu riêng.
- Customer profile và địa chỉ ghi rõ giả lập, không điều phối thực.
- Worker profile DRAFT, kyc=PENDING, idCardVerified=false, offline, faceVerifiedAt=null.
- Category Điện lạnh QA, targets Tủ lạnh/Máy giặt QA, 3 services giả lập giá DB 100000/lần, không phải báo giá thật hoặc giá AI.
- 3 symptom/mapping drafts NEEDS_REVIEW, inactive. Không import 693 proposals và không tự duyệt.
- **Không** face review/template/session/proof giả, payment, wallet hoặc Order seed.

## Khởi động và kiểm tra

Chạy từ repo:

```bash
cd ~/Work/do-an-fix-go-tho-tot

# Chỉ tạo/reuse QA containers + schema/seed QA; không dùng DB dự án.
./dev-android-qa.sh prepare

# Giữ preflight, build backend, reverse đúng Vivo và start background services.
./dev-android-qa.sh start --device 10HF8GFBU200050

./dev-android-qa.sh status
./dev-android-qa.sh verify
```

Môi trường đang chạy rồi thì không chạy start lần nữa. Port preflight từ chối process khác, không tự kill service worktree khác.

```bash
# Chỉ dừng các process groups do QA runner tạo, có kiểm PID start time.
# Không dừng DB/Redis hoặc xóa dữ liệu điện thoại.
./dev-android-qa.sh stop

# Restart backend/AI/Metros bằng config QA sau khi chỉnh config QA được duyệt.
./dev-android-qa.sh start --device 10HF8GFBU200050
```

Sau reboot, `prepare` có thể start lại các container QA đúng ownership label. Nếu chủ động muốn dừng container sau buổi QA:

```bash
docker stop fixgo-android-qa-postgres fixgo-android-qa-redis
```

Không chạy `dev-local.sh` để “sửa” schema: script cũ có thể có db push. Không trỏ các commands migrate/seed vào ondemand_db.

## ADB Reverse chính xác

```bash
adb -s 10HF8GFBU200050 get-state
adb -s 10HF8GFBU200050 reverse tcp:3000 tcp:3000
adb -s 10HF8GFBU200050 reverse tcp:8081 tcp:8081
adb -s 10HF8GFBU200050 reverse tcp:8082 tcp:8082
adb -s 10HF8GFBU200050 reverse --list
```

Không dùng reverse --remove-all; giữ các mapping khác.

## Build và install chính xác

Wrapper nạp QA mobile env, ép package Worker bình thường và build bằng Gradle debug/đúng dev-server port. Cả hai lệnh build đã PASS trong lượt này:

```bash
cd ~/Work/do-an-fix-go-tho-tot
node scripts/android-qa/mobile.cjs customer build
node scripts/android-qa/mobile.cjs worker build
```

APK outputs:

- `customer-app/android/app/build/outputs/apk/debug/app-debug.apk` → `com.fixgo.app`.
- `worker-app/android/app/build/outputs/apk/debug/app-debug.apk` → `com.fixgo.worker`.

Lệnh install được chuẩn bị, **chưa chạy**:

```bash
adb -s 10HF8GFBU200050 install -r \
  customer-app/android/app/build/outputs/apk/debug/app-debug.apk
adb -s 10HF8GFBU200050 install -r \
  worker-app/android/app/build/outputs/apk/debug/app-debug.apk
```

Hoặc `node scripts/android-qa/mobile.cjs customer install` / `worker install`, cùng dùng adb serial và `-r`. Không có fallback uninstall/pm clear/-d/signature bypass. Nếu báo INSTALL_FAILED_UPDATE_INCOMPATIBLE hoặc version/signature conflict thì dừng và giữ app/data cũ.

Sau khi người dùng cài, có thể mở đúng dev-client bằng commands sau (chưa chạy):

```bash
adb -s 10HF8GFBU200050 shell am start \
  -a android.intent.action.VIEW -p com.fixgo.app \
  -d 'fixgocustomer://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
adb -s 10HF8GFBU200050 shell am start \
  -a android.intent.action.VIEW -p com.fixgo.worker \
  -d 'fixgoworker://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082'
```

Tại thời điểm audit: Customer package đã có trên Vivo, Worker package chưa có. Không coi APK build hoặc Metro bundle PASS là native app nghiệm thu. Token tài khoản cũ không hợp lệ với QA JWT; đăng nhập bằng tài khoản trong `.android-qa/accounts.txt`, không cần xóa dữ liệu ứng dụng.

## Test được với feature flag false / true

| Chức năng | false hiện tại | true sau schema + dữ liệu duyệt |
|---|---|---|
| Customer/Worker password login | Có, synthetic accounts | Có |
| Catalog, chọn category/target, manual services/search/paging | Có | Có |
| AI category/target suggestion qua inference | Route/models ready; ảnh thật chưa test | Tương tự; không suy symptom accuracy |
| Triệu chứng quick win A/B | Known rules theo fixture service, user xác nhận | Catalog symptom IDs active + APPROVED |
| Symptom CRUD/mapping API/Admin | 503 theo flag; chưa được bật | Có, theo ADMIN role |
| Top-3 theo symptom DB | Chưa bật | Có khi đã duyệt active mappings |
| Target không có mapping | Manual fallback | Manual fallback |
| Worker online/nhận đơn/start cần Face proof | Bị chặn đúng gates | Vẫn bị chặn, không liên quan symptom flag |
| Upload ảnh Customer qua Cloudinary | Blocked QA credentials | Vẫn blocked nếu chưa cấu hình tài khoản upload QA |

`SYMPTOM_CATALOG_ENABLED=false` được giữ vì dữ liệu draft chưa được duyệt. Guard `enable-symptoms` đã được thử ở trạng thái chưa duyệt và từ chối, không sửa flag. Sau khi có dữ liệu QA được review/approved/active qua quy trình riêng, chỉ chạy:

```bash
./dev-android-qa.sh enable-symptoms
./dev-android-qa.sh stop
./dev-android-qa.sh start --device 10HF8GFBU200050
./dev-android-qa.sh verify
```

Lệnh enable kiểm QA server identity và approved active mapping trước khi ghi config QA. Nó **không duyệt hoặc import dữ liệu**, không vượt gates Face. Với seed hiện tại, lệnh sẽ fail có chủ đích; không tự sửa CSV NEEDS_REVIEW thành APPROVED. Quy trình review/import QA để bật true còn chờ người quản trị duyệt; không ghi DB dự án.

## Blockers và giới hạn

1. Symptom drafts chưa được duyệt, flag=false. Chưa báo nghiệm thu native Phase C top-3 từ DB trên Vivo.
2. QA không có Cloudinary sandbox credentials được cấp phép. Cấu hình đặt giá trị QA-disabled để không dùng credentials mặc định thật trong source; không upload ảnh thật thử nghiệm. Muốn test chụp → upload đầy đủ cần tài khoản upload QA riêng, chỉ sửa private config rồi restart. Manual/catalog và direct FastAPI route probe đã hoạt động.
3. Google/Firebase/SMS/email external integrations không được nghiệm thu; QA dùng password login, không copy service account/token thật. Firebase backend trỏ project/emulator QA không phục vụ; OTP không nằm trong test này.
4. Worker chưa cài trên Vivo và chưa thao tác UI của hai app. KYC/Face còn fail-closed; không tạo proof/verified status để demo booking flow.
5. AI POST probe dùng request không có ảnh và abstain đúng, chỉ chứng minh route/contract. Không công bố độ chính xác dấu hiệu hỏng hoặc frost từ dữ liệu synthetic.
6. Có warning SDK XML/Gradle deprecation hiện hữu, nhưng cả hai build thành công. Chưa nâng toolchain ngoài phạm vi.

## Files mới/sửa trong lượt setup

- `.gitignore`: bỏ track private `.android-qa/`.
- `dev-android-qa.sh`: entrypoint QA độc lập, không đổi `dev-local-usb.sh`.
- `scripts/android-qa/{common,prepare,runtime,mobile,verify}.cjs`: config/guards/bootstrap/start-stop/build-install/probes.
- `server/src/modules/symptoms/dto/symptom.dto.js`: explicit Swagger types để backend boot được.
- `server/src/modules/symptoms/symptom-swagger.spec.js`: regression Swagger document, PASS.
- `docs/ai-recommendation/android-qa-setup-report.md`, `android-qa/setup-results.json`: report/evidence không chứa password.

Config thật, container ondemand, Face/PAD/FSM/payment/wallet code và dữ liệu điện thoại được giữ nguyên. Các thay đổi A/B/C chưa commit trước đó vẫn còn trong working tree.
