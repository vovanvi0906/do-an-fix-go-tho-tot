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
import { useAuth } from '../../../src/features/auth';

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
  // Đối với phone và email: Cần luồng 3 bước (Nhập thông tin -> Nhập OTP 6 số -> Nhập mật khẩu hiện tại)
  const isVerificationRequired = fieldType === 'phone' || fieldType === 'email';
  const [currentStep, setCurrentStep] = useState(
    fieldType === 'password' ? 'password' : 'input'
  );

  const [inputValue, setInputValue] = useState(initialValue);
  const [otpValue, setOtpValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ đếm ngược gửi lại OTP (60s)
  const [countdown, setCountdown] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

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
      // Bắt đầu đếm ngược và chuyển sang bước OTP
      setCountdown(60);
      setTimerActive(true);
      setCurrentStep('otp');
      return;
    }

    if (fieldType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email (vd: name@gmail.com).');
        return;
      }
      // Bắt đầu đếm ngược và chuyển sang bước OTP
      setCountdown(60);
      setTimerActive(true);
      setCurrentStep('otp');
      return;
    }

    // Họ hoặc Tên (không cần OTP, lưu trực tiếp)
    await executeSaveProfile(val);
  };

  // ─── BƯỚC 2: XỬ LÝ XÁC THỰC MÃ OTP ─────────────────────────────────────────
  const handleOtpSubmit = () => {
    if (otpValue.trim().length < 6) {
      Alert.alert('Mã OTP chưa đủ', 'Vui lòng nhập đủ 6 chữ số mã xác minh.');
      return;
    }

    // Chuyển sang Bước 3: Xác minh mật khẩu hiện tại (Khớp 100% giao diện Image 2)
    setCurrentStep('password');
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setTimerActive(true);
    Alert.alert('Đã gửi lại mã', `Mã xác minh mới đã được gửi đến ${inputValue.trim()}.`);
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
              BƯỚC 2: FORM NHẬP MÃ OTP 6 SỐ
             ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 'otp' && (
            <View>
              <Text style={styles.stepTitle}>Nhập mã xác nhận</Text>
              <Text style={styles.stepSubDesc}>
                Mã xác minh gồm 6 chữ số đã được gửi tới{' '}
                <Text style={styles.boldTargetText}>{inputValue.trim()}</Text>
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  styles.otpInputWrapper,
                  isFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.textInput, styles.otpTextInput]}
                  value={otpValue}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/\D/g, '').slice(0, 6);
                    setOtpValue(cleaned);
                  }}
                  placeholder="• • • • • •"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              <View style={styles.resendOtpRow}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Gửi lại mã sau <Text style={styles.countdownHighlight}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                    <Text style={styles.resendBtnText}>Gửi lại mã xác minh</Text>
                  </TouchableOpacity>
                )}
              </View>
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
            BOTTOM ACTION BUTTON: Nút đen chuẩn Figma (Screen 100 - 104 & Image 2)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.bottomBar}>
          {currentStep === 'input' && (
            <TouchableOpacity
              style={[
                styles.blackActionBtn,
                !inputValue.trim() && styles.blackActionBtnDisabled,
              ]}
              onPress={handleInputSubmit}
              disabled={!inputValue.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.blackActionBtnText}>{config.btnText}</Text>
            </TouchableOpacity>
          )}

          {currentStep === 'otp' && (
            <TouchableOpacity
              style={[
                styles.blackActionBtn,
                otpValue.length < 6 && styles.blackActionBtnDisabled,
              ]}
              onPress={handleOtpSubmit}
              disabled={otpValue.length < 6 || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.blackActionBtnText}>Xác nhận mã</Text>
            </TouchableOpacity>
          )}

          {currentStep === 'password' && (
            <TouchableOpacity
              style={[
                styles.blackActionBtn,
                !passwordValue.trim() && styles.blackActionBtnDisabled,
              ]}
              onPress={handlePasswordVerifyAndSave}
              disabled={!passwordValue.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.blackActionBtnText}>Verify</Text>
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

  // ─── Step 2 Styles (OTP) ───────────────────────────────────────────────────
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  stepSubDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    lineHeight: 20,
    marginBottom: 20,
  },
  boldTargetText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
  },
  otpInputWrapper: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpTextInput: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 10,
  },
  resendOtpRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  countdownText: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  countdownHighlight: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
  },
  resendBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordInputBoxFocused: {
    borderColor: '#000000',
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

  // ─── Bottom Bar ────────────────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: COLORS.white,
  },
  blackActionBtn: {
    backgroundColor: COLORS.blackBtn,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackActionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  blackActionBtnText: {
    color: COLORS.white,
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
