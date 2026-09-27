/**
 * @file PriceEstimateModal.tsx
 * @description Modal tra cứu Bảng giá minh bạch 3 tầng chi phí cho ứng dụng FixGo Mobile.
 * - Thiết kế tối giản, sắc sảo phong cách Linear/Vercel.
 * - Cấu trúc 3 tầng: Khảo sát tại nhà (0đ) -> Nhân công chuẩn hóa -> Vật tư chính hãng.
 * - Tích hợp AI Scan CTA Banner dự toán chi phí trong 2s.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_PRICING_TIERS, MOCK_SERVICE_CATEGORIES } from '../data/mockServices';
import type { CategoryPricingTier, SubService } from '../types/service.types';

const isNative = Platform.OS !== 'web';

export interface PriceEstimateModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAiScan?: () => void;
  onBookService?: (service: SubService) => void;
}

export default function PriceEstimateModal({
  visible,
  onClose,
  onOpenAiScan,
  onBookService,
}: PriceEstimateModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedSlug, setSelectedSlug] = useState<string>('sua-dien');

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (isNative) {
      try {
        Haptics.impactAsync(style);
      } catch {}
    }
  };

  const currentTier: CategoryPricingTier =
    MOCK_PRICING_TIERS.find((t) => t.slug === selectedSlug) ||
    MOCK_PRICING_TIERS[0];

  const handleTabChange = (slug: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSlug(slug);
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
          {/* Drawer Handle */}
          <View style={styles.drawerHandleWrap}>
            <View style={styles.drawerHandleBar} />
          </View>

          {/* ── 1. Header Bảng Giá Minh Bạch ─────────────────────── */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <View style={styles.headerIconSquircle}>
                <Ionicons name="receipt-outline" size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Bảng giá minh bạch FixGo</Text>
                <Text style={styles.headerSubtitle}>Cam kết 100% báo giá trước khi làm • Không phụ phí</Text>
              </View>
            </View>
            <Pressable hitSlop={10} style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* ── 2. Banner AI Scan CTA ─────────────────────────────── */}
          <View style={styles.aiScanBanner}>
            <View style={styles.aiScanBannerLeft}>
              <View style={styles.aiScanIconBox}>
                <Ionicons name="sparkles" size={18} color="#0284C7" />
              </View>
              <View style={styles.aiScanTextCol}>
                <Text style={styles.aiScanTitle}>Chưa rõ nguyên nhân sự cố?</Text>
                <Text style={styles.aiScanDesc}>
                  Chụp ảnh sự cố để AI Scan phân tích và dự toán chi phí chuẩn xác trong 2s
                </Text>
              </View>
            </View>

            {onOpenAiScan && (
              <Pressable
                style={styles.aiScanCtaBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                  onOpenAiScan();
                }}
              >
                <Ionicons name="camera-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.aiScanCtaText}>Quét AI</Text>
              </Pressable>
            )}
          </View>

          {/* ── 3. Horizontal Tabs Chuyển Ngành Dịch Vụ ───────────── */}
          <View style={styles.tabBarWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBarScroll}
            >
              {MOCK_PRICING_TIERS.map((tier) => {
                const isActive = tier.slug === selectedSlug;
                return (
                  <Pressable
                    key={tier.categoryId}
                    onPress={() => handleTabChange(tier.slug)}
                    style={[styles.tabItem, isActive && styles.tabItemActive]}
                  >
                    <Ionicons
                      name={tier.icon as any}
                      size={14}
                      color={isActive ? '#FFFFFF' : '#64748B'}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tier.categoryName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 4. Nội Dung Cấu Trúc Chi Phí 3 Tầng ──────────────── */}
          <ScrollView
            style={styles.pricingBodyScroll}
            contentContainerStyle={styles.pricingBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TẦNG 1: KHẢO SÁT TẠI NHÀ */}
            <View style={[styles.tierCard, styles.tierCardFree]}>
              <View style={styles.tierHeaderRow}>
                <View style={styles.tierBadgeFree}>
                  <Text style={styles.tierBadgeFreeText}>TẦNG 1</Text>
                </View>
                <Text style={styles.tierPriceFree}>{currentTier.inspectionFee.priceDisplay}</Text>
              </View>
              <Text style={styles.tierTitle}>{currentTier.inspectionFee.tierName}</Text>
              <Text style={styles.tierDesc}>{currentTier.inspectionFee.description}</Text>
            </View>

            {/* TẦNG 2: NHÂN CÔNG CHUẨN HÓA */}
            <View style={styles.tierCard}>
              <View style={styles.tierHeaderRow}>
                <View style={styles.tierBadgeLabor}>
                  <Text style={styles.tierBadgeLaborText}>TẦNG 2</Text>
                </View>
                <Text style={styles.tierPriceLabor}>{currentTier.laborFee.priceDisplay}</Text>
              </View>
              <Text style={styles.tierTitle}>{currentTier.laborFee.tierName}</Text>
              <Text style={styles.tierDesc}>{currentTier.laborFee.description}</Text>
            </View>

            {/* TẦNG 3: VẬT TƯ & LINH KIỆN */}
            <View style={styles.tierCard}>
              <View style={styles.tierHeaderRow}>
                <View style={styles.tierBadgeMaterial}>
                  <Text style={styles.tierBadgeMaterialText}>TẦNG 3</Text>
                </View>
                <Text style={styles.tierPriceMaterial}>{currentTier.materialFee.priceDisplay}</Text>
              </View>
              <Text style={styles.tierTitle}>{currentTier.materialFee.tierName}</Text>
              <Text style={styles.tierDesc}>{currentTier.materialFee.description}</Text>
            </View>

            {/* BẢNG GIÁ CHI TIẾT TỪNG DỊCH VỤ CON */}
            <View style={styles.subServicesSection}>
              <Text style={styles.subServicesTitle}>Đơn giá tham khảo các ca sửa {currentTier.categoryName}</Text>
              <View style={styles.subServicesTable}>
                {currentTier.popularServices.map((service, idx) => (
                  <View
                    key={service.id}
                    style={[
                      styles.tableRow,
                      idx === currentTier.popularServices.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <View style={styles.tableRowLeft}>
                      <Text style={styles.tableServiceName}>{service.name}</Text>
                      <Text style={styles.tableServiceUnit}>Đơn vị tính: {service.unit}</Text>
                    </View>
                    <View style={styles.tableRowRight}>
                      <Text style={styles.tableServicePrice}>{service.estimatedPriceRange}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CAM KẾT CHÍNH SÁCH BẢO HÀNH */}
            {currentTier.notes && (
              <View style={styles.policyBox}>
                <View style={styles.policyHeader}>
                  <Ionicons name="shield-checkmark" size={15} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.policyTitle}>Chính sách bảo hành & Cam kết</Text>
                </View>
                {currentTier.notes.map((note, index) => (
                  <View key={index} style={styles.policyBulletRow}>
                    <Text style={styles.policyBullet}>•</Text>
                    <Text style={styles.policyBulletText}>{note}</Text>
                  </View>
                ))}
              </View>
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
    maxHeight: '90%',
    minHeight: '70%',
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

  // Header
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
    gap: 10,
    flex: 1,
  },
  headerIconSquircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // AI Scan Banner
  aiScanBanner: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aiScanBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiScanIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiScanTextCol: {
    flex: 1,
  },
  aiScanTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  aiScanDesc: {
    fontSize: 10.5,
    color: '#0284C7',
    marginTop: 1,
    lineHeight: 14,
  },
  aiScanCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  aiScanCtaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tab Bar
  tabBarWrap: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItemActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Body Content
  pricingBodyScroll: {
    flex: 1,
  },
  pricingBodyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },

  // 3-tier Cards
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
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadgeFree: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
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
    borderWidth: 1,
    borderColor: '#BAE6FD',
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
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
  tierTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  tierDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },

  // Sub-services table
  subServicesSection: {
    marginTop: 4,
    gap: 8,
  },
  subServicesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subServicesTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  tableServiceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  tableServiceUnit: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  tableRowRight: {
    alignItems: 'flex-end',
  },
  tableServicePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Policy Box
  policyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  policyBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  policyBullet: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '800',
  },
  policyBulletText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
});
