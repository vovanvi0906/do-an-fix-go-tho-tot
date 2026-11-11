import { apiClient } from './apiClient';

/**
 * Service xác thực khuôn mặt thợ với Backend & AI Service
 */
export const faceService = {
  /**
   * Upload ảnh selfie chụp trực tiếp và gửi xác thực khuôn mặt với ảnh hồ sơ
   * @param {string} orderId - ID đơn hàng cần check-in
   * @param {string} imageUri - URI ảnh selfie từ Camera/Picker trên mobile
   */
  async verifyWorkerFace(orderId, imageUri) {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'selfie.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    });

    console.log(`📸 [FaceService] Gửi ảnh selfie kiểm tra khuôn mặt cho Order #${orderId}`);

    return apiClient.post(`/orders/${orderId}/face-verify-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Xác thực khuôn mặt qua URL ảnh đã có sẵn
   */
  async verifyFaceByUrl(orderId, photoUrl) {
    return apiClient.post(`/orders/${orderId}/face-verify`, { photoUrl });
  },
};
