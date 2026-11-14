export const HOLD_MS = 1300;
export const EDGE_POLICY = { minRatio: .16, maxRatio: .80, maxRoll: 22, maxYaw: .52, minLight: 40, maxLight: 220, minSharpness: 60 };

/** Heuristics for capture guidance only, never identity or liveness decisions. */
export function assessGeometry(detections, width, height) {
  if (detections.length !== 1) return { ok: false, message: detections.length ? 'Chỉ một người trong khung hình' : 'Đưa khuôn mặt vào khung', faces: detections.length };
  const { boundingBox: box, keypoints = [] } = detections[0];
  if (!box || box.width <= 0 || box.height <= 0) return { ok: false, message: 'Chưa xác định được khuôn mặt', faces: 1 };
  const ratio = box.width / width;
  const common = { faces: 1, box, ratio };
  if (ratio < EDGE_POLICY.minRatio) return { ...common, ok: false, message: 'Đưa mặt gần camera hơn' };
  if (ratio > EDGE_POLICY.maxRatio) return { ...common, ok: false, message: 'Lùi xa camera một chút' };
  if (box.originX < 0 || box.originY < 0 || box.originX + box.width > width || box.originY + box.height > height) return { ...common, ok: false, message: 'Giữ trọn khuôn mặt trong hình' };
  const cx = (box.originX + box.width / 2) / width, cy = (box.originY + box.height / 2) / height;
  if (Math.abs(cx - .5) > .18 || Math.abs(cy - .5) > .22) return { ...common, ok: false, message: 'Căn mặt vào giữa khung' };
  if (keypoints.length < 3) return { ...common, ok: false, message: 'Nhìn thẳng để nhận đủ điểm mặt' };
  const [eyeA, eyeB, nose] = keypoints;
  const dx = (eyeB.x - eyeA.x) * width, dy = (eyeB.y - eyeA.y) * height;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return { ...common, ok: false, message: 'Nhìn thẳng vào camera' };
  const roll = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
  const yaw = Math.abs(nose.x - (eyeA.x + eyeB.x) / 2) * width / distance;
  if (roll > EDGE_POLICY.maxRoll) return { ...common, ok: false, message: 'Giữ đầu thẳng', roll, yaw };
  if (yaw > EDGE_POLICY.maxYaw) return { ...common, ok: false, message: 'Nhìn thẳng vào camera', roll, yaw };
  return { ...common, ok: true, message: 'Giữ yên khuôn mặt', roll, yaw };
}

export function pixelQuality({ data, width, height }) {
  const gray = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0; i < gray.length; i++) { gray[i] = .299 * data[i * 4] + .587 * data[i * 4 + 1] + .114 * data[i * 4 + 2]; sum += gray[i]; }
  let lap = 0, squared = 0, count = 0;
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    const value = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
    lap += value; squared += value * value; count++;
  }
  const brightness = sum / gray.length;
  const sharpness = count ? Math.max(0, squared / count - (lap / count) ** 2) : 0;
  const ok = brightness >= EDGE_POLICY.minLight && brightness <= EDGE_POLICY.maxLight && sharpness >= EDGE_POLICY.minSharpness;
  const message = brightness < EDGE_POLICY.minLight ? 'Tìm nơi sáng hơn' : brightness > EDGE_POLICY.maxLight ? 'Tránh ánh sáng quá gắt' : sharpness < EDGE_POLICY.minSharpness ? 'Ảnh mờ — lau camera và giữ yên' : 'Giữ yên khuôn mặt';
  return { brightness, sharpness, ok, message };
}

export function stableProgress(previous, quality, now, lastAt) {
  if (!quality.ok || (lastAt != null && now - lastAt > 350)) return { since: quality.ok ? now : null, progress: 0 };
  const since = previous ?? now;
  return { since, progress: Math.min(1, (now - since) / HOLD_MS) };
}
