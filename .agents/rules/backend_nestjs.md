---
name: Quy Chuẩn Backend NestJS
description: Quy tắc lập trình NestJS, Prisma ORM, PostGIS, WebSocket Gateway và Transaction.
globs: "doan-kltn-backend/**"
alwaysApply: true
---

# 🛠️ Quy Chuẩn Phát Triển Backend NestJS (FixGo Pro)

## 1. Cấu Trúc Module Chuẩn (`src/`)
Mỗi domain module trong `src/modules/<tên-module>/` phải tuân thủ:
```text
src/modules/<module-name>/
├── controllers/          # Nhận request, gọi service, trả response format chuẩn
├── services/             # Chứa toàn bộ business logic và database transactions
├── dto/                  # Data Transfer Objects với class-validator
├── repositories/         # Thao tác Prisma/Database (nếu tách biệt)
└── <module-name>.module.js # Khai báo module và dependencies
```

## 2. Dependency Injection & Cú Pháp
- Dự án sử dụng ES Modules (`import`/`export`) kết hợp Babel Decorators.
- Sử dụng `@Injectable()` và inject dependency thông qua constructor hoặc `@Dependencies(...)`. Không tạo `new Service()` thủ công.

## 3. DTO & Validation
- Mọi payload đầu vào (Body, Query, Param) đều phải có class DTO định nghĩa rõ ràng.
- Sử dụng decorator từ `class-validator` (`@IsNotEmpty()`, `@IsEmail()`, `@IsNumber()`, ...).
- Thông báo lỗi validation (`message`) phải viết bằng **Tiếng Việt rõ ràng, thân thiện**.
- `ValidationPipe` toàn cục luôn kích hoạt `{ whitelist: true, transform: true }`.

## 4. Giao Dịch & Tranh Chấp (Concurrency & Transactions)
- **Biến động số dư & Trạng thái đơn**: Bắt buộc bọc trong `prisma.$transaction(async (tx) => { ... })`.
- **Cướp đơn / Tranh chấp cuốc xe**: Sử dụng kỹ thuật Atomic Update:
  ```javascript
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: 'SEARCHING' },
    data: { status: 'ACCEPTED', workerId: workerId }
  });
  if (updated.count === 0) {
    throw new ConflictException('Đơn hàng đã được thợ khác nhận hoặc không còn khả dụng');
  }
  ```

## 5. Truy Vấn Không Gian PostGIS
- Quét thợ trong bán kính $R$ km sử dụng raw SQL với hàm địa lý:
  ```javascript
  const nearbyWorkers = await prisma.$queryRaw`
    SELECT id, name,
      ST_DistanceSphere(ST_MakePoint(longitude, latitude), ST_MakePoint(${lng}, ${lat})) AS distance_meters
    FROM "Worker"
    WHERE is_online = true
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusInMeters}
      )
    ORDER BY distance_meters ASC;
  `;
  ```

## 6. Realtime WebSocket & Redis Pub/Sub
- Mọi cập nhật trạng thái đơn (Order Created, Accepted, In Progress, Completed) phải broadcast qua Socket Gateway (`@WebSocketGateway`) và đồng bộ qua Redis Pub/Sub.
