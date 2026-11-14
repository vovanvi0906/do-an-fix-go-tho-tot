export function assessNativeFaces(faces, width, height) {
  if (faces.length !== 1)
    return {
      ok: false,
      message: faces.length
        ? "Chỉ một người trong khung hình"
        : "Đưa khuôn mặt vào khung",
    };
  const face = faces[0],
    box = face.frame;
  if (!box || !width || !height)
    return { ok: false, message: "Chưa đọc được khuôn mặt" };
  const ratio = box.width / width,
    cx = (box.left + box.width / 2) / width,
    cy = (box.top + box.height / 2) / height;
  const geometry = { cx, cy, ratio };
  if (ratio < 0.16)
    return { ...geometry, ok: false, message: "Đưa mặt gần camera hơn" };
  if (ratio > 0.8)
    return { ...geometry, ok: false, message: "Lùi xa camera một chút" };
  if (
    box.left < 0 ||
    box.top < 0 ||
    box.left + box.width > width ||
    box.top + box.height > height
  )
    return { ...geometry, ok: false, message: "Giữ trọn khuôn mặt trong hình" };
  if (Math.abs(cx - 0.5) > 0.18 || Math.abs(cy - 0.5) > 0.22)
    return { ...geometry, ok: false, message: "Căn mặt vào giữa khung" };
  if (!Number.isFinite(face.rotationY) || !Number.isFinite(face.rotationZ))
    return { ...geometry, ok: false, message: "Nhìn thẳng vào camera" };
  if (Math.abs(face.rotationZ) > 22)
    return { ...geometry, ok: false, message: "Giữ đầu thẳng" };
  if (Math.abs(face.rotationY) > 25)
    return { ...geometry, ok: false, message: "Nhìn thẳng vào camera" };
  return { ...geometry, ok: true, message: "Giữ yên khuôn mặt" };
}
export function captureStability(previous, quality, now) {
  if (!quality.ok)
    return { since: null, lastAt: now, quality, progress: 0, samples: 0 };
  const old = previous?.quality;
  const moved =
    old &&
    (Math.abs(quality.cx - old.cx) > 0.04 ||
      Math.abs(quality.cy - old.cy) > 0.04 ||
      Math.abs(quality.ratio - old.ratio) > 0.08);
  const fresh = !previous?.since || now - previous.lastAt > 1500 || moved;
  const since = fresh ? now : previous.since;
  const samples = fresh ? 1 : previous.samples + 1;
  return {
    since,
    lastAt: now,
    quality,
    samples,
    progress:
      samples >= 4
        ? Math.min(1, (now - since) / 1300)
        : Math.min(0.9, (now - since) / 1300),
  };
}
