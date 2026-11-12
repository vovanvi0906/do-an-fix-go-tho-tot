/**
 * @file ErrorState.tsx
 * @description Component thông báo lỗi thân thiện kèm nút Thử lại cho React Native FixGo.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

/**
 * Component `ErrorState`
 */
export default function ErrorState({
  message = 'Không thể kết nối đến máy chủ FixGo. Vui lòng kiểm tra lại đường truyền.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
      </View>
      <Text style={styles.title}>Đã có lỗi xảy ra</Text>
      <Text style={styles.description}>{message}</Text>
      <Pressable
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Thử lại kết nối"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
        onPress={onRetry}
      >
        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.retryText}>Thử lại ngay</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF1F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#BE123C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#E11D48',
  },
  retryBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
