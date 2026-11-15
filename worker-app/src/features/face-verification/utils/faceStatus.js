export const FACE_BLOCKERS = {
  FACE_CORE_DISABLED:
    'Chức năng xác thực khuôn mặt chưa được mở trên máy chủ. Vui lòng liên hệ quản trị viên.',
  WORKER_APPROVAL_REQUIRED:
    "Hồ sơ thợ cần được duyệt trước khi đăng ký khuôn mặt.",
  CONSENT_REQUIRED: "Cần lưu đồng ý sử dụng khuôn mặt theo phiên bản hiện tại.",
  FACE_KEYS_NOT_CONFIGURED: "Hệ thống đang hoàn thiện lưu trữ mẫu an toàn.",
  BIOMETRIC_DATA_POLICY_NOT_APPROVED:
    "Hệ thống chưa mở thu nhận dữ liệu khuôn mặt.",
  PAD_NOT_EVALUATED:
    "Kiểm tra người thật chưa sẵn sàng. Vui lòng kiểm tra lại sau.",
  IDENTITY_MODEL_NOT_READY: "Dịch vụ nhận diện chưa sẵn sàng.",
  TEMPLATE_MODEL_CHANGED:
    "Mẫu cần được đăng ký lại do thay đổi phiên bản nhận diện.",
  TEMPLATE_STORAGE_POLICY_REQUIRED: "Hệ thống chưa sẵn sàng lưu mẫu.",
  DURABLE_PROOF_STORAGE_REQUIRED:
    "Hệ thống chưa sẵn sàng lưu bằng chứng xác thực.",

};
export function faceSummary(status, profile) {
  if (!status)
    return {
      title: "Chưa tải được FaceID",
      message: "Kiểm tra kết nối và thử lại.",
      action: "Kiểm tra lại",
      mode: null,
      tone: "warning",
    };
  if (profile && profile.approvalStatus !== "APPROVED")
    return {
      title: "Hoàn thiện hồ sơ",
      message: "Hồ sơ nghề nghiệp cần được duyệt trước khi đăng ký khuôn mặt.",
      action: "Xem điều kiện FaceID",
      mode: "enrollment",
      tone: "warning",
    };
  const enrolled = status.enrollmentStatus === "ENROLLED";
  if (enrolled && !status.consentRequired && !(status.blockers || []).includes('TEMPLATE_MODEL_CHANGED'))
    return {
      title: 'Đã đăng ký khuôn mặt',
      message: 'Xác thực riêng theo đơn khi đã đến nơi. Không cần check-in đầu ca.',
      action: 'Quản lý FaceID', mode: 'enrollment', tone: 'success', valid: true,
    };
  if (!enrolled)
    return {
      title:
        status.enrollmentStatus === "WITHDRAWN"
          ? "Cần đăng ký lại khuôn mặt"
          : "Chưa đăng ký khuôn mặt",
      message: status.canEnroll
        ? "Đăng ký một mẫu khuôn mặt để xác thực theo từng đơn."
        : "Mở FaceID để lưu đồng ý và xem điều kiện đăng ký mẫu khuôn mặt.",
      action: status.canEnroll ? "Đăng ký khuôn mặt" : "Thiết lập FaceID",
      mode: "enrollment",
      tone: "warning",
    };
  return {
    title: 'Cần kiểm tra đăng ký khuôn mặt',
    message: (status.blockers || []).map(code => FACE_BLOCKERS[code]).filter(Boolean).join('\n')
      || 'Mở FaceID để kiểm tra consent và đăng ký khuôn mặt.',
    action: 'Quản lý FaceID', mode: 'enrollment', tone: 'warning',
  };
}
export function facePrompt(status, profile, now) {
  const summary = faceSummary(status, profile, now);
  if (summary.valid || !status) return null;
  return summary;
}
export const faceExpiry = (proof) => {
  const time = Date.parse(proof?.expiresAt);
  return Number.isFinite(time) ? new Date(time).toLocaleString("vi-VN") : null;
};
