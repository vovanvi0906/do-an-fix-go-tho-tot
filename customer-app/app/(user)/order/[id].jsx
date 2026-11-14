// File vượt giới hạn dòng do chứa UI component màn hình theo dõi chi tiết và StyleSheet lớn được kế thừa từ thiết kế gốc của dự án.
/**
 * @file [id].jsx
 * @description Màn hình Chi tiết & Theo dõi Đơn hàng của Khách hàng FixGo.
 * CUS-04: Luôn xác minh quyền và đồng bộ snapshot mới từ GET /orders/:id.
 * Cache theo userId, không dùng params làm nguồn xác thực, xử lý 401, 403, 404, 500, offline.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../src/services/api/orderService';
import { socketService } from '../../../src/services/socket/socketService';
import { routingService } from '../../../src/services/api/routingService';
import WorkerTrackingMapView from '../../../src/components/WorkerTrackingMapView';
import { useOrderDetailSync } from '../../../src/features/orders/hooks/useOrderDetailSync';

export default function UserOrderDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params?.id;

  const { order, loading, refreshing, error, isOffline, refetch } = useOrderDetailSync(id);

  const [workerLocation, setWorkerLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ coordinates: [], formattedEta: '~8 - 12 phút (1.5 km)' });

  useEffect(() => {
    // Lắng nghe vị trí GPS của thợ thời gian thực từ Socket
    const handleLocationUpdate = async (locData) => {
      if (locData && locData.lat && locData.lng) {
        const wCoord = { latitude: Number(locData.lat), longitude: Number(locData.lng) };
        setWorkerLocation(wCoord);

        const cLat = Number(order?.lat || 10.7769);
        const cLng = Number(order?.lng || 106.7009);
        const rData = await routingService.getRoute(wCoord, { latitude: cLat, longitude: cLng });
        if (rData) setRouteInfo(rData);
      }
    };

    socketService.on('worker:location_update', handleLocationUpdate);
    return () => {
      socketService.off('worker:location_update', handleLocationUpdate);
    };
  }, [order?.lat, order?.lng]);

  const handleCancelOrder = () => {
    Alert.alert('Xác nhận hủy đơn', 'Bạn có chắc chắn muốn hủy yêu cầu đặt dịch vụ này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Đồng ý hủy',
        style: 'destructive',
        onPress: async () => {
          if (!order?.id) return;
          try {
            await orderService.cancelOrder(order.id, 'Khách hàng chủ động hủy');
            await refetch();
          } catch (err) {
            Alert.alert('Lỗi', err.message || 'Không thể hủy đơn hàng lúc này');
          }
        },
      },
    ]);
  };

  if (loading && !order) {
    return (
      <View nativeID="order-detail-loading-container" style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (error && !order) {
    const isForbidden = error.status === 403;
    const isNotFound = error.status === 404;
    const isAuth = error.status === 401;
    const isOfflineErr = error.type === 'OFFLINE';

    return (
      <SafeAreaView nativeID="order-detail-error-container" style={styles.centerContainer} edges={['top']}>
        <View style={styles.errorCard}>
          <View style={[styles.errorIconCircle, (isForbidden || isNotFound) && { backgroundColor: '#FEE2E2' }]}>
            <Ionicons
              name={isForbidden ? 'shield-outline' : isNotFound ? 'alert-circle-outline' : isAuth ? 'log-in-outline' : isOfflineErr ? 'cloud-offline-outline' : 'warning-outline'}
              size={36}
              color={isForbidden || isNotFound ? '#DC2626' : '#0284C7'}
            />
          </View>
          <Text style={styles.errorTitle}>
            {isForbidden ? 'Không có quyền truy cập' : isNotFound ? 'Không tìm thấy đơn hàng' : isAuth ? 'Phiên đăng nhập hết hạn' : isOfflineErr ? 'Mất kết nối mạng' : 'Có lỗi xảy ra'}
          </Text>
          <Text style={styles.errorSub}>{error.message || 'Không thể tải thông tin đơn hàng.'}</Text>
          <View style={styles.errorBtnRow}>
            {isAuth ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.primaryBtnText}>Đăng nhập lại</Text>
              </TouchableOpacity>
            ) : (
              <>
                {!isForbidden && !isNotFound && (
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => refetch()}>
                    <Text style={styles.primaryBtnText}>Thử lại</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
                  <Text style={styles.secondaryBtnText}>Quay lại</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <View nativeID="order-detail-empty-container" style={styles.centerContainer}>
        <Text style={styles.loadingText}>Không có dữ liệu đơn hàng.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = String(order?.status || '').toUpperCase();
  const isAwaitingConfirm = status === 'AWAITING_CONFIRM' || status === 'PENDING_ADMIN';
  const isCancelled = status === 'CANCELLED' || status === 'EXPIRED' || status === 'REJECTED';
  const isMatched = status === 'MATCHED' || status === 'ASSIGNED';
  const isEnRoute = status === 'WORKER_EN_ROUTE' || status === 'WORKER_ARRIVING';
  const isArrived = status === 'ARRIVED';
  const isInProgress = status === 'IN_PROGRESS';
  const isAwaitingAcceptance = status === 'AWAITING_ACCEPTANCE' || status === 'AWAITING_CONFIRMATION';
  const isAwaitingPayment = status === 'AWAITING_PAYMENT';
  const isCompleted = status === 'COMPLETED' || status === 'PAID';
  const isDisputed = status === 'DISPUTED';

  const createdTime = new Date(order?.createdAt || order?.submittedAt || Date.now()).getTime();
  const elapsedMins = Math.floor((Date.now() - createdTime) / 60000);
  const remainingMins = Math.max(0, 20 - elapsedMins);

  const getStatusText = (st) => {
    switch (st) {
      case 'SEARCHING_WORKER':
      case 'SEARCHING':
        return 'Đang tìm thợ';
      case 'AWAITING_CONFIRM':
      case 'PENDING_ADMIN':
        return `Chờ duyệt (${remainingMins}p)`;
      case 'MATCHED':
      case 'ASSIGNED':
        return 'Đã xác nhận';
      case 'WORKER_EN_ROUTE':
      case 'WORKER_ARRIVING':
        return 'Thợ đang đến';
      case 'ARRIVED':
        return 'Thợ đã đến';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'AWAITING_ACCEPTANCE':
      case 'AWAITING_CONFIRMATION':
        return 'Chờ nghiệm thu';
      case 'AWAITING_PAYMENT':
        return 'Chờ thanh toán';
      case 'COMPLETED':
      case 'PAID':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'EXPIRED':
        return 'Quá hạn';
      case 'REJECTED':
        return 'Từ chối';
      case 'DISPUTED':
        return 'Khiếu nại';
      default:
        return st || 'Đang xử lý';
    }
  };

  const isAmber = isAwaitingConfirm || isAwaitingAcceptance || isAwaitingPayment;
  const isGreen = isMatched || isCompleted;
  const isRed = isCancelled || isDisputed;
  const isBlue = !isAmber && !isGreen && !isRed;

  return (
    <SafeAreaView nativeID="order-detail-screen-container" style={styles.container} edges={['top']}>
      {/* ── Header Đơn hàng ────────────────────────────────────────── */}
      <View nativeID="order-detail-header" style={styles.header}>
        <TouchableOpacity
          nativeID="btn-back-order-detail"
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Đơn Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        nativeID="order-detail-scroll-container"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch(true)} />}
      >
        {isOffline && (
          <View nativeID="order-detail-offline-banner" style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={18} color="#D97706" />
            <Text style={styles.offlineBannerText}>
              Đang ngoại tuyến — hiển thị dữ liệu lưu tạm thời trên máy.
            </Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.offlineRetryBtn}>
              <Text style={styles.offlineRetryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 1. BANNER TRẠNG THÁI: CHỜ ADMIN DUYỆT ──────────────────── */}
        {isAwaitingConfirm && (
          <View nativeID="order-detail-awaiting-banner" style={styles.awaitingBanner}>
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
          <View nativeID="order-detail-cancelled-banner" style={styles.cancelledBanner}>
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
        <View nativeID="order-detail-info-card" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.orderCodeBadge}>
              {order?.orderCode || `#${String(order?.id || '').slice(0, 10).toUpperCase()}`}
            </Text>
            <View
              nativeID="order-detail-status-pill"
              style={[
                styles.statusPill,
                isAmber && styles.pillAmber,
                isGreen && styles.pillGreen,
                isRed && styles.pillRed,
                isBlue && styles.pillBlue,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isAmber && styles.textAmber,
                  isGreen && styles.textGreen,
                  isRed && styles.textRed,
                  isBlue && styles.textBlue,
                ]}
              >
                {getStatusText(status)}
              </Text>
            </View>
          </View>

          <Text style={styles.serviceMainTitle}>
            {order?.title || order?.service?.name || order?.category?.name || 'Dịch vụ sửa chữa'}
          </Text>

          {/* Huy hieu chan doan AI kem anh su co */}
          {order?.imageUrl && (
            <View style={styles.aiIncidentCard}>
              <View style={styles.aiIncidentBadge}>
                <Ionicons name="sparkles" size={14} color="#0284C7" />
                <Text style={styles.aiIncidentBadgeText}>
                  AI Chẩn đoán sự cố • Điểm nhận diện nhóm: {order?.aiConfidence ? `${Math.round(Number(order.aiConfidence) * 100)}%` : 'Chưa xác định'}
                </Text>
              </View>
              <Image source={{ uri: order.imageUrl }} style={styles.aiIncidentImg} />
            </View>
          )}

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
              {order?.addressText || 'Địa chỉ khách hàng'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={17} color="#0284C7" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Người đặt:</Text>
            <Text style={styles.infoValue}>
              {order?.customer?.name || order?.customerName || 'Khách hàng'}{order?.customer?.phone || order?.customerPhone ? ` • ${order?.customer?.phone || order?.customerPhone}` : ''}
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
              {order?.finalPrice || order?.estimatedPrice || order?.price
                ? `${Number(order.finalPrice || order.estimatedPrice || order.price).toLocaleString('vi-VN')} đ`
                : 'Khảo sát báo giá'}
            </Text>
          </View>
        </View>

        {/* ── 3. THÔNG TIN THỢ PHỤ TRÁCH (Khi đã có thợ hoặc đang tiến hành) ─────── */}
        {!isAwaitingConfirm && !isCancelled && (order?.worker || isMatched || isEnRoute || isArrived || isInProgress || isAwaitingAcceptance || isAwaitingPayment) && (
          <>
            {/* Bản đồ định vị và lộ trình thời gian thực OSRM */}
            <WorkerTrackingMapView
              customerCoord={{
                latitude: Number(order?.lat || 10.7769),
                longitude: Number(order?.lng || 106.7009),
              }}
              workerCoord={workerLocation}
              routeCoordinates={routeInfo.coordinates}
              formattedEta={routeInfo.formattedEta}
            />

            <View nativeID="order-detail-worker-card" style={styles.workerCard}>
              <View style={styles.workerAvatarCircle}>
                <Text style={styles.workerAvatarText}>👨‍🔧</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.workerName}>
                  {order?.worker?.fullName || order?.worker?.user?.name || order?.assignedWorker?.fullName || 'Kỹ thuật viên FixGo'}
                </Text>
                <Text style={styles.workerPhone}>
                  📞 SĐT: {order?.worker?.phone || order?.worker?.user?.phone || order?.assignedWorker?.phone || 'Chưa có số điện thoại'}
                </Text>
                <Text style={styles.workerRating}>⭐ 4.9 (128 đánh giá) • Thợ chuyên nghiệp</Text>
              </View>
              <TouchableOpacity
                nativeID="btn-call-assigned-worker"
                style={styles.callBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── 4. TIẾN TRÌNH THỰC HIỆN ĐƠN HÀNG ───────────────────────── */}
        <View nativeID="order-detail-timeline-card" style={styles.timelineCard}>
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
            <View style={isInProgress || isCompleted || isAwaitingAcceptance || isAwaitingPayment ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={isInProgress || isCompleted || isAwaitingAcceptance || isAwaitingPayment ? styles.stepTitleActive : styles.stepTitle}>
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
        {(isAwaitingConfirm || status === 'SEARCHING_WORKER' || status === 'SEARCHING') && (
          <View nativeID="order-detail-actions-container" style={styles.actionsContainer}>
            <TouchableOpacity
              nativeID="btn-cancel-order"
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
  aiIncidentCard: {
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  aiIncidentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aiIncidentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  aiIncidentImg: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '88%',
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Inter_500Medium',
  },
  offlineRetryBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offlineRetryText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
