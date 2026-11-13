export function formatPriceRange(min, max, unit = 'lần') {
  const minNum = Number(min);
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
  if (!pool.length) pool = services;

  const descTokens = description
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = pool.map((svc) => {
    let score = 0.5;
    let reason = 'Dịch vụ phù hợp trong danh mục';
    let provenance = 'catalog_match';

    if (symptomSlug && svc.slug === symptomSlug) {
      score = 0.95;
      reason = `Khớp chính xác triệu chứng đã xác nhận: ${svc.name}`;
      provenance = 'symptom_match';
    } else if (descTokens.length > 0) {
      const nameLower = svc.name.toLowerCase();
      const hits = descTokens.filter((tok) => nameLower.includes(tok)).length;
      if (hits > 0) {
        score = Math.min(0.9, 0.5 + hits * 0.15);
        reason = `Khớp với mô tả của khách hàng (${hits} từ khóa)`;
        provenance = 'keyword_match';
      }
    }

    return {
      id: svc.id,
      name: svc.name,
      slug: svc.slug,
      targetId: svc.targetId,
      basePrice: Number(svc.basePrice),
      maxPrice: svc.maxPrice == null ? null : Number(svc.maxPrice),
      unit: svc.unit || 'lần',
      confidence: Math.round(score * 100) / 100,
      reason,
      provenance,
    };
  });

  return scored.sort((a, b) => b.confidence - a.confidence).slice(0, topK);
}
