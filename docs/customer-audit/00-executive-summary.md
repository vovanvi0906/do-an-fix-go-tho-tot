# Executive summary

**Customer App hiện chưa có hành trình đồng bộ, đáng tin cậy từ đặt đơn đến hoàn tất thanh toán.** Vấn đề chính là đường đi thực tế qua Expo Router chưa nối tới nghiệm thu/thanh toán, trong khi các lớp business khác đã có nhiều thành phần riêng. Có **24 issue: 9 P0, 14 P1, 1 P2**. Đây là đánh giá mã nguồn working tree ngày 12/11/2026, không phải số liệu production.

## Các chặn chính

1. **Hành trình sau nhận thợ bị đứt:** Home → create-booking → order/[id], nhưng detail thiếu action báo giá/nghiệm thu/payment/review. Bộ sáu component không có reference tích hợp vào route. [CUS-01](06-gap-analysis.md#cus-01).
2. **Success khác sự thật hệ thống:** dịch vụ khác chỉ local; hủy và demo duyệt chỉ local; cache không theo user và ưu tiên hơn GET server. [CUS-02…04](06-gap-analysis.md).
3. **Backend gate đúng nhưng Worker chưa thao tác được:** BEFORE bắt buộc sau ARRIVED, AFTER bắt buộc sau start; job route thiếu upload và finish. [CUS-05](06-gap-analysis.md).
4. **Phê duyệt giá chưa kín:** không quote vẫn start được, reject gây kẹt và quote dùng note thay dữ liệu có phiên bản. [CUS-06](06-gap-analysis.md).
5. **Không có settlement hoạt động khớp schema:** checkout là example.com, repository sai trường/enum, gọi method workflow không tồn tại. /pay không thực hiện thu tiền mới. Webhook mock lại công khai. [CUS-07, CUS-10](06-gap-analysis.md).
6. **Face và nghiệm thu có thành công mô phỏng:** thiếu model/lỗi có thể nhận verified/passed ở Python và Nest; strict daily check chưa kiểm tra nguồn kết quả. [CUS-08](06-gap-analysis.md).

## Những phần đáng giữ lại

FSM đã chuẩn hóa alias, phân quyền actor theo DB, lock worker rồi order, transaction + history và phát status sau commit: [server/src/modules/orders/order-workflow.service.js:77](../../server/src/modules/orders/order-workflow.service.js#L77). GET order có ownership và room socket có JWT/ownership: [server/src/modules/orders/orders.service.js:215](../../server/src/modules/orders/orders.service.js#L215), [server/src/modules/orders/orders.gateway.js:96](../../server/src/modules/orders/orders.gateway.js#L96). Không nên thay các gate này bằng mock success để làm demo liền mạch.

Catalog có API cây Category → Target → Service và UI chọn tương ứng: [server/src/modules/services/services.controller.js:28](../../server/src/modules/services/services.controller.js#L28), [customer-app/src/features/services/hooks/useSelectServiceWizard.ts:39](../../customer-app/src/features/services/hooks/useSelectServiceWizard.ts#L39). AI diagnosis đã tách suggested/needs_more_info/manual_selection/unavailable và đối chiếu dịch vụ active: [server/src/modules/orders/diagnosis/diagnosis-resolver.js:76](../../server/src/modules/orders/diagnosis/diagnosis-resolver.js#L76). Cần giữ chọn tay khi AI không khả dụng.

## Thứ tự triển khai tối ưu

| Bước | Kết quả cần đạt | Issue / điều kiện |
|---|---|---|
| 1 | Chặn success giả và truy cập sai ngay; cố định contract/schema/FSM hiện tại | CUS-02/03/04/08/10/16/17; ưu tiên khóa hành vi nguy hiểm trước tích hợp |
| 2 | Một route chi tiết phục hồi theo server, cache theo user, đúng room/event | CUS-01/04/09/19; backend bổ sung snapshot tương thích trước app |
| 3 | Đặt đơn và điều phối thực: địa chỉ khớp pin, ảnh thật, retry giữ id, dispatch lịch hẹn đúng | CUS-11/12/13/14; giữ lock accept hiện có |
| 4 | Khảo sát và báo giá hai phía: BEFORE, giá/phạm vi được duyệt, reject có lối thoát | CUS-05/06/08; Worker và Customer kiểm thử cùng backend |
| 5 | Thi công → AFTER → khách nghiệm thu hoặc dispute, hỗ trợ xử lý được | CUS-05/21/22/23; không giải quyết dispute bằng sửa DB tay |
| 6 | Settlement thật, callback xác minh, idempotency, ledger và hoàn tất đơn nhất quán | CUS-07/10; có thể phát triển song song với bước 3–5 sau khi chốt contract; bắt buộc xong trước release |
| 7 | Review/history/notification và UX hoàn thiện; ưu đãi/ví chỉ mở khi có accounting thật | CUS-15/16/17/18/19/20/24; chạy release matrix |

Không cần thêm order state mới cho khảo sát/báo giá trong giai đoạn đầu: dùng ARRIVED với dữ liệu quote/ảnh có trạng thái riêng. Mọi đề xuất entity quote, idempotency hoặc resolution action đều là thiết kế cần chốt/migration, không được mô tả như API đang có. Xem [04](04-customer-worker-state-machine.md) và [05](05-api-socket-contract.md).

## Bằng chứng kiểm thử và quyết định release

Đã chạy 3 suite backend (45 test) và 2 suite Customer socket/token refresh (3 test), đều pass. Chúng là unit/contract test có mock; **không phải E2E pass**. Chưa chạy thiết bị, PostgreSQL/Redis thật, AI/model thật, OTP thật hoặc provider sandbox. Mức sẵn sàng E2E: **NOT_VERIFIED**, đồng thời có blockers tĩnh đã thấy. Chỉ đánh giá lại release khi 9 P0 đóng và journey hai thiết bị + đối soát tiền qua gate ở [09](09-test-plan.md) đạt.
