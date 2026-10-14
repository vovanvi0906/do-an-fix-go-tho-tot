---
name: Kiến Trúc Hệ Thống Tổng Thể
description: Quy định ranh giới kiến trúc giữa Backend (NestJS), AI Service (FastAPI), Admin Web và Mobile App.
globs: "*"
alwaysApply: true
---

# 🏛️ Kiến Trúc Hệ Thống FixGo Pro (System Architecture)

## 1. Phân Tầng & Trách Nhiệm (Separation of Concerns)

FixGo Pro là hệ thống **Hybrid Modular Monolith & Dedicated Microservices**:

1. **Backend API Core (`doan-kltn-backend/` - NestJS on Node.js 24)**:
   - Đóng vai trò trung tâm nghiệp vụ, API Gateway, Auth/JWT, State Machine cho đơn hàng.
   - Kết nối PostgreSQL + PostGIS qua **Prisma ORM**.
   - Quản lý giao dịch ví, WebSocket Gateway (Socket.io) kết hợp **Redis Pub/Sub**.
   - Giao tiếp với AI Service qua HTTP REST nội bộ (`x-internal-api-key`).

2. **AI Microservice (`ai-service/` - Python FastAPI 3.13)**:
   - Dịch vụ tính toán nặng, thị giác máy tính và Deep Learning suy luận (inference).
   - Pipeline 1: Phát hiện hư hỏng qua YOLOv8.
   - Pipeline 2: Xác thực khuôn mặt thợ (KYC / On-site Face Verification).
   - Pipeline 3: Nghiệm thu hình ảnh Before-After (SSIM / Feature diff).
   - **Tuyệt đối không kết nối trực tiếp database chính**; chỉ nhận input và trả về chỉ số định lượng.

3. **Admin Web Portal (`doan-kttn-frontend/` - React 18/19 + Vite + Tailwind CSS v4)**:
   - Giao diện quản trị, phê duyệt KYC thợ, cấu hình hoa hồng sàn, giám sát đơn hàng.
   - Phong cách thiết kế: Linear/Vercel Vibe Code, Dark/Light theme, Skeleton loaders, Glassmorphism Toast.

4. **Mobile App (`doan-kltn-mobile/` - React Native + Expo Router)**:
   - Ứng dụng dành cho Khách hàng & Thợ.
   - Quản lý phiên qua AsyncStorage, điều hướng bằng Expo Router `(auth)`, `(user)`, `(worker)`.
   - Kết nối Socket.io để nhận cuốc xe và cập nhật tọa độ thời gian thực.

5. **Data & Cache Layer (Docker)**:
   - `PostgreSQL + PostGIS` (Port 5432) — Lưu trữ dữ liệu và truy vấn tọa độ địa lý.
   - `Redis` (Port 6379/6380) — Cache & Pub/Sub cho WebSocket.

## 2. Ranh Giới Giao Tiếp
- **Client -> Backend**: REST API `/api/...` + WebSocket (Socket.io).
- **Backend -> AI-Service**: Internal HTTP POST `http://localhost:8000/api/v1/...` kèm Header `x-internal-api-key`.
- **AI-Service -> Backend**: Tuyệt đối không gọi ngược chiều.
