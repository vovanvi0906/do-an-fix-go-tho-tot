/**
 * Mock Order API Service
 * Giả lập API chẩn đoán sự cố thiết bị qua AI Computer Vision
 */

// Cờ kiểm thử cho trường hợp độ tin cậy thấp (< 0.6)
export let MOCK_LOW_CONFIDENCE = false;

export const setMockLowConfidence = (val) => {
  MOCK_LOW_CONFIDENCE = Boolean(val);
};

/**
 * Giả lập chẩn đoán hình ảnh sự cố
 * @param {File|Blob|string} file - File ảnh sự cố hoặc URL
 * @returns {Promise<{ suggestedCategoryId: string|null, categoryName: string|null, confidence: number, detectedLabels: string[], estimatedPrice: number|null }>}
 */
export async function diagnoseImage(file) {
  // Delay ngẫu nhiên từ 500ms đến 900ms bằng setTimeout bọc trong Promise
  const delay = Math.floor(Math.random() * (900 - 500 + 1)) + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (MOCK_LOW_CONFIDENCE) {
    return {
      suggestedCategoryId: null,
      categoryName: null,
      confidence: 0.35,
      detectedLabels: ['vật thể không xác định', 'ảnh mờ hoặc thiếu sáng'],
      estimatedPrice: null,
    };
  }

  return {
    suggestedCategoryId: 'electric-01',
    categoryName: 'Sửa chữa điện dân dụng',
    confidence: 0.87,
    detectedLabels: ['ổ cắm cháy', 'dây điện hở'],
    estimatedPrice: 200000,
  };
}

export default {
  diagnoseImage,
  MOCK_LOW_CONFIDENCE,
  setMockLowConfidence,
};
