import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({
    type: String,
    description: 'Lý do hủy đơn hàng',
    example: 'Thay đổi kế hoạch đột xuất / Đã tự khắc phục được',
  })
  @IsString({ message: 'Lý do hủy phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Lý do hủy không được để trống' })
  reason;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú chi tiết thêm',
    example: 'Khách hàng tự hủy trên cổng Customer Portal',
  })
  @IsOptional()
  @IsString()
  note;
}
