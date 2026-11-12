# Prioritized backlog và thứ tự triển khai

Mỗi issue ở [06](06-gap-analysis.md) đã có hiện trạng, dẫn chứng, thay đổi FE/BE, dependencies, AC và test. Bảng này là kế hoạch, không báo cáo đã sửa. Thứ tự tránh làm UI dựa trên contract đang sai. “Khóa/ẩn hành vi giả” có thể triển khai sớm riêng; hoàn thiện đầy đủ phụ thuộc các task nền.

| Issue | Priority | Hạng mục | Dependencies | Nhóm chịu trách nhiệm đề xuất |
|---|---|---|---|---|
| [CUS-01](06-gap-analysis.md#cus-01) | P0 | Nối luồng đơn hàng vào navigation đang chạy | CUS-05, CUS-06, CUS-07, CUS-11 | Mobile + Backend + QA |
| [CUS-02](06-gap-analysis.md#cus-02) | P0 | Dịch vụ khác báo gửi thành công nhưng chỉ lưu local | CUS-01, CUS-04 | Mobile + Backend + QA |
| [CUS-03](06-gap-analysis.md#cus-03) | P0 | Hủy đơn local tạo hai sự thật | CUS-04, CUS-09 | Mobile + Backend + QA |
| [CUS-04](06-gap-analysis.md#cus-04) | P0 | Cache đơn không theo tài khoản và chặn refresh server | Không | Mobile + Backend + QA |
| [CUS-05](06-gap-analysis.md#cus-05) | P0 | Worker thiếu khảo sát, ảnh và hoàn tất công việc | CUS-06, CUS-08 | Mobile + Backend + QA |
| [CUS-06](06-gap-analysis.md#cus-06) | P0 | Báo giá chưa bắt buộc đồng thuận và từ chối gây bế tắc | CUS-01, CUS-05 | Mobile + Backend + QA |
| [CUS-07](06-gap-analysis.md#cus-07) | P0 | Thanh toán không khép kín, contract lệch Prisma | CUS-10, CUS-06 | Backend/Payments + Mobile + QA |
| [CUS-08](06-gap-analysis.md#cus-08) | P0 | AI Face và nghiệm thu có mock success ở nhiều tầng | Không | AI + Backend + Worker + QA |
| [CUS-09](06-gap-analysis.md#cus-09) | P1 | Realtime route thật sai event và không join order room | CUS-04 | Mobile + Backend + QA |
| [CUS-10](06-gap-analysis.md#cus-10) | P0 | Payment endpoints thiếu ownership và webhook mock công khai | Không | Backend/Payments + Mobile + QA |
| [CUS-11](06-gap-analysis.md#cus-11) | P1 | Dispatch timeout, mở rộng và lịch hẹn không đồng bộ | CUS-09, CUS-12 | Mobile + Backend + QA |
| [CUS-12](06-gap-analysis.md#cus-12) | P1 | Tạo đơn thiếu idempotency và kiểm tra eligible worker khi nhận | Không | Mobile + Backend + QA |
| [CUS-13](06-gap-analysis.md#cus-13) | P1 | Địa chỉ chữ khác GPS và thiếu đường nhập thay thế | CUS-04 | Mobile + Backend + QA |
| [CUS-14](06-gap-analysis.md#cus-14) | P1 | Ảnh sự cố được chọn nhưng chưa được chuyển lên server | CUS-05, CUS-13 | Mobile + Backend + QA |
| [CUS-15](06-gap-analysis.md#cus-15) | P1 | Home trộn catalog thật với dữ liệu uy tín và ưu đãi giả | CUS-07 | Mobile + Backend + QA |
| [CUS-16](06-gap-analysis.md#cus-16) | P1 | Ví và mã giảm giá có giao dịch thành công giả | CUS-07, CUS-15 | Backend/Payments + Mobile + QA |
| [CUS-17](06-gap-analysis.md#cus-17) | P1 | Sửa hồ sơ chỉ local và mật khẩu không được xác minh | CUS-18 | Mobile + Backend + QA |
| [CUS-18](06-gap-analysis.md#cus-18) | P1 | Auth và deep link cần ràng buộc phiên, OTP với nghiệp vụ | CUS-04 | Mobile + Backend + QA |
| [CUS-19](06-gap-analysis.md#cus-19) | P1 | Active order và History không phản ánh đúng snapshot | CUS-04, CUS-09 | Mobile + Backend + QA |
| [CUS-20](06-gap-analysis.md#cus-20) | P1 | GPS không tự phục hồi khi Worker mở lại app | CUS-09, CUS-13 | Mobile + Backend + QA |
| [CUS-21](06-gap-analysis.md#cus-21) | P1 | Dispute không có đường xử lý và hỗ trợ còn placeholder | CUS-01, CUS-07 | Mobile + Backend + QA |
| [CUS-22](06-gap-analysis.md#cus-22) | P1 | Chọn đích danh thợ, gọi/chat và thay thợ chưa thành nghiệp vụ | CUS-11, CUS-12, CUS-21 | Mobile + Backend + QA |
| [CUS-23](06-gap-analysis.md#cus-23) | P1 | Xóa danh mục/thợ có thể phá lịch sử và đơn đang chạy | CUS-21, CUS-22 | Mobile + Backend + QA |
| [CUS-24](06-gap-analysis.md#cus-24) | P2 | UI không thống nhất và đánh giá mặc định thiên lệch | CUS-01 | UX + Mobile + QA |

## Nhóm công việc và gate

| Nhóm | Công việc / thứ tự | Gate hoàn thành |
|---|---|---|
| A — Chốt tính đúng đắn | Khóa mock-success payment/AI/custom/wallet/profile; chốt FSM, settlement accounting, quote decision và snapshot | Không còn success quan trọng sinh từ local/heuristic; API quan trọng có ownership |
| B — Snapshot và phục hồi | Cache theo user, entry/deep link guard, route order dùng GET, socket đúng event/room, active query/history | Cold start mọi active state phục hồi, không lộ dữ liệu account trước |
| C — Create và dispatch | Address/pin thật, ISSUE upload, create idempotency, candidate eligibility, schedule/retry/queue | Hai app thấy cùng orderId và worker, mở rộng thực phát candidate |
| D — Khảo sát và thi công | Worker ảnh BEFORE, quote/phạm vi/approval, start, AFTER, finish | Không start khi chưa đồng ý giá; Worker hoàn tất qua UI thật |
| E — Nghiệm thu và sự cố | Customer nhận ảnh thật, accept/dispute, admin resolution, bảo toàn lịch sử và assignment | Không kẹt sau reject; hỗ trợ không chỉ log/alert |
| F — Settlement | Đã thiết kế ở A, có thể phát triển song song C–E: provider/cash, callback idempotency, transaction ledger/payment/FSM | Sandbox + DB/ledger đối soát; repeated callback/retry không trả/cộng hai lần |
| G — Chất lượng cuối | Review tự nguyện, notifications/kênh hỗ trợ thật, UX/error/accessibility; ưu đãi/ví mở theo khả năng thật | Release matrix đạt; không còn CTA hứa sai hoặc dữ liệu giao dịch mẫu |

CUS-01 không cần chờ CUS-07 để tạo route/snapshot nền; phần payment của CUS-01 chỉ hoàn tất sau settlement. CUS-06 và CUS-05 có thể triển khai theo hai phía sau khi chốt contract, nhưng gate nghiệm thu chung phải kiểm cùng version backend. Không giảm gate backend để UI chạy được.

## Chuyển tiếp và rollback

Deploy backend đọc legacy/ghi canonical và response additive trước, sau đó Worker + Customer cùng contract, rồi mới backfill có đối soát. Giữ alias REST/socket và URL /order/:id, booking/index; quét references code, scheme `fixgocustomer`, deep links chia sẻ/notification đã phát và installed app versions. Dữ liệu mới phải đọc được khi rollback mobile; không rollback bằng sửa ledger hay downgrade trạng thái đã quyết toán. Version contract có breaking change cần kế hoạch riêng, không thay lặng lẽ.

Không ước lượng ngày công khi chưa chốt provider, cash policy, hỗ trợ dispute và thiết bị kiểm thử. Critical path là B → C → D → E → F gate; F có thể làm song song để giảm thời gian tổng. Tập trung một vertical journey chuẩn trước thêm preferred-worker, chat, voucher hay wallet UI nâng cao.

Scheme hiện tại: [customer-app/app.json:8](../../customer-app/app.json#L8). Bằng chứng route alias: [customer-app/app/(user)/booking/index.jsx:1](../../customer-app/app/(user)/booking/index.jsx#L1); backend alias: [server/src/modules/orders/orders.controller.js:510](../../server/src/modules/orders/orders.controller.js#L510).
