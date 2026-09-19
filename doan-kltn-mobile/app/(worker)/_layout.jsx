import React from 'react';
import { Stack } from 'expo-router';

export default function WorkerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ headerShown: true, title: 'Chi tiết việc làm' }} />
      <Stack.Screen name="verification/face" options={{ headerShown: true, title: 'Xác thực khuôn mặt AI' }} />
    </Stack>
  );
}
