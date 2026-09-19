/**
 * @file PopularServicesCarousel.tsx
 * @description Carousel dịch vụ phổ biến vuốt ngang (Horizontal Snap Scroll) cho React Native FixGo.
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
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Dịch vụ phổ biến</Text>
          <Text style={styles.subtitle}>Đặt nhiều nhất tuần qua</Text>
        </View>

        {onViewAll && (
          <Pressable
            style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}
            onPress={onViewAll}
          >
            <Text style={styles.viewAllText}>Tất cả</Text>
            <Ionicons name="arrow-forward" size={12} color="#0284C7" />
          </Pressable>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            {/* Image & Tag */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
              {service.tag && (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{service.tag}</Text>
                </View>
              )}
              <View style={styles.durationChip}>
                <Ionicons name="time-outline" size={11} color="#0284C7" style={{ marginRight: 3 }} />
                <Text style={styles.durationText}>{service.durationMin}p</Text>
              </View>
            </View>

            {/* Content Details */}
            <View style={styles.cardContent}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({service.reviewsCount})</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {service.categoryName}
                </Text>
              </View>

              <Text style={styles.serviceName} numberOfLines={2}>
                {service.name}
              </Text>

              {/* Price & Add Button */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.pricePrefix}>Từ</Text>
                  <Text style={styles.priceValue}>
                    {service.basePrice.toLocaleString('vi-VN')}
                    <Text style={styles.priceUnit}>đ/{service.unit}</Text>
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                  onPress={() => onBookService(service)}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>
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
    fontSize: 15,
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
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  serviceCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 115,
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
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  durationChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
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
    color: '#94A3B8',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
    marginBottom: 8,
    minHeight: 32,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 6,
  },
  pricePrefix: {
    fontSize: 9,
    color: '#94A3B8',
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
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  addBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.9 }],
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
