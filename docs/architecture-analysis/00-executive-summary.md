# Executive summary — FixGo Pro

Ngày phân tích: **01/11/2026**, snapshot source tại workspace; không đại diện cho môi trường production đã triển khai.

## Mục lục

- [Kết luận](#kết-luận)
- [Ưu tiên](#ưu-tiên)
- [Cách đọc bằng chứng](#cách-đọc-bằng-chứng)
- [Giới hạn](#giới-hạn)

## Kết luận

**CONFIRMED:** Đây là repository nhiều application: NestJS API core, React web, Expo mobile và Python FastAPI AI. Không thấy root workspace manifest hoặc shared package được import xuyên application. Ba app JavaScript có manifest và npm lockfile riêng. Xem [inventory](01-project-structure.md).

**INFERRED, confidence cao:** Kiến trúc chủ đạo là **Client–Server + backend Modular Monolith theo feature, phân tầng thực dụng**, cộng một AI service tách process qua HTTP. Không có bằng chứng đủ để gọi toàn hệ thống là Clean Architecture, Hexagonal hay DDD. [doan-kltn-backend/src/app.module.js:17](../../doan-kltn-backend/src/app.module.js#L17) — `AppModule`, [doan-kltn-backend/src/modules/orders/orders.module.js:13](../../doan-kltn-backend/src/modules/orders/orders.module.js#L13) — `OrdersModule`, [doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js:29](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js#L29) — `FastApiAiClient.diagnoseIncident`.

**CONFIRMED:** Module Nest có Controller/Service/Repository ở một số feature; nhiều service truy cập Prisma trực tiếp. Boundary là convention và DI module, chưa phải domain core độc lập framework. [doan-kltn-backend/src/modules/users/users.service.js:4](../../doan-kltn-backend/src/modules/users/users.service.js#L4) — `UsersService`, [doan-kltn-backend/src/modules/orders/orders.service.js:31](../../doan-kltn-backend/src/modules/orders/orders.service.js#L31) — `OrdersService`.

**CONFIRMED:** Có REST, Socket.IO, BullMQ delayed jobs và Redis subscriber; chưa chứng minh một distributed event backbone hoàn chỉnh. Queue worker chạy trong cùng backend lifecycle. [doan-kltn-backend/src/modules/orders/order-queue.service.js:52](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L52) — `OrderQueueService.onModuleInit`, [doan-kltn-backend/src/modules/orders/orders.gateway.js:48](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L48) — `OrderGateway.afterInit`.

Điểm tốt đáng học: modular composition, DI tường minh trong JavaScript, transaction ghi đơn và lịch sử, row lock khi nhận đơn, client transport wrapper, hook tách state khỏi presentation, AI model lifespan. Điểm yếu lớn là **tính nhất quán contract và invariant**, không phải thiếu framework kiến trúc.

## Ưu tiên

| Thứ tự | Phát hiện từ source | Mức độ | Evidence |
|---|---|---|---|
| 1 | Thanh toán ghi PAID/cộng ví trực tiếp, thiếu ownership, tiền điều kiện và chống xử lý lặp | Critical | [doan-kltn-backend/src/modules/orders/orders.service.js:1071](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1071) — `OrdersService.processPayment` |
| 2 | WebSocket join/admin/GPS thiếu xác thực và kiểm tra quyền; broadcast namespace rộng | Critical | [doan-kltn-backend/src/modules/orders/orders.gateway.js:90](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L90) — `OrderGateway.handleConnection`, [doan-kltn-backend/src/modules/orders/orders.gateway.js:181](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L181) — `OrderGateway.handleWorkerUpdateLocation` |
| 3 | Face fallback chấp nhận heuristic; cả nhánh failed verification cũng cập nhật mốc cho phép nhận đơn | High | [doan-kltn-backend/src/modules/orders/orders.service.js:720](../../doan-kltn-backend/src/modules/orders/orders.service.js#L720) — `OrdersService.verifyFace`, [ai-service/main.py:1083](../../ai-service/main.py#L1083) — `face_verify` |
| 4 | Config có credential literal và JWT fallback trong source; không tái hiện giá trị | High | [doan-kltn-backend/src/config/cloudinary.config.js:5](../../doan-kltn-backend/src/config/cloudinary.config.js#L5) — `cloudinary.config`, [doan-kltn-backend/src/modules/auth/auth.module.js:22](../../doan-kltn-backend/src/modules/auth/auth.module.js#L22) — `AuthModule` |
| 5 | Hai bộ trạng thái, nhầm User ID với CustomerProfile ID và query cũ sai relation | High | [doan-kltn-backend/prisma/schema.prisma:218](../../doan-kltn-backend/prisma/schema.prisma#L218) — `Order.customer`, [doan-kltn-backend/src/modules/customer-home/customer-home.service.js:126](../../doan-kltn-backend/src/modules/customer-home/customer-home.service.js#L126) — `CustomerHomeService.getActiveOrder`, [doan-kltn-backend/src/modules/orders/orders.repository.js:12](../../doan-kltn-backend/src/modules/orders/orders.repository.js#L12) — `OrdersRepository.findById` |
| 6 | Queue mở rộng gọi method gateway không tồn tại; mobile dùng namespace/event khác | High | [doan-kltn-backend/src/modules/orders/order-queue.service.js:153](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L153) — `OrderQueueService.processJob`, [doan-kltn-mobile/src/services/socket/socketService.js:56](../../doan-kltn-mobile/src/services/socket/socketService.js#L56) — `SocketService.connect` |

Confidence **cao về code path**, **NOT VERIFIED về khai thác hoặc thiệt hại thực tế**. Severity là đánh giá tác động nếu chạy source này với dữ liệu thật, không phải kết quả pentest. Chi tiết và cải tiến incremental: [review](09-architecture-review.md).

## Cách đọc bằng chứng

- **CONFIRMED:** thấy trực tiếp trong source/config đang xét. Không tự động đồng nghĩa chạy thành công.
- **INFERRED:** suy luận từ các quan sát có dẫn chứng; chưa chứng minh ý định developer hoặc runtime.
- **NOT FOUND:** tìm trong phạm vi inventory nhưng chưa thấy; không khẳng định ngoài repository không tồn tại.
- **NOT VERIFIED:** cần runtime, môi trường hoặc dữ liệu để kết luận; chưa thực hiện.

Một nhận định có thể CONFIRMED về thiếu check trong method và NOT VERIFIED về hậu quả vận hành. Confidence (cao/vừa/thấp) là độ mạnh bằng chứng, khác severity.

## Giới hạn

Chỉ static analysis; không đọc `.env`, credential files, private keys, logs thực tế; không cài dependency, chạy app, test có kết nối DB, migration, seed, setup hay API ghi dữ liệu. Chỉ tạo tài liệu yêu cầu. Không kiểm chứng phiên bản cài thực tế, health dịch vụ, model accuracy, SQL query plan, latency, migration áp dụng hay deployment.

Đã inventory và scan import/symbol toàn bộ source trong các root ứng dụng; deep review tập trung business paths. Không tuyên bố mọi dòng UI/style, dataset, notebook hoặc binary được kiểm toán. [Evidence index](11-evidence-index.md) có phạm vi, module coverage, file inventory và phần loại trừ để không bỏ qua im lặng.

Ghi chú snapshot: source có thay đổi đồng thời trong lúc review; đã đối chiếu lại phần AI/backend liên quan và cập nhật dẫn chiếu. Các source changes ngoài báo cáo được giữ nguyên; xem mục cuối evidence index.
