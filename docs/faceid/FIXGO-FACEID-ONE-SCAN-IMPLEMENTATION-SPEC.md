# FIXGO — FACEID ONE-SCAN: ĐẶC TẢ THAY ĐỔI DỰA TRÊN AUDIT

> Cập nhật 2026-11-15: yêu cầu duyệt danh tính thủ công đã được thay bằng tự đăng ký từ lần quét đầu. Xem [SELF-ENROLLMENT-IMPLEMENTATION.md](./SELF-ENROLLMENT-IMPLEMENTATION.md). Các mô tả bắt buộc admin/reviewerId/thời hạn review bên dưới là lịch sử, không còn áp dụng cho luồng mới.


> **Loại tài liệu:** yêu cầu nghiệp vụ + hợp đồng triển khai + tiêu chí kiểm thử. **Không phải xác nhận code đã được sửa.**
>
> **Nguồn:** `doc/bao-cao-face-id-hien-tai.md` (bản báo cáo ngày 15/11/2026 được cung cấp). Các `path:line` bên dưới là vị trí **theo báo cáo**, agent phải mở lại source workspace trước khi sửa; nếu lệch, ghi rõ và theo code thực tế.
>
> **Mục tiêu:** giao diện thợ cho phép **đăng ký khuôn mặt một lần**, và khi đến từng đơn thì **quét FaceID một lượt hợp lệ trước khi chụp BEFORE**, sau đó bắt đầu công việc. Không bắt quét Daily trước khi bật online/nhận đơn. Trường hợp xác thực thất bại, hết hạn, thu hồi cần quét lại; không hứa “một lần” bất chấp lỗi.

## 1. Sự thật từ audit — tuyệt đối không bỏ qua

| ID | Kết luận hiện có | Source theo báo cáo | Tác động |
|---|---|---|---|
| F01 | Face Core đã có consent, identity review, session+nonce, template mã hóa, Order Proof và proof consume theo transaction. | `server/src/modules/workers/face/face-core.service.js:169,570,678,870,1049` | **Tái sử dụng**, không thiết kế lại Face Core. |
| F02 | Worker app native đã có ML Kit+expo-camera; web đã có BlazeFace; server dùng YuNet/SFace, MN3 ở đường PAD có điều kiện. | `worker-app/src/features/face-verification/components/LiveFaceCamera.jsx:14`, `ai-service/face_models.py:20`, `ai-service/face_pad.py:11` | **Không thay AI model**; không tích hợp FaceNet512/DeepFace/Silent-Face ở phạm vi này. |
| F03 | Daily gate ở UI, worker online API và Order accept. | `worker-app/app/(worker)/(tabs)/index.jsx:68`, `worker-app/src/features/auth/services/workerEligibility.js:1`, `server/src/modules/workers/workers.service.js:248`, `server/src/modules/orders/order-workflow.service.js:190` | Bỏ **đúng gate Daily** theo policy mới, không bỏ JWT/role/online/approval/services/GPS. |
| F04 | `ORDER` session chỉ tạo được cho worker sở hữu đơn `ARRIVED`, Order Proof mặc định TTL 5 phút. | `face-core.service.js:561,570`, `worker-app/app/(worker)/job/[id].jsx:144` | Dùng lại capture/proof theo `orderId`. |
| F05 | UI job hiện **chưa có camera/upload BEFORE**. API `POST /api/orders/:id/images` chỉ nhận JSON `{type:'BEFORE',url}`; server không upload bytes ở endpoint này. | `worker-app/app/(worker)/job/[id].jsx:117`, `server/src/modules/orders/orders.service.js:465`, `server/src/modules/orders/dto/upload-order-image.dto.js:1` | Phải có capture, upload ảnh lên storage phù hợp rồi mới lưu URL qua API; tuyệt đối không nhầm POST images là multipart. |
| F06 | `start` chuyển ARRIVED→IN_PROGRESS chỉ khi scoped proof hợp lệ, BEFORE đã lưu sau ARRIVED, quote được approved nếu cần; `consumeOrder` cùng transaction, rollback khi lỗi. | `server/src/modules/orders/order-workflow.service.js:200-216`, `face-core.service.js:1049` | **Giữ** gate start & transaction; không chuyển trạng thái trước BEFORE. |
| F07 | `uploadImage()` chưa yêu cầu Order Proof; chỉ kiểm worker/ownership/ARRIVED/url. | `server/src/modules/orders/orders.service.js:465` | Cần quyết định và thực thi policy **BEFORE chỉ sau FaceID** tại backend, không chỉ UI. |
| F08 | Python `APPROVED_EVALUATIONS` và Nest `APPROVED_FACE_PAD` đang rỗng; enrollment/proof thật bị BLOCKED. | `ai-service/pad_policy.py:36`, `server/src/modules/workers/face/face-evidence.gateway.js:5` | Không tự điền approval giả/giảm threshold/skip PAD; báo rõ blocker. |
| F09 | Face review expiry có khả năng lệch giữa service và SQL trigger; test fixture integration thiếu `identityModelReady`. | `face-core.service.js:133`, `server/prisma/migrations/20261113200000_face_binding_hardening/migration.sql:164`, `server/test/face/core.integration.js:49` | Xác minh bằng test trong DB cách ly, không tùy tiện sửa production schema. |
| F10 | Client có recovery/refetch, nhưng job proof TTL không có timer; start double-tap chỉ dựa state React. | `worker-app/src/features/orders/hooks/useOrderRecovery.js:7`, `worker-app/app/(worker)/job/[id].jsx:22,38` | Thêm xử lý expiry/refetch/loading/retry và double-tap an toàn. |

## 2. Luồng nghiệp vụ mục tiêu (quyết định)

### 2.1 Đăng ký khuôn mặt (một lần cho một template hợp lệ)

`Login → FaceID profile → consent đúng version → yêu cầu review nếu bắt buộc → Admin review bằng chứng danh tính → ENROLLMENT session → camera guidance → gửi ảnh/nonce → AI quality + evaluated PAD → lưu encrypted template → ENROLLED`.

- Enrollment **không** cấp Daily/Order proof, không thay thế xác minh theo đơn.
- Không dùng ảnh từ gallery thay camera ở luồng xác thực; backend không tin embedding/workerId do client đưa vào.
- Template hợp lệ được tái sử dụng giữa các đơn, trừ khi bị revoke/model version thay đổi/được duyệt re-enrollment.
- Nếu PAD chưa được phê duyệt thì hiển thị đúng `BLOCKED`, không nói đã đăng ký thành công.

### 2.2 Mỗi đơn một lượt quét khi đến nơi

`Đăng nhập → Bật online (các gate nghiệp vụ khác) → Nhận đơn → WORKER_EN_ROUTE → ARRIVED → Order FaceID (đúng worker+order) → [valid persisted Order Proof] → mở camera BEFORE → upload bytes lên storage phù hợp → POST /orders/:id/images {type:'BEFORE',url} → PATCH /orders/:id/start → IN_PROGRESS`.

- Bỏ Daily check-in khỏi **luồng mục tiêu** và mọi call-site tương ứng; không xóa schema Daily/Proof vì có thể liên quan compatibility. Xác định rõ policy mới về enrollment: **thợ chưa đăng ký có thể vào app/xem thông tin nhưng không được đi qua bước xác minh theo đơn; không được suy ra rằng bật online luôn cần template** nếu yêu cầu nghiệp vụ chưa quy định. Thống nhất UI/backend về enrollment prerequisite theo source/đặc tả.
- ORDER proof gắn worker, order, template version, epoch, TTL, unconsumed/unrevoked. UI chỉ hiển thị trạng thái; backend là nguồn quyết định.
- **Không phát sinh quét lại thứ hai** khi user chụp BEFORE hoặc bấm Start nếu proof vẫn hợp lệ. Nếu hết hạn trước Start, cần quét lại (đặc biệt TTL hiện 5 phút); không nới TTL chỉ để demo.
- Trong `IN_PROGRESS` không chụp/quét FaceID lại cho cùng lượt start; không sửa AFTER/acceptance/payment.
- Nếu upload thất bại: vẫn ARRIVED, không consume proof; cho retry upload trong cửa sổ proof còn hiệu lực.
- Nếu upload thành công nhưng start thất bại: ảnh BEFORE vẫn được lưu; reload trạng thái từ server, thông báo gate còn thiếu (proof expiry, quote…), không upload/trừ proof vô hạn.

### 2.3 State-based UI bắt buộc ở màn Job

| Backend status | Backend proof/BEFORE | Hành động UI | Không được làm |
|---|---|---|---|
| MATCHED/WORKER_EN_ROUTE | Bất kỳ | Nhận/di chuyển/đến nơi | Không tạo ORDER face session sớm |
| ARRIVED | Không có proof hợp lệ | `Xác minh khuôn mặt` | Không cho đi chụp BEFORE theo policy mục tiêu |
| ARRIVED | Có proof hợp lệ, chưa BEFORE | `Chụp ảnh trước khi làm` | Không bấm start ngay |
| ARRIVED | Proof hợp lệ, BEFORE đã lưu | `Bắt đầu công việc` | Không yêu cầu scan lần hai |
| ARRIVED | Proof hết hạn/thu hồi | `Xác minh lại` | Không tin state cũ, không start |
| IN_PROGRESS | Đã start thành công | Nội dung công việc / AFTER theo thiết kế hiện hữu | Không quay về face scan/BEFORE |

## 3. Phạm vi sửa dự kiến — agent phải xác nhận source trước

### 3.1 KEEP: ưu tiên không sửa

- `ai-service/face_models.py`, `ai-service/face_core.py`, `ai-service/face_router.py`, `ai-service/face_pad.py`, `ai-service/pad_mn3.py`, `ai-service/pad_policy.py`: giữ pipeline AI/gates. Chỉ sửa bug được chứng minh và được yêu cầu riêng.
- `server/src/modules/workers/face/template-crypto.js`: giữ AES-256-GCM/AAD và embedding 128 chiều hiện tại.
- FaceCore session, nonce, workerTx, identity review, ownership, revoke, idempotency, token validation, proof issuance/consumption và rollback.
- Order FSM, quote/AFTER/customer/payment; `Research` và `face_test_app` không phải đường cấp trusted proof.

### 3.2 MODIFY: ưu tiên sửa nhỏ nhất

1. `worker-app/app/(worker)/(tabs)/index.jsx` và `worker-app/src/features/auth/services/workerEligibility.js` (kiểm tra thêm FaceLoginPrompt/FaceIdentityCard/faceStatus): bỏ phụ thuộc `Daily proof` để online/accept; vẫn hiển thị enrollment khi cần. Không xóa kiểm tra approved/active/services/GPS/busy.
2. `server/src/modules/workers/workers.service.js` ở `updateAvailability()` và `server/src/modules/orders/order-workflow.service.js` ở accept transition: bỏ đúng `requireDaily` nếu hợp lệ theo nghiệp vụ. **Không gỡ requireOrder/consumeOrder ở start**; không nới role/ownership/availability/rate-limit.
3. `worker-app/app/(worker)/job/[id].jsx`: hiển thị rõ ba bước ARRIVED: quét → BEFORE → Start. Refetch scoped `GET face/status?orderId` và order detail sau mỗi bước/foreground; xử lý busy, offline, error/retry, proof expiry và double tap.
4. Chụp/upload BEFORE: ưu tiên tái sử dụng camera/upload/storage adapter có sẵn; không dùng `bookingService.uploadEvidencePhoto` nếu contract sai. Phải xác thực endpoint storage thực và trả URL an toàn trước khi gọi `orderService.uploadOrderImage` JSON. Không lưu ảnh base64 trong OrderImage URL.
5. `server/src/modules/orders/orders.service.js` (`uploadImage`): kiểm Order proof hợp lệ **tại backend** trước khi chấp nhận BEFORE theo policy mới, nhưng **không consume** tại upload. Đảm bảo kiểm tra cùng transaction/locking phù hợp và không làm thay đổi quyền customer ISSUE / worker AFTER.
6. `worker-app/app/(worker)/verification/face.jsx` và `useFaceVerification.js`: giữ enrollment và order flow, chỉnh hướng điều hướng/nội dung sau enrollment/proof theo yêu cầu; không tự mở Daily sau enrollment. Chỉ thay nơi cần thiết.
7. Tests tương ứng cho mỗi thay đổi. Nếu report vs source khác, ghi lại delta và sửa theo source, không ép patch giả định.

### 3.3 ADD chỉ khi chưa có đường tái sử dụng

- UI/component camera BEFORE và client storage upload adapter **chỉ khi** repository không có implementation phù hợp. Thiết kế tối thiểu, không tạo hai luồng song song.
- Test cho policy mới và recovery.

### 3.4 Không làm

Không đổi YuNet/SFace/MN3/ML Kit/BlazeFace; không đổi vector 128→512; không thêm DeepFace/FaceNet512/Silent-Face; không xóa Daily DB tables, API cũ hay legacy nếu chưa xác minh caller; không chỉnh DB production, migration/seed/db push/reset; không sửa Customer App, thanh toán, giá/báo giá, AI Recommendation hoặc các Lab ngoài test liên quan; không commit/push/merge.

## 4. Hợp đồng API mục tiêu và trách nhiệm

| Bước | Endpoint theo audit | Client gửi | Backend phải bảo đảm |
|---|---|---|---|
| State | `GET /api/workers/me/face/status?orderId=:id` | JWT, orderId | Đúng worker/owner; canVerifyOrder, proof metadata chỉ phản ánh server |
| Session | `POST /api/workers/me/face/sessions` | `{purpose:'ORDER',orderId,requestKey}` | ARRIVED + worker own order + review/template/consent/PAD gate |
| Capture | `POST /api/workers/me/face/sessions/:id/capture` | multipart image+nonce | Chống replay, gắn worker/session, chất lượng và PAD |
| BEFORE media upload | **Tìm endpoint thật trong source** | Bytes được phép | Auth/storage validated, kích thước/type, không trả URL giả |
| BEFORE DB | `POST /api/orders/:id/images` | `{type:'BEFORE',url:'https://...'}` | Assigned worker, ARRIVED, proof ORDER còn hạn, lưu/dedupe OrderImage; không consume proof |
| Start | `PATCH /api/orders/:id/start` (hoặc status IN_PROGRESS) | JWT + path id | ARRIVED, scoped proof, BEFORE sau ARRIVED, quote approval; consume proof + order transaction atomic |

- **Server MUST NOT trust:** boolean `verified` từ client, proof object tự tạo, URL giả, client-provided workerId/embedding, testAccepted/research measurement.
- Các error phải được trả rõ: PAD_NOT_EVALUATED, ORDER_FACE_PROOF_REQUIRED, PROOF_ALREADY_CONSUMED, MISSING_BEFORE_PHOTO, QUOTE_NOT_APPROVED, ORDER_ACCESS_DENIED, FACE_STAGE_NOT_ALLOWED, expired/revoked/unauthorized.
- Audit báo cáo endpoint BEFORE chỉ nhận URL; **không được tuyên bố đã có upload bytes** khi chưa chứng minh storage path.

## 5. Các xung đột/rủi ro phải xác minh trước sửa

1. **PAD blocker:** Python + Nest registry rỗng, không thể cấp template/proof thật. Hoàn thiện integration/test fail-closed độc lập nhưng **không tự thêm approval record**, không chuyển test mock thành quyền thật. Nếu mục tiêu là demo thành công, ghi rõ cần protocol/data/evaluation/approval hợp lệ, không sửa an ninh để giả thành công.
2. **TTL ORDER 5 phút:** giới hạn trải nghiệm chụp BEFORE/quote/start. Không tự nâng TTL. Đưa ra tình huống proof hết hạn và bắt xác minh lại.
3. **Review expiry vs SQL trigger:** kiểm tra current template đã enroll nhưng identity review hết hạn; chỉ sửa nếu tái hiện được trên DB test cách ly và xác minh intended semantics. Không migration production tự động.
4. **Upload BEFORE trước Start:** cần storage thật; upload JSON URL không có bằng chứng ảnh được upload an toàn. Tránh client tự coi ảnh local URI là HTTPS public URL.
5. **Không consume proof sớm:** `consumeOrder()` hiện nằm trong start transaction; giữ tính atomic và chống double-spend.
6. **Không vô hiệu các gate khác khi bỏ Daily:** role, ACTIVE, approval, services, GPS, isOnline, not busy, FSM/ownership, consent vẫn cần theo vị trí nghiệp vụ tương ứng.
7. **Source khác audit:** source workspace là ưu tiên, mọi thay đổi phải có `path:function` và test cover; không sửa theo line number tĩnh.

## 6. Test/acceptance criteria (PASS chỉ khi có kết quả)

| ID | Kịch bản | Kỳ vọng |
|---|---|---|
| AC-01 | Worker chưa enrolled đi qua login/profile | Hướng dẫn enrollment; không tự động tạo session/camera hay giả enrolled |
| AC-02 | Consent+review hợp lệ nhưng PAD chưa duyệt | Session/enrollment bị chặn đúng lý do; DB không có trusted template/proof mới |
| AC-03 | Bật online với worker đủ điều kiện khác nhưng thiếu Daily proof | Không còn DAILY_PROOF_REQUIRED theo policy mới; GPS/approval/services vẫn enforced |
| AC-04 | Nhận đơn khi thiếu Daily nhưng worker hợp lệ, online, không busy | Không còn Daily gate; ownership/FSM/assign safeguards giữ nguyên |
| AC-05 | Tạo ORDER session khi chưa ARRIVED/sai worker | 403/4xx hợp lệ; không cấp proof |
| AC-06 | ARRIVED nhưng thiếu proof | BEFORE API bị từ chối đúng policy; Start bị từ chối; UI yêu cầu quét |
| AC-07 | ORDER proof hợp lệ, chụp BEFORE rồi upload bytes và ghi URL | Có OrderImage BEFORE đúng order, đúng giai đoạn; không consume proof |
| AC-08 | Proof hợp lệ + BEFORE sau ARRIVED + quote nếu cần | Start → IN_PROGRESS, consume proof đúng một lần trong transaction; không quét lại |
| AC-09 | BEFORE upload/storage lỗi | ARRIVED giữ nguyên; proof không bị consume; retry có trạng thái rõ |
| AC-10 | BEFORE lưu rồi Start lỗi do quote/proof expiry | Order không sang IN_PROGRESS; rollback consume; ảnh đã lưu còn; hướng dẫn xử lý phù hợp |
| AC-11 | Client double tap/reload/socket reconnect | Không duplicate history/proof consume/uploads, refetch backend authoritative |
| AC-12 | Proof wrong-order, expired, consumed, revoked; template/epoch mismatch | Từ chối và không mở gate |
| AC-13 | IN_PROGRESS và quy trình AFTER/acceptance/payment | Không hồi quy; không yêu cầu quét FaceID lần hai |
| AC-14 | ML Kit native/camera Android thực | Kết quả ghi VERIFIED chỉ khi test trên APK/device; mock không thay bằng chứng |
| AC-15 | Real PAD / biometric quality | Giữ BLOCKED/NOT_VERIFIED đến khi có dữ liệu thực, phê duyệt hợp lệ |

Dùng unit/component/integration với fixture hoặc fake evidence *chỉ trong test harness cách ly* để chứng minh nghiệp vụ có điều kiện; **không viết test hook hoặc environment flag cấp trusted proof tại runtime**.

## 7. Quy trình thực hiện an toàn cho agent

**Phase 0 — Reconcile (bắt buộc trước bất kỳ edit):** đọc `doc/bao-cao-face-id-hien-tai.md` và file này; inspect đúng source/DTO/tests; tìm tất cả call sites `requireDaily`, `hasShiftVerification`, `consumeOrder`, BEFORE service, storage adapter, screenshot route. Ghi 1 bảng KEEP/MODIFY/ADD và conflict audit↔source. Không đụng source trước khi có mapping.

**Phase 1 — Contract-first:** chốt bất biến `ARRIVED → valid Order Proof → BEFORE persisted → Start/consume`. Chốt DTO / response / errors; không thay API không cần thiết.

**Phase 2 — Backend:** thay Daily gates hẹp nhất; enforce proof prerequisite cho BEFORE; giữ transaction consumeOrder tại Start. Viết tests.

**Phase 3 — Worker App:** chỉnh prompt/online, job stepper/camera BEFORE/real upload/refetch; đảm bảo existing enrollment. Viết tests.

**Phase 4 — Verification:** test chuyên biệt, backend integration với disposable DB, mobile checks, build/typecheck; dùng môi trường cách ly đúng quy định repo; báo đầy đủ PASS/FAIL/BLOCKED/NOT_VERIFIED. Không chạy destructive DB command hoặc tác động service agent khác.

**Phase 5 — Handover:** báo file sửa, từng lỗi/tính năng, API contract, trạng thái PAD thực, cách manual test, còn blocker nào. Không tuyên bố full E2E thành công nếu PAD không đủ điều kiện.

Nếu hai agent chạy song song: **Codex sở hữu backend** (`server/**`, backend tests); **Claude sở hữu worker-app** (`worker-app/**`, frontend tests). Không đồng thời sửa cùng file; thỏa thuận API trước, tích hợp qua một agent quản lý. AI service mặc định READ-ONLY. Mỗi agent làm trên worktree riêng nếu có, không git commit/push/merge nếu người dùng chưa yêu cầu.

## 8. Definition of Done

- Đã kiểm toán đúng current source, xác định chính xác call sites và storage path.
- Không còn Daily proof gate ở online/accept theo nghiệp vụ mới; mọi guard khác còn nguyên.
- Có luồng UI thực `ARRIVED → Order FaceID → BEFORE capture/upload/persist → Start`; không còn nút start dẫn đến MISSING_BEFORE_PHOTO do thiếu UI.
- BEFORE upload được backend ràng buộc với proof ORDER; Start consume proof đúng một lần, transactional.
- Enrollment giữ consent/review/template encryption; không có bypass PAD.
- Có test thực thi và báo kết quả cụ thể; biết rõ phần nào BLOCKED (biometric real), NOT_VERIFIED (Android, PAD benchmark, deployed DB).
- Không thay model, không migration/đụng DB chính, không sửa payment/Customer, không commit/push/merge.

**Điều kiện dừng:** Nếu không tìm được storage uploader phù hợp, hoặc phát hiện thay đổi cần migration/vi phạm an ninh, dừng phần bị ảnh hưởng, nêu blocker và phương án tối thiểu; không bịa endpoint, không dùng demo-token/proof để qua gate.
