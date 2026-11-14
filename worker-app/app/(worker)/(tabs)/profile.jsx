import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/features/auth";
import { useWorkerFaceStatus } from "../../../src/features/face-verification/hooks/useWorkerFaceStatus";
import { FaceIdentityCard } from "../../../src/features/face-verification/components/FaceIdentityCard";
const APPROVAL = {
  APPROVED: "Hồ sơ đã duyệt",
  DRAFT: "Hồ sơ nháp",
  PENDING: "Đang chờ duyệt hồ sơ",
  REJECTED: "Cần bổ sung hồ sơ",
};
export default function WorkerProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { status, profile, loading, error, reload } = useWorkerFaceStatus();
  return (
    <ScrollView
      nativeID="worker-profile-screen"
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={reload}
          tintColor="#6EE7B7"
        />
      }
    >
      <View nativeID="worker-profile-identity" style={s.identity}>
        <View style={s.avatar}>
          <Ionicons name="person-outline" size={30} color="#6EE7B7" />
        </View>
        <Text
          nativeID="worker-profile-name"
          accessibilityRole="header"
          style={s.name}
        >
          {profile?.fullName || user?.fullName || user?.name || "Đối tác FixGo"}
        </Text>
        <Text style={s.contact}>
          {user?.phone || user?.email || "Tài khoản thợ"}
        </Text>
        <Text style={s.badge}>
          {loading
            ? "Đang tải hồ sơ…"
            : APPROVAL[profile?.approvalStatus] || "Chưa tải được hồ sơ"}
        </Text>
      </View>
      <FaceIdentityCard
        status={status}
        profile={profile}
        loading={loading}
        error={error}
        onRefresh={reload}
        onOpen={(mode) =>
          router.push({
            pathname: "/(worker)/verification/face",
            params: { mode },
          })
        }
      />
      <View nativeID="worker-profile-guidance" style={s.info}>
        <Text accessibilityRole="header" style={s.infoTitle}>
          Bắt đầu ca làm việc
        </Text>
        <Text style={s.infoText}>1. Hoàn thiện và duyệt hồ sơ danh tính.</Text>
        <Text style={s.infoText}>2. Đăng ký mẫu khuôn mặt một lần.</Text>
        <Text style={s.infoText}>
          3. Quét đầu ca khi bằng chứng hết hiệu lực.
        </Text>
        <Text style={s.infoText}>
          4. Xác thực riêng khi đã đến nơi thực hiện đơn.
        </Text>
      </View>
      <TouchableOpacity
        nativeID="worker-profile-support"
        accessibilityRole="button"
        style={s.support}
        onPress={() => router.push("/common/help")}
      >
        <Ionicons name="help-circle-outline" size={22} color="#ACC0CF" />
        <Text style={s.infoText}>Trợ giúp & hỗ trợ</Text>
        <Ionicons name="chevron-forward" size={18} color="#ACC0CF" />
      </TouchableOpacity>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090F17" },
  content: { padding: 20, gap: 22, paddingBottom: 40 },
  identity: { alignItems: "center", paddingVertical: 14, gap: 8 },
  avatar: {
    height: 72,
    width: 72,
    borderRadius: 24,
    backgroundColor: "#16322B",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: "#EEF6F8", fontSize: 23, fontWeight: "700" },
  contact: { color: "#94A8B8", fontSize: 13 },
  badge: {
    color: "#6EE7B7",
    fontSize: 12,
    backgroundColor: "#15342A",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  info: {
    padding: 20,
    gap: 10,
    backgroundColor: "#111C28",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#243444",
  },
  infoTitle: {
    color: "#E8F1F6",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 3,
  },
  infoText: { color: "#A9BCCB", fontSize: 13, lineHeight: 21 },
  support: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    borderColor: "#243444",
    borderWidth: 1,
  },
});
