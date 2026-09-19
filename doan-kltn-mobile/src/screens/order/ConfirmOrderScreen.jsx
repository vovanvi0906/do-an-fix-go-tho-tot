import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { orderService } from '../../services/api/orderService';
import { useOrderStore } from '../../store/useOrderStore';

const SAMPLE_ADDRESSES = [
  {
    id: 'addr_1',
    title: 'Nhà riêng',
    addressText: 'Số 123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    lat: 10.7769,
    lng: 106.7009,
  },
  {
    id: 'addr_2',
    title: 'Văn phòng',
    addressText: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh',
    lat: 10.7950,
    lng: 106.7218,
  },
];

const TIME_OPTIONS = [
  { id: 'now', label: 'Càng sớm càng tốt (15-30 phút)', isNow: true },
  { id: 'later_today', label: 'Hôm nay lúc 14:00 - 16:00', isNow: false },
  { id: 'tomorrow', label: 'Ngày mai lúc 09:00 - 11:00', isNow: false },
];

export default function ConfirmOrderScreen({ navigation, onBack, onNext }) {
  const {
    selectedCategory,
    diagnoseResult,
    selectedAddress,
    setSelectedAddress,
    selectedTime,
    setSelectedTime,
    orderNote,
    setOrderNote,
    appliedVoucher,
    applyVoucher,
    setCurrentOrder,
  } = useOrderStore();

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [activeAddressTab, setActiveAddressTab] = useState('addr_1');

  // Tính toán bảng giá
  const baseServicePrice = Number(
    selectedCategory?.basePrice || diagnoseResult?.estimatedPriceMin || 150000
  );
  const discountAmount = appliedVoucher?.discountAmount || 0;
  const finalPrice = Math.max(0, baseServicePrice - discountAmount);

  // Gọi POST /orders tạo đơn mới qua React Query Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (payload) => {
      return orderService.createOrder(payload);
    },
    onSuccess: (newOrder) => {
      console.log('✅ [ConfirmOrder] Tạo đơn thành công:', newOrder);
      setCurrentOrder(newOrder);

      if (onNext) {
        onNext(newOrder);
      } else if (navigation?.navigate) {
        navigation.navigate('Searching', { orderId: newOrder.id });
      }
    },
    onError: (err) => {
      Alert.alert('Không thể tạo đơn', err.message || 'Vui lòng kiểm tra lại kết nối!');
    },
  });

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã ưu đãi');
      return;
    }

    if (code === 'FIXGO20' || code === 'GIAM20') {
      applyVoucher({ code, discountAmount: 20000, title: 'Giảm 20.000đ cho đơn đầu tiên' });
      setVoucherError('');
      setVoucherCode('');
    } else if (code === 'VIP50') {
      applyVoucher({ code, discountAmount: 50000, title: 'Voucher Khách Hàng VIP - 50.000đ' });
      setVoucherError('');
      setVoucherCode('');
    } else {
      setVoucherError('Mã ưu đãi không tồn tại hoặc đã hết hạn.');
    }
  };

  const handleConfirmBooking = () => {
    const payload = {
      categoryId: selectedCategory?.id,
      addressText: selectedAddress.addressText,
      lat: selectedAddress.lat,
      lng: selectedAddress.lng,
      note: orderNote || diagnoseResult?.issueDescription || 'Cần thợ kiểm tra xử lý',
      estimatedPrice: finalPrice,
      scheduledAt: selectedTime === 'now' ? null : new Date().toISOString(),
      aiSuggestedCategoryId: diagnoseResult?.suggestedCategoryId,
      aiConfidence: diagnoseResult?.confidence,
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (onBack ? onBack() : navigation?.goBack())}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.stepBadgeText}>BƯỚC 2/6</Text>
          <Text style={styles.headerTitle}>Xác Nhận Đặt Đơn</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tóm tắt dịch vụ đã chọn */}
        <View style={styles.serviceSummaryCard}>
          <View style={styles.serviceIconWrap}>
            <Ionicons name="construct" size={24} color="#2563EB" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{selectedCategory?.name || 'Sửa chữa điện - nước'}</Text>
            <Text style={styles.servicePriceNote}>
              Giá khởi điểm từ: {baseServicePrice.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* 1. Địa điểm làm việc */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Địa Điểm Thực Hiện</Text>
          </View>

          {/* Sổ địa chỉ mẫu */}
          <View style={styles.addressList}>
            {SAMPLE_ADDRESSES.map((addr) => {
              const isSelected = activeAddressTab === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addressItem, isSelected && styles.addressItemActive]}
                  onPress={() => {
                    setActiveAddressTab(addr.id);
                    setSelectedAddress(addr);
                  }}
                >
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressTitleText}>{addr.title}</Text>
                    <Text style={styles.addressDetailText}>{addr.addressText}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.pinMapBtn}>
            <Ionicons name="map-outline" size={16} color="#2563EB" />
            <Text style={styles.pinMapText}>Ghim vị trí chính xác trên bản đồ</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Thời gian mong muốn */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Thời Gian Đến Phục Vụ</Text>
          </View>
          <View style={styles.timeOptionsContainer}>
            {TIME_OPTIONS.map((time) => {
              const isSelected = selectedTime === time.id || (selectedTime && selectedTime.includes(time.id));
              return (
                <TouchableOpacity
                  key={time.id}
                  style={[styles.timeBtn, isSelected && styles.timeBtnActive]}
                  onPress={() => setSelectedTime(time.id)}
                >
                  <Ionicons
                    name={time.isNow ? 'flash' : 'calendar'}
                    size={16}
                    color={isSelected ? '#2563EB' : '#64748B'}
                  />
                  <Text style={[styles.timeBtnText, isSelected && styles.timeBtnTextActive]}>
                    {time.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Ghi chú cho thợ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbox-ellipses" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Ghi Chú Cho Kỹ Thuật Viên</Text>
          </View>
          <TextInput
            style={styles.noteInput}
            value={orderNote}
            onChangeText={setOrderNote}
            placeholder="Ví dụ: Bấm chuông cửa số 2, mang theo thang nhôm..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* 4. Mã giảm giá / Voucher */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ticket" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Mã Khuyến Mãi (Voucher)</Text>
          </View>

          {appliedVoucher ? (
            <View style={styles.appliedVoucherRow}>
              <View style={styles.voucherBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.voucherBadgeCode}>{appliedVoucher.code}</Text>
                <Text style={styles.voucherBadgeDesc}>(-{appliedVoucher.discountAmount.toLocaleString('vi-VN')} đ)</Text>
              </View>
              <TouchableOpacity onPress={() => applyVoucher(null)}>
                <Text style={styles.removeVoucherText}>Hủy áp dụng</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.voucherInputRow}>
                <TextInput
                  style={styles.voucherInput}
                  value={voucherCode}
                  onChangeText={(txt) => {
                    setVoucherCode(txt);
                    setVoucherError('');
                  }}
                  placeholder="Nhập mã FIXGO20 hoặc VIP50..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyVoucherBtn} onPress={handleApplyVoucher}>
                  <Text style={styles.applyVoucherText}>Áp Dụng</Text>
                </TouchableOpacity>
              </View>
              {voucherError ? <Text style={styles.voucherErrorText}>{voucherError}</Text> : null}
            </View>
          )}
        </View>

        {/* 5. Tóm tắt chi phí thanh toán */}
        <View style={styles.priceBreakdownCard}>
          <Text style={styles.priceSectionTitle}>Tóm Tắt Chi Phí</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá cơ bản danh mục:</Text>
            <Text style={styles.priceValue}>{baseServicePrice.toLocaleString('vi-VN')} đ</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#059669' }]}>Ưu đãi Voucher ({appliedVoucher?.code}):</Text>
              <Text style={[styles.priceValue, { color: '#059669' }]}>
                -{discountAmount.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
          <View style={styles.totalPriceRow}>
            <Text style={styles.totalPriceLabel}>Tổng thanh toán tạm tính:</Text>
            <Text style={styles.totalPriceValue}>{finalPrice.toLocaleString('vi-VN')} đ</Text>
          </View>
          <Text style={styles.priceDisclaimer}>
            * Chi phí thực tế có thể phát sinh thêm linh kiện nếu khách hàng đồng ý thay thế tại chỗ.
          </Text>
        </View>

        {/* Trạng thái lỗi nếu có */}
        {createOrderMutation.isError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{createOrderMutation.error?.message}</Text>
          </View>
        )}

        {/* Nút bấm Xác Nhận Đặt Đơn */}
        <TouchableOpacity
          style={[styles.submitOrderBtn, createOrderMutation.isPending && styles.submitBtnDisabled]}
          onPress={handleConfirmBooking}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <View style={styles.btnRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.submitOrderText}>Đang tạo đơn & quét thợ 5km...</Text>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
              <Text style={styles.submitOrderText}>Xác Nhận Đặt Đơn Ngay</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  serviceSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 12,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  servicePriceNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  addressList: {
    gap: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  addressItemActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  addressTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pinMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  pinMapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  timeOptionsContainer: {
    gap: 8,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  timeBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  timeBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  voucherInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  applyVoucherBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyVoucherText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  voucherErrorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
  appliedVoucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 10,
  },
  voucherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherBadgeCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  voucherBadgeDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  removeVoucherText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  priceBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  priceSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  priceDisclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  submitOrderBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
