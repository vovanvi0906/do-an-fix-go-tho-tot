const MESSAGES = {
  FACE_QUALITY_REJECTED_NO_FACE: 'Máy chủ chưa tìm thấy khuôn mặt trong ảnh. Nhìn thẳng camera và chụp lại.',
  FACE_QUALITY_REJECTED_MULTIPLE_FACES: 'Ảnh có nhiều khuôn mặt. Chỉ để một người trong khung rồi chụp lại.',
  FACE_QUALITY_REJECTED_INVALID_DETECTION: 'Máy chủ chưa nhận diện rõ khuôn mặt. Giữ đầu thẳng và chụp lại ở nơi đủ sáng.',
  FACE_QUALITY_REJECTED_FACE_SIZE_OR_CROP: 'Khuôn mặt quá nhỏ hoặc bị cắt ở mép ảnh. Đặt toàn bộ khuôn mặt trong khung và chụp lại.',
  FACE_QUALITY_REJECTED_LIGHTING: 'Ánh sáng trên khuôn mặt quá tối hoặc quá sáng. Quay mặt về nguồn sáng, tránh cửa sổ phía sau.',
  FACE_QUALITY_REJECTED_BLUR: 'Ảnh khuôn mặt bị mờ. Lau camera, giữ điện thoại đứng yên và chụp lại.',

  PAD_NOT_EVALUATED: 'Kiểm tra người thật chưa được phê duyệt. Chưa thể đăng ký hoặc xác thực khuôn mặt.',
  BIOMETRIC_DATA_POLICY_NOT_APPROVED: 'Hệ thống chưa được phê duyệt thu nhận khuôn mặt.',
  FACE_CORE_DISABLED: 'Chức năng xác thực khuôn mặt chưa được mở trên máy chủ.',
  FACE_KEYS_NOT_CONFIGURED: 'Máy chủ chưa sẵn sàng lưu mẫu khuôn mặt an toàn.',
  IDENTITY_MODEL_NOT_READY: 'Dịch vụ nhận diện chưa sẵn sàng. Vui lòng thử lại sau.',
  TRUSTED_TEMPLATE_REQUIRED: 'Cần mẫu khuôn mặt đã đăng ký hợp lệ. Mở chức năng đăng ký để xem điều kiện.',
  CONSENT_REQUIRED: 'Cần lưu đồng ý sử dụng khuôn mặt theo phiên bản hiện tại.',
  ORDER_FACE_PROOF_REQUIRED: 'Bằng chứng theo đơn không còn hợp lệ. Tải lại trạng thái và xác minh lại nếu máy chủ yêu cầu.',
  PROOF_ALREADY_CONSUMED: 'Bằng chứng đã được sử dụng. Tải lại trạng thái công việc.',
  FACE_STAGE_NOT_ALLOWED: 'Chỉ xác thực theo đơn khi đã đến nơi. Tải lại trạng thái công việc.',
  ORDER_ACCESS_DENIED: 'Bạn không còn được phân công cho đơn hàng này.',
  MISSING_BEFORE_PHOTO: 'Chưa có ảnh BEFORE hợp lệ trên máy chủ. Tải lại trạng thái và lưu ảnh trước khi bắt đầu.',
  QUOTE_NOT_APPROVED: 'Báo giá điều chỉnh chưa được khách duyệt. Ảnh BEFORE đã lưu vẫn được giữ.',

  FACE_QUALITY_REJECTED:
    "Ảnh chưa đạt chất lượng. Giữ một khuôn mặt trong khung, chọn nơi đủ sáng và chụp rõ nét.",
  FACE_PAD_REJECTED:
    "Chưa xác nhận được người thật. Dùng camera trực tiếp, không dùng ảnh in hoặc màn hình.",
  IDENTITY_NOT_VERIFIED:
    "Khuôn mặt không khớp mẫu đã đăng ký. Vui lòng thử lại với khuôn mặt đã đăng ký.",
  FACE_RATE_LIMITED:
    "Đã đạt giới hạn thử. Vui lòng chờ trước khi tạo lượt quét mới.",
  SESSION_EXPIRED_OR_REVOKED:
    "Phiên đã hết hạn hoặc bị thu hồi. Vui lòng bắt đầu lượt quét mới.",
  SESSION_EXPIRED: "Phiên quét đã hết hạn. Vui lòng chụp lại.",
};
export function faceErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const messages = [error?.message, data?.message, data?.error?.message];
  const text = messages.filter((value) => typeof value === "string").join(" ");
  const code = Object.keys(MESSAGES).find((value) =>
    new RegExp(`\\b${value}\\b`).test(text),
  );
  return code ? MESSAGES[code] : fallback;
}
