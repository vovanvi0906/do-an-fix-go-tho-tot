import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirebaseLoginDto {
  @ApiProperty({
    type: String,
    description: 'Firebase ID Token nhận được sau khi đăng nhập Google qua Firebase Client SDK',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...firebase_id_token',
  })
  @IsNotEmpty({ message: 'idToken không được để trống' })
  @IsString({ message: 'idToken phải là chuỗi ký tự' })
  idToken;
}
