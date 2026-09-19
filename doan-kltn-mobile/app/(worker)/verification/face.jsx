import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function XcthcKhunmtFaceVerificationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: Xác thực Khuôn mặt (Face Verification)</Text>
      <Text style={styles.subtitle}>Chụp ảnh khuôn mặt và đối chiếu AI trước khi bắt đầu ca làm việc</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
