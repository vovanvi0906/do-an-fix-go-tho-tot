/**
 * @file WorkerMapSection.tsx
 * @description Mục "Khu vực làm việc" hiển thị card bản đồ thợ đang online và nút pill "Xem bản đồ chi tiết".
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkerItem } from '../types/home.types';

interface WorkerMapSectionProps {
  workers: WorkerItem[];
  userDistrict?: string;
  onOpenMap?: () => void;
  onSelectWorker?: (worker: WorkerItem) => void;
}

/**
 * Component `WorkerMapSection`
 */
export default function WorkerMapSection({
  workers,
  userDistrict = 'Q. Bình Thạnh, TP.HCM',
  onOpenMap,
  onSelectWorker,
}: WorkerMapSectionProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Khu vực làm việc</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{workers.length} Thợ sẵn sàng</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.expandBtn, pressed && styles.pressed]}
          onPress={onOpenMap}
        >
          <Text style={styles.expandText}>Mở rộng</Text>
          <Ionicons name="arrow-forward" size={12} color="#0284C7" />
        </Pressable>
      </View>

      {/* Map Preview Card */}
      <View style={styles.mapCard}>
        {/* Stylized Vector Streets Grid Background */}
        <View style={styles.vectorMapBackground}>
          <View style={[styles.riverShape]} />
          <View style={[styles.mainRoadHorizontal, { top: '30%' }]} />
          <View style={[styles.mainRoadHorizontal, { top: '65%' }]} />
          <View style={[styles.mainRoadVertical, { left: '30%' }]} />
          <View style={[styles.mainRoadVertical, { left: '70%' }]} />
        </View>

        {/* Center User Location Pin */}
        <View style={styles.centerUserPin}>
          <View style={styles.pulseRadarOuter} />
          <View style={styles.userPinDot}>
            <Ionicons name="navigate" size={12} color="#FFFFFF" />
          </View>
          <View style={styles.userPinBadge}>
            <Text style={styles.userPinText}>Vị trí của bạn</Text>
          </View>
        </View>

        {/* Simulated Worker Markers */}
        {workers.map((worker, index) => {
          const positions = [
            { top: 32, left: 45 },
            { top: 40, right: 38 },
            { bottom: 44, left: 60 },
          ];
          const pos = positions[index % positions.length];

          return (
            <Pressable
              key={worker.id}
              style={[styles.workerPin, pos]}
              onPress={() => onSelectWorker?.(worker)}
            >
              <Image source={{ uri: worker.avatarUrl }} style={styles.workerAvatar} />
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={8} color="#F59E0B" />
                <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Floating Pill Button "Xem bản đồ chi tiết" */}
        <View style={styles.bottomPillContainer}>
          <Pressable
            style={({ pressed }) => [styles.mapDetailsPill, pressed && styles.pressed]}
            onPress={onOpenMap}
          >
            <Ionicons name="map-outline" size={14} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={styles.mapDetailsText}>Xem bản đồ chi tiết</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  mapCard: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0FDF4',
  },
  vectorMapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EBF4FF',
  },
  riverShape: {
    position: 'absolute',
    top: -20,
    left: '35%',
    width: 80,
    height: 220,
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '35deg' }],
    opacity: 0.6,
  },
  mainRoadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
    opacity: 0.8,
  },
  mainRoadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    opacity: 0.8,
  },
  centerUserPin: {
    position: 'absolute',
    top: '42%',
    left: '46%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRadarOuter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
  },
  userPinDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  userPinBadge: {
    position: 'absolute',
    top: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userPinText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workerPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#334155',
    marginLeft: 2,
  },
  bottomPillContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mapDetailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mapDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
