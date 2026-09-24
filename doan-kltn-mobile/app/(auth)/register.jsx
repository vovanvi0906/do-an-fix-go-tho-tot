import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// ─── Design Tokens (Figma FIXGO Brand Palette) ──────────────────────────────
const COLORS = {
  primary: '#0084FF',         // Xanh dương chủ đạo FIXGO
  primaryDark: '#0066CC',
  darkBlue: '#1A365D',
  white: '#FFFFFF',
  bgLight: '#F8FAFC',        // Nền xám nhạt hiện đại
  textDark: '#0F172A',        // Chữ đậm chính
  textSub: '#64748B',         // Chữ phụ
  borderGray: '#E2E8F0',
  // Theme Khách hàng
  customerBg: '#EFF6FF',
  customerBorder: '#BFDBFE',
  customerIconBg: '#DBEAFE',
  customerPrimary: '#1D4ED8',
  // Theme Thợ
  workerBg: '#FFFBEB',
  workerBorder: '#FDE68A',
  workerIconBg: '#FEF3C7',
  workerPrimary: '#B45309',
};

export default function RegisterSelectionScreen() {
  const router = useRouter();

  // ─── Font loading (Inter) ───────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* ── Top Header Navigation ────────────────────────────────────────── */}
        <View style={styles.headerNav}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.brandLogo}>FixGo</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Tiêu đề chính ───────────────────────────────────────────────── */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Tạo tài khoản mới</Text>
            <Text style={styles.subTitle}>
              Vui lòng chọn vai trò bạn muốn tham gia vào hệ sinh thái dịch vụ FIXGO
            </Text>
          </View>

          {/* ── Danh sách lựa chọn vai trò ───────────────────────────────────── */}
          <View style={styles.cardsContainer}>
            {/* THẺ 1: KHÁCH HÀNG (CUSTOMER) */}
            <Link href="/(auth)/register-customer" asChild>
              <TouchableOpacity
                style={[styles.roleCard, styles.customerCard]}
                activeOpacity={0.88}
              >
                {/* Badge góc phải */}
                <View style={styles.badgeCustomer}>
                  <Text style={styles.badgeCustomerText}>DÀNH CHO KHÁCH HÀNG</Text>
                </View>

                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleCustomer}>
                    <Ionicons name="person" size={26} color={COLORS.customerPrimary} />
                  </View>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitleCustomer}>Tôi là Khách hàng</Text>
                    <Text style={styles.cardSlogan}>Cần tìm thợ sửa chữa gia đình</Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>
                  Đặt lịch thợ sửa điện, nước, máy lạnh, khóa, thiết bị gia dụng nhanh chóng và an tâm với thợ đã xác minh.
                </Text>

                <View style={styles.cardActionRow}>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.customerPrimary} />
                      <Text style={styles.benefitText}>Báo giá minh bạch</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.customerPrimary} />
                      <Text style={styles.benefitText}>Bảo hành uy tín</Text>
                    </View>
                  </View>

                  <View style={styles.actionBtnCustomer}>
                    <Text style={styles.actionBtnCustomerText}>Đăng ký ngay</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                  </View>
                </View>
              </TouchableOpacity>
            </Link>

            {/* THẺ 2: THỢ SỬA CHỮA / ĐỐI TÁC (WORKER) */}
            <Link href="/(auth)/register-worker" asChild>
              <TouchableOpacity
                style={[styles.roleCard, styles.workerCard]}
                activeOpacity={0.88}
              >
                {/* Badge góc phải */}
                <View style={styles.badgeWorker}>
                  <Text style={styles.badgeWorkerText}>DÀNH CHO ĐỐI TÁC</Text>
                </View>

                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleWorker}>
                    <MaterialCommunityIcons name="toolbox" size={26} color={COLORS.workerPrimary} />
                  </View>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitleWorker}>Tôi là Thợ sửa chữa</Text>
                    <Text style={styles.cardSlogan}>Gia nhập mạng lưới thợ lành nghề</Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>
                  Nhận đơn sửa chữa trực tiếp từ khách hàng lân cận, linh hoạt thời gian làm việc và tối ưu hóa thu nhập mỗi ngày.
                </Text>

                <View style={styles.cardActionRow}>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.workerPrimary} />
                      <Text style={styles.benefitText}>Nguồn việc dồi dào</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.workerPrimary} />
                      <Text style={styles.benefitText}>Nhận tiền nhanh</Text>
                    </View>
                  </View>

                  <View style={styles.actionBtnWorker}>
                    <Text style={styles.actionBtnWorkerText}>Trở thành Đối tác</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          </View>

          {/* ── Footer Link: Đã có tài khoản? Đăng nhập ───────────────────── */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Bạn đã có tài khoản FixGo? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  safeArea: {
    flex: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  brandLogo: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  customerCard: {
    borderColor: COLORS.customerBorder,
    backgroundColor: COLORS.white,
  },
  workerCard: {
    borderColor: COLORS.workerBorder,
    backgroundColor: COLORS.white,
  },
  badgeCustomer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.customerBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.customerBorder,
  },
  badgeCustomerText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.customerPrimary,
    letterSpacing: 0.5,
  },
  badgeWorker: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.workerBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.workerBorder,
  },
  badgeWorkerText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.workerPrimary,
    letterSpacing: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  iconCircleCustomer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.customerIconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleWorker: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.workerIconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitleBox: {
    flex: 1,
    paddingRight: 80, // chừa chỗ cho badge
  },
  cardTitleCustomer: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  cardTitleWorker: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  cardSlogan: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSub,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    lineHeight: 19,
    marginBottom: 16,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
  },
  actionBtnCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.customerPrimary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnCustomerText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
  },
  actionBtnWorker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.workerPrimary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnWorkerText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.primary,
  },
});
