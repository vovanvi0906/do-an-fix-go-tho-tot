export const KINDS = {
  USER_REPORTED: 'Người dùng mô tả',
  VISUAL_OBSERVABLE: 'Dấu hiệu có thể quan sát (chưa xác nhận AI)',
  REQUIRES_TECHNICIAN_CHECK: 'Cần thợ kiểm tra',
};
export const REVIEWS = { NEEDS_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
export const EMPTY_FORM = { code: '', name: '', description: '', aliases: [], kind: 'USER_REPORTED', reviewStatus: 'NEEDS_REVIEW', isActive: false, sortOrder: 0 };
export function mappingWarnings(symptom, service) {
  if (service.targetId !== symptom.targetId || service.categoryId !== symptom.target?.categoryId) return 'Sai đối tượng hoặc danh mục — không thể liên kết';
  if (!service.isActive) return 'Dịch vụ inactive — không được đề xuất';
  return '';
}
export function mappingPayload({ priority, reviewStatus, isActive, reason }) {
  const value = Number(priority);
  if (!Number.isInteger(value) || value < 0 || value > 100000) throw new Error('Priority phải là số nguyên 0–100000.');
  if (isActive && reviewStatus !== 'APPROVED') throw new Error('Duyệt mapping trước khi kích hoạt.');
  return { priority: value, reviewStatus, isActive: !!isActive, reason: reason || '' };
}
