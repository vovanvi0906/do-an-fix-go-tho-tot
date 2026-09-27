import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const COLORS = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  primaryLight: '#EBF5FF',
  white: '#FFFFFF',
  bgGray: '#F8FAFC',
  borderGray: '#E2E8F0',
  textDark: '#0F172A',
  textSub: '#64748B',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  red: '#EF4444',
  redLight: '#FEF2F2',
  green: '#10B981',
  greenLight: '#ECFDF5',
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',
};

export default function VouchersScreen() {
  const router = useRouter();

  // ─── Font Loading ──────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Các tab phân loại khớp 100% với danh mục dịch vụ thực tế của FixGo
  const tabs = [
    { id: 'all', title: 'Tất cả (5)' },
    { id: 'electric', title: 'Sửa điện' },
    { id: 'plumbing', title: 'Sửa nước' },
    { id: 'aircon', title: 'Điện lạnh' },
    { id: 'lock', title: 'Sửa khóa' },
    { id: 'history', title: 'Lịch sử dùng' },
  ];

  // Danh sách voucher khớp với từng loại dịch vụ FixGo
  const allVouchers = [
    {
      id: 'v1',
      category: 'all',
      badge: 'MỚI',
      badgeColor: COLORS.orange,
      badgeBg: COLORS.orangeLight,
      title: 'Giảm 30% đơn đầu',
      description: 'Áp dụng cho mọi dịch vụ đặt thợ FixGo',
      expiry: 'HSD: 30/10/2026',
      code: 'FIXGO30',
      icon: 'percent',
    },
    {
      id: 'v2',
      category: 'electric',
      badge: 'GIẢM 30K',
      badgeColor: '#F59E0B',
      badgeBg: '#FEF3C7',
      title: 'Sửa chữa điện gia dụng',
      description: 'Đơn sửa chập điện, thay ổ cắm từ 150K',
      expiry: 'HSD: 15/11/2026',
      code: 'DIEN30K',
      icon: 'flash-outline',
    },
    {
      id: 'v3',
      category: 'plumbing',
      badge: 'GIẢM 50K',
      badgeColor: COLORS.red,
      badgeBg: COLORS.redLight,
      title: 'Sửa ống nước & Thiết bị vệ sinh',
      description: 'Áp dụng sửa rò rỉ ống nước, thay vòi sen đơn từ 200K',
      expiry: 'HSD: 20/11/2026',
      code: 'NUOC50K',
      icon: 'water-outline',
    },
    {
      id: 'v4',
      category: 'aircon',
      badge: 'MIỄN PHÍ',
      badgeColor: COLORS.green,
      badgeBg: COLORS.greenLight,
      title: 'Miễn phí công khảo sát máy lạnh',
      description: 'Dành cho gói bảo trì, vệ sinh, nạp gas máy lạnh',
      expiry: 'HSD: Còn 2 ngày',
      code: 'KHAOSAT0D',
      icon: 'snow-outline',
    },
    {
      id: 'v5',
      category: 'lock',
      badge: 'GIẢM 40K',
      badgeColor: COLORS.purple,
      badgeBg: COLORS.purpleLight,
      title: 'Sửa khóa & Mở khóa khẩn cấp',
      description: 'Áp dụng mở khóa cửa, thay ổ khóa nhà, khóa điện tử',
      expiry: 'HSD: 05/12/2026',
      code: 'KHOA40K',
      icon: 'key-outline',
    },
  ];

  // Voucher lịch sử đã dùng
  const historyVouchers = [
    {
      id: 'hv1',
      badge: 'ĐÃ DÙNG',
      badgeColor: '#64748B',
      badgeBg: '#F1F5F9',
      title: 'Ưu đãi chào bạn mới',
      description: 'Đã dùng cho đơn "Sửa rò rỉ nước"',
      expiry: 'Đã dùng: 10/09/2026',
      code: 'WELCOME50K',
    },
  ];

  const getDisplayedVouchers = () => {
    if (activeTab === 'all') return allVouchers;
    if (activeTab === 'history') return historyVouchers;
    return allVouchers.filter((v) => v.category === activeTab);
  };

  const currentVoucherList = getDisplayedVouchers();

  const handleApplyPromoCode = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi');
      return;
    }

    const found = allVouchers.find((v) => v.code === code);
    if (found) {
      Alert.alert('Thành công', `Áp dụng mã ${code} thành công: ${found.title}!`);
      setPromoCodeInput('');
    } else {
      Alert.alert('Thông báo', `Mã "${code}" không hợp lệ hoặc đã hết lượt sử dụng.`);
    }
  };

  const handleUseVoucher = (voucher) => {
    if (activeTab === 'history') {
      Alert.alert('Thông báo', 'Mã giảm giá này đã được sử dụng trước đó.');
      return;
    }

    Alert.alert(
      'Sử dụng ưu đãi',
      `Bạn đã chọn voucher: "${voucher.title}".\nMã ưu đãi sẽ tự động áp dụng khi bạn đặt dịch vụ.`,
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Đặt dịch vụ ngay',
          onPress: () => router.push('/(user)/booking/index'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ═════════════════════════════════════════════════════════════════════
          HEADER BAR: Nút quay lại ← & Tiêu đề "Ưu đãi của tôi"
         ═════════════════════════════════════════════════════════════════════ */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ưu đãi của tôi</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            KHUNG NHẬP MÃ KHUYẾN MÃI (Top Promo Input Box)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.promoInputCard}>
          <View style={styles.promoInputRow}>
            <View style={styles.inputInnerWrapper}>
              <Ionicons name="ticket-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.promoTextInput}
                placeholder="Nhập mã khuyến mãi"
                placeholderTextColor={COLORS.textSub}
                value={promoCodeInput}
                onChangeText={setPromoCodeInput}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.applyBtn,
                !promoCodeInput.trim() && styles.applyBtnDisabled,
              ]}
              onPress={handleApplyPromoCode}
              disabled={!promoCodeInput.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            THANH TAB BỘ LỌC KHỚP VỚI CÁC LOẠI DỊCH VỤ FIXGO
           ═════════════════════════════════════════════════════════════════════ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabPill,
                  isActive && styles.tabPillActive,
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isActive && styles.tabPillTextActive,
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ═════════════════════════════════════════════════════════════════════
            DANH SÁCH THẺ VOUCHER KIỂU VÉ COUPON (Ticket Cutout Design)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.voucherList}>
          {currentVoucherList.length > 0 ? (
            currentVoucherList.map((v) => {
              const isHistory = activeTab === 'history';
              return (
                <View key={v.id} style={[styles.ticketCard, isHistory && styles.ticketCardDisabled]}>
                  {/* Phần bên trái: Badge + Tiêu đề + Hạn dùng */}
                  <View style={styles.ticketLeft}>
                    <View style={styles.ticketTopRow}>
                      <View
                        style={[
                          styles.badgeTag,
                          { backgroundColor: v.badgeBg },
                        ]}
                      >
                        <Text style={[styles.badgeTagText, { color: v.badgeColor }]}>
                          {v.badge}
                        </Text>
                      </View>
                      <Text style={styles.codePill}>{v.code}</Text>
                    </View>

                    <Text style={styles.voucherTitle}>{v.title}</Text>
                    <Text style={styles.voucherDesc}>{v.description}</Text>
                    <Text style={styles.voucherExpiry}>{v.expiry}</Text>
                  </View>

                  {/* Đường cắt vé / Răng cưa khuyết tròn */}
                  <View style={styles.ticketDividerContainer}>
                    <View style={styles.cutoutTop} />
                    <View style={styles.dashedLine} />
                    <View style={styles.cutoutBottom} />
                  </View>

                  {/* Phần bên phải: Nút "Dùng ngay" */}
                  <View style={styles.ticketRight}>
                    <TouchableOpacity
                      style={[styles.useBtn, isHistory && styles.useBtnDisabled]}
                      onPress={() => handleUseVoucher(v)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.useBtnText, isHistory && styles.useBtnTextDisabled]}>
                        {isHistory ? 'Đã dùng' : 'Dùng ngay'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không có ưu đãi nào</Text>
              <Text style={styles.emptySub}>
                Hiện tại chưa có mã giảm giá trong danh mục dịch vụ này.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgGray,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ─── Promo Input Card ──────────────────────────────────────────────────────
  promoInputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputInnerWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promoTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  // ─── Category Tabs ─────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingRight: 16,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  tabPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabPillText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textSub,
    includeFontPadding: false,
  },
  tabPillTextActive: {
    color: COLORS.white,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  // ─── Voucher List & Ticket Card ────────────────────────────────────────────
  voucherList: {
    gap: 14,
  },
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ticketCardDisabled: {
    opacity: 0.7,
  },
  ticketLeft: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeTagText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  codePill: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voucherTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
    includeFontPadding: false,
  },
  voucherDesc: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginBottom: 8,
    lineHeight: 17,
  },
  voucherExpiry: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
  },

  // ─── Ticket Notch / Cutouts & Dashed Divider ───────────────────────────────
  ticketDividerContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: -8,
  },
  cutoutTop: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bgGray,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginTop: -8,
  },
  dashedLine: {
    flex: 1,
    width: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  cutoutBottom: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.bgGray,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: -8,
  },

  // ─── Ticket Right (Dùng ngay Button) ───────────────────────────────────────
  ticketRight: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  useBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  useBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  useBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  useBtnTextDisabled: {
    color: '#94A3B8',
  },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: COLORS.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
  },
});
