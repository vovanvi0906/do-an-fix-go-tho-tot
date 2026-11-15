import { WorkerApprovalForm } from "../../../src/features/auth/components/WorkerApprovalForm";
import { profileRestriction } from "../../../src/features/auth/services/workerEligibility";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { apiClient } from "../../../src/services/api/apiClient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Radio,
  PauseCircle,
  Bell,
  TriangleAlert,
  ScanLine,
  ArrowUpRight,
  ChevronRight,
  Briefcase,
  Star,
  Wrench,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  C,
  u,
  Card,
  Section,
  money,
  orderStatus,
} from "../../../src/features/workbench/WorkerUI";
const ICONS = {
  radio: Radio,
  "pause-circle": PauseCircle,
  notifications: Bell,
  "alert-circle": TriangleAlert,
};
const Ionicons = ({ name, ...props }) => {
  const Icon = ICONS[name] || Briefcase;
  return <Icon {...props} />;
};
import { orderService } from "../../../src/services/api/orderService";
import { socketService } from "../../../src/services/socket/socketService";
import { useOrderRecovery } from "../../../src/features/orders/hooks/useOrderRecovery";
import { useAuth } from "../../../src/features/auth";

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // State
  const [isOnline, setIsOnline] = useState(false);
  const statusLock = useRef(false);
  const loadProfile = useCallback(async () => {
    const response = await apiClient.get("/workers/me");
    const profile = response.data || response;
    return profile;
  }, []);
  const {
    data: profile,
    error: profileError,
    loading: profileLoading,
    reload: reloadProfile,
  } = useOrderRecovery(loadProfile, user?.id);
  useEffect(() => {
    setIsOnline(profile?.isOnline === true);
  }, [profile]);
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [isAccepting, setIsAccepting] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const loadActive = useCallback(
    () => orderService.getCurrentWorkerOrder(),
    [],
  );
  const {
    data: activeOrder,
    loading: activeLoading,
    error: activeError,
    reload: reloadActive,
  } = useOrderRecovery(loadActive, user?.id);

  useFocusEffect(
    useCallback(() => {
      if (!activeOrder?.id) return;
      socketService.joinOrderRoom(activeOrder.id);
      return () => socketService.leaveOrderRoom(activeOrder.id);
    }, [activeOrder?.id]),
  );

  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const changeAvailability = async (online) => {
    if (statusLock.current) return;
    statusLock.current = true;
    setIsChangingStatus(true);
    try {
      if (online) {
        if (activeLoading || activeError || activeOrder)
          throw new Error(
            "Cần hoàn tất hoặc kiểm tra công việc hiện tại trước khi nhận đơn mới",
          );
        const profile = await loadProfile();
        const restriction = profileRestriction(profile);
        if (restriction) throw new Error(restriction);
      }
      let coords = {};
      if (online) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted")
          throw new Error("Cần quyền vị trí để bật nhận đơn");
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        socketService.connect();
      }
      const response = await apiClient.patch("/workers/status", {
        isOnline: online,
        ...coords,
      });
      const ack = response.data || response;
      if (ack.isOnline !== online)
        throw new Error("Máy chủ chưa xác nhận trạng thái nhận đơn");
      setIsOnline(ack.isOnline);
      await reloadProfile();
      if (!online) setIncomingOrder(null);
    } catch (error) {
      Alert.alert("Chưa cập nhật trạng thái", error.message);
    } finally {
      statusLock.current = false;
      setIsChangingStatus(false);
    }
  };

  useEffect(() => {
    // 1. Kết nối Socket.IO
    socketService.connect();

    // 2. Lắng nghe đơn hàng mới được broadcast tới thợ (order.new)
    const handleNewOrder = (orderData) => {
      console.log("🔔 [Worker Socket] Có đơn hàng mới phát sóng:", orderData);
      if (isOnline && !activeLoading && !activeError && !activeOrder) {
        setIncomingOrder(orderData);
        setCountdown(orderData.countdownSeconds || 30);
        setConflictMessage("");
      }
    };

    // 3. Lắng nghe sự kiện đơn bị người khác nhận (order.taken)
    const handleOrderTaken = (data) => {
      console.log("ℹ️ [Worker Socket] Đơn hàng đã có người nhận:", data);
      if (incomingOrder && incomingOrder.orderId === data.orderId) {
        setConflictMessage("Đơn hàng đã có thợ khác nhận!");
        setTimeout(() => {
          setIncomingOrder(null);
          setConflictMessage("");
        }, 2000);
      }
    };

    socketService.on("order.new", handleNewOrder);
    socketService.on("order.taken", handleOrderTaken);

    return () => {
      socketService.off("order.new", handleNewOrder);
      socketService.off("order.taken", handleOrderTaken);
    };
  }, [isOnline, incomingOrder, activeLoading, activeError, activeOrder]);

  // Bộ đếm ngược 30 giây cho đơn hàng đến
  useEffect(() => {
    let timer;
    if (incomingOrder && countdown > 0 && !conflictMessage) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIncomingOrder(null); // Tự động đóng popup khi hết giờ
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingOrder, countdown, conflictMessage]);

  // Xử lý sự kiện Thợ bấm Nhận đơn
  const handleAcceptOrder = async () => {
    if (
      !incomingOrder ||
      isAccepting ||
      activeOrder ||
      activeLoading ||
      activeError
    )
      return;
    setIsAccepting(true);
    setConflictMessage("");

    try {
      console.log(`⚡ [Worker] Gửi yêu cầu nhận đơn #${incomingOrder.orderId}`);
      const res = await orderService.acceptOrder(incomingOrder.orderId);

      console.log("🎉 [Worker] Nhận đơn thành công 200 OK:", res);
      await reloadActive();
      setIncomingOrder(null);
    } catch (error) {
      console.error("❌ [Worker Accept Error]:", error.message);
      // BẮT LỖI TRANH CHẤP RACE CONDITION (HTTP 409 Conflict)
      const errorMsg =
        error.message.includes("409") || error.message.includes("thợ khác nhận")
          ? "Đơn đã có người nhận"
          : error.message || "Không thể nhận đơn";

      setConflictMessage(errorMsg);

      // Tự động đóng popup sau 2 giây
      setTimeout(() => {
        setIncomingOrder(null);
        setConflictMessage("");
      }, 2500);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <View nativeID="worker-home-container" style={styles.container}>
      <View
        nativeID="worker-home-header"
        style={[styles.header, { paddingTop: insets.top + 18 }]}
      >
        <View style={u.heading}>
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={u.eyebrow}>FIXGO / ĐỐI TÁC</Text>
            <Text style={styles.welcomeText}>
              Chào {profile?.fullName || user?.fullName || user?.name || "bạn"}{" "}
              👋
            </Text>
            <Text style={styles.subText}>Một ngày làm việc thật hiệu quả.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Mở hồ sơ cá nhân"
            onPress={() => router.push("/(worker)/(tabs)/profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(profile?.fullName || user?.name || "F").trim().slice(0, 1)}
            </Text>
          </TouchableOpacity>
        </View>
        <View
          nativeID="worker-toggle-online-switch"
          style={styles.onlineToggleBox}
        >
          <View style={{ flex: 1, gap: 7 }}>
            <Text style={styles.heroEyebrow}>TRẠNG THÁI LÀM VIỆC</Text>
            <Text style={isOnline ? styles.onlineText : styles.offlineText}>
              {isOnline ? "ĐANG BẬT NHẬN ĐƠN" : "TẠM NGHỈ"}
            </Text>
            <Text style={styles.heroSub}>
              {isOnline
                ? "Sẵn sàng cho công việc tiếp theo"
                : "Bật nhận việc khi bạn đã sẵn sàng"}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={changeAvailability}
            disabled={
              isChangingStatus ||
              profileLoading ||
              (!isOnline &&
                (!!profileRestriction(profile) ||
                  !!activeOrder ||
                  activeLoading ||
                  !!activeError))
            }
            trackColor={{ false: "#42645B", true: "#7EE8BF" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <ScrollView
        nativeID="worker-home-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {profileError ? (
          <TouchableOpacity onPress={reloadProfile}>
            <Text>{profileError} — Thử lại</Text>
          </TouchableOpacity>
        ) : null}
        {profileRestriction(profile) ? (
          <Text accessibilityRole="alert">{profileRestriction(profile)}</Text>
        ) : null}
        {["DRAFT", "REJECTED"].includes(profile?.approvalStatus) ? (
          <WorkerApprovalForm
            key={`${user?.id}:${profile.approvalStatus}`}
            profile={profile}
            onSaved={reloadProfile}
          />
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.faceShortcut}
          onPress={() =>
            router.push({
              pathname: "/(worker)/verification/face",
              params: { mode: "enrollment" },
            })
          }
        >
          <View style={u.icon}>
            <ScanLine size={23} color={C.green} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={u.rowTitle}>Quản lý đăng ký khuôn mặt</Text>
            <Text style={u.body}>Đăng ký một lần · Xác thực theo đơn</Text>
          </View>
          <ChevronRight size={18} color={C.muted} />
        </TouchableOpacity>
        {/* Banner Trạng thái */}
        <View
          nativeID="worker-online-status-banner"
          style={isOnline ? styles.bannerOnline : styles.bannerOffline}
        >
          <Ionicons
            name={isOnline ? "radio" : "pause-circle"}
            size={24}
            color={isOnline ? "#16A34A" : "#64748B"}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={
                isOnline ? styles.bannerTitleOnline : styles.bannerTitleOffline
              }
            >
              {isOnline
                ? "Đang mở nhận công việc mới"
                : "Đang tắt nhận việc. Bật công tắc để nhận đơn mới"}
            </Text>
            <Text style={styles.bannerSub}>
              {isOnline
                ? "Công việc phù hợp sẽ được gửi đến bạn"
                : "Hệ thống sẽ không quét đơn gửi tới bạn"}
            </Text>
          </View>
        </View>

        {/* Đơn hàng đang thực hiện (nếu có) */}
        {activeLoading ? (
          <ActivityIndicator accessibilityLabel="Đang khôi phục công việc" />
        ) : null}
        {activeError ? (
          <TouchableOpacity
            nativeID="worker-active-order-retry"
            onPress={reloadActive}
          >
            <Text>{activeError} — Thử lại</Text>
          </TouchableOpacity>
        ) : null}
        {!activeLoading && !activeError && !activeOrder ? (
          <Card style={{ alignItems: "center", gap: 10, paddingVertical: 25 }}>
            <View style={u.icon}>
              <Briefcase size={24} color={C.green} />
            </View>
            <Text style={u.section}>Sẵn sàng cho việc tiếp theo</Text>
            <Text style={[u.body, { textAlign: "center" }]}>
              Không có công việc đang thực hiện.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(worker)/(tabs)/jobs")}
              style={{
                flexDirection: "row",
                gap: 6,
                alignItems: "center",
                padding: 8,
              }}
            >
              <Text style={{ color: C.green, fontWeight: "700", fontSize: 13 }}>
                Xem công việc của bạn
              </Text>
              <ArrowUpRight size={16} color={C.green} />
            </TouchableOpacity>
          </Card>
        ) : null}
        {activeOrder ? (
          <View
            nativeID="worker-active-order-card"
            style={styles.activeOrderCard}
          >
            <View style={styles.activeOrderHeader}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ĐƠN ĐANG THỰC HIỆN</Text>
              </View>
              <Text style={styles.activeOrderPrice}>
                {money(activeOrder.finalPrice ?? activeOrder.estimatedPrice)}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                color: C.green,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              {orderStatus[activeOrder.status] || "Đang cập nhật"}
            </Text>
            <Text style={styles.activeServiceName}>
              {activeOrder.service?.name ||
                activeOrder.category?.name ||
                "Chưa có tên dịch vụ"}
            </Text>
            <Text style={styles.activeAddress}>
              📍 {activeOrder.addressText || "Chưa có địa chỉ"}
            </Text>

            <TouchableOpacity
              nativeID="btn-worker-view-active-order"
              style={styles.viewOrderDetailBtn}
              onPress={() => router.push(`/(worker)/job/${activeOrder.id}`)}
            >
              <Text style={styles.viewOrderDetailText}>
                Xem chi tiết công việc
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Thống kê nhanh trong ngày */}
        <View style={{ marginTop: 20, marginBottom: 14 }}>
          <Section title="Tổng quan của bạn" />
        </View>
        <View nativeID="worker-stats-row" style={styles.statsRow}>
          <View style={styles.statCard}>
            <Wrench size={18} color={C.green} />
            <Text style={styles.statNumber}>
              {profile?.workerServices?.length ?? "—"}
            </Text>
            <Text style={styles.statLabel}>Dịch vụ đăng ký</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={18} color={C.amber} />
            <Text style={styles.statNumber}>
              {profile?.ratingAvg != null
                ? Number(profile.ratingAvg).toFixed(1)
                : "—"}
            </Text>
            <Text style={styles.statLabel}>Điểm đánh giá</Text>
          </View>
          <View style={styles.statCard}>
            <Briefcase size={18} color={C.green} />
            <Text style={styles.statNumber}>
              {profile?.totalReviews ?? "—"}
            </Text>
            <Text style={styles.statLabel}>Lượt đánh giá</Text>
          </View>
        </View>
      </ScrollView>

      {/* POPUP MODAL NHẬN ĐƠN MỚI KÈM BỘ ĐẾM NGƯỢC 30s */}
      <Modal visible={!!incomingOrder} transparent animationType="slide">
        <View
          nativeID="modal-incoming-order-overlay"
          style={styles.modalOverlay}
        >
          <View
            nativeID="worker-incoming-order-card"
            style={styles.incomingCard}
          >
            {/* Header popup */}
            <View style={styles.incomingHeader}>
              <View style={styles.bellBadge}>
                <Ionicons name="notifications" size={24} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.incomingTitle}>CÓ ĐƠN HÀNG MỚI!</Text>
                <Text style={styles.incomingDistance}>
                  Cách bạn ~ {incomingOrder?.distanceKm ?? "—"} km
                </Text>
              </View>
              {/* Vòng đếm ngược */}
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}s</Text>
              </View>
            </View>

            {/* Thông báo tranh chấp 409 Conflict nếu có */}
            {conflictMessage ? (
              <View style={styles.conflictBox}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.conflictText}>{conflictMessage}</Text>
              </View>
            ) : null}

            {/* Chi tiết đơn */}
            <View style={styles.orderDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dịch vụ:</Text>
                <Text style={styles.detailValueBold}>
                  {incomingOrder?.service?.name || "Sửa chữa điện nước"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thù lao ước tính:</Text>
                <Text style={styles.detailPrice}>
                  {money(
                    incomingOrder?.totalPrice ?? incomingOrder?.estimatedPrice,
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Địa chỉ:</Text>
                <Text style={styles.detailAddress} numberOfLines={2}>
                  {incomingOrder?.pickupAddress ||
                    incomingOrder?.addressText ||
                    "Xem địa chỉ trong chi tiết đơn"}
                </Text>
              </View>

              {incomingOrder?.note ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ghi chú:</Text>
                  <Text style={styles.detailNote}>{incomingOrder.note}</Text>
                </View>
              ) : null}
            </View>

            {/* Nút Nhận Đơn & Từ Chối */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                nativeID="btn-decline-incoming-order"
                style={styles.declineBtn}
                onPress={() => setIncomingOrder(null)}
                disabled={isAccepting}
              >
                <Text style={styles.declineText}>Bỏ qua</Text>
              </TouchableOpacity>

              <TouchableOpacity
                nativeID="btn-accept-incoming-order"
                style={
                  isAccepting ? styles.acceptBtnDisabled : styles.acceptBtn
                }
                onPress={handleAcceptOrder}
                disabled={isAccepting || !!conflictMessage}
                activeOpacity={0.85}
              >
                {isAccepting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.acceptText}>
                    NHẬN ĐƠN NGAY ({countdown}s)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.bg,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: C.ink,
  },
  subText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: C.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: C.green },
  heroEyebrow: {
    fontSize: 9,
    color: "#A1CBBE",
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  heroSub: { fontSize: 12, color: "#B5D6CC", lineHeight: 18 },
  onlineToggleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.navy,
    borderRadius: 24,
    padding: 23,
    marginTop: 22,
  },
  onlineText: { fontSize: 18, fontWeight: "800", color: "#C8F9DE" },
  offlineText: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  faceShortcut: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  scrollContent: {
    padding: 22,
    paddingTop: 4,
    paddingBottom: 32,
  },
  bannerOnline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerOffline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bannerTitleOnline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  bannerTitleOffline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  bannerSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  activeOrderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#B5DED0",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  activeOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  activeOrderPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16A34A",
  },
  activeServiceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  activeAddress: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
  },
  viewOrderDetailBtn: {
    backgroundColor: C.green,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  viewOrderDetailText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 19,
    paddingHorizontal: 8,
    gap: 9,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  incomingCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  incomingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  bellBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
  },
  incomingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#EA580C",
  },
  incomingDistance: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  countdownBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },
  conflictBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  conflictText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  orderDetailsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    width: 100,
  },
  detailValueBold: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
  },
  detailPrice: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
    textAlign: "right",
  },
  detailAddress: {
    flex: 1,
    fontSize: 12,
    color: "#334155",
    textAlign: "right",
  },
  detailNote: {
    flex: 1,
    fontSize: 12,
    color: "#EA580C",
    fontStyle: "italic",
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  declineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: "#16A34A",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnDisabled: {
    flex: 2,
    backgroundColor: "#86EFAC",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});
