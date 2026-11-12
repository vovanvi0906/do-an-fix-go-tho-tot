# FixGo Pro - Backend Core Server

Hệ thống máy chủ điều phối trung tâm (Monolith Core Service) xây dựng trên nền tảng **NestJS**, tích hợp cơ sở dữ liệu không gian **PostgreSQL / PostGIS**, hàng đợi tác vụ **Redis & BullMQ**, truyền phát thời gian thực **Socket.IO** và kết nối Microservice **FastAPI AI Service**.

---

## 1. Mục đích & Đối tượng sử dụng

- **Mục đích**: Là "bộ não" trung tâm xử lý toàn bộ nghiệp vụ của hệ sinh thái FixGo: Quản lý người dùng, phân bổ đơn hàng theo không gian địa lý, xử lý trạng thái đơn hàng, tính toán cước phí & hoa hồng, lưu trữ giao dịch và điều phối kết nối thời gian thực giữa Khách hàng và Thợ.
- **Đối tượng phục vụ**:
  - `Customer App`: Tiếp nhận yêu cầu tìm thợ, chẩn đoán AI, đặt lịch, thanh toán.
  - `Worker App`: Phát sóng cuốc việc mới, kiểm tra xung đột nhận đơn, theo dõi định vị GPS, xác thực sinh trắc học.
  - `Client Admin Web`: Cung cấp số liệu thống kê doanh thu, quản trị danh mục, giám sát gian lận và quản lý tài khoản.

---

## 2. Các chức năng cốt lõi (Core Features)

1. **Quản lý Định danh & Phân quyền (Authentication & RBAC)**:
   - Đăng nhập/Đăng ký đa kênh: Số điện thoại + Mật khẩu, Google OAuth 2.0, OTP xác thực.
   - Phân quyền nghiêm ngặt theo vai trò: `ADMIN`, `CUSTOMER`, `WORKER`.
2. **Quản lý Danh mục & Bảng giá Dịch vụ (Service Catalog)**:
   - Quản lý cây danh mục dịch vụ sửa chữa (Điện gia dụng, Điện lạnh, Ống nước, Khóa cửa...).
   - Biểu giá chuẩn sàn, hệ số giờ cao điểm, định mức giá tối thiểu.
3. **Cỗ máy Trạng thái Đơn hàng (Order State Machine)**:
   - Quản lý nghiêm ngặt chu trình đơn: `PENDING` ➔ `SEARCHING` ➔ `ASSIGNED` ➔ `WORKER_ARRIVING` ➔ `IN_PROGRESS` ➔ `COMPLETED` ➔ `PAID` / `CANCELLED`.
   - Cơ chế chống tranh chấp nhận đơn đồng thời (Race Condition) với khóa lạc quan / HTTP 409 Conflict.
4. **Thuật toán Phân bổ & Quét Thợ (Spatial Matching Engine)**:
   - Sử dụng PostGIS hàm `ST_DWithin` và `ST_DistanceSphere` để quét thợ trực tuyến gần nhất trong bán kính $R \le 5\text{km}$.
   - Tự động mở rộng bán kính lên $10\text{km}$ khi chưa có thợ nhận qua hàng đợi BullMQ.
5. **Truyền phát Thời gian thực (Realtime WebSocket Gateway)**:
   - Gateway `/orders` và `/realtime`: Broadcast đơn mới `order.new`, vị trí GPS thợ di chuyển `worker:update_location`, tin nhắn chat nội bộ `chat:message`.
6. **Tích hợp Trí tuệ Nhân tạo (AI Gateway Integration)**:
   - Chuyển tiếp hình ảnh sự cố sang FastAPI để nhận diện lỗi tự động bằng mô hình YOLOv8 và gợi ý báo giá.
   - Xác thực khuôn mặt thợ với ảnh hồ sơ/CCCD bằng Face Recognition trước khi bắt đầu công việc.
7. **Tài chính, Ví điện tử & Thanh toán (Wallet & Payments)**:
   - Xử lý thanh toán trực tuyến qua cổng VNPay (IPN webhook an toàn) hoặc Tiền mặt.
   - Tự động trừ hoa hồng nền tảng (Platform fee) và cộng số dư vào ví điện tử của thợ.

---

## 3. Đặc tả API nhận & trả (API Specification)

### 3.1. Authentication Module (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản Customer / Worker.
  - *Input*: `{ phone, password, fullName, role: 'CUSTOMER' | 'WORKER' }`
  - *Output*: `{ success: true, user: { id, phone, role, fullName }, tokens: { accessToken, refreshToken } }`
- `POST /api/auth/login`: Đăng nhập hệ thống.
  - *Input*: `{ identifier: phone/email, password }`
  - *Output*: `{ success: true, accessToken, refreshToken, user }`
- `POST /api/auth/refresh`: Cấp mới token truy cập khi hết hạn.
  - *Input*: `{ refreshToken }`
  - *Output*: `{ accessToken, refreshToken }`
- `POST /api/auth/google`: Đăng nhập nhanh bằng tài khoản Google.
  - *Input*: `{ idToken, role }`
  - *Output*: `{ success: true, accessToken, user }`
- `POST /api/auth/otp/send`: Gửi mã OTP xác nhận.
- `POST /api/auth/otp/verify`: Xác thực mã OTP.

### 3.2. Customer Module (`/api/customer-home`, `/api/customers`)
- `GET /api/customer-home/summary`: Lấy thông tin trang chủ khách hàng (Vouchers, Banners, Đơn hàng đang mở, Danh mục phổ biến).
- `GET /api/workers/nearby?lat=...&lng=...&radius=5000`: Lấy danh sách vị trí các thợ đang bật trực tuyến gần đó để hiển thị radar.

### 3.3. Orders Module (`/api/orders`)
- `POST /api/orders`: Khách hàng tạo đơn đặt lịch sửa chữa mới.
  - *Input*: `{ serviceId, pickupAddress, latitude, longitude, scheduledTime, description, mediaUrls }`
  - *Output (201)*: `{ success: true, order: { id, status: 'SEARCHING', totalPrice, ... } }`
- `POST /api/orders/:id/accept`: Thợ bấm nhận đơn hàng đang phát sóng.
  - *Headers*: `Bearer <Worker-Token>`
  - *Output (200)*: `{ success: true, order: { id, status: 'ASSIGNED', ... } }`
  - *Output (409 Conflict)*: `{ error: 'ORDER_ALREADY_TAKEN', message: 'Đơn hàng đã có thợ khác nhận trước!' }`
- `PATCH /api/orders/:id/status`: Thợ chuyển đổi trạng thái công việc (`WORKER_ARRIVING`, `IN_PROGRESS`, `COMPLETED`).
- `POST /api/orders/:id/verify-face`: Thợ upload ảnh selfie xác thực danh tính AI trước khi khởi hành.

### 3.4. Payments & Wallet Module (`/api/payments`, `/api/wallets`)
- `POST /api/payments/create-intent`: Tạo phiên thanh toán VNPay / Thẻ.
- `GET /api/payments/vnpay/callback`: Xử lý Webhook IPN an toàn từ cổng thanh toán VNPay.
- `GET /api/wallets/me`: Lấy số dư ví thợ, lịch sử biến động số dư.

### 3.5. WebSocket Events (`ws://<server>:3000`)
- **Server Phát (Emit)**:
  - `order.new`: Phát thông tin cuốc xe tới các thợ trong bán kính quét.
  - `order.taken`: Báo hiệu đơn hàng đã có người nhận, hủy popup đếm ngược.
  - `worker:location_update`: Truyền tọa độ di chuyển của thợ tới màn hình khách.
- **Client Phát (Listen)**:
  - `worker.join_room`: Thợ đăng ký nhận thông báo theo khu vực GPS.
  - `worker:update_location`: Thợ truyền vị trí GPS chu kỳ 3 - 5 giây/lần.

---

## 4. Cơ chế Bảo mật (Security & Authorization)

1. **Xác thực 2 lớp Token (JWT Architecture)**:
   - `AccessToken`: Thời hạn ngắn (15 phút), chứa `sub` (User ID) và `role`.
   - `RefreshToken`: Thời hạn 7 ngày, mã hóa lưu trữ trong cơ sở dữ liệu có cơ chế Revocation khi đăng xuất.
2. **Bảo vệ Mật khẩu**: Băm mật khẩu 1 chiều bằng thuật toán `bcrypt` với `saltRounds = 10`.
3. **Bộ lọc Quyền (RBAC Guards)**:
   - `@UseGuards(JwtAuthGuard, RolesGuard)`: Ngăn chặn thợ truy cập endpoint khách và ngược lại.
4. **Chống tấn công & Kiểm duyệt dữ liệu**:
   - `Helmet`: Bảo vệ HTTP headers, ngăn ngừa XSS, Clickjacking.
   - `ThrottlerModule`: Giới hạn tần suất gọi API (Rate Limiting) chống Brute Force và DoS.
   - `ClassValidator & ValidationPipe`: Whitelist lọc bỏ mọi payload lạ trước khi vào tầng Controller.
   - `CORS Config`: Chỉ cho phép các domain được định danh từ Client Web và Mobile Origin.
5. **Toàn vẹn Dữ liệu Không gian (GIS Security)**: Kiểm tra tọa độ vĩ độ (-90 đến 90) và kinh độ (-180 đến 180) hợp lệ trước khi thực hiện truy vấn SQL PostGIS.
