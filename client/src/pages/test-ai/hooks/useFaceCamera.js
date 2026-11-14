import { useCallback, useEffect, useRef, useState } from 'react';
import { assessGeometry, pixelQuality, stableProgress } from '../utils/faceQuality';

const initial = { ok: false, message: 'Bật camera để bắt đầu', faces: null, brightness: null, sharpness: null, progress: 0 };
const cameraMessage = error => error.name === 'NotAllowedError' ? 'Quyền camera bị từ chối. Cho phép camera trong cài đặt trang rồi thử lại.' : error.name === 'NotFoundError' ? 'Không tìm thấy camera trên thiết bị.' : error.name === 'NotReadableError' ? 'Camera đang được ứng dụng khác sử dụng.' : 'Không mở được camera hoặc tải model quét mặt. Thử lại; nếu thiếu model, chạy npm run face:setup trong client.';

export function useFaceCamera() {
  const video = useRef(null), stream = useRef(null), detector = useRef(null), raf = useRef(null);
  const lifecycle = useRef(0), lastTick = useRef(0), since = useRef(null);
  const snapLock = useRef(false), shotUrl = useRef(null);
  const [status, setStatus] = useState('off'), [error, setError] = useState('');
  const [quality, setQuality] = useState(initial), [shot, setShot] = useState(null);
  const [automatic, setAutomatic] = useState(true);
  const settings = useRef({ automatic, shot, paused: false });
  settings.current = { ...settings.current, automatic, shot };

  const clearShot = useCallback(() => {
    if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
    shotUrl.current = null; setShot(null); settings.current.shot = null; since.current = null;
  }, []);
  const stop = useCallback(() => {
    lifecycle.current++;
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    detector.current?.close(); detector.current = null;
    if (video.current) video.current.srcObject = null;
    since.current = null; lastTick.current = 0;
    setStatus('off'); setQuality(initial);
  }, []);

  const take = useCallback(async () => {
    const v = video.current;
    if (!v?.videoWidth || snapLock.current || settings.current.paused || settings.current.shot) return;
    snapLock.current = true;
    const generation = lifecycle.current;
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
      canvas.width = Math.round(v.videoWidth * scale); canvas.height = Math.round(v.videoHeight * scale);
      canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
      if (!blob || blob.size > 5 * 1024 * 1024) throw Error('Không chụp được ảnh hợp lệ.');
      if (generation !== lifecycle.current) return;
      const value = { blob, url: URL.createObjectURL(blob), at: Date.now() };
      if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
      shotUrl.current = value.url; settings.current.shot = value; setShot(value); since.current = null;
    } catch (e) { setError(e.message); } finally { snapLock.current = false; }
  }, []);

  const start = useCallback(async () => {
    stop(); setError(''); setStatus('starting');
    const generation = lifecycle.current;
    let opened, loaded;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Error('Camera requires secure context');
      opened = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (generation !== lifecycle.current) { opened.getTracks().forEach(track => track.stop()); return; }
      stream.current = opened;
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const files = await FilesetResolver.forVisionTasks('/test-face-assets');
      const options = delegate => ({ baseOptions: { modelAssetPath: '/test-face-assets/blaze_face_short_range.tflite', delegate }, runningMode: 'VIDEO', minDetectionConfidence: .6 });
      try { loaded = await FaceDetector.createFromOptions(files, options('GPU')); }
      catch { loaded = await FaceDetector.createFromOptions(files, options('CPU')); }
      if (generation !== lifecycle.current) { loaded.close(); opened.getTracks().forEach(track => track.stop()); return; }
      detector.current = loaded;
      video.current.srcObject = opened;
      await video.current.play();
      if (generation !== lifecycle.current) return;
      setStatus('live');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      function tick(now) {
        if (generation !== lifecycle.current) return;
        const v = video.current;
        if (v?.readyState >= 2 && !settings.current.paused && !settings.current.shot && now - lastTick.current >= 80) {
          const previousTick = lastTick.current;
          lastTick.current = now;
          try {
            const { detections } = detector.current.detectForVideo(v, now);
            let q = assessGeometry(detections, v.videoWidth, v.videoHeight);
            if (q.box) {
              const b = q.box;
              // Fixed capture-relative scale: sharpness thresholds change with resize.
              const scale = Math.min(1, 320 / b.width);
              canvas.width = Math.max(3, Math.round(b.width * scale)); canvas.height = Math.max(3, Math.round(b.height * scale));
              ctx.drawImage(v, b.originX, b.originY, b.width, b.height, 0, 0, canvas.width, canvas.height);
              const pixels = pixelQuality(ctx.getImageData(0, 0, canvas.width, canvas.height));
              q = { ...q, brightness: pixels.brightness, sharpness: pixels.sharpness, ok: q.ok && pixels.ok, message: q.ok ? pixels.message : q.message };
            }
            const stable = stableProgress(since.current, q, now, previousTick || null);
            since.current = stable.since;
            setQuality({ ...q, progress: stable.progress });
            if (stable.progress >= 1 && settings.current.automatic) void take();
          } catch {
            since.current = null;
            setQuality({ ...initial, message: 'Không đọc được khung hình. Tắt và bật lại camera.' });
          }
        } else if (settings.current.paused || settings.current.shot) since.current = null;
        raf.current = requestAnimationFrame(tick);
      }
      raf.current = requestAnimationFrame(tick);
    } catch (e) {
      opened?.getTracks().forEach(track => track.stop()); loaded?.close();
      if (generation !== lifecycle.current) return;
      stream.current = null; detector.current = null; setStatus('off'); setError(cameraMessage(e));
    }
  }, [stop, take]);

  useEffect(() => {
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('visibilitychange', hidden); stop(); if (shotUrl.current) URL.revokeObjectURL(shotUrl.current); };
  }, [stop]);
  return { video, status, quality, shot, error, automatic, setAutomatic, start, stop, take, clearShot,
    pause: value => { settings.current.paused = value; } };
}
