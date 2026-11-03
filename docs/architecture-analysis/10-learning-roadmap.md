# Học Software Architecture từ FixGo

## Mục lục

- [Kiến thức project dạy được](#kiến-thức-project-dạy-được)
- [Tại sao tổ chức như vậy](#tại-sao-tổ-chức-như-vậy)
- [So sánh kiến trúc khác](#so-sánh-kiến-trúc-khác)
- [Roadmap](#roadmap)
- [Năm bài tập refactor](#năm-bài-tập-refactor)

## Kiến thức project dạy được

Project hữu ích vì cho thấy cả cơ chế framework lẫn giới hạn của chúng:

1. **Composition root và DI:** module quyết định object graph; không phải service tự new dependency. Đọc [doan-kltn-backend/src/app.module.js:17](../../doan-kltn-backend/src/app.module.js#L17) — `AppModule`, [doan-kltn-backend/src/modules/orders/orders.module.js:13](../../doan-kltn-backend/src/modules/orders/orders.module.js#L13) — `OrdersModule`.
2. **Layering thực dụng:** controller → service → concrete repository, nhưng ORM vẫn xuất hiện trong application service. Tự phân biệt abstraction “có tên” với boundary thật. [doan-kltn-backend/src/modules/users/users.service.js:6](../../doan-kltn-backend/src/modules/users/users.service.js#L6) — `UsersService`, [doan-kltn-backend/src/modules/orders/orders.service.js:31](../../doan-kltn-backend/src/modules/orders/orders.service.js#L31) — `OrdersService`.
3. **Atomicity khác business correctness:** row lock giải quyết hai thợ tranh cùng order; transaction payout vẫn có thể cộng lặp. [doan-kltn-backend/src/modules/orders/orders.service.js:622](../../doan-kltn-backend/src/modules/orders/orders.service.js#L622) — `acceptOrder`, [doan-kltn-backend/src/modules/orders/orders.service.js:1071](../../doan-kltn-backend/src/modules/orders/orders.service.js#L1071) — `processPayment`.
4. **Contract là kiến trúc:** một field `id` vs `orderId`, User ID vs Profile ID, namespace root vs `/orders` có thể làm hỏng cả flow dù mỗi file nhìn hợp lý. [doan-kltn-mobile/src/features/booking/services/bookingService.js:36](../../doan-kltn-mobile/src/features/booking/services/bookingService.js#L36) — `createBooking`, [doan-kltn-backend/src/modules/customer-home/customer-home.service.js:128](../../doan-kltn-backend/src/modules/customer-home/customer-home.service.js#L128) — `getActiveOrder`.
5. **State machine phải nằm ở write boundary:** transition map không có giá trị bảo vệ nếu active path không gọi nó. [doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js:5](../../doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js#L5) — `validateTransition`, [doan-kltn-backend/src/modules/orders/orders.service.js:800](../../doan-kltn-backend/src/modules/orders/orders.service.js#L800) — `updateStatus`.
6. **Availability có trade-off về trust:** heuristic hợp lý cho suggestion với manual selection, không hợp lý khi tự cấp quyền biometric verification. [doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js:70](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js#L70) — `verifyFace`.
7. **Frontend architecture cũng là architecture:** hook/store/API/storage là những state owners khác nhau; duplicate source of truth cần reconciliation rõ. [doan-kltn-mobile/src/store/useOrderStore.js:3](../../doan-kltn-mobile/src/store/useOrderStore.js#L3) — `useOrderStore`, [doan-kltn-mobile/src/services/storage/orderStorage.js:94](../../doan-kltn-mobile/src/services/storage/orderStorage.js#L94) — `getAllOrders`.
8. **Infrastructure declaration khác runtime guarantees:** có Redis không chứng minh distributed socket; có PostGIS index không chứng minh query dùng index; có YAML không chứng minh CI đang chạy. [doan-kltn-backend/src/modules/orders/orders.gateway.js:48](../../doan-kltn-backend/src/modules/orders/orders.gateway.js#L48) — `afterInit`, [doan-kltn-backend/src/modules/orders/orders.service.js:561](../../doan-kltn-backend/src/modules/orders/orders.service.js#L561) — `Haversine SQL`.

## Tại sao tổ chức như vậy

**INFERRED, không khẳng định ý định tác giả:** Nest feature modules phù hợp nhóm nghiệp vụ auth/orders/workers/admin; Prisma giúp CRUD/transaction nhanh; React hooks cho presentation reuse; Expo file routing giảm config; Python service cho ML libraries khác Node. Source structure hỗ trợ suy luận này, không có ADR chứng minh quyết định và alternatives đã được cân nhắc.

Trade-off quan sát được: tốc độ triển khai và demo fallback đổi lấy duplicated contracts/policy; global Prisma dễ dùng đổi lấy coupling; một backend giúp transaction đơn giản đổi lấy service growth; AI HTTP cho độc lập runtime đổi lấy failure modes/latency. Không suy từ đây rằng developer cố ý bỏ security.

## So sánh kiến trúc khác

Đây là **giải thích TO-BE bằng chữ/pseudocode**, không diagram hiện trạng.

| Approach | Khác AS-IS cụ thể | Khi đáng dùng | Chi phí / lúc chưa nên |
|---|---|---|---|
| Clean Architecture | `AcceptOrder`/`PayOrder` use case chỉ biết domain contracts; Nest controller và Prisma ngoài core | business invariant phức tạp, test độc lập IO cần thiết | thêm interface/mapper; CRUD catalog nhỏ chưa cần đầy đủ bốn layer |
| Hexagonal | domain-owned `OrderStore`, `FaceVerifier`, `PaymentVerifier`, `EventPublisher` ports; Prisma/FastAPI/socket là adapters | nhiều provider hoặc cần swap fake/real và contract test | mỗi port phải giữ semantic ổn định; không thêm một interface cho mỗi class máy móc |
| Onion | domain types/rules trong cùng, application dùng domain; infrastructure phụ thuộc vào inward contracts | muốn enforce inward dependency lâu dài | cần lint/module discipline; chỉ đổi folder không tạo Onion |
| DDD | xác định Order aggregate và invariants; Money/OrderStatus/actor IDs có semantics; payment/fulfillment context ownership | nghiệp vụ phức tạp và thuật ngữ còn xung đột | cần domain knowledge/workshop; không nên biến mọi Prisma row thành aggregate |
| CQRS | read projection riêng cho dashboard có thể tách khỏi write invariant khi có nhu cầu | query model khác write model rõ và complexity tăng | có thể chỉ tách query service, chưa cần bus/eventual consistency |
| Event Sourcing | event stream là source of truth, replay mutable state | yêu cầu audit/replay/history correctness thực sự cần | không phải chỉ thêm history table; migration/event evolution nặng, project chưa có lý do đủ |

Pseudocode **đề xuất**, chưa có trong repo:

```text
PayOrder(actor, orderId, verifiedReceipt)
  authorize actor
  claim expected state atomically
  validate canonical Money amount
  append unique payout business event / ledger entry
  commit once and return stored outcome on repeat
```

Điều cần học ở đây là **invariant và failure semantics trước**, rồi mới chọn abstraction để giữ invariant.

## Roadmap

### Beginner — hiểu một request thật

1. Vẽ lại bootstrap từ `src/main.js` đến AppModule; phân biệt route prefix với doc version.
2. Theo web login từ `LoginForm → AuthProvider → authService → AuthController → AuthService → UsersRepository`. Đọc [runtime](06-runtime-data-flow.md#1-web-login), tự chỉ nơi hash tồn tại và nơi phải loại bỏ trước response.
3. Mở Prisma `User`, `WorkerProfile`, `Order`; viết chính xác ID nào reference model nào. Phân biệt foreign key, primary key và user role.
4. Đọc React `AppProvider`, mobile `RootLayout`, `useOrderStore`; phân biệt app state, server state và device storage.

Tiêu chí đạt: giải thích được một data field đi qua những layer nào bằng file/symbol; không cần nói “Clean” để mô tả.

### Intermediate — invariant, transaction và contract

1. So sánh `OrderWorkflowService.assignWorker` với `OrdersService.acceptOrder`: optimistic conditional update vs pessimistic row lock, bộ status khác nhau.
2. Đọc payment transaction và mô phỏng bằng giấy hai request tuần tự/đồng thời; chỉ ra vì sao unique Payment không đủ.
3. So body binding JavaScript với DTO decorators; giải thích documentation metadata khác runtime validation.
4. Đối chiếu booking response và socket producer/consumer; lập contract table payload/event/namespace.
5. So query Haversine với schema geometry index; học SQL EXPLAIN/index selectivity trong DB giả riêng.

Tiêu chí đạt: viết invariant và test case có thể bắt bug thực, không chỉ test method “được định nghĩa”.

### Advanced — boundaries và vận hành

1. Học idempotency, ledger reconciliation, isolation và lock ordering từ `processPayment`/`acceptOrder`.
2. Học outbox/at-least-once/dedupe từ DB commit → enqueue/emit; phân biệt business retry và transport retry.
3. Threat-model Socket.IO và AI outbound image loading: actor, resource, trust boundary, operation.
4. Tách compute core/transport và đánh giá async blocking của Python; học model warmup/cache/memory-per-process, không suy inference accuracy từ confidence.
5. Viết ADR cho canonical OrderStatus/Wallet ownership; so incremental modularization với clean/hexagonal ports và chi phí migration.
6. Học telemetry/SLO và release compatibility: contract tests, clean migration replay, canary metrics trước scale-out.

Tiêu chí đạt: đề xuất thay đổi có failure analysis, rollout/data compatibility, validation và trade-off; không đo chất lượng bằng số pattern.

### Khi dùng và không dùng pattern đã phát hiện

| Pattern | Dùng khi | Tránh / giữ đơn giản khi |
|---|---|---|
| DI | cần thay integration/provider/test double | helper tính toán thuần không cần container |
| Repository | query lặp/complex hoặc domain persistence boundary | thêm lớp forwarding cho mọi Prisma getter không có policy |
| Service Layer | use case phối nhiều write/check | gom mọi feature vào một God Service |
| Adapter | external protocol/platform khác semantic | adapter tự quyết auth/business success giả khi lỗi |
| DTO/Mapper | kiểm soát input/output và model differences | chỉ khai báo class để Swagger đẹp nhưng không bind runtime |
| Observer/Pub-Sub | UI notifications, async side effects có delivery contract | coi ephemeral emit là durable financial event |
| Builder | cấu hình nhiều optional step như Swagger | object literal đơn giản đã đủ |
| Module shared instance | connection/model reuse theo process | suy rằng nó độc nhất toàn cluster hoặc tự thread-safe |
| Facade wrapper | caller cần thao tác business/payload ổn định | chỉ thêm fallback ID/dữ liệu giả để giấu lỗi contract |

## Năm bài tập refactor

**Chỉ đề xuất, chưa thực hiện.** Mỗi bài nên làm trên sandbox/branch riêng, với fixtures giả; không chạy migration hoặc test ghi dữ liệu vào DB hiện tại.

| Bài tập | File/module và nhiệm vụ | Rationale / kết quả học | Acceptance criteria | Impact / effort / trade-off |
|---|---|---|---|---|
| 1. Canonical order lifecycle | `orders/constants`, validator, OrdersService, customer-home query; chọn một status vocabulary và một customer ID meaning | học invariant ownership và migration compatibility | forbidden transition không write; active order tìm đúng user; map legacy có test; một canonical write path | High / M–L / cần compatibility/backfill thay vì đổi enum tức thời |
| 2. Idempotent payout use case | tách phần `OrdersService.processPayment` thành service hẹp, pure payout math, persistence guarded transaction | học atomicity vs idempotency, money và trust | request lặp/đồng thời chỉ một payout; wrong owner/unsigned receipt reject; DB rollback không ledger mồ côi | Critical / M–L / ledger business key và data reconciliation thêm complexity |
| 3. Booking contract xuyên client-server | `bookingService.createBooking`, `apiClient`, `SocketService`, OrderGateway, queue method | học integration contract, namespace, producer-consumer compatibility | API result.id dùng đúng; server/client cùng namespace/event; unauthorized join reject; queue expansion gọi actual matching/broadcast | High / M / cần release window cho clients cũ |
| 4. AI ports và degraded mode rõ ràng | FastApiAiClient, AiService, FastAPI handlers, mobile aiService mapper | học Adapter/Hexagonal nhỏ, fail-open vs fail-closed và functional core | timeout trả unavailable; face failed không cấp timestamp; suggestion giữ engine; adapter arguments/response được contract test | High / M / giảm availability giả nhưng UX pending/manual cần thiết |
| 5. Tách AdminService theo responsibility | AdminCatalogService/AdminAnalyticsService/AdminUsersService trong monolith; mapper/query hẹp | học SRP/cohesion, composition và tránh over-engineering | controller contract giữ ổn định; fixtures không lẫn User/Profile; metrics không hardcode growth; unit scope không mock toàn AdminService | Medium / M / thêm classes nhưng không thêm network deployment |

Đọc tiếp theo thứ tự: dependency direction → HTTP validation/auth boundaries → relational modeling → transactions/isolation/idempotency → state machines → async delivery → modularity/ports → observability/scale. Dùng [evidence index](11-evidence-index.md) để kiểm tra bất kỳ thuật ngữ nào bằng source thật.
