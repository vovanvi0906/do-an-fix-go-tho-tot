import { Injectable, Dependencies, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor() {
    this.logger = new Logger(EmailService.name);

    // Cấu hình SMTP Gmail (App Password)
    // Fallback: Nếu không có SMTP config → log OTP ra terminal (dùng cho dev/test)
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(
        `📧 [EmailService] Đã khởi tạo SMTP transporter: ${smtpUser} → ${smtpHost}:${smtpPort}`,
      );
    } else {
      this.transporter = null;
      this.logger.warn(
        '⚠️ [EmailService] Chưa cấu hình SMTP_USER/SMTP_PASS. Email OTP sẽ chỉ được log ra terminal.',
      );
    }
  }

  /**
   * Gửi mã OTP 6 số qua Email
   * @param {string} toEmail - Email người nhận
   * @param {string} otpCode - Mã OTP 6 số
   * @returns {Promise<boolean>} true nếu gửi thành công hoặc đã log ra terminal
   */
  async sendOtpEmail(toEmail, otpCode) {
    this.logger.log(
      `📧 [EmailService] Chuẩn bị gửi OTP ${otpCode} đến ${toEmail}`,
    );

    // Luôn log mã OTP ra terminal để debug
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  📧 EMAIL OTP CODE → ${toEmail}`);
    console.log(`  🔑 Mã xác thực: ${otpCode}`);
    console.log(`  ⏰ Hiệu lực: 3 phút`);
    console.log('══════════════════════════════════════════════════════');
    console.log('');

    if (!this.transporter) {
      this.logger.warn(
        '⚠️ [EmailService] Không có SMTP transporter → chỉ log OTP ra terminal.',
      );
      return true;
    }

    try {
      const mailOptions = {
        from: `"FixGo - Dịch vụ gia đình" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `[FixGo] Mã xác thực Email của bạn: ${otpCode}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #0084FF; font-size: 28px; margin: 0;">FixGo</h1>
              <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Dịch vụ sửa chữa gia đình</p>
            </div>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
            <p style="color: #0F172A; font-size: 16px;">Xin chào,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Mã xác thực Email của bạn là:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #0084FF 0%, #0066CC 100%); color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 40px; border-radius: 12px;">
                ${otpCode}
              </div>
            </div>
            <p style="color: #64748B; font-size: 13px; text-align: center;">
              Mã có hiệu lực trong <strong>3 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;" />
            <p style="color: #94A3B8; font-size: 12px; text-align: center;">
              Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.<br />
              © 2026 FixGo - Hệ thống dịch vụ gia đình thông minh
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `✅ [EmailService] Đã gửi OTP qua Email thành công đến: ${toEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ [EmailService] Gửi Email OTP thất bại: ${error.message}`,
        error.stack,
      );
      // Vẫn return true vì đã log OTP ra terminal, không block flow khi SMTP lỗi
      return true;
    }
  }
}
