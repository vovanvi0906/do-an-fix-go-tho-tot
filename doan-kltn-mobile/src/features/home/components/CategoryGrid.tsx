/**
 * @file CategoryGrid.tsx
 * @description Lưới 8 danh mục dịch vụ dạng Squircle (4x2) cho React Native FixGo.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CategoryItem } from '../types/home.types';

interface CategoryGridProps {
  categories: CategoryItem[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

// Map icon name to Ionicons or MaterialCommunityIcons
const renderCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Zap':
      return <Ionicons name="flash" size={24} color="#FFFFFF" />;
    case 'Droplets':
      return <Ionicons name="water" size={24} color="#FFFFFF" />;
    case 'Wind':
      return <MaterialCommunityIcons name="air-conditioner" size={24} color="#FFFFFF" />;
    case 'Tv':
      return <Ionicons name="tv-outline" size={24} color="#FFFFFF" />;
    case 'Trees':
      return <MaterialCommunityIcons name="tree" size={24} color="#FFFFFF" />;
    case 'Sparkles':
      return <Ionicons name="sparkles" size={24} color="#FFFFFF" />;
    case 'FileText':
      return <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />;
    case 'LayoutGrid':
    default:
      return <Ionicons name="grid-outline" size={24} color="#FFFFFF" />;
  }
};

/**
 * Component `CategoryGrid`
 */
export default function CategoryGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Danh mục dịch vụ</Text>
        <Text style={styles.subtitle}>8 dịch vụ tiện ích</Text>
      </View>

      {/* 4x2 Grid */}
      <View style={styles.gridContainer}>
        {categories.slice(0, 8).map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                styles.gridItem,
                isSelected && styles.gridItemSelected,
                pressed && styles.itemPressed,
              ]}
              onPress={() => onSelectCategory(cat.id)}
            >
              {/* Squircle Icon Container */}
              <View style={[styles.squircleContainer, isSelected && styles.squircleSelected]}>
                {renderCategoryIcon(cat.iconName)}
              </View>

              {/* Text Label */}
              <Text
                style={[styles.itemText, isSelected && styles.itemTextSelected]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 16,
  },
  gridItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  squircleContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 6,
  },
  squircleSelected: {
    backgroundColor: '#2563EB',
    transform: [{ scale: 1.05 }],
  },
  itemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  itemTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  itemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
});
