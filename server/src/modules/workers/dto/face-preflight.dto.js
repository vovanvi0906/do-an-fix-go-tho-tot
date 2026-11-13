import { Equals, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class FacePreflightDto {
  @ApiProperty({ type: Boolean, enum: [true], description: 'Đồng ý kiểm tra điều kiện; chưa thu nhận khuôn mặt' })
  @IsBoolean({ message: 'Đồng ý phải là boolean' })
  @Equals(true, { message: 'Vui lòng xác nhận đồng ý kiểm tra điều kiện' })
  consent;
}
