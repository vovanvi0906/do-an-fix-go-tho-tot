# Worker App — audit và kế hoạch

Audit source ngày 12/11/2026. Tài liệu mục tiêu: [worker-app-doc.md](../worker-app/worker-app-doc.md). Chỉ tài liệu được tạo, chưa triển khai code/schema/business logic.

Bộ nội dung chuẩn nằm tại [worker-implementation/01-codebase-audit.md](worker-implementation/01-codebase-audit.md). Không duy trì một bản audit trùng khác.

| Tài liệu | Nội dung |
|---|---|
| [01 Audit](worker-implementation/01-codebase-audit.md) | Evidence file/hàm, trạng thái tất cả backlog |
| [02 Gaps](worker-implementation/02-gap-analysis.md) | Rủi ro P0/P1, xung đột, quyết định còn mở |
| [03 Flow](worker-implementation/03-business-flow.md) | 14 giai đoạn và ngoại lệ |
| [04 FSM](worker-implementation/04-order-state-machine.md) | Enums, mapping, actors, guards, phục hồi |
| [05 Contracts](worker-implementation/05-api-data-contract.md) | REST, schema, WebSocket thật/đề xuất |
| [06 UX](worker-implementation/06-ui-ux-spec.md) | CTA theo state, camera/GPS/error/retry |
| [07 Plan](worker-implementation/07-implementation-plan.md) | Task chi tiết/phụ thuộc/AC/test/rollback |
| [08 QA](worker-implementation/08-test-plan.md) | AC-01…25, unit/integration/E2E/mobile/AI |
| [09 Progress](worker-implementation/09-progress-tracker.md) | Kết quả đã chạy và giới hạn |

Phát hiện chính: backend có hai FSM; active order chưa restore; status worker chỉ local; AFTER sai route; face/compare còn fake-success fallback; quote chưa bền vững; nghiệm thu COMPLETED trước trả tiền; pay có thể cộng ví lặp; ownership/socket scope thiếu và schema/migrations không đồng bộ.

Đã chạy 6 backend + 8 worker unit tests, đều pass, dùng mocks. Runtime DB/Redis/AI/provider/mobile E2E NOT_VERIFIED. Đề xuất task đầu tiên ARC-01; chờ giao task triển khai.

Cập nhật sau audit: [ARC-01 — implementation report](worker-implementation/10-arc01-report.md), [tiến độ và kiểm thử](worker-implementation/09-progress-tracker.md).
