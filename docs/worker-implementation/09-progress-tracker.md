# Progress tracker — 12/11/2026

## TASK: AUD-01 — audit source và lập kế hoạch

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
| ARC-01 và toàn bộ task implementation | Chưa bắt đầu; chờ giao task |
| AC-01…25 E2E | Chưa có PASS E2E; xem trạng thái source ở 08 |
| Điều kiện tuyên bố Worker App hoàn thiện | Chưa đạt |
