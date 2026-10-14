---
name: Quy Chuẩn Frontend Web & Mobile App
description: Quy tắc phát triển giao diện React Vite Admin Portal và React Native Expo Mobile App.
globs: "{doan-kttn-frontend/**,doan-kltn-mobile/**}"
alwaysApply: true
---

# 📱🎨 Quy Chuẩn Frontend (Web Admin & Mobile App)

## 1. Web Admin (`doan-kttn-frontend/` - React Vite + Tailwind CSS v4)
- **Phong cách thiết kế:** Linear / Vercel Vibe Code (Dark/Light mode, kính mờ `backdrop-blur-xl`, ambient glow).
- **Hệ thống khoảng cách:** 8pt Grid System (`p-2`, `p-4`, `p-6`, `gap-4`).
- **Trạng thái UI (Bắt buộc):**
  - **Loading:** Luôn sử dụng Skeleton Loaders mô phỏng form/table, không để trang trắng giật cục.
  - **Empty:** Hiển thị component Empty với icon, tiêu đề và nút CTA khi bảng/danh sách rỗng.
  - **Toast:** Toast thông báo lỗi (đỏ) / thành công (xanh ngọc) qua Glassmorphism.
  - **Micro-interactions:** Hiệu ứng hover mềm mại (`transition-all duration-200 hover:-translate-y-0.5`).
- **State Management:** Zustand hoặc Context API cho Auth & Theme. Axios Interceptors tự động đính kèm Bearer Token.

## 2. Mobile App (`doan-kltn-mobile/` - React Native + Expo Router)
- **Cấu trúc điều hướng:** Expo Router dựa trên thư mục `app/`:
  - `(auth)/`: Đăng nhập, đăng ký, quên mật khẩu.
  - `(user)/`: Màn hình khách hàng (đặt lịch, theo dõi thợ, thanh toán).
  - `(worker)/`: Màn hình thợ (bật/tắt online, nhận đơn, xác thực khuôn mặt KYC).
- **Tương thích thiết bị:**
  - Luôn bọc trong `SafeAreaView` để tránh tràn tai thỏ / thanh điều hướng.
  - Sử dụng `KeyboardAvoidingView` cho các form nhập liệu.
  - IP loopback cho Android Emulator: `10.0.2.2:3000` (hoặc IP Wi-Fi tự động từ `dev.bat`).
- **Lưu trữ & Socket:** Lưu token trong `AsyncStorage`. Kết nối Socket.io tự động `join_room` theo `profileId`.
