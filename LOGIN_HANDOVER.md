# 📘 HÀNH TRÌNH BÀN GIAO KIẾN TRÚC ĐĂNG NHẬP & XÁC THỰC (AUTHENTICATION & ONBOARDING) - DỰ ÁN FIXGO
**Tài liệu kỹ thuật nội bộ (Internal Technical Handover Document)**  
*Dành cho Partner & Thành viên phát triển dự án FixGo*  
*Cập nhật lần cuối: Tháng 10/2026*

---

## 1. TỔNG QUAN CÔNG NGHỆ & THƯ VIỆN SỬ DỤNG (TECH STACK & DEPENDENCIES)

Hệ thống FixGo sử dụng kiến trúc phân tách Client-Server hiện đại:
- **Frontend Mobile**: React Native (Expo SDK 52, Expo Router v4).
- **Backend API**: Node.js với framework NestJS (hỗ trợ kiến trúc module, DI, Swagger, JWT, Redis, Prisma ORM).
- **Cơ sở dữ liệu**: PostgreSQL 16 (kèm PostGIS) & Redis 7 (lưu cache OTP, cooldown SMS/Email).

```
┌────────────────────────────────────────────────────────┐
│               FixGo Mobile (Expo SDK 52)               │
│  - Google Signin (@react-native-google-signin/firebase) │
│  - Token Storage (@react-native-async-storage)         │
│  - Auth Context & Axios Interceptors                   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / Ngrok Tunnel
                           ▼
┌────────────────────────────────────────────────────────┐
│               FixGo Backend (NestJS 11)                │
│  - Google Auth Library & Firebase Admin SDK            │
│  - JWT & Passport Strategy                             │
│  - OtpService (Redis Cooldown / Attempts Tracker)      │
│  - EmailService (Nodemailer SMTP) & eSMS Gateway       │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│    PostgreSQL 16 (Prisma)    │  │    Redis 7 Cache     │
│   (Users, Profiles, Roles)   │  │  (OTP, Cooldown TTL) │
└──────────────────────────────┘  └──────────────────────┘
```

---

### 1.1. Frontend Mobile (React Native + Expo)

#### A. Thư viện cốt lõi bắt buộc
| Gói thư viện | Phiên bản | Mục đích sử dụng |
| :--- | :--- | :--- |
| `expo` | `~52.0.0` | Nền tảng framework Expo chính |
| `expo-router` | `~4.0.0` | Điều hướng dạng thư mục File-based routing |
| `@react-native-async-storage/async-storage` | `1.23.1` | Lưu trữ Access Token, Refresh Token & User Profile offline |
| `axios` | `^1.7.9` | HTTP Client gọi API Backend, cấu hình BaseURL & Header Bearer |
| `@react-native-google-signin/google-signin` | `^16.1.5` | Google Sign-In Native SDK cho Android / iOS |
| `firebase` | `^12.19.0` | Hỗ trợ Google Sign-In Popup trên nền tảng Web |
| `expo-auth-session` / `expo-crypto` | `~6.0.3` / `~14.0.2` | Hỗ trợ luồng OAuth web & mã hóa |
| `expo-image-picker` | `~16.0.6` | Chọn ảnh đại diện từ thư viện hoặc máy ảnh để upload |
| `@expo/vector-icons` / `lucide-react-native` | Chuẩn Expo | Bộ icon giao diện (Ionicons, FontAwesome) |

#### B. Biến môi trường Mobile (`.env` hoặc `.env.local`)
Tạo file `.env` hoặc `.env.local` tại thư mục `doan-kltn-mobile/`:

```env
# 1. API & WebSocket Endpoints (IP mạng LAN hoặc đường hầm Ngrok HTTPS)
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api
# Hoặc dùng Ngrok Tunnel khi test trên thiết bị thật ngoài mạng:
# EXPO_PUBLIC_API_URL=https://<your-subdomain>.ngrok-free.dev/api

EXPO_PUBLIC_SOCKET_URL=http://192.168.1.X:3000
# EXPO_PUBLIC_SOCKET_URL=https://<your-subdomain>.ngrok-free.dev

EXPO_PUBLIC_ENV=development

# 2. Google OAuth 2.0 Client IDs
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=https://auth.expo.io/@<username>/doan-kltn-mobile

# 3. Firebase Client Config (dành cho Web popup và thông báo push)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxx
EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

---

### 1.2. Backend (Node.js + NestJS)

#### A. Thư viện cốt lõi
| Gói thư viện | Phiên bản | Mục đích sử dụng |
| :--- | :--- | :--- |
| `@nestjs/jwt` & `passport-jwt` | `^11.0.2` | Tạo và giải mã JWT Access Token |
| `bcrypt` | `^6.0.0` | Băm mật khẩu người dùng với salt 10 rounds |
| `google-auth-library` | `^11.1.0` | Xác minh tính hợp lệ của `idToken` Google gửi lên từ Mobile |
| `firebase-admin` | `^14.5.0` | Giải mã Firebase ID Token từ nền tảng Web |
| `@prisma/client` & `prisma` | `^6.19.3` | ORM kết nối và thao tác với Database PostgreSQL |
| `ioredis` | `^6.0.0` | Quản lý Redis: lưu mã OTP 6 số, TTL hết hạn, cooldown spam |
| `nodemailer` | `^10.0.13` | Gửi mã OTP xác thực tài khoản qua Email (Gmail App Password) |
| `cloudinary` & `multer-storage-cloudinary` | `^1.41.3` | Upload trực tiếp avatar của thợ/khách hàng lên Cloudinary |

#### B. Biến môi trường Backend (`.env`)
Tạo file `.env` tại thư mục `doan-kltn-backend/`:

```env
PORT=3000
NODE_ENV=development

# Database PostgreSQL + PostGIS (Khớp Docker Compose)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ondemand_db?schema=public"

# Redis Cache
REDIS_URL="redis://localhost:6380"
REDIS_HOST="localhost"
REDIS_PORT=6380

# JWT Auth
JWT_ACCESS_SECRET="fixgo_super_secret_jwt_key_2026"
JWT_ACCESS_EXPIRES_IN="7d"

# Google Sign-In Verification
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_ANDROID_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_FIREBASE_WEB_CLIENT_ID="xxxx.apps.googleusercontent.com"

# SMTP Email (Gửi OTP Email qua Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"

# eSMS Gateway (Gửi OTP qua SMS thật)
ESMS_API_KEY="your-esms-api-key"
ESMS_SECRET_KEY="your-esms-secret-key"
ESMS_BRANDNAME="Baotrixemay"
ESMS_SMS_TYPE="2"
ESMS_SANDBOX="0"

# Cloudinary (Lưu trữ ảnh đại diện)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## 2. SƠ ĐỒ CÁC LUỒNG XÁC THỰC (AUTHENTICATION & ONBOARDING FLOWS)

### 📌 Luồng A: Đăng nhập bằng Google (OAuth + Onboarding SĐT)
Dành cho người dùng chọn đăng nhập 1-chạm bằng tài khoản Google.

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant App as FixGo Mobile (index.jsx)
    participant Google as Google SDK / Firebase
    participant Backend as NestJS (/api/auth/google)
    participant DB as PostgreSQL (Prisma)
    participant Router as Expo Router

    User->>App: Bấm "Tiếp tục với Google"
    App->>Google: Yêu cầu đăng nhập (GoogleSignin.signIn)
    Google-->>App: Trả về googleIdToken
    App->>Backend: POST /api/auth/google { idToken: googleIdToken }
    Backend->>Google: Xác thực token với Google OAuth API
    Google-->>Backend: Token hợp lệ (email, name, picture, sub)
    Backend->>DB: Tìm user theo email hoặc googleId
    alt User chưa tồn tại
        Backend->>DB: Tạo User mới (isEmailVerified = true, phone = null)
    end
    Backend-->>App: Trả về { accessToken, user, requirePhoneUpdate: !user.phone }
    App->>App: Lưu accessToken vào AsyncStorage & gắn Axios Header Bearer

    alt requirePhoneUpdate == true (Chưa có SĐT)
        App->>Router: router.push('/(auth)/register-customer', { isSocialOnboarding: 'true' })
        Note over App,Router: Chuyển sang màn hình Nhập SĐT & Xác thực OTP
    else Đã có số điện thoại
        App->>Router: router.replace('/(user)/(tabs)') hoặc '/(worker)/(tabs)'
    end
```

**Các bước xử lý chi tiết:**
1. Người dùng bấm nút **"Đăng nhập với Google"** trên màn hình Login (`app/index.jsx`).
2. Ứng dụng tự động phát hiện nền tảng:
   - **Android / iOS**: Gọi `GoogleSignin.signIn()` qua Google Play Services để lấy `idToken`.
   - **Web**: Dùng Firebase `signInWithPopup(auth, provider)` để lấy `firebaseIdToken`.
3. Mobile gửi `idToken` lên endpoint Backend:
   - Mobile: `POST /api/auth/google` (payload `{ idToken }`).
   - Web: `POST /api/auth/firebase-google` (payload `{ firebaseIdToken }`).
4. Backend xác minh token, giải mã lấy `email`, `name`, `sub` (`googleId`), `avatarUrl`:
   - Nếu tài khoản đã tồn tại: Cập nhật thông tin mới nhất và cấp phát JWT Token.
   - Nếu tài khoản chưa có: Tạo mới tài khoản với `isEmailVerified: true` (vì Google đã xác minh email này), trường `phone` để `null`.
5. Backend phản hồi về Client:
   - `accessToken`: JWT Token có thời hạn.
   - `user`: Thông tin tài khoản người dùng.
   - `requirePhoneUpdate`: Trả về `true` nếu `!user.phone`.
6. **Xử lý Onboarding SĐT (QUAN TRỌNG):**
   - Ứng dụng lưu `accessToken` vào `AsyncStorage` và gán sẵn vào header HTTP Axios.
   - Nếu `requirePhoneUpdate === true`: Ứng dụng **không** vào Home mà điều hướng ngay sang luồng OTP có sẵn:
     ```javascript
     router.push({
       pathname: '/(auth)/register-customer',
       params: {
         isSocialOnboarding: 'true',
         role: userRole,
       },
     });
     ```
   - Người dùng nhập số điện thoại, nhận và xác thực mã OTP SMS. Sau khi xác thực xong, hệ thống cập nhật SĐT vào User và chuyển thẳng vào Trang chủ.

---

### 📌 Luồng B: Đăng ký / Đăng nhập bằng Số điện thoại (Phone-first + OTP)
Dành cho người dùng đăng ký tài khoản truyền thống bằng số điện thoại di động tại Việt Nam.

```
[BƯỚC 1: NHẬP SĐT] 
   └── Người dùng nhập số điện thoại (VD: 0912345678)
   └── Bấm "Nhận mã OTP"
         │
         ▼
[BƯỚC 2: GỬI OTP SMS] 
   └── POST /api/auth/send-phone-otp { phone: "0912345678" }
   └── Backend tạo mã ngẫu nhiên 6 chữ số (VD: 123456)
   └── Lưu mã vào Redis (TTL 5 phút, giới hạn gửi lại sau 60s)
   └── Gửi SMS qua eSMS Gateway (hoặc in log console ở môi trường Sandbox)
         │
         ▼
[BƯỚC 3: XÁC THỰC MÃ OTP] 
   └── Người dùng nhập mã 6 số
   └── POST /api/auth/verify-phone-otp { phone: "0912345678", code: "123456" }
   └── Backend kiểm tra mã trong Redis
   └── Nếu đúng: Trả về { verified: true }
         │
         ▼
[BƯỚC 4: BỔ SUNG HỒ SƠ] 
   └── Chuyển sang bước nhập: Họ tên, Email, Mật khẩu
   └── Gọi POST /api/auth/register-customer (hoặc register-worker)
   └── Backend lưu vào Database với:
         • phone: "0912345678"
         • isEmailVerified: false (MẶC ĐỊNH CHƯA XÁC THỰC EMAIL)
   └── Đăng nhập thành công và chuyển vào Trang chủ FixGo
```

---

### 📌 Luồng C: Xác thực Email sau khi đăng ký bằng SĐT
Giải quyết triệt để vấn đề tài khoản đăng ký bằng SĐT nhập email nhưng chưa được chứng thực danh chủ.

```
       MÀN HÌNH CHỈNH SỬA THÔNG TIN CÁ NHÂN (EditCustomerProfileScreen)
┌────────────────────────────────────────────────────────────────────────┐
│  Họ và tên: Lê Thị Linh                                                │
│  Số điện thoại: 0912 345 678       [Đã xác thực]                       │
│                                                                        │
│  Email: lethilinh@gmail.com        [Chưa xác thực]  [🛡️ Xác thực ngay] │
└───────────────────────────────────────────────────────────┬────────────┘
                                                            │ Click "Xác thực ngay"
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │  POST /api/auth/send-email-otp    │
                                          │  Backend gửi mã 6 số qua SMTP     │
                                          └─────────────────┬─────────────────┘
                                                            │
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │   MODAL NHẬP MÃ OTP EMAIL 6 SỐ   │
                                          │   [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]  │
                                          │   Đếm ngược gửi lại: (59s)        │
                                          └─────────────────┬─────────────────┘
                                                            │ Click "Xác nhận"
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │  POST /api/auth/verify-email-otp  │
                                          │  DB: is_email_verified = true     │
                                          └─────────────────┬─────────────────┘
                                                            │
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │  Badge đổi thành: [✓ Đã xác thực] │
                                          │  Tự động ẩn nút "Xác thực ngay"   │
                                          │  Đồng bộ State qua refreshProfile │
                                          └───────────────────────────────────┘
```

**Các quy tắc nghiệp vụ:**
1. **Kiểm tra trạng thái**: Màn hình đọc cờ `isEmailVerified = !!(user?.isEmailVerified ?? user?.is_email_verified ?? user?.emailVerified)`.
2. **Nếu `isEmailVerified === true`**:
   - Hiển thị badge xanh lá cây `[✓ Đã xác thực]`.
   - Ẩn nút "Xác thực ngay".
3. **Nếu `isEmailVerified === false`**:
   - Hiển thị badge màu hổ phách/cam `[Chưa xác thực]`.
   - Hiển thị nút bấm `[🛡️ Xác thực ngay]`.
4. **Quy trình bấm "Xác thực ngay"**:
   - Gọi `otpService.sendEmailOtp(email)` -> backend gửi email template OTP qua Nodemailer.
   - Mở popup modal với 6 ô nhập mã riêng biệt.
   - Người dùng nhập mã -> Gọi `otpService.verifyEmailOtp(email, code)`.
   - Khi thành công: Backend cập nhật `is_email_verified = true` trong PostgreSQL, Mobile cập nhật AuthContext và gọi `refreshProfile()` để đồng bộ toàn bộ app.

---

## 3. CẤU TRÚC DỮ LIỆU & DATABASE SCHEMA

### 3.1. Bảng `users` trong PostgreSQL (Prisma Model)
Tệp schema: [`doan-kltn-backend/prisma/schema.prisma`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-backend/prisma/schema.prisma)

```prisma
model User {
  id              String      @id @default(uuid())
  phone           String?     @unique
  name            String?
  email           String?     @unique
  passwordHash    String?
  role            UserRole    @default(CUSTOMER) // CUSTOMER | WORKER | ADMIN
  avatarUrl       String?
  status          UserStatus  @default(ACTIVE)   // ACTIVE | BLOCKED | PENDING
  isEmailVerified Boolean     @default(false) @map("is_email_verified")
  googleId        String?     @unique @map("google_id")
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  customerOrders  Order[]          @relation("CustomerOrders")
  customerProfile CustomerProfile?
  workerProfile   WorkerProfile?

  @@map("users")
}
```

### 3.2. Bảng `customer_profiles`
```prisma
model CustomerProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName  String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  addresses Address[]
  orders    Order[]   @relation("CustomerProfileOrders")
  reviews   Review[]
  wallet    Wallet?

  @@map("customer_profiles")
}
```

---

### 3.3. Cơ chế Quản lý Token & Tránh Cache Dữ liệu Cũ (Stale Data)

#### A. Quản lý lưu trữ Token (`tokenStorage`)
- File: [`src/services/storage/tokenStorage.js`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/src/services/storage/tokenStorage.js)
- Sử dụng `@react-native-async-storage/async-storage` với các khóa:
  - `@fixgo_token`: Lưu Access Token JWT.
  - `@fixgo_user`: Lưu snapshot thông tin User.
- Tự động gắn token vào tất cả các request qua Axios Interceptor trong `apiClient.js`:
  ```javascript
  apiClient.interceptors.request.use(async (config) => {
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

#### B. Cơ chế Tự động Làm mới Profile (`useFocusEffect` + `refreshProfile`)
Để tránh tình trạng người dùng vừa cập nhật SĐT, đổi Avatar hoặc xác thực Email xong nhưng khi quay lại màn hình Cá nhân vẫn thấy dữ liệu cũ từ AsyncStorage:
- Trong [`AuthContext.jsx`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/src/features/auth/context/AuthContext.jsx): Cung cấp hàm `refreshProfile()` được tối ưu bằng `useCallback`:
  ```javascript
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      if (profile) {
        setUser(profile);
        await tokenStorage.saveUser(profile);
        return profile;
      }
    } catch (err) {
      console.warn('⚠️ Lỗi refreshProfile:', err);
    }
    return null;
  }, []);
  ```
- Tại các màn hình như [`profile.jsx`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/app/%28user%29/%28tabs%29/profile.jsx): Sử dụng `useFocusEffect` của React Navigation. Mỗi khi màn hình được người dùng chuyển tới (focus), ứng dụng chủ động gọi API Backend để lấy thông tin mới nhất:
  ```javascript
  useFocusEffect(
    useCallback(() => {
      if (typeof refreshProfile === 'function') {
        refreshProfile();
      }
    }, [refreshProfile])
  );
  ```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY CHO PARTNER (STEP-BY-STEP SETUP)

### Bước 1: Clone Repository & Cấu trúc thư mục
```bash
git clone <URL_REPO_GIT>
cd do-an-fix-go-tho-tot
```

Cấu trúc dự án gồm 2 phần chính:
- `doan-kltn-backend`: NestJS Server, Prisma, Redis, Docker Compose.
- `doan-kltn-mobile`: React Native Expo Mobile App.

---

### Bước 2: Cấu hình Biến môi trường (.env)

#### 1. Cấu hình Backend:
Chuyển vào thư mục backend và copy file mẫu:
```bash
cd doan-kltn-backend
cp .env.example .env
```
Mở `.env` và kiểm tra:
- `DATABASE_URL`: Đảm bảo mật khẩu và tên DB khớp với `docker-compose.yml` (`postgrespassword` và `ondemand_db`).
- `REDIS_PORT`: Mặc định là `6380`.
- `SMTP_USER` & `SMTP_PASS`: Nhập Gmail của bạn và Mật khẩu ứng dụng 16 ký tự để test gửi OTP Email thật.

#### 2. Cấu hình Mobile:
Chuyển sang thư mục mobile và copy file mẫu:
```bash
cd ../doan-kltn-mobile
cp .env.example .env.local
```
Mở `.env.local`:
- Điền `EXPO_PUBLIC_API_URL` bằng IP mạng LAN của máy bạn (VD: `http://192.168.1.15:3000/api`) hoặc đường link Ngrok (VD: `https://fixgo-api.ngrok-free.dev/api`).

---

### Bước 3: Cài đặt Dependencies & Khởi chạy Backend

#### 1. Khởi động Container Database & Redis:
Tại thư mục `doan-kltn-backend/` (hoặc thư mục gốc dự án):
```bash
docker compose up -d
```
Kiểm tra container đang chạy:
```bash
docker ps
```
*(Bạn sẽ thấy 2 container: `ondemand_postgres` cổng 5432 và `ondemand_redis` cổng 6380).*

#### 2. Cài đặt thư viện & chạy migrate DB:
```bash
cd doan-kltn-backend
npm install
npx prisma generate
npx prisma migrate dev
```

#### 3. Khởi động Backend Server:
```bash
npm run dev
```
Backend sẽ chạy tại: `http://localhost:3000`  
Tài liệu Swagger API: `http://localhost:3000/api/docs`

---

### Bước 4: Khởi chạy Ứng dụng Mobile

Mở một cửa sổ Terminal mới:
```bash
cd doan-kltn-mobile
npm install
```

#### Khởi chạy với Expo:
Luôn thêm cờ `-c` (clear cache) khi khởi động để đảm bảo Expo nạp đúng biến môi trường mới từ `.env.local`:
```bash
npx expo start -c
```

#### Cách kiểm thử (Testing):
1. **Trên Thiết bị thật (Android / iOS)**:
   - Cài app **Expo Go** trên điện thoại.
   - Đảm bảo điện thoại và máy tính cùng kết nối vào một mạng Wi-Fi (hoặc dùng đường hầm Ngrok).
   - Quét mã QR hiển thị trên Terminal.
2. **Trên Nền tảng Web**:
   - Nhấn phím `w` trong Terminal để mở trình duyệt.
   - Thử nghiệm đăng nhập Google qua Firebase Popup.

---

## 5. BẢNG DANH MỤC CÁC ENDPOINT AUTH QUAN TRỌNG

| Phương thức | Endpoint | Chức năng | Yêu cầu xác thực |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register-customer` | Đăng ký tài khoản khách hàng | Public |
| `POST` | `/api/auth/register-worker` | Đăng ký tài khoản thợ dịch vụ | Public |
| `POST` | `/api/auth/login` | Đăng nhập bằng Email/SĐT + Password | Public |
| `POST` | `/api/auth/google` | Đăng nhập tài khoản Google (Mobile Native) | Public |
| `POST` | `/api/auth/firebase-google` | Đăng nhập tài khoản Google (Web Popup) | Public |
| `POST` | `/api/auth/send-phone-otp` | Gửi mã OTP SMS về số điện thoại | Public |
| `POST` | `/api/auth/verify-phone-otp` | Xác thực mã OTP số điện thoại | Public |
| `POST` | `/api/auth/send-email-otp` | Gửi mã OTP xác nhận về Email | Public / Bearer Token |
| `POST` | `/api/auth/verify-email-otp` | Xác thực mã OTP Email (đổi `isEmailVerified`) | Public / Bearer Token |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại | Bearer Token |
| `PUT` | `/api/users/profile` | Cập nhật thông tin cá nhân | Bearer Token |
| `POST` | `/api/users/avatar` | Upload ảnh đại diện lên Cloudinary | Bearer Token |

---

## 6. DANH SÁCH FILE CỐT LÕI CẦN LƯU Ý KHI PHÁT TRIỂN TIẾP

- 📱 **Mobile Login & Luồng Google**: [`doan-kltn-mobile/app/index.jsx`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/app/index.jsx)
- 📱 **Mobile Onboarding SĐT & OTP**: [`doan-kltn-mobile/app/(auth)/register-customer.jsx`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/app/%28auth%29/register-customer.jsx)
- 📱 **Mobile Chỉnh sửa & Xác thực Email OTP**: [`doan-kltn-mobile/app/(user)/profile/edit.jsx`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/app/%28user%29/profile/edit.jsx)
- 📱 **Mobile Auth Context & Token**: [`doan-kltn-mobile/src/features/auth/context/AuthContext.jsx`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-mobile/src/features/auth/context/AuthContext.jsx)
- 💻 **Backend Auth Service**: [`doan-kltn-backend/src/modules/auth/auth.service.js`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-backend/src/modules/auth/auth.service.js)
- 💻 **Backend OTP Service**: [`doan-kltn-backend/src/modules/auth/otp.service.js`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-backend/src/modules/auth/otp.service.js)
- 💻 **Backend OTP Controller**: [`doan-kltn-backend/src/modules/auth/otp.controller.js`](file:///d:/doan/do-an-fix-go-tho-tot/doan-kltn-backend/src/modules/auth/otp.controller.js)

---
*Mọi thắc mắc kỹ thuật vui lòng kiểm tra thêm Swagger UI hoặc trao đổi trực tiếp trong nhóm phát triển dự án.*
