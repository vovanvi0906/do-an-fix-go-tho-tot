# INTEGRATION-S03 — 2026-11-14 (Asia/Ho_Chi_Minh)

Đã tích hợp code để kiểm thử, **chưa đạt điều kiện phát hành hoặc chạy đầy đủ happy path nhận đơn trên Android**. Face ID vẫn fail-closed. Không push, không merge main/integration gốc. Không sửa database dự án.

## Git và phạm vi

| Worktree | Branch | HEAD trước tích hợp | Status trước/sau |
|---|---|---|---|
| `~/Work/do-an-fix-go-tho-tot` | `integration/fixgo-sprint-02` | `803ec3210ac56893490ee2d4e7fc8a7cb70d212e` | Giữ nguyên `?? docs/ai-core-audit-02/` |
| `~/Work/fixgo-gemini` | `test/integration-s02-ai-rec` | `9e77da53d8fbaec3cc356ff2ae9d5b8b08602837` | Sạch, không sửa |
| `~/Work/fixgo-codex` | `agent/codex-worker` | `9db10166f4b86289c4b2b34a73daf4e055a2d2d4` | Sạch, không sửa |
| `~/Work/fixgo-backend` | `agent/backend-auth` | `90ea0bbaec9fbf636e8175f5e45585bb738902c5` | Chỉ ghi nhận worktree; không thay đổi |
| `~/Work/fixgo-integration-s03` | `test/integration-s03-full-ai` | Bắt đầu từ `9e77da5` | Worktree mới, không ghi đè thư mục |

Merge-base Gemini–Codex và repo chính–Codex: `4edb191a6788299b18fb576c7e912272db863836`.
Merge-base repo chính–Gemini: `803ec3210ac56893490ee2d4e7fc8a7cb70d212e`.
Danh sách commit hai phía và inventory diff 178 files: xem `evidence/*commits.txt`, `evidence/codex-diff-inventory.tsv`.
Merge thực hiện bằng `git merge --no-ff --no-commit agent/codex-worker` **chỉ trong S03**.
HEAD cuối cùng: `git -C ~/Work/fixgo-integration-s03 rev-parse HEAD`; merge commit có hai parent `9e77da5` và `9db1016` (xem `git log --merges -1`).

## Review và toàn bộ conflicts

Đã xem inventory toàn bộ diff Codex, tập trung executable code/schema/migration và đối chiếu tài liệu, test, evidence đi kèm. Không xem các báo cáo kế thừa là kết quả chạy mới.

| File conflict | Cách giải quyết |
|---|---|
| `ai-service/main.py` | Bỏ legacy FaceVerifyResponse/handler trùng; mount `face_router` Codex, giữ mount `recommendation_router` Gemini và các endpoint khác. |
| `ai-service/eval/test_face_security.py` | Dùng test module/ASGI Face Core mới thay test AST của handler đã bị thay thế; bổ sung smoke production routes S03. |
| `server/prisma/schema.prisma` | Giữ **cả** `RegistrationProof` Gemini và các model/compound relation Biometric Codex; Prisma validate thành công. |
| `server/src/infrastructure/external/ai/face-result.js` | Giữ gate legacy luôn từ chối proof, thêm validator template contract. |
| `server/src/infrastructure/external/ai/face-security.spec.js` | Giữ thêm test Gemini: generic comparison không được approve CCCD. |
| `server/src/infrastructure/external/ai/fastapi-ai.client.js` | Import cả hai validator; giữ diagnose ưu tiên `/ai/v2/diagnose`, thêm token/timeout/template/version validation Face Core. |
| `server/src/modules/orders/order-workflow.service.js` | Giữ import/DI FaceCoreService; scoped proof được consume trong transaction FSM. |
| `server/src/modules/workers/workers.service.js` | Giữ FaceCoreService và nhánh requireDaily khi enabled; disabled vẫn từ chối legacy timestamp. |

Không có conflict trong Customer App hoặc USB scripts. Recommendation module, service-targets/services backend và toàn bộ Customer App không thay đổi so với Gemini (git diff kiểm chứng). Category → Target → Symptom → DB Service được giữ; regression frontend catalog/booking, backend catalog và Python pipeline đều chạy. Live inference hiện dùng catalog fallback khi backend không chạy, **không phải** end-to-end với DB service production đang chạy.

Review bảo mật: YuNet/SFace chỉ load artifact local đúng SHA-256; image inline có giới hạn; không lấy embedding/reference tùy ý từ client để cấp quyền. Enrollment không nhả embedding khi PAD chưa evaluated. Capabilities backend luôn báo `padEvaluated=false`; legacy timestamp không có authority. Consent, admin review, nonce, epoch, template/model version và purpose/order binding vẫn bắt buộc. Race/withdraw/replay/expiry/rollback được kiểm bằng PostgreSQL disposable. Không bật flags phê duyệt, không thêm template/proof vào DB dự án.

Research Nest dùng `server/scripts/face-research/start.cjs`, FastAPI dùng `face_research_app:app`, không import/mount vào production entrypoint/module. Research App package `com.fixgo.faceresearch`, router `research-app`, scheme riêng; export source map xác nhận không lẫn auth/API/storage/socket/Firebase Worker. Research luôn `verified=false`, `enrolled=false`, `proof=null`, `padDecision=NOT_EVALUATED`. Consent/protocol gate vẫn khóa camera thật.

Ba harness disposable đổi baseline `f6737fd` sang `9e77da5`: `run-isolated.cjs`, `compare-snapshot.cjs`, `face-research/prepare.cjs`. Lý do: S03 cần giữ bảng registration proof có sẵn trên Gemini; nếu dùng baseline cũ, schema diff sẽ thiếu bảng này. Không sửa SQL migration. `run-isolated.cjs --arc01` bổ sung cách tái chạy ARC-01 trên chính container disposable.

## Kết quả chạy mới

| Hạng mục | Kết quả | Evidence |
|---|---|---|
| Backend Jest | 17 suites, 177 tests PASS | `backend-tests.log` |
| Backend Babel build | PASS, 156 files | `backend-build.log` |
| Customer Jest | 20 suites, 115 tests PASS | `customer-tests.log` |
| Worker Jest | 20 suites, 153 tests PASS | `worker-tests.log` |
| Customer/Worker TypeScript | PASS cả hai (`tsc --noEmit`, phạm vi tsconfig hiện tại; không phải kiểm tra kiểu toàn bộ JS) | `*-typecheck.log` |
| Customer/Worker Expo Android export | PASS cả hai; **không phải APK/native Gradle build** | `*-export.log` |
| FastAPI/Python discover | 60 tests, 57 PASS + 3 SKIP | `python-tests.log` |
| Nest → FastAPI → YuNet/SFace thật | 1 PASS, ảnh blank synthetic, không proof/embedding | `face-live-bridge.log` |
| Production router smoke S03 | 1 PASS: V2 response, Face auth/model fail-closed, không research | `production-routes.log` |
| Face Core v2/v3 PostgreSQL | 64 PASS; apply, invalid-lineage rollback, ORM diff empty, custom triggers/FKs, rollback/reapply PASS | `face-disposable.log` |
| ARC-01 PostgreSQL/HTTP/Socket | **14 PASS, 3 FAIL** | `arc01-initial.log` |
| Research E2E TCP/Nest/FastAPI/model thật | 24 checks PASS; synthetic only, authority tables empty | `research-e2e.json`, `research-e2e.log` |
| Research Android export/isolation | PASS; 916 sources, forbidden Worker modules = 0 | `research-export.json` |
| USB scripts | `bash -n` PASS, byte-for-byte unchanged so với Gemini | kiểm tra Git |

Ba SKIP Python ban đầu: test live bridge cần explicit model directory (đã chạy riêng PASS); hai test PAD runtime cần explicit experimental runtime. Research E2E riêng đã load PAD model thật trong runtime isolated. Không coi synthetic blank là positive-face accuracy test.

Ba lỗi ARC-01 cũ:
1. `two real concurrent HTTP accepts have exactly one winner`: mong 201/409, nhận 400/400.
2. `BEFORE, pending quote, AFTER and settlement are server preconditions`: mong QUOTE_NOT_APPROVED, nhận FACE_CHECKIN_EXPIRED.
3. `one worker cannot accept two orders concurrently`: mong 201/409, nhận 400/400.

Fixture ARC-01 chỉ có `faceVerifiedAt`, không có durable daily/order proof; Face Core disabled đúng như policy hiện tại. Không nới khóa để làm test xanh. Cần chuyển fixture ARC-01 sang Face Core trên DB disposable với consent/review/template/proof synthetic hợp lệ và fake evidence gateway **chỉ trong test**, hoặc tách rõ FSM gate tests và Face policy tests. 64 test Face Core đã kiểm concurrent start/atomic consume và rollback FSM với proof. Chưa xác nhận hai acceptance race test dưới durable daily proof. Đây là regression test debt/release blocker, không báo toàn bộ regression xanh.

Lệnh tái chạy: `cd server && npm test -- --runInBand && npm run build`; `node test/face/run-isolated.cjs`; `node test/face/run-isolated.cjs --arc01` (hiện 3 failures). Hai app: `npm run test:ci`, `npx tsc --noEmit`, `CI=1 npx expo export --platform android --output-dir /tmp/<unique-dir>`. Python: đặt `ULTRALYTICS_AUTOINSTALL=false HF_HUB_OFFLINE=1 PYTHONDONTWRITEBYTECODE=1`, chạy `python -m unittest discover -s eval -p 'test_*.py'` trong ai-service; live model directory phải cung cấp rõ ràng.

## Database: read-only và những quyết định bị chặn

Chỉ đọc catalog/metadata trong transaction READ ONLY, không đọc hàng dữ liệu ứng dụng. Snapshot raw để ngoài repo `/tmp/fixgo-s03-catalog-{before,after}.json`, mode 0600. Snapshot trước/sau giống SHA-256: xem `project-db-readonly.json`. Không chạy Prisma migrate/db push/reset/seed hoặc sửa migration history trên DB dự án.

Schema thực tế khớp baseline Gemini: không thiếu/thừa/thay đổi column, enum, constraint, index, trigger, function. So với S03 còn thiếu 72 columns, 28 constraints, 21 indexes, 7 triggers, 7 functions Face Core; không có đối tượng cũ bị thay đổi. Không có `_prisma_migrations`. Chi tiết tổng hợp `schema-summary.json`, `schema-compare.log`. Điều này xác nhận **schema chưa sẵn sàng Face Core**, không chứng nhận dữ liệu hay lịch sử migration hợp lệ.

Các việc chưa được phép: áp dụng `20261113190000_face_core_v2`, `20261113200000_face_binding_hardening` vào DB dự án; quyết định baseline migration history; kiểm tra/chuẩn hóa lineage dữ liệu cũ; policy consent/retention/backup deletion và key custody/KMS; PAD evaluation/calibration/approval; phê duyệt capture người thật. Không chuyển legacy FaceProfile/faceVerifiedAt thành enrollment/proof. `FACE_CORE_ENABLED=false`, `FACE_BIOMETRIC_CAPTURE_APPROVED=false`; không bật research capture approval.

Tất cả container/network test đã được dọn; giữ nguyên `ondemand_postgres` và `ondemand_redis`.

## Android runbook Customer và Worker

1. `cd ~/Work/fixgo-integration-s03`. Chuẩn bị dependencies/virtualenv **riêng tại S03** từ lockfiles; hiện node_modules hai app/server đã được copy riêng, không symlink sang worktree cũ. Cài Python bằng `S03/ai-service/.venv/bin/python -m pip`, tránh dùng pip của repo cũ. Không chạy script bootstrap có migrate/seed. Có thể copy local model artifacts đã kiểm SHA vào S03 hoặc đặt `FACE_MODEL_DIR` trỏ thư mục read-only hiện có. CLIP cần cache local và YOLO weights local.
2. Tạo local `server/.env` theo env dự án đã có, giữ flags Face Core/capture false. Không thêm approvals hoặc keys tùy tiện. Chọn một instance backend/AI phục vụ 3000/8000, tránh tranh cổng với worktree khác. Không khởi động lại/stop stack của người khác. DB dự án chỉ dùng cho phiên thử được chủ dự án điều phối; S03 không tự chạy luồng ghi dữ liệu này.
3. Tạo `customer-app/.env.local` và `worker-app/.env.local`: `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api`, `EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000`. Dùng OAuth/Firebase dev configuration đúng package nếu cần Google login. `FACE_RESEARCH_APP` không bật cho Worker thường.
4. Kiểm tra `adb devices -l`; `bash scripts/dev-usb-connect.sh --device <SERIAL>` để reverse 3000/8081/8082. `dev-local-usb.sh` giữ nguyên: kiểm env, start postgres/redis, Prisma validate/generate, chạy backend/AI/admin. Script không migrate/seed; chỉ dùng khi các cổng và stack đã được điều phối. Không cần thay USB config.
5. Chạy backend `cd server && npm run dev`; AI `cd ai-service && ULTRALYTICS_AUTOINSTALL=false .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000` nếu không dùng script tổng. Smoke `/docs`, `/ai/v2/diagnose`, Face capabilities với service token ở phía server; không đưa token Face nội bộ vào app.
6. Hai terminal: `cd customer-app && npm run start:debug`; `cd worker-app && npm run start:debug`. Dùng development APK đúng package đã build từ **S03** (`npx expo run:android --port 8081` hoặc 8082 khi cần build mới). Export thành công chưa bảo đảm APK/native permissions. Không dùng APK cũ để kết luận native code mới đã test.
7. Customer: login; ảnh thiết bị → category/target candidates → chọn target → symptom → DB service đúng ID/giá; ảnh OOD/không đọc được → abstain/chọn thủ công; kiểm booking/reload/order history. Chỉ tạo đơn trong phiên QA dữ liệu được điều phối.
8. Worker: login → registration/preflight/daily/order screen; phải hiển thị blocker, không tự mở camera/upload hoặc báo success; legacy timestamp không cho online/accept/start. Kiểm tra retry/offline/background/navigation. Happy path nhận đơn/start vẫn bị khóa đến khi phê duyệt Face Core/PAD/dữ liệu; không bypass.
9. Research dùng package/app/server/DB riêng theo `../implementation/face-id/research-e2e-runbook.md`; chỉ synthetic hiện tại. Không mount research vào main để tiện chạy. Không dùng consent thật hoặc ảnh khuôn mặt thật khi chưa duyệt protocol.

ADB đã thấy một thiết bị `device`; **chưa cài/chạy APK S03, chưa thao tác UI Android**. Chưa test camera permission/native lifecycle/hardware, OEM background/USB reconnect, Google login production, real face positive/non-match/PAD attack dataset hay FAR/FRR/APCER/BPCER. Không chứng nhận độ chính xác Face ID/PAD hoặc consent người thật.

## Ghi nhận môi trường

Lần Python discover đầu dùng virtualenv repo chính (read-only dự kiến), nhưng Ultralytics tự cài `pi-heif 1.4.0`. Đã gỡ đúng package đó ngay sau test, và đặt `ULTRALYTICS_AUTOINSTALL=false` cho các lần chạy sau. Git của ba worktree ban đầu không đổi; không thay source/config của họ. Các lần Node test/build dùng bản copy dependencies riêng S03; Prisma generate chỉ ghi client trong S03 và dùng URL dummy hoặc disposable. Không đưa env/secrets/snapshot raw/APK/weights vào commit.
