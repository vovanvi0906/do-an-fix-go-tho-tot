import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from '../src/features/auth';
import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { initRemoteLogger } from '../src/utils/remoteLogger';

// Hoàn tất và dọn dẹp phiên đăng nhập WebBrowser ngay tại file root của app
WebBrowser.maybeCompleteAuthSession();

// Kích hoạt hệ thống lắng nghe crash toàn cầu ngay từ lúc khởi động app
initRemoteLogger();

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: '#111822' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(user)" options={{ headerShown: false }} />
          <Stack.Screen name="(worker)" options={{ headerShown: false }} />
          <Stack.Screen name="common/settings" options={{ presentation: 'modal', headerShown: true, title: 'Cài đặt' }} />
          <Stack.Screen name="common/help" options={{ presentation: 'modal', headerShown: true, title: 'Trợ giúp & Hỗ trợ' }} />
        </Stack>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
