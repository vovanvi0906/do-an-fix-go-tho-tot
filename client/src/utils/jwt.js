/**
 * Tiện ích xử lý và giải mã JSON Web Token (JWT) an toàn trên trình duyệt
 * Không cần cài đặt thêm thư viện ngoài (jwt-decode)
 */

/**
 * Giải mã Payload từ chuỗi JWT
 * @param {string} token - Chuỗi JWT token dạng: header.payload.signature
 * @returns {Object|null} Payload giải mã được hoặc null nếu token không hợp lệ
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Xử lý chuỗi Base64Url thành Base64 chuẩn
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Giải mã UTF-8 an toàn cho ký tự tiếng Việt hoặc ký tự đặc biệt
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ [JWT Parse Error]: Không thể giải mã token:', error.message);
    return null;
  }
}

/**
 * Kiểm tra xem JWT Token đã hết hạn hay chưa
 * @param {string} token - Chuỗi JWT token
 * @param {number} bufferSeconds - Số giây dung sai (mặc định 10 giây để trừ hao độ trễ mạng)
 * @returns {boolean} true nếu token đã hết hạn hoặc không hợp lệ, false nếu còn hạn
 */
export function isTokenExpired(token, bufferSeconds = 10) {
  if (!token) return true;

  const payload = parseJwt(token);
  if (!payload || !payload.exp) {
    // Nếu token không có trường exp (vô thời hạn hoặc sai định dạng) -> coi như hết hạn/không an toàn
    return true;
  }

  // payload.exp được tính bằng GIÂY (Unix timestamp)
  // Date.now() trả về MILI-GIÂY -> chia 1000 để quy đổi về giây
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);

  // Thêm buffer (ví dụ 10s): nếu token còn dưới 10s coi như đã hết hạn để tránh gọi API bị lỗi 401
  return payload.exp <= (currentTimeInSeconds + bufferSeconds);
}

/**
 * Lấy số giây còn lại trước khi token hết hạn
 * @param {string} token 
 * @returns {number} Số giây còn lại (âm nếu đã hết hạn)
 */
export function getTokenRemainingSeconds(token) {
  if (!token) return 0;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return 0;

  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTimeInSeconds);
}
