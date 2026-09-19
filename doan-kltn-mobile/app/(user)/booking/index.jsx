import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../../src/services/api/orderService';
import { socketService } from '../../../src/services/socket/socketService';

// Danh sách dịch vụ mẫu
const DEFAULT_SERVICES = [
  {
    id: 'srv-electric-01',
    name: 'Sửa chữa điện gia dụng',
    basePrice: 150000,
    icon: 'flash-outline',
    unit: 'lần',
    desc: 'Chập điện, hỏng atomat, sửa ổ cắm & đèn',
  },
  {
    id: 'srv-plumbing-02',
    name: 'Sửa ống nước & thiết bị vệ sinh',
    basePrice: 180000,
    icon: 'water-outline',
    unit: 'lần',
    desc: 'Rò rỉ ống, thay vòi sen, thông tắc bồn rửa',
  },
  {
    id: 'srv-aircon-03',
    name: 'Bảo trì & Nạp gas máy lạnh',
    basePrice: 250000,
    icon: 'snow-outline',
    unit: 'bộ',
    desc: 'Vệ sinh máy lạnh, nạp gas R32/R410A, xử lý chảy nước',
  },
  {
    id: 'srv-lock-04',
    name: 'Sửa khóa & Mở khóa khẩn cấp',
    basePrice: 200000,
    icon: 'key-outline',
    unit: 'lần',
    desc: 'Mở khóa cửa nhà, thay ổ khóa vân tay, đánh chìa',
  },
];

export default function CustomerBookingScreen() {
  const router = useRouter();

  // State
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [selectedService, setSelectedService] = useState(DEFAULT_SERVICES[0]);
  const [address, setAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh');
  const [lat, setLat] = useState(10.762622);
  const [lng, setLng] = useState(106.660172);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [assignedWorkerInfo, setAssignedWorkerInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Kết nối Socket.IO
    socketService.connect();

    // Tải danh sách dịch vụ từ backend nếu có
    const fetchServices = async () => {
      try {
        const res = await orderService.getActiveServices();
        if (Array.isArray(res) && res.length > 0) {
          setServices(res);
          setSelectedService(res[0]);
        }
      } catch (e) {
        console.log('Using default mock services');
      }
    };
    fetchServices();

    // Lắng nghe sự kiện thợ nhận đơn (order.accepted)
    const handleOrderAccepted = (data) => {
      console.log('🎉 [Client Booking] Nhận thông báo Thợ đã nhận đơn:', data);
      setIsSearching(false);
      setAssignedWorkerInfo(data.worker);
    };

    socketService.on('order.accepted', handleOrderAccepted);

    return () => {
      socketService.off('order.accepted', handleOrderAccepted);
    };
  }, []);

  // Xử lý gửi đơn đặt thợ
  const handleCreateOrder = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        serviceId: selectedService.id,
        pickupLat: lat,
        pickupLng: lng,
        pickupAddress: address,
        description: note || `Yêu cầu dịch vụ: ${selectedService.name}`,
        note: note,
      };

      console.log('🚀 [Customer] Gửi yêu cầu đặt thợ:', payload);
      const res = await orderService.createOrder(payload);

      const orderId = res.orderId || res.order?.id || 'ORD-' + Date.now();
      setCreatedOrderId(orderId);
      setIsSearching(true);
    } catch (err) {
      console.error('❌ [Booking Error]:', err);
      setErrorMessage(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt Thợ Nhanh 24/7</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Lỗi nếu có */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. Chọn Dịch vụ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Chọn loại dịch vụ cần sửa</Text>
          <View style={styles.servicesGrid}>
            {services.map((item) => {
              const isSelected = selectedService?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={isSelected ? styles.serviceCardActive : styles.serviceCard}
                  onPress={() => setSelectedService(item)}
                  activeOpacity={0.8}
                >
                  <View style={isSelected ? styles.iconCircleActive : styles.iconCircle}>
                    <Ionicons
                      name={item.icon || 'construct-outline'}
                      size={22}
                      color={isSelected ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text style={isSelected ? styles.serviceNameActive : styles.serviceName}>
                    {item.name}
                  </Text>
                  <Text style={styles.servicePrice}>
                    {Number(item.basePrice).toLocaleString('vi-VN')} đ / {item.unit || 'lần'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Địa chỉ & Định vị GPS (Google Maps Mockup) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Địa chỉ thực hiện & Tọa độ GPS</Text>
          <View style={styles.mapCard}>
            <View style={styles.mapMockBanner}>
              <Ionicons name="navigate-circle" size={28} color="#2563EB" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.mapMockTitle}>Vị trí GPS chính xác (Google Maps)</Text>
                <Text style={styles.coordsText}>
                  Tọa độ: [{lat.toFixed(6)}, {lng.toFixed(6)}]
                </Text>
              </View>
            </View>

            <View style={styles.addressInputBox}>
              <Ionicons name="location" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ của bạn"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* 3. Ghi chú hư hỏng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Mô tả sự cố (Tùy chọn)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: Bị chập điện tầng 2, cần thợ mang theo bút thử điện và thang..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 4. Tổng chi phí dự tính */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá dịch vụ khởi điểm:</Text>
            <Text style={styles.summaryPrice}>
              {Number(selectedService.basePrice).toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <Text style={styles.summaryNote}>
            * Thợ sẽ đến khảo sát trực tiếp và báo giá chi tiết nếu có phát sinh linh kiện.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Submit Button */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={isSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
          onPress={handleCreateOrder}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="radio" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>TÌM THỢ GẦN NHẤT NGAY</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Radar Đang quét tìm thợ */}
      <Modal visible={isSearching} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.radarCard}>
            <View style={styles.radarCirclePulse}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
            <Text style={styles.radarTitle}>Đang quét tìm thợ gần bạn...</Text>
            <Text style={styles.radarSub}>
              Hệ thống đang phát tín hiệu qua WebSocket tới các thợ trong bán kính 5km
            </Text>

            <View style={styles.radarOrderInfo}>
              <Text style={styles.radarInfoText}>Dịch vụ: {selectedService.name}</Text>
              <Text style={styles.radarInfoText}>Khu vực: {address}</Text>
            </View>

            <TouchableOpacity
              style={styles.cancelSearchBtn}
              onPress={() => setIsSearching(false)}
            >
              <Text style={styles.cancelSearchText}>Hủy tìm kiếm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Thông báo Thợ đã nhận đơn */}
      <Modal visible={!!assignedWorkerInfo} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.acceptedCard}>
            <View style={styles.acceptedBadge}>
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
            </View>
            <Text style={styles.acceptedTitle}>ĐÃ TÌM THẤY THỢ!</Text>
            <Text style={styles.acceptedSub}>Thợ đã xác nhận nhận đơn và đang di chuyển đến</Text>

            <View style={styles.workerDetailsBox}>
              <Text style={styles.workerNameText}>
                👨‍🔧 {assignedWorkerInfo?.fullName || 'Thợ chuyên nghiệp FixGo'}
              </Text>
              <Text style={styles.workerPhoneText}>
                📞 SĐT: {assignedWorkerInfo?.phone || '0987.xxx.xxx'}
              </Text>
              <Text style={styles.workerRatingText}>
                ⭐ Đánh giá: {assignedWorkerInfo?.ratingAvg || 5.0} / 5.0
              </Text>
            </View>

            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => {
                const orderId = createdOrderId;
                setAssignedWorkerInfo(null);
                router.replace(`/(user)/order/${orderId}`);
              }}
            >
              <Text style={styles.trackBtnText}>THEO DÕI THỢ TRÊN BẢN ĐỒ</Text>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#DC2626',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  servicesGrid: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceCardActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleActive: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  serviceNameActive: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapMockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  mapMockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  coordsText: {
    fontSize: 11,
    color: '#4B5563',
  },
  addressInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 46,
  },
  addressInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  summaryNote: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  radarCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  radarCirclePulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  radarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  radarSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  radarOrderInfo: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 4,
  },
  radarInfoText: {
    fontSize: 12,
    color: '#334155',
  },
  cancelSearchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelSearchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptedCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  acceptedBadge: {
    marginBottom: 12,
  },
  acceptedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 6,
  },
  acceptedSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  workerDetailsBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 6,
  },
  workerNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  workerPhoneText: {
    fontSize: 13,
    color: '#15803D',
  },
  workerRatingText: {
    fontSize: 13,
    color: '#15803D',
  },
  trackBtn: {
    width: '100%',
    backgroundColor: '#16A34A',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
