import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
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
  const { user, updateUser } = useAuth();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [actionModal, setActionModal] = useState({ visible: false, type: 'email' });

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

  const phone = user?.phone || '0366192248';
  const email = user?.email || 'luhongphucdai@gmail.com';
  const isPhoneVerified = !!(user?.isPhoneVerified ?? user?.phoneVerified ?? true);
  // Trạng thái xác thực email đọc trực tiếp từ dữ liệu User trong Context/PostgreSQL
  const isEmailVerified = !!(user?.isEmailVerified ?? user?.emailVerified);
  const avatarUrl = user?.avatarUrl || user?.customerProfile?.avatarUrl;

  const openActionModal = (type) => {
    setActionModal({ visible: true, type });
  };

  const handleUploadAvatar = () => {
    Alert.alert(
      'Tải ảnh đại diện',
      'Chọn ảnh đại diện mới cho tài khoản FixGo:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt ảnh mẫu chất lượng cao',
          onPress: () => {
            updateUser({
              ...user,
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            });
          },
        },
      ]
    );
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
          >
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={54} color={COLORS.primary} />
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
          >
            <Text style={styles.uploadText}>Tải ảnh lên</Text>
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
            onPress={() => openActionModal('phone')}
          >
            <View style={styles.fieldLeft}>
              <Text style={styles.fieldLabel}>Số điện thoại</Text>
              <Text style={styles.fieldValue}>{phone}</Text>
            </View>
            <View style={styles.fieldRightWithBadge}>
              <View
                style={[
                  styles.badgePill,
                  isPhoneVerified ? styles.badgeVerified : styles.badgeUnverified,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isPhoneVerified ? styles.badgeTextVerified : styles.badgeTextUnverified,
                  ]}
                >
                  {isPhoneVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Field 4: Email */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.7}
            onPress={() => openActionModal('email')}
          >
            <View style={styles.fieldLeft}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{email}</Text>
            </View>
            <View style={styles.fieldRightWithBadge}>
              <View
                style={[
                  styles.badgePill,
                  isEmailVerified ? styles.badgeVerified : styles.badgeUnverified,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isEmailVerified ? styles.badgeTextVerified : styles.badgeTextUnverified,
                  ]}
                >
                  {isEmailVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>
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
                          const targetType = actionModal.type;
                          const targetVal = targetType === 'email' ? email : phone;
                          setActionModal({ ...actionModal, visible: false });
                          router.push({
                            pathname: '/(user)/profile/edit-field',
                            params: { field: targetType, value: targetVal, autoSend: 'true' },
                          });
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
                          router.push({
                            pathname: '/(user)/profile/edit-field',
                            params: { field: targetType, value: '' },
                          });
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
                        const targetVal = targetType === 'email' ? email : phone;
                        setActionModal({ ...actionModal, visible: false });
                        router.push({
                          pathname: '/(user)/profile/edit-field',
                          params: { field: targetType, value: targetVal },
                        });
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
});
