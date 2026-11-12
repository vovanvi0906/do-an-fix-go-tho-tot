import {
  IsNotEmpty,
  IsString,
  Matches,
  Length,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneOtpDto {
  @ApiProperty({
    type: String,
    example: '0987654321',
    description: 'Số điện thoại nhận OTP',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Số điện thoại không đúng định dạng (9-11 chữ số)',
  })
  phone;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({
    type: String,
    example: '0987654321',
    description: 'Số điện thoại đã nhận OTP',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  @Matches(/^[0-9]{9,11}$/, { message: 'Số điện thoại không đúng định dạng' })
  phone;

  @ApiProperty({
    type: String,
    example: '123456',
    description: 'Mã OTP 6 chữ số',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  code;
}

export class SendEmailOtpDto {
  @ApiProperty({
    type: String,
    example: 'user@gmail.com',
    description: 'Email nhận OTP',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email;
}

export class VerifyEmailOtpDto {
  @ApiProperty({
    type: String,
    example: 'user@gmail.com',
    description: 'Email đã nhận OTP',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email;

  @ApiProperty({
    type: String,
    example: '654321',
    description: 'Mã OTP 6 chữ số',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  code;
}

export class ResetPasswordDto {
  @ApiProperty({
    type: String,
    example: '0987654321',
    description: 'Số điện thoại',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  @Matches(/^[0-9]{9,11}$/, { message: 'Số điện thoại không đúng định dạng' })
  phone;

  @ApiProperty({
    type: String,
    example: 'NewSecurePass123@',
    description: 'Mật khẩu mới',
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @Length(8, 100, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  newPassword;

  @ApiProperty({
    type: String,
    description: 'Token xác thực OTP đã verify thành công',
  })
  @IsNotEmpty({ message: 'Token xác thực OTP không được để trống' })
  @IsString()
  resetToken;
}
