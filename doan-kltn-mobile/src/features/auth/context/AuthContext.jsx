import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../../../services/storage/tokenStorage';

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

  const updateUser = async (updatedUser) => {
    console.log('📝 [AuthContext] Cập nhật thông tin User:', updatedUser);
    setUser(updatedUser);
    try {
      await tokenStorage.saveUser(updatedUser);
    } catch (e) {
      console.warn('⚠️ [AuthContext] Không thể lưu user vào storage:', e);
    }
  };

  const registerCustomer = async (customerData) => {
    console.log('🚀 [AuthContext] Đang đăng ký khách hàng:', customerData.email);
    const res = await authService.registerCustomer(customerData);
    if (res?.accessToken && res?.user) {
      setToken(res.accessToken);
      setUser(res.user);
      console.log('✨ [AuthContext] State đã cập nhật user & token từ registerCustomer');
    }
    return res;
  };

  const googleLogin = async (idToken) => {
    console.log('🌐 [AuthContext] Thực hiện đăng nhập Google...');
    const res = await authService.googleLogin(idToken);
    const accessToken = res?.data?.accessToken || res?.accessToken;
    const user = res?.data?.user || res?.user;
    if (accessToken && user) {
      setToken(accessToken);
      setUser(user);
      console.log('✨ [AuthContext] State đã cập nhật user & token từ googleLogin');
    }
    return res;
  };

  const firebaseGoogleLogin = async (idToken) => {
    console.log('🔥 [AuthContext] Thực hiện đăng nhập Firebase Google...');
    const res = await authService.firebaseGoogleLogin(idToken);
    const accessToken = res?.data?.accessToken || res?.accessToken;
    const user = res?.data?.user || res?.user;
    if (accessToken && user) {
      setToken(accessToken);
      setUser(user);
      console.log('✨ [AuthContext] State đã cập nhật user & token từ firebaseGoogleLogin');
    }
    return res;
  };

  const uploadAvatar = async (imageUri) => {
    console.log('📸 [AuthContext] Gọi upload avatar...');
    const res = await authService.uploadAvatar(imageUri);
    const updatedUrl = res?.avatarUrl || res?.data?.avatarUrl;
    if (updatedUrl && user) {
      const newUser = { ...user, avatarUrl: updatedUrl };
      setUser(newUser);
      await tokenStorage.saveUser(newUser);
    }
    return res;
  };

  const updatePhone = async (phone) => {
    console.log('📱 [AuthContext] Gọi cập nhật số điện thoại...');
    const res = await authService.updatePhone(phone);
    const updatedUser = res?.user || res?.data?.user;
    if (updatedUser) {
      setUser(updatedUser);
      await tokenStorage.saveUser(updatedUser);
    }
    return res;
  };

  const refreshProfile = useCallback(async () => {
    try {
      console.log('🔄 [AuthContext] Đang làm mới dữ liệu người dùng từ Database...');
      const profile = await authService.getProfile();
      if (profile && profile.id) {
        setUser(profile);
        await tokenStorage.saveUser(profile);
        return profile;
      }
    } catch (err) {
      console.warn('⚠️ [AuthContext] Không thể làm mới dữ liệu người dùng:', err);
    }
    return null;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      updateUser,
      registerCustomer,
      googleLogin,
      firebaseGoogleLogin,
      uploadAvatar,
      updatePhone,
      refreshProfile,
    }),
    [user, token, isLoading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
