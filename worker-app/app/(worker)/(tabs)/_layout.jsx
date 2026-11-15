import React from "react";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Briefcase, Wallet, Bell, User } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
const screens = [
  ["index", "Bàn làm việc", "Trang chủ", Home, "workbench"],
  ["jobs", "Công việc", "Việc làm", Briefcase, "jobs"],
  ["earnings", "Thu nhập", "Thu nhập", Wallet, "earnings"],
  ["notifications", "Thông báo", "Thông báo", Bell, "notifications"],
  ["profile", "Hồ sơ", "Cá nhân", User, "profile"],
];
export default function WorkerTabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#087F68",
          tabBarInactiveTintColor: "#8C9A9D",
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 3 },
          tabBarItemStyle: { paddingTop: 9 },
          tabBarStyle: {
            height: 66 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5EBEC",
            elevation: 0,
          },
        }}
      >
        {screens.map(([name, title, label, Icon, id]) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarLabel: label,
              tabBarIcon: ({ color, focused }) => (
                <Icon
                  color={color}
                  size={22}
                  strokeWidth={focused ? 2.4 : 1.7}
                />
              ),
              tabBarButton: (props) => (
                <Pressable {...props} nativeID={`worker-bottom-tab-${id}`} />
              ),
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
