# 🚀 FIXGO PRO — HƯỚNG DẪN THIẾT LẬP & KHỞI CHẠY DỰ ÁN (GETTING STARTED)

> **Tài liệu chuẩn hóa**: Hướng dẫn chi tiết từng bước thiết lập môi trường và khởi động toàn bộ hệ thống FixGo Pro từ khi vừa `git clone` về máy.
> 
> ⚠️ **QUY TẮC BẮT BUỘC DÀNH CHO AI & DEVELOPER**: Khi thêm service mới, đổi port, thêm biến môi trường hoặc thay đổi quy trình khởi chạy, **BẮT BUỘC PHẢI CẬP NHẬT LẠI FILE NÀY** cùng các script liên quan (`setup.bat`, `dev.bat`, `stop.bat`, `docker-compose.yml`).

---

## 🏛 1. BẢNG TỔNG QUAN HỆ THỐNG & CỔNG DỊCH VỤ (SERVICES & PORTS)

Hệ thống hoạt động theo mô hình **Hybrid Architecture**:
- **Data Layer (PostgreSQL/PostGIS, Redis)**: Đóng gói Docker Container siêu nhẹ, giới hạn RAM.
- **Application Layer (Backend, AI, Web, Mobile)**: Chạy Native trên Windows Host để tối ưu tài nguyên và tốc độ dev.

| Dịch vụ | Công nghệ | Cách thức chạy | Port | Đường dẫn kiểm tra (Health/Swagger) | Mức trần RAM |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL + PostGIS** | `postgis/postgis:16-3.4-alpine` | Docker Container (`ondemand_postgres`) | `5432` | `localhost:5432` (DB: `fixgodb`) | ~300 MB |
| **Redis Cache & Queue** | `redis:7-alpine` | Docker Container (`ondemand_redis`) | `6379`, `6380` | `localhost:6379` | ~80 MB |
| **Backend API** | NestJS (Node.js 24) + Prisma | Native Host | `3000` | `http://localhost:3000/api` | ~150 - 250 MB |
| **AI Microservice** | FastAPI (Python 3.10+) + YOLO/ArcFace | Native Host (Virtualenv) | `8000` | `http://localhost:8000/docs` | ~100 - 200 MB |
| **Admin Web Portal** | React 18/19 + Vite | Native Host | `5173` | `http://localhost:5173` | ~100 MB |
| **Mobile App** | Expo (React Native) | Native Host (Metro) | `8081` | Metro Bundler QR Code | ~150 MB |

---

## 💻 2. YÊU CẦU TIỀN QUYẾT TRÊN MÁY TÍNH (PREREQUISITES)

Cài đặt các công cụ sau trước khi khởi động dự án:

1. **Node.js**: Phiên bản LTS (`>= 18.x`, khuyến nghị `20.x` hoặc `22.x/24.x`).
2. **Python**: Phiên bản `3.10+` (Khi cài đặt, **bắt buộc tick chọn `Add python.exe to PATH`**).
3. **Docker Desktop**: Cài đặt và bật sẵn Docker Desktop trước khi chạy.
4. **Git**: Đã cài đặt để quản lý mã nguồn.
5. **Điện thoại test Mobile (Tùy chọn)**: Cài ứng dụng **Expo Go** (App Store / Google Play) và kết nối cùng mạng Wi-Fi với máy tính.

---

## ⚡ 3. QUY TRÌNH KHỞI ĐỘNG NHANH 1-CLICK (KHUYÊN DÙNG TRÊN WINDOWS)

### 📌 Bước 1: Cài đặt toàn bộ môi trường lần đầu (Chỉ chạy 1 lần sau khi clone)

Mở Command Prompt / PowerShell tại thư mục gốc dự án:

```cmd
.\setup.bat
```

> **`setup.bat` sẽ tự động thực hiện:**
> 1. Kiểm tra Node.js, Python, Docker CLI.
> 2. Sao chép `.env.example` -> `.env` cho Backend.
> 3. Cài đặt `npm dependencies` và sinh `Prisma Client` (`npx prisma generate`).
> 4. Tạo môi trường ảo Python (`ai-service/.venv`) và cài đặt `requirements.txt`.
> 5. Cài đặt `npm dependencies` cho Web Admin (`doan-kttn-frontend`) và Mobile (`doan-kltn-mobile`).
> 6. Tải sẵn Docker Image `postgis` và `redis`.

---

### 📌 Bước 2: Khởi chạy toàn bộ hệ thống

Đảm bảo Docker Desktop đã bật, sau đó chạy:

```cmd
.\dev.bat
```

> **`dev.bat` sẽ tự động xử lý:**
> 1. Khởi động Docker Containers cho PostgreSQL & Redis (`docker compose up -d`).
> 2. Đồng bộ Prisma Schema vào Database (`prisma db push`).
> 3. Tự động quét địa chỉ IPv4 Wi-Fi máy tính và cập nhật vào `doan-kltn-mobile/.env` qua `scripts/update-ip.js`.
> 4. Mở cửa sổ riêng cho **Expo Metro Bundler** (hiển thị mã QR để quét trên điện thoại).
> 5. Khởi chạy song song Backend, AI Service và Web Admin với file log lưu tại thư mục `logs/`.

---

### 📌 Bước 3: Kiểm tra các dịch vụ hoạt động

- 🌐 **Web Admin**: Truy cập [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend API**: Truy cập [http://localhost:3000/api](http://localhost:3000/api)
- 🤖 **AI Swagger Docs**: Truy cập [http://localhost:8000/docs](http://localhost:8000/docs)
- 📱 **Mobile App**: Mở app **Expo Go** trên điện thoại và quét mã QR trên cửa sổ terminal Metro.

---

### 🛑 Bước 4: Dừng toàn bộ hệ thống khi xong việc

Để tắt toàn bộ tiến trình Node.js, Python, Uvicorn và giải phóng Docker:

```cmd
.\stop.bat
```

---

## 🛠 4. QUY TRÌNH KHỞI CHẠY THỦ CÔNG TỪNG THÀNH PHẦN (MANUAL CLI)

Nếu bạn muốn chạy riêng lẻ từng dịch vụ hoặc debug chi tiết từng terminal:

### 1️⃣ Khởi động Database & Cache (Docker)
```bash
docker compose up -d
```

### 2️⃣ Khởi động Backend (NestJS)
```bash
cd doan-kltn-backend

# Cài đặt và tạo env
cp .env.example .env
npm install

# Đồng bộ Prisma
npx prisma generate
npx prisma db push

# Khởi chạy Dev server
npm run dev
```

### 3️⃣ Khởi động AI Microservice (Python FastAPI)

**Cách 1: Chạy qua Docker (Khuyên dùng khi triển khai/đóng gói)**
```bash
# Khởi động AI service cùng Postgres & Redis
docker compose up -d ai-service

# Xem logs container AI
docker compose logs -f ai-service
```

**Cách 2: Chạy Native bằng Virtualenv (Thuận tiện khi debug code Python)**
```bash
cd ai-service

# Tạo và kích hoạt virtualenv (Windows)
python -m venv .venv
.venv\Scripts\activate

# Cài đặt thư viện
pip install --upgrade pip
pip install -r requirements.txt

# Khởi chạy FastAPI
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4️⃣ Khởi động Web Admin (React + Vite)
```bash
cd doan-kttn-frontend

# Cài đặt và tạo env
cp .env.example .env.local
npm install

# Khởi chạy Dev server
npm run dev
```

### 5️⃣ Khởi động Mobile App (Expo / React Native)
```bash
# Đồng bộ IP Wi-Fi máy chủ vào Mobile .env
node scripts/update-ip.js

cd doan-kltn-mobile
npm install

# Khởi chạy Expo Metro Bundler
npx expo start -c
```

---

## ⚙️ 5. CÁC CÔNG CỤ & TIỆN ÍCH BỔ TRỢ (UTILITY SCRIPTS)

- **`dev-local.bat`**: Khởi chạy toàn bộ hệ thống ở chế độ hiển thị trực tiếp màu mè trên terminal thay vì xuất log ngầm ra file `logs/`.
- **`setup-wsl-ram.bat`**: Thiết lập giới hạn trần RAM WSL2/Docker xuống 2GB để chống tràn RAM trên các máy tính 8GB/16GB RAM.
- **`scripts/update-ip.js`**: Tự động phát hiện card mạng Wi-Fi thực tế (loại bỏ VPN/WSL/VirtualBox ảo) để điện thoại thật kết nối chính xác vào API máy tính.

---

## 📋 6. NGUYÊN TẮC BẢO TRÌ & CẬP NHẬT KHI CÓ THAY ĐỔI (CHỈ DẪN CHO AI)

Khi phát triển thêm tính năng hoặc thay đổi hệ thống, AI/Developer cần tuân thủ:

1. **Thêm Microservice / Package mới**:
   - Thêm câu lệnh cài đặt vào `setup.bat`.
   - Thêm câu lệnh khởi chạy vào `dev.bat` và `dev-local.bat`.
   - Thêm tiến trình cần kill vào `stop.bat`.
   - Cập nhật bảng Port và các bước trong file này (`.agents/SETUP_AND_RUN.md`).
2. **Thêm Database / Container mới**:
   - Khai báo trong `docker-compose.yml`.
   - Đặt giới hạn `mem_limit` và `mem_reservation`.
   - Cập nhật lệnh khởi động trong file này.
3. **Thêm Biến Môi Trường (.env)**:
   - Luôn tạo biến mẫu trong các file `.env.example` tương ứng.
   - Thêm logic tự động copy `.env.example` sang `.env` trong `setup.bat` và `dev.bat` nếu chưa tồn tại.
