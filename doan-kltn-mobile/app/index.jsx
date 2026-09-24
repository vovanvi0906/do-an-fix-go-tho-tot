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
  ImageBackground,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/features/auth';

export default function FixGoLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active border highlight state
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Modal chọn vai trò đăng ký (Khách hàng / Thợ)
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    console.log('🚀 [FixGo Mobile] Khởi chạy giao diện Đăng nhập FixGo (Aurora Luxury Dark)');
  }, []);

  // Xử lý gửi form đăng nhập
  const handleLogin = async () => {
    console.log('⚡ [FixGo Login] Bấm nút ĐĂNG NHẬP:', { identifier });
    setErrorMessage('');

    if (!identifier.trim()) {
      const msg = 'Vui lòng nhập Email, Số điện thoại hoặc Tên đăng nhập';
      console.warn('⚠️ [FixGo Validation]:', msg);
      setErrorMessage(msg);
      return;
    }
    if (!password) {
      const msg = 'Vui lòng nhập Mật khẩu';
      console.warn('⚠️ [FixGo Validation]:', msg);
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
      setErrorMessage(error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/bgmobi1.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.mainWrapper}>
            {/* 1. Header Thương hiệu FixGo (Logo + Slogan) */}
            <View style={styles.brandHeader}>
              {/* Logo FG cách điệu mạ vàng ánh kim */}
              <View style={styles.logoOuter}>
                <View style={styles.logoInner}>
                  <Text style={styles.logoTextFg}>FG</Text>
                </View>
              </View>

              <Text style={styles.brandTitle}>FixGo</Text>
              <Text style={styles.brandSlogan}>KẾT NỐI DỊCH VỤ – NÂNG TẦM CUỘC SỐNG</Text>
              <Text style={styles.brandWelcome}>Chào mừng bạn đến với FixGo</Text>
            </View>

            {/* 2. Glassmorphism Card Form Đăng Nhập */}
            <View style={styles.glassCard}>
              <Text style={styles.cardHeading}>Đăng Nhập</Text>

              {/* Thông báo lỗi nếu có */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#F87171" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                {/* Field: Email / SĐT / Tên đăng nhập */}
                <View
                  style={isIdentifierFocused ? styles.inputWrapperFocused : styles.inputWrapper}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={isIdentifierFocused ? '#38BDF8' : '#94A3B8'}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email hoặc Tên đăng nhập"
                    placeholderTextColor="#64748B"
                    value={identifier}
                    onChangeText={(val) => {
                      setIdentifier(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setIsIdentifierFocused(true)}
                    onBlur={() => setIsIdentifierFocused(false)}
                    autoCapitalize="none"
                    keyboardType="default"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                {/* Field: Mật khẩu */}
                <View
                  style={isPasswordFocused ? styles.inputWrapperFocused : styles.inputWrapper}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isPasswordFocused ? '#38BDF8' : '#94A3B8'}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mật khẩu"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
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
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                {/* Quên mật khẩu? (Căn phải theo đúng thiết kế web) */}
                <View style={styles.forgotRow}>
                  <Link href="/(auth)/forgot-password" asChild>
                    <TouchableOpacity activeOpacity={0.7} disabled={isLoading}>
                      <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                {/* Nút ĐĂNG NHẬP (Deep Blue với viền tím phát sáng như ảnh) */}
                <TouchableOpacity
                  style={isLoading ? styles.loginBtnDisabled : styles.loginBtn}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Phân cách: Hoặc đăng nhập nhanh bằng */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Hoặc đăng nhập nhanh bằng</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 3 Nút mạng xã hội tròn (Google, Facebook, Apple) */}
              <View style={styles.socialRow}>
                {/* Google */}
                <TouchableOpacity
                  style={styles.socialCircleBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Google')}
                >
                  <FontAwesome name="google" size={20} color="#EA4335" />
                </TouchableOpacity>

                {/* Facebook */}
                <TouchableOpacity
                  style={styles.socialCircleBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Facebook')}
                >
                  <FontAwesome name="facebook" size={20} color="#1877F2" />
                </TouchableOpacity>

                {/* Apple */}
                <TouchableOpacity
                  style={styles.socialCircleBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Apple')}
                >
                  <FontAwesome name="apple" size={22} color="#000000" />
                </TouchableOpacity>
              </View>

              {/* Footer: Chưa có tài khoản? Đăng ký ngay (Màu cam vàng Gold) */}
              <View style={styles.footerRow}>
                <Text style={styles.footerNormalText}>Chưa có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() => setShowRegisterModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerGoldLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Footer pháp lý bên dưới */}
            <View style={styles.legalFooterRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#64748B" style={styles.shieldIcon} />
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.legalText}>Điều khoản dịch vụ</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>|</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.legalText}>Chính sách bảo mật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal lựa chọn Đăng ký Khách hàng hoặc Thợ */}
      <Modal
        visible={showRegisterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lựa Chọn Đăng Ký</Text>
              <TouchableOpacity
                onPress={() => setShowRegisterModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Bạn muốn tạo tài khoản với vai trò nào trong FixGo?
            </Text>

            <View style={styles.modalOptions}>
              {/* Đăng ký Khách hàng */}
              <TouchableOpacity
                style={styles.modalOptionItemCustomer}
                activeOpacity={0.8}
                onPress={() => {
                  setShowRegisterModal(false);
                  router.push('/(auth)/register-customer');
                }}
              >
                <View style={styles.modalOptionIconBoxCustomer}>
                  <Ionicons name="person" size={22} color="#F59E0B" />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitleCustomer}>Đăng ký làm Khách hàng</Text>
                  <Text style={styles.modalOptionSub}>Đặt dịch vụ sửa chữa, bảo trì nhà cửa</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Đăng ký Thợ */}
              <TouchableOpacity
                style={styles.modalOptionItemWorker}
                activeOpacity={0.8}
                onPress={() => {
                  setShowRegisterModal(false);
                  router.push('/(auth)/register-worker');
                }}
              >
                <View style={styles.modalOptionIconBoxWorker}>
                  <Ionicons name="construct" size={22} color="#60A5FA" />
                </View>
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionTitleWorker}>Đăng ký làm Thợ / Đối tác FixGo</Text>
                  <Text style={styles.modalOptionSub}>Nhận việc, quản lý lịch làm & gia tăng thu nhập</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  </ImageBackground>
);
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 26, 0.72)', // Lớp nền tối mờ giúp tôn ảnh nền nhưng vẫn đảm bảo đọc chữ rõ ràng
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },

  // 1. Header FixGo
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoOuter: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoInner: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextFg: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F3F4F6',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandSlogan: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37', // Vàng ánh kim Gold
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  brandWelcome: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // 2. Glass Card
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 18,
  },

  // Error Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '500',
    lineHeight: 16,
  },

  // Form & Inputs
  form: {
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  inputWrapperFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  eyeBtn: {
    padding: 6,
  },

  // Quên mật khẩu
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: -2,
  },
  forgotText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Button ĐĂNG NHẬP
  loginBtn: {
    backgroundColor: '#1E2968',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1', // Viền tím neon phát sáng như web
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  loginBtnDisabled: {
    backgroundColor: '#172554',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4338CA',
    marginBottom: 16,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Social Buttons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNormalText: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  footerGoldLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F59E0B', // Màu cam vàng Gold ấm áp chuẩn ảnh web
  },

  // Legal Footer
  legalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    marginRight: 6,
  },
  legalText: {
    fontSize: 11,
    color: '#64748B',
  },
  legalDivider: {
    marginHorizontal: 8,
    color: '#475569',
    fontSize: 11,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalOptions: {
    gap: 12,
  },
  modalOptionItemCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 16,
    padding: 14,
  },
  modalOptionItemWorker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 16,
    padding: 14,
  },
  modalOptionIconBoxCustomer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionIconBoxWorker: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitleCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  modalOptionTitleWorker: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
  },
  modalOptionSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
