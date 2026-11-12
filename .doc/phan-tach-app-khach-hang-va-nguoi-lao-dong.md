# ĐỀ ÁN TÁCH BIỆT ỨNG DỤNG KHÁCH HÀNG & ỨNG DỤNG NGƯỜI LAO ĐỘNG (THỢ)
**Hệ sinh thái FixGo Pro - Dịch vụ Sửa chữa On-Demand tích hợp AI**

---

## 1. TỔNG QUAN TÁI CẤU TRÚC KIẾN TRÚC DỰ ÁN

Để đảm bảo tính chuyên nghiệp, độc lập trong quy trình phát triển (CI/CD) và tối ưu hóa tối đa trải nghiệm người dùng (UX/UI), dự án được tái cơ cấu từ kiến trúc thư mục cũ sang mô hình tiêu chuẩn:

| Thư mục cũ | Thư mục mới | Công nghệ chính | Mục đích & Trách nhiệm |
| :--- | :--- | :--- | :--- |
| `doan-kltn-backend/` | **`server/`** | NestJS, PostgreSQL/PostGIS, Redis, BullMQ, Socket.IO | Máy chủ API điều phối trung tâm, quản lý state machine đơn hàng, matching không gian, ví và bảo mật. |
| `doan-kttn-frontend/` | **`client/`** | React 18, Vite, TailwindCSS v4, Recharts, Zustand | Bảng điều khiển quản trị web (Admin & Dispatcher Dashboard), giám sát vận hành, phê duyệt thợ KYC. |
| `doan-kltn-mobile/` | **`customer-app/`** | React Native, Expo SDK 52, Expo Router, Leaflet Maps | Ứng dụng di động dành riêng cho Khách hàng: Khám phá dịch vụ, AI chẩn đoán thiết bị hỏng, đặt thợ, theo dõi GPS thời gian thực và thanh toán. |
| *(Mới khởi tạo)* | **`worker-app/`** | React Native, Expo SDK 52, Expo Router, Expo-AV, Haptics | Ứng dụng di động tác chiến cho Thợ: Bật/Tắt trực tuyến, radar quét đơn, popup báo động có chuông rung đếm ngược 30s, vuốt nhận việc, xác thực khuôn mặt AI, dẫn đường Google Maps. |
| `ai-service/` | **`ai-service/`** | FastAPI, YOLOv8, InsightFace/FaceNet | Microservice AI chuyên trách phân tích hình ảnh sự cố và so khớp khuôn mặt sinh trắc học. |

---

## 2. ĐỐI CHIẾU MÃ NGUỒN HIỆN TẠI & PHÂN TÁCH TRÁCH NHIỆM

### 2.1. Đối chiếu Luồng Định tuyến (Navigation & Routes)

| Luồng nghiệp vụ | Mã nguồn hiện tại (Trộn lẫn) | Phương án trong `customer-app` | Phương án trong `worker-app` |
| :--- | :--- | :--- | :--- |
| **Khởi động App** | `app/index.jsx` (kiểm tra `user.role` để rẽ nhánh) | Luôn chuyển hướng vào `app/(user)/(tabs)` | Luôn chuyển hướng vào `app/(worker)/(tabs)` |
| **Đăng nhập / Đăng ký** | Gồm cả `login.jsx`, `login-worker.jsx`, `register-customer.jsx`, `register-worker.jsx` | Chỉ giữ đăng nhập khách hàng (SĐT / Google Auth) | Chỉ giữ đăng nhập thợ + Form đăng ký hồ sơ tay nghề, CCCD |
| **Màn hình chính (Home)** | Tab Khách (`(user)`) và Tab Thợ (`(worker)`) chung 1 app | **Discovery Home**: Banner, Danh mục, Map hiển thị thợ online xung quanh | **Tactical Workbench**: Bản đồ Radar quét đơn, công tắc BẬT/TẮT nhận việc, chỉ số thu nhập |
| **Quy trình Đơn hàng** | `(user)/booking/*` & `(worker)/job/[id].jsx` | Đặt lịch, chọn giờ, áp voucher, theo dõi vị trí thợ đang đến | Nhận việc (Popup 30s), xác thực khuôn mặt AI, bấm đến nơi, khảo sát báo giá, nghiệm thu |
| **Định vị & Bản đồ** | Dùng chung Leaflet Maps | Khách **theo dõi** thợ di chuyển (Subscriber) | Thợ **truyền liên tục** tọa độ GPS mỗi 3s qua WebSocket (Publisher) |

### 2.2. Đối chiếu Định danh Cấu hình Ứng dụng (`app.json`)

Để có thể cài đặt và chạy đồng thời cả 2 ứng dụng trên cùng một thiết bị điện thoại mà không bị xung đột, cấu hình được phân tách rõ ràng:

```json
// customer-app/app.json
{
  "expo": {
    "name": "FixGo Khách Hàng",
    "slug": "fixgo-customer",
    "scheme": "fixgocustomer",
    "android": {
      "package": "com.fixgo.customer"
    }
  }
}
```

```json
// worker-app/app.json
{
  "expo": {
    "name": "FixGo Đối Tác Thợ",
    "slug": "fixgo-worker",
    "scheme": "fixgoworker",
    "android": {
      "package": "com.fixgo.worker"
    }
  }
}
```

---

## 3. ĐẶC TẢ API & BẢO MẬT TỪNG MODULE

### 3.1. Phân loại API theo Ứng dụng

```
                              ┌────────────────────────────────────────┐
                              │           NestJS Server (:3000)        │
                              └──────────────────┬─────────────────────┘
                                                 │
                 ┌───────────────────────────────┼───────────────────────────────┐
                 │                               │                               │
                 ▼                               ▼                               ▼
    ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
    │      customer-app      │      │       worker-app       │      │         client         │
    │  (Khách hàng cá nhân)  │      │   (Đối tác Thợ/Tài xế) │      │      (Admin Web)       │
    └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

#### A. API Nhận & Gửi của `customer-app`:
- **Gửi (Request)**:
  - `POST /api/auth/login`, `POST /api/auth/google`: Đăng nhập vai trò `CUSTOMER`.
  - `GET /api/customer-home/summary`: Lấy banner, coupon, trạng thái đơn hiện tại.
  - `GET /api/workers/nearby?lat=...&lng=...`: Quét thợ online để hiển thị trên bản đồ.
  - `POST /api/ai/diagnose`: Tải ảnh thiết bị hỏng lên nhận diện AI.
  - `POST /api/orders`: Tạo đơn đặt thợ mới.
  - `POST /api/orders/:id/cancel`: Hủy đơn khi chưa có thợ.
  - `POST /api/payments/create-intent`: Khởi tạo thanh toán VNPay/Thẻ.
  - `POST /api/reviews`: Đánh giá chất lượng sau hoàn thành.
- **Nhận Realtime (Socket.IO)**:
  - `order.status_changed`: Cập nhật trạng thái thợ (Đã nhận, Đang đến, Hoàn thành).
  - `worker:location_update`: Nhận tọa độ GPS thợ di chuyển trên bản đồ.

#### B. API Nhận & Gửi của `worker-app`:
- **Gửi (Request)**:
  - `POST /api/auth/login-worker`: Đăng nhập tài khoản `WORKER`.
  - `PATCH /api/workers/status`: Bật/tắt trạng thái trực tuyến (`isOnline: true/false`).
  - `POST /api/orders/:id/accept`: Nhận đơn cuốc xe (Bảo vệ bởi HTTP 409 Conflict).
  - `POST /api/orders/:id/verify-face`: Gửi ảnh selfie đối chiếu khuôn mặt AI.
  - `PATCH /api/orders/:id/status`: Chuyển trạng thái (`WORKER_ARRIVING`, `IN_PROGRESS`, `COMPLETED`).
  - `GET /api/wallets/me`: Xem số dư ví, doanh thu ngày/tuần.
  - `POST /api/wallets/withdraw`: Tạo lệnh rút tiền về tài khoản ngân hàng.
- **Phát Realtime (Socket.IO)**:
  - `worker:update_location`: Gửi chu kỳ 3s/lần tọa độ `{ lat, lng, heading, orderId }`.
- **Nhận Realtime (Socket.IO)**:
  - `order.new`: Kích hoạt chuông báo và popup nhận đơn 30 giây khi có cuốc mới.
  - `order.taken`: Đơn hàng đã có thợ khác nhận trước ➔ Hủy popup ngay lập tức.

#### C. API Quản trị của `client` (Web Admin):
- `GET /api/admin/dashboard/kpi`: Doanh thu tổng, số thợ trực tuyến, số đơn đang chạy.
- `GET /api/admin/workers`: Duyệt hồ sơ thợ KYC, khóa tài khoản vi phạm.
- `POST/PUT /api/admin/services`: Quản lý danh mục dịch vụ, cài đặt đơn giá sàn/trần.

---

## 4. CHIẾN LƯỢC BẢO MẬT TOÀN DIỆN (SECURITY ARCHITECTURE)

1. **Bảo mật Định danh & Chống Trộn Vai trò (Role Boundary Isolation)**:
   - Token JWT ký kèm trường `role` (`CUSTOMER` hoặc `WORKER`).
   - Server kích hoạt `@UseGuards(JwtAuthGuard, RolesGuard)`. Khách hàng dùng token của mình gọi API `/orders/:id/accept` sẽ bị từ chối `403 Forbidden`.
2. **Bảo mật Sinh trắc học AI (Biometric Anti-Fraud)**:
   - Trước khi thợ bấm "Đang di chuyển", bắt buộc phải vượt qua bước chụp ảnh khuôn mặt `POST /orders/:id/verify-face`. Server xác thực khớp ảnh hồ sơ $\ge 90\%$ mới cấp cờ cho phép bắt đầu lộ trình.
3. **Bảo vệ Tranh chấp Cuốc (Race Condition Prevention)**:
   - Nhận đơn sử dụng khóa lạc quan (Optimistic Locking) hoặc kiểm tra trạng thái nguyên tử tại cơ sở dữ liệu (`UPDATE orders SET status = 'ASSIGNED', workerId = :wId WHERE id = :id AND status = 'SEARCHING'`).
   - Nếu số dòng cập nhật $= 0$, trả về `HTTP 409 Conflict` kèm mã lỗi rõ ràng.
4. **Bảo mật Lưu trữ Token trên Di động**:
   - Cả `customer-app` và `worker-app` đều sử dụng `expo-secure-store` để lưu trữ token trong vùng nhớ bảo mật phần cứng (Keystore / Keychain).

---

## 5. KẾ HOẠCH BÀN GIAO & CÁCH THỨC VẬN HÀNH

Tất cả các tệp kịch bản tự động đã được cập nhật đồng bộ:
- **`./setup.sh` / `setup.bat`**: Tự động sinh file `.env` và cài đặt dependencies cho `server`, `client`, `customer-app`, `worker-app`.
- **`./dev-local.sh` / `dev-local.bat`**: Khởi chạy một chạm cụm Backend + AI + Admin Web, đồng bộ IP máy tính vào `.env` của cả 2 app mobile.
- **Khởi chạy ứng dụng**:
  - Chạy app Khách hàng: `cd customer-app && npx expo start -c`
  - Chạy app Thợ: `cd worker-app && npx expo start -c`
