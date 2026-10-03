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
import { useAuth } from '../../src/features/auth';
import { otpService } from '../../src/features/auth/services/otpService';

// ─── Design Tokens (Figma FIXGO – Customer Signup) ──────────────────────────
const COLORS = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  darkBlue: '#1A365D',
  white: '#FFFFFF',
  bgGray: '#F3F4F6',
  borderGray: '#E5E7EB',
  textDark: '#111827',
  textSub: '#6B7280',
  red: '#EF4444',
  green: '#10B981',
  facebookBlue: '#1877F2',
  googleRed: '#EA4335',
};

// ─── Component: Lá Cờ Việt Nam Vector ───────────────────────────────────────
const VietnamFlag = () => (
  <View style={styles.flagBox}>
    <View style={styles.vnFlag}>
      <FontAwesome name="star" size={13} color="#FFEB3B" />
    </View>
  </View>
);

export default function RegisterCustomerScreen() {
  const router = useRouter();
  const { registerCustomer } = useAuth();

  // ─── Font loading (Inter) ───────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  /**
   * Step Flow:
   * Step 1: Nhập Số điện thoại (Gửi Phone OTP)
   * Step 2: Nhập & Xác thực OTP Số điện thoại
   * Step 3: Tạo Mật khẩu
   * Step 4: Nhập Họ, Tên & Email (Gửi Email OTP)
   * Step 5: Nhập & Xác thực OTP Email
   * Step 6: Thành công / Đang chuyển hướng
   */
  const [step, setStep] = useState(1);

  // Form State
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Phone OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const otpInputs = useRef([]);

  // Password State
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Info & Email State
  const [firstName, setFirstName] = useState('');
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [lastName, setLastName] = useState('');
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Email OTP State
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [focusedEmailOtpIndex, setFocusedEmailOtpIndex] = useState(null);
  const [emailCountdown, setEmailCountdown] = useState(60);
  const emailOtpInputs = useRef([]);

  // UI / Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  // Timer countdown cho Phone OTP (Step 2)
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Timer countdown cho Email OTP (Step 5)
  useEffect(() => {
    let timer;
    if (step === 5 && emailCountdown > 0) {
      timer = setInterval(() => setEmailCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, emailCountdown]);

  // ─── Password Validation Rules ──────────────────────────────────────────────
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasDigit;
  const isPasswordMatch = confirmPassword.length > 0 && password === confirmPassword;

  // ─── Step 1: Gửi OTP Số điện thoại ─────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    setErrorMessage('');
    setHasError(false);

    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!cleanPhone) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập số điện thoại');
      return;
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setHasError(true);
      setErrorMessage('Số điện thoại không hợp lệ (9 - 11 chữ số)');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📱 [RegisterCustomer] Gửi SMS OTP đến số:', cleanPhone);
      await otpService.sendPhoneOtp(cleanPhone);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setStep(2);
    } catch (err) {
      console.error('❌ [RegisterCustomer] Gửi Phone OTP lỗi:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Xử lý và Xác thực Phone OTP ────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    if (errorMessage) {
      setErrorMessage('');
      setHasError(false);
    }

    if (digit && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setHasError(false);
      const cleanPhone = phone.trim().replace(/\s/g, '');
      console.log('📱 [RegisterCustomer] Xác thực Phone OTP:', { phone: cleanPhone, code: fullOtp });
      await otpService.verifyPhoneOtp(cleanPhone, fullOtp, 'register');
      setStep(3);
    } catch (err) {
      console.error('❌ [RegisterCustomer] Verify Phone OTP lỗi:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (countdown > 0 || isLoading) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      setHasError(false);
      const cleanPhone = phone.trim().replace(/\s/g, '');
      await otpService.sendPhoneOtp(cleanPhone);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message || 'Gửi lại mã thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Tạo Mật Khẩu ──────────────────────────────────────────────────
  const handlePasswordSubmit = () => {
    setErrorMessage('');
    setHasError(false);

    if (!password) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }
    if (!isPasswordValid) {
      setHasError(true);
      setErrorMessage('Mật khẩu chưa đủ điều kiện bảo mật');
      return;
    }
    if (!confirmPassword) {
      setHasError(true);
      setErrorMessage('Vui lòng xác nhận lại mật khẩu');
      return;
    }
    if (password !== confirmPassword) {
      setHasError(true);
      setErrorMessage('Mật khẩu không khớp');
      return;
    }

    setStep(4);
  };

  // ─── Step 4: Nhập Họ Tên & Email -> Bắn Email OTP ──────────────────────────
  const handleSendEmailOtp = async () => {
    setErrorMessage('');
    setHasError(false);

    if (!firstName.trim()) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập Họ');
      return;
    }
    if (!lastName.trim()) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập Tên');
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập địa chỉ Email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setHasError(true);
      setErrorMessage('Địa chỉ Email không đúng định dạng');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📧 [RegisterCustomer] Gửi Email OTP tới:', cleanEmail);
      await otpService.sendEmailOtp(cleanEmail);
      setEmailCountdown(60);
      setEmailOtp(['', '', '', '', '', '']);
      setStep(5);
    } catch (err) {
      console.error('❌ [RegisterCustomer] Gửi Email OTP lỗi:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Không thể gửi mã xác nhận qua Email. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 5: Nhập & Xác thực OTP Email -> Hoàn tất tạo tài khoản ────────────
  const handleEmailOtpChange = (val, idx) => {
    const digit = val.replace(/[^0-9]/g, '');
    const newOtp = [...emailOtp];
    newOtp[idx] = digit;
    setEmailOtp(newOtp);
    if (errorMessage) {
      setErrorMessage('');
      setHasError(false);
    }

    if (digit && idx < 5) {
      emailOtpInputs.current[idx + 1]?.focus();
    }
  };

  const handleEmailOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !emailOtp[idx] && idx > 0) {
      emailOtpInputs.current[idx - 1]?.focus();
    }
  };

  const handleResendEmailOtp = async () => {
    if (emailCountdown > 0 || isLoading) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      setHasError(false);
      const cleanEmail = email.trim();
      await otpService.sendEmailOtp(cleanEmail);
      setEmailOtp(['', '', '', '', '', '']);
      setEmailCountdown(60);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message || 'Gửi lại mã thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailAndComplete = async () => {
    const fullOtp = emailOtp.join('');
    if (fullOtp.length < 6) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP Email');
      return;
    }

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim().replace(/\s/g, '');
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      setIsLoading(true);
      setErrorMessage('');
      setHasError(false);

      // 1. Xác thực OTP Email
      console.log('📧 [RegisterCustomer] Xác thực Email OTP:', { email: cleanEmail, code: fullOtp });
      await otpService.verifyEmailOtp(cleanEmail, fullOtp);

      // 2. Chuyển sang Step 6 (Đang tạo tài khoản)
      setStep(6);

      // 3. Đăng ký tài khoản vào cơ sở dữ liệu
      console.log('🚀 [FixGo Register Customer] Tạo tài khoản:', {
        fullName,
        email: cleanEmail,
        phone: cleanPhone,
      });

      await registerCustomer({
        fullName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });

      console.log('🎉 [FixGo Register Customer] Đăng ký thành công!');
      router.replace('/(user)/(tabs)');
    } catch (err) {
      console.error('❌ [FixGo Register Customer Error]:', err);
      setIsLoading(false);
      setStep(5);
      setHasError(true);
      setErrorMessage(err.message || 'Xác thực hoặc tạo tài khoản thất bại. Vui lòng thử lại!');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading / Success Signup Screen (Figma "Success Signup")
  // ═════════════════════════════════════════════════════════════════════════════
  if (step === 6) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang thiết lập tài khoản của bạn...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
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
            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI (Figma Screen 83 / 69 / 70)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập số điện thoại</Text>
                <Text style={styles.headerSubtitle}>
                  Mã OTP 6 số sẽ được gửi qua SMS để xác thực số điện thoại của bạn.
                </Text>

                <View style={styles.phoneInputRow}>
                  <VietnamFlag />
                  <View
                    style={[
                      styles.phoneInputWrapper,
                      isPhoneFocused && styles.inputWrapperFocused,
                      hasError && styles.inputWrapperError,
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
                        if (hasError) setHasError(false);
                        if (errorMessage) setErrorMessage('');
                      }}
                      onFocus={() => setIsPhoneFocused(true)}
                      onBlur={() => setIsPhoneFocused(false)}
                      keyboardType="phone-pad"
                      autoFocus
                    />
                  </View>
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                  onPress={handlePhoneSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Tiếp tục</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>hoặc</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.socialFullBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Facebook')}
                >
                  <FontAwesome
                    name="facebook"
                    size={20}
                    color={COLORS.facebookBlue}
                    style={styles.socialIcon}
                  />
                  <Text style={styles.socialFullText}>
                    Đăng nhập bằng Facebook
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialFullBtn}
                  activeOpacity={0.8}
                  onPress={() => console.log('Login Google')}
                >
                  <FontAwesome
                    name="google"
                    size={20}
                    color={COLORS.googleRed}
                    style={styles.socialIcon}
                  />
                  <Text style={styles.socialFullText}>
                    Đăng nhập bằng Google
                  </Text>
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Đã có tài khoản? </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity activeOpacity={0.7}>
                      <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 2: NHẬP MÃ OTP SĐT 6 CHỮ SỐ (Figma Screen 72 / 45)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập mã gồm 6 chữ số được gửi đến</Text>
                <Text style={styles.headerSubtitle}>
                  {phone ? `+84 ${phone.trim().slice(0, 2)}*****${phone.trim().slice(-4)}` : '+84'}
                </Text>

                <View style={styles.otpContainer}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => (otpInputs.current[idx] = ref)}
                      style={[
                        styles.otpBox,
                        focusedOtpIndex === idx && styles.otpBoxFocused,
                        digit ? styles.otpBoxFilled : null,
                        hasError && styles.otpBoxError,
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

                {hasError && errorMessage ? (
                  <View style={styles.errorOtpRow}>
                    <Ionicons name="close-circle" size={16} color={COLORS.red} />
                    <Text style={styles.errorOtpText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.resendBtn,
                    countdown > 0 ? styles.resendBtnDisabled : styles.resendBtnActive,
                  ]}
                  disabled={countdown > 0 || isLoading}
                  activeOpacity={0.8}
                  onPress={handleResendPhoneOtp}
                >
                  <Text
                    style={[
                      styles.resendBtnText,
                      countdown > 0 ? styles.resendBtnTextDisabled : styles.resendBtnTextActive,
                    ]}
                  >
                    {countdown > 0 ? `Gửi lại mã: ${countdown}s` : 'Gửi lại mã'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.backCircleBtn}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      otp.join('').length === 6 && !isLoading
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handleOtpSubmit}
                    disabled={otp.join('').length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextBtnText}>Tiếp</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 3: TẠO MẬT KHẨU (Figma Screen 73 - 78)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Tạo mật khẩu</Text>
                <Text style={styles.headerSubtitle}>
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất một chữ cái và một chữ số
                </Text>

                <View
                  style={[
                    styles.inputWrapperWhite,
                    isPasswordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={COLORS.textSub}
                    value={password}
                    onChangeText={setPassword}
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
                <View style={styles.checklistContainer}>
                  <View style={styles.checklistItem}>
                    <Ionicons
                      name={hasMinLength ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={hasMinLength ? COLORS.green : COLORS.red}
                    />
                    <Text
                      style={[
                        styles.checklistText,
                        hasMinLength && styles.checklistTextValid,
                      ]}
                    >
                      Có ít nhất 8 ký tự
                    </Text>
                  </View>

                  <View style={styles.checklistItem}>
                    <Ionicons
                      name={hasLetter ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={hasLetter ? COLORS.green : COLORS.red}
                    />
                    <Text
                      style={[
                        styles.checklistText,
                        hasLetter && styles.checklistTextValid,
                      ]}
                    >
                      Có một chữ cái
                    </Text>
                  </View>

                  <View style={styles.checklistItem}>
                    <Ionicons
                      name={hasDigit ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={hasDigit ? COLORS.green : COLORS.red}
                    />
                    <Text
                      style={[
                        styles.checklistText,
                        hasDigit && styles.checklistTextValid,
                      ]}
                    >
                      Có một chữ số
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.inputWrapperWhite,
                    isConfirmPasswordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Xác nhận lại mật khẩu"
                    placeholderTextColor={COLORS.textSub}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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
                      {isPasswordMatch ? 'Mật khẩu chính xác' : 'Mật khẩu không khớp'}
                    </Text>
                  </View>
                )}

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.backCircleBtn}
                    onPress={() => setStep(2)}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      isPasswordValid && isPasswordMatch
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handlePasswordSubmit}
                    disabled={!isPasswordValid || !isPasswordMatch}
                  >
                    <Text style={styles.nextBtnText}>Tiếp</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 4: NHẬP HỌ TÊN VÀ EMAIL (Xác thực Email OTP)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập họ tên và email</Text>
                <Text style={styles.headerSubtitle}>
                  Mã OTP sẽ được gửi tới Email để xác thực quyền sở hữu trước khi hoàn tất đăng ký.
                </Text>

                <View style={styles.nameRow}>
                  <View
                    style={[
                      styles.nameInputWrapper,
                      { marginRight: 8 },
                      isFirstNameFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="Họ"
                      placeholderTextColor={COLORS.textSub}
                      value={firstName}
                      onChangeText={(val) => {
                        setFirstName(val);
                        if (errorMessage) setErrorMessage('');
                      }}
                      onFocus={() => setIsFirstNameFocused(true)}
                      onBlur={() => setIsFirstNameFocused(false)}
                      autoFocus
                    />
                  </View>
                  <View
                    style={[
                      styles.nameInputWrapper,
                      { marginLeft: 8 },
                      isLastNameFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.textInput}
                      placeholder="Tên"
                      placeholderTextColor={COLORS.textSub}
                      value={lastName}
                      onChangeText={(val) => {
                        setLastName(val);
                        if (errorMessage) setErrorMessage('');
                      }}
                      onFocus={() => setIsLastNameFocused(true)}
                      onBlur={() => setIsLastNameFocused(false)}
                    />
                  </View>
                </View>

                {/* Input Email */}
                <View
                  style={[
                    styles.inputWrapperWhite,
                    { marginTop: 12 },
                    isEmailFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email (vd: example@gmail.com)"
                    placeholderTextColor={COLORS.textSub}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.backCircleBtn}
                    onPress={() => setStep(3)}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      firstName.trim() && lastName.trim() && email.trim() && !isLoading
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handleSendEmailOtp}
                    disabled={!firstName.trim() || !lastName.trim() || !email.trim() || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextBtnText}>Gửi mã Email</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 5: NHẬP MÃ OTP EMAIL & HOÀN TẤT ĐĂNG KÝ
               ══════════════════════════════════════════════════════════════════ */}
            {step === 5 && (
              <View style={styles.stepContainer}>
                <View style={styles.emailIconBox}>
                  <Ionicons name="mail-outline" size={32} color={COLORS.primary} />
                </View>

                <Text style={styles.headerTitle}>Xác thực Email của bạn</Text>
                <Text style={styles.headerSubtitle}>
                  Vui lòng nhập mã OTP 6 số đã được gửi đến email{'\n'}
                  <Text style={styles.emailHighlight}>{email.trim()}</Text>
                </Text>

                <View style={styles.otpContainer}>
                  {emailOtp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => (emailOtpInputs.current[idx] = ref)}
                      style={[
                        styles.otpBox,
                        focusedEmailOtpIndex === idx && styles.otpBoxFocused,
                        digit ? styles.otpBoxFilled : null,
                        hasError && styles.otpBoxError,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleEmailOtpChange(val, idx)}
                      onKeyPress={(e) => handleEmailOtpKeyPress(e, idx)}
                      onFocus={() => setFocusedEmailOtpIndex(idx)}
                      onBlur={() => setFocusedEmailOtpIndex(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={idx === 0}
                    />
                  ))}
                </View>

                {hasError && errorMessage ? (
                  <View style={styles.errorOtpRow}>
                    <Ionicons name="close-circle" size={16} color={COLORS.red} />
                    <Text style={styles.errorOtpText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.resendBtn,
                    emailCountdown > 0 ? styles.resendBtnDisabled : styles.resendBtnActive,
                  ]}
                  disabled={emailCountdown > 0 || isLoading}
                  activeOpacity={0.8}
                  onPress={handleResendEmailOtp}
                >
                  <Text
                    style={[
                      styles.resendBtnText,
                      emailCountdown > 0 ? styles.resendBtnTextDisabled : styles.resendBtnTextActive,
                    ]}
                  >
                    {emailCountdown > 0 ? `Gửi lại mã: ${emailCountdown}s` : 'Gửi lại mã'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.backCircleBtn}
                    onPress={() => setStep(4)}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      emailOtp.join('').length === 6 && !isLoading
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handleVerifyEmailAndComplete}
                    disabled={emailOtp.join('').length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextBtnText}>Hoàn tất</Text>
                        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES – Chuẩn xác Figma FIXGO Signup Customer
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSub,
    textAlign: 'center',
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  emailIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginBottom: 24,
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textDark,
  },

  // ─── Phone Input Row (Step 1) ───────────────────────────────────────────────
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  flagBox: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  vnFlag: {
    width: 28,
    height: 19,
    backgroundColor: '#DA251D',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
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
  prefixText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textDark,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  // ─── Primary Button ────────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
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
    backgroundColor: COLORS.borderGray,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },

  // ─── Social Full Width Buttons ──────────────────────────────────────────────
  socialFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialFullText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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

  // ─── OTP Styles ─────────────────────────────────────────────────────────────
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  otpBox: {
    width: 48,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    borderWidth: 1.5,
    borderColor: 'transparent',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    ...(Platform.OS === 'web'
      ? {
        outlineStyle: 'none',
        textAlign: 'center',
        lineHeight: '50px',
      }
      : {}),
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  otpBoxError: {
    borderColor: COLORS.red,
    backgroundColor: '#FEF2F2',
  },
  errorOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorOtpText: {
    color: COLORS.red,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  resendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 32,
  },
  resendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  resendBtnActive: {
    backgroundColor: COLORS.primary,
  },
  resendBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  resendBtnTextDisabled: {
    color: '#6B7280',
  },
  resendBtnTextActive: {
    color: COLORS.white,
  },

  // ─── Input Wrapper Standard ─────────────────────────────────────────────────
  inputWrapperWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
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

  // ─── Password Checklist ─────────────────────────────────────────────────────
  checklistContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  checklistTextValid: {
    color: COLORS.green,
    fontFamily: 'Inter_500Medium',
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  matchStatusText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  // ─── Name Step Row (Step 4) ─────────────────────────────────────────────────
  nameRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  nameInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
  },

  // ─── Navigation Row (Back & Next) ───────────────────────────────────────────
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backCircleBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.bgGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    height: 46,
    borderRadius: 23,
    gap: 6,
  },
  nextBtnActive: {
    backgroundColor: COLORS.primary,
  },
  nextBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
