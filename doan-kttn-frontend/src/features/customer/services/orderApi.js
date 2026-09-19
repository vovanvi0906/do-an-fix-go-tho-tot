import apiClient from '../../../services/api/client';
import { diagnoseImage as mockDiagnoseImage } from './mockOrderApi';

/**
 * Lớp API chẩn đoán sự cố cho luồng đặt đơn hàng (Customer Order Flow)
 * Hỗ trợ chuyển đổi linh hoạt giữa Mock API và Real API qua cờ VITE_USE_MOCK_API.
 */

/**
 * Chẩn đoán hình ảnh sự cố
 * @param {File|Blob|string} file - File ảnh sự cố hoặc URL ảnh
 * @returns {Promise<{ suggestedCategoryId: string|null, categoryName: string|null, confidence: number, detectedLabels: string[], estimatedPrice: number|null }>}
 */
export async function diagnoseImage(file) {
  const isMock = String(import.meta.env.VITE_USE_MOCK_API).toLowerCase() === 'true';

  if (isMock) {
    return mockDiagnoseImage(file);
  }

  // Gọi API thật thông qua axios instance đã cấu hình sẵn
  const formData = new FormData();
  if (file instanceof File || file instanceof Blob) {
    formData.append('file', file);
  } else if (typeof file === 'string') {
    formData.append('imageUrl', file);
  }

  const response = await apiClient.post('/orders/diagnose', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = response.data || response;

  return {
    suggestedCategoryId: data.suggestedCategoryId || null,
    categoryName: data.suggestedCategoryName || data.categoryName || null,
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    detectedLabels: Array.isArray(data.detectedLabels) ? data.detectedLabels : [],
    estimatedPrice: data.estimatedPrice || data.estimatedPriceMin || null,
  };
}

export default {
  diagnoseImage,
};
