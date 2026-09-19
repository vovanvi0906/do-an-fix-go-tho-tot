import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ThngboThScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Màn hình: Thông báo Thợ</Text>
      <Text style={styles.subtitle}>Thông báo đơn mới, thưởng và hệ thống</Text>
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
