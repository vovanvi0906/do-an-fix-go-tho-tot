import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ThngboKhchhngScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: Thông báo Khách hàng</Text>
      <Text style={styles.subtitle}>Cập nhật trạng thái đơn hàng & khuyến mãi</Text>
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
