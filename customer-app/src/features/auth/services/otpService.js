import { apiClient } from '../../../services/api/apiClient';

/**
 * OTP Service – Gọi API Backend để gửi/xác thực mã OTP
 * Endpoints: /api/auth/send-phone-otp, /api/auth/verify-phone-otp,
 *            /api/auth/send-email-otp, /api/auth/verify-email-otp
 */
export const otpService = {
  /**
   * Gửi OTP qua SMS đến số điện thoại
   * @param {string} phone - Số điện thoại
   * @returns {Promise<{ message, expiresIn, cooldown }>}
   */
  async sendPhoneOtp(phone) {
    const response = await apiClient.post('/auth/send-phone-otp', { phone });
    return response;
  },

  /**
   * Xác thực OTP Số điện thoại
   * @param {string} phone
   * @param {string} code - Mã OTP 6 số
   * @param {string} purpose - 'register' (mặc định) hoặc 'reset-password'
   * @returns {Promise<{ verified, message, registrationProof?, registrationProofExpiresIn?, resetToken? }>}
   */
  async verifyPhoneOtp(phone, code, purpose = 'register') {
    const url = purpose === 'reset-password'
      ? '/auth/verify-phone-otp?purpose=reset-password'
      : '/auth/verify-phone-otp';
    const response = await apiClient.post(url, { phone, code });
    return response;
  },

  /**
   * Gửi OTP qua Email
   * @param {string} email
   * @returns {Promise<{ message, expiresIn, cooldown }>}
   */
  async sendEmailOtp(email) {
    const response = await apiClient.post('/auth/send-email-otp', { email });
    return response;
  },

  /**
   * Xác thực OTP Email
   * @param {string} email
   * @param {string} code - Mã OTP 6 số
   * @returns {Promise<{ verified, message }>}
   */
  async verifyEmailOtp(email, code) {
    const response = await apiClient.post('/auth/verify-email-otp', { email, code });
    return response;
  },
};
