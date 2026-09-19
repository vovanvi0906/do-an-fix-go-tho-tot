# 🎨 FRONTEND CODING RULES & ARCHITECTURE (VIBE CODE - LINEAR/VERCEL STYLE)

## 1. Vai trò & Phong cách Thiết kế (Senior UI/UX Vibe Code)
- **Đóng vai:** Senior UI/UX Designer & Frontend Architect.
- **Phong cách:** Lấy cảm hứng từ **Linear** và **Vercel** (hiện đại, tối giản, tinh tế, viền mỏng sắc nét, không đổ bóng lố, sử dụng kính mờ `backdrop-blur-xl` và ánh sáng nền Ambient Glows).
- **Hệ thống lưới (Grid System):** Bắt buộc tuân thủ **8pt Grid System** cho toàn bộ khoảng cách padding, margin, gap (ví dụ: `p-3`, `p-4`, `p-6`, `space-y-4`, `gap-3.5`).

## 2. Quy chuẩn Trạng thái UI (Bắt buộc)
- **Loading State:** 
  - **Cấm tuyệt đối** dùng spinner đơn điệu hoặc màn hình trắng giật cục.
  - Phải dùng **Skeleton Loaders** mô phỏng chính xác khung xương giao diện để tránh dịch chuyển bố cục (Cumulative Layout Shift).
- **Empty State:** Mọi danh sách, bảng dữ liệu hoặc kết quả tìm kiếm khi rỗng phải hiển thị component Empty chuyên nghiệp có icon trực quan, tiêu đề hướng dẫn và nút hành động (CTA).
- **Error State & Toast:** Bắt buộc hiển thị thông báo lỗi thân thiện qua Toast dạng Glassmorphism (phân biệt màu đỏ cho lỗi hệ thống/401/403, xanh ngọc cho thành công).
- **Hover & Micro-interactions:** Mọi nút bấm, card, hàng dữ liệu phải có hiệu ứng chuyển động mượt mà (`transition-all duration-200`, `hover:-translate-y-0.5`, `active:scale-95`, `cursor-pointer`).

## 3. Công nghệ & Kiến trúc Mã nguồn
- **Framework & Build:** React 19 (Vite), React Router v6 (Nested layouts, Protected Routes phân quyền theo `ADMIN`, `WORKER`, `CUSTOMER`).
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"`), hỗ trợ đầy đủ Dark/Light mode qua `ThemeProvider`.
- **UI & Animation:** Ưu tiên sử dụng Radix UI / Shadcn UI patterns cho Accessibility, kết hợp Framer Motion (nếu cần animation chuyển cảnh).
- **API & State Management:** 
  - Axios HTTP Client với Interceptors tự động đính kèm Bearer Token từ `tokenStorage` và xử lý lỗi 401 chủ động/bị động.
  - Global State quản lý qua Context API (`AuthContext`, `ThemeContext`).

## 4. Cấu trúc Thư mục Chuẩn (`src/`)
- `src/app/`: Cấu hình hệ thống tầng nền (`providers/`, `router/`).
- `src/components/`: Thư viện component tái sử dụng (`feedback/`, `layout/`, `table/`, `ui/`).
- `src/features/`: Các module tính năng theo mô hình Domain-driven (`admin`, `auth`, `customer`, `dashboard`, `orders`, `payments`, `users`, `workers`). Mỗi feature bao gồm `components/`, `pages/`, `services/`, `hooks/`.
- `src/hooks/`: Custom hooks dùng chung (`useAuth.js`, `useAuthCheck.js`, `useDebounce.js`).
- `src/services/`: Quản lý API client, interceptors và token storage.
- `src/store/`: Quản lý Global State (`authStore.jsx`, `themeStore.jsx`).
- `src/utils/`: Tiện ích định dạng ngày giờ, tiền tệ, JWT decoding và form validation.