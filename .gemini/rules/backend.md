# 🛠️ BACKEND CODING RULES & ARCHITECTURE (NESTJS - PRISMA - POSTGIS)

## 1. Công nghệ & Kiến trúc Cốt lõi
- **Framework:** NestJS sử dụng cú pháp JavaScript ES Modules (`import`/`export`), Decorators, và Dependency Injection qua `@Dependencies` hoặc constructor injection[cite: 1].
- **Cơ sở dữ liệu:** PostgreSQL tích hợp **PostGIS** để xử lý không gian địa lý (tính khoảng cách GPS, quét thợ lân cận), thao tác qua **Prisma ORM** (`PrismaService` cấu hình dạng Global module)[cite: 1].
- **Realtime & Caching:** **Redis** (`RedisService` dùng `ioredis`) kết hợp **Redis Pub/Sub** để đồng bộ sự kiện đa tiến trình và **WebSocket Gateway** (`@WebSocketGateway`) cho real-time order flow[cite: 1].
- **Tài liệu API:** Tích hợp Swagger/OpenAPI tại `/api/docs` với global prefix `/api`[cite: 1].

## 2. Cấu trúc Thư mục Chuẩn (`src/`)
- `src/main.js`: Khởi chạy ứng dụng, cấu hình Global Prefix, CORS, ValidationPipe, và Swagger[cite: 1].
- `src/app.module.js`: Module gốc gom toàn bộ feature modules và infrastructure modules[cite: 1].
- `src/common/`: Tiện ích dùng chung[cite: 1]:
  - `constants/`: Hằng số hệ thống (ví dụ: `roles.constant.js`, `order-status.js`)[cite: 1].
  - `decorators/`: Custom decorators (ví dụ: `roles.decorator.js`, `current-user.decorator.js`)[cite: 1].
  - `filters/`: Exception filters toàn cục (`http-exception.filter.js`)[cite: 1].
  - `guards/`: Guards phân quyền và bảo mật (`roles.guard.js`, `jwt-auth.guard.js`)[cite: 1].
  - `interceptors/`: Xử lý response format (`transform.interceptor.js`)[cite: 1].
- `src/config/`: Cấu hình môi trường (`@nestjs/config`: `app.config.js`, `database.config.js`, `jwt.config.js`, `redis.config.js`, `storage.config.js`)[cite: 1].
- `src/infrastructure/`: Tầng hạ tầng kỹ thuật (`database/`, `external/ai/`, `external/payment/`, `redis/`, `storage/`)[cite: 1].
- `src/modules/`: Các business domain modules (`admin`, `ai`, `auth`, `customers`, `orders`, `payments`, `services`, `users`, `workers`)[cite: 1]. Cấu trúc tiêu chuẩn gồm `controller`, `service`, `repository`, `dto/`, và `validators/`[cite: 1].

## 3. Quy chuẩn Lập trình & Viết Code (Coding Standards)
- **Dependency Injection:** Bắt buộc sử dụng `@Injectable()` kết hợp `@Dependencies(...)` hoặc constructor rõ ràng, tuyệt đối không khởi tạo dependency thủ công[cite: 1].
- **DTO & Validation:** 
  - Mọi request payload phải định nghĩa lớp DTO riêng sử dụng `class-validator`[cite: 1].
  - Thông báo lỗi validation bắt buộc viết bằng tiếng Việt rõ ràng, thân thiện với người dùng[cite: 1].
  - `ValidationPipe` toàn cục phải bật cấu hình `whitelist: true` và `transform: true`[cite: 1].
- **Bảo mật & Phân quyền:**
  - Bảo vệ các endpoint theo vai trò bằng cách kết hợp `JwtAuthGuard`, `RolesGuard`, và decorator `@Roles('CUSTOMER' | 'WORKER' | 'ADMIN')`[cite: 1].
  - Mật khẩu người dùng bắt buộc mã hóa bằng `bcrypt` trước khi lưu xuống database[cite: 1].
- **Xử lý Giao dịch & Tranh chấp (Concurrency & Transactions):**
  - Các thao tác thay đổi dữ liệu tài chính hoặc workflow cốt lõi (như nhận đơn) phải được bọc trong `prisma.$transaction` để đảm bảo tính nguyên tử (Atomicity)[cite: 1].
  - Đối với các nghiệp vụ có tranh chấp cao (nhiều thợ cùng nhận 1 đơn), bắt buộc dùng kỹ thuật Atomic Update kèm kiểm tra trạng thái (`updateMany` với điều kiện `status: 'SEARCHING'`) và trả về mã lỗi `409 Conflict` nếu đơn đã bị thợ khác cướp mất[cite: 1].
- **Truy vấn Không gian (PostGIS Spatial Queries):**
  - Tận dụng raw SQL kết hợp hàm tính khoảng cách Haversine/PostGIS trong Prisma để thực hiện quét tìm thợ online chuẩn xác trong bán kính giới hạn (ví dụ: 5km)[cite: 1].
- **Realtime & Event Broadcasting:**
  - Tích hợp WebSocket Gateway với Redis Pub/Sub để phát tán sự kiện mượt mà, đảm bảo hệ thống scale tốt theo mô hình đa tiến trình (multi-instance)[cite: 1].