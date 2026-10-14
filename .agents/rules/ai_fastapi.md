---
name: Quy Chuẩn AI Service FastAPI
description: Quy tắc phát triển Microservice Python FastAPI, nạp model qua lifespan, và API bảo vệ.
globs: "ai-service/**"
alwaysApply: true
---

# 🐍 Quy Chuẩn Phát Triển AI Microservice (FastAPI & PyTorch/YOLO)

## 1. Nguyên Tắc Cốt Lõi
- `ai-service` đóng vai trò là một **Stateless Worker**. Không lưu trạng thái đơn hàng và không kết nối trực tiếp đến database chính của NestJS.
- Tất cả các endpoint nội bộ đều phải được bảo vệ bằng header `x-internal-api-key` thông qua FastAPI `Depends()`.

## 2. Quản Lý Mô Hình (Model Lifespan)
- **Tuyệt đối KHÔNG** khởi tạo hoặc tải lại trọng số mô hình (weights) trong hàm xử lý request (endpoint handler).
- Toàn bộ mô hình (YOLO, ArcFace/RetinaFace, MobileNet) phải được load **duy nhất 1 lần** vào bộ nhớ (`app.state`) khi service khởi động thông qua cơ chế `lifespan` của FastAPI:
  ```python
  @asynccontextmanager
  async def lifespan(app: FastAPI):
      # Load models on startup
      app.state.yolo_model = YOLO("app/models/yolo_incident.pt")
      yield
      # Clean up resources on shutdown
      del app.state.yolo_model
  ```

## 3. Cấu Trúc Schema & Xử Lý Ảnh
- Mọi Request/Response phải định nghĩa Pydantic Schema trong `app/schemas/`.
- Xử lý ảnh (decode bytes, resize, normalize) tập trung tại `app/utils/image_ops.py`.
- Trả về mã lỗi HTTP chuẩn:
  - `400 Bad Request`: Ảnh không đúng định dạng hoặc không thể đọc.
  - `403 Forbidden`: Thiếu hoặc sai `x-internal-api-key`.
  - `422 Unprocessable Entity`: Dữ liệu không thỏa mãn validation schema.
