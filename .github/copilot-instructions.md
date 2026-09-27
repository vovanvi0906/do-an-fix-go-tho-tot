# FixGo Pro — GitHub Copilot Instructions

**Tài liệu chuẩn cần tham khảo trước khi sinh hoặc chỉnh sửa code:**
1. **Kiến trúc & Ranh giới hệ thống:** Đọc `.agents/rules/architecture.md` và `.gemini/context/architecture.md`.
2. **Quy tắc Backend NestJS:** Đọc `.agents/rules/backend_nestjs.md` (chú ý Prisma `$transaction`, PostGIS query, DTO validation).
3. **Quy tắc AI FastAPI Service:** Đọc `.agents/rules/ai_fastapi.md` (nạp model qua lifespan, bảo vệ bằng `x-internal-api-key`).
4. **Quy tắc Web & Mobile:** Đọc `.agents/rules/frontend_mobile.md` (giao diện Linear/Vercel Vibe Code, Expo Router).
5. **Kỷ luật Git & AI:** Đọc `.agents/rules/ai_rules.md` và `.agents/rules/git.md`.

*Lưu ý: Luôn đọc các file DTO, controller, service liên quan trước khi sửa mã nguồn để đảm bảo không phá vỡ logic sẵn có.*
