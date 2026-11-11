# FixGo Pro - Client Admin Web Dashboard

Ứng dụng bảng điều khiển quản trị tập trung (Centralized Operations & Analytics Dashboard) xây dựng trên nền tảng **React 18**, bộ công cụ đóng gói siêu tốc **Vite**, thư viện giao diện phong cách Vibe UI **TailwindCSS v4**, biểu đồ tương tác **Recharts** và quản lý trạng thái tập trung **Zustand**.

---

## 1. Mục đích & Đối tượng sử dụng

- **Mục đích**: Cung cấp công cụ quản trị, vận hành, giám sát luồng đơn hàng thời gian thực, quản lý đối tác thợ, kiểm soát bảng giá dịch vụ và phân tích doanh thu kinh doanh cho toàn bộ nền tảng FixGo.
- **Đối tượng sử dụng**:
  - `Super Admin`: Toàn quyền cấu hình hệ thống, quản lý tài khoản quản trị viên, xem doanh thu tổng và phê duyệt chính sách hoa hồng.
  - `Điều hành viên (Dispatcher / Operations Staff)`: Giám sát bản đồ đơn hàng trực tiếp, điều phối thợ thủ công khi hệ thống tự động không ghép được cuốc, hỗ trợ khiếu nại khách hàng.
  - `Kiểm duyệt viên (KYC Inspector)`: Xem xét và phê duyệt hồ sơ giấy tờ, bằng cấp chứng chỉ và khuôn mặt sinh trắc học của Thợ mới đăng ký.

---

## 2. Các chức năng cốt lõi (Core Features)

1. **Bảng Thống kê Tổng quan (Executive Analytics Dashboard)**:
   - Theo dõi doanh thu theo ngày, tuần, tháng và năm.
   - Thống kê tỷ lệ hoàn thành đơn, tỷ lệ hủy, thời gian trung bình thợ có mặt tại nhà khách.
   - Biểu đồ nhiệt phân bố đơn hàng theo các quận huyện.
2. **Giám sát Đơn hàng Thời gian thực (Live Orders Monitoring)**:
   - Bản đồ radar giám sát toàn bộ các đơn đang ở trạng thái `SEARCHING`, `ASSIGNED`, `IN_PROGRESS`.
   - Xem chi tiết tiến độ từng đơn: Ảnh chẩn đoán AI của khách, lộ trình GPS của thợ, hóa đơn tạm tính.
   - Can thiệp xử lý sự cố (Hủy đơn có bồi thường, chuyển đơn cho thợ khác).
3. **Quản lý Đối tác Thợ (Worker Fleet Management)**:
   - Danh sách thợ kèm bộ lọc trạng thái (Đang trực tuyến, Đang làm việc, Tạm nghỉ, Bị khóa).
   - Phê duyệt hồ sơ KYC: CCCD/Hộ chiếu, ảnh selfie chân dung, chứng chỉ nghề.
   - Lịch sử cuốc, đánh giá sao của khách và tỷ lệ phản hồi cuốc xe.
4. **Quản lý Khách hàng (Customer Relationship Management - CRM)**:
   - Tra cứu lịch sử đặt đơn, tổng chi tiêu của từng khách hàng.
   - Quản lý mã giảm giá (Vouchers/Coupons), cấp ưu đãi cho khách hàng thân thiết.
5. **Quản lý Danh mục Dịch vụ & Biểu giá (Service Catalog & Pricing)**:
   - Thêm mới, chỉnh sửa hoặc tạm dừng các dịch vụ (Điện nước, Điện lạnh, Xây dựng...).
   - Cài đặt giá sàn, giá trần, hệ số phụ thu ban đêm hoặc ngày lễ Tết.
6. **Kiểm toán & Nhật ký Hệ thống (Audit & System Logs)**:
   - Ghi nhận lịch sử thao tác của các quản trị viên để bảo đảm minh bạch.

---

## 3. Đặc tả API nhận & trả (API Specification)

Ứng dụng Web Admin tương tác trực tiếp với NestJS Server thông qua REST API và kết nối WebSocket:

### 3.1. Xác thực Quản trị (`/api/auth`)
- `POST /api/auth/login`: Xác thực tài khoản Admin.
  - *Input*: `{ identifier: 'admin@fixgo.com', password: '***' }`
  - *Output*: `{ success: true, accessToken, user: { role: 'ADMIN', ... } }`

### 3.2. Số liệu Thống kê & Báo cáo (`/api/admin/dashboard`)
- `GET /api/admin/dashboard/kpi`: Lấy các chỉ số KPI then chốt (Tổng doanh thu, Tổng đơn hoàn tất, Số thợ đang online, Tỷ lệ hủy).
- `GET /api/admin/dashboard/revenue-chart?range=7days`: Dữ liệu biểu đồ doanh thu theo chu kỳ.
- `GET /api/admin/dashboard/category-distribution`: Tỷ trọng đơn hàng theo từng danh mục dịch vụ.

### 3.3. Quản lý Thợ (`/api/admin/workers`)
- `GET /api/admin/workers?page=1&status=PENDING_APPROVAL`: Lấy danh sách thợ chờ duyệt hồ sơ.
- `PATCH /api/admin/workers/:id/verify`: Duyệt hoặc từ chối hồ sơ thợ kèm lý do.
- `PATCH /api/admin/workers/:id/lock`: Khóa tài khoản thợ vi phạm chính sách nền tảng.

### 3.4. Quản lý Dịch vụ (`/api/admin/services`)
- `GET /api/admin/services`: Lấy danh sách toàn bộ cây dịch vụ và bảng giá.
- `POST /api/admin/services`: Tạo mới dịch vụ.
  - *Input*: `{ name, categoryId, basePrice, minPrice, unit, description, iconUrl }`
- `PUT /api/admin/services/:id`: Cập nhật thông tin dịch vụ hoặc điều chỉnh đơn giá.

### 3.5. WebSocket Admin Channel (`ws://<server>:3000/realtime`)
- Lắng nghe sự kiện `admin:order_alert`: Cảnh báo ngay lập tức trên dashboard khi có đơn hàng bị treo quá 5 phút chưa có thợ nhận hoặc có khiếu nại khẩn cấp.

---

## 4. Cơ chế Bảo mật của Ứng dụng (Security)

1. **Phân quyền Phía Giao diện (Role-based Route Guarding)**:
   - Toàn bộ các trang `/admin/*` được bọc bởi `AdminRouteGuard`. Chỉ tài khoản có `role === 'ADMIN'` mới được render giao diện, ngăn chặn truy cập trái phép bằng URL.
2. **Cơ chế Token Quản trị An toàn (Secure Token Storage & Auto-Refresh)**:
   - Token được lưu trữ trong `localStorage` với tiền tố riêng, đính kèm tự động vào Header `Authorization: Bearer <Token>` qua Axios Request Interceptor.
   - Axios Response Interceptor tự động xử lý khi nhận mã `401 Unauthorized`: Kích hoạt cơ chế gọi `/auth/refresh` ngầm. Nếu refresh token hết hạn, tự động xóa sạch session và chuyển hướng về trang `/login`.
3. **Chống tấn công XSS (Cross-Site Scripting)**:
   - React tự động escape HTML khi render dữ liệu động.
   - Kiểm duyệt chặt chẽ các trường hiển thị hình ảnh và nội dung mô tả của khách hàng / thợ.
4. **Session Timeout & Khóa phiên tự động**:
   - Tự động cảnh báo và đăng xuất khi quản trị viên không có thao tác trong khoảng thời gian xác định để bảo vệ máy trạm làm việc.
