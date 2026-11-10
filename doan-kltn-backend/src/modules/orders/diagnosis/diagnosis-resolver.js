import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

// Triệu chứng do khách xác nhận; slug phải khớp chính xác catalog đang hoạt động.
export const SYMPTOM_RULES = {
  'dien-lanh': [
    ['ac_leak', 'Máy lạnh chảy nước', 'sua-may-lanh-chay-nuoc'],
    ['ac_weak', 'Máy lạnh không lạnh / lạnh yếu', 'kiem-tra-may-lanh-khong-lanh-hoac-lanh-yeu'],
    ['fridge_weak', 'Tủ lạnh không lạnh', 'sua-tu-lanh-khong-lanh'],
    ['washer_spin', 'Máy giặt không vắt', 'sua-may-giat-khong-vat'],
  ],
  'thiet-bi': [
    ['stove_power', 'Bếp không lên nguồn', 'sua-bep-khong-len-nguon'],
    ['stove_heat', 'Bếp không nóng / nóng yếu', 'sua-bep-khong-nong-nong-yeu'],
    ['heater_heat', 'Bình nóng lạnh không nóng', 'sua-binh-khong-nong'],
  ],
  'sua-nuoc': [
    ['toilet_flush', 'Bồn cầu xả yếu', 'sua-bon-cau-xa-yeu'],
    ['pump_power', 'Bơm không chạy', 'sua-bom-khong-chay'],
  ],
  'sua-dien': [
    ['switch_power', 'Công tắc không hoạt động', 'sua-cong-tac-khong-hoat-dong'],
    ['wire_damage', 'Dây điện cũ / xuống cấp', 'thay-day-cu-xuong-cap'],
  ],
};

export async function resolveDiagnosis(prisma, aiClient, input) {
  const { imageUrl, description = '', answers = {} } = input;
  if (typeof imageUrl !== 'string' || !imageUrl.trim() || typeof description !== 'string' ||
      !answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new BadRequestException('Dữ liệu chẩn đoán không hợp lệ');
  }
  for (const key of Object.keys(answers)) {
    if (!['categoryId', 'serviceId', 'symptom'].includes(key) || typeof answers[key] !== 'string') {
      throw new BadRequestException('Câu trả lời không hợp lệ');
    }
  }
  if (answers.serviceId && answers.symptom) throw new BadRequestException('Chỉ chọn một dịch vụ hoặc một triệu chứng');
  if ((answers.serviceId || answers.symptom) && !answers.categoryId) {
    throw new BadRequestException('Vui lòng chọn danh mục trước');
  }
  const categories = await prisma.serviceCategory.findMany({ where: { isActive: true } });
  const result = {
    requestId: randomUUID(), status: 'manual_selection', source: 'manual',
    imageUrl, confidence: null, modelScore: null, detectedLabels: [],
    suggestedCategoryId: null, suggestedCategoryName: null,
    suggestedServiceId: null, suggestedServiceName: null, suggestedServiceConfidence: null,
    estimatedPriceMin: null, estimatedPriceMax: null, estimatedPriceRange: null,
    category: null, service: null, priceEstimate: null,
    requiresManualSelection: true, questions: [], availableServices: [],
    availableCategories: categories.map(c => ({ id: c.id, name: c.name, basePrice: Number(c.basePrice) })),
    issueDescription: description, reason: 'category_required',
    message: 'Vui lòng chọn danh mục và dịch vụ phù hợp.',
  };
  let category;
  if (answers.categoryId) {
    category = categories.find(c => c.id === answers.categoryId);
    if (!category) throw new BadRequestException('Danh mục không khả dụng');
  } else {
    const ai = await aiClient.diagnoseIncident(imageUrl, description);
    const score = typeof ai.confidence === 'number' && Number.isFinite(ai.confidence) &&
      ai.confidence >= 0 && ai.confidence <= 1 ? ai.confidence : null;
    if (ai.engine !== 'model') {
      return { ...result, status: 'unavailable', source: 'unavailable', reason: 'ai_unavailable',
        message: 'AI chưa khả dụng. Bạn có thể chọn dịch vụ thủ công.' };
    }
    result.source = 'model';
    result.confidence = result.modelScore = score;
    if (score !== null && score >= (aiClient.confidenceThreshold ?? 0.6)) {
      category = categories.find(c => c.slug === ai.suggestedCategoryId || c.id === ai.suggestedCategoryId);
    }
    if (!category) return { ...result, reason: 'image_uncertain', message: 'Chưa xác định được nhóm. Vui lòng chọn danh mục.' };
    // Nhãn nhóm không đồng nghĩa đã phát hiện nguyên nhân hỏng.
    result.detectedLabels = [category.name];
  }
  const services = await prisma.service.findMany({
    where: { categoryId: category.id, isActive: true }, orderBy: { name: 'asc' },
  });
  const rules = (SYMPTOM_RULES[category.slug] ?? []).filter(rule => services.some(s => s.slug === rule[2]));
  Object.assign(result, {
    category: { id: category.id, slug: category.slug, name: category.name },
    suggestedCategoryId: category.id, suggestedCategoryName: category.name,
    status: 'needs_more_info', reason: 'symptom_required',
    message: 'Xác nhận triệu chứng hoặc chọn dịch vụ bên dưới. Ảnh chưa xác định được nguyên nhân hỏng.',
    availableServices: services.map(s => ({ id: s.id, name: s.name, basePrice: Number(s.basePrice), unit: s.unit })),
    questions: rules.length ? [{ id: 'symptom', label: 'Thiết bị đang gặp tình trạng nào?',
      options: rules.map(([value, label]) => ({ value, label })) }] : [],
  });
  let service;
  if (answers.serviceId) {
    service = services.find(s => s.id === answers.serviceId);
    if (!service) throw new BadRequestException('Dịch vụ không thuộc danh mục hoặc đã ngừng hoạt động');
    result.source = 'manual';
  } else if (answers.symptom) {
    const rule = rules.find(r => r[0] === answers.symptom);
    if (!rule) throw new BadRequestException('Triệu chứng không được hỗ trợ trong danh mục');
    service = services.find(s => s.slug === rule[2]);
    result.source = 'rules';
  }
  if (!service) return result;
  const min = Number(service.basePrice);
  const max = service.maxPrice == null ? null : Number(service.maxPrice);
  return {
    ...result, status: 'suggested', reason: result.source === 'rules' ? 'symptom_confirmed' : 'customer_selected',
    requiresManualSelection: false, questions: [],
    service: { id: service.id, slug: service.slug, name: service.name, unit: service.unit },
    suggestedServiceId: service.id, suggestedServiceName: service.name,
    estimatedPriceMin: min, estimatedPriceMax: max,
    priceEstimate: { min, max, unit: service.unit },
    estimatedPriceRange: { min, max, unit: service.unit,
      formatted: max == null ? `Từ ${min.toLocaleString('vi-VN')} đ` : `${min.toLocaleString('vi-VN')} đ ~ ${max.toLocaleString('vi-VN')} đ` },
    message: 'Dịch vụ theo thông tin bạn xác nhận. Giá tham khảo; thợ kiểm tra và báo giá thực tế.',
  };
}
