import React from 'react';
import { Camera, CameraOff, ScanFace, RefreshCw, Send, Check } from 'lucide-react';

const metric = value => Number.isFinite(value) ? value.toFixed(0) : '—';
export default function CapturePanel({ camera, busy, consent, ready, purpose, onSubmit }) {
  const { status, quality: q, shot } = camera;
  const live = status === 'live';
  return <section className="ft-card ft-capture">
    <div className="ft-card-heading"><div><span className="ft-eyebrow">01 / CAMERA TRỰC TIẾP</span><h2>{purpose === 'ENROLL' ? 'Đăng ký mẫu test' : 'Quét để đối chiếu'}</h2></div><span className={`ft-pill ${live ? 'ft-good' : ''}`}>{live ? '● LIVE' : status === 'starting' ? 'ĐANG KHỞI TẠO' : 'CAMERA TẮT'}</span></div>
    <div className={`ft-viewport ${q.ok && !shot ? 'ft-aligned' : ''}`}>
      <video ref={camera.video} autoPlay playsInline muted aria-label="Camera quét khuôn mặt" className={shot ? 'ft-hidden-video' : ''} />
      {shot && <img className="ft-shot" src={shot.url} alt="Ảnh vừa chụp để test" />}
      {!shot && live && <div className="ft-oval" aria-hidden="true"><i /><span /></div>}
      {!live && !shot && <div className="ft-camera-empty"><ScanFace size={62} strokeWidth={1} /><h3>{status === 'starting' ? 'Đang tải camera & model…' : 'Sẵn sàng cho lượt quét'}</h3><p>Nhìn thẳng vào camera, chọn nơi đủ sáng.<br />Chỉ một khuôn mặt trong khung hình.</p>{status === 'starting' ? <div className="ft-skeleton" /> : <button className="ft-button ft-primary" onClick={camera.start} disabled={!consent || busy}><Camera size={17} />Bật camera</button>}</div>}
      {(live || shot) && <div className="ft-camera-caption"><span>{shot ? <><Check size={16} /> Đã chụp · {(shot.blob.size / 1024).toFixed(0)} KB</> : q.message}</span>{!shot && <div className="ft-progress"><i style={{ width: `${q.progress * 100}%` }} /></div>}</div>}
    </div>
    <div className="ft-camera-controls">
      <label className="ft-toggle"><input type="checkbox" checked={camera.automatic} onChange={e => camera.setAutomatic(e.target.checked)} disabled={busy} /><span>Tự chụp sau 1,3 giây ổn định</span></label>
      {live && <button className="ft-icon-button" onClick={camera.stop} disabled={busy} title="Tắt camera" aria-label="Tắt camera"><CameraOff size={18} /></button>}
    </div>
    {camera.error && <p className="ft-error" role="alert">{camera.error}</p>}
    <div className="ft-live-metrics"><div><span>Khuôn mặt</span><b>{q.faces ?? '—'}</b></div><div><span>Độ sáng</span><b>{metric(q.brightness)}</b></div><div><span>Độ nét</span><b>{metric(q.sharpness)}</b></div><div><span>Ổn định</span><b>{shot ? 'Đã chụp' : `${Math.round(q.progress * 100)}%`}</b></div></div>
    <p className="ft-fineprint">Chỉ số trực tiếp giúp căn mặt; server kiểm tra lại trên ảnh gốc. Căn mặt và tự chụp không phải kiểm tra người thật.</p>
    <div className="ft-actions">
      {shot ? <><button className="ft-button" onClick={camera.clearShot} disabled={busy}><RefreshCw size={16} />Chụp lại</button><button className="ft-button ft-primary" onClick={() => onSubmit(shot)} disabled={busy || !consent || !ready}><Send size={16} />{busy ? 'AI đang xử lý…' : purpose === 'ENROLL' ? 'Đăng ký mẫu test' : 'Đối chiếu khuôn mặt'}</button></> : <button className="ft-button" onClick={camera.take} disabled={!live || busy || !q.ok}><Camera size={16} />Chụp khi đủ điều kiện</button>}
      {!live && shot && <button className="ft-button" onClick={camera.start} disabled={busy || !consent}>Bật lại camera</button>}
    </div>
  </section>;
}
