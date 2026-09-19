# Doan KLTN Backend - On-Demand Home Service

Dự án Backend cung cấp API cho hệ thống đặt lịch dịch vụ gia đình FixGo Pro, xây dựng trên nền tảng NestJS, Prisma, PostgreSQL (PostGIS) và Redis (BullMQ).

## 🛠 Tech Stack
- **Framework:** NestJS (Node.js 24)
- **Database:** PostgreSQL 16 (tích hợp PostGIS cho tọa độ không gian)
- **Caching & Job Queue:** Redis 7 (BullMQ Delayed Jobs)
- **ORM:** Prisma v6
- **AI Microservice:** Python FastAPI (port 8000)
- **Infrastructure:** Docker Compose (Low RAM Alpine mode)

---

## 🚀 Hướng Dẫn Khởi Chạy

### Cách 1: Khởi động toàn bộ dự án từ thư mục gốc (Khuyên Dùng)
Mở Terminal tại thư mục gốc `G:\project-school` và chạy:
```cmd
.\dev.bat
```

### Cách 2: Khởi động riêng Backend
Mở Terminal tại thư mục `doan-kltn-backend` và chạy:
```cmd
.\start-dev.bat
```
Hoặc qua npm:
```cmd
npm run dev
```

### 🔗 Địa chỉ truy cập
- **API Base:** `http://localhost:3000/api`
- **Swagger Documentation:** `http://localhost:3000/api/docs`
- **AI Service:** `http://localhost:8000`