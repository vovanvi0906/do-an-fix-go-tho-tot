import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tokenStorage } from '../services/storage/tokenStorage';
import { isTokenExpired } from '../utils/jwt';
import { useAuth } from '../store/authStore';

/**
 * Hook kiểm tra thời hạn Token chủ động (Lớp 2: Proactive Check)
 * Tự động quét kiểm tra khi ứng dụng mount, khi đổi tab hoặc định kỳ mỗi 30 giây
 */
export function useAuthCheck() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const verifyToken = useCallback(() => {
    // Không kiểm tra nếu đang ở trang công khai (/login, /register)
    const publicPaths = ['/login', '/register'];
    if (publicPaths.includes(location.pathname)) {
      return;
    }

    const token = tokenStorage.getAccessToken();

    if (token) {
      // Kiểm tra xem token đã quá hạn chưa (có trừ hao 10 giây trễ mạng)
      if (isTokenExpired(token, 10)) {
        console.warn('⏰ [useAuthCheck]: JWT Token đã hết hạn! Đang dọn dẹp phiên đăng nhập...');
        
        // 1. Xóa sạch LocalStorage
        tokenStorage.clearAuth();

        // 2. Cập nhật state trong AuthContext
        if (logout) {
          logout();
        }

        // 3. Thông báo và điều hướng
        alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng!');
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, logout, navigate]);

  useEffect(() => {
    // 1. Kiểm tra ngay khi Component được Mount
    verifyToken();

    // 2. Kiểm tra định kỳ mỗi 30 giây
    const interval = setInterval(() => {
      verifyToken();
    }, 30000);

    // 3. Kiểm tra khi người dùng quay lại tab trình duyệt (sau khi treo máy)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifyToken();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [verifyToken]);
}

export default useAuthCheck;
