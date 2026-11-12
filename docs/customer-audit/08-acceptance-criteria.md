# Acceptance Criteria và traceability

Các tiêu chí dưới đây là mục tiêu **chưa nghiệm thu**. Implementation status của issue xem 06. Mỗi AC cần ghi build/commit của ba bên, dữ liệu kiểm thử, kết quả quan sát và artifact. Test unit pass không thay cho criteria yêu cầu hai thiết bị, provider hoặc DB thật.

## CUS-01 — Nối luồng đơn hàng vào navigation đang chạy

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-01).

- [ ] **AC-01-1:** Từ Home tạo đơn, đi tới mọi bước đến review bằng CTA thực tế.
- [ ] **AC-01-2:** Deep link /order/:id sau cold start phục hồi đúng panel; thiếu id không gọi demo-order-id.

Kiểm thử truy vết: T01; T02. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-02 — Dịch vụ khác báo gửi thành công nhưng chỉ lưu local

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-02).

- [ ] **AC-02-1:** Không có đơn thành công với id ord-*.
- [ ] **AC-02-2:** Mất mạng khi gửi không tạo đơn chờ admin giả; yêu cầu được hỗ trợ phải xuất hiện trong DB và admin.

Kiểm thử truy vết: T03; T04. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-03 — Hủy đơn local tạo hai sự thật

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-03).

- [ ] **AC-03-1:** API lỗi không hiển thị đã hủy.
- [ ] **AC-03-2:** Accept đồng thời cancel chỉ có một kết quả hợp lệ; phí phản ánh trạng thái server và khách nhìn thấy trước khi chấp thuận.

Kiểm thử truy vết: T05; T06. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-04 — Cache đơn không theo tài khoản và chặn refresh server

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-04).

- [ ] **AC-04-1:** Tài khoản B không đọc thấy cache A sau logout/login.
- [ ] **AC-04-2:** Có cache MATCHED nhưng server AWAITING_PAYMENT thì route cập nhật về AWAITING_PAYMENT.

Kiểm thử truy vết: T07; T08. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-05 — Worker thiếu khảo sát, ảnh và hoàn tất công việc

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-05).

- [ ] **AC-05-1:** Ảnh BEFORE do worker được gán lưu sau ARRIVED mới start được.
- [ ] **AC-05-2:** AFTER sau startedAt và finish tạo AWAITING_ACCEPTANCE; khách nhận đúng ảnh của đơn.

Kiểm thử truy vết: T09; T10. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-06 — Báo giá chưa bắt buộc đồng thuận và từ chối gây bế tắc

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-06).

- [ ] **AC-06-1:** Không thể start nếu chưa có giá/phạm vi được khách chấp thuận.
- [ ] **AC-06-2:** Duyệt quote cũ sau đề xuất mới trả conflict; reject không hiện hướng dẫn trái FSM; mở lại thấy pending quote.

Kiểm thử truy vết: T11; T12. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-07 — Thanh toán không khép kín, contract lệch Prisma

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-07).

- [ ] **AC-07-1:** Một callback hợp lệ ghi một Payment và một PAYOUT đúng worker, amount khớp giá đã duyệt.
- [ ] **AC-07-2:** Callback trùng/lệch thứ tự, client retry, crash sau commit không thu/cộng ví lại; COMPLETED có payment PAID và ledger khớp.

Kiểm thử truy vết: T13; T14. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-08 — AI Face và nghiệm thu có mock success ở nhiều tầng

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-08).

- [ ] **AC-08-1:** Tắt model hoặc AI lỗi không cấp faceVerifiedAt và không hiển thị AI nghiệm thu đạt.
- [ ] **AC-08-2:** Có khuôn mặt nhưng không so khớp ảnh đăng ký không được coi là identity verified.

Kiểm thử truy vết: T15; T16. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-09 — Realtime route thật sai event và không join order room

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-09).

- [ ] **AC-09-1:** Mở detail nhận trạng thái trong khi không rời màn; reconnect thấy snapshot mới dù mất event.
- [ ] **AC-09-2:** GPS/order khác không đổi UI; token expired phục hồi đăng nhập có kiểm soát.

Kiểm thử truy vết: T17; T18. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-10 — Payment endpoints thiếu ownership và webhook mock công khai

Ưu tiên P0; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-10).

- [ ] **AC-10-1:** User B không tạo checkout/đọc payment của A.
- [ ] **AC-10-2:** Unsigned/tampered callback không tạo payment, ledger hay COMPLETED.

Kiểm thử truy vết: T19; T20. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-11 — Dispatch timeout, mở rộng và lịch hẹn không đồng bộ

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-11).

- [ ] **AC-11-1:** Mở rộng thực sự gửi tới tập ứng viên mới.
- [ ] **AC-11-2:** Đổi lịch giữ id và có job đúng hạn; retry không sinh đơn kép; client không kết thúc đơn chỉ vì timer.

Kiểm thử truy vết: T21; T22. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-12 — Tạo đơn thiếu idempotency và kiểm tra eligible worker khi nhận

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-12).

- [ ] **AC-12-1:** Retry cùng key trả cùng id; khác payload cùng key trả conflict.
- [ ] **AC-12-2:** Worker không đủ dịch vụ không nhận được dù biết id; hai worker tranh một order chỉ một thành công.

Kiểm thử truy vết: T23; T24. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-13 — Địa chỉ chữ khác GPS và thiếu đường nhập thay thế

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-13).

- [ ] **AC-13-1:** Địa chỉ gửi worker và điểm match cùng vị trí khách xác nhận.
- [ ] **AC-13-2:** Từ chối GPS vẫn đặt bằng pin thật; không tự dùng tọa độ/địa chỉ mẫu.

Kiểm thử truy vết: T25; T26. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-14 — Ảnh sự cố được chọn nhưng chưa được chuyển lên server

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-14).

- [ ] **AC-14-1:** Ảnh khách chọn xuất hiện trên GET order và Worker.
- [ ] **AC-14-2:** Upload lỗi không hiển thị đã đính kèm; retry không gắn ảnh đơn khác.

Kiểm thử truy vết: T27. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-15 — Home trộn catalog thật với dữ liệu uy tín và ưu đãi giả

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-15).

- [ ] **AC-15-1:** Backend unavailable không hiện dịch vụ giả có CTA đặt.
- [ ] **AC-15-2:** Claim/reopen giữ ưu đãi thật hoặc chức năng được ẩn rõ; không tạo rating/review count.

Kiểm thử truy vết: T28; T29. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-16 — Ví và mã giảm giá có giao dịch thành công giả

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-16).

- [ ] **AC-16-1:** Không có thông báo chuyển/nạp tiền nếu chưa có giao dịch server xác nhận.
- [ ] **AC-16-2:** Giá xác nhận, báo giá, thu tiền, biên nhận giống nhau.

Kiểm thử truy vết: T30; T31. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-17 — Sửa hồ sơ chỉ local và mật khẩu không được xác minh

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-17).

- [ ] **AC-17-1:** Đổi máy/login lại vẫn thấy dữ liệu vừa lưu.
- [ ] **AC-17-2:** Sai mật khẩu hoặc chưa có proof không đổi trường nhạy cảm; không tự nâng verified.

Kiểm thử truy vết: T32; T33. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-18 — Auth và deep link cần ràng buộc phiên, OTP với nghiệp vụ

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-18).

- [ ] **AC-18-1:** Anonymous/worker mở customer action không thực thi; login trở về đúng đơn hợp quyền.
- [ ] **AC-18-2:** Bypass wizard không đăng ký/cập nhật phone với nhãn verified nếu thiếu proof.

Kiểm thử truy vết: T34; T35. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-19 — Active order và History không phản ánh đúng snapshot

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-19).

- [ ] **AC-19-1:** Mỗi canonical state active có thể truy cập lại từ Home/History.
- [ ] **AC-19-2:** Đơn ngoài 10 bản ghi đầu vẫn xem được; finalPrice=0 không bị thay bằng giá mẫu.

Kiểm thử truy vết: T36; T37. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-20 — GPS không tự phục hồi khi Worker mở lại app

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-20).

- [ ] **AC-20-1:** Reopen en-route tự phục hồi tracking sau cấp quyền.
- [ ] **AC-20-2:** Mất GPS/network không hiển thị ETA giả hoặc tọa độ đơn khác.

Kiểm thử truy vết: T38. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-21 — Dispute không có đường xử lý và hỗ trợ còn placeholder

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-21).

- [ ] **AC-21-1:** Dispute không tự PAID/COMPLETED; admin có quy trình resolve có ghi lý do/actor và khách thấy kết quả.
- [ ] **AC-21-2:** Không show support success nếu chưa lưu yêu cầu.

Kiểm thử truy vết: T39; T40. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-22 — Chọn đích danh thợ, gọi/chat và thay thợ chưa thành nghiệp vụ

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-22).

- [ ] **AC-22-1:** Mọi CTA hoạt động hoặc nêu rõ chưa hỗ trợ; không gọi số demo.
- [ ] **AC-22-2:** Nếu phát hành thay thợ: thợ cũ không còn quyền/GPS, khách biết ai đang phụ trách.

Kiểm thử truy vết: T41; T42. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-23 — Xóa danh mục/thợ có thể phá lịch sử và đơn đang chạy

Ưu tiên P1; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-23).

- [ ] **AC-23-1:** Ngừng dịch vụ không xóa đơn/ảnh/payment/history.
- [ ] **AC-23-2:** Worker đang có đơn không bị gỡ silent; khách và thợ thấy kết quả xử lý hợp lệ.

Kiểm thử truy vết: T43; T44. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## CUS-24 — UI không thống nhất và đánh giá mặc định thiên lệch

Ưu tiên P2; evidence/thiết kế tại [issue](06-gap-analysis.md#cus-24).

- [ ] **AC-24-1:** CTA không bị bàn phím che ở 360dp và font scale 1.3/2.0.
- [ ] **AC-24-2:** Không có 5 sao/tag được gửi nếu khách chưa chọn; lỗi kỹ thuật có thông điệp dễ hiểu và mã tra cứu.

Kiểm thử truy vết: T45; T46. Trạng thái nghiệm thu: **NOT_VERIFIED**.

## Invariants nghiệm thu chung

- [ ] Snapshot Customer, Worker và DB cùng orderId/status/workerId/finalPrice sau reconnect.
- [ ] Không có order mutation, đọc chi tiết, room join, GPS hoặc payment ngoài quyền chủ thể.
- [ ] Mỗi thành công trên UI có kết quả backend tương ứng; không dùng timer/local cache/heuristic để xác nhận nghiệp vụ.
- [ ] Nghiệm thu không đồng nghĩa thanh toán; chỉ COMPLETED khi payment/ledger đạt policy.
- [ ] Giá được khách đồng ý khớp tổng thu/biên nhận; retry tạo đơn, approve, settle không nhân bản.
- [ ] Mất mạng/đóng app ở mọi active state đều quay lại được; không tự tạo đơn hoặc trả tiền lần hai.
- [ ] Mọi từ chối và dispute có đường xử lý có thể thực hiện; chưa giải quyết không ép sang completed.
- [ ] Màn nhỏ, font lớn, quyền camera/GPS bị từ chối, API empty/error đều có lối thoát không giả success.
