# AI-FACE-LAB-01: Worker FaceID Testing Lab — báo cáo bàn giao

- Branch: `feature/worker-faceid-lab` · baseline `f6534d6` · ngày 2026-11-14
- Trạng thái: **chưa commit** (theo yêu cầu). Không push/merge/reset.

## 0. Kết luận ngắn

| Hạng mục | Trạng thái |
|---|---|
| Web Lab `ai-faceid-lab/` (Enrollment / Daily / Order / PAD Inspector / Identity Inspector / Debug Timeline / Session-Proof Inspector / PAD trials) | **DONE**. Typecheck, build và 63 test pass |
| Chạy live qua Lab proxy với YuNet/SFace/MN3 thật (ảnh synthetic do server tạo) | **DONE**. Mọi luồng và kiểm thử âm tính đều fail closed |
| Luồng thành công end-to-end Enrollment → Daily → Order proof | **BLOCKED (đúng thiết kế)**. Face Core từ chối ngay khi tạo session với `PAD_NOT_EVALUATED` |
| PAD | **NOT_EVALUATED**. MN3 chỉ đo điểm. Đã thêm gate quyết định PAD; registry đánh giá **rỗng** nên không thể ra PASS |
| PAD security testing (ảnh in / màn hình / video replay) | **NOT MEASURED**. Đã có công cụ ghi trial; chưa có protocol/consent/người tham gia được duyệt |
| Nhận dạng trên khuôn mặt thật (đúng người / người khác / nhiều mặt thật) | **NOT MEASURED**. Chưa có dữ liệu được duyệt |

Lab **không** tuyên bố FaceID an toàn. Không có proof giả, không có cờ bypass PAD và không có thay đổi chính sách quyền.

## 1. Audit Phase 1: thật / mock / heuristic / chưa triển khai

| Thành phần | Loại | Ghi chú |
|---|---|---|
| YuNet detection, SFace align + embedding + cosine (`ai-service/face_core.py`, `face_models.py`) | **Thật** | Model pin SHA-256, không tải tự động |
| Quality (độ sáng = mean gray, độ nét = Laplacian variance, mặt ≥ 80px, det ≥ 0.6) | **Heuristic** | Ngưỡng tạm thời, chưa hiệu chỉnh |
| Ngưỡng cosine 0.60 | **Heuristic, PROVISIONAL** | Chưa hiệu chỉnh trên dữ liệu FixGo |
| `/ai/face-enroll` | **Thật nhưng cố ý không trả embedding** | Luôn `INCONCLUSIVE/PAD_NOT_EVALUATED` → enrollment production không thể thành công |
| PAD production (`pad_contract.UnavailablePad`, `FaceEvidenceGateway.capabilities()`) | **Chưa triển khai (fail closed)** | `padEvaluated:false` được hard-code |
| PAD MN3 (`pad_mn3.py`) | **Thật (inference OpenVINO), chỉ đo** | `assess()` luôn trả NOT_EVALUATED; chỉ dùng ở research app |
| Face Core session / nonce / attempts / idempotency / proof / consumption / withdrawal (`server/src/modules/workers/face/face-core.service.js`) | **Thật** (PostgreSQL, row lock) | Đã test trên PG tạm |
| Daily proof gate (`workers.service.js` → `requireDaily`) và Order proof consumption (`order-workflow.service.js` → `consumeOrder`, ARRIVED→IN_PROGRESS) | **Thật** | Chỉ hoạt động khi `FACE_CORE_ENABLED=true` |
| Endpoint cũ `POST /workers/verify-face-daily` | **Bị chặn** | `FaceCaptureBlockedGuard` |
| Research lab (`server/src/face-research`, `ai-service/face_research*.py`) | **Thật, chỉ đo** | Nest + FastAPI riêng, DB riêng, synthetic mặc định |
| Thành công trong `test/face/core.integration.js` | **Mock evidence** | Gateway stub trả PAD PASS *chỉ trong test* để kiểm tra logic proof |
| Worker App: màn FaceID production | **Không sửa** | Ngoài phạm vi giai đoạn Lab |

Không có `AGENTS.md` trong repo.

## 2. Kiến trúc

```
Browser (ai-faceid-lab, 127.0.0.1:5199, Vite dev proxy, chỉ loopback)
 ├─ /face-research/* ─► Research Nest (127.0.0.1:3107, JWT research riêng, DB fixgo_face_research_* tạm)
 │                        └─► Research FastAPI (container --network internal, read-only)
 │                              YuNet + SFace + MN3 (OpenVINO) ─► PadDecisionGate (registry rỗng)
 └─ /api/workers/me/face/* ─► Main Nest (JWT worker test, quyền không đổi)
                               FaceCoreService ─► FaceEvidenceGateway ─► /ai/face-verify|enroll
                               + GET /workers/me/face/lab/inspect (mới, dev/staging + cờ)
```

Hai chế độ backend trong UI:

- **Research lab**: đo lường thật, không có thẩm quyền (`verified=false`, `proof=null`, `padDecision=NOT_EVALUATED`). Dùng để debug detection, quality, PAD score và cosine.
- **Face Core**: gate production thật. Hiện bị chặn ở `ready()` → `PAD_NOT_EVALUATED`. Lab hiển thị đúng nguyên nhân.

Debug Timeline có 7 stage: Session validation → Camera capture → Detection & quality → PAD/liveness → Face matching → Backend policy → Proof issuance. Mỗi stage có trạng thái `PASS / FAIL / BLOCKED / ERROR / NOT_EVALUATED / MEASURED / SKIPPED`, mã lỗi, giải thích tiếng Việt và thời gian xử lý. Stage không chạy được ghi rõ lý do dừng.

## 3. Hướng dẫn chạy

Điều kiện: Docker, `python:3.11-slim`, image `postgis/postgis:16-3.4`, model YuNet/SFace đã pin, venv và model MN3 tại `~/.cache/fixgo-pad-mn3`, `server/node_modules`, `worker-app/node_modules`.

```sh
# 1) Research lab: chạy 24 check rồi giữ server ở :3107. Ctrl+C sẽ xóa container và config riêng tư.
FACE_RESEARCH_SOURCE_MODEL_DIR=<thư mục weights YuNet/SFace> \
FACE_RESEARCH_RUNTIME_DIR=$HOME/.cache/fixgo-pad-mn3 \
node server/scripts/face-research/test-e2e.cjs --serve
#    → in đường dẫn privateFixturePath (mode 0600). Lấy "token"/"otherToken"/"orderId" từ file đó. KHÔNG dán vào issue/log.

# 2) Lab web
cd ai-faceid-lab && npm ci && npm run dev    # http://127.0.0.1:5199
#    Dán research token (và otherToken cho kiểm thử sai worker) → "Research capabilities".
```

Face Core mode (tùy chọn): chạy main server với **DB test riêng**, `FACE_CORE_ENABLED=true`, key test, `FACE_LAB_DEBUG_ENABLED=true` và `NODE_ENV=development|staging`. Dán access token của **worker test**. Không trỏ vào DB dự án.

Camera research chỉ upload khi `FACE_RESEARCH_CAPTURE_APPROVED=true`, có protocol reference, participant consent và Admin review khớp epoch. Khi chưa đủ, Lab **không gửi ảnh đi**; server cũng tự chặn trước khi parse multipart.

## 4. Files changed

Mới:

- `ai-faceid-lab/**`: web app (React 18.3.1, Vite 5.4.11, TypeScript 5.6.3, Vitest 2.1.5; version pin cứng, có lockfile).
  - `src/lib/{api,codes,timeline,camera,trials,types,fixtures}.ts`
  - `src/components/{FlowPanel,Camera,TimelineView,Inspectors,Trials}.tsx`, `src/App.tsx`
  - test: `src/lib/*.test.ts`, `src/components/FlowPanel.test.tsx`
- `ai-service/pad_policy.py`: `PadDecisionGate` + `PadEvaluationRecord`; `APPROVED_EVALUATIONS = {}`.
- `ai-service/eval/test_pad_policy.py`
- `server/src/modules/workers/face/face-lab.guard.js`, `face-lab-inspector.service.js`, `face-lab.controller.js`, `face-lab.spec.js`, `face-lab.http.spec.js`
- `docs/ai-labs/faceid-lab-report.md` (file này)

Sửa:

- `ai-service/face_research.py`: thêm `detection` (box, score, kích thước ảnh; **không có landmarks**), `quality.reasons`, `alignment`, `padPolicy` (kết quả gate), `identityPolicy`, `qualityPolicy`.
- `ai-service/face_research_app.py`: capabilities trả thêm `padModelVersion`, `padErrorCode`, `padEvaluationStatus` và các policy.
- `server/src/face-research/research.service.js`: whitelist và validate các trường mới. `padPolicy` chỉ chấp nhận NOT_EVALUATED/INCONCLUSIVE với `evaluated:false`; landmarks/embedding bị loại bỏ.
- `server/src/face-research/research.spec.js`: thêm 10 case.
- `server/src/modules/workers/face/face-core.module.js`: đăng ký `FaceLabController`, `FaceLabDebugGuard`, `FaceLabInspectorService` (trong module face, không đụng AppModule).
- `server/scripts/face-research/prepare.cjs`, `server/test/face/run-isolated.cjs`: áp dụng thêm migration có sẵn `20261114000000_symptom_catalog_v3` (không sửa nội dung) trên DB tạm. Xem §8.1.
- `ai-service/eval/test_face_research.py`: thêm 11 case diagnostics.

Không sửa: `customer-app/**`, `worker-app/**`, Recommendation/CLIP/YOLO/diagnosis/symptoms, `ai-testing-lab/**`, Order FSM, payment, settlement, `ai-service/main.py`, `face_core.py`, `face_router.py`, Prisma schema và migration.

## 5. API / DB changes

- **DB / Prisma: không thay đổi.** Không chạy migration nào trên DB dự án. Mọi test DB là container PostgreSQL tạm, xóa sau khi chạy.
- **Mới:** `GET /api/workers/me/face/lab/inspect?orderId=`
  - Guard theo thứ tự: `FaceLabDebugGuard` (404 trừ khi `FACE_LAB_DEBUG_ENABLED=true` **và** `NODE_ENV ∈ {development,test,staging}`) → JWT → role `WORKER`. Ẩn khỏi Swagger.
  - Chỉ đọc bản ghi của worker trong JWT. `orderId` của đơn khác → `ORDER_ACCESS_DENIED`. Query `workerId`/`userId` bị bỏ qua (có test).
  - Trả metadata: consent, epoch, template (version, status, revoked/deleted), session (lifecycle, attempts, errorCode), proof (ACTIVE/CONSUMED/EXPIRED/REVOKED, identityScore), audit (action, reason, thời điểm), policy.
  - **Không** trả nonce/nonceHash, captureDigest, claimId, ciphertext, keyId, reviewer/evidence, actorId.
- **Research response (additive):** thêm các trường diagnostics như §4. Client cũ vẫn tương thích (thiếu trường → `null`).
- Endpoint Face Core hiện có, permission và validation: **không đổi**.

## 6. PAD status

- **Production:** NOT_EVALUATED. `FaceEvidenceGateway.capabilities()` trả `padEvaluated:false` → `FaceCoreService.ready()` ném `PAD_NOT_EVALUATED` trước khi tạo session hoặc nhận ảnh. `finish()` còn kiểm tra lại `evidence.padDecision === 'PASS'` và `padModelVersion`.
- **MN3 (experimental):** inference thật (SHA-256 pin, timeout làm provider bị khóa, từ chối khi bận), chỉ cho ra `real/spoof` score.
- **Mới: `PadDecisionGate`** (`ai-service/pad_policy.py`). Đây là đường duy nhất để score trở thành PASS/FAIL:
  - Cần `PadEvaluationRecord` cho đúng model + preprocessing + crop version, nằm trong `APPROVED_EVALUATIONS`. Registry được pin trong source, nên chỉ thay đổi được qua code review.
  - Record phải có protocol reference và report SHA-256; ≥ 300 trial bona fide với BPCER ≤ 0.10; ≥ 100 trial cho **mỗi** loại print / screen / video_replay với APCER ≤ 0.05. Các mức này là **đề xuất, cần phê duyệt**.
  - Không đọc biến môi trường (có test). Lỗi đo → INCONCLUSIVE. Measurement khác version → INCONCLUSIVE.
  - Registry hiện **rỗng** → mọi kết quả runtime là `NOT_EVALUATED / PAD_EVALUATION_NOT_APPROVED`, kể cả real score 0.9999 (có test).
  - Gate **chưa** được nối vào `face_router` hay `FaceEvidenceGateway` của production. Đó là việc cần proposal và review riêng (§9).
- **Giới hạn phương pháp** (hiển thị trong PAD Inspector): PAD thụ động 1 khung hình không chống camera injection, virtual camera hay deepfake stream. Nonce chỉ chống replay ở mức request, không chống video phát lại trước camera. Detection hay match không chứng minh người thật. Phải đánh giá riêng từng loại tấn công.

## 7. Kiểm thử

### 7.1 Đã chạy (2026-11-14)

| Bộ | Loại | Kết quả |
|---|---|---|
| `ai-faceid-lab` vitest | Unit + component (jsdom, HTTP mock) | **63/63 pass**; `tsc` và `vite build` OK |
| `server` jest toàn bộ | Unit / HTTP Nest | **216/216 pass** (face, research, ai: 141) |
| `server/test/face/run-isolated.cjs` | Integration Nest + PostgreSQL tạm | **64/64 pass**; migration apply, rollback, reapply PASS |
| `ai-service` `test_face*` | Unit (stub) | **43 tests OK, 3 skipped** (3 test model thật cần `FACE_TEST_MODEL_DIR`) |
| `test_face_models` với `FACE_TEST_MODEL_DIR` (container Python 3.11) | Real-model inference | **pass**: YuNet/SFace thật load; router/enroll fail closed |
| `ai-service` `test_pad*` | Unit (MN3 contract + gate) | **21/21 pass** |
| `test_face_live_bridge` | Nest → FastAPI → model thật (host) | **pass** |
| `smoke_research_components.py` | Real-model inference: YuNet NO_FACE, SFace feature (landmark fixture), MN3 output | **pass**; `biometricAccuracyMeasured:false` |
| `test-e2e.cjs` | Real HTTP: Nest → FastAPI → YuNet/SFace/MN3 + PG tạm | **24/24 pass** |
| Live qua Lab proxy :5199 → :3107 | Browser-path HTTP (không có trình duyệt headless) | Xem §7.2 |

### 7.2 Ma trận kịch bản bắt buộc

| Kịch bản | Bằng chứng | Loại test | Trạng thái |
|---|---|---|---|
| Khuôn mặt đúng | Logic: MATCH ≥ ngưỡng → proof (integration, evidence mock); hiển thị cosine/ngưỡng (vitest) | Unit / integration | Logic PASS · **real face NOT MEASURED** |
| Khuôn mặt người khác | `IDENTITY_NOT_VERIFIED` dưới ngưỡng (integration); UI "< ngưỡng" (vitest) | Unit / integration | Logic PASS · **real NOT MEASURED** |
| Không có mặt | YuNet thật → `NO_FACE`, PAD không chạy (E2E, live proxy, smoke) | **Real-model inference** | PASS |
| Nhiều mặt | `MULTIPLE_FACES`, không có score (pytest stub, vitest) | Unit | PASS · real NOT MEASURED |
| Ảnh mờ / thiếu sáng / cháy sáng | `BLUR`, `TOO_DARK`, `TOO_BRIGHT` từ pixel thật qua quality code thật, detector stub | Unit | PASS |
| PAD unavailable | Face Core `PAD_NOT_EVALUATED` khi tạo session (vitest, integration "default gateway … closed"); PAD NOT_EVALUATED/INCONCLUSIVE/FAIL không tạo template | Unit / integration | PASS |
| Ảnh in | — | **PAD security** | **NOT MEASURED** (cần protocol) |
| Màn hình điện thoại | — | **PAD security** | **NOT MEASURED** |
| Video phát lại | — | **PAD security** | **NOT MEASURED** |
| Session expired | `RESEARCH_SESSION_EXPIRED` (E2E); Face Core dùng thời gian PG (integration); UI đếm ngược | Integration / E2E | PASS |
| Nonce replay | `RESEARCH_NONCE_INVALID` (live proxy, E2E, vitest); Face Core "other nonce rejected", "changed payload rejected" | Integration / E2E / live | PASS |
| Proof sai order | "one order proof cannot be consumed for a second assigned order", order ownership (`RESEARCH_ORDER_DENIED` live) | Integration / live | PASS |
| Proof đã tiêu thụ | "two concurrent start-work … consume exactly once"; inspector lifecycle `CONSUMED` | Integration / unit | PASS |
| Consent revoked | Withdrawal xóa ciphertext, thu hồi session/proof, epoch +1; "withdraw during inference"; inspector hiển thị | Integration / unit | PASS |
| Model timeout | E2E `504` fail closed; Face Core "timeout consumes retry budget"; PAD timeout → INCONCLUSIVE | E2E / integration / unit | PASS |
| Camera permission denied | `CAMERA_PERMISSION_DENIED` trong timeline (vitest, getUserMedia mock) | Component | PASS · **browser thật chưa chạy** |

Kết quả live qua proxy: capabilities `padReady:true, padEvaluated:false, padEvaluationStatus:PAD_EVALUATION_NOT_APPROVED, cameraAllowed:false`. ENROLLMENT/DAILY/ORDER đều trả 201 với `NO_FACE`, `padPolicy=NOT_EVALUATED/PAD_NOT_RUN_NO_SINGLE_FACE`, `proof=null` và không có embedding. Nonce sai → `RESEARCH_NONCE_INVALID`. Worker khác → `RESEARCH_SESSION_DENIED`. Upload camera chưa duyệt → `RESEARCH_CAPTURE_NOT_APPROVED`. Đơn lạ / đơn của worker khác → `RESEARCH_ORDER_DENIED`. Không token → 401. Xóa session → `mediaStored:false`.

### 7.3 Chưa chạy

- Kiểm thử thủ công trên trình duyệt thật (camera, quyền, giao diện): máy không có trình duyệt headless. Cần chạy tay theo §3.
- Face Core mode live với main server (cần DB test và tài khoản worker test do team cấp). Logic đã có 64 integration test và HTTP spec cho route inspector.

## 8. Known blockers

1. **PAD chưa được đánh giá.** Cần phê duyệt protocol, consent người tham gia, vật liệu tấn công và mức APCER/BPCER. Sau đó chạy trial bằng tab "PAD trials" → `trials.jsonl` → `ai-service/eval/face_metrics.py` (protocol đã duyệt, tập held-out), rồi thêm `PadEvaluationRecord` qua code review.
2. **Chưa có dữ liệu khuôn mặt thật được duyệt**, nên FMR/FNMR, ngưỡng 0.60 và ngưỡng quality vẫn PROVISIONAL.
3. `FaceEvidenceGateway` / `face_router` chưa có đường đưa PAD đã đánh giá vào evidence. `/ai/face-enroll` cố ý không trả embedding → enrollment production chưa thể thành công.
4. Thu thập camera cho research cần `FACE_RESEARCH_CAPTURE_APPROVED`, protocol và participants; Lab không tự bật.
5. Migration production đang bị chặn bởi drift lịch sử migration của dự án (xem `docs/implementation/face-id/project-schema-readonly-report.md`).

### 8.1 Sự cố gặp khi kiểm thử

- **Harness FaceID hỏng sau merge main (có từ trước).** `prepare.cjs` / `run-isolated.cjs` dựng DB từ baseline cộng hai migration face, rồi assert khớp `schema.prisma`. Migration `symptom_catalog_v3` (Recommendation) chưa được áp dụng nên drift guard fail. Cách sửa: áp dụng nguyên văn migration đó trên DB tạm; drift guard vẫn giữ nghiêm. Diff drift không chứa bảng `biometric_*`.
- **Có thể đã dừng nhầm Vite dev server của Codex.** Khi dọn dẹp, lệnh `pkill -f "vite --host 127.0.0.1"` có pattern quá rộng. Sau đó tiến trình Vite của `fixgo-recommendation-lab/ai-recommendation-lab` (PID 57087) không còn chạy. Không có file nào của Codex bị sửa. Nếu Codex cần, chỉ cần chạy lại dev server.

## 9. Điều kiện tích hợp Worker App

Chỉ tích hợp khi **tất cả** điều kiện sau đúng:

1. Có `PadEvaluationRecord` được duyệt, với APCER từng loại print/screen/video_replay và BPCER đạt mục tiêu trên tập held-out, kèm thiết bị Android mục tiêu.
2. Có proposal được review để nối `PadDecisionGate` vào `/ai/face-verify|enroll` (sửa `face_router.py`/`face_core.py`, tức AI entrypoint) và vào `FaceEvidenceGateway.capabilities()`. Proposal phải kèm test: PASS chỉ xuất hiện khi có record và đúng version.
3. `/ai/face-enroll` trả embedding **chỉ** khi PAD PASS và quality PASS; embedding chỉ đi qua kênh nội bộ có token sang Nest để mã hóa ngay.
4. Ngưỡng cosine và quality được hiệu chỉnh trên dữ liệu đã duyệt (FMR mục tiêu được phê duyệt).
5. Đã duyệt consent, retention và KMS; migration production có kế hoạch được phê duyệt.
6. Worker App chỉ gọi đúng các endpoint Face Core mà Lab đã dùng (`capabilities`, `consent`, `sessions`, `sessions/:id/capture`, `DELETE template`). Không gửi `workerId`, không có fallback "success", và hiển thị blocker/mã lỗi giống Debug Timeline.
7. Kiểm thử Android thật: quyền camera, background/cancel/retry, dọn cache, camera injection.
8. Route `/lab/inspect` giữ tắt (`FACE_LAB_DEBUG_ENABLED` không set) ở production. Guard trả 404.
