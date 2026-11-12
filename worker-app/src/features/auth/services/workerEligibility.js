export function hasShiftVerification(profile, now = Date.now()) {
  const age = now - new Date(profile?.faceVerifiedAt).getTime();
  return !!profile?.faceVerifiedAt && Number.isFinite(age) && age >= 0 && age < 86400000;
}
export function profileRestriction(profile) {
  if (!profile) return 'Chưa tải được hồ sơ. Vui lòng thử lại.';
  if (profile.user?.role !== 'WORKER') return 'Tài khoản không có quyền thợ.';
  if (profile.user?.status !== 'ACTIVE') return 'Tài khoản bị khóa hoặc chưa kích hoạt. Vui lòng liên hệ hỗ trợ.';
  switch (profile.approvalStatus) {
    case 'DRAFT': return 'Hồ sơ nháp: cần họ tên, CCCD và ít nhất một dịch vụ trước khi nộp duyệt. Kỹ năng đăng ký chưa phải dịch vụ nhận việc.';
    case 'PENDING': return 'Hồ sơ đang chờ quản trị viên duyệt. Vui lòng kiểm tra lại sau.';
    case 'REJECTED': return 'Hồ sơ bị từ chối. Vui lòng liên hệ hỗ trợ để biết lý do và bổ sung hồ sơ.';
    case 'APPROVED': break;
    default: return 'Trạng thái hồ sơ chưa được hỗ trợ. Vui lòng liên hệ hỗ trợ.';
  }
  if (!profile.workerServices?.length) return 'Chưa đăng ký dịch vụ nhận việc. Vui lòng liên hệ hỗ trợ để hoàn thiện hồ sơ.';
  return '';
}
