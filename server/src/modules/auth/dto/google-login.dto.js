import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiPropertyOptional({
    type: String,
    description: 'Số điện thoại đã xác thực, bắt buộc khi tạo Customer mới',
  })
  @IsOptional()
  @IsString()
  phone;

  @ApiPropertyOptional({
    type: String,
    description:
      'Proof từ verify-phone-otp, bắt buộc khi tạo Customer mới; hiệu lực 300 giây, dùng một lần',
  })
  @IsOptional()
  @IsString()
  registrationProof;
}
