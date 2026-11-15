import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Briefcase, ArrowUpRight } from "lucide-react-native";
export const C = {
  bg: "#F5F7F8",
  paper: "#FFFFFF",
  ink: "#172D32",
  muted: "#74858A",
  green: "#087F68",
  mint: "#E5F5EF",
  line: "#E5EBEC",
  navy: "#123D36",
  amber: "#AF701A",
};
export const money = (n) =>
  Number.isFinite(Number(n)) ? `${Number(n).toLocaleString("vi-VN")} đ` : "—";
export const orderStatus = {
  MATCHED: "Đã nhận việc",
  ASSIGNED: "Đã phân công",
  WORKER_EN_ROUTE: "Đang di chuyển",
  WORKER_ARRIVING: "Đang di chuyển",
  ARRIVED: "Đã đến nơi",
  IN_PROGRESS: "Đang thực hiện",
  AWAITING_ACCEPTANCE: "Chờ nghiệm thu",
  AWAITING_CONFIRMATION: "Chờ xác nhận",
  AWAITING_PAYMENT: "Chờ thanh toán",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  DISPUTED: "Cần hỗ trợ",
  SEARCHING_WORKER: "Đang tìm thợ",
};
export function Page({ children, refreshing = false, onRefresh, nativeID }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      nativeID={nativeID}
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 22,
        paddingTop: insets.top + 18,
        paddingBottom: 32,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.green}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
export function Heading({ eyebrow = "FIXGO PARTNER", title, subtitle, right }) {
  return (
    <View style={u.heading}>
      <View style={{ flex: 1, gap: 7 }}>
        <Text style={u.eyebrow}>{eyebrow}</Text>
        <Text accessibilityRole="header" style={u.title}>
          {title}
        </Text>
        {subtitle ? <Text style={u.body}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
export function Card({ children, style, nativeID }) {
  return (
    <View nativeID={nativeID} style={[u.card, style]}>
      {children}
    </View>
  );
}
export function Badge({ children, tone = "green" }) {
  return (
    <View
      style={[
        u.badge,
        { backgroundColor: tone === "green" ? C.mint : "#FFF3DE" },
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: tone === "green" ? C.green : C.amber,
        }}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: tone === "green" ? C.green : C.amber,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Section({ title, action, onPress }) {
  return (
    <View style={u.heading}>
      <Text style={u.section}>{title}</Text>
      {action ? (
        <TouchableOpacity accessibilityRole="button" onPress={onPress}>
          <Text style={{ color: C.green, fontSize: 12, fontWeight: "700" }}>
            {action}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        u.button,
        secondary && { backgroundColor: C.mint },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text
        style={{
          fontWeight: "700",
          color: secondary ? C.green : "#FFFFFF",
          fontSize: 14,
        }}
      >
        {children}
      </Text>
      <ArrowUpRight size={17} color={secondary ? C.green : "#FFFFFF"} />
    </TouchableOpacity>
  );
}
export function Row({
  icon: Icon = Briefcase,
  title,
  subtitle,
  onPress,
  tail,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={u.row}
    >
      <View style={u.icon}>
        <Icon size={21} color={C.green} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={u.rowTitle}>{title}</Text>
        {subtitle ? <Text style={u.body}>{subtitle}</Text> : null}
      </View>
      {tail || <ChevronRight size={18} color={C.muted} />}
    </TouchableOpacity>
  );
}
export function Empty({
  icon: Icon = Briefcase,
  title,
  description,
  action,
  onPress,
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 32, gap: 13 }}>
      <View style={[u.icon, { width: 64, height: 64, borderRadius: 22 }]}>
        <Icon size={28} color={C.green} />
      </View>
      <Text style={[u.section, { textAlign: "center" }]}>{title}</Text>
      <Text style={[u.body, { textAlign: "center", maxWidth: 280 }]}>
        {description}
      </Text>
      {action ? (
        <Button onPress={onPress} secondary>
          {action}
        </Button>
      ) : null}
    </Card>
  );
}
export function LoadingCards() {
  return (
    <View accessibilityLabel="Đang tải dữ liệu" style={{ gap: 14 }}>
      {[0, 1, 2].map((n) => (
        <View key={n} style={[u.card, { gap: 12 }]}>
          <View
            style={{
              width: "45%",
              height: 14,
              borderRadius: 5,
              backgroundColor: C.line,
            }}
          />
          <View
            style={{
              width: "80%",
              height: 10,
              borderRadius: 5,
              backgroundColor: "#F0F3F4",
            }}
          />
        </View>
      ))}
    </View>
  );
}
export function OrderRow({ order, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[u.card, { gap: 14 }]}
    >
      <View style={u.heading}>
        <Text style={u.eyebrow}>#{order.id.slice(-6).toUpperCase()}</Text>
        <Badge tone={order.status === "CANCELLED" ? "amber" : "green"}>
          {orderStatus[order.status] || order.status}
        </Badge>
      </View>
      <View style={u.heading}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={u.section}>
            {order.service?.name || order.category?.name || "Dịch vụ tại nhà"}
          </Text>
          <Text numberOfLines={2} style={u.body}>
            {order.addressText || "Xem địa chỉ trong chi tiết đơn"}
          </Text>
        </View>
        <ChevronRight size={20} color={C.green} />
      </View>
      <Text style={{ fontWeight: "700", color: C.green, fontSize: 18 }}>
        {money(order.finalPrice ?? order.estimatedPrice)}
      </Text>
    </TouchableOpacity>
  );
}
export const u = StyleSheet.create({
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.7,
    fontWeight: "800",
    color: C.muted,
  },
  title: { fontSize: 29, fontWeight: "800", letterSpacing: -0.8, color: C.ink },
  body: { fontSize: 13, lineHeight: 20, color: C.muted },
  section: {
    fontSize: 17,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: C.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.line,
    padding: 20,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  icon: {
    height: 44,
    width: 44,
    borderRadius: 15,
    backgroundColor: C.mint,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "600", color: C.ink },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: C.green,
    borderRadius: 15,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
