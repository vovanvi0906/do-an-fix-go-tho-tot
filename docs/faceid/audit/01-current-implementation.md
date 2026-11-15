# 01 — Current implementation audit

Ngày 15/11/2026 (Asia/Ho_Chi_Minh). Chỉ phân tích, không implement source.

## Git và chứng cứ

Root `/home/vanvi/Work/do-an-fix-go-tho-tot`; branch `update/face-id-cho-workerapp`; HEAD `47d2387af10509118d901b10be76c72d74de70a2`. `git status --short` ban đầu rỗng. HEAD gồm merge lab `87ecefd`, `0962aa3`; không suy ra branch worktree khác đã merge.

Worktrees: root 47d2387; fixgo-backend 90ea0bb; fixgo-codex 9db1016; fixgo-faceid-lab 52fb0e7; fixgo-gemini 9e77da5; fixgo-integration-s03 06b6e72; fixgo-recommendation-lab 19a8a33. Không reset/commit/merge hay đụng dịch vụ các worktree.

Không tìm thấy AGENTS.md áp dụng. `docs/faceid/FIXGO-FACEID-ONE-SCAN-IMPLEMENTATION.md` không tồn tại; dùng yêu cầu đính kèm, không tạo đầu vào giả. Báo cáo cũ `docs/ai-core-audit-02/00-executive-summary.md:11` nói fail-open/timestamp; source hiện tại có durable proof/encrypted template, và `server/src/infrastructure/external/ai/face-result.js:17` luôn trả false cho legacy trusted proof. Không áp kết luận lịch sử lên HEAD mới.

Chưa kiểm env/service đang chạy, migration đã apply trên DB, storage credentials/ACL, Android thật hay PAD thật. Không đọc/in secret, ảnh cá nhân, embedding; không chạy test tạo template/proof.

## Worker source map

Mỗi dòng gồm chức năng, caller/callee, I/O, authority, reuse và vị trí sửa.

| Source/function | Caller → callee; I/O | State, reuse và gap |
|---|---|---|
| `worker-app/app/(worker)/verification/face.jsx:9` FaceVerificationScreen | dashboard/profile/job → useFaceVerification(orderId,mode), LiveFaceCamera; route params → modal/URI | Backend status, local consent. MODIFY mode:12, navigation:20, success modal:60; enrollment hiện ép Daily, verified router.back không bảo đảm về job khi deep link |
| `worker-app/src/features/face-verification/hooks/useFaceVerification.js:11` | screen → status/consent/review/session/capture/template APIs; URI→backend result→refetched proof | KEEP secure protocol; MODIFY enrollment message:130. Nonce/requestKey/capture RAM; refresh:32 xóa pending capture; verify:109 kiểm proof ID/version/scope/TTL sau refetch. Không coi enrollment là verified |
| `worker-app/src/features/face-verification/components/LiveFaceCamera.jsx:18` | screen → CameraView + ML Kit + captureQuality; output URI | KEEP sampled guidance, 1.3s auto stability, final ML Kit recheck, cleanup. Native build/device NOT_VERIFIED; không phải PAD |
| `worker-app/src/features/face-verification/components/LiveFaceCamera.web.jsx:14` | screen → getUserMedia/MediaPipe/canvas; output blob URI | KEEP BlazeFace `/faceid/blaze_face_short_range.tflite`, GPU→CPU, release tracks. Assets/HTTPS/browser runtime NOT_VERIFIED. Không tái dùng face camera cho ảnh hiện trường BEFORE |
| `worker-app/src/features/face-verification/components/FaceLoginPrompt.jsx:12` | WorkerLayout→profile/status→facePrompt→face screen | Advisory mỗi auth session/sessionEpoch, owner/abort checks. MODIFY note:104 và summary để bỏ daily; giữ skip không cấp quyền |
| `worker-app/src/features/face-verification/components/FaceIdentityCard.jsx:6` | profile→faceSummary/faceExpiry | Backend status + timer; MODIFY subtitle và Daily expiry, giữ layout/refresh |
| `worker-app/src/features/face-verification/hooks/useWorkerFaceStatus.js:8` | profile→faceIdentityService | KEEP focus/foreground, Promise.allSettled, owner/generation/abort fence; không local authority |
| `worker-app/src/features/face-verification/services/proof.js:2` | hook/job/eligibility→isCurrentFaceProof | KEEP UI predicate scope/version/consumed/time; backend rechecks epoch/model/revocation |
| `worker-app/app/(worker)/(tabs)/index.jsx:24` WorkerDashboardScreen | status PATCH, accept POST, current order GET | MODIFY loadProfile:31 (chỉ giữ dailyProof), changeAvailability:58 (Daily gate), modal:186/banner:227. Giữ GPS/services/approval/active-order và backend ACK |
| `worker-app/app/(worker)/job/[id].jsx:13` WorkerJobDetailScreen | GET order/profile/scoped face status; PATCH status | Backend recovery. MODIFY load:20, proof:28, ARRIVED action:144. Chưa có BEFORE camera/upload; start trực tiếp dẫn MISSING_BEFORE_PHOTO; pending state chưa lock đồng bộ, không timer TTL |
| `worker-app/src/services/api/orderService.js:76` uploadImage | caller→POST images JSON | KEEP ISSUE/AFTER; ADD multipart method. Không upload file bytes hiện tại |
| `worker-app/src/features/auth/services/workerEligibility.js:3` | dashboard→hasShiftVerification/profileRestriction | MODIFY thêm enrollment predicate; KEEP role/active/approval/services và legacy helper cho compatibility |
| `worker-app/src/features/orders/hooks/useOrderRecovery.js:7` | dashboard/job→loader | KEEP focus/foreground/socket refetch, generation fence. Không persist proof. Job cần TTL render và status error retry |
| `worker-app/src/features/booking/services/bookingService.js:90` | booking cũ→uploadImage | Gửi imageUrl/type EVIDENCE khác DTO url/type ISSUE; KEEP ngoài target, không dùng làm BEFORE uploader |

Search worker-app không thấy màn BEFORE trong worker route. `worker-app/src/store/useOrderStore.js` có beforeImage nhưng job mới không import store này. Đây không phải server photo evidence. Layout gắn FaceLoginPrompt tại `worker-app/app/(worker)/_layout.jsx:20`; profile gắn FaceIdentityCard và useWorkerFaceStatus.

## Backend call graph và gate coverage

```text
JWT WORKER → FaceIdentityController.status → FaceIdentityService.status
  core enabled → FaceCore.status; disabled → LEGACY_UNTRUSTED/fail-closed capabilities
FaceCoreController.session → createSession → ready → workerTx
  worker lock → consent → orderAccess(ORDER current owner, ARRIVED)
  → requestKey duplicate/quota → trusted template/review → session + HMAC nonce
capture → FaceReadyGuard.authorizeCapture → memory multipart → submit
  workerTx claim PROCESSING → decrypt template → gateway → FastApiAiClient → Python
  finish(workerTx) → recheck epoch/scope/review/consent/quality/PAD
    ENROLLMENT → encrypted template + SUCCEEDED, no proof
    DAILY/ORDER → SUCCEEDED + durable scoped proof
PATCH workers/status → WorkersService.updateStatus → workerTx → requireDaily
POST accept / PATCH status MATCHED → OrderWorkflow.transition → requireDaily
POST start / PATCH status IN_PROGRESS → OrdersService → OrderWorkflow.transition
  worker then order lock → actor/owner/FSM → consumeOrder
  → BEFORE after arrival + quote approval → update/history → commit → socket event
POST orders/:id/images → uploadImage → order lock → actor/owner/stage
  → HTTP URL/dedupe → OrderImage (currently no order proof check)
```

- requireDaily chỉ có **2 production callers**: `server/src/modules/workers/workers.service.js:248` (online), `server/src/modules/orders/order-workflow.service.js:190` (accept). Alias ASSIGNED→MATCHED cũng vào đây.
- Disabled legacy gates tại workers.service:214 và workflow requireFace:68/accept:191/start:208 đều fail closed qua face-result:17. Không được tắt core flag để bypass.
- consumeOrder caller workflow:206; createSession caller `face-core.controller.js:98`; authorizeCapture caller `face-ready.guard.js:8`; submit controller:115 và :153; finish core:800.
- `recordConsent()` là hook FE:144, gọi POST consent→core.consent:412; không có core.recordConsent. withdraw controller:182→core:555→revoke:512.
- startWork `orders.controller.js:535`→`orders.service.js:810`→updateStatus:461→transition; workflow wrapper:334 cũng dùng transition. Generic PATCH không bypass. ADMIN start khóa worker trước order tại workflow:99 và cũng consume proof.
- Controller Face Core JWT/WORKER: `face-core.controller.js:60`; Admin JWT/ADMIN:188, service còn kiểm ACTIVE. `FaceIdentityController.status` tại `face-identity.controller.js:16` delegate core khi enabled.
- JSON submit không có multipart preguard nhưng cùng submit rechecks. DTO JSON photo max 90k ký tự (`server/src/modules/workers/dto/face-core.dto.js:53`), multipart 5MB; Worker dùng multipart.

`face-core.service.js:978` phát durable proof với sessionId unique, worker/order/template/version/model/epoch/PAD/policy/score; DB clock và TTL. `face-core.config.js:11`: session 120s, Daily 8h, Order 5 phút. Enrollment branch:909–959 không tạo proof.

`consumeOrder():1049` query consent/current template/epoch/TTL/unconsumed/unrevoked, current owner+ARRIVED, conditional updateMany count=1 và audit. Cùng transaction workflow:85; lỗi BEFORE/quote rollback cả consume/audit/history/order, event chỉ sau commit:302. Source dùng row locks + Prisma default transaction, **không cấu hình explicit Serializable**.

Gap security: upload BEFORE chưa kiểm proof; consume chưa gọi ready/current model/PAD approval hay review độc lập. status vẫn có thể trả metaProof trong khi blockers khác có mặt; UI hiện chỉ predicate proof. BEFORE upload: `orders.service.js:465` chỉ JSON URL, stage ARRIVED, current assigned worker; image không lưu uploader FK. start kiểm BEFORE **trước IN_PROGRESS**, không phải sau start.

## AI routes và model pipeline

| Chức năng | Source thật | Contract |
|---|---|---|
| Enrollment | `ai-service/face_router.py:54` POST /ai/face-enroll→enroll_capture `face_core.py:129` | embedding chỉ nội bộ khi quality + evaluated PAD PASS; verified=false, method yunet_sface_embedding |
| Detection/quality | `face_core.py:72` extract_embedding | Không có route detection production riêng; exactly 1 face, detection≥.6, size≥80px, box trong ảnh, brightness 40–220, Laplacian variance≥60 |
| Embedding/matching | `face_core.py:97`, :105; `face_router.py:48` POST /ai/face-verify, alias /api/v1/ai/verify-face | SFace alignCrop 5 landmarks, 128 floats; cosine≥.60 provisional; MATCH không là PAD/proof |
| Capabilities | `face_router.py:35` GET /ai/face-capabilities | x-face-service-token, identityModelReady tách evaluated PAD |
| PAD | `face_pad.py:11` EvaluatedMn3Pad; `main.py:247` | Chỉ attach nếu FACE_PAD_MODEL_PATH có; exact version/crop/preprocess/hash approved |
| Research | `face_research_app.py:39`, :47 GET /research/capabilities, POST /research/infer | ASGI tách, token/isolation/protocol; researchOnly=true, verified/enrolled=false, proof=null; score MEASURED không cấp proof |

YuNet `face_detection_yunet_2023mar.onnx` và SFace `face_recognition_sface_2021dec.onnx`: pinned SHA256 trước/sau OpenCV load ở `ai-service/face_models.py:6`; main dùng FACE_MODEL_DIR hoặc weights:237. JPEG/PNG inline≤5MB, PIL kiểm≤12M pixels trước OpenCV BGR (`face_core.py:43`). Không thay threshold/model.

MN3 ở `ai-service/pad_mn3.py:14`: experimental anti-spoof hash c4c99af0…, profile bgr-u8-128-to-rgb-nchw-normalized-v1; tight YuNet bbox floor/ceil clamped, resize linear 128; RGB normalized bằng MEAN/SCALE→[1,3,128,128], OpenVINO CPU, output [real,spoof], timeout poison provider. `ai-service/pad_policy.py:36` registry rỗng và `server/src/modules/workers/face/face-evidence.gateway.js:5` allowlist rỗng: **source chưa cho phép cấp proof thực**. Phải có evaluation thật và reference trùng ở hai phía; env không tự phê duyệt.

**Runtime load-only đã chạy**: `.venv/bin/python -B` load YuNet/SFace từ weights thành công, identityLoad=true,error=null, version đúng hash pinned. Không đọc ảnh, không inference, không DB. Path.rglob weights không tìm artifact tên chứa spoof/mn3; không suy ra toàn máy không có MN3. Approved PAD records=0. Không chứng minh service production đang chạy dùng model đó. ML Kit/BlazeFace runtime chưa thử.

Production call: FaceCore→FaceEvidenceGateway→`FastApiAiClient.verifyFaceTemplate:89 / enrollFaceTemplate:136`→Python production router. Legacy verifyFace:70 không cấp trusted proof; face_test_app là lab app, không authority production.

## Database và FSM

| Model — server/prisma/schema.prisma | Khóa/constraint và recovery fields |
|---|---|
| BiometricState:534 | workerId PK/FK, epoch,lastVersion,consentVersion/At,withdrawnAt |
| BiometricReview:546 | worker/reviewer FKs, unique(id,workerId,epoch), approved/expiry/revoked/evidence digest |
| BiometricTemplate:568 | unique(workerId,version), composite review binding, encrypted/keyId/model/epoch/revoked/deleted; AES256GCM AAD worker/version/model (`template-crypto.js:4`) |
| BiometricSession:591 | unique(workerId,requestKey); workerId+userId FK; composite review/template; order FK RESTRICT; state/nonceHash/claim/attempts/digest/expiry |
| BiometricProof:626 | sessionId unique; composite session/template/order bindings; worker/order/epoch/model/time/consumed/revoked |
| BiometricAudit:655 | id PK,index worker/time; actorId/workerId scalar **không FK**; pending requests dùng append-only audit/resolution |
| Order:191 | worker FK, status enum, updatedAt/startedAt, images/history/proofs |
| OrderStatusHistory:246 | order FK,status,changedBy,createdAt; arrival evidence |
| OrderImage:259 | order FK,type,url,uploadedAt,description; chỉ index orderId, **không uploader FK/unique URL**; dedupe qua order lock/findFirst |

Đọc cả SQL `server/prisma/migrations/20261113190000_face_core_v2/migration.sql` và `20261113200000_face_binding_hardening/migration.sql`: CHECK/immutability/audit protections, composite FKs, authority triggers, current ARRIVED owner khi insert session/proof. Chưa xác minh DB deploy.

**B02:** core.identityReview:133 bỏ expiry cho review của template đã enroll, nhưng SQL hardening `biometric_validate_session_insert` đòi r.expiresAt>clock_timestamp() cho mọi purpose. Sau cửa sổ review, status có thể canVerify=true nhưng INSERT bị trigger từ chối. Giữ DB restrictive behavior trước khi policy được quyết định, hiển thị blocker sớm; không tự gia hạn hay re-enroll mỗi order.

FSM `server/src/modules/orders/constants/order-status.js:53`: SEARCHING_WORKER→MATCHED→WORKER_EN_ROUTE→ARRIVED→IN_PROGRESS→AWAITING_ACCEPTANCE→AWAITING_PAYMENT→COMPLETED. Alias cũ normalize:33. Proof/BEFORE là substate ARRIVED; không cần enum/schema mới. AFTER và payment giữ nguyên.
