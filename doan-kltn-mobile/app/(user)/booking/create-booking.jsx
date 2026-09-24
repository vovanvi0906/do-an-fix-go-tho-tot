/**
 * BookingFlowScreen — Tạo đơn đặt thợ + Quét tìm thợ (Matching Radar)
 * Route: app/(user)/booking/create-booking.jsx
 *
 * Nghiệp vụ UC_Order:
 * 1. Địa chỉ GPS hiện tại
 * 2. Dịch vụ đã chọn + upload ảnh sự cố
 * 3. Cấu hình ca làm: Instant/Scheduled, Thường/Hỏa tốc, giá đề xuất, mã voucher
 * 4. Xác nhận → Radar quét tìm thợ (pulse animation + countdown 120s)
 *
 * Style: Uber Minimalist — Monochrome, bold typography, subtle depth
 * Logging: 🚀 [BookingService], 📡 [SocketService]
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBooking } from '../../../src/features/booking/hooks/useBooking';
import MatchingRadarView from '../../../src/features/booking/components/MatchingRadarView';
import WorkerFoundView from '../../../src/features/booking/components/WorkerFoundView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BookingFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [photoActionVisible, setPhotoActionVisible] = useState(false);

  const {
    services,
    selectedService,
    setSelectedService,
    address,
    setAddress,
    lat,
    lng,
    note,
    setNote,
    evidencePhotos,
    scheduleType,
    setScheduleType,
    scheduledDate,
    setScheduledDate,
    urgency,
    setUrgency,
    proposedPrice,
    setProposedPrice,
    voucherCode,
    setVoucherCode,
    pickPhoto,
    takePhoto,
    removePhoto,
    matchingStatus,
    orderId,
    remainingSeconds,
    assignedWorker,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    submitOrder,
    cancelMatching,
    resetMatching,
  } = useBooking();

  // ─── Matching states ──────────────────────────────────────────────
  if (matchingStatus === 'SEARCHING') {
    return (
      <SafeAreaView style={styles.fullScreen} edges={['top']}>
        <MatchingRadarView
          remainingSeconds={remainingSeconds}
          serviceName={selectedService?.name || ''}
          address={address}
          onCancel={cancelMatching}
        />
      </SafeAreaView>
    );
  }

  if (matchingStatus === 'FOUND' && assignedWorker) {
    return (
      <SafeAreaView style={styles.fullScreen} edges={['top']}>
        <WorkerFoundView
          worker={assignedWorker}
          onTrackOrder={() => {
            resetMatching();
            router.replace(`/(user)/order/${orderId}`);
          }}
        />
      </SafeAreaView>
    );
  }

  if (matchingStatus === 'TIMEOUT') {
    return (
      <SafeAreaView style={styles.fullScreen} edges={['top']}>
        <View style={styles.timeoutContainer}>
          <View style={styles.timeoutIcon}>
            <Ionicons name="time-outline" size={40} color="#64748B" />
          </View>
          <Text style={styles.timeoutTitle}>Không tìm thấy thợ</Text>
          <Text style={styles.timeoutSub}>
            Hiện không có thợ nào trong khu vực của bạn. Vui lòng thử lại sau hoặc đặt lịch hẹn.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={resetMatching} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLinkBtn} onPress={() => { resetMatching(); router.back(); }}>
            <Text style={styles.backLinkText}>Quay về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Booking Form ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.fullScreen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ─── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt dịch vụ</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Error ──────────────────────────────────────────────── */}
          {errorMessage ? (
            <TouchableOpacity
              style={styles.errorBox}
              onPress={() => setErrorMessage('')}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </TouchableOpacity>
          ) : null}

          {/* ═══════════════════════════════════════════════════════════
              SECTION 1: ĐỊA CHỈ — GPS LOCATION CARD
              ═══════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Địa chỉ</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationPin}>
                <Ionicons name="location-sharp" size={20} color="#0F172A" />
              </View>
              <View style={styles.locationInfo}>
                <TextInput
                  style={styles.locationText}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Nhập địa chỉ của bạn"
                  placeholderTextColor="#94A3B8"
                  numberOfLines={2}
                  multiline
                />
                <Text style={styles.coordsText}>
                  📍 {lat.toFixed(5)}, {lng.toFixed(5)}
                </Text>
              </View>
              <TouchableOpacity style={styles.locationEditBtn} activeOpacity={0.7}>
                <Ionicons name="navigate" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 2: DỊCH VỤ & BẰNG CHỨNG
              ═══════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dịch vụ đã chọn</Text>

            {/* Selected service display */}
            <View style={styles.selectedServiceCard}>
              <View style={styles.serviceIconCircle}>
                <Ionicons
                  name={selectedService?.icon || 'construct-outline'}
                  size={22}
                  color="#0F172A"
                />
              </View>
              <View style={styles.serviceTextArea}>
                <Text style={styles.selectedServiceName}>{selectedService?.name}</Text>
                <Text style={styles.selectedServicePrice}>
                  Từ {Number(selectedService?.basePrice || 0).toLocaleString('vi-VN')}đ / {selectedService?.unit || 'lần'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeServiceBtn}
                onPress={() => router.push('/(user)/booking/select-service')}
                activeOpacity={0.7}
              >
                <Text style={styles.changeServiceText}>Đổi</Text>
              </TouchableOpacity>
            </View>

            {/* Mô tả sự cố */}
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Mô tả chi tiết sự cố (tùy chọn)..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />

            {/* Evidence photos */}
            <Text style={styles.photoLabel}>Ảnh sự cố</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {evidencePhotos.map((uri, index) => (
                <View key={index} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {evidencePhotos.length < 5 && (
                <TouchableOpacity
                  style={styles.photoAddBtn}
                  onPress={() => setPhotoActionVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={24} color="#94A3B8" />
                  <Text style={styles.photoAddText}>Thêm ảnh</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 3: CẤU HÌNH CA LÀM
              ═══════════════════════════════════════════════════════════ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cấu hình</Text>

            {/* Schedule type toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, scheduleType === 'INSTANT' && styles.toggleBtnActive]}
                onPress={() => setScheduleType('INSTANT')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="flash"
                  size={16}
                  color={scheduleType === 'INSTANT' ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[styles.toggleText, scheduleType === 'INSTANT' && styles.toggleTextActive]}>
                  Làm ngay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, scheduleType === 'SCHEDULED' && styles.toggleBtnActive]}
                onPress={() => setScheduleType('SCHEDULED')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={scheduleType === 'SCHEDULED' ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[styles.toggleText, scheduleType === 'SCHEDULED' && styles.toggleTextActive]}>
                  Đặt lịch
                </Text>
              </TouchableOpacity>
            </View>

            {/* DateTimePicker placeholder for SCHEDULED */}
            {scheduleType === 'SCHEDULED' && (
              <TouchableOpacity style={styles.datePickerBtn} activeOpacity={0.7}>
                <Ionicons name="time-outline" size={18} color="#0F172A" />
                <Text style={styles.datePickerText}>
                  {scheduledDate.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
            )}

            {/* Urgency toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, urgency === 'NORMAL' && styles.toggleBtnActive]}
                onPress={() => setUrgency('NORMAL')}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleText, urgency === 'NORMAL' && styles.toggleTextActive]}>
                  Thường
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  urgency === 'EXPRESS' && styles.toggleBtnActiveExpress,
                ]}
                onPress={() => setUrgency('EXPRESS')}
                activeOpacity={0.85}
              >
                <Text style={styles.expressIcon}>⚡</Text>
                <Text
                  style={[
                    styles.toggleText,
                    urgency === 'EXPRESS' && styles.toggleTextActiveExpress,
                  ]}
                >
                  Hỏa tốc
                </Text>
              </TouchableOpacity>
            </View>

            {/* Proposed price */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mức giá có thể trả (đ)</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.currencyPrefix}>₫</Text>
                <TextInput
                  style={styles.priceInput}
                  value={proposedPrice}
                  onChangeText={setProposedPrice}
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Voucher code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mã giảm giá</Text>
              <View style={styles.voucherInputRow}>
                <Ionicons name="pricetag-outline" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.voucherInput}
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                  placeholder="Nhập mã voucher"
                  placeholderTextColor="#CBD5E1"
                  autoCapitalize="characters"
                />
                {voucherCode.length > 0 && (
                  <TouchableOpacity onPress={() => setVoucherCode('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* ─── Summary ──────────────────────────────────────────────── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giá khởi điểm</Text>
              <Text style={styles.summaryPrice}>
                {Number(selectedService?.basePrice || 0).toLocaleString('vi-VN')}đ
              </Text>
            </View>
            {urgency === 'EXPRESS' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phụ phí hỏa tốc ⚡</Text>
                <Text style={styles.summaryPriceAccent}>+50,000đ</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={styles.summaryTotalLabel}>Tạm tính</Text>
              <Text style={styles.summaryTotalPrice}>
                {Number(
                  (selectedService?.basePrice || 0) + (urgency === 'EXPRESS' ? 50000 : 0)
                ).toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <Text style={styles.summaryNote}>
              * Thợ sẽ khảo sát và báo giá chi tiết nếu có phát sinh linh kiện
            </Text>
          </View>

          {/* Extra padding for footer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ─── Footer CTA ──────────────────────────────────────────── */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={submitOrder}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Xác nhận đặt đơn</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Photo Action Sheet ──────────────────────────────────── */}
        <Modal
          visible={photoActionVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPhotoActionVisible(false)}
        >
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setPhotoActionVisible(false)}
          >
            <View style={styles.actionSheet}>
              <View style={styles.actionSheetHandle} />

              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setPhotoActionVisible(false);
                  takePhoto();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={22} color="#0F172A" />
                <Text style={styles.actionSheetBtnText}>Chụp ảnh mới</Text>
              </TouchableOpacity>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setPhotoActionVisible(false);
                  pickPhoto();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={22} color="#0F172A" />
                <Text style={styles.actionSheetBtnText}>Chọn từ thư viện</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetCancelBtn}
                onPress={() => setPhotoActionVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionSheetCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STYLES — Uber Minimalist: Monochrome, bold type, sharp borders
// ═══════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ─── Header ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  // ─── Scroll ─────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // ─── Error ──────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  // ─── Section ────────────────────────────────────────────────────────
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  // ─── Location Card ──────────────────────────────────────────────────
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  locationPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
    padding: 0,
  },
  coordsText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  locationEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // ─── Selected Service ───────────────────────────────────────────────
  selectedServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceTextArea: {
    flex: 1,
  },
  selectedServiceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  selectedServicePrice: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  changeServiceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changeServiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  // ─── Note input ─────────────────────────────────────────────────────
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  // ─── Photos ─────────────────────────────────────────────────────────
  photoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // ─── Toggle Buttons ─────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  toggleBtnActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    gap: 6,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  toggleBtnActiveExpress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleTextActiveExpress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expressIcon: {
    fontSize: 14,
  },
  // ─── Inputs ─────────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  voucherInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  voucherInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    padding: 0,
  },
  // ─── Date Picker ────────────────────────────────────────────────────
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  datePickerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  // ─── Summary ────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowTotal: {
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  summaryPriceAccent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryTotalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryNote: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  // ─── Footer ─────────────────────────────────────────────────────────
  footerBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ─── Timeout view ───────────────────────────────────────────────────
  timeoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  timeoutIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeoutTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  timeoutSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  retryBtn: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backLinkBtn: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  // ─── Photo Action Sheet ─────────────────────────────────────────────
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  actionSheetBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionSheetCancelBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
});
