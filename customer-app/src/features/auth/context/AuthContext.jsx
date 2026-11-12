import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../../../services/storage/tokenStorage';
import { setOnUnauthorizedCallback } from '../../../services/api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const authSeqRef = useRef(0);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      authSeqRef.current += 1;
      setToken(null);
      setUser(null);
    });

    const checkSession = async () => {
      const seq = ++authSeqRef.current;
      try {
        const session = await authService.getCurrentSession();
        if (seq !== authSeqRef.current) return;
        if (session.token && session.user?.role === 'CUSTOMER') {
          setToken(session.token);
          setUser(session.user);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch {
        if (seq === authSeqRef.current) { setToken(null); setUser(null); }
      } finally {
        if (seq === authSeqRef.current) setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (identifier, password) => {
    const seq = ++authSeqRef.current;
    const res = await authService.login(identifier, password);
    if (seq !== authSeqRef.current) return res;
    const accessToken = res?.accessToken || res?.data?.accessToken;
    const loggedUser = res?.user || res?.data?.user;
    if (accessToken && loggedUser) {
      setToken(accessToken);
      setUser(loggedUser);
    }
    return res;
  };

  const logout = async () => {
    authSeqRef.current += 1;
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    try {
      await tokenStorage.saveUser(updatedUser);
    } catch (e) {
      console.warn('Cannot save user', e);
    }
  };

  const registerCustomer = async (customerData) => {
    const seq = ++authSeqRef.current;
    const res = await authService.registerCustomer(customerData);
    if (seq !== authSeqRef.current) return res;
    if (res?.accessToken && res?.user) {
      setToken(res.accessToken);
      setUser(res.user);
    }
    return res;
  };

  const handleSocialLogin = async (loginFn, idToken) => {
    const seq = ++authSeqRef.current;
    const res = await loginFn(idToken);
    if (seq !== authSeqRef.current) return res;
    const accessToken = res?.data?.accessToken || res?.accessToken;
    const loggedUser = res?.data?.user || res?.user;
    if (accessToken && loggedUser) {
      setToken(accessToken);
      setUser(loggedUser);
    }
    return res;
  };

  const uploadAvatar = async (imageUri) => {
    const res = await authService.uploadAvatar(imageUri);
    const updatedUrl = res?.avatarUrl || res?.data?.avatarUrl;
    if (updatedUrl && user) updateUser({ ...user, avatarUrl: updatedUrl });
    return res;
  };

  const updatePhone = async (phone) => {
    const res = await authService.updatePhone(phone);
    const updatedUser = res?.user || res?.data?.user;
    if (updatedUser) updateUser(updatedUser);
    return res;
  };

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      if (profile?.id) {
        setUser(profile);
        await tokenStorage.saveUser(profile);
        return profile;
      }
    } catch (err) {
      console.warn('refreshProfile error:', err);
    }
    return null;
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user && user.role === 'CUSTOMER',
    isLoading,
    login,
    logout,
    updateUser,
    registerCustomer,
    registerWorker: () => authService.registerWorker(),
    googleLogin: (idToken) => handleSocialLogin(authService.googleLogin, idToken),
    firebaseGoogleLogin: (idToken) => handleSocialLogin(authService.firebaseGoogleLogin, idToken),
    uploadAvatar,
    updatePhone,
    refreshProfile,
  }), [user, token, isLoading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
