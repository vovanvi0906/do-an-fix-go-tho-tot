# Progress tracker — 12/11/2026

## TASK: AUD-01 — audit source và lập kế hoạch (baseline trước ARC-01)

**CURRENT STATUS:** Tài liệu worker-app/worker-app-doc.md là mục tiêu chưa xác minh; chưa có bộ audit riêng.

**IMPLEMENTED:** Đã đọc toàn bộ đặc tả, khảo sát routes/screens/auth/API/store/GPS/media của worker; truy vết OrdersController→OrdersService→Prisma/history→OrderGateway; đối chiếu WorkflowService/validator, schema/migrations, customer acceptance/quote/pay và admin order/status; kiểm tra FastAPI face/compare/fallback. Tạo evidence index, gap theo toàn bộ backlog, 14 giai đoạn nghiệp vụ, FSM và 25 AC, kế hoạch từng task có phụ thuộc và rollback. Đây là kết quả audit tài liệu, không phải đã triển khai nghiệp vụ.

**FILES CHANGED:** Chỉ các tài liệu mới:

1. [01-codebase-audit.md](01-codebase-audit.md): bản đồ/evidence + toàn bộ backlog.
2. [02-gap-analysis.md](02-gap-analysis.md): 20 gap và quyết định còn mở.
3. [03-business-flow.md](03-business-flow.md): thực trạng/mục tiêu và ngoại lệ 14 bước.
4. [04-order-state-machine.md](04-order-state-machine.md): enums/actors/guards/mapping/compatibility.
5. [05-api-data-contract.md](05-api-data-contract.md): API/schema/events thật và contract đề xuất.
6. [06-ui-ux-spec.md](06-ui-ux-spec.md): CTA/states/loading/error/retry/a11y.
7. [07-implementation-plan.md](07-implementation-plan.md): task P0/P1/P2, files/API/DB/AC/test/risk/rollback.
8. [08-test-plan.md](08-test-plan.md): đủ AC-01…25 + test matrix.
9. [09-progress-tracker.md](09-progress-tracker.md): báo cáo này.
10. [../worker-audit.md](../worker-audit.md): entry point tương thích yêu cầu trong đặc tả, dẫn về bộ tài liệu duy nhất.

**API/DATABASE CHANGES:** Không thay đổi. Không thêm dependency, migration/seed, commit/push/reset. Không sửa application code.

**TEST RESULTS:**

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Backend Jest targeted: workers.service.spec.js, update-availability.dto.spec.js, orders.service.spec.js | PASSED — 3 suites, 6 tests, exit 0 | 4 tests check-in/online mock; Swagger DTO generation và service-defined không chứng minh FSM/payment |
| Worker Jest targeted: workerSession, tokenRefresh, socketConnection | PASSED — 3 suites, 8 tests, exit 0 | Role/session storage/refresh/rejoin dùng mocks, không gateway hoặc thiết bị thật |
| Source evidence và docs link/backlog/AC checks | PASSED — 10 tài liệu, 73 local links hợp lệ, đủ 30 backlog IDs và 25 AC | Không phải kiểm thử runtime nghiệp vụ |
| DB/Redis/storage integration, race HTTP, AI model accuracy/liveness, provider settlement, mobile E2E/QA | NOT RUN / NOT_VERIFIED | Chưa có evidence môi trường test/live; không thao tác ghi dữ liệu thật |
| Full suite/build/lint/typecheck | NOT RUN | Scope audit tài liệu; backend lint tự --fix nên không chạy |

**RISKS:** P0 còn mở: bypass FSM/ownership/socket scope, face/compare heuristic success, accept thiếu single-active/expiry, active filter/relation sai, ảnh ISSUE bị coi BEFORE, quote không persisted/idempotent, complete trước payment, pay cộng ví lặp, schema/migrations drift và dual wallet. Không được xem unit pass là hệ thống hoàn thiện.

**NEXT TASK:** Đề xuất **ARC-01**: chốt mapping/FSM/actor/active/terminal và policy enforcement qua một luồng dùng chung, bao gồm ma trận contract Customer/Admin và test yêu cầu. Phạm vi cụ thể ở 07. Chờ người dùng giao task/phê duyệt phạm vi trước sửa application code.

## Theo dõi tiến độ

| Hạng mục | Tiến độ |
|---|---|
| Giai đoạn A audit tĩnh + B kế hoạch/tài liệu | Đã lập bộ tài liệu; chưa xác minh runtime E2E |
| AUD-01 tiêu chí có evidence runtime toàn hệ thống | PARTIAL / NOT_VERIFIED cho phần runtime |
| ARC-01 | Đã triển khai và có automated verification, xem báo cáo cập nhật phía dưới |
| Các task implementation sau ARC-01 | Chưa bắt đầu; chờ giao task |
| AC-01…25 E2E | Chưa có PASS E2E; xem trạng thái source ở 08 |
| Điều kiện tuyên bố Worker App hoàn thiện | Chưa đạt |


## TASK: ARC-01 — Chuẩn hóa Order State Machine

**CURRENT STATUS:** Trước task CONFLICT/BUG: hai FSM, cập nhật trực tiếp trong OrdersService/Admin, thiếu ownership/socket auth, arrive=start và completed trước thanh toán.

**IMPLEMENTED:** FSM dùng chung trong OrderWorkflowService; legacy aliases giữ tương thích, role/ownership từ DB; row locks worker→order + conditional update + history trong transaction; retry no-op không thêm history/event; emit chỉ sau commit. Travel→ARRIVED→start/finish có face/ảnh/quote guard. Nghiệm thu→AWAITING_PAYMENT; complete cần payment+payout phù hợp, không tự tạo tiền/ví. Kiểm tra quyền order read/media/compare/face/schedule; socket JWT/rooms/GPS và recipient scopes. Client nhận snapshot/refetch; sửa route AFTER→Face bằng cách bỏ CTA sai, chưa tạo camera UI. Admin bỏ mock orders để không che API lỗi.

**FILES CHANGED:** Danh sách từng file và lý do tại [10-arc01-report.md](10-arc01-report.md#files-changed). Các tài liệu 04/05/07 ghi chú baseline lịch sử và dẫn contract mới; docs/worker-audit.md thêm entry implementation. Không thay đổi nội dung application ngoài phạm vi order policy/authorization/consumers liên quan.

**API/DATABASE CHANGES:** Giữ endpoints/methods/enums. `arrived` trả ARRIVED; accept-completion trả AWAITING_PAYMENT; pay chỉ finalize settlement đã ghi, thiếu bằng chứng trả 400 PAYMENT_NOT_SETTLED. Admin status không được tùy ý vượt cạnh/guard; direct deleteOrder bị chặn để giữ audit. Socket /orders yêu cầu access JWT; không nhận identity từ payload, không phát order data global. Không sửa schema/migration hoặc ghi vào DB dự án. DB integration được tạo riêng từ schema bằng db push, không chứng minh migration history.

**TEST RESULTS:**

| Kiểm tra / lệnh | Kết quả thực tế | Bằng chứng / giới hạn |
|---|---|---|
| `cd server && npm test -- --runInBand` | PASSED — 7 suites / 54 tests | Unit/validator/catalog/check-in/diagnosis; có mocks, không coi là DB proof |
| `cd server && ARC01_TEST_DATABASE_URL=<isolated local *_test URL> npm run test:arc01` | PASSED — 17 tests | PostgreSQL/PostGIS thật qua Prisma; HTTP Orders/Admin + JWT/guards thật; Socket.IO thật. Hai thợ/một đơn, một thợ/hai đơn, concurrent/duplicate, actor/ownership, preconditions, DB trigger rollback/no-event, settlement fixture, reload, GPS identity, dispute evidence, module graph |
| Worker targeted Jest: `orderFsm`, `socketConnection`, `workerSession`, `tokenRefresh` | PASSED — 12 tests (4 mới + 8 regression) | Screen xác nhận chờ REST/ARRIVED/reload-on-error/event; mock camera/GPS/network, không phải thiết bị thật |
| Customer `socketConnection.test.js` | PASSED — 1 test | Auth callback/rejoin mocked socket; không chứng minh native/full app |
| `cd worker-app && npx tsc --noEmit --pretty false` | PASSED | TypeScript configured scope; không bao phủ toàn JS/native runtime |
| `cd customer-app && npx tsc --noEmit --pretty false` | PASSED | Như trên |
| `cd server && npm run build` | PASSED | Babel compile; không phải runtime toàn AppModule/Firebase/providers |
| `cd client && npm run build` | PASSED | Vite bundle; có warning chunk >500kB |
| Targeted non-mutating ESLint, formatter rule tắt | PASSED, 0 errors | 17 warning no-unused-vars ở các catch hiện hữu; không chạy script lint --fix toàn repo, không coi là full style pass |
| Local links / git diff whitespace | PASSED sau kiểm tra cuối | Xem tài liệu đầy đủ ở 10 |
| Redis pubsub/multi-node, payment provider, AI model/liveness, mobile Android/iOS E2E | NOT RUN / NOT_VERIFIED | Redis/queue trong test harness được stub; settlement chỉ fixture; chưa có device QA |

Postgres test: image `postgis/postgis:16-3.4-alpine`, DB riêng `fixgo_arc01_test`, bind `127.0.0.1:55439`, container `fixgo-arc01-postgres`. Fixtures cleanup theo IDs, trigger ép lỗi được drop; container tạm được dọn sau kiểm tra. Không kết nối/gửi migration vào DB dùng chung. Các lần thử ban đầu gặp cấu hình Babel/fixture/test harness đã được sửa; bảng trên là kết quả cuối đạt, không dùng lần fail làm evidence pass.

**RISKS:** Không tuyên bố Worker App/25 AC E2E hoàn tất. FACE-01 còn provenance/heuristic, ORD-01 còn offer expiry/eligibility; ARC-02 còn schema baseline/version/idempotency tổng quát; QUO-01 còn Quote entity/version; IMG UI chưa có nên start/finish sẽ bị chặn nếu thiếu ảnh thật; PAY/WAL chưa có settlement provider/ledger writer mới. Root AdminGateway, các đường force-delete user/catalog và generic AI endpoints có rủi ro ngoài scope đã ghi riêng ở 10. Event delivery best effort chưa outbox/version; client cần refetch nếu mất event.

**NEXT TASK:** Đề xuất ARC-02 để đối chiếu migrations và thêm version/idempotency; ưu tiên FACE-01 trước vận hành biometric thật. Chờ người dùng giao task, chưa chuyển sang triển khai tiếp theo. Không commit/push.

**TASK STATUS:** ARC-01 implementation + automated backend/consumer checks đã đạt trong phạm vi nêu trên; production migration, Redis đa node và native E2E vẫn NOT_VERIFIED. Các gap của task sau không được đánh dấu DONE.
