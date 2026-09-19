# 📱 MOBILE CODING RULES & ARCHITECTURE (REACT NATIVE - EXPO ROUTER - VIBE CODE)

## 1. Công nghệ & Kiến trúc Cốt lõi
- **Framework:** React Native / Expo kết hợp **Expo Router** quản lý điều hướng dựa trên cấu trúc file hệ thống (`app/` directory layout)[cite: 3].
- **Network & Realtime:** 
  - **Axios API Client** (`apiClient.js`) tự động nhận diện môi trường (`10.0.2.2` cho Android Emulator, `localhost` cho iOS/Web), tự động đính kèm `Bearer Token` từ `AsyncStorage` và chuẩn hóa lỗi trả về từ NestJS Backend[cite: 3].
  - **Socket.IO Client** (`socketService.js`) quản lý kết nối WebSocket thời gian thực, tự động join room theo vai trò (`customer` / `worker`)[cite: 3].
- **State & Storage:** Context API (`AuthContext`) kết hợp `@react-native-async-storage/async-storage` (`tokenStorage.js`) để lưu trữ phiên đăng nhập bền vững[cite: 3].

## 2. Cấu trúc Thư mục Chuẩn (`src/` & `app/`)
- `app/`: Thư mục định tuyến của Expo Router[cite: 3]:
  - `_layout.jsx`: Root layout cấu hình Providers chung.
  - `(auth)/`: Nhóm màn hình xác thực (`login.jsx`, `register.jsx`, `forgot-password.jsx`)[cite: 3].
  - `(user)/`: Nhóm màn hình dành cho Khách hàng (Tabs trang chủ, `booking/`, `order/[id].jsx`)[cite: 3].
  - `(worker)/`: Nhóm màn hình dành cho Thợ (`(tabs)/`, `job/[id].jsx`, `verification/face.jsx`)[cite: 3].
- `src/components/`: Thư viện component tái sử dụng (`feedback/`, `layout/`, `ui/`)[cite: 3].
- `src/features/`: Quản lý logic theo tính năng (Domain-driven): `auth`, `booking`, `chat`, `face-verification`, `image-analysis`, `location`, `orders`, `payment`, `services`[cite: 3]. Mỗi module phân rã rõ `components/`, `hooks/`, `services/`, `store/`.
- `src/services/`: Hạ tầng kết nối (`api/`, `socket/`, `storage/`)[cite: 3].

## 3. Quy chuẩn Lập trình & Thiết kế Giao diện (Mobile Vibe Code)
- **Responsive & Platform Adaptive:** Luôn kiểm tra khả năng tương thích đa nền tảng (Android/iOS), đặc biệt xử lý khéo léo phần hiển thị tai thỏ (SafeAreaView), bàn phím ảo (KeyboardAvoidingView) và cấu hình URL loopback cho emulator Android (`10.0.2.2`)[cite: 3].
- **Quản lý Xác thực & Phiên (Session Management):**
  - Mọi thao tác đăng nhập/đăng ký phải đi qua `authService`, tự động lưu trữ token và user info qua `tokenStorage` (`AsyncStorage`), đồng thời phát sóng sự kiện đồng bộ state qua `AuthContext`[cite: 3].
  - Khởi động ứng dụng phải có bước kiểm tra phiên (`checkSession`) ẩn/hiện màn hình tải mượt mà không gây chớp giật[cite: 3].
- **Realtime Integration:** Khi component cần lắng nghe sự kiện đơn hàng mới hoặc thay đổi trạng thái từ server, bắt buộc tích hợp `socketService` kết hợp cơ chế tự động gửi `join_room` theo `profileId` ngay khi kết nối thành công[cite: 3].
- **Logging & Debugging:** Duy trì các thông điệp console log rõ ràng có prefix emoji (ví dụ: `🔑 [AuthService]`, `📡 [Socket.IO]`, `🚀 [OrderService]`) để dễ dàng theo dõi luồng request/response trong quá trình lập trình[cite: 3].