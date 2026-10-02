import { apiClient } from '../../../services/api/apiClient';

/**
 * OTP Service – Gọi API Backend để gửi/xác thực mã OTP
 * Endpoints: /api/auth/send-phone-otp, /api/auth/verify-phone-otp,
 *            /api/auth/send-email-otp, /api/auth/verify-email-otp
 */
export const otpService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // PHONE OTP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gửi OTP qua SMS đến số điện thoại
   * @param {string} phone - Số điện thoại (vd: "0987654321")
   * @returns {Promise<{ message, expiresIn, cooldown }>}
   */
  async sendPhoneOtp(phone) {
    console.log('📱 [OtpService] Gửi yêu cầu Phone OTP:', phone);
    const response = await apiClient.post('/auth/send-phone-otp', { phone });
    console.log('✅ [OtpService] Phone OTP đã được gửi:', response);
    return response;
  },

  /**
   * Xác thực OTP Số điện thoại
   * @param {string} phone
   * @param {string} code - Mã OTP 6 số
   * @param {string} purpose - 'register' (mặc định) hoặc 'reset-password'
   * @returns {Promise<{ verified, message, resetToken? }>}
   */
  async verifyPhoneOtp(phone, code, purpose = 'register') {
    console.log('📱 [OtpService] Xác thực Phone OTP:', { phone, code, purpose });
    const url = purpose === 'reset-password'
      ? '/auth/verify-phone-otp?purpose=reset-password'
      : '/auth/verify-phone-otp';
    const response = await apiClient.post(url, { phone, code });
    console.log('✅ [OtpService] Phone OTP verified:', response);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL OTP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gửi OTP qua Email
   * @param {string} email
   * @returns {Promise<{ message, expiresIn, cooldown }>}
   */
  async sendEmailOtp(email) {
    console.log('📧 [OtpService] Gửi yêu cầu Email OTP:', email);
    const response = await apiClient.post('/auth/send-email-otp', { email });
    console.log('✅ [OtpService] Email OTP đã được gửi:', response);
    return response;
  },

  /**
   * Xác thực OTP Email
   * @param {string} email
   * @param {string} code - Mã OTP 6 số
   * @returns {Promise<{ verified, message }>}
   */
  async verifyEmailOtp(email, code) {
    console.log('📧 [OtpService] Xác thực Email OTP:', { email, code });
    const response = await apiClient.post('/auth/verify-email-otp', { email, code });
    console.log('✅ [OtpService] Email OTP verified:', response);
    return response;
  },
};
