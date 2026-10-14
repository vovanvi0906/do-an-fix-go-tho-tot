/**
 * @file HomeScreen.tsx
 * @description Màn hình Trang Chủ chính (Home Screen) cho ứng dụng React Native FixGo Mobile.
 * Cấu trúc thông tin phân cấp khoa học, loại bỏ quá tải màu sắc theo nguyên tắc 60-30-10:
 * 1. Header & Search
 * 2. Micro Trust Line (1 dòng tinh tế)
 * 3. AI Banner (Primary Hero CTA duy nhất)
 * 4. Danh mục dịch vụ (Above-the-Fold - nhìn thấy ngay không cần cuộn)
 * 5. Thợ trực tuyến quanh bạn (Radar Map rút gọn)
 * 6. Dịch vụ phổ biến
 * 7. Ưu đãi dành cho bạn (Voucher Tickets ở cuối)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useHomeData } from '../hooks/useHomeData';
import HomeSkeleton from '../components/HomeSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import HomeHeader from '../components/HomeHeader';
import AiBanner from '../components/AiBanner';
import AiScanModal from '../components/AiScanModal';
import WorkerMapSection from '../components/WorkerMapSection';
import CategoryGrid from '../components/CategoryGrid';
import PopularServicesCarousel from '../components/PopularServicesCarousel';
import VoucherTickets from '../components/VoucherTickets';
import CategoryDetailModal, { type SubServiceItem } from '../components/CategoryDetailModal';
import type { CategoryItem, ServiceItem, WorkerItem } from '../types/home.types';
import type { AiDiagnosisResponse } from '../../../services/api/aiService';
import { useAuth } from '../../auth';

/**
 * Component `HomeScreen`
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isAiScanModalOpen, setIsAiScanModalOpen] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // =========================================================================
  // HOOK QUẢN LÝ DỮ LIỆU & STATE TRANG CHỦ
  // =========================================================================
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

  const { user } = useAuth();
  const hasPhone = typeof user?.phone === 'string' && user.phone.trim().length > 0;

  const checkPhoneBeforeAction = () => {
    if (!hasPhone) {
      Alert.alert(
        'Cần cập nhật số điện thoại',
        'Vui lòng cập nhật và xác thực số điện thoại để sẵn sàng đặt dịch vụ và liên hệ thợ FixGo.',
        [
          {
            text: 'Cập nhật ngay',
            onPress: () => {
              router.push({
                pathname: '/(auth)/register-customer',
                params: { isSocialOnboarding: 'true' },
              });
            },
          },
          { text: 'Để sau', style: 'cancel' },
        ]
      );
      return false;
    }
    return true;
  };

  const handleBookService = (service: ServiceItem) => {
    if (!checkPhoneBeforeAction()) return;
    router.push({
      pathname: '/(user)/booking/create-booking',
      params: {
        serviceId: service.id,
        serviceName: service.name,
        price: String(service.basePrice),
        categoryName: service.categoryName,
        address: data.user.currentDistrict || '606/20, Hiệp Bình, Hồ Chí Minh',
      },
    });
  };

  const handleSelectWorker = (worker: WorkerItem) => {
    if (!checkPhoneBeforeAction()) return;
    Alert.alert(
      'Hồ sơ Thợ trực tuyến',
      `Thợ: ${worker.fullName}\nChuyên môn: ${worker.specialty}\nĐánh giá: ⭐ ${worker.rating.toFixed(1)} (${worker.totalReviews} đánh giá)\nĐã hoàn thành: ${worker.completedJobs} đơn\nKhoảng cách: ~${worker.distanceKm} km`,
      [
        {
          text: 'Đặt lịch thợ này',
          onPress: () => {
            if (!checkPhoneBeforeAction()) return;
            router.push({
              pathname: '/(user)/booking/create-booking',
              params: {
                workerId: worker.id,
                workerName: worker.fullName,
                serviceName: `Thợ ${worker.fullName} - ${worker.specialty}`,
                address: data.user.currentDistrict || '606/20, Hiệp Bình, Hồ Chí Minh',
              },
            });
          },
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = data.categories.find((c) => c.id === catId);
    if (cat) {
      // Khi chọn "Dịch vụ khác" -> Chuyển thẳng đến màn đặt dịch vụ, khách tự nhập tiêu đề
      if (cat.slug === 'dich-vu-khac' || cat.id === 'cat-08') {
        if (!checkPhoneBeforeAction()) return;
        console.log('⚡ [HomeScreen] Chọn Dịch vụ khác -> Chuyển thẳng tới Đặt dịch vụ theo yêu cầu');
        router.push({
          pathname: '/(user)/booking/create-booking',
          params: {
            isCustomService: 'true',
            categoryId: cat.id,
            categorySlug: cat.slug,
            categoryName: 'Dịch vụ khác',
            serviceName: '', // Khách hàng tự nhập tiêu đề dịch vụ muốn đặt (VD: Chơi với mèo)
            address: data.user.currentDistrict || '606/20, Hiệp Bình, Hồ Chí Minh',
          },
        });
        return;
      }

      // Khi chọn "Bảng giá" -> Mở màn hình Bảng giá dịch vụ 3 cấp chuẩn FixGo
      if (cat.slug === 'bang-gia' || cat.id === 'cat-07') {
        console.log('⚡ [HomeScreen] Chọn Bảng giá -> Mở màn hình Bảng giá dịch vụ');
        router.push('/(user)/price-list');
        return;
      }

      setSelectedCategoryForModal(cat);
      setIsCategoryModalOpen(true);
    }
  };

  const handleSelectSubService = (subService: SubServiceItem) => {
    setIsCategoryModalOpen(false);
    if (!checkPhoneBeforeAction()) return;
    console.log('⚡ [HomeScreen] Chọn dịch vụ con:', subService);
    const isCustom = subService.categorySlug === 'dich-vu-khac' || subService.id === 'custom-sub';
    router.push({
      pathname: '/(user)/booking/create-booking',
      params: {
        isCustomService: isCustom ? 'true' : 'false',
        serviceId: subService.id,
        serviceName: subService.name,
        categorySlug: subService.categorySlug,
        categoryName: subService.categoryName,
        basePrice: String(subService.basePrice || 150000),
        address: data.user.currentDistrict || '606/20, Hiệp Bình, Hồ Chí Minh',
      },
    });
  };

  const handleScanPress = () => {
    setIsAiScanModalOpen(true);
  };

  const handleConfirmAiBooking = (diagnosis: AiDiagnosisResponse) => {
    if (!checkPhoneBeforeAction()) return;
    router.push({
      pathname: '/(user)/booking/create-booking',
      params: {
        categoryId: diagnosis.suggestedCategoryId,
        categoryName: diagnosis.categoryName,
        serviceName: diagnosis.categoryName,
        price: String(diagnosis.estimatedPrice.min),
        note: diagnosis.notes,
        address: data.user.currentDistrict || '606/20, Hiệp Bình, Hồ Chí Minh',
      },
    });
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
        <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: '#0284c7' }}>
          <HomeSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" translucent />

      {/* ── 1. Header Gradient & Thanh tìm kiếm với Safe Area Top ─────────── */}
      <View style={styles.headerSafeAreaWrap}>
        <HomeHeader
          user={data.user}
          searchQuery={searchQuery}
          selectedDistrict={selectedDistrict}
          unreadNotificationsCount={data.unreadNotificationsCount}
          onSearchChange={setSearchQuery}
          onDistrictChange={setSelectedDistrict}
          onOpenNotifications={() => router.push('/(user)/(tabs)/notifications')}
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

          {/* ── Banner Nhắc nhở cập nhật số điện thoại (Khi chưa có SĐT) ── */}
          {!hasPhone && (
            <View style={styles.phoneWarningBanner}>
              <View style={styles.phoneWarningLeft}>
                <View style={styles.phoneWarningIconBox}>
                  <Ionicons name="call" size={16} color="#D97706" />
                </View>
                <View style={styles.phoneWarningTextBox}>
                  <Text style={styles.phoneWarningTitle}>Chưa cập nhật số điện thoại</Text>
                  <Text style={styles.phoneWarningSubtitle} numberOfLines={1}>
                    Cập nhật số điện thoại để sẵn sàng đặt dịch vụ FixGo
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.phoneWarningBtn}
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: '/(auth)/register-customer',
                    params: { isSocialOnboarding: 'true' },
                  });
                }}
              >
                <Text style={styles.phoneWarningBtnText}>Cập nhật ngay</Text>
                <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── 2. Micro Trust Line (1 dòng tinh tế, chữ xám nhẹ #64748B) ── */}
          <View style={styles.microTrustRow}>
            <Ionicons name="shield-checkmark" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.microTrustText}>
              100% thợ xác thực CCCD • Bảo hành dịch vụ 30 ngày
            </Text>
          </View>

          {/* ── 3. AI Banner: Primary Hero CTA duy nhất của màn hình ──── */}
          <AiBanner onScanPress={handleScanPress} />

          {/* ── 4. Danh mục dịch vụ: Above-the-Fold (Nhìn thấy ngay) ───── */}
          <CategoryGrid
            categories={data.categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategorySelect}
          />

          {/* ── 5. Thợ trực tuyến quanh bạn (Radar Map & PostGIS Integration) ── */}
          <WorkerMapSection
            userDistrict={selectedDistrict}
            onSelectWorker={handleSelectWorker}
          />

          {/* ── 6. Dịch vụ phổ biến (Horizontal Snap Scroll) ──────────── */}
          {filteredPopularServices.length > 0 ? (
            <PopularServicesCarousel
              services={filteredPopularServices}
              onBookService={handleBookService}
              onViewAll={() => Alert.alert('Dịch vụ', 'Xem tất cả hơn 40 danh mục dịch vụ')}
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

          {/* ── 7. Ưu đãi cho bạn (Voucher Tickets ở cuối) ───────────── */}
          <VoucherTickets
            vouchers={data.vouchers}
            onClaimVoucher={handleClaimVoucher}
            onOpenWallet={() => Alert.alert('Ví Voucher', 'Mở danh sách mã giảm giá của bạn')}
          />
        </View>
      </ScrollView>

      {/* ── Modal Quét & Chẩn đoán Sự cố AI 2.0 ───────────────────── */}
      <AiScanModal
        visible={isAiScanModalOpen}
        onClose={() => setIsAiScanModalOpen(false)}
        onConfirmBooking={handleConfirmAiBooking}
      />

      {/* ── Modal Danh sách Dịch vụ Con (Thợ Việt Style) ─────────────── */}
      <CategoryDetailModal
        visible={isCategoryModalOpen}
        category={selectedCategoryForModal}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelectSubService={handleSelectSubService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0284c7',
  },
  headerSafeAreaWrap: {
    backgroundColor: '#0284c7',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingBottom: 130, // Khoảng đệm cuộn an toàn rộng rãi tránh Bottom Tab Bar che khuất nội dung cuối
  },
  bodyWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },

  // Micro Trust Line
  microTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  microTrustText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.1,
  },

  // Phone Warning Banner
  phoneWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  phoneWarningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  phoneWarningIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneWarningTextBox: {
    flex: 1,
  },
  phoneWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  phoneWarningSubtitle: {
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
  },
  phoneWarningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  phoneWarningBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
