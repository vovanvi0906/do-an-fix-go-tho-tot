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

## 🚀 Khởi Động Toàn Bộ Hệ Thống (1 Lệnh Duy Nhất)

Tại thư mục gốc `G:\project-school`, mở CMD hoặc PowerShell và chạy:

```cmd
.\dev.bat
```

Script sẽ tự động:
1. Kiểm tra trạng thái Docker Desktop.
2. Khởi chạy PostgreSQL (PostGIS) và Redis bằng `docker-compose.yml` với cấu hình trần RAM thấp nhất.
3. Kích hoạt Virtualenv và chạy **AI FastAPI Microservice** trên port `8000`.
4. Tự động chạy Prisma Client Generate, Schema Sync (`db push`) và Seed Catalog/Super Admin.
5. Chạy **NestJS Backend** ở chế độ Watch Mode trên port `3000`.

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
