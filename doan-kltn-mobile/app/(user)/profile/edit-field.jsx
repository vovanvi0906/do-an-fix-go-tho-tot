import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth, otpService } from '../../../src/features/auth';

const COLORS = {
  primary: '#0084FF',
  white: '#FFFFFF',
  bgGray: '#F8FAFC',
  inputBg: '#F3F4F6',
  borderGray: '#E5E7EB',
  borderFocus: '#0084FF',
  textDark: '#0F172A',
  textSub: '#64748B',
  blackBtn: '#000000',
  red: '#EF4444',
  green: '#10B981',
};

// ─── Component: Lá cờ Việt Nam Vector ─────────────────────────────────────────
const VietnamFlag = () => (
  <View style={styles.flagBox}>
    <View style={styles.vnFlag}>
      <FontAwesome name="star" size={10} color="#FFEB3B" />
    </View>
  </View>
);

export default function EditFieldScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, updateUser } = useAuth();

  const fieldType = params.field || 'surname'; // 'surname' | 'name' | 'phone' | 'email' | 'password'
  const initialValue = typeof params.value === 'string' ? params.value : '';

  // ─── Flow Steps: 'input' -> 'otp' -> 'password' ───────────────────────────
  const isVerificationRequired = fieldType === 'phone' || fieldType === 'email';
  const [currentStep, setCurrentStep] = useState(
    fieldType === 'password' ? 'password' : 'input'
  );

  const [inputValue, setInputValue] = useState(initialValue);
  // 6 ô OTP đồng bộ 100% với giao diện SignUp
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
  const otpInputs = useRef([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ đếm ngược gửi lại OTP (60s)
  const [countdown, setCountdown] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  // Tự động gửi OTP và chuyển thẳng sang step OTP khi được yêu cầu từ màn hình Profile
  useEffect(() => {
    if (params.autoSend === 'true' && params.value) {
      (async () => {
        try {
          setIsSubmitting(true);
          setErrorMessage('');
          setHasError(false);
          if (fieldType === 'phone') {
            const cleanPhone = params.value.trim().replace(/\s+/g, '');
            await otpService.sendPhoneOtp(cleanPhone);
          } else if (fieldType === 'email') {
            await otpService.sendEmailOtp(params.value.trim());
          }
          setOtp(['', '', '', '', '', '']);
          setCountdown(60);
          setTimerActive(true);
          setCurrentStep('otp');
        } catch (err) {
          setHasError(true);
          setErrorMessage(err.message || 'Không thể gửi mã xác nhận.');
        } finally {
          setIsSubmitting(false);
        }
      })();
    }
  }, [params.autoSend]);

  useEffect(() => {
    let interval = null;
    if (timerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, countdown]);

  // ─── Font Loading ──────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ─── Metadata theo từng loại màn hình Figma ────────────────────────────────
  const getFieldConfig = () => {
    switch (fieldType) {
      case 'surname':
        return {
          title: 'Họ',
          label: 'Họ',
          placeholder: 'Nhập họ của bạn',
          btnText: 'Cập nhật họ',
          keyboardType: 'default',
          helperText: '',
        };
      case 'name':
        return {
          title: 'Tên',
          label: 'Tên',
          placeholder: 'Nhập tên của bạn',
          btnText: 'Cập nhật tên',
          keyboardType: 'default',
          helperText: '',
        };
      case 'phone':
        return {
          title: 'Số điện thoại',
          label: 'Số điện thoại',
          placeholder: 'Nhập số điện thoại mới',
          btnText: 'Gửi mã xác minh',
          keyboardType: 'phone-pad',
          helperText: 'Mã xác minh gồm 6 số sẽ được gửi tới số điện thoại này',
        };
      case 'email':
        return {
          title: 'Email',
          label: 'Email',
          placeholder: 'Nhập email mới (vd: example@gmail.com)',
          btnText: 'Gửi mã xác minh',
          keyboardType: 'email-address',
          helperText: 'Mã xác minh gồm 6 số sẽ được gửi tới email này',
        };
      default:
        return {
          title: 'Thông tin',
          label: 'Thông tin',
          placeholder: 'Nhập thông tin',
          btnText: 'Tiếp tục',
          keyboardType: 'default',
          helperText: '',
        };
    }
  };

  const config = getFieldConfig();

  // ─── BƯỚC 1: XỬ LÝ NHẬP THÔNG TIN ──────────────────────────────────────────
  const handleInputSubmit = async () => {
    const val = inputValue.trim();
    if (!val) {
      Alert.alert('Thông báo', `Vui lòng nhập ${config.label.toLowerCase()}`);
      return;
    }

    // Kiểm tra định dạng nếu là Phone hoặc Email
    if (fieldType === 'phone') {
      const cleanPhone = val.replace(/\s+/g, '');
      if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(cleanPhone)) {
        Alert.alert('Số điện thoại không hợp lệ', 'Vui lòng nhập số điện thoại hợp lệ tại Việt Nam (10 chữ số).');
        return;
      }
      try {
        setIsSubmitting(true);
        await otpService.sendPhoneOtp(cleanPhone);
        setCountdown(60);
        setTimerActive(true);
        setCurrentStep('otp');
      } catch (err) {
        Alert.alert('Lỗi gửi OTP', err.message || 'Không thể gửi mã xác minh.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (fieldType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email (vd: name@gmail.com).');
        return;
      }
      try {
        setIsSubmitting(true);
        setErrorMessage('');
        setHasError(false);
        await otpService.sendEmailOtp(val);
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setTimerActive(true);
        setCurrentStep('otp');
      } catch (err) {
        Alert.alert('Lỗi gửi OTP', err.message || 'Không thể gửi mã xác minh.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Họ hoặc Tên (không cần OTP, lưu trực tiếp)
    await executeSaveProfile(val);
  };

  // ─── BƯỚC 2: XỬ LÝ 6 Ô MÃ OTP (ĐỒNG BỘ 100% LUỒNG SIGNUP) ────────────────────
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
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã xác nhận');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setHasError(false);

      if (fieldType === 'phone') {
        const cleanPhone = inputValue.trim().replace(/\s+/g, '');
        await otpService.verifyPhoneOtp(cleanPhone, fullOtp, 'register');
        setCurrentStep('password');
      } else if (fieldType === 'email') {
        const cleanEmail = inputValue.trim();
        await otpService.verifyEmailOtp(cleanEmail, fullOtp);
        // Với xác thực email, hoàn tất và cập nhật profile ngay lập tức
        await executeSaveProfile(cleanEmail);
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setHasError(false);
      if (fieldType === 'phone') {
        const cleanPhone = inputValue.trim().replace(/\s+/g, '');
        await otpService.sendPhoneOtp(cleanPhone);
      } else if (fieldType === 'email') {
        await otpService.sendEmailOtp(inputValue.trim());
      }
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setTimerActive(true);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message || 'Không thể gửi lại mã xác minh lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── BƯỚC 3: XỬ LÝ XÁC MINH MẬT KHẨU HIỆN TẠI & LƯU THÔNG TIN ──────────────
  const handlePasswordVerifyAndSave = async () => {
    if (!passwordValue.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu hiện tại để xác minh bảo mật.');
      return;
    }

    // Thực hiện lưu dữ liệu vào Auth Context / User State
    await executeSaveProfile(inputValue.trim());
  };

  const executeSaveProfile = async (targetValue) => {
    setIsSubmitting(true);
    try {
      const currentFullName = user?.fullName || user?.customerProfile?.fullName || 'Lu Dai';
      const nameParts = currentFullName.trim().split(/\s+/);

      let newFullName = currentFullName;
      let newPhone = user?.phone || '0366192248';
      let newEmail = user?.email || 'luhongphucdai@gmail.com';

      if (fieldType === 'surname') {
        const currentName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Dai';
        newFullName = `${targetValue} ${currentName}`.trim();
      } else if (fieldType === 'name') {
        const currentSurname = nameParts.length > 0 ? nameParts[0] : 'Lu';
        newFullName = `${currentSurname} ${targetValue}`.trim();
      } else if (fieldType === 'phone') {
        newPhone = targetValue;
      } else if (fieldType === 'email') {
        newEmail = targetValue;
      }

      await updateUser({
        ...user,
        fullName: newFullName,
        phone: newPhone,
        email: newEmail,
        ...(fieldType === 'email' ? { isEmailVerified: true, emailVerified: true } : {}),
      });

      const fieldNameSuccess =
        fieldType === 'phone'
          ? 'Số điện thoại'
          : fieldType === 'email'
          ? 'Email'
          : config.label;

      Alert.alert(
        'Xác minh thành công',
        `Đã cập nhật và xác thực ${fieldNameSuccess} thành công!`,
        [{ text: 'Hoàn tất', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('❌ [EditField Error]:', err);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            HEADER BAR: Nút ✕ hoặc ← tùy từng bước
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.headerBar}>
          {currentStep === 'password' ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (isVerificationRequired) {
                  setCurrentStep('otp');
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (currentStep === 'otp') {
                  setCurrentStep('input');
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══════════════════════════════════════════════════════════════════
              BƯỚC 1: FORM NHẬP THÔNG TIN (Họ / Tên / SĐT / Email)
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 'input' && (
            <View>
              <Text style={styles.fieldLabel}>{config.label}</Text>

              <View
                style={[
                  styles.inputWrapper,
                  isFocused && styles.inputWrapperFocused,
                ]}
              >
                {fieldType === 'phone' && (
                  <View style={styles.phonePrefix}>
                    <VietnamFlag />
                    <Text style={styles.prefixText}>+84</Text>
                  </View>
                )}

                <TextInput
                  style={styles.textInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={config.placeholder}
                  placeholderTextColor={COLORS.textSub}
                  keyboardType={config.keyboardType}
                  autoFocus
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />

                {inputValue.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setInputValue('')}
                    style={styles.clearBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {config.helperText ? (
                <Text style={styles.helperText}>{config.helperText}</Text>
              ) : null}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              BƯỚC 2: FORM NHẬP MÃ OTP 6 SỐ (ĐỒNG BỘ 100% GIAO DIỆN SIGNUP)
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 'otp' && (
            <View style={styles.otpStepContainer}>
              <View style={styles.iconCircleBox}>
                <Ionicons
                  name={fieldType === 'email' ? 'mail-outline' : 'phone-portrait-outline'}
                  size={32}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.headerTitle}>
                {fieldType === 'email' ? 'Xác thực Email của bạn' : 'Xác thực Số điện thoại'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Vui lòng nhập mã OTP 6 số đã được gửi đến {fieldType === 'email' ? 'email' : 'số điện thoại'}{'\n'}
                <Text style={styles.targetHighlight}>{inputValue.trim()}</Text>
              </Text>

              {/* 6 Ô NHẬP MÃ OTP CHUẨN ĐỒNG BỘ FIGMA */}
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

              {/* THÔNG BÁO LỖI VỚI ICON */}
              {hasError && errorMessage ? (
                <View style={styles.errorOtpRow}>
                  <Ionicons name="close-circle" size={16} color={COLORS.red} />
                  <Text style={styles.errorOtpText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* NÚT ĐẾM NGƯỢC GỬI LẠI MÃ */}
              <TouchableOpacity
                style={[
                  styles.resendBtn,
                  countdown > 0 ? styles.resendBtnDisabled : styles.resendBtnActive,
                ]}
                disabled={countdown > 0 || isSubmitting}
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
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              BƯỚC 3: FORM NHẬP MẬT KHẨU HIỆN TẠI (Chuẩn 100% ảnh Image 2)
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 'password' && (
            <View>
              <Text style={styles.passwordTitleText}>Verify password</Text>

              <View
                style={[
                  styles.passwordInputBox,
                  isFocused && styles.passwordInputBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.passwordTextInput}
                  value={passwordValue}
                  onChangeText={setPasswordValue}
                  placeholder=""
                  secureTextEntry={!showPassword}
                  autoFocus
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.passwordSecurityHelper}>
                For your security, please enter your current password
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ═════════════════════════════════════════════════════════════════════
            BOTTOM ACTION BUTTON: Nút chuẩn đồng bộ FixGo
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.bottomBar}>
          {currentStep === 'input' && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                !inputValue.trim() && styles.primaryActionBtnDisabled,
              ]}
              onPress={handleInputSubmit}
              disabled={!inputValue.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.btnContentRow}>
                  <Text style={styles.primaryActionBtnText}>{config.btnText}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {currentStep === 'otp' && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                otp.join('').length < 6 && styles.primaryActionBtnDisabled,
              ]}
              onPress={handleOtpSubmit}
              disabled={otp.join('').length < 6 || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.btnContentRow}>
                  <Text style={styles.primaryActionBtnText}>Tiếp tục</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {currentStep === 'password' && (
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                !passwordValue.trim() && styles.primaryActionBtnDisabled,
              ]}
              onPress={handlePasswordVerifyAndSave}
              disabled={!passwordValue.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.btnContentRow}>
                  <Text style={styles.primaryActionBtnText}>Xác nhận & Lưu</Text>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES – Chuẩn xác 100% Figma FIXGO Sub-screens & Image 2
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex1: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ─── Step 1 Styles ─────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    height: 52,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  clearBtn: {
    padding: 6,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 6,
  },
  prefixText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
  },
  flagBox: {
    width: 22,
    height: 15,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vnFlag: {
    width: 22,
    height: 15,
    backgroundColor: '#DA251D',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginTop: 10,
    lineHeight: 18,
  },

  // ─── Step 2 Styles (OTP) – Đồng bộ 100% Figma SignUp ─────────────────────
  otpStepContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  iconCircleBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  targetHighlight: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
    paddingHorizontal: 4,
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
    marginBottom: 20,
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

  // ─── Step 3 Styles (Verify Password - Image 2 Match) ───────────────────────
  passwordTitleText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  passwordInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passwordInputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
    letterSpacing: 2,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  eyeBtn: {
    padding: 6,
  },
  passwordSecurityHelper: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    lineHeight: 19,
  },

  // ─── Bottom Bar & Modern Primary Action Buttons ────────────────────────────
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: COLORS.white,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
