import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChnachScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: Chọn Địa chỉ</Text>
      <Text style={styles.subtitle}>Chọn vị trí trên bản đồ / địa chỉ đã lưu</Text>
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
