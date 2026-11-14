# Hướng dẫn Tích hợp với Codex và Đề xuất Thứ tự Merge

## 1. Phân định Ranh giới và Đối chiếu Shared Files

Để bảo đảm an toàn tuyệt đối cho hệ thống, hai agent làm việc độc lập trên hai phân vùng chức năng riêng biệt:

| Phân vùng chức năng | Phụ trách chính | Phạm vi File | Trạng thái xung đột (Conflict) |
|---|---|---|---|
| **Worker Face ID & PAD** | **Codex** | `worker-app/`, `ai-service/face_*`, `server/src/modules/workers/` | Antigravity không sửa bất kỳ dòng nào. |
| **Customer AI Recommendation** | **Antigravity** | `customer-app/`, `ai-service/recommendation/`, `server/src/modules/orders/diagnosis/` | Codex không can thiệp. |
| **Entrypoint `ai-service/main.py`** | **Codex sở hữu** | `ai-service/main.py` | Antigravity **không chỉnh sửa trực tiếp**, cung cấp proposal. |

### Chi tiết 2 file giao thoa duy nhất (Non-conflicting Additive Changes):
1. **`server/prisma/schema.prisma`**:
   - `gemini-customer`: Thêm model `RegistrationProof` (phục vụ bảo mật đăng ký số điện thoại).
   - `codex-worker`: Thêm các trường biometric vào `User`, `WorkerProfile`, `Order` và các model `BiometricState`, `BiometricTemplate`, `BiometricReview`.
   - *Kết luận*: Cả hai đều là thay đổi độc lập bổ sung (additive), không trùng lặp trường hay khóa nào. Khi merge chỉ cần giữ cả hai.
2. **`server/src/infrastructure/external/ai/fastapi-ai.client.js`**:
   - `gemini-customer`: Cập nhật phương thức `diagnoseIncident` với vòng lặp thử `/ai/v2/diagnose` trước khi fallback sang `/ai/diagnose`.
   - `codex-worker`: Bổ sung các phương thức mới cho Face ID (`verifyFace`, `faceCapabilities`, `enrollFaceTemplate`) ở phía dưới.
   - *Kết luận*: Hoàn toàn độc lập về mặt hàm, ghép nối mượt mà không xung đột logic.

👉 **Kết quả kiểm toán đối chiếu HEAD (`7ae16c7`): ZERO FUNCTIONAL CONFLICT.**

---

## 2. Hướng dẫn Mount Router V2 An toàn Tuyệt đối

Router Recommendation V2 được cấu hình prefix `/ai/v2`, độc lập hoàn toàn với các routes Face ID hiện tại (`/ai/verify-face`, `/ai/face-enroll`):

```python
# ==============================================================
# BỔ SUNG VÀO ai-service/main.py (DO CODEX HOẶC LEAD THỰC HIỆN)
# ==============================================================

# 1. Import router (đầu file ai-service/main.py):
from recommendation import recommendation_router

# 2. Mount router (ngay sau khi khởi tạo FastAPI app):
app.include_router(recommendation_router)
```

### Bảo đảm không ảnh hưởng Face ID:
- Không thay đổi bất kỳ middleware hay CORS policy nào.
- Sử dụng chung mô hình `app.state.yolo_cls_model` đã được nạp sẵn trong lifespan.
- Không chiếm dụng thêm bộ nhớ RAM.

---

## 3. Đề xuất Thứ tự Cherry-pick / Merge An toàn

Nhằm bảo đảm không có thời gian chết (Zero downtime) và không làm gián đoạn môi trường phát triển:

```
[Bước 1] ──> [Bước 2] ──> [Bước 3] ──> [Bước 4]
 Backend      Module AI     Codex Mount    Smoke Test
 & Mobile      Package       Router V2      E2E Song song
```

1. **Bước 1: Merge Backend & Customer App từ `agent/gemini-customer`**:
   - Backend NestJS đã được tích hợp cơ chế fail-safe: tự động thử `/ai/v2/diagnose`, nếu chưa có sẽ fallback sang `/ai/diagnose` hiện tại mà không báo lỗi.
   - Giao diện Customer App chuyển sang hợp đồng mới tương thích ngược hoàn hảo.
2. **Bước 2: Merge thư mục `ai-service/recommendation/` và `ai-service/clip_classifier.py`**:
   - Cung cấp toàn bộ mã nguồn xử lý thuật toán và schemas V2.
3. **Bước 3: Codex (hoặc Lead) thêm 2 dòng mount router vào `ai-service/main.py`**:
   - Kích hoạt endpoint `/ai/v2/diagnose`, `/ai/v2/catalog/sync`, `/ai/v2/catalog/status`.
4. **Bước 4: Chạy Smoke Test E2E xác nhận cả 2 hệ thống**:
   - Kiểm tra xác thực khuôn mặt Face ID của thợ: Vẫn hoạt động bình thường.
   - Kiểm tra chẩn đoán sự cố khách hàng V2: Hoạt động trơn tru với đầy đủ target candidates và đề xuất dịch vụ từ database.
