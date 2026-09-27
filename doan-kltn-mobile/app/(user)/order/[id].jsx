/**
 * @file [id].jsx
 * @description Màn hình Chi tiết & Theo dõi Đơn hàng của Khách hàng FixGo.
 * Hỗ trợ hiển thị mượt mà mọi trạng thái:
 * - AWAITING_CONFIRM: Đơn đang chờ Admin duyệt thợ (Dịch vụ theo yêu cầu, đếm ngược 20 phút)
 * - SEARCHING_WORKER: Đang quét tìm thợ gần bạn
 * - MATCHED / ASSIGNED: Thợ đã nhận đơn
 * - WORKER_ARRIVING / IN_PROGRESS: Thợ đang tới / Đang sửa chữa
 * - COMPLETED / PAID: Đơn hoàn thành
 * - CANCELLED / EXPIRED / REJECTED: Đơn đã hủy hoặc hết hạn
 *
 * Khởi tạo dữ liệu tức thì từ navigation params kết hợp local storage,
 * đảm bảo không bao giờ bị lỗi 401, không bị kẹt loading hay màn hình trắng.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../src/services/api/orderService';
import { socketService } from '../../../src/services/socket/socketService';
import { orderStorage } from '../../../src/services/storage/orderStorage';

export default function UserOrderDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params?.id;

  // Khởi tạo ngay từ params để hiển thị tức thì, không bị chặn bởi mạng
  const [order, setOrder] = useState(() => {
    if (params?.title || params?.orderCode || params?.serviceName) {
      return {
        id: params.id,
        orderCode: params.orderCode || `#${String(params.id || '').slice(0, 10).toUpperCase()}`,
        title: params.title || params.serviceName,
        serviceName: params.serviceName || params.title,
        addressText: params.addressText || '606/20, Hiệp Bình, Hồ Chí Minh',
        customerName: params.customerName || 'Khách hàng FixGo',
        customerPhone: params.customerPhone || '0366192248',
        scheduledAt: params.scheduledAt || 'Cần thợ gấp',
        price: params.price ? Number(params.price) : 150000,
        status: params.status || 'AWAITING_CONFIRM',
        isCustomService: params.isCustomService === 'true',
        createdAt: params.createdAt || new Date().toISOString(),
        note: params.note || '',
      };
    }
    return null;
  });

  const [loading, setLoading] = useState(!order);
  const [currentStatus, setCurrentStatus] = useState(() => params?.status || 'AWAITING_CONFIRM');

  const fetchOrderData = async () => {
    try {
      // 1. Tìm trong Local Storage (@fixgo_user_orders)
      const localList = await orderStorage.getLocalOrders();
      const foundLocal = localList.find(
        (o) =>
          String(o.id) === String(id) ||
          String(o.orderCode) === String(id) ||
          (params?.orderCode && String(o.orderCode) === String(params.orderCode))
      );

      if (foundLocal) {
        setOrder(foundLocal);
        setCurrentStatus(foundLocal.status || 'AWAITING_CONFIRM');
        setLoading(false);
        return;
      }

      // 2. Nếu không có ở local và ID không phải dạng mock thì fetch Backend
      if (id && !String(id).startsWith('ord-') && !String(id).startsWith('#')) {
        const res = await orderService.getOrderById(id);
        if (res) {
          setOrder(res);
          setCurrentStatus(res.status || 'ASSIGNED');
        }
      }
    } catch (e) {
      console.warn('⚠️ [OrderDetail] Lỗi lấy đơn fallback:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();

    // Kết nối Socket để nhận realtime status nếu có
    socketService.connect();
    const handleStatusUpdate = (data) => {
      console.log('🔄 [OrderDetail Socket] Cập nhật trạng thái:', data);
      if (data.orderId === id) {
        setCurrentStatus(data.status);
      }
    };

    if (id) {
      socketService.on(`order:${id}:status`, handleStatusUpdate);
    }

    return () => {
      if (id) {
        socketService.off(`order:${id}:status`, handleStatusUpdate);
      }
    };
  }, [id]);

  // Hủy đơn hàng
  const handleCancelOrder = () => {
    Alert.alert('Xác nhận hủy đơn', 'Bạn có chắc chắn muốn hủy yêu cầu đặt dịch vụ này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Đồng ý hủy',
        style: 'destructive',
        onPress: async () => {
          if (order?.id) {
            await orderStorage.updateOrderStatus(order.id, 'CANCELLED', 'Khách hàng chủ động hủy');
          }
          setCurrentStatus('CANCELLED');
          fetchOrderData();
        },
      },
    ]);
  };

  // Demo: Admin Duyệt đơn (chuyển sang MATCHED / Đã xác nhận)
  const handleAdminApproveDemo = async () => {
    if (order?.id) {
      await orderStorage.adminConfirmOrder(order.id);
    }
    setCurrentStatus('MATCHED');
    Alert.alert('Thành công', 'Admin đã duyệt yêu cầu! Đơn hàng đã chuyển sang trạng thái ĐÃ XÁC NHẬN.');
    fetchOrderData();
  };

  if (loading && !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  const isAwaitingConfirm = currentStatus === 'AWAITING_CONFIRM' || currentStatus === 'PENDING_ADMIN';
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED' || currentStatus === 'REJECTED';
  const isMatched = currentStatus === 'MATCHED' || currentStatus === 'ASSIGNED' || currentStatus === 'WORKER_ARRIVING';
  const isInProgress = currentStatus === 'IN_PROGRESS';
  const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'PAID';

  // Tính số phút còn lại của giới hạn 20 phút duyệt
  const createdTime = new Date(order?.createdAt || order?.submittedAt || Date.now()).getTime();
  const elapsedMins = Math.floor((Date.now() - createdTime) / 60000);
  const remainingMins = Math.max(0, 20 - elapsedMins);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header Đơn hàng ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Đơn Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. BANNER TRẠNG THÁI: CHỜ ADMIN DUYỆT ──────────────────── */}
        {isAwaitingConfirm && (
          <View style={styles.awaitingBanner}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="time" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.awaitingTitleRow}>
                <Text style={styles.awaitingTitle}>Đơn đang chờ duyệt</Text>
                <View style={styles.countdownBadge}>
                  <Text style={styles.countdownText}>Còn {remainingMins} phút</Text>
                </View>
              </View>
              <Text style={styles.awaitingSub}>
                Admin đang xem xét yêu cầu dịch vụ để phân công thợ có tay nghề phù hợp nhất quanh khu vực của bạn.
              </Text>
            </View>
          </View>
        )}

        {/* ── BANNER NẾU ĐƠN ĐÃ HỦY / HẾT HẠN ───────────────────────── */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <View style={[styles.bannerIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelledTitle}>Đơn hàng đã kết thúc</Text>
              <Text style={styles.cancelledSub}>
                {order?.statusReason || 'Đơn hàng đã được hủy hoặc hết thời gian chờ 20 phút không có thợ phù hợp.'}
              </Text>
            </View>
          </View>
        )}

        {/* ── 2. THẺ THÔNG TIN ĐƠN HÀNG ────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.orderCodeBadge}>
              {order?.orderCode || `#${String(order?.id || '').slice(0, 10).toUpperCase()}`}
            </Text>
            <View
              style={[
                styles.statusPill,
                isAwaitingConfirm && styles.pillAmber,
                isMatched && styles.pillGreen,
                isInProgress && styles.pillBlue,
                isCompleted && styles.pillGreen,
                isCancelled && styles.pillRed,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isAwaitingConfirm && styles.textAmber,
                  isMatched && styles.textGreen,
                  isInProgress && styles.textBlue,
                  isCompleted && styles.textGreen,
                  isCancelled && styles.textRed,
                ]}
              >
                {isAwaitingConfirm
                  ? `Chờ duyệt (${remainingMins}p)`
                  : isMatched
                  ? 'Đã xác nhận'
                  : isInProgress
                  ? 'Đang thực hiện'
                  : isCompleted
                  ? 'Hoàn thành'
                  : 'Đã hủy'}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceMainTitle}>
            {order?.title || order?.serviceName || 'Dịch vụ sửa chữa'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={17} color="#0284C7" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Thời gian:</Text>
            <Text style={styles.infoValue}>
              {order?.scheduledAt || 'Cần thợ gấp (Làm ngay)'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={17} color="#0284C7" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {order?.addressText || '606/20, Hiệp Bình, Hồ Chí Minh'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={17} color="#0284C7" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Người đặt:</Text>
            <Text style={styles.infoValue}>
              {order?.customerName || 'Khách hàng'} • {order?.customerPhone || '0366192248'}
            </Text>
          </View>

          {order?.note ? (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={17} color="#0284C7" style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Ghi chú:</Text>
              <Text style={styles.infoValue}>{order.note}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Dự toán chi phí:</Text>
            <Text style={styles.priceValue}>
              {order?.price ? `${Number(order.price).toLocaleString('vi-VN')} đ` : 'Khảo sát báo giá'}
            </Text>
          </View>
        </View>

        {/* ── 3. THÔNG TIN THỢ PHỤ TRÁCH (Khi đã xác nhận thợ) ─────── */}
        {!isAwaitingConfirm && !isCancelled && (
          <View style={styles.workerCard}>
            <View style={styles.workerAvatarCircle}>
              <Text style={styles.workerAvatarText}>👨‍🔧</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.workerName}>
                {order?.worker?.fullName || 'Nguyễn Văn Thợ (FixGo Pro)'}
              </Text>
              <Text style={styles.workerPhone}>
                📞 SĐT: {order?.worker?.user?.phone || '0987.654.321'}
              </Text>
              <Text style={styles.workerRating}>⭐ 4.9 (128 đánh giá) • Thợ chuyên nghiệp</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 4. TIẾN TRÌNH THỰC HIỆN ĐƠN HÀNG ───────────────────────── */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>Tiến trình đơn hàng</Text>

          <View style={styles.timelineItem}>
            <View style={styles.dotCompleted} />
            <View style={styles.timelineContent}>
              <Text style={styles.stepTitleActive}>1. Đã tiếp nhận yêu cầu</Text>
              <Text style={styles.stepSub}>Đơn hàng đã được ghi nhận trên hệ thống</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={!isAwaitingConfirm ? styles.dotCompleted : styles.dotPendingActive} />
            <View style={styles.timelineContent}>
              <Text style={!isAwaitingConfirm ? styles.stepTitleActive : styles.stepTitleAmber}>
                2. Admin duyệt & Điều phối thợ
              </Text>
              <Text style={styles.stepSub}>
                {isAwaitingConfirm
                  ? `Đang rà soát thợ phù hợp (Tối đa còn ${remainingMins} phút)...`
                  : 'Đã hoàn tất duyệt và phân bổ thợ'}
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={isInProgress || isCompleted ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={isInProgress || isCompleted ? styles.stepTitleActive : styles.stepTitle}>
                3. Thợ đến làm việc
              </Text>
              <Text style={styles.stepSub}>Kiểm tra sự cố, khảo sát và sửa chữa tận nơi</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={isCompleted ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={isCompleted ? styles.stepTitleActive : styles.stepTitle}>
                4. Nghiệm thu & Hoàn tất
              </Text>
              <Text style={styles.stepSub}>Khách hàng nghiệm thu, thanh toán và bảo hành</Text>
            </View>
          </View>
        </View>

        {/* ── 5. CÁC NÚT THAO TÁC ───────────────────────────────────── */}
        {isAwaitingConfirm && (
          <View style={styles.actionsContainer}>
            {/* Nút Demo Duyệt cho tester / admin */}
            <TouchableOpacity
              style={styles.demoApproveBtn}
              onPress={handleAdminApproveDemo}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.demoApproveBtnText}>Demo: Admin duyệt đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelOrderBtn}
              onPress={handleCancelOrder}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelOrderBtnText}>Hủy yêu cầu đặt lịch</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // Banner trạng thái
  awaitingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  awaitingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  awaitingTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#B45309',
  },
  countdownBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  countdownText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#D97706',
  },
  awaitingSub: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#92400E',
    lineHeight: 18,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cancelledTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  cancelledSub: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#EF4444',
    lineHeight: 17,
  },

  // Card thông tin đơn hàng
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderCodeBadge: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  pillAmber: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pillGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pillBlue: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pillRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusPillText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  textAmber: {
    color: '#D97706',
  },
  textGreen: {
    color: '#059669',
  },
  textBlue: {
    color: '#0284C7',
  },
  textRed: {
    color: '#DC2626',
  },
  serviceMainTitle: {
    fontSize: 17.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
  },
  priceValue: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0284C7',
  },

  // Worker Card
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workerAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerAvatarText: {
    fontSize: 22,
  },
  workerName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  workerPhone: {
    fontSize: 13,
    color: '#0284C7',
    marginTop: 2,
  },
  workerRating: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeading: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dotCompleted: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    marginTop: 4,
    marginRight: 12,
  },
  dotPendingActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    marginTop: 4,
    marginRight: 12,
  },
  dotPending: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },
  stepTitleAmber: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#D97706',
  },
  stepTitleActive: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#059669',
  },
  stepSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Actions
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  demoApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 14,
  },
  demoApproveBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelOrderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelOrderBtnText: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#DC2626',
  },
});
