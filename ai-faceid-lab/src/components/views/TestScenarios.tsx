import { Icon } from '../Icon';
import { Badge, Card } from '../ui';
import type { View } from '../layout/Sidebar';

const SCENARIOS: { name: string; where: View; whereLabel: string; how: string; expect: string; needsOther?: boolean }[] = [
  { name: 'Idempotent retry', where: 'daily', whereLabel: 'Daily', how: 'Tạo session → “Retry cùng requestKey”.', expect: 'Cùng session id (idempotent).' },
  { name: 'Nonce giả / replay', where: 'daily', whereLabel: 'Daily', how: 'Có session → “Nonce sai/replay”.', expect: 'BLOCKED tại Session: RESEARCH_NONCE_INVALID / INVALID_NONCE.' },
  { name: 'Session của worker khác', where: 'daily', whereLabel: 'Daily', how: 'Nhập token worker #2 → nút tương ứng trong “Kiểm thử âm tính”.', expect: 'BLOCKED: RESEARCH_SESSION_DENIED / SESSION_ACCESS_DENIED.', needsOther: true },
  { name: 'Gửi trùng lặp', where: 'daily', whereLabel: 'Daily', how: 'Gửi synthetic hai lần trên cùng session.', expect: 'Kết quả đã lưu được trả lại, không đo lại.' },
  { name: 'Session hết hạn', where: 'daily', whereLabel: 'Daily', how: 'Chờ hết TTL → gửi.', expect: 'BLOCKED: RESEARCH_SESSION_EXPIRED / SESSION_EXPIRED.' },
  { name: 'Order không thuộc worker', where: 'order', whereLabel: 'Order', how: '“Order không thuộc worker” hoặc nhập orderId của worker khác.', expect: 'BLOCKED tại Order authorization: RESEARCH_ORDER_DENIED / ORDER_ACCESS_DENIED.' },
  { name: 'Order chưa ARRIVED', where: 'order', whereLabel: 'Order', how: 'Nhập orderId chưa ARRIVED → tạo session.', expect: 'BLOCKED: RESEARCH_ORDER_STAGE_INVALID / FACE_STAGE_NOT_ALLOWED.' },
  { name: 'Camera chưa được duyệt', where: 'enroll', whereLabel: 'Enrollment', how: 'Research mode → chụp → “Gửi ảnh camera”.', expect: 'BLOCKED tại Policy; không có request /capture.' },
  { name: 'PAD chưa đánh giá (Face Core)', where: 'enroll', whereLabel: 'Enrollment', how: 'Face Core mode → tạo session.', expect: 'BLOCKED; PAD NOT_EVALUATED; không template/proof.' },
  { name: 'Từ chối quyền camera', where: 'enroll', whereLabel: 'Enrollment', how: 'Chặn quyền camera trong trình duyệt → bật camera.', expect: 'BLOCKED tại Camera: CAMERA_PERMISSION_DENIED.' },
  { name: 'Mất mạng', where: 'enroll', whereLabel: 'Enrollment', how: 'Ngắt mạng (DevTools offline) → tạo session.', expect: 'ERROR: NETWORK_UNAVAILABLE.' },
];

export function TestScenarios({ onView, hasOther, children }: { onView: (v: View) => void; hasOther: boolean; children: React.ReactNode }) {
  return (
    <div className="stack">
      <Card title="Negative test catalog" icon="scenarios">
        <p className="field-hint">Mỗi kịch bản chạy trong workflow tương ứng; kết quả mong đợi là backend từ chối. Lab không giả lập kết quả.</p>
        <div className="scroll"><table className="tbl scenarios">
          <thead><tr><th>Kịch bản</th><th>Cách chạy</th><th>Kỳ vọng</th><th /></tr></thead>
          <tbody>{SCENARIOS.map(s => (
            <tr key={s.name}>
              <td><b>{s.name}</b>{s.needsOther && !hasOther && <div><Badge tone="blocked">cần token worker #2</Badge></div>}</td>
              <td>{s.how}</td><td>{s.expect}</td>
              <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => onView(s.where)} aria-label={`Đi tới ${s.whereLabel} cho kịch bản ${s.name}`}>{s.whereLabel}<Icon name="chevronRight" size={12} /></button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
      {children}
    </div>
  );
}
