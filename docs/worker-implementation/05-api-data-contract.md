# API / data / realtime contract

> Cập nhật 12/11/2026: ARC-01 đã triển khai policy/guards/transaction và contract mới; xem [báo cáo ARC-01](10-arc01-report.md). Phần audit/kế hoạch dưới đây được giữ làm baseline lịch sử, không phải tất cả đều là contract hiện hành.


Nguồn: OrdersController, WorkersController, OrdersService, OrderGateway, schema.prisma, worker orderService/apiClient và customer orderService. REST prefix thực `/api` ở server/src/main.js; socket namespace `/orders` không có prefix REST. Đây là contract đọc từ source, runtime NOT_VERIFIED.

## Route hiện có: tái sử dụng trước khi tạo mới

| Method/path (sau /api) | Actor / dữ liệu | Implementation và rủi ro |
|---|---|---|
| POST /auth/login, /auth/refresh | Login emailOrPhone/password, refreshToken | AuthService và worker saveAuthSession; refresh test mock có |
| GET /workers/me | Worker JWT | WorkersService.getProfile; raw profile gồm wallet legacy, faceVerifiedAt/isOnline/workerServices |
| PATCH /workers/status, /workers/me/availability | Worker; `{isOnline,lat,lng}` | updateAvailability kiểm tra online requirements, trả `{message,isOnline}`; không busy guard |
| POST /workers/verify-face-daily | Worker; multipart `image`, limit 5MB | verifyFaceDaily trả controller `{success:true,data:{faceVerifiedAt}}`; chưa expiresAt/engine guard |
| POST /orders | Customer; category/service/GPS/address/note/imageUrl | createOrder lấy giá catalog server, status SEARCHING_WORKER; ảnh khách đang ghi BEFORE |
| GET /orders | JWT; page/limit/status | getMyOrders scope theo user/role, `{data,pagination}`; page>=1, limit<=50 |
| GET /orders/worker/current | Worker JWT | getCurrentWorkerOrder→repository; raw order/null; filter/include sai cần sửa |
| GET /orders/:id | JWT | getOrderById raw order; owner customer/Admin; worker được xem đơn SEARCHING bất kể offer, có PII |
| POST hoặc PATCH /orders/:id/accept | Worker | acceptOrder trả `{success,message,order}` state MATCHED, row lock; chưa offer expiry/busy |
| POST /orders/:id/face-verify[-upload] | Worker; photoUrl hoặc multipart image | verifyFace, chưa ownership order, có bypass verification |
| PATCH /orders/:id/status | Worker; `{status,note?}` | updateStatus chỉ owner assigned; DTO allow WORKER_EN_ROUTE,IN_PROGRESS,AWAITING_ACCEPTANCE,WORKER_ARRIVING,ARRIVED,AWAITING_CONFIRMATION |
| PATCH /orders/:id/arriving | Worker | alias gửi WORKER_EN_ROUTE |
| PATCH /orders/:id/arrived, /start | Worker | cả hai gửi IN_PROGRESS, không giữ ARRIVED riêng |
| PATCH /orders/:id/finish | Worker | alias gửi AWAITING_ACCEPTANCE |
| POST /orders/:id/images | JWT; `{type,url}` | uploadImage chỉ lưu URL, KHÔNG có file interceptor cho binary; chưa owner/role/stage checks |
| POST /orders/:id/verify-completion | JWT; không body | verifyCompletion lấy BEFORE/AFTER mới nhất, gọi FastAPI, lưu after.aiMatchScore; chưa owner, default pass fallback |
| PATCH /orders/:id/adjust-price | JWT; action PROPOSE/ACCEPT/REJECT,additionalPrice,reason,note | adjustPrice; owner checks có nhưng accept tin tiền client, proposal không persisted entity/version |
| POST /orders/:id/accept-completion, PATCH /confirm-completion | Customer | acceptCompletion owner check, ghi COMPLETED không kiểm tra state/payment |
| POST /orders/:id/dispute | Customer; reason/evidenceImages | disputeOrder owner check, DISPUTED + history; không resolution workflow |
| POST /orders/:id/pay | Customer/Admin | processPayment không kiểm tra owner/state/provider, tự PAID + cộng ví |
| PATCH /orders/:id/complete-payment | Admin | Cũng processPayment, không có provider check |
| PATCH /orders/:id/cancel | JWT owner/Admin; reason | cancelOrder reject COMPLETED/PAID/CANCELLED, phí 20% hardcode |
| PATCH /orders/:id/schedule | Customer; scheduledAt | scheduleOrder chưa ownership check, tự SEARCHING_WORKER |
| POST /orders/:id/match | JWT, comment internal nhưng không role cụ thể | matchNearbyWorkers trả candidates/phone; cần scope và internal policy |
| POST /orders/:id/review | Customer; rating/comment | reviewOrder owner + PAID/COMPLETED; legacy COMPLETED cho review trước payment |

Không mount thêm PaymentsModule để “bật payment” trong task worker: AppModule hiện không import module đó; createPaymentUrl example.com, mock-success không auth trong source legacy, repository/method sai schema. Giữ cách phân biệt source tồn tại và route đang được đăng ký.

Response không có envelope toàn cục được đăng ký ở main/AppModule; TransformInterceptor có file nhưng không thấy mount. apiClient chỉ unwrap Axios response.data. Vì vậy W1 res.order đúng với accept hiện tại; không áp `res.data.order` theo phỏng đoán. Chuẩn hóa từng endpoint và test contract trước thay consumers.

## Events hiện tại

| Direction | Event / handler | Payload / gap |
|---|---|---|
| Client→server | order:join/order:leave; aliases join_order/leave_order | `{orderId}`; join không owner/JWT |
| Client→server | admin:orders:join/admin:join | Join admin_orders_room chưa role |
| Client→server | worker:update_location → handleWorkerUpdateLocation | `{orderId,lat,lng,workerId}`; throttle 3s/client/order; không assigned check, workerId do client chỉ định |
| Client→server không handler | join_room; worker:status_update | Worker connect/job đang emit nhưng OrderGateway không subscribe |
| Server→client | order.new, order.created, order:created | payload orderId/id/service/totalPrice/addressText/status/createdAt/order; emit toàn namespace, không expiresAt/countdownSeconds/per-worker distance |
| Server→client | order:status_changed | orderId,status,timestamp và các aliases ở emitStatusChanged; không version/order updatedAt persisted |
| Server→client | order:matched | worker snapshot qua emitOrderMatched; không order.taken event mà home đang nghe |
| Server→client | worker:location_update | lat/lng/orderId/timestamp; hiện phát trước update profile và nuốt lỗi DB |
| Server→client | order:price_adjusted | pending/accepted/rejected và giá; proposal thiếu persistence, reload mất |
| Server→client | order:no_worker_found | timeout + canScheduleLater/canCancelFree; queue runtime chưa verified |

Đích: xác thực socket từ JWT, join room theo server identity, lọc receiver eligible, không tin role/profileId từ client. Events từ commit chứa orderId/status/version/updatedAt; client refetch khi reconnect hoặc packet thiếu version. Giữ aliases đang dùng khi chuyển contract, có test cho customer/admin.

## Schema / dữ liệu

| Entity thật | Đã có | Thiếu / xung đột |
|---|---|---|
| Order | customerId→User, workerId→WorkerProfile, category/service, estimated/final/totalPrice, commissionPercent, startedAt/completedAt, updatedAt | version, travel/arrival/finish/acceptance/paid mốc riêng; price snapshot names/scope; state guards |
| OrderStatusHistory | status,note,changedBy,createdAt + FK order | fromState/requestId/version; hiện một số action chưa dùng FSM chung |
| OrderImage | type ISSUE/BEFORE/AFTER,url,imageUrl,imageType,uploadedAt,aiMatchScore | uploadedBy,checksum,mime/size/storageKey/uploadStatus/source; không có EVIDENCE enum |
| FaceProfile / FaceVerification | reference photo/embedding, verification fields | daily/order flow chính không ghi đầy đủ audit decision/expiry/method; retention NOT_VERIFIED |
| Payment | unique orderId, amount/commissionAmount/workerPayoutAmount,status,paidAt,transactionCode | Unique provider event/ref, signature verification, settled semantics |
| CommissionRecord | unique orderId/paymentId, gross/rate/earnings | processPayment không tạo CommissionRecord |
| WorkerWallet / Wallet | Cả hai có balance; worker profile.getProfile include Wallet | Luồng pay ghi WorkerWallet; chưa read model thống nhất |
| WalletTransaction | workerWallet walletId, optional legacyWalletId/orderId,type PAYOUT/WITHDRAW | Unique business key, immutable adjustment convention; legacy repo dùng workerId/CREDIT không hợp lệ |
| Offer / Quote / WorkSession / Acceptance / Notification / Dispute resolution | Không entity chuyên biệt trong schema | Cần thiết kế additive/reuse history sau audit; chưa tạo schema |

## Contract đề xuất cho task sau (chưa tồn tại)

Snapshot giữ fields cũ, thêm `version`, `updatedAt`, `allowedActions`, `verification:{valid,expiresAt,stepUpRequired}`, media grouped ISSUE/BEFORE/AFTER và trạng thái quote/session/acceptance/payment. Các mutation trả snapshot có xác nhận; lỗi conflict 409 kèm snapshot, precondition có machine code (quyết định 400/422 thống nhất trước rollout).

Idempotency key/operation ID phải có semantics retry cụ thể; hiện chỉ X-Request-ID trong apiClient là trace, không phải dedupe. Nếu dùng header mới, cập nhật CORS allowedHeaders ở main.js. Server tính total/commission/duration, không tin client. Upload binary→storage→metadata sau quyền và xác thực file; nếu thất bại không giả uploaded, cleanup orphan có policy. Các metadata/quote/session mới cần migration review và rollback ở 07.
