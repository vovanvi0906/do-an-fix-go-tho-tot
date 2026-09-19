/**
 * @file HomeSkeleton.tsx
 * @description Component Loading Skeleton Shimmer cho Trang Chủ React Native.
 * Tuyệt đối không dùng spinner ActivityIndicator, sử dụng animation làm mờ/sáng mượt mà.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Component `HomeSkeleton`
 */
export default function HomeSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.container}>
      {/* 1. Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextGroup}>
            <Animated.View style={[styles.shimmerBox, { width: 100, height: 14, opacity: shimmerAnim }]} />
            <Animated.View style={[styles.shimmerBox, { width: 150, height: 20, marginTop: 6, opacity: shimmerAnim }]} />
          </View>
          <View style={styles.headerRightGroup}>
            <Animated.View style={[styles.shimmerPill, { width: 70, height: 28, opacity: shimmerAnim }]} />
            <Animated.View style={[styles.shimmerCircle, { width: 36, height: 36, opacity: shimmerAnim }]} />
          </View>
        </View>

        {/* Search Bar Skeleton */}
        <Animated.View style={[styles.searchSkeleton, { opacity: shimmerAnim }]} />
      </View>

      {/* 2. Body Content Skeletons */}
      <View style={styles.bodyContent}>
        {/* Banner Skeleton */}
        <Animated.View style={[styles.bannerSkeleton, { opacity: shimmerAnim }]} />

        {/* Map Card Skeleton */}
        <View style={styles.sectionSkeleton}>
          <Animated.View style={[styles.shimmerBox, { width: 140, height: 16, opacity: shimmerAnim }]} />
          <Animated.View style={[styles.mapSkeleton, { opacity: shimmerAnim }]} />
        </View>

        {/* Category Grid Skeleton (4x2 = 8 items) */}
        <View style={styles.sectionSkeleton}>
          <Animated.View style={[styles.shimmerBox, { width: 130, height: 16, opacity: shimmerAnim }]} />
          <View style={styles.gridSkeleton}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={styles.gridItemSkeleton}>
                <Animated.View style={[styles.categorySquircle, { opacity: shimmerAnim }]} />
                <Animated.View style={[styles.shimmerBox, { width: 44, height: 10, marginTop: 6, opacity: shimmerAnim }]} />
              </View>
            ))}
          </View>
        </View>

        {/* Carousel Skeleton */}
        <View style={styles.sectionSkeleton}>
          <Animated.View style={[styles.shimmerBox, { width: 150, height: 16, opacity: shimmerAnim }]} />
          <View style={styles.carouselRow}>
            {[...Array(2)].map((_, i) => (
              <Animated.View key={i} style={[styles.cardSkeleton, { opacity: shimmerAnim }]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSkeleton: {
    backgroundColor: '#BAE6FD',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shimmerBox: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  shimmerPill: {
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
  },
  shimmerCircle: {
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
  },
  searchSkeleton: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
  },
  bodyContent: {
    padding: 16,
    gap: 24,
  },
  bannerSkeleton: {
    height: 130,
    backgroundColor: '#CBD5E1',
    borderRadius: 24,
  },
  sectionSkeleton: {
    gap: 10,
  },
  mapSkeleton: {
    height: 180,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
  },
  gridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  gridItemSkeleton: {
    width: '22%',
    alignItems: 'center',
  },
  categorySquircle: {
    width: 56,
    height: 56,
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
  },
  carouselRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardSkeleton: {
    width: 190,
    height: 220,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
  },
});
