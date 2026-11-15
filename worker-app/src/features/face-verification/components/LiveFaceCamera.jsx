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
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import jpeg from "jpeg-js";
import { toByteArray } from "base64-js";
import FaceDetection from "@react-native-ml-kit/face-detection";
import { assessNativeFaces, captureStability, assessFaceLighting, choosePictureSize } from "../utils/captureQuality";
import { deleteCaptureFile } from "../utils/captureFiles";

/** Local sampled detection is capture guidance only. Identity/quality/PAD stay on server. */
export function LiveFaceCamera({ visible, onCapture, onClose }) {
  const camera = useRef(null),
    generation = useRef(0),
    scanning = useRef(false),
    finishing = useRef(false),
    captureRequested = useRef(false),
    stable = useRef(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;
  const [clock, setClock] = useState(Date.now());
  const [pictureSize, setPictureSize] = useState();
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false),
    [automatic, setAutomatic] = useState(true);
  const [quality, setQuality] = useState({
      ok: false,
      message: "Đang khởi tạo camera",
      progress: 0,
    }),
    [error, setError] = useState("");
  const countdown = quality.ok && stable.current?.since != null
    ? Math.max(0,Math.min(3,3-Math.floor((clock-stable.current.since)/1000))) : null;
  const displayProgress = automatic && quality.ok && stable.current?.since != null
    ? Math.max(quality.progress || 0,Math.min(.95,Math.max(0,(clock-stable.current.since)/3000)))
    : quality.progress || 0;
  useEffect(() => {
    if (!visible || !ready || !automatic || !quality.ok) return;
    const timer=setInterval(()=>setClock(Date.now()),100);
    return ()=>clearInterval(timer);
  },[visible,ready,automatic,quality.ok]);
  useEffect(() => {
    if (!visible || quality.ok || capturing) { pulse.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:.45,duration:650,useNativeDriver:true}),
      Animated.timing(pulse,{toValue:1,duration:650,useNativeDriver:true}),
    ]));
    animation.start();
    return () => { animation.stop(); pulse.setValue(1); };
  },[visible,quality.ok,capturing,pulse]);
  useEffect(() => {
    countdownScale.setValue(1.25);
    const animation=Animated.spring(countdownScale,{toValue:1,useNativeDriver:true,friction:5});
    animation.start(); return () => animation.stop();
  },[countdown,countdownScale]);
  const latest = useRef({ onCapture, onClose, automatic });
  latest.current = { onCapture, onClose, automatic };
  const finalPhoto = async (expected) => {
    if (finishing.current || !camera.current) return;
    finishing.current = true;
    setCapturing(true);
    setError("");
    let photo;
    try {
      photo = await camera.current.takePictureAsync({
        quality: 0.85,
        shutterSound: false,
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
      setCapturing(false);
    }
  };
  useEffect(() => {
    setReady(false);
    setError("");
    stable.current = null;
    captureRequested.current = false;
    setCapturing(false);
    generation.current++;
    if (!visible) return;
    setAutomatic(true);
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
      const sampleStartedAt = Date.now();
      let photo,
        autoCapture = false;
      try {
        photo = await camera.current.takePictureAsync({
          quality: 0.45,
          shutterSound: false,
          base64: true,
          skipProcessing: false,
        });
        const faces = await FaceDetection.detect(photo.uri, {
          performanceMode: "fast",
        });
        if (expected !== generation.current) return;
        let checked = assessNativeFaces(faces, photo.width, photo.height);
        checked.geometryOk = checked.ok;
        if (checked.ok) {
          const image = jpeg.decode(toByteArray(photo.base64), {useTArray:true,maxResolutionInMP:2,maxMemoryUsageInMB:32});
          const light = assessFaceLighting(image, faces[0]);
          checked = {...checked,...light, lightingOk:light.ok, message:light.ok ? checked.message : light.message};
        }
        setError("");
        stable.current = captureStability(stable.current, checked, Date.now(), 3000, {processingMs:Date.now()-sampleStartedAt,minSamples:3});
        setClock(Date.now());
        setQuality({ ...checked, progress: stable.current.progress, countdown: checked.ok ? Math.max(1, 3 - Math.floor((Date.now() - stable.current.since) / 1000)) : null });
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
      if (autoCapture || captureRequested.current) {
        captureRequested.current = false;
        await finalPhoto(expected);
      }
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
                animateShutter={false}
                mode="picture"
                pictureSize={pictureSize}
                onCameraReady={async () => {
                  try {
                    const sizes = await camera.current?.getAvailablePictureSizesAsync();
                    const size = choosePictureSize(sizes);
                    if (size) setPictureSize(size);
                    setReady(true);
                  } catch { setError('Không đọc được cấu hình camera. Đóng và mở lại camera.'); }
                }}
                onMountError={() =>
                  setError(
                    "Không mở được camera. Đóng camera ở ứng dụng khác rồi thử lại.",
                  )
                }
              />
              <Animated.View
                pointerEvents="none"
                style={[s.oval, quality.ok ? s.ovalReady : s.ovalAdjust, {opacity:pulse}]}
              />
              <View pointerEvents="none" style={[s.statusBanner, quality.ok ? s.statusReady : s.statusAdjust]}>
                <Animated.Text style={[s.statusIcon,{transform:[{scale:pulse.interpolate({inputRange:[.45,1],outputRange:[1,1.15]})}]}]}>{quality.ok ? '✓' : quality.lightingOk === false ? '☀' : '↔'}</Animated.Text>
                <Text style={s.statusTitle}>{capturing ? 'Đang chụp' : quality.ok ? 'Đã sẵn sàng — giữ yên' : quality.message}</Text>
              </View>
              {automatic && quality.ok && countdown > 0 && !capturing ? (
                <Animated.Text nativeID="face-live-countdown" pointerEvents="none" style={[s.countdown,{transform:[{scale:countdownScale}]}]}>{countdown}</Animated.Text>
              ) : null}
            </View>
          )
        )}
        <View nativeID="face-live-camera-controls" style={s.controls}>
          <Text
            nativeID="face-live-camera-guidance"
            accessibilityLiveRegion="polite"
            style={s.message}
          >
            {automatic && quality.ok ? countdown > 0 ? `${quality.message} — ${countdown}` : 'Đang xác nhận khung hình để chụp…' : quality.message}
          </Text>
          <View style={s.checks}>
            <Text style={[s.check, quality.geometryOk && s.checkReady]}>{quality.geometryOk ? '✓' : '○'} Vị trí khuôn mặt</Text>
            <Text style={[s.check, quality.lightingOk && s.checkReady]}>{quality.lightingOk ? '✓' : '○'} Ánh sáng</Text>
          </View>
          <View style={s.track}>
            <View
              style={[s.progress, { width: `${displayProgress * 100}%` }]}
            />
          </View>
          <View style={s.toggle}>
            <Text style={s.note}>Tự chụp sau khi giữ ổn định và đếm 3–2–1</Text>
            <Switch
              nativeID="face-live-camera-auto"
              value={automatic}
              onValueChange={value => { setAutomatic(value); stable.current = null; setQuality(previous => ({...previous, progress:0, countdown:null})); }}
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
            disabled={!ready || !quality.ok || capturing}
            style={[s.button, (!ready || !quality.ok) && s.disabled]}
            onPress={() => {
              if (finishing.current || captureRequested.current) return;
              if (scanning.current) {
                captureRequested.current = true;
                setCapturing(true);
              } else void finalPhoto(generation.current);
            }}
          >
            <Text style={s.buttonText}>{capturing ? "Đang chụp…" : "Chụp khuôn mặt"}</Text>
          </TouchableOpacity>
          <Text style={s.note}>
            Chụp thành công sẽ quay về trang đăng ký để xem ảnh và bấm Gửi mẫu.
            Chọn nơi đủ sáng và giữ đầu thẳng.
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
  ovalReady: { borderColor: "#6EE7B7", borderWidth:4 },
  ovalAdjust: { borderColor: "#FBBF24", borderWidth:4 },
  statusBanner: { position:'absolute',top:14,left:12,right:12,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',gap:12 },
  statusReady: { backgroundColor:'rgba(6,78,59,0.94)',borderColor:'#6EE7B7',borderWidth:1 },
  statusAdjust: { backgroundColor:'rgba(66,42,6,0.94)',borderColor:'#FBBF24',borderWidth:1 },
  statusIcon: { color:'#FFFFFF',fontSize:28,fontWeight:'700' },
  statusTitle: { color:'#FFFFFF',fontSize:18,fontWeight:'700',flex:1 },
  checks: { flexDirection:'row',justifyContent:'center',gap:12,flexWrap:'wrap' },
  check: { color:'#FBBF24',fontSize:13,backgroundColor:'#1E293B',padding:8,borderRadius:10 },
  checkReady: { color:'#6EE7B7' },
  countdown: { position:"absolute", top:"40%", alignSelf:"center", fontSize:72, fontWeight:"700", color:"#FFFFFF", textShadowColor:"#000000", textShadowRadius:8 },
  controls: { padding: 24, gap: 16 },
  message: {
    color: "#DEEAF1",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 29,
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
