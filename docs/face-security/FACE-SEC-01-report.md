# FACE-SEC-01 — Fail-closed security hotfix

Ngày 13/11/2026 (Asia/Ho_Chi_Minh). HEAD trước sửa: `be082dc91bc05ff3c05177acd72fe786fc478f6a`, branch `integration/fixgo-sprint-02`, đúng audit baseline. Working tree ban đầu chỉ có `docs/ai-core-audit-02/` untracked; không đưa thư mục này vào commit. Các worktree backend/codex/gemini không bị sửa. Không migration, db push/reset, đọc biometric rows, đổi weights, YOLO/CLIP, payment/wallet, USB script, push/merge/rebase.

## CODE VERIFIED

FastAPI bỏ heuristic và detector-only success, không diễn giải URL chứa từ khóa thành kết quả sinh trắc. Cần cả detector và recognizer; đúng một mặt trong mỗi ảnh; alignment không rỗng; embedding shape `(1,128)`, finite, norm khác 0; cosine finite trong [-1,1]. Giữ ngưỡng cosine 0.60 của baseline, không dùng ngưỡng chẩn đoán tổng quát. Score là similarity nguyên bản, không phải xác suất/confidence đã hiệu chuẩn.

| Kết quả | Ý nghĩa và hành vi |
| --- | --- |
| MATCH | SFace cosine >= .60; chỉ identity comparison giữa hai ảnh cung cấp |
| NON_MATCH | So sánh hoàn tất, score < .60; từ chối |
| INCONCLUSIVE | Thiếu reference, không mặt hoặc nhiều mặt; cần bổ sung/retry |
| TECHNICAL_ERROR | Model thiếu, decode/alignment/embedding/comparison lỗi, score không hợp lệ; không thể xác minh |

Chỉ MATCH trả `verified=true` tại matcher. MATCH/NON_MATCH có `engine=model`, `method=sface_cosine`, reason và numeric similarity; các trường hợp khác `verified=false`, `confidence=null`, `method=none`. Không trả `livenessPassed=true`.

Nest face fetch timeout 15 giây bao gồm đọc response body qua AbortSignal; kiểm status/boolean/method/engine/reason/score và worker binding. Từ chối NaN, Infinity, string, ngoài miền cosine, contradictory result, engine heuristic và detection-only. HTTP/JSON/network/abort/invalid contract trả TECHNICAL_ERROR, không heuristic success, kể cả caller truyền `allowFallback:true` kiểu cũ. Generic endpoint sửa chữ ký, chỉ comparison; không ghi `idCardVerified` từ reference caller cung cấp.

Daily/order chỉ dùng FaceProfile photo làm đầu vào comparison, bỏ avatar fallback. **Photo hiện có không được công nhận là trusted enrollment.** Không tạo FaceProfile giả, không suy `isRegistered` là provenance. Hai consumer không ghi timestamp hoặc KYC approval, kể cả MATCH; trả lỗi `FACE_PROOF_UNAVAILABLE` khi match nhưng chưa có trusted proof. Failure không tạo manual review/approval hoặc timestamp. Không tuyên bố đã có queue review.

Authorization/ownership qua workflow access và danh sách stage trước AI giữ nguyên. Không đổi transition graph, order status, lock/transaction, payment/wallet. Các face precondition trở thành deny khi không có trusted proof; đây là tác động availability chủ ý của fail-closed, không phải triển khai FSM mới.

## Legacy timestamp và chuyển tiếp

Baseline writers: WorkersService.verifyFaceDaily ghi `WorkerProfile.faceVerifiedAt`; OrdersService.verifyFace ghi cùng cột và `kycStatus=APPROVED`; seed cũng có thể gán cột. Failure per-order baseline chỉ ghi PENDING, không tự ghi timestamp. Readers: updateAvailability bật online; OrderWorkflowService.requireFace dùng cho MATCHED và IN_PROGRESS; order query trả cột cho client; Worker App eligibility dùng age <24h. Không có session/purpose/template version/PAD provenance ở timestamp. FaceVerification schema có orderId nhưng không có runtime proof writer/consumer trong call chain audit.

Không thể phân loại row cũ đáng tin bằng giá trị thời gian, kể cả recent hoặc future. **Mọi timestamp hiện có đều không đủ làm proof cho phiên mới.** Không đọc/xóa/cập nhật hàng loạt dữ liệu người dùng. Hotfix dùng gate `hasTrustedFaceProof` luôn false để biểu đạt chưa có cơ chế proof tin cậy; không cache RAM, cutoff thời gian, fake proof hoặc tự grant. Giữ timestamp để bảo toàn dữ liệu, không dùng nó cấp quyền.

Chuyển tiếp an toàn: triển khai matcher và Nest cùng release, dừng onboarding/dispatch cần Face ID trong cửa sổ bảo trì; giữ gate đóng cho tới FACE-CORE-02 có enrollment authority và proof riêng. Không backfill proof từ timestamp. Không có đường manual override tự động. Việc cho phép vận hành bằng quy trình khác cần quyết định riêng, không triển khai trong hotfix.

## TEST VERIFIED

Chạy local, dữ liệu giả/stubs, không network/DB/model startup/ảnh người thật:

| Lệnh | Kết quả thực tế |
| --- | --- |
| `cd server && npm test -- --runInBand` | PASS 9 suites, 83 tests |
| `cd server && npm run build` | PASS, Babel compile 127 files |
| `ai-service/.venv/bin/python -B -m unittest discover -s ai-service/eval -p 'test_*.py'` | PASS 7 tests; 2 test methods mới, negative matrix 17 subcases |
| `git diff --check` | PASS |
| `adb devices` | Không có thiết bị |

Python thực thi body endpoint production trích AST, stub dependencies: model/recognizer thiếu, decode selfie/reference lỗi, zero/multiple faces, reference thiếu/không mặt, alignment exception, embedding exception/NaN, comparison exception, score NaN/Infinity/string/out-of-range, non-match, và MATCH control. Không import startup/weights. Vì vậy đây là branch/contract regression, không phải benchmark model hay FastAPI HTTP integration.

Jest chạy module production: contract malformed/heuristic/detection-only, network/timeout/HTTP/wrong worker, abort thực của stalled fetch (rút timeout xuống 10ms trong test), generic endpoint không ghi approval; daily/order negative matrix và MATCH đều không ghi update; missing reference không lấy avatar; AUTH_REQUIRED, ownership denial, stage denial trước AI; legacy timestamp không grant online/workflow; offline vẫn được phép. Các suite order transition/diagnosis/auth hiện có PASS. Không chạy PostgreSQL E2E vì task không cho phép tác động database và không có isolated DB được cấp; không coi đó là PASS.

## ANDROID PENDING

Không có thiết bị ADB. Worker App chưa sửa. Daily sẽ nhận lỗi, không có check-in timestamp mới; per-order không nhận `success=true`/manual-review giả. Bật online và nhận/bắt đầu đơn qua face gate bị chặn cho đến FACE-CORE-02. Timestamp cũ vẫn có thể được UI hiển thị/eligibility local xem là còn hạn; backend từ chối nên UI có thể không đồng bộ hoặc hiện thông báo chung. Không tự force offline các worker đang online hoặc đổi trạng thái đơn đang thực hiện. Cần kiểm Android camera/upload, lỗi retry, online/offline, legacy UI, assigned-worker stage và start-work trước rollout vận hành. Đây không phải xác nhận E2E.

## NOT IMPLEMENTED

Trusted enrollment/version/revocation, daily/order/session-scoped durable proofs, challenge/nonce/freshness, PAD/liveness, replay/injection defense, rate limiting biometric, secure template storage, AI service authentication/network isolation, URL allowlist/SSRF hardening, biometric metrics và model calibration chưa triển khai. Existing decoder vẫn hỗ trợ URL/local path theo baseline; không tuyên bố đã bảo vệ boundary này. Reference photo có thể so khớp nhưng không chứng minh account enrollment hoặc người đang sống trước camera. Hotfix không chứng minh Face ID chống giả mạo.

## Rollback an toàn

Không có schema/data migration để rollback. Giữ bản build hiện tại và release trước để so sánh; nếu release lỗi, giữ face endpoints và dispatch/start-work cần face trong chế độ đóng/bảo trì. Không rollback độc lập Nest về heuristic client hoặc khôi phục timestamp-only gate trong lúc mở traffic. Ưu tiên forward fix từ commit hotfix; rollback toàn bộ source bằng revert chỉ trong môi trường cô lập/traffic face đã chặn và sau review vì baseline chứa fail-open đã xác nhận. Không tự chạy revert/deploy trong task này. Không xóa proof/timestamp cũ; không dùng dữ liệu cũ để khôi phục quyền.

## Quyết định cần duyệt cho FACE-CORE-02

- Ai có quyền enrollment, kiểm chứng danh tính/reference, consent, template version và revocation.
- Daily và per-order proof độc lập: purpose/order/subject/session/template binding, TTL, replay prevention và atomic consumption trong transaction.
- Phương án UI chuyển tiếp, thông báo bảo trì và khôi phục worker online; không backfill từ timestamp cũ.
- Reviewer workflow: quyền, evidence, audit trail; review không tự trở thành biometric proof/PAD.
- PAD threat model, capture freshness/injection defenses và acceptance metrics trên tập dữ liệu được phép.
- Storage/network/auth/rate limits và kế hoạch Android/device + isolated DB E2E, rollout/rollback có owner.

## File thay đổi

- `ai-service/main.py`: matcher contract và fail-closed branches.
- `ai-service/eval/test_face_security.py`: offline endpoint regression.
- `server/src/infrastructure/external/ai/face-result.js`: validator và closed legacy-proof gate.
- `server/src/infrastructure/external/ai/fastapi-ai.client.js`: bounded transport/contract validation.
- `server/src/infrastructure/external/ai/aiFallbackHelper.js`: face fallback luôn technical error.
- `server/src/infrastructure/external/ai/face-security.spec.js`: transport/contract/consumer/access regression.
- `server/src/modules/ai/ai.service.js`: generic comparison không approval side effect.
- `server/src/modules/workers/workers.service.js`: no proof write và legacy online gate đóng.
- `server/src/modules/workers/workers.service.spec.js`: cập nhật kỳ vọng fail-closed.
- `server/src/modules/orders/orders.service.js`: bỏ avatar/fallback/manual grant/KYC/timestamp writes.
- `server/src/modules/orders/order-workflow.service.js`: không consume legacy timestamp.
- `docs/face-security/FACE-SEC-01-report.md`: báo cáo này.
