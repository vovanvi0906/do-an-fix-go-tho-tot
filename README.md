# FixGo Pro - Hệ Thống Đặt Lịch Thợ Dịch Vụ Gia Đình (On-Demand Home Services)

> **Mô hình kiến trúc Hybrid:** Kết hợp Docker Container siêu nhẹ cho Data Layer và Native Host Execution cho Application Layer, tối ưu hóa mức tiêu thụ RAM tối đa trên Windows.

---

## 🏛 Cấu Trúc Hệ Thống (Architecture & Ports)

| Thành phần | Công nghệ | Cách vận hành | Port | Mức trần RAM |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL + PostGIS** | `postgis/postgis:16-3.4-alpine` | Docker Container | `5432` | **300 MB** (Hard limit) |
| **Redis Cache & Queue** | `redis:7-alpine` | Docker Container | `6380` (và `6379`) | **80 MB** (Hard limit) |
| **Backend API** | NestJS (Node.js 24) | Windows Host Native | `3000` | ~150 - 250 MB |
| **AI Microservice** | FastAPI (Python 3.13) | Windows Host Native | `8000` | ~100 - 200 MB |
| **Admin Web Portal** | React 18 + Vite | Windows Host Native | `5173` | ~100 MB |
| **Mobile App** | Expo (React Native) | Windows Host Native | `8081` | ~150 MB |

---

## 🚀 Hướng Dẫn Nhanh Cho Người Mới Clone Repo (3 Bước)

### 📌 Bước 1: Chuẩn bị môi trường trên máy tính
- **Node.js**: Phiên bản LTS (18.x / 20.x / 22.x).
- **Python**: Phiên bản 3.10+ (Đảm bảo tick chọn *"Add python.exe to PATH"* khi cài đặt).
- **Docker Desktop**: Bật Docker Desktop trước khi chạy.
- **Điện thoại di động**: Cài đặt app **Expo Go** (trên App Store hoặc Google Play Store) và kết nối vào **cùng mạng Wi-Fi** với máy tính.

---

### 📌 Bước 2: Cài đặt thư viện lần đầu (Chỉ chạy 1 lần)
Mở Terminal tại thư mục gốc dự án và chạy:
```cmd
.\setup.bat
```
Script sẽ tự động tạo các virtualenv Python, cài đặt toàn bộ `npm packages` cho cả 3 ứng dụng (Backend, Web, Mobile) và tải sẵn Docker image.

---

### 📌 Bước 3: Khởi chạy toàn bộ hệ thống (1 Click duy nhất)
```cmd
.\dev.bat
```
Hệ thống sẽ tự động:
1. Tự động quét và phát hiện địa chỉ **IPv4 Wi-Fi nội bộ** của máy tính bạn (bất kể bạn đang ở trường, ở nhà hay quán cafe) và đồng bộ vào Mobile `.env`.
2. Khởi động **PostgreSQL + PostGIS** & **Redis** qua Docker.
3. Đồng bộ cơ sở dữ liệu Prisma (`prisma db push`).
4. Khởi chạy **AI Service** (`http://localhost:8000/docs`).
5. Khởi chạy **Backend API** (`http://localhost:3000/api`).
6. Khởi chạy **Web Admin** (`http://localhost:5173`).
7. Mở cửa sổ **Expo Metro Bundler** độc lập hiển thị **Mã QR Code**: Bạn chỉ cần mở app **Expo Go** trên điện thoại và quét mã QR là app chạy ngay lập tức!

---

## 🛑 Dừng Toàn Bộ Hệ Thống

Để dừng tất cả containers và giải phóng RAM:

```cmd
.\stop.bat
```

---

## ⚡ Tối Ưu RAM Cho WSL2 / Docker Desktop (Khóa Trần 2GB RAM)

File cấu hình `.wslconfig` đã được thiết lập tại `%USERPROFILE%\.wslconfig`:

```ini
[wsl2]
memory=2GB
processors=2
swap=1GB
autoMemoryReclaim=gradual
```

*Nếu cần áp dụng lại, bạn có thể click đúp chạy file `setup-wsl-ram.bat`.*
