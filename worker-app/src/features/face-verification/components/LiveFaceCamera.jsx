import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  AppState,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import FaceDetection from "@react-native-ml-kit/face-detection";
import { assessNativeFaces, captureStability } from "../utils/captureQuality";
import { deleteCaptureFile } from "../utils/captureFiles";

/** Local sampled detection is capture guidance only. Identity/quality/PAD stay on server. */
export function LiveFaceCamera({ visible, onCapture, onClose }) {
  const camera = useRef(null),
    generation = useRef(0),
    scanning = useRef(false),
    finishing = useRef(false),
    stable = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false),
    [automatic, setAutomatic] = useState(true);
  const [quality, setQuality] = useState({
      ok: false,
      message: "Đang khởi tạo camera",
      progress: 0,
    }),
    [error, setError] = useState("");
  const latest = useRef({ onCapture, onClose, automatic });
  latest.current = { onCapture, onClose, automatic };
  const finalPhoto = async (expected) => {
    if (finishing.current || !camera.current) return;
    finishing.current = true;
    let photo;
    try {
      photo = await camera.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (expected !== generation.current) {
        await deleteCaptureFile(photo?.uri);
        return;
      }
      const faces = await FaceDetection.detect(photo.uri, {
        performanceMode: "fast",
      });
      if (expected !== generation.current) {
        await deleteCaptureFile(photo.uri);
        return;
      }
      const check = assessNativeFaces(faces, photo.width, photo.height);
      if (!check.ok) {
        await deleteCaptureFile(photo.uri);
        setQuality({ ...check, progress: 0 });
        stable.current = null;
        return;
      }
      generation.current++;
      setReady(false);
      latest.current.onCapture(photo.uri);
    } catch {
      await deleteCaptureFile(photo?.uri);
      setError(
        "Không đọc được camera hoặc bộ quét mặt. Hãy dùng bản ứng dụng đã cập nhật và thử lại.",
      );
    } finally {
      finishing.current = false;
    }
  };
  useEffect(() => {
    setReady(false);
    setError("");
    stable.current = null;
    generation.current++;
    if (!visible) return;
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") latest.current.onClose();
    });
    return () => {
      generation.current++;
      listener.remove();
    };
  }, [visible]);
  useEffect(() => {
    if (!visible || !ready || !permission?.granted) return;
    const expected = generation.current;
    let timer;
    const sample = async () => {
      if (expected !== generation.current) return;
      if (scanning.current || finishing.current) {
        timer = setTimeout(sample, 250);
        return;
      }
      scanning.current = true;
      let photo,
        autoCapture = false;
      try {
        photo = await camera.current.takePictureAsync({
          quality: 0.45,
          skipProcessing: false,
        });
        const faces = await FaceDetection.detect(photo.uri, {
          performanceMode: "fast",
        });
        if (expected !== generation.current) return;
        const checked = assessNativeFaces(faces, photo.width, photo.height);
        stable.current = captureStability(stable.current, checked, Date.now());
        setQuality({ ...checked, progress: stable.current.progress });
        autoCapture = latest.current.automatic && stable.current.progress >= 1;
      } catch {
        if (expected === generation.current) {
          stable.current = null;
          setError(
            "Bộ quét mặt chưa sẵn sàng. Cần cài bản ứng dụng có camera và nhận diện trên thiết bị.",
          );
          setQuality({
            ok: false,
            progress: 0,
            message: "Chưa quét được khuôn mặt",
          });
        }
      } finally {
        await deleteCaptureFile(photo?.uri);
        scanning.current = false;
      }
      if (expected !== generation.current) return;
      if (autoCapture) await finalPhoto(expected);
      if (expected === generation.current) timer = setTimeout(sample, 250);
    };
    void sample();
    return () => {
      clearTimeout(timer);
      generation.current++;
      stable.current = null;
    };
  }, [visible, ready, permission?.granted]);
  const askPermission = async () => {
    try {
      await requestPermission();
    } catch {
      setError("Không cấp được quyền camera. Vui lòng mở cài đặt ứng dụng.");
    }
  };
  return (
    <Modal
      nativeID="face-live-camera-modal"
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View nativeID="face-live-camera-container" style={s.container}>
        <View nativeID="face-live-camera-header" style={s.header}>
          <Text accessibilityRole="header" style={s.title}>
            Quét khuôn mặt
          </Text>
          <TouchableOpacity
            nativeID="face-live-camera-close"
            accessibilityRole="button"
            onPress={onClose}
          >
            <Text style={s.link}>Đóng</Text>
          </TouchableOpacity>
        </View>
        {!permission?.granted ? (
          <View nativeID="face-live-camera-permission" style={s.permission}>
            <Text style={s.message}>
              Cần camera trước để chụp khuôn mặt. Không dùng ảnh từ thư viện.
            </Text>
            <TouchableOpacity
              nativeID="face-live-camera-permission-button"
              accessibilityRole="button"
              style={s.button}
              onPress={
                permission?.canAskAgain === false
                  ? () => Linking.openSettings()
                  : askPermission
              }
            >
              <Text style={s.buttonText}>
                {permission?.canAskAgain === false
                  ? "Mở cài đặt camera"
                  : "Cho phép camera"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          visible && (
            <View nativeID="face-live-camera-preview" style={s.preview}>
              <CameraView
                ref={camera}
                style={StyleSheet.absoluteFill}
                facing="front"
                mode="picture"
                onCameraReady={() => setReady(true)}
                onMountError={() =>
                  setError(
                    "Không mở được camera. Đóng camera ở ứng dụng khác rồi thử lại.",
                  )
                }
              />
              <View
                pointerEvents="none"
                style={[s.oval, quality.ok && s.ovalReady]}
              />
            </View>
          )
        )}
        <View nativeID="face-live-camera-controls" style={s.controls}>
          <Text
            nativeID="face-live-camera-guidance"
            accessibilityLiveRegion="polite"
            style={s.message}
          >
            {quality.message}
          </Text>
          <View style={s.track}>
            <View
              style={[s.progress, { width: `${quality.progress * 100}%` }]}
            />
          </View>
          <View style={s.toggle}>
            <Text style={s.note}>Tự chụp khi giữ ổn định 1,3 giây</Text>
            <Switch
              nativeID="face-live-camera-auto"
              value={automatic}
              onValueChange={setAutomatic}
              trackColor={{ true: "#237E5D" }}
            />
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            nativeID="face-live-camera-shutter"
            accessibilityRole="button"
            disabled={!ready || !quality.ok}
            style={[s.button, (!ready || !quality.ok) && s.disabled]}
            onPress={() => {
              if (!scanning.current) void finalPhoto(generation.current);
            }}
          >
            <Text style={s.buttonText}>Chụp khuôn mặt</Text>
          </TouchableOpacity>
          <Text style={s.note}>
            Chọn nơi đủ sáng, giữ đầu thẳng. Server sẽ kiểm tra lại độ nét, ánh
            sáng, người thật và danh tính.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080F18", paddingTop: 38 },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#F0F7F8", fontSize: 20, fontWeight: "700" },
  link: { color: "#6EE7B7", padding: 8 },
  preview: {
    flex: 1,
    margin: 20,
    borderRadius: 22,
    overflow: "hidden",
    minHeight: 240,
  },
  oval: {
    position: "absolute",
    left: "18%",
    top: "10%",
    width: "64%",
    height: "78%",
    borderWidth: 2,
    borderColor: "#B2C1CC",
    borderRadius: 180,
  },
  ovalReady: { borderColor: "#6EE7B7" },
  controls: { padding: 24, gap: 16 },
  message: {
    color: "#DEEAF1",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
  },
  track: { height: 4, backgroundColor: "#253846", borderRadius: 8 },
  progress: { backgroundColor: "#6EE7B7", height: 4, borderRadius: 8 },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  note: { color: "#91A7B9", fontSize: 12, lineHeight: 20 },
  button: {
    backgroundColor: "#6EE7B7",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  buttonText: { color: "#09271C", fontWeight: "700" },
  disabled: { opacity: 0.4 },
  error: { color: "#F6B39D", fontSize: 12, lineHeight: 19 },
  permission: { flex: 1, justifyContent: "center", padding: 28, gap: 24 },
});
