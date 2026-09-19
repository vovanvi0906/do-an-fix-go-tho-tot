/**
 * @file AiBanner.tsx
 * @description Hero Banner "Nhà bạn gặp sự cố? Chụp ảnh để AI chẩn đoán & báo giá".
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AiBannerProps {
  onScanPress: () => void;
}

/**
 * Component `AiBanner`
 */
export default function AiBanner({ onScanPress }: AiBannerProps) {
  return (
    <LinearGradient
      colors={['#2563EB', '#4F46E5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
    >
      {/* Top: AI Scan Glow Badge */}
      <View style={styles.topBadgeRow}>
        <View style={styles.aiScanBadge}>
          <Ionicons name="sparkles" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
          <Text style={styles.aiScanText}>AI SCAN 2.0</Text>
        </View>
        <Text style={styles.freeBadge}>Miễn phí</Text>
      </View>

      {/* Main Content */}
      <View style={styles.contentGroup}>
        <Text style={styles.title}>Nhà bạn gặp sự cố?</Text>
        <Text style={styles.subtitle}>
          Chụp ảnh để AI chẩn đoán nguyên nhân & ước tính báo giá tức thì.
        </Text>
      </View>

      {/* Action Button: White pill with Blue text & Camera icon */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={onScanPress}
        >
          <Ionicons name="camera" size={16} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.actionButtonText}>Chụp ảnh ngay</Text>
          <Ionicons name="arrow-forward" size={14} color="#2563EB" style={{ marginLeft: 4 }} />
        </Pressable>

        <Text style={styles.quickEstimateText}>Xử lý trong ~2s</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    padding: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 4,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiScanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  aiScanText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BAE6FD',
    letterSpacing: 0.5,
  },
  freeBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E0F2FE',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  contentGroup: {
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#E0F2FE',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  quickEstimateText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#BAE6FD',
  },
});
