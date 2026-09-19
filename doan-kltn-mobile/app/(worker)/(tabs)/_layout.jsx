import React from 'react';
import { Tabs } from 'expo-router';

export default function WorkerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bàn làm việc', tabBarLabel: 'Trực tuyến' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Nhận việc', tabBarLabel: 'Việc mới' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Thu nhập', tabBarLabel: 'Thu nhập' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarLabel: 'Thông báo' }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ Thợ', tabBarLabel: 'Cá nhân' }} />
    </Tabs>
  );
}
