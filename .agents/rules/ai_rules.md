---
name: AI Rules & Kỷ Luật Phát Triển
description: Các quy tắc bắt buộc dành cho trợ lý AI khi làm việc trên dự án FixGo Pro.
globs: "*"
alwaysApply: true
---

# 🤖 Quy Tắc Hoạt Động Cho AI (Strict AI Rules - FixGo Pro)

## 1. Nguyên Tắc Kiểm Tra & Đọc Code Trước Khi Sửa
- 🔍 **Đọc trước khi viết**: Phải đọc toàn bộ file hiện tại và các module liên quan (DTO, Controller, Service, Prisma Schema) trước khi thực hiện bất kỳ thay đổi nào. Tuyệt đối không ghi đè mù (blind overwrite) dựa trên suy đoán.
- 📐 **Tuân thủ kiến trúc đã chốt**: Không tự ý thay đổi cấu trúc thư mục, tech stack hoặc response format chuẩn. Nếu thấy có phương án tốt hơn, phải trao đổi với người dùng trước.
- 🚫 **Tránh trùng lặp logic**: Trước khi tạo helper, constant hay hook mới, phải tìm kiếm trong codebase xem đã có sẵn chưa (tránh tạo `formatCurrency`, `dateUtils` ở nhiều nơi).
- 🎯 **Tập trung phạm vi (Narrow Scope)**: Mỗi lần chỉnh sửa chỉ tác động vào các file thực sự cần thiết cho task. Không "tiện tay" sửa style hay đổi tên biến của các module không liên quan.

## 2. Bảo Vệ Dữ Liệu & Thao Tác Nhạy Cảm
- ⚠️ **Database & Migrations**: Bất kỳ thao tác thay đổi Prisma Schema, xóa cột/bảng hay chạy migration đều phải cảnh báo rủi ro dữ liệu trước.
- 🔒 **Secrets & Environment**: Không bao giờ hardcode API keys, JWT Secret hay token vào mã nguồn. Luôn đọc từ biến môi trường qua `@nestjs/config` hoặc `pydantic-settings`.
- 💰 **Giao dịch tài chính & Đơn hàng**: Mọi logic biến động số dư ví hoặc đổi trạng thái đơn hàng (nhận đơn, hủy đơn) BẮT BUỘC dùng Prisma Transaction (`$transaction`) và cơ chế Atomic Update để tránh race condition (tranh chấp cuốc xe giữa nhiều thợ).

## 3. Định Dạng Báo Cáo Kết Quả
Sau khi hoàn thành tác vụ, AI phải:
1. Tóm tắt ngắn gọn những gì đã thay đổi.
2. Liệt kê danh sách file đã tạo / chỉnh sửa dạng clickable link `file:///...`.
3. Nêu rõ các bước kiểm thử/xác minh đã chạy hoặc khuyến nghị người dùng kiểm tra.
