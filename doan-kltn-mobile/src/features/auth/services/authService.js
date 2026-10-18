import { apiClient } from '../../../services/api/apiClient';
import { tokenStorage } from '../../../services/storage/tokenStorage';

export const authService = {
  /**
   * Đăng nhập với email, số điện thoại hoặc username + mật khẩu
   * Khớp với AuthController.login và AuthService.login của NestJS Backend (/api/auth/login)
   */
  async login(identifier, password) {
    console.log('🔑 [AuthService] Đang gửi yêu cầu đăng nhập:', { identifier });
    const payload = {
      emailOrPhone: identifier.trim(),
      email: identifier.trim(),
      password,
    };

    const response = await apiClient.post('/auth/login', payload);

    if (response?.accessToken && response?.user) {
      console.log('💾 [AuthService] Lưu token và thông tin người dùng vào bộ nhớ cục bộ...');
      await tokenStorage.saveToken(response.accessToken);
      await tokenStorage.saveUser(response.user);
      console.log('🎉 [AuthService] Đăng nhập thành công, User Role:', response.user.role);
    }

    return response;
  },

  /**
   * Đăng ký tài khoản Khách hàng (Customer) (/api/auth/register/customer)
   */
  async registerCustomer(customerData) {
    console.log('👤 [AuthService] Đang gửi yêu cầu đăng ký Khách hàng:', customerData.email);
    const response = await apiClient.post('/auth/register/customer', customerData);
    if (response?.accessToken && response?.user) {
      await tokenStorage.saveToken(response.accessToken);
      await tokenStorage.saveUser(response.user);
    }
    return response;
  },

  /**
   * Đăng ký tài khoản Thợ (Worker) (/api/auth/register/worker)
   */
  async registerWorker(workerData) {
    console.log('🛠️ [AuthService] Đang gửi yêu cầu đăng ký Thợ:', workerData.email);
    const response = await apiClient.post('/auth/register/worker', workerData);
    if (response?.accessToken && response?.user) {
      await tokenStorage.saveToken(response.accessToken);
      await tokenStorage.saveUser(response.user);
    }
    return response;
  },

  /**
   * Đăng ký tài khoản chung (/api/auth/register)
   */
  async register(registerData) {
    console.log('📝 [AuthService] Đang gửi yêu cầu đăng ký:', registerData.email);
    const response = await apiClient.post('/auth/register', registerData);
    if (response?.accessToken && response?.user) {
      await tokenStorage.saveToken(response.accessToken);
      await tokenStorage.saveUser(response.user);
    }
    return response;
  },

  /**
   * Đăng xuất và dọn dẹp storage
   */
  async logout() {
    console.log('🚪 [AuthService] Đăng xuất và xóa session...');
    await tokenStorage.clearAll();
  },

  /**
   * Lấy phiên đăng nhập hiện tại từ bộ nhớ cục bộ
   */
  async getCurrentSession() {
    const token = await tokenStorage.getToken();
    const user = await tokenStorage.getUser();
    console.log('🔍 [AuthService] Kiểm tra phiên đăng nhập đã lưu:', {
      hasToken: !!token,
      userId: user?.id,
      userRole: user?.role,
    });
    return { token, user };
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
    console.log('🌐 [AuthService] Gửi yêu cầu đăng nhập bằng Google...');
    const response = await apiClient.post('/auth/google-login', { idToken });

    // Hỗ trợ cả chuẩn response { success, data: { accessToken, user } } lẫn flat { accessToken, user }
    const accessToken = response?.data?.accessToken || response?.accessToken;
    const user = response?.data?.user || response?.user;

    if (accessToken && user) {
      console.log('💾 [AuthService] Lưu token và thông tin người dùng Google...');
      await tokenStorage.saveToken(accessToken);
      await tokenStorage.saveUser(user);
      console.log('🎉 [AuthService] Đăng nhập Google thành công, User Role:', user.role);
    }

    return response;
  },

  /**
   * Đăng nhập hoặc đăng ký bằng tài khoản Google thông qua Firebase Authentication
   * @param {string} idToken - Firebase JWT ID Token
   */
  async firebaseGoogleLogin(idToken) {
    console.log('🔥 [AuthService] Gửi yêu cầu đăng nhập bằng Firebase Google...');
    const response = await apiClient.post('/auth/firebase-google-login', { idToken });

    const accessToken = response?.data?.accessToken || response?.accessToken;
    const user = response?.data?.user || response?.user;

    if (accessToken && user) {
      console.log('💾 [AuthService] Lưu token và thông tin người dùng Firebase Google...');
      await tokenStorage.saveToken(accessToken);
      await tokenStorage.saveUser(user);
      console.log('🎉 [AuthService] Đăng nhập Firebase Google thành công, User Role:', user.role);
    }

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
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers,
    });

    const newAvatarUrl = response?.avatarUrl || response?.data?.avatarUrl;
    if (newAvatarUrl) {
      const currentUser = await tokenStorage.getUser();
      if (currentUser) {
        currentUser.avatarUrl = newAvatarUrl;
        await tokenStorage.saveUser(currentUser);
      }
    }

    return response;
  },

  /**
   * Cập nhật số điện thoại cho tài khoản (Phone Onboarding)
   * @param {string} phone - Số điện thoại 10 số VN
   */
  async updatePhone(phone) {
    console.log('📱 [AuthService] Cập nhật số điện thoại:', phone);
    const response = await apiClient.patch('/users/update-phone', { phone });
    const updatedUser = response?.user || response?.data?.user;
    if (updatedUser) {
      await tokenStorage.saveUser(updatedUser);
    }
    return response;
  },

  /**
   * Lấy thông tin cá nhân mới nhất từ máy chủ Database (/api/users/profile)
   */
  async getProfile() {
    console.log('🌐 [AuthService] Lấy thông tin user mới nhất từ /users/profile...');
    const response = await apiClient.get('/users/profile');
    const profile = response?.data || response;
    if (profile && profile.id) {
      await tokenStorage.saveUser(profile);
    }
    return profile;
  },
};

