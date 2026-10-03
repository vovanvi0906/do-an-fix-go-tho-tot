import React, { useState, useRef, useEffect } from 'react';
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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { otpService } from '../../src/features/auth/services/otpService';
import { authService } from '../../src/features/auth/services/authService';

const COLORS = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  white: '#FFFFFF',
  bgGray: '#F3F4F6',
  borderGray: '#E5E7EB',
  borderFocus: '#0084FF',
  textDark: '#111827',
  textSub: '#6B7280',
  red: '#EF4444',
  green: '#10B981',
};

// ─── Component: Cờ Việt Nam Vector ──────────────────────────────────────────
const VietnamFlag = () => (
  <View style={styles.flagBox}>
    <View style={styles.vnFlag}>
      <FontAwesome name="star" size={12} color="#FFEB3B" />
    </View>
  </View>
);

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Step 1: Phone -> Step 2: OTP -> Step 3: New Password -> Step 4: Success
  const [step, setStep] = useState(1);

  // Form State
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
  const [resetToken, setResetToken] = useState('');
  const [countdown, setCountdown] = useState(60);
  const otpInputs = useRef([]);

  // New Password State
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Countdown timer cho OTP
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Validation rules cho mật khẩu
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasDigit;
  const isPasswordMatch = confirmPassword.length > 0 && password === confirmPassword;

  // ─── Step 1: Gửi OTP tới số điện thoại ────────────────────────────────────
  const handleSendPhoneOtp = async () => {
    setErrorMessage('');
    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!cleanPhone) {
      setErrorMessage('Vui lòng nhập số điện thoại');
      return;
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setErrorMessage('Số điện thoại không hợp lệ (9 - 11 chữ số)');
      return;
    }

    try {
      setIsLoading(true);
      await otpService.sendPhoneOtp(cleanPhone);
      setCountdown(60);
      setStep(2);
    } catch (err) {
      console.error('❌ [ForgotPassword] Gửi OTP lỗi:', err);
      setErrorMessage(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Xử lý nhập và xác thực OTP ────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    if (digit && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const cleanPhone = phone.trim().replace(/\s/g, '');
      const response = await otpService.verifyPhoneOtp(cleanPhone, fullOtp, 'reset-password');

      if (response?.resetToken) {
        setResetToken(response.resetToken);
        setStep(3);
      } else {
        setErrorMessage('Xác thực thất bại. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error('❌ [ForgotPassword] Verify OTP lỗi:', err);
      setErrorMessage(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const cleanPhone = phone.trim().replace(/\s/g, '');
      await otpService.sendPhoneOtp(cleanPhone);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
    } catch (err) {
      setErrorMessage(err.message || 'Gửi lại mã thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Đặt lại mật khẩu mới ──────────────────────────────────────────
  const handleResetPassword = async () => {
    setErrorMessage('');
    if (!isPasswordValid) {
      setErrorMessage('Mật khẩu chưa đáp ứng yêu cầu bảo mật');
      return;
    }
    if (!isPasswordMatch) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword(resetToken, password);
      setStep(4); // Chuyển sang màn hình thành công
    } catch (err) {
      console.error('❌ [ForgotPassword] Reset password lỗi:', err);
      setErrorMessage(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════════════════════════════════════════════════════════════
              BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI
             ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={32} color={COLORS.primary} />
              </View>

              <Text style={styles.headerTitle}>Quên mật khẩu?</Text>
              <Text style={styles.headerSubtitle}>
                Nhập số điện thoại đã đăng ký tài khoản để nhận mã OTP khôi phục mật khẩu.
              </Text>

              <View style={styles.phoneInputRow}>
                <VietnamFlag />
                <View
                  style={[
                    styles.phoneInputWrapper,
                    isPhoneFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Text style={styles.prefixText}>+84</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Số điện thoại"
                    placeholderTextColor={COLORS.textSub}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    keyboardType="phone-pad"
                    autoFocus
                  />
                </View>
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                onPress={handleSendPhoneOtp}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Gửi mã OTP</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Nhớ mật khẩu rồi? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.footerLink}>Đăng nhập</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ
             ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark-outline" size={32} color={COLORS.primary} />
              </View>

              <Text style={styles.headerTitle}>Nhập mã xác thực</Text>
              <Text style={styles.headerSubtitle}>
                Mã gồm 6 chữ số đã được gửi đến số{'\n'}
                <Text style={styles.phoneHighlight}>+84 {phone.trim()}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => (otpInputs.current[idx] = ref)}
                    style={[
                      styles.otpBox,
                      focusedOtpIndex === idx && styles.otpBoxFocused,
                      digit ? styles.otpBoxFilled : null,
                      errorMessage ? styles.otpBoxError : null,
                    ]}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    onFocus={() => setFocusedOtpIndex(idx)}
                    onBlur={() => setFocusedOtpIndex(null)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={idx === 0}
                  />
                ))}
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              {/* Nút gửi lại OTP */}
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Gửi lại mã sau <Text style={styles.countdownNumber}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={isLoading}
                    style={styles.resendBtn}
                  >
                    <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.resendBtnText}>Gửi lại mã</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (otp.join('').length !== 6 || isLoading) && styles.btnDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.join('').length !== 6 || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Xác thực OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.textSub} />
                <Text style={styles.backBtnText}>Đổi số điện thoại khác</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BƯỚC 3: NHẬP MẬT KHẨU MỚI
             ══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={32} color={COLORS.primary} />
              </View>

              <Text style={styles.headerTitle}>Đặt lại mật khẩu</Text>
              <Text style={styles.headerSubtitle}>
                Tạo mật khẩu mới cho tài khoản của bạn.
              </Text>

              {/* Mật khẩu mới */}
              <View
                style={[
                  styles.inputWrapper,
                  isPasswordFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Mật khẩu mới"
                  placeholderTextColor={COLORS.textSub}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.textSub}
                  />
                </TouchableOpacity>
              </View>

              {/* Checklist */}
              <View style={styles.checklist}>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasMinLength ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={hasMinLength ? COLORS.green : COLORS.red}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      hasMinLength && styles.checkTextSuccess,
                    ]}
                  >
                    Tối thiểu 8 ký tự
                  </Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasLetter ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={hasLetter ? COLORS.green : COLORS.red}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      hasLetter && styles.checkTextSuccess,
                    ]}
                  >
                    Ít nhất một chữ cái
                  </Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasDigit ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={hasDigit ? COLORS.green : COLORS.red}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      hasDigit && styles.checkTextSuccess,
                    ]}
                  >
                    Ít nhất một chữ số
                  </Text>
                </View>
              </View>

              {/* Xác nhận mật khẩu mới */}
              <View
                style={[
                  styles.inputWrapper,
                  isConfirmPasswordFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Xác nhận mật khẩu mới"
                  placeholderTextColor={COLORS.textSub}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setIsConfirmPasswordFocused(true)}
                  onBlur={() => setIsConfirmPasswordFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.textSub}
                  />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && (
                <View style={styles.matchStatusRow}>
                  <Ionicons
                    name={isPasswordMatch ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={isPasswordMatch ? COLORS.green : COLORS.red}
                  />
                  <Text
                    style={[
                      styles.matchStatusText,
                      { color: isPasswordMatch ? COLORS.green : COLORS.red },
                    ]}
                  >
                    {isPasswordMatch ? 'Mật khẩu trùng khớp' : 'Mật khẩu chưa khớp'}
                  </Text>
                </View>
              )}

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!isPasswordValid || !isPasswordMatch || isLoading) && styles.btnDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={!isPasswordValid || !isPasswordMatch || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Lưu mật khẩu mới</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BƯỚC 4: THÀNH CÔNG
             ══════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <View style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle" size={48} color={COLORS.green} />
              </View>

              <Text style={styles.headerTitle}>Đặt lại mật khẩu thành công!</Text>
              <Text style={styles.headerSubtitle}>
                Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập với mật khẩu mới.
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  phoneHighlight: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textDark,
  },

  // Phone input row
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flagBox: {
    width: 38,
    height: 52,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vnFlag: {
    width: 32,
    height: 22,
    backgroundColor: '#DA251D',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    height: 52,
    paddingHorizontal: 14,
  },
  prefixText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textDark,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
  },

  // Generic input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
  },
  eyeBtn: {
    padding: 8,
  },

  // OTP Row
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    borderRadius: 10,
    backgroundColor: COLORS.bgGray,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
  },
  otpBoxFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.white,
  },
  otpBoxFilled: {
    borderColor: COLORS.green,
    backgroundColor: '#ECFDF5',
  },
  otpBoxError: {
    borderColor: COLORS.red,
    backgroundColor: '#FEF2F2',
  },

  // Resend OTP
  resendRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  countdownNumber: {
    fontFamily: 'Inter_700Bold',
    color: COLORS.primary,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
  },

  // Checklist
  checklist: {
    marginBottom: 14,
    paddingLeft: 4,
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.red,
  },
  checkTextSuccess: {
    color: COLORS.green,
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    paddingLeft: 4,
  },
  matchStatusText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  // Button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.white,
  },

  // Footer / Back
  errorText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.primary,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSub,
  },
});
