const ROOT = '/api/test-face';

export const FACE_ERRORS = {
  TEST_AI_UNAVAILABLE: 'Không khởi động được AI test. Kiểm tra Docker, model và runtime MN3; sau đó thử kết nối lại.',
  TEST_WORKSPACE_EXPIRED: 'Phiên test đã hết hạn. Xóa phiên và bắt đầu lại.',
  TEST_SESSION_EXPIRED_OR_CONSUMED: 'Lượt quét đã hết hạn hoặc đã dùng. Hãy chụp lại.',
  TEST_TEMPLATE_REQUIRED: 'Hãy đăng ký mẫu test trước khi đối chiếu.',
  DELETE_TEST_TEMPLATE_FIRST: 'Xóa phiên hiện tại trước khi đăng ký người khác.',
  TEST_AI_BUSY: 'AI đang xử lý lượt quét khác. Vui lòng thử lại.',
  TEST_NONCE_INVALID: 'Mã phiên không hợp lệ. Hãy bắt đầu lượt quét mới.',
  MODEL_NOT_READY: 'Model nhận diện chưa sẵn sàng.',
  INVALID_TEST_IMAGE: 'Ảnh không hợp lệ hoặc vượt giới hạn 5 MB.',
  TEST_INFERENCE_FAILED: 'AI không xử lý được ảnh. Hãy thử lại.',
  TEST_PAYLOAD_TOO_LARGE: 'Ảnh vượt giới hạn dung lượng.',
};

export async function faceRequest(path, { method = 'GET', data, workspace, signal } = {}) {
  let response;
  try {
    response = await fetch(ROOT + path, { method, signal, cache: 'no-store', credentials: 'omit',
      headers: { 'content-type': 'application/json', 'x-test-face-client': '1', ...(workspace ? { 'x-face-workspace': workspace } : {}) },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw Error(FACE_ERRORS.TEST_AI_UNAVAILABLE);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(FACE_ERRORS[result.detail] || `Không hoàn tất yêu cầu (${result.detail || response.status}).`);
  return result;
}

export function blobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('Không đọc được ảnh camera.'));
    reader.readAsDataURL(blob);
  });
}
