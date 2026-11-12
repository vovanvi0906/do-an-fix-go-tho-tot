# FixGo Khách Hàng - Customer Mobile App

Ứng dụng di động dành riêng cho Khách hàng cá nhân và Hộ gia đình, phát triển trên nền tảng **React Native** với **Expo SDK 52**, định tuyến hiện đại **Expo Router**, bản đồ định vị tương tác **Leaflet Maps**, thư viện đồng bộ dữ liệu mạng **TanStack React Query**, và quản lý trạng thái **Zustand**.

---

## 1. Mục đích & Đối tượng sử dụng

- **Mục đích**: Cung cấp trải nghiệm đặt dịch vụ gia đình tiện lợi, minh bạch và an tâm. Giúp khách hàng dễ dàng chẩn đoán sự cố thiết bị qua ảnh chụp AI, tra cứu giá tiêu chuẩn, tìm thợ uy tín gần nhất theo thời gian thực và thanh toán không tiền mặt.
- **Đối tượng sử dụng**:
  - Hộ gia đình, cá nhân có nhu cầu sửa chữa điện nước, điện lạnh, thông tắc cống, bảo dưỡng máy giặt/máy lạnh, sửa khóa hoặc lắp đặt thiết bị gia dụng tại nhà.

---

## 2. Các chức năng cốt lõi (Core Features)

1. **Khám phá Dịch vụ & Đặt lịch Thông minh (Service Discovery & Booking)**:
   - Danh mục trực quan: Điện tử, Điện lạnh, Ống nước, Khóa cửa, Gia dụng...
   - Xem bảng giá công khai, chi tiết từng hạng mục công việc.
   - Chọn địa chỉ trên bản đồ GPS hoặc lưu danh bạ địa chỉ (Nhà riêng, Công ty, Bố mẹ).
   - Đặt lịch làm ngay (Khẩn cấp) hoặc hẹn giờ trước trong ngày.
2. **AI Chẩn đoán Sự cố qua Hình ảnh (AI Photo Diagnosis)**:
   - Khách chụp ảnh thiết bị hỏng (máy lạnh chảy nước, aptomat cháy, ống nước vỡ).
   - Hệ thống AI phân tích lỗi, phân loại mức độ nghiêm trọng và gợi ý báo giá tạm tính giúp khách chủ động tài chính.
3. **Bản đồ Radar & Ghép Thợ Tức thì (Spatial Matching & Radar)**:
   - Hiển thị các thợ lành nghề đang trực tuyến trong bán kính quanh nhà.
   - Màn hình tìm thợ với hiệu ứng sóng radar trực quan.
4. **Theo dõi Lộ trình Thợ Thời gian thực (Live GPS Tracking)**:
   - Sau khi có thợ nhận đơn, bản đồ hiển thị chính xác vị trí thợ đang di chuyển trên đường.
   - Ước tính thời gian có mặt (ETA) và hiển thị thông tin thợ (Tên, ảnh thẻ, số điện thoại, điểm đánh giá sao).
5. **Kênh Liên lạc Bảo mật (In-App Chat & Call)**:
   - Gọi điện thoại hoặc chat trực tiếp với thợ để hướng dẫn vị trí ngõ ngách, mô tả thêm sự cố.
6. **Thanh toán Đa dạng & Tiện lợi (Multi-channel Payments)**:
   - Thanh toán tiền mặt trực tiếp cho thợ sau khi nghiệm thu.
   - Quét mã QR thanh toán qua VNPay / Ngân hàng số.
   - Tích hợp áp dụng mã giảm giá (Vouchers) tự động khấu trừ tiền.
7. **Đánh giá & Khiếu nại (Rating & Reviews)**:
   - Chấm điểm 1 - 5 sao và để lại nhận xét công việc sau khi hoàn tất.
   - Gửi yêu cầu bảo hành hoặc khiếu nại tới trung tâm điều hành.

---

## 3. Đặc tả API nhận & trả (API Specification)

Customer App kết nối tới `http://<SERVER_IP>:3000/api`:

### 3.1. Xác thực & Hồ sơ cá nhân (`/api/auth`, `/api/users`)
- `POST /api/auth/login`: Đăng nhập bằng Số điện thoại & Mật khẩu.
- `POST /api/auth/google`: Đăng nhập nhanh 1 chạm bằng Google Sign-In SDK.
- `GET /api/users/me`: Lấy thông tin tài khoản khách hàng, danh sách địa chỉ đã lưu.
- `POST /api/users/upload-avatar`: Tải ảnh đại diện cá nhân lên Cloudinary.

### 3.2. Trang chủ & Tìm kiếm (`/api/customer-home`, `/api/services`)
- `GET /api/customer-home/summary`: Nhận dữ liệu tổng hợp:
  - *Output*: `{ banners: [...], categories: [...], activeOrder: {...}, popularServices: [...] }`
- `GET /api/workers/nearby?lat=10.7769&lng=106.7009`: Nhận danh sách tọa độ thợ đang online gần khách để hiển thị icon trên Leaflet Map.

### 3.3. Quy trình Đặt đơn & Theo dõi (`/api/orders`)
- `POST /api/orders`: Khởi tạo đơn đặt thợ.
  - *Input*: `{ serviceId, pickupAddress, latitude, longitude, description, scheduledTime, paymentMethod }`
  - *Output*: `{ success: true, orderId: 'ORD-12345', status: 'SEARCHING' }`
- `GET /api/orders/:id`: Lấy chi tiết đơn hàng, thông tin thợ được phân công và trạng thái thi công.
- `POST /api/orders/:id/cancel`: Khách hủy đơn khi chưa có thợ nhận hoặc do việc đột xuất.

### 3.4. AI Chẩn đoán (`/api/ai/diagnose`)
- `POST /api/ai/diagnose`: Tải ảnh lỗi thiết bị lên server để AI phân tích.
  - *Input*: `FormData { image: <File> }`
  - *Output*: `{ issueType: 'LEAKAGE', confidence: 0.94, suggestedServiceId: 'SVC-PLUMB-01', estimatedPrice: 150000 }`

### 3.5. WebSocket Realtime (`/orders`)
- Lắng nghe sự kiện `order.status_changed`: Cập nhật trạng thái đơn (Thợ đã nhận, Thợ đã đến, Đang thi công, Đã hoàn tất).
- Lắng nghe sự kiện `worker:location_update`: Cập nhật tọa độ GPS `[lat, lng]` của thợ trên bản đồ khách hàng mỗi 3 giây.

---

## 4. Cơ chế Bảo mật của Ứng dụng (Mobile App Security)

1. **Lưu trữ Token Mã hóa Cấp Thiết bị (Secure Hardware Keystore)**:
   - Sử dụng `expo-secure-store` (tận dụng Android Keystore và iOS Keychain) để lưu trữ `accessToken` và `refreshToken`. Tuyệt đối không lưu plain text trong AsyncStorage.
2. **Cơ chế Refresh Token Tự động Không Gián đoạn (Silent Token Refresh)**:
   - Tích hợp Queue Handler trong Axios Interceptor: Khi phát hiện token hết hạn (401), app tự động gọi lấy access token mới và phát lại các request đang chờ mà khách hàng không bị gián đoạn trải nghiệm hay văng ra màn hình đăng nhập.
3. **Bảo mật Quyền riêng tư Định vị (Location Permission Privacy)**:
   - Chỉ yêu cầu quyền vị trí `Foreground Location` khi khách hàng mở màn hình chọn địa chỉ hoặc theo dõi thợ. Không âm thầm thu thập vị trí khi app đóng.
4. **Bảo vệ Luồng Thanh toán (Payment Integrity)**:
   - Mọi số tiền thanh toán và mã voucher đều được tính toán lại tại Server để chống gian lận chỉnh sửa giá trên máy khách.
