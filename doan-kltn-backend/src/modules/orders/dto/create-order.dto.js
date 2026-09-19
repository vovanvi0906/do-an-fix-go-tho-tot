import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiPropertyOptional({
    type: String,
    description: 'ID danh mục ngành nghề (Category UUID)',
    example: '14d1ffcd-75b9-4111-acdc-ca7b481c07d1',
  })
  @IsOptional()
  @IsString({ message: 'categoryId phải là chuỗi UUID' })
  categoryId;

  @ApiPropertyOptional({
    type: String,
    description: 'ID gói dịch vụ chi tiết (nếu đặt từ catalog)',
    example: '8a004845-636d-44c2-9f6c-bd4f0d5942b7',
  })
  @IsOptional()
  @IsString({ message: 'serviceId phải là chuỗi UUID' })
  serviceId;

  @ApiProperty({
    type: Number,
    description: 'Vĩ độ điểm đón/thực hiện dịch vụ (Latitude GPS)',
    example: 10.762622,
  })
  @IsNumber({}, { message: 'lat phải là số thực (Float)' })
  @Min(-90, { message: 'lat không hợp lệ (>= -90)' })
  @Max(90, { message: 'lat không hợp lệ (<= 90)' })
  @IsNotEmpty({ message: 'lat (Vĩ độ) không được để trống' })
  lat;

  @ApiProperty({
    type: Number,
    description: 'Kinh độ điểm đón/thực hiện dịch vụ (Longitude GPS)',
    example: 106.660172,
  })
  @IsNumber({}, { message: 'lng phải là số thực (Float)' })
  @Min(-180, { message: 'lng không hợp lệ (>= -180)' })
  @Max(180, { message: 'lng không hợp lệ (<= 180)' })
  @IsNotEmpty({ message: 'lng (Kinh độ) không được để trống' })
  lng;

  @ApiPropertyOptional({
    type: String,
    description: 'Địa chỉ dạng chuỗi văn bản',
    example: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
  })
  @IsOptional()
  @IsString({ message: 'addressText phải là chuỗi văn bản' })
  addressText;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú thêm cho kỹ thuật viên khi di chuyển',
    example: 'Vào hẻm 268 rẽ trái nhà thứ 3 có cổng sắt màu xám',
  })
  @IsOptional()
  @IsString({ message: 'note phải là chuỗi ký tự' })
  note;

  @ApiPropertyOptional({
    type: String,
    description: 'ID danh mục được AI gợi ý',
    example: '14d1ffcd-75b9-4111-acdc-ca7b481c07d1',
  })
  @IsOptional()
  @IsString({ message: 'aiSuggestedCategoryId phải là chuỗi UUID' })
  aiSuggestedCategoryId;

  @ApiPropertyOptional({
    type: Number,
    description: 'Độ tin cậy của AI (0.0 đến 1.0)',
    example: 0.94,
  })
  @IsOptional()
  @IsNumber({}, { message: 'aiConfidence phải là số thực' })
  aiConfidence;

  @ApiPropertyOptional({
    type: Number,
    description: 'Giá ước tính khởi điểm của đơn hàng (VND)',
    example: 150000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'estimatedPrice phải là số' })
  @Min(0, { message: 'estimatedPrice phải >= 0' })
  estimatedPrice;

  @ApiPropertyOptional({
    type: String,
    description: 'Thời gian hẹn lịch thực hiện dịch vụ (ISO 8601 string)',
    example: '2026-09-06T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'scheduledAt phải là định dạng ISO date string' })
  scheduledAt;

  // Compatibility alias
  @IsOptional()
  pickupLat;
  @IsOptional()
  pickupLng;
  @IsOptional()
  pickupAddress;
  @IsOptional()
  description;
}
