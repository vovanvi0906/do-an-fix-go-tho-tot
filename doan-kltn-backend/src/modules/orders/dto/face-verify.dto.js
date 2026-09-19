import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FaceVerifyDto {
  @ApiProperty({
    type: String,
    description: 'URL của ảnh selfie khuôn mặt kỹ thuật viên vừa chụp trực tiếp',
    example: 'https://storage.fixgo.vn/verifications/worker-selfie-123.jpg',
  })
  @IsString({ message: 'photoUrl phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'photoUrl không được để trống' })
  photoUrl;
}
