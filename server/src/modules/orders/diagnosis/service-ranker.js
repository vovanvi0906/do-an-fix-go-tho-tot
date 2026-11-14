export function formatPriceRange(min, max, unit = 'lần') {
  const minNum = min == null ? null : Number(min);
  if (minNum == null || !Number.isFinite(minNum)) return { min: null, max: null, unit, formatted: 'Thợ báo giá sau kiểm tra' };
  const maxNum = max == null ? null : Number(max);
  const formatted =
    maxNum == null
      ? `Từ ${minNum.toLocaleString('vi-VN')} đ / ${unit}`
      : `${minNum.toLocaleString('vi-VN')} đ ~ ${maxNum.toLocaleString('vi-VN')} đ / ${unit}`;
  return { min: minNum, max: maxNum, unit, formatted };
}

export function rankServices(services, options = {}) {
  const { targetId, symptomSlug, description = '', topK = 3 } = options;
  let pool = targetId ? services.filter((s) => s.targetId === targetId) : services;
  if (!pool.length) return [];

  const descTokens = description
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = pool.map((svc) => {
    let rankingScore = 50;
    let reason = 'Dịch vụ phù hợp trong danh mục';
    let provenance = 'catalog_match';

    if (symptomSlug && svc.slug === symptomSlug) {
      rankingScore = 100;
      reason = `Khớp chính xác triệu chứng đã xác nhận: ${svc.name}`;
      provenance = 'symptom_match';
    } else if (descTokens.length > 0) {
      const nameLower = svc.name.toLowerCase();
      const hits = descTokens.filter((tok) => nameLower.includes(tok)).length;
      if (hits > 0) {
        rankingScore = Math.min(90, 50 + hits * 15);
        reason = `Khớp với mô tả của khách hàng (${hits} từ khóa)`;
        provenance = 'keyword_match';
      }
    }

    return {
      id: svc.id,
      name: svc.name,
      slug: svc.slug,
      targetId: svc.targetId,
      basePrice: svc.basePrice == null ? null : Number(svc.basePrice),
      maxPrice: svc.maxPrice == null ? null : Number(svc.maxPrice),
      unit: svc.unit || 'lần',
      rankingScore,
      matchScore: rankingScore,
      confidence: null,
      reason,
      provenance,
    };
  });

  return scored.sort((a, b) => b.rankingScore - a.rankingScore).slice(0, Math.max(0, Math.min(3, topK)));
}
