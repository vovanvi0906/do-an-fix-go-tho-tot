---
name: using-git-worktrees
description: Hướng dẫn tạo và sử dụng Git Worktree để phát triển nhiều task song song an toàn.
---

# 🌲 Hướng Dẫn Sử Dụng Git Worktrees

Git Worktree cho phép bạn checkout nhiều nhánh cùng một lúc vào các thư mục riêng biệt trên máy tính, tránh xung đột file khi làm việc với nhiều task.

## 1. Tạo Worktree Mới Cho Task
```cmd
git worktree add ../do-an-task-branch -b feat/task-name
```

## 2. Làm Việc & Cài Đặt Trong Worktree
Di chuyển vào thư mục mới tạo và bắt đầu phát triển độc lập:
```cmd
cd ../do-an-task-branch
```

## 3. Dọn Dẹp Sau Khi Hoàn Thành
Sau khi task đã được merge vào nhánh chính:
```cmd
git worktree remove ../do-an-task-branch
git branch -d feat/task-name
```
