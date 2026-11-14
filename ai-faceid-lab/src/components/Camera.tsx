import { useEffect, useRef, useState } from 'react';
import { CameraError, captureFrame, openCamera, stopStream } from '../lib/camera';
import { describe } from '../lib/codes';

export interface Shot { blob: Blob; url: string; at: number }

/**
 * Live camera only (no file upload / gallery): attack trials must be presented to the
 * camera, and arbitrary file injection is out of scope. Frames stay in memory as Blobs;
 * object URLs are revoked when replaced/cleared/unmounted.
 */
export function Camera({ slots, onShots, onError, disabled }: {
  slots: string[];
  onShots: (shots: Record<string, Shot | undefined>) => void;
  onError: (code: string) => void;
  disabled?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shots, setShots] = useState<Record<string, Shot | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  useEffect(() => () => {
    Object.values(shotsRef.current).forEach(s => s && URL.revokeObjectURL(s.url));
  }, []);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
    return () => stopStream(stream);
  }, [stream]);
  useEffect(() => { onShots(shots); }, [shots, onShots]);

  async function start() {
    setError(null);
    try { setStream(await openCamera()); } catch (e) {
      const code = e instanceof CameraError ? e.code : 'CAMERA_CAPTURE_FAILED';
      setError(code); onError(code);
    }
  }
  function stop() { stopStream(stream); setStream(null); }
  async function take(slot: string) {
    if (!video.current) return;
    try {
      const blob = await captureFrame(video.current);
      setShots(prev => {
        if (prev[slot]) URL.revokeObjectURL(prev[slot]!.url);
        return { ...prev, [slot]: { blob, url: URL.createObjectURL(blob), at: Date.now() } };
      });
    } catch (e) {
      const code = e instanceof CameraError ? e.code : 'CAMERA_CAPTURE_FAILED';
      setError(code); onError(code);
    }
  }
  function clear() {
    setShots(prev => { Object.values(prev).forEach(s => s && URL.revokeObjectURL(s.url)); return {}; });
  }

  return (
    <div className="camera">
      <div className="camera-view">
        <video ref={video} autoPlay playsInline muted aria-label="Camera preview" />
        {!stream && <div className="camera-off">Camera tắt</div>}
      </div>
      <div className="row">
        {!stream ? <button onClick={start} disabled={disabled}>Bật camera</button> : <button onClick={stop}>Tắt camera</button>}
        {slots.map(slot => <button key={slot} onClick={() => take(slot)} disabled={!stream || disabled}>Chụp {slot}</button>)}
        <button onClick={clear} disabled={!Object.keys(shots).length}>Xóa ảnh</button>
      </div>
      {error && <p className="err" role="alert">{error}: {describe(error).text}</p>}
      <div className="thumbs">
        {slots.map(slot => (
          <figure key={slot}>
            {shots[slot] ? <img src={shots[slot]!.url} alt={`${slot} capture`} /> : <div className="thumb-empty">—</div>}
            <figcaption>{slot}{shots[slot] ? ` · ${(shots[slot]!.blob.size / 1024).toFixed(0)} KB` : ''}</figcaption>
          </figure>
        ))}
      </div>
      <p className="muted small">Ảnh chỉ nằm trong bộ nhớ trình duyệt; không lưu localStorage/IndexedDB/đĩa. Không có upload file.</p>
    </div>
  );
}
