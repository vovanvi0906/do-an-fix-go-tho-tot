import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../src/features/auth';

export default function UserLayout() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== 'CUSTOMER') {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  if (!isAuthenticated || user?.role !== 'CUSTOMER') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit-field" options={{ headerShown: false }} />
      <Stack.Screen name="profile/wallet" options={{ headerShown: false }} />
      <Stack.Screen name="profile/vouchers" options={{ headerShown: false }} />
      <Stack.Screen name="booking/index" options={{ headerShown: true, title: 'Đặt dịch vụ' }} />
      <Stack.Screen name="booking/select-service" options={{ headerShown: true, title: 'Chọn dịch vụ' }} />
      <Stack.Screen name="booking/address" options={{ headerShown: true, title: 'Địa chỉ nhận việc' }} />
      <Stack.Screen name="booking/confirm" options={{ headerShown: true, title: 'Xác nhận đặt lịch' }} />
      <Stack.Screen name="booking/create-booking" options={{ headerShown: false, title: 'Đặt đơn dịch vụ' }} />
      <Stack.Screen name="price-list" options={{ headerShown: false, title: 'Bảng giá dịch vụ' }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false, title: 'Chi tiết đơn hàng' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
