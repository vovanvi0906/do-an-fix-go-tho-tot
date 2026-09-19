import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useOrderStore } from '../../store/useOrderStore';
import { socketService } from '../../services/socket/socketService';
import { orderService } from '../../services/api/orderService';

// Dynamic import or safe fallback for react-native-maps
let MapView, Marker, Polyline;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
} catch (e) {
  console.warn('⚠️ [TrackingScreen] react-native-maps not loaded natively:', e.message);
}

/**
 * Screen 4: TrackingScreen
 * Theo dõi vị trí thợ thời gian thực trên bản đồ
 * Lắng nghe socket 'worker:location_update' & 'order:status_changed'
 * Bắt buộc có nút "Làm mới" fallback gọi GET /orders/:id khi mất socket
 */
export default function TrackingScreen({ navigation, onNext, onCancel }) {
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const matchedWorker = useOrderStore((state) => state.matchedWorker);
  const workerLocation = useOrderStore((state) => state.workerLocation);
  const orderStatus = useOrderStore((state) => state.orderStatus);
  const selectedAddress = useOrderStore((state) => state.selectedAddress);
  const updateWorkerLocation = useOrderStore((state) => state.updateWorkerLocation);
  const setOrderStatus = useOrderStore((state) => state.setOrderStatus);
  const setCurrentOrder = useOrderStore((state) => state.setCurrentOrder);

  const orderId = currentOrder?.id || 'demo-order-id';

  const [isSocketAlive, setIsSocketAlive] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toLocaleTimeString());
  const [pendingAdjustment, setPendingAdjustment] = useState(null);
  const [isAdjustmentModalVisible, setIsAdjustmentModalVisible] = useState(false);
  const mapRef = useRef(null);

  // Tọa độ khách hàng
  const customerCoord = useMemo(() => {
    return {
      latitude: parseFloat(currentOrder?.lat || selectedAddress?.lat || 10.7769),
      longitude: parseFloat(currentOrder?.lng || selectedAddress?.lng || 106.7009),
    };
  }, [currentOrder, selectedAddress]);

  // Tọa độ thợ
  const currentWorkerCoord = useMemo(() => {
    if (workerLocation?.lat && workerLocation?.lng) {
      return {
        latitude: parseFloat(workerLocation.lat),
        longitude: parseFloat(workerLocation.lng),
      };
    }
    if (matchedWorker?.lat && matchedWorker?.lng) {
      return {
        latitude: parseFloat(matchedWorker.lat),
        longitude: parseFloat(matchedWorker.lng),
      };
    }
    // Default vị trí thợ cách khách ~800m
    return {
      latitude: customerCoord.latitude + 0.0065,
      longitude: customerCoord.longitude + 0.0055,
    };
  }, [workerLocation, matchedWorker, customerCoord]);

  // 1. React Query gọi GET /orders/:id để đồng bộ dữ liệu
  const {
    data: orderDetail,
    isLoading: isOrderLoading,
    isError: isOrderError,
    error: orderError,
    refetch: refetchOrderDetail,
    isRefetching,
  } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      console.log(`🔄 [TrackingScreen] Gọi GET /orders/${orderId}`);
      return orderService.getOrderById(orderId);
    },
    enabled: !!orderId,
    staleTime: 5000,
  });

  // Cập nhật store khi API trả về kết quả
  useEffect(() => {
    if (orderDetail) {
      setCurrentOrder(orderDetail);
      if (orderDetail.status) {
        setOrderStatus(orderDetail.status);
      }
      if (orderDetail.worker?.lat && orderDetail.worker?.lng) {
        updateWorkerLocation({
          lat: orderDetail.worker.lat,
          lng: orderDetail.worker.lng,
        });
      }
      setLastRefreshedAt(new Date().toLocaleTimeString());
    }
  }, [orderDetail]);

  // 2. Kết nối Socket.IO phòng đơn hàng & lắng nghe vị trí thợ
  useEffect(() => {
    if (!orderId) return;

    socketService.joinOrderRoom(orderId);

    // Kiểm tra trạng thái socket định kỳ
    const checkSocketInterval = setInterval(() => {
      const connected = socketService.socket?.connected ?? false;
      setIsSocketAlive(connected);
    }, 3000);

    // Lắng nghe sự kiện cập nhật vị trí thợ
    const handleLocationUpdate = (data) => {
      console.log('📍 [TrackingScreen] Nhận worker:location_update:', data);
      setIsSocketAlive(true);
      if (data.lat && data.lng) {
        updateWorkerLocation({
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Lắng nghe sự kiện đổi trạng thái
    const handleStatusChanged = (data) => {
      console.log('🔄 [TrackingScreen] Nhận order:status_changed:', data);
      setIsSocketAlive(true);
      if (data.status) {
        setOrderStatus(data.status);
      }
    };

    // Lắng nghe sự kiện thợ đề xuất phát sinh chi phí ngoài báo giá
    const handlePriceAdjusted = (data) => {
      console.log('💰 [TrackingScreen] Nhận sự kiện order:price_adjusted:', data);
      if (data.status === 'PENDING_APPROVAL') {
        setPendingAdjustment(data);
        setIsAdjustmentModalVisible(true);
      } else if (data.status === 'ACCEPTED') {
        setIsAdjustmentModalVisible(false);
        setPendingAdjustment(null);
        Alert.alert(
          'Đã duyệt chi phí phát sinh',
          `Chi phí phát sinh (+${Number(data.additionalPrice || 0).toLocaleString('vi-VN')} đ) đã được ghi nhận. Tổng giá mới: ${Number(data.finalPrice || 0).toLocaleString('vi-VN')} đ.`
        );
        refetchOrderDetail();
      } else if (data.status === 'REJECTED') {
        setIsAdjustmentModalVisible(false);
        setPendingAdjustment(null);
        Alert.alert(
          'Từ chối chi phí phát sinh',
          'Bạn đã từ chối chi phí phát sinh ngoài báo giá. Thợ sẽ tiếp tục thực hiện theo mức giá ban đầu.'
        );
        refetchOrderDetail();
      }
    };

    socketService.on('worker:location_update', handleLocationUpdate);
    socketService.on('order:status_changed', handleStatusChanged);
    socketService.on('order:price_adjusted', handlePriceAdjusted);

    return () => {
      clearInterval(checkSocketInterval);
      socketService.off('worker:location_update', handleLocationUpdate);
      socketService.off('order:status_changed', handleStatusChanged);
      socketService.off('order:price_adjusted', handlePriceAdjusted);
      socketService.leaveOrderRoom(orderId);
    };
  }, [orderId]);

  // Mutation Khách hàng duyệt / từ chối chi phí phát sinh
  const respondAdjustmentMutation = useMutation({
    mutationFn: ({ action, additionalPrice, note }) =>
      orderService.adjustPrice(orderId, { action, additionalPrice, note }),
    onSuccess: (res) => {
      setIsAdjustmentModalVisible(false);
      setPendingAdjustment(null);
      refetchOrderDetail();
      Alert.alert(
        res.status === 'ACCEPTED' ? 'Đã chấp thuận chi phí' : 'Đã từ chối chi phí',
        res.message
      );
    },
    onError: (err) => {
      Alert.alert('Lỗi phản hồi', err?.response?.data?.message || 'Không thể phản hồi chi phí lúc này.');
    },
  });


  // 3. Xử lý gọi điện cho thợ
  const handleCallWorker = () => {
    const phone = matchedWorker?.phone || currentOrder?.worker?.phone || '0901234567';
    Alert.alert('Gọi điện cho thợ', `Thực hiện cuộc gọi tới ${phone}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gọi ngay',
        onPress: () => {
          Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert('Thông báo', `Số điện thoại thợ: ${phone}`);
          });
        },
      },
    ]);
  };

  // 4. Xử lý nhắn tin cho thợ
  const handleChatWorker = () => {
    Alert.alert('Chat trực tiếp', 'Tính năng tin nhắn tức thời với thợ đang kết nối.');
  };

  // 5. Xử lý bấm nút Làm mới khi mất kết nối hoặc muốn cập nhật lại
  const handleManualRefresh = async () => {
    try {
      const res = await refetchOrderDetail();
      if (res.data) {
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
      // Thử tái kết nối socket nếu đang rớt
      if (!socketService.socket?.connected) {
        socketService.connect();
        socketService.joinOrderRoom(orderId);
      }
    } catch (err) {
      Alert.alert('Lỗi cập nhật', 'Không thể kết nối máy chủ để lấy thông tin đơn.');
    }
  };

  // Timeline trạng thái chuẩn 4 bước
  const timelineSteps = [
    { key: 'MATCHED', label: 'Đã nhận đơn', desc: 'Thợ đã xác nhận' },
    { key: 'WORKER_EN_ROUTE', label: 'Đang di chuyển', desc: 'Ước tính ~8 phút' },
    { key: 'IN_PROGRESS', label: 'Đang sửa chữa', desc: 'Đang thực hiện công việc' },
    { key: 'AWAITING_ACCEPTANCE', label: 'Nghiệm thu', desc: 'Đã hoàn thành sửa chữa' },
  ];

  const currentStepIndex = useMemo(() => {
    const status = orderStatus || currentOrder?.status || 'MATCHED';
    switch (status) {
      case 'MATCHED':
        return 0;
      case 'WORKER_EN_ROUTE':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'AWAITING_ACCEPTANCE':
      case 'COMPLETED':
      case 'PAID':
        return 3;
      default:
        return 0;
    }
  }, [orderStatus, currentOrder]);

  const activeWorker = matchedWorker || currentOrder?.worker || {
    fullName: 'Trần Văn Hoàng',
    phone: '0908 123 456',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 4.95,
    jobsCompleted: 154,
    vehiclePlate: '59P1 - 892.41',
  };

  // Hiển thị Error State nếu API lỗi và không có dữ liệu cache
  if (isOrderError && !currentOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Không thể tải thông tin đơn hàng</Text>
          <Text style={styles.errorText}>
            {orderError?.message || 'Đã có lỗi xảy ra trong quá trình truy xuất dữ liệu từ máy chủ.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleManualRefresh}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Thử lại ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Bước 4 / 6</Text>
          </View>
          <Text style={styles.headerTitle}>Hành trình thợ đến bạn</Text>
        </View>

        {/* Nút Làm mới gọi GET /orders/:id */}
        <TouchableOpacity
          style={[styles.refreshButton, isRefetching && styles.refreshButtonActive]}
          onPress={handleManualRefresh}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color="#0284C7" />
          ) : (
            <Ionicons name="sync-outline" size={20} color="#0284C7" />
          )}
          <Text style={styles.refreshButtonText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Cảnh báo khi rớt kết nối Socket */}
      {!isSocketAlive && (
        <View style={styles.socketWarningBanner}>
          <Ionicons name="warning-outline" size={18} color="#F59E0B" />
          <Text style={styles.socketWarningText}>
            Mất kết nối thời gian thực. Bấm "Làm mới" để đồng bộ dữ liệu mới nhất.
          </Text>
          <TouchableOpacity style={styles.socketBannerRefresh} onPress={handleManualRefresh}>
            <Text style={styles.socketBannerRefreshText}>Đồng bộ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Khu vực Bản đồ MapView */}
      <View style={styles.mapContainer}>
        {MapView && Platform.OS !== 'web' ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: (customerCoord.latitude + currentWorkerCoord.latitude) / 2,
              longitude: (customerCoord.longitude + currentWorkerCoord.longitude) / 2,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}
          >
            {/* Marker Khách hàng */}
            <Marker coordinate={customerCoord} title="Vị trí của bạn" pinColor="#EF4444">
              <View style={styles.customerPin}>
                <Ionicons name="home" size={18} color="#FFF" />
              </View>
            </Marker>

            {/* Marker Thợ di chuyển */}
            <Marker
              coordinate={currentWorkerCoord}
              title={activeWorker.fullName}
              description="Vị trí thời gian thực"
            >
              <View style={styles.workerPin}>
                <Ionicons name="bicycle" size={20} color="#FFF" />
              </View>
            </Marker>

            {/* Đường nối giữa Khách và Thợ */}
            {Polyline && (
              <Polyline
                coordinates={[customerCoord, currentWorkerCoord]}
                strokeColor="#0284C7"
                strokeWidth={4}
                lineDashPattern={[6, 4]}
              />
            )}
          </MapView>
        ) : (
          /* Mock Visual Map Fallback (cho web/môi trường dev) */
          <View style={styles.mapFallback}>
            <View style={styles.fallbackGrid}>
              <View style={styles.routeLine} />

              {/* Thợ Marker */}
              <View style={[styles.workerPin, styles.mockWorkerPin]}>
                <Ionicons name="bicycle" size={22} color="#FFF" />
              </View>

              {/* Khách Marker */}
              <View style={[styles.customerPin, styles.mockCustomerPin]}>
                <Ionicons name="home" size={20} color="#FFF" />
              </View>
            </View>

            <View style={styles.mapOverlayInfo}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>GPS REALTIME TRACKING</Text>
              </View>
              <Text style={styles.mapCoordsText}>
                Thợ: {currentWorkerCoord.latitude.toFixed(4)}, {currentWorkerCoord.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        )}

        {/* Floating Tag khoảng cách & thời gian */}
        <View style={styles.etaFloatingBadge}>
          <Ionicons name="time" size={16} color="#0284C7" />
          <Text style={styles.etaText}>Ước tính đến nơi: ~8 - 12 phút (1.2 km)</Text>
        </View>
      </View>

      {/* Thông tin thợ & Tiến trình đơn hàng */}
      <ScrollView style={styles.sheetContainer} showsVerticalScrollIndicator={false}>
        {/* Thẻ thông tin thợ */}
        <View style={styles.workerCard}>
          <Image
            source={{
              uri: activeWorker.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            }}
            style={styles.workerAvatar}
          />
          <View style={styles.workerDetails}>
            <View style={styles.workerNameRow}>
              <Text style={styles.workerName}>{activeWorker.fullName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Đã xác minh</Text>
              </View>
            </View>
            <Text style={styles.workerRating}>
              ⭐ {activeWorker.rating || 4.9} • {activeWorker.jobsCompleted || 150}+ đơn hoàn thành
            </Text>
            <Text style={styles.workerPlate}>
              🛵 Biển số xe: {activeWorker.vehiclePlate || '59P1 - 892.41'}
            </Text>
          </View>

          {/* Action Call / Chat */}
          <View style={styles.workerActions}>
            <TouchableOpacity style={styles.iconBtnCall} onPress={handleCallWorker}>
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnChat} onPress={handleChatWorker}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#0284C7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline tiến trình đơn hàng */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>Tiến độ thực hiện</Text>
            <Text style={styles.lastUpdatedText}>Cập nhật lúc: {lastRefreshedAt}</Text>
          </View>

          <View style={styles.timelineSteps}>
            {timelineSteps.map((step, index) => {
              const isPast = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepDot,
                        isPast && styles.stepDotActive,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      {isPast && !isCurrent ? (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      ) : (
                        <View style={styles.stepDotInner} />
                      )}
                    </View>
                    {index < timelineSteps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          index < currentStepIndex && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stepTextContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Nút hành động chính */}
        <View style={styles.actionFooter}>
          {currentStepIndex >= 3 || orderStatus === 'AWAITING_ACCEPTANCE' || orderStatus === 'COMPLETED' ? (
            <TouchableOpacity
              style={styles.primaryAcceptButton}
              onPress={() => {
                if (onNext) onNext();
                else if (navigation?.navigate) navigation.navigate('AcceptanceScreen');
              }}
            >
              <Text style={styles.primaryAcceptButtonText}>Tiến hành nghiệm thu dịch vụ</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.inProgressInfo}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
              <Text style={styles.inProgressText}>
                Bảo hành dịch vụ 30 ngày • An tâm sửa chữa cùng FixGo Pro
              </Text>
            </View>
          )}

          {/* Nút mô phỏng demo nhanh cho người dùng nếu muốn nhảy sang bước nghiệm thu */}
          {currentStepIndex < 3 && (
            <View style={{ gap: 8, marginTop: 10 }}>
              {/* Demo Edge Case: Thợ phát sinh chi phí ngoài báo giá */}
              <TouchableOpacity
                style={styles.simulateAdjustButton}
                onPress={() => {
                  setPendingAdjustment({
                    additionalPrice: 120000,
                    reason: 'Phát sinh thay thế tụ ngậm block quạt giải nhiệt bị cháy',
                    proposedTotal:
                      Number(currentOrder?.finalPrice || currentOrder?.estimatedPrice || 250000) +
                      120000,
                  });
                  setIsAdjustmentModalVisible(true);
                }}
              >
                <Ionicons name="cash-outline" size={14} color="#F59E0B" />
                <Text style={styles.simulateAdjustText}>
                  (Thử nghiệm: Giả lập thợ báo phát sinh chi phí ngoài báo giá)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simulateButton}
                onPress={() => {
                  setOrderStatus('AWAITING_ACCEPTANCE');
                  if (onNext) onNext();
                  else if (navigation?.navigate) navigation.navigate('AcceptanceScreen');
                }}
              >
                <Text style={styles.simulateButtonText}>(Chuyển nhanh sang Nghiệm thu)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Edge Case: Thợ phát sinh chi phí ngoài báo giá (PATCH /orders/:id/adjust-price) */}
      <Modal visible={isAdjustmentModalVisible} transparent animationType="slide">
        <View style={styles.adjustModalOverlay}>
          <View style={styles.adjustModalCard}>
            <View style={styles.adjustModalHeader}>
              <View style={styles.adjustWarningIcon}>
                <Ionicons name="alert-circle" size={26} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adjustModalTitle}>Yêu cầu duyệt chi phí phát sinh</Text>
                <Text style={styles.adjustModalSubtitle}>
                  Kỹ thuật viên kiểm tra hiện trường và đề xuất bổ sung chi phí ngoài báo giá ban đầu:
                </Text>
              </View>
            </View>

            {/* Chi tiết chi phí */}
            <View style={styles.adjustDetailBox}>
              <View style={styles.adjustRow}>
                <Text style={styles.adjustLabel}>Lý do phát sinh:</Text>
                <Text style={styles.adjustReasonValue}>
                  {pendingAdjustment?.reason || 'Thay linh kiện hỏng ngoài dự kiến'}
                </Text>
              </View>

              <View style={styles.adjustDivider} />

              <View style={styles.adjustRow}>
                <Text style={styles.adjustLabel}>Chi phí phát sinh thêm:</Text>
                <Text style={styles.adjustPriceHighlight}>
                  +{Number(pendingAdjustment?.additionalPrice || 120000).toLocaleString('vi-VN')} đ
                </Text>
              </View>

              <View style={styles.adjustRow}>
                <Text style={styles.adjustLabel}>Tổng chi phí sau điều chỉnh:</Text>
                <Text style={styles.adjustTotalValue}>
                  {Number(
                    pendingAdjustment?.proposedTotal ||
                      (currentOrder?.estimatedPrice || 250000) + 120000
                  ).toLocaleString('vi-VN')}{' '}
                  đ
                </Text>
              </View>
            </View>

            <Text style={styles.adjustNoticeText}>
              ⚠️ Thợ chỉ được phép tiếp tục công việc khi bạn nhấn "Đồng ý". Bạn có quyền từ chối nếu chi phí không hợp lý.
            </Text>

            {/* Nút hành động của khách: Duyệt hoặc Từ chối */}
            <View style={styles.adjustActions}>
              <TouchableOpacity
                style={[
                  styles.rejectAdjustBtn,
                  respondAdjustmentMutation.isPending && styles.buttonDisabled,
                ]}
                onPress={() =>
                  respondAdjustmentMutation.mutate({
                    action: 'REJECT',
                    note: 'Khách hàng không đồng ý chi phí phát sinh',
                  })
                }
                disabled={respondAdjustmentMutation.isPending}
              >
                <Text style={styles.rejectAdjustBtnText}>Từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.acceptAdjustBtn,
                  respondAdjustmentMutation.isPending && styles.buttonDisabled,
                ]}
                onPress={() =>
                  respondAdjustmentMutation.mutate({
                    action: 'ACCEPT',
                    additionalPrice: pendingAdjustment?.additionalPrice || 120000,
                    note: 'Khách hàng đồng ý chi phí linh kiện',
                  })
                }
                disabled={respondAdjustmentMutation.isPending}
              >
                {respondAdjustmentMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.acceptAdjustBtnText}>
                    Đồng ý (+
                    {Number(pendingAdjustment?.additionalPrice || 120000).toLocaleString('vi-VN')}{' '}
                    đ)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  stepBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  refreshButtonActive: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
  },
  socketWarningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socketWarningText: {
    flex: 1,
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '500',
  },
  socketBannerRefresh: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  socketBannerRefreshText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  mapContainer: {
    height: 230,
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackGrid: {
    width: '90%',
    height: '75%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    top: 50,
    left: 60,
    width: 190,
    height: 3,
    backgroundColor: '#0284C7',
    transform: [{ rotate: '25deg' }],
  },
  mockWorkerPin: {
    position: 'absolute',
    top: 30,
    left: 45,
  },
  mockCustomerPin: {
    position: 'absolute',
    bottom: 35,
    right: 50,
  },
  customerPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  workerPin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  mapOverlayInfo: {
    position: 'absolute',
    top: 12,
    left: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapCoordsText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  etaFloatingBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  etaText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  workerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
  },
  workerDetails: {
    flex: 1,
    marginLeft: 14,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  workerRating: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 3,
  },
  workerPlate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  workerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  iconBtnCall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnChat: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#64748B',
  },
  timelineSteps: {
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0284C7',
  },
  stepDotCurrent: {
    backgroundColor: '#0284C7',
    borderWidth: 3,
    borderColor: 'rgba(2, 132, 199, 0.35)',
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  stepLineActive: {
    backgroundColor: '#0284C7',
  },
  stepTextContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTitleCurrent: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionFooter: {
    paddingBottom: 28,
  },
  primaryAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 15,
    borderRadius: 12,
  },
  primaryAcceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  inProgressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  inProgressText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  simulateButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  simulateButtonText: {
    color: '#64748B',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  simulateAdjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  simulateAdjustText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  adjustModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  adjustModalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  adjustModalHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  adjustWarningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  adjustModalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  adjustDetailBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  adjustLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  adjustReasonValue: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  adjustPriceHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F59E0B',
  },
  adjustTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284C7',
  },
  adjustDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 8,
  },
  adjustNoticeText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 20,
  },
  adjustActions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  rejectAdjustBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectAdjustBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptAdjustBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptAdjustBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

