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
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../../src/features/auth';

// ─── Design Tokens (Figma FIXGO – Worker Login) ─────────────────────────────
const COLORS = {
  primary: '#0084FF',        // Màu xanh dương thương hiệu
  primaryDark: '#0066CC',
  darkBlue: '#1A365D',       // Nút Đăng nhập xanh đậm
  white: '#FFFFFF',
  bgGray: '#F9FAFB',         // Nền ô input
  borderGray: '#E5E7EB',     // Viền xám mặc định
  textDark: '#111827',
  textSub: '#6B7280',
  red: '#EF4444',            // Error state
  lightBlue: '#3B82F6',
  badgeWorker: '#FEF3C7',    // Màu badge Thợ (Vàng hổ phách)
  badgeWorkerText: '#92400E',
};

export default function WorkerLoginScreen() {
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
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Per-field focus & error state
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // ─── Auto-redirect nếu đã đăng nhập vai trò WORKER ─────────────────────────
  useEffect(() => {
    if (!isCheckingSession && isAuthenticated && user) {
      const role = (user.role || 'WORKER').toUpperCase();
      console.log('🔄 [FixGo Worker] Phiên đăng nhập thợ còn hiệu lực, role:', role);
      if (role === 'WORKER') {
        router.replace('/(worker)/(tabs)');
      }
    }
  }, [isCheckingSession, isAuthenticated, user]);

  // ─── Validation & Login Handler ─────────────────────────────────────────────
  const handleLogin = async () => {
    console.log('⚡ [FixGo Worker Login] Bấm nút ĐĂNG NHẬP THỢ:', { identifier });

    setErrorMessage('');
    setIdentifierError(false);
    setPasswordError(false);

    // Client-side validation
    if (!identifier.trim() && !password) {
      const msg = 'Vui lòng điền thông tin đăng nhập Thợ';
      console.warn('⚠️ [FixGo Worker Validation]:', msg);
      setIdentifierError(true);
      setPasswordError(true);
      setErrorMessage(msg);
      return;
    }
    if (!identifier.trim()) {
      const msg = 'Vui lòng nhập Số điện thoại hoặc email đối tác';
      console.warn('⚠️ [FixGo Worker Validation]:', msg);
      setIdentifierError(true);
      setErrorMessage(msg);
      return;
    }
    if (!password) {
      const msg = 'Vui lòng nhập Mật khẩu';
      console.warn('⚠️ [FixGo Worker Validation]:', msg);
      setPasswordError(true);
      setErrorMessage(msg);
      return;
    }

    try {
      setIsLoading(true);

      // Gọi API đăng nhập (/api/auth/login)
      const res = await login(identifier.trim(), password);
      console.log('🎉 [FixGo Worker Login] Đăng nhập thành công:', res?.user);

      const userRole = (res?.user?.role || 'WORKER').toUpperCase();
      if (userRole === 'WORKER') {
        console.log('🛠️ [FixGo Worker Login] Điều hướng Thợ: /(worker)/(tabs)');
        router.replace('/(worker)/(tabs)');
      } else {
        // Trường hợp tài khoản là khách hàng nhưng đăng nhập nhầm vào kênh thợ
        console.log('👤 [FixGo Worker Login] Tài khoản Khách hàng đăng nhập, chuyển sang kênh khách');
        router.replace('/(user)/(tabs)');
      }
    } catch (error) {
      console.error('❌ [FixGo Worker Login Error]:', error);
      const msg =
        error.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu Thợ!';

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

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading Session or Fonts
  // ═════════════════════════════════════════════════════════════════════════════
  if (isCheckingSession || !fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: Main Worker Login Screen (Figma Screens 63 - 67)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── Top Header Navigation ────────────────────────────────────── */}
          <View style={styles.headerNav}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
            <View style={styles.badgeContainer}>
              <MaterialCommunityIcons name="toolbox" size={14} color={COLORS.badgeWorkerText} />
              <Text style={styles.badgeText}>KÊNH ĐỐI TÁC</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header Title & Subtitle ─────────────────────────────────── */}
            <View style={styles.headerSection}>
              <Text style={styles.mainTitle}>Đăng nhập Thợ</Text>
              <Text style={styles.subTitle}>
                Chào mừng đối tác FIXGO! Hãy đăng nhập để nhận đơn và quản lý công việc sửa chữa.
              </Text>
            </View>

            {/* ── Form Container ─────────────────────────────────────────── */}
            <View style={styles.formContainer}>
              {/* Input: Số điện thoại hoặc email */}
              <Text style={styles.inputLabel}>Số điện thoại hoặc Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isIdentifierFocused && styles.inputWrapperFocused,
                  identifierError && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={identifierError ? COLORS.red : isIdentifierFocused ? COLORS.primary : COLORS.textSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập số điện thoại hoặc email đối tác"
                  placeholderTextColor={COLORS.textSub}
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (identifierError) setIdentifierError(false);
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

              {/* Input: Mật khẩu */}
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isPasswordFocused && styles.inputWrapperFocused,
                  passwordError && styles.inputWrapperError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordError ? COLORS.red : isPasswordFocused ? COLORS.primary : COLORS.textSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor={COLORS.textSub}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (passwordError) setPasswordError(false);
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
                    color={COLORS.textSub}
                  />
                </TouchableOpacity>
              </View>

              {/* Link: Quên mật khẩu? */}
              <View style={styles.forgotRow}>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity activeOpacity={0.7} disabled={isLoading}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Nút ĐĂNG NHẬP */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.loginBtnText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>

              {/* Thông báo lỗi */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.red} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Footer 1: Đăng ký Thợ mới */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản đối tác? </Text>
                <Link href="/(auth)/register-worker" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.footerLink}>Đăng ký ngay</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Phân cách chuyển sang Khách hàng */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Footer 2: Chuyển sang Đăng nhập Khách hàng */}
              <View style={styles.switchRoleBox}>
                <Text style={styles.switchRoleSub}>Bạn là khách hàng cần tìm thợ sửa chữa?</Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.switchRoleBtn} activeOpacity={0.7}>
                    <Ionicons name="person" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.switchRoleBtnText}>Chuyển sang Đăng nhập Khách hàng</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.badgeWorker,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.badgeWorkerText,
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 28,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputWrapperError: {
    borderColor: COLORS.red,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textDark,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  eyeBtn: {
    padding: 6,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.primary,
  },
  loginBtn: {
    backgroundColor: COLORS.darkBlue,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.darkBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderGray,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  switchRoleBox: {
    alignItems: 'center',
    backgroundColor: COLORS.bgGray,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginTop: 8,
  },
  switchRoleSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginBottom: 8,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  switchRoleBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.primary,
  },
});
