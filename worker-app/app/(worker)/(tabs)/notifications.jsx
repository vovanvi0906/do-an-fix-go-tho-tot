import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Bell, ChevronRight, CheckCircle, Clock } from "lucide-react-native";
import {
  Page,
  Heading,
  Card,
  Empty,
  LoadingCards,
  orderStatus,
  C,
  u,
} from "../../../src/features/workbench/WorkerUI";
import { useWorkerOrders } from "../../../src/features/workbench/useWorkerOrders";
export default function WorkerNotificationsScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useWorkerOrders({ limit: 10 });
  const updates = [...(data?.data || [])].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return (
    <Page
      nativeID="worker-notifications-screen"
      refreshing={loading}
      onRefresh={reload}
    >
      <Heading
        eyebrow="LUÔN ĐỒNG HÀNH"
        title="Hộp cập nhật"
        subtitle="Những thay đổi quan trọng từ công việc của bạn."
        right={
          <View style={u.icon}>
            <Bell size={23} color={C.green} />
          </View>
        }
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: C.green,
          }}
        />
        <Text style={u.body}>Trạng thái từ 10 công việc gần nhất</Text>
      </View>
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <Empty
          icon={Bell}
          title="Chưa tải được cập nhật"
          description={error}
          action="Thử lại"
          onPress={reload}
        />
      ) : !updates.length ? (
        <Empty
          icon={Bell}
          title="Bạn đã xem hết cập nhật"
          description="Khi có công việc, trạng thái mới nhất sẽ được tổng hợp tại đây."
        />
      ) : (
        <Card style={{ paddingVertical: 5 }}>
          {updates.map((o, i) => (
            <TouchableOpacity
              key={o.id}
              accessibilityRole="button"
              onPress={() => router.push(`/(worker)/job/${o.id}`)}
              style={{
                paddingVertical: 20,
                flexDirection: "row",
                gap: 14,
                alignItems: "flex-start",
                borderBottomWidth: i < updates.length - 1 ? 1 : 0,
                borderBottomColor: C.line,
              }}
            >
              <View style={u.icon}>
                {o.status === "COMPLETED" ? (
                  <CheckCircle size={21} color={C.green} />
                ) : (
                  <Clock size={21} color={C.green} />
                )}
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={u.rowTitle}>
                  {orderStatus[o.status] || "Công việc được cập nhật"}
                </Text>
                <Text style={u.body}>
                  {o.service?.name || o.category?.name || "Dịch vụ tại nhà"} · #
                  {o.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted }}>
                  {o.updatedAt
                    ? new Date(o.updatedAt).toLocaleString("vi-VN")
                    : ""}
                </Text>
              </View>
              <ChevronRight size={17} color={C.muted} />
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </Page>
  );
}
