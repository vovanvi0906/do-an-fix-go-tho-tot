import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    type: String,
    description:
      'Google ID Token (JWT) được trả về sau khi người dùng đăng nhập bằng Google trên client',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...zxx',
  })
  @IsNotEmpty({ message: 'idToken không được để trống' })
  @IsString({ message: 'idToken phải là chuỗi ký tự' })
  idToken;
}
