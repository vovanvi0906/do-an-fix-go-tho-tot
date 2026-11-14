/** Error/decision code catalog → pipeline stage + Vietnamese explanation. */
export type Stage = 'AUTH' | 'SESSION' | 'CAMERA' | 'IMAGE' | 'DETECTION' | 'QUALITY' | 'PAD' | 'MATCH' | 'POLICY' | 'PROOF';
export const STAGES: Stage[] = ['AUTH', 'SESSION', 'CAMERA', 'IMAGE', 'DETECTION', 'QUALITY', 'PAD', 'MATCH', 'POLICY', 'PROOF'];
export const STAGE_LABEL: Record<Stage, string> = {
  AUTH: 'Authentication / authorization',
  SESSION: 'Session validation',
  CAMERA: 'Camera capture',
  IMAGE: 'Image validation',
  DETECTION: 'Face detection (YuNet)',
  QUALITY: 'Image quality',
  PAD: 'PAD / liveness',
  MATCH: 'Face matching (SFace)',
  POLICY: 'Backend policy',
  PROOF: 'Proof issuance',
};

interface CodeInfo { stage: Stage; text: string; kind?: 'BLOCKED' | 'FAIL' | 'ERROR' | 'NOT_EVALUATED' }

const C: Record<string, CodeInfo> = {
  // Session / nonce / ownership
  SESSION_EXPIRED: { stage: 'SESSION', text: 'Session đã hết hạn theo TTL backend.' },
  SESSION_EXPIRED_OR_BUSY: { stage: 'SESSION', text: 'Session hết hạn, bị thu hồi hoặc đang xử lý.' },
  SESSION_EXPIRED_OR_REVOKED: { stage: 'SESSION', text: 'Session hết hạn hoặc bị thu hồi (epoch/consent thay đổi).' },
  SESSION_ACCESS_DENIED: { stage: 'SESSION', text: 'Session không thuộc worker đang đăng nhập.' },
  SESSION_BUSY_OR_REVOKED: { stage: 'SESSION', text: 'Session đang xử lý hoặc đã thu hồi.' },
  INVALID_NONCE: { stage: 'SESSION', text: 'Nonce không khớp session (replay/giả mạo bị từ chối).' },
  IDEMPOTENCY_SCOPE_CONFLICT: { stage: 'SESSION', text: 'requestKey đã dùng cho purpose/order khác.' },
  REPLAY_PAYLOAD_CHANGED: { stage: 'SESSION', text: 'Retry với ảnh khác trên session đã hoàn tất bị từ chối.' },
  FACE_RATE_LIMITED: { stage: 'SESSION', text: 'Vượt giới hạn số lần thử trong cửa sổ thời gian.' },
  PAYLOAD_TOO_LARGE: { stage: 'IMAGE', text: 'Ảnh vượt giới hạn kích thước (5 MB).', kind: 'FAIL' },
  IMAGE_TOO_LARGE_OR_UNSUPPORTED: { stage: 'IMAGE', text: 'Ảnh quá lớn hoặc định dạng không hỗ trợ.', kind: 'FAIL' },
  NETWORK_UNAVAILABLE: { stage: 'SESSION', text: 'Không kết nối được backend (offline/proxy).', kind: 'ERROR' },
  NOT_FOUND: { stage: 'AUTH', text: 'Endpoint không tồn tại hoặc bị tắt (debug route chỉ có ở dev/staging).' },
  INVALID_SESSION_INPUT: { stage: 'SESSION', text: 'Dữ liệu tạo session không hợp lệ.' },
  ORDER_ACCESS_DENIED: { stage: 'SESSION', text: 'Đơn không được gán cho worker này.' },
  FACE_STAGE_NOT_ALLOWED: { stage: 'SESSION', text: 'Đơn chưa ở trạng thái ARRIVED nên không được xác thực.' },
  ORDER_SCOPE_INVALID: { stage: 'SESSION', text: 'orderId không hợp lệ cho purpose này.' },
  RESEARCH_SESSION_EXPIRED: { stage: 'SESSION', text: 'Session nghiên cứu đã hết hạn.' },
  RESEARCH_SESSION_DENIED: { stage: 'SESSION', text: 'Session nghiên cứu không thuộc tài khoản này.' },
  RESEARCH_NONCE_INVALID: { stage: 'SESSION', text: 'Nonce không khớp session nghiên cứu.' },
  RESEARCH_IDEMPOTENCY_CONFLICT: { stage: 'SESSION', text: 'requestKey đã dùng cho phạm vi khác.' },
  RESEARCH_REPLAY_CHANGED: { stage: 'SESSION', text: 'Session đã hoàn tất; gửi lại payload khác bị từ chối.' },
  RESEARCH_SESSION_BUSY: { stage: 'SESSION', text: 'Session đang xử lý.' },
  RESEARCH_CLAIM_LOST: { stage: 'SESSION', text: 'Mất quyền xử lý (claim) do xung đột đồng thời.' },
  RESEARCH_RATE_LIMITED: { stage: 'SESSION', text: 'Vượt giới hạn 5 lần/15 phút.' },
  RESEARCH_ATTEMPTS_EXHAUSTED: { stage: 'SESSION', text: 'Session đã dùng hết 3 lần thử.' },
  RESEARCH_ORDER_DENIED: { stage: 'SESSION', text: 'Đơn không thuộc worker này.' },
  RESEARCH_ORDER_STAGE_INVALID: { stage: 'SESSION', text: 'Đơn chưa ở trạng thái ARRIVED.' },
  RESEARCH_ORDER_SCOPE_INVALID: { stage: 'SESSION', text: 'orderId không hợp lệ cho purpose này.' },
  RESEARCH_SESSION_INPUT_INVALID: { stage: 'SESSION', text: 'Dữ liệu tạo session không hợp lệ.' },
  RESEARCH_INPUT_INVALID: { stage: 'SESSION', text: 'Dữ liệu yêu cầu không hợp lệ.' },
  // Camera (client) and capture format
  CAMERA_PERMISSION_DENIED: { stage: 'CAMERA', text: 'Người dùng/trình duyệt từ chối quyền camera.' },
  CAMERA_NOT_FOUND: { stage: 'CAMERA', text: 'Không tìm thấy camera.' },
  CAMERA_IN_USE: { stage: 'CAMERA', text: 'Camera đang bị ứng dụng khác sử dụng.' },
  CAMERA_UNSUPPORTED: { stage: 'CAMERA', text: 'Trình duyệt không hỗ trợ getUserMedia hoặc không thể hỏi quyền (cần localhost/HTTPS, không ở chế độ headless/kiosk).' },
  CAMERA_NOT_READY: { stage: 'CAMERA', text: 'Camera chưa có khung hình.' },
  CAMERA_CAPTURE_FAILED: { stage: 'CAMERA', text: 'Không chụp được khung hình.' },
  JPEG_OR_PNG_REQUIRED: { stage: 'IMAGE', text: 'Chỉ nhận JPEG/PNG.' },
  RESEARCH_JPEG_PNG_REQUIRED: { stage: 'IMAGE', text: 'Chỉ nhận JPEG/PNG.' },
  INLINE_CAPTURE_REQUIRED: { stage: 'IMAGE', text: 'Cần ảnh camera inline.' },
  RESEARCH_INLINE_CAPTURE_REQUIRED: { stage: 'IMAGE', text: 'Cần ảnh camera inline.' },
  RESEARCH_REFERENCE_CAPTURE_REQUIRED: { stage: 'CAMERA', text: 'Daily/Order nghiên cứu cần 2 ảnh live (reference + probe) trong cùng session.' },
  // Detection / quality
  NO_FACE: { stage: 'DETECTION', text: 'YuNet không phát hiện khuôn mặt.', kind: 'FAIL' },
  MULTIPLE_FACES: { stage: 'DETECTION', text: 'Có nhiều hơn một khuôn mặt.', kind: 'FAIL' },
  INVALID_DETECTION: { stage: 'DETECTION', text: 'Detection không hợp lệ hoặc confidence < 0.6.', kind: 'FAIL' },
  FACE_SIZE_OR_CROP: { stage: 'DETECTION', text: 'Khuôn mặt quá nhỏ (<80px) hoặc nằm ngoài khung.', kind: 'FAIL' },
  TOO_DARK: { stage: 'QUALITY', text: 'Ảnh thiếu sáng.', kind: 'FAIL' },
  TOO_BRIGHT: { stage: 'QUALITY', text: 'Ảnh cháy sáng.', kind: 'FAIL' },
  LIGHTING: { stage: 'QUALITY', text: 'Độ sáng ngoài ngưỡng.', kind: 'FAIL' },
  BLUR: { stage: 'QUALITY', text: 'Ảnh mờ (Laplacian variance thấp).', kind: 'FAIL' },
  DECODE_FAILED: { stage: 'IMAGE', text: 'Không giải mã được ảnh.', kind: 'ERROR' },
  RESEARCH_PROCESSING_FAILED: { stage: 'IMAGE', text: 'Pipeline nghiên cứu lỗi kỹ thuật; không có điểm số.', kind: 'ERROR' },
  RESEARCH_AI_TIMEOUT: { stage: 'DETECTION', text: 'AI service timeout — fail closed, không có kết quả.', kind: 'ERROR' },
  RESEARCH_AI_UNAVAILABLE: { stage: 'DETECTION', text: 'AI service không khả dụng — fail closed.', kind: 'ERROR' },
  RESEARCH_MODEL_NOT_READY: { stage: 'DETECTION', text: 'Model YuNet/SFace/MN3 chưa sẵn sàng.', kind: 'ERROR' },
  RESEARCH_EVIDENCE_REJECTED: { stage: 'DETECTION', text: 'Kết quả AI sai hợp đồng (binding/version) — bị loại bỏ.', kind: 'ERROR' },
  FACE_EVIDENCE_REJECTED: { stage: 'DETECTION', text: 'Inference bị từ chối/timeout; không cấp proof.', kind: 'ERROR' },
  MODEL_NOT_READY: { stage: 'DETECTION', text: 'Model nhận dạng chưa sẵn sàng.', kind: 'ERROR' },
  // PAD
  PAD_NOT_EVALUATED: { stage: 'PAD', text: 'Chưa có PAD provider đã được đánh giá. Backend từ chối theo policy (fail closed).', kind: 'NOT_EVALUATED' },
  PAD_EVALUATION_NOT_APPROVED: { stage: 'PAD', text: 'Có điểm đo MN3 nhưng chưa có hồ sơ đánh giá được duyệt → không thể kết luận PASS/FAIL.', kind: 'NOT_EVALUATED' },
  PAD_BLOCKED_DATA: { stage: 'PAD', text: 'BLOCKED_DATA: chưa có dữ liệu đánh giá PAD (print/screen/replay) theo protocol → MN3 chỉ là số đo, không có quyết định.', kind: 'NOT_EVALUATED' },
  PAD_BLOCKED_APPROVAL: { stage: 'PAD', text: 'BLOCKED_APPROVAL: có hồ sơ đánh giá nhưng thiếu phê duyệt/provenance bắt buộc.', kind: 'NOT_EVALUATED' },
  PAD_NOT_RUN_NO_SINGLE_FACE: { stage: 'PAD', text: 'PAD không chạy vì không có đúng một khuôn mặt hợp lệ.', kind: 'NOT_EVALUATED' },
  PAD_TIMEOUT: { stage: 'PAD', text: 'PAD inference timeout; provider bị khóa (poisoned) cho đến khi khởi động lại.', kind: 'ERROR' },
  PAD_BUSY: { stage: 'PAD', text: 'PAD đang bận; request bị từ chối thay vì xếp hàng.', kind: 'ERROR' },
  PAD_MODEL_MISSING: { stage: 'PAD', text: 'Thiếu file model PAD.', kind: 'ERROR' },
  PAD_CHECKSUM_MISMATCH: { stage: 'PAD', text: 'SHA-256 model PAD không khớp bản pin.', kind: 'ERROR' },
  PAD_OUTPUT_INVALID: { stage: 'PAD', text: 'Output PAD sai shape/không hữu hạn.', kind: 'ERROR' },
  PAD_PREPROCESS_INVALID: { stage: 'PAD', text: 'Crop PAD sai định dạng.', kind: 'ERROR' },
  PAD_TECHNICAL_ERROR: { stage: 'PAD', text: 'Lỗi kỹ thuật PAD.', kind: 'ERROR' },
  INVALID_FACE_EVIDENCE: { stage: 'PAD', text: 'Evidence thiếu PAD PASS/quality PASS hoặc sai binding.', kind: 'FAIL' },
  // Matching
  IDENTITY_NOT_VERIFIED: { stage: 'MATCH', text: 'Cosine dưới ngưỡng hoặc không phải MATCH.', kind: 'FAIL' },
  TRUSTED_TEMPLATE_REQUIRED: { stage: 'MATCH', text: 'Chưa có template tin cậy (chưa enroll / đã thu hồi / model đổi).', kind: 'BLOCKED' },
  MODEL_VERSION_MISMATCH: { stage: 'MATCH', text: 'Template tạo bởi model khác phiên bản.', kind: 'BLOCKED' },
  IDENTITY_TECHNICAL_ERROR: { stage: 'MATCH', text: 'SFace lỗi kỹ thuật.', kind: 'ERROR' },
  INVALID_IDENTITY_SCORE: { stage: 'MATCH', text: 'Điểm cosine không hợp lệ.', kind: 'ERROR' },
  // Policy
  FACE_CORE_DISABLED: { stage: 'POLICY', text: 'FACE_CORE_ENABLED=false trên backend.' },
  FACE_POLICY_INVALID: { stage: 'POLICY', text: 'Cấu hình policy Face Core không hợp lệ.' },
  BIOMETRIC_DATA_POLICY_NOT_APPROVED: { stage: 'POLICY', text: 'Chưa duyệt chính sách thu thập dữ liệu sinh trắc học.' },
  FACE_KEYS_NOT_CONFIGURED: { stage: 'POLICY', text: 'Chưa cấu hình khóa mã hóa template/nonce.' },
  CONSENT_REQUIRED: { stage: 'POLICY', text: 'Thiếu consent hợp lệ (chưa đồng ý hoặc đã thu hồi).' },
  CONSENT_VERSION_REQUIRED: { stage: 'POLICY', text: 'Sai phiên bản consent.' },
  IDENTITY_REVIEW_REQUIRED: { stage: 'POLICY', text: 'Chưa có Admin identity review còn hiệu lực.' },
  WORKER_APPROVAL_REQUIRED: { stage: 'POLICY', text: 'Worker chưa được duyệt.' },
  ACTIVE_WORKER_REQUIRED: { stage: 'AUTH', text: 'Tài khoản không phải worker ACTIVE.' },
  TEMPLATE_ALREADY_ENROLLED: { stage: 'POLICY', text: 'Đã có template; cấp lại cần review REENROLLMENT.' },
  TEMPLATE_VERSION_CONFLICT: { stage: 'POLICY', text: 'Xung đột phiên bản template.' },
  RESEARCH_CAPTURE_NOT_APPROVED: { stage: 'POLICY', text: 'Camera nghiên cứu chưa được duyệt (protocol/consent). Ảnh không được upload.' },
  RESEARCH_CONSENT_REQUIRED: { stage: 'POLICY', text: 'Thiếu consent người tham gia nghiên cứu.' },
  RESEARCH_REVIEW_REQUIRED: { stage: 'POLICY', text: 'Thiếu review/consent khớp epoch hiện tại.' },
  RESEARCH_WORKER_DENIED: { stage: 'AUTH', text: 'Tài khoản không phải worker APPROVED/ACTIVE.' },
  RESEARCH_AUTH_REQUIRED: { stage: 'AUTH', text: 'Thiếu/sai research token.' },
  RESEARCH_NO_AUTHORITY: { stage: 'POLICY', text: 'Research lab chỉ đo; không có thẩm quyền enroll/verify.' },
  UNAUTHORIZED: { stage: 'AUTH', text: 'Thiếu/sai JWT.' },
  FORBIDDEN: { stage: 'AUTH', text: 'Không đủ quyền.' },
  // Proof
  PROOF_EXPIRED_OR_CONSUMED: { stage: 'PROOF', text: 'Proof đã hết hạn, đã dùng hoặc bị thu hồi.', kind: 'FAIL' },
  PROOF_ALREADY_CONSUMED: { stage: 'PROOF', text: 'Proof order đã được tiêu thụ (dùng một lần).', kind: 'FAIL' },
  ORDER_FACE_PROOF_REQUIRED: { stage: 'PROOF', text: 'Không có order proof hợp lệ cho đơn này.', kind: 'FAIL' },
  DAILY_PROOF_REQUIRED: { stage: 'PROOF', text: 'Không có daily proof còn hiệu lực.', kind: 'FAIL' },
  PROOF_NOT_ISSUED_RESEARCH_ONLY: { stage: 'PROOF', text: 'Không cấp proof: chế độ nghiên cứu không có thẩm quyền.', kind: 'BLOCKED' },
  PROOF_NOT_ISSUED_PAD_REQUIRED: { stage: 'PROOF', text: 'Không cấp proof: policy yêu cầu PAD PASS.', kind: 'BLOCKED' },
};

/** Normalise "CODE: human text" / "CODE" into CODE. */
export function codeOf(message: unknown): string | null {
  if (typeof message !== 'string') return null;
  const m = /^([A-Z][A-Z0-9_]{2,63})(?::|$)/.exec(message.trim());
  return m ? m[1] : null;
}

export function describe(code: string | null | undefined): CodeInfo & { code: string } {
  if (!code) return { code: 'UNKNOWN', stage: 'POLICY', text: 'Lỗi không xác định.', kind: 'ERROR' };
  const base = code.startsWith('PAD_EVALUATION_REJECTED') || code.startsWith('PAD_EVALUATION_VERSION') ? C.PAD_EVALUATION_NOT_APPROVED : C[code];
  return base ? { code, ...base } : { code, stage: 'POLICY', text: 'Mã chưa có trong catalog của Lab.', kind: 'ERROR' };
}

export const PAD_LIMITATIONS = [
  'MN3 là PAD thụ động trên 1 khung hình: không chứng minh camera thật, không chống camera injection/virtual camera/deepfake stream.',
  'Điểm real/spoof chỉ là số đo. Chưa có ngưỡng được hiệu chỉnh trên dữ liệu FixGo → không được diễn giải là PASS.',
  'Hiệu năng phụ thuộc thiết bị, ánh sáng, độ phân giải, chất liệu in và loại màn hình; số liệu nhà cung cấp không phải số đo FixGo.',
  'Nonce/session chỉ chống replay ở mức giao thức (gửi lại request), không chống replay video trước camera.',
  'Phát hiện khuôn mặt / khớp SFace KHÔNG chứng minh người thật đang hiện diện.',
  'Cần đánh giá riêng từng loại tấn công: ảnh in, màn hình điện thoại, video phát lại (APCER theo từng loại, BPCER cho bona fide).',
];
