import {
  catalogEnabled,
  fail,
  listTargetSymptoms,
  parseSymptomIds,
  recommendServices,
  requireCatalog,
} from '../../symptoms/symptom-catalog';
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
  const score =
    typeof ai.confidence === 'number' &&
    Number.isFinite(ai.confidence) &&
    ai.confidence >= 0 &&
    ai.confidence <= 1
      ? ai.confidence
      : null;
  if (ai.engine !== 'model') {
    Object.assign(result, {
      status: STATUS.UNAVAILABLE,
      source: DECISION_SOURCE.UNAVAILABLE,
      decisionSource: DECISION_SOURCE.UNAVAILABLE,
      reason: REASON_CODES.AI_UNAVAILABLE,
      reasonCodes: [REASON_CODES.AI_UNAVAILABLE],
      message: 'AI chưa khả dụng. Bạn có thể chọn dịch vụ thủ công.',
    });
    return { category: null, ai };
  }
  result.source = DECISION_SOURCE.MODEL;
  result.decisionSource = DECISION_SOURCE.MODEL;
  result.confidence = result.modelScore = score;
  const threshold = aiClient.confidenceThreshold ?? 0.6;
  const category =
    score !== null && score >= threshold
      ? categories.find(
          (c) =>
            c.slug === ai.suggestedCategoryId ||
            c.id === ai.suggestedCategoryId,
        )
      : null;
  if (!category) {
    Object.assign(result, {
      reason: REASON_CODES.IMAGE_UNCERTAIN,
      reasonCodes: [REASON_CODES.IMAGE_UNCERTAIN],
      message: 'Chưa xác định được nhóm. Vui lòng chọn danh mục.',
    });
  } else {
    result.detectedLabels = [category.name];
    result.observableSigns = [`Nhận diện danh mục: ${category.name}`];
  }
  return { category, ai };
}

function resolveService(services, category, answers) {
  if (answers.serviceId) {
    const service = services.find((s) => s.id === answers.serviceId);
    if (!service)
      throw new BadRequestException(
        'Dịch vụ không thuộc danh mục hoặc đã ngừng hoạt động',
      );
    return {
      service,
      source: DECISION_SOURCE.MANUAL,
      reason: REASON_CODES.CUSTOMER_SELECTED,
    };
  }
  if (answers.symptom) {
    const rules = SYMPTOM_RULES[category?.slug] || [];
    const rule = rules.find((r) => r[0] === answers.symptom);
    if (!rule)
      fail(
        'SYMPTOM_NOT_AVAILABLE',
        'Triệu chứng không được hỗ trợ trong danh mục',
      );
    const targetSlug = rule[2];
    const service = services.find((s) => s.slug === targetSlug);
    if (!service)
      throw new BadRequestException(
        'Triệu chứng không được hỗ trợ trong danh mục',
      );
    return {
      service,
      source: DECISION_SOURCE.RULES,
      reason: REASON_CODES.SYMPTOM_CONFIRMED,
    };
  }
  return { service: null, source: null, reason: null };
}

export async function resolveDiagnosis(prisma, aiClient, input) {
  validateDiagnosisInput(input);
  const { imageUrl, description = '', answers = {} } = input;
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
  });
  const result = createInitialResult(imageUrl, description, categories);
  const { category, ai } = await resolveCategory(
    prisma,
    aiClient,
    input,
    result,
    categories,
  );
  if (!category) return result;

  const [targets, services] = await Promise.all([
    prisma.serviceTarget?.findMany
      ? prisma.serviceTarget.findMany({
          where: { categoryId: category.id, isActive: true },
          orderBy: { sortOrder: 'asc' },
        })
      : Promise.resolve([]),
    prisma.service.findMany({
      where: { categoryId: category.id, isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  // AI catalogs may use slugs; only publish canonical active database IDs.
  const aiTarget = ai?.suggestedTargetId
    ? targets.find(
        (t) => t.id === ai.suggestedTargetId || t.slug === ai.suggestedTargetId,
      )
    : null;
  const target = answers.targetId
    ? targets.find((t) => t.id === answers.targetId)
    : null;
  if (answers.targetId && !target)
    throw new BadRequestException({
      code: 'TARGET_CATEGORY_MISMATCH',
      message:
        'Thiết bị không thuộc danh mục đã chọn. Vui lòng chọn lại thiết bị.',
    });
  const scopedServices = target
    ? services.filter((s) => s.targetId === target.id)
    : services;
  const useCatalog = catalogEnabled();
  const catalogSymptoms =
    useCatalog && target
      ? await listTargetSymptoms(prisma, target.id, category.id)
      : [];
  const symptomOptions = useCatalog
    ? catalogSymptoms.map((s) => ({ value: s.id, label: s.name, kind: s.kind }))
    : target || !targets.length
      ? buildSymptomOptions(category.slug, scopedServices, target)
      : [];

  Object.assign(result, {
    category: { id: category.id, slug: category.slug, name: category.name },
    target: target
      ? { id: target.id, slug: target.slug, name: target.name }
      : null,
    suggestedCategoryId: category.id,
    suggestedCategoryName: category.name,
    suggestedTargetId: target?.id || aiTarget?.id || null,
    suggestedTargetName: target?.name || aiTarget?.name || null,
    status: STATUS.NEEDS_MORE_INFO,
    needsMoreInfo: true,
    reason: REASON_CODES.SYMPTOM_REQUIRED,
    reasonCodes: [
      REASON_CODES.CATEGORY_DETECTED,
      REASON_CODES.SYMPTOM_REQUIRED,
    ],
    availableTargets: targets.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      categoryId: t.categoryId,
    })),
    availableServices: (target || !targets.length ? scopedServices : []).map(
      (s) => ({
        id: s.id,
        name: s.name,
        basePrice: s.basePrice == null ? null : Number(s.basePrice),
        targetId: s.targetId,
        unit: s.unit,
      }),
    ),
    symptomCatalogEnabled: useCatalog,
    selectedSymptomIds: [],
    questions: symptomOptions.length
      ? [
          {
            id: useCatalog ? 'symptomId' : 'symptom',
            label: 'Thiết bị đang gặp tình trạng nào?',
            options: symptomOptions,
          },
        ]
      : [],
    message:
      'Xác nhận triệu chứng hoặc chọn dịch vụ bên dưới. Ảnh chưa xác định được nguyên nhân hỏng.',
  });

  if (
    targets.length &&
    !target &&
    (answers.symptom ||
      answers.symptomId ||
      answers.symptomIds ||
      answers.serviceId)
  ) {
    throw new BadRequestException(
      'Vui lòng xác nhận thiết bị trước khi chọn dịch vụ.',
    );
  }
  const selectedIds = answers.symptomId
    ? [answers.symptomId]
    : answers.symptomIds;
  let recommendations = null;
  if (selectedIds) {
    requireCatalog();
    if (!target) fail('TARGET_REQUIRED', 'Vui lòng xác nhận thiết bị.');
    const ids = parseSymptomIds(selectedIds);
    recommendations = await recommendServices(prisma, {
      targetId: target.id,
      categoryId: category.id,
      symptomIds: ids,
    });
    Object.assign(result, {
      selectedSymptomIds: ids,
      reportedSymptoms: catalogSymptoms
        .filter((s) => ids.includes(s.id))
        .map((s) => s.name),
      suggestedServices: recommendations.items,
      hasMore: recommendations.hasMore,
      message: recommendations.items.length
        ? 'Chọn dịch vụ phù hợp với triệu chứng bạn xác nhận.'
        : 'Chưa có dịch vụ phù hợp với triệu chứng này. Bạn có thể chọn thủ công.',
    });
    if (!answers.serviceId) return result;
    if (!recommendations.items.some((s) => s.id === answers.serviceId))
      fail(
        'SERVICE_SYMPTOM_MISMATCH',
        'Dịch vụ không phù hợp với triệu chứng đã xác nhận.',
      );
  }
  const { service, source, reason } = resolveService(
    scopedServices,
    category,
    answers,
  );
  if (!service) return result;
  const priceRange = formatPriceRange(
    service.basePrice,
    service.maxPrice,
    service.unit,
  );
  const ranked = rankServices(scopedServices, {
    targetId: target?.id,
    symptomSlug: service.slug,
    description,
    topK: 1,
  });
  return {
    ...result,
    status: STATUS.SUGGESTED,
    source,
    decisionSource: source,
    reason,
    reasonCodes: [reason],
    requiresManualSelection: false,
    needsMoreInfo: false,
    questions: [],
    service,
    suggestedServices: ranked,
    suggestedServiceId: service.id,
    suggestedServiceName: service.name,
    estimatedPriceMin: priceRange.min,
    estimatedPriceMax: priceRange.max,
    priceEstimate: priceRange,
    estimatedPriceRange: priceRange,
    reportedSymptoms: selectedIds
      ? result.reportedSymptoms
      : answers.symptom
        ? [answers.symptom]
        : [],
    message:
      'Dịch vụ theo thông tin bạn xác nhận. Giá tham khảo; thợ kiểm tra và báo giá thực tế.',
  };
}
