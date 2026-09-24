/**
 * MatchingRadarView — Uber-style pulse radar for worker matching
 * Full-screen overlay with concentric pulse rings, countdown timer, and cancel button
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RADAR_SIZE = SCREEN_WIDTH * 0.65;

export default function MatchingRadarView({
  remainingSeconds,
  serviceName,
  address,
  onCancel,
}) {
  // ─── Pulse Animations ──────────────────────────────────────────────
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const centerPulse = useRef(new Animated.Value(1)).current;
  const dotRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Concentric ring pulses with staggered delays
    const createPulseAnimation = (animValue, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    // Center dot breathing
    const centerBreath = Animated.loop(
      Animated.sequence([
        Animated.timing(centerPulse, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(centerPulse, {
          toValue: 0.9,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Rotating scan line
    const rotation = Animated.loop(
      Animated.timing(dotRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const p1 = createPulseAnimation(pulse1, 0);
    const p2 = createPulseAnimation(pulse2, 800);
    const p3 = createPulseAnimation(pulse3, 1600);

    p1.start();
    p2.start();
    p3.start();
    centerBreath.start();
    rotation.start();

    return () => {
      p1.stop();
      p2.stop();
      p3.stop();
      centerBreath.stop();
      rotation.stop();
    };
  }, []);

  // ─── Format countdown ──────────────────────────────────────────────
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const progress = remainingSeconds / 120;

  // Interpolations
  const makePulseStyle = (animValue) => ({
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  const rotateInterpolation = dotRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <View style={styles.bgOverlay} />

      {/* Top status */}
      <View style={styles.topSection}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Đang tìm thợ</Text>
        </View>
      </View>

      {/* Radar area */}
      <View style={styles.radarContainer}>
        {/* Pulse rings */}
        <Animated.View
          style={[
            styles.pulseRing,
            { width: RADAR_SIZE, height: RADAR_SIZE, borderRadius: RADAR_SIZE / 2 },
            makePulseStyle(pulse1),
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            { width: RADAR_SIZE * 0.75, height: RADAR_SIZE * 0.75, borderRadius: (RADAR_SIZE * 0.75) / 2 },
            makePulseStyle(pulse2),
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            { width: RADAR_SIZE * 0.5, height: RADAR_SIZE * 0.5, borderRadius: (RADAR_SIZE * 0.5) / 2 },
            makePulseStyle(pulse3),
          ]}
        />

        {/* Rotating scan line */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              width: RADAR_SIZE,
              height: RADAR_SIZE,
              borderRadius: RADAR_SIZE / 2,
              transform: [{ rotate: rotateInterpolation }],
            },
          ]}
        >
          <View style={styles.scanDot} />
        </Animated.View>

        {/* Center icon */}
        <Animated.View
          style={[
            styles.centerDot,
            { transform: [{ scale: centerPulse }] },
          ]}
        >
          <Ionicons name="search" size={28} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Countdown & Info */}
      <View style={styles.infoSection}>
        <Text style={styles.countdownText}>{timeDisplay}</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.searchingTitle}>Đang quét tìm thợ gần bạn...</Text>
        <Text style={styles.searchingSub}>
          Hệ thống đang phát tín hiệu tới các thợ trong bán kính 5km
        </Text>

        {/* Order details card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="construct-outline" size={16} color="#0F172A" />
            <Text style={styles.detailText} numberOfLines={1}>{serviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#0F172A" />
            <Text style={styles.detailText} numberOfLines={1}>{address}</Text>
          </View>
        </View>
      </View>

      {/* Cancel button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Hủy tìm kiếm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  // ─── Top ─────────────────────────────────────────────────────────
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  // ─── Radar ───────────────────────────────────────────────────────
  radarContainer: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  scanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
    marginTop: -5,
  },
  centerDot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  // ─── Info ────────────────────────────────────────────────────────
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  countdownText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    width: '60%',
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  searchingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  searchingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  // ─── Bottom ──────────────────────────────────────────────────────
  bottomSection: {
    width: '100%',
    paddingHorizontal: 24,
  },
  cancelBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
});
