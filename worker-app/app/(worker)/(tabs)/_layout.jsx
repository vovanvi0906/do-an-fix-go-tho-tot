import React from 'react';
import { Tabs } from 'expo-router';
import { Pressable } from 'react-native';

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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bàn làm việc',
          tabBarLabel: 'Trực tuyến',
          tabBarButton: (props) => <Pressable {...props} nativeID="worker-bottom-tab-workbench" />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Nhận việc',
          tabBarLabel: 'Việc mới',
          tabBarButton: (props) => <Pressable {...props} nativeID="worker-bottom-tab-jobs" />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Thu nhập',
          tabBarLabel: 'Thu nhập',
          tabBarButton: (props) => <Pressable {...props} nativeID="worker-bottom-tab-earnings" />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarLabel: 'Thông báo',
          tabBarButton: (props) => <Pressable {...props} nativeID="worker-bottom-tab-notifications" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ Thợ',
          tabBarLabel: 'Cá nhân',
          tabBarButton: (props) => <Pressable {...props} nativeID="worker-bottom-tab-profile" />,
        }}
      />
    </Tabs>
  );
}
