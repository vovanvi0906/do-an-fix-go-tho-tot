import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
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
  primaryNavy: '#0A2540',
  white: '#FFFFFF',
  bgGray: '#F8FAFC',
  borderGray: '#E2E8F0',
  textDark: '#0F172A',
  textSub: '#64748B',
  green: '#10B981',
  greenLight: '#ECFDF5',
  red: '#EF4444',
  redLight: '#FEF2F2',
  modalOverlay: 'rgba(15, 23, 42, 0.5)',
};

export default function CustomerWalletScreen() {
  const router = useRouter();

  // ─── Font Loading ──────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [balance, setBalance] = useState(850000);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Danh sách phương thức thanh toán chuẩn Image 3
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'mb_bank',
      name: 'MB Bank •••• 6868',
      subtitle: 'VietQR / Ngân hàng',
      type: 'bank',
      iconColor: '#0084FF',
      bgColor: '#EBF5FF',
    },
    {
      id: 'momo_wallet',
      name: 'Ví MoMo',
      subtitle: 'Đã liên kết',
      type: 'momo',
      iconColor: '#A50064',
      bgColor: '#FDF2F8',
    },
  ]);

  // Danh sách giao dịch gần đây chuẩn Image 3
  const [transactions, setTransactions] = useState([
    {
      id: 'tx_1',
      title: 'Sửa rò rỉ nước',
      time: 'Hôm nay, 10:24',
      amount: -250000,
      icon: 'construct-outline',
      iconType: 'ion',
      iconColor: '#0F172A',
      iconBg: '#F1F5F9',
    },
    {
      id: 'tx_2',
      title: 'Nạp tiền MB Bank',
      time: '20/09/2026, 18:42',
      amount: 500000,
      icon: 'wallet-outline',
      iconType: 'ion',
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
    },
    {
      id: 'tx_3',
      title: 'Vệ sinh máy lạnh',
      time: '18/09/2026, 09:15',
      amount: -320000,
      icon: 'person-outline',
      iconType: 'ion',
      iconColor: '#EAB308',
      iconBg: '#FEFCE8',
    },
  ]);

  // Nạp tiền
  const handleDeposit = () => {
    const num = parseInt(depositAmount.replace(/\D/g, ''), 10);
    if (!num || num < 10000) {
      Alert.alert('Thông báo', 'Số tiền nạp tối thiểu là 10.000 đ');
      return;
    }

    const newBalance = balance + num;
    setBalance(newBalance);
    setTransactions([
      {
        id: `tx_${Date.now()}`,
        title: 'Nạp tiền MB Bank',
        time: 'Vừa xong',
        amount: num,
        icon: 'wallet-outline',
        iconType: 'ion',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
      },
      ...transactions,
    ]);

    setShowDepositModal(false);
    setDepositAmount('');
    Alert.alert('Nạp tiền thành công', `Đã nạp ${num.toLocaleString('vi-VN')} đ vào ví FixGo!`);
  };

  // Rút tiền
  const handleWithdraw = () => {
    const num = parseInt(withdrawAmount.replace(/\D/g, ''), 10);
    if (!num || num < 20000) {
      Alert.alert('Thông báo', 'Số tiền rút tối thiểu là 20.000 đ');
      return;
    }
    if (num > balance) {
      Alert.alert('Số dư không đủ', `Số dư khả dụng của bạn là ${balance.toLocaleString('vi-VN')} đ.`);
      return;
    }

    const newBalance = balance - num;
    setBalance(newBalance);
    setTransactions([
      {
        id: `tx_${Date.now()}`,
        title: 'Rút tiền về MB Bank',
        time: 'Vừa xong',
        amount: -num,
        icon: 'arrow-up-circle-outline',
        iconType: 'ion',
        iconColor: '#0F172A',
        iconBg: '#F1F5F9',
      },
      ...transactions,
    ]);

    setShowWithdrawModal(false);
    setWithdrawAmount('');
    Alert.alert('Rút tiền thành công', `Đã chuyển ${num.toLocaleString('vi-VN')} đ về tài khoản MB Bank.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* ═════════════════════════════════════════════════════════════════════
          HEADER BAR: Nút quay lại ←, Tiêu đề "Ví của tôi", Icon cài đặt ⚙️
         ═════════════════════════════════════════════════════════════════════ */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Ví của tôi</Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() =>
            Alert.alert(
              'Cài đặt ví',
              'Quản lý hạn mức thanh toán, đổi mã PIN ví và sao kê giao dịch.',
              [{ text: 'Đóng', style: 'cancel' }]
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={21} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            PHẦN 1: THẺ SỐ DƯ VÍ KHẢ DỤNG (Gradient Xanh Dương + 3 Nút Bấm)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>

          <View style={styles.balanceValueRow}>
            <Text style={styles.balanceAmountText}>
              {isBalanceHidden
                ? '•••••••• đ'
                : `${balance.toLocaleString('vi-VN')} đ`}
            </Text>

            <TouchableOpacity
              onPress={() => setIsBalanceHidden(!isBalanceHidden)}
              activeOpacity={0.7}
              style={styles.eyeToggleBtn}
            >
              <Ionicons
                name={isBalanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="rgba(255, 255, 255, 0.9)"
              />
            </TouchableOpacity>
          </View>

          {/* 3 Nút Bấm Thao Tác Tròn Bo Góc Trong Suốt */}
          <View style={styles.balanceActionsRow}>
            {/* Nút 1: + Nạp tiền */}
            <TouchableOpacity
              style={styles.translucentActionBtn}
              activeOpacity={0.8}
              onPress={() => setShowDepositModal(true)}
            >
              <Ionicons name="add" size={17} color={COLORS.white} />
              <Text style={styles.translucentActionText}>Nạp tiền</Text>
            </TouchableOpacity>

            {/* Nút 2: ↗ Rút tiền */}
            <TouchableOpacity
              style={styles.translucentActionBtn}
              activeOpacity={0.8}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Ionicons name="arrow-up" size={16} color={COLORS.white} style={{ transform: [{ rotate: '45deg' }] }} />
              <Text style={styles.translucentActionText}>Rút tiền</Text>
            </TouchableOpacity>

            {/* Nút 3: [ ] Quét QR */}
            <TouchableOpacity
              style={styles.translucentActionBtn}
              activeOpacity={0.8}
              onPress={() => setShowQrModal(true)}
            >
              <Ionicons name="qr-code-outline" size={16} color={COLORS.white} />
              <Text style={styles.translucentActionText}>Quét QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            PHẦN 2: PHƯƠNG THỨC THANH TOÁN (Payment Methods)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.methodsCard}>
          <Text style={styles.cardSectionTitle}>Phương thức thanh toán</Text>

          {paymentMethods.map((method, index) => (
            <React.Fragment key={method.id}>
              <TouchableOpacity
                style={styles.methodItemRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    'Chi tiết phương thức',
                    `Phương thức: ${method.name}\nTrạng thái: ${method.subtitle}`
                  )
                }
              >
                <View style={styles.methodItemLeft}>
                  {method.type === 'bank' ? (
                    <View style={[styles.methodIconWrapper, { backgroundColor: '#EBF5FF' }]}>
                      <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                    </View>
                  ) : (
                    <View style={[styles.methodIconWrapper, { backgroundColor: '#A50064' }]}>
                      <Text style={styles.momoIconText}>M</Text>
                    </View>
                  )}

                  <View style={styles.methodInfoCol}>
                    <Text style={styles.methodNameText}>{method.name}</Text>
                    <Text style={styles.methodSubText}>{method.subtitle}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.divider} />
            </React.Fragment>
          ))}

          {/* Nút "+ Thêm phương thức mới" */}
          <TouchableOpacity
            style={styles.addMethodRow}
            activeOpacity={0.7}
            onPress={() => setShowAddMethodModal(true)}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.addMethodLabel}>Thêm phương thức mới</Text>
          </TouchableOpacity>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            PHẦN 3: GIAO DỊCH GẦN ĐÂY (Recent Transactions)
           ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.txSectionHeader}>
          <Text style={styles.txSectionTitle}>Giao dịch gần đây</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Lịch sử giao dịch', 'Hiển thị toàn bộ 24 giao dịch gần nhất của ví FixGo.')
            }
          >
            <Text style={styles.viewAllLink}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txCardContainer}>
          {transactions.map((tx, index) => {
            const isPositive = tx.amount > 0;
            return (
              <React.Fragment key={tx.id}>
                <View style={styles.txItemRow}>
                  <View style={styles.txItemLeft}>
                    <View style={[styles.txAvatarBox, { backgroundColor: tx.iconBg }]}>
                      <Ionicons name={tx.icon} size={20} color={tx.iconColor} />
                    </View>
                    <View>
                      <Text style={styles.txItemTitle}>{tx.title}</Text>
                      <Text style={styles.txItemTime}>{tx.time}</Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.txItemAmount,
                      isPositive ? styles.txAmountGreen : styles.txAmountRed,
                    ]}
                  >
                    {isPositive
                      ? `+${tx.amount.toLocaleString('vi-VN')} đ`
                      : `${tx.amount.toLocaleString('vi-VN')} đ`}
                  </Text>
                </View>

                {index < transactions.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL: NẠP TIỀN
         ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDepositModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContentCard}
            activeOpacity={1}
            onPress={(e) => {
              if (Platform.OS === 'web') e?.stopPropagation?.();
            }}
          >
            <Text style={styles.modalTitle}>Nạp tiền vào ví FixGo</Text>
            <Text style={styles.modalDesc}>
              Nhập số tiền muốn nạp từ ngân hàng đã liên kết (MB Bank):
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="VD: 500000"
              keyboardType="number-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
              autoFocus
            />

            <View style={styles.chipsRow}>
              {['100000', '200000', '500000', '1000000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.chipBtn}
                  onPress={() => setDepositAmount(amt)}
                >
                  <Text style={styles.chipText}>+{parseInt(amt, 10) / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDepositModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleDeposit}
              >
                <Text style={styles.modalSubmitText}>Xác nhận nạp</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL: RÚT TIỀN
         ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWithdrawModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContentCard}
            activeOpacity={1}
            onPress={(e) => {
              if (Platform.OS === 'web') e?.stopPropagation?.();
            }}
          >
            <Text style={styles.modalTitle}>Rút tiền về MB Bank</Text>
            <Text style={styles.modalDesc}>
              Số dư khả dụng: {balance.toLocaleString('vi-VN')} đ
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nhập số tiền cần rút"
              keyboardType="number-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleWithdraw}
              >
                <Text style={styles.modalSubmitText}>Xác nhận rút</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL: QUÉT QR THANH TOÁN
         ═════════════════════════════════════════════ */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQrModal(false)}
        >
          <View style={styles.qrModalCard}>
            <Ionicons name="qr-code" size={140} color={COLORS.textDark} />
            <Text style={styles.qrTitle}>Quét mã QR thợ hoặc hóa đơn</Text>
            <Text style={styles.qrDesc}>
              Hướng camera về mã VietQR hoặc mã FixGo Pay của thợ để thanh toán an toàn.
            </Text>
            <TouchableOpacity
              style={styles.qrCloseBtn}
              onPress={() => setShowQrModal(false)}
            >
              <Text style={styles.qrCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL: THÊM PHƯƠNG THỨC MỚI
         ═════════════════════════════════════════════ */}
      <Modal
        visible={showAddMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMethodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddMethodModal(false)}
        >
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitle}>Thêm phương thức mới</Text>
            <Text style={styles.modalDesc}>Chọn loại liên kết tài khoản:</Text>

            <TouchableOpacity
              style={styles.selectMethodOption}
              onPress={() => {
                setShowAddMethodModal(false);
                Alert.alert('Thành công', 'Đã liên kết thêm tài khoản Vietcombank thành công!');
              }}
            >
              <Ionicons name="business-outline" size={22} color={COLORS.primary} />
              <Text style={styles.selectMethodText}>Tài khoản / Thẻ ngân hàng nội địa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectMethodOption}
              onPress={() => {
                setShowAddMethodModal(false);
                Alert.alert('Thành công', 'Đã liên kết ví ZaloPay thành công!');
              }}
            >
              <Ionicons name="wallet-outline" size={22} color="#0068FF" />
              <Text style={styles.selectMethodText}>Ví điện tử ZaloPay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectMethodOption}
              onPress={() => {
                setShowAddMethodModal(false);
                Alert.alert('Thành công', 'Đã liên kết thẻ Visa / Mastercard thành công!');
              }}
            >
              <Ionicons name="card-outline" size={22} color="#F59E0B" />
              <Text style={styles.selectMethodText}>Thẻ Quốc tế (Visa / Mastercard)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowAddMethodModal(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES – Khớp 100% Giao diện Image 3 Ví FixGo / Ví của tôi
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    includeFontPadding: false,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ─── 1. Thẻ Số dư khả dụng (Gradient Xanh) ──────────────────────────────────
  balanceCard: {
    width: '100%',
    backgroundColor: '#0070EB',
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#0070EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 8,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 10,
  },
  balanceAmountText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  eyeToggleBtn: {
    padding: 4,
  },
  balanceActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  translucentActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    gap: 4,
  },
  translucentActionText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    includeFontPadding: false,
  },

  // ─── 2. Phương thức thanh toán Card ─────────────────────────────────────────
  methodsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 14,
    includeFontPadding: false,
  },
  methodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  methodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momoIconText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  methodInfoCol: {
    justifyContent: 'center',
  },
  methodNameText: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    includeFontPadding: false,
  },
  methodSubText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginTop: 2,
    includeFontPadding: false,
  },
  addMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMethodLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.primary,
    includeFontPadding: false,
  },

  // ─── 3. Giao dịch gần đây Section ──────────────────────────────────────────
  txSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  txSectionTitle: {
    fontSize: 15.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    includeFontPadding: false,
  },
  viewAllLink: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: COLORS.primary,
    includeFontPadding: false,
  },
  txCardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  txItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  txItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txItemTitle: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
    includeFontPadding: false,
  },
  txItemTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    includeFontPadding: false,
  },
  txItemAmount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    includeFontPadding: false,
  },
  txAmountGreen: {
    color: '#10B981',
  },
  txAmountRed: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // ─── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    marginBottom: 16,
  },
  modalInput: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  chipBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.primary,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.textSub,
  },
  modalSubmitBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.white,
  },

  // QR Modal
  qrModalCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 30,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    width: '85%',
  },
  qrTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: COLORS.textDark,
    marginTop: 18,
    marginBottom: 6,
    textAlign: 'center',
  },
  qrDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  qrCloseBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCloseText: {
    color: COLORS.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14.5,
  },

  // Select method options
  selectMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  selectMethodText: {
    fontSize: 14.5,
    fontFamily: 'Inter_500Medium',
    color: COLORS.textDark,
  },
});
