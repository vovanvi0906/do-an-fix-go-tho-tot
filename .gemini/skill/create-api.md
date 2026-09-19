# 🧩 QUY TRÌNH SCAFFOLD API CHUẨN (CREATE-API RULES)
## ÁP DỤNG CHO: `backend/` (NestJS) — tham chiếu `backend.md` cho quy ước chi tiết

Mọi endpoint mới **bắt buộc** đi qua đủ các bước theo đúng thứ tự dưới đây. Không được bỏ qua bước hoặc đảo thứ tự — mục đích là đảm bảo mọi endpoint sinh ra đồng nhất bất kể AI agent nào thực thi.

---

## 1. THỨ TỰ SCAFFOLD (BẮT BUỘC THEO TRÌNH TỰ)

### Bước 1 — Xác nhận/định nghĩa Prisma schema
Nếu endpoint cần bảng hoặc field mới trong DB: dừng lại, xử lý theo `db-migration.md` trước. **Không** viết code service/controller trước khi schema đã migrate xong và `prisma generate` đã chạy.

### Bước 2 — Constant & Enum
Nếu endpoint liên quan trạng thái mới (order status, role mới, error code mới): khai báo trong `src/common/constants/` trước (ví dụ `order-status.constant.js`). Không hardcode string trạng thái trong service/controller.

### Bước 3 — DTO Request (`dto/`)
* Tạo class riêng, hậu tố `Dto` (ví dụ `CreateOrderDto`, `WorkerCheckInDto`).
* Dùng `class-validator` cho từng field, message lỗi viết bằng tiếng Việt.
* Với `multipart/form-data` (upload ảnh): dùng `@ApiConsumes('multipart/form-data')` kết hợp `FileInterceptor`/`FilesInterceptor`, validate MIME type (`image/jpeg`, `image/png`) và giới hạn kích thước file (mặc định 5MB).

### Bước 4 — Response Interface/DTO
Định nghĩa shape response khớp với `api-specs.md` — bọc trong `TransformInterceptor` chuẩn (`success`, `statusCode`, `message`, `data`, `timestamp`). Không trả raw Prisma object (tránh lộ field nhạy cảm như `passwordHash`).

### Bước 5 — Repository (nếu có truy vấn phức tạp/raw SQL)
Query PostGIS hoặc raw SQL đặt riêng trong `repository/`, không viết raw SQL trực tiếp trong `service/`.

### Bước 6 — Service (business logic)
* Toàn bộ logic nghiệp vụ nằm ở đây, controller không chứa logic.
* Thao tác tài chính/tranh chấp cao → bọc `prisma.$transaction` + atomic `updateMany` theo đúng pattern trong `backend.md`.
* Gọi AI service (nếu cần) qua client riêng trong `infrastructure/external/ai/`, không gọi `fetch`/`axios` trực tiếp trong service.

### Bước 7 — Controller
* Gắn `@Roles(...)` + `JwtAuthGuard` + `RolesGuard` đúng quyền theo `api-specs.md` mục 1.2.
* Method name mô tả hành động rõ ràng (`acceptOrder`, không phải `handle2`).
* Áp dụng đúng HTTP method/status code như đặc tả (`201` cho tạo mới, `200` cho action).

### Bước 8 — Đăng ký Module
Thêm Controller/Service vào `*.module.js`, kiểm tra đã import đúng `PrismaModule`, `RedisModule` nếu cần.

### Bước 9 — Swagger
Thêm `@ApiOperation`, `@ApiResponse` cho từng status code có thể trả về (thành công + các lỗi 400/401/403/404/409/422).

### Bước 10 — Đối chiếu lại `api-specs.md`
Sau khi code xong, so sánh request/response thực tế với đặc tả. Nếu có sai khác (thêm field, đổi endpoint), **cập nhật lại `api-specs.md` ngay** — không để tài liệu lệch code.

---

## 2. CHECKLIST NHANH (COPY KHI TẠO ENDPOINT MỚI)

```
[ ] Schema/migration đã sẵn sàng (nếu cần)
[ ] Constant/enum liên quan đã khai báo
[ ] DTO request có validate + message tiếng Việt
[ ] Response khớp chuẩn TransformInterceptor
[ ] Repository tách riêng nếu có raw SQL
[ ] Service bọc transaction nếu là thao tác tài chính/tranh chấp
[ ] Controller gắn đúng Guard + Roles
[ ] Đã đăng ký vào module
[ ] Swagger đầy đủ các response code
[ ] api-specs.md đã cập nhật khớp thực tế
```

---

## 3. LỖI THƯỜNG GẶP CẦN TRÁNH

* Viết logic nghiệp vụ trong Controller thay vì Service.
* Quên `whitelist: true` khiến field lạ trong body lọt vào DTO.
* Trả lỗi 500 cho lỗi nghiệp vụ đáng lẽ phải là 409/422 (ví dụ đơn đã bị thợ khác nhận).
* Không xử lý trường hợp AI service timeout/lỗi khi gọi từ NestJS — phải có try/catch trả về lỗi rõ ràng (`errorCode: "AI_SERVICE_UNAVAILABLE"`), không để request treo.