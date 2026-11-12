# API và Socket contract

## Transport đang có

REST prefix `/api`: [server/src/main.js:15](../../server/src/main.js#L15). Các bảng dưới viết path **sau prefix**. Customer axios trả trực tiếp `response.data`, không tự unwrap `.data` ở mọi response: [customer-app/src/services/api/apiClient.js:51](../../customer-app/src/services/api/apiClient.js#L51). Không thấy đăng ký TransformInterceptor toàn cục trong main đã đọc; phải kiểm shape từng controller, không suy từ sự tồn tại file interceptor. Socket namespace là `/orders`, không phải `/api/orders`: [server/src/modules/orders/orders.gateway.js:28](../../server/src/modules/orders/orders.gateway.js#L28).

Đường request thực dùng authService.js qua AuthContext, bookingService qua useBooking, orderService cho orders, catalogService/serviceCatalogService cho catalog. Service `auth.service.js` cùng tên miền khác không được dùng để suy contract thay caller thực: [customer-app/src/features/auth/context/AuthContext.jsx:2](../../customer-app/src/features/auth/context/AuthContext.jsx#L2), [customer-app/src/features/booking/hooks/useBooking.js:11](../../customer-app/src/features/booking/hooks/useBooking.js#L11).

## REST inventory đối chiếu

| Method / path | Actor / request chính | Response và ghi chú | Implementation |
|---|---|---|---|
| POST /auth/login | public; emailOrPhone/email, password | accessToken, refreshToken, user | [server/src/modules/auth/auth.controller.js:56](../../server/src/modules/auth/auth.controller.js#L56) |
| POST /auth/register, /auth/register/customer, /auth/register/worker | public; registration fields | user/tokens; OTP proof không enforced trong registerCustomer | [server/src/modules/auth/auth.service.js:75](../../server/src/modules/auth/auth.service.js#L75) |
| POST /auth/google-login, /auth/firebase-google-login | public; idToken | session sau kiểm token provider; provider thật chưa test | [server/src/modules/auth/auth.controller.js:89](../../server/src/modules/auth/auth.controller.js#L89) |
| POST /auth/refresh, /auth/refresh-token | refreshToken | tokens + user | [server/src/modules/auth/auth.service.js:39](../../server/src/modules/auth/auth.service.js#L39) |
| POST /auth/send-phone-otp, /auth/verify-phone-otp | phone; phone+code, purpose reset-password ở verify | expiresIn/cooldown hoặc verified/resetToken | [server/src/modules/auth/otp.controller.js:37](../../server/src/modules/auth/otp.controller.js#L37) |
| POST /auth/send-email-otp, /auth/verify-email-otp | email; email+code | xem OTP service; delivery chưa test | [server/src/modules/auth/otp.controller.js:37](../../server/src/modules/auth/otp.controller.js#L37) |
| POST /auth/reset-password | resetToken,newPassword | message, cập nhật password theo phone token | [server/src/modules/auth/auth.service.js:255](../../server/src/modules/auth/auth.service.js#L255) |
| GET/PUT /users/profile, PATCH /users/update-phone, POST /users/upload-avatar | JWT; profile, phone, multipart avatar | user/profile/avatar; edit-field chưa gọi save API | [server/src/modules/users/users.controller.js:34](../../server/src/modules/users/users.controller.js#L34) |
| GET/PATCH /customers/me; GET/POST/PATCH/DELETE /customers/me/addresses[/id] | CUSTOMER JWT | CRUD profile/address có sẵn; route address placeholder | [server/src/modules/customers/customers.controller.js:31](../../server/src/modules/customers/customers.controller.js#L31) |
| GET /service-categories, /service-categories/tree | public | category list hoặc tree categories.targets.services | [server/src/modules/services/services.controller.js:21](../../server/src/modules/services/services.controller.js#L21) |
| GET /service-targets?categoryId, /services?categoryId&targetId, /services/:id | public | lists/detail | [server/src/modules/services/services.controller.js:21](../../server/src/modules/services/services.controller.js#L21) |
| GET /workers/nearby?lat&lng&radius | optional JWT | nearby workers; không bảo đảm đích danh thợ được book | [server/src/modules/workers/workers.controller.js:41](../../server/src/modules/workers/workers.controller.js#L41) |
| GET /customer/home/summary, /v1/customer/home/summary | optional JWT | activeServicesCount,walletBalance,availableVouchersCount | [server/src/modules/customer-home/customer-home.controller.js:50](../../server/src/modules/customer-home/customer-home.controller.js#L50) |
| GET /customer/orders/active, /v1/customer/orders/active; /customer/home/orders/active và /v1/... alias | optional JWT | activeOrder,hasActiveOrder; lỗi User/Profile id + trạng thái CUS-19 | [server/src/modules/customer-home/customer-orders.controller.js:44](../../server/src/modules/customer-home/customer-orders.controller.js#L44) |
| POST /orders/diagnose | public; imageUrl,description,answers | diagnosis outcomes; không tạo order | [server/src/modules/orders/orders.controller.js:57](../../server/src/modules/orders/orders.controller.js#L57) |
| POST /orders/diagnose-upload | public multipart `image`, `description`, `answers` JSON | upload Cloudinary rồi cùng resolver | [server/src/modules/orders/orders.controller.js:77](../../server/src/modules/orders/orders.controller.js#L77) |
| POST /orders | CUSTOMER; categoryId hoặc serviceId,lat,lng,addressText,note,scheduledAt,imageUrl,ai metadata | order root (id,status,estimatedPrice…) + nearbyWorkersCount/message; không phải luôn envelope order | [server/src/modules/orders/orders.service.js:83](../../server/src/modules/orders/orders.service.js#L83) |
| GET /orders?page&limit&status | JWT theo role, CUSTOMER theo User.id | data + pagination; exact status filter chưa tự match alias | [server/src/modules/orders/orders.service.js:275](../../server/src/modules/orders/orders.service.js#L275) |
| GET /orders/:id | customer chủ đơn, worker được gán, admin | snapshot includes worker.user/category/service/statusHistory/images/payment/review | [server/src/modules/orders/orders.service.js:215](../../server/src/modules/orders/orders.service.js#L215) |
| PATCH /orders/:id/cancel | actor có quyền; reason | success,order,changed,cancellationFee | [server/src/modules/orders/orders.service.js:345](../../server/src/modules/orders/orders.service.js#L345) |
| POST /orders/:id/match?radiusKm | ADMIN | candidate list Haversine, chưa là assignment | [server/src/modules/orders/orders.service.js:349](../../server/src/modules/orders/orders.service.js#L349) |
| POST/PATCH /orders/:id/accept | WORKER eligible | success,order,changed; 409 race conflict | [server/src/modules/orders/orders.service.js:425](../../server/src/modules/orders/orders.service.js#L425) |
| POST /orders/:id/face-verify[-upload] | WORKER được gán, đúng stage; photoUrl hoặc multipart image | success,verified,needsManualReview,confidence,verifiedAt; verified:false vẫn success:true nghĩa request processed | [server/src/modules/orders/orders.service.js:437](../../server/src/modules/orders/orders.service.js#L437) |
| PATCH /orders/:id/status | WORKER được gán; status,note | success,order,changed | [server/src/modules/orders/orders.controller.js:315](../../server/src/modules/orders/orders.controller.js#L315) |
| POST /orders/:id/images | JWT owner, worker BEFORE tại ARRIVED/AFTER tại IN_PROGRESS; customer ISSUE lúc searching | request `type,url`; response success,image; **không phải upload file binary** | [server/src/modules/orders/orders.service.js:522](../../server/src/modules/orders/orders.service.js#L522) |
| POST /orders/:id/verify-completion | order access; đủ ảnh, đúng stage | matchScore,passed,isClean,notes,beforeImageUrl,afterImageUrl | [server/src/modules/orders/orders.service.js:545](../../server/src/modules/orders/orders.service.js#L545) |
| POST /orders/:id/accept-completion | CUSTOMER chủ đơn | order.status=AWAITING_PAYMENT | [server/src/modules/orders/orders.service.js:601](../../server/src/modules/orders/orders.service.js#L601) |
| POST /orders/:id/dispute | CUSTOMER; reason,evidenceImages[] | order.status=DISPUTED, history/images, chưa ticket | [server/src/modules/orders/orders.service.js:605](../../server/src/modules/orders/orders.service.js#L605) |
| PATCH /orders/:id/adjust-price | owner role; action PROPOSE/ACCEPT/REJECT | PROPOSE additionalPrice/reason; ACCEPT recorded amount; response status PENDING_APPROVAL/ACCEPTED/REJECTED, price fields; status này **không phải OrderStatus** | [server/src/modules/orders/orders.service.js:693](../../server/src/modules/orders/orders.service.js#L693) |
| PATCH /orders/:id/schedule | CUSTOMER; scheduledAt ISO tương lai | transition same searching; chưa enqueue lại | [server/src/modules/orders/orders.service.js:843](../../server/src/modules/orders/orders.service.js#L843) |
| POST /orders/:id/pay | CUSTOMER/ADMIN | chỉ finalize settlement đã ghi; success,order,changed | [server/src/modules/orders/orders.service.js:610](../../server/src/modules/orders/orders.service.js#L610) |
| POST /orders/:id/review | CUSTOMER; rating 1–5, comment | success,message,review (upsert); sau PAID/COMPLETED | [server/src/modules/orders/orders.service.js:615](../../server/src/modules/orders/orders.service.js#L615) |
| GET /orders/worker/current | WORKER | active order hoặc null; repository dùng ACTIVE_STATUSES | [server/src/modules/orders/orders.service.js:849](../../server/src/modules/orders/orders.service.js#L849) |
| PATCH /orders/:id/arriving, /arrived, /start, /finish, /confirm-completion, /complete-payment | alias compatibility, role theo controller | delegate service/FSM; giữ tới khi kiểm references/version | [server/src/modules/orders/orders.controller.js:496](../../server/src/modules/orders/orders.controller.js#L496) |
| POST /payments/checkout-url | JWT nhưng chưa ownership; orderId,amount,method | paymentUrl example.com, transactionId,status PENDING | [server/src/modules/payments/payments.controller.js:24](../../server/src/modules/payments/payments.controller.js#L24) |
| POST /payments/webhook/mock-success | public hiện tại; orderId,amount,method | gọi broken settlement producer; phải khóa trước khi sửa producer | [server/src/modules/payments/payments.controller.js:24](../../server/src/modules/payments/payments.controller.js#L24) |
| GET /payments/order/:orderId | JWT nhưng chưa ownership | payment include order hoặc null | [server/src/modules/payments/payments.controller.js:24](../../server/src/modules/payments/payments.controller.js#L24) |
| GET /workers/me, PATCH /workers/status hoặc /workers/me/availability | WORKER | profile/availability, tọa độ khi online; daily face trước online | [server/src/modules/workers/workers.controller.js:99](../../server/src/modules/workers/workers.controller.js#L99) |
| POST /workers/verify-face-daily | WORKER; multipart image | success,data.faceVerifiedAt; strict Nest fallback nhưng Python heuristic còn loophole | [server/src/modules/workers/workers.controller.js:99](../../server/src/modules/workers/workers.controller.js#L99) |

## Payload có xung đột phải sửa đồng bộ

| Frontend/legacy | Backend/schema thực tế | Migration đề xuất |
|---|---|---|
| evidencePhotos local URI, upload `imageUrl,type:EVIDENCE` | create chỉ xử lý imageUrl; images cần url,type ISSUE/BEFORE/AFTER | Upload thật rồi attach chuẩn; chuyển caller trước, không thêm enum EVIDENCE |
| paymentMethod trong Zustand | payOrder không gửi method; /pay không thu tiền | Checkout/settlement contract theo provider và cash policy; chỉ method thực hoạt động |
| workerPayout, commissionPct, CREDIT, workerId ở WalletTransaction | workerPayoutAmount, commissionPercent, PAYOUT, walletId; WorkerWallet riêng | Sửa producer theo schema và đối soát legacy, transaction/idempotency trước UI success |
| price hoặc estimatedPrice UI trừ voucher | server bỏ giá client, dùng catalog; finalPrice sau approved adjustment | Frontend render giá server; voucher authoritative contract phải được thiết kế |
| quote chỉ nằm event/modal | GET có history note, chưa structured pending quote | Additive snapshot quote + version, backfill có validation; không silently đổi response cũ |
| workerId từ Home; requestPreviousWorker | create không xử lý assignment yêu cầu này | Đổi CTA phù hợp hiện tại; rematch/preferred-worker là thiết kế riêng cần eligibility |
| currentOrder trong store và navigation params | GET snapshot là root order, worker phone có thể ở worker.user.phone | Adapter canonical chia sẻ hai app, không fallback số điện thoại/ảnh demo |

Các xung đột có bằng chứng và AC tại CUS-04/06/07/14/16/22 trong [06](06-gap-analysis.md). DTO là class JS với @Bind nên cần test HTTP thực rằng ValidationPipe nhận được metatype/whitelist đúng; không khẳng định trường ngoài DTO luôn bị strip khi chưa kiểm chứng.

## Socket contract thực tế

| Hướng / event | Payload / rooms / quyền | Caller và mismatch |
|---|---|---|
| C→S join_room | Payload role/profile/user bị bỏ qua, JWT xác định user:* và worker:* | Client vẫn gửi legacy fields; đây không phải authorization |
| C→S order:join / join_order | orderId, JWT owner/assigned/admin; ack status joined,orderId,room | SocketService lưu rooms và rejoin sau connect; detail route không gọi join |
| C→S order:leave / leave_order | orderId; leave room | Cleanup theo lifecycle; không đánh dấu order canceled |
| C→S worker:update_location | orderId,lat,lng; worker được gán và en-route, finite/range, throttle 3s | workerId payload không cấp quyền; ack ok/throttled/error |
| C→S admin:orders:join / admin:join | ADMIN → admin_orders_room | Không cho khách/thợ tự join admin |
| S→C order:status_changed / order.status | orderId,status,updatedAt nếu caller truyền,timestamp; order room + admin room | Route thật đang nghe `order:$id:status` không tồn tại; canonical listener ở screen rời |
| S→C worker:location_update | orderId,lat,lng,timestamp; order room | Detail handler chưa lọc id; event không phải snapshot bền vững |
| S→C order:matched / order.accepted / order.matched | orderId,worker,timestamp; order room + một số admin aliases | useBooking nghe hai alias nên phải dedup; không có replay khi chưa join kịp |
| S→C order:price_adjusted | orderId + result action (status,additionalPrice,finalPrice/proposedTotal,reason) + timestamp | Không dùng `newTotal` trong comment làm schema; consumer cần phục hồi bằng GET |
| S→C order:no_worker_found | orderId,message,canScheduleLater,canCancelFree,timestamp | Hook route hiện nghe order.timeout thay vì event này |
| S→C order.new | orderId,id,service,totalPrice,addressText,status,createdAt; worker:id theo candidates | Không có countdownSeconds nên Worker dùng 30s local; service có thể thiếu do create include category mà chưa include service |
| S→C order.taken | **Chưa thấy emitter trong gateway đã đọc** | Worker Home nghe để đóng offer; vẫn cần refetch/409 fallback khi đơn đã được người khác nhận |

Bằng chứng auth/room/GPS [server/src/modules/orders/orders.gateway.js:96](../../server/src/modules/orders/orders.gateway.js#L96); emit [server/src/modules/orders/orders.gateway.js:291](../../server/src/modules/orders/orders.gateway.js#L291); match/quote/new [server/src/modules/orders/orders.gateway.js:354](../../server/src/modules/orders/orders.gateway.js#L354); client [customer-app/src/services/socket/socketService.js:13](../../customer-app/src/services/socket/socketService.js#L13); Worker offer [worker-app/app/(worker)/(tabs)/index.jsx:98](../../worker-app/app/(worker)/(tabs)/index.jsx#L98).

### Invariants mục tiêu của contract (chưa là implementation)

API ghi thành công sau DB commit; sự kiện là invalidation cho đúng order. Client không giả success từ socket tùy ý. Snapshot/action trả cùng canonical status và revision/updatedAt; quote decision tham chiếu version; request quan trọng có idempotency key; error có code ổn định và requestId, message Việt dễ hiểu. Timeout hoặc thiếu ack dẫn tới GET kiểm tra, không tạo lại order/ledger. Signature/payment transaction ID không xuất phát từ client. CUS-07/09/10/12 là nơi triển khai và kiểm thử các thay đổi này.
