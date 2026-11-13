// Triệu chứng chuẩn hóa; slug ánh xạ chính xác dịch vụ trong database.
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

export function buildSymptomOptions(categorySlug, activeServices, target) {
  const categoryRules = SYMPTOM_RULES[categorySlug] || [];
  const validRules = categoryRules.filter((r) => activeServices.some((s) => s.slug === r[2]));
  if (validRules.length > 0 && (!target || !target.id)) {
    return validRules.map(([value, label]) => ({ value, label }));
  }
  const targetServices = target?.id
    ? activeServices.filter((s) => s.targetId === target.id)
    : activeServices;
  if (!targetServices.length) return [];

  const matched = validRules.filter(([,, slug]) => targetServices.some((s) => s.slug === slug));
  if (matched.length > 0) {
    return matched.map(([value, label]) => ({ value, label }));
  }

  return targetServices.slice(0, 6).map((s) => ({
    value: s.slug,
    label: s.name,
  }));
}
