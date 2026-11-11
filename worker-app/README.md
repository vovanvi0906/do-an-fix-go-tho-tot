# FixGo Đối Tác Thợ - Worker Mobile App

Ứng dụng di động tác chiến dành riêng cho Đối tác Thợ kỹ thuật & Người lao động, xây dựng trên nền tảng **React Native** với **Expo SDK 52**, định tuyến hiện đại **Expo Router**, điều hướng GPS thời gian thực, kết nối sự kiện hai chiều **Socket.IO Client**, âm thanh cảnh báo **Expo-AV** và rung phản hồi **Expo-Haptics**.

---

## 1. Mục đích & Đối tượng sử dụng

- **Mục đích**: Là công cụ làm việc đắc lực cho Thợ: Nhận đơn hàng siêu tốc quanh khu vực hoạt động, chống tranh chấp đơn với các thợ khác, dẫn đường GPS đến nhà khách, xác thực danh tính bằng AI trước khi thực hiện công việc, báo giá phụ phí phát sinh và quản lý doanh thu minh bạch.
- **Đối tượng sử dụng**:
  - Thợ điện, thợ điện lạnh (điều hòa, tủ lạnh, máy giặt), thợ sửa đường ống nước, thợ khóa, thợ sửa đồ gia dụng và thợ kỹ thuật công trình tự do hoặc thuộc các đối tác liên kết.

---

## 2. Các chức năng cốt lõi (Core Features)

1. **Bàn Làm việc Tác chiến & Trạng thái Trực tuyến (Workbench & Online Toggle)**:
   - Công tắc chuyển đổi một chạm: **"BẬT NHẬN ĐƠN" (Online) / "TẠM NGHỈ" (Offline)**.
   - Khi BẬT: Hệ thống tự động kích hoạt bộ theo dõi GPS ngầm và kết nối WebSocket để sẵn sàng đón nhận cuốc việc mới trong bán kính 5km.
   - Thẻ thống kê nhanh ngay trên màn hình: Số đơn đã làm hôm nay, Doanh thu trong ngày, Điểm đánh giá sao uy tín.
2. **Cơ chế Báo động & Nhận Đơn Mới (Real-time Incoming Order Alert)**:
   - **Âm thanh & Rung**: Phát chuông cảnh báo dồn dập (`expo-av`) kèm rung nhịp điệu mạnh (`expo-haptics`) liên tục khi có cuốc mới được phân bổ.
   - **Đồng hồ đếm ngược (Countdown Timer 30s)**: Thanh đếm thời gian khẩn trương giúp thợ quyết định nhanh.
   - **Thông tin cuốc xe cốt lõi**:
     - Số tiền thực nhận sau chiết khấu (VD: `180.000 đ`).
     - Khoảng cách từ vị trí thợ đến nhà khách (VD: `1.2 km - ~5 phút`).
     - Tên công việc & hình ảnh chẩn đoán sự cố do khách hàng tải lên.
   - **Thao tác Vuốt để nhận đơn (Slide to Accept)**: Thiết kế chống bấm nhầm khi đang điều khiển xe máy hoặc đeo găng tay lao động.
3. **Cơ chế Chống Xung đột Đơn hàng (Race Condition Handling)**:
   - Trong trường hợp cuốc xe phát sóng chung cho nhiều thợ, nếu thợ khác bấm nhận trước 1 phần nghìn giây, hệ thống bắt ngay lỗi `HTTP 409 Conflict`, ngắt chuông báo ngay lập tức và hiển thị thông báo dịu nhẹ *"Đơn đã được thợ khác tiếp nhận, tiếp tục quét..."*.
4. **Xác thực Sinh trắc học Khuôn mặt AI (Biometric Face Check)**:
   - Trước khi khởi hành, thợ chụp ảnh selfie trực diện qua khung tròn sinh trắc học.
   - Hệ thống AI đối chiếu khuôn mặt với ảnh thẻ đăng ký hồ sơ để đảm bảo chính chủ đi làm (chống cho thuê tài khoản hoặc gian lận danh tính).
5. **Dẫn đường GPS & Truyền Tọa độ Realtime (Live Location Broadcasting)**:
   - Tích hợp 1 chạm mở trực tiếp ứng dụng **Google Maps / Apple Maps** để dẫn đường từng ngã rẽ (Turn-by-turn navigation).
   - Thiết bị tự động truyền tọa độ GPS hiện tại về Server mỗi 3 giây qua sự kiện `worker:update_location` để hiển thị vị trí xe thợ trên máy khách.
6. **Thực thi Công việc & Báo giá Phụ phí (In-Job Execution & Quotation)**:
   - Các nút chuyển trạng thái 1 chạm: *"Đang di chuyển" ➔ "Đã đến nơi" ➔ "Bắt đầu làm" ➔ "Hoàn tất"*.
   - Khảo sát & Tạo báo giá phát sinh: Thợ nhập tên linh kiện thay thế + số tiền + ảnh chụp linh kiện hỏng để gửi khách duyệt ngay tại hiện trường.
7. **Thống kê Thu nhập & Quản lý Ví Thợ (Earnings & Wallet)**:
   - Báo cáo thu nhập chi tiết theo Ngày, Tuần, Tháng.
   - Quản lý số dư ký quỹ nhận việc, lịch sử trừ chiết khấu sàn.
   - Tạo lệnh rút tiền thu nhập về tài khoản ngân hàng cá nhân.

---

## 3. Đặc tả API nhận & trả (API Specification)

Worker App kết nối trực tiếp tới `http://<SERVER_IP>:3000/api` và Socket.IO:

### 3.1. Xác thực & Hồ sơ Thợ (`/api/auth`, `/api/workers`)
- `POST /api/auth/login`: Đăng nhập tài khoản Thợ bằng Số điện thoại & Mật khẩu.
- `POST /api/auth/register-worker`: Đăng ký tài khoản Thợ mới kèm hồ sơ kỹ năng.
- `GET /api/workers/profile`: Lấy thông tin hồ sơ nghề nghiệp, các danh mục dịch vụ đăng ký nhận việc, điểm số uy tín.
- `PATCH /api/workers/status`: Bật/Tắt trạng thái sẵn sàng nhận đơn (`isOnline: true | false`).

### 3.2. Nhận việc & Xử lý Đơn hàng (`/api/orders`)
- `POST /api/orders/:id/accept`: Gửi yêu cầu nhận đơn hàng.
  - *Headers*: `Authorization: Bearer <Worker-Token>`
  - *Output Thành công (200 OK)*: `{ success: true, order: { id, customer: { fullName, phone }, pickupAddress, totalPrice } }`
  - *Output Tranh chấp (409 Conflict)*: `{ error: 'ORDER_ALREADY_TAKEN', message: 'Đơn hàng đã có thợ khác nhận!' }`
- `PATCH /api/orders/:id/status`: Chuyển trạng thái đơn:
  - *Input*: `{ status: 'WORKER_ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' }`
- `POST /api/orders/:id/verify-face`: Gửi ảnh selfie xác thực khuôn mặt AI trước khi đi.
  - *Input*: `FormData { photo: <File>, orderId }`
  - *Output*: `{ success: true, verified: true, matchScore: 0.96 }`

### 3.3. Thu nhập & Ví (`/api/wallets`)
- `GET /api/wallets/me`: Lấy số dư ví thợ, doanh thu tạm tính và danh sách giao dịch.
- `POST /api/wallets/withdraw`: Tạo yêu cầu rút tiền về ngân hàng.
  - *Input*: `{ amount: 500000, bankCode: 'MBBANK', accountNumber: '0987654321' }`

### 3.4. Kênh WebSocket Thời gian thực (`ws://<SERVER_IP>:3000/orders`)
- **Lắng nghe (Listen)**:
  - `order.new`: Kích hoạt ngay chuông báo và popup nhận đơn 30 giây khi có cuốc mới quanh vị trí thợ.
  - `order.taken`: Đơn hàng đang hiển thị đã có người nhận, tự động đóng popup ngay lập tức.
- **Phát đi (Emit)**:
  - `worker:update_location`: Truyền liên tục tọa độ `{ orderId, workerId, latitude, longitude, heading }`.
  - `worker:status_update`: Báo cáo trạng thái di chuyển hoặc check-in đến địa chỉ khách.

---

## 4. Cơ chế Bảo mật của Ứng dụng (Security)

1. **Phân quyền Nghiêm ngặt (Strict Role Verification)**:
   - Chỉ tài khoản có `role === 'WORKER'` và đã được phê duyệt hồ sơ (`status === 'ACTIVE'`) mới có thể mở giao diện nhận đơn. Tài khoản khách hàng không thể can thiệp hay nghe lén sự kiện phát sóng đơn của thợ.
2. **Bảo mật Sinh trắc học Chống Gian lận (Anti-Spoofing Biometric Gate)**:
   - API không cho phép thợ bấm *"Đang di chuyển"* nếu chưa có token xác thực khuôn mặt sinh trắc học hợp lệ từ AI Service (`faceVerified === true`).
3. **Chống Tấn công Giả lập Vị trí (Mock Location & Anti-GPS Spoofing)**:
   - Kiểm tra cờ `mocked: true` từ GPS phần cứng thiết bị. Từ chối nhận cuốc nếu phát hiện thợ sử dụng phần mềm giả lập vị trí (Fake GPS).
4. **Giới hạn Tần suất Truyền GPS (GPS Stream Throttling)**:
   - Tọa độ GPS được làm mượt và giới hạn gửi ở chu kỳ tối đa 1 lần / 3 giây nhằm tiết kiệm băng thông mạng 4G, tiết kiệm pin cho thợ và chống spam gateway WebSocket.
5. **Khóa Lạc quan Chống Trùng Đơn (Optimistic Locking)**:
   - Thao tác nhận đơn được bảo vệ bởi cơ chế kiểm tra điều kiện trạng thái tức thời ở cơ sở dữ liệu (`WHERE id = :orderId AND status = 'SEARCHING'`), triệt tiêu hoàn toàn khả năng 2 thợ cùng nhận một cuốc xe.
