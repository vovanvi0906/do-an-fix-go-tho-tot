# 🧪 PROMPT TEST TOÀN DIỆN LUỒNG ĐƠN HÀNG (ORDER FLOW QA SCRIPT)
## Dùng để giao cho AI agent tự viết & chạy test cho toàn bộ vòng đời đơn hàng

Bạn là QA Engineer. Nhiệm vụ: viết bộ test (integration test, dùng <Jest + Supertest / công cụ test hiện có của backend>)
để kiểm tra TOÀN BỘ vòng đời đơn hàng trong hệ thống, không chỉ happy path.

BỐI CẢNH:
- Base URL: <http://localhost:3000/api/v1>
- Tham chiếu đặc tả: api-specs.md mục 4 (Orders & Dispatch), mục 3 (AI Microservice), mục 5 (Wallet)
- Tham chiếu rule race condition & transaction: backend.md mục 3
- Tài khoản test cần chuẩn bị: 1 CUSTOMER, tối thiểu 2 WORKER cùng khu vực GPS gần nhau (để test tranh chấp nhận đơn), 1 ADMIN

QUY TẮC BẮT BUỘC KHI VIẾT TEST:
- Mỗi test case phải độc lập (setup + teardown dữ liệu riêng, không phụ thuộc thứ tự chạy).
- Không mock database transaction — test phải chạy trên DB thật (test DB riêng) để phát hiện đúng lỗi concurrency.
- Assert cả response body VÀ trạng thái thật trong DB sau mỗi bước (không chỉ tin response 200 là đủ).
- Với mỗi nhóm test, viết rõ comment mô tả "Given / When / Then".

===========================================
NHÓM 1 — HAPPY PATH (LUỒNG CHUẨN ĐẦY ĐỦ)
===========================================
Test toàn bộ chuỗi tuần tự, assert trạng thái đơn đổi đúng ở mỗi bước:
1. Customer tạo đơn (POST /orders) → status = SEARCHING_WORKER
2. Worker (đang online, trong bán kính) nhận đơn (POST /orders/:id/accept) → status = ACCEPTED
3. Worker check-in bằng face verification (POST /orders/:id/check-in) → status = IN_PROGRESS
4. Worker nộp ảnh hoàn thành (POST /orders/:id/complete) → status = COMPLETED_PENDING_CONFIRMATION
5. Customer xác nhận + thanh toán (POST /orders/:id/confirm-payment) → status = SETTLED
6. Assert: wallet của Worker CỘNG đúng workerNetEarnings, có bản ghi transaction loại EARNING
7. Assert: wallet/doanh thu sàn ghi nhận đúng platformFee theo commission rate hiện hành (bao gồm cả category override nếu có)
8. Assert sự kiện WebSocket order:status_changed được emit đúng số lần, đúng thứ tự, đúng payload ở mỗi bước

===========================================
NHÓM 2 — RACE CONDITION / TRANH CHẤP NHẬN ĐƠN
===========================================
Đây là nhóm quan trọng nhất — test đúng cơ chế atomic updateMany trong backend.md.
1. Tạo 1 đơn ở trạng thái SEARCHING_WORKER.
2. Gửi ĐỒNG THỜI (Promise.all, không tuần tự) 2 request POST /orders/:id/accept từ 2 Worker khác nhau.
3. Assert: CHỈ ĐÚNG 1 request trả về 200/thành công, request còn lại PHẢI trả về 409 Conflict.
4. Assert: trong DB chỉ có đúng 1 worker được gán vào order, không có tình trạng cả 2 cùng được gán hoặc đơn bị "kẹt" ở trạng thái không xác định.
5. Lặp lại test trên với 5-10 request đồng thời để tăng khả năng phát hiện lỗi race condition (chạy nhiều lần, không chỉ 1 lần).

===========================================
NHÓM 3 — LUỒNG THẤT BẠI CỦA AI (CHƯA CÓ TRONG API-SPECS — CẦN LÀM RÕ TRƯỚC KHI TEST)
===========================================
Lưu ý cho AI agent: api-specs.md hiện chỉ mô tả response THÀNH CÔNG cho các endpoint AI.
Trước khi viết test nhóm này, hỏi lại người dùng xác nhận behavior mong muốn cho các case sau,
KHÔNG tự suy đoán và implement logic nghiệp vụ mới:
1. Face verification thất bại (isMatched: false hoặc liveness không đạt) khi check-in → order có được phép
   chuyển IN_PROGRESS không? Worker có được retry bao nhiêu lần? Có khóa tài khoản sau N lần fail không?
2. Before-after validation trả isApproved: false → đơn có tự động vào trạng thái tranh chấp (DISPUTED) không,
   hay chờ Admin xử lý thủ công? Endpoint nào xử lý dispute?
3. AI service timeout/500 khi gọi từ NestJS → order có bị treo ở trạng thái trung gian không, hay có cơ chế
   retry/fallback? Response trả về Customer/Worker là gì?
Sau khi có câu trả lời, viết test tương ứng và assert đúng theo behavior đã xác nhận.

===========================================
NHÓM 4 — TIMEOUT / HỦY ĐƠN (CẦN LÀM RÕ TRƯỚC — TƯƠNG TỰ NHÓM 3)
===========================================
Xác nhận trước với người dùng, sau đó test:
1. Không worker nào nhận đơn sau khoảng thời gian X → đơn có tự chuyển EXPIRED/CANCELLED không? Có tự mở
   rộng searchRadiusKm không?
2. Customer hủy đơn khi đã ACCEPTED (worker đang di chuyển tới) → có phí hủy không? Trạng thái cuối là gì?
3. Worker đã accept nhưng huỷ giữa chừng (không tới) → đơn có tự quay lại SEARCHING_WORKER để tìm worker
   khác không, hay bắt buộc Customer tạo lại đơn mới?

===========================================
NHÓM 5 — TÀI CHÍNH / IDEMPOTENCY
===========================================
1. Gửi 2 lần liên tiếp (gần như đồng thời) request POST /orders/:id/confirm-payment cho CÙNG 1 đơn
   → assert chỉ trừ/cộng tiền đúng 1 lần, không bị double-settle.
2. Gửi 2 lần liên tiếp POST /wallets/withdraw với cùng amount → assert không bị trừ ví 2 lần nếu
   chưa có cơ chế Idempotency-Key (nếu test fail, đây là bug cần báo cáo, không phải lỗi test).
3. Test withdraw với amount lớn hơn balance hiện có → phải trả lỗi rõ ràng (422/400), KHÔNG được tạo
   transaction âm số dư.
4. Test category override commission rate: tạo đơn thuộc category có override riêng, assert platformFee
   tính theo rate của category đó, không phải defaultRate.

===========================================
NHÓM 6 — PHÂN QUYỀN (AUTHORIZATION)
===========================================
Với MỖI endpoint trong luồng order, test:
1. Gọi không có token → 401.
2. Gọi với token đúng role nhưng SAI CHỦ SỞ HỮU (ví dụ Customer A cố confirm-payment đơn của Customer B,
   Worker A cố accept đơn đã gán cho Worker B) → 403, không phải 404 hay 200.
3. Gọi với role sai hoàn toàn (Worker cố gọi endpoint chỉ dành cho Admin) → 403.

===========================================
NHÓM 7 — REALTIME/WEBSOCKET ĐỒNG BỘ TRẠNG THÁI
===========================================
1. Assert khi order chuyển trạng thái qua REST API, sự kiện order:status_changed được broadcast đúng tới
   đúng room (chỉ Customer và Worker liên quan đến đơn đó, KHÔNG broadcast toàn hệ thống).
2. Assert worker:location_update chỉ được nhận bởi Customer của đơn đang IN_PROGRESS/ACCEPTED liên quan,
   không rò rỉ vị trí worker cho các Customer khác.

===========================================
YÊU CẦU BÁO CÁO KẾT QUẢ
===========================================
Sau khi chạy xong toàn bộ, tổng hợp báo cáo dạng bảng:
| Nhóm test | Số case | Pass | Fail | Ghi chú lỗi phát hiện |

Với mỗi test FAIL, ghi rõ: bước nào fail, trạng thái DB thực tế vs kỳ vọng, có phải do thiếu
đặc tả (như Nhóm 3, 4) hay do bug code thật sự.

