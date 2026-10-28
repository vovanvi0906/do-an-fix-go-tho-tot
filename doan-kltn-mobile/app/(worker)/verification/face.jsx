import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BiometricOvalFrame,
  VerificationResultModal,
  useFaceVerification,
} from '../../../src/features/face-verification';

export default function FaceVerificationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const {
    imageUri,
    isAnalyzing,
    result,
    showModal,
    takeSelfie,
    pickImage,
    verify,
    reset,
  } = useFaceVerification(orderId, () => {
    // Có thể chuyển về ca làm việc sau khi modal đóng
  });

  const handleFinish = () => {
    reset();
    if (orderId) {
      router.replace(`/job/${orderId}`);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Xác thực khuôn mặt AI</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.subtitle}>
        Vui lòng chụp ảnh selfie trực diện để đối chiếu sinh trắc học với ảnh thẻ/avatar.
      </Text>
      <View style={styles.frameContainer}>
        <BiometricOvalFrame imageUri={imageUri} isAnalyzing={isAnalyzing} />
      </View>
      <View style={styles.actionContainer}>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={takeSelfie} disabled={isAnalyzing}>
            <Ionicons name="camera" size={20} color="#2563EB" />
            <Text style={styles.btnSecondaryText}>Chụp ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickImage} disabled={isAnalyzing}>
            <Ionicons name="images" size={20} color="#2563EB" />
            <Text style={styles.btnSecondaryText}>Chọn ảnh</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.btnPrimary, (!imageUri || isAnalyzing) && styles.btnDisabled]}
          onPress={verify}
          disabled={!imageUri || isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnPrimaryText}>Xác thực sinh trắc học</Text>
          )}
        </TouchableOpacity>
      </View>
      <VerificationResultModal
        visible={showModal}
        result={result}
        onClose={handleFinish}
        onRetry={reset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20 },
  frameContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  actionContainer: { marginTop: 'auto', marginBottom: 32 },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  btnSecondaryText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  btnPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#94A3B8' },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
