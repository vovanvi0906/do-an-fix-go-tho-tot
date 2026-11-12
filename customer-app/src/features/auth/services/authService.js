import { apiClient } from '../../../services/api/apiClient';
import { tokenStorage } from '../../../services/storage/tokenStorage';
import { socialSignup } from './registrationFlow';
import { profileService } from './profileService';

async function saveAuthSession(response) {
  const accessToken = response?.accessToken || response?.data?.accessToken;
  const refreshToken = response?.refreshToken || response?.data?.refreshToken;
  const user = response?.user || response?.data?.user;

  if (accessToken) await tokenStorage.saveToken(accessToken);
  if (refreshToken) await tokenStorage.saveRefreshToken(refreshToken);
  if (user) await tokenStorage.saveUser(user);
}

function enforceCustomerRole(response) {
  const user = response?.user || response?.data?.user;
  const role = (user?.role || '').toUpperCase();
  if (role && role !== 'CUSTOMER') {
    const err = new Error('Tài khoản Đối tác/Quản trị viên không thể đăng nhập ứng dụng Khách hàng.');
    err.status = 403;
    err.code = 'ROLE_NOT_PERMITTED';
    throw err;
  }
}

export const authService = {
  async login(identifier, password) {
    const payload = {
      emailOrPhone: identifier.trim(),
      email: identifier.trim(),
      password,
    };
    const response = await apiClient.post('/auth/login', payload);
    try {
      enforceCustomerRole(response);
    } catch (roleErr) {
      await tokenStorage.clearAll();
      throw roleErr;
    }
    await saveAuthSession(response);
    return response;
  },

  async registerCustomer(customerData) {
    if (!customerData?.registrationProof || !customerData?.phone) {
      const err = new Error('Thiếu bằng chứng xác thực OTP (registrationProof) hoặc số điện thoại.');
      err.status = 400;
      err.code = 'REGISTRATION_PROOF_REQUIRED';
      throw err;
    }
    const response = await apiClient.post('/auth/register/customer', customerData);
    enforceCustomerRole(response);
    await saveAuthSession(response);
    return response;
  },

  async registerWorker() {
    const err = new Error('Đăng ký tài khoản Thợ không được hỗ trợ trên ứng dụng Khách hàng.');
    err.status = 403;
    err.code = 'ROLE_NOT_PERMITTED';
    throw err;
  },

  async register(registerData) {
    return this.registerCustomer(registerData);
  },

  async logout() {
    socialSignup.clear();
    await tokenStorage.clearAll();
  },

  async getCurrentSession() {
    const token = await tokenStorage.getToken();
    const user = await tokenStorage.getUser();
    const role = (user?.role || '').toUpperCase();
    if (user && role !== 'CUSTOMER') {
      await tokenStorage.clearAll();
      return { token: null, user: null };
    }
    return { token, user };
  },

  async resetPassword(resetToken, newPassword) {
    return apiClient.post('/auth/reset-password', { resetToken, newPassword });
  },

  async googleLogin(idToken, registration = {}) {
    const response = await apiClient.post('/auth/google-login', { ...registration, idToken });
    try {
      enforceCustomerRole(response);
    } catch (roleErr) {
      await tokenStorage.clearAll();
      throw roleErr;
    }
    await saveAuthSession(response);
    return response;
  },

  async firebaseGoogleLogin(idToken, registration = {}) {
    const response = await apiClient.post('/auth/firebase-google-login', { ...registration, idToken });
    try {
      enforceCustomerRole(response);
    } catch (roleErr) {
      await tokenStorage.clearAll();
      throw roleErr;
    }
    await saveAuthSession(response);
    return response;
  },

  uploadAvatar: profileService.uploadAvatar,
  updatePhone: profileService.updatePhone,
  getProfile: profileService.getProfile,
};
