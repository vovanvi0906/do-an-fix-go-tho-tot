import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '../services/storage/tokenStorage';
import authService from '../features/auth/services/auth.service';
import { isTokenExpired } from '../utils/jwt';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Khởi tạo state an toàn: nếu token trong storage đã hết hạn thì xóa ngay lập tức
  const [accessToken, setAccessToken] = useState(() => {
    const token = tokenStorage.getAccessToken();
    if (token && isTokenExpired(token, 10)) {
      console.warn('⚠️ [AuthProvider]: Token trong storage đã hết hạn khi khởi động. Đang dọn dẹp...');
      tokenStorage.clearAuth();
      return null;
    }
    return token;
  });

  const [user, setUser] = useState(() => {
    const token = tokenStorage.getAccessToken();
    if (!token || isTokenExpired(token, 10)) {
      return null;
    }
    return tokenStorage.getUser();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Đồng bộ và kiểm tra lại trạng thái khi Mount
  useEffect(() => {
    const storedToken = tokenStorage.getAccessToken();
    const storedUser = tokenStorage.getUser();

    if (storedToken && isTokenExpired(storedToken, 10)) {
      tokenStorage.clearAuth();
      setUser(null);
      setAccessToken(null);
    } else if (storedToken && storedUser) {
      setUser(storedUser);
      setAccessToken(storedToken);
    }
  }, []);

  const login = useCallback(async ({ account, email, password }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login({ account, email, password });
      setUser(data.user);
      setAccessToken(data.accessToken);
      return data;
    } catch (err) {
      const errMsg = err.friendlyMessage || err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      setAccessToken(data.accessToken);
      return data;
    } catch (err) {
      const errMsg = err.friendlyMessage || err.response?.data?.message || err.message || 'Đăng ký thất bại';
      setError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setAccessToken(null);
    setError(null);
  }, []);

  const value = {
    user,
    role: user?.role ? String(user.role).toUpperCase() : null,
    accessToken,
    isAuthenticated: !!accessToken && !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
