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
};
