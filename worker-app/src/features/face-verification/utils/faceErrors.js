const MESSAGES = {
  FACE_QUALITY_REJECTED:
    "Ảnh chưa đạt chất lượng. Giữ một khuôn mặt trong khung, chọn nơi đủ sáng và chụp rõ nét.",
  FACE_PAD_REJECTED:
    "Chưa xác nhận được người thật. Dùng camera trực tiếp, không dùng ảnh in hoặc màn hình.",
  IDENTITY_NOT_VERIFIED:
    "Khuôn mặt không khớp mẫu đã đăng ký. Vui lòng thử lại hoặc yêu cầu kiểm tra danh tính.",
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
