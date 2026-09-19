import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../src/services/api/orderService';
import { socketService } from '../../../src/services/socket/socketService';
import { useAuth } from '../../../src/features/auth';

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [isOnline, setIsOnline] = useState(true);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [isAccepting, setIsAccepting] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    // 1. Kết nối Socket.IO
    socketService.connect();

    // 2. Lắng nghe đơn hàng mới được broadcast tới thợ (order.new)
    const handleNewOrder = (orderData) => {
      console.log('🔔 [Worker Socket] Có đơn hàng mới phát sóng:', orderData);
      if (isOnline) {
        setIncomingOrder(orderData);
        setCountdown(orderData.countdownSeconds || 30);
        setConflictMessage('');
      }
    };

    // 3. Lắng nghe sự kiện đơn bị người khác nhận (order.taken)
    const handleOrderTaken = (data) => {
      console.log('ℹ️ [Worker Socket] Đơn hàng đã có người nhận:', data);
      if (incomingOrder && incomingOrder.orderId === data.orderId) {
        setConflictMessage('Đơn hàng đã có thợ khác nhận!');
        setTimeout(() => {
          setIncomingOrder(null);
          setConflictMessage('');
        }, 2000);
      }
    };

    socketService.on('order.new', handleNewOrder);
    socketService.on('order.taken', handleOrderTaken);

    return () => {
      socketService.off('order.new', handleNewOrder);
      socketService.off('order.taken', handleOrderTaken);
    };
  }, [isOnline, incomingOrder]);

  // Bộ đếm ngược 30 giây cho đơn hàng đến
  useEffect(() => {
    let timer;
    if (incomingOrder && countdown > 0 && !conflictMessage) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIncomingOrder(null); // Tự động đóng popup khi hết giờ
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingOrder, countdown, conflictMessage]);

  // Xử lý sự kiện Thợ bấm Nhận đơn
  const handleAcceptOrder = async () => {
    if (!incomingOrder) return;
    setIsAccepting(true);
    setConflictMessage('');

    try {
      console.log(`⚡ [Worker] Gửi yêu cầu nhận đơn #${incomingOrder.orderId}`);
      const res = await orderService.acceptOrder(incomingOrder.orderId);

      console.log('🎉 [Worker] Nhận đơn thành công 200 OK:', res);
      setActiveOrder(res.order || incomingOrder);
      setIncomingOrder(null);
    } catch (error) {
      console.error('❌ [Worker Accept Error]:', error.message);
      // BẮT LỖI TRANH CHẤP RACE CONDITION (HTTP 409 Conflict)
      const errorMsg = error.message.includes('409') || error.message.includes('thợ khác nhận')
        ? 'Đơn đã có người nhận'
        : (error.message || 'Không thể nhận đơn');

      setConflictMessage(errorMsg);

      // Tự động đóng popup sau 2 giây
      setTimeout(() => {
        setIncomingOrder(null);
        setConflictMessage('');
      }, 2500);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Thợ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào, {user?.fullName || 'Thợ đối tác'} 👋</Text>
          <Text style={styles.subText}>Khu vực hoạt động: TP. Hồ Chí Minh</Text>
        </View>

        {/* Nút Bật/Tắt Trực Tuyến */}
        <View style={styles.onlineToggleBox}>
          <Text style={isOnline ? styles.onlineText : styles.offlineText}>
            {isOnline ? 'ĐANG BẬT NHẬN ĐƠN' : 'TẠM NGHỈ'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
            thumbColor={isOnline ? '#16A34A' : '#94A3B8'}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Trạng thái */}
        <View style={isOnline ? styles.bannerOnline : styles.bannerOffline}>
          <Ionicons
            name={isOnline ? 'radio' : 'pause-circle'}
            size={24}
            color={isOnline ? '#16A34A' : '#64748B'}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={isOnline ? styles.bannerTitleOnline : styles.bannerTitleOffline}>
              {isOnline
                ? 'Sẵn sàng nhận cuốc trong bán kính 5km'
                : 'Đang tắt nhận việc. Bật công tắc để nhận đơn mới'}
            </Text>
            <Text style={styles.bannerSub}>
              {isOnline ? 'Tín hiệu GPS & WebSocket đang hoạt động' : 'Hệ thống sẽ không quét đơn gửi tới bạn'}
            </Text>
          </View>
        </View>

        {/* Đơn hàng đang thực hiện (nếu có) */}
        {activeOrder ? (
          <View style={styles.activeOrderCard}>
            <View style={styles.activeOrderHeader}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ĐƠN ĐANG THỰC HIỆN</Text>
              </View>
              <Text style={styles.activeOrderPrice}>
                {Number(activeOrder.totalPrice || 150000).toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <Text style={styles.activeServiceName}>
              {activeOrder.service?.name || 'Sửa chữa điện gia dụng'}
            </Text>
            <Text style={styles.activeAddress}>📍 {activeOrder.pickupAddress || 'Địa chỉ khách hàng'}</Text>

            <TouchableOpacity
              style={styles.viewOrderDetailBtn}
              onPress={() => router.push(`/job/${activeOrder.id || activeOrder.orderId}`)}
            >
              <Text style={styles.viewOrderDetailText}>XEM CHI TIẾT & TIẾP NHẬN CÔNG VIỆC</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Thống kê nhanh trong ngày */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Đơn hoàn thành</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>650.000 đ</Text>
            <Text style={styles.statLabel}>Thu nhập hôm nay</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5.0 ⭐</Text>
            <Text style={styles.statLabel}>Điểm đánh giá</Text>
          </View>
        </View>
      </ScrollView>

      {/* POPUP MODAL NHẬN ĐƠN MỚI KÈM BỘ ĐẾM NGƯỢC 30s */}
      <Modal visible={!!incomingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.incomingCard}>
            {/* Header popup */}
            <View style={styles.incomingHeader}>
              <View style={styles.bellBadge}>
                <Ionicons name="notifications" size={24} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.incomingTitle}>CÓ ĐƠN HÀNG MỚI!</Text>
                <Text style={styles.incomingDistance}>
                  Cách bạn ~ {incomingOrder?.distanceKm || '1.2'} km
                </Text>
              </View>
              {/* Vòng đếm ngược */}
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}s</Text>
              </View>
            </View>

            {/* Thông báo tranh chấp 409 Conflict nếu có */}
            {conflictMessage ? (
              <View style={styles.conflictBox}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.conflictText}>{conflictMessage}</Text>
              </View>
            ) : null}

            {/* Chi tiết đơn */}
            <View style={styles.orderDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dịch vụ:</Text>
                <Text style={styles.detailValueBold}>
                  {incomingOrder?.service?.name || 'Sửa chữa điện nước'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thù lao ước tính:</Text>
                <Text style={styles.detailPrice}>
                  {Number(incomingOrder?.totalPrice || 180000).toLocaleString('vi-VN')} đ
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Địa chỉ:</Text>
                <Text style={styles.detailAddress} numberOfLines={2}>
                  {incomingOrder?.pickupAddress || '268 Lý Thường Kiệt, Q.10, TP.HCM'}
                </Text>
              </View>

              {incomingOrder?.note ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ghi chú:</Text>
                  <Text style={styles.detailNote}>{incomingOrder.note}</Text>
                </View>
              ) : null}
            </View>

            {/* Nút Nhận Đơn & Từ Chối */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => setIncomingOrder(null)}
                disabled={isAccepting}
              >
                <Text style={styles.declineText}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={isAccepting ? styles.acceptBtnDisabled : styles.acceptBtn}
                onPress={handleAcceptOrder}
                disabled={isAccepting || !!conflictMessage}
                activeOpacity={0.85}
              >
                {isAccepting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.acceptText}>NHẬN ĐƠN NGAY ({countdown}s)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  onlineToggleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
  },
  bannerOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerTitleOnline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  bannerTitleOffline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  bannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  activeOrderPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16A34A',
  },
  activeServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  activeAddress: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  viewOrderDetailBtn: {
    backgroundColor: '#2563EB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewOrderDetailText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incomingCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  incomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bellBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
  },
  incomingDistance: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  countdownBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  conflictBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  conflictText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  orderDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 100,
  },
  detailValueBold: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  detailPrice: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
    textAlign: 'right',
  },
  detailAddress: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    textAlign: 'right',
  },
  detailNote: {
    flex: 1,
    fontSize: 12,
    color: '#EA580C',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnDisabled: {
    flex: 2,
    backgroundColor: '#86EFAC',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
