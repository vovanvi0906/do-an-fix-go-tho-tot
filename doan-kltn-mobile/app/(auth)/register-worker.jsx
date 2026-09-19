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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../../src/features/auth';

// ─── Design Tokens (Figma FIXGO – Exact Match) ───────────────────────────────
const COLORS = {
  primary: '#0084FF',         // Figma blue action button & focus borders
  primaryDark: '#0066CC',
  darkBlue: '#1A365D',
  white: '#FFFFFF',
  bgGray: '#EAECF0',          // Figma light gray inputs
  borderGray: '#E5E7EB',      // Border gray
  textDark: '#111827',
  textSub: '#6B7280',
  red: '#EF4444',             // Error state
  green: '#10B981',           // Success state
  facebookBlue: '#1877F2',
  googleRed: '#EA4335',
  modalOverlay: 'rgba(0, 0, 0, 0.45)',
};

// Danh sách dịch vụ đăng ký theo chuẩn Figma (Screen 41)
const AVAILABLE_SERVICES = [
  'Giúp việc',
  'Làm vườn',
  'Sửa điện nước',
  'Sửa thiết bị',
];

// Danh sách 63 mã tỉnh/thành phố trực thuộc Trung ương của Việt Nam (001 - 096)
export const VN_PROVINCE_CODES = [
  '001', '002', '004', '006', '008', '010', '011', '012', '014', '015',
  '017', '019', '020', '022', '024', '025', '026', '027', '030', '031',
  '033', '034', '035', '036', '037', '038', '040', '042', '044', '045',
  '046', '048', '049', '051', '052', '054', '056', '058', '060', '062',
  '064', '066', '067', '068', '070', '072', '074', '075', '077', '079',
  '080', '082', '083', '084', '086', '087', '089', '091', '092', '093',
  '094', '095', '096',
];

/**
 * Cấu trúc 12 chữ số CCCD chuẩn: AAA B CC DDDDDD
 * - AAA (3 số đầu): Mã tỉnh/thành phố nơi đăng ký khai sinh (001 đến 096)
 * - B (Số thứ 4): Mã thế kỷ sinh và giới tính:
 *     + Thế kỷ 20 (1900 - 1999): Nam là 0, Nữ là 1.
 *     + Thế kỷ 21 (2000 - 2099): Nam là 2, Nữ là 3.
 *     + Thế kỷ 22 (2100 - 2199): Nam là 4, Nữ là 5.
 * - CC (Số thứ 5 và 6): 2 số cuối của năm sinh (00 - 99)
 * - DDDDDD (6 số cuối): Dãy số ngẫu nhiên do hệ thống cấp tự động (khác 000000)
 */
export function validateVietnameseCCCD(cccd) {
  if (!cccd || typeof cccd !== 'string') {
    return { isValid: false, message: 'Vui lòng nhập số CCCD' };
  }

  const clean = cccd.trim();

  // 1. Độ dài và định dạng số: Phải đúng 12 chữ số
  if (!/^\d{12}$/.test(clean)) {
    return { isValid: false, message: 'Thông tin CCCD không khớp' };
  }

  // 2. AAA (3 số đầu): Mã tỉnh/thành phố hợp lệ
  const provinceCode = clean.substring(0, 3);
  if (!VN_PROVINCE_CODES.includes(provinceCode)) {
    return { isValid: false, message: 'Thông tin CCCD không khớp' };
  }

  // 3. B (Số thứ 4): Mã thế kỷ sinh & giới tính (0 - 9)
  const genderCenturyCode = parseInt(clean[3], 10);
  if (isNaN(genderCenturyCode) || genderCenturyCode < 0 || genderCenturyCode > 9) {
    return { isValid: false, message: 'Thông tin CCCD không khớp' };
  }

  // 4. CC (Số thứ 5 và 6): 2 số cuối của năm sinh
  const birthYearSuffix = parseInt(clean.substring(4, 6), 10);
  let baseCenturyYear = 1900;
  if (genderCenturyCode === 0 || genderCenturyCode === 1) baseCenturyYear = 1900;
  else if (genderCenturyCode === 2 || genderCenturyCode === 3) baseCenturyYear = 2000;
  else if (genderCenturyCode === 4 || genderCenturyCode === 5) baseCenturyYear = 2100;
  else if (genderCenturyCode === 6 || genderCenturyCode === 7) baseCenturyYear = 2200;
  else if (genderCenturyCode === 8 || genderCenturyCode === 9) baseCenturyYear = 2300;

  const fullBirthYear = baseCenturyYear + birthYearSuffix;
  const currentYear = new Date().getFullYear();

  // Năm sinh không được ở tương lai và phải trong độ tuổi lao động (>= 15 tuổi)
  if (fullBirthYear > currentYear || currentYear - fullBirthYear < 15 || currentYear - fullBirthYear > 100) {
    return { isValid: false, message: 'Thông tin CCCD không khớp' };
  }

  // 5. DDDDDD (6 số cuối): Dãy số ngẫu nhiên (không được là 000000)
  const randomSuffix = clean.substring(6, 12);
  if (randomSuffix === '000000') {
    return { isValid: false, message: 'Thông tin CCCD không khớp' };
  }

  return { isValid: true, message: '' };
}

// ─── Component: Lá Cờ Việt Nam ──────────────────────────────────────────────
const VietnamFlag = () => (
  <View style={styles.flagBox}>
    <View style={styles.vnFlag}>
      <FontAwesome name="star" size={13} color="#FFEB3B" />
    </View>
  </View>
);

export default function RegisterWorkerScreen() {
  const router = useRouter();
  const { registerWorker } = useAuth();

  // ─── Font loading (Inter) ───────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ─── Step Management (Figma Exact Flow):
  // Step 1: Nhập SĐT (Screen 22)
  // Step 2: Nhập OTP 6 số (Screen 72/45 & Image 4)
  // Step 3: Tạo mật khẩu & Checklist (Screen 73-78)
  // Step 4: Nhập Họ tên & Email (Screen 79-81)
  // Step 5: Chọn dịch vụ muốn đăng ký (Screen 40-42)
  // Step 6: Nhập số CCCD (Screen 43-46)
  // Step 7: Success Signup / Loading (Figma Success Signup)
  const [step, setStep] = useState(1);

  // Step 1: Phone State
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Step 2: OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const otpInputs = useRef([]);

  // Step 3: Password State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  // Step 4: Name & Email State
  const [firstName, setFirstName] = useState('');
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [lastName, setLastName] = useState('');
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Step 5: Service Selection State (Screen 40-42)
  const [selectedService, setSelectedService] = useState('');
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);

  // Step 6: CCCD State (Screen 43-46)
  const [cccdNumber, setCccdNumber] = useState('');
  const [isCccdFocused, setIsCccdFocused] = useState(false);

  // Status & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  // ─── Timer đếm ngược OTP ───────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // ─── Password Security Checklist Rules (Figma) ──────────────────────────────
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasDigit;
  const isPasswordMatch = confirmPassword.length > 0 && password === confirmPassword;

  // ─── Step 1: Submit Phone Number ────────────────────────────────────────────
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

  // ─── Step 2: Handle OTP Input ───────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (errorMessage) {
      setErrorMessage('');
      setHasError(false);
    }

    if (val && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    if (countdown === 0) {
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setErrorMessage('');
      setHasError(false);
      otpInputs.current[0]?.focus();
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

  // ─── Step 4: Handle Name & Email Submit ─────────────────────────────────────
  const handleNameSubmit = () => {
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
    if (!email.trim()) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập Email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setHasError(true);
      setErrorMessage('Email không hợp lệ (vd: example@gmail.com)');
      return;
    }

    setStep(5);
  };

  // ─── Step 5: Handle Service Selection (Screen 40-42) ────────────────────────
  const handleSelectServiceItem = (service) => {
    setSelectedService(service);
    setIsServiceModalVisible(false);
    setErrorMessage('');
    setHasError(false);
  };

  const handleServiceSubmit = () => {
    if (!selectedService) {
      setHasError(true);
      setErrorMessage('Vui lòng chọn dịch vụ muốn đăng ký');
      return;
    }
    setErrorMessage('');
    setHasError(false);
    setStep(6);
  };

  // ─── Step 6: Handle CCCD & Final Submission (Screen 43-46) ───────────────────
  const handleCccdSubmit = async () => {
    setErrorMessage('');
    setHasError(false);

    const cleanCccd = cccdNumber.trim();
    if (!cleanCccd) {
      setHasError(true);
      setErrorMessage('Vui lòng nhập số CCCD');
      return;
    }

    // 1. Kiểm tra tính hợp lệ về mặt cấu trúc của số CCCD Việt Nam (AAA B CC DDDDDD)
    const cccdValidation = validateVietnameseCCCD(cleanCccd);
    if (!cccdValidation.isValid) {
      setHasError(true);
      setErrorMessage(cccdValidation.message);
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const userEmail = email.trim();

    try {
      setIsLoading(true);
      setStep(7); // Loading / Success Signup Screen (Figma)

      console.log('🚀 [FixGo Register Worker] Gửi đăng ký Thợ:', {
        fullName,
        email: userEmail,
        phone: phone.trim(),
        skills: [selectedService],
        cccdNumber: cleanCccd,
      });

      // Gọi API đăng ký Thợ
      await registerWorker({
        fullName,
        email: userEmail,
        phone: phone.trim(),
        skills: [selectedService],
        password,
        cccdNumber: cleanCccd,
      });

      console.log('🎉 [FixGo Register Worker] Đăng ký thành công -> Điều hướng');
      router.replace('/(worker)/(tabs)');
    } catch (error) {
      console.error('❌ [FixGo Register Worker Error]:', error);
      setIsLoading(false);
      const errMsg = error.message || 'Đăng ký thất bại';

      // Điều hướng thông minh về đúng bước lỗi nếu là lỗi Email hoặc SĐT từ Backend
      if (errMsg.toLowerCase().includes('email')) {
        setStep(4); // Chuyển về Bước 4 (Nhập họ tên và email)
        setHasError(true);
        setErrorMessage(errMsg);
      } else if (errMsg.toLowerCase().includes('thoại') || errMsg.toLowerCase().includes('phone')) {
        setStep(1); // Chuyển về Bước 1 (Nhập số điện thoại)
        setHasError(true);
        setErrorMessage(errMsg);
      } else {
        setStep(6); // Giữ ở bước CCCD nếu lỗi về CCCD hoặc lỗi khác
        setHasError(true);
        setErrorMessage(errMsg);
      }
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: Success Signup Screen (Figma Success Signup)
  // ═════════════════════════════════════════════════════════════════════════════
  if (step === 7 || isLoading) {
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
                BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI (Chuẩn xác Figma Screen - 22)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập số điện thoại</Text>

                {/* Input Row: Cờ VN + Khung nhập số điện thoại bao bọc toàn bộ */}
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

                {/* Nút Tiếp tục */}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handlePhoneSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Tiếp tục</Text>
                </TouchableOpacity>

                {/* Thông báo lỗi nếu có */}
                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                {/* Divider: hoặc */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>hoặc</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Nút Social: Facebook & Google (Figma full width) */}
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

                {/* Terms Disclaimer Text (Figma) */}
                <Text style={styles.termsText}>
                  Bằng cách tiếp tục, bạn đồng ý nhận các cuộc gọi, tin nhắn WhatsApp hoặc SMS, bao gồm cả bằng phương thức tự động, từ FixGo và các công ty liên kết của hãng tới số điện thoại đã cung cấp.
                </Text>

                {/* Back button circle at bottom left (Figma) */}
                <View style={styles.bottomNavRow}>
                  <TouchableOpacity
                    style={styles.backCircleBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ (Chuẩn xác Figma Image 4)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập mã gồm 6 chữ số được gửi đến</Text>
                <Text style={styles.headerSubtitle}>
                  {phone ? `+84 ${phone.trim().slice(0, 2)}*****${phone.trim().slice(-4)}` : '+84'}
                </Text>

                {/* 6 Ô nhập OTP (Viền xanh #0084FF và nền trắng khi có số hoặc focus) */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, idx) => {
                    const isFocused = focusedOtpIndex === idx;
                    const isFilled = !!digit;
                    return (
                      <TextInput
                        key={idx}
                        ref={(ref) => (otpInputs.current[idx] = ref)}
                        style={[
                          styles.otpBox,
                          (isFilled || isFocused) && styles.otpBoxFilledOrFocused,
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
                    );
                  })}
                </View>

                {/* Thông báo lỗi OTP (Icon đỏ X + Text lỗi) */}
                {hasError && errorMessage ? (
                  <View style={styles.errorOtpRow}>
                    <Ionicons name="close-circle" size={18} color={COLORS.red} />
                    <Text style={styles.errorOtpText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Nút Gửi lại mã: Nút xanh nhỏ gọn ở giữa (Figma Image 4) */}
                <TouchableOpacity
                  style={[
                    styles.resendBtnCompact,
                    countdown > 0 ? styles.resendBtnDisabled : styles.resendBtnActive,
                  ]}
                  disabled={countdown > 0}
                  activeOpacity={0.8}
                  onPress={handleResendOtp}
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

                {/* Navigation Row: Back (<-) & Tiếp (->) */}
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
                BƯỚC 3: TẠO MẬT KHẨU (Chuẩn xác Figma Screen 73-78)
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
                    onPress={() => setShowPassword(!showPassword)}
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
                BƯỚC 4: NHẬP HỌ VÀ TÊN & EMAIL (Chuẩn xác Figma Screen 79-81)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập họ tên và gmail</Text>
                <Text style={styles.headerSubtitle}>
                  Cho chúng tôi biết cách gọi bạn và gửi thông tin xác nhận đơn hàng nhé
                </Text>

                {/* 2 Ô nhập Họ và Tên nằm ngang (Figma) */}
                <View style={styles.nameRow}>
                  <View
                    style={[
                      styles.nameInputWrapper,
                      { marginRight: 8 },
                      isFirstNameFocused && styles.inputWrapperFocused,
                      hasError && !firstName.trim() && styles.inputWrapperError,
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
                        if (hasError) setHasError(false);
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
                      hasError && !lastName.trim() && styles.inputWrapperError,
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
                        if (hasError) setHasError(false);
                      }}
                      onFocus={() => setIsLastNameFocused(true)}
                      onBlur={() => setIsLastNameFocused(false)}
                    />
                  </View>
                </View>

                {/* Ô nhập Email */}
                <View
                  style={[
                    styles.inputWrapperWhite,
                    { marginTop: 12 },
                    isEmailFocused && styles.inputWrapperFocused,
                    hasError && (errorMessage.toLowerCase().includes('email') || !email.trim()) && styles.inputWrapperError,
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
                      if (hasError) setHasError(false);
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

                {/* Navigation Row: Back (<-) & Tiếp (->) */}
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
                      firstName.trim() && lastName.trim() && email.trim()
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handleNameSubmit}
                    disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
                  >
                    <Text style={styles.nextBtnText}>Tiếp</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 5: CHỌN DỊCH VỤ MUỐN ĐĂNG KÝ (Chuẩn xác Figma Screen 40 - 42)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 5 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Chọn dịch vụ muốn đăng ký</Text>
                <Text style={styles.headerSubtitle}>
                  Hãy chọn lĩnh vực phù hợp chuyên môn của bạn
                </Text>

                {/* Selector Input Box (Figma Screen 40-42) */}
                <TouchableOpacity
                  style={[
                    styles.serviceSelectBox,
                    (isServiceModalVisible || selectedService) && styles.serviceSelectBoxActive,
                    hasError && !selectedService && styles.inputWrapperError,
                  ]}
                  onPress={() => setIsServiceModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.serviceSelectText,
                      selectedService ? styles.serviceSelectTextFilled : styles.serviceSelectTextPlaceholder,
                    ]}
                  >
                    {selectedService || 'Dịch vụ muốn đăng ký'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textDark} />
                </TouchableOpacity>

                {/* Thông báo lỗi nếu chưa chọn dịch vụ */}
                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                {/* Navigation Row: Back (<-) & Tiếp (->) */}
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
                      selectedService ? styles.nextBtnActive : styles.nextBtnDisabled,
                    ]}
                    onPress={handleServiceSubmit}
                    disabled={!selectedService}
                  >
                    <Text style={styles.nextBtnText}>Tiếp</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                BƯỚC 6: NHẬP SỐ CCCD (Chuẩn xác Figma Screen 43 - 46)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 6 && (
              <View style={styles.stepContainer}>
                <Text style={styles.headerTitle}>Nhập số CCCD</Text>
                <Text style={styles.headerSubtitle}>
                  Giúp xác minh danh tính tài khoản của bạn
                </Text>

                {/* Input: Số CCCD */}
                <View
                  style={[
                    styles.singleInputWrapper,
                    (isCccdFocused || cccdNumber) && styles.singleInputWrapperFocused,
                    hasError && styles.singleInputWrapperError,
                  ]}
                >
                  <TextInput
                    style={styles.formInput}
                    placeholder="Số CCCD"
                    placeholderTextColor={COLORS.textSub}
                    value={cccdNumber}
                    onChangeText={(val) => {
                      setCccdNumber(val);
                      if (hasError) setHasError(false);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setIsCccdFocused(true)}
                    onBlur={() => setIsCccdFocused(false)}
                    keyboardType="number-pad"
                    maxLength={12}
                    autoFocus
                  />
                </View>

                {/* Thông báo lỗi CCCD (Figma Screen 45: Icon đỏ X + Text) */}
                {hasError && errorMessage ? (
                  <View style={styles.errorCccdRow}>
                    <Ionicons name="close-circle" size={18} color={COLORS.red} />
                    <Text style={styles.errorCccdText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Navigation Row: Back (<-) & Tiếp (->) */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.backCircleBtn}
                    onPress={() => setStep(5)}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      cccdNumber.trim()
                        ? styles.nextBtnActive
                        : styles.nextBtnDisabled,
                    ]}
                    onPress={handleCccdSubmit}
                    disabled={!cccdNumber.trim()}
                  >
                    <Text style={styles.nextBtnText}>Tiếp</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ═════════════════════════════════════════════════════════════════════
            BOTTOM SHEET MODAL: CHỌN DỊCH VỤ MUỐN ĐĂNG KÝ (Figma Screen 41)
           ═════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={isServiceModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsServiceModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsServiceModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.bottomSheetCard}>
                  {/* Sheet Header */}
                  <Text style={styles.bottomSheetTitle}>Dịch vụ muốn đăng ký</Text>

                  {/* List of Services */}
                  <View style={styles.serviceListContainer}>
                    {AVAILABLE_SERVICES.map((service, index) => (
                      <TouchableOpacity
                        key={service}
                        style={[
                          styles.serviceListItem,
                          index === AVAILABLE_SERVICES.length - 1 && styles.serviceListItemLast,
                          selectedService === service && styles.serviceListItemActive,
                        ]}
                        onPress={() => handleSelectServiceItem(service)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.serviceListItemText,
                            selectedService === service && styles.serviceListItemTextActive,
                          ]}
                        >
                          {service}
                        </Text>
                        {selectedService === service && (
                          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES – Chuẩn xác 100% Figma FIXGO
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
  termsText: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#9CA3AF',
    lineHeight: 16,
    marginTop: 18,
    marginBottom: 24,
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ─── OTP Styles (Step 2 - Figma Image 4) ────────────────────────────────────
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
    borderWidth: 2,
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
  otpBoxFilledOrFocused: {
    borderColor: COLORS.primary, // Viền xanh dương chuẩn Figma
    backgroundColor: COLORS.white,
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
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
  },
  resendBtnCompact: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 36,
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

  // ─── Password Checklist (Figma Screen 73-78) ────────────────────────────────
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

  // ─── Step 5: Service Selection Dropdown Box (Figma Screen 40-42) ───────────
  serviceSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
    marginTop: 4,
  },
  serviceSelectBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgGray,
  },
  serviceSelectText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  serviceSelectTextPlaceholder: {
    color: '#9CA3AF',
  },
  serviceSelectTextFilled: {
    color: COLORS.textDark,
    fontFamily: 'Inter_600SemiBold',
  },

  // ─── Step 6: Single CCCD Input Wrapper (Figma Screen 43-46) ─────────────────
  singleInputWrapper: {
    backgroundColor: COLORS.bgGray,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
    marginTop: 4,
    justifyContent: 'center',
  },
  singleInputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgGray,
  },
  singleInputWrapperError: {
    borderColor: COLORS.red,
    backgroundColor: '#FEF2F2',
  },
  formInput: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  errorCccdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorCccdText: {
    color: COLORS.red,
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
  },

  // ─── Bottom Sheet Modal (Figma Screen 41) ───────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 20,
  },
  serviceListContainer: {
    gap: 0,
  },
  serviceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceListItemLast: {
    borderBottomWidth: 0,
  },
  serviceListItemActive: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  serviceListItemText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
  },
  serviceListItemTextActive: {
    color: COLORS.primary,
    fontFamily: 'Inter_600SemiBold',
  },

  // ─── Navigation Row (Back & Next) ───────────────────────────────────────────
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
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
    backgroundColor: '#D1D5DB',
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
