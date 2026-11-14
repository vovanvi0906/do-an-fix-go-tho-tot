import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const VerificationResultModal = ({ visible, result, onClose, onRetry }) => {
  if (!result) return null;
  const isSuccess = result.verified === true || result.enrolled === true;
  const cosine = Number.isFinite(result.identityScore) ? result.identityScore.toFixed(3) : null;

  return (
    <Modal nativeID="face-result-modal" visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View nativeID="face-result-overlay" style={styles.overlay}>
        <View nativeID="face-result-card" style={styles.card}>
          <View style={[styles.iconCircle, isSuccess ? styles.successBg : styles.failBg]}>
            <Ionicons
              name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={56}
              color={isSuccess ? '#16A34A' : '#DC2626'}
            />
          </View>
          <Text nativeID="face-result-title" accessibilityRole="header" style={styles.title}>
            {result.enrolled ? 'Đăng ký khuôn mặt đã được lưu' : isSuccess ? 'Xác thực thành công' : 'Chưa xác thực được'}
          </Text>
          {cosine !== null ? <Text style={styles.scoreText}>
            Điểm tương đồng cosine: <Text style={styles.boldScore}>{cosine}</Text>
          </Text> : null}
          <Text nativeID="face-result-message" accessibilityLiveRegion="polite" style={styles.message}>
            {result.message || (isSuccess ? 'Máy chủ đã xác nhận bằng chứng xác thực' : 'Vui lòng chụp lại rõ nét hơn')}
          </Text>
          <View style={styles.btnRow}>
            {isSuccess ? (
              <TouchableOpacity nativeID="face-result-close" accessibilityRole="button" style={styles.btnPrimary} onPress={onClose}>
                <Text style={styles.btnPrimaryText}>Quay lại</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity nativeID="face-result-retry" accessibilityRole="button" style={styles.btnRetry} onPress={onRetry}>
                <Text style={styles.btnPrimaryText}>Thử lại</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successBg: { backgroundColor: '#DCFCE7' },
  failBg: { backgroundColor: '#FEE2E2' },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  scoreText: { fontSize: 15, color: '#475569', marginBottom: 6 },
  boldScore: { fontWeight: '700', color: '#2563EB' },
  message: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  btnRow: { width: '100%' },
  btnPrimary: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnRetry: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
