# FixGo Pro — GitHub Cấu Hình & Chỉ Dẫn Tự Động

Thư mục này chứa toàn bộ cấu hình GitHub Actions (CI/CD workflows), Copilot Instructions và Custom Agent Prompts cho dự án **FixGo Pro**.

## Cấu Trúc Thư Mục
- `copilot-instructions.md`: Chỉ dẫn cho GitHub Copilot trong VS Code đọc các tài liệu kiến trúc.
- `agents/`: Định nghĩa Custom AI Agent chuyên trách cho hệ sinh thái FixGo Pro.
- `workflows/`:
  - `backend-ci.yml`: Chạy lint và unit tests cho NestJS Backend.
  - `ai-service-ci.yml`: Kiểm tra cú pháp Python cho FastAPI AI Service.
  - `frontend-ci.yml`: Kiểm tra build Vite cho Admin Web Portal.
