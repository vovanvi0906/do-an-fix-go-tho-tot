import { AppState } from 'react-native';
import { sessionEpoch } from '../services/sessionEpoch';
import { socketService } from '../../../services/socket/socketService';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../../../services/storage/tokenStorage';
import { setOnUnauthorizedCallback } from '../../../services/api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Đăng ký nhận thông báo khi apiClient gặp 401 Unauthorized
    setOnUnauthorizedCallback(() => {
      console.warn('🔒 [AuthContext] Nhận tín hiệu 401 -> Reset phiên đăng nhập về null');
      socketService.disconnect();
      setToken(null);
      setUser(null);
    });

    // Tự động kiểm tra phiên đăng nhập đã lưu khi khởi động ứng dụng
    const initialEpoch = sessionEpoch.current();
    const checkSession = async () => {
      try {
        console.log('🔄 [AuthContext] Đang kiểm tra phiên đăng nhập lưu trong máy...');
        const session = await authService.getCurrentSession();
        sessionEpoch.assert(initialEpoch);
        if (session.token && session.user?.role?.toUpperCase() === 'WORKER') {
          console.log('👤 [AuthContext] Tìm thấy phiên đăng nhập:', {
            email: session.user.email,
            role: session.user.role,
          });
          setToken(session.token);
          setUser(session.user);
        } else {
          await sessionEpoch.write(initialEpoch, () => tokenStorage.clearAll());
        }
      } catch (err) {
        console.warn('⚠️ [AuthContext] Không thể tải phiên đăng nhập ban đầu:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
    return () => setOnUnauthorizedCallback(null);
  }, []);

  const login = async (identifier, password) => {
    console.log('🚀 [AuthContext] Bắt đầu gọi đăng nhập từ UI:', { identifier });
    const pending = authService.login(identifier, password);
    const epoch = sessionEpoch.current();
    const res = await pending;
    sessionEpoch.assert(epoch);
    const accessToken = res?.accessToken || res?.data?.accessToken;
    const user = res?.user || res?.data?.user;
    if (accessToken && user) {
      setToken(accessToken);
      setUser(user);
      console.log('✨ [AuthContext] State đã cập nhật user & token mới');
    }
    return res;
  };

  const logout = async () => {
    console.log('👋 [AuthContext] Thực hiện đăng xuất...');
    setToken(null);
    setUser(null);
    socketService.disconnect();
    await authService.logout();
  };

  // Client-supplied profile edits must never grant a role or approval.
  const updateUser = async () => refreshProfile();

  const registerWorker = async (workerData) => {
    const pending = authService.registerWorker(workerData);
    const epoch = sessionEpoch.current();
    const res = await pending;
    sessionEpoch.assert(epoch);
    const accessToken = res?.accessToken || res?.data?.accessToken;
    const registeredUser = res?.user || res?.data?.user;
    if (accessToken && registeredUser) {
      setToken(accessToken);
      setUser(registeredUser);
    }
    return res;
  };

  const googleLogin = async (idToken) => {
    console.log('🌐 [AuthContext] Thực hiện đăng nhập Google...');
    const pending = authService.googleLogin(idToken);
    const epoch = sessionEpoch.current();
    const res = await pending;
    sessionEpoch.assert(epoch);
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
    const pending = authService.firebaseGoogleLogin(idToken);
    const epoch = sessionEpoch.current();
    const res = await pending;
    sessionEpoch.assert(epoch);
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
    const epoch = sessionEpoch.current();
    const res = await authService.uploadAvatar(imageUri);
    sessionEpoch.assert(epoch);
    await refreshProfile();
    return res;
  };

  const updatePhone = async (phone) => {
    const epoch = sessionEpoch.current();
    const res = await authService.updatePhone(phone);
    sessionEpoch.assert(epoch);
    await refreshProfile();
    return res;
  };

  const refreshProfile = useCallback(async () => {
    try {
      console.log('🔄 [AuthContext] Đang làm mới dữ liệu người dùng từ Database...');
      const epoch = sessionEpoch.current();
      const profile = await authService.getProfile();
      sessionEpoch.assert(epoch);
      if (profile?.role !== 'WORKER') { await authService.logout(); setToken(null); setUser(null); return null; }
      if (profile && profile.id) {
        setUser(profile);

        return profile;
      }
    } catch (err) {
      console.warn('⚠️ [AuthContext] Không thể làm mới dữ liệu người dùng:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshProfile();
    });
    return () => subscription.remove();
  }, [user?.id, refreshProfile]);

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
      registerWorker,
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
