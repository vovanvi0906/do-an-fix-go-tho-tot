import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../src/features/auth';
import { otpService } from '../../../src/features/auth/services/otpService';

const COLORS = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  primaryLight: '#EBF5FF',
  white: '#FFFFFF',
  bgGray: '#F8FAFC',
  borderGray: '#E2E8F0',
  textDark: '#0F172A',
  textSub: '#64748B',
  green: '#10B981',
  greenLight: '#ECFDF5',
  red: '#EF4444',
  redLight: '#FEF2F2',
};

export default function EditCustomerProfileScreen() {
  const router = useRouter();
  const { user, updateUser, uploadAvatar, updatePhone, refreshProfile } = useAuth();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [actionModal, setActionModal] = useState({ visible: false, type: 'email' });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // ─── Tự động làm mới dữ liệu người dùng khi quay lại từ luồng OTP ──────────
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [EditProfile] Focus màn hình Chỉnh sửa thông tin, làm mới dữ liệu...');
      if (typeof refreshProfile === 'function') {
        refreshProfile();
      }
    }, [refreshProfile])
  );

  // ─── OTP Modal State (Xác thực Email OTP tại màn hình Tài khoản) ───────────
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const emailOtpInputs = useRef([]);

  // ─── Font Loading ──────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Tách Họ và Tên từ fullName chuẩn tiếng Việt
  const rawFullName = user?.fullName || user?.customerProfile?.fullName || 'Lu Dai';
  const nameParts = rawFullName.trim().split(/\s+/);
  const surname = nameParts.length > 0 ? nameParts[0] : 'Lu';
  const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Dai';

  // Lấy chính xác số điện thoại và trạng thái (không dùng số giả định)
  const rawPhone = user?.phone || user?.customerProfile?.phone || '';
  const hasPhone = typeof rawPhone === 'string' && rawPhone.trim().length > 0;
  const phone = hasPhone ? rawPhone.trim() : '';
  const email = user?.email || '';
  const isPhoneVerified = hasPhone && !!(user?.isPhoneVerified ?? user?.phoneVerified ?? true);
  // Trạng thái xác thực email đọc trực tiếp từ dữ liệu User trong Context/PostgreSQL
  const isEmailVerified = !!(user?.isEmailVerified ?? user?.is_email_verified ?? user?.emailVerified);
  const avatarUrl = user?.avatarUrl || user?.customerProfile?.avatarUrl;



  // Countdown timer cho OTP Email Modal (60s)
  useEffect(() => {
    let timer;
    if (otpModalVisible && otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpModalVisible, otpCountdown]);

  // Bắt đầu quy trình gửi OTP và mở Modal xác thực
  const handleStartVerifyEmail = async () => {
    if (!email) {
      Alert.alert('Thông báo', 'Không tìm thấy địa chỉ email để xác thực.');
      return;
    }
    try {
      setIsSendingOtp(true);
      setOtpError('');
      console.log('📧 [EditProfile] Gọi gửi Email OTP:', email);
      await otpService.sendEmailOtp(email);
      setEmailOtp(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setActionModal({ visible: false, type: 'email' });
      setOtpModalVisible(true);
    } catch (err) {
      console.error('❌ [EditProfile] Gửi OTP thất bại:', err);
      Alert.alert('Gửi mã thất bại', err.message || 'Không thể gửi mã xác thực. Vui lòng thử lại sau ít phút.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) return;
    try {
      setIsSendingOtp(true);
      setOtpError('');
      await otpService.sendEmailOtp(email);
      setEmailOtp(['', '', '', '', '', '']);
      setOtpCountdown(60);
    } catch (err) {
      setOtpError(err.message || 'Gửi lại mã thất bại');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (val, idx) => {
    const digit = val.replace(/[^0-9]/g, '');
    const newOtp = [...emailOtp];
    newOtp[idx] = digit;
    setEmailOtp(newOtp);
    if (otpError) setOtpError('');
    if (digit && idx < 5) {
      emailOtpInputs.current[idx + 1]?.focus();
    }
  };

  const handleOtpDigitKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !emailOtp[idx] && idx > 0) {
      emailOtpInputs.current[idx - 1]?.focus();
    }
  };

  const handleConfirmEmailOtp = async () => {
    const fullOtp = emailOtp.join('');
    if (fullOtp.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setOtpError('');
      console.log('📧 [EditProfile] Xác thực Email OTP:', { email, code: fullOtp });
      await otpService.verifyEmailOtp(email, fullOtp);

      // Cập nhật User Context & Local Storage
      await updateUser({
        ...user,
        isEmailVerified: true,
        is_email_verified: true,
        emailVerified: true,
      });

      setOtpModalVisible(false);
      Alert.alert('Xác thực thành công', 'Email của bạn đã được xác minh bảo mật thành công!');
    } catch (err) {
      console.error('❌ [EditProfile] Xác thực Email OTP lỗi:', err);
      setOtpError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const openActionModal = (type) => {
    setActionModal({ visible: true, type });
  };

  const handleUploadAvatar = () => {
    Alert.alert(
      'Tải ảnh đại diện',
      'Chọn phương thức chụp hoặc lấy ảnh:',
      [
        {
          text: 'Chụp ảnh mới',
          onPress: handleTakePhoto,
        },
        {
          text: 'Chọn từ thư viện',
          onPress: handlePickFromLibrary,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Quyền máy ảnh',
          'FixGo cần quyền truy cập máy ảnh để chụp ảnh đại diện. Vui lòng cho phép quyền trong cài đặt máy.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await processUploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error('❌ [EditProfile] Chụp ảnh lỗi:', err);
      Alert.alert('Lỗi', 'Không thể chụp ảnh lúc này. Vui lòng thử lại.');
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Quyền thư viện ảnh',
          'FixGo cần quyền truy cập thư viện để chọn ảnh đại diện. Vui lòng cho phép quyền trong cài đặt máy.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await processUploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error('❌ [EditProfile] Chọn ảnh thư viện lỗi:', err);
      Alert.alert('Lỗi', 'Không thể chọn ảnh lúc này. Vui lòng thử lại.');
    }
  };

  const processUploadAvatar = async (localUri) => {
    try {
      setPreviewAvatar(localUri);
      setIsUploadingAvatar(true);
      console.log('📤 [EditProfile] Tải ảnh đại diện lên Cloudinary...', localUri);

      const res = await uploadAvatar(localUri);
      console.log('🎉 [EditProfile] Tải avatar thành công:', res);

      const newUrl = res?.avatarUrl || res?.data?.avatarUrl;
      if (newUrl) {
        setPreviewAvatar(newUrl);
      }
      Alert.alert('Thành công', 'Ảnh đại diện của bạn đã được cập nhật!');
    } catch (err) {
      console.error('❌ [EditProfile] Upload avatar thất bại:', err);
      setPreviewAvatar(null);
      Alert.alert('Tải ảnh thất bại', err.message || 'Không thể tải ảnh đại diện lên máy chủ.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ═════════════════════════════════════════════════════════════════════
          HEADER: Nút đóng ✕ & Tiêu đề "Chỉnh sửa thông tin"
         ═════════════════════════════════════════════════════════════════════ */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            AVATAR SECTION: Avatar tròn lớn + Nút "Tải ảnh lên"
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleUploadAvatar}
            activeOpacity={0.8}
            disabled={isUploadingAvatar}
          >
            <View style={styles.avatarCircle}>
              {previewAvatar || avatarUrl ? (
                <Image
                  source={{ uri: previewAvatar || avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={54} color={COLORS.primary} />
              )}
              {isUploadingAvatar && (
                <View style={styles.avatarUploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                </View>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadTextBtn}
            onPress={handleUploadAvatar}
            activeOpacity={0.7}
            disabled={isUploadingAvatar}
          >
            <Text style={styles.uploadText}>
              {isUploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh lên'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            FIELDS LIST: Họ, Tên, Số điện thoại, Email (Figma Style)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.fieldsCard}>
          {/* Field 1: Họ */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/(user)/profile/edit-field',
                params: { field: 'surname', value: surname },
              })
            }
          >
            <View style={styles.fieldLeft}>
              <Text style={styles.fieldLabel}>Họ</Text>
              <Text style={styles.fieldValue}>{surname}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Field 2: Tên */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/(user)/profile/edit-field',
                params: { field: 'name', value: firstName },
              })
            }
          >
            <View style={styles.fieldLeft}>
              <Text style={styles.fieldLabel}>Tên</Text>
              <Text style={styles.fieldValue}>{firstName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Field 3: Số điện thoại */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.7}
            onPress={() => {
              router.push({
                pathname: '/(auth)/register-customer',
                params: {
                  isSocialOnboarding: 'true',
                  returnTo: '/(user)/profile/edit',
                },
              });
            }}
          >
            <View style={styles.fieldLeft}>
              <Text style={styles.fieldLabel}>Số điện thoại</Text>
              <Text
                style={[
                  styles.fieldValue,
                  !hasPhone && styles.fieldValueUnset,
                ]}
              >
                {hasPhone ? phone : 'Chưa cập nhật'}
              </Text>
            </View>
            <View style={styles.fieldRightWithBadge}>
              <View
                style={[
                  styles.badgePill,
                  hasPhone ? styles.badgeVerified : styles.badgeUnlinked,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    hasPhone ? styles.badgeTextVerified : styles.badgeTextUnlinked,
                  ]}
                >
                  {hasPhone ? 'Đã xác thực' : 'Chưa liên kết'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Field 4: Email (Tái cấu trúc giao diện: Hàng 1 Nhãn + Badge [✓ Đã xác thực], Hàng 2 Email trọn vẹn 1 dòng, ẩn mũi tên >, tắt click) */}
          <View style={styles.emailFieldContainer}>
            <View style={styles.emailHeaderRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View
                style={[
                  styles.badgePill,
                  isEmailVerified ? styles.badgeVerified : styles.badgeUnverified,
                  { marginLeft: 8 },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isEmailVerified ? styles.badgeTextVerified : styles.badgeTextUnverified,
                  ]}
                >
                  {isEmailVerified ? '✓ Đã xác thực' : 'Chưa xác thực'}
                </Text>
              </View>
            </View>
            <Text
              style={styles.emailValueFullWidth}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {email}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL QUẢN LÝ EMAIL & SỐ ĐIỆN THOẠI (THAY THẾ ALERT MẶC ĐỊNH)
         ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={actionModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModal({ ...actionModal, visible: false })}
      >
        <TouchableWithoutFeedback onPress={() => setActionModal({ ...actionModal, visible: false })}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Header Icon Circle */}
                <View
                  style={[
                    styles.modalIconCircle,
                    {
                      backgroundColor:
                        (actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                          ? '#ECFDF5'
                          : '#EFF6FF',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      actionModal.type === 'email'
                        ? 'mail-outline'
                        : 'call-outline'
                    }
                    size={32}
                    color={
                      (actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                        ? COLORS.green
                        : COLORS.primary
                    }
                  />
                </View>

                {/* Modal Title */}
                <Text style={styles.modalTitle}>
                  {actionModal.type === 'email' ? 'Quản lý Email' : 'Quản lý Số điện thoại'}
                </Text>

                {/* Subtitle Description */}
                <Text style={styles.modalDesc}>
                  {(actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                    ? 'Thông tin này đã được xác thực an toàn để bảo vệ tài khoản FixGo của bạn.'
                    : 'Thông tin này chưa được xác thực. Bạn có thể nhận mã OTP để xác thực ngay.'}
                </Text>

                {/* Info Card Box */}
                <View style={styles.modalInfoBox}>
                  <View style={styles.modalInfoHeader}>
                    <Text style={styles.modalInfoLabel}>
                      {actionModal.type === 'email' ? 'Địa chỉ Email' : 'Số điện thoại'}
                    </Text>
                    <View
                      style={[
                        styles.modalBadge,
                        (actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                          ? styles.modalBadgeVerified
                          : styles.modalBadgeUnverified,
                      ]}
                    >
                      <Ionicons
                        name={
                          (actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                            ? 'checkmark-circle'
                            : 'alert-circle'
                        }
                        size={14}
                        color={
                          (actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                            ? COLORS.green
                            : '#F59E0B'
                        }
                      />
                      <Text
                        style={[
                          styles.modalBadgeText,
                          (actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                            ? styles.modalBadgeTextVerified
                            : styles.modalBadgeTextUnverified,
                        ]}
                      >
                        {(actionModal.type === 'email' ? isEmailVerified : isPhoneVerified)
                          ? 'Đã xác thực'
                          : 'Chưa xác thực'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={styles.modalInfoValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {actionModal.type === 'email' ? email : phone}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActionGroup}>
                  {!(actionModal.type === 'email' ? isEmailVerified : isPhoneVerified) ? (
                    <>
                      <TouchableOpacity
                        style={styles.modalPrimaryBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (actionModal.type === 'email') {
                            handleStartVerifyEmail();
                          } else {
                            setActionModal({ ...actionModal, visible: false });
                            router.push({
                              pathname: '/(auth)/register-customer',
                              params: {
                                isSocialOnboarding: 'true',
                                returnTo: '/(user)/profile/edit',
                              },
                            });
                          }
                        }}
                      >
                        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.white} />
                        <Text style={styles.modalPrimaryBtnText}>Gửi mã OTP xác thực</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalSecondaryBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          const targetType = actionModal.type;
                          setActionModal({ ...actionModal, visible: false });
                          if (targetType === 'phone') {
                            router.push({
                              pathname: '/(auth)/register-customer',
                              params: {
                                isSocialOnboarding: 'true',
                                returnTo: '/(user)/profile/edit',
                              },
                            });
                          } else {
                            router.push({
                              pathname: '/(user)/profile/edit-field',
                              params: { field: targetType, value: '' },
                            });
                          }
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.modalSecondaryBtnText}>
                          {actionModal.type === 'email' ? 'Đổi Email khác' : 'Đổi Số điện thoại khác'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.modalPrimaryBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        const targetType = actionModal.type;
                        setActionModal({ ...actionModal, visible: false });
                        if (targetType === 'phone') {
                          router.push({
                            pathname: '/(auth)/register-customer',
                            params: {
                              isSocialOnboarding: 'true',
                              returnTo: '/(user)/profile/edit',
                            },
                          });
                        } else {
                          router.push({
                            pathname: '/(user)/profile/edit-field',
                            params: { field: targetType, value: email },
                          });
                        }
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={COLORS.white} />
                      <Text style={styles.modalPrimaryBtnText}>
                        {actionModal.type === 'email' ? 'Đổi địa chỉ Email mới' : 'Đổi Số điện thoại mới'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                    onPress={() => setActionModal({ ...actionModal, visible: false })}
                  >
                    <Text style={styles.modalCloseBtnText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL XÁC THỰC EMAIL OTP (KÈM 6 Ô NHẬP & COUNTDOWN 60S)
         ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOtpModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Header Icon Circle */}
                <View style={[styles.modalIconCircle, { backgroundColor: '#EBF5FF' }]}>
                  <Ionicons name="mail-unread-outline" size={32} color={COLORS.primary} />
                </View>

                {/* Modal Title */}
                <Text style={styles.modalTitle}>Xác thực Email</Text>

                {/* Subtitle Description */}
                <Text style={styles.modalDesc}>
                  Mã OTP 6 số đã được gửi đến địa chỉ email{'\n'}
                  <Text style={styles.emailHighlightText}>{email}</Text>
                </Text>

                {/* 6 ô OTP Input */}
                <View style={styles.otpBoxesRow}>
                  {emailOtp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => (emailOtpInputs.current[idx] = ref)}
                      style={[
                        styles.otpBox,
                        focusedOtpIndex === idx && styles.otpBoxFocused,
                        digit ? styles.otpBoxFilled : null,
                        otpError ? styles.otpBoxError : null,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpDigitChange(val, idx)}
                      onKeyPress={(e) => handleOtpDigitKeyPress(e, idx)}
                      onFocus={() => setFocusedOtpIndex(idx)}
                      onBlur={() => setFocusedOtpIndex(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={idx === 0}
                    />
                  ))}
                </View>

                {/* Error Row */}
                {otpError ? (
                  <View style={styles.errorOtpRow}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.red} />
                    <Text style={styles.errorOtpText}>{otpError}</Text>
                  </View>
                ) : null}

                {/* Resend Countdown Button */}
                <TouchableOpacity
                  style={[
                    styles.resendOtpBtn,
                    otpCountdown > 0 ? styles.resendOtpBtnDisabled : styles.resendOtpBtnActive,
                  ]}
                  disabled={otpCountdown > 0 || isSendingOtp}
                  onPress={handleResendEmailOtp}
                  activeOpacity={0.8}
                >
                  {isSendingOtp ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.resendOtpText,
                        otpCountdown > 0 ? styles.resendOtpTextDisabled : styles.resendOtpTextActive,
                      ]}
                    >
                      {otpCountdown > 0 ? `Gửi lại mã: ${otpCountdown}s` : 'Gửi lại mã OTP'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.modalActionGroup}>
                  <TouchableOpacity
                    style={[
                      styles.modalPrimaryBtn,
                      emailOtp.join('').length === 6 && !isVerifyingOtp
                        ? null
                        : styles.modalBtnDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={emailOtp.join('').length !== 6 || isVerifyingOtp}
                    onPress={handleConfirmEmailOtp}
                  >
                    {isVerifyingOtp ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.white} />
                        <Text style={styles.modalPrimaryBtnText}>Xác thực ngay</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setOtpModalVisible(false);
                      router.push({
                        pathname: '/(user)/profile/edit-field',
                        params: { field: 'email', value: '' },
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.modalSecondaryBtnText}>Đổi Email khác</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                    onPress={() => setOtpModalVisible(false)}
                  >
                    <Text style={styles.modalCloseBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES – Chuẩn xác 100% Figma FIXGO Edit Profile
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    includeFontPadding: false,
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ─── Avatar Section ────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 3,
    borderColor: '#D4E9FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  uploadTextBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ─── Fields Card ───────────────────────────────────────────────────────────
  fieldsCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  fieldLeft: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginBottom: 3,
    includeFontPadding: false,
  },
  fieldValue: {
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    includeFontPadding: false,
  },
  fieldRightWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeVerified: {
    backgroundColor: COLORS.greenLight,
  },
  badgeUnverified: {
    backgroundColor: COLORS.redLight,
  },
  badgeText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  badgeTextVerified: {
    color: COLORS.green,
  },
  badgeTextUnverified: {
    color: COLORS.red,
  },
  badgeUnlinked: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextUnlinked: {
    color: '#D97706',
  },
  fieldValueUnset: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  emailFieldContainer: {
    paddingVertical: 15,
  },
  emailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emailValueFullWidth: {
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    includeFontPadding: false,
  },

  // ─── Action Modal Styles (Quản lý Email & SĐT) ─────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  modalIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  modalInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
  },
  modalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSub,
  },
  modalInfoValue: {
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    letterSpacing: 0.2,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    gap: 4,
  },
  modalBadgeVerified: {
    backgroundColor: COLORS.greenLight,
  },
  modalBadgeUnverified: {
    backgroundColor: '#FEF3C7',
  },
  modalBadgeText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  modalBadgeTextVerified: {
    color: COLORS.green,
  },
  modalBadgeTextUnverified: {
    color: '#D97706',
  },
  modalActionGroup: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 15.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  modalSecondaryBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  modalCloseBtn: {
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  modalCloseBtnText: {
    color: COLORS.textSub,
    fontSize: 14.5,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },

  // ─── OTP Modal Specific Styles ──────────────────────────────────────────────
  emailHighlightText: {
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 18,
    paddingHorizontal: 4,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    ...(Platform.OS === 'web'
      ? {
        outlineStyle: 'none',
        textAlign: 'center',
        lineHeight: '48px',
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
    marginBottom: 14,
  },
  errorOtpText: {
    color: COLORS.red,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  resendOtpBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  resendOtpBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  resendOtpBtnActive: {
    backgroundColor: '#EBF5FF',
  },
  resendOtpText: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
  },
  resendOtpTextDisabled: {
    color: '#94A3B8',
  },
  resendOtpTextActive: {
    color: COLORS.primary,
  },
  modalBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
});
