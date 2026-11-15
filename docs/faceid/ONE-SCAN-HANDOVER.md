# FaceID one-scan — implementation handover

> Cập nhật 2026-11-15: yêu cầu duyệt danh tính thủ công đã được thay bằng tự đăng ký từ lần quét đầu. Xem [SELF-ENROLLMENT-IMPLEMENTATION.md](./SELF-ENROLLMENT-IMPLEMENTATION.md). Các mô tả bắt buộc admin/reviewerId/thời hạn review bên dưới là lịch sử, không còn áp dụng cho luồng mới.


## Phase 0/1: reconciliation and minimal change map (before source edits)

Read current audit/spec and implementations/callers. Source matches audit: exactly two runtime requireDaily callers (WorkersService.updateAvailability, OrderWorkflowService.transition accepting); hasShiftVerification target caller is dashboard. Order session uses orderAccess ARRIVED at create/authorize/submit/finish. consumeOrder is inside existing start transaction; preserve it. POST images is JSON only. No general order photo binary endpoint; existing Cloudinary SDK/incident-image validator is a suitable reusable storage implementation, not a verified deployed storage service. Add authenticated order BEFORE media endpoint using that SDK; no fake URLs. Do not use public diagnose or worker-face folders. Real cloud availability remains NOT_VERIFIED until credentials/integration are exercised.

Spec policy: no enrollment/Daily prerequisite on online/accept; keep active/approved/services/GPS/online/busy/ownership checks at their existing business boundaries. Enrollment remains prerequisite to ORDER session. No schema/model/threshold/FSM/payment changes. Review lifetime conflict remains unchanged pending isolated reproduction and intended-policy decision.

| File | Function | Current behavior | Required behavior | Action | Test |
|---|---|---|---|---|---|
| server/src/modules/workers/workers.service.js | updateAvailability | Daily gate online | professional/GPS/services gates without Daily | MODIFY | availability unit |
| server/src/modules/orders/order-workflow.service.js | transition accepting | Daily gate accept | active/approved/online/not busy, no Daily | MODIFY | isolated workflow/ARC |
| server/src/modules/workers/face/face-core.service.js | consumeOrder | lookup + consume | extract reusable non-consuming lookup; same start consume | MODIFY | proof scope/TTL/epoch/rollback |
| server/src/modules/orders/orders.service.js | uploadImage | URL only, no proof | BEFORE proof auth + stored asset verification; ISSUE/AFTER unchanged | MODIFY | image/security tests |
| server/src/modules/orders/orders.controller.js; server/src/modules/orders/orders.module.js | media route/DI | no order byte uploader | scoped authenticated BEFORE storage endpoint | MODIFY | multipart HTTP tests |
| server/src/modules/orders/order-before-media.service.js; order-before-media.guard.js | upload/verify/authorize | absent | reuse Cloudinary, bounded image validation, deterministic asset id, server resource verification | ADD | storage/error/dedupe/ownership |
| worker-app/app/(worker)/(tabs)/index.jsx | changeAvailability | Daily UI gate | no Daily; retain GPS/profile/ACK | MODIFY | dashboard tests |
| worker-app/app/(worker)/verification/face.jsx; worker-app/src/features/face-verification/hooks/useFaceVerification.js | mode/finish | enroll→Daily | explicit enrollment/order return; no mandatory Daily | MODIFY | screen/hook tests |
| worker-app/app/(worker)/job/[id].jsx | ARRIVED actions | scan→start | scan→BEFORE bytes→URL persist→start + TTL/recovery | MODIFY | job component tests |
| worker-app/src/features/orders/components/BeforePhotoCapture.jsx; jobReadiness.js | camera/upload | absent | embedded rear camera, retry without re-scan, abort/cleanup/lock | ADD | component/service tests |
| worker-app/src/services/api/orderService.js | media adapter | JSON image only | byte upload then existing JSON images | MODIFY | upload adapter tests |
| worker-app/src/features/face-verification/utils/faceStatus.js; components/FaceIdentityCard.jsx; components/FaceLoginPrompt.jsx | copy/summary | daily-based | enrollment/order guidance | MODIFY | status/prompt tests |
| AI service, template-crypto, schema/SQL, Face Core issuer/guards | all | fail-closed/versioned | unchanged | KEEP | existing security suites |

## Contract

Existing POST /api/orders/:id/images remains JSON {type,url}; BEFORE now requires valid unconsumed scoped proof and a storage resource verified for the current worker/order/arrival. It never consumes proof. New POST /api/orders/:id/before-media accepts one multipart image (JPEG/PNG, <=5MiB), JWT WORKER, proof checked before cloud storage and after upload, returns {success:true,data:{url}}. Cloudinary bytes use deterministic public id scoped worker/order/arrival/content hash; repeated uploads reuse immutable asset. Start endpoints/FSM unchanged. No migration.

PAD approval registries remain untouched; real biometric success is BLOCKED. Executed results follow below.


## Phase 2/3 — Kết quả triển khai

### Backend

- `WorkersService.updateAvailability`: bỏ cả legacy timestamp gate và requireDaily ở online; giữ boolean/GPS/ACTIVE/APPROVED/services, recheck trong workerTx khi core enabled. Không thêm template prerequisite vào online/accept, đúng quyết định của spec.
- `OrderWorkflowService.transition` nhánh accepting: bỏ requireDaily/legacy requireFace tại accept. Actor/current assignee/online/approval/not-busy/FSM/locks giữ nguyên. Nhánh Start, quote, AFTER, settlement và socket commit behavior không đổi.
- `FaceCoreService.requireOrderProof` tách nguyên phần lookup/authorization từ consumeOrder; `consumeOrder` gọi helper rồi conditional update count=1 và audit, vẫn chạy trong transaction Start hiện hữu. BEFORE chỉ gọi helper đọc, không consume/issue/refresh proof.
- `OrderBeforeMediaGuard` kiểm JWT-derived user/worker + scoped proof/current ARRIVED trước multipart interception. Controller class JWT/RolesGuard và route WORKER vẫn hoạt động.
- `OrderBeforeMediaService`: reuse Cloudinary SDK cấu hình hiện có và validateDiagnosisImage/error mapper; memory upload<=5MiB JPEG/PNG; Cloudinary giải mã ảnh thật khi upload. Deterministic immutable publicId theo worker/order/arrival/content digest, overwrite=false. Storage API resource phải xác nhận public_id/type/bytes/secure_url khớp, không nhận URL HTTP/local/base64 hoặc namespace worker/order khác. Resource404 trả BEFORE_MEDIA_NOT_VERIFIED. Không fetch URL tùy ý từ client.
- `OrdersService.uploadImage` BEFORE: authorize → verify storage resource ngoài DB transaction → authorize lại dưới worker/order locks → dedupe/create OrderImage với DB clock. Epoch/proof expiry/revoke/assignment race đều recheck trước ghi. ISSUE/AFTER đi nguyên logic cũ.

Storage và DB không cùng ACID transaction: upload xong nhưng revoke/network/DB lỗi có thể để asset chưa được tham chiếu. Không xóa ngay vì request đồng thời có thể dùng asset; deterministic ID cho retry. Không phát proof/đổi trạng thái order khi upload thất bại. Việc kiểm storage thực bằng SDK đã triển khai; vận hành với cloud account thật vẫn NOT_VERIFIED, không thay bằng URL giả ở runtime.

### Worker App

- Dashboard online không fetch/require Daily proof; giữ profileRestriction, active-order recovery, GPS permission và ACK/refetch từ backend. Link quản lý enrollment vẫn có.
- Face screen mặc định enrollment nếu không order, ORDER nếu có order; explicit daily mode giữ compatibility nhưng không target navigation nào ép đi Daily. Enrollment/proof success về home hoặc đúng job kể cả deep link; giữ order context khi chuyển enrollment/reset.
- FaceSummary/FaceLoginPrompt/FaceIdentityCard dùng trạng thái enrollment, bỏ Daily expiry/copy bắt buộc đầu ca. Không tự mở camera hoặc cấp consent khi login.
- Job dùng `jobReadiness`: backend ARRIVED + canVerifyOrder + scoped current proof → BEFORE; ảnh BEFORE persisted sau ARRIVED → Start; proof không hợp lệ → FaceID; ngoài ARRIVED không hiện chuỗi scan/BEFORE. Có timer1s cập nhật expiry (không poll API mỗi giây), status error/retry và synchronous mutation ref lock chống double tap.
- `BeforePhotoCapture`: embedded rear CameraView cho hiện trường, không face guidance trên ảnh đồ vật; permission/loading/error, chụp lại, sync capture/upload lock, abort khi background/unmount, cleanup cache/blob. Upload bytes qua orderService.uploadBeforeMedia; giữ URL ACK trong RAM nếu JSON save cần retry, tránh upload lại. Start chỉ mở sau refetch OrderImage từ backend, không set local hasBefore=true.
- Hết hạn trước Start: yêu cầu xác minh lại; BEFORE đã persisted vẫn ở backend. Sau IN_PROGRESS không quay lại scan. Current/detail refetch dùng hook có sẵn trên focus/foreground/reconnect/status event.

## API contract trước và sau

| Endpoint | Trước | Sau |
|---|---|---|
| PATCH /api/workers/status; /api/workers/me/availability | requires Daily khi online | cùng request/response; bỏ Daily gate; giữ professional/GPS/services gates |
| POST/PATCH /api/orders/:id/accept | requires Daily | cùng contract; không Daily; giữ actor/online/approval/busy/assignment/FSM |
| POST /api/orders/:id/before-media | không có | ADD multipart `image`, JWT WORKER + valid ORDER proof @ARRIVED; response `{success:true,data:{url}}`; memory5MiB JPEG/PNG; Cloudinary resource verified; không OrderImage/proof consume |
| POST /api/orders/:id/images | JSON `{type,url}`, BEFORE không proof | vẫn JSON `{type,url}` và `{success:true,image}`; BEFORE require scoped valid proof và verified cloud resource đúng worker/order/arrival; không consume; ISSUE/AFTER giữ nguyên |
| PATCH /api/orders/:id/start / PATCH status IN_PROGRESS | consumes ORDER proof + BEFORE/quote/FSM transaction | KEEP, cùng request/response và atomicity |
| Face status/sessions/capture/consent/review/withdraw | existing secure protocol | KEEP contracts, model/threshold/nonce/crypto/PAD gates |

New errors: STORAGE_NOT_CONFIGURED (503), BEFORE_MEDIA_NOT_VERIFIED (400), ARRIVAL_HISTORY_REQUIRED (400); existing upload errors IMAGE_INVALID/STORAGE_TIMEOUT/STORAGE_UNAVAILABLE; proof/scope/consent errors lấy từ shared FaceCore predicate. Local captures không được gửi làm URL vào JSON API. Old BEFORE callers dùng arbitrary URL sẽ bị reject có chủ đích.

## Phase 4 — Kết quả chạy thực tế

| Kiểm tra | Command / phạm vi | Kết quả |
|---|---|---|
| Backend unit | server: npm test -- --runInBand --silent | PASS:25 suites,258 tests (main run sau thay đổi source cuối) |
| Bổ sung AC-05 | server: npm test -- --runInBand --silent --runTestsByPath src/modules/workers/face/face-worker-flow.spec.js | PASS:10 tests, gồm4 case mới; tổng262 unit cases khác nhau đã chạy qua khi cộng main run và additions |
| Worker suite | worker-app: npm run test:ci -- --silent | PASS:23 suites,173 tests |
| Worker navigation/upload adapter bổ sung | worker-app: npm run test:ci -- --silent --runTestsByPath __tests__/faceNavigation.test.js __tests__/beforeMediaApi.test.js | PASS:2 suites,5 tests; tổng178 Worker cases |
| PostgreSQL + HTTP/Socket/FSM | server: node test/face/run-isolated.cjs --arc01 | PASS:67 Face Core integration +19 ARC-01 E2E; apply/catalog/diff/rollback/reapply trên disposable container riêng đều PASS |
| Backend build | server: npm run build | PASS:Babel compiled176 files |
| Android JS bundle | worker-app: EXPO_NO_TELEMETRY=1 npx expo export --platform android --output-dir /tmp/fixgo-one-scan-android | PASS:1156 modules/Hermes bundle; đây không phải APK/native device test |
| Diff formatting | git diff --check | PASS |
| Cloudinary account upload thật | không gửi ảnh lên cloud account trong audit/test này | NOT_VERIFIED; unit/HTTP adapter tests mock storage, không claim cloud-live PASS |
| Android APK/ML Kit/camera device | chưa chạy APK/device | NOT_VERIFIED |
| PAD thật/biometric benchmark | registries source vẫn rỗng | BLOCKED / NOT_VERIFIED real performance |

Không có FAIL còn mở trong các suite cuối đã chạy. Lượt đầu phát hiện import Modal bị thiếu khi bỏ popup Daily, fixture UI còn cho Start khi chưa BEFORE, và fixture integration thiếu identityModelReady/expected error cũ. Đã sửa import và fixtures theo contract source thực, không đổi policy để ép pass; assertions vẫn kiểm no template/no proof và rollback. Lệnh npm test ở repository root không có package.json không chạy được; các kết quả hợp lệ ở bảng là chạy đúng server/worker-app.

Integration runner tạo và hủy **chỉ container disposable do chính runner sở hữu**, URL loopback random port, DB isolation guard. Không dùng DATABASE_URL của project làm fallback, không thao tác DB chính, không dừng service/container của agent khác. Test fixture evidence chỉ ở tests; không thêm runtime bypass/PAD approval flag hoặc record.

### Ma trận AC-01 đến AC-15

| AC | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|
| AC-01 | PASS (component/hook) | faceNavigation,faceLoginPrompt,faceScreen: login/profile không auto camera/session; enrollment success không Daily |
| AC-02 | PASS (fail-closed tests); BLOCKED real enrollment | gateway/PAD preguard + isolated integration: không approved PAD thì không trusted template/proof mới |
| AC-03 | PASS | WorkersService unit + enabled-core PostgreSQL case không template/Daily; GPS/ACTIVE/APPROVED/services negative cases; dashboard no Daily |
| AC-04 | PASS | ARC-01 accept thiếu Daily thành công, competing workers/one-worker-two-orders/busy/ownership safeguards |
| AC-05 | PASS |4 core unit stage/owner negatives; integration wrong worker/order/session authority |
| AC-06 | PASS | media unit/HTTP preguard reject missing proof trước cloud; isolated requireOrderProof và Start no-proof |
| AC-07 | PASS (fixture/adapter); NOT_VERIFIED cloud-live | bytes multipart→scoped resource verify→JSON OrderImage; no consume; client service/component tests; actual cloud account chưa chạy |
| AC-08 | PASS (isolated evidence) | concurrent Start→one history/event/consume; component proof+BEFORE→Start no extra scan |
| AC-09 | PASS (storage mock/error) | upload failure no DB write/consume; scene capture giữ để retry; không gọi JSON save khi storage lỗi |
| AC-10 | PASS (isolated/mock) | BEFORE giữ sau quote/start error; consumedAt rollback; proof expiry denies; client URL ACK reuse/reload |
| AC-11 | PASS (fixtures) | deterministic asset identity+DB dedupe; doubletap UI sync locks; worker recovery; concurrency one event/consume |
| AC-12 | PASS (isolated/mock) | wrong order/worker/expiry/consumed/revoked/template/epoch; arbitrary URL rejected; revoke during inference/upload |
| AC-13 | PASS (regression tests) | ARC settlement/AFTER/generic FSM + ISSUE/AFTER image tests; IN_PROGRESS UI không scan lại; không sửa payment code |
| AC-14 | NOT_VERIFIED | native APK + physical Android/front/back camera/ML Kit/permissions/background chưa kiểm; Android JS export PASS không thay bằng chứng |
| AC-15 | BLOCKED / NOT_VERIFIED | Python/Nest approval registries untouched; chưa có evaluated PAD/biometric dataset approved; không báo real biometric PASS |

## Blocker và verification items bàn giao

1. **PAD approval thật:** cần protocol/data/evaluation/approval hợp lệ trước enrollment/ORDER proof production; code vẫn trả fail closed. Không có thay đổi AI/model/threshold/crypto.
2. **Review expiry:** test disposable đã tái hiện status.canVerifyDaily=true với review hết cửa sổ nhưng ORDER session INSERT bị DB trigger BIOMETRIC_SESSION_AUTHORITY_INVALID. Đây là bug/policy discrepancy tồn tại, giữ nguyên source/SQL vì intended semantics chưa được xác nhận. Không migration hoặc tự gia hạn/re-enroll.
3. **Cloud deployment:** cần xác nhận Cloudinary credentials/permissions/quota/latency và upload_stream overwrite=false trả existing resource với public_id + secure_url tương ứng trên account thật. Code dùng SDK có thật và verify resource server-side; tests storage synthetic không chứng minh deployed service. Không dùng public diagnose/avatar endpoint để giả upload BEFORE.
4. **Android thật:** APK/dev build cần camera permission denied/permanent denied, front ML Kit guidance, rear BEFORE capture, back navigation, background/foreground, reconnect, slow storage/proof expiry và memory/cache cleanup. Test đối chiếu DB stage/proof, không tin UI success đơn lẻ.
5. **Storage/DB atomicity:** có thể có orphan asset sau upload nhưng DB reject/ACK mất; không có cleanup job mới trong phạm vi tối thiểu. Retry cùng bytes dùng deterministic ID, DB dedupe dưới lock; proof chưa consumed. Không hứa exactly-once HTTP delivery.

Không có migration. Không sửa Customer App, payment, AI Recommendation, AI service/weights/thresholds, .env hoặc DB chính. Không commit/push/merge. Các tài liệu audit/spec cũ không bị ghi đè; file này là handover của lần triển khai.
