import * as Crypto from 'expo-crypto';
import { isCurrentFaceProof } from '../services/proof';
import { apiClient } from '../../../services/api/apiClient';
import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const useFaceVerification = (orderId, onSuccess, mode = 'daily') => {
  const lock = useRef(false);
  const captureSession = useRef(null);
  const nativeCameraOpen = useRef(false);
  const nativeCameraSuspended = useRef(false);
  const requestKey = useRef(null);
  const generation = useRef(0);
  const pending = useRef(null);
  const [imageUri, setImageUri] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(true);

  const refresh = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const attempt = ++generation.current;
    lock.current = false; setIsAnalyzing(false);
    setStatus(null); setStatusError(''); setLoadingStatus(true); setImageUri(null);
    setResult(null); setShowModal(false);
    try {
      const response = await apiClient.get('/workers/me/face/status', { signal: controller.signal, ...(orderId ? { params: { orderId } } : {}) });
      if (attempt === generation.current) setStatus(response.data || response);
    } catch (error) {
      if (attempt === generation.current && !controller.signal.aborted) setStatusError('Không tải được trạng thái xác thực. Kiểm tra kết nối rồi thử lại.');
    } finally {
      if (attempt === generation.current) setLoadingStatus(false);
    }
  }, [orderId]);
  const cancel = useCallback(() => {
    ++generation.current; pending.current?.abort(); captureSession.current = null; requestKey.current = null;
    lock.current = false; setIsAnalyzing(false); setLoadingStatus(false);
    setImageUri(null); setResult(null); setShowModal(false); setStatus(null);
  }, []);
  useEffect(() => {
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        if (nativeCameraSuspended.current) { nativeCameraSuspended.current = false; return; }
        if (!nativeCameraOpen.current) refresh();
      } else if (nativeCameraOpen.current) nativeCameraSuspended.current = true;
      else cancel();
    });
    return () => { ++generation.current; pending.current?.abort(); listener.remove(); };
  }, [refresh, cancel, orderId, mode]);

  const report = useCallback(message => {
    setResult({ verified: false, message }); setShowModal(true);
  }, []);
  const takeSelfie = useCallback(async () => {
    if (lock.current) return;
    // Capture begins only after an authenticated, scoped backend session.
    if (!(mode === 'enrollment' ? status?.canEnroll : orderId ? status?.canVerifyOrder : status?.canVerifyDaily)) {
      report('Xác thực chưa sẵn sàng. Vui lòng kiểm tra trạng thái đăng ký khuôn mặt.'); return;
    }
    const attempt = generation.current;
    lock.current = true; nativeCameraOpen.current = true; setIsAnalyzing(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (attempt !== generation.current) return;
      if (!permission.granted) { report('Cần quyền camera. Bạn có thể cấp quyền trong cài đặt rồi thử lại.'); return; }
      const purpose = mode === 'enrollment' ? 'ENROLLMENT' : orderId ? 'ORDER' : 'DAILY';
      if (captureSession.current && Date.parse(captureSession.current.expiresAt) <= Date.now()) { captureSession.current = null; requestKey.current = null; }
      if (!captureSession.current) {
        requestKey.current ||= Crypto.randomUUID();
        const controller = new AbortController(); pending.current = controller;
        const response = await apiClient.post('/workers/me/face/sessions', { purpose, requestKey: requestKey.current, ...(orderId && purpose === 'ORDER' ? { orderId } : {}) }, { signal: controller.signal });
        if (attempt !== generation.current) return;
        const session = response.data || response;
        if (!session.id || !session.nonce || session.purpose !== purpose || (session.orderId || null) !== (purpose === 'ORDER' ? orderId : null) || !(Date.parse(session.expiresAt) > Date.now())) throw new Error('INVALID_SESSION');
        captureSession.current = session;
      }
      const capture = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, allowsEditing: false, quality: .8 });
      if (attempt === generation.current && !capture.canceled && capture.assets?.[0]?.uri) setImageUri(capture.assets[0].uri);
    } catch (_) { if (attempt === generation.current) report('Chưa tạo được phiên hoặc mở camera. Kiểm tra kết nối và thử lại.'); }
    finally { nativeCameraOpen.current = false; if (attempt === generation.current) { lock.current = false; setIsAnalyzing(false); } }
  }, [status, orderId, mode, report]);

  const verify = useCallback(async () => {
    if (lock.current) return;
    const session = captureSession.current;
    if (!session || !imageUri || Date.parse(session.expiresAt) <= Date.now()) { report('Phiên xác thực chưa sẵn sàng hoặc đã hết hạn. Vui lòng chụp lại.'); return; }
    lock.current = true; setIsAnalyzing(true);
    const attempt = generation.current, controller = new AbortController(); pending.current = controller;
    try {
      const form = new FormData(); form.append('nonce', session.nonce);
      if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) form.append('image', await (await fetch(imageUri)).blob(), 'capture.jpg');
      else if (/^(file|content):/.test(imageUri)) form.append('image', { uri: imageUri, name: 'capture.jpg', type: 'image/jpeg' });
      else throw new Error('LOCAL_CAPTURE_REQUIRED');
      const response = await apiClient.post(`/workers/me/face/sessions/${session.id}/capture`, form, { signal: controller.signal, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 });
      if (attempt !== generation.current) return;
      const outcome = response.data || response;
      const statusResponse = await apiClient.get('/workers/me/face/status', { signal: controller.signal, ...(orderId ? { params: { orderId } } : {}) });
      if (attempt !== generation.current) return;
      const current = statusResponse.data || statusResponse; setStatus(current);
      let result;
      if (mode === 'enrollment') {
        if (!outcome.enrolled || current.enrollmentStatus !== 'ENROLLED' || current.templateVersion !== session.templateVersion) throw new Error('ENROLLMENT_NOT_CONFIRMED');
        result = { enrolled: true, verified: false, message: 'Máy chủ đã lưu đăng ký khuôn mặt. Check-in đầu ca và xác thực công việc cần thực hiện riêng.' };
      } else {
        const proof = orderId ? current.orderProof : current.dailyProof;
        if (!outcome.verified || outcome.proof?.id !== proof?.id || proof?.templateVersion !== session.templateVersion || !isCurrentFaceProof(proof, orderId ? 'ORDER' : 'DAILY', orderId || null)) throw new Error('PROOF_NOT_CONFIRMED');
        result = { verified: true, proof, message: orderId ? 'Máy chủ đã xác nhận bằng chứng riêng cho công việc này.' : 'Máy chủ đã xác nhận check-in đầu ca.' };
      }
      captureSession.current = null; requestKey.current = null;
      setResult(result); setShowModal(true); setImageUri(null);
      onSuccess?.(result);
    } catch (_) { if (attempt === generation.current && !controller.signal.aborted) report('Chưa xác thực được. Kiểm tra kết nối, ánh sáng và thử lại; phiên hết hạn cần chụp lại.'); }
    finally { if (attempt === generation.current) { lock.current = false; setIsAnalyzing(false); } }
  }, [imageUri, mode, orderId, report, onSuccess]);

  const recordConsent = useCallback(async consent => {
    if (consent !== true || !status?.requiredConsentVersion || lock.current) return;
    lock.current = true; setIsAnalyzing(true);
    const attempt = generation.current, controller = new AbortController(); pending.current = controller;
    try {
      await apiClient.post('/workers/me/face/consent', { consent: true, version: status.requiredConsentVersion }, { signal: controller.signal });
      if (attempt === generation.current) await refresh();
    } catch (_) { if (attempt === generation.current && !controller.signal.aborted) report('Chưa lưu được đồng ý sử dụng dữ liệu. Vui lòng thử lại.'); }
    finally { if (attempt === generation.current) { lock.current = false; setIsAnalyzing(false); } }
  }, [status, refresh, report]);
  const withdraw = useCallback(async () => {
    if (lock.current) return;
    lock.current = true; setIsAnalyzing(true);
    const attempt = generation.current, controller = new AbortController(); pending.current = controller;
    try {
      await apiClient.delete('/workers/me/face/template', { signal: controller.signal });
      if (attempt === generation.current) {
        const refreshPromise = refresh(); const refreshGeneration = generation.current;
        await refreshPromise;
        if (generation.current === refreshGeneration) report('Đã thu hồi đồng ý, xóa mẫu mã hóa và vô hiệu hóa bằng chứng xác thực.');
      }
    } catch (_) { if (attempt === generation.current && !controller.signal.aborted) report('Chưa xóa được đăng ký. Kiểm tra kết nối rồi thử lại.'); }
    finally { if (generation.current === attempt || generation.current === attempt + 1) { lock.current = false; setIsAnalyzing(false); } }
  }, [refresh, report]);

  const preflight = useCallback(async consent => {
    if (lock.current) return;
    if (consent !== true) { report('Vui lòng xác nhận đồng ý trước khi kiểm tra điều kiện.'); return; }
    lock.current = true; setIsAnalyzing(true);
    const attempt = generation.current;
    const controller = new AbortController(); pending.current?.abort(); pending.current = controller;
    try {
      const response = await apiClient.post(`/workers/me/face/${mode === 'reset' ? 'reset' : 'enrollment'}/preflight`, { consent: true }, { signal: controller.signal });
      if (attempt !== generation.current) return;
      const data = response.data || response;
      setStatus(data);
      report('Chưa tiếp nhận đăng ký hoặc cấp lại khuôn mặt. Vui lòng liên hệ hỗ trợ để được hướng dẫn; chưa có ảnh hay yêu cầu duyệt nào được lưu.');
    } catch (_) {
      if (attempt === generation.current && !controller.signal.aborted) report('Không kiểm tra được điều kiện. Kiểm tra kết nối rồi thử lại.');
    } finally { if (attempt === generation.current) { lock.current = false; setIsAnalyzing(false); } }
  }, [mode, report]);
  const reset = useCallback(() => {
    if (captureSession.current && Date.parse(captureSession.current.expiresAt) <= Date.now()) { captureSession.current = null; requestKey.current = null; setImageUri(null); }
    // Preserve request key/session/capture for an idempotent retry after network failure.
    setShowModal(false); setResult(null);
  }, []);
  return { imageUri, isAnalyzing, result, showModal, status, statusError, loadingStatus,
    takeSelfie, verify, recordConsent, withdraw, preflight, refresh, cancel, reset };
};
