import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Platform,
  Image,
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

// ─── Design Tokens (Figma FIXGO – Account Customer) ──────────────────────────
const COLORS = {
  primary: '#0084FF',         // Màu xanh dương chủ đạo FixGo
  primaryDark: '#0066CC',
  primaryLight: '#EBF5FF',
  white: '#FFFFFF',
  bgGray: '#F8FAFC',
  borderGray: '#E2E8F0',
  textDark: '#0F172A',
  textSub: '#64748B',
  red: '#EF4444',
  redLight: '#FEF2F2',
  green: '#10B981',
  modalOverlay: 'rgba(15, 23, 42, 0.5)',
};

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ─── Font Loading ──────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Tên hiển thị người dùng
  const displayName =
    user?.fullName ||
    user?.customerProfile?.fullName ||
    'Lu Dai';

  const displayPhone = user?.phone || '0366192248';
  const displayEmail = user?.email || 'luhongphucdai@gmail.com';
  const avatarUrl = user?.avatarUrl || user?.customerProfile?.avatarUrl;

  const handleLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('❌ [Profile Logout Error]:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            PHẦN 1: HEADER AVATAR & THÔNG TIN NGƯỜI DÙNG (Figma FixGo_Home)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.headerProfileSection}>
          <View style={styles.avatarOuterWrapper}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={54} color={COLORS.primary} />
              )}
            </View>
          </View>

          <Text style={styles.userNameText}>{displayName}</Text>
          <Text style={styles.userSubText}>{displayPhone || displayEmail}</Text>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            PHẦN 2: DANH SÁCH MENU TÙY CHỌN (Figma Account - Customer Menu)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.menuContainer}>
          {/* Menu Item 1: Chỉnh sửa thông tin */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(user)/profile/edit')}
          >
            <View style={styles.menuLeftContent}>
              <View style={styles.iconBox}>
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemTitle}>Chỉnh sửa thông tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Menu Item 2: Ví FixGo */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(user)/profile/wallet')}
          >
            <View style={styles.menuLeftContent}>
              <View style={styles.iconBox}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemTitle}>Ví FixGo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Menu Item 3: Mã giảm giá */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(user)/profile/vouchers')}
          >
            <View style={styles.menuLeftContent}>
              <View style={styles.iconBox}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemTitle}>Mã giảm giá</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Menu Item 4: Đăng xuất */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setShowLogoutModal(true)}
          >
            <View style={styles.menuLeftContent}>
              <View style={styles.iconBox}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemTitle}>Đăng xuất</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL: XÁC NHẬN ĐĂNG XUẤT (Figma Logout Confirmation)
         ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => {
              if (Platform.OS === 'web') {
                e?.stopPropagation?.();
              }
            }}
          >
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out" size={28} color={COLORS.red} />
            </View>

            <Text style={styles.modalTitle}>Đăng xuất tài khoản</Text>
            <Text style={styles.modalDesc}>
              Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng FIXGO không?
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmLogoutBtnText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES – Chuẩn xác 100% Figma FIXGO Account Customer (Không bị cắt chữ Android)
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ─── Header Profile ────────────────────────────────────────────────────────
  headerProfileSection: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  avatarOuterWrapper: {
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
  userNameText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  userSubText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
  },

  // ─── Menu Container ────────────────────────────────────────────────────────
  menuContainer: {
    width: '100%',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    width: '100%',
  },
  menuLeftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: COLORS.textDark,
    includeFontPadding: false,
    paddingRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // ─── Modal Xác nhận Đăng xuất ──────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoutIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.redLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textSub,
  },
  confirmLogoutBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutBtnText: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.white,
  },
});
