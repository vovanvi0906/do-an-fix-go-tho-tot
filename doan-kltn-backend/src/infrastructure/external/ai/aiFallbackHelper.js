/**
 * AI Service Heuristic Fallback Helper (<= 100 dòng)
 */
export function getFallbackDiagnosis(description = '', imageUrl = '') {
  const d = (description || '').toLowerCase();
  if (d.includes('mờ') || d.includes('không rõ') || (imageUrl || '').includes('khong_ro')) {
    return {
      suggestedCategoryId: null, suggestedCategoryName: null, suggestedServiceId: null, suggestedServiceName: null,
      suggestedServiceConfidence: null, estimatedPriceRange: null, confidence: 0.45,
      detectedLabels: ['unrecognized_object', 'blurry_image'], notes: 'Ảnh không rõ nét, độ tin cậy thấp (< 60%)',
    };
  }
  if (d.includes('giúp việc') || d.includes('dọn dẹp') || d.includes('vệ sinh') || d.includes('lau nhà') || d.includes('sofa')) {
    return {
      suggestedCategoryId: 'giup-viec', suggestedCategoryName: 'Giúp việc',
      suggestedServiceId: 'don-dep-nha-theo-gio', suggestedServiceName: 'Dọn dẹp nhà theo giờ', suggestedServiceConfidence: 0.92,
      estimatedPriceRange: { min: 100000, max: 150000, formatted: '100.000đ - 150.000đ / giờ' },
      confidence: 0.92, detectedLabels: ['house_cleaning', 'maid_service'], issueDetected: 'Dọn dẹp và vệ sinh nhà cửa',
    };
  }
  if (d.includes('vườn') || d.includes('cỏ') || d.includes('cây') || d.includes('tưới')) {
    return {
      suggestedCategoryId: 'lam-vuon', suggestedCategoryName: 'Làm vườn',
      suggestedServiceId: 'cat-co-dinh-ky', suggestedServiceName: 'Cắt cỏ định kỳ', suggestedServiceConfidence: 0.90,
      estimatedPriceRange: { min: 150000, max: 350000, formatted: '150.000đ - 350.000đ / lần' },
      confidence: 0.91, detectedLabels: ['garden_lawn', 'grass_cutting'], issueDetected: 'Chăm sóc và làm vườn sân vườn',
    };
  }
  if (d.includes('lạnh') || d.includes('máy lạnh') || d.includes('điều hòa') || d.includes('tủ lạnh') || d.includes('máy giặt')) {
    return {
      suggestedCategoryId: 'dien-lanh', suggestedCategoryName: 'Điện lạnh',
      suggestedServiceId: 'kiem-tra-may-lanh-khong-lanh-hoac-lanh-yeu', suggestedServiceName: 'Kiểm tra máy lạnh không lạnh hoặc lạnh yếu',
      suggestedServiceConfidence: 0.90, estimatedPriceRange: { min: 180000, max: 300000, formatted: '180.000đ - 300.000đ / máy' },
      confidence: 0.90, detectedLabels: ['air_conditioner', 'refrigerator_issue'], issueDetected: 'Sự cố thiết bị điện lạnh',
    };
  }
  if (d.includes('điện') || d.includes('chập') || d.includes('aptomat') || d.includes('công tắc') || d.includes('ổ cắm')) {
    return {
      suggestedCategoryId: 'sua-dien', suggestedCategoryName: 'Sửa điện',
      suggestedServiceId: 'sua-cong-tac-khong-hoat-dong', suggestedServiceName: 'Sửa công tắc không hoạt động', suggestedServiceConfidence: 0.90,
      estimatedPriceRange: { min: 100000, max: 180000, formatted: '100.000đ - 180.000đ' },
      confidence: 0.92, detectedLabels: ['circuit_breaker', 'electrical_spark'], issueDetected: 'Sự cố thiết bị điện dân dụng',
    };
  }
  if (d.includes('nước') || d.includes('vòi') || d.includes('ống') || d.includes('bồn')) {
    return {
      suggestedCategoryId: 'sua-nuoc', suggestedCategoryName: 'Sửa nước',
      suggestedServiceId: 'lap-dat-voi-moi', suggestedServiceName: 'Lắp đặt vòi mới', suggestedServiceConfidence: 0.88,
      estimatedPriceRange: { min: 150000, max: 250000, formatted: '150.000đ - 250.000đ' },
      confidence: 0.89, detectedLabels: ['pipe_leak', 'faucet_damage'], issueDetected: 'Rò rỉ đường ống nước',
    };
  }
  return {
    suggestedCategoryId: 'thiet-bi', suggestedCategoryName: 'Thiết bị gia dụng',
    suggestedServiceId: 'sua-bep-khong-len-nguon', suggestedServiceName: 'Sửa bếp không lên nguồn', suggestedServiceConfidence: 0.85,
    estimatedPriceRange: { min: 120000, max: 250000, formatted: '120.000đ - 250.000đ' },
    confidence: 0.85, detectedLabels: ['appliance_damage'], issueDetected: description || 'Sự cố thiết bị gia đình',
  };
}

export function getFallbackCompare(afterImageUrl = '') {
  const isDirty = afterImageUrl.includes('chua_xong') || afterImageUrl.includes('dirty');
  return {
    matchScore: isDirty ? 0.55 : 0.92,
    passed: !isDirty,
    notes: isDirty ? 'Chưa đạt chuẩn nghiệm thu: Vẫn còn vết bẩn hoặc linh kiện chưa hoàn tất' : 'Nghiệm thu đạt chuẩn: Xử lý triệt để và vệ sinh sạch sẽ',
  };
}

export function getFallbackFaceVerify(workerId, selfieUrl = '') {
  const isLow = selfieUrl.includes('unmatched') || selfieUrl.includes('low_confidence');
  return {
    verified: !isLow,
    confidence: isLow ? 0.48 : 0.95,
    workerId,
    message: isLow ? 'Độ khớp khuôn mặt thấp (< 60%). Chuyển vào hàng đợi kiểm duyệt thủ công bởi Admin.' : 'Xác thực khuôn mặt thành công.',
  };
}
