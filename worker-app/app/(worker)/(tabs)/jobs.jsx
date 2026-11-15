import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Briefcase, ArrowLeft, ArrowRight } from "lucide-react-native";
import {
  Page,
  Heading,
  Card,
  Empty,
  OrderRow,
  LoadingCards,
  C,
  u,
  Button,
} from "../../../src/features/workbench/WorkerUI";
import { useWorkerOrders } from "../../../src/features/workbench/useWorkerOrders";
export default function WorkerJobsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [completed, setCompleted] = useState(false);
  const { data, loading, error, reload } = useWorkerOrders({
    page,
    status: completed ? "COMPLETED" : undefined,
  });
  return (
    <Page nativeID="worker-jobs-screen" refreshing={loading} onRefresh={reload}>
      <Heading
        eyebrow="CÔNG VIỆC CỦA BẠN"
        title="Mỗi việc, một cơ hội."
        subtitle="Theo dõi công việc đã nhận và lịch sử phục vụ."
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          ["Tất cả", false],
          ["Hoàn thành", true],
        ].map(([label, value]) => (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected: completed === value }}
            onPress={() => {
              setCompleted(value);
              setPage(1);
            }}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 11,
              borderRadius: 30,
              backgroundColor: completed === value ? C.navy : "#FFFFFF",
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: completed === value ? "#FFFFFF" : C.muted,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card style={{ backgroundColor: C.mint, borderWidth: 0, gap: 10 }}>
        <Text style={u.rowTitle}>Muốn nhận thêm việc mới?</Text>
        <Text style={u.body}>
          Bật nhận đơn tại Trang chủ. Khi có đơn phù hợp, bạn sẽ nhận được yêu
          cầu ngay trong ứng dụng.
        </Text>
        <Button secondary onPress={() => router.navigate("/(worker)/(tabs)")}>
          Về bàn làm việc
        </Button>
      </Card>
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <Empty
          title="Chưa tải được công việc"
          description={error}
          action="Thử lại"
          onPress={reload}
        />
      ) : data?.data.length ? (
        <>
          <Text style={u.eyebrow}>{data.pagination.total} CÔNG VIỆC</Text>
          {data.data.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onPress={() => router.push(`/(worker)/job/${order.id}`)}
            />
          ))}
        </>
      ) : (
        <Empty
          icon={Briefcase}
          title={completed ? "Chưa có việc hoàn thành" : "Chưa có công việc"}
          description="Công việc bạn nhận sẽ xuất hiện tại đây. Hãy bật nhận đơn khi sẵn sàng."
        />
      )}
      {data?.pagination.totalPages > 1 ? (
        <View style={[u.heading, { justifyContent: "center", gap: 22 }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Trang trước"
            disabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
            style={{ padding: 12, opacity: page === 1 ? 0.3 : 1 }}
          >
            <ArrowLeft color={C.green} size={20} />
          </TouchableOpacity>
          <Text style={u.body}>
            {page} / {data.pagination.totalPages}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Trang sau"
            disabled={page >= data.pagination.totalPages}
            onPress={() => setPage((p) => p + 1)}
            style={{
              padding: 12,
              opacity: page >= data.pagination.totalPages ? 0.3 : 1,
            }}
          >
            <ArrowRight color={C.green} size={20} />
          </TouchableOpacity>
        </View>
      ) : null}
    </Page>
  );
}
