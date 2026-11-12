import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useOrderStore } from '../../store/useOrderStore';
import { socketService } from '../../services/socket/socketService';
import { orderService } from '../../services/api/orderService';

/**
 * Screen 3: SearchingScreen
 * Trạng thái đang quét tìm thợ trong bán kính gần nhất (5km - mở rộng 15km)
 * Lắng nghe realtime socket event 'order:matched' & 'order:status_changed'
 * Edge Case: Nếu không tìm thấy thợ sau X phút -> hiển thị thông báo rõ, cho khách chọn đặt lịch sau hoặc hủy miễn phí
 */
export default function SearchingScreen({ navigation, onNext, onCancel }) {
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const selectedCategory = useOrderStore((state) => state.selectedCategory);
  const selectedAddress = useOrderStore((state) => state.selectedAddress);
  const setMatchedWorker = useOrderStore((state) => state.setMatchedWorker);
  const setOrderStatus = useOrderStore((state) => state.setOrderStatus);

  const [matchedWorkerInfo, setMatchedWorkerInfo] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimeoutModalVisible, setIsTimeoutModalVisible] = useState(false);
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState('Ngày mai, 09:00 sáng');

  // Radar wave animations
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  const orderId = currentOrder?.id || 'demo-order-id';

  // 1. Chạy hiệu ứng radar sóng lan tỏa
  useEffect(() => {
    const createWaveLoop = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const wave1 = createWaveLoop(waveAnim1, 0);
    const wave2 = createWaveLoop(waveAnim2, 800);
    const wave3 = createWaveLoop(waveAnim3, 1600);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    wave1.start();
    wave2.start();
    wave3.start();
    pulse.start();

    // Bộ đếm giây tìm kiếm
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      wave1.stop();
      wave2.stop();
      wave3.stop();
      pulse.stop();
      clearInterval(timer);
    };
  }, []);

  // 2. Lắng nghe Socket.IO phòng đơn hàng
  useEffect(() => {
    if (!orderId) return;

    // Join room Socket.IO
    socketService.joinOrderRoom(orderId);

    // Lắng nghe thợ nhận đơn (order:matched)
    const handleOrderMatched = (data) => {
      console.log('🎉 [SearchingScreen] Nhận sự kiện order:matched:', data);
      const worker = data.worker || {
        id: data.workerId || 'w-01',
        fullName: data.workerName || 'Nguyễn Văn Thợ',
        phone: data.workerPhone || '0901234567',
        avatarUrl: data.workerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        rating: 4.9,
        jobsCompleted: 128,
      };

      setMatchedWorker(worker);
      setOrderStatus('MATCHED');
      setMatchedWorkerInfo(worker);

      // Chuyển màn hình sau 1.5s để khách thấy thông báo tìm thấy thợ
      setTimeout(() => {
        if (onNext) {
          onNext(worker);
        } else if (navigation?.navigate) {
          navigation.navigate('TrackingScreen');
        }
      }, 1500);
    };

    // Lắng nghe thay đổi trạng thái
    const handleStatusChanged = (data) => {
      console.log('🔄 [SearchingScreen] Trạng thái đơn thay đổi:', data);
      if (data.status === 'MATCHED' || data.status === 'WORKER_EN_ROUTE') {
        setOrderStatus(data.status);
        if (data.worker) {
          setMatchedWorker(data.worker);
          setMatchedWorkerInfo(data.worker);
        }
        setTimeout(() => {
          if (onNext) onNext(data.worker);
          else if (navigation?.navigate) navigation.navigate('TrackingScreen');
        }, 1200);
      }
    };

    // Lắng nghe sự kiện không tìm thấy thợ sau khi mở rộng bán kính
    const handleNoWorkerFound = (data) => {
      console.log('⚠️ [SearchingScreen] Nhận sự kiện order:no_worker_found:', data);
      setIsTimeoutModalVisible(true);
    };

    socketService.on('order:matched', handleOrderMatched);
    socketService.on('order:status_changed', handleStatusChanged);
    socketService.on('order:no_worker_found', handleNoWorkerFound);

    return () => {
      socketService.off('order:matched', handleOrderMatched);
      socketService.off('order:status_changed', handleStatusChanged);
      socketService.off('order:no_worker_found', handleNoWorkerFound);
      // Giữ phòng nếu chuyển sang tracking
    };
  }, [orderId]);

  // Kích hoạt dialog timeout sau 90 giây nếu vẫn chưa tìm thấy thợ
  useEffect(() => {
    if (secondsElapsed >= 90 && !matchedWorkerInfo && !isTimeoutModalVisible) {
      setIsTimeoutModalVisible(true);
    }
  }, [secondsElapsed, matchedWorkerInfo]);

  // 3. Polling dự phòng: Check chi tiết đơn mỗi 5 giây phòng trường hợp rớt socket
  const { data: polledOrder } = useQuery({
    queryKey: ['order-status-check', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId && !matchedWorkerInfo,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (polledOrder && polledOrder.status && polledOrder.status !== 'SEARCHING_WORKER') {
      if (polledOrder.worker) {
        setMatchedWorker(polledOrder.worker);
        setOrderStatus(polledOrder.status);
        setMatchedWorkerInfo(polledOrder.worker);
        setTimeout(() => {
          if (onNext) onNext(polledOrder.worker);
          else if (navigation?.navigate) navigation.navigate('TrackingScreen');
        }, 1000);
      }
    }
  }, [polledOrder]);

  // 4. Mutation Đặt lịch hẹn sau (Schedule for later)
  const scheduleMutation = useMutation({
    mutationFn: (slot) =>
      orderService.scheduleOrder(orderId, {
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    onSuccess: () => {
      setIsTimeoutModalVisible(false);
      Alert.alert(
        'Đã hẹn lịch thành công!',
        `Đơn hàng của bạn đã được chuyển sang lịch hẹn: ${selectedScheduleSlot}. Hệ thống sẽ nhắc bạn trước 30 phút.`,
        [
          {
            text: 'Về trang chủ',
            onPress: () => {
              if (onCancel) onCancel();
              else if (navigation?.navigate) navigation.navigate('DiagnoseScreen');
            },
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert('Lỗi đặt lịch', err?.response?.data?.message || 'Không thể đặt lịch lúc này.');
    },
  });

  // 5. Mutation Hủy tìm kiếm / Hủy đơn (Miễn phí vì đang ở SEARCHING_WORKER)
  const cancelMutation = useMutation({
    mutationFn: () =>
      orderService.cancelOrder(orderId, 'Khách hủy đơn miễn phí do không tìm được thợ gần nhất'),
    onSuccess: (data) => {
      socketService.leaveOrderRoom(orderId);
      setOrderStatus('CANCELLED');
      setIsTimeoutModalVisible(false);
      Alert.alert(
        'Đã hủy đơn miễn phí',
        `Đơn hàng đã hủy thành công. Phí hủy áp dụng: ${data?.cancellationFee || 0} đ.`,
        [
          {
            text: 'Đồng ý',
            onPress: () => {
              if (onCancel) onCancel();
              else if (navigation?.navigate) navigation.navigate('DiagnoseScreen');
            },
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert('Lỗi hủy đơn', err?.response?.data?.message || 'Không thể hủy đơn lúc này.');
    },
  });


  const handleCancelPress = () => {
    Alert.alert(
      'Hủy tìm thợ?',
      'Hệ thống đang mở rộng tìm kiếm các kỹ thuật viên ưu tú nhất quanh khu vực của bạn.',
      [
        { text: 'Chờ thêm', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Bước 3 / 6</Text>
          </View>
          <Text style={styles.title}>Đang tìm thợ gần bạn</Text>
          <Text style={styles.subtitle}>
            Hệ thống đang quét kỹ thuật viên trong bán kính 5km...
          </Text>
        </View>

        {/* Khu vực radar sóng lan tỏa */}
        <View style={styles.radarContainer}>
          {/* Wave 1 */}
          <Animated.View
            style={[
              styles.waveCircle,
              {
                transform: [
                  {
                    scale: waveAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 2.4],
                    }),
                  },
                ],
                opacity: waveAnim1.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0.6, 0.2, 0],
                }),
              },
            ]}
          />

          {/* Wave 2 */}
          <Animated.View
            style={[
              styles.waveCircle,
              {
                transform: [
                  {
                    scale: waveAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 2.4],
                    }),
                  },
                ],
                opacity: waveAnim2.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0.6, 0.2, 0],
                }),
              },
            ]}
          />

          {/* Wave 3 */}
          <Animated.View
            style={[
              styles.waveCircle,
              {
                transform: [
                  {
                    scale: waveAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 2.4],
                    }),
                  },
                ],
                opacity: waveAnim3.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0.6, 0.2, 0],
                }),
              },
            ]}
          />

          {/* Center Hub */}
          <Animated.View
            style={[
              styles.centerHub,
              {
                transform: [{ scale: iconPulse }],
              },
            ]}
          >
            {matchedWorkerInfo ? (
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            ) : (
              <Ionicons name="construct" size={48} color="#0284C7" />
            )}
          </Animated.View>

          {/* Timer Display */}
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.timerText}>{formatTimer(secondsElapsed)}</Text>
          </View>
        </View>

        {/* Thông báo kết quả thợ nếu đã khớp */}
        {matchedWorkerInfo ? (
          <View style={styles.matchedSuccessCard}>
            <View style={styles.matchedHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.matchedTitle}>Đã tìm thấy kỹ thuật viên!</Text>
            </View>
            <Text style={styles.matchedWorkerName}>{matchedWorkerInfo.fullName}</Text>
            <Text style={styles.matchedWorkerSub}>
              ⭐ {matchedWorkerInfo.rating || '4.9'} • Đang điều hướng đến bản đồ theo dõi...
            </Text>
          </View>
        ) : (
          /* Thẻ thông tin tóm tắt đơn */
          <View style={styles.orderSummaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconWrap}>
                <Ionicons name="hammer-outline" size={18} color="#0284C7" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Dịch vụ yêu cầu</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {selectedCategory?.name || 'Sửa chữa điện gia dụng'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryIconWrap}>
                <Ionicons name="location-outline" size={18} color="#F59E0B" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Địa chỉ phục vụ</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {selectedAddress?.addressText || 'Quận 1, TP. Hồ Chí Minh'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryIconWrap}>
                <Ionicons name="radio-outline" size={18} color="#10B981" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Kênh tín hiệu</Text>
                <Text style={styles.summaryStatusText}>
                  🟢 Socket.IO Realtime: Sẵn sàng nhận thông báo
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Nút hủy tìm kiếm */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              cancelMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleCancelPress}
            disabled={cancelMutation.isPending || !!matchedWorkerInfo}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Hủy tìm kiếm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Edge Case: Không tìm thấy thợ sau khi mở rộng bán kính -> Cho khách Đặt lịch sau hoặc Hủy miễn phí */}
      <Modal visible={isTimeoutModalVisible} transparent animationType="slide">
        <View style={styles.timeoutModalOverlay}>
          <View style={styles.timeoutModalCard}>
            <View style={styles.timeoutModalHeader}>
              <View style={styles.timeoutAlertIcon}>
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeoutModalTitle}>Chưa tìm thấy thợ phù hợp</Text>
                <Text style={styles.timeoutModalSubtitle}>
                  Hệ thống đã mở rộng tìm kiếm tới 15km nhưng hiện tại các kỹ thuật viên đều đang bận thực hiện ca sửa chữa.
                </Text>
              </View>
            </View>

            <View style={styles.optionsPromptBox}>
              <Text style={styles.optionsPromptText}>
                Bạn có thể lựa chọn 1 trong 2 phương án thuận tiện sau:
              </Text>
            </View>

            {/* Lựa chọn 1: Đặt lịch hẹn sau */}
            <View style={styles.scheduleSlotContainer}>
              <Text style={styles.scheduleSlotTitle}>1. Đặt lịch hẹn để thợ chủ động chuẩn bị:</Text>
              {['Ngày mai, 09:00 sáng', 'Ngày mai, 14:30 chiều', 'Ngày kia, 08:30 sáng'].map((slot) => {
                const isSelected = selectedScheduleSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                    onPress={() => setSelectedScheduleSlot(slot)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? '#0284C7' : '#64748B'}
                    />
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.scheduleSubmitBtn,
                  scheduleMutation.isPending && styles.buttonDisabled,
                ]}
                onPress={() => scheduleMutation.mutate(selectedScheduleSlot)}
                disabled={scheduleMutation.isPending}
              >
                {scheduleMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={18} color="#FFF" />
                    <Text style={styles.scheduleSubmitBtnText}>Xác nhận đặt lịch hẹn sau</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Lựa chọn 2: Hủy đơn hoàn toàn miễn phí */}
            <TouchableOpacity
              style={[
                styles.freeCancelBtn,
                cancelMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.freeCancelBtnText}>
                Hủy tìm kiếm ngay (Miễn phí 100% - 0đ)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  stepBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  stepBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  radarContainer: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  waveCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  centerHub: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E293B',
    borderWidth: 2.5,
    borderColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  timerBadge: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  matchedSuccessCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  matchedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  matchedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  matchedWorkerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  matchedWorkerSub: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
  },
  orderSummaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
    marginTop: 2,
  },
  summaryStatusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  footer: {
    paddingVertical: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  timeoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  timeoutModalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  timeoutModalHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeoutAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeoutModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  timeoutModalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  optionsPromptBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  optionsPromptText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  scheduleSlotContainer: {
    gap: 8,
    marginBottom: 16,
  },
  scheduleSlotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  slotItemSelected: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  slotText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  slotTextSelected: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  scheduleSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  scheduleSubmitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  freeCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  freeCancelBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});

