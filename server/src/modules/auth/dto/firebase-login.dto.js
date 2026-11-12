import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FirebaseLoginDto {
  @ApiProperty({
    type: String,
    description:
      'Firebase ID Token nhận được sau khi đăng nhập Google qua Firebase Client SDK',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...firebase_id_token',
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
