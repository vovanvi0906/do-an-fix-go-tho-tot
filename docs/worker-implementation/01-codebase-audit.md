# AUD-01 — Audit Worker App

Ngày kiểm tra: 12/11/2026 (Asia/Ho_Chi_Minh). Phạm vi: source tại workspace, không phải xác nhận môi trường production. Git ban đầu sạch. Chỉ tạo tài liệu; không sửa application code, schema, business logic, không chạy migration/seed/commit.

Đã đọc toàn bộ [đặc tả mục tiêu](../../worker-app/worker-app-doc.md), gồm backlog §11, AC-01…25 và checklist §14–15. Các prompt trong tài liệu là nội dung tham khảo; phạm vi thực hiện lấy từ yêu cầu đính kèm: giai đoạn A/B, dừng trước C. Skill [order-flow-qa](../../.agents/skills/order-flow-qa/SKILL.md) chỉ dùng để đối chiếu kịch bản: các route `/api/v1/incident/detect`, `/api/v1/face/verify` và state `ACCEPTED` của skill không khớp source, không coi là contract thật.

## Cách đọc

`DONE`: có implementation và kiểm thử phù hợp đạt; `PARTIAL`: mới một phần; `BUG`: source có hành vi sai; `MISSING`: chưa thấy implementation trong phạm vi đã khảo sát; `NOT_VERIFIED`: chưa có bằng chứng thực thi; `CONFLICT`: khác kiến trúc/nghiệp vụ hiện hành. Một hàng có thể dẫn đến gap chi tiết ở tài liệu 02. Không hàng nghiệp vụ E2E nào được đánh dấu DONE chỉ từ unit test.

## Bản đồ cấu trúc và bằng chứng

| Mã | File / hàm hoặc class | Vai trò / phát hiện |
|---|---|---|
| W1 | [tabs/index.jsx](../../worker-app/app/(worker)/(tabs)/index.jsx), `WorkerDashboardScreen`, `changeAvailability`, `dailyCheckIn`, `handleAcceptOrder` | Online, check-in, offer modal, activeOrder cục bộ; stats/giá/address fallback cố định |
| W2 | [job/[id].jsx](../../worker-app/app/(worker)/job/[id].jsx), `WorkerJobDetailScreen`, `handleStartMoving`, `handleArrived` | Không fetch detail; khởi tạo ASSIGNED, tin params, socket status không handler; AFTER mở Face ID |
| W3 | [face.jsx](../../worker-app/app/(worker)/verification/face.jsx), `handleFinish`; [useFaceVerification](../../worker-app/src/features/face-verification/hooks/useFaceVerification.js), `verify` | Upload selfie, gallery; replace về job không refetch/xác thực lại từ server |
| W4 | [AuthContext](../../worker-app/src/features/auth/context/AuthContext.jsx), `AuthProvider`; [authService](../../worker-app/src/features/auth/services/authService.js), `saveAuthSession`; [tokenRefreshHandler](../../worker-app/src/services/api/tokenRefreshHandler.js), `handleTokenRefresh` | Chặn role khác trước lưu; restore local session; refresh queue khi 401 |
| W5 | [orderService](../../worker-app/src/services/api/orderService.js), [apiClient](../../worker-app/src/services/api/apiClient.js), [faceService](../../worker-app/src/services/api/faceService.js) | REST axios unwrap response.data; chưa có method current order/status chuyên biệt trong worker orderService |
| W6 | [socketService](../../worker-app/src/services/socket/socketService.js), `connect`, `joinRoom`; [GPS hook](../../worker-app/src/hooks/useWorkerLocationTracker.js), `startTracking` | /orders reconnect/rejoin, không auth token; emit join_room không server handler; GPS nhận user.id thay profile.id |
| W7 | [tabs layout](../../worker-app/app/(worker)/(tabs)/_layout.jsx), `WorkerTabsLayout`; jobs/earnings/notifications/profile cùng thư mục | Expo Router 5 tabs; bốn tab chỉ placeholder. [WorkerLayout](../../worker-app/app/(worker)/_layout.jsx) guard theo auth/role |
| W8 | [useOrderStore](../../worker-app/src/store/useOrderStore.js) | Zustand chứa customer booking flow; không được route worker hiện tại dùng để restore active job; feature orders hooks/store/services phần lớn barrel rỗng |
| B1 | [orders.controller](../../server/src/modules/orders/orders.controller.js), `OrdersController`; [orders.service](../../server/src/modules/orders/orders.service.js), `OrdersService` | Luồng REST thực đang được controller gọi; không ủy quyền FSM chính sang WorkflowService |
| B2 | [order-workflow.service](../../server/src/modules/orders/order-workflow.service.js), `OrderWorkflowService`; [constants](../../server/src/modules/orders/constants/order-status.js); [validator](../../server/src/modules/orders/validators/order-transition.validator.js) | FSM khác B1; method tồn tại không có nghĩa public route đang dùng |
| B3 | [orders.repository](../../server/src/modules/orders/orders.repository.js), `findCurrentOrderForWorker`, `findById` | Active filter thiếu MATCHED/WORKER_EN_ROUTE/AWAITING_ACCEPTANCE; customer.include.user không khớp quan hệ User trong schema |
| B4 | [orders.gateway](../../server/src/modules/orders/orders.gateway.js), `OrderGateway` | Không xác minh JWT/ownership tại connect/join/GPS/admin join; broadcast offer toàn namespace |
| B5 | [workers.service](../../server/src/modules/workers/workers.service.js), `updateAvailability`, `verifyFaceDaily`; [controller](../../server/src/modules/workers/workers.controller.js) | Online kiểm tra approval, ACTIVE, services, GPS, face age; daily AI không fallback HTTP nhưng chưa kiểm tra engine AI |
| B6 | [order-queue.service](../../server/src/modules/orders/order-queue.service.js), `processJob` | Radius expansion gọi method broadcastToNearbyWorkers không có ở gateway; giới hạn attempt 3 dừng ở 11km từ 5km |
| B7 | [payments.service](../../server/src/modules/payments/payments.service.js), `processPaymentSuccess`; [repository](../../server/src/modules/payments/payments.repository.js); [PaymentClient](../../server/src/infrastructure/external/payment/payment.client.js) | Luồng payment legacy không nằm trong AppModule imports; placeholder gateway, method confirmPayment không tồn tại, fields không khớp schema |
| B8 | [admin.service](../../server/src/modules/admin/admin.service.js), `getOrderById`, `updateOrderStatus`, `cancelOrder`, `deleteOrder`; [controller](../../server/src/modules/admin/admin.controller.js) | Sửa state trực tiếp, không cùng FSM; detail dùng quan hệ customer.user sai schema; xóa bằng chứng/lịch sử khi delete |
| D1 | [schema.prisma](../../server/prisma/schema.prisma): Order, OrderImage, Payment, WorkerWallet, Wallet, WalletTransaction, CommissionRecord, FaceVerification | Hai bộ order enums, hai wallet model; không có Quote/WorkSession/Offer/Notification/Dispute entity; ledger chưa unique business key |
| D2 | [init migration](../../server/prisma/migrations/20260827130333_init/migration.sql), [PostGIS migration](../../server/prisma/migrations/20260828165045_add_postgis/migration.sql) | Lịch sử migration chỉ enum đời đầu và Wallet; không đủ tái tạo schema hiện tại (MATCHED/WorkerWallet…) |
| C1 | [TrackingScreen](../../customer-app/src/screens/order/TrackingScreen.jsx), `handlePriceAdjusted`, `respondAdjustmentMutation`; [AcceptanceScreen](../../customer-app/src/screens/order/AcceptanceScreen.jsx), `acceptMutation`; [PaymentReviewScreen](../../customer-app/src/screens/order/PaymentReviewScreen.jsx), `payMutation` | Khách dùng MATCHED/WORKER_EN_ROUTE/COMPLETED/PAID; nghiệm thu set COMPLETED trước trả tiền; ảnh/AI score demo fallback |
| A1 | [adminOrders.service](../../client/src/features/orders/services/adminOrders.service.js), `getOrders`; [OrderDetailModal](../../client/src/features/orders/components/OrderDetailModal.jsx); [OrdersManagementPage](../../client/src/features/orders/pages/OrdersManagementPage.jsx) | Catch API lỗi trả mock orders; UI thiên bộ enum ASSIGNED/WORKER_ARRIVING/AWAITING_CONFIRMATION |
| AI1 | [fastapi-ai.client](../../server/src/infrastructure/external/ai/fastapi-ai.client.js), `verifyFace`, `compareBeforeAfter`; [aiFallbackHelper](../../server/src/infrastructure/external/ai/aiFallbackHelper.js) | Fallback bằng URL sinh verified/confidence/pass |
| AI2 | [main.py](../../ai-service/main.py), `face_verify`, `compare_before_after`, `analyze_before_after_opencv`; [clip_classifier](../../ai-service/clip_classifier.py), `predict_clip_full` | YOLO+CLIP chẩn đoán; YuNet/SFace xác thực; ORB/SSIM/histogram so ảnh; FastAPI vẫn có heuristic success, không chứng minh liveness/chất lượng sửa |

## Ma trận đối chiếu toàn bộ backlog §11

Các mã bằng chứng phía trên ghi đầy đủ file/hàm. Giải pháp là đề xuất, chưa triển khai.

| ID | Yêu cầu | Trạng thái | Bằng chứng từ code | Vấn đề | Giải pháp | Ưu tiên |
|---|---|---|---|---|---|---|
| AUD-01 | Audit xuyên hệ thống | PARTIAL | W1–AI2; test ở 09 | Audit tĩnh hoàn tất; môi trường/E2E chưa xác minh | Dùng bộ tài liệu này và bổ sung runtime evidence | P0 |
| ARC-01 | FSM/actor/terminal | CONFLICT | B1 updateStatus, B2 validator, D1 OrderStatus, C1 | Hai FSM, bypass, hoàn tất trước tiền | Chốt mapping tương thích, policy chung | P0 |
| ARC-02 | History/version/idempotency | PARTIAL | B1 transaction history; D1 OrderStatusHistory | Có history, thiếu version và business dedupe | Additive version/CAS + khóa nghiệp vụ | P0 |
| ORD-01 | Atomic accept + expire | PARTIAL | B1 acceptOrder row lock | Khóa đơn có; thiếu offer deadline/eligibility/khóa worker | Transaction theo worker+order, offer server | P0 |
| ORD-02 | Active/detail thật | BUG | W1 activeOrder, W2, B3 findCurrentOrderForWorker | Không restore, filter thiếu, include sai | Sửa API cũ + fetch focus/startup | P0 |
| ORD-03 | Mutation lifecycle | BUG | B1 updateStatus/markArrived; B2 startWork | Bypass transition, arrive thành IN_PROGRESS, thiếu ảnh/quote guards | Một policy dùng chung API cũ | P0 |
| SYNC-01 | Realtime/refetch/version | BUG | W6 connect; B4 broadcastNewOrderToWorkers | Global broadcast; room chưa auth; emit status vô hiệu; không stale guard | Auth rooms, events từ commit, refetch | P0 |
| FACE-01 | Check-in/step-up | BUG | B5 verifyFaceDaily; B1 verifyFace; AI1/2; W3 | Hai policy, cấp faceVerifiedAt khi failed; heuristic success | Chỉ matching thật/manual approved cấp phiên | P0 |
| UX-01 | Home dữ liệu thật | PARTIAL | W1 WorkerDashboardScreen | Không hydrate online/job, stats giả | API current/profile + summary thật | P0 |
| UX-02 | Offer modal đầy đủ | PARTIAL | W1 countdown; B4 payload | Không expiresAt, không ảnh/schedule/net, address sai key | Server offer snapshot + clock | P0 |
| UX-03 | Detail/timeline/CTA | BUG | W2 WorkerJobDetailScreen | Không detail fetch, fallback PII, sai flow | Snapshot server, allowedActions, timeline | P0 |
| GPS-01 | GPS đúng stage/quyền | BUG | W6; B4 handleWorkerUpdateLocation | User/profile ID khác; client tự chỉ định worker, mất tracking khi unmount | Identity server, stage guards, policy foreground | P0 |
| IMG-01 | BEFORE camera/upload | PARTIAL | W5 uploadImage; B1 createOrder/uploadImage; D1 OrderImage | UI chưa nối; ảnh khách lưu BEFORE; thiếu owner/meta | ISSUE riêng, upload worker có quyền | P0 |
| QUO-01 | Báo giá/duyệt/snapshot | PARTIAL | B1 adjustPrice; C1 respondAdjustmentMutation | Proposal chỉ note/event, accept tin tiền client, lặp cộng giá | Quote version/items persisted + CAS | P0 |
| TIMER-01 | Server clock/pause | PARTIAL | D1 startedAt/completedAt; B1 updateStatus | Chỉ startedAt; không pause/finish session/UI | Timestamp server + session/interval | P0 |
| IMG-02 | AFTER/report | BUG | W2 AFTER CTA; W5 uploadImage | Route Face ID, không report/upload UI | Camera AFTER + report persisted | P0 |
| AI-01 | Compare/manual fallback | BUG | AI1/2; B1 verifyCompletion; C1 | URL fallback sinh đạt; UI 94%/ảnh demo | engine/status/limitations + human review | P0 |
| ACC-01 | Nghiệm thu/rework | BUG | B1 acceptCompletion/disputeOrder; C1 | COMPLETED ngay, thiếu state guard; không rework policy | Awaiting payment sau accept; rework lưu quyết định | P0 |
| PAY-01 | Payment hợp lệ | BUG | B1 processPayment; B7; C1 payMutation | Không owner/status/provider check ở pay; legacy không active | Sandbox rõ ràng + verify settlement + policy | P0 |
| WAL-01 | Commission/ledger | BUG | B1 processPayment; D1 WorkerWallet/Wallet | Repeat pay increment; không unique ledger; commission category field thiếu | Single writer + dedupe + commission snapshot | P0 |
| E2E-01 | Race/restart/25AC | NOT_VERIFIED | server/test/app.e2e-spec.js; concurrency-order-race.test.js | Boot test; race script bypass HTTP, setup lệch schema | Isolated DB + API + thiết bị E2E | P0 |
| EXC-01 | Hủy/sự cố | PARTIAL | B1 cancelOrder; W2 | API có, UI chưa nối; fee hardcode/fallback | Policy và reason/audit, cả hai app nhận event | P1 |
| EXC-02 | Rework/dispute/admin | PARTIAL | B1 disputeOrder; B8 | DISPUTED+history; không ticket/resolution entity/flow | Lưu resolution, guards, evidence read model | P1 |
| OFF-01 | Media queue/retry | MISSING | W2/W3 local imageUri, W6 | Không durable queue/replay policy | Queue ảnh riêng + refetch trước retry | P1 |
| NOT-01 | Inbox/deeplink | MISSING | W7 notifications; D1 | Placeholder; không notification entity | Persist inbox khi event commit | P1 |
| HIST-01 | History/filter | PARTIAL | B1 getMyOrders; W7 jobs | API có, worker tab placeholder | Reuse GET orders, phân trang | P1 |
| EARN-01 | Summary/ledger UI | MISSING | W7 earnings; B5 getProfile | Placeholder, profile.wallet khác WorkerWallet | Read API từ ledger đã đối soát | P1 |
| PROF-01 | Skills/approval/radius | PARTIAL | B5 updateServices/submitApproval; W7 profile | Backend profile/service có; UI thiếu, radius/chứng chỉ thiếu | Reuse profile; chốt matching category vs service | P1 |
| HARD-01 | Security/UX/performance | BUG | B1 upload/pay/schedule; B4; A1; AI1/2 | Ownership/room/fallback/logging chưa đồng nhất | Đẩy quyền core lên P0; polish sau | P1, core P0 |
| NEAR-01 | Việc quanh đây | MISSING | W7 jobs | Placeholder, global offer đang sai | Hoãn, chốt offer-only trước | P2 |
| ADV-01 | Advanced dashboard | MISSING | W1 stats cố định | Chưa có thống kê worker thật | Sau E2E và ledger | P2 |

## Giới hạn xác minh

Database live, schema đã áp dụng, Redis/BullMQ runtime, Cloudinary upload/retention, provider thanh toán thật, chất lượng biometric/liveness, camera/GPS Android/iOS, reconnect/kill/relaunch, kiểm thử 2 thợ/1 khách/Admin: NOT_VERIFIED. Không suy từ code rằng production đã có các bảng hoặc route hoạt động. Không đọc/in secrets, không kết nối DB live để ghi dữ liệu.

Unit checks: 6 backend + 8 worker pass, phạm vi và giới hạn ở [09](09-progress-tracker.md). [08](08-test-plan.md) map đủ AC-01…25; [07](07-implementation-plan.md) là phạm vi đề xuất chờ giao task.
