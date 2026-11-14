import { useEffect, useRef, useState } from 'react';
import { CameraError, captureFrame, openCamera, stopStream } from '../lib/camera';
import { describe } from '../lib/codes';
import { nextAction } from '../lib/guidance';
import type { Quality } from '../lib/types';
import { Icon } from './Icon';
import { Badge } from './ui';

export interface Shot { blob: Blob; url: string; at: number }
/** allowed: frames may be sent · blocked: policy forbids sending · unknown: not checked (treated as blocked) · backend: Face Core decides. */
export type UploadPolicy = 'allowed' | 'blocked' | 'unknown' | 'backend';

const POLICY_TEXT: Record<UploadPolicy, string> = {
  allowed: 'Upload được phép (research đã duyệt)',
  blocked: 'Upload bị chặn bởi policy — ảnh chỉ ở trong trình duyệt',
  unknown: 'Chưa kiểm tra policy — ảnh không được gửi',
  backend: 'Face Core quyết định khi gửi',
};

/**
 * Live camera only (no file upload / gallery): attack trials must be presented to the
 * camera, and arbitrary file injection is out of scope. Frames stay in memory as Blobs;
 * object URLs are revoked when replaced/cleared/unmounted. Nothing is sent from here:
 * transmission happens only in FlowPanel.submit, after the policy check.
 */
export function Camera({ slots, onShots, onError, disabled, uploadPolicy = 'backend', lastQuality }: {
  slots: string[];
  onShots: (shots: Record<string, Shot | undefined>) => void;
  onError: (code: string) => void;
  disabled?: boolean;
  uploadPolicy?: UploadPolicy;
  lastQuality?: Quality | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shots, setShots] = useState<Record<string, Shot | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;

  useEffect(() => () => {
    Object.values(shotsRef.current).forEach(s => s && URL.revokeObjectURL(s.url));
  }, []);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
    if (!stream) setRes(null);
    return () => stopStream(stream);
  }, [stream]);
  useEffect(() => { onShots(shots); }, [shots, onShots]);

  async function start() {
    setError(null); setStarting(true);
    try { setStream(await openCamera()); } catch (e) {
      const code = e instanceof CameraError ? e.code : 'CAMERA_CAPTURE_FAILED';
      setError(code); onError(code);
    }
    setStarting(false);
  }
  function stop() { stopStream(stream); setStream(null); }
  async function take(slot: string) {
    if (!video.current) return;
    try {
      const blob = await captureFrame(video.current);
      setError(null);
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
  const onMeta = () => { const v = video.current; if (v?.videoWidth) setRes(`${v.videoWidth}×${v.videoHeight}`); };
  const captured = slots.filter(s => shots[s]).length;
  const live = !!stream;
  const policyTone = uploadPolicy === 'allowed' ? 'success' : uploadPolicy === 'backend' ? 'neutral' : 'blocked';
  const q = lastQuality;

  return (
    <div className="camera">
      <div className={`cam-stage ${live ? 'is-live' : ''}`}>
        <video ref={video} autoPlay playsInline muted aria-label="Camera preview" onLoadedMetadata={onMeta} />
        {live && <div className="cam-guide" aria-hidden="true"><span /><span /><span /><span /></div>}
        <div className="cam-chips">
          <span className={`chip ${live ? 'chip-live' : ''}`}><span className="chip-dot" />{live ? `LIVE${res ? ` · ${res}` : ''}` : 'OFF'}</span>
          <span className={`chip chip-${policyTone}`} title={POLICY_TEXT[uploadPolicy]}><Icon name={uploadPolicy === 'allowed' ? 'send' : uploadPolicy === 'backend' ? 'server' : 'lock'} size={12} />
            {uploadPolicy === 'allowed' ? 'Upload: allowed' : uploadPolicy === 'backend' ? 'Upload: backend decides' : 'Upload: blocked'}</span>
        </div>
        {!live && (
          <div className="cam-off">
            <Icon name={error ? 'cameraOff' : 'camera'} size={40} />
            <div className="cam-off-title">{error ? 'Không mở được camera' : 'Camera tắt'}</div>
            {error && <p className="cam-err" role="alert"><b>{error}</b>: {describe(error).text}<br /><span>{nextAction(error)}</span></p>}
            <button type="button" className="btn btn-primary" onClick={start} disabled={disabled || starting}><Icon name="camera" size={16} /><span>Bật camera</span></button>
            <span className="cam-off-note">Chỉ camera trực tiếp · không upload file · khung hình giữ trong bộ nhớ</span>
          </div>
        )}
        {live && error && <p className="cam-err cam-err-live" role="alert"><b>{error}</b>: {describe(error).text}</p>}
      </div>

      <div className="cam-toolbar">
        {slots.map(slot => (
          <button key={slot} type="button" className="btn btn-primary" onClick={() => take(slot)} disabled={!live || disabled}
            title={!live ? 'Bật camera trước' : undefined}><Icon name="capture" size={16} /><span>Chụp {slot}</span></button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={clear} disabled={!captured} title={!captured ? 'Chưa có ảnh để xóa' : undefined}><Icon name="trash" size={16} /><span>Xóa ảnh</span></button>
        {live && <button type="button" className="btn btn-ghost" onClick={stop}><Icon name="stop" size={16} /><span>Tắt camera</span></button>}
        <span className="cam-status" aria-live="polite">{captured}/{slots.length} ảnh đã chụp</span>
      </div>
      {!live && !captured && <p className="field-hint">Bật camera để chụp. Bạn vẫn có thể tạo session trước.</p>}

      <div className="thumbs">
        {slots.map(slot => {
          const s = shots[slot];
          return (
            <figure key={slot} className={s ? 'has-shot' : ''}>
              {s ? <img src={s.url} alt={`${slot} capture`} /> : <div className="thumb-empty"><Icon name="image" size={20} /></div>}
              <figcaption>
                <b>{slot}</b>
                <span>{s ? `${(s.blob.size / 1024).toFixed(0)} KB · ${new Date(s.at).toLocaleTimeString()}` : 'Chưa chụp'}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="quality-row" aria-label="Quality indicators">
        <span className="qi"><span className="qi-k">Stream</span><span className="qi-v">{res ?? '—'}</span></span>
        <span className="qi"><span className="qi-k">Faces</span><span className="qi-v">{q?.faceCount ?? '—'}</span></span>
        <span className="qi"><span className="qi-k">Brightness</span><span className="qi-v">{q?.brightness != null ? q.brightness.toFixed(0) : '—'}</span></span>
        <span className="qi"><span className="qi-k">Sharpness</span><span className="qi-v">{q?.sharpness != null ? q.sharpness.toFixed(0) : '—'}</span></span>
        <span className="qi"><span className="qi-k">Quality</span><span className="qi-v">{q ? <Badge status={q.decision === 'PASS' ? 'PASS' : q.decision === 'FAIL' ? 'FAIL' : 'NOT_EVALUATED'}>{q.decision}</Badge> : '—'}</span></span>
      </div>
      <p className="field-hint">{q ? 'Faces/brightness/sharpness/quality: lần đo research gần nhất do server tính.' : 'Chỉ số quality do server tính sau khi gửi (research); Lab không tự ước lượng.'} {POLICY_TEXT[uploadPolicy]}.</p>
    </div>
  );
}
