# Gap analysis — Customer App FixGo

Ngày audit: 12/11/2026 (Asia/Ho_Chi_Minh). Phân tích mã nguồn working tree, không sửa application code. Các trạng thái bên dưới mô tả mức hoàn thiện hiện tại, không phải trạng thái Order trong DB. Mỗi issue có một mức ưu tiên và có thể chứa nhiều biểu hiện cùng nguyên nhân. Đề xuất không có nghĩa đã triển khai.

P0: chặn hành trình chính, sai sự thật giao dịch/tiền hoặc xác thực quan trọng; phải đóng trước nghiệm thu đồng bộ. P1: lỗi phục hồi, contract, vận hành hoặc UX ảnh hưởng hành trình; P2: chất lượng tương tác. Mức ưu tiên là đánh giá rủi ro qua mã, chưa phải thống kê sự cố production.

<a id="cus-01"></a>

## CUS-01 — Nối luồng đơn hàng vào navigation đang chạy

- **Ưu tiên / hiện trạng:** P0 / BROKEN.
- **Hiện trạng và bằng chứng:** Khách đi được tới chi tiết nhưng không có CTA duyệt giá, nghiệm thu, trả tiền và đánh giá. Bộ sáu screen có code API chưa tạo thành hành trình truy cập được.
- **Mã nguồn:** [customer-app/src/features/home/screens/HomeScreen.tsx:122](../../customer-app/src/features/home/screens/HomeScreen.tsx#L122); [customer-app/app/(user)/order/[id].jsx:434](../../customer-app/app/(user)/order/[id].jsx#L434); [customer-app/src/screens/order/index.js:1](../../customer-app/src/screens/order/index.js#L1); [customer-app/app/_layout.jsx:19](../../customer-app/app/_layout.jsx#L19).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Một chi tiết đơn theo trạng thái; CTA kế tiếp luôn hiện rõ, giữ URL /order/[id].
- **Frontend:** Tích hợp các panel tracking, báo giá, nghiệm thu, payment, review vào route hiện tại; truyền id và hydrate snapshot. Các component dùng React Query cần QueryClientProvider (chưa tìm thấy provider trong app/src). Không chỉ đổi tên navigation.navigate.
- **Backend / migration:** Tái sử dụng GET /orders/:id và các action hiện có; chốt snapshot contract với CUS-06/07.
- **Dependencies:** CUS-05, CUS-06, CUS-07, CUS-11.
- **Acceptance Criteria:**
  - AC-01-1: Từ Home tạo đơn, đi tới mọi bước đến review bằng CTA thực tế.
  - AC-01-2: Deep link /order/:id sau cold start phục hồi đúng panel; thiếu id không gọi demo-order-id.
- **Test Cases:**
  - T01: hai thiết bị đi toàn hành trình, quay lại History ở từng bước.
  - T02: cold start/deep link ở AWAITING_ACCEPTANCE, AWAITING_PAYMENT, COMPLETED.

<a id="cus-02"></a>

## CUS-02 — Dịch vụ khác báo gửi thành công nhưng chỉ lưu local

- **Ưu tiên / hiện trạng:** P0 / MOCK.
- **Hiện trạng và bằng chứng:** Admin và thợ không nhận yêu cầu; khách chờ 20 phút vô ích; khách tự bấm Demo duyệt được.
- **Mã nguồn:** [customer-app/app/(user)/booking/create-booking.jsx:214](../../customer-app/app/(user)/booking/create-booking.jsx#L214); [customer-app/app/(user)/order/[id].jsx:162](../../customer-app/app/(user)/order/[id].jsx#L162); [customer-app/src/services/storage/orderStorage.js:37](../../customer-app/src/services/storage/orderStorage.js#L37).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Chỉ báo đã gửi sau phản hồi backend. Tạm khóa gửi dịch vụ ngoài catalog, giải thích phạm vi đang phục vụ.
- **Frontend:** Bỏ business success local và nút Demo khỏi bản sử dụng thật; giữ bản nháp riêng có nhãn chưa gửi, không trộn History.
- **Backend / migration:** Đối chiếu createOrder hiện cho category-only; nếu muốn quy trình admin tiếp nhận riêng phải thiết kế action và policy trên AWAITING_CONFIRM đã có, sau đó mới triển khai. Không tự thêm PENDING_ADMIN/EXPIRED/REJECTED vào enum.
- **Dependencies:** CUS-01, CUS-04.
- **Acceptance Criteria:**
  - AC-02-1: Không có đơn thành công với id ord-*.
  - AC-02-2: Mất mạng khi gửi không tạo đơn chờ admin giả; yêu cầu được hỗ trợ phải xuất hiện trong DB và admin.
- **Test Cases:**
  - T03: Dịch vụ khác online/offline, đổi máy, qua 20 phút.
  - T04: xác nhận không còn nút Demo ở app thật.

<a id="cus-03"></a>

## CUS-03 — Hủy đơn local tạo hai sự thật

- **Ưu tiên / hiện trạng:** P0 / BROKEN.
- **Hiện trạng và bằng chứng:** Chi tiết gọi updateOrderStatus local; hook matching báo CANCELLED và xóa id trước khi API thành công. Worker có thể tiếp tục nhận/đến trong khi khách nghĩ đã hủy.
- **Mã nguồn:** [customer-app/app/(user)/order/[id].jsx:145](../../customer-app/app/(user)/order/[id].jsx#L145); [customer-app/src/features/booking/hooks/useBooking.js:239](../../customer-app/src/features/booking/hooks/useBooking.js#L239); [server/src/modules/orders/order-workflow.service.js:239](../../server/src/modules/orders/order-workflow.service.js#L239).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Hiện phí và lý do trước xác nhận; đang gửi khóa CTA; lỗi giữ nguyên đơn và cho thử lại.
- **Frontend:** Gọi PATCH cancel, dùng response server; lỗi/timeout refetch cùng id; không reset matching trước ack; cập nhật cache theo snapshot.
- **Backend / migration:** Giữ transaction/FSM; thống nhất preview phí và thực thu, vì hiện phí chỉ nằm cancellationReason/response, chưa chứng minh có ledger thu phí.
- **Dependencies:** CUS-04, CUS-09.
- **Acceptance Criteria:**
  - AC-03-1: API lỗi không hiển thị đã hủy.
  - AC-03-2: Accept đồng thời cancel chỉ có một kết quả hợp lệ; phí phản ánh trạng thái server và khách nhìn thấy trước khi chấp thuận.
- **Test Cases:**
  - T05: offline hủy rồi reconnect.
  - T06: race accept/cancel; retry hủy không tăng phí/lịch sử.

<a id="cus-04"></a>

## CUS-04 — Cache đơn không theo tài khoản và chặn refresh server

- **Ưu tiên / hiện trạng:** P0 / BROKEN.
- **Hiện trạng và bằng chứng:** Key dùng chung @fixgo_user_orders; logout chỉ xóa token/user; màn detail gặp cache thì return trước GET. Người tiếp theo có thể xem dữ liệu cache tài khoản trước; trạng thái và giá cũ tồn tại lâu.
- **Mã nguồn:** [customer-app/src/services/storage/orderStorage.js:11](../../customer-app/src/services/storage/orderStorage.js#L11); [customer-app/app/(user)/order/[id].jsx:68](../../customer-app/app/(user)/order/[id].jsx#L68); [customer-app/src/services/storage/tokenStorage.js:84](../../customer-app/src/services/storage/tokenStorage.js#L84).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Hiện bản lưu gần nhất và nhãn thời gian; luôn kiểm tra lại trước action; logout xóa dữ liệu người dùng.
- **Frontend:** Namespace cache theo userId; clear order store/socket/query/cache khi đổi account; server refresh không bị cache short-circuit; không dùng params làm chứng cứ nghiệp vụ.
- **Backend / migration:** GET ownership hiện có phải giữ nguyên; trả lỗi 403/404 không hiển thị cache người khác.
- **Dependencies:** Không.
- **Acceptance Criteria:**
  - AC-04-1: Tài khoản B không đọc thấy cache A sau logout/login.
  - AC-04-2: Có cache MATCHED nhưng server AWAITING_PAYMENT thì route cập nhật về AWAITING_PAYMENT.
- **Test Cases:**
  - T07: A đặt đơn → logout → B login offline/online.
  - T08: detail có cache stale, API 403/404/500.

<a id="cus-05"></a>

## CUS-05 — Worker thiếu khảo sát, ảnh và hoàn tất công việc

- **Ưu tiên / hiện trạng:** P0 / PARTIAL.
- **Hiện trạng và bằng chứng:** Worker route chỉ cho ARRIVED → IN_PROGRESS, thiếu BEFORE, đề xuất báo giá, AFTER và finish; backend từ chối start thiếu BEFORE, nên hành trình kẹt.
- **Mã nguồn:** [worker-app/app/(worker)/job/[id].jsx:125](../../worker-app/app/(worker)/job/[id].jsx#L125); [server/src/modules/orders/orders.service.js:522](../../server/src/modules/orders/orders.service.js#L522); [server/src/modules/orders/order-workflow.service.js:194](../../server/src/modules/orders/order-workflow.service.js#L194).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Thợ thấy checklist khảo sát → ảnh trước → báo giá → bắt đầu; kết thúc có ảnh sau → gửi khách kiểm tra.
- **Frontend:** Bổ sung thao tác thật vào route worker đang dùng, progress upload/retry và hiển thị lý do bị chặn; không dùng screen bản sao trong customer-app để suy ra worker đã có.
- **Backend / migration:** POST images hiện nhận URL HTTP(S), không nhận file. Chọn cơ chế upload thật có quyền/order/type, trả URL rồi đăng ký ảnh; contract upload cần thiết kế trước. Giữ AFTER gate và timestamp.
- **Dependencies:** CUS-06, CUS-08.
- **Acceptance Criteria:**
  - AC-05-1: Ảnh BEFORE do worker được gán lưu sau ARRIVED mới start được.
  - AC-05-2: AFTER sau startedAt và finish tạo AWAITING_ACCEPTANCE; khách nhận đúng ảnh của đơn.
- **Test Cases:**
  - T09: từng gate thiếu ảnh/sai actor/sai stage/local URI.
  - T10: upload gián đoạn, retry cùng ảnh không tạo bản sao.

<a id="cus-06"></a>

## CUS-06 — Báo giá chưa bắt buộc đồng thuận và từ chối gây bế tắc

- **Ưu tiên / hiện trạng:** P0 / PARTIAL.
- **Hiện trạng và bằng chứng:** Không có quote history vẫn start được; chỉ có điều chỉnh giá tăng lưu bằng note. REJECT nói tiếp tục giá gốc nhưng FSM chặn vì latest quote không được duyệt. Pending quote chỉ sống trong state từ socket ở TrackingScreen.
- **Mã nguồn:** [server/src/modules/orders/order-workflow.service.js:213](../../server/src/modules/orders/order-workflow.service.js#L213); [server/src/modules/orders/orders.service.js:693](../../server/src/modules/orders/orders.service.js#L693); [customer-app/src/screens/order/TrackingScreen.jsx:145](../../customer-app/src/screens/order/TrackingScreen.jsx#L145).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Bảng tổng tiền trước/sau, lý do, phạm vi công việc; CTA Đồng ý báo giá / Không đồng ý; quyết định còn thấy sau mở lại app.
- **Frontend:** Panel trên route thật, tải pending/approved/rejected từ server; xác nhận đúng phiên bản, không suy đoán đồng ý khi đóng modal.
- **Backend / migration:** Giai đoạn đầu chuẩn hóa response pending quote dựa history; quyết định base quote cũng phải có record trước start. Tiếp theo đề xuất entity quote có amount/version/decision và snapshot, migration có backfill kiểm chứng; không tạo order status mới. Chốt REJECT là thỏa thuận lại/hủy hay quay giá gốc có xác nhận mới.
- **Dependencies:** CUS-01, CUS-05.
- **Acceptance Criteria:**
  - AC-06-1: Không thể start nếu chưa có giá/phạm vi được khách chấp thuận.
  - AC-06-2: Duyệt quote cũ sau đề xuất mới trả conflict; reject không hiện hướng dẫn trái FSM; mở lại thấy pending quote.
- **Test Cases:**
  - T11: không quote, pending, accept, reject, hai proposal, hai thiết bị accept.
  - T12: mất event giá rồi restart; giá sau duyệt không cộng hai lần.

<a id="cus-07"></a>

## CUS-07 — Thanh toán không khép kín, contract lệch Prisma

- **Ưu tiên / hiện trạng:** P0 / BROKEN.
- **Hiện trạng và bằng chứng:** Adapter trả example.com; payment repo viết workerPayout thay workerPayoutAmount, walletBalance/workerId/CREDIT sai schema hiện tại, thiếu walletId. Service gọi confirmPayment không tồn tại trong workflow và đọc commissionPct thay commissionPercent. /orders/:id/pay chỉ hoàn tất settlement đã tồn tại; UI chọn phương thức nhưng không gửi nó.
- **Mã nguồn:** [server/src/modules/payments/payments.service.js:33](../../server/src/modules/payments/payments.service.js#L33); [server/src/modules/payments/payments.repository.js:29](../../server/src/modules/payments/payments.repository.js#L29); [server/src/infrastructure/external/payment/payment.client.js:11](../../server/src/infrastructure/external/payment/payment.client.js#L11); [server/prisma/schema.prisma:308](../../server/prisma/schema.prisma#L308); [server/prisma/schema.prisma:368](../../server/prisma/schema.prisma#L368); [server/src/modules/orders/order-workflow.service.js:141](../../server/src/modules/orders/order-workflow.service.js#L141); [customer-app/src/screens/order/PaymentReviewScreen.jsx:48](../../customer-app/src/screens/order/PaymentReviewScreen.jsx#L48).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Chỉ hiện phương thức đã tích hợp; tổng tiền duy nhất từ server; phân biệt đang xử lý, thất bại, đã thu, đã hoàn tất; mở lại không thu lại.
- **Frontend:** Tạo checkout thật, mở payment flow/deep link return, refetch payment/order; không lấy redirect làm success; phục hồi giao dịch pending; review chỉ sau settlement.
- **Backend / migration:** Hợp nhất một service settlement: server tính amount/commissionPercent, verified callback, Payment + WorkerWallet + PAYOUT + commission + FSM trong transaction; unique provider transaction/idempotency key. Phân biệt cash xác nhận thu tiền với payout ví; thiết kế sổ cái trước migration, không cộng ví hai lần. Dùng schema hiện tại làm chuẩn, đối soát dữ liệu legacy trước backfill.
- **Dependencies:** CUS-10, CUS-06.
- **Acceptance Criteria:**
  - AC-07-1: Một callback hợp lệ ghi một Payment và một PAYOUT đúng worker, amount khớp giá đã duyệt.
  - AC-07-2: Callback trùng/lệch thứ tự, client retry, crash sau commit không thu/cộng ví lại; COMPLETED có payment PAID và ledger khớp.
- **Test Cases:**
  - T13: provider sandbox thật success/fail/cancel/pending/return trước webhook.
  - T14: callback 10 lần, hai callback đồng thời, sai amount, rollback từng điểm, tiền mặt theo chính sách đã duyệt.

<a id="cus-08"></a>

## CUS-08 — AI Face và nghiệm thu có mock success ở nhiều tầng

- **Ưu tiên / hiện trạng:** P0 / MOCK.
- **Hiện trạng và bằng chứng:** Backend fallback dựa chuỗi URL; Python thiếu model/lỗi vẫn verified=true .95 hoặc passed=true .92. Daily verify allowFallback:false chỉ chặn fallback phía Nest, không chặn Python heuristic. Nhánh chỉ detect face cũng báo verified; UI nghiệm thu có ảnh stock và điểm 94 mặc định.
- **Mã nguồn:** [server/src/infrastructure/external/ai/aiFallbackHelper.js:10](../../server/src/infrastructure/external/ai/aiFallbackHelper.js#L10); [server/src/infrastructure/external/ai/fastapi-ai.client.js:58](../../server/src/infrastructure/external/ai/fastapi-ai.client.js#L58); [ai-service/main.py:821](../../ai-service/main.py#L821); [ai-service/main.py:924](../../ai-service/main.py#L924); [server/src/modules/workers/workers.service.js:263](../../server/src/modules/workers/workers.service.js#L263); [customer-app/src/screens/order/AcceptanceScreen.jsx:43](../../customer-app/src/screens/order/AcceptanceScreen.jsx#L43).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Hiện Chưa xác thực/Chưa phân tích được; ảnh chưa có phải là empty state; AI chỉ là tham khảo, khách tự kiểm tra công việc.
- **Frontend:** Không dùng ảnh/điểm demo cho bằng chứng; tách xác minh danh tính, giấy tờ và check-in; hiển thị thời điểm và nguồn xác thực đáng tin.
- **Backend / migration:** AI response phải phân biệt identity_match/face_detected/unavailable; strict check engine và kết quả match tham chiếu ở mọi entry. Không sinh thành công khi model/ảnh lỗi. Luồng review thủ công cần record và quyết định có actor; không chỉ log cảnh báo. Kiểm tra thu hồi faceVerifiedAt cũ sau lần thất bại theo policy.
- **Dependencies:** Không.
- **Acceptance Criteria:**
  - AC-08-1: Tắt model hoặc AI lỗi không cấp faceVerifiedAt và không hiển thị AI nghiệm thu đạt.
  - AC-08-2: Có khuôn mặt nhưng không so khớp ảnh đăng ký không được coi là identity verified.
- **Test Cases:**
  - T15: model absent, timeout, reference tải lỗi, selfie người khác/ảnh in.
  - T16: ảnh BEFORE/AFTER thiếu/giống nhau/khác đối tượng; không phát sinh điểm mặc định.

<a id="cus-09"></a>

## CUS-09 — Realtime route thật sai event và không join order room

- **Ưu tiên / hiện trạng:** P1 / BROKEN.
- **Hiện trạng và bằng chứng:** Detail nghe order:${id}:status nhưng server phát order:status_changed/order.status; route không joinOrderRoom. GPS handler không lọc orderId. Socket reconnect rejoin có sẵn nhưng chưa refetch snapshot; server chủ động disconnect khi token hết hạn.
- **Mã nguồn:** [customer-app/app/(user)/order/[id].jsx:101](../../customer-app/app/(user)/order/[id].jsx#L101); [server/src/modules/orders/orders.gateway.js:159](../../server/src/modules/orders/orders.gateway.js#L159); [server/src/modules/orders/orders.gateway.js:291](../../server/src/modules/orders/orders.gateway.js#L291); [customer-app/src/services/socket/socketService.js:29](../../customer-app/src/services/socket/socketService.js#L29).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Nhãn đang cập nhật/mất kết nối; last updated và CTA thử lại; không cho GPS cũ tạo cảm giác vẫn theo dõi trực tiếp.
- **Frontend:** Đúng event, join/ack/leave theo lifecycle, lọc orderId; refetch sau connect/focus/foreground và khi version mới; retry auth khi io server disconnect với token mới. Poll có giới hạn khi socket lỗi.
- **Backend / migration:** Giữ authorization room. Chuẩn hóa updatedAt/version cho cả quote và event; quan sát phát event sau commit thất bại, cân nhắc outbox sau khi chốt yêu cầu.
- **Dependencies:** CUS-04.
- **Acceptance Criteria:**
  - AC-09-1: Mở detail nhận trạng thái trong khi không rời màn; reconnect thấy snapshot mới dù mất event.
  - AC-09-2: GPS/order khác không đổi UI; token expired phục hồi đăng nhập có kiểm soát.
- **Test Cases:**
  - T17: drop/duplicate/reorder event, hai order rooms.
  - T18: ngắt mạng > token TTL, foreground lại, force server disconnect.

<a id="cus-10"></a>

## CUS-10 — Payment endpoints thiếu ownership và webhook mock công khai

- **Ưu tiên / hiện trạng:** P0 / BROKEN.
- **Hiện trạng và bằng chứng:** Checkout/GET payment chỉ JWT, service không nhận actor; webhook/mock-success không guard/chữ ký, tin orderId/amount body. Dù repo hiện lỗi vẫn là đường nguy hiểm khi sửa settlement.
- **Mã nguồn:** [server/src/modules/payments/payments.controller.js:24](../../server/src/modules/payments/payments.controller.js#L24); [server/src/modules/payments/payments.service.js:33](../../server/src/modules/payments/payments.service.js#L33); [server/src/infrastructure/external/payment/payment.client.js:21](../../server/src/infrastructure/external/payment/payment.client.js#L21).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Lỗi truy cập rõ, không lộ thông tin đơn người khác; không cho người dùng tự đánh dấu đã trả.
- **Frontend:** Dùng order của account đang đăng nhập; không gọi mock-success từ app hoặc script demo trên môi trường thật.
- **Backend / migration:** Chặn mock endpoint ngoài môi trường test; checkout/read gọi order-access; webhook thật verify chữ ký + replay + amount/order/state. Không dùng verifyPaymentWebhook hiện luôn isValid:true.
- **Dependencies:** Không.
- **Acceptance Criteria:**
  - AC-10-1: User B không tạo checkout/đọc payment của A.
  - AC-10-2: Unsigned/tampered callback không tạo payment, ledger hay COMPLETED.
- **Test Cases:**
  - T19: B đọc/trả tiền đơn A, worker lạ, anonymous mock callback.
  - T20: signature sai, duplicate transactionId, amount âm/lệch, terminal order.

<a id="cus-11"></a>

## CUS-11 — Dispatch timeout, mở rộng và lịch hẹn không đồng bộ

- **Ưu tiên / hiện trạng:** P1 / BROKEN.
- **Hiện trạng và bằng chứng:** Client timeout 120s nghe order.timeout; server bắt đầu mở rộng sau 180s, phát order:no_worker_found sau tối đa 3 lần (5→7→9→11km). Queue gọi broadcastToNearbyWorkers không có trong gateway nên không phát lại ứng viên. Quét lại chỉ reset state. scheduledAt lưu nhưng create vẫn match ngay; scheduleOrder không xếp lại job.
- **Mã nguồn:** [customer-app/src/features/booking/hooks/useBooking.js:13](../../customer-app/src/features/booking/hooks/useBooking.js#L13); [customer-app/app/(user)/booking/create-booking.jsx:368](../../customer-app/app/(user)/booking/create-booking.jsx#L368); [server/src/modules/orders/order-queue.service.js:134](../../server/src/modules/orders/order-queue.service.js#L134); [server/src/modules/orders/orders.service.js:184](../../server/src/modules/orders/orders.service.js#L184).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Hết timer nghĩa là tìm lâu, không phải đơn đã kết thúc; tiếp tục chờ/đặt lại lịch/hủy cùng id. Thời gian do server cung cấp.
- **Frontend:** Không tạo đơn mới khi quét lại; subscribe no_worker_found; hiển thị giờ hẹn Việt Nam và giữ trạng thái đang tìm theo DB.
- **Backend / migration:** Dùng chung matcher cho lần đầu/mở rộng, schedule job theo scheduledAt, requeue khi đổi lịch, không nhận trước cửa sổ phục vụ đã chốt. Theo dõi lỗi Redis thay vì im lặng mất job; persist thời hạn dispatch cần thiết kế contract.
- **Dependencies:** CUS-09, CUS-12.
- **Acceptance Criteria:**
  - AC-11-1: Mở rộng thực sự gửi tới tập ứng viên mới.
  - AC-11-2: Đổi lịch giữ id và có job đúng hạn; retry không sinh đơn kép; client không kết thúc đơn chỉ vì timer.
- **Test Cases:**
  - T21: fake clock client + Redis/BullMQ thật 3 lần mở rộng.
  - T22: Redis down/restart, hẹn tương lai, đổi lịch, accept đúng lúc timeout.

<a id="cus-12"></a>

## CUS-12 — Tạo đơn thiếu idempotency và kiểm tra eligible worker khi nhận

- **Ưu tiên / hiện trạng:** P1 / PARTIAL.
- **Hiện trạng và bằng chứng:** Create luôn tạo UUID mới; chưa thấy key chống retry sau commit mất response. Accept lock worker/order và kiểm tra online/approval/face/busy có thật, nhưng không đối chiếu kỹ năng/dịch vụ/bán kính/candidate được mời như matcher.
- **Mã nguồn:** [server/src/modules/orders/orders.service.js:83](../../server/src/modules/orders/orders.service.js#L83); [server/src/modules/orders/order-workflow.service.js:181](../../server/src/modules/orders/order-workflow.service.js#L181); [server/src/modules/orders/orders.service.js:385](../../server/src/modules/orders/orders.service.js#L385).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Đang gửi khóa CTA; mất response báo đang kiểm tra yêu cầu, không khuyến khích đặt thêm đơn.
- **Frontend:** Giữ submission key qua retry/restart; tìm lại kết quả trước cho phép gửi lại; xử lý 409 đọc snapshot.
- **Backend / migration:** Đề xuất idempotency key theo customer + payload fingerprint và response lưu bền. Giữ lock, bổ sung eligibility nhất quán candidate/accept; chính sách category rỗng chấp nhận mọi ngành phải xác định lại.
- **Dependencies:** Không.
- **Acceptance Criteria:**
  - AC-12-1: Retry cùng key trả cùng id; khác payload cùng key trả conflict.
  - AC-12-2: Worker không đủ dịch vụ không nhận được dù biết id; hai worker tranh một order chỉ một thành công.
- **Test Cases:**
  - T23: timeout sau commit rồi retry/double tap.
  - T24: accept bằng id đoán được, sai chuyên môn, hai order một worker.

<a id="cus-13"></a>

## CUS-13 — Địa chỉ chữ khác GPS và thiếu đường nhập thay thế

- **Ưu tiên / hiện trạng:** P1 / PARTIAL.
- **Hiện trạng và bằng chứng:** Form dùng địa chỉ mẫu/nhập text nhưng hook lấy GPS vị trí điện thoại; chỉnh text không đổi tọa độ. GPS bị từ chối thì submit bị chặn, route address chỉ placeholder dù backend có CRUD địa chỉ.
- **Mã nguồn:** [customer-app/app/(user)/booking/create-booking.jsx:80](../../customer-app/app/(user)/booking/create-booking.jsx#L80); [customer-app/src/features/booking/hooks/useBooking.js:65](../../customer-app/src/features/booking/hooks/useBooking.js#L65); [customer-app/src/features/booking/hooks/useBooking.js:175](../../customer-app/src/features/booking/hooks/useBooking.js#L175); [customer-app/app/(user)/booking/address.jsx:1](../../customer-app/app/(user)/booking/address.jsx#L1); [server/src/modules/customers/customers.controller.js:45](../../server/src/modules/customers/customers.controller.js#L45).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Sổ địa chỉ thật, nhập địa chỉ + ghim xác nhận trên bản đồ; giải thích đang đặt cho đâu, không mặc định nhà mẫu.
- **Frontend:** Dùng một address object text/lat/lng; tích hợp CRUD hiện có; GPS tùy chọn, luôn có nhập/chọn pin; đổi địa chỉ buộc xác nhận pin; giữ dữ liệu form khi lỗi.
- **Backend / migration:** Validate finite/range/địa chỉ ở service (không chỉ DTO metadata); create hiện parseFloat(lat || pickupLat) làm lat=0 rơi alias. Chốt addressId snapshot và quyền sở hữu trước khi mở rộng DTO.
- **Dependencies:** CUS-04.
- **Acceptance Criteria:**
  - AC-13-1: Địa chỉ gửi worker và điểm match cùng vị trí khách xác nhận.
  - AC-13-2: Từ chối GPS vẫn đặt bằng pin thật; không tự dùng tọa độ/địa chỉ mẫu.
- **Test Cases:**
  - T25: đặt giúp người khác, GPS denied, geocode fail, lat=0, out-of-range.
  - T26: đổi địa chỉ rồi back/restart, sổ địa chỉ account khác.

<a id="cus-14"></a>

## CUS-14 — Ảnh sự cố được chọn nhưng chưa được chuyển lên server

- **Ưu tiên / hiện trạng:** P1 / BROKEN.
- **Hiện trạng và bằng chứng:** evidencePhotos gửi trong create nhưng service backend chỉ dùng imageUrl; uploadEvidencePhoto gửi imageUrl + EVIDENCE trong khi endpoint cần url + ISSUE/BEFORE/AFTER. Chưa tìm thấy caller uploadEvidencePhoto trong submit hiện tại.
- **Mã nguồn:** [customer-app/src/features/booking/services/bookingService.js:24](../../customer-app/src/features/booking/services/bookingService.js#L24); [customer-app/src/features/booking/services/bookingService.js:91](../../customer-app/src/features/booking/services/bookingService.js#L91); [server/src/modules/orders/orders.service.js:170](../../server/src/modules/orders/orders.service.js#L170); [server/src/modules/orders/orders.service.js:522](../../server/src/modules/orders/orders.service.js#L522).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Hiện trạng thái tải ảnh và ảnh đã đính kèm thực; ảnh tùy chọn không làm mất form, ảnh lỗi có thử lại.
- **Frontend:** Upload file thật rồi đăng ký ISSUE bằng url; submit phải đợi ảnh cần gửi; map nhiều ảnh theo contract, không gửi file://.
- **Backend / migration:** Chốt upload/attach nhiều ISSUE với quyền và stage hiện có, giới hạn kích cỡ/mime; không thêm EVIDENCE vào enum chỉ để khớp client cũ.
- **Dependencies:** CUS-05, CUS-13.
- **Acceptance Criteria:**
  - AC-14-1: Ảnh khách chọn xuất hiện trên GET order và Worker.
  - AC-14-2: Upload lỗi không hiển thị đã đính kèm; retry không gắn ảnh đơn khác.
- **Test Cases:**
  - T27: nhiều ảnh, permission denied, ảnh lớn/HEIC, mất mạng giữa upload và attach.

<a id="cus-15"></a>

## CUS-15 — Home trộn catalog thật với dữ liệu uy tín và ưu đãi giả

- **Ưu tiên / hiện trạng:** P1 / MOCK.
- **Hiện trạng và bằng chứng:** Lỗi/empty catalog thay bằng cat-*/svc-*; rating 4.9 và review count tự sinh ngay cả dịch vụ thật; vouchers mock, claim chỉ state nhưng thông báo đã lưu ví; unread count cố định 1. Route price-estimate cũng lấy MOCK_PRICING_TIERS/MOCK_SERVICE_CATEGORIES rồi chuyển serviceId mẫu sang booking, có lời hứa “không phụ phí / báo giá trước 100%” chưa được gate hiện tại bảo đảm. Tree catalog có cache 24 giờ và catch trả cache/[] nên có thể che lỗi và dữ liệu ngừng hoạt động.
- **Mã nguồn:** [customer-app/src/features/home/hooks/useHomeData.ts:268](../../customer-app/src/features/home/hooks/useHomeData.ts#L268); [customer-app/src/features/home/hooks/useHomeData.ts:294](../../customer-app/src/features/home/hooks/useHomeData.ts#L294); [customer-app/src/features/home/hooks/useHomeData.ts:319](../../customer-app/src/features/home/hooks/useHomeData.ts#L319); [customer-app/src/features/home/screens/HomeScreen.tsx:243](../../customer-app/src/features/home/screens/HomeScreen.tsx#L243).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Bằng chứng bổ sung:** [PriceEstimateScreen.tsx:24](../../customer-app/src/features/services/screens/PriceEstimateScreen.tsx#L24), [PriceEstimateScreen.tsx:64](../../customer-app/src/features/services/screens/PriceEstimateScreen.tsx#L64), [serviceCatalog.service.ts:29](../../customer-app/src/features/services/services/serviceCatalog.service.ts#L29).
- **Giải pháp UX/UI:** Empty/error thành thật, retry theo khu vực dữ liệu; không hiển thị sao/lượt đánh giá nếu không có nguồn; chỉ hiện ưu đãi dùng được.
- **Frontend:** Loại fallback giao dịch và số uy tín giả, tách loading/error/empty từng section; claim chỉ success sau server ack hoặc ẩn tính năng.
- **Backend / migration:** Đối chiếu mô hình voucher hiện có trước thiết kế claim/redeem API; giá và giảm trừ phải do backend tính. Không coi summary voucher count là API nhận mã.
- **Dependencies:** CUS-07.
- **Acceptance Criteria:**
  - AC-15-1: Backend unavailable không hiện dịch vụ giả có CTA đặt.
  - AC-15-2: Claim/reopen giữ ưu đãi thật hoặc chức năng được ẩn rõ; không tạo rating/review count.
- **Test Cases:**
  - T28: catalog empty/500, backend partial, refetch không nhảy sang mock.
  - T29: voucher hết hạn/không đúng điều kiện/retry.

<a id="cus-16"></a>

## CUS-16 — Ví và mã giảm giá có giao dịch thành công giả

- **Ưu tiên / hiện trạng:** P1 / MOCK.
- **Hiện trạng và bằng chứng:** Ví khởi tạo 850.000đ, rút chỉ setState rồi báo đã chuyển ngân hàng. Voucher local báo áp dụng; backend create bỏ estimatedPrice client và lấy catalog, nên giá giảm trên UI không phải giá thu.
- **Mã nguồn:** [customer-app/app/(user)/profile/wallet.jsx:57](../../customer-app/app/(user)/profile/wallet.jsx#L57); [customer-app/app/(user)/profile/wallet.jsx:147](../../customer-app/app/(user)/profile/wallet.jsx#L147); [customer-app/app/(user)/profile/vouchers.jsx:152](../../customer-app/app/(user)/profile/vouchers.jsx#L152); [customer-app/src/screens/order/ConfirmOrderScreen.jsx:92](../../customer-app/src/screens/order/ConfirmOrderScreen.jsx#L92); [server/src/modules/orders/orders.service.js:130](../../server/src/modules/orders/orders.service.js#L130).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Khóa nạp/rút/liên kết chưa tích hợp; không hiện số dư/tài khoản mẫu. Hiện tổng tiền server cùng điều kiện giảm thực.
- **Frontend:** Lấy balance đã đối chiếu hoặc ẩn ví khỏi luồng; không hiển thị success tài chính bằng local state; thống nhất voucher shape vì Confirm dùng discountAmount còn Payment dùng type/value.
- **Backend / migration:** Cần thiết kế contract wallet/voucher và accounting sau CUS-07; dùng model có sẵn, không thêm API chưa đối chiếu. Nếu chưa triển khai, để NOT_IMPLEMENTED với CTA thông báo rõ.
- **Dependencies:** CUS-07, CUS-15.
- **Acceptance Criteria:**
  - AC-16-1: Không có thông báo chuyển/nạp tiền nếu chưa có giao dịch server xác nhận.
  - AC-16-2: Giá xác nhận, báo giá, thu tiền, biên nhận giống nhau.
- **Test Cases:**
  - T30: rút/nạp/reload/offline không làm biến động tiền giả.
  - T31: voucher fixed/percent/cap/zero finalPrice và stale price.

<a id="cus-17"></a>

## CUS-17 — Sửa hồ sơ chỉ local và mật khẩu không được xác minh

- **Ưu tiên / hiện trạng:** P1 / MOCK.
- **Hiện trạng và bằng chứng:** Bước nhập mật khẩu chỉ kiểm tra không trống; executeSaveProfile gọi updateUser lưu local và tự set email verified. Không gửi API cập nhật danh tính trong hàm save này.
- **Mã nguồn:** [customer-app/app/(user)/profile/edit-field.jsx:314](../../customer-app/app/(user)/profile/edit-field.jsx#L314); [customer-app/src/features/auth/context/AuthContext.jsx:65](../../customer-app/src/features/auth/context/AuthContext.jsx#L65); [server/src/modules/users/users.controller.js:46](../../server/src/modules/users/users.controller.js#L46).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Lưu hồ sơ thật rồi mới báo thành công; không hỏi mật khẩu nếu backend không xác minh; verified lấy từ server.
- **Frontend:** Tích hợp users/profile/customers/me theo trường; giữ snapshot server; chỉ chuyển bước thành công khi API ack, tải lại profile sau lưu.
- **Backend / migration:** Xác định endpoint theo phone/email/name và ràng buộc OTP proof vào đúng actor/trường/giá trị; không nhận cờ verified do client gửi.
- **Dependencies:** CUS-18.
- **Acceptance Criteria:**
  - AC-17-1: Đổi máy/login lại vẫn thấy dữ liệu vừa lưu.
  - AC-17-2: Sai mật khẩu hoặc chưa có proof không đổi trường nhạy cảm; không tự nâng verified.
- **Test Cases:**
  - T32: bất kỳ mật khẩu khác rỗng, OTP sai/hết hạn, đổi phone/email trùng.
  - T33: lưu offline/timeout rồi refresh profile.

<a id="cus-18"></a>

## CUS-18 — Auth và deep link cần ràng buộc phiên, OTP với nghiệp vụ

- **Ưu tiên / hiện trạng:** P1 / PARTIAL.
- **Hiện trạng và bằng chứng:** Layout user không guard; session restore từ storage, backend action mới kiểm tra ACTIVE. Registration không kiểm tra OTP proof trong service; verifyPhoneOtp trả verified nhưng chỉ reset flow tạo token. Không thể suy từ wizard OTP rằng đăng ký bắt buộc proof phía server.
- **Mã nguồn:** [customer-app/app/(user)/_layout.jsx:4](../../customer-app/app/(user)/_layout.jsx#L4); [customer-app/src/features/auth/context/AuthContext.jsx:21](../../customer-app/src/features/auth/context/AuthContext.jsx#L21); [server/src/modules/auth/auth.service.js:75](../../server/src/modules/auth/auth.service.js#L75); [server/src/modules/auth/otp.service.js:147](../../server/src/modules/auth/otp.service.js#L147); [server/src/modules/orders/orders.service.js:84](../../server/src/modules/orders/orders.service.js#L84).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Cho xem catalog thuận tiện; booking/deep link bảo vệ theo phiên, đăng nhập xong trở lại đúng ý định. Chuẩn hóa 0/+84, lỗi OTP dễ hiểu và giữ form.
- **Frontend:** Guard user/role trên route, đợi restore xong; lưu returnTo được allowlist và draft; reset socket/cache cùng logout. Phân biệt phone có giá trị với phone đã xác minh.
- **Backend / migration:** Ràng buộc OTP proof một lần cho registration/updatePhone khi nghiệp vụ yêu cầu verified; xác minh policy hiện tại, rate limit, không log OTP plaintext (otp.service:123/149). Giữ thông điệp login không lộ account.
- **Dependencies:** CUS-04.
- **Acceptance Criteria:**
  - AC-18-1: Anonymous/worker mở customer action không thực thi; login trở về đúng đơn hợp quyền.
  - AC-18-2: Bypass wizard không đăng ký/cập nhật phone với nhãn verified nếu thiếu proof.
- **Test Cases:**
  - T34: deep link trước/giữa restore, expired token, blocked user, refresh đồng thời.
  - T35: OTP replay/expired/max attempts, +84/0, đăng ký gọi trực tiếp API.

<a id="cus-19"></a>

## CUS-19 — Active order và History không phản ánh đúng snapshot

- **Ưu tiên / hiện trạng:** P1 / BROKEN.
- **Hiện trạng và bằng chứng:** Active query dùng customerProfile.id trong khi create ghi User.id, và chỉ nhiều alias cũ nên bỏ MATCHED/SEARCHING_WORKER/AWAITING_PAYMENT. Home hiện chưa gọi active endpoint. History chỉ trang đầu, merge local không persist server snapshot, ưu tiên estimatedPrice trước finalPrice, thiếu nhãn acceptance/payment/disputed.
- **Mã nguồn:** [server/src/modules/customer-home/customer-home.service.js:116](../../server/src/modules/customer-home/customer-home.service.js#L116); [server/src/modules/orders/orders.service.js:138](../../server/src/modules/orders/orders.service.js#L138); [customer-app/src/services/storage/orderStorage.js:94](../../customer-app/src/services/storage/orderStorage.js#L94); [customer-app/app/(user)/(tabs)/orders.jsx:95](../../customer-app/app/(user)/(tabs)/orders.jsx#L95).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Home có Tiếp tục đơn đang xử lý, History có Đang thực hiện/Đã kết thúc và trạng thái dễ hiểu, xem đủ đơn cũ.
- **Frontend:** Dùng snapshot canonical đầy đủ, phân trang/infinite list và refresh khi focus; giá finalPrice ?? estimatedPrice; ghi cache đúng account; không đẩy disputed vào tìm thợ.
- **Backend / migration:** Sửa query active theo User.id và toàn bộ canonical + alias cần đọc; xác định nhiều active order trả list hay chọn gần nhất, không đổi shape lặng lẽ.
- **Dependencies:** CUS-04, CUS-09.
- **Acceptance Criteria:**
  - AC-19-1: Mỗi canonical state active có thể truy cập lại từ Home/History.
  - AC-19-2: Đơn ngoài 10 bản ghi đầu vẫn xem được; finalPrice=0 không bị thay bằng giá mẫu.
- **Test Cases:**
  - T36: seed >25 đơn đủ trạng thái, profile.id khác user.id.
  - T37: cập nhật finalPrice và mở History offline/online.

<a id="cus-20"></a>

## CUS-20 — GPS không tự phục hồi khi Worker mở lại app

- **Ưu tiên / hiện trạng:** P1 / PARTIAL.
- **Hiện trạng và bằng chứng:** Tracker chỉ start khi bấm di chuyển, cleanup khi unmount; reload WORKER_EN_ROUTE không tự start. Chỉ foreground watcher, chưa chứng minh background tracking. Customer có ETA mặc định và tọa độ mẫu.
- **Mã nguồn:** [worker-app/src/hooks/useWorkerLocationTracker.js:10](../../worker-app/src/hooks/useWorkerLocationTracker.js#L10); [worker-app/src/hooks/useWorkerLocationTracker.js:64](../../worker-app/src/hooks/useWorkerLocationTracker.js#L64); [worker-app/app/(worker)/job/[id].jsx:24](../../worker-app/app/(worker)/job/[id].jsx#L24); [customer-app/app/(user)/order/[id].jsx:66](../../customer-app/app/(user)/order/[id].jsx#L66).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Vị trí cập nhật cách đây…; khi cũ ẩn ETA và chỉ rõ mất định vị; vẫn gọi được số thật nếu có.
- **Frontend:** Worker resume watcher dựa snapshot/state và quyền; Customer hiển thị last seen, không dựng thợ/ETA khi thiếu dữ liệu; throttle route API và ignore response cũ.
- **Backend / migration:** Chốt stale threshold/accuracy/snapshot vị trí, TTL và background policy; không hứa 3 giây khi OS treo app. Giữ ownership + stage GPS hiện có.
- **Dependencies:** CUS-09, CUS-13.
- **Acceptance Criteria:**
  - AC-20-1: Reopen en-route tự phục hồi tracking sau cấp quyền.
  - AC-20-2: Mất GPS/network không hiển thị ETA giả hoặc tọa độ đơn khác.
- **Test Cases:**
  - T38: lock screen/background/kill app Android+iOS, permission revoke, GPS jump.

<a id="cus-21"></a>

## CUS-21 — Dispute không có đường xử lý và hỗ trợ còn placeholder

- **Ưu tiên / hiện trạng:** P1 / PARTIAL.
- **Hiện trạng và bằng chứng:** DISPUTED không có outgoing transition trong FSM; dispute chỉ ghi history/images, không tạo ticket như mô tả controller. Help/notifications chỉ chữ; cam kết liên hệ 15 phút chưa có cơ chế thực thi được thấy.
- **Mã nguồn:** [server/src/modules/orders/constants/order-status.js:59](../../server/src/modules/orders/constants/order-status.js#L59); [server/src/modules/orders/orders.service.js:605](../../server/src/modules/orders/orders.service.js#L605); [customer-app/src/screens/order/AcceptanceScreen.jsx:113](../../customer-app/src/screens/order/AcceptanceScreen.jsx#L113); [customer-app/app/common/help.jsx:1](../../customer-app/app/common/help.jsx#L1); [customer-app/app/(user)/(tabs)/notifications.jsx:1](../../customer-app/app/(user)/(tabs)/notifications.jsx#L1).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Khách biết khiếu nại đã lưu, mã đơn, bằng chứng, kênh liên hệ thật, tiến độ và bước tiếp theo; không hứa SLA chưa vận hành.
- **Frontend:** Đưa từ chối nghiệm thu vào route thật, form reason/evidence, pending/error/retry; support gắn orderId, cho xem history; notifications chưa có inbox thật phải ghi rõ.
- **Backend / migration:** Chốt resolution policy/admin quyền và tiền đang giữ; dùng state hiện hữu nếu đủ, bất cứ chuyển DISPUTED nào phải bổ sung FSM/action + audit history đã duyệt. Thiết kế ticket/notification bền vững sau khi đối chiếu schema, không giả định đã có.
- **Dependencies:** CUS-01, CUS-07.
- **Acceptance Criteria:**
  - AC-21-1: Dispute không tự PAID/COMPLETED; admin có quy trình resolve có ghi lý do/actor và khách thấy kết quả.
  - AC-21-2: Không show support success nếu chưa lưu yêu cầu.
- **Test Cases:**
  - T39: reject acceptance có evidence, offline submit/retry.
  - T40: admin resolve/hoàn tiền/sửa lại theo policy đã chốt, reopen và tra lịch sử.

<a id="cus-22"></a>

## CUS-22 — Chọn đích danh thợ, gọi/chat và thay thợ chưa thành nghiệp vụ

- **Ưu tiên / hiện trạng:** P1 / PARTIAL.
- **Hiện trạng và bằng chứng:** Home truyền workerId nhưng create payload không dùng; requestPreviousWorker chỉ metadata local. Call ở route thật không onPress; chat ở screen rời chỉ Alert. FSM không có rematch transition từ matched; chưa thấy action thay thợ được nối.
- **Mã nguồn:** [customer-app/src/features/home/screens/HomeScreen.tsx:136](../../customer-app/src/features/home/screens/HomeScreen.tsx#L136); [customer-app/src/features/booking/services/bookingService.js:24](../../customer-app/src/features/booking/services/bookingService.js#L24); [customer-app/app/(user)/order/[id].jsx:363](../../customer-app/app/(user)/order/[id].jsx#L363); [customer-app/src/screens/order/TrackingScreen.jsx:202](../../customer-app/src/screens/order/TrackingScreen.jsx#L202); [server/src/modules/orders/constants/order-status.js:48](../../server/src/modules/orders/constants/order-status.js#L48).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Không gọi Đặt lịch thợ này nếu chỉ tìm theo dịch vụ; call phải dùng số thật, chat/thay thợ chỉ mở khi hỗ trợ được.
- **Frontend:** Tạm đổi CTA thành chọn dịch vụ hoặc ẩn; tích hợp tel có xác nhận và fallback đúng số, không số mẫu. Thiết kế thay thợ kèm nguyên nhân/phí/thời gian trước triển khai.
- **Backend / migration:** Đối chiếu dispatch hiện tại rồi thiết kế rematch bằng mutation có lock, thu hồi assignment/rooms, giữ lịch sử, báo cho hai phía; cần migration policy đã duyệt, không thêm trạng thái tự phát.
- **Dependencies:** CUS-11, CUS-12, CUS-21.
- **Acceptance Criteria:**
  - AC-22-1: Mọi CTA hoạt động hoặc nêu rõ chưa hỗ trợ; không gọi số demo.
  - AC-22-2: Nếu phát hành thay thợ: thợ cũ không còn quyền/GPS, khách biết ai đang phụ trách.
- **Test Cases:**
  - T41: workerId truyền từ Home được xử lý đúng kỳ vọng.
  - T42: thợ mất kết nối/bỏ việc, hai thợ race thay thế, kiểm tra room/access cũ.

<a id="cus-23"></a>

## CUS-23 — Xóa danh mục/thợ có thể phá lịch sử và đơn đang chạy

- **Ưu tiên / hiện trạng:** P1 / BROKEN.
- **Hiện trạng và bằng chứng:** Delete order trực tiếp bị khóa, nhưng force delete category còn xóa history/images/orders; delete worker gỡ workerId toàn bộ order mà không FSM/event. Nguy cơ mất chứng cứ hoặc đơn ở trạng thái active không còn thợ; thao tác có thể fail giữa chừng tùy FK.
- **Mã nguồn:** [server/src/modules/admin/admin.service.js:397](../../server/src/modules/admin/admin.service.js#L397); [server/src/modules/admin/admin.service.js:1273](../../server/src/modules/admin/admin.service.js#L1273); [server/src/modules/admin/admin.service.js:849](../../server/src/modules/admin/admin.service.js#L849).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Dịch vụ ngừng nhận đơn mới vẫn xem được biên nhận cũ; thợ thay đổi phải có thông báo và phương án xử lý.
- **Frontend:** Admin hiển thị dependencies và chặn xóa cứng khi có đơn; Customer giữ snapshot tên/giá/ảnh lịch sử.
- **Backend / migration:** Soft delete catalog có references; chặn xóa worker đang active, xử lý assignment có transaction và event; audit dữ liệu mất liên kết trước backfill, không thực thi xóa để kiểm chứng trên DB dev.
- **Dependencies:** CUS-21, CUS-22.
- **Acceptance Criteria:**
  - AC-23-1: Ngừng dịch vụ không xóa đơn/ảnh/payment/history.
  - AC-23-2: Worker đang có đơn không bị gỡ silent; khách và thợ thấy kết quả xử lý hợp lệ.
- **Test Cases:**
  - T43: force delete category có completed/disputed/paid orders trong DB test riêng.
  - T44: delete worker đang di chuyển/đang chờ thanh toán; assert giữ chứng từ.

<a id="cus-24"></a>

## CUS-24 — UI không thống nhất và đánh giá mặc định thiên lệch

- **Ưu tiên / hiện trạng:** P2 / PARTIAL.
- **Hiện trạng và bằng chứng:** Route có header tự vẽ lẫn native header; bộ sáu screen dùng bước 2/6 và palette khác, review mặc định 5 sao + hai tag tốt. Lỗi mạng lộ địa chỉ backend, tiếng Anh/Face ID/AI confidence làm người phổ thông khó hiểu.
- **Mã nguồn:** [customer-app/app/(user)/_layout.jsx:12](../../customer-app/app/(user)/_layout.jsx#L12); [customer-app/src/screens/order/ConfirmOrderScreen.jsx:141](../../customer-app/src/screens/order/ConfirmOrderScreen.jsx#L141); [customer-app/src/screens/order/PaymentReviewScreen.jsx:43](../../customer-app/src/screens/order/PaymentReviewScreen.jsx#L43); [customer-app/src/services/api/apiClient.js:88](../../customer-app/src/services/api/apiClient.js#L88).
- **Rủi ro với người dùng:** Hành vi trên có thể gây hiểu sai, kẹt bước hoặc sai dữ liệu giao dịch; chi tiết tác động nằm trong hiện trạng.
- **Giải pháp UX/UI:** Một CTA chính, nút phụ rõ, chữ dễ đọc, vùng chạm ≥44dp theo mục tiêu thiết kế; gọi Xác minh khuôn mặt, Ảnh trước/sau, Giá tham khảo, Phí phát sinh. Review chưa chọn sao/tag.
- **Frontend:** Tạo token màu/type/spacing/error, dùng SafeArea/keyboard/font scale; loading giữ layout, empty có hướng dẫn, lỗi có retry, success kèm mã đơn. Không đồng nhất header bằng cách xóa route.
- **Backend / migration:** Mã lỗi ổn định cho từng gate, message tiếng Việt; log kỹ thuật qua requestId, không hiển thị host/provider secrets ở UI.
- **Dependencies:** CUS-01.
- **Acceptance Criteria:**
  - AC-24-1: CTA không bị bàn phím che ở 360dp và font scale 1.3/2.0.
  - AC-24-2: Không có 5 sao/tag được gửi nếu khách chưa chọn; lỗi kỹ thuật có thông điệp dễ hiểu và mã tra cứu.
- **Test Cases:**
  - T45: Android/iOS nhỏ, TalkBack/VoiceOver, font lớn, bàn phím.
  - T46: error/loading/empty/success cho mọi panel và sao chưa chọn.
