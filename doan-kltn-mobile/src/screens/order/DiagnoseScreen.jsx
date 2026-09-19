import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/api/orderService';
import { useOrderStore } from '../../store/useOrderStore';

// Mẫu ảnh sự cố giả lập thực tế giúp kiểm thử nhanh trên Mobile
const SAMPLE_ISSUES = [
  {
    id: 'sample_dien',
    label: 'Chập cầu dao / Aptomat',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    desc: 'Cầu dao tổng bị chập điện, phát ra tiếng nổ lẹt đẹt và bốc khói nhẹ',
  },
  {
    id: 'sample_nuoc',
    label: 'Bục đường ống nước',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
    desc: 'Đường ống nước dưới bồn rửa bị bục làm ngập sàn nhà tắm',
  },
  {
    id: 'sample_mo',
    label: 'Ảnh mờ (Test Fallback thủ công)',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    desc: 'Ảnh chụp bị tối mờ không rõ vật thể hỏng hóc',
  },
];

export default function DiagnoseScreen({ navigation, onNext }) {
  const { setDiagnoseResult, setSelectedCategory, selectedCategory } = useOrderStore();

  const [imageUrl, setImageUrl] = useState(SAMPLE_ISSUES[0].url);
  const [description, setDescription] = useState(SAMPLE_ISSUES[0].desc);
  const [diagnoseData, setDiagnoseData] = useState(null);

  // 1. Tải danh mục dịch vụ từ Backend bằng React Query
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const res = await orderService.getCategories();
      return Array.isArray(res) ? res : [];
    },
  });

  // 2. Gọi API POST /orders/diagnose qua React Query Mutation
  const diagnoseMutation = useMutation({
    mutationFn: async (payload) => {
      return orderService.diagnose(payload);
    },
    onSuccess: (data) => {
      setDiagnoseData(data);
      setDiagnoseResult(data);

      if (data.suggestedCategoryId && !data.requiresManualSelection) {
        const found = categories.find((c) => c.id === data.suggestedCategoryId);
        if (found) setSelectedCategory(found);
      }
    },
  });

  const handleSelectSample = (sample) => {
    setImageUrl(sample.url);
    setDescription(sample.desc);
    setDiagnoseData(null);
  };

  const handleRunDiagnose = () => {
    diagnoseMutation.mutate({ imageUrl, description });
  };

  const handleProceed = () => {
    if (onNext) {
      onNext();
    } else if (navigation?.navigate) {
      navigation.navigate('ConfirmOrder');
    }
  };

  const confidencePercent = Math.round((diagnoseData?.confidence || 0) * 100);
  const isHighConfidence = confidencePercent >= 60;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>BƯỚC 1/6</Text>
        </View>
        <Text style={styles.headerTitle}>Chẩn Đoán Sự Cố AI</Text>
        <Text style={styles.headerSubtitle}>
          Chụp hoặc gửi ảnh sự cố, AI Vision sẽ tự động nhận diện thiết bị hỏng và ước tính chi phí.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Khối xem trước ảnh sự cố */}
        <View style={styles.imageCard}>
          <Image source={{ uri: imageUrl }} style={styles.incidentImage} resizeMode="cover" />
          <View style={styles.aiBadgeOverlay}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.aiBadgeOverlayText}>AI Vision 4.0</Text>
          </View>
        </View>

        {/* Chọn ảnh mẫu nhanh */}
        <Text style={styles.sectionLabel}>Mẫu sự cố thực tế thử nghiệm:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.samplesScroll}>
          {SAMPLE_ISSUES.map((sample) => {
            const isSelected = sample.url === imageUrl;
            return (
              <TouchableOpacity
                key={sample.id}
                style={[styles.sampleBtn, isSelected && styles.sampleBtnActive]}
                onPress={() => handleSelectSample(sample)}
              >
                <Text style={[styles.sampleBtnText, isSelected && styles.sampleBtnTextActive]}>
                  {sample.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Input mô tả sự cố */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mô tả thêm tình trạng sự cố:</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Ví dụ: Aptomat bốc khói đen, ổ cắm bị tóe lửa..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Nút Phân tích AI */}
        <TouchableOpacity
          style={[styles.actionBtn, diagnoseMutation.isPending && styles.actionBtnDisabled]}
          onPress={handleRunDiagnose}
          disabled={diagnoseMutation.isPending}
        >
          {diagnoseMutation.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.actionBtnText}>Đang quét & nhận diện vật thể AI...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Phân Tích Bằng AI Vision</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Trạng thái lỗi */}
        {diagnoseMutation.isError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>
              {diagnoseMutation.error?.message || 'Không thể kết nối AI Service. Bạn vẫn có thể chọn dịch vụ thủ công bên dưới.'}
            </Text>
          </View>
        )}

        {/* Khối hiển thị kết quả AI sau khi phân tích */}
        {diagnoseData && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleRow}>
                <Ionicons
                  name={isHighConfidence ? 'checkmark-circle' : 'information-circle'}
                  size={22}
                  color={isHighConfidence ? '#10B981' : '#F59E0B'}
                />
                <Text style={styles.resultTitle}>
                  {isHighConfidence ? 'Kết Quả Nhận Diện AI' : 'Độ Tin Cậy Thấp — Chọn Thủ Công'}
                </Text>
              </View>
              <View
                style={[
                  styles.confidencePill,
                  { backgroundColor: isHighConfidence ? '#ECFDF5' : '#FFFBEB' },
                ]}
              >
                <Text
                  style={[
                    styles.confidencePillText,
                    { color: isHighConfidence ? '#059669' : '#D97706' },
                  ]}
                >
                  {confidencePercent}% Khớp
                </Text>
              </View>
            </View>

            {/* Danh sách vật thể nhận diện (Labels) */}
            {diagnoseData.detectedLabels?.length > 0 && (
              <View style={styles.labelsWrapper}>
                <Text style={styles.subTextLabel}>Vật thể phát hiện:</Text>
                <View style={styles.chipsContainer}>
                  {diagnoseData.detectedLabels.map((lbl, idx) => (
                    <View key={idx} style={styles.labelChip}>
                      <Text style={styles.labelChipText}>#{lbl}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Khoảng giá ước tính */}
            {diagnoseData.estimatedPriceMin && (
              <View style={styles.priceEstimateRow}>
                <Text style={styles.priceEstimateLabel}>Ước tính giá sửa chữa:</Text>
                <Text style={styles.priceEstimateValue}>
                  {diagnoseData.estimatedPriceMin?.toLocaleString('vi-VN')} đ ~{' '}
                  {diagnoseData.estimatedPriceMax?.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            )}

            <Text style={styles.resultMessage}>{diagnoseData.message}</Text>
          </View>
        )}

        {/* Khối cho phép khách sửa hoặc chọn Category thủ công */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionHeading}>
            {diagnoseData?.requiresManualSelection
              ? '👉 Vui lòng chọn Danh mục dịch vụ thủ công:'
              : 'Danh mục dịch vụ áp dụng (Có thể đổi thủ công):'}
          </Text>

          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <View style={styles.categoryIconCircle}>
                    <Ionicons
                      name={cat.name.toLowerCase().includes('điện') ? 'flash' : 'water'}
                      size={20}
                      color={isSelected ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text style={[styles.categoryCardTitle, isSelected && styles.categoryCardTitleSelected]}>
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryCardPrice}>
                    Từ {Number(cat.basePrice || 150000).toLocaleString('vi-VN')} đ
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nút xác nhận chuyển Bước 2 */}
        <TouchableOpacity
          style={[styles.proceedBtn, !selectedCategory && styles.actionBtnDisabled]}
          onPress={handleProceed}
          disabled={!selectedCategory}
        >
          <Text style={styles.proceedBtnText}>
            Tiếp Tục Đặt Đơn ({selectedCategory?.name || 'Chưa chọn ngành'})
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imageCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginBottom: 16,
  },
  incidentImage: {
    width: '100%',
    height: '100%',
  },
  aiBadgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  aiBadgeOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  samplesScroll: {
    marginBottom: 16,
  },
  sampleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  sampleBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sampleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sampleBtnTextActive: {
    color: '#2563EB',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  confidencePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidencePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  labelsWrapper: {
    marginBottom: 12,
  },
  subTextLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  priceEstimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  priceEstimateLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  priceEstimateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  resultMessage: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  categoryCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  categoryCardTitleSelected: {
    color: '#2563EB',
  },
  categoryCardPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  proceedBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
