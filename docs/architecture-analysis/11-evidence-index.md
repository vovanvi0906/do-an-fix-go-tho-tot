# Evidence Index và phạm vi phân tích

## Mục lục

- [Claim mapping](#claim-mapping)
- [Coverage theo module](#coverage-theo-module)
- [Phương pháp và giới hạn](#phương-pháp-và-giới-hạn)
- [Inventory source files](#inventory-source-files)

## Claim mapping

Mọi confidence là static evidence, không đồng nghĩa runtime validation. Claim chi tiết, rationale và findings xem các tài liệu chuyên đề; bảng này là điểm truy ngược.

| ID | Claim | File / dòng | Symbol | Status / confidence |
|---|---|---|---|---|
| E01 | Multi-application repo, không root workspace | [doan-kltn-backend/package.json:1](../../doan-kltn-backend/package.json#L1) | `manifest; AppModule` | CONFIRMED / cao |
| E02 | Backend composition root và active modules | [doan-kltn-backend/src/app.module.js:17](../../doan-kltn-backend/src/app.module.js#L17) | `AppModule` | CONFIRMED / cao |
| E03 | Client-server + modular monolith chủ đạo | [doan-kltn-backend/src/modules/orders/orders.module.js:13](../../doan-kltn-backend/src/modules/orders/orders.module.js#L13) | `OrdersModule` | INFERRED / cao |
| E04 | Layers concrete service/repository | [doan-kltn-backend/src/modules/users/users.service.js:6](../../doan-kltn-backend/src/modules/users/users.service.js#L6) | `UsersService` | CONFIRMED / cao |
| E05 | Không Clean/Hexagonal/DDD core độc lập trong inspected graph | [doan-kltn-backend/src/modules/orders/orders.service.js:9](../../doan-kltn-backend/src/modules/orders/orders.service.js#L9) | `infrastructure imports` | NOT FOUND / cao trong scope |
| E06 | DI concrete constructor | [doan-kltn-backend/src/modules/orders/orders.service.js:31](../../doan-kltn-backend/src/modules/orders/orders.service.js#L31) | `OrdersService` | CONFIRMED / cao |
| E07 | Swagger Builder và OpenAPI | [doan-kltn-backend/src/main.js:35](../../doan-kltn-backend/src/main.js#L35) | `DocumentBuilder` | CONFIRMED / cao |
| E08 | DTO có annotations; runtime binding chưa đủ | [doan-kltn-backend/src/modules/orders/orders.controller.js:111](../../doan-kltn-backend/src/modules/orders/orders.controller.js#L111) | `createOrder` | CONFIRMED wiring; INFERRED runtime / vừa |
| E09 | Babel không metadata plugin cho method types | [doan-kltn-backend/.babelrc:1](../../doan-kltn-backend/.babelrc#L1) | `plugins` | CONFIRMED / cao |
| E10 | Password hash/compare/sanitize | [doan-kltn-backend/src/modules/auth/auth.service.js:153](../../doan-kltn-backend/src/modules/auth/auth.service.js#L153) | `login` | CONFIRMED / cao |
| E11 | JWT không re-read user status | [doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js:15](../../doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js#L15) | `validate` | CONFIRMED / cao |
| E12 | OTP TTL/cooldown/attempt limit | [doan-kltn-backend/src/modules/auth/otp.service.js:21](../../doan-kltn-backend/src/modules/auth/otp.service.js#L21) | `OTP_TTL, COOLDOWN_TTL, MAX_ATTEMPTS` | CONFIRMED / cao |
| E13 | OTP/source logging thông tin nhạy cảm, không đọc actual logs | [doan-kltn-backend/src/modules/auth/otp.service.js:123](../../doan-kltn-backend/src/modules/auth/otp.service.js#L123) | `sendPhoneOtp logging` | CONFIRMED / cao |
| E14 | Mobile request body logging | [doan-kltn-mobile/src/services/api/apiClient.js:65](../../doan-kltn-mobile/src/services/api/apiClient.js#L65) | `request interceptor` | CONFIRMED / cao |
| E15 | Payout không idempotent và không provider proof | [doan-kltn-backend/src/modules/orders/orders.service.js:1071](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1071) | `processPayment` | CONFIRMED / cao; exploitation NOT VERIFIED |
| E16 | Wallet increment trong repeated upsert | [doan-kltn-backend/src/modules/orders/orders.service.js:1123](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1123) | `processPayment workerWallet.upsert` | CONFIRMED / cao |
| E17 | Payment route role nhưng thiếu owner trong service | [doan-kltn-backend/src/modules/orders/orders.controller.js:410](../../doan-kltn-backend/src/modules/orders/orders.controller.js#L410) | `payOrder` | CONFIRMED / cao |
| E18 | Socket join không actor authorization | [doan-kltn-backend/src/modules/orders/orders.gateway.js:120](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L120) | `handleJoinOrder` | CONFIRMED / cao |
| E19 | Socket GPS tin workerId client | [doan-kltn-backend/src/modules/orders/orders.gateway.js:181](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L181) | `handleWorkerUpdateLocation` | CONFIRMED / cao |
| E20 | Broadcast new order namespace-wide | [doan-kltn-backend/src/modules/orders/orders.gateway.js:387](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L387) | `broadcastNewOrderToWorkers` | CONFIRMED / cao |
| E21 | AdminGateway public root broadcast | [doan-kltn-backend/src/modules/admin/admin.gateway.js:54](../../doan-kltn-backend/src/modules/admin/admin.gateway.js#L54) | `emitUserCreated` | CONFIRMED / cao |
| E22 | Face false vẫn cấp timestamp | [doan-kltn-backend/src/modules/orders/orders.service.js:752](../../doan-kltn-backend/src/modules/orders/orders.service.js#L752) | `verifyFace` | CONFIRMED / cao |
| E23 | Face heuristic verified true khi không xác minh ảnh | [ai-service/main.py:1083](../../ai-service/main.py#L1083) | `face_verify` | CONFIRMED / cao |
| E24 | Credential fallback tồn tại; giá trị không đưa vào báo cáo | [doan-kltn-backend/src/config/cloudinary.config.js:5](../../doan-kltn-backend/src/config/cloudinary.config.js#L5) | `cloudinary.config` | CONFIRMED presence / cao; validity NOT VERIFIED |
| E25 | JWT fallback literal | [doan-kltn-backend/src/modules/auth/auth.module.js:22](../../doan-kltn-backend/src/modules/auth/auth.module.js#L22) | `JwtModule.register` | CONFIRMED presence / cao |
| E26 | Chủ đơn FK User, không CustomerProfile | [doan-kltn-backend/prisma/schema.prisma:218](../../doan-kltn-backend/prisma/schema.prisma#L218) | `Order.customer` | CONFIRMED / cao |
| E27 | Repository cũ include customer.user không có relation | [doan-kltn-backend/src/modules/orders/orders.repository.js:16](../../doan-kltn-backend/src/modules/orders/orders.repository.js#L16) | `findById` | CONFIRMED structural mismatch / cao |
| E28 | Active order query nhầm profile ID/status cũ | [doan-kltn-backend/src/modules/customer-home/customer-home.service.js:126](../../doan-kltn-backend/src/modules/customer-home/customer-home.service.js#L126) | `getActiveOrder` | CONFIRMED / cao |
| E29 | Active create trả flat id | [doan-kltn-backend/src/modules/orders/orders.service.js:323](../../doan-kltn-backend/src/modules/orders/orders.service.js#L323) | `createOrder return` | CONFIRMED / cao |
| E30 | Mobile mapper không đọc result.id | [doan-kltn-mobile/src/features/booking/services/bookingService.js:36](../../doan-kltn-mobile/src/features/booking/services/bookingService.js#L36) | `createBooking` | CONFIRMED / cao |
| E31 | Client socket root; server orders namespace khác | [doan-kltn-mobile/src/services/socket/socketService.js:56](../../doan-kltn-mobile/src/services/socket/socketService.js#L56) | `connect` | CONFIRMED / cao |
| E32 | Legacy booking listeners event names drift | [doan-kltn-mobile/src/features/booking/hooks/useBooking.js:121](../../doan-kltn-mobile/src/features/booking/hooks/useBooking.js#L121) | `listeners` | CONFIRMED / cao |
| E33 | Queue delayed jobs cùng backend lifecycle | [doan-kltn-backend/src/modules/orders/order-queue.service.js:52](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L52) | `onModuleInit` | CONFIRMED / cao |
| E34 | Queue calls missing broadcastToNearbyWorkers | [doan-kltn-backend/src/modules/orders/order-queue.service.js:153](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L153) | `processJob` | CONFIRMED / cao |
| E35 | PostGIS schema index nhưng matching dùng Haversine | [doan-kltn-backend/src/modules/orders/orders.service.js:561](../../doan-kltn-backend/src/modules/orders/orders.service.js#L561) | `matchNearbyWorkers` | CONFIRMED / cao |
| E36 | Pessimistic lock actual accept path | [doan-kltn-backend/src/modules/orders/orders.service.js:648](../../doan-kltn-backend/src/modules/orders/orders.service.js#L648) | `acceptOrder` | CONFIRMED / cao |
| E37 | Legacy conditional assign path | [doan-kltn-backend/src/modules/orders/order-workflow.service.js:35](../../doan-kltn-backend/src/modules/orders/order-workflow.service.js#L35) | `assignWorker` | CONFIRMED / cao; active caller NOT FOUND |
| E38 | State validation bypass ở active update | [doan-kltn-backend/src/modules/orders/orders.service.js:800](../../doan-kltn-backend/src/modules/orders/orders.service.js#L800) | `updateStatus` | CONFIRMED / cao |
| E39 | Read summary có create wallet | [doan-kltn-backend/src/modules/customer-home/customer-home.service.js:48](../../doan-kltn-backend/src/modules/customer-home/customer-home.service.js#L48) | `getSummary` | CONFIRMED / cao |
| E40 | AiService positional/response/schema drift | [doan-kltn-backend/src/modules/ai/ai.service.js:13](../../doan-kltn-backend/src/modules/ai/ai.service.js#L13) | `verifyFace / analyzeBeforeAfter / analyzeIncident` | CONFIRMED / cao |
| E41 | AI arbitrary URL/local image loader | [ai-service/main.py:78](../../ai-service/main.py#L78) | `decode_image_to_cv2` | CONFIRMED primitive / cao; exploit NOT VERIFIED |
| E42 | No internal key trên actual client call | [doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js:31](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js#L31) | `diagnoseIncident` | CONFIRMED / cao |
| E43 | Model lifespan và embedding reuse | [ai-service/clip_classifier.py:33](../../ai-service/clip_classifier.py#L33) | `load_clip` | CONFIRMED implementation / cao; loading NOT VERIFIED |
| E44 | Schema và migration drift | [doan-kltn-backend/prisma/migrations/20260827130333_init/migration.sql:11](../../doan-kltn-backend/prisma/migrations/20260827130333_init/migration.sql#L11) | `OrderStatus enum` | CONFIRMED / cao |
| E45 | Startup db push có mutation, không chạy | [dev-local.sh:36](../../dev-local.sh#L36) | `Prisma sync` | CONFIRMED / cao |
| E46 | Redis URL vs host config split | [doan-kltn-backend/src/modules/orders/order-queue.service.js:23](../../doan-kltn-backend/src/modules/orders/order-queue.service.js#L23) | `constructor` | CONFIRMED / cao |
| E47 | God-service risk nhiều trách nhiệm | [doan-kltn-backend/src/modules/admin/admin.service.js:1792](../../doan-kltn-backend/src/modules/admin/admin.service.js#L1792) | `getAnalyticsRevenue và nhiều nhóm use case` | INFERRED / cao |
| E48 | Client Observer cleanup + multi-alias refetch | [doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js:93](../../doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js#L93) | `realtime effect` | CONFIRMED / cao; load impact INFERRED |
| E49 | CI YAML ở .agents, không .github directory | [.agents/workflows/backend-ci.yml:1](../../.agents/workflows/backend-ci.yml#L1) | `Backend CI` | CONFIRMED location / cao; execution NOT VERIFIED |
| E50 | Unit spec dependency drift | [doan-kltn-backend/src/modules/orders/orders.service.spec.js:12](../../doan-kltn-backend/src/modules/orders/orders.service.spec.js#L12) | `providers` | CONFIRMED / cao; actual test result NOT VERIFIED |
| E51 | Race fixture cũ và bypass HTTP service | [doan-kltn-backend/test/concurrency-order-race.test.js:94](../../doan-kltn-backend/test/concurrency-order-race.test.js#L94) | `setupTestData / simulateWorkerAcceptDirect` | CONFIRMED / cao |
| E52 | Async handler gọi sync decode/inference | [ai-service/main.py:946](../../ai-service/main.py#L946) | `compare_before_after` | CONFIRMED / cao; throughput NOT VERIFIED |
| E53 | Public endpoint sync appendFile | [doan-kltn-backend/src/modules/logs/logs.service.js:53](../../doan-kltn-backend/src/modules/logs/logs.service.js#L53) | `writeClientLog` | CONFIRMED / cao |
| E54 | Worker acceptance eligibility không cùng availability | [doan-kltn-backend/src/modules/workers/workers.service.js:206](../../doan-kltn-backend/src/modules/workers/workers.service.js#L206) | `updateAvailability` | CONFIRMED / cao |
| E55 | Wallet cũ/mới khác read/write | [doan-kltn-backend/src/modules/workers/workers.service.js:41](../../doan-kltn-backend/src/modules/workers/workers.service.js#L41) | `getProfile wallet include` | CONFIRMED / cao |
| E56 | Payments module không active import, client chỉ mock | [doan-kltn-backend/src/infrastructure/external/payment/payment.client.js:11](../../doan-kltn-backend/src/infrastructure/external/payment/payment.client.js#L11) | `createPaymentUrl` | CONFIRMED / cao; module reachability checked |
| E57 | Order screens dùng Query, mount/provider chưa tìm thấy | [doan-kltn-mobile/src/screens/order/SearchingScreen.jsx:181](../../doan-kltn-mobile/src/screens/order/SearchingScreen.jsx#L181) | `useQuery` | CONFIRMED hook; NOT FOUND provider/caller |
| E58 | Address default nhiều writes chưa transaction | [doan-kltn-backend/src/modules/customers/customers.service.js:124](../../doan-kltn-backend/src/modules/customers/customers.service.js#L124) | `createAddress` | CONFIRMED / cao; race NOT VERIFIED |
| E59 | Dashboard legacy status filter và growth literal | [doan-kltn-backend/src/modules/admin/admin.service.js:2377](../../doan-kltn-backend/src/modules/admin/admin.service.js#L2377) | `getDashboardOverviewV1` | CONFIRMED / cao |
| E60 | Web upload API contract mismatch | [doan-kttn-frontend/src/features/customer/services/orderApi.js:14](../../doan-kttn-frontend/src/features/customer/services/orderApi.js#L14) | `diagnoseImage` | CONFIRMED / cao; HTTP outcome NOT VERIFIED |

## Coverage theo module

Mức A: đọc sâu control/data flow và đối chiếu caller/schema. Mức B: inspect cấu trúc, symbols/imports và selected methods/config. Mức C: inventory/metadata, không manual review toàn nội dung.

| Phạm vi | Mức | Nội dung và giới hạn |
|---|---|---|
| Backend main/app/common/infrastructure | A | bootstrap, DI, pipe, JWT/roles, Prisma/Redis/AI; config sensitive không trích giá trị |
| Auth/users | A | password/social login, DTO wiring, repository, OTP/reset checks; provider delivery thực tế NOT VERIFIED |
| Orders | A | controller/service/repository/workflow/queue/gateway/state/DTO/test; không gọi API hoặc chạy test |
| Customers/workers | A | profile/address/availability/services/nearby, data ownership và transaction boundaries |
| Customer-home/services | A | summary/active-order/catalog queries và actual model contract |
| Admin | A/B | deep review contracts, dashboard/analytics, selected user/catalog/order writes; không audit mọi nhánh 2.558 dòng service |
| AI backend module/payments/logs/health | A | reachability, contract drift, mock payments, synchronous logs/liveness |
| Backend placeholder modules/login docs | C | configurations/images/locations/matching/realtime/reviews/wallets .gitkeep; login Markdown không runtime |
| Prisma schema/migrations | A | models/relations/enums/indexes, migration drift; actual DB NOT VERIFIED |
| Prisma seed/import/generate/clear scripts | B/C | file-purpose inventory; không chạy và không dump seed rows |
| Web auth/app/router/transport/storage | A | active route/protected wrapper/context/login/API behavior |
| Web dashboard/customer orders | A/B | request/response mapping, events, selected hooks/views, mock switch; không browser test |
| Web users/workers/services/settings/analytics | B | feature/call graph, hook/service boundaries, route reachability; không audit mọi UI/style branch |
| Web shared components/types/utils/store | B/C | structural review/symbol index; no exhaustive UI correctness or accessibility audit |
| Mobile bootstrap/auth/booking/transport/storage | A | route reachability, caller/contract/ID/namespace/state owners |
| Mobile home/services/face-verification/maps | B | selected hooks/AI/API/location lifecycles và platform wrappers; no device/render test |
| Mobile order screens | A/B | trace API/store calls và query hooks; mount/provider chưa tìm thấy |
| Mobile chat/image-analysis/location/orders/payment feature shells | C | barrel/placeholder inventory, implementation có thể ở services/screens khác |
| Mobile tests | B | inventory 5 auth/profile suites; chưa thực thi hoặc xác minh runtime compatibility |
| AI main/CLIP/category/catalog | A | handlers/lifespan/models/fallback/decode algorithms, request-response contracts |
| AI training/eval/download scripts | B | symbols/workflow, offline tooling; không chạy/download/train/evaluate |
| AI notebook/dataset/runs/weights | C | inventory nhóm artifact, không đọc dataset content/notebook outputs/binary model |
| Root scripts/Compose/CI/docs | A/B | script/config hiện trạng; docs cũ chỉ bối cảnh và được cross-check source |
| .agents skills/rules/context | B/C | inventory; architecture rule chỉ ý định, không dùng thay source evidence |

## Phương pháp và giới hạn

- `rg --files --hidden` và filesystem inventory, loại dependencies/generated/.git khỏi source analysis; không gọi network/web vì nhiệm vụ chỉ dựa repo.
- Đọc main/schema/manifest/config và trace bottom-up caller, static scan các JS/TS/Python source để index symbols/imports. Regex resolution cho relative JS imports không phát hiện missing target trong 4 source roots JS; đây **không phải** bundler/type/export validation.
- Negative searches: formal CQRS/event sourcing/ports, global filter/interceptor registration, publisher Redis order channels, missing gateway method, QueryClientProvider và order-screen callers, CI directory. NOT FOUND chỉ áp dụng code/config inventory hiện tại.
- Không đọc `.env*`, credential files, `google-services.json`, private keys, actual logs; không đọc binary images/weights hoặc dump dataset/user information. Không tái hiện credential literals gặp trong source config. Source line references giúp owner kiểm tra tại chỗ.
- Không cài dependency, build, start, lint --fix, seed, migrations, db push, e2e/race tests hoặc API calls. Bootstrap/e2e có thể ghi Redis/file nên không chạy chỉ để xác minh.
- Chỉ output Markdown ở thư mục báo cáo. Git status ban đầu sạch; cuối phiên có thay đổi source đồng thời ngoài thao tác tạo tài liệu, đã đọc lại diff và cập nhật references liên quan. Line/symbol anchors là snapshot và có thể thay đổi sau refactor.
- Automated inventory đọc source để lấy symbol/count; mức C không đồng nghĩa manual semantic review. Các giới hạn depth trên là phần chưa kiểm toán, không bỏ qua im lặng.

## Inventory source files

465 file thuộc runtime/test/tool Python source roots đã scan sau khi cập nhật thay đổi đồng thời. Mỗi dòng ghi số dòng vật lý và một số symbol đầu tiên (tối đa 5); không chép content hoặc literal values. Với component export anonymous/barrel, symbol trống không có nghĩa file không dùng. DTO/decorators/function biểu thức có thể chưa được regex nhận diện đầy đủ.


### doan-kltn-backend/src

| File | Dòng | Symbols (scan metadata) |
|---|---:|---|
| [doan-kltn-backend/src/app.module.js](../../doan-kltn-backend/src/app.module.js) | 35 | AppModule:35 |
| [doan-kltn-backend/src/common/constants/roles.constant.js](../../doan-kltn-backend/src/common/constants/roles.constant.js) | 5 | ROLES:1 |
| [doan-kltn-backend/src/common/decorators/roles.decorator.js](../../doan-kltn-backend/src/common/decorators/roles.decorator.js) | 4 | ROLES_KEY:3, Roles:4 |
| [doan-kltn-backend/src/common/filters/http-exception.filter.js](../../doan-kltn-backend/src/common/filters/http-exception.filter.js) | 34 | AllExceptionsFilter:10 |
| [doan-kltn-backend/src/common/guards/roles.guard.js](../../doan-kltn-backend/src/common/guards/roles.guard.js) | 23 | RolesGuard:7, canActivate:12 |
| [doan-kltn-backend/src/common/interceptors/transform.interceptor.js](../../doan-kltn-backend/src/common/interceptors/transform.interceptor.js) | 14 | TransformInterceptor:5, intercept:6 |
| [doan-kltn-backend/src/config/app.config.js](../../doan-kltn-backend/src/config/app.config.js) | 8 | barrel / declarations / anonymous component |
| [doan-kltn-backend/src/config/cloudinary.config.js](../../doan-kltn-backend/src/config/cloudinary.config.js) | 38 | avatarStorage:11, workerFaceStorage:20, incidentStorage:29 |
| [doan-kltn-backend/src/config/database.config.js](../../doan-kltn-backend/src/config/database.config.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-backend/src/config/firebase.config.js](../../doan-kltn-backend/src/config/firebase.config.js) | 81 | getFirebaseAdmin:8, getFirebaseAuth:76 |
| [doan-kltn-backend/src/config/jwt.config.js](../../doan-kltn-backend/src/config/jwt.config.js) | 8 | barrel / declarations / anonymous component |
| [doan-kltn-backend/src/config/redis.config.js](../../doan-kltn-backend/src/config/redis.config.js) | 26 | barrel / declarations / anonymous component |
| [doan-kltn-backend/src/config/storage.config.js](../../doan-kltn-backend/src/config/storage.config.js) | 11 | barrel / declarations / anonymous component |
| [doan-kltn-backend/src/health/health.controller.js](../../doan-kltn-backend/src/health/health.controller.js) | 11 | HealthController:4, check:6 |
| [doan-kltn-backend/src/health/health.module.js](../../doan-kltn-backend/src/health/health.module.js) | 7 | HealthModule:7 |
| [doan-kltn-backend/src/infrastructure/database/prisma.module.js](../../doan-kltn-backend/src/infrastructure/database/prisma.module.js) | 9 | PrismaModule:9 |
| [doan-kltn-backend/src/infrastructure/database/prisma.service.js](../../doan-kltn-backend/src/infrastructure/database/prisma.service.js) | 13 | PrismaService:5, onModuleInit:6, onModuleDestroy:10 |
| [doan-kltn-backend/src/infrastructure/external/ai/aiFallbackHelper.js](../../doan-kltn-backend/src/infrastructure/external/ai/aiFallbackHelper.js) | 78 | getFallbackDiagnosis:4, getFallbackCompare:61, getFallbackFaceVerify:70 |
| [doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js) | 92 | FastApiAiClient:7, diagnoseIncident:29, compareBeforeAfter:56, verifyFace:70, analyzeIncident:85 |
| [doan-kltn-backend/src/infrastructure/external/payment/payment.client.js](../../doan-kltn-backend/src/infrastructure/external/payment/payment.client.js) | 30 | PaymentClient:6, createPaymentUrl:11, verifyPaymentWebhook:21 |
| [doan-kltn-backend/src/infrastructure/redis/redis.module.js](../../doan-kltn-backend/src/infrastructure/redis/redis.module.js) | 9 | RedisModule:9 |
| [doan-kltn-backend/src/infrastructure/redis/redis.service.js](../../doan-kltn-backend/src/infrastructure/redis/redis.service.js) | 39 | RedisService:5, onModuleInit:14, onModuleDestroy:29, getClient:36 |
| [doan-kltn-backend/src/main.js](../../doan-kltn-backend/src/main.js) | 57 | bootstrap:8 |
| [doan-kltn-backend/src/modules/admin/admin-categories-v1.controller.js](../../doan-kltn-backend/src/modules/admin/admin-categories-v1.controller.js) | 131 | AdminCategoriesV1Controller:43, getCategories:75, createCategory:86, updateCategory:98, toggleCategoryStatus:110 |
| [doan-kltn-backend/src/modules/admin/admin-services-v1.controller.js](../../doan-kltn-backend/src/modules/admin/admin-services-v1.controller.js) | 154 | AdminServicesV1Controller:41, getServices:71, getCategories:84, createService:95, putService:107 |
| [doan-kltn-backend/src/modules/admin/admin.controller.js](../../doan-kltn-backend/src/modules/admin/admin.controller.js) | 440 | AdminController:36, getUsers:60, getUserById:68, createUser:77, updateUser:85 |
| [doan-kltn-backend/src/modules/admin/admin.gateway.js](../../doan-kltn-backend/src/modules/admin/admin.gateway.js) | 150 | AdminGateway:20, afterInit:28, handleConnection:32, handleDisconnect:36, handleJoinAdmin:45 |
| [doan-kltn-backend/src/modules/admin/admin.module.js](../../doan-kltn-backend/src/modules/admin/admin.module.js) | 21 | AdminModule:21 |
| [doan-kltn-backend/src/modules/admin/admin.service.js](../../doan-kltn-backend/src/modules/admin/admin.service.js) | 2558 | AdminService:14, _formatUserResponse:23, getUsers:52, getUserById:111, createUser:127 |
| [doan-kltn-backend/src/modules/admin/dashboard-v1.controller.js](../../doan-kltn-backend/src/modules/admin/dashboard-v1.controller.js) | 97 | DashboardV1Controller:31, getOverview:54, getActivities:71, getServiceDistribution:94 |
| [doan-kltn-backend/src/modules/admin/dto/admin-create-user.dto.js](../../doan-kltn-backend/src/modules/admin/dto/admin-create-user.dto.js) | 54 | AdminCreateUserDto:10 |
| [doan-kltn-backend/src/modules/admin/dto/admin-get-users.dto.js](../../doan-kltn-backend/src/modules/admin/dto/admin-get-users.dto.js) | 21 | AdminGetUsersDto:3 |
| [doan-kltn-backend/src/modules/admin/dto/admin-update-user.dto.js](../../doan-kltn-backend/src/modules/admin/dto/admin-update-user.dto.js) | 59 | AdminUpdateUserDto:9 |
| [doan-kltn-backend/src/modules/admin/dto/create-service-category.dto.js](../../doan-kltn-backend/src/modules/admin/dto/create-service-category.dto.js) | 27 | CreateServiceCategoryDto:3 |
| [doan-kltn-backend/src/modules/admin/dto/create-service.dto.js](../../doan-kltn-backend/src/modules/admin/dto/create-service.dto.js) | 40 | CreateServiceDto:10 |
| [doan-kltn-backend/src/modules/admin/dto/update-service-category.dto.js](../../doan-kltn-backend/src/modules/admin/dto/update-service-category.dto.js) | 27 | UpdateServiceCategoryDto:3 |
| [doan-kltn-backend/src/modules/admin/dto/update-service.dto.js](../../doan-kltn-backend/src/modules/admin/dto/update-service.dto.js) | 39 | UpdateServiceDto:9 |
| [doan-kltn-backend/src/modules/ai/ai.controller.js](../../doan-kltn-backend/src/modules/ai/ai.controller.js) | 59 | AiController:22, verifyFace:30, analyzeBeforeAfter:41, analyzeIncident:52 |
| [doan-kltn-backend/src/modules/ai/ai.module.js](../../doan-kltn-backend/src/modules/ai/ai.module.js) | 11 | AiModule:11 |
| [doan-kltn-backend/src/modules/ai/ai.service.js](../../doan-kltn-backend/src/modules/ai/ai.service.js) | 65 | AiService:7, verifyFace:13, analyzeBeforeAfter:29, analyzeIncident:48 |
| [doan-kltn-backend/src/modules/ai/dto/analyze-before-after.dto.js](../../doan-kltn-backend/src/modules/ai/dto/analyze-before-after.dto.js) | 11 | AnalyzeBeforeAfterDto:3 |
| [doan-kltn-backend/src/modules/ai/dto/analyze-incident.dto.js](../../doan-kltn-backend/src/modules/ai/dto/analyze-incident.dto.js) | 11 | AnalyzeIncidentDto:3 |
| [doan-kltn-backend/src/modules/ai/dto/verify-face.dto.js](../../doan-kltn-backend/src/modules/ai/dto/verify-face.dto.js) | 11 | VerifyFaceDto:3 |
| [doan-kltn-backend/src/modules/auth/auth.controller.js](../../doan-kltn-backend/src/modules/auth/auth.controller.js) | 126 | AuthController:13, register:32, registerCustomer:42, registerWorker:52, login:70 |
| [doan-kltn-backend/src/modules/auth/auth.module.js](../../doan-kltn-backend/src/modules/auth/auth.module.js) | 48 | AuthModule:48 |
| [doan-kltn-backend/src/modules/auth/auth.service.js](../../doan-kltn-backend/src/modules/auth/auth.service.js) | 454 | AuthService:18, register:27, registerCustomer:35, registerWorker:84, login:153 |
| [doan-kltn-backend/src/modules/auth/decorators/current-user.decorator.js](../../doan-kltn-backend/src/modules/auth/decorators/current-user.decorator.js) | 7 | CurrentUser:3 |
| [doan-kltn-backend/src/modules/auth/decorators/roles.decorator.js](../../doan-kltn-backend/src/modules/auth/decorators/roles.decorator.js) | 4 | ROLES_KEY:3, Roles:4 |
| [doan-kltn-backend/src/modules/auth/dto/firebase-login.dto.js](../../doan-kltn-backend/src/modules/auth/dto/firebase-login.dto.js) | 13 | FirebaseLoginDto:4 |
| [doan-kltn-backend/src/modules/auth/dto/google-login.dto.js](../../doan-kltn-backend/src/modules/auth/dto/google-login.dto.js) | 14 | GoogleLoginDto:4 |
| [doan-kltn-backend/src/modules/auth/dto/login.dto.js](../../doan-kltn-backend/src/modules/auth/dto/login.dto.js) | 22 | LoginDto:4 |
| [doan-kltn-backend/src/modules/auth/dto/register.dto.js](../../doan-kltn-backend/src/modules/auth/dto/register.dto.js) | 104 | RegisterDto:12 |
| [doan-kltn-backend/src/modules/auth/dto/send-otp.dto.js](../../doan-kltn-backend/src/modules/auth/dto/send-otp.dto.js) | 106 | SendPhoneOtpDto:10, VerifyPhoneOtpDto:24, SendEmailOtpDto:46, VerifyEmailOtpDto:57, ResetPasswordDto:78 |
| [doan-kltn-backend/src/modules/auth/email.service.js](../../doan-kltn-backend/src/modules/auth/email.service.js) | 111 | EmailService:5, sendOtpEmail:43 |
| [doan-kltn-backend/src/modules/auth/esms.service.js](../../doan-kltn-backend/src/modules/auth/esms.service.js) | 169 | EsmsService:9, normalizePhone:29, sendOtpSms:53 |
| [doan-kltn-backend/src/modules/auth/guards/jwt-auth.guard.js](../../doan-kltn-backend/src/modules/auth/guards/jwt-auth.guard.js) | 5 | JwtAuthGuard:5 |
| [doan-kltn-backend/src/modules/auth/guards/optional-jwt-auth.guard.js](../../doan-kltn-backend/src/modules/auth/guards/optional-jwt-auth.guard.js) | 15 | OptionalJwtAuthGuard:10, handleRequest:11 |
| [doan-kltn-backend/src/modules/auth/guards/roles.guard.js](../../doan-kltn-backend/src/modules/auth/guards/roles.guard.js) | 29 | RolesGuard:7, canActivate:12 |
| [doan-kltn-backend/src/modules/auth/otp.controller.js](../../doan-kltn-backend/src/modules/auth/otp.controller.js) | 104 | OtpController:28, sendPhoneOtp:46, verifyPhoneOtp:66, sendEmailOtp:88, verifyEmailOtp:101 |
| [doan-kltn-backend/src/modules/auth/otp.service.js](../../doan-kltn-backend/src/modules/auth/otp.service.js) | 389 | OtpService:34, generateOtp:53, generateResetToken:60, sendPhoneOtp:71, verifyPhoneOtp:147 |
| [doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js](../../doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js) | 22 | JwtStrategy:6, validate:15 |
| [doan-kltn-backend/src/modules/customer-home/customer-home.controller.js](../../doan-kltn-backend/src/modules/customer-home/customer-home.controller.js) | 80 | CustomerHomeController:31, getSummary:62, getActiveOrder:76 |
| [doan-kltn-backend/src/modules/customer-home/customer-home.module.js](../../doan-kltn-backend/src/modules/customer-home/customer-home.module.js) | 17 | CustomerHomeModule:17 |
| [doan-kltn-backend/src/modules/customer-home/customer-home.service.js](../../doan-kltn-backend/src/modules/customer-home/customer-home.service.js) | 258 | CustomerHomeService:10, getSummary:24, getActiveOrder:110 |
| [doan-kltn-backend/src/modules/customer-home/customer-orders.controller.js](../../doan-kltn-backend/src/modules/customer-home/customer-orders.controller.js) | 60 | CustomerOrdersController:28, getActiveOrder:56 |
| [doan-kltn-backend/src/modules/customer-home/dto/customer-home-summary.dto.js](../../doan-kltn-backend/src/modules/customer-home/dto/customer-home-summary.dto.js) | 31 | CustomerHomeSummaryDto:7 |
| [doan-kltn-backend/src/modules/customers/customers.controller.js](../../doan-kltn-backend/src/modules/customers/customers.controller.js) | 72 | CustomersController:26, getProfile:34, updateProfile:41, getAddresses:48, createAddress:55 |
| [doan-kltn-backend/src/modules/customers/customers.module.js](../../doan-kltn-backend/src/modules/customers/customers.module.js) | 12 | CustomersModule:12 |
| [doan-kltn-backend/src/modules/customers/customers.service.js](../../doan-kltn-backend/src/modules/customers/customers.service.js) | 265 | CustomersService:11, getProfile:16, updateProfile:40, getAddresses:73, createAddress:88 |
| [doan-kltn-backend/src/modules/customers/dto/create-address.dto.js](../../doan-kltn-backend/src/modules/customers/dto/create-address.dto.js) | 41 | CreateAddressDto:9 |
| [doan-kltn-backend/src/modules/customers/dto/update-address.dto.js](../../doan-kltn-backend/src/modules/customers/dto/update-address.dto.js) | 35 | UpdateAddressDto:3 |
| [doan-kltn-backend/src/modules/customers/dto/update-customer-profile.dto.js](../../doan-kltn-backend/src/modules/customers/dto/update-customer-profile.dto.js) | 11 | UpdateCustomerProfileDto:3 |
| [doan-kltn-backend/src/modules/logs/logs.controller.js](../../doan-kltn-backend/src/modules/logs/logs.controller.js) | 31 | LogsController:16, logClientError:28 |
| [doan-kltn-backend/src/modules/logs/logs.module.js](../../doan-kltn-backend/src/modules/logs/logs.module.js) | 10 | LogsModule:10 |
| [doan-kltn-backend/src/modules/logs/logs.service.js](../../doan-kltn-backend/src/modules/logs/logs.service.js) | 63 | LogsService:6, writeClientLog:34 |
| [doan-kltn-backend/src/modules/orders/constants/order-status.js](../../doan-kltn-backend/src/modules/orders/constants/order-status.js) | 42 | ORDER_STATUS:1, VALID_STATUS_TRANSITIONS:14 |
| [doan-kltn-backend/src/modules/orders/dto/adjust-price.dto.js](../../doan-kltn-backend/src/modules/orders/dto/adjust-price.dto.js) | 63 | AdjustPriceDto:11 |
| [doan-kltn-backend/src/modules/orders/dto/cancel-order.dto.js](../../doan-kltn-backend/src/modules/orders/dto/cancel-order.dto.js) | 22 | CancelOrderDto:4 |
| [doan-kltn-backend/src/modules/orders/dto/create-order.dto.js](../../doan-kltn-backend/src/modules/orders/dto/create-order.dto.js) | 122 | CreateOrderDto:12 |
| [doan-kltn-backend/src/modules/orders/dto/diagnose-order.dto.js](../../doan-kltn-backend/src/modules/orders/dto/diagnose-order.dto.js) | 22 | DiagnoseOrderDto:4 |
| [doan-kltn-backend/src/modules/orders/dto/dispute-order.dto.js](../../doan-kltn-backend/src/modules/orders/dto/dispute-order.dto.js) | 22 | DisputeOrderDto:4 |
| [doan-kltn-backend/src/modules/orders/dto/face-verify.dto.js](../../doan-kltn-backend/src/modules/orders/dto/face-verify.dto.js) | 14 | FaceVerifyDto:4 |
| [doan-kltn-backend/src/modules/orders/dto/review-order.dto.js](../../doan-kltn-backend/src/modules/orders/dto/review-order.dto.js) | 34 | ReviewOrderDto:11 |
| [doan-kltn-backend/src/modules/orders/dto/update-order-status.dto.js](../../doan-kltn-backend/src/modules/orders/dto/update-order-status.dto.js) | 37 | UpdateOrderStatusDto:4 |
| [doan-kltn-backend/src/modules/orders/dto/upload-order-image.dto.js](../../doan-kltn-backend/src/modules/orders/dto/upload-order-image.dto.js) | 26 | UploadOrderImageDto:4 |
| [doan-kltn-backend/src/modules/orders/order-queue.service.js](../../doan-kltn-backend/src/modules/orders/order-queue.service.js) | 194 | OrderQueueService:18, setGateway:48, onModuleInit:52, onModuleDestroy:79, processJob:121 |
| [doan-kltn-backend/src/modules/orders/order-workflow.service.js](../../doan-kltn-backend/src/modules/orders/order-workflow.service.js) | 322 | OrderWorkflowService:16, getOrderOrThrow:22, assignWorker:35, markWorkerArriving:114, markArrived:141 |
| [doan-kltn-backend/src/modules/orders/orders.controller.js](../../doan-kltn-backend/src/modules/orders/orders.controller.js) | 550 | OrdersController:47, diagnose:67, diagnoseUpload:80, createOrder:112, getMyOrders:134 |
| [doan-kltn-backend/src/modules/orders/orders.gateway.js](../../doan-kltn-backend/src/modules/orders/orders.gateway.js) | 428 | OrderGateway:34, afterInit:48, handleConnection:90, handleDisconnect:95, handleJoinOrder:120 |
| [doan-kltn-backend/src/modules/orders/orders.module.js](../../doan-kltn-backend/src/modules/orders/orders.module.js) | 33 | OrdersModule:33 |
| [doan-kltn-backend/src/modules/orders/orders.repository.js](../../doan-kltn-backend/src/modules/orders/orders.repository.js) | 324 | OrdersRepository:7, findById:12, findByCustomerId:58, findByWorkerId:80, findAll:102 |
| [doan-kltn-backend/src/modules/orders/orders.service.js](../../doan-kltn-backend/src/modules/orders/orders.service.js) | 1500 | OrdersService:41, diagnose:74, createOrder:194, getOrderById:333, getMyOrders:393 |
| [doan-kltn-backend/src/modules/orders/orders.service.spec.js](../../doan-kltn-backend/src/modules/orders/orders.service.spec.js) | 64 | barrel / declarations / anonymous component |
| [doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js](../../doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js) | 16 | OrderTransitionValidator:4 |
| [doan-kltn-backend/src/modules/payments/dto/create-payment.dto.js](../../doan-kltn-backend/src/modules/payments/dto/create-payment.dto.js) | 14 | CreatePaymentDto:3 |
| [doan-kltn-backend/src/modules/payments/payments.controller.js](../../doan-kltn-backend/src/modules/payments/payments.controller.js) | 48 | PaymentsController:18, createPaymentUrl:27, mockPaymentSuccess:33, getPaymentByOrderId:45 |
| [doan-kltn-backend/src/modules/payments/payments.module.js](../../doan-kltn-backend/src/modules/payments/payments.module.js) | 14 | PaymentsModule:14 |
| [doan-kltn-backend/src/modules/payments/payments.repository.js](../../doan-kltn-backend/src/modules/payments/payments.repository.js) | 63 | PaymentsRepository:6, findByOrderId:11, createPaymentWithSplit:18 |
| [doan-kltn-backend/src/modules/payments/payments.service.js](../../doan-kltn-backend/src/modules/payments/payments.service.js) | 73 | PaymentsService:19, createPaymentUrl:32, processPaymentSuccess:46, getPaymentByOrderId:70 |
| [doan-kltn-backend/src/modules/services/services.controller.js](../../doan-kltn-backend/src/modules/services/services.controller.js) | 61 | ServicesController:16, getCategories:24, getCategoryTree:31, getTargets:40, getServices:50 |
| [doan-kltn-backend/src/modules/services/services.module.js](../../doan-kltn-backend/src/modules/services/services.module.js) | 12 | ServicesModule:12 |
| [doan-kltn-backend/src/modules/services/services.service.js](../../doan-kltn-backend/src/modules/services/services.service.js) | 88 | ServicesService:6, getCategories:11, getCategoryTree:23, getTargets:42, getServices:56 |
| [doan-kltn-backend/src/modules/users/dto/update-user.dto.js](../../doan-kltn-backend/src/modules/users/dto/update-user.dto.js) | 11 | UpdateUserDto:3 |
| [doan-kltn-backend/src/modules/users/users.controller.js](../../doan-kltn-backend/src/modules/users/users.controller.js) | 111 | UsersController:29, getProfile:37, updateProfile:49, uploadAvatar:60, updatePhone:97 |
| [doan-kltn-backend/src/modules/users/users.module.js](../../doan-kltn-backend/src/modules/users/users.module.js) | 13 | UsersModule:13 |
| [doan-kltn-backend/src/modules/users/users.repository.js](../../doan-kltn-backend/src/modules/users/users.repository.js) | 173 | UsersRepository:6, findById:11, findByEmail:21, findByPhone:31, findByEmailOrPhone:42 |
| [doan-kltn-backend/src/modules/users/users.service.js](../../doan-kltn-backend/src/modules/users/users.service.js) | 73 | UsersService:6, findById:11, findByEmail:15, findByPhone:19, findByEmailOrPhone:23 |
| [doan-kltn-backend/src/modules/workers/dto/update-availability.dto.js](../../doan-kltn-backend/src/modules/workers/dto/update-availability.dto.js) | 7 | UpdateAvailabilityDto:3 |
| [doan-kltn-backend/src/modules/workers/dto/update-worker-profile.dto.js](../../doan-kltn-backend/src/modules/workers/dto/update-worker-profile.dto.js) | 37 | UpdateWorkerProfileDto:3 |
| [doan-kltn-backend/src/modules/workers/dto/update-worker-services.dto.js](../../doan-kltn-backend/src/modules/workers/dto/update-worker-services.dto.js) | 8 | UpdateWorkerServicesDto:3 |
| [doan-kltn-backend/src/modules/workers/workers.controller.js](../../doan-kltn-backend/src/modules/workers/workers.controller.js) | 104 | WorkersController:30, getNearbyWorkers:45, getProfile:54, updateProfile:66, updateServices:78 |
| [doan-kltn-backend/src/modules/workers/workers.module.js](../../doan-kltn-backend/src/modules/workers/workers.module.js) | 13 | WorkersModule:13 |
| [doan-kltn-backend/src/modules/workers/workers.service.js](../../doan-kltn-backend/src/modules/workers/workers.service.js) | 349 | WorkersService:12, getProfile:18, updateProfile:52, updateServices:97, submitApproval:142 |

### doan-kttn-frontend/src

| File | Dòng | Symbols (scan metadata) |
|---|---:|---|
| [doan-kttn-frontend/src/App.jsx](../../doan-kttn-frontend/src/App.jsx) | 11 | App:5 |
| [doan-kttn-frontend/src/app/providers/AppProvider.jsx](../../doan-kttn-frontend/src/app/providers/AppProvider.jsx) | 13 | AppProvider:5 |
| [doan-kttn-frontend/src/app/router/ProtectedRoute.jsx](../../doan-kttn-frontend/src/app/router/ProtectedRoute.jsx) | 33 | ProtectedRoute:6 |
| [doan-kttn-frontend/src/app/router/index.jsx](../../doan-kttn-frontend/src/app/router/index.jsx) | 11 | AppRouter:5 |
| [doan-kttn-frontend/src/app/store/index.js](../../doan-kttn-frontend/src/app/store/index.js) | 1 | store:1 |
| [doan-kttn-frontend/src/components/feedback/EmptyState.jsx](../../doan-kttn-frontend/src/components/feedback/EmptyState.jsx) | 3 | EmptyState:1 |
| [doan-kttn-frontend/src/components/feedback/ErrorState.jsx](../../doan-kttn-frontend/src/components/feedback/ErrorState.jsx) | 3 | ErrorState:1 |
| [doan-kttn-frontend/src/components/feedback/Loading.jsx](../../doan-kttn-frontend/src/components/feedback/Loading.jsx) | 3 | Loading:1 |
| [doan-kttn-frontend/src/components/layout/Breadcrumb.jsx](../../doan-kttn-frontend/src/components/layout/Breadcrumb.jsx) | 7 | Breadcrumb:1 |
| [doan-kttn-frontend/src/components/layout/Header.jsx](../../doan-kttn-frontend/src/components/layout/Header.jsx) | 7 | Header:1 |
| [doan-kttn-frontend/src/components/layout/Sidebar.jsx](../../doan-kttn-frontend/src/components/layout/Sidebar.jsx) | 170 | Sidebar:19 |
| [doan-kttn-frontend/src/components/table/DataTable.jsx](../../doan-kttn-frontend/src/components/table/DataTable.jsx) | 3 | DataTable:1 |
| [doan-kttn-frontend/src/components/table/TableEmpty.jsx](../../doan-kttn-frontend/src/components/table/TableEmpty.jsx) | 3 | TableEmpty:1 |
| [doan-kttn-frontend/src/components/ui/Badge.jsx](../../doan-kttn-frontend/src/components/ui/Badge.jsx) | 3 | Badge:1 |
| [doan-kttn-frontend/src/components/ui/Button.jsx](../../doan-kttn-frontend/src/components/ui/Button.jsx) | 3 | Button:1 |
| [doan-kttn-frontend/src/components/ui/Dropdown.jsx](../../doan-kttn-frontend/src/components/ui/Dropdown.jsx) | 3 | Dropdown:1 |
| [doan-kttn-frontend/src/components/ui/Input.jsx](../../doan-kttn-frontend/src/components/ui/Input.jsx) | 3 | Input:1 |
| [doan-kttn-frontend/src/components/ui/Modal.jsx](../../doan-kttn-frontend/src/components/ui/Modal.jsx) | 3 | Modal:1 |
| [doan-kttn-frontend/src/components/ui/Pagination.jsx](../../doan-kttn-frontend/src/components/ui/Pagination.jsx) | 3 | Pagination:1 |
| [doan-kttn-frontend/src/components/ui/Skeleton.jsx](../../doan-kttn-frontend/src/components/ui/Skeleton.jsx) | 19 | Tailwind:9, Skeleton:11 |
| [doan-kttn-frontend/src/components/ui/SpotlightCard.jsx](../../doan-kttn-frontend/src/components/ui/SpotlightCard.jsx) | 37 | SpotlightCard:8 |
| [doan-kttn-frontend/src/config/env.js](../../doan-kttn-frontend/src/config/env.js) | 3 | env:1 |
| [doan-kttn-frontend/src/constants/orderStatus.js](../../doan-kttn-frontend/src/constants/orderStatus.js) | 1 | ORDER_STATUS:1 |
| [doan-kttn-frontend/src/constants/roles.js](../../doan-kttn-frontend/src/constants/roles.js) | 1 | ROLES:1 |
| [doan-kttn-frontend/src/constants/workerStatus.js](../../doan-kttn-frontend/src/constants/workerStatus.js) | 1 | WORKER_STATUS:1 |
| [doan-kttn-frontend/src/features/admin/pages/AdminPage.jsx](../../doan-kttn-frontend/src/features/admin/pages/AdminPage.jsx) | 5 | AdminPage:3 |
| [doan-kttn-frontend/src/features/analytics/components/CategoryDistributionCard.jsx](../../doan-kttn-frontend/src/features/analytics/components/CategoryDistributionCard.jsx) | 88 | CategoryDistributionCard:4 |
| [doan-kttn-frontend/src/features/analytics/components/RevenueChart.jsx](../../doan-kttn-frontend/src/features/analytics/components/RevenueChart.jsx) | 251 | RevenueChart:4 |
| [doan-kttn-frontend/src/features/analytics/components/TopWorkersCard.jsx](../../doan-kttn-frontend/src/features/analytics/components/TopWorkersCard.jsx) | 111 | TopWorkersCard:4 |
| [doan-kttn-frontend/src/features/analytics/pages/AnalyticsPage.jsx](../../doan-kttn-frontend/src/features/analytics/pages/AnalyticsPage.jsx) | 367 | AnalyticsPage:34 |
| [doan-kttn-frontend/src/features/analytics/services/analytics.service.js](../../doan-kttn-frontend/src/features/analytics/services/analytics.service.js) | 107 | analyticsService:3, getOverview:8, getRevenue:34, getServicesDistribution:54, getTopWorkers:67 |
| [doan-kttn-frontend/src/features/auth/components/BrandingPanel.jsx](../../doan-kttn-frontend/src/features/auth/components/BrandingPanel.jsx) | 111 | BrandingPanel:11 |
| [doan-kttn-frontend/src/features/auth/components/LoginForm.jsx](../../doan-kttn-frontend/src/features/auth/components/LoginForm.jsx) | 207 | LoginForm:11 |
| [doan-kttn-frontend/src/features/auth/hooks/useAuth.js](../../doan-kttn-frontend/src/features/auth/hooks/useAuth.js) | 4 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/features/auth/index.js](../../doan-kttn-frontend/src/features/auth/index.js) | 4 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/features/auth/pages/LoginPage.jsx](../../doan-kttn-frontend/src/features/auth/pages/LoginPage.jsx) | 178 | LoginPage:16 |
| [doan-kttn-frontend/src/features/auth/pages/RegisterPage.jsx](../../doan-kttn-frontend/src/features/auth/pages/RegisterPage.jsx) | 516 | RegisterPage:23 |
| [doan-kttn-frontend/src/features/auth/services/auth.service.js](../../doan-kttn-frontend/src/features/auth/services/auth.service.js) | 95 | authService:4 |
| [doan-kttn-frontend/src/features/customer/components/ActiveOrderWidget.tsx](../../doan-kttn-frontend/src/features/customer/components/ActiveOrderWidget.tsx) | 353 | formatCurrencyVND:23, getActiveStage:40, ActiveOrderWidget:74 |
| [doan-kttn-frontend/src/features/customer/components/ActiveOrdersList.jsx](../../doan-kttn-frontend/src/features/customer/components/ActiveOrdersList.jsx) | 206 | ActiveOrdersList:61 |
| [doan-kttn-frontend/src/features/customer/components/AiDiagnosticCard.jsx](../../doan-kttn-frontend/src/features/customer/components/AiDiagnosticCard.jsx) | 440 | AiDiagnosticCard:23 |
| [doan-kttn-frontend/src/features/customer/components/BookingModal.jsx](../../doan-kttn-frontend/src/features/customer/components/BookingModal.jsx) | 266 | BookingModal:24 |
| [doan-kttn-frontend/src/features/customer/components/CustomerHeader.jsx](../../doan-kttn-frontend/src/features/customer/components/CustomerHeader.jsx) | 69 | CustomerHeader:6 |
| [doan-kttn-frontend/src/features/customer/components/CustomerNavbar.jsx](../../doan-kttn-frontend/src/features/customer/components/CustomerNavbar.jsx) | 85 | CustomerNavbar:24 |
| [doan-kttn-frontend/src/features/customer/components/CustomerPortalHome.tsx](../../doan-kttn-frontend/src/features/customer/components/CustomerPortalHome.tsx) | 477 | CustomerPortalHome:80 |
| [doan-kttn-frontend/src/features/customer/components/CustomerSidebar.jsx](../../doan-kttn-frontend/src/features/customer/components/CustomerSidebar.jsx) | 231 | MENU_GROUPS:21, CustomerSidebar:69 |
| [doan-kttn-frontend/src/features/customer/components/QuickBookingGrid.jsx](../../doan-kttn-frontend/src/features/customer/components/QuickBookingGrid.jsx) | 298 | getServiceVisualMeta:24, QuickBookingGrid:187 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/AiHeroCard.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/AiHeroCard.tsx) | 70 | AiHeroCard:16 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/AiScanModal.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/AiScanModal.tsx) | 233 | AiScanModal:46 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/BottomNavBar.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/BottomNavBar.tsx) | 118 | BottomNavBar:26 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/CategoryGrid.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/CategoryGrid.tsx) | 106 | CategoryGrid:54 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/EmptyState.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/EmptyState.tsx) | 49 | EmptyState:21 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/ErrorState.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/ErrorState.tsx) | 44 | ErrorState:18 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/HomeHeader.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/HomeHeader.tsx) | 193 | HomeHeader:45, handleClickOutside:60 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/HomeSkeleton.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/HomeSkeleton.tsx) | 93 | HomeSkeleton:13 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/PopularServicesCarousel.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/PopularServicesCarousel.tsx) | 121 | PopularServicesCarousel:20 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/TicketVouchers.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/TicketVouchers.tsx) | 111 | TicketVouchers:20 |
| [doan-kttn-frontend/src/features/customer/components/mobile-home/WorkerMapCard.tsx](../../doan-kttn-frontend/src/features/customer/components/mobile-home/WorkerMapCard.tsx) | 170 | WorkerMapCard:20 |
| [doan-kttn-frontend/src/features/customer/hooks/useCustomerHome.ts](../../doan-kttn-frontend/src/features/customer/hooks/useCustomerHome.ts) | 117 | useCustomerHome:23 |
| [doan-kttn-frontend/src/features/customer/hooks/useHomeData.ts](../../doan-kttn-frontend/src/features/customer/hooks/useHomeData.ts) | 508 | useHomeData:329 |
| [doan-kttn-frontend/src/features/customer/hooks/useServicesCatalog.ts](../../doan-kttn-frontend/src/features/customer/hooks/useServicesCatalog.ts) | 331 | getVisualMeta:24, formatDurationRange:101, getWarrantyPolicy:114, getUnitExplanation:128, getContextualBadge:154 |
| [doan-kttn-frontend/src/features/customer/services/customerHomeService.ts](../../doan-kttn-frontend/src/features/customer/services/customerHomeService.ts) | 32 | customerHomeService:10 |
| [doan-kttn-frontend/src/features/customer/services/customerOrderService.js](../../doan-kttn-frontend/src/features/customer/services/customerOrderService.js) | 117 | customerOrderService:3, getServices:7, createOrder:50, getMyOrders:90, getOrderById:104 |
| [doan-kttn-frontend/src/features/customer/services/mockOrderApi.js](../../doan-kttn-frontend/src/features/customer/services/mockOrderApi.js) | 46 | MOCK_LOW_CONFIDENCE:7, setMockLowConfidence:9, diagnoseImage:18 |
| [doan-kttn-frontend/src/features/customer/services/orderApi.js](../../doan-kttn-frontend/src/features/customer/services/orderApi.js) | 48 | diagnoseImage:14 |
| [doan-kttn-frontend/src/features/customer/store/useOrderStore.js](../../doan-kttn-frontend/src/features/customer/store/useOrderStore.js) | 75 | useOrderStore:7 |
| [doan-kttn-frontend/src/features/customer/types/home.types.ts](../../doan-kttn-frontend/src/features/customer/types/home.types.ts) | 105 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/features/customer/views/AiDiagnosisView.jsx](../../doan-kttn-frontend/src/features/customer/views/AiDiagnosisView.jsx) | 101 | AiDiagnosisView:13 |
| [doan-kttn-frontend/src/features/customer/views/HomeMobileView.tsx](../../doan-kttn-frontend/src/features/customer/views/HomeMobileView.tsx) | 206 | HomeMobileView:33 |
| [doan-kttn-frontend/src/features/customer/views/HomeOverviewView.jsx](../../doan-kttn-frontend/src/features/customer/views/HomeOverviewView.jsx) | 66 | HomeOverviewView:14 |
| [doan-kttn-frontend/src/features/customer/views/NotificationsView.jsx](../../doan-kttn-frontend/src/features/customer/views/NotificationsView.jsx) | 70 | NotificationsView:10 |
| [doan-kttn-frontend/src/features/customer/views/OrdersManagementView.jsx](../../doan-kttn-frontend/src/features/customer/views/OrdersManagementView.jsx) | 184 | OrdersManagementView:13 |
| [doan-kttn-frontend/src/features/customer/views/PromotionsView.jsx](../../doan-kttn-frontend/src/features/customer/views/PromotionsView.jsx) | 63 | PromotionsView:10 |
| [doan-kttn-frontend/src/features/customer/views/SavedAddressesView.jsx](../../doan-kttn-frontend/src/features/customer/views/SavedAddressesView.jsx) | 75 | SavedAddressesView:4 |
| [doan-kttn-frontend/src/features/customer/views/ScheduledBookingsView.jsx](../../doan-kttn-frontend/src/features/customer/views/ScheduledBookingsView.jsx) | 33 | ScheduledBookingsView:4 |
| [doan-kttn-frontend/src/features/customer/views/ServicesCatalogView.tsx](../../doan-kttn-frontend/src/features/customer/views/ServicesCatalogView.tsx) | 361 | formatVND:29, ServicesCatalogView:51 |
| [doan-kttn-frontend/src/features/customer/views/SettingsSupportView.jsx](../../doan-kttn-frontend/src/features/customer/views/SettingsSupportView.jsx) | 105 | SettingsSupportView:10 |
| [doan-kttn-frontend/src/features/customer/views/UserProfileView.jsx](../../doan-kttn-frontend/src/features/customer/views/UserProfileView.jsx) | 177 | UserProfileView:5 |
| [doan-kttn-frontend/src/features/dashboard/components/DashboardStates.jsx](../../doan-kttn-frontend/src/features/dashboard/components/DashboardStates.jsx) | 135 | MetricCardsSkeleton:9, TimelineSkeleton:38, ChartSkeleton:60, DashboardErrorState:90, DashboardEmptyState:121 |
| [doan-kttn-frontend/src/features/dashboard/components/OrderChart.jsx](../../doan-kttn-frontend/src/features/dashboard/components/OrderChart.jsx) | 3 | OrderChart:1 |
| [doan-kttn-frontend/src/features/dashboard/components/RecentActivityTimeline.jsx](../../doan-kttn-frontend/src/features/dashboard/components/RecentActivityTimeline.jsx) | 157 | formatRelativeTime:19, RecentActivityTimeline:40 |
| [doan-kttn-frontend/src/features/dashboard/components/ServiceDistributionChart.jsx](../../doan-kttn-frontend/src/features/dashboard/components/ServiceDistributionChart.jsx) | 137 | CustomTooltip:15, ServiceDistributionChart:48 |
| [doan-kttn-frontend/src/features/dashboard/components/StatisticCard.jsx](../../doan-kttn-frontend/src/features/dashboard/components/StatisticCard.jsx) | 164 | StatisticCard:14 |
| [doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js](../../doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js) | 140 | useDashboardData:12 |
| [doan-kttn-frontend/src/features/dashboard/pages/DashboardPage.jsx](../../doan-kttn-frontend/src/features/dashboard/pages/DashboardPage.jsx) | 310 | DashboardPage:32 |
| [doan-kttn-frontend/src/features/dashboard/services/dashboard.service.js](../../doan-kttn-frontend/src/features/dashboard/services/dashboard.service.js) | 63 | dashboardService:10, getOverview:17, getActivities:40, getServiceDistribution:54 |
| [doan-kttn-frontend/src/features/orders/components/CancelOrderModal.jsx](../../doan-kttn-frontend/src/features/orders/components/CancelOrderModal.jsx) | 127 | CancelOrderModal:8 |
| [doan-kttn-frontend/src/features/orders/components/OrderDetailModal.jsx](../../doan-kttn-frontend/src/features/orders/components/OrderDetailModal.jsx) | 306 | OrderDetailModal:25 |
| [doan-kttn-frontend/src/features/orders/pages/OrdersManagementPage.jsx](../../doan-kttn-frontend/src/features/orders/pages/OrdersManagementPage.jsx) | 688 | OrdersManagementPage:38 |
| [doan-kttn-frontend/src/features/orders/services/adminOrders.service.js](../../doan-kttn-frontend/src/features/orders/services/adminOrders.service.js) | 230 | adminOrdersService:3, getOrders:8, getOrderById:190, updateOrderStatus:205, cancelOrder:215 |
| [doan-kttn-frontend/src/features/services/components/CategoryColumn.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryColumn.tsx) | 114 | CategoryColumn:15 |
| [doan-kttn-frontend/src/features/services/components/CategoryFilterPills.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryFilterPills.tsx) | 110 | getCategoryIcon:15, CategoryFilterPills:29 |
| [doan-kttn-frontend/src/features/services/components/CategoryManagementSection.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryManagementSection.tsx) | 425 | getCategoryFallbackIcon:35, CategoryManagementSection:60 |
| [doan-kttn-frontend/src/features/services/components/CategoryModal.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryModal.tsx) | 298 | generateSlug:9, CategoryModal:36 |
| [doan-kttn-frontend/src/features/services/components/CategoryPageHeader.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryPageHeader.tsx) | 66 | CategoryPageHeader:11 |
| [doan-kttn-frontend/src/features/services/components/CategorySection.jsx](../../doan-kttn-frontend/src/features/services/components/CategorySection.jsx) | 7 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/features/services/components/CategoryServiceCard.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryServiceCard.tsx) | 53 | CategoryServiceCard:9 |
| [doan-kttn-frontend/src/features/services/components/CategoryServicesModal.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryServicesModal.tsx) | 159 | CategoryServicesModal:16 |
| [doan-kttn-frontend/src/features/services/components/CategoryStatsCards.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryStatsCards.tsx) | 76 | CategoryStatsCards:11 |
| [doan-kttn-frontend/src/features/services/components/CategoryTable.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryTable.tsx) | 145 | CategoryTable:19 |
| [doan-kttn-frontend/src/features/services/components/CategoryTableRow.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryTableRow.tsx) | 158 | CategoryTableRow:14 |
| [doan-kttn-frontend/src/features/services/components/CategoryToast.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryToast.tsx) | 27 | CategoryToast:8 |
| [doan-kttn-frontend/src/features/services/components/CategoryToolbar.tsx](../../doan-kttn-frontend/src/features/services/components/CategoryToolbar.tsx) | 87 | CategoryToolbar:17 |
| [doan-kttn-frontend/src/features/services/components/DeleteCategoryModal.jsx](../../doan-kttn-frontend/src/features/services/components/DeleteCategoryModal.jsx) | 133 | DeleteCategoryModal:9 |
| [doan-kttn-frontend/src/features/services/components/DeleteServiceModal.jsx](../../doan-kttn-frontend/src/features/services/components/DeleteServiceModal.jsx) | 114 | DeleteServiceModal:4 |
| [doan-kttn-frontend/src/features/services/components/HierarchyBreadcrumb.tsx](../../doan-kttn-frontend/src/features/services/components/HierarchyBreadcrumb.tsx) | 64 | HierarchyBreadcrumb:11 |
| [doan-kttn-frontend/src/features/services/components/HierarchyDetailFooter.tsx](../../doan-kttn-frontend/src/features/services/components/HierarchyDetailFooter.tsx) | 96 | HierarchyDetailFooter:12 |
| [doan-kttn-frontend/src/features/services/components/HierarchyHeader.tsx](../../doan-kttn-frontend/src/features/services/components/HierarchyHeader.tsx) | 135 | HierarchyHeader:16 |
| [doan-kttn-frontend/src/features/services/components/ServiceColumn.tsx](../../doan-kttn-frontend/src/features/services/components/ServiceColumn.tsx) | 121 | ServiceColumn:16 |
| [doan-kttn-frontend/src/features/services/components/ServiceDetailModal.jsx](../../doan-kttn-frontend/src/features/services/components/ServiceDetailModal.jsx) | 119 | ServiceDetailModal:9 |
| [doan-kttn-frontend/src/features/services/components/ServiceFormModal.jsx](../../doan-kttn-frontend/src/features/services/components/ServiceFormModal.jsx) | 247 | ServiceFormModal:4 |
| [doan-kttn-frontend/src/features/services/components/ServiceModal.tsx](../../doan-kttn-frontend/src/features/services/components/ServiceModal.tsx) | 318 | ServiceModal:21 |
| [doan-kttn-frontend/src/features/services/components/TargetColumn.tsx](../../doan-kttn-frontend/src/features/services/components/TargetColumn.tsx) | 120 | TargetColumn:16 |
| [doan-kttn-frontend/src/features/services/components/TargetFilterPills.tsx](../../doan-kttn-frontend/src/features/services/components/TargetFilterPills.tsx) | 81 | TargetFilterPills:15 |
| [doan-kttn-frontend/src/features/services/components/TargetModal.tsx](../../doan-kttn-frontend/src/features/services/components/TargetModal.tsx) | 174 | TargetModal:17 |
| [doan-kttn-frontend/src/features/services/hooks/useCategories.ts](../../doan-kttn-frontend/src/features/services/hooks/useCategories.ts) | 305 | useCategories:30 |
| [doan-kttn-frontend/src/features/services/hooks/useCategoryManagement.js](../../doan-kttn-frontend/src/features/services/hooks/useCategoryManagement.js) | 189 | useCategoryManagement:13 |
| [doan-kttn-frontend/src/features/services/hooks/useCategoryServices.ts](../../doan-kttn-frontend/src/features/services/hooks/useCategoryServices.ts) | 51 | useCategoryServices:6, loadCategoryServices:16 |
| [doan-kttn-frontend/src/features/services/hooks/useServiceManagement.js](../../doan-kttn-frontend/src/features/services/hooks/useServiceManagement.js) | 248 | useServiceManagement:11 |
| [doan-kttn-frontend/src/features/services/hooks/useServices.ts](../../doan-kttn-frontend/src/features/services/hooks/useServices.ts) | 491 | useServices:31 |
| [doan-kttn-frontend/src/features/services/pages/CategoryManagementPage.tsx](../../doan-kttn-frontend/src/features/services/pages/CategoryManagementPage.tsx) | 301 | CategoryManagementPage:19 |
| [doan-kttn-frontend/src/features/services/pages/ServiceManagementPage.tsx](../../doan-kttn-frontend/src/features/services/pages/ServiceManagementPage.tsx) | 640 | formatVND:42, getServiceIcon:50, ServiceManagementPage:72 |
| [doan-kttn-frontend/src/features/services/pages/ServicesManagementPage.jsx](../../doan-kttn-frontend/src/features/services/pages/ServicesManagementPage.jsx) | 659 | getServiceIcon:38, ServicesManagementPage:58 |
| [doan-kttn-frontend/src/features/services/services/adminCategories.service.js](../../doan-kttn-frontend/src/features/services/services/adminCategories.service.js) | 41 | adminCategoriesService:7, getCategories:8, createCategory:18, updateCategory:23, toggleCategoryStatus:28 |
| [doan-kttn-frontend/src/features/services/services/adminServices.service.js](../../doan-kttn-frontend/src/features/services/services/adminServices.service.js) | 82 | adminServicesService:7, getServices:8, getTargets:19, createTarget:31, updateTarget:36 |
| [doan-kttn-frontend/src/features/services/utils/getCategoryFallbackIcon.ts](../../doan-kttn-frontend/src/features/services/utils/getCategoryFallbackIcon.ts) | 26 | getCategoryFallbackIcon:16 |
| [doan-kttn-frontend/src/features/settings/pages/SystemSettingsPage.jsx](../../doan-kttn-frontend/src/features/settings/pages/SystemSettingsPage.jsx) | 607 | SystemSettingsPage:35 |
| [doan-kttn-frontend/src/features/settings/services/adminSettings.service.js](../../doan-kttn-frontend/src/features/settings/services/adminSettings.service.js) | 39 | adminSettingsService:3, getSettings:7, updateSettings:33 |
| [doan-kttn-frontend/src/features/users/components/DeleteConfirmModal.jsx](../../doan-kttn-frontend/src/features/users/components/DeleteConfirmModal.jsx) | 65 | DeleteConfirmModal:4 |
| [doan-kttn-frontend/src/features/users/components/UserModal.jsx](../../doan-kttn-frontend/src/features/users/components/UserModal.jsx) | 321 | UserModal:5 |
| [doan-kttn-frontend/src/features/users/pages/UserDetailPage.jsx](../../doan-kttn-frontend/src/features/users/pages/UserDetailPage.jsx) | 3 | UserDetailPage:1 |
| [doan-kttn-frontend/src/features/users/pages/UsersPage.jsx](../../doan-kttn-frontend/src/features/users/pages/UsersPage.jsx) | 721 | UsersPage:38 |
| [doan-kttn-frontend/src/features/users/services/user.service.js](../../doan-kttn-frontend/src/features/users/services/user.service.js) | 89 | userService:6, getUsers:11, getUserById:37, createUser:46, updateUser:56 |
| [doan-kttn-frontend/src/features/workers/components/ActiveJobCard.jsx](../../doan-kttn-frontend/src/features/workers/components/ActiveJobCard.jsx) | 231 | ActiveJobCard:23 |
| [doan-kttn-frontend/src/features/workers/components/ConfirmActionModal.jsx](../../doan-kttn-frontend/src/features/workers/components/ConfirmActionModal.jsx) | 109 | ConfirmActionModal:8 |
| [doan-kttn-frontend/src/features/workers/components/IncomingOrderCard.jsx](../../doan-kttn-frontend/src/features/workers/components/IncomingOrderCard.jsx) | 151 | IncomingOrderCard:25 |
| [doan-kttn-frontend/src/features/workers/components/RejectWorkerModal.jsx](../../doan-kttn-frontend/src/features/workers/components/RejectWorkerModal.jsx) | 110 | RejectWorkerModal:4 |
| [doan-kttn-frontend/src/features/workers/components/WorkerDetailModal.jsx](../../doan-kttn-frontend/src/features/workers/components/WorkerDetailModal.jsx) | 182 | WorkerDetailModal:18 |
| [doan-kttn-frontend/src/features/workers/components/WorkerStatsPanel.jsx](../../doan-kttn-frontend/src/features/workers/components/WorkerStatsPanel.jsx) | 111 | WorkerStatsPanel:12 |
| [doan-kttn-frontend/src/features/workers/pages/WorkerApprovalPage.jsx](../../doan-kttn-frontend/src/features/workers/pages/WorkerApprovalPage.jsx) | 3 | WorkerApprovalPage:1 |
| [doan-kttn-frontend/src/features/workers/pages/WorkerDashboardPage.jsx](../../doan-kttn-frontend/src/features/workers/pages/WorkerDashboardPage.jsx) | 494 | WorkerDashboardPage:32 |
| [doan-kttn-frontend/src/features/workers/pages/WorkerDetailPage.jsx](../../doan-kttn-frontend/src/features/workers/pages/WorkerDetailPage.jsx) | 3 | WorkerDetailPage:1 |
| [doan-kttn-frontend/src/features/workers/pages/WorkersManagementPage.jsx](../../doan-kttn-frontend/src/features/workers/pages/WorkersManagementPage.jsx) | 724 | WorkersManagementPage:38 |
| [doan-kttn-frontend/src/features/workers/pages/WorkersPage.jsx](../../doan-kttn-frontend/src/features/workers/pages/WorkersPage.jsx) | 3 | WorkersPage:1 |
| [doan-kttn-frontend/src/features/workers/services/worker.service.js](../../doan-kttn-frontend/src/features/workers/services/worker.service.js) | 143 | workerService:3, getProfile:7, toggleAvailability:33, updateLocation:48, getCurrentOrder:61 |
| [doan-kttn-frontend/src/features/workers/services/workersAdminService.js](../../doan-kttn-frontend/src/features/workers/services/workersAdminService.js) | 218 | workersAdminService:3, getWorkers:8, approveWorker:181, rejectWorker:197, deleteWorker:212 |
| [doan-kttn-frontend/src/hooks/useAuthCheck.js](../../doan-kttn-frontend/src/hooks/useAuthCheck.js) | 69 | useAuthCheck:11 |
| [doan-kttn-frontend/src/hooks/useDebounce.js](../../doan-kttn-frontend/src/hooks/useDebounce.js) | 1 | useDebounce:1 |
| [doan-kttn-frontend/src/hooks/usePagination.js](../../doan-kttn-frontend/src/hooks/usePagination.js) | 1 | usePagination:1 |
| [doan-kttn-frontend/src/layouts/AdminLayout.jsx](../../doan-kttn-frontend/src/layouts/AdminLayout.jsx) | 110 | AdminLayout:18 |
| [doan-kttn-frontend/src/main.jsx](../../doan-kttn-frontend/src/main.jsx) | 10 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/pages/HomePage.jsx](../../doan-kttn-frontend/src/pages/HomePage.jsx) | 95 | HomePage:23 |
| [doan-kttn-frontend/src/pages/admin/index.jsx](../../doan-kttn-frontend/src/pages/admin/index.jsx) | 3 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/pages/user/index.jsx](../../doan-kttn-frontend/src/pages/user/index.jsx) | 3 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/routers/menuConfig.js](../../doan-kttn-frontend/src/routers/menuConfig.js) | 88 | adminMenuConfig:19 |
| [doan-kttn-frontend/src/routers/routes.jsx](../../doan-kttn-frontend/src/routers/routes.jsx) | 105 | HomeOrDashboardRedirect:21, AppRoutes:34 |
| [doan-kttn-frontend/src/services/api/client.js](../../doan-kttn-frontend/src/services/api/client.js) | 17 | apiClient:6 |
| [doan-kttn-frontend/src/services/api/interceptors.js](../../doan-kttn-frontend/src/services/api/interceptors.js) | 74 | setupInterceptors:9 |
| [doan-kttn-frontend/src/services/socket/socketClient.js](../../doan-kttn-frontend/src/services/socket/socketClient.js) | 4 | socketClient:3 |
| [doan-kttn-frontend/src/services/socket/socketService.js](../../doan-kttn-frontend/src/services/socket/socketService.js) | 124 | SocketService:6, connect:17, joinRoom:64, joinAdminRoom:75, on:88 |
| [doan-kttn-frontend/src/services/storage/tokenStorage.js](../../doan-kttn-frontend/src/services/storage/tokenStorage.js) | 60 | tokenStorage:8 |
| [doan-kttn-frontend/src/store/appStore.js](../../doan-kttn-frontend/src/store/appStore.js) | 1 | appStore:1 |
| [doan-kttn-frontend/src/store/authStore.js](../../doan-kttn-frontend/src/store/authStore.js) | 3 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/store/authStore.jsx](../../doan-kttn-frontend/src/store/authStore.jsx) | 111 | AuthContext:6, AuthProvider:8, useAuth:103 |
| [doan-kttn-frontend/src/store/themeStore.jsx](../../doan-kttn-frontend/src/store/themeStore.jsx) | 92 | ThemeProvider:5, useTheme:84 |
| [doan-kttn-frontend/src/types/category.ts](../../doan-kttn-frontend/src/types/category.ts) | 92 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/types/customerHome.ts](../../doan-kttn-frontend/src/types/customerHome.ts) | 162 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/types/dashboard.ts](../../doan-kttn-frontend/src/types/dashboard.ts) | 158 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/types/service.ts](../../doan-kttn-frontend/src/types/service.ts) | 137 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/types/serviceCatalog.ts](../../doan-kttn-frontend/src/types/serviceCatalog.ts) | 65 | barrel / declarations / anonymous component |
| [doan-kttn-frontend/src/utils/formatCurrency.js](../../doan-kttn-frontend/src/utils/formatCurrency.js) | 6 | formatCurrency:1, formatVND:6 |
| [doan-kttn-frontend/src/utils/formatDate.js](../../doan-kttn-frontend/src/utils/formatDate.js) | 35 | formatVietnameseDateTime:10, formatDate:31 |
| [doan-kttn-frontend/src/utils/jwt.js](../../doan-kttn-frontend/src/utils/jwt.js) | 76 | parseJwt:11, isTokenExpired:47, getTokenRemainingSeconds:69 |
| [doan-kttn-frontend/src/utils/validation.js](../../doan-kttn-frontend/src/utils/validation.js) | 40 | EMAIL_REGEX:5, PHONE_REGEX:6, validateEmailOrPhone:8, validatePassword:22, validateLoginForm:32 |

### doan-kltn-mobile/src

| File | Dòng | Symbols (scan metadata) |
|---|---:|---|
| [doan-kltn-mobile/src/components/GlobalErrorBoundary.tsx](../../doan-kltn-mobile/src/components/GlobalErrorBoundary.tsx) | 249 | GlobalErrorBoundary:32 |
| [doan-kltn-mobile/src/components/RealLeafletMap.native.tsx](../../doan-kltn-mobile/src/components/RealLeafletMap.native.tsx) | 388 | RealLeafletMap:49, selectWorker:300, recenter:313 |
| [doan-kltn-mobile/src/components/RealLeafletMap.tsx](../../doan-kltn-mobile/src/components/RealLeafletMap.tsx) | 10 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/components/RealLeafletMap.web.tsx](../../doan-kltn-mobile/src/components/RealLeafletMap.web.tsx) | 407 | RealLeafletMap:49, selectWorker:327, recenter:340 |
| [doan-kltn-mobile/src/components/WorkerTrackingMapView.jsx](../../doan-kltn-mobile/src/components/WorkerTrackingMapView.jsx) | 85 | WorkerTrackingMapView:12 |
| [doan-kltn-mobile/src/components/feedback/index.js](../../doan-kltn-mobile/src/components/feedback/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/components/layout/index.js](../../doan-kltn-mobile/src/components/layout/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/components/trackingMapHtml.js](../../doan-kltn-mobile/src/components/trackingMapHtml.js) | 49 | getTrackingMapHtml:1 |
| [doan-kltn-mobile/src/components/ui/index.js](../../doan-kltn-mobile/src/components/ui/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/config/index.js](../../doan-kltn-mobile/src/config/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/constants/index.js](../../doan-kltn-mobile/src/constants/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/components/OtpInput.jsx](../../doan-kltn-mobile/src/features/auth/components/OtpInput.jsx) | 308 | OtpInput:39 |
| [doan-kltn-mobile/src/features/auth/components/RoleSelectionSheet.jsx](../../doan-kltn-mobile/src/features/auth/components/RoleSelectionSheet.jsx) | 123 | RoleSelectionSheet:5 |
| [doan-kltn-mobile/src/features/auth/components/StepIndicator.jsx](../../doan-kltn-mobile/src/features/auth/components/StepIndicator.jsx) | 61 | StepIndicator:4 |
| [doan-kltn-mobile/src/features/auth/components/index.js](../../doan-kltn-mobile/src/features/auth/components/index.js) | 5 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/context/AuthContext.jsx](../../doan-kltn-mobile/src/features/auth/context/AuthContext.jsx) | 177 | AuthProvider:8, useAuth:171 |
| [doan-kltn-mobile/src/features/auth/hooks/index.js](../../doan-kltn-mobile/src/features/auth/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/hooks/useAuth.js](../../doan-kltn-mobile/src/features/auth/hooks/useAuth.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/index.js](../../doan-kltn-mobile/src/features/auth/index.js) | 5 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/services/auth.service.js](../../doan-kltn-mobile/src/features/auth/services/auth.service.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/services/authService.js](../../doan-kltn-mobile/src/features/auth/services/authService.js) | 218 | authService:4, login:9, registerCustomer:32, registerWorker:45, register:58 |
| [doan-kltn-mobile/src/features/auth/services/index.js](../../doan-kltn-mobile/src/features/auth/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/auth/services/otpService.js](../../doan-kltn-mobile/src/features/auth/services/otpService.js) | 70 | otpService:8, sendPhoneOtp:18, verifyPhoneOtp:32, sendEmailOtp:51, verifyEmailOtp:64 |
| [doan-kltn-mobile/src/features/auth/store/index.js](../../doan-kltn-mobile/src/features/auth/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/booking/components/MatchingRadarView.jsx](../../doan-kltn-mobile/src/features/booking/components/MatchingRadarView.jsx) | 382 | MatchingRadarView:20 |
| [doan-kltn-mobile/src/features/booking/components/WorkerFoundView.jsx](../../doan-kltn-mobile/src/features/booking/components/WorkerFoundView.jsx) | 194 | WorkerFoundView:16 |
| [doan-kltn-mobile/src/features/booking/components/index.js](../../doan-kltn-mobile/src/features/booking/components/index.js) | 5 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/booking/hooks/index.js](../../doan-kltn-mobile/src/features/booking/hooks/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/booking/hooks/useBooking.js](../../doan-kltn-mobile/src/features/booking/hooks/useBooking.js) | 308 | useBooking:48 |
| [doan-kltn-mobile/src/features/booking/index.js](../../doan-kltn-mobile/src/features/booking/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/booking/services/bookingService.js](../../doan-kltn-mobile/src/features/booking/services/bookingService.js) | 99 | bookingService:7, createBooking:13, cancelBooking:52, getAvailableServices:67, uploadEvidencePhoto:85 |
| [doan-kltn-mobile/src/features/booking/services/index.js](../../doan-kltn-mobile/src/features/booking/services/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/booking/store/index.js](../../doan-kltn-mobile/src/features/booking/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/booking/types.js](../../doan-kltn-mobile/src/features/booking/types.js) | 83 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/chat/components/index.js](../../doan-kltn-mobile/src/features/chat/components/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/chat/hooks/index.js](../../doan-kltn-mobile/src/features/chat/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/chat/index.js](../../doan-kltn-mobile/src/features/chat/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/chat/services/index.js](../../doan-kltn-mobile/src/features/chat/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/chat/store/index.js](../../doan-kltn-mobile/src/features/chat/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/face-verification/components/BiometricOvalFrame.jsx](../../doan-kltn-mobile/src/features/face-verification/components/BiometricOvalFrame.jsx) | 92 | BiometricOvalFrame:5 |
| [doan-kltn-mobile/src/features/face-verification/components/VerificationResultModal.jsx](../../doan-kltn-mobile/src/features/face-verification/components/VerificationResultModal.jsx) | 91 | VerificationResultModal:5 |
| [doan-kltn-mobile/src/features/face-verification/components/index.js](../../doan-kltn-mobile/src/features/face-verification/components/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/face-verification/hooks/index.js](../../doan-kltn-mobile/src/features/face-verification/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/face-verification/hooks/useFaceVerification.js](../../doan-kltn-mobile/src/features/face-verification/hooks/useFaceVerification.js) | 77 | useFaceVerification:5 |
| [doan-kltn-mobile/src/features/face-verification/index.js](../../doan-kltn-mobile/src/features/face-verification/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/face-verification/services/index.js](../../doan-kltn-mobile/src/features/face-verification/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/face-verification/store/index.js](../../doan-kltn-mobile/src/features/face-verification/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/home/components/AiBanner.tsx](../../doan-kltn-mobile/src/features/home/components/AiBanner.tsx) | 460 | AiBanner:36 |
| [doan-kltn-mobile/src/features/home/components/AiScanModal.tsx](../../doan-kltn-mobile/src/features/home/components/AiScanModal.tsx) | 897 | AiScanModal:39 |
| [doan-kltn-mobile/src/features/home/components/CategoryDetailModal.styles.ts](../../doan-kltn-mobile/src/features/home/components/CategoryDetailModal.styles.ts) | 29 | styles:3 |
| [doan-kltn-mobile/src/features/home/components/CategoryDetailModal.tsx](../../doan-kltn-mobile/src/features/home/components/CategoryDetailModal.tsx) | 142 | CategoryDetailModal:27 |
| [doan-kltn-mobile/src/features/home/components/CategoryGrid.tsx](../../doan-kltn-mobile/src/features/home/components/CategoryGrid.tsx) | 430 | CategoryGridItem:133, CategoryGrid:269 |
| [doan-kltn-mobile/src/features/home/components/CategoryModernIcon.tsx](../../doan-kltn-mobile/src/features/home/components/CategoryModernIcon.tsx) | 392 | CategoryModernIcon:28 |
| [doan-kltn-mobile/src/features/home/components/EmptyState.tsx](../../doan-kltn-mobile/src/features/home/components/EmptyState.tsx) | 100 | EmptyState:20 |
| [doan-kltn-mobile/src/features/home/components/ErrorState.tsx](../../doan-kltn-mobile/src/features/home/components/ErrorState.tsx) | 96 | ErrorState:18 |
| [doan-kltn-mobile/src/features/home/components/HomeHeader.tsx](../../doan-kltn-mobile/src/features/home/components/HomeHeader.tsx) | 626 | HomeHeader:53 |
| [doan-kltn-mobile/src/features/home/components/HomeSkeleton.tsx](../../doan-kltn-mobile/src/features/home/components/HomeSkeleton.tsx) | 180 | HomeSkeleton:13 |
| [doan-kltn-mobile/src/features/home/components/PopularServicesCarousel.tsx](../../doan-kltn-mobile/src/features/home/components/PopularServicesCarousel.tsx) | 329 | PopularServicesCarousel:29 |
| [doan-kltn-mobile/src/features/home/components/VoucherTickets.tsx](../../doan-kltn-mobile/src/features/home/components/VoucherTickets.tsx) | 301 | VoucherTickets:28 |
| [doan-kltn-mobile/src/features/home/components/WorkerFullMapModal.tsx](../../doan-kltn-mobile/src/features/home/components/WorkerFullMapModal.tsx) | 719 | WorkerFullMapModal:48 |
| [doan-kltn-mobile/src/features/home/components/WorkerMapSection.tsx](../../doan-kltn-mobile/src/features/home/components/WorkerMapSection.tsx) | 773 | WorkerMapSection:44, initRealGpsAndWorkers:66 |
| [doan-kltn-mobile/src/features/home/hooks/useCategoryDetailModal.ts](../../doan-kltn-mobile/src/features/home/hooks/useCategoryDetailModal.ts) | 73 | useCategoryDetailModal:5, loadData:20 |
| [doan-kltn-mobile/src/features/home/hooks/useHomeData.ts](../../doan-kltn-mobile/src/features/home/hooks/useHomeData.ts) | 420 | useHomeData:249 |
| [doan-kltn-mobile/src/features/home/screens/HomeScreen.tsx](../../doan-kltn-mobile/src/features/home/screens/HomeScreen.tsx) | 486 | HomeScreen:49 |
| [doan-kltn-mobile/src/features/home/types/home.types.ts](../../doan-kltn-mobile/src/features/home/types/home.types.ts) | 76 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/image-analysis/components/index.js](../../doan-kltn-mobile/src/features/image-analysis/components/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/image-analysis/hooks/index.js](../../doan-kltn-mobile/src/features/image-analysis/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/image-analysis/index.js](../../doan-kltn-mobile/src/features/image-analysis/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/image-analysis/services/index.js](../../doan-kltn-mobile/src/features/image-analysis/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/image-analysis/store/index.js](../../doan-kltn-mobile/src/features/image-analysis/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/location/components/index.js](../../doan-kltn-mobile/src/features/location/components/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/location/hooks/index.js](../../doan-kltn-mobile/src/features/location/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/location/index.js](../../doan-kltn-mobile/src/features/location/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/location/services/index.js](../../doan-kltn-mobile/src/features/location/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/location/store/index.js](../../doan-kltn-mobile/src/features/location/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/orders/components/index.js](../../doan-kltn-mobile/src/features/orders/components/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/orders/hooks/index.js](../../doan-kltn-mobile/src/features/orders/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/orders/index.js](../../doan-kltn-mobile/src/features/orders/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/orders/services/index.js](../../doan-kltn-mobile/src/features/orders/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/orders/store/index.js](../../doan-kltn-mobile/src/features/orders/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/payment/components/index.js](../../doan-kltn-mobile/src/features/payment/components/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/payment/hooks/index.js](../../doan-kltn-mobile/src/features/payment/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/payment/index.js](../../doan-kltn-mobile/src/features/payment/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/payment/services/index.js](../../doan-kltn-mobile/src/features/payment/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/payment/store/index.js](../../doan-kltn-mobile/src/features/payment/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/components/PriceEstimateModal.tsx](../../doan-kltn-mobile/src/features/services/components/PriceEstimateModal.tsx) | 645 | PriceEstimateModal:35 |
| [doan-kltn-mobile/src/features/services/components/PriceListAccordion.tsx](../../doan-kltn-mobile/src/features/services/components/PriceListAccordion.tsx) | 91 | PriceListAccordion:12 |
| [doan-kltn-mobile/src/features/services/components/SubServiceListModal.tsx](../../doan-kltn-mobile/src/features/services/components/SubServiceListModal.tsx) | 902 | SubServiceSkeletonItem:44, SubServiceListModal:87 |
| [doan-kltn-mobile/src/features/services/components/index.js](../../doan-kltn-mobile/src/features/services/components/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/components/index.ts](../../doan-kltn-mobile/src/features/services/components/index.ts) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/data/mockServices.ts](../../doan-kltn-mobile/src/features/services/data/mockServices.ts) | 856 | MOCK_SERVICE_CATEGORIES:9, MOCK_PRICING_TIERS:706 |
| [doan-kltn-mobile/src/features/services/hooks/index.js](../../doan-kltn-mobile/src/features/services/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/hooks/usePriceList.ts](../../doan-kltn-mobile/src/features/services/hooks/usePriceList.ts) | 85 | usePriceList:4 |
| [doan-kltn-mobile/src/features/services/hooks/useSelectServiceWizard.ts](../../doan-kltn-mobile/src/features/services/hooks/useSelectServiceWizard.ts) | 74 | useSelectServiceWizard:5, loadTree:14 |
| [doan-kltn-mobile/src/features/services/index.js](../../doan-kltn-mobile/src/features/services/index.js) | 7 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/index.ts](../../doan-kltn-mobile/src/features/services/index.ts) | 8 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/screens/PriceEstimateScreen.tsx](../../doan-kltn-mobile/src/features/services/screens/PriceEstimateScreen.tsx) | 785 | PriceEstimateScreen:27 |
| [doan-kltn-mobile/src/features/services/services/index.js](../../doan-kltn-mobile/src/features/services/services/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/services/serviceCatalog.service.ts](../../doan-kltn-mobile/src/features/services/services/serviceCatalog.service.ts) | 60 | serviceCatalogService:7, getCategories:8, getTargetsByCategory:13, getServices:19, getServicesTree:29 |
| [doan-kltn-mobile/src/features/services/store/index.js](../../doan-kltn-mobile/src/features/services/store/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/features/services/types/service.types.ts](../../doan-kltn-mobile/src/features/services/types/service.types.ts) | 60 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/hooks/index.js](../../doan-kltn-mobile/src/hooks/index.js) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/hooks/useGoogleAuth.js](../../doan-kltn-mobile/src/hooks/useGoogleAuth.js) | 101 | useGoogleAuth:27 |
| [doan-kltn-mobile/src/hooks/useWorkerLocationTracker.js](../../doan-kltn-mobile/src/hooks/useWorkerLocationTracker.js) | 75 | useWorkerLocationTracker:5 |
| [doan-kltn-mobile/src/screens/order/AcceptanceScreen.jsx](../../doan-kltn-mobile/src/screens/order/AcceptanceScreen.jsx) | 840 | AcceptanceScreen:30 |
| [doan-kltn-mobile/src/screens/order/ConfirmOrderScreen.jsx](../../doan-kltn-mobile/src/screens/order/ConfirmOrderScreen.jsx) | 690 | ConfirmOrderScreen:40 |
| [doan-kltn-mobile/src/screens/order/DiagnoseScreen.jsx](../../doan-kltn-mobile/src/screens/order/DiagnoseScreen.jsx) | 692 | DiagnoseScreen:39 |
| [doan-kltn-mobile/src/screens/order/PaymentReviewScreen.jsx](../../doan-kltn-mobile/src/screens/order/PaymentReviewScreen.jsx) | 858 | PaymentReviewScreen:25 |
| [doan-kltn-mobile/src/screens/order/SearchingScreen.jsx](../../doan-kltn-mobile/src/screens/order/SearchingScreen.jsx) | 849 | SearchingScreen:27 |
| [doan-kltn-mobile/src/screens/order/TrackingScreen.jsx](../../doan-kltn-mobile/src/screens/order/TrackingScreen.jsx) | 1262 | TrackingScreen:31 |
| [doan-kltn-mobile/src/screens/order/index.js](../../doan-kltn-mobile/src/screens/order/index.js) | 6 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/services/api/aiService.ts](../../doan-kltn-mobile/src/services/api/aiService.ts) | 159 | diagnoseIssueImage:30 |
| [doan-kltn-mobile/src/services/api/apiClient.js](../../doan-kltn-mobile/src/services/api/apiClient.js) | 120 | API_BASE_URL:35, setOnUnauthorizedCallback:40, apiClient:44 |
| [doan-kltn-mobile/src/services/api/catalogService.ts](../../doan-kltn-mobile/src/services/api/catalogService.ts) | 64 | catalogService:27, getTargets:51, getCategoryTree:60 |
| [doan-kltn-mobile/src/services/api/faceService.js](../../doan-kltn-mobile/src/services/api/faceService.js) | 39 | faceService:6, verifyWorkerFace:12, verifyFaceByUrl:36 |
| [doan-kltn-mobile/src/services/api/index.js](../../doan-kltn-mobile/src/services/api/index.js) | 6 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/services/api/orderService.js](../../doan-kltn-mobile/src/services/api/orderService.js) | 117 | orderService:3, diagnose:8, getCategories:16, createOrder:24, getOrderById:32 |
| [doan-kltn-mobile/src/services/api/routingService.js](../../doan-kltn-mobile/src/services/api/routingService.js) | 67 | routingService:9, getRoute:16 |
| [doan-kltn-mobile/src/services/api/workerService.ts](../../doan-kltn-mobile/src/services/api/workerService.ts) | 76 | getNearbyWorkersApi:20, fetchNearbyWorkers:76 |
| [doan-kltn-mobile/src/services/firebaseConfig.js](../../doan-kltn-mobile/src/services/firebaseConfig.js) | 37 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/services/socket/index.js](../../doan-kltn-mobile/src/services/socket/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/services/socket/socketService.js](../../doan-kltn-mobile/src/services/socket/socketService.js) | 163 | SocketService:41, connect:49, joinRoom:93, joinOrderRoom:104, leaveOrderRoom:121 |
| [doan-kltn-mobile/src/services/storage/index.js](../../doan-kltn-mobile/src/services/storage/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/services/storage/orderStorage.js](../../doan-kltn-mobile/src/services/storage/orderStorage.js) | 166 | orderStorage:14, saveOrder:18, checkAndExpireOrders:37, getLocalOrders:79, getAllOrders:94 |
| [doan-kltn-mobile/src/services/storage/tokenStorage.js](../../doan-kltn-mobile/src/services/storage/tokenStorage.js) | 69 | tokenStorage:6, saveToken:7, getToken:17, removeToken:26, saveUser:34 |
| [doan-kltn-mobile/src/store/index.js](../../doan-kltn-mobile/src/store/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/store/useOrderStore.js](../../doan-kltn-mobile/src/store/useOrderStore.js) | 133 | useOrderStore:3 |
| [doan-kltn-mobile/src/types/index.js](../../doan-kltn-mobile/src/types/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/utils/index.js](../../doan-kltn-mobile/src/utils/index.js) | 2 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/src/utils/remoteLogger.ts](../../doan-kltn-mobile/src/utils/remoteLogger.ts) | 131 | sendErrorToLog:48, initRemoteLogger:95 |

### doan-kltn-mobile/app

| File | Dòng | Symbols (scan metadata) |
|---|---:|---|
| [doan-kltn-mobile/app/(auth)/_layout.jsx](../../doan-kltn-mobile/app/(auth)/_layout.jsx) | 22 | AuthLayout:4 |
| [doan-kltn-mobile/app/(auth)/forgot-password.jsx](../../doan-kltn-mobile/app/(auth)/forgot-password.jsx) | 850 | ForgotPasswordScreen:49 |
| [doan-kltn-mobile/app/(auth)/login-worker.jsx](../../doan-kltn-mobile/app/(auth)/login-worker.jsx) | 597 | WorkerLoginScreen:42 |
| [doan-kltn-mobile/app/(auth)/login.jsx](../../doan-kltn-mobile/app/(auth)/login.jsx) | 6 | LoginRoute:4 |
| [doan-kltn-mobile/app/(auth)/register-customer.jsx](../../doan-kltn-mobile/app/(auth)/register-customer.jsx) | 1253 | RegisterCustomerScreen:53 |
| [doan-kltn-mobile/app/(auth)/register-worker.jsx](../../doan-kltn-mobile/app/(auth)/register-worker.jsx) | 1636 | VN_PROVINCE_CODES:55, validateVietnameseCCCD:75, RegisterWorkerScreen:134 |
| [doan-kltn-mobile/app/(auth)/register.jsx](../../doan-kltn-mobile/app/(auth)/register.jsx) | 455 | RegisterSelectionScreen:44 |
| [doan-kltn-mobile/app/(user)/(tabs)/_layout.jsx](../../doan-kltn-mobile/app/(user)/(tabs)/_layout.jsx) | 101 | UserTabsLayout:7 |
| [doan-kltn-mobile/app/(user)/(tabs)/index.jsx](../../doan-kltn-mobile/app/(user)/(tabs)/index.jsx) | 12 | UserHomeTabRoute:10 |
| [doan-kltn-mobile/app/(user)/(tabs)/notifications.jsx](../../doan-kltn-mobile/app/(user)/(tabs)/notifications.jsx) | 33 | ThngboKhchhngScreen:4 |
| [doan-kltn-mobile/app/(user)/(tabs)/orders.jsx](../../doan-kltn-mobile/app/(user)/(tabs)/orders.jsx) | 625 | OrderHistoryScreen:29 |
| [doan-kltn-mobile/app/(user)/(tabs)/profile.jsx](../../doan-kltn-mobile/app/(user)/(tabs)/profile.jsx) | 463 | CustomerProfileScreen:41 |
| [doan-kltn-mobile/app/(user)/_layout.jsx](../../doan-kltn-mobile/app/(user)/_layout.jsx) | 22 | UserLayout:4 |
| [doan-kltn-mobile/app/(user)/booking/address.jsx](../../doan-kltn-mobile/app/(user)/booking/address.jsx) | 33 | ChnachScreen:4 |
| [doan-kltn-mobile/app/(user)/booking/confirm.jsx](../../doan-kltn-mobile/app/(user)/booking/confirm.jsx) | 33 | XcnhntlchThanhtonScreen:4 |
| [doan-kltn-mobile/app/(user)/booking/create-booking.jsx](../../doan-kltn-mobile/app/(user)/booking/create-booking.jsx) | 1563 | BookingFlowScreen:66 |
| [doan-kltn-mobile/app/(user)/booking/index.jsx](../../doan-kltn-mobile/app/(user)/booking/index.jsx) | 1 | barrel / declarations / anonymous component |
| [doan-kltn-mobile/app/(user)/booking/select-service.jsx](../../doan-kltn-mobile/app/(user)/booking/select-service.jsx) | 118 | SelectServiceScreen:7 |
| [doan-kltn-mobile/app/(user)/order/[id].jsx](../../doan-kltn-mobile/app/(user)/order/[id].jsx) | 877 | UserOrderDetailScreen:36 |
| [doan-kltn-mobile/app/(user)/price-estimate.jsx](../../doan-kltn-mobile/app/(user)/price-estimate.jsx) | 6 | PriceEstimateRoute:4 |
| [doan-kltn-mobile/app/(user)/price-list.jsx](../../doan-kltn-mobile/app/(user)/price-list.jsx) | 118 | PriceListScreen:18 |
| [doan-kltn-mobile/app/(user)/profile/edit-field.jsx](../../doan-kltn-mobile/app/(user)/profile/edit-field.jsx) | 951 | EditFieldScreen:50 |
| [doan-kltn-mobile/app/(user)/profile/edit.jsx](../../doan-kltn-mobile/app/(user)/profile/edit.jsx) | 1357 | EditCustomerProfileScreen:46 |
| [doan-kltn-mobile/app/(user)/profile/vouchers.jsx](../../doan-kltn-mobile/app/(user)/profile/vouchers.jsx) | 615 | VouchersScreen:42 |
| [doan-kltn-mobile/app/(user)/profile/wallet.jsx](../../doan-kltn-mobile/app/(user)/profile/wallet.jsx) | 1003 | CustomerWalletScreen:41 |
| [doan-kltn-mobile/app/(worker)/(tabs)/_layout.jsx](../../doan-kltn-mobile/app/(worker)/(tabs)/_layout.jsx) | 61 | WorkerTabsLayout:5 |
| [doan-kltn-mobile/app/(worker)/(tabs)/earnings.jsx](../../doan-kltn-mobile/app/(worker)/(tabs)/earnings.jsx) | 33 | ThngkThunhpVScreen:4 |
| [doan-kltn-mobile/app/(worker)/(tabs)/index.jsx](../../doan-kltn-mobile/app/(worker)/(tabs)/index.jsx) | 626 | WorkerDashboardScreen:18 |
| [doan-kltn-mobile/app/(worker)/(tabs)/jobs.jsx](../../doan-kltn-mobile/app/(worker)/(tabs)/jobs.jsx) | 33 | DanhschViclmcnThScreen:4 |
| [doan-kltn-mobile/app/(worker)/(tabs)/notifications.jsx](../../doan-kltn-mobile/app/(worker)/(tabs)/notifications.jsx) | 33 | ThngboThScreen:4 |
| [doan-kltn-mobile/app/(worker)/(tabs)/profile.jsx](../../doan-kltn-mobile/app/(worker)/(tabs)/profile.jsx) | 33 | HsThScreen:4 |
| [doan-kltn-mobile/app/(worker)/_layout.jsx](../../doan-kltn-mobile/app/(worker)/_layout.jsx) | 12 | WorkerLayout:4 |
| [doan-kltn-mobile/app/(worker)/job/[id].jsx](../../doan-kltn-mobile/app/(worker)/job/[id].jsx) | 158 | WorkerJobDetailScreen:9 |
| [doan-kltn-mobile/app/(worker)/verification/face.jsx](../../doan-kltn-mobile/app/(worker)/verification/face.jsx) | 114 | FaceVerificationScreen:11 |
| [doan-kltn-mobile/app/_layout.jsx](../../doan-kltn-mobile/app/_layout.jsx) | 39 | RootLayout:16 |
| [doan-kltn-mobile/app/common/help.jsx](../../doan-kltn-mobile/app/common/help.jsx) | 33 | TrgipHtrHelpScreen:4 |
| [doan-kltn-mobile/app/common/settings.jsx](../../doan-kltn-mobile/app/common/settings.jsx) | 33 | CiththngSettingsScreen:4 |
| [doan-kltn-mobile/app/index.jsx](../../doan-kltn-mobile/app/index.jsx) | 290 | FixGoLoginScreen:45 |

### ai-service

| File | Dòng | Symbols (scan metadata) |
|---|---:|---|
| [ai-service/category_helper.py](../../ai-service/category_helper.py) | 84 | strip_accents:29, normalize_category_key:38, extract_category_from_path:49, match_category_by_keywords:75 |
| [ai-service/clip_classifier.py](../../ai-service/clip_classifier.py) | 146 | _to_tensor:17, _embed_prompts:25, load_clip:33, is_ready:62, _encode_image:66 |
| [ai-service/eval/benchmark.py](../../ai-service/eval/benchmark.py) | 355 | create_sample_images:38, run_benchmark:100, run_tests_with_client:121, do_get:122, do_post:127 |
| [ai-service/eval/classify_dataset.py](../../ai-service/eval/classify_dataset.py) | 152 | evaluate_single_image:34, print_summary_table:86, run_batch_classification:101 |
| [ai-service/eval/eval_cls.py](../../ai-service/eval/eval_cls.py) | 152 | evaluate_test_set:33 |
| [ai-service/main.py](../../ai-service/main.py) | 1130 | decode_image_to_cv2:78, compute_ssim_opencv:122, compute_hist_correlation:156, lifespan:179, CompareBeforeAfterRequest:300 |
| [ai-service/scripts/download_models.py](../../ai-service/scripts/download_models.py) | 110 | download_file:44, main:90 |
| [ai-service/service_catalog.py](../../ai-service/service_catalog.py) | 398 | format_vnd:389, get_services_by_category:394 |
| [ai-service/training/prepare_dataset.py](../../ai-service/training/prepare_dataset.py) | 191 | generate_class_images:70, với:71, build_dataset:146 |
| [ai-service/training/train.py](../../ai-service/training/train.py) | 80 | train_model:27 |

### Phạm vi ngoài source roots

- Backend `test/`: app.e2e-spec.js, concurrency-order-race.test.js, jest-e2e.json; schema và 2 migration SQL đã review riêng.
- Ba package.json/npm lockfile names; Babel/Vite/Expo/EAS configs, Dockerfile/Compose, shell/batch startup/setup/stop, scripts/update-ip.js; không lấy runtime versions từ host.
- Mobile `__tests__`: auth, loginWorker, registerCustomer, registerWorker, customerProfile; web chưa thấy test suite trong inventory.
- `.doc`, README/SETUP/LOGIN_HANDOVER/tiendo và .agents context/rules: tài liệu bối cảnh, không authority cho AS-IS khi khác source.
- Generated dependency/build artifacts, font/image assets, notebook outputs, model/data binaries và live logs không được semantic audit. Không sử dụng dataset/weights filenames để tuyên bố accuracy hoặc model loaded.

## Cập nhật source đồng thời

Trong quá trình review, workspace có sửa đổi ngoài phần tài liệu ở AI catalog/category/main, FastApiAiClient và một dòng OrdersService; thêm `aiFallbackHelper.js`. Đã re-read diff, helper mới và sửa line references. Fallback hiện được extract sang helper thuần, face heuristic vẫn có semantics fail-open, nên findings chính giữ nguyên. Category mapper OrdersService đã nhận thêm slug matching; không coi thiếu slug matching là debt.

Backend client đã tách transport khỏi implementation heuristic, đây là cải thiện SRP cục bộ; trust/degraded policy vẫn nằm trong wrapper fallback. Không sửa hoặc khôi phục các source changes này.

Fingerprint các file đổi đồng thời tại lần cross-check cuối (SHA-256 prefix, không phải nội dung):

| File | Fingerprint |
|---|---|
| `ai-service/category_helper.py` | `4b7ac19a55d250bd` |
| `ai-service/main.py` | `34845ed92ebb7d8b` |
| `ai-service/service_catalog.py` | `aad56b054e587937` |
| `doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js` | `7a4c26dad85c8728` |
| `doan-kltn-backend/src/modules/orders/orders.service.js` | `01e3796f60d04a9e` |
| `doan-kltn-backend/src/infrastructure/external/ai/aiFallbackHelper.js` | `9d6fd55152f42033` |

## Kiểm tra báo cáo

Đủ 13 Markdown files; kiểm tra tự động 413 source-line references (file tồn tại, dòng trong phạm vi), 950 Markdown links được scan, 8 Mermaid code blocks và 465 source-file inventory rows. Không phát hiện đường dẫn source/tài liệu thiếu hoặc code fence mất cặp. Mermaid chưa render bằng engine riêng, nên syntax/rendering ngoài kiểm tra cấu trúc vẫn NOT VERIFIED. Không chạy application tests. Git baseline được đối chiếu là `188f376`; báo cáo dùng workspace với thay đổi đồng thời đã ghi nhận ở trên, không chỉ HEAD.
