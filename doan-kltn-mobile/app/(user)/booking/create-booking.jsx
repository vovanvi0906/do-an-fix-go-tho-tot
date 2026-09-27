/**
 * BookingFlowScreen — Đặt lịch nhanh chóng & Quét tìm thợ Radar (FixGo Style)
 * Route: app/(user)/booking/create-booking.jsx
 *
 * Chỉnh sửa theo yêu cầu người dùng:
 * 1. Tông màu XANH DƯƠNG chủ đạo của app (#0284C7 / #0084FF) thay cho màu vàng
 * 2. Khảo sát tư vấn tận nơi KHÔNG tick sẵn (mặc định false)
 * 3. Bổ sung Chọn ngày & giờ:
 *    - Nếu không chọn lịch -> Tự hiểu là cần thợ gấp (Làm ngay)
 *    - Dải chọn ngày dạng thẻ (T5 24, T6 25, T7 26, CN 27, T2 28...)
 *    - Chọn khung giờ (08:00 - 10:00, 10:00 - 12:00, 14:00 - 16:00...)
 * 4. Tạo đơn xong -> Tự động lưu bền vững vào orderStorage (@fixgo_user_orders)
 *    và xuất hiện ngay trong tab "Lịch sử công việc"
 *
 * Logging chuẩn: 🚀 [BookingService], 📡 [SocketService]
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../src/features/auth';
import { useBooking } from '../../../src/features/booking/hooks/useBooking';
import { orderStorage } from '../../../src/services/storage/orderStorage';
import MatchingRadarView from '../../../src/features/booking/components/MatchingRadarView';
import WorkerFoundView from '../../../src/features/booking/components/WorkerFoundView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Danh sách khung giờ phục vụ ───────────────────────────────────────────
const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

// ─── Component: Cờ Việt Nam Vector ─────────────────────────────────────────
const VietnamFlag = () => (
  <View style={styles.flagBox}>
    <View style={styles.vnFlag}>
      <FontAwesome name="star" size={11} color="#FFEB3B" />
    </View>
    <Text style={styles.flagCode}>+84</Text>
  </View>
);

export default function BookingFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const isCustom = params.isCustomService === 'true' || params.categorySlug === 'dich-vu-khac';

  // ─── Form Fields State ───────────────────────────────────────────────────
  const [jobTitle, setJobTitle] = useState(
    isCustom ? (params.serviceName || '') : (params.serviceName || params.title || 'Sửa điện tại nhà')
  );
  // Không được bấm tick sẵn (mặc định false theo yêu cầu user)
  const [isFreeSurvey, setIsFreeSurvey] = useState(false);

  const [customerAddress, setCustomerAddress] = useState(
    params.address || '606/20, Hiệp Bình, Hồ Chí Minh'
  );
  const [customerPhone, setCustomerPhone] = useState(
    user?.phone || '0366192248'
  );
  const [customerName, setCustomerName] = useState(
    user?.name || user?.fullName || 'Lữ Hồng Phúc Đại'
  );
  const [noteText, setNoteText] = useState(
    params.note || ''
  );
  const [requestPreviousWorker, setRequestPreviousWorker] = useState(false);
  const [photoActionVisible, setPhotoActionVisible] = useState(false);

  // ─── Chọn Ngày & Giờ (Lịch hẹn) ─────────────────────────────────────────
  // null: Không chọn lịch (Mặc định -> Cần thợ gấp) | number: Đặt theo ngày hẹn
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  // Tạo danh sách 7 ngày tới
  const upcomingDays = useMemo(() => {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayOfWeek = dayNames[d.getDay()];
      const dayOfMonth = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      days.push({
        index: i,
        dayOfWeek,
        dayOfMonth,
        month,
        year,
        label: i === 0 ? `Hôm nay (${dayOfWeek}, ${dayOfMonth}/${month}/${year})` : `${dayOfWeek}, ngày ${dayOfMonth}/${month}/${year}`,
        dateString: `${dayOfMonth}-${month < 10 ? '0' + month : month}-${year}`,
      });
    }
    return days;
  }, []);

  // Cập nhật params khi navigation thay đổi
  useEffect(() => {
    if (params.serviceName) {
      setJobTitle(params.serviceName);
    } else if (isCustom) {
      setJobTitle('');
    }
    if (params.address) {
      setCustomerAddress(params.address);
    }
  }, [params.serviceName, params.address, isCustom]);

  // ─── Booking Hook (Quản lý Order, Radar, Sockets) ─────────────────────────
  const {
    services,
    selectedService,
    setSelectedService,
    evidencePhotos,
    scheduleType,
    setScheduleType,
    urgency,
    setUrgency,
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

  // ─── Xử lý gửi đơn đặt lịch ─────────────────────────────────────────────
  const handleBookingSubmit = async () => {
    if (!jobTitle.trim()) {
      Alert.alert(
        'Thông báo',
        isCustom
          ? 'Vui lòng nhập tiêu đề dịch vụ bạn muốn đặt (Ví dụ: Chơi với mèo)'
          : 'Vui lòng nhập nội dung công việc cần thợ làm'
      );
      return;
    }
    if (!customerAddress.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ nhận thợ');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại liên hệ');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ và tên');
      return;
    }

    const isUrgent = selectedDayIndex === null;
    const selectedDay = selectedDayIndex !== null ? upcomingDays[selectedDayIndex] : null;
    const scheduleDisplay = isUrgent
      ? 'Cần thợ gấp'
      : `${selectedDay.dateString} (${selectedTimeSlot})`;

    // Tạo mã đơn hàng dạng #260924110841
    const today = new Date();
    const datePart = today.toISOString().slice(2, 10).replace(/-/g, '');
    const randPart = Math.floor(100000 + Math.random() * 900000);
    const generatedOrderCode = `#${datePart}${randPart}`;
    const newOrderId = `ord-${Date.now()}`;

    // Xử lý đơn dịch vụ theo yêu cầu riêng (Dịch vụ khác - Chờ Admin duyệt)
    if (isCustom) {
      const orderData = {
        id: newOrderId,
        orderCode: generatedOrderCode,
        title: jobTitle.trim(),
        serviceName: jobTitle.trim(),
        categoryName: 'Dịch vụ khác',
        categorySlug: 'dich-vu-khac',
        isCustomService: true,
        addressText: customerAddress,
        customerName,
        customerPhone,
        note: noteText,
        isFreeSurvey,
        requestPreviousWorker,
        scheduledAt: scheduleDisplay,
        isUrgent,
        status: 'AWAITING_CONFIRM', // Chờ Admin xác nhận
        price: params.basePrice ? Number(params.basePrice) : 150000,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      };

      console.log('🚀 [BookingService] Tạo đơn Dịch vụ khác (Chờ Admin xác nhận):', orderData);
      await orderStorage.saveOrder(orderData);

      Alert.alert(
        'Đã gửi yêu cầu dịch vụ!',
        `Yêu cầu "${jobTitle.trim()}" của bạn đang ở trạng thái CHỜ XÁC NHẬN.\n\nAdmin sẽ xem xét và phản hồi trong tối đa 20 phút. Nếu quá thời gian này hoặc không có thợ phù hợp, hệ thống sẽ tự động chuyển trạng thái lỗi.`,
        [
          {
            text: 'Xem chi tiết đơn',
            onPress: () =>
              router.replace({
                pathname: '/(user)/order/[id]',
                params: {
                  id: newOrderId,
                  orderCode: generatedOrderCode,
                  title: jobTitle.trim(),
                  serviceName: jobTitle.trim(),
                  addressText: customerAddress,
                  scheduledAt: scheduleDisplay,
                  price: String(params.basePrice ? Number(params.basePrice) : 150000),
                  status: 'AWAITING_CONFIRM',
                  isCustomService: 'true',
                  createdAt: new Date().toISOString(),
                  note: noteText || '',
                },
              }),
          },
          {
            text: 'Mục Đơn hàng',
            onPress: () => router.replace('/(user)/(tabs)/orders'),
          },
        ]
      );
      return;
    }

    // Đơn dịch vụ tiêu chuẩn trong hệ thống
    const orderData = {
      id: newOrderId,
      orderCode: generatedOrderCode,
      title: jobTitle,
      serviceName: jobTitle,
      addressText: customerAddress,
      customerName,
      customerPhone,
      note: noteText,
      isFreeSurvey,
      requestPreviousWorker,
      scheduledAt: scheduleDisplay,
      isUrgent,
      status: isUrgent ? 'SEARCHING_WORKER' : 'MATCHED',
      price: params.basePrice ? Number(params.basePrice) : 150000,
      createdAt: new Date().toISOString(),
    };

    console.log('🚀 [BookingService] Tạo đơn hàng mới:', orderData);

    // 1. Lưu ngay vào AsyncStorage để xuất hiện trong mục Đơn hàng
    await orderStorage.saveOrder(orderData);

    // 2. Gửi lên backend hoặc kích hoạt tìm thợ
    if (isUrgent) {
      setScheduleType('INSTANT');
      await submitOrder();
    } else {
      setScheduleType('SCHEDULED');
      Alert.alert(
        'Đặt lịch thành công!',
        `Đơn hàng "${jobTitle}" đã được lên lịch vào ${scheduleDisplay}.\nBạn có thể theo dõi trong mục Đơn hàng.`,
        [
          {
            text: 'Xem chi tiết đơn',
            onPress: () =>
              router.replace({
                pathname: '/(user)/order/[id]',
                params: {
                  id: newOrderId,
                  orderCode: generatedOrderCode,
                  title: jobTitle,
                  serviceName: jobTitle,
                  addressText: customerAddress,
                  scheduledAt: scheduleDisplay,
                  price: String(params.basePrice ? Number(params.basePrice) : 150000),
                  status: 'MATCHED',
                  createdAt: new Date().toISOString(),
                  note: noteText || '',
                },
              }),
          },
          {
            text: 'Mục Đơn hàng',
            onPress: () => router.replace('/(user)/(tabs)/orders'),
          },
        ]
      );
    }
  };

  // ─── 1. TRẠNG THÁI: QUÉT TÌM THỢ (RADAR MATCHING) ────────────────────────
  if (matchingStatus === 'SEARCHING') {
    return (
      <SafeAreaView style={styles.fullScreen} edges={['top']}>
        <MatchingRadarView
          remainingSeconds={remainingSeconds}
          serviceName={jobTitle}
          address={customerAddress}
          onCancel={cancelMatching}
        />
      </SafeAreaView>
    );
  }

  // ─── 2. TRẠNG THÁI: ĐÃ TÌM THẤY THỢ ──────────────────────────────────────
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

  // ─── 3. TRẠNG THÁI: HẾT THỜI GIAN QUÉT (TIMEOUT) ─────────────────────────
  if (matchingStatus === 'TIMEOUT') {
    return (
      <SafeAreaView style={styles.fullScreen} edges={['top']}>
        <View style={styles.timeoutContainer}>
          <View style={styles.timeoutIcon}>
            <Ionicons name="time-outline" size={40} color="#0284C7" />
          </View>
          <Text style={styles.timeoutTitle}>Chưa tìm được thợ phù hợp</Text>
          <Text style={styles.timeoutSub}>
            Hệ thống đang mở rộng bán kính quét thợ thêm 5km. Đơn hàng của bạn đã được lưu lại trong mục Đơn hàng.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={resetMatching} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Quét lại tìm thợ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backLinkBtn}
            onPress={() => {
              resetMatching();
              router.replace('/(user)/(tabs)/orders');
            }}
          >
            <Text style={styles.backLinkText}>Xem trong mục Đơn hàng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── 4. FORM CHÍNH: ĐẶT LỊCH NHANH CHÓNG (TÔNG XANH DƯƠNG FIXGO) ─────────
  return (
    <SafeAreaView style={styles.fullScreen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header với Gradient Xanh Dương FixGo (#E0F2FE -> #FFFFFF) */}
        <LinearGradient
          colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#0284C7" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Đặt lịch nhanh chóng</Text>

            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.formScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Thông báo lỗi nếu có */}
          {errorMessage ? (
            <TouchableOpacity
              style={styles.errorBox}
              onPress={() => setErrorMessage('')}
              activeOpacity={0.85}
            >
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Thông báo hướng dẫn nếu là Dịch vụ theo yêu cầu riêng */}
          {isCustom && (
            <View style={styles.customNoticeCard}>
              <View style={styles.customNoticeIcon}>
                <Ionicons name="sparkles" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customNoticeTitle}>Dịch vụ theo yêu cầu riêng</Text>
                <Text style={styles.customNoticeSub}>
                  Dịch vụ này chưa có trong hệ thống. Quý khách vui lòng nhập rõ tiêu đề dịch vụ muốn đặt (VD: Chơi với mèo, Chăm thú cưng...). Đơn sẽ ở trạng thái Chờ xác nhận (tối đa 20 phút) để Admin duyệt thợ phù hợp.
                </Text>
              </View>
            </View>
          )}

          {/* ── 1. Nội dung / Tiêu đề công việc * ─────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isCustom ? 'Tiêu đề dịch vụ bạn muốn đặt' : 'Nội dung công việc'}{' '}
              <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={[styles.inputCard, isCustom && styles.inputCardCustom]}>
              <TextInput
                style={styles.textInput}
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder={
                  isCustom
                    ? 'VD: Chơi với mèo, Chăm sóc cây cảnh, Dọn kho...'
                    : 'Nhập nội dung công việc...'
                }
                placeholderTextColor="#94A3B8"
                autoFocus={isCustom}
              />
            </View>

            {/* Checkbox: KHÔNG tick sẵn theo yêu cầu */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsFreeSurvey(!isFreeSurvey)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkboxBox, isFreeSurvey && styles.checkboxBoxChecked]}>
                {isFreeSurvey && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                Khảo sát tư vấn tận nơi, báo giá trước miễn phí
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. Địa chỉ * ─────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Địa chỉ <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.inputCardWithAction}>
              <TextInput
                style={styles.textInputFlex}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="Nhập địa chỉ nhà của bạn..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.inputRightAction}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Định vị GPS', `Đã nhận diện tọa độ: ${customerAddress}`)}
              >
                <Ionicons name="search" size={20} color="#0284C7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 3. Số điện thoại * ────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Số điện thoại <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.phoneRow}>
              {/* Box cờ Việt Nam +84 */}
              <View style={styles.flagContainer}>
                <VietnamFlag />
              </View>

              {/* Ô nhập số điện thoại */}
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="09xx xxx xxx"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* ── 4. Họ và tên * ───────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Họ và tên <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Nhập họ và tên..."
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* ── 5. Ghi chú ───────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ghi chú</Text>
            <View style={[styles.inputCard, styles.textareaCard]}>
              <TextInput
                style={styles.textareaInput}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Vui lòng nhập ghi chú nếu có"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            {/* Gợi ý bên dưới */}
            <View style={styles.hintContainer}>
              <Text style={styles.hintTitle}>Gợi ý:</Text>
              <Text style={styles.hintLine}>- Nhập thêm địa chỉ, số căn hộ, tháp chung cư,...</Text>
              <Text style={styles.hintLine}>- Nhập thêm tình trạng thiết bị cần sửa, mang thang cao,...</Text>
            </View>
          </View>

          {/* ── 6. Card toggle: Yêu cầu thợ cũ ──────────────────────── */}
          <View style={styles.toggleWorkerCard}>
            <View style={styles.userIconCircle}>
              <Ionicons name="person-outline" size={20} color="#0284C7" />
            </View>
            <View style={styles.toggleWorkerInfo}>
              <Text style={styles.toggleWorkerTitle}>Yêu cầu thợ cũ</Text>
              <Text style={styles.toggleWorkerSub}>Chọn thợ đã từng phục vụ trước đây</Text>
            </View>
            <Switch
              value={requestPreviousWorker}
              onValueChange={setRequestPreviousWorker}
              trackColor={{ false: '#E2E8F0', true: '#BAE6FD' }}
              thumbColor={requestPreviousWorker ? '#0284C7' : '#FFFFFF'}
            />
          </View>

          {/* ── 7. Chọn ngày & giờ (Ảnh 2 - Tông Xanh Dương FixGo) ────── */}
          <View style={styles.scheduleSection}>
            <View style={styles.scheduleHeaderRow}>
              <Text style={styles.scheduleTitle}>Chọn ngày & giờ</Text>
            </View>

            {/* Dải chọn 7 ngày dạng thẻ Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.daysScroll}
              contentContainerStyle={styles.daysScrollContent}
            >
              {upcomingDays.map((day) => {
                const isSelected = selectedDayIndex === day.index;
                return (
                  <TouchableOpacity
                    key={day.index}
                    style={[
                      styles.dayPill,
                      isSelected && styles.dayPillActive,
                    ]}
                    onPress={() => {
                      if (selectedDayIndex === day.index) {
                        // Bấm lại đúng ngày đó 1 lần nữa -> Huỷ chọn lịch (quay về Cần thợ gấp)
                        setSelectedDayIndex(null);
                      } else {
                        setSelectedDayIndex(day.index);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayPillWeek, isSelected && styles.dayPillWeekActive]}>
                      {day.dayOfWeek}
                    </Text>
                    <Text style={[styles.dayPillNum, isSelected && styles.dayPillNumActive]}>
                      {day.dayOfMonth}
                    </Text>
                    <Text style={[styles.dayPillMonth, isSelected && styles.dayPillMonthActive]}>
                      Tháng {day.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Dòng tóm tắt ngày */}
            <View style={styles.scheduleDisplayCard}>
              <Ionicons name="calendar-outline" size={18} color="#0284C7" style={{ marginRight: 8 }} />
              <Text style={styles.scheduleDisplayText}>
                {selectedDayIndex !== null
                  ? upcomingDays[selectedDayIndex].label
                  : '⚡ Cần thợ ngay (Thợ tới trong 15-30 phút)'}
              </Text>
            </View>

            {/* Khung chọn giờ dropdown - Chỉ hiện khi đã chọn ngày */}
            {selectedDayIndex !== null && (
              <TouchableOpacity
                style={styles.timeDropdownCard}
                onPress={() => setIsTimePickerVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.timeDropdownLeft}>
                  <Ionicons name="time-outline" size={18} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={styles.timeDropdownLabel}>Chọn giờ:</Text>
                  <Text style={styles.timeDropdownValue}>{selectedTimeSlot}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
            )}

            <Text style={styles.urgentHint}>
              * Nếu không chọn lịch, hệ thống sẽ tự hiểu đơn này đang cần thợ đến gấp. Bấm lại ngày đã chọn để huỷ lịch.
            </Text>
          </View>

          {/* ── 8. Ảnh chụp sự cố (Tùy chọn) ─────────────────────────── */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithSubRow}>
              <Text style={styles.fieldLabel}>Ảnh sự cố (Tùy chọn)</Text>
              <Text style={styles.fieldSubLabel}>Tối đa 5 ảnh</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {evidencePhotos.map((uri, index) => (
                <View key={index} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {evidencePhotos.length < 5 && (
                <TouchableOpacity
                  style={styles.photoAddBtn}
                  onPress={() => setPhotoActionVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={22} color="#0284C7" />
                  <Text style={styles.photoAddText}>Thêm ảnh</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Đệm đáy để không bị đè bởi nút bấm cố định */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── 9. Nút "Đặt lịch ngay" Tông XANH DƯƠNG (Bottom Sticky) ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitOrderBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleBookingSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitOrderBtnText}>Đặt lịch ngay</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Modal chọn khung giờ ──────────────────────────────────── */}
        <Modal
          visible={isTimePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsTimePickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setIsTimePickerVisible(false)}
          >
            <View style={styles.timePickerModal}>
              <Text style={styles.timePickerTitle}>Chọn khung giờ thợ đến</Text>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlotOption,
                    selectedTimeSlot === slot && styles.timeSlotOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedTimeSlot(slot);
                    setIsTimePickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot === slot && styles.timeSlotTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                  {selectedTimeSlot === slot && (
                    <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── Modal chụp ảnh / chọn ảnh ────────────────────────────── */}
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
              <Text style={styles.actionSheetTitle}>Ảnh chụp hiện trường sự cố</Text>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setPhotoActionVisible(false);
                  takePhoto();
                }}
              >
                <Ionicons name="camera" size={20} color="#0284C7" />
                <Text style={styles.actionSheetBtnText}>Chụp ảnh mới</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setPhotoActionVisible(false);
                  pickPhoto();
                }}
              >
                <Ionicons name="images" size={20} color="#0284C7" />
                <Text style={styles.actionSheetBtnText}>Chọn ảnh từ thư viện</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  formScrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontFamily: 'Inter_500Medium',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  labelWithSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldSubLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  asterisk: {
    color: '#EF4444',
  },
  customNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
    gap: 10,
  },
  customNoticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customNoticeTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 3,
  },
  customNoticeSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#0284C7',
    lineHeight: 17,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  inputCardCustom: {
    borderColor: '#0284C7',
    backgroundColor: '#F8FAFC',
  },
  inputCardWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    fontSize: 14.5,
    fontFamily: 'Inter_500Medium',
    color: '#0F172A',
  },
  textInputFlex: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'Inter_500Medium',
    color: '#0F172A',
  },
  inputRightAction: {
    padding: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0284C7', // Xanh dương chủ đạo
    borderColor: '#0284C7',
  },
  checkboxLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#475569',
    flex: 1,
  },

  // Số điện thoại với cờ
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flagContainer: {
    width: 90,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vnFlag: {
    width: 22,
    height: 15,
    backgroundColor: '#DA251D',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagCode: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#0F172A',
  },
  phoneInputContainer: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  // Textarea Ghi chú
  textareaCard: {
    height: 84,
    paddingVertical: 10,
  },
  textareaInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#0F172A',
    height: '100%',
  },
  hintContainer: {
    marginTop: 8,
  },
  hintTitle: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  hintLine: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Toggle card thợ cũ
  toggleWorkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  userIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleWorkerInfo: {
    flex: 1,
  },
  toggleWorkerTitle: {
    fontSize: 14.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  toggleWorkerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
  },

  // ─── Chọn ngày & giờ (Ảnh 2) ──────────────────────────────
  scheduleSection: {
    marginBottom: 22,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modeToggleBtnActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modeToggleText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },
  daysScroll: {
    marginBottom: 12,
  },
  daysScrollContent: {
    gap: 8,
  },
  dayPill: {
    width: 64,
    height: 80,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayPillActive: {
    backgroundColor: '#0284C7', // Xanh dương active
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dayPillWeek: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
    marginBottom: 2,
  },
  dayPillWeekActive: {
    color: '#E0F2FE',
  },
  dayPillNum: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dayPillNumActive: {
    color: '#FFFFFF',
  },
  dayPillMonth: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },
  dayPillMonthActive: {
    color: '#E0F2FE',
  },
  urgentDayPill: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  urgentDayPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  urgentDayPillTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  urgentDayPillTitleActive: {
    color: '#FFFFFF',
  },
  urgentDayPillSub: {
    fontSize: 9.5,
    fontFamily: 'Inter_500Medium',
    color: '#0284C7',
  },
  urgentDayPillSubActive: {
    color: '#E0F2FE',
  },
  undoScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 6,
  },
  undoScheduleText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#0284C7',
  },
  scheduleDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  scheduleDisplayText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: '#1E293B',
    flex: 1,
  },
  timeDropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  timeDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeDropdownLabel: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    marginRight: 8,
  },
  timeDropdownValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#0284C7',
  },
  urgentHint: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },

  // Photos
  photoScroll: {
    flexDirection: 'row',
  },
  photoThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoAddBtn: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },

  // Bottom Fixed Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  submitOrderBtn: {
    backgroundColor: '#0284C7', // XANH DƯƠNG CHỦ ĐẠO FIXGO
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitOrderBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#FFFFFF', // Chữ trắng trên nền xanh dương
  },

  // Timeout state
  timeoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  timeoutIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeoutTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  timeoutSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 12,
  },
  retryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backLinkBtn: {
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 14,
    color: '#0284C7',
    fontFamily: 'Inter_600SemiBold',
  },

  // Modal chọn giờ
  timePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginVertical: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  timePickerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
    textAlign: 'center',
  },
  timeSlotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  timeSlotOptionActive: {
    backgroundColor: '#E0F2FE',
  },
  timeSlotText: {
    fontSize: 14.5,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
  },
  timeSlotTextActive: {
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },

  // Action Sheet
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionSheetBtnText: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: 'Inter_500Medium',
  },
});
