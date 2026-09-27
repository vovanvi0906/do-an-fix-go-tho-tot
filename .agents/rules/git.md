---
name: Git Workflow & Task Isolation
description: Quy tắc an toàn Git, phân nhánh, commit convention và task isolation cho FixGo Pro.
globs: "*"
alwaysApply: true
---

# 🌳 Quy Trình Git Workflow & Task Isolation

## 1. Quy Ước Commit Message (Semantic Commit)
Cấu trúc: `<type>(<scope>): <mô tả ngắn gọn>`

- `feat(orders)`: Thêm logic điều phối đơn hàng
- `feat(ai-face)`: Thêm endpoint xác thực khuôn mặt thợ
- `fix(wallet)`: Sửa lỗi tính sai chiết khấu hoa hồng
- `fix(mobile)`: Sửa lỗi tràn giao diện trên thiết bị Android
- `refactor(backend)`: Tái cấu trúc auth guard và interceptor
- `chore(deps)`: Cập nhật package dependencies

## 2. Phân Nhánh & Task Isolation
- Mọi tính năng mới, sửa lỗi hoặc refactor lớn **PHẢI** được thực hiện trên nhánh riêng:
  - `feat/<scope>-<ten-nhanh>`
  - `fix/<scope>-<ten-nhanh>`
- Không chỉnh sửa trực tiếp trên nhánh `main`/`master` hoặc nhánh cha đang ổn định.
- Khuyến khích sử dụng `git worktree` khi cần xử lý nhiều task song song mà không xung đột môi trường.

## 3. Quy Trình Hoàn Tất Task & Bàn Giao
1. Kiểm tra syntax, chạy lint (`npm run lint`) và unit tests.
2. Commit code với thông điệp rõ ràng theo scope.
3. Báo cáo chi tiết danh sách file thay đổi và hướng dẫn kiểm thử.
4. Chờ người dùng xác nhận trước khi thực hiện thao tác merge vào nhánh chính.

## 4. Các Hành Động Bị Cấm (Safety Guards)
- ❌ **TUYỆT ĐỐI KHÔNG** tự ý chạy `git reset --hard` hoặc `git clean -fd` làm mất code của người dùng.
- ❌ **TUYỆT ĐỐI KHÔNG** force push (`git push --force`) lên các nhánh chia sẻ chung.
- ❌ **TUYỆT ĐỐI KHÔNG** commit các file nhạy cảm: `.env`, khóa bí mật, file weight model nặng trên 50MB.
