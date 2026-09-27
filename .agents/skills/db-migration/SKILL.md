---
name: db-migration
description: Quy trình an toàn khi chỉnh sửa Prisma Schema và đồng bộ cơ sở dữ liệu PostgreSQL/PostGIS.
---

# 🗄️ Quy Trình Chỉnh Sửa Cơ Sở Dữ Liệu & Prisma Migration

## 1. Nguyên Tắc An Toàn
- ⚠️ Không bao giờ xóa cột/bảng có chứa dữ liệu thực tế khi chưa có backup hoặc xác nhận từ người dùng.
- Khi thêm quan hệ mới (Relation), luôn kiểm tra cả hai phía của Model trong `schema.prisma`.

## 2. Các Bước Thực Hiện
1. **Chỉnh sửa schema**: Mở `doan-kltn-backend/prisma/schema.prisma` và cập nhật model/enum/field.
2. **Kiểm tra cú pháp**: Chạy `npx prisma format` trong thư mục backend để format schema.
3. **Sinh Prisma Client**:
   ```cmd
   npm run prisma:generate
   ```
4. **Đồng bộ Database**:
   - Môi trường Local Development:
     ```cmd
     npx prisma db push
     ```
   - Môi trường Production / Migration chính thức:
     ```cmd
     npm run prisma:migrate
     ```
5. **Cập nhật Seed Data (nếu có)**: Kiểm tra `prisma/seed.js` xem có cần bổ sung mock data cho trường mới không.
