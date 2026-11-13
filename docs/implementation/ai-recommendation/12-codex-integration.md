# Hướng dẫn Tích hợp với Codex (Integration Instructions for ai-service/main.py)

## 1. Nguyên tắc An toàn và Quyền Sở hữu Code

Theo quy định phân quyền của dự án:
- **Codex** sở hữu file entrypoint `ai-service/main.py`.
- **Antigravity** KHÔNG chỉnh sửa trực tiếp `ai-service/main.py` để tránh conflict và ghi đè công việc của nhau.
- Antigravity đã đóng gói toàn bộ chức năng AI Recommendation thành một module độc lập trong thư mục `ai-service/recommendation/`.

## 2. Các Bước Tích hợp Dành cho Codex

Chỉ cần thêm 2 dòng code vào `ai-service/main.py` để kích hoạt toàn bộ pipeline Recommendation V2:

### Bước 1: Import router từ module recommendation
Tại phần import ở đầu file `ai-service/main.py`:
```python
from recommendation import recommendation_router
```

### Bước 2: Mount router vào FastAPI App
Tại vị trí sau khi tạo đối tượng `app = FastAPI(...)`:
```python
app.include_router(recommendation_router)
```

## 3. Bản Đề xuất Patch Cụ thể (Patch Proposal)

```diff
--- a/ai-service/main.py
+++ b/ai-service/main.py
@@ -35,6 +35,7 @@
 from service_catalog import CLASS_PROMPTS, CLASSES, SUB_SERVICES_CATALOG, format_vnd
 from category_helper import match_category_by_keywords
 from target_helper import match_target_by_keywords
+from recommendation import recommendation_router

 logger = logging.getLogger("ai-service")
@@ -102,6 +103,9 @@
 app = FastAPI(
     title="FixGo Pro - AI Computer Vision & Service Recommendation Service",
     version="2.0.0",
 )
+
+# Mount AI Recommendation V2 Router (Antigravity Pipeline)
+app.include_router(recommendation_router)
```

## 4. Cơ chế Dự phòng Tương thích Ngược (Fail-Safe Compatibility)

NestJS Backend (`server/src/infrastructure/external/ai/fastapi-ai.client.js`) đã được thiết kế cơ chế fallback thông minh:
1. Backend gửi request tới `/ai/v2/diagnose` trước.
2. Nếu Codex chưa kịp mount router (FastAPI trả về 404), Backend tự động chuyển tiếp liền mạch sang `/ai/diagnose` hiện tại mà không làm gián đoạn trải nghiệm của người dùng.
3. Ngay khi Codex mount router, hệ thống sẽ tự động chuyển sang khai thác toàn bộ sức mạnh của pipeline V2 mà không cần khởi động lại Backend!
