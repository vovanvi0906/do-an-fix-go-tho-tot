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

// ─── Design Tokens (Figma FIXGO – Customer Signup) ──────────────────────────
const COLORS = {
  primary: '#0084FF',        // Màu xanh dương nút hành động & viền focus Figma
  primaryDark: '#0066CC',
  darkBlue: '#1A365D',
  white: '#FFFFFF',
  bgGray: '#F3F4F6',         // Màu nền ô input mặc định
  borderGray: '#E5E7EB',     // Viền xám mặc định
  textDark: '#111827',
  textSub: '#6B7280',
  red: '#EF4444',            // Error state
  green: '#10B981',          // Success state
  facebookBlue: '#1877F2',
  googleRed: '#EA4335',
};

// ─── Component: Lá Cờ Việt Nam (Vẽ vector chuẩn xác, không bị lỗi text "VN") ───
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

  // ─── Step Management (1: Phone, 2: OTP, 3: Password, 4: Name/Email, 5: Success)
  const [step, setStep] = useState(1);

  // Form State
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);

  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState(''); // Họ
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [lastName, setLastName] = useState('');   // Tên
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // UI / Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const otpInputs = useRef([]);

  // Timer countdown cho OTP
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // ─── Password Validation Rules ──────────────────────────────────────────────
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasDigit;
  const isPasswordMatch = confirmPassword.length > 0 && password === confirmPassword;

  // ─── Step 1: Handle Phone Submit ────────────────────────────────────────────
  const handlePhoneSubmit = () => {
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

    setCountdown(60);
    setStep(2);
  };

  // ─── Step 2: Handle OTP Change & Submit ─────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (errorMessage) {
      setErrorMessage('');
      setHasError(false);
    }

    // Auto-focus ô tiếp theo
    if (val && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleOtpSubmit = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setHasError(true);
      setErrorMessage('Mã không hợp lệ');
      return;
    }
    setErrorMessage('');
    setHasError(false);
    setStep(3);
  };

  // ─── Step 3: Handle Password Submit ─────────────────────────────────────────
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

  // ─── Step 4: Handle Name/Email & Complete Registration ───────────────────────
  const handleFinalSubmit = async () => {
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

    // Nếu chưa có email, tạo email tạm từ số điện thoại hoặc yêu cầu nhập
    const userEmail = email.trim() || `${phone.trim()}@fixgo.customer.vn`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      setIsLoading(true);
      setStep(5); // Show loading spinner (Figma Success Signup)

      console.log('🚀 [FixGo Register Customer] Gửi đăng ký:', {
        fullName,
        email: userEmail,
        phone: phone.trim(),
      });

      // Gọi API đăng ký khách hàng
      await registerCustomer({
        fullName,
        email: userEmail,
        phone: phone.trim(),
        password,
      });

      console.log('🎉 [FixGo Register Customer] Hoàn tất đăng ký & điều hướng');
      router.replace('/(user)/(tabs)');
    } catch (error) {
      console.error('❌ [FixGo Register Customer Error]:', error);
      setIsLoading(false);
      setStep(4); // Quay lại bước 4 để sửa
      setHasError(true);
      setErrorMessage(error.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: Loading / Success Signup Screen (Figma "Success Signup")
  // ═════════════════════════════════════════════════════════════════════════════
  if (step === 5 || isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
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

                {/* Input Row: Cờ VN + Khung nhập số điện thoại bao bọc toàn bộ */}
                <View style={styles.phoneInputRow}>
                  {/* Khung cờ Việt Nam (vẽ chuẩn cờ đỏ sao vàng) */}
                  <VietnamFlag />

                  {/* Khung nhập số điện thoại: Đường viền xanh dương bao bọc toàn bộ khi focus */}
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

                {/* Nút Tiếp tục (Figma: solid blue) */}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handlePhoneSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Tiếp tục</Text>
                </TouchableOpacity>

                {/* Thông báo lỗi (Figma: text đỏ dưới nút) */}
                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                {/* Divider: hoặc */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>hoặc</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Nút Social: Facebook & Google (Figma: Rounded full width) */}
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
                  <Text
                    style={styles.socialFullText}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
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
                  <Text
                    style={styles.socialFullText}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    Đăng nhập bằng Google
                  </Text>
                </TouchableOpacity>

                {/* Footer: Đã có tài khoản? Đăng nhập ngay */}
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
                BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ (Figma Screen 72 / 45)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập mã gồm 6 chữ số được gửi đến</Text>
                <Text style={styles.headerSubtitle}>
                  {phone ? `+84 ${phone.trim().slice(0, 2)}*****${phone.trim().slice(-4)}` : '+84'}
                </Text>

                {/* 6 Ô nhập OTP */}
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

                {/* Thông báo lỗi OTP */}
                {hasError && errorMessage ? (
                  <View style={styles.errorOtpRow}>
                    <Ionicons name="close-circle" size={16} color={COLORS.red} />
                    <Text style={styles.errorOtpText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Nút Gửi lại mã: mờ xám khi có thời gian đếm ngược, sáng xanh khi hết giờ */}
                <TouchableOpacity
                  style={[
                    styles.resendBtn,
                    countdown > 0 ? styles.resendBtnDisabled : styles.resendBtnActive,
                  ]}
                  disabled={countdown > 0}
                  activeOpacity={0.8}
                  onPress={() => setCountdown(60)}
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

                {/* Navigation Row: Back (<-) & Next (Tiếp ->) */}
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
                      otp.join('').length === 6 ? styles.nextBtnActive : styles.nextBtnDisabled,
                    ]}
                    onPress={handleOtpSubmit}
                    disabled={otp.join('').length !== 6}
                  >
                    <Text style={styles.nextBtnText}>Tiếp</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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

                {/* Input: Nhập mật khẩu */}
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

                {/* Checklist điều kiện mật khẩu (Figma) */}
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

                {/* Input: Xác nhận lại mật khẩu */}
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

                {/* Trạng thái xác nhận mật khẩu (Figma: Mật khẩu chính xác / không khớp) */}
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

                {/* Navigation Row: Back (<-) & Next (Tiếp ->) */}
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
                BƯỚC 4: NHẬP HỌ VÀ TÊN (Figma Screen 79 - 81)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập họ tên và gmail</Text>
                <Text style={styles.headerSubtitle}>Cho chúng tôi biết cách gọi bạn và gửi thông tin xác nhận đơn hàng nhé</Text>

                {/* 2 Ô nhập Họ và Tên nằm ngang (Figma) */}
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

                {/* Ô nhập Email tùy chọn / cần thiết cho API Backend */}
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
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                {/* Navigation Row: Back (<-) & Hoàn tất (Tiếp ->) */}
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
                      firstName.trim() && lastName.trim()
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handleFinalSubmit}
                    disabled={!firstName.trim() || !lastName.trim()}
                  >
                    <Text style={styles.nextBtnText}>Hoàn tất</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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
    marginBottom: 28,
    lineHeight: 20,
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

  // ─── Primary Button (Tiếp tục) ──────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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

  // ─── Social Full Width Buttons (Figma) ──────────────────────────────────────
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
    includeFontPadding: false,
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

  // ─── OTP Styles (Step 2) ────────────────────────────────────────────────────
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
    marginBottom: 40,
  },
  resendBtnDisabled: {
    backgroundColor: '#D1D5DB', // Mờ xám giống Figma
  },
  resendBtnActive: {
    backgroundColor: COLORS.primary, // Xanh sáng có thể bấm
  },
  resendBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  resendBtnTextDisabled: {
    color: '#6B7280', // Text xám khi đếm ngược
  },
  resendBtnTextActive: {
    color: COLORS.white, // Text trắng khi kích hoạt
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
    marginTop: 32,
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
