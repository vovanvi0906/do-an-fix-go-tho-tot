import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadOrderImageDto {
  @ApiProperty({
    type: String,
    description: 'Loại hình ảnh đơn hàng',
    enum: ['ISSUE', 'BEFORE', 'AFTER'],
    example: 'BEFORE',
  })
  @IsString()
  @IsIn(['ISSUE', 'BEFORE', 'AFTER'], {
    message: 'type phải là một trong: ISSUE, BEFORE, AFTER',
  })
  @IsNotEmpty({ message: 'type không được để trống' })
  type;

  @ApiProperty({
    type: String,
    description: 'Đường dẫn ảnh đã upload lên kho lưu trữ (S3 / Cloud Storage)',
    example: 'https://storage.fixgo.vn/orders/before-123.jpg',
  })
  @IsString({ message: 'url phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'url không được để trống' })
  url;
}
