import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../src/services/api/orderService';
import { socketService } from '../../../src/services/socket/socketService';

export default function UserOrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('ASSIGNED');

  useEffect(() => {
    socketService.connect();

    // Tải thông tin đơn hàng
    const fetchOrder = async () => {
      try {
        if (id) {
          const res = await orderService.getOrderById(id);
          if (res) {
            setOrder(res);
            setCurrentStatus(res.status || 'ASSIGNED');
          }
        }
      } catch (e) {
        console.warn('Load order fallback:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Lắng nghe cập nhật trạng thái thời gian thực từ Socket.IO
    const handleStatusUpdate = (data) => {
      console.log('🔄 [Order Tracking Socket] Cập nhật trạng thái:', data);
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

  const getStatusStepIndex = (status) => {
    const steps = ['SEARCHING', 'ASSIGNED', 'WORKER_ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
    return Math.max(0, steps.indexOf(status));
  };

  const stepIndex = getStatusStepIndex(currentStatus);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải thông tin theo dõi đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo Dõi Đơn Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bản đồ định vị giả lập / GPS Tracking Map */}
        <View style={styles.mapSimulationBox}>
          <View style={styles.mapGridOverlay}>
            <View style={styles.customerPin}>
              <Ionicons name="home" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.routeLine} />
            <View style={styles.workerPin}>
              <Ionicons name="car" size={20} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.etaBadge}>
            <Ionicons name="time" size={16} color="#16A34A" />
            <Text style={styles.etaText}>
              {currentStatus === 'WORKER_ARRIVING'
                ? 'Thợ dự kiến đến sau 8 phút'
                : currentStatus === 'IN_PROGRESS'
                ? 'Thợ đang tiến hành sửa chữa'
                : 'Thợ đã nhận cuốc và chuẩn bị di chuyển'}
            </Text>
          </View>
        </View>

        {/* Thông tin Thợ nhận đơn */}
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
            <Text style={styles.workerRating}>⭐ 4.9 (128 đánh giá) • Thợ Điện Nước</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tiến trình thực hiện đơn (Workflow Timeline) */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>Tiến trình thực hiện đơn hàng #{id || 'ORD-99'}</Text>

          {/* Bước 1: Tìm thợ */}
          <View style={styles.timelineItem}>
            <View style={stepIndex >= 0 ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={stepIndex >= 0 ? styles.stepTitleActive : styles.stepTitle}>
                1. Khởi tạo & Tìm kiếm thợ
              </Text>
              <Text style={styles.stepSub}>Hệ thống quét thợ online trong bán kính 5km</Text>
            </View>
          </View>

          {/* Bước 2: Thợ nhận đơn */}
          <View style={styles.timelineItem}>
            <View style={stepIndex >= 1 ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={stepIndex >= 1 ? styles.stepTitleActive : styles.stepTitle}>
                2. Thợ đã nhận đơn (ASSIGNED)
              </Text>
              <Text style={styles.stepSub}>Thợ xác nhận tiếp nhận công việc</Text>
            </View>
          </View>

          {/* Bước 3: Đang di chuyển */}
          <View style={styles.timelineItem}>
            <View style={stepIndex >= 2 ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={stepIndex >= 2 ? styles.stepTitleActive : styles.stepTitle}>
                3. Đang di chuyển đến địa chỉ (ARRIVING)
              </Text>
              <Text style={styles.stepSub}>Thợ đang trên đường đến điểm hẹn</Text>
            </View>
          </View>

          {/* Bước 4: Làm việc & Hoàn thành */}
          <View style={styles.timelineItem}>
            <View style={stepIndex >= 4 ? styles.dotCompleted : styles.dotPending} />
            <View style={styles.timelineContent}>
              <Text style={stepIndex >= 4 ? styles.stepTitleActive : styles.stepTitle}>
                4. Thực hiện dịch vụ & Nghiệm thu
              </Text>
              <Text style={styles.stepSub}>Khách hàng nghiệm thu và hoàn tất thanh toán</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  mapSimulationBox: {
    height: 200,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapGridOverlay: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#38BDF8',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  workerPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  etaBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  etaText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  workerAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  workerAvatarText: {
    fontSize: 24,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  workerPhone: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 2,
  },
  workerRating: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dotCompleted: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    marginTop: 4,
    marginRight: 14,
  },
  dotPending: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#CBD5E1',
    marginTop: 4,
    marginRight: 14,
  },
  timelineContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTitleActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  stepSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
