import { apiClient } from '../../../services/api/apiClient';
import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const useFaceVerification = (orderId, onSuccess, mode = 'daily') => {
  const lock = useRef(false);
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
      const response = await apiClient.get('/workers/me/face/status', { signal: controller.signal });
      if (attempt === generation.current) setStatus(response.data || response);
    } catch (error) {
      if (attempt === generation.current && !controller.signal.aborted) setStatusError('Không tải được trạng thái xác thực. Kiểm tra kết nối rồi thử lại.');
    } finally {
      if (attempt === generation.current) setLoadingStatus(false);
    }
  }, []);
  const cancel = useCallback(() => {
    ++generation.current; pending.current?.abort();
    lock.current = false; setIsAnalyzing(false); setLoadingStatus(false);
    setImageUri(null); setResult(null); setShowModal(false); setStatus(null);
  }, []);
  useEffect(() => {
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh(); else cancel();
    });
    return () => { ++generation.current; pending.current?.abort(); listener.remove(); };
  }, [refresh, cancel, orderId, mode]);

  const report = useCallback(message => {
    setResult({ verified: false, message }); setShowModal(true);
  }, []);
  const takeSelfie = useCallback(async () => {
    // There is no session/capture contract yet. Do not collect images while blocked.
    if (!(orderId ? status?.canVerifyOrder : status?.canVerifyDaily)) {
      report('Xác thực chưa sẵn sàng. Vui lòng kiểm tra trạng thái đăng ký khuôn mặt.'); return;
    }
    const attempt = generation.current;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (attempt !== generation.current) return;
      if (!permission.granted) { report('Cần quyền camera. Bạn có thể cấp quyền trong cài đặt rồi thử lại.'); return; }
      const capture = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, allowsEditing: false, quality: .8 });
      if (attempt === generation.current && !capture.canceled && capture.assets?.[0]?.uri) setImageUri(capture.assets[0].uri);
    } catch (_) { if (attempt === generation.current) report('Không mở được camera. Vui lòng thử lại.'); }
  }, [status, orderId, report]);

  const verify = useCallback(async () => {
    if (lock.current) return;
    lock.current = true; setIsAnalyzing(true);
    const attempt = generation.current;
    try {
      await refresh();
      // Reading a status/timestamp is never a new biometric session or order proof.
      if (generation.current === attempt + 1) report('Chưa thể xác thực lúc này. Đăng ký khuôn mặt cần được kiểm tra trước khi bắt đầu ca hoặc công việc.');
    } finally { lock.current = false; setIsAnalyzing(false); }
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
  const reset = useCallback(() => { setShowModal(false); setResult(null); setImageUri(null); }, []);
  return { imageUri, isAnalyzing, result, showModal, status, statusError, loadingStatus,
    takeSelfie, verify, preflight, refresh, cancel, reset };
};
