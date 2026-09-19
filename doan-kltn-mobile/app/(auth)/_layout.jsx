import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0F172A',
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false, title: 'Đăng nhập' }} />
      <Stack.Screen name="register" options={{ title: 'Đăng ký tài khoản' }} />
      <Stack.Screen name="register-customer" options={{ title: 'Đăng ký Khách hàng' }} />
      <Stack.Screen name="register-worker" options={{ title: 'Đăng ký Thợ' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Quên mật khẩu' }} />
    </Stack>
  );
}
