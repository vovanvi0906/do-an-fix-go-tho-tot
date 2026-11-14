import React from 'react';
import { Activity, CheckCircle2, ShieldCheck, ScanFace, XCircle, ArrowRight } from 'lucide-react';
const REASONS = { NO_FACE: 'Không tìm thấy khuôn mặt', MULTIPLE_FACES: 'Có nhiều khuôn mặt', FACE_SIZE_OR_CROP: 'Khuôn mặt quá nhỏ hoặc bị cắt', TOO_DARK: 'Ảnh quá tối', TOO_BRIGHT: 'Ảnh quá sáng', BLUR: 'Ảnh chưa đủ nét', TEST_PAD_BELOW_THRESHOLD: 'Điểm người thật dưới ngưỡng thử nghiệm', TEST_IDENTITY_NON_MATCH: 'Khuôn mặt không khớp mẫu test', PAD_TIMEOUT: 'PAD quá thời gian', PAD_TECHNICAL_ERROR: 'Lỗi xử lý PAD', IDENTITY_TECHNICAL_ERROR: 'Lỗi trích xuất khuôn mặt' };
const score = value => Number.isFinite(value) ? value.toFixed(4) : '—';
function Score({ icon: Icon, title, value, threshold, text, tone }) {
  return <div className="ft-score"><div className="ft-score-title"><Icon size={17} /><span>{title}</span><span className={`ft-pill ${tone || ''}`}>{text}</span></div><div className="ft-score-number">{score(value)}<small>ngưỡng {threshold.toFixed(2)}</small></div><div className="ft-score-track"><i style={{ width: `${Math.max(0, Math.min(1, value ?? 0)) * 100}%` }} /><span style={{ left: `${threshold * 100}%` }} /></div></div>;
}
export default function ResultPanel({ result, busy, capabilities: caps, onVerify, onRetake }) {
  const success = result?.testAccepted;
  return <section className="ft-card ft-results">
    <div className="ft-card-heading"><div><span className="ft-eyebrow">02 / KẾT QUẢ AI</span><h2>Phân tích lượt quét</h2></div><Activity size={20} /></div>
    {busy ? <div className="ft-result-empty" role="status"><div className="ft-skeleton" /><h3>Đang kiểm tra chất lượng, PAD và danh tính…</h3><div className="ft-skeleton" /></div> : !result ? <div className="ft-result-empty"><ScanFace size={46} strokeWidth={1} /><h3>Chưa có lượt đo</h3><p>Chụp và đăng ký mẫu, sau đó quét lại để thử cùng người, khác người hoặc ảnh trình trước camera.</p></div> : <>
      <div className={`ft-verdict ${success ? 'ft-verdict-pass' : 'ft-verdict-fail'}`}>{success ? <CheckCircle2 size={25} /> : <XCircle size={25} />}<div><h3>{success ? result.purpose === 'ENROLL' ? 'Đã lưu mẫu test tạm thời' : 'Đạt điều kiện đối chiếu test' : 'Chưa đạt điều kiện test'}</h3><p>{success ? 'Kết luận theo ngưỡng thử nghiệm; không cấp proof xác thực.' : 'Kiểm tra các lý do bên dưới, điều chỉnh và chụp lại.'}</p></div></div>
      <div className="ft-server-quality"><span>Chất lượng ảnh (server)</span><b className={result.quality?.decision === 'PASS' ? 'ft-text-good' : 'ft-text-warn'}>{result.quality?.decision}</b></div>
      <div className="ft-mini-metrics"><span>{result.quality?.faceCount ?? '—'} mặt</span><span>Sáng {score(result.quality?.brightness)}</span><span>Nét {score(result.quality?.sharpness)}</span></div>
      <Score icon={ScanFace} title="Nhận diện · SFace" value={result.identityScore} threshold={result.identityThreshold} text={result.identityScore == null ? 'CHƯA SO KHỚP' : result.identityDecision === 'TEST_MATCH' ? 'TEST MATCH' : 'TEST NON-MATCH'} tone={result.identityDecision === 'TEST_MATCH' ? 'ft-good' : ''} />
      <Score icon={ShieldCheck} title="Chống giả mạo · MN3" value={result.padRealScore} threshold={result.padThreshold} text={result.testPadDecision} tone={result.testPadDecision === 'TEST_PASS' ? 'ft-good' : 'ft-warn'} />
      {!!result.reasons?.length && <ul className="ft-reasons">{result.reasons.map(reason => <li key={reason}>{REASONS[reason] || reason}</li>)}</ul>}
      <div className="ft-server-quality"><span>Tổng thời gian AI</span><b>{result.latencyMs?.totalMs?.toFixed(0)} ms</b></div>
      {result.purpose === 'ENROLL' && success ? <button className="ft-button ft-primary ft-wide" onClick={onVerify}>Tiếp tục đối chiếu <ArrowRight size={17} /></button> : <button className="ft-button ft-wide" onClick={onRetake}>Quét lượt tiếp theo <ArrowRight size={17} /></button>}
      <details className="ft-details"><summary>Chi tiết pipeline & phiên bản</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
    </>}
    <div className="ft-policy-note"><ShieldCheck size={16} /><p>PAD đang ở mức thử nghiệm, chưa được đánh giá để cấp quyền nghiệp vụ. Điểm cosine và điểm PAD không phải tỷ lệ chính xác.</p></div>
    <div className="ft-model-status"><span><i className={caps?.identityReady ? 'ft-dot-ready' : ''} />YuNet + SFace</span><span><i className={caps?.padReady ? 'ft-dot-ready' : ''} />MN3 PAD</span><span>RAM · 30 phút</span></div>
  </section>;
}
