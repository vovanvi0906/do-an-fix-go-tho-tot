# UX/UI review theo màn hình

Đánh giá từ JSX/styles/logic; **chưa render hay kiểm trên thiết bị**. Độ tương phản, tràn chữ, hiệu năng animation, accessibility và cảm giác thao tác là NOT_VERIFIED tới khi chạy matrix ở 09. Những thiếu handler/mock được xác định trực tiếp qua code. Các CTA/trạng thái mục tiêu bên dưới là đề xuất.

## UX-01 — Login / app index / auth/login

- **Mục tiêu / Primary CTA:** Vào tài khoản; CTA Đăng nhập.
- **Dữ liệu bắt buộc và tùy chọn:** Email/SĐT + mật khẩu; social là lựa chọn khác.
- **Bước dư / nội dung khó hiểu / UI:** Đã có API và token restore. Cần giữ intent booking sau auth; không ép chọn vai trò nhiều lần. Lỗi 401 dễ hiểu, không mất identifier.
- **Loading, Empty, Error, Success:** Loading khóa submit; empty là form chưa nhập; error giữ input; success theo user server và returnTo hợp lệ.
- **Phục hồi / điểm có thể kẹt:** Restore trước redirect; token refresh thất bại về login, draft và id hợp quyền còn dùng lại; CUS-18.
- **Bằng chứng:** [customer-app/app/index.jsx:55](../../customer-app/app/index.jsx#L55); xem issue được dẫn để đối chiếu frontend/backend.

## UX-02 — Register customer / social onboarding

- **Mục tiêu / Primary CTA:** Tạo tài khoản hoặc bổ sung liên hệ; CTA Tiếp tục / Hoàn tất.
- **Dữ liệu bắt buộc và tùy chọn:** Tên và phone theo nhu cầu liên hệ; email/password theo phương thức đăng ký; OTP proof nếu tuyên bố verified.
- **Bước dư / nội dung khó hiểu / UI:** Wizard có OTP nhưng server register chưa ràng buộc proof. Giảm nhập lại tên/phone sau social, giải thích vì sao cần số liên hệ.
- **Loading, Empty, Error, Success:** Loading theo bước; empty hướng dẫn định dạng Việt Nam; error OTP tại ô nhập, cooldown server; success chỉ sau lưu server.
- **Phục hồi / điểm có thể kẹt:** Giữ draft/bước, không lưu OTP/mật khẩu thô; resend không reset toàn form; CUS-18.
- **Bằng chứng:** [customer-app/app/(auth)/register-customer.jsx:175](../../customer-app/app/(auth)/register-customer.jsx#L175); xem issue được dẫn để đối chiếu frontend/backend.

## UX-03 — Forgot password

- **Mục tiêu / Primary CTA:** Lấy lại tài khoản; CTA Gửi mã → Xác minh → Đổi mật khẩu.
- **Dữ liệu bắt buộc và tùy chọn:** Phone, OTP, resetToken, password mới; không cần AI/booking.
- **Bước dư / nội dung khó hiểu / UI:** Có API reset thật. Chuẩn hóa +84/0, hiển thị còn bao lâu để gửi lại, tránh phải quay lại login giữa các bước.
- **Loading, Empty, Error, Success:** Pending theo request; empty hướng dẫn; expired/attempt error có đường gửi lại; success chuyển login.
- **Phục hồi / điểm có thể kẹt:** ResetToken hết hạn phải xin OTP mới rõ ràng; SMS delivery NOT_VERIFIED.
- **Bằng chứng:** [customer-app/app/(auth)/forgot-password.jsx:102](../../customer-app/app/(auth)/forgot-password.jsx#L102); xem issue được dẫn để đối chiếu frontend/backend.

## UX-04 — Home / Discovery

- **Mục tiêu / Primary CTA:** Tìm dịch vụ; CTA Chọn việc cần làm hoặc Chụp ảnh nếu chưa biết.
- **Dữ liệu bắt buộc và tùy chọn:** Không cần GPS để tra catalog; GPS tùy chọn để tìm thợ gần.
- **Bước dư / nội dung khó hiểu / UI:** AI hero, map, voucher và catalog cạnh tranh chú ý; sao/review tự sinh và mẫu che lỗi. Ưu tiên nhóm dịch vụ, AI là trợ giúp.
- **Loading, Empty, Error, Success:** Có skeleton/error/empty components nhưng fallback mock che lỗi section; cần retry từng phần và data truth.
- **Phục hồi / điểm có thể kẹt:** Focus refetch hiện có; bảo toàn query khi trở lại, không toàn màn skeleton khi chỉ refresh; CUS-15/19.
- **Bằng chứng:** [customer-app/src/features/home/screens/HomeScreen.tsx:248](../../customer-app/src/features/home/screens/HomeScreen.tsx#L248); xem issue được dẫn để đối chiếu frontend/backend.

## UX-05 — Category modal

- **Mục tiêu / Primary CTA:** Chọn đúng việc cần làm; CTA Chọn dịch vụ.
- **Dữ liệu bắt buộc và tùy chọn:** Category; target là Thiết bị / Khu vực; service.
- **Bước dư / nội dung khó hiểu / UI:** Có filter target + search trên tree; thuật ngữ kỹ thuật cần tên thông dụng và mô tả triệu chứng. Không bắt qua toàn bộ cấp khi đã có service từ search.
- **Loading, Empty, Error, Success:** Có loading, catch log chưa thành inline error/retry; phân biệt không có kết quả với không tải được.
- **Phục hồi / điểm có thể kẹt:** Giữ lựa chọn/search khi đóng mở, reset dữ liệu khi đổi category để tránh service cũ; CUS-15/24.
- **Bằng chứng:** [customer-app/src/features/home/hooks/useCategoryDetailModal.ts:20](../../customer-app/src/features/home/hooks/useCategoryDetailModal.ts#L20); xem issue được dẫn để đối chiếu frontend/backend.

## UX-06 — select-service wizard

- **Mục tiêu / Primary CTA:** Chọn nhóm → thiết bị → việc; CTA Tiếp tục/chọn dịch vụ.
- **Dữ liệu bắt buộc và tùy chọn:** Category, target, service thật.
- **Bước dư / nội dung khó hiểu / UI:** Đường chọn đủ ba cấp tồn tại; back nên giữ lựa chọn, search cho người không biết tên chính xác. Không lặp lại ba bước khi service đã xác định.
- **Loading, Empty, Error, Success:** Loading có state; error chỉ log; empty cần xem nhóm khác/retry và không hiện giá mẫu.
- **Phục hồi / điểm có thể kẹt:** Draft cục bộ không phải order; reload chưa có persist được thấy; CUS-13/24.
- **Bằng chứng:** [customer-app/src/features/services/hooks/useSelectServiceWizard.ts:13](../../customer-app/src/features/services/hooks/useSelectServiceWizard.ts#L13); xem issue được dẫn để đối chiếu frontend/backend.

## UX-07 — Price list / price estimate

- **Mục tiêu / Primary CTA:** Hiểu khoảng tiền; CTA Chọn dịch vụ này.
- **Dữ liệu bắt buộc và tùy chọn:** Service và đơn vị tính; tham số ước tính theo UI.
- **Bước dư / nội dung khó hiểu / UI:** Price-list dùng catalog nhưng price-estimate render mock pricing/services và CTA đẩy id mẫu sang booking (CUS-15). Tra giá khác báo giá khảo sát: ghi rõ từ/đến, vật tư/phí đã gồm hay chưa, không gọi ước tính là tổng chắc chắn.
- **Loading, Empty, Error, Success:** Mục tiêu: load catalog có retry/empty/error theo contract thật; price-estimate hiện mock không có chu kỳ fetch thật. Success là chọn được service, chưa phải booking thành công.
- **Phục hồi / điểm có thể kẹt:** Return về booking giữ service id; giá cuối lấy server; cần visual kiểm tra thực tế.
- **Bằng chứng:** [customer-app/app/(user)/price-list.jsx:20](../../customer-app/app/(user)/price-list.jsx#L20); xem issue được dẫn để đối chiếu frontend/backend.

## UX-08 — AI Scan modal

- **Mục tiêu / Primary CTA:** Mô tả tình trạng qua ảnh; CTA Chụp/chọn ảnh → trả lời → chọn dịch vụ.
- **Dữ liệu bắt buộc và tùy chọn:** Ảnh nếu dùng AI; câu trả lời triệu chứng; description tùy chọn.
- **Bước dư / nội dung khó hiểu / UI:** Có permission, scan generation chống response cũ; chờ animation tối thiểu 2.2s làm dư thời gian. Không buộc AI trước đặt tay.
- **Loading, Empty, Error, Success:** Scanning/result có; error alert; unavailable/manual phải hướng chọn tay, không hiển thị nhận diện thành công nếu chưa có.
- **Phục hồi / điểm có thể kẹt:** Đóng modal reset ảnh/kết quả; nếu cần giữ draft phải hỏi lại rõ; upload retry không dùng kết quả cũ; CUS-08/14.
- **Bằng chứng:** [customer-app/src/features/home/components/AiScanModal.tsx:184](../../customer-app/src/features/home/components/AiScanModal.tsx#L184); xem issue được dẫn để đối chiếu frontend/backend.

## UX-09 — Booking chuẩn create-booking

- **Mục tiêu / Primary CTA:** Xác nhận gọi thợ tới đúng nơi; CTA Tìm thợ / Đặt lịch.
- **Dữ liệu bắt buộc và tùy chọn:** Service, địa chỉ+pin, liên hệ, giờ hẹn nếu chọn; note/ảnh tùy chọn.
- **Bước dư / nội dung khó hiểu / UI:** Form nhập tên/phone nhưng payload không snapshot hai trường như form; isFreeSurvey/requestPreviousWorker chưa thực thi. Không hứa free survey/đích danh khi backend không biết.
- **Loading, Empty, Error, Success:** Submit pending/error có; cần field error thay alert chung; success chỉ server id. GPS denied hiện chặn mà không có map pin thật.
- **Phục hồi / điểm có thể kẹt:** Form mất state khi kill; key gửi lại/orderId cần persist sau ack; CUS-12/13/14/22.
- **Bằng chứng:** [customer-app/app/(user)/booking/create-booking.jsx:184](../../customer-app/app/(user)/booking/create-booking.jsx#L184); xem issue được dẫn để đối chiếu frontend/backend.

## UX-10 — Dịch vụ khác

- **Mục tiêu / Primary CTA:** Yêu cầu ngoài catalog; CTA chỉ Gửi nếu đã hỗ trợ thật.
- **Dữ liệu bắt buộc và tùy chọn:** Mô tả và địa chỉ thực; không tự tạo giá cố định.
- **Bước dư / nội dung khó hiểu / UI:** Hiện lưu local và báo chờ admin 20 phút. Tạm khóa gửi hoặc chuyển chọn catalog, không hứa đã gửi.
- **Loading, Empty, Error, Success:** Local success/timeout không phản ánh backend; draft có nhãn chưa gửi và đường chỉnh sửa.
- **Phục hồi / điểm có thể kẹt:** Không tự expire order DB bằng đồng hồ máy; CUS-02.
- **Bằng chứng:** [customer-app/app/(user)/booking/create-booking.jsx:221](../../customer-app/app/(user)/booking/create-booking.jsx#L221); xem issue được dẫn để đối chiếu frontend/backend.

## UX-11 — booking/address, booking/confirm

- **Mục tiêu / Primary CTA:** Chọn địa điểm / xác nhận; CTA Lưu vị trí / Xác nhận.
- **Dữ liệu bắt buộc và tùy chọn:** Address object thật; summary server.
- **Bước dư / nội dung khó hiểu / UI:** Hai route chỉ placeholder. Không coi là address picker hoặc confirm đã xong; giữ compatibility rồi triển khai/redirect có kiểm tra references.
- **Loading, Empty, Error, Success:** Chưa có loading/empty/error/success nghiệp vụ. Cần sổ địa chỉ, map pin và summary có retry.
- **Phục hồi / điểm có thể kẹt:** Draft trở về form không mất service; CUS-01/13.
- **Bằng chứng:** [customer-app/app/(user)/booking/address.jsx:1](../../customer-app/app/(user)/booking/address.jsx#L1); xem issue được dẫn để đối chiếu frontend/backend.

## UX-12 — Radar / WorkerFound / Timeout trong route

- **Mục tiêu / Primary CTA:** Biết đơn còn tìm không; CTA Tiếp tục chờ, đổi lịch hoặc hủy.
- **Dữ liệu bắt buộc và tùy chọn:** Server orderId, worker khi đã matched.
- **Bước dư / nội dung khó hiểu / UI:** Timer local 120s, thông báo mở rộng +5km không khớp queue +2km; Quét lại chỉ reset. FOUND auto redirect làm WorkerFound chỉ lướt qua.
- **Loading, Empty, Error, Success:** Searching có animation; no-worker cần lý do thật và lựa chọn cùng id; lỗi cancel không được success.
- **Phục hồi / điểm có thể kẹt:** Reopen phải hydrate từ GET; socket event trước join có thể mất, cần poll/fetch; CUS-09/11.
- **Bằng chứng:** [customer-app/app/(user)/booking/create-booking.jsx:339](../../customer-app/app/(user)/booking/create-booking.jsx#L339); xem issue được dẫn để đối chiếu frontend/backend.

## UX-13 — order/[id]: theo dõi hiện dùng

- **Mục tiêu / Primary CTA:** Biết ai tới, tiến độ gì; CTA phù hợp state.
- **Dữ liệu bắt buộc và tùy chọn:** Order snapshot + worker thật; location tùy dữ liệu.
- **Bước dư / nội dung khó hiểu / UI:** Timeline luôn coi đã phân bổ khi không awaiting, kể cả còn searching; tên/sao/ETA mẫu và call không handler gây hiểu sai. Bỏ câu Admin đã duyệt khi chưa có event đó.
- **Loading, Empty, Error, Success:** Loading có; GET error bị log và UI tiếp tục fallback. Empty 404/403 phải rõ và quay History; success là snapshot server.
- **Phục hồi / điểm có thể kẹt:** Cache short-circuit, event sai và không room; CUS-01/04/09/20/22.
- **Bằng chứng:** [customer-app/app/(user)/order/[id].jsx:387](../../customer-app/app/(user)/order/[id].jsx#L387); xem issue được dẫn để đối chiếu frontend/backend.

## UX-14 — Survey / quote panel mục tiêu trên detail

- **Mục tiêu / Primary CTA:** Hiểu việc và tiền trước sửa; CTA Đồng ý báo giá / Không đồng ý.
- **Dữ liệu bắt buộc và tùy chọn:** BEFORE, phạm vi, line items/tổng tiền, điều kiện vật tư, quyết định khách.
- **Bước dư / nội dung khó hiểu / UI:** Chưa có panel trên route thật; TrackingScreen rời có modal từ event. Báo giá không được chỉ bật modal một lần rồi mất.
- **Loading, Empty, Error, Success:** Loading snapshot; empty là chưa có báo giá, worker đang khảo sát; error retry; success lưu decision/version.
- **Phục hồi / điểm có thể kẹt:** Mở lại thấy pending/approved/rejected, giá mới; từ chối có thỏa thuận lại/hủy theo policy; CUS-06.
- **Bằng chứng:** [customer-app/src/screens/order/TrackingScreen.jsx:145](../../customer-app/src/screens/order/TrackingScreen.jsx#L145); xem issue được dẫn để đối chiếu frontend/backend.

## UX-15 — Job execution trên detail

- **Mục tiêu / Primary CTA:** Biết thợ đang làm; CTA Theo dõi / hỗ trợ.
- **Dữ liệu bắt buộc và tùy chọn:** startedAt, giá đã duyệt, ảnh theo tiến độ.
- **Bước dư / nội dung khó hiểu / UI:** Không đưa CTA nghiệm thu lúc IN_PROGRESS. Khi thợ gửi AFTER mới chuyển chờ khách kiểm tra, không gộp sửa xong với trả tiền xong.
- **Loading, Empty, Error, Success:** Pending status từ server; ảnh chưa có là empty, không stock; lỗi update giữ state; success có thời điểm.
- **Phục hồi / điểm có thể kẹt:** Foreground refetch, không reset flow khi mất mạng; CUS-01/05.
- **Bằng chứng:** [server/src/modules/orders/order-workflow.service.js:228](../../server/src/modules/orders/order-workflow.service.js#L228); xem issue được dẫn để đối chiếu frontend/backend.

## UX-16 — Acceptance component chưa nối route

- **Mục tiêu / Primary CTA:** Tự kiểm tra kết quả; CTA Tôi đã kiểm tra, đồng ý / Chưa hài lòng.
- **Dữ liệu bắt buộc và tùy chọn:** Ảnh trước/sau đúng order; reason khi từ chối, evidence tùy chọn.
- **Bước dư / nội dung khó hiểu / UI:** Có side-by-side/full image và mutation; stock images, 94% và lời đảm bảo an toàn không có chứng cứ phải bỏ. Không dùng AI thay sự đồng ý khách.
- **Loading, Empty, Error, Success:** AI error hiển thị unavailable; acceptance pending khóa CTA; dispute lỗi giữ lý do; success theo response.
- **Phục hồi / điểm có thể kẹt:** Hiện dùng store RAM + demo id, staleTime Infinity cho kết quả AI; phải hydrate lại snapshot/ảnh khi reopen; CUS-01/08/21.
- **Bằng chứng:** [customer-app/src/screens/order/AcceptanceScreen.jsx:35](../../customer-app/src/screens/order/AcceptanceScreen.jsx#L35); xem issue được dẫn để đối chiếu frontend/backend.

## UX-17 — PaymentReview component chưa nối route

- **Mục tiêu / Primary CTA:** Trả đúng tiền, nhận biên nhận; CTA Thanh toán [số tiền].
- **Dữ liệu bắt buộc và tùy chọn:** Final amount, phương thức thật, server payment status.
- **Bước dư / nội dung khó hiểu / UI:** List VNPAY/CASH/MOMO nhưng mutation /pay không mang method; không được xem chọn method là tích hợp. Review mặc định 5 sao/tag tốt cần bỏ.
- **Loading, Empty, Error, Success:** Pending là đang kiểm tra giao dịch; failure có retry an toàn; success cần PAID + completed snapshot; empty payment không tự coi đã thu.
- **Phục hồi / điểm có thể kẹt:** Close app/return provider phải GET payment và order; không dựa paymentSuccess RAM; CUS-07/10/24.
- **Bằng chứng:** [customer-app/src/screens/order/PaymentReviewScreen.jsx:40](../../customer-app/src/screens/order/PaymentReviewScreen.jsx#L40); xem issue được dẫn để đối chiếu frontend/backend.

## UX-18 — History / orders tab

- **Mục tiêu / Primary CTA:** Xem việc đang làm và chứng từ cũ; CTA Mở đơn / tiếp tục.
- **Dữ liệu bắt buộc và tùy chọn:** List server phân trang; cache đúng tài khoản.
- **Bước dư / nội dung khó hiểu / UI:** Hai tab Đã đặt/Đã làm dễ giấu hủy trong Đã làm; đổi Đang xử lý/Đã kết thúc, badge distinct chờ kiểm tra/chờ thanh toán/khiếu nại.
- **Loading, Empty, Error, Success:** Có spinner/pull refresh/empty; API lỗi bị fallback cache không nhãn; success không đồng nghĩa cập nhật mới nhất.
- **Phục hồi / điểm có thể kẹt:** Poll 10s nhưng chỉ trang đầu; refresh focus và paginate, lưu snapshot có last sync; CUS-19.
- **Bằng chứng:** [customer-app/app/(user)/(tabs)/orders.jsx:36](../../customer-app/app/(user)/(tabs)/orders.jsx#L36); xem issue được dẫn để đối chiếu frontend/backend.

## UX-19 — Profile tab / edit / avatar

- **Mục tiêu / Primary CTA:** Quản lý thông tin liên hệ; CTA Lưu thay đổi.
- **Dữ liệu bắt buộc và tùy chọn:** Tên/phone đúng; avatar tùy chọn.
- **Bước dư / nội dung khó hiểu / UI:** Avatar có upload API; edit-field lại chỉ context local. Tên đầy đủ dễ dùng hơn chia họ/tên kèm giá trị mẫu.
- **Loading, Empty, Error, Success:** Upload có lỗi; save field cần server validation và không success giả; avatar placeholder không mạo danh người.
- **Phục hồi / điểm có thể kẹt:** RefreshProfile sau save; logout phải dọn account cache, CUS-04/17.
- **Bằng chứng:** [customer-app/src/features/auth/context/AuthContext.jsx:123](../../customer-app/src/features/auth/context/AuthContext.jsx#L123); xem issue được dẫn để đối chiếu frontend/backend.

## UX-20 — edit-field / OTP / password step

- **Mục tiêu / Primary CTA:** Thay liên hệ an toàn; CTA Xác minh và lưu.
- **Dữ liệu bắt buộc và tùy chọn:** Proof gắn field + actor nếu yêu cầu xác minh; không hỏi password hình thức.
- **Bước dư / nội dung khó hiểu / UI:** Mật khẩu chỉ nonempty; tự cắm verified flag local. Giảm bước thừa bằng cơ chế backend xác thực thực sự, giữ OTP cooldown.
- **Loading, Empty, Error, Success:** Field inline error, pending send/verify/save riêng; success sau server persist. Email/phone thay đổi phải bỏ proof cũ.
- **Phục hồi / điểm có thể kẹt:** Mở lại lấy giá trị server, không tái dùng verified cũ cho giá trị mới; CUS-17/18.
- **Bằng chứng:** [customer-app/app/(user)/profile/edit-field.jsx:314](../../customer-app/app/(user)/profile/edit-field.jsx#L314); xem issue được dẫn để đối chiếu frontend/backend.

## UX-21 — Wallet

- **Mục tiêu / Primary CTA:** Biết tiền thật; CTA chỉ khi ledger hỗ trợ.
- **Dữ liệu bắt buộc và tùy chọn:** Balance/giao dịch từ server.
- **Bước dư / nội dung khó hiểu / UI:** 850k và ngân hàng mẫu, nạp/rút setState; khóa giao dịch cho đến tích hợp, không đưa mô phỏng vào khách thật.
- **Loading, Empty, Error, Success:** Không dùng skeleton để che mock; empty chưa có giao dịch; error chưa lấy số dư; success cần receipt/server.
- **Phục hồi / điểm có thể kẹt:** Refresh/reopen không được mất giao dịch đã báo thành công; CUS-16.
- **Bằng chứng:** [customer-app/app/(user)/profile/wallet.jsx:57](../../customer-app/app/(user)/profile/wallet.jsx#L57); xem issue được dẫn để đối chiếu frontend/backend.

## UX-22 — Vouchers

- **Mục tiêu / Primary CTA:** Xem ưu đãi dùng được; CTA Dùng mã.
- **Dữ liệu bắt buộc và tùy chọn:** Điều kiện/mức giảm/hạn thật; mã nhập tùy chọn.
- **Bước dư / nội dung khó hiểu / UI:** Danh sách và áp dụng local; cần nối quote/payment server hoặc ẩn, không nói Đã áp dụng nếu chỉ match chuỗi.
- **Loading, Empty, Error, Success:** Empty hết ưu đãi; lỗi điều kiện cụ thể; pending validate; success phải phản ánh tổng tiền server.
- **Phục hồi / điểm có thể kẹt:** Claim/use còn sau reopen và không bị dùng hai lần theo contract; CUS-15/16.
- **Bằng chứng:** [customer-app/app/(user)/profile/vouchers.jsx:152](../../customer-app/app/(user)/profile/vouchers.jsx#L152); xem issue được dẫn để đối chiếu frontend/backend.

## UX-23 — Notifications

- **Mục tiêu / Primary CTA:** Biết việc cần xử lý; CTA Xem đơn.
- **Dữ liệu bắt buộc và tùy chọn:** Notification liên quan user/order.
- **Bước dư / nội dung khó hiểu / UI:** Route chỉ chữ, count=1 Home không thật. Ưu tiên trạng thái cần duyệt/nghiệm thu/payment trước khuyến mãi.
- **Loading, Empty, Error, Success:** Chưa có inbox states; cần unread/empty/error/retry có nguồn thật.
- **Phục hồi / điểm có thể kẹt:** Tap deep link GET kiểm quyền/state mới; push delivery NOT_VERIFIED; CUS-21.
- **Bằng chứng:** [customer-app/app/(user)/(tabs)/notifications.jsx:1](../../customer-app/app/(user)/(tabs)/notifications.jsx#L1); xem issue được dẫn để đối chiếu frontend/backend.

## UX-24 — Help / Settings / hỗ trợ sau đơn

- **Mục tiêu / Primary CTA:** Tìm trợ giúp; CTA Liên hệ kênh thật / gửi yêu cầu có mã đơn.
- **Dữ liệu bắt buộc và tùy chọn:** Reason, orderId nếu liên quan; liên hệ theo kênh.
- **Bước dư / nội dung khó hiểu / UI:** Routes placeholder; không hứa 15 phút khi không ticket/SLA. Tránh giả chat đang kết nối.
- **Loading, Empty, Error, Success:** Empty FAQ có tìm kiếm; send pending/error giữ nội dung; success phải có reference lưu thật.
- **Phục hồi / điểm có thể kẹt:** Trở lại dispute vẫn xem được request; settings không có action giả; CUS-21/22.
- **Bằng chứng:** [customer-app/app/common/help.jsx:1](../../customer-app/app/common/help.jsx#L1); xem issue được dẫn để đối chiếu frontend/backend.

## Bộ sáu screen tách rời và tính nhất quán

DiagnoseScreen: dùng API diagnosis và store, tương tự AiScanModal đang nối Home; tránh bắt khách quét lại khi chuyển flow. ConfirmOrderScreen: có địa chỉ mẫu, time labels và voucher local; `selectedTime !== now` gửi thời điểm hiện tại thay giờ người dùng chọn. SearchingScreen: có polling, nhưng không thể lấy đó làm bằng chứng route radar đã poll. TrackingScreen: có refetch/status/quote UI, song không thể suy chi tiết đơn đang dùng được những chức năng này. Acceptance/PaymentReview được đánh giá riêng ở trên. Tích hợp chọn phần phù hợp, giữ route cũ để redirect tương thích sau kiểm references.

Chuẩn UI mục tiêu: một header nhất quán, một CTA chính theo trạng thái ở đáy trong SafeArea, CTA hủy/từ chối có nhãn rõ; không dùng màu làm tín hiệu duy nhất. Giá `150.000 đ`, thời gian Việt Nam, số điện thoại có thật và call handler. Loading không tự thay dữ liệu bằng người/thợ/tiền mẫu; empty giải thích điều thiếu và hành động tiếp; error phân biệt mạng, hết phiên, thiếu quyền, conflict, gate nghiệp vụ; success có mã đơn và bước tiếp theo.

Cỡ chữ/vùng chạm/contrast là tiêu chí thiết kế cần kiểm thực tế, không khẳng định đang đạt chuẩn. Giảm hiệu ứng laser/radar bắt chờ; hỗ trợ chữ lớn, màn hẹp, bàn phím và screen reader. Các label “Face ID”, “confidence”, “matchScore”, “Admin điều phối” nên đổi thành “Xác minh khuôn mặt”, “Gợi ý tham khảo”, “Ảnh trước/sau” và trạng thái thực dễ hiểu.

Dẫn chứng bổ sung: [customer-app/src/screens/order/ConfirmOrderScreen.jsx:112](../../customer-app/src/screens/order/ConfirmOrderScreen.jsx#L112), [customer-app/src/screens/order/SearchingScreen.jsx:180](../../customer-app/src/screens/order/SearchingScreen.jsx#L180), [customer-app/src/screens/order/TrackingScreen.jsx:85](../../customer-app/src/screens/order/TrackingScreen.jsx#L85), [customer-app/src/screens/order/DiagnoseScreen.jsx:40](../../customer-app/src/screens/order/DiagnoseScreen.jsx#L40).

Bằng chứng price-estimate mock: [PriceEstimateScreen.tsx:24](../../customer-app/src/features/services/screens/PriceEstimateScreen.tsx#L24) và [CTA booking:64](../../customer-app/src/features/services/screens/PriceEstimateScreen.tsx#L64).
