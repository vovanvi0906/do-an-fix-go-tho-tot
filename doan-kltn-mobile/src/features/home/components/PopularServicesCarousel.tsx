/**
 * @file PopularServicesCarousel.tsx
 * @description Carousel dịch vụ phổ biến vuốt ngang (Horizontal Snap Scroll).
 * Bố cục hiển thị trọn vẹn thông tin (Giá niêm yết, Thời gian có mặt sau 15p, Đánh giá),
 * Nút Đặt ngay và nút "Xem tất cả 40+ dịch vụ" đạt chuẩn Touch Target 44x44px WCAG AA.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ServiceItem } from '../types/home.types';

interface PopularServicesCarouselProps {
  services: ServiceItem[];
  onBookService: (service: ServiceItem) => void;
  onViewAll?: () => void;
}

/**
 * Component `PopularServicesCarousel`
 */
export default function PopularServicesCarousel({
  services,
  onBookService,
  onViewAll,
}: PopularServicesCarouselProps) {
  return (
    <View style={styles.container}>
      {/* ── 1. Header Row ─────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Dịch vụ phổ biến</Text>
          <Text style={styles.subtitle}>Giá niêm yết minh bạch • Đặt nhiều nhất tuần</Text>
        </View>

        {onViewAll && (
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả hơn 40 dịch vụ sửa chữa"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressedEffect]}
            onPress={onViewAll}
          >
            <Text style={styles.viewAllText}>Xem tất cả 40+</Text>
            <Ionicons name="arrow-forward" size={13} color="#0284C7" />
          </Pressable>
        )}
      </View>

      {/* ── 2. Horizontal Scroll Cards (Tránh cắt cụt nội dung) ─ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {services.map((service) => (
          <Pressable
            key={service.id}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Dịch vụ ${service.name}, giá ${service.basePrice.toLocaleString('vi-VN')} đồng, đánh giá ${service.rating} sao`}
            style={({ pressed }) => [
              styles.serviceCard,
              pressed && styles.cardPressedEffect,
            ]}
            onPress={() => onBookService(service)}
          >
            {/* Image Banner, Tag & Arrival Time Chip */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
              {service.tag && (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{service.tag}</Text>
                </View>
              )}
              <View style={styles.arrivalChip}>
                <Ionicons name="flash" size={10} color="#0284C7" style={{ marginRight: 3 }} />
                <Text style={styles.arrivalText}>Có mặt sau 15p</Text>
              </View>
            </View>

            {/* Content Details */}
            <View style={styles.cardContent}>
              {/* Category & Rating */}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({service.reviewsCount})</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {service.categoryName}
                </Text>
              </View>

              {/* Service Full Name */}
              <Text style={styles.serviceName} numberOfLines={2}>
                {service.name}
              </Text>

              {/* Price & Action Button */}
              <View style={styles.priceRow}>
                <View style={styles.priceCol}>
                  <Text style={styles.pricePrefix}>Giá niêm yết:</Text>
                  <Text style={styles.priceValue}>
                    {service.basePrice.toLocaleString('vi-VN')}
                    <Text style={styles.priceUnit}> đ/{service.unit}</Text>
                  </Text>
                </View>

                {/* Touch Target 44x44px Button Đặt ngay */}
                <Pressable
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Đặt ngay dịch vụ ${service.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={({ pressed }) => [styles.bookNowBtn, pressed && styles.pressedEffect]}
                  onPress={() => onBookService(service)}
                >
                  <Text style={styles.bookNowText}>Đặt ngay</Text>
                  <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 44,
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  scrollContent: {
    paddingRight: 20,
    gap: 14,
    paddingVertical: 2,
  },
  serviceCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  arrivalChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  arrivalText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 2,
  },
  reviewsText: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 2,
  },
  dotSeparator: {
    fontSize: 10,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  categoryName: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 10,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  priceCol: {
    flex: 1,
  },
  pricePrefix: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  priceUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minHeight: 36,
    gap: 2,
  },
  bookNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressedEffect: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardPressedEffect: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },
});
