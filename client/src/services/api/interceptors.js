import { tokenStorage } from '../storage/tokenStorage';

let isRedirecting = false;

/**
 * Cấu hình Axios request & response interceptors (Lớp 1: Bảo vệ bị động)
 * @param {import('axios').AxiosInstance} axiosInstance 
 */
export const setupInterceptors = (axiosInstance) => {
  // 1. REQUEST INTERCEPTOR: Tự động đính kèm Token Bearer
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = tokenStorage.getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. RESPONSE INTERCEPTOR: Bắt lỗi toàn cục & xử lý mã 401 Unauthorized khi Token hết hạn
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status, data, config } = error.response;
        const requestUrl = config?.url || '';

        // Formulate thông báo lỗi thân thiện
        let friendlyMessage = data?.message || data?.error || 'Đã xảy ra lỗi trong quá trình xử lý';

        if (status === 400) {
          friendlyMessage = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message || 'Dữ liệu yêu cầu không hợp lệ (400)');
        } else if (status === 401) {
          // Phân biệt 2 trường hợp lỗi 401:
          // TH 1: Đang ở trang Login gọi API đăng nhập sai tài khoản/mật khẩu
          const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

          if (isAuthEndpoint) {
            friendlyMessage = data?.message || 'Tài khoản hoặc mật khẩu không chính xác';
          } else {
            // TH 2: Token JWT đã hết hạn hoặc bị thu hồi khi đang sử dụng app
            friendlyMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';

            // Xóa sạch thông tin xác thực khỏi localStorage
            tokenStorage.clearAuth();

            // Điều hướng về trang /login nếu chưa ở trang login
            if (!isRedirecting && window.location.pathname !== '/login') {
              isRedirecting = true;
              alert('⚠️ Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!');
              window.location.href = '/login';
            }
          }
        } else if (status === 403) {
          friendlyMessage = data?.message || 'Tài khoản không có quyền truy cập chức năng này (403)';
        } else if (status === 409) {
          friendlyMessage = data?.message || 'Dữ liệu đang bị tranh chấp hoặc đã được xử lý bởi người khác (409)';
        } else if (status >= 500) {
          friendlyMessage = 'Lỗi máy chủ hệ thống (500). Vui lòng thử lại sau.';
        }

        error.friendlyMessage = friendlyMessage;
      } else if (error.request) {
        error.friendlyMessage = 'Không thể kết nối đến máy chủ API (http://localhost:3000/api). Vui lòng kiểm tra kết nối mạng hoặc Backend server.';
      } else {
        error.friendlyMessage = error.message || 'Lỗi không xác định';
      }

      return Promise.reject(error);
    }
  );
};
