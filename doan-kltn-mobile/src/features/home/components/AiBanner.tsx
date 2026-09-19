/**
 * @file AiBanner.tsx
 * @description Hero Banner Chẩn đoán sự cố tự động bằng AI (Primary Hero CTA của màn hình).
 * Nâng cấp vi tương tác 4 tầng:
 * 1. Phản hồi vật lý khi chạm (Press Feedback co giãn lò xo 0.96 -> 1.0)
 * 2. Rung phản hồi xúc giác Haptics Medium Impact
 * 3. Viền thở phát sáng tinh tế (Subtle Breathing Glow Border 1800ms)
 * 4. Nảy nhẹ icon Camera khi xuất hiện (Icon Mount Bounce)
 * Kết hợp vệt sáng phản chiếu (Shimmer Sweep) và ngôi sao AI lấp lánh (Twinkling Sparkle).
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AiBannerProps {
  onScanPress: () => void;
}

const isNative = Platform.OS !== 'web';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Component `AiBanner`
 */
export default function AiBanner({ onScanPress }: AiBannerProps) {
  // ── 1. Quản lý các Animated Values ──────────────────────────────────────
  // Tầng 1: Phản hồi vật lý khi nhấn (Press Feedback)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Tầng 3: Viền thở phát sáng tinh tế (Subtle Breathing Glow Border)
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Tầng 4: Nảy nhẹ Icon Camera khi mount (Icon Mount Bounce)
  const cameraScale = useRef(new Animated.Value(0.8)).current;

  // Vệt sáng phản chiếu quét qua nút (Shimmer Sweep)
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Ngôi sao AI lấp lánh (Twinkling Sparkle)
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // ── 2. Thiết lập Hoạt ảnh & Vòng lặp Micro-interactions ─────────────────
  useEffect(() => {
    let isMounted = true;
    let shimmerTimerId: ReturnType<typeof setTimeout>;

    // Tầng 3: Vòng lặp nhịp thở viền sáng êm ái (chu kỳ 1800ms, useNativeDriver: false)
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    breathing.start();

    // Tầng 4: Nảy nhẹ icon Camera khi xuất hiện (mount bounce 1 lần duy nhất)
    Animated.spring(cameraScale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: isNative,
    }).start();

    // Hiệu ứng Vệt sáng phản chiếu (Shimmer Beam) lướt qua trong 900ms rồi nghỉ 2.8s
    const runShimmer = () => {
      if (!isMounted) return;
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: isNative,
      }).start(() => {
        if (isMounted) {
          shimmerTimerId = setTimeout(runShimmer, 2800);
        }
      });
    };
    runShimmer();

    // Ngôi sao AI xoay nhẹ & nhấp nháy độ sáng (1.6s loop)
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: isNative,
        }),
      ])
    );
    sparkleLoop.start();

    return () => {
      isMounted = false;
      clearTimeout(shimmerTimerId);
      breathing.stop();
      sparkleLoop.stop();
    };
  }, [glowAnim, cameraScale, shimmerAnim, sparkleAnim]);

  // ── 3. Tầng 1: Handlers phản hồi vật lý khi chạm ────────────────────────
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      speed: 50,
      bounciness: 0,
      useNativeDriver: isNative,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: isNative,
    }).start();
  };

  // ── 4. Tầng 2: Rung phản hồi xúc giác (Haptic Feedback) & Kích hoạt ──────
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onScanPress();
  };

  // ── 5. Interpolations ───────────────────────────────────────────────────
  // Tầng 3: Biến thiên màu viền thở phát sáng
  const animatedBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(56, 189, 248, 0.15)', 'rgba(56, 189, 248, 0.50)'],
  });

  // Vệt sáng phản chiếu quét qua nút
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 240],
  });

  // Ngôi sao AI lấp lánh (Scale & Rotate)
  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.25],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-10deg', '15deg', '-10deg'],
  });

  return (
    <LinearGradient
      colors={['#082F49', '#0C4A6E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
    >
      {/* ── 1. Header Section ─────────────────────────────────── */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <View style={styles.sparkleCircle}>
            <Ionicons name="sparkles" size={14} color="#38BDF8" />
          </View>
          <Text style={styles.title}>Chẩn đoán sự cố bằng AI</Text>
        </View>

        <Text style={styles.subtitle}>
          Chụp ảnh để AI phân tích lỗi & báo giá tức thì. Thợ nhận việc ngay sau 15 phút.
        </Text>
      </View>

      {/* ── 2. Primary CTA: Nút Chụp ảnh ngay 4 tầng hiệu ứng ─── */}
      <View style={styles.actionRow}>
        <AnimatedPressable
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Chụp ảnh ngay để chẩn đoán sự cố"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={[
            styles.primaryCtaButton,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: animatedBorderColor,
            },
          ]}
        >
          {/* Vệt sáng phản chiếu quét qua nút (Shimmer Beam) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmerBeam,
              {
                transform: [{ translateX: shimmerTranslateX }, { rotate: '-25deg' }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.75)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Tầng 4: Animated Camera Icon (Mount Bounce) */}
          <Animated.View style={[styles.cameraIconWrap, { transform: [{ scale: cameraScale }] }]}>
            <Ionicons name="camera" size={17} color="#0284C7" />
          </Animated.View>

          {/* Text CTA */}
          <Text style={styles.primaryCtaText}>Chụp ảnh ngay</Text>

          {/* Ngôi sao AI lấp lánh */}
          <Animated.View
            style={[
              styles.sparkleIconWrap,
              {
                transform: [
                  { scale: sparkleScale },
                  { rotate: sparkleRotate },
                ],
              },
            ]}
          >
            <Ionicons name="sparkles" size={13} color="#0284C7" />
          </Animated.View>

          {/* Mũi tên điều hướng */}
          <Ionicons name="arrow-forward" size={13} color="#0284C7" style={{ marginLeft: 2 }} />
        </AnimatedPressable>

        {/* Badge AI SCAN 2.0 Công nghệ cao */}
        <View style={styles.aiScanBadge}>
          <Ionicons name="scan-outline" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
          <Text style={styles.aiScanBadgeText}>AI SCAN 2.0</Text>
        </View>
      </View>

      {/* ── 3. Dải quy trình 3 bước trực quan thanh mảnh ──────── */}
      <View style={styles.stepsContainer}>
        {/* Bước 1 */}
        <View style={styles.stepBox}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>1</Text>
          </View>
          <Text style={styles.stepLabelText}>Chụp sự cố</Text>
        </View>

        <Ionicons name="arrow-forward" size={11} color="rgba(56, 189, 248, 0.45)" />

        {/* Bước 2 */}
        <View style={styles.stepBox}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>2</Text>
          </View>
          <Text style={styles.stepLabelText}>Báo giá tức thì</Text>
        </View>

        <Ionicons name="arrow-forward" size={11} color="rgba(56, 189, 248, 0.45)" />

        {/* Bước 3 */}
        <View style={styles.stepBox}>
          <View style={styles.stepNumBadge}>
            <Text style={styles.stepNumText}>3</Text>
          </View>
          <Text style={styles.stepLabelText}>Thợ đến 15p</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.20)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#082F49',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    gap: 12,
  },
  headerSection: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#BAE6FD',
    lineHeight: 17,
  },

  // Primary CTA Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryCtaButton: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  shimmerBeam: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 50,
    zIndex: 5,
  },
  cameraIconWrap: {
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginRight: 4,
  },
  sparkleIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  aiScanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
  },
  aiScanBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },

  // 3 Steps
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  stepNumText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38BDF8',
  },
  stepLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E0F2FE',
  },
});
