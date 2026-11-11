import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useOrderStore } from '../../store/useOrderStore';
import { orderService } from '../../services/api/orderService';

const { width } = Dimensions.get('window');

/**
 * Screen 5: AcceptanceScreen
 * Hiển thị ảnh Before/After side-by-side
 * Hiển thị điểm tương đồng matchScore từ AI Service
 * Nút 'Xác nhận hoàn thành' (POST /orders/:id/accept-completion) và 'Khiếu nại' (POST /orders/:id/dispute)
 */
export default function AcceptanceScreen({ navigation, onNext, onDispute }) {
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const setOrderStatus = useOrderStore((state) => state.setOrderStatus);
  const setAiVerification = useOrderStore((state) => state.setAiVerification);

  const orderId = currentOrder?.id || 'demo-order-id';

  // State Modal khiếu nại
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('');
  const [fullViewImage, setFullViewImage] = useState(null);

  // Default demo images nếu backend chưa có ảnh thực tế từ camera thợ
  const beforeImageUrl =
    currentOrder?.beforeImageUrl ||
    currentOrder?.images?.find((img) => img.type === 'BEFORE')?.url ||
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500';

  const afterImageUrl =
    currentOrder?.afterImageUrl ||
    currentOrder?.images?.find((img) => img.type === 'AFTER')?.url ||
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500';

  // 1. React Query gọi AI nghiệm thu (POST /orders/:id/verify-completion)
  const {
    data: aiResult,
    isLoading: isAiLoading,
    isError: isAiError,
    error: aiError,
    refetch: refetchAiVerification,
  } = useQuery({
    queryKey: ['ai-verification', orderId],
    queryFn: async () => {
      console.log(`🤖 [AcceptanceScreen] Gọi verifyCompletion cho đơn ${orderId}`);
      return orderService.verifyCompletion(orderId);
    },
    enabled: !!orderId,
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (aiResult) {
      setAiVerification(aiResult);
    }
  }, [aiResult]);

  // Match score tính phần trăm (fallback 94% nếu backend mock)
  const matchScore = aiResult?.matchScore != null ? Math.round(aiResult.matchScore * 100) : 94;
  const isPassed = aiResult?.passed ?? (matchScore >= 70);
  const aiNotes =
    aiResult?.notes ||
    'FixGo AI: Thiết bị đã được căn chỉnh, đấu nối dây chuẩn xác, bề mặt hoàn thiện sạch sẽ và an toàn.';

  // 2. Mutation Xác nhận hoàn thành đơn
  const acceptMutation = useMutation({
    mutationFn: () => orderService.acceptCompletion(orderId),
    onSuccess: (data) => {
      console.log('✅ [AcceptanceScreen] Nghiệm thu thành công:', data);
      setOrderStatus('COMPLETED');
      Alert.alert(
        'Nghiệm thu thành công!',
        'Cảm ơn bạn đã xác nhận. Mời bạn tiến hành thanh toán và đánh giá chất lượng dịch vụ.',
        [
          {
            text: 'Tiếp tục',
            onPress: () => {
              if (onNext) onNext();
              else if (navigation?.navigate) navigation.navigate('PaymentReviewScreen');
            },
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert(
        'Lỗi nghiệm thu',
        err?.response?.data?.message || 'Không thể xác nhận hoàn thành vào lúc này.'
      );
    },
  });

  // 3. Mutation Gửi khiếu nại
  const disputeMutation = useMutation({
    mutationFn: (reasonText) => orderService.disputeOrder(orderId, { reason: reasonText }),
    onSuccess: () => {
      setIsDisputeModalVisible(false);
      setOrderStatus('DISPUTED');
      Alert.alert(
        'Đã tiếp nhận khiếu nại',
        'Bộ phận Chăm sóc Khách hàng FixGo Pro sẽ liên hệ hỗ trợ bạn trong vòng 15 phút.',
        [
          {
            text: 'Đã hiểu',
            onPress: () => {
              if (onDispute) onDispute();
            },
          },
        ]
      );
    },
    onError: (err) => {
      Alert.alert('Lỗi gửi khiếu nại', err?.response?.data?.message || 'Không thể gửi khiếu nại.');
    },
  });

  const handleConfirmDispute = () => {
    const finalReason = disputeReason.trim() || selectedPresetReason;
    if (!finalReason) {
      Alert.alert('Vui lòng chọn hoặc nhập lý do khiếu nại.');
      return;
    }
    disputeMutation.mutate(finalReason);
  };

  const presetDisputeReasons = [
    'Sự cố chưa được giải quyết triệt để',
    'Thiết bị vẫn còn tiếng kêu hoặc chập chờn',
    'Khu vực sửa chữa chưa được dọn dẹp',
    'Chi phí phát sinh không hợp lý',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Bước 5 / 6</Text>
        </View>
        <Text style={styles.headerTitle}>Nghiệm thu dịch vụ</Text>
        <Text style={styles.headerSubtitle}>
          So sánh kết quả trước & sau sửa chữa qua kiểm định FixGo AI
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Khối hiển thị ảnh Trước & Sau Side-by-Side */}
        <View style={styles.compareCard}>
          <Text style={styles.sectionTitle}>Hình ảnh đối chiếu thực tế</Text>

          <View style={styles.sideBySideContainer}>
            {/* Ảnh Trước */}
            <TouchableOpacity
              style={styles.imageBox}
              activeOpacity={0.8}
              onPress={() => setFullViewImage({ url: beforeImageUrl, title: 'Ảnh trước sửa chữa' })}
            >
              <Image source={{ uri: beforeImageUrl }} style={styles.compareImage} />
              <View style={[styles.imageTag, styles.tagBefore]}>
                <Ionicons name="time-outline" size={12} color="#FFF" />
                <Text style={styles.imageTagText}>TRƯỚC SỬA</Text>
              </View>
              <View style={styles.zoomHint}>
                <Ionicons name="scan-outline" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Mũi tên chuyển đổi */}
            <View style={styles.arrowBetween}>
              <Ionicons name="arrow-forward-circle" size={32} color="#0284C7" />
            </View>

            {/* Ảnh Sau */}
            <TouchableOpacity
              style={styles.imageBox}
              activeOpacity={0.8}
              onPress={() => setFullViewImage({ url: afterImageUrl, title: 'Ảnh sau hoàn thành' })}
            >
              <Image source={{ uri: afterImageUrl }} style={styles.compareImage} />
              <View style={[styles.imageTag, styles.tagAfter]}>
                <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                <Text style={styles.imageTagText}>HOÀN THÀNH</Text>
              </View>
              <View style={styles.zoomHint}>
                <Ionicons name="scan-outline" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Khối kết quả AI Verification & Match Score */}
        <View style={styles.aiResultCard}>
          <View style={styles.aiResultHeader}>
            <View style={styles.aiRobotBadge}>
              <Ionicons name="hardware-chip" size={18} color="#0284C7" />
              <Text style={styles.aiRobotTitle}>FixGo AI Vision Guard</Text>
            </View>

            {isAiLoading ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : isPassed ? (
              <View style={styles.passedBadge}>
                <Ionicons name="checkmark-done" size={14} color="#10B981" />
                <Text style={styles.passedText}>ĐẠT CHUẨN</Text>
              </View>
            ) : (
              <View style={styles.warningBadge}>
                <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                <Text style={styles.warningText}>CẦN XEM LẠI</Text>
              </View>
            )}
          </View>

          {/* Error state nếu AI call thất bại */}
          {isAiError ? (
            <View style={styles.aiErrorBox}>
              <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
              <Text style={styles.aiErrorText}>
                {aiError?.message || 'Không thể đối chiếu ảnh tự động qua AI lúc này.'}
              </Text>
              <TouchableOpacity
                style={styles.aiRetryButton}
                onPress={() => refetchAiVerification()}
              >
                <Text style={styles.aiRetryButtonText}>Phân tích lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Thanh điểm số Match Score */}
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreNumber}>{matchScore}%</Text>
                  <Text style={styles.scoreLabel}>Độ chuẩn xác phục hồi</Text>
                </View>

                <View style={styles.scoreProgressContainer}>
                  <View style={styles.scoreProgressTrack}>
                    <View
                      style={[
                        styles.scoreProgressFill,
                        { width: `${matchScore}%` },
                        matchScore >= 80 ? styles.fillHigh : styles.fillMed,
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreSubtext}>
                    Ngưỡng tiêu chuẩn chất lượng hệ thống: ≥ 70%
                  </Text>
                </View>
              </View>

              {/* Nhận định AI */}
              <View style={styles.aiNotesBox}>
                <Ionicons name="sparkles" size={16} color="#38BDF8" style={{ marginTop: 2 }} />
                <Text style={styles.aiNotesText}>{aiNotes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Cam kết chất lượng dịch vụ */}
        <View style={styles.guaranteeBox}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Bảo hành tiêu chuẩn FixGo Care</Text>
            <Text style={styles.guaranteeText}>
              Miễn phí sửa chữa lại 100% trong 30 ngày nếu phát sinh sự cố tương tự.
            </Text>
          </View>
        </View>

        {/* Nhóm 2 nút hành động: Nghiệm thu hoàn thành / Khiếu nại */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              acceptMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.acceptButtonText}>Xác nhận hoàn thành</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.disputeButton}
            onPress={() => setIsDisputeModalVisible(true)}
            disabled={acceptMutation.isPending}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#EF4444" />
            <Text style={styles.disputeButtonText}>Tôi muốn khiếu nại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal phóng to ảnh */}
      <Modal visible={!!fullViewImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.fullImageHeader}>
            <Text style={styles.fullImageTitle}>{fullViewImage?.title}</Text>
            <TouchableOpacity onPress={() => setFullViewImage(null)} style={styles.closeFullImage}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
          {fullViewImage && (
            <Image
              source={{ uri: fullViewImage.url }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Modal Khiếu nại */}
      <Modal visible={isDisputeModalVisible} transparent animationType="slide">
        <View style={styles.disputeModalOverlay}>
          <View style={styles.disputeModalCard}>
            <View style={styles.disputeModalHeader}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.disputeModalTitle}>Khiếu nại chất lượng dịch vụ</Text>
            </View>
            <Text style={styles.disputeModalSubtitle}>
              Vui lòng cho FixGo biết vấn đề bạn gặp phải để chúng tôi giải quyết kịp thời:
            </Text>

            {/* Danh sách lý do nhanh */}
            <View style={styles.presetContainer}>
              {presetDisputeReasons.map((reason) => {
                const isSelected = selectedPresetReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => {
                      setSelectedPresetReason(reason);
                      setDisputeReason(reason);
                    }}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ô nhập ghi chú lý do chi tiết */}
            <TextInput
              style={styles.disputeInput}
              placeholder="Mô tả cụ thể thêm vấn đề (tùy chọn)..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <View style={styles.disputeModalActions}>
              <TouchableOpacity
                style={styles.disputeCancelBtn}
                onPress={() => setIsDisputeModalVisible(false)}
              >
                <Text style={styles.disputeCancelBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.disputeSubmitBtn,
                  disputeMutation.isPending && styles.buttonDisabled,
                ]}
                onPress={handleConfirmDispute}
                disabled={disputeMutation.isPending}
              >
                {disputeMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.disputeSubmitBtnText}>Gửi khiếu nại</Text>
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
  compareCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  sideBySideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageBox: {
    width: (width - 40 - 32 - 40) / 2,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  compareImage: {
    width: '100%',
    height: '100%',
  },
  imageTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBefore: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
  },
  tagAfter: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  imageTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBetween: {
    width: 32,
    alignItems: 'center',
  },
  aiResultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    padding: 16,
    marginBottom: 16,
  },
  aiResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiRobotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiRobotTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  passedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  passedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: -2,
  },
  scoreProgressContainer: {
    flex: 1,
  },
  scoreProgressTrack: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  fillHigh: {
    backgroundColor: '#10B981',
  },
  fillMed: {
    backgroundColor: '#F59E0B',
  },
  scoreSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  aiNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  aiNotesText: {
    flex: 1,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  aiErrorBox: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  aiErrorText: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
  },
  aiRetryButton: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiRetryButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  guaranteeText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionGroup: {
    gap: 10,
    paddingBottom: 32,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  disputeButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  fullImageTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeFullImage: {
    padding: 8,
  },
  fullScreenImage: {
    width: '95%',
    height: '75%',
  },
  disputeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  disputeModalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  disputeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  disputeModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  disputeModalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  presetContainer: {
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  presetChipActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  presetChipText: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  presetChipTextActive: {
    color: '#EF4444',
    fontWeight: '700',
  },
  disputeInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  disputeModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  disputeCancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  disputeCancelBtnText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 14,
  },
  disputeSubmitBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  disputeSubmitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
