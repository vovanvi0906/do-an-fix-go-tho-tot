import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useOrderStore } from '../../store/useOrderStore';
import { orderService } from '../../services/api/orderService';

/**
 * Screen 6: PaymentReviewScreen
 * Giai đoạn 1: Chọn phương thức thanh toán & xác nhận (POST /orders/:id/pay)
 * Giai đoạn 2: Form đánh giá số sao & nhận xét dịch vụ (POST /orders/:id/review)
 */
export default function PaymentReviewScreen({ navigation, onComplete }) {
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const matchedWorker = useOrderStore((state) => state.matchedWorker);
  const selectedCategory = useOrderStore((state) => state.selectedCategory);
  const appliedVoucher = useOrderStore((state) => state.appliedVoucher);
  const paymentMethod = useOrderStore((state) => state.paymentMethod);
  const paymentSuccess = useOrderStore((state) => state.paymentSuccess);
  const reviewSubmitted = useOrderStore((state) => state.reviewSubmitted);

  const setPaymentMethod = useOrderStore((state) => state.setPaymentMethod);
  const setPaymentSuccess = useOrderStore((state) => state.setPaymentSuccess);
  const setReviewSubmitted = useOrderStore((state) => state.setReviewSubmitted);
  const setOrderStatus = useOrderStore((state) => state.setOrderStatus);
  const resetOrderFlow = useOrderStore((state) => state.resetOrderFlow);

  const orderId = currentOrder?.id || 'demo-order-id';

  // State đánh giá
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Đúng giờ', 'Chuyên nghiệp']);

  // Tính toán số tiền
  const basePrice = currentOrder?.finalPrice || currentOrder?.estimatedPrice || 250000;
  const discountAmount = appliedVoucher ? (appliedVoucher.type === 'PERCENT' ? (basePrice * appliedVoucher.value) / 100 : appliedVoucher.value) : 0;
  const finalTotal = Math.max(0, basePrice - discountAmount);

  // 1. Mutation Thanh toán đơn hàng
  const payMutation = useMutation({
    mutationFn: () => orderService.payOrder(orderId),
    onSuccess: (data) => {
      console.log('💳 [PaymentReviewScreen] Thanh toán thành công:', data);
      setPaymentSuccess(true);
      setOrderStatus('PAID');
    },
    onError: (err) => {
      Alert.alert(
        'Thanh toán thất bại',
        err?.response?.data?.message || 'Không thể xử lý giao dịch lúc này. Vui lòng thử lại.'
      );
    },
  });

  // 2. Mutation Gửi đánh giá thợ
  const reviewMutation = useMutation({
    mutationFn: (payload) => orderService.reviewOrder(orderId, payload),
    onSuccess: (data) => {
      console.log('⭐ [PaymentReviewScreen] Gửi đánh giá thành công:', data);
      setReviewSubmitted(true);
    },
    onError: (err) => {
      Alert.alert(
        'Lỗi gửi đánh giá',
        err?.response?.data?.message || 'Không thể gửi đánh giá lúc này.'
      );
    },
  });

  const handleConfirmPayment = () => {
    payMutation.mutate();
  };

  const handleSubmitReview = () => {
    const combinedComment = `${selectedTags.join(', ')}. ${comment}`.trim();
    reviewMutation.mutate({
      rating,
      comment: combinedComment,
    });
  };

  const handleFinishFlow = () => {
    resetOrderFlow();
    if (onComplete) {
      onComplete();
    } else if (navigation?.navigate) {
      navigation.navigate('Home');
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const paymentMethodsList = [
    {
      id: 'VNPAY',
      name: 'VNPAY QR / Thẻ ATM / Thẻ Quốc tế',
      icon: 'card-outline',
      badge: 'Khuyên dùng',
    },
    {
      id: 'CASH',
      name: 'Tiền mặt (Thanh toán trực tiếp cho thợ)',
      icon: 'cash-outline',
      badge: null,
    },
    {
      id: 'MOMO',
      name: 'Ví điện tử MoMo',
      icon: 'wallet-outline',
      badge: null,
    },
  ];

  const quickReviewTags = [
    'Đúng giờ',
    'Chuyên nghiệp',
    'Nhiệt tình & Thân thiện',
    'Tay nghề cao',
    'Dọn dẹp sạch sẽ',
    'Giá cả hợp lý',
  ];

  const ratingDescriptions = {
    1: 'Rất thất vọng - Kỹ thuật chưa đạt',
    2: 'Chưa hài lòng - Cần cải thiện thêm',
    3: 'Tạm ổn - Đạt yêu cầu cơ bản',
    4: 'Hài lòng - Thợ làm việc cẩn thận',
    5: 'Tuyệt vời - Rất chuyên nghiệp và chu đáo!',
  };

  // Màn hình hoàn thành trọn vẹn
  if (reviewSubmitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.successContainer}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color="#FFF" />
            </View>
          </View>

          <Text style={styles.successTitle}>Hoàn tất dịch vụ!</Text>
          <Text style={styles.successSubtitle}>
            Cảm ơn bạn đã tin tưởng lựa chọn FixGo Pro. Ý kiến đánh giá của bạn là động lực để đội
            ngũ thợ nâng cao chất lượng mỗi ngày.
          </Text>

          <View style={styles.successReceipt}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Mã đơn hàng</Text>
              <Text style={styles.receiptValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Số tiền đã thanh toán</Text>
              <Text style={styles.receiptPriceHighlight}>
                {finalTotal.toLocaleString('vi-VN')} đ
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Đánh giá thợ</Text>
              <Text style={styles.receiptValue}>{'⭐'.repeat(rating)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.homeButton} onPress={handleFinishFlow}>
            <Ionicons name="home-outline" size={20} color="#FFF" />
            <Text style={styles.homeButtonText}>Quay về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Bước 6 / 6</Text>
        </View>
        <Text style={styles.headerTitle}>
          {paymentSuccess ? 'Đánh giá thợ & dịch vụ' : 'Thanh toán đơn hàng'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {paymentSuccess
            ? 'Hãy cho FixGo biết trải nghiệm phục vụ của kỹ thuật viên'
            : 'Chọn hình thức thanh toán an toàn và tiện lợi'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!paymentSuccess ? (
          /* ========================================================
           * GIAI ĐOẠN 1: THANH TOÁN ĐƠN HÀNG
           * ======================================================== */
          <View>
            {/* Hóa đơn chi tiết */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="receipt-outline" size={18} color="#0284C7" />
                <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
              </View>

              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>
                  {selectedCategory?.name || 'Chi phí dịch vụ sửa chữa'}
                </Text>
                <Text style={styles.feeValue}>{basePrice.toLocaleString('vi-VN')} đ</Text>
              </View>

              {appliedVoucher && (
                <View style={styles.feeRow}>
                  <Text style={styles.voucherLabel}>
                    Voucher ưu đãi ({appliedVoucher.code})
                  </Text>
                  <Text style={styles.voucherDiscount}>
                    -{discountAmount.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng số tiền cần thanh toán</Text>
                <Text style={styles.totalValue}>{finalTotal.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>

            {/* Chọn phương thức thanh toán */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="card" size={18} color="#0284C7" />
                <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
              </View>

              <View style={styles.paymentMethodsList}>
                {paymentMethodsList.map((method) => {
                  const isSelected = paymentMethod === method.id;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodItem,
                        isSelected && styles.paymentMethodItemSelected,
                      ]}
                      onPress={() => setPaymentMethod(method.id)}
                    >
                      <View style={styles.methodIconWrap}>
                        <Ionicons
                          name={method.icon}
                          size={22}
                          color={isSelected ? '#0284C7' : '#94A3B8'}
                        />
                      </View>

                      <View style={styles.methodInfo}>
                        <View style={styles.methodNameRow}>
                          <Text
                            style={[
                              styles.methodName,
                              isSelected && styles.methodNameSelected,
                            ]}
                          >
                            {method.name}
                          </Text>
                          {method.badge && (
                            <View style={styles.methodBadge}>
                              <Text style={styles.methodBadgeText}>{method.badge}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bảo mật thanh toán */}
            <View style={styles.securityBox}>
              <Ionicons name="lock-closed" size={16} color="#10B981" />
              <Text style={styles.securityText}>
                Giao dịch được bảo mật và mã hóa chuẩn PCI-DSS 256-bit
              </Text>
            </View>

            {/* Nút xác nhận thanh toán */}
            <TouchableOpacity
              style={[
                styles.primarySubmitButton,
                payMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleConfirmPayment}
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                  <Text style={styles.primarySubmitButtonText}>
                    Xác nhận thanh toán {finalTotal.toLocaleString('vi-VN')} đ
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ========================================================
           * GIAI ĐOẠN 2: ĐÁNH GIÁ THỢ SAU KHI THANH TOÁN
           * ======================================================== */
          <View>
            {/* Banner thanh toán thành công */}
            <View style={styles.paidSuccessBanner}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              <Text style={styles.paidSuccessText}>
                Thanh toán thành công {finalTotal.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            {/* Thẻ thông tin thợ phục vụ */}
            <View style={styles.card}>
              <View style={styles.workerReviewHeader}>
                <Image
                  source={{
                    uri:
                      matchedWorker?.avatarUrl ||
                      currentOrder?.worker?.avatarUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                  }}
                  style={styles.workerReviewAvatar}
                />
                <View style={styles.workerReviewInfo}>
                  <Text style={styles.workerReviewName}>
                    {matchedWorker?.fullName || currentOrder?.worker?.fullName || 'Kỹ thuật viên'}
                  </Text>
                  <Text style={styles.workerReviewService}>
                    {selectedCategory?.name || 'Sửa chữa điện gia dụng'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Tương tác chọn 5 sao */}
              <Text style={styles.starRatingPrompt}>Chất lượng dịch vụ đạt mấy sao?</Text>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => setRating(star)}
                    style={styles.starBtn}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#F59E0B' : '#475569'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.ratingFeeling}>{ratingDescriptions[rating]}</Text>
            </View>

            {/* Nhãn đánh giá nhanh */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Điểm bạn hài lòng nhất:</Text>
              <View style={styles.tagWrap}>
                {quickReviewTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.reviewChip, isSelected && styles.reviewChipSelected]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                        size={16}
                        color={isSelected ? '#0284C7' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.reviewChipText,
                          isSelected && styles.reviewChipTextSelected,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Nhập phản hồi chi tiết */}
              <Text style={[styles.cardTitle, { marginTop: 16 }]}>Góp ý thêm cho thợ:</Text>
              <TextInput
                style={styles.reviewTextInput}
                placeholder="Chia sẻ thêm cảm nhận của bạn về sự tận tâm và tay nghề của thợ..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
              />
            </View>

            {/* Nút gửi đánh giá */}
            <TouchableOpacity
              style={[
                styles.primarySubmitButton,
                reviewMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFF" />
                  <Text style={styles.primarySubmitButtonText}>Gửi đánh giá & Hoàn tất</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  stepBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  stepBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feeLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  feeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  voucherLabel: {
    fontSize: 13,
    color: '#10B981',
  },
  voucherDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284C7',
  },
  paymentMethodsList: {
    gap: 10,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  paymentMethodItemSelected: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  methodIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  methodName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  methodNameSelected: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  methodBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: '#0284C7',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    flex: 1,
  },
  primarySubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  primarySubmitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  paidSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  paidSuccessText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },
  workerReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerReviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#334155',
  },
  workerReviewInfo: {
    marginLeft: 14,
  },
  workerReviewName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  workerReviewService: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  starRatingPrompt: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starBtn: {
    padding: 4,
  },
  ratingFeeling: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 10,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  reviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reviewChipSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: '#0284C7',
  },
  reviewChipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reviewChipTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  reviewTextInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  successReceipt: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginVertical: 24,
    gap: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  receiptPriceHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284C7',
  },
  homeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
