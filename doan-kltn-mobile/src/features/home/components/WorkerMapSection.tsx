/**
 * @file WorkerMapSection.tsx
 * @description Khối "Thợ trực tuyến quanh bạn" sử dụng Bản đồ tương tác RealLeafletMap.
 * 1. Định vị GPS thật từ chip GPS điện thoại qua expo-location.
 * 2. Gọi API Backend thật: GET /api/workers/nearby?lat={lat}&lng={lng}&radius=15.0.
 * 3. STRICT ZERO-MOCK: Tuyệt đối không dùng dữ liệu giả. Nếu CSDL PostGIS không có thợ, không vẽ marker nào.
 * 4. Bản đồ địa hình thực tế OpenStreetMap hiển thị đầy đủ tên đường sá, sông ngòi tại TP.HCM/Việt Nam.
 * 5. Tương tác mượt mà 60 FPS, an toàn tuyệt đối, không bao giờ bị lỗi codegenNativeCommands.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import type { WorkerItem } from '../types/home.types';
import { getNearbyWorkersApi } from '../../../services/api/workerService';
import RealLeafletMap, { RealLeafletMapRef } from '../../../components/RealLeafletMap';
import WorkerFullMapModal from './WorkerFullMapModal';

const CARD_WIDTH = 215;
const CARD_GAP = 12;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

interface WorkerMapSectionProps {
  userDistrict?: string;
  onOpenMap?: () => void;
  onSelectWorker?: (worker: WorkerItem) => void;
}

/**
 * Component `WorkerMapSection`
 */
export default function WorkerMapSection({
  userDistrict = 'Q. Bình Thạnh, TP.HCM',
  onOpenMap,
  onSelectWorker,
}: WorkerMapSectionProps) {
  // ── 1. Quản lý trạng thái định vị GPS thật & dữ liệu Backend ─
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState<boolean>(false);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  const mapRef = useRef<RealLeafletMapRef | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── 2. Vòng đời xin quyền GPS thật & Truy vấn PostGIS ─────
  useEffect(() => {
    let isMounted = true;

    async function initRealGpsAndWorkers() {
      setLoadingLocation(true);
      let userLat = 10.803;
      let userLng = 106.711;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          if (isMounted) setPermissionDenied(false);
          const currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          userLat = currentPosition.coords.latitude;
          userLng = currentPosition.coords.longitude;
          if (isMounted) {
            setLocation({ lat: userLat, lng: userLng });
          }
        } else {
          if (isMounted) {
            setPermissionDenied(true);
            setLocation({ lat: 10.803, lng: 106.711 });
          }
        }
      } catch (locErr) {
        console.warn('⚠️ [WorkerMapSection] Lỗi lấy vị trí GPS:', locErr);
        if (isMounted) {
          setPermissionDenied(true);
          setLocation({ lat: 10.803, lng: 106.711 });
        }
      } finally {
        if (isMounted) {
          setLoadingLocation(false);
        }
      }

      // 2. Gọi API Backend thật: GET /api/workers/nearby
      if (isMounted) setLoadingWorkers(true);
      try {
        const realWorkers = await getNearbyWorkersApi(userLat, userLng, 15.0);
        if (isMounted) {
          setWorkers(realWorkers);
          if (realWorkers.length > 0) {
            setSelectedWorkerId(realWorkers[0].id);
          } else {
            setSelectedWorkerId(null);
          }
        }
      } catch (err) {
        console.error('❌ [WorkerMapSection] Lỗi truy vấn API Backend:', err);
        if (isMounted) {
          setWorkers([]);
          setSelectedWorkerId(null);
        }
      } finally {
        if (isMounted) {
          setLoadingWorkers(false);
        }
      }
    }

    initRealGpsAndWorkers();

    return () => {
      isMounted = false;
    };
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch {
        // Safe catch on unsupported devices
      }
    }
  };

  // ── 3. Tương tác Marker & Thẻ thợ ─────────────────────────
  const handleMarkerSelect = useCallback(
    (workerId: string) => {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      setSelectedWorkerId(workerId);

      const index = workers.findIndex((w) => w.id === workerId);
      if (index >= 0) {
        scrollRef.current?.scrollTo({
          x: index * CARD_STEP,
          animated: true,
        });
      }
    },
    [workers]
  );

  const handleRecenterUser = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    mapRef.current?.recenter();
  };

  const handleOpenMapModal = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (onOpenMap) {
      onOpenMap();
    }
    setIsMapModalOpen(true);
  };

  const handleCardPress = (worker: WorkerItem) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWorkerId(worker.id);

    mapRef.current?.focusWorker(worker.id, worker.latitude, worker.longitude);
    onSelectWorker?.(worker);
  };

  const currentLat = location?.lat ?? 10.803;
  const currentLng = location?.lng ?? 106.711;

  return (
    <View style={styles.container}>
      {/* ── 1. Header & Badge Trạng Thái Thực Tế ────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Thợ trực tuyến quanh bạn</Text>

          {workers.length > 0 ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{workers.length} thợ sẵn sàng</Text>
            </View>
          ) : (
            <View style={styles.emptyBadge}>
              <View style={styles.emptyDot} />
              <Text style={styles.emptyBadgeText}>Chưa có thợ quanh đây</Text>
            </View>
          )}
        </View>

        <Pressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Mở toàn màn hình bản đồ thợ"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.expandBtn, pressed && styles.pressedEffect]}
          onPress={handleOpenMapModal}
        >
          <Text style={styles.expandText}>Mở bản đồ</Text>
          <Ionicons name="arrow-forward" size={13} color="#0284C7" />
        </Pressable>
      </View>

      {/* Thông báo nhắc nhở nếu chưa bật GPS */}
      {permissionDenied && (
        <View style={styles.permNoticeBanner}>
          <Ionicons name="location-outline" size={13} color="#D97706" style={{ marginRight: 5 }} />
          <Text style={styles.permNoticeText}>
            Bạn chưa cấp quyền GPS. Ứng dụng đang hiển thị khu vực mặc định: {userDistrict}.
          </Text>
        </View>
      )}

      {/* Minh bạch tiêu chí hiển thị */}
      <View style={styles.criteriaBar}>
        <Ionicons name="funnel-outline" size={11} color="#64748B" style={{ marginRight: 4 }} />
        <Text style={styles.criteriaText}>
          Sắp xếp theo: <Text style={styles.criteriaHighlight}>Khoảng cách GPS thực tế & Đánh giá cao</Text>
        </Text>
      </View>

      {/* ── 2. Khối Bản Đồ Thật (Leaflet OpenStreetMap - Height 180px) ─ */}
      <View style={styles.mapCard}>
        {/* Loading Indicator */}
        {(loadingLocation || loadingWorkers) && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={styles.mapLoadingText}>Đang quét GPS & tìm thợ...</Text>
          </View>
        )}

        {/* Real Leaflet Map qua WebView */}
        <RealLeafletMap
          ref={mapRef}
          userLocation={location}
          workers={workers}
          selectedWorkerId={selectedWorkerId}
          onSelectWorker={handleMarkerSelect}
          height="100%"
          scrollEnabled={false}
          showRadiusCircle={true}
          radiusInMeters={3000}
        />

        {/* Nút nổi Định Vị Lại Bản Đồ (Re-center GPS) */}
        <Pressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Định vị lại vị trí của tôi"
          style={({ pressed }) => [
            styles.recenterBtn,
            pressed && styles.pressedEffect,
          ]}
          onPress={handleRecenterUser}
        >
          <Ionicons name="locate" size={17} color="#0284C7" />
        </Pressable>

        {/* Badge thông báo nếu không có thợ trực tuyến trong bán kính */}
        {workers.length === 0 && !loadingWorkers && (
          <View style={styles.noWorkersMapBanner}>
            <Ionicons name="radio-outline" size={13} color="#64748B" style={{ marginRight: 5 }} />
            <Text style={styles.noWorkersMapBannerText}>
              Chưa có thợ trực tuyến trong bán kính 15km
            </Text>
          </View>
        )}

        {/* Nút CTA "Xem bản đồ chi tiết khu vực" (44px touch height) */}
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
            onPress={handleOpenMapModal}
          >
            <Ionicons name="location-sharp" size={14} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={styles.mapDetailsText}>Xem bản đồ chi tiết khu vực</Text>
            <Ionicons name="chevron-forward" size={13} color="#0284C7" style={{ marginLeft: 3 }} />
          </Pressable>
        </View>
      </View>

      {/* ── 3. Danh Sách Thẻ Thợ Thật hoặc Khối Empty State ─────── */}
      {workers.length > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.workersScrollContent}
          decelerationRate="fast"
        >
          {workers.map((worker) => {
            const isSelected = selectedWorkerId === worker.id;

            return (
              <Pressable
                key={worker.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Thợ ${worker.fullName}, ${worker.specialty}, đã hoàn thành ${worker.completedJobs} đơn, khoảng cách ${worker.distanceKm} km`}
                style={({ pressed }) => [
                  styles.workerDetailCard,
                  isSelected && styles.workerDetailCardSelected,
                  pressed && styles.pressedEffect,
                ]}
                onPress={() => handleCardPress(worker)}
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

                {/* Thước đo uy tín thực tế: Rating + Số đơn hoàn thành + Khoảng cách GPS */}
                <View style={styles.credibilityRow}>
                  <View style={styles.ratingBadgePill}>
                    <Ionicons name="star" size={11} color="#F59E0B" style={{ marginRight: 2 }} />
                    <Text style={styles.ratingNumText}>{worker.rating.toFixed(1)}</Text>
                    {worker.completedJobs > 0 && (
                      <Text style={styles.completedJobsText}>({worker.completedJobs} đơn)</Text>
                    )}
                  </View>
                  <Text style={styles.distanceBadgeText}>📍 {worker.distanceKm} km</Text>
                </View>

                {/* Nút Xem hồ sơ & Gọi thợ */}
                <View style={[styles.quickCallPill, isSelected && styles.quickCallPillActive]}>
                  <Text style={[styles.quickCallText, isSelected && styles.quickCallTextActive]}>
                    Xem hồ sơ & Gọi thợ
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={isSelected ? '#FFFFFF' : '#0284C7'}
                  />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        /* Khối Empty State trang nhã khi CSDL chưa có thợ online */
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="radio-outline" size={22} color="#94A3B8" />
          </View>
          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyTitle}>
              Hiện chưa có thợ nào đang trực tuyến quanh vị trí của bạn.
            </Text>
            <Text style={styles.emptySubtitle}>
              Vui lòng thử lại sau hoặc đặt lịch hẹn trước.
            </Text>
          </View>
        </View>
      )}

      {/* ── 4. Modal Bản Đồ Toàn Màn Hình ─────────────────────── */}
      <WorkerFullMapModal
        visible={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        workers={workers}
        userCoords={{
          latitude: currentLat,
          longitude: currentLng,
        }}
        userDistrict={userDistrict}
        selectedWorkerId={selectedWorkerId}
        onSelectWorker={(w) => {
          setSelectedWorkerId(w.id);
          onSelectWorker?.(w);
        }}
        onBookWorker={(w) => {
          onSelectWorker?.(w);
        }}
      />
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
  emptyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginRight: 4,
  },
  emptyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  permNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  permNoticeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
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

  // Map Card (Height 180px)
  mapCard: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    zIndex: 15,
  },
  mapLoadingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },

  // Re-center GPS Button
  recenterBtn: {
    position: 'absolute',
    right: 12,
    bottom: 48,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 12,
  },

  noWorkersMapBanner: {
    position: 'absolute',
    bottom: 48,
    left: 12,
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 8,
  },
  noWorkersMapBannerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomPillContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 12,
  },
  mapDetailsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 38,
  },
  mapDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Peeking Card List (Horizontal Scroll)
  workersScrollContent: {
    gap: CARD_GAP,
    paddingRight: 20,
    paddingVertical: 4,
  },
  workerDetailCard: {
    width: CARD_WIDTH,
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
  workerDetailCardSelected: {
    borderColor: '#0284C7',
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
    shadowColor: '#0284C7',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
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
  quickCallPillActive: {
    backgroundColor: '#0284C7',
  },
  quickCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  quickCallTextActive: {
    color: '#FFFFFF',
  },

  // ── Khối Empty State Trang Nhã ────────────────────────────
  emptyStateCard: {
    minHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTextCol: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    lineHeight: 18,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  pressedEffect: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
