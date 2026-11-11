import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    type: String,
    description: 'Trạng thái tiến độ mới của đơn hàng',
    enum: ['WORKER_EN_ROUTE', 'IN_PROGRESS', 'AWAITING_ACCEPTANCE'],
    example: 'WORKER_EN_ROUTE',
  })
  @IsString({ message: 'status phải là chuỗi ký tự' })
  @IsIn(
    [
      'WORKER_EN_ROUTE',
      'IN_PROGRESS',
      'AWAITING_ACCEPTANCE',
      'WORKER_ARRIVING',
      'ARRIVED',
      'AWAITING_CONFIRMATION',
    ],
    {
      message:
        'status không hợp lệ (hỗ trợ WORKER_EN_ROUTE, IN_PROGRESS, AWAITING_ACCEPTANCE)',
    },
  )
  @IsNotEmpty({ message: 'status không được để trống' })
  status;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú thêm về tiến trình hiện tại',
    example: 'Đang di chuyển qua cầu Chữ Y, dự kiến 10 phút nữa tới nơi',
  })
  @IsOptional()
  @IsString()
  note;
}
