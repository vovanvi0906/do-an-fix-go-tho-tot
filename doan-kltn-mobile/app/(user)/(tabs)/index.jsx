/**
 * @file index.jsx
 * @description Màn hình Trang Chủ Khách Hàng (Customer Home Screen) cho ứng dụng FixGo Mobile.
 * Thiết kế theo chuẩn Linear/Apple iOS, hệ thống khoảng cách 8-point Grid.
 * Khắc phục triệt để lỗi Notch / Status Bar tràn viền bằng useSafeAreaInsets.
 * 100% Pure JavaScript / JSX (No TypeScript annotations).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHomeData } from '../../../src/features/home/hooks/useHomeData';
import { useAuth } from '../../../src/features/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Danh sách quận/huyện phục vụ tại TP.HCM
const DISTRICT_LIST = [
  'Q. Bình Thạnh, TP.HCM',
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận Phú Nhuận, TP.HCM',
  'Quận 7, TP.HCM',
  'TP. Thủ Đức, TP.HCM',
  'Quận Tân Bình, TP.HCM',
  'Quận 10, TP.HCM',
  'Quận Gò Vấp, TP.HCM',
];

// Mapping icon danh mục dịch vụ sang Ionicons
const CATEGORY_ICON_MAP = {
  'sua-dien': { icon: 'flash', bg: '#FEF3C7', color: '#D97706' },
  'sua-nuoc': { icon: 'water', bg: '#E0F2FE', color: '#0284C7' },
  'dien-lanh': { icon: 'snow', bg: '#EFF6FF', color: '#2563EB' },
  'thiet-bi': { icon: 'tv', bg: '#F3E8FF', color: '#9333EA' },
  'lam-vuon': { icon: 'leaf', bg: '#DCFCE7', color: '#16A34A' },
  'giup-viec': { icon: 'sparkles', bg: '#FCE7F3', color: '#DB2777' },
  'bang-gia': { icon: 'document-text', bg: '#CCFBF1', color: '#0D9488' },
  'dich-vu-khac': { icon: 'grid', bg: '#F1F5F9', color: '#475569' },
};

/**
 * Loading Skeleton Shimmer Component
 */
function HomeSkeletonView({ insetsTop }) {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.skeletonRoot}>
      {/* Header Skeleton */}
      <View style={[styles.skeletonHeader, { paddingTop: insetsTop + 12 }]}>
        <View style={styles.skeletonHeaderRow}>
          <View>
            <Animated.View style={[styles.skeletonPill, { width: 110, height: 14, opacity: shimmerAnim }]} />
            <Animated.View style={[styles.skeletonPill, { width: 170, height: 20, marginTop: 8, opacity: shimmerAnim }]} />
          </View>
          <View style={styles.skeletonHeaderRight}>
            <Animated.View style={[styles.skeletonPill, { width: 80, height: 32, borderRadius: 16, opacity: shimmerAnim }]} />
            <Animated.View style={[styles.skeletonCircle, { width: 36, height: 36, opacity: shimmerAnim }]} />
          </View>
        </View>
        <Animated.View style={[styles.skeletonSearchBar, { opacity: shimmerAnim }]} />
      </View>

      {/* Body Skeleton */}
      <View style={styles.skeletonBody}>
        <Animated.View style={[styles.skeletonBanner, { opacity: shimmerAnim }]} />
        <Animated.View style={[styles.skeletonMapCard, { opacity: shimmerAnim }]} />
        <View style={styles.skeletonGrid}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.skeletonGridItem}>
              <Animated.View style={[styles.skeletonCategorySquircle, { opacity: shimmerAnim }]} />
              <Animated.View style={[styles.skeletonPill, { width: 50, height: 10, marginTop: 6, opacity: shimmerAnim }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Main User Home Screen
 */
export default function UserHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: authUser } = useAuth();

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

  // State Modal chọn khu vực
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  // State Modal AI Scan Preview
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Xử lý đặt dịch vụ
  const handleBookService = (service) => {
    Alert.alert(
      'Đặt dịch vụ FixGo',
      `Bạn muốn đặt dịch vụ "${service.name}" với giá khởi điểm ${service.basePrice.toLocaleString('vi-VN')} đ/${service.unit}?`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Đặt lịch ngay',
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

  // Xử lý chọn thợ
  const handleSelectWorker = (worker) => {
    Alert.alert(
      `Thợ: ${worker.fullName}`,
      `🛠️ Chuyên môn: ${worker.specialty}\n⭐ Đánh giá: ${worker.rating.toFixed(1)}/5.0 (${worker.totalReviews} đánh giá)\n📍 Khoảng cách: ${worker.distanceKm} km\n💼 Đã hoàn thành: ${worker.completedJobs} đơn`,
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Chọn thợ này',
          onPress: () => {
            Alert.alert('Thành công', `Đã chọn thợ ${worker.fullName} cho đơn hàng tiếp theo.`);
          },
        },
      ]
    );
  };

  // Xử lý toggle danh mục
  const handleToggleCategory = (catId) => {
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(catId);
    }
  };

  // Xử lý lưu mã giảm giá
  const handleClaimVoucher = (voucherId) => {
    claimVoucher(voucherId);
    Alert.alert('Thành công 🎉', 'Đã lưu mã ưu đãi vào Ví Voucher của bạn!');
  };

  // 1. Trạng thái Loading Shimmer
  if (isLoading) {
    return (
      <View style={styles.rootContainer}>
        <StatusBar style="light" translucent />
        <HomeSkeletonView insetsTop={insets.top} />
      </View>
    );
  }

  // Tên hiển thị của khách hàng
  const customerName = authUser?.fullName || data?.user?.fullName || 'Quý khách';
  const rewardPoints = data?.user?.rewardPoints || 0;

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" translucent />

      {/* ══════════════════════════════════════════════════════════════
          1. FIXED/STICKY HEADER GRADIENT WITH SAFE AREA INSETS TOP
         ══════════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={['#0284C7', '#0369A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top, 12) }]}
      >
        {/* Top Header Row: Greeting, District Selector & Actions */}
        <View style={styles.headerTopRow}>
          {/* Left: Greeting & District */}
          <View style={styles.headerGreetingCol}>
            <Text style={styles.headerGreetingSub}>
              Xin chào, <Text style={styles.headerGreetingName}>{customerName}</Text> 👋
            </Text>

            <Pressable
              style={({ pressed }) => [styles.districtBtn, pressed && styles.pressedEffect]}
              onPress={() => setIsDistrictModalOpen(true)}
            >
              <Ionicons name="location-sharp" size={14} color="#38BDF8" style={{ marginRight: 4 }} />
              <Text style={styles.districtBtnText} numberOfLines={1}>
                {selectedDistrict}
              </Text>
              <Ionicons name="chevron-down" size={13} color="#BAE6FD" style={{ marginLeft: 3 }} />
            </Pressable>
          </View>

          {/* Right: FixCoins Points & Bell Notification */}
          <View style={styles.headerActionsRow}>
            {/* Điểm thưởng FixCoins */}
            <Pressable
              style={({ pressed }) => [styles.rewardsBadge, pressed && styles.pressedEffect]}
              onPress={() =>
                Alert.alert(
                  'Điểm thưởng FixCoins',
                  `Số dư hiện tại của bạn: ${rewardPoints} xu.\nTích lũy điểm sau mỗi đơn hoàn thành để đổi mã giảm giá!`
                )
              }
            >
              <Ionicons name="sparkles" size={13} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.rewardsText}>{rewardPoints} xu</Text>
            </Pressable>

            {/* Chuông thông báo */}
            <Pressable
              style={({ pressed }) => [styles.bellBtn, pressed && styles.pressedEffect]}
              onPress={() => router.push('/(user)/(tabs)/notifications')}
            >
              <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              {data?.unreadNotificationsCount > 0 && <View style={styles.bellBadgeDot} />}
            </Pressable>
          </View>
        </View>

        {/* Search Bar (Rounded-full Pill with Search Icon & Clear Button) */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#0284C7" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm dịch vụ (sửa điện, máy lạnh, thông cống...)"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* ══════════════════════════════════════════════════════════════
          2. BODY CONTENT SCROLLVIEW (8-POINT GRID SYSTEM)
         ══════════════════════════════════════════════════════════════ */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Alert if any */}
        {isError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{errorMessage || 'Lỗi kết nối máy chủ'}</Text>
            <Pressable style={styles.retryBtn} onPress={refetch}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </Pressable>
          </View>
        )}

        {/* ── 2.1. BANNER AI SCAN 2.0 (High-Tech Linear Gradient) ── */}
        <LinearGradient
          colors={['#2563EB', '#4F46E5', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiBannerCard}
        >
          {/* Badge Tag */}
          <View style={styles.aiBadgeRow}>
            <View style={styles.aiBadgePill}>
              <Ionicons name="sparkles" size={11} color="#67E8F9" style={{ marginRight: 4 }} />
              <Text style={styles.aiBadgeText}>AI SCAN & CHẨN ĐOÁN 2.0</Text>
            </View>
            <View style={styles.aiFreePill}>
              <Text style={styles.aiFreeText}>Miễn phí</Text>
            </View>
          </View>

          {/* Heading & Description */}
          <Text style={styles.aiBannerTitle}>Chẩn đoán sự cố thiết bị tự động</Text>
          <Text style={styles.aiBannerDesc}>
            Chụp ảnh vị trí hỏng hóc trong nhà (ống nước rò rỉ, máy lạnh chảy nước, chập điện) để AI phân tích và báo giá ngay.
          </Text>

          {/* Action Button */}
          <Pressable
            style={({ pressed }) => [styles.aiScanBtn, pressed && styles.pressedEffect]}
            onPress={() => setIsAiModalOpen(true)}
          >
            <Ionicons name="camera" size={17} color="#1E40AF" style={{ marginRight: 6 }} />
            <Text style={styles.aiScanBtnText}>Chụp ảnh chẩn đoán ngay</Text>
            <Ionicons name="arrow-forward" size={15} color="#1E40AF" style={{ marginLeft: 4 }} />
          </Pressable>
        </LinearGradient>

        {/* ── 2.2. LIVE WORKER RADAR (Thợ trực tuyến quanh đây) ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.sectionTitle}>Thợ trực tuyến quanh bạn</Text>
              <View style={styles.liveIndicatorBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.liveIndicatorText}>
                  {data?.nearbyWorkers?.length || 0} thợ sẵn sàng
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => Alert.alert('Bản đồ thợ', 'Đang kết nối GPS hiển thị toàn bộ mạng lưới thợ.')}
              hitSlop={8}
            >
              <Text style={styles.sectionLinkText}>Xem bản đồ</Text>
            </Pressable>
          </View>

          {/* Worker Cards Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workersScrollContent}
          >
            {data?.nearbyWorkers?.map((worker) => (
              <Pressable
                key={worker.id}
                style={({ pressed }) => [styles.workerCard, pressed && styles.pressedEffect]}
                onPress={() => handleSelectWorker(worker)}
              >
                <View style={styles.workerAvatarContainer}>
                  <Image source={{ uri: worker.avatarUrl }} style={styles.workerAvatar} />
                  <View style={styles.workerOnlineDot} />
                </View>

                <View style={styles.workerInfoCol}>
                  <Text style={styles.workerName} numberOfLines={1}>
                    {worker.fullName}
                  </Text>
                  <Text style={styles.workerSpecialty} numberOfLines={1}>
                    {worker.specialty}
                  </Text>

                  <View style={styles.workerMetaRow}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color="#F59E0B" style={{ marginRight: 2 }} />
                      <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.workerDistanceText}>📍 {worker.distanceKm} km</Text>
                  </View>
                </View>

                <View style={styles.workerCallBtn}>
                  <Ionicons name="chevron-forward" size={16} color="#0284C7" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── 2.3. CATEGORY GRID (Lưới 8 danh mục dịch vụ 4x2) ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Danh mục dịch vụ</Text>
            {selectedCategoryId && (
              <Pressable onPress={() => setSelectedCategoryId(null)} hitSlop={8}>
                <Text style={styles.sectionLinkText}>Bỏ lọc</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.categoryGrid}>
            {data?.categories?.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const iconConfig = CATEGORY_ICON_MAP[cat.slug] || {
                icon: 'construct',
                bg: '#F1F5F9',
                color: '#475569',
              };

              return (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.categoryItem,
                    isSelected && styles.categoryItemSelected,
                    pressed && styles.pressedEffect,
                  ]}
                  onPress={() => handleToggleCategory(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIconBox,
                      { backgroundColor: isSelected ? '#0284C7' : iconConfig.bg },
                    ]}
                  >
                    <Ionicons
                      name={iconConfig.icon}
                      size={24}
                      color={isSelected ? '#FFFFFF' : iconConfig.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 2.4. POPULAR SERVICES (Dịch vụ nổi bật & Giá niêm yết) ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Dịch vụ phổ biến</Text>
              <Text style={styles.sectionSubtitle}>Giá niêm yết minh bạch, thợ có mặt sau 15 phút</Text>
            </View>
          </View>

          {filteredPopularServices?.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesScrollContent}
            >
              {filteredPopularServices.map((service) => (
                <Pressable
                  key={service.id}
                  style={({ pressed }) => [styles.serviceCard, pressed && styles.pressedEffect]}
                  onPress={() => handleBookService(service)}
                >
                  {/* Service Image */}
                  <View style={styles.serviceImageWrapper}>
                    <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
                    {service.tag && (
                      <View style={styles.serviceTagBadge}>
                        <Text style={styles.serviceTagText}>{service.tag}</Text>
                      </View>
                    )}
                  </View>

                  {/* Service Info */}
                  <View style={styles.serviceCardBody}>
                    <Text style={styles.serviceCategoryLabel}>{service.categoryName}</Text>
                    <Text style={styles.serviceTitle} numberOfLines={2}>
                      {service.name}
                    </Text>

                    <View style={styles.serviceRatingRow}>
                      <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 3 }} />
                      <Text style={styles.serviceRatingText}>{service.rating.toFixed(1)}</Text>
                      <Text style={styles.serviceReviewsCount}>({service.reviewsCount})</Text>
                      <Text style={styles.serviceDurationText}>⏱️ {service.durationMin} phút</Text>
                    </View>

                    {/* Price & Book Button */}
                    <View style={styles.servicePriceRow}>
                      <View>
                        <Text style={styles.servicePriceLabel}>Giá từ</Text>
                        <Text style={styles.servicePriceValue}>
                          {service.basePrice.toLocaleString('vi-VN')} đ
                        </Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [styles.bookServiceBtn, pressed && styles.pressedEffect]}
                        onPress={() => handleBookService(service)}
                      >
                        <Text style={styles.bookServiceBtnText}>Đặt ngay</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyFilterBox}>
              <Ionicons name="search-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyFilterTitle}>Không tìm thấy dịch vụ phù hợp</Text>
              <Text style={styles.emptyFilterDesc}>
                Không có kết quả nào cho &quot;{searchQuery}&quot;. Vui lòng thử từ khóa khác.
              </Text>
              <Pressable
                style={styles.emptyResetBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategoryId(null);
                }}
              >
                <Text style={styles.emptyResetBtnText}>Xóa bộ lọc</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── 2.5. VOUCHER TICKETS (Ưu đãi & Mã giảm giá) ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Mã ưu đãi độc quyền</Text>
            <Pressable
              onPress={() => Alert.alert('Ví Voucher', 'Mở kho mã ưu đãi của bạn')}
              hitSlop={8}
            >
              <Text style={styles.sectionLinkText}>Xem tất cả</Text>
            </Pressable>
          </View>

          <View style={styles.voucherList}>
            {data?.vouchers?.map((voucher) => (
              <View key={voucher.id} style={styles.voucherTicket}>
                {/* Left Ticket Badge */}
                <View
                  style={[
                    styles.voucherLeftBadge,
                    { backgroundColor: voucher.theme === 'orange' ? '#F97316' : '#0284C7' },
                  ]}
                >
                  <Text style={styles.voucherPercentText}>{voucher.discountPercent}%</Text>
                  <Text style={styles.voucherOffText}>GIẢM</Text>
                </View>

                {/* Middle Ticket Info */}
                <View style={styles.voucherMiddleInfo}>
                  <Text style={styles.voucherTitle}>{voucher.title}</Text>
                  <Text style={styles.voucherSubtitle} numberOfLines={1}>
                    {voucher.subtitle}
                  </Text>
                  <Text style={styles.voucherExpiry}>{voucher.expiryDate}</Text>
                </View>

                {/* Right Action */}
                <Pressable
                  style={[
                    styles.voucherClaimBtn,
                    voucher.isClaimed && styles.voucherClaimedBtn,
                  ]}
                  onPress={() => !voucher.isClaimed && handleClaimVoucher(voucher.id)}
                  disabled={voucher.isClaimed}
                >
                  <Text
                    style={[
                      styles.voucherClaimText,
                      voucher.isClaimed && styles.voucherClaimedText,
                    ]}
                  >
                    {voucher.isClaimed ? 'Đã lưu' : 'Lưu mã'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════
          3. DISTRICT PICKER MODAL (Popup chọn khu vực phục vụ)
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isDistrictModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDistrictModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsDistrictModalOpen(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Ionicons name="location-sharp" size={20} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Chọn khu vực phục vụ</Text>
              </View>
              <Pressable onPress={() => setIsDistrictModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <FlatList
              data={DISTRICT_LIST}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item === selectedDistrict;
                return (
                  <Pressable
                    style={[styles.districtListItem, isSelected && styles.districtListItemSelected]}
                    onPress={() => {
                      setSelectedDistrict(item);
                      setIsDistrictModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtListItemText,
                        isSelected && styles.districtListItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#0284C7" />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          4. AI SCAN MODAL (Popup trải nghiệm chẩn đoán sự cố)
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAiModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAiModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.aiModalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleGroup}>
                <Ionicons name="sparkles" size={20} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>FixGo AI Scanner</Text>
              </View>
              <Pressable onPress={() => setIsAiModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.aiModalDesc}>
              Chụp ảnh sự cố hư hỏng để AI nhận diện nguyên nhân, gợi ý linh kiện và ước tính chi phí chuẩn xác.
            </Text>

            <View style={styles.aiModalOptions}>
              <Pressable
                style={styles.aiModalBtnPrimary}
                onPress={() => {
                  setIsAiModalOpen(false);
                  Alert.alert('Máy ảnh', 'Đang khởi động Camera để chụp sự cố...');
                }}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.aiModalBtnPrimaryText}>Mở Camera Chụp Ảnh</Text>
              </Pressable>

              <Pressable
                style={styles.aiModalBtnSecondary}
                onPress={() => {
                  setIsAiModalOpen(false);
                  Alert.alert('Thư viện', 'Chọn ảnh sự cố từ Thư viện hình ảnh...');
                }}
              >
                <Ionicons name="images" size={20} color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={styles.aiModalBtnSecondaryText}>Chọn ảnh từ thư viện</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLESHEET (Design System 8pt Grid & Modern Linear Aesthetic)
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0284C7', // Tránh viền trắng dưới thanh trạng thái
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },

  // ─── Header Styles ─────────────────────────────────────────
  headerGradient: {
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerGreetingCol: {
    flex: 1,
    paddingRight: 8,
  },
  headerGreetingSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E0F2FE',
    marginBottom: 2,
  },
  headerGreetingName: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  districtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  districtBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 160,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rewardsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FBBF24',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    paddingVertical: 0,
  },

  // ─── AI Banner Card ────────────────────────────────────────
  aiBannerCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0F2FE',
    letterSpacing: 0.5,
  },
  aiFreePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiFreeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiBannerDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: '#DBEAFE',
    lineHeight: 17,
    marginBottom: 14,
  },
  aiScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiScanBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  // ─── Section Common ────────────────────────────────────────
  sectionContainer: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },
  sectionLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0284C7',
  },

  // ─── Workers Section ───────────────────────────────────────
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  workersScrollContent: {
    gap: 12,
    paddingVertical: 2,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.72,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  workerAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  workerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  workerInfoCol: {
    flex: 1,
  },
  workerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  workerSpecialty: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },
  workerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  workerDistanceText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0284C7',
  },
  workerCallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Category Grid ─────────────────────────────────────────
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
  },
  categoryItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  categoryNameSelected: {
    fontWeight: '800',
    color: '#0284C7',
  },

  // ─── Popular Services ──────────────────────────────────────
  servicesScrollContent: {
    gap: 14,
    paddingVertical: 2,
  },
  serviceCard: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceImageWrapper: {
    width: '100%',
    height: 110,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  serviceTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  serviceCardBody: {
    padding: 12,
  },
  serviceCategoryLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0284C7',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    height: 36,
  },
  serviceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  serviceRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  serviceReviewsCount: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
    marginLeft: 2,
    marginRight: 6,
  },
  serviceDurationText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
  },
  servicePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  servicePriceLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  servicePriceValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  bookServiceBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bookServiceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Empty & Error State ───────────────────────────────────
  emptyFilterBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyFilterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyFilterDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  emptyResetBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Voucher Tickets ───────────────────────────────────────
  voucherList: {
    gap: 10,
  },
  voucherTicket: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  voucherLeftBadge: {
    width: 64,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  voucherPercentText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  voucherOffText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  voucherMiddleInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  voucherTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  voucherSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 1,
  },
  voucherExpiry: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 3,
  },
  voucherClaimBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
  },
  voucherClaimedBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  voucherClaimText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  voucherClaimedText: {
    color: '#64748B',
  },

  // ─── Modal Common ──────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  districtListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  districtListItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  districtListItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#334155',
  },
  districtListItemTextSelected: {
    fontWeight: '700',
    color: '#0284C7',
  },

  // ─── AI Modal ──────────────────────────────────────────────
  aiModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  aiModalDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 20,
    marginTop: 6,
  },
  aiModalOptions: {
    gap: 10,
  },
  aiModalBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 14,
  },
  aiModalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiModalBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 13,
    borderRadius: 14,
  },
  aiModalBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
  },

  // ─── Skeleton Styles ───────────────────────────────────────
  skeletonRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  skeletonHeader: {
    backgroundColor: '#0284C7',
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
  },
  skeletonCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 18,
  },
  skeletonSearchBar: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    width: '100%',
  },
  skeletonBody: {
    padding: 16,
    gap: 20,
  },
  skeletonBanner: {
    height: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: 22,
  },
  skeletonMapCard: {
    height: 90,
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  skeletonGridItem: {
    width: '22%',
    alignItems: 'center',
  },
  skeletonCategorySquircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },

  // ─── Pressed Feedback ──────────────────────────────────────
  pressedEffect: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
