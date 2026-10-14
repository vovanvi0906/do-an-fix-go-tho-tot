---
name: create-api
description: Hướng dẫn chuẩn hóa từng bước tạo API Endpoint mới trong NestJS Backend kèm Prisma DTO và Swagger.
---

# 🚀 Quy Trình Tạo Endpoint API Mới (NestJS + Prisma + Swagger)

Kỹ năng này hướng dẫn các bước tiêu chuẩn để thêm một Endpoint mới trong backend FixGo Pro:

## Bước 1: Định nghĩa DTO (Data Transfer Object)
Tạo DTO trong `src/modules/<module>/dto/`:
- Dùng `class-validator` cho từng field (`@IsString()`, `@IsNumber()`, `@IsOptional()`, ...).
- Thêm decorator Swagger `@ApiProperty()`.
- Viết câu thông báo lỗi validation bằng tiếng Việt.

```javascript
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID dịch vụ cần đặt' })
  @IsNotEmpty({ message: 'Vui lòng chọn dịch vụ' })
  @IsString()
  serviceId;

  @ApiProperty({ description: 'Vĩ độ vị trí đặt lịch' })
  @IsNumber({}, { message: 'Tọa độ vĩ độ không hợp lệ' })
  latitude;
}
```

## Bước 2: Thêm Business Logic trong Service
- Xử lý các điều kiện nghiệp vụ, kiểm tra ràng buộc.
- Nếu có thao tác thay đổi nhiều bảng, bọc trong `this.prisma.$transaction`.

## Bước 3: Đăng Ký Route Trong Controller
- Đặt Decorator Swagger `@ApiOperation()`, `@ApiResponse()`.
- Gắn Guards `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(...)` nếu endpoint yêu cầu quyền.
- Trả về cấu trúc response chuẩn `{ success: true, data: result }`.
