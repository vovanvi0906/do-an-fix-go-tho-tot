import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../src/features/auth';
import { apiClient } from '../src/services/api/apiClient';
import { tokenStorage } from '../src/services/storage/tokenStorage';
import {
  auth as firebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from '../src/services/firebaseConfig';

// Hoàn tất phiên WebBrowser nếu có
WebBrowser.maybeCompleteAuthSession();

// ─── Helper giải mã JWT an toàn cho React Native (không phụ thuộc lib native) ──
function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    let binary = '';
    if (typeof atob === 'function') {
      binary = atob(padded);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let bc = 0, bs, buffer, idx = 0;
      for (
        ;
        (buffer = padded.charAt(idx++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
          ? (binary += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
          : 0
      ) {
        buffer = chars.indexOf(buffer);
      }
    }

    const jsonPayload = decodeURIComponent(
      binary
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    try {
      const parts = token.split('.');
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}

// ─── Design Tokens (Figma FIXGO – Login Customer Screen) ────────────────────
const COLORS = {
  primary: '#3B82F6',        // Nền xanh dương chính
  primaryDark: '#2563EB',    // Hover / active
  darkBlue: '#1A365D',       // Nút Đăng nhập (xanh đậm – Figma)
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9CA3AF',           // Placeholder & icon mặc định
  red: '#EF4444',            // Error border & text
  lightBlue: '#BFDBFE',      // Link "Quên mật khẩu?"
  facebookBlue: '#1877F2',
  googleRed: '#EA4335',
};

export default function FixGoLoginScreen() {
  const router = useRouter();
  const tempTokenRef = useRef(null);
  const {
    login,
    googleLogin,
    firebaseGoogleLogin,
    isLoading: isCheckingSession,
    isAuthenticated,
    user,
    updatePhone,
  } = useAuth();

  // ─── Font loading (Inter) ───────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Per-field error highlight (Figma Screen 2, 4, 5)
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Modal chọn vai trò đăng ký (Khách hàng / Thợ)
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // ─── 3. Cấu hình expo-auth-session Google OAuth (Hoạt động mượt mà trên Expo Go) ───
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '255047379055-cu8ifeqgfak7nj3sq8bcve9hqh9v85m4.apps.googleusercontent.com';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId: webClientId,
    scopes: ['profile', 'email'],
  });

  // Lắng nghe kết quả trả về từ cửa sổ Google OAuth WebBrowser
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, authentication } = response.params;
      const googleIdToken = id_token || authentication?.idToken;
      console.log('✅ [FixGo Google AuthSession] Nhận idToken thành công từ trình duyệt WebBrowser');
      if (googleIdToken) {
        handleFirebaseGoogleSignIn(googleIdToken);
      } else {
        Alert.alert('Đăng nhập thất bại', 'Không nhận được mã xác thực idToken từ Google.');
        setIsGoogleLoading(false);
      }
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      console.log('ℹ️ [FixGo Google AuthSession] Người dùng đã đóng cửa sổ đăng nhập Google');
      setIsGoogleLoading(false);
    } else if (response?.type === 'error') {
      console.error('❌ [FixGo Google AuthSession Lỗi]:', response.error);
      Alert.alert('Đăng nhập thất bại', response.error?.message || 'Đăng nhập Google thất bại');
      setIsGoogleLoading(false);
    }
  }, [response]);





  // ─── 4. XÁC THỰC VỚI FIREBASE BẰNG signInWithCredential (KHÔNG DÙNG signInWithRedirect)
  const handleFirebaseGoogleSignIn = async (googleIdToken) => {
    try {
      setIsGoogleLoading(true);

      // Giải mã profile người dùng để log chẩn đoán
      const userProfile = parseJwt(googleIdToken);
      if (userProfile) {
        console.log('👤 [FixGo Mobile] Profile Google:', {
          email: userProfile.email,
          name: userProfile.name,
          sub: userProfile.sub,
        });
      }

      let res;
      try {
        // Chuẩn Native/Expo: Đổi Google id_token sang Firebase Auth Credential
        console.log('🔥 [FixGo Mobile] Gọi signInWithCredential của Firebase Auth...');
        const credential = GoogleAuthProvider.credential(googleIdToken);
        const userCredential = await signInWithCredential(firebaseAuth, credential);
        const firebaseIdToken = await userCredential.user.getIdToken();
        console.log('🔥 [FixGo Mobile] Đăng nhập Firebase Auth thành công:', userCredential.user.email);

        // Gửi Firebase idToken lên Backend NestJS để verify & nhận session JWT
        console.log('🌐 [FixGo Mobile] Gửi Firebase ID Token lên Backend NestJS...');
        res = await firebaseGoogleLogin(firebaseIdToken);
        console.log('🎉 [FixGo Mobile] Xác thực Backend hoàn tất!');
      } catch (fbErr) {
        console.warn(
          '⚠️ [FixGo Mobile] signInWithCredential gặp lỗi, kích hoạt fallback gọi Google Backend:',
          fbErr.message
        );
        // Fallback tự động gọi endpoint Google OAuth backend
        res = await googleLogin(googleIdToken);
        console.log('🎉 [FixGo Mobile] Fallback Google Backend thành công!');
      }

      // 1. Bóc tách thông tin user và accessToken từ response backend
      const loggedUser = res?.data?.user || res?.user;
      const jwtToken = res?.data?.accessToken || res?.accessToken || res?.data?.token || res?.token;
      const isSuccess = !!(res?.data?.success ?? res?.success ?? loggedUser);
      const requirePhone = !!(res?.data?.requirePhoneUpdate ?? res?.requirePhoneUpdate ?? !loggedUser?.phone);
      const userRole = (loggedUser?.role || 'CUSTOMER').toUpperCase();

      // 2. Set trực tiếp Authorization Header cho Axios và lưu token vào Storage
      if (jwtToken) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        await tokenStorage.saveToken(jwtToken);
      }
      if (loggedUser) {
        await tokenStorage.saveUser(loggedUser);
      }

      // 3. Nếu tài khoản chưa có số điện thoại: Điều hướng sang màn hình luồng OTP có sẵn của hệ thống
      if (isSuccess && requirePhone) {
        console.log('📱 [FixGo Mobile] Google Sign-In thành công, điều hướng sang luồng OTP để bổ sung SĐT...');
        router.push({
          pathname: '/(auth)/register-customer',
          params: {
            isSocialOnboarding: 'true',
            role: userRole,
          },
        });
        return;
      }

      // 4. Nếu tài khoản đã có đầy đủ SĐT, điều hướng thẳng vào Trang chủ
      if (userRole === 'WORKER') {
        router.replace('/(worker)/(tabs)');
      } else {
        router.replace('/(user)/(tabs)');
      }
    } catch (err) {
      console.error('❌ [FixGo Mobile] Lỗi xác thực tài khoản:', err);
      Alert.alert(
        'Đăng nhập thất bại',
        err.message || 'Không thể xác thực tài khoản Google với hệ thống. Vui lòng thử lại.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ─── 5. KÍCH HOẠT ĐĂNG NHẬP GOOGLE BẰNG EXPO AUTH SESSION / WEB-BROWSER ───
  const handlePressGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage('');

      // Nền tảng Web (Desktop Browser): Dùng Firebase signInWithPopup
      if (Platform.OS === 'web') {
        console.log('🌐 [FixGo Web] Đăng nhập Google qua Firebase signInWithPopup...');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const userCredential = await signInWithPopup(firebaseAuth, provider);
        const firebaseIdToken = await userCredential.user.getIdToken();
        console.log('🔥 [FixGo Web] Lấy thành công Firebase ID Token cho:', userCredential.user.email);

        console.log('🌐 [FixGo Web] Gửi Firebase ID Token lên Backend NestJS...');
        const res = await firebaseGoogleLogin(firebaseIdToken);
        console.log('🎉 [FixGo Web] Đăng nhập Web hoàn tất!');

        const loggedUser = res?.data?.user || res?.user;
        const jwtToken = res?.data?.accessToken || res?.accessToken || res?.data?.token || res?.token;
        const isSuccess = !!(res?.data?.success ?? res?.success ?? loggedUser);
        const requirePhone = !!(res?.data?.requirePhoneUpdate ?? res?.requirePhoneUpdate ?? !loggedUser?.phone);
        const userRole = (loggedUser?.role || 'CUSTOMER').toUpperCase();

        if (jwtToken) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
          await tokenStorage.saveToken(jwtToken);
        }
        if (loggedUser) {
          await tokenStorage.saveUser(loggedUser);
        }

        if (isSuccess && requirePhone) {
          console.log('📱 [FixGo Web] Google Sign-In thành công, điều hướng sang luồng OTP để bổ sung SĐT...');
          router.push({
            pathname: '/(auth)/register-customer',
            params: {
              isSocialOnboarding: 'true',
              role: userRole,
            },
          });
          return;
        }

        if (userRole === 'WORKER') {
          router.replace('/(worker)/(tabs)');
        } else {
          router.replace('/(user)/(tabs)');
        }
        return;
      }

      // Nền tảng Mobile (Android / iOS qua Expo Go hoặc Standalone APK)
      console.log('📱 [FixGo Mobile] Mở trình duyệt WebBrowser đăng nhập Google (Expo AuthSession)...');
      await promptAsync();
    } catch (err) {
      setIsGoogleLoading(false);
      console.error('❌ [FixGo Auth Error]:', err);
      Alert.alert(
        'Đăng nhập thất bại',
        err.message || 'Không thể mở trình duyệt đăng nhập Google lúc này.'
      );
    }
  };

  // ─── Logging khởi chạy ──────────────────────────────────────────────────────
  useEffect(() => {
    console.log('🚀 [FixGo Mobile] Khởi chạy giao diện Đăng nhập FixGo (Figma Blue)');
  }, []);

  // ─── Auto-redirect nếu phiên đăng nhập còn hiệu lực ────────────────────────
  // Lưu ý: TUYỆT ĐỐI KHÔNG mở Modal tại đây để tránh tự động bật khi chưa thao tác
  useEffect(() => {
    if (!isCheckingSession && isAuthenticated && user) {
      const role = (user.role || 'CUSTOMER').toUpperCase();
      console.log('🔄 [FixGo] Phiên đăng nhập còn hiệu lực, điều hướng role:', role);
      if (role === 'WORKER') {
        router.replace('/(worker)/(tabs)');
      } else {
        router.replace('/(user)/(tabs)');
      }
    }
  }, [isCheckingSession, isAuthenticated, user]);

  // ─── Validation & Login Form Handler ────────────────────────────────────────
  const handleLogin = async () => {
    console.log('⚡ [FixGo Login] Bấm nút ĐĂNG NHẬP:', { identifier });

    setErrorMessage('');
    setIdentifierError(false);
    setPasswordError(false);

    if (!identifier.trim() && !password) {
      const msg = 'Vui lòng điền thông tin đăng nhập';
      console.warn('⚠️ [FixGo Validation]:', msg);
      setIdentifierError(true);
      setPasswordError(true);
      setErrorMessage(msg);
      return;
    }
    if (!identifier.trim()) {
      const msg = 'Vui lòng nhập Số điện thoại hoặc email';
      console.warn('⚠️ [FixGo Validation]:', msg);
      setIdentifierError(true);
      setErrorMessage(msg);
      return;
    }
    if (!password) {
      const msg = 'Vui lòng nhập Mật khẩu';
      console.warn('⚠️ [FixGo Validation]:', msg);
      setPasswordError(true);
      setErrorMessage(msg);
      return;
    }

    try {
      setIsLoading(true);

      const res = await login(identifier.trim(), password);
      console.log('🎉 [FixGo Login] Đăng nhập thành công:', res?.user);

      const userRole = (res?.user?.role || 'CUSTOMER').toUpperCase();
      if (userRole === 'WORKER') {
        console.log('🛠️ [FixGo Login] Điều hướng Thợ: /(worker)/(tabs)');
        router.replace('/(worker)/(tabs)');
      } else {
        console.log('👤 [FixGo Login] Điều hướng Khách hàng: /(user)/(tabs)');
        router.replace('/(user)/(tabs)');
      }
    } catch (error) {
      console.error('❌ [FixGo Login Error]:', error);
      const msg =
        error.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!';

      const lowerMsg = msg.toLowerCase();
      if (
        lowerMsg.includes('mật khẩu') &&
        !lowerMsg.includes('email') &&
        !lowerMsg.includes('điện thoại')
      ) {
        setPasswordError(true);
      } else if (
        (lowerMsg.includes('email') || lowerMsg.includes('điện thoại') || lowerMsg.includes('tồn tại')) &&
        !lowerMsg.includes('mật khẩu')
      ) {
        setIdentifierError(true);
      } else {
        setIdentifierError(true);
        setPasswordError(true);
      }

      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Launch Screen (Figma "Launch - 1")
  // ═══════════════════════════════════════════════════════════════════════════════
  if (isCheckingSession || !fontsLoaded) {
    return (
      <View style={styles.launchScreen}>
        <StatusBar style="light" />
        <Text style={styles.launchLogo}>FixGo</Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading Screen
  // ═══════════════════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Login Screen (Figma "Login - Customer Screen")
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView nativeID="auth-login-screen-container" style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            nativeID="auth-login-scroll"
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Logo FixGo (Figma: centered white bold) ──────────────────── */}
            <Text nativeID="auth-login-logo" style={styles.logo}>FixGo</Text>

            {/* ── Form Container ───────────────────────────────────────────── */}
            <View nativeID="auth-login-form-container" style={styles.formContainer}>
              {/* Input: Số điện thoại hoặc email */}
              <View
                style={[
                  styles.inputWrapper,
                  identifierError && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.gray}
                  style={styles.inputIcon}
                />
                <TextInput
                  nativeID="input-auth-identifier"
                  style={styles.textInput}
                  placeholder="Số điện thoại hoặc email"
                  placeholderTextColor={COLORS.gray}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (identifierError) setIdentifierError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="default"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Input: Mật khẩu */}
              <View
                style={[
                  styles.inputWrapper,
                  passwordError && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.gray}
                  style={styles.inputIcon}
                />
                <TextInput
                  nativeID="input-auth-password"
                  style={styles.textInput}
                  placeholder="Mật khẩu"
                  placeholderTextColor={COLORS.gray}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (passwordError) setPasswordError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  nativeID="btn-toggle-show-password"
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.gray}
                  />
                </TouchableOpacity>
              </View>

              {/* Link: Quên mật khẩu? (Figma: căn phải, màu xanh nhạt) */}
              <View style={styles.forgotRow}>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity nativeID="btn-forgot-password" activeOpacity={0.7} disabled={isLoading}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Nút ĐĂNG NHẬP (Figma: dark blue, full-width, rounded) */}
              <TouchableOpacity
                nativeID="btn-submit-login"
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </TouchableOpacity>

              {/* Thông báo lỗi */}
              {errorMessage ? (
                <Text nativeID="auth-login-error-message" style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {/* Phân cách: hoặc đăng nhập bằng */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc đăng nhập bằng</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login: Facebook + Google (Figma: 2 nút tròn trắng) */}
              <View nativeID="auth-login-social-row" style={styles.socialRow}>
                <TouchableOpacity
                  nativeID="btn-login-facebook"
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Facebook')}
                >
                  <FontAwesome name="facebook" size={24} color={COLORS.facebookBlue} />
                </TouchableOpacity>

                <TouchableOpacity
                  nativeID="btn-login-google"
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={handlePressGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color={COLORS.googleRed} />
                  ) : (
                    <FontAwesome name="google" size={24} color={COLORS.googleRed} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer: Đăng ký (Bấm để hiển thị Modal chọn vai trò) */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity
                  nativeID="btn-open-register-modal"
                  activeOpacity={0.7}
                  onPress={() => setShowRegisterModal(true)}
                >
                  <Text style={styles.footerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Modal Popup: Chọn vai trò Đăng ký (Khách hàng vs Thợ) ─────────── */}
      <Modal
        visible={showRegisterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <TouchableOpacity
          nativeID="modal-register-roles-backdrop"
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowRegisterModal(false)}
        >
          <TouchableOpacity
            nativeID="modal-register-roles-card"
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => {
              if (Platform.OS === 'web') {
                e?.stopPropagation?.();
              }
            }}
          >
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="person-add" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Chọn loại tài khoản</Text>
              </View>
              <TouchableOpacity
                nativeID="btn-close-register-modal"
                style={styles.modalCloseBtn}
                onPress={() => setShowRegisterModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Vui lòng chọn vai trò bạn muốn tạo tài khoản trong hệ thống FIXGO:
            </Text>

            {/* Các tùy chọn */}
            <View style={styles.modalOptions}>
              {/* Option 1: Khách hàng */}
              <TouchableOpacity
                nativeID="btn-register-role-customer"
                style={styles.modalOptionItemCustomer}
                activeOpacity={0.8}
                onPress={() => {
                  setShowRegisterModal(false);
                  router.push('/(auth)/register-customer');
                }}
              >
                <View style={styles.modalOptionIconBoxCustomer}>
                  <Ionicons name="person" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.modalOptionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.modalOptionTitleCustomer}>Khách hàng</Text>
                    <View style={styles.badgeCustomerPill}>
                      <Text style={styles.badgeCustomerPillText}>Tìm thợ</Text>
                    </View>
                  </View>
                  <Text style={styles.modalOptionSub}>
                    Dành cho cá nhân cần tìm và đặt thợ sửa chữa gia đình
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              {/* Option 2: Thợ sửa chữa */}
              <TouchableOpacity
                nativeID="btn-register-role-worker"
                style={styles.modalOptionItemWorker}
                activeOpacity={0.8}
                onPress={() => {
                  setShowRegisterModal(false);
                  router.push('/(auth)/register-worker');
                }}
              >
                <View style={styles.modalOptionIconBoxWorker}>
                  <Ionicons name="construct" size={22} color="#D97706" />
                </View>
                <View style={styles.modalOptionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.modalOptionTitleWorker}>Thợ sửa chữa</Text>
                    <View style={styles.badgeWorkerPill}>
                      <Text style={styles.badgeWorkerPillText}>Đối tác</Text>
                    </View>
                  </View>
                  <Text style={styles.modalOptionSub}>
                    Dành cho thợ lành nghề muốn nhận việc và nâng cao thu nhập
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D97706" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════════
// STYLES – Figma "FIXGO – Khoá luận tốt nghiệp"
// ═════════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  launchScreen: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchLogo: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logo: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
    marginBottom: 56,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperError: {
    borderColor: COLORS.red,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: COLORS.black,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  eyeBtn: {
    padding: 6,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.lightBlue,
  },
  loginBtn: {
    backgroundColor: COLORS.darkBlue,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.white,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 32,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.white,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalOptions: {
    gap: 14,
  },
  modalOptionItemCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    padding: 14,
  },
  modalOptionItemWorker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
  },
  modalOptionIconBoxCustomer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionIconBoxWorker: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  modalOptionTitleCustomer: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1D4ED8',
  },
  modalOptionTitleWorker: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#B45309',
  },
  badgeCustomerPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeCustomerPillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1D4ED8',
  },
  badgeWorkerPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeWorkerPillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#B45309',
  },
  modalOptionSub: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 16,
  },
  phoneModalCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  phoneModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneModalSubtitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  phoneInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 48,
    marginBottom: 10,
    overflow: 'hidden',
  },
  phoneInputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#0F172A',
  },
  phoneErrorText: {
    width: '100%',
    fontSize: 12.5,
    color: '#EF4444',
    marginBottom: 10,
    textAlign: 'left',
  },
  phoneContinueBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#0088FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  phoneContinueBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
