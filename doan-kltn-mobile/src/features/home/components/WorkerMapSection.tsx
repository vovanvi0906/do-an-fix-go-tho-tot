/**
 * @file WorkerMapSection.tsx
 * @description Mục "Thợ trực tuyến quanh bạn" kết hợp Radar Map trực quan và danh sách thẻ thợ cuộn ngang (Peeking Card Effect).
 * Minh bạch tiêu chí sắp xếp, thước đo uy tín (số đơn hoàn thành) và diện tích chạm chuẩn WCAG AA.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
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
      {/* ── 1. Header & Tiêu chí sắp xếp ──────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Thợ trực tuyến quanh bạn</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{workers?.length || 0} sẵn sàng</Text>
          </View>
        </View>

        <Pressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Mở toàn màn hình bản đồ thợ"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.expandBtn, pressed && styles.pressedEffect]}
          onPress={onOpenMap}
        >
          <Text style={styles.expandText}>Mở bản đồ</Text>
          <Ionicons name="arrow-forward" size={13} color="#0284C7" />
        </Pressable>
      </View>

      {/* Minh bạch tiêu chí hiển thị */}
      <View style={styles.criteriaBar}>
        <Ionicons name="funnel-outline" size={11} color="#64748B" style={{ marginRight: 4 }} />
        <Text style={styles.criteriaText}>
          Sắp xếp theo: <Text style={styles.criteriaHighlight}>Khoảng cách gần nhất & Đánh giá cao</Text>
        </Text>
      </View>

      {/* ── 2. Map Preview Card (Height 150px) ────────────────── */}
      <View style={styles.mapCard}>
        {/* Vector Streets Grid Background */}
        <View style={styles.vectorMapBackground}>
          <View style={styles.riverShape} />
          <View style={[styles.mainRoadHorizontal, { top: '28%' }]} />
          <View style={[styles.mainRoadHorizontal, { top: '62%' }]} />
          <View style={[styles.mainRoadVertical, { left: '32%' }]} />
          <View style={[styles.mainRoadVertical, { left: '68%' }]} />
        </View>

        {/* Center User Location Pin with Dual Radar Waves */}
        <View style={styles.centerUserPin}>
          <View style={styles.pulseRadarOuter} />
          <View style={styles.pulseRadarMiddle} />
          <View style={styles.userPinDot}>
            <Ionicons name="navigate" size={11} color="#FFFFFF" />
          </View>
          <View style={styles.userPinBadge}>
            <Text style={styles.userPinText}>Vị trí của bạn</Text>
          </View>
        </View>

        {/* Simulated Worker Pin Markers */}
        {workers?.map((worker, index) => {
          const positions = [
            { top: 16, left: 28 },
            { top: 20, right: 32 },
            { bottom: 36, left: 44 },
          ];
          const pos = positions[index % positions.length];

          return (
            <Pressable
              key={worker.id}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Thợ ${worker.fullName}, chuyên môn ${worker.specialty}, đánh giá ${worker.rating} sao`}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.workerPin,
                pos,
                pressed && styles.pressedEffect,
              ]}
              onPress={() => onSelectWorker?.(worker)}
            >
              <Image source={{ uri: worker.avatarUrl }} style={styles.workerAvatar} />
              <View style={styles.onlineDotOnAvatar} />
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={9} color="#F59E0B" />
                <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Floating Pill Button "Xem bản đồ chi tiết" (44px touch height) */}
        <View style={styles.bottomPillContainer}>
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Xem bản đồ chi tiết mạng lưới thợ"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.mapDetailsPill,
              pressed && styles.pressedEffect,
            ]}
            onPress={onOpenMap}
          >
            <Ionicons name="location-sharp" size={14} color="#0284C7" style={{ marginRight: 5 }} />
            <Text style={styles.mapDetailsText}>Xem bản đồ chi tiết khu vực</Text>
          </Pressable>
        </View>
      </View>

      {/* ── 3. Danh sách Thẻ Thợ Cuộn Ngang (15% Peeking Card Effect) ─ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workersScrollContent}
        decelerationRate="fast"
      >
        {workers?.map((worker) => (
          <Pressable
            key={worker.id}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Thợ ${worker.fullName}, ${worker.specialty}, đã hoàn thành ${worker.completedJobs} đơn, khoảng cách ${worker.distanceKm} km`}
            style={({ pressed }) => [
              styles.workerDetailCard,
              pressed && styles.pressedEffect,
            ]}
            onPress={() => onSelectWorker?.(worker)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: worker.avatarUrl }} style={styles.cardAvatar} />
                <View style={styles.cardOnlineDot} />
              </View>
              <View style={styles.cardInfoCol}>
                <Text style={styles.cardWorkerName} numberOfLines={1}>
                  {worker.fullName}
                </Text>
                <Text style={styles.cardSpecialtyText} numberOfLines={1}>
                  {worker.specialty}
                </Text>
              </View>
            </View>

            {/* Thước đo uy tín thực tế: Rating + Số đơn hoàn thành + Khoảng cách */}
            <View style={styles.credibilityRow}>
              <View style={styles.ratingBadgePill}>
                <Ionicons name="star" size={11} color="#F59E0B" style={{ marginRight: 2 }} />
                <Text style={styles.ratingNumText}>{worker.rating.toFixed(1)}</Text>
                <Text style={styles.completedJobsText}>({worker.completedJobs} đơn)</Text>
              </View>
              <Text style={styles.distanceBadgeText}>📍 {worker.distanceKm} km</Text>
            </View>

            {/* Nút Gọi / Đặt nhanh */}
            <View style={styles.quickCallPill}>
              <Text style={styles.quickCallText}>Xem hồ sơ & Gọi thợ</Text>
              <Ionicons name="chevron-forward" size={12} color="#0284C7" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
    paddingVertical: 3,
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
    gap: 3,
    minHeight: 36,
    justifyContent: 'center',
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Criteria Bar
  criteriaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  criteriaText: {
    fontSize: 11,
    color: '#64748B',
  },
  criteriaHighlight: {
    fontWeight: '600',
    color: '#334155',
  },

  // Map Card
  mapCard: {
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F9FF',
  },
  vectorMapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F9FF',
  },
  riverShape: {
    position: 'absolute',
    top: -30,
    left: '38%',
    width: 70,
    height: 240,
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '32deg' }],
    opacity: 0.45,
  },
  mainRoadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  mainRoadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  centerUserPin: {
    position: 'absolute',
    top: '36%',
    left: '46%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRadarOuter: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  pulseRadarMiddle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.20)',
  },
  userPinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  userPinBadge: {
    position: 'absolute',
    top: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userPinText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workerPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  onlineDotOnAvatar: {
    position: 'absolute',
    bottom: 2,
    left: 18,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mapDetailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 36,
  },
  mapDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Peeking Card List (Horizontal Scroll)
  workersScrollContent: {
    gap: 12,
    paddingRight: 20, // Để lộ 15% mép card tiếp theo
    paddingVertical: 4,
  },
  workerDetailCard: {
    width: 215,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  cardOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cardInfoCol: {
    flex: 1,
  },
  cardWorkerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSpecialtyText: {
    fontSize: 11,
    color: '#64748B',
  },
  credibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginLeft: 2,
  },
  completedJobsText: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 3,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  quickCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  quickCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  pressedEffect: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
