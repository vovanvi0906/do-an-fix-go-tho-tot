/**
 * AI Service Heuristic Fallback Helper (<= 100 dòng)
 */
export function getFallbackDiagnosis() {
  return { status: 'unavailable', engine: 'unavailable', confidence: null,
    suggestedCategoryId: null, suggestedServiceId: null, detectedLabels: [],
    notes: 'AI chưa khả dụng. Vui lòng chọn dịch vụ thủ công.' };
}

export function getFallbackCompare(afterImageUrl = '') {
  const isDirty = afterImageUrl.includes('chua_xong') || afterImageUrl.includes('dirty');
  return {
    matchScore: isDirty ? 0.55 : 0.92,
    passed: !isDirty,
    notes: isDirty ? 'Chưa đạt chuẩn nghiệm thu: Vẫn còn vết bẩn hoặc linh kiện chưa hoàn tất' : 'Nghiệm thu đạt chuẩn: Xử lý triệt để và vệ sinh sạch sẽ',
  };
}

export function getFallbackFaceVerify() {
  return { verified: false, confidence: null, status: 'TECHNICAL_ERROR',
    reason: 'AI_UNAVAILABLE', engine: 'unavailable', method: 'none' };
}
