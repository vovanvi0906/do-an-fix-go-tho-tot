import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../src/features/auth';

// ─── Design Tokens (Figma FIXGO – Login Customer Screen) ────────────────────
const COLORS = {
  primary: '#3B82F6',        // Nền xanh dương chính
  primaryDark: '#2563EB',    // Hover / active
  darkBlue: '#1A365D',       // Nút Đăng nhập (xanh đậm – theo yêu cầu user)
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
  const {
    login,
    isLoading: isCheckingSession,
    isAuthenticated,
    user,
  } = useAuth();

  // ─── Font loading (Inter) ───────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Per-field error highlight (Figma Screen 2, 4, 5)
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Modal chọn vai trò đăng ký (Khách hàng / Thợ)
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // ─── Logging ────────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('🚀 [FixGo Mobile] Khởi chạy giao diện Đăng nhập FixGo (Figma Blue)');
  }, []);

  // ─── Auto-redirect nếu đã đăng nhập ────────────────────────────────────────
  useEffect(() => {
    if (!isCheckingSession && isAuthenticated && user) {
      const role = (user.role || 'CUSTOMER').toUpperCase();
      console.log('🔄 [FixGo] Phiên đăng nhập còn hiệu lực, role:', role);
      if (role === 'WORKER') {
        router.replace('/(worker)/(tabs)');
      } else {
        router.replace('/(user)/(tabs)');
      }
    }
  }, [isCheckingSession, isAuthenticated, user]);

  // ─── Validation & Login Handler ─────────────────────────────────────────────
  const handleLogin = async () => {
    console.log('⚡ [FixGo Login] Bấm nút ĐĂNG NHẬP:', { identifier });

    // Reset lỗi cũ
    setErrorMessage('');
    setIdentifierError(false);
    setPasswordError(false);

    // Client-side validation
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

      // Gọi API đăng nhập tới Backend NestJS (/api/auth/login)
      const res = await login(identifier.trim(), password);
      console.log('🎉 [FixGo Login] Đăng nhập thành công:', res?.user);

      // Phân quyền điều hướng theo role trả về
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

      // Xác định field nào cần highlight đỏ dựa trên nội dung lỗi
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
        // Lỗi chung (401, 403, network…) → highlight cả hai
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
  // Hiển thị khi đang kiểm tra phiên đăng nhập hoặc chờ font load
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
  // RENDER: Loading / Success Screen (Figma "Success Login")
  // Hiển thị khi đang gọi API đăng nhập
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
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Logo FixGo (Figma: centered white bold) ──────────────────── */}
            <Text style={styles.logo}>FixGo</Text>

            {/* ── Form Container ───────────────────────────────────────────── */}
            <View style={styles.formContainer}>
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
                  <TouchableOpacity activeOpacity={0.7} disabled={isLoading}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Nút ĐĂNG NHẬP (Figma: dark blue, full-width, rounded) */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </TouchableOpacity>

              {/* Thông báo lỗi (Figma: text đỏ dưới nút Đăng nhập) */}
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              {/* Phân cách: hoặc đăng nhập bằng */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc đăng nhập bằng</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login: Facebook + Google (Figma: 2 nút tròn trắng) */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Facebook')}
                >
                  <FontAwesome name="facebook" size={24} color={COLORS.facebookBlue} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Google')}
                >
                  <FontAwesome name="google" size={24} color={COLORS.googleRed} />
                </TouchableOpacity>
              </View>

              {/* Footer: Đăng ký (Bấm để hiển thị Modal chọn vai trò) */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity
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
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowRegisterModal(false)}
        >
          <TouchableOpacity
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
// STYLES – khớp Figma "FIXGO – Khoá luận tốt nghiệp"
// ═════════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ─── Launch Screen (Figma "Launch - 1 / 2") ─────────────────────────────────
  launchScreen: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchLogo: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },

  // ─── Loading / Success Screen (Figma "Success Login") ───────────────────────
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Login Screen Container ─────────────────────────────────────────────────
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

  // ─── Logo FixGo ─────────────────────────────────────────────────────────────
  logo: {
    fontSize: 42,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
    marginBottom: 56,
  },

  // ─── Form ───────────────────────────────────────────────────────────────────
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },

  // ─── Inputs (Figma: rounded white fields) ───────────────────────────────────
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

  // ─── Quên mật khẩu (Figma: căn phải, xanh nhạt) ───────────────────────────
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

  // ─── Nút Đăng nhập (Figma: full-width, dark blue, rounded) ─────────────────
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

  // ─── Error text (Figma: đỏ, centered, dưới nút) ────────────────────────────
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },

  // ─── Divider ────────────────────────────────────────────────────────────────
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

  // ─── Social Login (Figma: 2 nút tròn trắng – Facebook + Google) ────────────
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

  // ─── Footer (Figma: Chưa có tài khoản? Đăng ký ngay) ──────────────────────
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

  // ─── Modal Popup Styles (Role Selection) ───────────────────────────────────
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
});
