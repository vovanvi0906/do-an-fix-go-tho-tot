import {
  Injectable,
  Dependencies,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { RegistrationProofService } from './registration-proof.service';
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
  RegistrationProofService,
)
export class OtpService {
  constructor(
    redisService,
    emailService,
    esmsService,
    usersRepository,
    jwtService,
    registrationProofService,
  ) {
    this.registrationProofService = registrationProofService;
    this.redis = redisService.getClient();
    this.emailService = emailService;
    this.esmsService = esmsService;
    this.usersRepository = usersRepository;
    this.jwtService = jwtService;
    this.logger = new Logger(OtpService.name);
  }

  hashOtp(code) {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'OTP_HASH_SECRET (or JWT_SECRET) must contain at least 32 characters',
      );
    }
    return crypto
      .createHmac('sha256', secret)
      .update(String(code))
      .digest('hex');
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
   * Gửi OTP qua SMS
   */
  async sendPhoneOtp(phone) {
    // 1. Chuẩn hóa số điện thoại trước khi xử lý
    const normalizedPhone = this.registrationProofService.normalizePhone(phone);
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
    this.hashOtp('configuration-check');
    const reserved = await this.redis.set(
      cooldownKey,
      '1',
      'EX',
      COOLDOWN_TTL,
      'NX',
    );
    if (reserved !== 'OK') {
      throw new BadRequestException('Vui lòng đợi trước khi gửi lại mã OTP');
    }

    // 3. Sinh mã OTP
    const otpCode = this.generateOtp();
    const otpHash = this.hashOtp(otpCode);

    // 4. Gửi tin nhắn SMS thật qua cổng eSMS
    // Nếu eSMS trả về lỗi, ném lỗi ra ngoài, KHÔNG báo thành công về mobile!
    try {
      await this.esmsService.sendOtpSms(normalizedPhone, otpCode);
    } catch (smsError) {
      throw new BadRequestException(
        'Gửi SMS OTP thất bại. Vui lòng thử lại sau.',
      );
    }

    // 5. Khi eSMS đã gửi thành công -> Lưu OTP vào Redis (TTL 180s)
    const otpKey = OTP_KEY('phone', normalizedPhone);
    const attemptsKey = ATTEMPTS_KEY('phone', normalizedPhone);
    await this.redis
      .multi()
      .set(otpKey, otpHash, 'EX', OTP_TTL)
      .del(attemptsKey)
      .exec();

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
    const normalizedPhone = this.registrationProofService.normalizePhone(phone);
    if (typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }
    // A Lua script makes attempt counting and one-time verification atomic.
    const status = await this.redis.eval(
      `
      local attempts = tonumber(redis.call('GET', KEYS[2]) or '0')
      if attempts >= tonumber(ARGV[2]) then
        redis.call('DEL', KEYS[1])
        return -2
      end
      local stored = redis.call('GET', KEYS[1])
      if not stored then return -1 end
      if stored ~= ARGV[1] then
        local count = redis.call('INCR', KEYS[2])
        redis.call('EXPIRE', KEYS[2], ARGV[3])
        if count >= tonumber(ARGV[2]) then redis.call('DEL', KEYS[1]) end
        return 0
      end
      redis.call('DEL', KEYS[1], KEYS[2])
      return 1
    `,
      2,
      OTP_KEY('phone', normalizedPhone),
      ATTEMPTS_KEY('phone', normalizedPhone),
      this.hashOtp(code),
      MAX_ATTEMPTS,
      OTP_TTL,
    );
    if (status !== 1) {
      throw new BadRequestException(
        'Mã OTP không hợp lệ, hết hạn hoặc vượt quá số lần thử.',
      );
    }

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
    } else {
      Object.assign(
        result,
        await this.registrationProofService.issue(normalizedPhone),
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

    // Gửi email qua EmailService
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
    this.logger.log(`📧 [OtpService] Xác thực Email OTP`);

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
    let updatedUser = null;
    try {
      let updated = false;

      // 1. Kiểm tra Bearer token nếu người dùng đang đăng nhập
      const authHeader = req?.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService ? this.jwtService.decode(token) : null;
        const userId = decoded?.sub || decoded?.userId || decoded?.id;
        if (userId) {
          if (email) {
            const existingWithEmail =
              await this.usersRepository.findByEmail(email);
            if (existingWithEmail && existingWithEmail.id !== userId) {
              throw new BadRequestException(
                'Email này đã được liên kết với một tài khoản khác trong hệ thống.',
              );
            }
          }
          updatedUser = await this.usersRepository.markEmailVerified(
            userId,
            email,
          );
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
          updatedUser = await this.usersRepository.findByEmail(email);
        }
      }
    } catch (dbErr) {
      this.logger.warn(
        `⚠️ [OtpService] Lỗi khi cập nhật cờ is_email_verified vào DB: ${dbErr.message}`,
      );
      if (dbErr instanceof BadRequestException) {
        throw dbErr;
      }
    }

    this.logger.log(
      `✅ [OtpService] Email OTP verified thành công cho: ${email}`,
    );

    let sanitizedUser = null;
    if (updatedUser) {
      const { passwordHash: _, ...rest } = updatedUser;
      sanitizedUser = rest;
    }

    return {
      success: true,
      verified: true,
      isEmailVerified: true,
      message: 'Xác thực email thành công',
      user: sanitizedUser,
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
