import { apiClient } from '../../../services/api/apiClient';
import { hasShiftVerification } from '../../auth/services/workerEligibility';
import { useState, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const useFaceVerification = (orderId, onSuccess) => {
  const lock = useRef(false);
  const [imageUri, setImageUri] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const takeSelfie = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert('Vui lòng cấp quyền truy cập Camera để xác thực khuôn mặt');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
    }
  }, []);

  const pickImage = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImageUri(res.assets[0].uri);
    }
  }, []);

  const verify = useCallback(async () => {
    if (!imageUri || lock.current) return;
    lock.current = true;
    try {
      setIsAnalyzing(true);
      if (orderId) throw new Error('Backend chưa cung cấp bằng chứng xác thực riêng cho đơn hàng. Vui lòng liên hệ hỗ trợ.');
      const form = new FormData();
      if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
        form.append('image', await (await fetch(imageUri)).blob(), 'selfie.jpg');
      } else {
        form.append('image', { uri: imageUri, name: 'selfie.jpg', type: 'image/jpeg' });
      }
      await apiClient.post('/workers/verify-face-daily', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      const response = await apiClient.get('/workers/me');
      const profile = response.data || response;
      if (!hasShiftVerification(profile)) throw new Error('Máy chủ chưa xác nhận check-in');
      const res = { verified: true, message: 'Check-in đầu ca đã được máy chủ xác nhận' };
      setResult(res.data || res);
      setShowModal(true);
      if ((res.data?.verified || res.verified) && onSuccess) {
        onSuccess(res.data || res);
      }
    } catch (err) {
      setResult({
        verified: false,
        confidence: 0,
        message: err.response?.data?.message || err.message || 'Lỗi kết nối AI Service',
      });
      setShowModal(true);
    } finally {
      lock.current = false;
      setIsAnalyzing(false);
    }
  }, [imageUri, orderId, onSuccess]);

  const reset = useCallback(() => {
    setShowModal(false);
    setResult(null);
  }, []);

  return {
    imageUri,
    isAnalyzing,
    result,
    showModal,
    takeSelfie,
    pickImage,
    verify,
    reset,
  };
};
