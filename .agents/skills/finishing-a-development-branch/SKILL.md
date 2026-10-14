---
name: finishing-a-development-branch
description: Quy trình kiểm tra, hoàn tất và merge task branch về nhánh chính một cách chuẩn mực.
---

# 🏁 Quy Trình Hoàn Tất Nhánh Phát Triển (Finishing Branch)

## 1. Kiểm Tra Tính Hoạt Động (Verification)
- Chạy linter cho backend: `npm run lint` trong `doan-kltn-backend`.
- Chạy build test cho web admin: `npm run build` trong `doan-kttn-frontend`.
- Kiểm tra các endpoint mới thêm qua Swagger hoặc Postman.

## 2. Commit & Báo Cáo
- Tạo commit chuẩn ngữ nghĩa (Conventional Commits).
- Báo cáo rõ danh sách file thay đổi và kịch bản test cho người dùng.

## 3. Merge & Dọn Dẹp (Chỉ khi User đồng ý)
```cmd
git checkout main
git merge feat/task-name
git branch -d feat/task-name
```
