import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { faceSummary, faceExpiry } from "../utils/faceStatus";

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
          <Ionicons name="scan-outline" size={27} color="#6EE7B7" />
        </View>
        <View style={s.grow}>
          <Text nativeID="worker-profile-face-title" style={s.title}>
            Xác thực khuôn mặt
          </Text>
          <Text style={s.subtitle}>Đăng ký một lần · xác thực theo ca</Text>
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
          {valid && (
            <Text nativeID="worker-profile-face-expiry" style={s.expiry}>
              Hiệu lực đến {faceExpiry(status.dailyProof)}
            </Text>
          )}
          {status?.templateVersion && (
            <Text style={s.caption}>
              Mẫu đăng ký: phiên bản {status.templateVersion}
            </Text>
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
          <Ionicons name="arrow-forward" size={16} color="#09271C" />
        </TouchableOpacity>
        <TouchableOpacity
          nativeID="worker-profile-face-refresh"
          accessibilityRole="button"
          accessibilityLabel="Tải lại trạng thái FaceID"
          disabled={loading}
          onPress={onRefresh}
          style={s.refresh}
        >
          <Ionicons name="refresh-outline" size={19} color="#A3B8C8" />
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
    backgroundColor: "#101E28",
    borderWidth: 1,
    borderColor: "#254138",
    gap: 14,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 13 },
  grow: { flex: 1 },
  icon: {
    width: 50,
    height: 50,
    backgroundColor: "#14382D",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#EFF7F5", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#90A8AD", fontSize: 12, marginTop: 4 },
  status: { color: "#F0CE8C", fontSize: 16, fontWeight: "600" },
  success: { color: "#6EE7B7" },
  message: { color: "#B4C2CD", fontSize: 13, lineHeight: 21 },
  expiry: { color: "#6EE7B7", fontSize: 12 },
  caption: { color: "#8B9EAE", fontSize: 11, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    minHeight: 46,
    backgroundColor: "#6EE7B7",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
  },
  buttonText: { color: "#09271C", fontWeight: "700", fontSize: 13 },
  refresh: {
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#304454",
  },
  disabled: { opacity: 0.5 },
  skeleton: {
    height: 18,
    borderRadius: 6,
    backgroundColor: "#263C49",
    marginVertical: 6,
  },
});
