import React from 'react';
import { Stack, Redirect } from 'expo-router';

import { useAuth } from '../../src/features/auth';

export default function WorkerLayout() {
  const { isLoading, isAuthenticated, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || user?.role?.toUpperCase() !== 'WORKER') {
    return <Redirect href="/(auth)/login-worker" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ headerShown: true, title: 'Chi tiết việc làm' }} />
      <Stack.Screen name="verification/face" options={{ headerShown: true, title: 'Xác thực khuôn mặt AI' }} />
    </Stack>
  );
}
