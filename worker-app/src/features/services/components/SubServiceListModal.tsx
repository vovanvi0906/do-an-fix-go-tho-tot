/**
 * @file SubServiceListModal.tsx
 * @description Modal & Bottom Sheet hiển thị danh sách các dịch vụ con thuộc từng danh mục.
 * - Thiết kế tối giản, sắc sảo phong cách Linear/Vercel (viền mỏng 1px, phân tầng nền slate-50/white).
 * - Hệ thống lưới 8pt (p-4, p-6, gap-3, rounded-2xl).
 * - Tương tác chạm haptic và hiệu ứng active:scale-[0.98].
 * - Skeleton Shimmer khi tải, Empty State khi không tìm thấy kết quả tìm kiếm.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  type DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SubService, ServiceCategoryDetail } from '../types/service.types';
import { MOCK_SERVICE_CATEGORIES } from '../data/mockServices';

const isNative = Platform.OS !== 'web';

export interface SubServiceListModalProps {
  visible: boolean;
  onClose: () => void;
  categorySlugOrId?: string | null;
  onBookService?: (service: SubService, category: ServiceCategoryDetail) => void;
  onOpenAiScan?: () => void;
  onOpenPriceEstimate?: () => void;
}

/**
 * Skeleton Shimmer Card khi tải dữ liệu dịch vụ
 */
function SubServiceSkeletonItem() {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.9,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View style={[styles.serviceCard, { opacity: shimmerAnim }]}>
      <View style={styles.skeletonHeaderRow}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonDescLine1} />
      <View style={styles.skeletonDescLine2} />
      <View style={styles.skeletonFooterRow}>
        <View style={styles.skeletonPrice} />
        <View style={styles.skeletonBtn} />
      </View>
    </Animated.View>
  );
}

/**
 * Component SubServiceListModal
 */
export default function SubServiceListModal({
  visible,
  onClose,
  categorySlugOrId,
  onBookService,
  onOpenAiScan,
  onOpenPriceEstimate,
}: SubServiceListModalProps) {
  const insets = useSafeAreaInsets();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-sua-dien');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Animation trượt Modal từ dưới lên
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Đồng bộ Category khi mở modal từ bên ngoài
  useEffect(() => {
    if (visible) {
      if (categorySlugOrId) {
        const found = MOCK_SERVICE_CATEGORIES.find(
          (c) => c.slug === categorySlugOrId || c.id === categorySlugOrId
        );
        if (found) {
          setActiveCategoryId(found.id);
        }
      }

      setSearchQuery('');
      setHasError(false);

      // REST_API_HOOK: GET /api/categories/{slug}/services
      // Giả lập tải nhẹ để hiển thị Shimmer mượt mà
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 250);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: isNative,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: isNative,
        }),
      ]).start();

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible, categorySlugOrId, fadeAnim, slideAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (isNative) {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const currentCategory = useMemo(() => {
    return (
      MOCK_SERVICE_CATEGORIES.find((c) => c.id === activeCategoryId) ||
      MOCK_SERVICE_CATEGORIES[0]
    );
  }, [activeCategoryId]);

  // Lọc dịch vụ theo ô tìm kiếm
  const filteredServices = useMemo(() => {
    if (!currentCategory) return [];
    if (!searchQuery.trim()) return currentCategory.services;

    const query = searchQuery.toLowerCase().trim();
    return currentCategory.services.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        (s.popularBadge && s.popularBadge.toLowerCase().includes(query))
    );
  }, [currentCategory, searchQuery]);

  const handleSelectCategoryPill = (catId: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategoryId(catId);
    setSearchQuery('');
  };

  const handleBooking = (service: SubService) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    // REST_API_HOOK: POST /api/orders/instant-booking
    onClose();
    onBookService?.(service, currentCategory);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Touch để đóng */}
        <Animated.View style={[styles.backdropTouchArea, { opacity: fadeAnim }]}>
          <Pressable style={styles.flexOne} onPress={onClose} />
        </Animated.View>

        {/* Sheet Content Card */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Thanh gạt Drawer Indicator */}
          <View style={styles.drawerHandleWrap}>
            <View style={styles.drawerHandleBar} />
          </View>

          {/* ── 1. Header Danh Mục Sắc Sảo Linear Style ───────────── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <View
                style={[
                  styles.categorySquircle,
                  {
                    backgroundColor: currentCategory.accentBg,
                    borderColor: currentCategory.borderColor || '#E2E8F0',
                  },
                ]}
              >
                <Ionicons
                  name={currentCategory.icon as any}
                  size={24}
                  color={currentCategory.color}
                />
              </View>

              <View style={styles.headerTitleCol}>
                <Text style={styles.headerCategoryTitle} numberOfLines={1}>
                  {currentCategory.name}
                </Text>
                <Text style={styles.headerCategoryDesc}>
                  {currentCategory.services.length} dịch vụ tiêu chuẩn • Minh bạch chi phí
                </Text>
              </View>
            </View>

            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* ── 2. Thanh Tabs Ngang Lướt Chuyển Nhanh Danh Mục ─────── */}
          <View style={styles.pillTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillTabsScroll}
            >
              {MOCK_SERVICE_CATEGORIES.map((cat) => {
                const isSelected = cat.id === activeCategoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleSelectCategoryPill(cat.id)}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillSelected,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#64748B'}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && styles.categoryPillTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 3. Thanh Tìm Kiếm Nhanh Dịch Vụ ───────────────────── */}
          <View style={styles.searchBoxWrap}>
            <View style={styles.searchInnerBox}>
              <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Tìm dịch vụ trong ${currentCategory.name}...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={16} color="#CBD5E1" />
                </Pressable>
              )}
            </View>
          </View>

          {/* ── 4. Banner AI Scan Chẩn Đoán Khẩn Cấp ───────────────── */}
          {onOpenAiScan && (
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
                onOpenAiScan();
              }}
              style={styles.aiHelperBanner}
            >
              <View style={styles.aiIconPulse}>
                <Ionicons name="sparkles" size={15} color="#0284C7" />
              </View>
              <View style={styles.aiHelperTextCol}>
                <Text style={styles.aiHelperTitle}>Chưa rõ nguyên nhân sự cố?</Text>
                <Text style={styles.aiHelperSubtitle}>Chụp ảnh để AI Scan phân tích & dự toán trong 2s</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#0284C7" />
            </Pressable>
          )}

          {/* ── 5. Danh Sách Dịch Vụ Chi Tiết ─────────────────────── */}
          <ScrollView
            style={styles.serviceListScroll}
            contentContainerStyle={styles.serviceListContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <>
                <SubServiceSkeletonItem />
                <SubServiceSkeletonItem />
                <SubServiceSkeletonItem />
              </>
            ) : hasError ? (
              /* Error State */
              <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline-outline" size={36} color="#EF4444" />
                <Text style={styles.errorTitle}>Không thể tải danh sách dịch vụ</Text>
                <Text style={styles.errorSubtitle}>Vui lòng kiểm tra kết nối mạng và thử lại</Text>
                <Pressable
                  onPress={() => {
                    setHasError(false);
                    setIsLoading(true);
                    setTimeout(() => setIsLoading(false), 200);
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryBtnText}>Thử lại</Text>
                </Pressable>
              </View>
            ) : filteredServices.length === 0 ? (
              /* Empty State */
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={26} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>Không tìm thấy dịch vụ phù hợp</Text>
                <Text style={styles.emptySubtitle}>
                  Không có dịch vụ nào khớp với từ khóa "{searchQuery}".
                </Text>
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.resetFilterBtn}
                >
                  <Text style={styles.resetFilterText}>Xem tất cả dịch vụ</Text>
                </Pressable>
              </View>
            ) : (
              /* Danh Sách Card Dịch Vụ */
              filteredServices.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  {/* Hàng Tiêu Đề & Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.serviceTitleCol}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                    </View>
                    {service.popularBadge && (
                      <View
                        style={[
                          styles.popularBadgeWrap,
                          service.popularBadge === 'Khẩn cấp'
                            ? styles.badgeUrgent
                            : service.popularBadge === 'Bán chạy'
                            ? styles.badgeBestSeller
                            : styles.badgeAi,
                        ]}
                      >
                        <Text
                          style={[
                            styles.popularBadgeText,
                            service.popularBadge === 'Khẩn cấp'
                              ? styles.badgeUrgentText
                              : service.popularBadge === 'Bán chạy'
                              ? styles.badgeBestSellerText
                              : styles.badgeAiText,
                          ]}
                        >
                          {service.popularBadge}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Mô Tả Dịch Vụ */}
                  <Text style={styles.serviceDesc}>{service.description}</Text>

                  {/* Chi tiết phụ: Bảo hành & Đơn vị */}
                  <View style={styles.serviceMetaRow}>
                    {service.warrantyMonths && service.warrantyMonths > 0 ? (
                      <View style={styles.metaPill}>
                        <Ionicons name="shield-checkmark-outline" size={11} color="#059669" style={{ marginRight: 3 }} />
                        <Text style={styles.metaPillText}>Bảo hành {service.warrantyMonths}T</Text>
                      </View>
                    ) : null}
                    <View style={styles.metaPill}>
                      <Ionicons name="pricetag-outline" size={11} color="#64748B" style={{ marginRight: 3 }} />
                      <Text style={styles.metaPillText}>Tính theo {service.unit}</Text>
                    </View>
                  </View>

                  {/* Hàng Chân Thẻ: Khoảng Giá & Nút Đặt Thợ */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.priceCol}>
                      <Text style={styles.priceLabel}>Ước tính trọn gói</Text>
                      <Text style={styles.priceValue}>{service.estimatedPriceRange}</Text>
                    </View>

                    <Pressable
                      style={styles.bookServiceBtn}
                      onPress={() => handleBooking(service)}
                    >
                      <Text style={styles.bookServiceBtnText}>Đặt thợ</Text>
                      <Ionicons name="arrow-forward" size={13} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropTouchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  flexOne: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerHandleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  drawerHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  // ── Header ──────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categorySquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerCategoryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerCategoryDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Tabs Pills ──────────────────────────────────────────
  pillTabsContainer: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pillTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Search Input ────────────────────────────────────────
  searchBoxWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },

  // ── AI Helper Banner ────────────────────────────────────
  aiHelperBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconPulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHelperTextCol: {
    flex: 1,
  },
  aiHelperTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  aiHelperSubtitle: {
    fontSize: 10.5,
    color: '#0284C7',
  },

  // ── Services List ───────────────────────────────────────
  serviceListScroll: {
    flex: 1,
  },
  serviceListContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  serviceTitleCol: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },

  // ── Badges ──────────────────────────────────────────────
  popularBadgeWrap: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeBestSeller: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  badgeBestSellerText: {
    color: '#D97706',
  },
  badgeUrgent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  badgeUrgentText: {
    color: '#DC2626',
  },
  badgeAi: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  badgeAiText: {
    color: '#0284C7',
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Footer & CTA ────────────────────────────────────────
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  priceCol: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 1,
  },
  bookServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bookServiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Shimmer Skeleton ────────────────────────────────────
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '65%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  skeletonBadge: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  skeletonDescLine1: {
    width: '90%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    marginBottom: 4,
  },
  skeletonDescLine2: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  skeletonFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  skeletonPrice: {
    width: 100,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  skeletonBtn: {
    width: 80,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },

  // ── Empty & Error States ────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  resetFilterBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
