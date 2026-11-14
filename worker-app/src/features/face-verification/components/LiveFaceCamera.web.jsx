import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  AppState,
} from "react-native";
import { captureStability, assessNativeFaces } from "../utils/captureQuality";

export function LiveFaceCamera({ visible, onCapture, onClose }) {
  const video = useRef(null),
    stream = useRef(null),
    detector = useRef(null),
    generation = useRef(0),
    stability = useRef(null),
    busy = useRef(false);
  const callbacks = useRef({ onCapture, onClose });
  callbacks.current = { onCapture, onClose };
  const automaticRef = useRef(true);
  const [automatic, setAutomatic] = useState(true),
    [running, setRunning] = useState(false),
    [error, setError] = useState("");
  const [quality, setQuality] = useState({
    ok: false,
    progress: 0,
    message: "Cho phép camera và nhìn thẳng vào khung hình",
  });
  const stop = () => {
    generation.current++;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    detector.current?.close();
    detector.current = null;
    stability.current = null;
    setRunning(false);
  };
  const take = async (expected) => {
    if (busy.current || !video.current?.videoWidth) return;
    busy.current = true;
    try {
      const v = video.current,
        canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (expected !== generation.current) return;
      if (!blob) throw Error("CAPTURE_FAILED");
      const uri = URL.createObjectURL(blob);
      stop();
      callbacks.current.onCapture(uri);
    } catch {
      setError("Chưa chụp được ảnh. Vui lòng thử lại.");
    } finally {
      busy.current = false;
    }
  };
  const start = async () => {
    stop();
    setError("");
    const current = generation.current;
    let opened, loaded;
    try {
      opened = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (current !== generation.current) {
        opened.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = opened;
      const { FaceDetector, FilesetResolver } =
        await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks("/faceid");
      const options = (delegate) => ({
        baseOptions: {
          modelAssetPath: "/faceid/blaze_face_short_range.tflite",
          delegate,
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.6,
      });
      try {
        loaded = await FaceDetector.createFromOptions(files, options("GPU"));
      } catch {
        loaded = await FaceDetector.createFromOptions(files, options("CPU"));
      }
      if (current !== generation.current) {
        loaded.close();
        opened.getTracks().forEach((track) => track.stop());
        return;
      }
      detector.current = loaded;
      video.current.srcObject = opened;
      await video.current.play();
      if (current !== generation.current) return;
      setRunning(true);
      let last = 0;
      const tick = (now) => {
        if (current !== generation.current) return;
        if (now - last >= 100 && video.current?.readyState >= 2) {
          last = now;
          try {
            const v = video.current;
            const faces = loaded
              .detectForVideo(v, now)
              .detections.map(({ boundingBox: b, keypoints }) => {
                const [a, c, nose] = keypoints || [];
                const roll =
                  a && c
                    ? (Math.atan2(
                        Math.abs((c.y - a.y) * v.videoHeight),
                        Math.abs((c.x - a.x) * v.videoWidth),
                      ) *
                        180) /
                      Math.PI
                    : NaN;
                const eyeDistance =
                  a && c
                    ? Math.hypot(
                        (c.x - a.x) * v.videoWidth,
                        (c.y - a.y) * v.videoHeight,
                      )
                    : 0;
                const yaw =
                  nose && eyeDistance
                    ? ((Math.abs(nose.x - (a.x + c.x) / 2) * v.videoWidth) /
                        eyeDistance) *
                      48
                    : NaN;
                return {
                  frame: {
                    left: b.originX,
                    top: b.originY,
                    width: b.width,
                    height: b.height,
                  },
                  rotationZ: roll,
                  rotationY: yaw,
                };
              });
            const q = assessNativeFaces(faces, v.videoWidth, v.videoHeight);
            stability.current = captureStability(
              stability.current,
              q,
              Date.now(),
            );
            setQuality({ ...q, progress: stability.current.progress });
            if (automaticRef.current && stability.current.progress >= 1)
              void take(current);
          } catch {
            stability.current = null;
            setQuality({
              ok: false,
              progress: 0,
              message: "Không đọc được khung hình. Đóng và mở lại camera.",
            });
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (e) {
      opened?.getTracks().forEach((track) => track.stop());
      loaded?.close();
      if (current === generation.current)
        setError(
          e.name === "NotAllowedError"
            ? "Quyền camera bị từ chối. Cho phép camera trong cài đặt trình duyệt."
            : "Không mở được camera hoặc model quét mặt. Kiểm tra HTTPS/localhost và chạy npm run face:assets.",
        );
    }
  };
  useEffect(() => {
    if (!visible) {
      stop();
      return;
    }
    setError("");
    const hide = () => {
      if (document.hidden) {
        stop();
        callbacks.current.onClose();
      }
    };
    document.addEventListener("visibilitychange", hide);
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        stop();
        callbacks.current.onClose();
      }
    });
    return () => {
      stop();
      document.removeEventListener("visibilitychange", hide);
      listener.remove();
    };
  }, [visible]);
  return (
    <Modal
      nativeID="face-live-camera-modal"
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View nativeID="face-live-camera-container" style={s.root}>
        <Text
          nativeID="face-live-camera-title"
          accessibilityRole="header"
          style={s.title}
        >
          Quét khuôn mặt
        </Text>
        <View nativeID="face-live-camera-preview" style={s.preview}>
          {React.createElement("video", {
            ref: video,
            autoPlay: true,
            muted: true,
            playsInline: true,
            "aria-label": "Camera khuôn mặt",
            style: {
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: "scaleX(-1)",
            },
          })}
        </View>
        <Text
          nativeID="face-live-camera-guidance"
          accessibilityLiveRegion="polite"
          style={s.message}
        >
          {quality.message}
        </Text>
        <View style={s.track}>
          <View style={[s.progress, { width: `${quality.progress * 100}%` }]} />
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
        <View nativeID="face-live-camera-auto-row" style={s.row}>
          <Text style={s.message}>Tự chụp sau 1,3 giây ổn định</Text>
          <Switch
            nativeID="face-live-camera-auto"
            value={automatic}
            onValueChange={(value) => {
              automaticRef.current = value;
              setAutomatic(value);
            }}
          />
        </View>
        {!running ? (
          <TouchableOpacity
            nativeID="face-live-camera-start"
            accessibilityRole="button"
            style={s.button}
            onPress={start}
          >
            <Text style={s.buttonText}>Bật camera</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            nativeID="face-live-camera-shutter"
            accessibilityRole="button"
            style={[s.button, !quality.ok && { opacity: 0.4 }]}
            disabled={!quality.ok}
            onPress={() => take(generation.current)}
          >
            <Text style={s.buttonText}>Chụp khuôn mặt</Text>
          </TouchableOpacity>
        )}
        <Text style={s.note}>
          Chỉ hướng dẫn căn mặt. Server kiểm tra ánh sáng, độ nét, người thật và
          danh tính khi gửi.
        </Text>
        <TouchableOpacity
          nativeID="face-live-camera-close"
          accessibilityRole="button"
          style={s.close}
          onPress={() => {
            stop();
            onClose();
          }}
        >
          <Text style={s.message}>Đóng camera</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080F18",
    padding: 24,
    gap: 16,
    alignItems: "center",
  },
  title: { color: "#F0F7F8", fontSize: 22, fontWeight: "700" },
  preview: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    minHeight: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#02060B",
  },
  message: { color: "#D5E6EF", textAlign: "center", fontSize: 14 },
  track: {
    height: 4,
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#223744",
  },
  progress: { height: 4, backgroundColor: "#6EE7B7" },
  row: { flexDirection: "row", alignItems: "center", gap: 20 },
  button: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#6EE7B7",
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: { color: "#08271C", fontWeight: "700" },
  note: { color: "#8CA6B7", fontSize: 12, textAlign: "center" },
  error: { color: "#F4BCA5", fontSize: 13 },
  close: { padding: 12 },
});
