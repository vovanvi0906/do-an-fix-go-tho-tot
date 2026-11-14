import React, { useEffect } from 'react';
import { ArrowLeft, Fingerprint, RefreshCw, Trash2, ShieldCheck, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import CapturePanel from './components/CapturePanel';
import ResultPanel from './components/ResultPanel';
import TrialHistory from './components/TrialHistory';
import { useFaceCamera } from './hooks/useFaceCamera';
import { useFaceTest } from './hooks/useFaceTest';
import './testAi.css';

export default function TestAiPage() {
  const camera = useFaceCamera(), test = useFaceTest();
  const caps = test.capabilities;
  const ready = caps?.identityReady && caps?.padReady;
  useEffect(() => { const previous = document.title; document.title = 'FaceID Test · FixGo AI Studio'; return () => { document.title = previous; }; }, []);
  useEffect(() => { camera.pause(test.busy); }, [test.busy]);
  const changeMode = purpose => { camera.clearShot(); test.setPurpose(purpose); };
  const erase = async () => { camera.stop(); camera.clearShot(); await test.erase(); };
  const consent = checked => { test.setConsent(checked); if (!checked) { camera.stop(); camera.clearShot(); } };
  return <main className="face-test">
    <header className="ft-topbar"><Link to="/" className="ft-brand"><Fingerprint size={28} /><strong>FixGo<span> / AI Studio</span></strong></Link><div><span className="ft-pill">LOCAL TEST ONLY</span><Link to="/" className="ft-back"><ArrowLeft size={15} />Về ứng dụng</Link></div></header>
    <div className="ft-content"><div className="ft-intro"><div><span className="ft-eyebrow">FACE ID PLAYGROUND</span><h1>Quét khuôn mặt.<br /><span>Kiểm chứng từng bước.</span></h1><p>Đăng ký mẫu tạm, quét lại và xem trực tiếp chất lượng ảnh,<br className="ft-desktop-break" /> điểm nhận diện cùng khả năng chống giả mạo.</p></div><div className="ft-connection"><span className={`ft-pill ${ready ? 'ft-good' : 'ft-warn'}`}>{test.connecting ? 'ĐANG KHỞI ĐỘNG AI…' : ready ? '● AI SẴN SÀNG' : 'AI CHƯA SẴN SÀNG'}</span><span>YuNet · SFace 128D · MN3</span><button onClick={test.connect} disabled={test.connecting || test.busy}><RefreshCw size={14} />Kết nối lại</button></div></div>
      <div className="ft-consent"><ShieldCheck size={22} /><label><input type="checkbox" checked={test.consent} disabled={test.busy} onChange={e => consent(e.target.checked)} /><span>Tôi đồng ý dùng ảnh camera để thử nghiệm trong phiên này.<small>Ảnh xử lý trong bộ nhớ; chỉ embedding mẫu được giữ tạm trên AI. Không ghi database, không sửa hồ sơ thợ. Mẫu hết hạn sau 30 phút không hoạt động hoặc khi dừng Vite.</small></span></label></div>
      {test.error && <div className="ft-error ft-banner" role="alert">{test.error}</div>}
      {caps && !ready && <div className="ft-error ft-banner" role="alert">Model chưa sẵn sàng: {caps.modelError || caps.padError || 'Kiểm tra runtime và weights.'}</div>}
      <div className="ft-workflow"><div className="ft-mode-switch"><button className={test.purpose === 'ENROLL' ? 'active' : ''} disabled={test.busy || test.enrolled} onClick={() => changeMode('ENROLL')}><span>{test.enrolled ? <Check size={14} /> : '1'}</span>Đăng ký mẫu</button><i /><button className={test.purpose === 'VERIFY' ? 'active' : ''} disabled={test.busy || !test.enrolled} onClick={() => changeMode('VERIFY')}><span>2</span>Quét & đối chiếu</button></div><button className="ft-button ft-danger" onClick={erase} disabled={test.busy}><Trash2 size={15} />Xóa phiên & mẫu</button></div>
      <div className="ft-main-grid"><CapturePanel camera={camera} busy={test.busy || test.enrolled && test.purpose === 'ENROLL'} consent={test.consent} ready={ready} purpose={test.purpose} onSubmit={test.submit} /><ResultPanel result={test.result} busy={test.busy} capabilities={caps} onVerify={() => changeMode('VERIFY')} onRetake={camera.clearShot} /></div>
      <TrialHistory history={test.history} onExport={test.exportHistory} />
      <footer className="ft-footer"><span><Fingerprint size={15} />FixGo FaceID Test</span><p>Thử cùng người, khác người, ánh sáng yếu, ảnh in hoặc màn hình trước camera. Kết quả thử nghiệm không thay thế đánh giá bảo mật.</p><span>Không cấp proof · Không lưu ảnh</span></footer>
    </div>
  </main>;
}
