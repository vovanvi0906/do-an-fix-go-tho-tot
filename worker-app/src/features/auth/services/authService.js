import { sessionEpoch } from './sessionEpoch';
import { apiClient } from '../../../services/api/apiClient';
import { tokenStorage } from '../../../services/storage/tokenStorage';

async function saveAuthSession(response, epoch) {
  sessionEpoch.assert(epoch);
  const accessToken = response?.accessToken || response?.data?.accessToken;
  const refreshToken = response?.refreshToken || response?.data?.refreshToken;
  const user = response?.user || response?.data?.user;

  if (user?.role?.toUpperCase() !== 'WORKER') {
    throw new Error('Ứng dụng này chỉ dành cho thợ. Vui lòng đăng nhập bằng tài khoản thợ.');
  }

  if (!accessToken || !user?.id) throw new Error('Phản hồi đăng nhập không hợp lệ');
  await sessionEpoch.write(epoch, async () => {
    await tokenStorage.clearAll();
    await tokenStorage.saveToken(accessToken);
    if (refreshToken) await tokenStorage.saveRefreshToken(refreshToken);
    await tokenStorage.saveUser(user);
  });
}

export const authService = {
  /**
   * Đăng nhập với email, số điện thoại hoặc username + mật khẩu
   * Khớp với AuthController.login và AuthService.login của NestJS Backend (/api/auth/login)
   */
  async login(identifier, password) {
    const epoch = sessionEpoch.begin();
    console.log('🔑 [AuthService] Đang gửi yêu cầu đăng nhập:', { identifier });
    const payload = {
      emailOrPhone: identifier.trim(),
      email: identifier.trim(),
      password,
    };

    const response = await apiClient.post('/auth/login', payload);
    await saveAuthSession(response, epoch);
    return response;
  },

  /**
   * Đăng ký tài khoản Thợ (Worker) (/api/auth/register/worker)
   */
  async registerWorker(workerData) {
    const epoch = sessionEpoch.begin();
    console.log('🛠️ [AuthService] Đang gửi yêu cầu đăng ký Thợ:', workerData.email);
    const response = await apiClient.post('/auth/register/worker', workerData);
    await saveAuthSession(response, epoch);
    return response;
  },

  /**
   * Đăng ký tài khoản chung (/api/auth/register)
   */
  async register(registerData) {
    const epoch = sessionEpoch.begin();
    console.log('📝 [AuthService] Đang gửi yêu cầu đăng ký:', registerData.email);
    const response = await apiClient.post('/auth/register', registerData);
    await saveAuthSession(response, epoch);
    return response;
  },

  /**
   * Đăng xuất và dọn dẹp storage
   */
  async logout() {
    console.log('🚪 [AuthService] Đăng xuất và xóa session...');
    const epoch = sessionEpoch.begin();
    await sessionEpoch.write(epoch, () => tokenStorage.clearAll());
  },

  /**
   * Lấy phiên đăng nhập hiện tại từ bộ nhớ cục bộ
   */
  async getCurrentSession() {
    const epoch = sessionEpoch.current();
    const token = await tokenStorage.getToken();
    if (!token) return { token: null, user: null };
    const user = await this.getProfile();
    sessionEpoch.assert(epoch);
    if (user?.role !== 'WORKER') throw new Error('Tài khoản không phải thợ');
    return { token: await tokenStorage.getToken(), user };
  },

  /**
   * Đặt lại mật khẩu (sau khi xác thực OTP SĐT thành công)
   * @param {string} resetToken - Token từ verify-phone-otp (purpose=reset-password)
   * @param {string} newPassword - Mật khẩu mới
   */
  async resetPassword(resetToken, newPassword) {
    console.log('🔐 [AuthService] Gửi yêu cầu đặt lại mật khẩu');
    const response = await apiClient.post('/auth/reset-password', {
      resetToken,
      newPassword,
    });
    console.log('✅ [AuthService] Đặt lại mật khẩu thành công');
    return response;
  },

  /**
   * Đăng nhập hoặc đăng ký nhanh bằng Google
   * @param {string} idToken - Google JWT ID Token từ Google OAuth
   */
  async googleLogin(idToken) {
    const epoch = sessionEpoch.begin();
    console.log('🌐 [AuthService] Gửi yêu cầu đăng nhập bằng Google...');
    const response = await apiClient.post('/auth/google-login', { idToken });
    await saveAuthSession(response, epoch);
    return response;
  },

  /**
   * Đăng nhập hoặc đăng ký bằng tài khoản Google thông qua Firebase Authentication
   * @param {string} idToken - Firebase JWT ID Token
   */
  async firebaseGoogleLogin(idToken) {
    const epoch = sessionEpoch.begin();
    console.log('🔥 [AuthService] Gửi yêu cầu đăng nhập bằng Firebase Google...');
    const response = await apiClient.post('/auth/firebase-google-login', { idToken });
    await saveAuthSession(response, epoch);
    return response;
  },

  /**
   * Tải ảnh đại diện lên Cloudinary qua Backend
   * @param {string} imageUri - Đường dẫn cục bộ của ảnh từ ImagePicker
   */
  async uploadAvatar(imageUri) {
    console.log('📸 [AuthService] Bắt đầu upload avatar lên Cloudinary...');
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    });

    // Đảm bảo Token xác thực luôn có mặt trong header của request FormData
    const token = await tokenStorage.getToken();
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers,
    });

    return response;
  },

  /**
   * Cập nhật số điện thoại cho tài khoản (Phone Onboarding)
   * @param {string} phone - Số điện thoại 10 số VN
   */
  async updatePhone(phone) {
    console.log('📱 [AuthService] Cập nhật số điện thoại:', phone);
    const response = await apiClient.patch('/users/update-phone', { phone });
    return response;
  },

  /**
   * Lấy thông tin cá nhân mới nhất từ máy chủ Database (/api/users/profile)
   */
  async getProfile() {
    console.log('🌐 [AuthService] Lấy thông tin user mới nhất từ /users/profile...');
    const epoch = sessionEpoch.current();
    const response = await apiClient.get('/users/profile');
    sessionEpoch.assert(epoch);
    const profile = response?.data || response;
    if (profile && profile.id) {
      await sessionEpoch.write(epoch, () => tokenStorage.saveUser(profile));
    }
    return profile;
  },
};

