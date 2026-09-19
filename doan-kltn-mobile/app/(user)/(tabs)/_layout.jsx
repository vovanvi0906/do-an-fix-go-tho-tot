import React from 'react';
import { Tabs } from 'expo-router';

export default function UserTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarLabel: 'Khám phá' }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn của tôi', tabBarLabel: 'Hoạt động' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarLabel: 'Thông báo' }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarLabel: 'Tài khoản' }} />
    </Tabs>
  );
}
