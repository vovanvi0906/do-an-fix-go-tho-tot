/**
 * @file PriceEstimateScreen.tsx
 * @description Màn hình Bảng giá minh bạch toàn diện phong cách Linear/Vercel.
 * - Cho phép tra cứu chi phí ước tính theo 3 tầng chi phí và từng dịch vụ cụ thể.
 * - Tìm kiếm nhanh giá sửa chữa bất kỳ sự cố nào.
 * - Tích hợp AI Scan chẩn đoán lỗi trong 2s.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MOCK_PRICING_TIERS, MOCK_SERVICE_CATEGORIES } from '../data/mockServices';
import type { SubService, CategoryPricingTier } from '../types/service.types';

export default function PriceEstimateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string>('sua-dien');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch {}
  };

  const currentTier: CategoryPricingTier = useMemo(() => {
    return (
      MOCK_PRICING_TIERS.find((t) => t.slug === selectedSlug) ||
      MOCK_PRICING_TIERS[0]
    );
  }, [selectedSlug]);

  // Toàn bộ dịch vụ con của tất cả danh mục khi tìm kiếm
  const allSubServices = useMemo(() => {
    return MOCK_SERVICE_CATEGORIES.flatMap((c) =>
      c.services.map((s) => ({ ...s, categoryName: c.name, categoryColor: c.color }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allSubServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q)
    );
  }, [searchQuery, allSubServices]);

  const handleBookService = (service: SubService, catName?: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Đặt dịch vụ FixGo',
      `Bạn có muốn đặt dịch vụ "${service.name}" (${catName || currentTier.categoryName})?`,
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Tiếp tục đặt lịch',
          onPress: () => {
            router.push({
              pathname: '/(user)/booking',
              params: {
                serviceId: service.id,
                serviceName: service.name,
                price: service.basePrice || 150000,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />

      {/* ── 1. Top Header với Safe Area ─────────────────────────── */}
      <View style={[styles.headerWrap, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerRow}>
          <Pressable
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Bảng giá minh bạch</Text>
            <Text style={styles.headerSubtitle}>Cam kết không phụ phí • Báo giá trước 100%</Text>
          </View>

          <View style={styles.headerRightBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#059669" style={{ marginRight: 3 }} />
            <Text style={styles.headerRightBadgeText}>Bảo hành 30N</Text>
          </View>
        </View>

        {/* Ô Tìm Kiếm Nhanh Bảng Giá */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tra cứu giá sửa máy lạnh, thông bồn cầu, thay ổ cắm..."
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
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nếu đang có từ khóa tìm kiếm -> Hiển thị kết quả tra cứu */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsWrap}>
            <Text style={styles.searchResultsTitle}>
              Kết quả tra cứu ({searchResults.length})
            </Text>

            {searchResults.length === 0 ? (
              <View style={styles.emptySearchCard}>
                <Ionicons name="search-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptySearchTitle}>Không tìm thấy đơn giá phù hợp</Text>
                <Text style={styles.emptySearchDesc}>
                  Thử từ khóa khác hoặc chụp ảnh sự cố để AI phân tích chi phí.
                </Text>
              </View>
            ) : (
              searchResults.map((item) => (
                <View key={item.id} style={styles.searchResultCard}>
                  <View style={styles.searchCardHeader}>
                    <View style={styles.searchCatBadge}>
                      <Text style={styles.searchCatBadgeText}>{item.categoryName}</Text>
                    </View>
                    <Text style={styles.searchCardPrice}>{item.estimatedPriceRange}</Text>
                  </View>
                  <Text style={styles.searchCardName}>{item.name}</Text>
                  <Text style={styles.searchCardDesc}>{item.description}</Text>

                  <View style={styles.searchCardFooter}>
                    <Text style={styles.searchUnitText}>Đơn vị: {item.unit}</Text>
                    <Pressable
                      style={styles.bookSmallBtn}
                      onPress={() => handleBookService(item, item.categoryName)}
                    >
                      <Text style={styles.bookSmallBtnText}>Đặt thợ</Text>
                      <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* ── Chế độ xem mặc định: 3 Tầng Chi Phí & Danh Mục */
          <>
            {/* AI Scan CTA Banner */}
            <View style={styles.aiScanBanner}>
              <View style={styles.aiScanLeft}>
                <View style={styles.aiScanIconCircle}>
                  <Ionicons name="sparkles" size={18} color="#0284C7" />
                </View>
                <View style={styles.aiScanTextWrap}>
                  <Text style={styles.aiScanTitle}>Chưa rõ nguyên nhân sự cố?</Text>
                  <Text style={styles.aiScanSubtitle}>
                    Chụp ảnh sự cố để AI Scan phân tích và dự toán chi phí chuẩn xác trong 2s
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.aiScanActionBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(user)/image-analysis' as any);
                }}
              >
                <Ionicons name="camera-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.aiScanActionText}>Quét AI</Text>
              </Pressable>
            </View>

            {/* Horizontal Tabs Danh Mục */}
            <View style={styles.tabsRowWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScrollContent}
              >
                {MOCK_PRICING_TIERS.map((tier) => {
                  const isActive = tier.slug === selectedSlug;
                  return (
                    <Pressable
                      key={tier.categoryId}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedSlug(tier.slug);
                      }}
                      style={[styles.categoryTabPill, isActive && styles.categoryTabPillActive]}
                    >
                      <Ionicons
                        name={tier.icon as any}
                        size={14}
                        color={isActive ? '#FFFFFF' : '#64748B'}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                        {tier.categoryName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3 TẦNG CHI PHÍ */}
            <View style={styles.tiersSection}>
              {/* TẦNG 1: KHẢO SÁT */}
              <View style={[styles.tierCard, styles.tierCardFree]}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierBadgeFree}>
                    <Text style={styles.tierBadgeFreeText}>TẦNG 1</Text>
                  </View>
                  <Text style={styles.tierPriceFree}>{currentTier.inspectionFee.priceDisplay}</Text>
                </View>
                <Text style={styles.tierName}>{currentTier.inspectionFee.tierName}</Text>
                <Text style={styles.tierDesc}>{currentTier.inspectionFee.description}</Text>
              </View>

              {/* TẦNG 2: NHÂN CÔNG */}
              <View style={styles.tierCard}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierBadgeLabor}>
                    <Text style={styles.tierBadgeLaborText}>TẦNG 2</Text>
                  </View>
                  <Text style={styles.tierPriceLabor}>{currentTier.laborFee.priceDisplay}</Text>
                </View>
                <Text style={styles.tierName}>{currentTier.laborFee.tierName}</Text>
                <Text style={styles.tierDesc}>{currentTier.laborFee.description}</Text>
              </View>

              {/* TẦNG 3: VẬT TƯ */}
              <View style={styles.tierCard}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierBadgeMaterial}>
                    <Text style={styles.tierBadgeMaterialText}>TẦNG 3</Text>
                  </View>
                  <Text style={styles.tierPriceMaterial}>{currentTier.materialFee.priceDisplay}</Text>
                </View>
                <Text style={styles.tierName}>{currentTier.materialFee.tierName}</Text>
                <Text style={styles.tierDesc}>{currentTier.materialFee.description}</Text>
              </View>
            </View>

            {/* BẢNG GIÁ CHI TIẾT DỊCH VỤ TRONG NGÀNH */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Đơn giá tham khảo dịch vụ {currentTier.categoryName}
              </Text>
              <View style={styles.detailTable}>
                {currentTier.popularServices.map((service, idx) => (
                  <View
                    key={service.id}
                    style={[
                      styles.detailRow,
                      idx === currentTier.popularServices.length - 1 && styles.detailRowLast,
                    ]}
                  >
                    <View style={styles.detailRowLeft}>
                      <Text style={styles.detailServiceName}>{service.name}</Text>
                      <Text style={styles.detailServiceUnit}>Đơn vị: {service.unit}</Text>
                    </View>
                    <View style={styles.detailRowRight}>
                      <Text style={styles.detailServicePrice}>{service.estimatedPriceRange}</Text>
                      <Pressable
                        style={styles.detailBookBtn}
                        onPress={() => handleBookService(service)}
                      >
                        <Text style={styles.detailBookBtnText}>Đặt</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CHÍNH SÁCH BẢO HÀNH */}
            {currentTier.notes && (
              <View style={styles.policyCard}>
                <View style={styles.policyTitleRow}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.policyHeading}>Chính sách bảo hành & Cam kết FixGo</Text>
                </View>
                {currentTier.notes.map((note, index) => (
                  <View key={index} style={styles.policyItem}>
                    <Text style={styles.policyDot}>•</Text>
                    <Text style={styles.policyText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerRightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  searchContainer: {
    marginTop: 2,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },

  // Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  // AI Scan Banner
  aiScanBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aiScanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiScanIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiScanTextWrap: {
    flex: 1,
  },
  aiScanTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  aiScanSubtitle: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
    lineHeight: 15,
  },
  aiScanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiScanActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tabs Row
  tabsRowWrap: {
    marginHorizontal: -16,
    paddingVertical: 2,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryTabPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Tiers Section
  tiersSection: {
    gap: 10,
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 6,
  },
  tierCardFree: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadgeFree: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeFreeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  tierBadgeLabor: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeLaborText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  tierBadgeMaterial: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeMaterialText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  tierPriceFree: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  tierPriceLabor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  tierPriceMaterial: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  tierName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  tierDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },

  // Detail Table
  detailSection: {
    gap: 8,
    marginTop: 4,
  },
  detailSectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailRowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  detailServiceName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailServiceUnit: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  detailRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailServicePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  detailBookBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailBookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Policy Card
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 6,
    marginTop: 4,
  },
  policyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  policyHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  policyDot: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '800',
  },
  policyText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },

  // Search Results
  searchResultsWrap: {
    gap: 10,
  },
  searchResultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  emptySearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptySearchTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  emptySearchDesc: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
  },
  searchResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
  },
  searchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchCatBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchCatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  searchCardPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  searchCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchCardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 15,
  },
  searchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  searchUnitText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  bookSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 2,
  },
  bookSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
