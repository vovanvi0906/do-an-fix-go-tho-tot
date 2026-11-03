# Software Design Principles

## Mục lục

- [SOLID](#solid)
- [Các nguyên lý khác](#các-nguyên-lý-khác)
- [Thứ tự cải thiện](#thứ-tự-cải-thiện)

Mỗi đánh giá dựa trên ví dụ cụ thể, không chấm điểm toàn project theo tên framework. Confidence cao về quan sát, đánh giá mức ảnh hưởng là **INFERRED**.

## SOLID

| Nguyên lý | Bằng chứng tốt | Chưa tốt / không đủ evidence | Impact, đề xuất, effort, trade-off |
|---|---|---|---|
| SRP | `OrderTransitionValidator` chỉ check transition; UsersRepository chỉ persistence | OrdersService 1.500 dòng bao AI, matching, status, payout, review; AdminService 2.558 dòng bao user/catalog/analytics/settings | High maintainability; tách payment/matching/transition theo trách nhiệm, effort vừa; thêm wiring nhưng review/test nhỏ hơn |
| OCP | Hook/presentation tách, adapter che HTTP giúp đổi client mà ít sửa UI | AI `diagnose` và face fallback trộn branch engine/policy; thêm thuật toán thường sửa cùng handler | Medium; extract engine selection khi có nhiều biến thể thực; effort vừa; tránh registry/plugin framework quá sớm |
| LSP | Chỉ thấy `PrismaService extends PrismaClient`, `JwtStrategy extends PassportStrategy`, chưa thấy break contract được chứng minh | Không có polymorphic domain subtype hierarchy đủ để đánh giá LSP business | **NOT VERIFIED / không chấm đạt hoặc vi phạm**; không thêm inheritance để “đủ SOLID” |
| ISP | `UsersService` và wrapper API có interface use case tương đối hẹp | OrdersService inject tám dependency, dùng Prisma rộng; chưa có domain interface chính thức để kết luận ISP violation | INFERRED dấu hiệu broad dependency; chia client/ports theo consumer khi cần, effort vừa, thêm abstraction cost |
| DIP | DI giúp replace provider bằng mock | OrdersService import concrete Prisma/Redis/Gateway/FastApiAiClient; business/service gắn ORM/framework | CONFIRMED dependency outward; High testability impact; domain port nhỏ cho payment/AI, effort vừa; CRUD đơn giản có thể giữ direct Prisma |

Evidence: [doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js:4](../../doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js#L4) — `OrderTransitionValidator`, [doan-kltn-backend/src/modules/orders/orders.service.js:31](../../doan-kltn-backend/src/modules/orders/orders.service.js#L31) — `OrdersService`, [doan-kltn-backend/src/modules/admin/admin.service.js:15](../../doan-kltn-backend/src/modules/admin/admin.service.js#L15) — `AdminService.constructor`, [doan-kltn-backend/src/infrastructure/database/prisma.service.js:5](../../doan-kltn-backend/src/infrastructure/database/prisma.service.js#L5) — `PrismaService`, [doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js:6](../../doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js#L6) — `JwtStrategy`, [doan-kltn-backend/src/modules/orders/orders.service.spec.js:12](../../doan-kltn-backend/src/modules/orders/orders.service.spec.js#L12) — `Test.createTestingModule`.

## Các nguyên lý khác

### DRY

**CONFIRMED tốt:** Axios interceptor gom token/error logic; validator và constants gom transition cho legacy workflow. [doan-kttn-frontend/src/services/api/interceptors.js:9](../../doan-kttn-frontend/src/services/api/interceptors.js#L9) — `setupInterceptors`, [doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js:5](../../doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js#L5) — `validateTransition`.

**CONFIRMED chưa tốt:** Haversine SQL lặp ở `OrdersService.matchNearbyWorkers`, `OrdersRepository.findNearbyOnlineWorkers`, `WorkersService.findNearby` với filter khác nhau; category/rating/price fallback tĩnh xuất hiện cả AI, mobile và backend. [doan-kltn-backend/src/modules/orders/orders.service.js:546](../../doan-kltn-backend/src/modules/orders/orders.service.js#L546) — `matchNearbyWorkers`, [doan-kltn-backend/src/modules/orders/orders.repository.js:180](../../doan-kltn-backend/src/modules/orders/orders.repository.js#L180) — `findNearbyOnlineWorkers`, [doan-kltn-backend/src/modules/workers/workers.service.js:254](../../doan-kltn-backend/src/modules/workers/workers.service.js#L254) — `findNearby`.

Impact Medium–High: khác filter gây behavior drift. Đề xuất một query component có eligibility filter tường minh; effort vừa; trade-off query có nhiều option nên cần API hẹp theo use case, không tạo universal query framework.

### KISS và YAGNI

**INFERRED tốt:** Một Nest app + Prisma + AI service là lựa chọn vận hành dễ hiểu ở quy mô hiện thấy; không cần event sourcing cho đặt lịch. Cơ sở là `AppModule`, mutable Order schema và HTTP adapter.

**CONFIRMED debt:** directory placeholder nhiều, PaymentsModule tồn tại nhưng không mount và trỏ method workflow không tồn tại; compatibility alias và hai bộ enum làm mental model phức tạp. [doan-kltn-backend/src/modules/payments/payments.service.js:65](../../doan-kltn-backend/src/modules/payments/payments.service.js#L65) — `processPaymentSuccess`, [doan-kltn-backend/src/modules/orders/constants/order-status.js:1](../../doan-kltn-backend/src/modules/orders/constants/order-status.js#L1) — `ORDER_STATUS`, [doan-kltn-backend/prisma/schema.prisma:475](../../doan-kltn-backend/prisma/schema.prisma#L475) — `OrderStatus`.

Không thể xác nhận developer “over-engineer vì YAGNI” từ source; chỉ **INFERRED** chi phí cognitive của skeleton không dùng. Đề xuất đánh dấu experimental/legacy và loại dần sau kiểm kê caller; effort nhỏ–vừa, trade-off có thể mất scaffolding thuận tiện nếu xóa sớm.

### Separation of Concerns, cohesion và coupling

Hook `useDashboardData` giữ fetching/subscription, chart components giữ presentation là ví dụ cohesion tốt. Backend `AdminService` gom nhiều feature ít liên quan và `AuthService → AdminGateway` gắn auth với management UI. [doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js:24](../../doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js#L24) — `fetchData`, [doan-kltn-backend/src/modules/auth/auth.service.js:17](../../doan-kltn-backend/src/modules/auth/auth.service.js#L17) — `AuthService`, [doan-kltn-backend/src/modules/admin/admin.service.js:2327](../../doan-kltn-backend/src/modules/admin/admin.service.js#L2327) — `getDashboardOverviewV1`.

Impact High maintenance; tách analytics/catalog/admin user services trong cùng module trước. Chưa cần domain bus chỉ để bỏ một import; effort vừa, trade-off thêm module contracts phải giữ ổn định.

### Encapsulation và abstraction

`UsersController.getProfile` loại `passwordHash` trước response là boundary tốt; repository vẫn trả full persistence object cho trusted auth path. [doan-kltn-backend/src/modules/users/users.controller.js:37](../../doan-kltn-backend/src/modules/users/users.controller.js#L37) — `getProfile`, [doan-kltn-backend/src/modules/users/users.repository.js:11](../../doan-kltn-backend/src/modules/users/users.repository.js#L11) — `findById`.

`OrderGateway.handleWorkerUpdateLocation` tin `workerId` client cung cấp, `scheduleOrder` nhận userId nhưng không kiểm tra chủ đơn: invariant chưa được encapsulate tại write boundary. [doan-kltn-backend/src/modules/orders/orders.gateway.js:181](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L181) — `handleWorkerUpdateLocation`, [doan-kltn-backend/src/modules/orders/orders.service.js:1431](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1431) — `scheduleOrder`. Impact High; dùng authenticated actor và explicit authorization mỗi write, effort nhỏ–vừa; trade-off thêm DB lookup hoặc policy cache.

### Composition over Inheritance

**CONFIRMED:** Nest services ghép dependency constructor, React ghép provider/component/hook. Inheritance chỉ thấy ở integration framework (`PrismaClient`, Passport). Không có evidence lạm dụng class hierarchy. [doan-kltn-backend/src/modules/orders/orders.service.js:42](../../doan-kltn-backend/src/modules/orders/orders.service.js#L42) — `OrdersService.constructor`, [doan-kttn-frontend/src/App.jsx:5](../../doan-kttn-frontend/src/App.jsx#L5) — `App`. Không đề nghị thay toàn bộ framework inheritance chỉ vì nguyên tắc này.

### Dependency management

**CONFIRMED tốt:** app có manifest/lockfile riêng, build boundary độc lập. **CONFIRMED chưa tốt:** README/runtime config drift; Python minimum ranges; DTO metadata không gắn body runtime rõ; npm lint mặc định `--fix` có mutation. [doan-kltn-backend/package.json:1](../../doan-kltn-backend/package.json#L1) — `scripts`, [ai-service/requirements.txt:1](../../ai-service/requirements.txt#L1) — `requirements`, [doan-kltn-backend/.babelrc:1](../../doan-kltn-backend/.babelrc#L1) — `configuration`. Impact Medium; pin supported toolchain và reproducible CI, effort nhỏ–vừa; trade-off lock update maintenance.

### Functional Core / Imperative Shell

**INFERRED một phần:** category normalization và SSIM/hist computations là computational core tương đối độc lập; HTTP/image loading/DB write là shell. [ai-service/category_helper.py:38](../../ai-service/category_helper.py#L38) — `normalize_category_key`, [ai-service/main.py:122](../../ai-service/main.py#L122) — `compute_ssim_opencv`, [ai-service/main.py:78](../../ai-service/main.py#L78) — `decode_image_to_cv2`.

Chưa hình thành functional core rõ trong payout: math, checks và IO cùng method. [doan-kltn-backend/src/modules/orders/orders.service.js:1071](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1071) — `processPayment`. Extract `calculatePayout` thuần có ích để test boundary/rounding; effort nhỏ, trade-off thêm function nhưng không giải quyết idempotency một mình. Validator tuy ít side effect vẫn throw Nest exception nên chưa framework-independent.

### Law of Demeter

Deep navigation `worker.faceProfile?.facePhotoUrl`, `worker.user?.avatarUrl` và nested ORM includes buộc use case biết cấu trúc persistence graph. [doan-kltn-backend/src/modules/orders/orders.service.js:736](../../doan-kltn-backend/src/modules/orders/orders.service.js#L736) — `verifyFace reference resolution`, [doan-kltn-backend/src/modules/orders/orders.repository.js:12](../../doan-kltn-backend/src/modules/orders/orders.repository.js#L12) — `findById`.

**INFERRED coupling concern**, không coi mọi `a.b.c` là vi phạm tự động. Query projection/mapper trả `referenceFaceUrl` có thể giảm knowledge; effort nhỏ–vừa, trade-off thêm DTO. Quan trọng hơn là query hiện include relation sai (`Order.customer` là User nhưng repository include `customer.user`).

## Thứ tự cải thiện

1. Đóng invariant bảo mật và payment tại service boundary, không chỉ UI/DTO.
2. Chuẩn hóa ID/status/response contract rồi thay test bám contract đó.
3. Tách service theo trách nhiệm và query component khi boundary đã rõ.
4. Chỉ thêm abstraction khi có consumer hoặc variation thực tế.

Mỗi đề xuất chi tiết về rationale/impact/effort/trade-off nằm trong [review](09-architecture-review.md). Các bước trên là TO-BE bằng văn bản; mọi diagram của báo cáo mô tả AS-IS.
