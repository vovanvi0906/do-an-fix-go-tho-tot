# API, Security, Performance và Operations

## Mục lục

- [API contract](#api-contract)
- [Security](#security)
- [Performance](#performance)
- [Quality và operations](#quality-và-operations)
- [Validation đã và chưa thực hiện](#validation-đã-và-chưa-thực-hiện)

## API contract

**CONFIRMED:** REST-like HTTP `/api`, OpenAPI `/api/docs`; có action endpoints `/accept`, `/pay`, `/schedule` nên không phải pure resource-only REST. Socket.IO root AdminGateway và `/orders` OrderGateway. Không thấy GraphQL/gRPC. [doan-kltn-backend/src/main.js:12](../../doan-kltn-backend/src/main.js#L12) — `bootstrap API prefix`, [doan-kltn-backend/src/main.js:44](../../doan-kltn-backend/src/main.js#L44) — `SwaggerModule`, [doan-kltn-backend/src/modules/orders/orders.controller.js:45](../../doan-kltn-backend/src/modules/orders/orders.controller.js#L45) — `OrdersController`.

| Nhóm | Route prefix | Behavior |
|---|---|---|
| Auth | `/api/auth` | register/login/social/OTP/reset; một số routes public |
| Users / customers / workers | `/api/users`, `/api/customers`, `/api/workers` | profile/addresses/availability/nearby |
| Catalog | `/api/service-categories`, `/api/service-targets`, `/api/services` | public reads, no-store headers |
| Orders | `/api/orders` | all core actions, including direct payout |
| Admin | `/api/admin`, `/api/v1/dashboard`, v1 catalog admin controllers | JWT/RBAC management |
| AI | `/api/ai` | proxy methods có contract/schema drift |
| Logs / health | `/api/logs/client`, `/api/health` | public log append và static liveness |
| AI process | `/ai/*` cùng aliases `/api/v1/ai/*` | diagnose, compare, face verification |

Route versioning hiện là string trong controller, không thấy `app.enableVersioning`; Swagger `.setVersion('1.0.0')` là doc version, không route version enforcement. Alias Auth `v1/auth/...` nằm bên trong Controller `auth`, không suy là `/api/v1/auth/...`. [doan-kltn-backend/src/modules/auth/auth.controller.js:89](../../doan-kltn-backend/src/modules/auth/auth.controller.js#L89) — `googleLogin routes`.

**Validation:** Global ValidationPipe có whitelist/transform; DTO classes có decorators. Nhưng controller JavaScript dùng `@Bind(Body())` với parameter không typed và Babel config không emit design:paramtypes hoặc pipe DTO tường minh. `@ApiBody({type: CreateOrderDto})` chỉ documentation metadata. **CONFIRMED wiring gap từ source; INFERRED nhiều request body sẽ không validate theo DTO; NOT VERIFIED bằng request runtime.** [doan-kltn-backend/src/main.js:23](../../doan-kltn-backend/src/main.js#L23) — `ValidationPipe`, [doan-kltn-backend/.babelrc:1](../../doan-kltn-backend/.babelrc#L1) — `Babel config`, [doan-kltn-backend/src/modules/orders/orders.controller.js:111](../../doan-kltn-backend/src/modules/orders/orders.controller.js#L111) — `createOrder`, [doan-kltn-backend/src/modules/auth/auth.controller.js:31](../../doan-kltn-backend/src/modules/auth/auth.controller.js#L31) — `register`. Không nói “đã bảo vệ input” chỉ vì DTO có annotation.

Pagination được cap ở `getMyOrders`, chưa nhất quán ở toàn catalog/admin params; dashboard activities parseInt không upper/lower bound. [doan-kltn-backend/src/modules/admin/dashboard-v1.controller.js:71](../../doan-kltn-backend/src/modules/admin/dashboard-v1.controller.js#L71) — `getActivities`. Error response shape chưa thống nhất: method trả raw object, `{success:true}`, `{data,pagination}`; custom TransformInterceptor/AllExceptionsFilter **chưa thấy đăng ký**. Mobile unwrap Axios response, web giữ response → service tự `.data`; client contract tolerance nhiều tầng dễ giấu lỗi.

**Idempotency NOT FOUND** cho payout/create booking. Upsert payment không đủ. Retry write cần idempotency key/business key và stored outcome; automatic retry chỉ nên thêm sau boundary đó.

## Security

Các khuyết điểm implementation có evidence dưới đây không đồng nghĩa đã khai thác production. Network exposure, reverse proxy và credential validity **NOT VERIFIED**.

| Chủ đề | Kết luận từ code | Evidence |
|---|---|---|
| Password auth | bcrypt hash cost 10, compare, remove passwordHash ở login/profile | [doan-kltn-backend/src/modules/auth/auth.service.js:52](../../doan-kltn-backend/src/modules/auth/auth.service.js#L52) — `registerCustomer`, [doan-kltn-backend/src/modules/auth/auth.service.js:181](../../doan-kltn-backend/src/modules/auth/auth.service.js#L181) — `login` |
| JWT | expiry check; role/sub từ token, không re-read account status | [doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js:6](../../doan-kltn-backend/src/modules/auth/strategies/jwt.strategy.js#L6) — `JwtStrategy` |
| RBAC | controllers orders/customer/admin có JwtAuthGuard/RolesGuard; không có Roles metadata thì RolesGuard allow | [doan-kltn-backend/src/modules/auth/guards/roles.guard.js:18](../../doan-kltn-backend/src/modules/auth/guards/roles.guard.js#L18) — `canActivate` |
| Object authorization | getOrderById/cancel/review có check actor; uploadImage/verifyCompletion/schedule/processPayment thiếu owner/participant check tại service boundary | [doan-kltn-backend/src/modules/orders/orders.service.js:333](../../doan-kltn-backend/src/modules/orders/orders.service.js#L333) — `getOrderById`, [doan-kltn-backend/src/modules/orders/orders.service.js:868](../../doan-kltn-backend/src/modules/orders/orders.service.js#L868) — `uploadImage`, [doan-kltn-backend/src/modules/orders/orders.service.js:1431](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1431) — `scheduleOrder` |
| Payment proof | `/orders/:id/pay` tự đánh PAID và cộng ví, không gọi payment provider | [doan-kltn-backend/src/modules/orders/orders.service.js:1071](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1071) — `processPayment` |
| Socket auth | connection/join/admin/GPS handler không xác minh JWT hoặc participant, tin workerId payload | [doan-kltn-backend/src/modules/orders/orders.gateway.js:90](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L90) — `handleConnection`, [doan-kltn-backend/src/modules/orders/orders.gateway.js:120](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L120) — `handleJoinOrder`, [doan-kltn-backend/src/modules/orders/orders.gateway.js:181](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L181) — `handleWorkerUpdateLocation` |
| Broadcast privacy | order.new payload có toàn order và address; emit toàn namespace; AdminGateway emit user event toàn root namespace | [doan-kltn-backend/src/modules/orders/orders.gateway.js:393](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L393) — `broadcastNewOrderToWorkers`, [doan-kltn-backend/src/modules/admin/admin.gateway.js:54](../../doan-kltn-backend/src/modules/admin/admin.gateway.js#L54) — `emitUserCreated` |
| Face fail-open | verify thất bại vẫn set faceVerifiedAt; AI và client offline trả verified true heuristic; face detection một ảnh không chứng minh identity/liveness | [doan-kltn-backend/src/modules/orders/orders.service.js:752](../../doan-kltn-backend/src/modules/orders/orders.service.js#L752) — `verifyFace fallback`, [ai-service/main.py:1070](../../ai-service/main.py#L1070) — `face_verify single-face branch`, [ai-service/main.py:1083](../../ai-service/main.py#L1083) — `face_verify heuristic` |
| Secrets | credential literal fallback tồn tại trong Cloudinary config, JWT secret fallback; không trích giá trị hoặc kiểm thử tính hợp lệ | [doan-kltn-backend/src/config/cloudinary.config.js:5](../../doan-kltn-backend/src/config/cloudinary.config.js#L5) — `cloudinary.config`, [doan-kltn-backend/src/modules/auth/auth.module.js:22](../../doan-kltn-backend/src/modules/auth/auth.module.js#L22) — `JwtModule.register` |
| Sensitive logs | mobile API interceptor log config.data (có thể chứa login password/token); OTP service log OTP gửi/verify và phần reset token | [doan-kltn-mobile/src/services/api/apiClient.js:65](../../doan-kltn-mobile/src/services/api/apiClient.js#L65) — `request interceptor`, [doan-kltn-backend/src/modules/auth/otp.service.js:123](../../doan-kltn-backend/src/modules/auth/otp.service.js#L123) — `sendPhoneOtp logging`, [doan-kltn-backend/src/modules/auth/otp.service.js:147](../../doan-kltn-backend/src/modules/auth/otp.service.js#L147) — `verifyPhoneOtp logging` |
| Internal AI authentication | không thấy internal key guard/middleware hoặc header trong actual HTTP client | [ai-service/main.py:281](../../ai-service/main.py#L281) — `FastAPI app`, [doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js:31](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js#L31) — `diagnoseIncident` |
| SSRF / local file | image decoder accepts caller URL, requests.get và local Path.is_file/cv2.imread không host/path allowlist | [ai-service/main.py:78](../../ai-service/main.py#L78) — `decode_image_to_cv2` |
| Rate limiting | OTP per-target cooldown 60s/5 tries có; không thấy global auth/upload/log HTTP rate limiter | [doan-kltn-backend/src/modules/auth/otp.service.js:21](../../doan-kltn-backend/src/modules/auth/otp.service.js#L21) — `OTP configuration`, [doan-kltn-backend/src/modules/logs/logs.controller.js:21](../../doan-kltn-backend/src/modules/logs/logs.controller.js#L21) — `logClientError` |

SSRF là **confirmed unrestricted outbound-fetch primitive** khi request tới decoder và OpenCV có mặt; tác động truy cập mạng nội bộ/đọc dữ liệu cụ thể **NOT VERIFIED**. Decoder đọc local image nhưng không có bằng chứng tự trả arbitrary file contents; không phóng đại thành arbitrary file exfiltration.

**CORS:** Nest `origin:true, credentials:true`, AI wildcard và credentials. Đây là permissive policy CONFIRMED, actual credential theft/CSRF chưa chứng minh; bearer thường gắn header, không thấy auth cookie dùng tự động. [doan-kltn-backend/src/main.js:15](../../doan-kltn-backend/src/main.js#L15) — `enableCors`, [ai-service/main.py:288](../../ai-service/main.py#L288) — `CORSMiddleware`. Nên allowlist origins theo môi trường; không gọi CORS là authorization.

**CSRF:** chưa thấy cookie-auth flow hay CSRF middleware; không đủ kết luận vulnerability từ việc thiếu CSRF token. **XSS:** localStorage bearer tăng impact nếu có XSS; chưa xác nhận exploit HTML injection từ các traced views. Cần review kỹ WebView/HTML maps riêng nếu triển khai. **SQL injection:** query Haversine dùng tagged Prisma parameters; acceptOrder `$queryRawUnsafe` nhưng query constant + `$1` bind argument, không phải bằng chứng injection chỉ vì tên Unsafe. [doan-kltn-backend/src/modules/orders/orders.service.js:650](../../doan-kltn-backend/src/modules/orders/orders.service.js#L650) — `acceptOrder SQL`.

**Upload:** Cloudinary allowed formats và resize có cấu hình; endpoint FileInterceptor chưa thấy explicit file size/count limit hoặc content sniffing. Ảnh output nhỏ không ngăn upload đầu vào quá lớn. Không kiểm tra behavior thật của Cloudinary. Impact potential resource exhaustion; effort nhỏ–vừa thêm policy, trade-off từ chối ảnh lớn hợp lệ và cần UX hướng dẫn.

## Performance

- **Positive:** DB count/list Promise.all, dashboard Promise.allSettled client và aggregate server; face/model load một lần/process; text embeddings được precompute. [doan-kltn-backend/src/modules/orders/orders.service.js:420](../../doan-kltn-backend/src/modules/orders/orders.service.js#L420) — `getMyOrders`, [doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js:34](../../doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js#L34) — `fetchData`, [ai-service/clip_classifier.py:44](../../ai-service/clip_classifier.py#L44) — `load_clip`.
- **Haversine scan:** tính trig hai lần/row và order distance, không dùng geometry GIST. Cost thực tế NOT VERIFIED; cần EXPLAIN và realistic cardinality trước đổi PostGIS query.
- **AI event loop:** `async def` handlers gọi synchronous `requests.get`, OpenCV/YOLO/CLIP trực tiếp; chưa thấy offload thread/process. Khả năng block concurrent requests **INFERRED cao**; throughput chưa benchmark. [ai-service/main.py:106](../../ai-service/main.py#L106) — `decode_image_to_cv2`, [ai-service/main.py:946](../../ai-service/main.py#L946) — `compare_before_after`.
- **Logging:** public endpoint ghi `fs.appendFileSync`, có thể block Node event loop và tăng dung lượng không kiểm soát nếu nhiều requests. [doan-kltn-backend/src/modules/logs/logs.service.js:34](../../doan-kltn-backend/src/modules/logs/logs.service.js#L34) — `writeClientLog`.
- **Refetch amplification:** server emit aliases và namespace-wide+room; dashboard nghe nhiều aliases và mỗi event fetch ba APIs, có khả năng duplicate load. Không có benchmark đủ nói latency tăng bao nhiêu. [doan-kltn-backend/src/modules/orders/orders.gateway.js:265](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L265) — `emitStatusChanged`, [doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js:98](../../doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js#L98) — `handleRealtimeUpdate`.
- **Caching:** OTP TTL/CLIP embeddings/local order storage có thực. Catalog chủ động no-store; chưa thấy Redis response cache. Redis queue `noeviction` tránh mất queue keys do eviction nhưng memory full có thể làm writes fail; Compose giới hạn memory nhỏ. [doan-kltn-backend/src/modules/services/services.controller.js:22](../../doan-kltn-backend/src/modules/services/services.controller.js#L22) — `getCategories headers`, [docker-compose.yml:42](../../docker-compose.yml#L42) — `Redis command`.
- **Horizontal scaling:** mỗi Nest instance có queue worker, local throttleMap và socket rooms; Redis subscriber có nhưng chưa thấy producer/Socket.IO Redis adapter. Không kết luận scale nhiều API instance an toàn chỉ vì có Redis. Không thấy sticky-session/proxy config trong repo.

## Quality và operations

| Mảng | CONFIRMED | Hạn chế / NOT VERIFIED |
|---|---|---|
| Backend unit | OrdersService spec mock providers và should-be-defined | thiếu 4 dependency mới so constructor, không test invariants; chưa chạy để khẳng định exact failure |
| Backend e2e | app init/close test | init Prisma/Redis/queue có side effects; không gọi HTTP assertion |
| Concurrency test | script tạo dữ liệu và simulate atomic update trực tiếp | không đi qua actual acceptOrder, dùng old schema/status, không chứng minh row-lock path |
| Mobile tests | 5 auth/register/profile Jest test files | runtime compatibility/coverage chưa chạy, không thấy order/payment end-to-end suite |
| Web tests | không thấy test script/suite ở manifest/source inventory | build transpile không thay thế API contract/type/security tests |
| AI quality | eval/benchmark/training scripts có | không chạy; metrics artifact cũ không chứng minh current models loaded/accuracy |
| CI | 3 YAML trong `.agents/workflows` | không có `.github/workflows`; không xác nhận workflow được GitHub thực thi |
| Health | backend static ok; AI trả model readiness trạng thái | backend không DB/Redis readiness; không thấy metrics/tracing/alerting integration |
| Deployment | Compose data+AI, AI Dockerfile, local scripts | không thấy backend/web production container/reverse-proxy/release pipeline |
| Observability | Nest Logger/console, Python logger, client remote logger/file | chưa thấy request correlation ID, centralized metrics/traces, retention/redaction |

Evidence: [doan-kltn-backend/src/modules/orders/orders.service.spec.js:12](../../doan-kltn-backend/src/modules/orders/orders.service.spec.js#L12) — `testing providers`, [doan-kltn-backend/test/app.e2e-spec.js:7](../../doan-kltn-backend/test/app.e2e-spec.js#L7) — `beforeAll`, [doan-kltn-backend/test/concurrency-order-race.test.js:15](../../doan-kltn-backend/test/concurrency-order-race.test.js#L15) — `setupTestData`, [.agents/workflows/backend-ci.yml:1](../../.agents/workflows/backend-ci.yml#L1) — `Backend CI draft`, [doan-kltn-backend/src/health/health.controller.js:6](../../doan-kltn-backend/src/health/health.controller.js#L6) — `check`, [ai-service/main.py:1098](../../ai-service/main.py#L1098) — `health_check`.

## Validation đã và chưa thực hiện

Đã: inventory file/source, read dependency/config không dùng env values, trace import và actual caller, đối chiếu schema/migration, scan negative evidence, kiểm tra links/file/line references trong báo cáo và git diff scope. Không chạy lint vì script backend có `--fix`; không chạy e2e/race/setup/start vì có ghi DB/Redis/filesystem hoặc cài package. Không có test pass/fail runtime nào được tuyên bố.

Đề xuất quality gates: contract tests actor/ownership/status/payment repeat trước, rồi schema migration replay trên disposable DB, socket namespace tests, ML degraded-mode assertions. Impact High, effort vừa, trade-off cần isolated fixtures/data lifecycle; không dùng DB dev/prod làm test target.
