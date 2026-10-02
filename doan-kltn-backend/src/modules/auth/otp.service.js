import {
  Injectable,
  Dependencies,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EmailService } from './email.service';
import { EsmsService } from './esms.service';
import { UsersRepository } from '../users/users.repository';

// ─── Redis Key Patterns ─────────────────────────────────────────────────────
const OTP_KEY = (type, target) => `otp:${type}:${target}`;
const COOLDOWN_KEY = (type, target) => `otp:cooldown:${type}:${target}`;
const ATTEMPTS_KEY = (type, target) => `otp:attempts:${type}:${target}`;
const RESET_TOKEN_KEY = (token) => `otp:reset_token:${token}`;

// ─── Configuration ──────────────────────────────────────────────────────────
const OTP_TTL = 180; // 3 phút
const COOLDOWN_TTL = 60; // 60 giây chờ gửi lại
const MAX_ATTEMPTS = 5; // Tối đa 5 lần thử
const RESET_TOKEN_TTL = 600; // Token reset password có hiệu lực 10 phút

@Injectable()
@Dependencies(
  RedisService,
  EmailService,
  EsmsService,
  UsersRepository,
  JwtService,
)
export class OtpService {
  constructor(
    redisService,
    emailService,
    esmsService,
    usersRepository,
    jwtService,
  ) {
    this.redis = redisService.getClient();
    this.emailService = emailService;
    this.esmsService = esmsService;
    this.usersRepository = usersRepository;
    this.jwtService = jwtService;
    this.logger = new Logger(OtpService.name);
  }

  /**
   * Sinh mã OTP 6 chữ số ngẫu nhiên
   */
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Sinh reset token ngẫu nhiên (dùng sau khi verify OTP quên mật khẩu)
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHONE OTP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gửi OTP qua SMS (gọi eSMS API và đồng thời log ra terminal)
   */
  async sendPhoneOtp(phone) {
    // 1. Chuẩn hóa số điện thoại trước khi xử lý
    const normalizedPhone = this.esmsService.normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new BadRequestException(
        'Số điện thoại không đúng định dạng (yêu cầu 10 chữ số)',
      );
    }

    this.logger.log(
      `📱 [OtpService] Yêu cầu gửi Phone OTP cho: ${normalizedPhone} (gốc: ${phone})`,
    );

    // 2. Kiểm tra cooldown
    const cooldownKey = COOLDOWN_KEY('phone', normalizedPhone);
    const cooldownRemain = await this.redis.ttl(cooldownKey);
    if (cooldownRemain > 0) {
      throw new BadRequestException(
        `Vui lòng đợi ${cooldownRemain} giây trước khi gửi lại mã OTP`,
      );
    }

    // 3. Sinh mã OTP
    const otpCode = this.generateOtp();

    // 4. Gửi tin nhắn SMS thật qua cổng eSMS
    // Nếu eSMS trả về lỗi, ném lỗi ra ngoài, KHÔNG báo thành công về mobile!
    try {
      await this.esmsService.sendOtpSms(normalizedPhone, otpCode);
    } catch (smsError) {
      console.error(
        `❌ [OtpService] Gửi SMS qua eSMS thất bại cho số ${normalizedPhone}:`,
        smsError.message,
      );
      // Ném lỗi trực tiếp để Controller báo lỗi rõ ràng về Mobile
      throw new BadRequestException(
        smsError.message ||
          'Gửi SMS OTP thất bại qua eSMS. Vui lòng kiểm tra lại cấu hình hoặc số dư!',
      );
    }

    // 5. Khi eSMS đã gửi thành công -> Lưu OTP vào Redis (TTL 180s)
    const otpKey = OTP_KEY('phone', normalizedPhone);
    await this.redis.set(otpKey, otpCode, 'EX', OTP_TTL);

    // Đặt cooldown gửi lại (60s)
    await this.redis.set(cooldownKey, '1', 'EX', COOLDOWN_TTL);

    // Reset số lần thử
    const attemptsKey = ATTEMPTS_KEY('phone', normalizedPhone);
    await this.redis.del(attemptsKey);

    // Luôn log mã OTP ra terminal để phục vụ dev/test thuận tiện
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  📱 PHONE OTP CODE → ${normalizedPhone}`);
    console.log(`  🔑 Mã xác thực: ${otpCode}`);
    console.log(`  ⏰ Hiệu lực: ${OTP_TTL / 60} phút`);
    console.log('══════════════════════════════════════════════════════');
    console.log('');

    this.logger.log(
      `✅ [OtpService] Đã xử lý gửi Phone OTP thành công cho: ${normalizedPhone}`,
    );

    return {
      message: `Mã xác thực đã được gửi đến số ${normalizedPhone}`,
      expiresIn: OTP_TTL,
      cooldown: COOLDOWN_TTL,
    };
  }

  /**
   * Xác thực OTP Số điện thoại
   * @returns {{ verified: boolean, resetToken?: string }} resetToken dùng cho luồng quên mật khẩu
   */
  async verifyPhoneOtp(phone, code, issueResetToken = false) {
    const normalizedPhone = this.esmsService.normalizePhone(phone);
    this.logger.log(
      `📱 [OtpService] Xác thực Phone OTP cho: ${normalizedPhone}, Code: ${code}`,
    );

    const otpKey = OTP_KEY('phone', normalizedPhone);
    const attemptsKey = ATTEMPTS_KEY('phone', normalizedPhone);

    // Kiểm tra số lần thử
    const attempts = parseInt((await this.redis.get(attemptsKey)) || '0', 10);
    if (attempts >= MAX_ATTEMPTS) {
      // Xóa OTP để buộc gửi lại
      await this.redis.del(otpKey);
      throw new BadRequestException(
        'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu gửi lại mã OTP mới.',
      );
    }

    // Lấy mã OTP đã lưu
    const storedOtp = await this.redis.get(otpKey);
    if (!storedOtp) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn hoặc chưa được gửi. Vui lòng yêu cầu gửi lại.',
      );
    }

    // So sánh mã
    if (storedOtp !== code) {
      await this.redis.incr(attemptsKey);
      await this.redis.expire(attemptsKey, OTP_TTL);
      const remaining = MAX_ATTEMPTS - attempts - 1;
      throw new BadRequestException(
        `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`,
      );
    }

    // OTP đúng → xóa key
    await this.redis.del(otpKey);
    await this.redis.del(attemptsKey);

    this.logger.log(
      `✅ [OtpService] Phone OTP verified thành công cho: ${normalizedPhone}`,
    );

    const result = {
      verified: true,
      message: 'Xác thực số điện thoại thành công',
    };

    // Nếu là luồng quên mật khẩu, tạo resetToken
    if (issueResetToken) {
      const resetToken = this.generateResetToken();
      const tokenKey = RESET_TOKEN_KEY(resetToken);
      await this.redis.set(tokenKey, normalizedPhone, 'EX', RESET_TOKEN_TTL);
      result.resetToken = resetToken;
      this.logger.log(
        `🔑 [OtpService] Đã tạo resetToken cho ${normalizedPhone}: ${resetToken.substring(0, 16)}...`,
      );
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL OTP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gửi OTP qua Email (Nodemailer)
   */
  async sendEmailOtp(email) {
    this.logger.log(`📧 [OtpService] Yêu cầu gửi Email OTP cho: ${email}`);

    // Kiểm tra cooldown
    const cooldownKey = COOLDOWN_KEY('email', email);
    const cooldownRemain = await this.redis.ttl(cooldownKey);
    if (cooldownRemain > 0) {
      throw new BadRequestException(
        `Vui lòng đợi ${cooldownRemain} giây trước khi gửi lại mã OTP`,
      );
    }

    // Sinh mã OTP
    const otpCode = this.generateOtp();

    // Lưu OTP vào Redis (TTL 180s)
    const otpKey = OTP_KEY('email', email);
    await this.redis.set(otpKey, otpCode, 'EX', OTP_TTL);

    // Đặt cooldown gửi lại (60s)
    await this.redis.set(cooldownKey, '1', 'EX', COOLDOWN_TTL);

    // Reset số lần thử
    const attemptsKey = ATTEMPTS_KEY('email', email);
    await this.redis.del(attemptsKey);

    // Gửi email qua EmailService (cũng tự log ra terminal)
    await this.emailService.sendOtpEmail(email, otpCode);

    this.logger.log(
      `✅ [OtpService] Đã gửi Email OTP thành công cho: ${email}`,
    );

    return {
      message: `Mã xác thực đã được gửi đến email ${email}`,
      expiresIn: OTP_TTL,
      cooldown: COOLDOWN_TTL,
    };
  }

  /**
   * Xác thực OTP Email và tự động cập nhật cờ is_email_verified = true trong PostgreSQL
   * @param {string} email - Địa chỉ email cần xác thực
   * @param {string} code - Mã OTP 6 chữ số
   * @param {object} [req] - Request object (nếu người dùng đang đăng nhập có kèm Bearer token)
   */
  async verifyEmailOtp(email, code, req = null) {
    this.logger.log(
      `📧 [OtpService] Xác thực Email OTP cho: ${email}, Code: ${code}`,
    );

    const otpKey = OTP_KEY('email', email);
    const attemptsKey = ATTEMPTS_KEY('email', email);

    // Kiểm tra số lần thử
    const attempts = parseInt((await this.redis.get(attemptsKey)) || '0', 10);
    if (attempts >= MAX_ATTEMPTS) {
      await this.redis.del(otpKey);
      throw new BadRequestException(
        'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu gửi lại mã OTP mới.',
      );
    }

    // Lấy mã OTP
    const storedOtp = await this.redis.get(otpKey);
    if (!storedOtp) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn hoặc chưa được gửi. Vui lòng yêu cầu gửi lại.',
      );
    }

    // So sánh mã
    if (storedOtp !== code) {
      await this.redis.incr(attemptsKey);
      await this.redis.expire(attemptsKey, OTP_TTL);
      const remaining = MAX_ATTEMPTS - attempts - 1;
      throw new BadRequestException(
        `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`,
      );
    }

    // OTP đúng → xóa key
    await this.redis.del(otpKey);
    await this.redis.del(attemptsKey);

    // Cập nhật trạng thái is_email_verified = true trong database PostgreSQL
    try {
      let updated = false;

      // 1. Kiểm tra Bearer token nếu người dùng đang đăng nhập
      const authHeader = req?.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService ? this.jwtService.decode(token) : null;
        const userId = decoded?.sub || decoded?.userId || decoded?.id;
        if (userId) {
          await this.usersRepository.markEmailVerified(userId, email);
          this.logger.log(
            `✅ [OtpService] Đã cập nhật is_email_verified = true cho User ID: ${userId} (Email: ${email})`,
          );
          updated = true;
        }
      }

      // 2. Tự động cập nhật tài khoản có email tương ứng nếu có sẵn trong DB
      if (!updated && email) {
        const res = await this.usersRepository.markEmailVerifiedByEmail(email);
        if (res && res.count > 0) {
          this.logger.log(
            `✅ [OtpService] Đã cập nhật is_email_verified = true cho ${res.count} user có email ${email}`,
          );
        }
      }
    } catch (dbErr) {
      this.logger.warn(
        `⚠️ [OtpService] Lỗi khi cập nhật cờ is_email_verified vào DB: ${dbErr.message}`,
      );
    }

    this.logger.log(
      `✅ [OtpService] Email OTP verified thành công cho: ${email}`,
    );

    return {
      verified: true,
      isEmailVerified: true,
      message: 'Xác thực email thành công',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET TOKEN VALIDATION (dùng cho luồng Quên mật khẩu)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Kiểm tra resetToken và lấy phone đã verify
   * @returns {string} phone number
   */
  async validateResetToken(resetToken) {
    const tokenKey = RESET_TOKEN_KEY(resetToken);
    const phone = await this.redis.get(tokenKey);
    if (!phone) {
      throw new BadRequestException(
        'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu.',
      );
    }
    // Xóa token sau khi dùng (one-time use)
    await this.redis.del(tokenKey);
    return phone;
  }
}
