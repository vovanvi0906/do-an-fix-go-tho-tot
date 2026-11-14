import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export function catalogEnabled() {
  return process.env.SYMPTOM_CATALOG_ENABLED === 'true';
}
export function requireCatalog() {
  if (!catalogEnabled())
    throw new ServiceUnavailableException({
      code: 'SYMPTOM_CATALOG_NOT_ENABLED',
      message:
        'Quản lý triệu chứng chưa được bật. Bạn vẫn có thể chọn dịch vụ thủ công.',
    });
}
export function fail(code, message) {
  throw new BadRequestException({ code, message });
}
export function pageQuery(query = {}) {
  const page = Number(query.page ?? 1),
    limit = Number(query.limit ?? 20);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    page > 100000
  )
    fail('INVALID_PAGINATION', 'Phân trang không hợp lệ (limit 1–100).');
  if (
    query.search != null &&
    (typeof query.search !== 'string' || query.search.length > 200)
  )
    fail('INVALID_SEARCH', 'Từ khóa tối đa 200 ký tự.');
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: query.search?.trim() || '',
  };
}
export async function activeTarget(db, targetId, categoryId) {
  if (typeof targetId !== 'string' || !targetId)
    fail('TARGET_REQUIRED', 'Vui lòng xác nhận thiết bị.');
  const target = await db.serviceTarget.findUnique({
    where: { id: targetId },
    include: { category: true },
  });
  if (!target?.isActive || !target.category?.isActive)
    throw new NotFoundException({
      code: 'TARGET_NOT_AVAILABLE',
      message: 'Thiết bị hoặc danh mục đã ngừng hoạt động.',
    });
  if (categoryId && categoryId !== target.categoryId)
    fail('TARGET_CATEGORY_MISMATCH', 'Thiết bị không thuộc danh mục đã chọn.');
  return target;
}
export async function listTargetSymptoms(db, targetId, categoryId) {
  requireCatalog();
  await activeTarget(db, targetId, categoryId);
  return db.symptom.findMany({
    where: { targetId, isActive: true, reviewStatus: 'APPROVED' },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      targetId: true,
      code: true,
      name: true,
      description: true,
      aliases: true,
      kind: true,
      sortOrder: true,
    },
  });
}
export function parseSymptomIds(value) {
  const ids = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').filter(Boolean)
      : [];
  if (
    !ids.length ||
    ids.length > 10 ||
    ids.some((id) => typeof id !== 'string' || !id || id.length > 100) ||
    new Set(ids).size !== ids.length
  )
    fail('INVALID_SYMPTOM_IDS', 'Chọn từ 1 đến 10 triệu chứng khác nhau.');
  return ids;
}
export async function recommendServices(
  db,
  { targetId, categoryId, symptomIds, limit = 3 },
) {
  requireCatalog();
  const target = await activeTarget(db, targetId, categoryId);
  const ids = parseSymptomIds(symptomIds);
  const topK = Number(limit);
  if (!Number.isInteger(topK) || topK < 1 || topK > 3)
    fail('INVALID_LIMIT', 'Chỉ đề xuất tối đa 3 dịch vụ.');
  const symptoms = await db.symptom.findMany({ where: { id: { in: ids } } });
  if (
    symptoms.length !== ids.length ||
    symptoms.some((s) => !s.isActive || s.reviewStatus !== 'APPROVED')
  )
    fail(
      'SYMPTOM_NOT_AVAILABLE',
      'Triệu chứng đã ngừng hoạt động hoặc chưa được duyệt.',
    );
  if (symptoms.some((s) => s.targetId !== targetId))
    fail(
      'SYMPTOM_TARGET_MISMATCH',
      'Triệu chứng không thuộc thiết bị đã chọn.',
    );
  const links = await db.symptomService.findMany({
    where: {
      symptomId: { in: ids },
      targetId,
      isActive: true,
      reviewStatus: 'APPROVED',
      symptom: { targetId, isActive: true, reviewStatus: 'APPROVED' },
      service: {
        targetId,
        isActive: true,
        categoryId: target.categoryId,
        target: { isActive: true, category: { isActive: true } },
        category: { isActive: true },
      },
    },
    include: { service: true, symptom: true },
  });
  const grouped = new Map();
  for (const link of links) {
    const s = link.service;
    if (
      s.targetId !== targetId ||
      !s.isActive ||
      s.categoryId !== target.categoryId
    )
      continue;
    const item = grouped.get(s.id) || {
      ...s,
      basePrice: s.basePrice == null ? null : Number(s.basePrice),
      maxPrice: s.maxPrice == null ? null : Number(s.maxPrice),
      priority: link.priority,
      symptomIds: [],
      reason: '',
      provenance: 'confirmed_symptom_catalog',
      confidence: null,
    };
    item.symptomIds.push(link.symptomId);
    item.priority = Math.max(item.priority, link.priority);
    item.reason = `Theo triệu chứng bạn xác nhận: ${symptoms
      .filter((sym) => item.symptomIds.includes(sym.id))
      .map((sym) => sym.name)
      .join(', ')}`;
    grouped.set(s.id, item);
  }
  const ranked = [...grouped.values()].sort(
    (a, b) =>
      b.symptomIds.length - a.symptomIds.length ||
      b.priority - a.priority ||
      a.id.localeCompare(b.id),
  );
  return {
    items: ranked.slice(0, topK),
    hasMore: ranked.length > topK,
    requiresUserConfirmation: true,
    source: 'confirmed_symptom_catalog',
  };
}
