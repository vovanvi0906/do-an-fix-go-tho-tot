/** Camera helpers: live front camera only, frames kept in memory, tracks always stopped. */
export class CameraError extends Error {
  constructor(public readonly code: string) { super(code); this.name = 'CameraError'; }
}

export function cameraErrorCode(error: unknown): string {
  const name = (error as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'CAMERA_PERMISSION_DENIED';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'CAMERA_NOT_FOUND';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'CAMERA_IN_USE';
  // Chromium raises NotSupportedError when it cannot show a permission prompt (e.g. headless/kiosk).
  if (name === 'NotSupportedError' || name === 'TypeError') return 'CAMERA_UNSUPPORTED';
  if (error instanceof CameraError) return error.code;
  return 'CAMERA_CAPTURE_FAILED';
}

export async function openCamera(media: MediaDevices | undefined = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined): Promise<MediaStream> {
  if (!media?.getUserMedia) throw new CameraError('CAMERA_UNSUPPORTED');
  try {
    return await media.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
  } catch (error) {
    throw new CameraError(cameraErrorCode(error));
  }
}

export function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach(t => t.stop());
}

/** Grab one JPEG frame from a playing <video>. No EXIF, no disk, no gallery. */
export async function captureFrame(video: HTMLVideoElement, quality = 0.92): Promise<Blob> {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) throw new CameraError('CAMERA_NOT_READY');
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new CameraError('CAMERA_CAPTURE_FAILED');
  ctx.drawImage(video, 0, 0, w, h);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  canvas.width = canvas.height = 0; // release pixel buffer
  if (!blob) throw new CameraError('CAMERA_CAPTURE_FAILED');
  if (blob.size > 5 * 1024 * 1024) throw new CameraError('CAMERA_CAPTURE_FAILED');
  return blob;
}
