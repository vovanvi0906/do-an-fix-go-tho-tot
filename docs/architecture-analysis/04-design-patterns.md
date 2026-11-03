# Design Patterns từ source

## Mục lục

- [Pattern được xác nhận](#pattern-được-xác-nhận)
- [Ví dụ và trade-off](#ví-dụ-và-trade-off)
- [Không gán nhãn quá mức](#không-gán-nhãn-quá-mức)

## Pattern được xác nhận

| Pattern | Implementation, vấn đề giải quyết | Giới hạn / lựa chọn khác |
|---|---|---|
| Dependency Injection | Nest module providers và `@Dependencies` nhận concrete services qua constructor, tách tạo object khỏi sử dụng | container coupling và concrete dependency vẫn tồn tại; domain port chỉ cần ở boundary đáng thay thế |
| Builder | `new DocumentBuilder().setTitle().setDescription().setVersion().addBearerAuth().build()` cấu hình Swagger từng bước | library pattern, không phải custom business Builder; object config đơn giản đủ cho nhu cầu nhỏ |
| Repository | UsersRepository/OrdersRepository gói truy vấn persistence theo model | ORM arguments/results vẫn lộ lên service, direct Prisma bypass; không phải domain repository thuần |
| Service Layer | AuthService, WorkersService, OrdersService điều phối business use cases | Orders/Admin quá nhiều responsibilities; tách application services theo invariant thay vì class CRUD duy nhất |
| DTO | RegisterDto/CreateOrderDto có class-validator + Swagger metadata; AI Pydantic request/response | class tồn tại không chứng minh Nest body thực sự validate; cần explicit binding/pipe |
| Mapper | `AdminService._formatUserResponse`; `diagnoseIssueImage` đổi API shape sang mobile model | mapper inline/default values có thể giấu contract lỗi; cân nhắc named mapper thuần |
| Adapter | FastApiAiClient bọc HTTP FastAPI; map `.native/.web` bọc platform khác nhau | client adapter chưa có port và fallback giả thành công; contract tests thường có giá trị hơn thêm abstraction |
| Facade, mức application wrapper | mobile `bookingService.createBooking` che payload mapping và orderService; SocketService che connect/join/on/off | useful convenience, nhưng default ID giả làm sai semantics; bỏ facade nếu chỉ pass-through không có policy |
| Observer / Pub-Sub | socket listeners `.on/.off`; Redis `.subscribe/.on('message')`; BullMQ `.on('failed')` | delivery/replay/ordering không được đảm bảo như durable domain event log |
| Middleware/Pipeline | Axios request/response interceptors, Nest guards/ValidationPipe/FileInterceptor | active pipeline khác file filter chưa wired; response/error schema không đồng nhất |
| Shared module instance, singleton-like | `export const socketService = new SocketService()` và Axios instance module-level | không enforcement GoF Singleton constructor private; một instance/module runtime, không singleton toàn cluster |

Evidence: [doan-kltn-backend/src/modules/orders/orders.service.js:31](../../doan-kltn-backend/src/modules/orders/orders.service.js#L31) — `OrdersService`, [doan-kltn-backend/src/main.js:35](../../doan-kltn-backend/src/main.js#L35) — `DocumentBuilder`, [doan-kltn-backend/src/modules/users/users.repository.js:6](../../doan-kltn-backend/src/modules/users/users.repository.js#L6) — `UsersRepository`, [doan-kltn-backend/src/modules/auth/dto/register.dto.js:12](../../doan-kltn-backend/src/modules/auth/dto/register.dto.js#L12) — `RegisterDto`, [doan-kltn-backend/src/modules/admin/admin.service.js:23](../../doan-kltn-backend/src/modules/admin/admin.service.js#L23) — `_formatUserResponse`, [doan-kltn-mobile/src/services/api/aiService.ts:30](../../doan-kltn-mobile/src/services/api/aiService.ts#L30) — `diagnoseIssueImage`, [doan-kltn-mobile/src/features/booking/services/bookingService.js:13](../../doan-kltn-mobile/src/features/booking/services/bookingService.js#L13) — `createBooking`, [doan-kltn-mobile/src/services/socket/socketService.js:163](../../doan-kltn-mobile/src/services/socket/socketService.js#L163) — `socketService`.

## Ví dụ và trade-off

### 1. Dependency Injection và service/repository

Trích rút gọn nguyên cấu trúc [doan-kltn-backend/src/modules/users/users.service.js:4](../../doan-kltn-backend/src/modules/users/users.service.js#L4) — `UsersService`:

```js
@Injectable()
@Dependencies(UsersRepository)
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async findById(id) {
    return this.usersRepository.findById(id);
  }
}
```

Nest quyết định tạo repository ở composition root. Unit test có thể thay provider; caller không phải tự khởi tạo Prisma. Trade-off: service lookup thuần có thêm lớp forwarding. Không cần interface cho mọi method; các write use case và external boundary thường đáng đầu tư trước.

### 2. Builder trong bootstrap

Trích rút gọn [doan-kltn-backend/src/main.js:35](../../doan-kltn-backend/src/main.js#L35) — `bootstrap Swagger configuration`:

```js
const config = new DocumentBuilder()
  .setTitle('On-Demand Services API (ProjectConnect / FixGo)')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();
```

Dễ đọc với optional configuration, nhưng không được suy rằng Order được tạo bằng Builder. Order hiện được tạo bằng Prisma object literal.

### 3. Repository và transaction scope

[doan-kltn-backend/src/modules/orders/orders.repository.js:269](../../doan-kltn-backend/src/modules/orders/orders.repository.js#L269) — `OrdersRepository.updateStatusWithHistory` dùng `$transaction` cập nhật Order và append history. Vấn đề giải quyết: hai write commit/rollback cùng nhau. Hạn chế: predicate chỉ `id`, nên transaction không ngăn stale pre-check hoặc invalid transition do caller khác. Transaction boundary không thay thế domain invariant.

Pseudocode tương ứng, **không phải trích nguyên code**:

```js
return prisma.$transaction(async tx => {
  const order = await tx.order.update({ where: { id }, data: { status } });
  await tx.orderStatusHistory.create({ data: { orderId: id, status } });
  return order;
});
```

### 4. Adapter và fallback

[doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js:70](../../doan-kltn-backend/src/infrastructure/external/ai/fastapi-ai.client.js#L70) — `verifyFace` chuyển method call sang JSON HTTP; khi response lỗi/offline trả heuristic. Lợi ích: Orders không biết fetch serialization. Trade-off nghiêm trọng: wrapper trộn transport, classification và policy “thành công”; timeout chưa có; nguồn degraded bị mất ở caller.

Thay thế phù hợp hơn cho face/payment: adapter trả explicit `unavailable` để service quyết định pending/reject. Với chẩn đoán gợi ý không có quyền hạn, fallback thủ công có thể phù hợp hơn fail hard. Đây là **đề xuất**, không mô tả AS-IS.

### 5. Observer và cleanup

[doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js:93](../../doan-kttn-frontend/src/features/dashboard/hooks/useDashboardData.js#L93) — `useDashboardData realtime effect` đăng ký nhiều event và trả cleanup `.off`. Tách producer khỏi UI refresh. Producer lại emit alias đôi; subscriber nghe cả alias nên một logical update có thể refetch nhiều lần. Cần event contract và debounce/coalescing khi đo thấy cần; effort nhỏ, đổi lại thêm window dữ liệu hơi trễ.

### 6. DTO / Mapper

[doan-kltn-mobile/src/services/api/aiService.ts:71](../../doan-kltn-mobile/src/services/api/aiService.ts#L71) — `diagnoseIssueImage response mapping` đổi `suggestedCategoryName` thành `categoryName`, nhiều price fields thành `estimatedPrice`. Đây là Mapper có thực, dù không có class tên Mapper. Default `||` có thể thay confidence 0 bằng confidence cao hơn. Nên mapping thuần, dùng nullish semantics hợp lý và explicit missing data; effort nhỏ, tác động correctness vừa.

### 7. Singleton-like lifecycle

[doan-kltn-backend/src/infrastructure/database/prisma.module.js:4](../../doan-kltn-backend/src/infrastructure/database/prisma.module.js#L4) — `PrismaModule` đăng ký provider global; [ai-service/main.py:179](../../ai-service/main.py#L179) — `lifespan` nạp model một lần mỗi process, [ai-service/clip_classifier.py:13](../../ai-service/clip_classifier.py#L13) — `module model state` giữ embedding cache. Đây là shared lifecycle có lợi cho RAM/connection reuse; không chứng minh GoF Singleton và mỗi process vẫn có bản model riêng. Đổi lấy startup cost và shared mutable model thread-safety cần kiểm chứng khi đổi concurrency.

## Không gán nhãn quá mức

| Pattern kiểm tra | Kết luận chính xác |
|---|---|
| Factory / Abstract Factory | NOT FOUND custom object-creation family. `NestFactory.create` là framework bootstrap API; không đủ chứng minh domain Factory |
| Decorator | CONFIRMED dùng syntax decorators Nest/class-validator; **NOT FOUND** custom GoF wrapper giữ cùng interface và bổ sung behavior |
| Proxy | NOT FOUND custom behavioral Proxy; file `authStore.js` re-export gọi mình là proxy nhưng thực chất compatibility barrel |
| Composite | NOT FOUND uniform leaf/composite operation contract; category tree là data hierarchy |
| Strategy | INFERRED dạng algorithm selection với CLIP/YOLO/heuristic, không thấy interchangeable strategy object/interface; không khẳng định GoF Strategy |
| State | CONFIRMED finite-state transition table trong legacy workflow, **NOT FOUND** GoF State object hierarchy; main OrdersService còn bypass validator |
| Command | BullMQ job là serialized work item (command-like); NOT FOUND command handler hierarchy/bus của application |
| Chain of Responsibility | guard/interceptor framework pipeline có tính chất chain; NOT FOUND custom linked handler chain |
| Template Method / Mediator | NOT FOUND custom implementation; kế thừa PrismaClient/PassportStrategy không đủ chứng minh Template Method của project |
| Unit of Work | CONFIRMED Prisma transaction scope; NOT FOUND custom UoW identity map/change tracking abstraction |
| Dependency Inversion | NOT FOUND domain-owned abstraction được dùng nhất quán; DI không đủ để xác nhận DIP |
| Event Bus | CONFIRMED Redis subscriber và socket events; NOT FOUND application domain event bus/outbox |
| Specification | NOT FOUND composable domain predicates/criteria object; Prisma `where` đơn thuần không đủ |
| Result / Either | NOT FOUND typed/tagged result protocol nhất quán; `{success:true}` và exception không tương đương Either |

State evidence: [doan-kltn-backend/src/modules/orders/constants/order-status.js:14](../../doan-kltn-backend/src/modules/orders/constants/order-status.js#L14) — `VALID_STATUS_TRANSITIONS`, [doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js:5](../../doan-kltn-backend/src/modules/orders/validators/order-transition.validator.js#L5) — `validateTransition`. Algorithm selection evidence: [ai-service/main.py:70](../../ai-service/main.py#L70) — `CLASSIFIER_MODE`, [ai-service/main.py:392](../../ai-service/main.py#L392) — `diagnose`. Các NOT FOUND giới hạn trong source inventory; không suy luận internals thư viện chưa đọc.

### Cập nhật SRP tại integration client

Tại lần đối chiếu cuối, `FastApiAiClient` đã delegate heuristic sang [aiFallbackHelper.js:4](../../doan-kltn-backend/src/infrastructure/external/ai/aiFallbackHelper.js#L4) — `getFallbackDiagnosis`, cùng `getFallbackCompare` và `getFallbackFaceVerify` (dòng 61/70). Helper này làm computational branch dễ đọc/test hơn; policy trả thành công giả khi face integration lỗi vẫn cần đánh giá riêng. Đây là thay đổi source đồng thời, không do báo cáo thực hiện.
