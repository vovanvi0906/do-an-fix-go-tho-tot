/**
 * @file CategoryGrid.tsx
 * @description Lưới 8 danh mục dịch vụ (4x2) phong cách Soft-Tint Squircle hiện đại.
 * Nền pastel mờ 10-12%, icon màu thương hiệu sắc nét, không dùng màu chói mắt,
 * Sắp xếp theo tần suất sử dụng thực tế (Sửa điện, Sửa nước, Điện lạnh, Thiết bị lên hàng đầu).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryItem } from '../types/home.types';

const isNative = Platform.OS !== 'web';

interface CategoryGridProps {
  categories: CategoryItem[];
  selectedCategoryId: string | null;
  onSelectCategory?: (categoryId: string) => void;
}

interface CategoryVisualConfig {
  tintBg: string;
  iconColor: string;
  borderColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isPopular?: boolean;
  isHot?: boolean;
}

/**
 * Bảng màu Soft-Tint tối giản, sang trọng, hiện đại (Minimal Luxury Palette)
 */
const CATEGORY_CONFIG_MAP: Record<string, CategoryVisualConfig> = {
  // 1. Sửa điện
  'sua-dien': {
    tintBg: '#FEF3C7',
    iconColor: '#D97706',
    borderColor: '#FDE68A',
    iconName: 'flash-outline',
    isPopular: true,
  },
  // 2. Sửa nước
  'sua-nuoc': {
    tintBg: '#E0F2FE',
    iconColor: '#0284C7',
    borderColor: '#BAE6FD',
    iconName: 'water-outline',
    isPopular: true,
  },
  // 3. Điện lạnh
  'dien-lanh': {
    tintBg: '#ECFEFF',
    iconColor: '#0891B2',
    borderColor: '#A5F3FC',
    iconName: 'snow-outline',
    isHot: true,
  },
  // 4. Thiết bị gia dụng
  'thiet-bi': {
    tintBg: '#EEF2FF',
    iconColor: '#4F46E5',
    borderColor: '#C7D2FE',
    iconName: 'tv-outline',
  },
  // 5. Làm vườn
  'lam-vuon': {
    tintBg: '#ECFDF5',
    iconColor: '#059669',
    borderColor: '#A7F3D0',
    iconName: 'leaf-outline',
  },
  // 6. Giúp việc
  'giup-viec': {
    tintBg: '#FFF1F2',
    iconColor: '#E11D48',
    borderColor: '#FECDD3',
    iconName: 'sparkles-outline',
  },
  // 7. Bảng giá
  'bang-gia': {
    tintBg: '#F0FDFA',
    iconColor: '#0D9488',
    borderColor: '#CCFBF1',
    iconName: 'receipt-outline',
  },
  // 8. Dịch vụ khác
  'dich-vu-khac': {
    tintBg: '#F1F5F9',
    iconColor: '#475569',
    borderColor: '#E2E8F0',
    iconName: 'grid-outline',
  },
};

const getCategoryVisual = (slugOrIcon: string, index: number): CategoryVisualConfig => {
  if (CATEGORY_CONFIG_MAP[slugOrIcon]) {
    return CATEGORY_CONFIG_MAP[slugOrIcon];
  }

  const fallbackList: CategoryVisualConfig[] = [
    { tintBg: '#FEF3C7', iconColor: '#D97706', borderColor: '#FDE68A', iconName: 'flash-outline', isPopular: true },
    { tintBg: '#E0F2FE', iconColor: '#0284C7', borderColor: '#BAE6FD', iconName: 'water-outline', isPopular: true },
    { tintBg: '#ECFEFF', iconColor: '#0891B2', borderColor: '#A5F3FC', iconName: 'snow-outline', isHot: true },
    { tintBg: '#ECFDF5', iconColor: '#059669', borderColor: '#A7F3D0', iconName: 'leaf-outline' },
    { tintBg: '#EEF2FF', iconColor: '#4F46E5', borderColor: '#C7D2FE', iconName: 'tv-outline' },
    { tintBg: '#FFF1F2', iconColor: '#E11D48', borderColor: '#FECDD3', iconName: 'sparkles-outline' },
    { tintBg: '#F0FDFA', iconColor: '#0D9488', borderColor: '#CCFBF1', iconName: 'receipt-outline' },
    { tintBg: '#F1F5F9', iconColor: '#475569', borderColor: '#E2E8F0', iconName: 'grid-outline' },
  ];

  return fallbackList[index % fallbackList.length];
};

/**
 * Sub-component cho từng item danh mục
 */
interface CategoryGridItemProps {
  category: CategoryItem;
  index: number;
  isSelected: boolean;
  entranceAnim: { opacity: Animated.Value; translateY: Animated.Value };
  onSelect?: (id: string) => void;
}

function CategoryGridItem({
  category,
  index,
  isSelected,
  entranceAnim,
  onSelect,
}: CategoryGridItemProps) {
  const config = getCategoryVisual(category.slug || category.iconName, index);

  // Animated Value cho hiệu ứng chạm lò xo
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animated Value cho hiệu ứng nhịp thở badge HOT
  const hotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!config.isHot) return;

    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(hotScale, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
        Animated.timing(hotScale, {
          toValue: 0.95,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
      ])
    );

    loopAnim.start();
    return () => loopAnim.stop();
  }, [config.isHot, hotScale]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.90,
      useNativeDriver: isNative,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 150,
      useNativeDriver: isNative,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.gridItem,
        {
          opacity: entranceAnim.opacity,
          transform: [
            { translateY: entranceAnim.translateY },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Pressable
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Danh mục ${category.name}`}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect?.(category.id)}
        style={styles.pressableTouch}
      >
        {/* Squircle Soft-Tint Box Tối Giản, Hiện Đại, Sang Trọng */}
        <View
          style={[
            styles.squircleBox,
            {
              backgroundColor: isSelected ? '#0284C7' : config.tintBg,
              borderColor: isSelected ? '#0284C7' : config.borderColor,
            },
          ]}
        >
          <Ionicons
            name={config.iconName}
            size={24}
            color={isSelected ? '#FFFFFF' : config.iconColor}
          />

          {/* Badge HOT 🔥 */}
          {config.isHot && !isSelected && (
            <Animated.View
              style={[
                styles.hotBadge,
                { transform: [{ scale: hotScale }] },
              ]}
            >
              <Text style={styles.hotBadgeText}>HOT</Text>
            </Animated.View>
          )}

          {/* Badge Phổ biến */}
          {config.isPopular && !isSelected && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Top</Text>
            </View>
          )}
        </View>

        {/* Tên danh mục Slate-700 (#334155) */}
        <Text
          style={[
            styles.itemLabel,
            isSelected && styles.itemLabelSelected,
          ]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Main Component `CategoryGrid`
 */
export default function CategoryGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryGridProps) {
  const entranceAnims = useRef(
    [...Array(8)].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    const animations = entranceAnims.map((item) =>
      Animated.parallel([
        Animated.timing(item.opacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: isNative,
        }),
        Animated.timing(item.translateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: isNative,
        }),
      ])
    );

    const staggerAnim = Animated.stagger(45, animations);
    staggerAnim.start();

    return () => staggerAnim.stop();
  }, [entranceAnims]);

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Danh mục dịch vụ</Text>
        <Text style={styles.subtitle}>8 tiện ích gia đình</Text>
      </View>

      {/* ── 4x2 Soft-Tint Squircle Grid ───────────────────────── */}
      <View style={styles.gridContainer}>
        {categories.slice(0, 8).map((cat, index) => (
          <CategoryGridItem
            key={cat.id}
            category={cat}
            index={index}
            isSelected={selectedCategoryId === cat.id}
            entranceAnim={entranceAnims[index % entranceAnims.length]}
            onSelect={onSelectCategory}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
  },
  pressableTouch: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
    minHeight: 44,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  squircleBox: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  hotBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  hotBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  popularBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  popularBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 6,
  },
  itemLabelSelected: {
    color: '#0284C7',
    fontWeight: '800',
  },
});
