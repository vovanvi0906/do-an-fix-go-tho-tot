import { isCurrentFaceProof } from "../services/proof";
export const FACE_BLOCKERS = {
  WORKER_APPROVAL_REQUIRED:
    "Hồ sơ thợ cần được duyệt trước khi đăng ký khuôn mặt.",
  IDENTITY_REVIEW_REQUIRED:
    "Cần quản trị viên kiểm tra danh tính để đăng ký khuôn mặt.",
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
  IDENTITY_EVIDENCE_REVIEW_REQUIRED:
    "Cần kiểm tra danh tính trước khi đăng ký.",
};
export function faceSummary(status, profile, now = Date.now()) {
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
  if (
    enrolled &&
    status.canVerifyDaily &&
    isCurrentFaceProof(status.dailyProof, "DAILY", null, now)
  )
    return {
      title: "Đã xác thực đầu ca",
      message:
        "Bằng chứng xác thực còn hiệu lực. Không cần quét lại khi mở app.",
      action: "Quản lý FaceID",
      mode: "daily",
      tone: "success",
      valid: true,
    };
  if (status.reviewRequestSubmitted)
    return {
      title: "Đang chờ kiểm tra danh tính",
      message:
        "Yêu cầu đã được gửi. Bạn vẫn có thể xem hồ sơ và liên hệ hỗ trợ.",
      action: "Xem FaceID",
      mode: enrolled ? "daily" : "enrollment",
      tone: "warning",
    };
  if (!enrolled)
    return {
      title:
        status.enrollmentStatus === "WITHDRAWN"
          ? "Cần đăng ký lại khuôn mặt"
          : "Chưa đăng ký khuôn mặt",
      message: status.canEnroll
        ? "Đăng ký một mẫu khuôn mặt trước khi xác thực đầu ca."
        : "Mở FaceID để xem điều kiện và gửi yêu cầu kiểm tra danh tính.",
      action: status.canEnroll ? "Đăng ký khuôn mặt" : "Thiết lập FaceID",
      mode: "enrollment",
      tone: "warning",
    };
  return {
    title: "Cần xác thực đầu ca",
    message: status.canVerifyDaily
      ? "Quét khuôn mặt trước khi bật nhận đơn. Mẫu đăng ký được giữ nguyên."
      : (status.blockers || [])
          .map((code) => FACE_BLOCKERS[code])
          .filter(Boolean)
          .join("\n") || "Dịch vụ chưa sẵn sàng. Vui lòng kiểm tra lại.",
    action: "Xác thực đầu ca",
    mode: "daily",
    tone: "warning",
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
