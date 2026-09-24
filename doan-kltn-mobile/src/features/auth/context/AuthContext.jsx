import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tự động kiểm tra phiên đăng nhập đã lưu khi khởi động ứng dụng
    const checkSession = async () => {
      try {
        console.log('🔄 [AuthContext] Đang kiểm tra phiên đăng nhập lưu trong máy...');
        const session = await authService.getCurrentSession();
        if (session.token && session.user) {
          console.log('👤 [AuthContext] Tìm thấy phiên đăng nhập:', {
            email: session.user.email,
            role: session.user.role,
          });
          setToken(session.token);
          setUser(session.user);
        } else {
          console.log('ℹ️ [AuthContext] Chưa có phiên đăng nhập nào được lưu.');
        }
      } catch (err) {
        console.warn('⚠️ [AuthContext] Không thể tải phiên đăng nhập ban đầu:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (identifier, password) => {
    console.log('🚀 [AuthContext] Bắt đầu gọi đăng nhập từ UI:', { identifier });
    const res = await authService.login(identifier, password);
    if (res?.accessToken && res?.user) {
      setToken(res.accessToken);
      setUser(res.user);
      console.log('✨ [AuthContext] State đã cập nhật user & token mới');
    }
    return res;
  };

  const logout = async () => {
    console.log('👋 [AuthContext] Thực hiện đăng xuất...');
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    console.log('📝 [AuthContext] Cập nhật thông tin User:', updatedUser);
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
