# FIXGO PRO - HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG TRÊN MÁY MỚI (LINUX & WINDOWS)

> Tài liệu chuẩn hóa giúp thành viên mới hoặc người chấm bài (giảng viên/hội đồng) có thể clone repo và khởi động toàn bộ hệ thống (Database, AI Service, Backend, Web Admin, Mobile App) một cách trơn tru, không gặp lỗi môi trường.

---

## 🏛 1. Tổng quan Kiến trúc & Cổng Dịch vụ (Ports)

| Thành phần | Công nghệ | Cổng (Port) | Đường dẫn kiểm tra |
| :--- | :--- | :--- | :--- |
| **PostgreSQL + PostGIS** | Docker Container (`postgis:16-3.4-alpine`) | `5432` | `localhost:5432` |
| **Redis Cache** | Docker Container (`redis:7-alpine`) | `6380` (map vào 6379) | `localhost:6380` |
| **Backend API** | Node.js + NestJS + Prisma ORM | `3000` | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| **AI Microservice** | Python 3.10+ + FastAPI + YOLOv8 | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Web Admin Portal** | React 18 + Vite | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Mobile App** | React Native (Expo SDK 52) | `8081` | Metro Bundler |

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
3. **Python**: Phiên bản 3.10 đến 3.14 (kèm gói `python3-venv` và `python3-pip`).

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
> 1. Tự sao chép các file cấu hình `.env.example` thành `.env` chuẩn.
> 2. Cài đặt toàn bộ `node_modules` cho Backend, Web Frontend và Mobile App.
> 3. Tạo môi trường ảo Python `.venv`, cài đặt thư viện AI và tự động tải bộ weights mô hình YOLOv8, YuNet, SFace.
> 4. Khởi động Docker Postgres/Redis và chạy `npx prisma db push` đồng bộ bảng dữ liệu.

---

## 🎬 4. Khởi chạy Hệ thống Hàng ngày (Daily Run)

### Bước 1: Khởi động Data Layer + Backend + AI + Web Admin
- **Trên Linux**:
  ```bash
  ./dev-local.sh
  ```
- **Trên Windows**:
  ```cmd
  .\dev-local.bat
  ```

### Bước 2: Nạp dữ liệu mẫu ban đầu (Chỉ chạy 1 lần sau khi tạo database)
Mở một tab terminal khác:
```bash
cd doan-kltn-backend
node prisma/seed.js
```
*Tài khoản mẫu được tạo sẵn:*
- **Khách hàng**: `khach1@fixgo.vn` / Mật khẩu: `123456`
- **Thợ dịch vụ**: `tho1@fixgo.vn` / Mật khẩu: `123456`
- **Quản trị viên (Admin)**: `admin@fixgo.vn` / Mật khẩu: `Admin@123`

---

## 📱 5. Vận hành & Kết nối Mobile App (Đảm bảo chạy trên mọi máy)

Khi chạy ứng dụng Mobile, vấn đề phổ biến nhất là **thiết bị (máy ảo hoặc điện thoại thật) không gọi được API của máy tính**. Dự án cung cấp 2 giải pháp:

### Giải pháp A: Kết nối Toàn cầu qua Cloudflare Tunnel (Khuyên dùng - Chạy mọi nơi)
Dành cho trường hợp điện thoại dùng 4G, khác mạng Wi-Fi hoặc máy ảo bị chặn HTTP:
1. Mở một terminal và chạy đường hầm:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
2. Cloudflare sẽ cấp một link HTTPS (ví dụ: `https://xxxx.trycloudflare.com`).
3. Cập nhật link này vào `EXPO_PUBLIC_API_URL` trong file `doan-kltn-mobile/.env`.

### Giải pháp B: Kết nối qua Mạng LAN Wi-Fi nội bộ
Nếu máy tính và điện thoại kết nối chung Wi-Fi:
1. Chạy script tự động nhận diện IP Wi-Fi:
   ```bash
   node scripts/update-ip.js
   ```
2. Mở tab terminal khác và chạy Expo:
   ```bash
   cd doan-kltn-mobile
   npx expo start -c
   ```
3. Mở app **Expo Go** trên điện thoại và quét mã QR trên màn hình terminal.

---

## 🛠 6. Hướng dẫn Build File APK Độc lập (Android)

Để build ra file APK cài trực tiếp cho người khác dùng thử:
1. Đăng nhập tài khoản Expo:
   ```bash
   eas login
   ```
2. Khởi tạo cấu hình dự án của bạn:
   ```bash
   cd doan-kltn-mobile
   eas init
   ```
3. Chạy lệnh đóng gói APK:
   ```bash
   eas build --platform android --profile preview
   ```
4. Khi quá trình build trên Cloud hoàn tất, quét mã QR hoặc tải file `.apk` về cài đặt vào điện thoại hoặc kéo thả vào Android Emulator.

---

## 🛑 7. Dừng Toàn bộ Hệ thống
Khi kết thúc phiên làm việc:
- **Trên Linux**: `./stop.sh`
- **Trên Windows**: `.\stop.bat`
Script sẽ tắt toàn bộ tiến trình chạy nền và giải phóng RAM sạch sẽ.

