import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../../auth";
import { sessionEpoch } from "../../auth/services/sessionEpoch";
import { faceIdentityService } from "../services/faceIdentityService";
import { facePrompt } from "../utils/faceStatus";

/** One advisory prompt per authenticated session, shared by all login methods.
 * Enrollment guidance is advisory; per-order proof authorization remains server-side.
 */
export function FaceLoginPrompt() {
  const { user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const key = user?.id ? `${user.id}:${sessionEpoch.current()}` : null;
  const dismissed = useRef(null);
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    setPrompt(null);
    if (!key || dismissed.current === key || !token) return;
    const controller = new AbortController();
    (async () => {
      try {
        const [profile, status] = await Promise.all([
          faceIdentityService.profile(controller.signal),
          faceIdentityService.status(controller.signal),
        ]);
        if (controller.signal.aborted || dismissed.current === key) return;
        const summary = facePrompt(status, profile);
        if (!summary) {
          dismissed.current = key;
          return;
        }
        setPrompt({ ...summary, owner: key });
      } catch {
        /* Profile/dashboard retain retry actions; login itself stays usable. */
      }
    })();
    return () => controller.abort();
  }, [key, !!token]);
  useEffect(() => {
    if (
      key &&
      (pathname.includes("/verification/") ||
        pathname.includes("/job/") ||
        pathname.includes("/profile"))
    ) {
      dismissed.current = key;
      setPrompt(null);
    }
  }, [pathname, key]);
  const close = () => {
    dismissed.current = key;
    setPrompt(null);
  };
  const open = () => {
    const mode = prompt?.mode;
    close();
    router.push({ pathname: "/(worker)/verification/face", params: { mode } });
  };
  // Do not interrupt an order, capture, or direct profile navigation.
  const visible =
    prompt?.owner === key &&
    !pathname.includes("/verification/") &&
    !pathname.includes("/job/") &&
    !pathname.includes("/profile");
  return (
    <Modal
      nativeID="worker-face-login-modal"
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View nativeID="worker-face-login-overlay" style={s.overlay}>
        <View nativeID="worker-face-login-card" style={s.card}>
          <Text style={s.eyebrow}>FACE ID · ĐỐI TÁC FIXGO</Text>
          <Text
            nativeID="worker-face-login-title"
            accessibilityRole="header"
            style={s.title}
          >
            {prompt?.title}
          </Text>
          <Text style={s.message}>{prompt?.message}</Text>
          <Text style={s.note}>
            Bạn có thể tiếp tục vào ứng dụng. Khi đã đến nơi, xác thực riêng theo đơn
            trước khi chụp ảnh BEFORE và bắt đầu công việc.
          </Text>
          <TouchableOpacity
            nativeID="worker-face-login-open"
            accessibilityRole="button"
            onPress={open}
            style={s.primary}
          >
            <Text style={s.primaryText}>{prompt?.action}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            nativeID="worker-face-login-later"
            accessibilityRole="button"
            onPress={close}
            style={s.secondary}
          >
            <Text style={s.secondaryText}>Để sau, vào ứng dụng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#020810CC",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#101F2B",
    borderColor: "#2B4A3C",
    borderWidth: 1,
    borderRadius: 24,
    padding: 25,
    gap: 17,
  },
  eyebrow: { color: "#6EE7B7", fontSize: 11, letterSpacing: 2 },
  title: { color: "#F1F7FA", fontSize: 23, fontWeight: "700" },
  message: { color: "#B7C8D5", fontSize: 14, lineHeight: 22 },
  note: { color: "#8EA4B5", fontSize: 12, lineHeight: 20 },
  primary: {
    backgroundColor: "#6EE7B7",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  primaryText: { color: "#09271C", fontWeight: "700" },
  secondary: { padding: 10, alignItems: "center" },
  secondaryText: { color: "#AABFCC", fontSize: 13 },
});
