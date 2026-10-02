import {
  Controller,
  Post,
  Bind,
  Body,
  Dependencies,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { OtpService } from './otp.service';
import {
  SendPhoneOtpDto,
  VerifyPhoneOtpDto,
  SendEmailOtpDto,
  VerifyEmailOtpDto,
} from './dto/send-otp.dto';

@ApiTags('auth')
@Controller('auth')
@Dependencies(OtpService)
export class OtpController {
  constructor(otpService) {
    this.otpService = otpService;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHONE OTP
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('send-phone-otp')
  @ApiOperation({ summary: 'Gửi mã OTP 6 số qua SMS đến Số điện thoại' })
  @ApiBody({ type: SendPhoneOtpDto })
  @ApiResponse({ status: 200, description: 'Gửi OTP thành công' })
  @ApiResponse({
    status: 400,
    description: 'Đang trong thời gian cooldown hoặc dữ liệu không hợp lệ',
  })
  @Bind(Body())
  async sendPhoneOtp(body) {
    return this.otpService.sendPhoneOtp(body.phone);
  }

  @Post('verify-phone-otp')
  @ApiOperation({ summary: 'Xác thực mã OTP Số điện thoại' })
  @ApiBody({ type: VerifyPhoneOtpDto })
  @ApiQuery({
    name: 'purpose',
    required: false,
    enum: ['register', 'reset-password'],
    description:
      'Mục đích xác thực: register (mặc định) hoặc reset-password (cấp resetToken)',
  })
  @ApiResponse({ status: 200, description: 'Xác thực OTP thành công' })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP sai, hết hạn hoặc vượt quá số lần thử',
  })
  @Bind(Body(), Query('purpose'))
  async verifyPhoneOtp(body, purpose) {
    const issueResetToken = purpose === 'reset-password';
    return this.otpService.verifyPhoneOtp(
      body.phone,
      body.code,
      issueResetToken,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL OTP
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('send-email-otp')
  @ApiOperation({ summary: 'Gửi mã OTP 6 số qua Email (Nodemailer/SMTP)' })
  @ApiBody({ type: SendEmailOtpDto })
  @ApiResponse({ status: 200, description: 'Gửi OTP Email thành công' })
  @ApiResponse({
    status: 400,
    description: 'Đang trong thời gian cooldown hoặc email không hợp lệ',
  })
  @Bind(Body())
  async sendEmailOtp(body) {
    return this.otpService.sendEmailOtp(body.email);
  }

  @Post('verify-email-otp')
  @ApiOperation({ summary: 'Xác thực mã OTP Email' })
  @ApiBody({ type: VerifyEmailOtpDto })
  @ApiResponse({ status: 200, description: 'Xác thực Email OTP thành công' })
  @ApiResponse({
    status: 400,
    description: 'Mã OTP sai, hết hạn hoặc vượt quá số lần thử',
  })
  @Bind(Body(), Req())
  async verifyEmailOtp(body, req) {
    return this.otpService.verifyEmailOtp(body.email, body.code, req);
  }
}
