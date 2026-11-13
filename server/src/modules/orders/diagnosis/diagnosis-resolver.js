import { BadRequestException } from '@nestjs/common';
import { STATUS, DECISION_SOURCE, REASON_CODES } from './diagnosis-constants';
import { validateDiagnosisInput } from './diagnosis-input-validator';
import { createInitialResult } from './diagnosis-payload-builder';
import { buildSymptomOptions, SYMPTOM_RULES } from './symptom-taxonomy';
import { rankServices, formatPriceRange } from './service-ranker';

export { SYMPTOM_RULES };

async function resolveCategory(prisma, aiClient, input, result, categories) {
  const { answers = {}, imageUrl, description = '' } = input;
  if (answers.categoryId) {
    const category = categories.find((c) => c.id === answers.categoryId);
    if (!category) throw new BadRequestException('Danh mục không khả dụng');
    return { category, ai: null };
  }
  const ai = await aiClient.diagnoseIncident(imageUrl, description);
  const score = typeof ai.confidence === 'number' && Number.isFinite(ai.confidence) &&
    ai.confidence >= 0 && ai.confidence <= 1 ? ai.confidence : null;
  if (ai.engine !== 'model') {
    Object.assign(result, { status: STATUS.UNAVAILABLE, source: DECISION_SOURCE.UNAVAILABLE,
      decisionSource: DECISION_SOURCE.UNAVAILABLE, reason: REASON_CODES.AI_UNAVAILABLE,
      reasonCodes: [REASON_CODES.AI_UNAVAILABLE], message: 'AI chưa khả dụng. Bạn có thể chọn dịch vụ thủ công.' });
    return { category: null, ai };
  }
  result.source = DECISION_SOURCE.MODEL;
  result.decisionSource = DECISION_SOURCE.MODEL;
  result.confidence = result.modelScore = score;
  const threshold = aiClient.confidenceThreshold ?? 0.6;
  const category = (score !== null && score >= threshold)
    ? categories.find((c) => c.slug === ai.suggestedCategoryId || c.id === ai.suggestedCategoryId) : null;
  if (!category) {
    Object.assign(result, { reason: REASON_CODES.IMAGE_UNCERTAIN, reasonCodes: [REASON_CODES.IMAGE_UNCERTAIN],
      message: 'Chưa xác định được nhóm. Vui lòng chọn danh mục.' });
  } else {
    result.detectedLabels = [category.name];
    result.observableSigns = [`Nhận diện danh mục: ${category.name}`];
  }
  return { category, ai };
}

function resolveService(services, category, answers) {
  if (answers.serviceId) {
    const service = services.find((s) => s.id === answers.serviceId);
    if (!service) throw new BadRequestException('Dịch vụ không thuộc danh mục hoặc đã ngừng hoạt động');
    return { service, source: DECISION_SOURCE.MANUAL, reason: REASON_CODES.CUSTOMER_SELECTED };
  }
  if (answers.symptom) {
    const rules = SYMPTOM_RULES[category?.slug] || [];
    const rule = rules.find((r) => r[0] === answers.symptom);
    const targetSlug = rule ? rule[2] : answers.symptom;
    const service = services.find((s) => s.slug === targetSlug);
    if (!service) throw new BadRequestException('Triệu chứng không được hỗ trợ trong danh mục');
    return { service, source: DECISION_SOURCE.RULES, reason: REASON_CODES.SYMPTOM_CONFIRMED };
  }
  return { service: null, source: null, reason: null };
}

export async function resolveDiagnosis(prisma, aiClient, input) {
  validateDiagnosisInput(input);
  const { imageUrl, description = '', answers = {} } = input;
  const categories = await prisma.serviceCategory.findMany({ where: { isActive: true } });
  const result = createInitialResult(imageUrl, description, categories);
  const { category, ai } = await resolveCategory(prisma, aiClient, input, result, categories);
  if (!category) return result;

  const [targets, services] = await Promise.all([
    (prisma.serviceTarget?.findMany ? prisma.serviceTarget.findMany({ where: { categoryId: category.id, isActive: true }, orderBy: { sortOrder: 'asc' } }) : Promise.resolve([])),
    prisma.service.findMany({ where: { categoryId: category.id, isActive: true }, orderBy: { name: 'asc' } }),
  ]);
  const target = answers.targetId ? targets.find((t) => t.id === answers.targetId) : null;
  if (answers.targetId && !target) throw new BadRequestException('Thiết bị không thuộc danh mục');
  const symptomOptions = buildSymptomOptions(category.slug, services, target);

  Object.assign(result, {
    category: { id: category.id, slug: category.slug, name: category.name },
    target: target ? { id: target.id, slug: target.slug, name: target.name } : null,
    suggestedCategoryId: category.id, suggestedCategoryName: category.name,
    suggestedTargetId: target?.id || ai?.suggestedTargetId || null,
    suggestedTargetName: target?.name || ai?.suggestedTargetName || null,
    status: STATUS.NEEDS_MORE_INFO, needsMoreInfo: true, reason: REASON_CODES.SYMPTOM_REQUIRED,
    reasonCodes: [REASON_CODES.CATEGORY_DETECTED, REASON_CODES.SYMPTOM_REQUIRED],
    availableTargets: targets.map((t) => ({ id: t.id, name: t.name, slug: t.slug, categoryId: t.categoryId })),
    availableServices: services.map((s) => ({ id: s.id, name: s.name, basePrice: Number(s.basePrice), unit: s.unit })),
    questions: symptomOptions.length ? [{ id: 'symptom', label: 'Thiết bị đang gặp tình trạng nào?', options: symptomOptions }] : [],
    message: 'Xác nhận triệu chứng hoặc chọn dịch vụ bên dưới. Ảnh chưa xác định được nguyên nhân hỏng.',
  });

  const { service, source, reason } = resolveService(services, category, answers);
  if (!service) return result;
  const priceRange = formatPriceRange(service.basePrice, service.maxPrice, service.unit);
  const ranked = rankServices(services, { targetId: target?.id, symptomSlug: service.slug, description });
  return {
    ...result, status: STATUS.SUGGESTED, source, decisionSource: source, reason, reasonCodes: [reason],
    requiresManualSelection: false, needsMoreInfo: false, questions: [], service, suggestedServices: ranked,
    suggestedServiceId: service.id, suggestedServiceName: service.name, estimatedPriceMin: priceRange.min,
    estimatedPriceMax: priceRange.max, priceEstimate: priceRange, estimatedPriceRange: priceRange,
    reportedSymptoms: answers.symptom ? [answers.symptom] : [],
    message: 'Dịch vụ theo thông tin bạn xác nhận. Giá tham khảo; thợ kiểm tra và báo giá thực tế.',
  };
}
