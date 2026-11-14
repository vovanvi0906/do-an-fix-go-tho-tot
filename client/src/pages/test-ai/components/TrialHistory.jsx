import React from 'react';
import { Download } from 'lucide-react';
const value = number => Number.isFinite(number) ? number.toFixed(4) : '—';
export default function TrialHistory({ history, onExport }) {
  return <section className="ft-card ft-history"><div className="ft-card-heading"><div><span className="ft-eyebrow">03 / NHẬT KÝ THỬ NGHIỆM</span><h2>Lịch sử trong phiên <small>{history.length}/20</small></h2></div><button className="ft-button" disabled={!history.length} onClick={onExport}><Download size={16} />Xuất JSON</button></div>
    {!history.length ? <p className="ft-history-empty">Kết quả từng lượt đo sẽ xuất hiện ở đây. File xuất chứa kết quả số, không chứa ảnh, embedding hoặc token phiên.</p> : <div className="ft-table-wrap"><table><thead><tr><th>Thời gian</th><th>Thao tác</th><th>Cosine</th><th>PAD real</th><th>Chất lượng</th><th>Kết quả test</th><th>AI</th></tr></thead><tbody>{history.map(row => <tr key={row.id}><td>{new Date(row.at).toLocaleTimeString('vi-VN')}</td><td>{row.purpose === 'ENROLL' ? 'Đăng ký mẫu' : 'Đối chiếu'}</td><td>{value(row.identityScore)}</td><td>{value(row.padRealScore)}</td><td>{row.quality?.decision}</td><td><span className={`ft-pill ${row.testAccepted ? 'ft-good' : 'ft-warn'}`}>{row.testAccepted ? 'ĐẠT TEST' : 'CHƯA ĐẠT'}</span></td><td>{row.latencyMs?.totalMs?.toFixed(0)} ms</td></tr>)}</tbody></table></div>}
  </section>;
}
