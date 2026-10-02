import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Design Tokens ──────────────────────────────────────────────────────────
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

/**
 * OtpInput – Component nhập mã OTP 6 ô chuẩn
 *
 * Props:
 * @param {number} length - Số ô OTP (mặc định 6)
 * @param {function} onComplete - Callback khi nhập đủ mã: (code: string) => void
 * @param {function} onResend - Callback gửi lại mã OTP
 * @param {boolean} isLoading - Trạng thái loading
 * @param {string} errorMessage - Thông báo lỗi
 * @param {number} cooldownSeconds - Thời gian cooldown ban đầu (mặc định 60)
 * @param {string} targetLabel - Nhãn mục tiêu (ví dụ: "0987654321" hoặc "user@gmail.com")
 * @param {string} type - Loại OTP: 'phone' hoặc 'email'
 */
export default function OtpInput({
  length = 6,
  onComplete,
  onResend,
  isLoading = false,
  errorMessage = '',
  cooldownSeconds = 60,
  targetLabel = '',
  type = 'phone',
}) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [countdown, setCountdown] = useState(cooldownSeconds);
  const inputRefs = useRef([]);

  // ─── Countdown Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus ô đầu tiên khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // ─── OTP Input Handlers ─────────────────────────────────────────────────────
  const handleChange = useCallback((val, idx) => {
    // Xử lý paste toàn bộ mã OTP
    if (val.length > 1) {
      const digits = val.replace(/[^0-9]/g, '').slice(0, length);
      const newOtp = Array(length).fill('');
      digits.split('').forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      if (digits.length === length) {
        inputRefs.current[length - 1]?.blur();
        onComplete?.(digits);
      } else {
        inputRefs.current[Math.min(digits.length, length - 1)]?.focus();
      }
      return;
    }

    const digit = val.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);

    // Auto-focus ô tiếp theo
    if (digit && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }

    // Nếu nhập đủ → callback
    const fullCode = newOtp.join('');
    if (fullCode.length === length && !newOtp.includes('')) {
      onComplete?.(fullCode);
    }
  }, [otp, length, onComplete]);

  const handleKeyPress = useCallback((e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      const newOtp = [...otp];
      newOtp[idx - 1] = '';
      setOtp(newOtp);
      inputRefs.current[idx - 1]?.focus();
    }
  }, [otp]);

  const handleResend = useCallback(() => {
    if (countdown > 0 || isLoading) return;
    setOtp(Array(length).fill(''));
    setCountdown(cooldownSeconds);
    onResend?.();
    // Focus ô đầu tiên
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }, [countdown, isLoading, length, cooldownSeconds, onResend]);

  // Reset OTP khi có lỗi mới
  useEffect(() => {
    if (errorMessage) {
      setOtp(Array(length).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [errorMessage, length]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  const iconName = type === 'email' ? 'mail-outline' : 'chatbubble-ellipses-outline';
  const subtitleText = type === 'email'
    ? `Nhập mã 6 số đã gửi đến email\n${targetLabel}`
    : `Nhập mã 6 số đã gửi đến số\n${targetLabel}`;

  return (
    <View style={styles.container}>
      {/* Icon + Title */}
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={32} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Nhập mã xác thực</Text>
      <Text style={styles.subtitle}>{subtitleText}</Text>

      {/* 6 Ô OTP */}
      <View style={styles.otpRow}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => (inputRefs.current[idx] = ref)}
            style={[
              styles.otpBox,
              focusedIndex === idx && styles.otpBoxFocused,
              errorMessage && styles.otpBoxError,
              digit && !errorMessage && styles.otpBoxFilled,
            ]}
            value={digit}
            onChangeText={(val) => handleChange(val, idx)}
            onKeyPress={(e) => handleKeyPress(e, idx)}
            onFocus={() => setFocusedIndex(idx)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={idx === 0 ? length : 1} // Ô đầu cho phép paste dài
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            selectTextOnFocus
            editable={!isLoading}
          />
        ))}
      </View>

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={16} color={COLORS.red} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Gửi lại mã + Countdown */}
      <View style={styles.resendRow}>
        {countdown > 0 ? (
          <Text style={styles.countdownText}>
            Gửi lại mã sau{' '}
            <Text style={styles.countdownNumber}>{countdown}s</Text>
          </Text>
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            disabled={isLoading}
            style={styles.resendButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
            <Text style={styles.resendText}>Gửi lại mã</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    borderRadius: 12,
    backgroundColor: COLORS.bgGray,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  otpBoxFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  otpBoxError: {
    borderColor: COLORS.red,
    backgroundColor: '#FEF2F2',
  },
  otpBoxFilled: {
    borderColor: COLORS.green,
    backgroundColor: '#ECFDF5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '500',
  },
  resendRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: COLORS.textSub,
  },
  countdownNumber: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
