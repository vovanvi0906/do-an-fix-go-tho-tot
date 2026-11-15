import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ScanLine, ArrowRight, RefreshCw } from "lucide-react-native";
import { faceSummary } from "../utils/faceStatus";

export function FaceIdentityCard({
  status,
  profile,
  loading,
  error,
  onOpen,
  onRefresh,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  const summary = faceSummary(status, profile, now);
  const valid = summary.valid;
  return (
    <View nativeID="worker-profile-face-card" style={s.card}>
      <View nativeID="worker-profile-face-heading" style={s.heading}>
        <View style={s.icon}>
          <ScanLine size={25} color="#087F68" />
        </View>
        <View style={s.grow}>
          <Text nativeID="worker-profile-face-title" style={s.title}>
            Xác thực khuôn mặt
          </Text>
          <Text style={s.subtitle}>Đăng ký một lần · xác thực từng đơn</Text>
        </View>
      </View>
      {loading ? (
        <View
          nativeID="worker-profile-face-skeleton"
          accessibilityLabel="Đang tải FaceID"
        >
          <View style={s.skeleton} />
          <View style={[s.skeleton, { width: "65%" }]} />
        </View>
      ) : (
        <>
          <Text
            nativeID="worker-profile-face-status"
            style={[s.status, valid && s.success]}
          >
            {summary.title}
          </Text>
          <Text style={s.message}>{error || summary.message}</Text>
          {status?.templateVersion && (
            <Text style={s.caption}>Mẫu khuôn mặt đã được lưu an toàn</Text>
          )}
        </>
      )}
      <View nativeID="worker-profile-face-actions" style={s.actions}>
        <TouchableOpacity
          nativeID="worker-profile-face-open"
          accessibilityRole="button"
          disabled={loading}
          onPress={() => (status ? onOpen(summary.mode) : onRefresh())}
          style={[s.button, loading && s.disabled]}
        >
          <Text style={s.buttonText}>{summary.action}</Text>
          <ArrowRight size={17} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          nativeID="worker-profile-face-refresh"
          accessibilityRole="button"
          accessibilityLabel="Tải lại trạng thái FaceID"
          disabled={loading}
          onPress={onRefresh}
          style={s.refresh}
        >
          <RefreshCw size={19} color="#087F68" />
        </TouchableOpacity>
      </View>
      <Text style={s.caption}>
        Xác thực trước từng công việc được kiểm tra riêng tại màn đơn hàng.
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EBEC",
    gap: 14,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 13 },
  grow: { flex: 1 },
  icon: {
    width: 50,
    height: 50,
    backgroundColor: "#E5F5EF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#172D32", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#74858A", fontSize: 12, marginTop: 4 },
  status: { color: "#AF701A", fontSize: 16, fontWeight: "600" },
  success: { color: "#087F68" },
  message: { color: "#74858A", fontSize: 13, lineHeight: 21 },
  expiry: { color: "#087F68", fontSize: 12 },
  caption: { color: "#74858A", fontSize: 11, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    minHeight: 46,
    backgroundColor: "#087F68",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  refresh: {
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5EBEC",
  },
  disabled: { opacity: 0.5 },
  skeleton: {
    height: 18,
    borderRadius: 6,
    backgroundColor: "#E5EBEC",
    marginVertical: 6,
  },
});
