import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { faceService } from '../../../services/api/faceService';

export const useFaceVerification = (orderId, onSuccess) => {
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
    if (!imageUri) return;
    try {
      setIsAnalyzing(true);
      const res = await faceService.verifyWorkerFace(orderId, imageUri);
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
