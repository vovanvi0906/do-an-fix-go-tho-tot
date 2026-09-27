/**
 * WorkerFoundView — Full-screen view shown when a worker accepts the order
 * Uber-minimalist style: clean typography, subtle animations
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerFoundView({ worker, onTrackOrder }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Checkmark pop-in
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Content fade-in + slide-up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Success checkmark */}
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={40} color="#FFFFFF" />
      </Animated.View>

      <Animated.View
        style={[
          styles.contentArea,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>Đã tìm thấy thợ!</Text>
        <Text style={styles.subtitle}>Thợ đã xác nhận và đang di chuyển đến bạn</Text>

        {/* Worker card */}
        <View style={styles.workerCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color="#0F172A" />
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>
              {worker?.fullName || 'Thợ chuyên nghiệp FixGo'}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {worker?.ratingAvg || 4.8} · {worker?.completedOrders || 156} đơn hoàn thành
              </Text>
            </View>
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={13} color="#64748B" />
              <Text style={styles.phoneText}>{worker?.phone || '0987.xxx.xxx'}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={styles.trackBtn} onPress={onTrackOrder} activeOpacity={0.85}>
          <Text style={styles.trackBtnText}>Theo dõi trên bản đồ</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  contentArea: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },
  // ─── Worker card ──────────────────────────────────────────────────
  workerCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerInfo: {
    flex: 1,
    gap: 4,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: '#64748B',
  },
  // ─── CTA ──────────────────────────────────────────────────────────
  trackBtn: {
    width: '100%',
    flexDirection: 'row',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
