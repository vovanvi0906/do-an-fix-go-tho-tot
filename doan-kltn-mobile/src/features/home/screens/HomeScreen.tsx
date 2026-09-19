/**
 * @file HomeScreen.tsx
 * @description Màn hình Trang Chủ chính (Home Screen) cho ứng dụng React Native / Expo Router FixGo.
 * Tuân thủ chuẩn mực 8pt Grid System, Linear/Apple iOS aesthetics, xử lý triệt để Safe Area Insets.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useHomeData } from '../hooks/useHomeData';
import HomeSkeleton from '../components/HomeSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import HomeHeader from '../components/HomeHeader';
import AiBanner from '../components/AiBanner';
import WorkerMapSection from '../components/WorkerMapSection';
import CategoryGrid from '../components/CategoryGrid';
import PopularServicesCarousel from '../components/PopularServicesCarousel';
import VoucherTickets from '../components/VoucherTickets';
import type { ServiceItem, WorkerItem } from '../types/home.types';
import { useRouter } from 'expo-router';

/**
 * Component `HomeScreen`
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    errorMessage,
    searchQuery,
    selectedDistrict,
    selectedCategoryId,
    filteredPopularServices,
    setSearchQuery,
    setSelectedDistrict,
    setSelectedCategoryId,
    claimVoucher,
    refetch,
  } = useHomeData();

  const handleBookService = (service: ServiceItem) => {
    Alert.alert(
      'Đặt dịch vụ FixGo',
      `Bạn có muốn đặt dịch vụ "${service.name}" với giá ${service.basePrice.toLocaleString('vi-VN')} đ?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: () => {
            router.push({
              pathname: '/(user)/booking',
              params: { serviceId: service.id, serviceName: service.name, price: service.basePrice },
            });
          },
        },
      ]
    );
  };

  const handleSelectWorker = (worker: WorkerItem) => {
    Alert.alert(
      'Thông tin Thợ',
      `Thợ: ${worker.fullName}\nChuyên môn: ${worker.specialty}\nĐánh giá: ⭐ ${worker.rating.toFixed(1)} (${worker.totalReviews} đánh giá)\nKhoảng cách: ${worker.distanceKm} km`,
      [{ text: 'Đóng' }]
    );
  };

  const handleCategorySelect = (catId: string) => {
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(catId);
    }
  };

  const handleScanPress = () => {
    Alert.alert(
      'AI Scan & Chẩn đoán',
      'Mở camera để chụp ảnh sự cố hỏng hóc trong nhà (ống nước, máy lạnh, chập điện...) và nhận báo giá tự động từ FixGo AI.',
      [{ text: 'Chụp ảnh' }, { text: 'Để sau', style: 'cancel' }]
    );
  };

  const handleClaimVoucher = (voucherId: string) => {
    claimVoucher(voucherId);
    Alert.alert('Thành công', 'Đã lưu mã giảm giá vào ví voucher của bạn!');
  };

  // 1. Loading State (Shimmer Skeleton)
  if (isLoading) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar style="light" translucent />
        <HomeSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" translucent />

      {/* ── 1. Header Gradient & Thanh tìm kiếm với Safe Area Top ─────────── */}
      <View style={{ backgroundColor: '#0284C7', paddingTop: Math.max(insets.top, 12) }}>
        <HomeHeader
          user={data.user}
          searchQuery={searchQuery}
          selectedDistrict={selectedDistrict}
          unreadNotificationsCount={data.unreadNotificationsCount}
          onSearchChange={setSearchQuery}
          onDistrictChange={setSelectedDistrict}
          onOpenNotifications={() => router.push('/(user)/(tabs)/notifications')}
          onOpenRewards={() =>
            Alert.alert('Điểm thưởng FixCoins', `Số dư hiện tại: ${data.user.rewardPoints} điểm`)
          }
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Body Sections (8pt Spacing Grid) ─────────────── */}
        <View style={styles.bodyWrapper}>
          {/* Error State if any */}
          {isError && (
            <ErrorState message={errorMessage || undefined} onRetry={refetch} />
          )}

          {/* ── 2. Banner AI Hero ──────────────────────────── */}
          <AiBanner onScanPress={handleScanPress} />

          {/* ── 3. Khu vực làm việc (Bản đồ thợ) ───────────── */}
          <WorkerMapSection
            workers={data.nearbyWorkers}
            userDistrict={selectedDistrict}
            onOpenMap={() => Alert.alert('Bản đồ', 'Mở bản đồ toàn màn hình')}
            onSelectWorker={handleSelectWorker}
          />

          {/* ── 4. Danh mục dịch vụ (Grid 4x2) ──────────────── */}
          <CategoryGrid
            categories={data.categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategorySelect}
          />

          {/* ── 5. Dịch vụ phổ biến (Horizontal Snap Scroll) ─── */}
          {filteredPopularServices.length > 0 ? (
            <PopularServicesCarousel
              services={filteredPopularServices}
              onBookService={handleBookService}
              onViewAll={() => Alert.alert('Dịch vụ', 'Xem tất cả dịch vụ')}
            />
          ) : (
            <EmptyState
              title="Không tìm thấy dịch vụ"
              description={`Không có kết quả nào cho "${searchQuery}". Vui lòng thử từ khóa khác.`}
              actionText="Xóa bộ lọc"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategoryId(null);
              }}
            />
          )}

          {/* ── 6. Ưu đãi cho bạn (Voucher Tickets) ──────────── */}
          <VoucherTickets
            vouchers={data.vouchers}
            onClaimVoucher={handleClaimVoucher}
            onOpenWallet={() => Alert.alert('Ví Voucher', 'Mở danh sách mã giảm giá của bạn')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0284C7',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  bodyWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
});
