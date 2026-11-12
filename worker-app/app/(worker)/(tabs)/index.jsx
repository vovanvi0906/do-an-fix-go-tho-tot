import { WorkerApprovalForm } from '../../../src/features/auth/components/WorkerApprovalForm';
import { hasShiftVerification, profileRestriction } from '../../../src/features/auth/services/workerEligibility';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../../src/services/api/apiClient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../src/services/api/orderService';
import { socketService } from '../../../src/services/socket/socketService';
import { useOrderRecovery } from '../../../src/features/orders/hooks/useOrderRecovery';
import { useAuth } from '../../../src/features/auth';

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [isOnline, setIsOnline] = useState(false);
  const statusLock = useRef(false);
  const loadProfile = useCallback(async () => {
    const response = await apiClient.get('/workers/me');
    return response.data || response;
  }, []);
  const { data: profile, error: profileError, loading: profileLoading, reload: reloadProfile } = useOrderRecovery(loadProfile, user?.id);
  useEffect(() => { setIsOnline(profile?.isOnline === true); }, [profile]);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [isAccepting, setIsAccepting] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const loadActive = useCallback(() => orderService.getCurrentWorkerOrder(), []);
  const { data: activeOrder, loading: activeLoading, error: activeError, reload: reloadActive } = useOrderRecovery(loadActive, user?.id);

  useFocusEffect(useCallback(() => {
    if (!activeOrder?.id) return;
    socketService.joinOrderRoom(activeOrder.id);
    return () => socketService.leaveOrderRoom(activeOrder.id);
  }, [activeOrder?.id]));

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);

  const changeAvailability = async (online) => {
    if (statusLock.current) return;
    statusLock.current = true;
    setIsChangingStatus(true);
    try {
      if (online) {
        if (activeLoading || activeError || activeOrder) throw new Error('Cần hoàn tất hoặc kiểm tra công việc hiện tại trước khi nhận đơn mới');
        const response = await apiClient.get('/workers/me');
        const profile = response.data || response;
        const restriction = profileRestriction(profile);
        if (restriction) throw new Error(restriction);
        if (!hasShiftVerification(profile)) {
          setShowDailyCheckIn(true);
          return;
        }
      }
      let coords = {};
      if (online) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') throw new Error('Cần quyền vị trí để bật nhận đơn');
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        socketService.connect();
      }
      const response = await apiClient.patch('/workers/status', { isOnline: online, ...coords });
      const ack = response.data || response;
      if (ack.isOnline !== online) throw new Error('Máy chủ chưa xác nhận trạng thái nhận đơn');
      setIsOnline(ack.isOnline);
      await reloadProfile();
      if (!online) setIncomingOrder(null);
    } catch (error) {
      Alert.alert('Chưa cập nhật trạng thái', error.message);
    } finally {
      statusLock.current = false;
      setIsChangingStatus(false);
    }
  };

  const dailyCheckIn = async () => {
    if (statusLock.current) return;
    statusLock.current = true;
    setIsChangingStatus(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Cần quyền camera để chụp selfie');
      const result = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const form = new FormData();
      if (asset.uri.startsWith('data:') || asset.uri.startsWith('blob:')) {
        form.append('image', await (await fetch(asset.uri)).blob(), 'selfie.jpg');
      } else {
        form.append('image', { uri: asset.uri, name: 'selfie.jpg', type: 'image/jpeg' });
      }
      await apiClient.post('/workers/verify-face-daily', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      const current = await loadProfile();
      if (!hasShiftVerification(current)) throw new Error('Máy chủ chưa xác nhận check-in. Vui lòng thử lại');
      await reloadProfile();
      setShowDailyCheckIn(false);
    } catch (error) {
      Alert.alert('Check-in chưa thành công', error.message);
    } finally {
      statusLock.current = false;
      setIsChangingStatus(false);
    }

  };

  useEffect(() => {
    // 1. Kết nối Socket.IO
    socketService.connect();

    // 2. Lắng nghe đơn hàng mới được broadcast tới thợ (order.new)
    const handleNewOrder = (orderData) => {
      console.log('🔔 [Worker Socket] Có đơn hàng mới phát sóng:', orderData);
      if (isOnline && !activeLoading && !activeError && !activeOrder) {
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
  }, [isOnline, incomingOrder, activeLoading, activeError, activeOrder]);

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
    if (!incomingOrder || isAccepting || activeOrder || activeLoading || activeError) return;
    setIsAccepting(true);
    setConflictMessage('');

    try {
      console.log(`⚡ [Worker] Gửi yêu cầu nhận đơn #${incomingOrder.orderId}`);
      const res = await orderService.acceptOrder(incomingOrder.orderId);

      console.log('🎉 [Worker] Nhận đơn thành công 200 OK:', res);
      await reloadActive();
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
    <View nativeID="worker-home-container" style={styles.container}>
      <Modal visible={showDailyCheckIn} transparent animationType="fade" onRequestClose={() => !isChangingStatus && setShowDailyCheckIn(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ padding: 24, backgroundColor: 'white', borderRadius: 16, gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Check-in khuôn mặt hằng ngày</Text>
            <Text>Chụp selfie trực diện để bật nhận đơn trong 24 giờ tới.</Text>
            <TouchableOpacity disabled={isChangingStatus} onPress={dailyCheckIn}><Text>Chụp selfie và xác thực</Text></TouchableOpacity>
            {isChangingStatus && <ActivityIndicator />}
            <TouchableOpacity disabled={isChangingStatus} onPress={() => setShowDailyCheckIn(false)}><Text>Để sau</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Header Thợ */}
      <View nativeID="worker-home-header" style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào, {user?.fullName || 'Thợ đối tác'} 👋</Text>
          <Text style={styles.subText}>Khu vực hoạt động: TP. Hồ Chí Minh</Text>
        </View>

        {/* Nút Bật/Tắt Trực Tuyến */}
        <View nativeID="worker-toggle-online-switch" style={styles.onlineToggleBox}>
          <Text style={isOnline ? styles.onlineText : styles.offlineText}>
            {isOnline ? 'ĐANG BẬT NHẬN ĐƠN' : 'TẠM NGHỈ'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={changeAvailability}
            disabled={isChangingStatus || profileLoading || (!isOnline && (!!profileRestriction(profile) || !!activeOrder || activeLoading || !!activeError))}
            trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
            thumbColor={isOnline ? '#16A34A' : '#94A3B8'}
          />
        </View>
      </View>

      <ScrollView
        nativeID="worker-home-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {profileError ? <TouchableOpacity onPress={reloadProfile}><Text>{profileError} — Thử lại</Text></TouchableOpacity> : null}
        {profileRestriction(profile) ? <Text accessibilityRole="alert">{profileRestriction(profile)}</Text> : null}
        {['DRAFT', 'REJECTED'].includes(profile?.approvalStatus) ? <WorkerApprovalForm key={`${user?.id}:${profile.approvalStatus}`} profile={profile} onSaved={reloadProfile} /> : null}
        {!showDailyCheckIn && hasShiftVerification(profile) ? <Text>Check-in đầu ca còn hiệu lực. Bật công tắc để nhận đơn.</Text> : null}
        {/* Banner Trạng thái */}
        <View nativeID="worker-online-status-banner" style={isOnline ? styles.bannerOnline : styles.bannerOffline}>
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
        {activeLoading ? <ActivityIndicator accessibilityLabel="Đang khôi phục công việc" /> : null}
        {activeError ? <TouchableOpacity nativeID="worker-active-order-retry" onPress={reloadActive}><Text>{activeError} — Thử lại</Text></TouchableOpacity> : null}
        {!activeLoading && !activeError && !activeOrder ? <Text>Không có công việc đang thực hiện.</Text> : null}
        {activeOrder ? (
          <View nativeID="worker-active-order-card" style={styles.activeOrderCard}>
            <View style={styles.activeOrderHeader}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ĐƠN ĐANG THỰC HIỆN</Text>
              </View>
              <Text style={styles.activeOrderPrice}>
                {Number(activeOrder.finalPrice ?? activeOrder.estimatedPrice).toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <Text>{activeOrder.status}</Text>
            <Text style={styles.activeServiceName}>
              {activeOrder.service?.name || activeOrder.category?.name || 'Chưa có tên dịch vụ'}
            </Text>
            <Text style={styles.activeAddress}>📍 {activeOrder.addressText || 'Chưa có địa chỉ'}</Text>

            <TouchableOpacity
              nativeID="btn-worker-view-active-order"
              style={styles.viewOrderDetailBtn}
              onPress={() => router.push(`/(worker)/job/${activeOrder.id}`)}
            >
              <Text style={styles.viewOrderDetailText}>XEM CHI TIẾT & TIẾP NHẬN CÔNG VIỆC</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Thống kê nhanh trong ngày */}
        <View nativeID="worker-stats-row" style={styles.statsRow}>
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
        <View nativeID="modal-incoming-order-overlay" style={styles.modalOverlay}>
          <View nativeID="worker-incoming-order-card" style={styles.incomingCard}>
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
                nativeID="btn-decline-incoming-order"
                style={styles.declineBtn}
                onPress={() => setIncomingOrder(null)}
                disabled={isAccepting}
              >
                <Text style={styles.declineText}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                nativeID="btn-accept-incoming-order"
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
