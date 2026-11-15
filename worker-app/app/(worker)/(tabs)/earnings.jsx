import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Wallet, ArrowDownLeft, ShieldCheck } from "lucide-react-native";
import {
  Page,
  Heading,
  Card,
  Empty,
  LoadingCards,
  Section,
  money,
  C,
  u,
} from "../../../src/features/workbench/WorkerUI";
import { useWorkerOrders } from "../../../src/features/workbench/useWorkerOrders";
export default function WorkerEarningsScreen() {
  const router = useRouter();
  const [thisMonth, setThisMonth] = useState(false);
  const { data, loading, error, reload } = useWorkerOrders({
    status: "COMPLETED",
    limit: 50,
  });
  const now = new Date();
  const paid = (data?.data || [])
    .filter((o) => o.payment?.status === "PAID")
    .filter(
      (o) =>
        !thisMonth ||
        (new Date(o.payment.paidAt).getMonth() === now.getMonth() &&
          new Date(o.payment.paidAt).getFullYear() === now.getFullYear()),
    );
  const total = paid.reduce(
    (sum, o) => sum + Number(o.payment.workerPayoutAmount || 0),
    0,
  );
  const fees = paid.reduce(
    (sum, o) => sum + Number(o.payment.commissionAmount || 0),
    0,
  );
  return (
    <Page
      nativeID="worker-earnings-screen"
      refreshing={loading}
      onRefresh={reload}
    >
      <Heading
        eyebrow="THÀNH QUẢ CÔNG VIỆC"
        title="Thu nhập của bạn"
        subtitle="Rõ ràng từng đơn, an tâm mỗi ngày."
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          ["Gần đây", false],
          ["Tháng này", true],
        ].map(([label, value]) => (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            onPress={() => setThisMonth(value)}
            style={{
              borderRadius: 22,
              paddingHorizontal: 19,
              paddingVertical: 10,
              backgroundColor: thisMonth === value ? C.navy : "#FFFFFF",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: thisMonth === value ? "#FFFFFF" : C.muted,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card
        style={{
          backgroundColor: C.navy,
          borderWidth: 0,
          gap: 18,
          padding: 25,
        }}
      >
        <View style={u.heading}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#B2D2C9",
              letterSpacing: 1,
            }}
          >
            THỰC NHẬN TỪ ĐƠN ĐÃ THANH TOÁN
          </Text>
          <Wallet color="#A1E8CA" size={23} />
        </View>
        <Text
          style={{
            fontSize: 36,
            fontWeight: "800",
            color: "#FFFFFF",
            letterSpacing: -1,
          }}
        >
          {loading || error ? "—" : money(total)}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <ShieldCheck color="#A1E8CA" size={15} />
          <Text style={{ color: "#B2D2C9", fontSize: 12 }}>
            Tổng hợp từ tối đa 50 đơn hoàn tất gần nhất
          </Text>
        </View>
      </Card>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1, gap: 8 }}>
          <Text style={u.body}>Đơn đã thanh toán</Text>
          <Text style={[u.section, { fontSize: 25 }]}>
            {loading || error ? "—" : paid.length}
          </Text>
        </Card>
        <Card style={{ flex: 1, gap: 8 }}>
          <Text style={u.body}>Phí nền tảng</Text>
          <Text style={[u.section, { fontSize: 18 }]}>
            {loading || error ? "—" : money(fees)}
          </Text>
        </Card>
      </View>
      <Section title="Đối soát công việc" />
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <Empty
          title="Chưa tải được thu nhập"
          description={error}
          action="Thử lại"
          onPress={reload}
        />
      ) : !paid.length ? (
        <Empty
          icon={Wallet}
          title="Khởi đầu cho thành quả mới"
          description="Thu nhập sẽ xuất hiện khi công việc hoàn tất và thanh toán đã được xác nhận."
        />
      ) : (
        <Card style={{ paddingVertical: 5 }}>
          {paid.map((o, i) => (
            <TouchableOpacity
              key={o.id}
              accessibilityRole="button"
              onPress={() => router.push(`/(worker)/job/${o.id}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 17,
                borderBottomWidth: i < paid.length - 1 ? 1 : 0,
                borderBottomColor: C.line,
              }}
            >
              <View style={u.icon}>
                <ArrowDownLeft color={C.green} size={21} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={u.rowTitle}>
                  {o.service?.name || o.category?.name || "Công việc hoàn tất"}
                </Text>
                <Text style={u.body}>
                  #{o.id.slice(-6).toUpperCase()} · Đã thanh toán
                </Text>
              </View>
              <Text style={{ fontWeight: "700", fontSize: 14, color: C.green }}>
                +{money(o.payment.workerPayoutAmount)}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}
      <Text style={[u.body, { fontSize: 11 }]}>
        Đây là đối soát theo đơn, không phải số dư ví có thể rút.
      </Text>
    </Page>
  );
}
