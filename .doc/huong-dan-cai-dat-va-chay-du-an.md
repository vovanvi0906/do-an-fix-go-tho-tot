# FIXGO PRO - HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG TRÊN MÁY MỚI (LINUX & WINDOWS)

> Tài liệu chuẩn hóa giúp thành viên mới hoặc người chấm bài (giảng viên/hội đồng) có thể clone repo và khởi động toàn bộ hệ thống (Database, AI Service, Backend Server, Web Admin, Customer Mobile App & Worker Mobile App) một cách trơn tru, không gặp lỗi môi trường.

---

## 🏛 1. Tổng quan Kiến trúc & Cổng Dịch vụ (Ports)

| Thành phần | Thư mục | Công nghệ | Cổng (Port) | Đường dẫn kiểm tra / Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL + PostGIS** | Docker Container | `postgis:16-3.4-alpine` | `5432` | `localhost:5432` |
| **Redis Cache** | Docker Container | `redis:7-alpine` | `6380` | Map vào 6379 trong container |
| **Backend Core Server** | `server/` | Node.js 20+ / NestJS / Prisma | `3000` | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| **AI Microservice** | `ai-service/` | Python 3.10+ / FastAPI / YOLOv8 | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Web Admin Portal** | `client/` | React 18 / Vite / TailwindCSS | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Customer App** | `customer-app/` | React Native (Expo SDK 52) | `8081` | Định danh: `com.fixgo.customer` |
| **Worker App** | `worker-app/` | React Native (Expo SDK 52) | `8082` | Định danh: `com.fixgo.worker` |

---

## ⚙️ 2. Yêu cầu Môi trường Tối thiểu

Trước khi bắt đầu, máy tính cần cài sẵn các công cụ sau:

1. **Docker & Docker Compose**: Để chạy PostgreSQL (PostGIS) và Redis.
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update && sudo apt install -y docker.io docker-compose-v2
     sudo usermod -aG docker $USER
     ```
   - **Windows**: Cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (bật WSL2 engine).
2. **Node.js**: Phiên bản LTS 20.x hoặc 22.x (Khuyên dùng NVM).
3. **Python**: Phiên bản 3.10 đến 3.12 (kèm gói `python3-venv` và `python3-pip`).
4. **EAS CLI (Nếu build APK)**: Cài đặt công cụ đóng gói app:
   ```bash
   npm install -g eas-cli
   ```

---

## 🚀 3. Quy trình Cài đặt Lần Đầu (1-Click Setup)

Tại thư mục gốc của dự án:

### Trên Linux:
```bash
chmod +x setup.sh dev-local.sh stop.sh
./setup.sh
```

### Trên Windows:
```cmd
.\setup.bat
```

> **Script tự động làm các công việc sau:**
> 1. Tự sao chép các file cấu hình `.env.example` thành `.env` chuẩn cho `server`, `client`, `customer-app`, `worker-app`.
> 2. Cài đặt toàn bộ `node_modules` cho cả 4 project.
> 3. Tạo môi trường ảo Python `.venv`, cài đặt thư viện AI và tự động tải bộ weights mô hình YOLOv8, YuNet, SFace.
> 4. Khởi động Docker Postgres/Redis và chạy `npx prisma db push` đồng bộ bảng dữ liệu.
> 5. Tự động phát hiện IP máy tính và đồng bộ vào file cấu hình mobile.

---

## 🎬 4. Khởi chạy Hệ thống Hàng ngày (Daily Run)

### Bước 1: Khởi động Data Layer + Backend Server + AI + Web Admin
- **Trên Linux**:
  ```bash
  ./dev-local.sh
  ```
- **Trên Windows**:
  ```cmd
  .\dev-local.bat
  ```

---

### Bước 2: Nạp dữ liệu mẫu ban đầu (Chỉ chạy 1 lần sau khi tạo database)
Mở một tab terminal khác:
```bash
cd server
node prisma/seed.js
```
*Tài khoản mẫu được tạo sẵn:*
- **Khách hàng**: `khach1@fixgo.vn` / Mật khẩu: `123456`
- **Thợ dịch vụ**: `tho1@fixgo.vn` / Mật khẩu: `123456`
- **Quản trị viên (Admin)**: `admin@fixgo.vn` / Mật khẩu: `Admin@123`

---

### Bước 3: Chạy 2 Ứng dụng Di động (Customer App & Worker App)

Vì dự án đã phân tách thành 2 app độc lập, bạn có thể chạy riêng từng app hoặc chạy song song cả 2:

#### A. Chạy App Khách Hàng (`customer-app`):
Mở một terminal mới:
```bash
cd customer-app
npx expo start -c
```
- Bấm phím **`a`** trên bàn phím terminal để tự động mở trên máy ảo Android Emulator.
- Hoặc quét mã QR bằng app **Expo Go** trên điện thoại thật.

#### B. Chạy App Thợ (`worker-app`):
Mở một terminal khác:
```bash
cd worker-app
# Dùng port 8082 nếu customer-app đang chiếm port 8081
npx expo start -c --port 8082
```
- Bấm phím **`a`** để mở ứng dụng Thợ trên máy ảo Android (cả 2 app cài đặt song song không bị đè do có package ID khác nhau: `com.fixgo.customer` và `com.fixgo.worker`).

---

## 📱 5. Vận hành & Kết nối Mobile App (Đảm bảo gọi được API)

Khi chạy ứng dụng Mobile, vấn đề phổ biến nhất là **thiết bị (máy ảo hoặc điện thoại thật) không gọi được API của máy tính**. Dự án cung cấp 2 giải pháp:

### Giải pháp A: Kết nối qua Mạng LAN Wi-Fi nội bộ (Mặc định)
Nếu máy tính và điện thoại kết nối chung mạng Wi-Fi:
1. Chạy script tự động cập nhật IP:
   ```bash
   node scripts/update-ip.js
   ```
   *(Script sẽ tự động cập nhật địa chỉ IP máy tính vào cả 2 file `customer-app/.env` và `worker-app/.env`).*
2. Khởi động lại Metro bundler với cờ `-c`:
   ```bash
   cd customer-app && npx expo start -c
   ```

### Giải pháp B: Kết nối Toàn cầu qua Cloudflare Tunnel (Chạy mọi nơi - Khuyên dùng)
Dành cho trường hợp điện thoại dùng 4G, khác mạng Wi-Fi hoặc máy ảo bị chặn kết nối HTTP cục bộ:
1. Mở một terminal và chạy đường hầm:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
2. Cloudflare sẽ cấp link HTTPS (ví dụ: `https://xxxx.trycloudflare.com`).
3. Điền link này vào biến `EXPO_PUBLIC_API_URL` trong cả `customer-app/.env` và `worker-app/.env`.

---

## 🛠 6. Hướng dẫn Build File APK với EAS Build

### ⚠️ Lưu ý Cốt lõi về EAS Project ID (Tránh lỗi `Slug does not match`)

Khi tách ra 2 thư mục `customer-app` (slug: `fixgo-customer`) và `worker-app` (slug: `fixgo-worker`), mỗi ứng dụng phải được liên kết với một **Project ID riêng biệt** trên Expo Cloud:

```
Lỗi gặp phải nếu chưa liên kết lại:
Slug for project identified by "extra.eas.projectId" (doan-kltn-mobile) does not match the "slug" field (fixgo-customer)
```

---

### Quy trình Build APK chuẩn từng bước:

#### Bước 1: Khởi tạo Project ID mới cho từng App trên Expo

Thực hiện lệnh này **1 lần duy nhất** tại mỗi thư mục app:

1. **Cho App Khách Hàng**:
   ```bash
   cd customer-app
   eas project:init
   ```
   - Terminal hỏi: *"Would you like to link to an existing project or create a new one?"* ➔ Chọn **Create a new project**.
   - EAS sẽ tự động tạo project `fixgo-customer` trên tài khoản Expo của bạn và cập nhật mã `projectId` mới vào `customer-app/app.json`.

2. **Cho App Thợ**:
   ```bash
   cd worker-app
   eas project:init
   ```
   - Chọn **Create a new project** để tạo `fixgo-worker` trên Expo.

---

#### Bước 2: Tiến hành Build File APK

Dự án đã cấu hình sẵn 2 Profile build trong file `eas.json`:

##### 1. Development Build (Khuyên dùng khi lập trình & Chấm đồ án)
Bản build này tích hợp đầy đủ các native module (Camera AI, Google Sign-In, Bản đồ). Build **đúng 1 lần duy nhất**, sau đó khi lập trình sửa code app sẽ tự động Hot Reload qua Metro mà không cần build lại:

- **Build App Khách Hàng**:
  ```bash
  cd customer-app
  eas build --platform android --profile development
  ```
- **Build App Thợ**:
  ```bash
  cd worker-app
  eas build --platform android --profile development
  ```
- Khi hoàn tất (khoảng 5-8 phút trên cloud Expo), terminal sẽ trả về đường link tải trực tiếp file `.apk`. Bạn tải về điện thoại và cài đặt bình thường.

##### 2. Preview Build (Bản độc lập để gửi người khác test thử mà không cần máy tính)
Bản build này đóng gói sẵn mã nguồn và link API server (Cloudflare Tunnel), người nhận chỉ cần mở app là dùng được ngay:
- **Build App Khách Hàng**:
  ```bash
  cd customer-app
  eas build --platform android --profile preview
  ```
- **Build App Thợ**:
  ```bash
  cd worker-app
  eas build --platform android --profile preview
  ```

---

#### Bước 3: Build Offline bằng máy tính cục bộ (Không chờ máy chủ Expo)
Nếu máy tính của bạn đã cài sẵn **Android Studio & Android SDK**:
- Thêm cờ `--local` vào lệnh build:
  ```bash
  cd customer-app
  eas build --platform android --profile development --local
  ```
- File `.apk` sẽ được tạo trực tiếp ngay trong thư mục máy tính của bạn sau 2-3 phút.

---

## 🛑 7. Dừng Toàn bộ Hệ thống

Khi kết thúc phiên làm việc:
- **Trên Linux**: `./stop.sh`
- **Trên Windows**: `.\stop.bat`

Script sẽ tự động giải phóng cổng mạng, tắt các tiến trình Node.js, Python Uvicorn và đưa các Docker container vào trạng thái dừng an toàn.
