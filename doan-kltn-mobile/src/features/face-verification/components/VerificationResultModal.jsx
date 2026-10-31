import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const VerificationResultModal = ({ visible, result, onClose, onRetry }) => {
  if (!result) return null;
  const isSuccess = result.verified;
  const confidencePercent = (Number(result.confidence || 0) * 100).toFixed(1);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, isSuccess ? styles.successBg : styles.failBg]}>
            <Ionicons
              name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={56}
              color={isSuccess ? '#16A34A' : '#DC2626'}
            />
          </View>
          <Text style={styles.title}>
            {isSuccess ? 'Xác thực thành công' : 'Chưa khớp khuôn mặt'}
          </Text>
          <Text style={styles.scoreText}>
            Độ khớp sinh trắc học: <Text style={styles.boldScore}>{confidencePercent}%</Text>
          </Text>
          <Text style={styles.message}>
            {result.message || (isSuccess ? 'Đạt chuẩn nhận diện an toàn' : 'Vui lòng chụp lại rõ nét hơn')}
          </Text>
          <View style={styles.btnRow}>
            {isSuccess ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
                <Text style={styles.btnPrimaryText}>Bắt đầu làm việc</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnRetry} onPress={onRetry}>
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
