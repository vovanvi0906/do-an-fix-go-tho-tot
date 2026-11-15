import React from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Settings,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "../../../src/features/auth";
import { useWorkerFaceStatus } from "../../../src/features/face-verification/hooks/useWorkerFaceStatus";
import { FaceIdentityCard } from "../../../src/features/face-verification/components/FaceIdentityCard";
import {
  Page,
  Heading,
  Card,
  Badge,
  Row,
  Section,
  C,
  u,
} from "../../../src/features/workbench/WorkerUI";
const APPROVAL = {
  APPROVED: "Đối tác đã duyệt",
  DRAFT: "Hồ sơ nháp",
  PENDING: "Hồ sơ chờ duyệt",
  REJECTED: "Cần bổ sung hồ sơ",
};
export default function WorkerProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { status, profile, loading, error, reload } = useWorkerFaceStatus();
  const name =
    profile?.fullName || user?.fullName || user?.name || "Đối tác FixGo";
  return (
    <Page
      nativeID="worker-profile-screen"
      refreshing={loading}
      onRefresh={reload}
    >
      <Heading
        eyebrow="TÀI KHOẢN ĐỐI TÁC"
        title="Góc của bạn"
        subtitle="Một hồ sơ chỉn chu, nhiều cơ hội hơn."
      />
      <Card nativeID="worker-profile-identity" style={{ gap: 18 }}>
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          <View
            style={{
              width: 65,
              height: 65,
              borderRadius: 23,
              backgroundColor: C.mint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "700", color: C.green }}>
              {name.trim().slice(0, 1)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <Text
              nativeID="worker-profile-name"
              accessibilityRole="header"
              style={[u.section, { fontSize: 21 }]}
            >
              {name}
            </Text>
            <Text style={u.body}>
              {user?.phone || user?.email || "Tài khoản thợ"}
            </Text>
          </View>
        </View>
        <Badge
          tone={profile?.approvalStatus === "APPROVED" ? "green" : "amber"}
        >
          {loading
            ? "Đang tải hồ sơ…"
            : APPROVAL[profile?.approvalStatus] || "Chưa tải được hồ sơ"}
        </Badge>
      </Card>
      <Section title="Bảo mật & xác thực" />
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
      <Card
        nativeID="worker-profile-guidance"
        style={{ backgroundColor: C.mint, borderWidth: 0, gap: 12 }}
      >
        <View style={u.heading}>
          <Text style={u.section}>Sẵn sàng cho mỗi công việc</Text>
          <ShieldCheck size={22} color={C.green} />
        </View>
        {[
          "Bật nhận đơn khi bạn sẵn sàng làm việc.",
          "Đăng ký khuôn mặt một lần cho tài khoản.",
          "Xác thực theo đơn sau khi đã đến nơi.",
        ].map((text, i) => (
          <View
            key={text}
            style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
          >
            <Text style={{ color: C.green, fontWeight: "700", fontSize: 13 }}>
              {String(i + 1).padStart(2, "0")}
            </Text>
            <Text style={[u.body, { flex: 1, color: "#456D62" }]}>{text}</Text>
          </View>
        ))}
      </Card>
      <Section title="Tiện ích tài khoản" />
      <Card style={{ paddingVertical: 3 }}>
        <Row
          icon={Settings}
          title="Cài đặt"
          subtitle="Tùy chọn ứng dụng"
          onPress={() => router.push("/common/settings")}
        />
        <View style={{ height: 1, backgroundColor: C.line }} />
        <Row
          icon={LifeBuoy}
          title="Trợ giúp & hỗ trợ"
          subtitle="FixGo luôn sẵn sàng đồng hành"
          onPress={() => router.push("/common/help")}
        />
        <View style={{ height: 1, backgroundColor: C.line }} />
        <Row
          icon={LogOut}
          title="Đăng xuất"
          onPress={() =>
            Alert.alert(
              "Đăng xuất?",
              "Bạn có thể đăng nhập lại bất cứ lúc nào.",
              [
                { text: "Ở lại", style: "cancel" },
                {
                  text: "Đăng xuất",
                  style: "destructive",
                  onPress: () => logout(),
                },
              ],
            )
          }
        />
      </Card>
      <Text style={[u.eyebrow, { textAlign: "center", marginVertical: 5 }]}>
        FIXGO PARTNER · LÀM VIỆC TỬ TẾ
      </Text>
    </Page>
  );
}
