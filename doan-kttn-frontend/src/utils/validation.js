/**
 * Validation utilities for form fields and authentication
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^(\+84|84|0)[1-9][0-9]{8,9}$/;

export const validateEmailOrPhone = (value) => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return { isValid: false, message: 'Vui lòng nhập Email hoặc Tên đăng nhập' };
  }
  const trimmed = value.trim();
  const isEmail = EMAIL_REGEX.test(trimmed);
  const isPhone = PHONE_REGEX.test(trimmed.replace(/[\s.-]/g, ''));

  if (!isEmail && !isPhone && trimmed.length < 3) {
    return { isValid: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' };
  }
  return { isValid: true, message: '', type: isEmail ? 'email' : (isPhone ? 'phone' : 'username') };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Mật khẩu không được để trống' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  return { isValid: true, message: '' };
};

export const validateLoginForm = ({ account, password }) => {
  const accountValidation = validateEmailOrPhone(account);
  if (!accountValidation.isValid) return accountValidation;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  return { isValid: true, message: '' };
};
