import { describe } from '../../lib/codes';
import type { Backend, CoreStatus, ResearchCapabilities } from '../../lib/types';
import { Icon, type IconName } from '../Icon';
import { ActionButton, Badge, Card, Empty, Kv } from '../ui';
import type { View } from '../layout/Sidebar';

export function Overview({ caps, status, backend, errors, hasResearch, hasCore, onConnection, onRefreshCaps, onRefreshStatus, onView }: {
  caps: ResearchCapabilities | null; status: CoreStatus | null; backend: Backend; errors: Record<string, string | null>;
  hasResearch: boolean; hasCore: boolean; onConnection: () => void; onRefreshCaps: () => void; onRefreshStatus: () => void; onView: (v: View) => void;
}) {
  const flows: { id: View; title: string; icon: IconName; steps: string; ready: boolean | null }[] = [
    { id: 'enroll', title: 'Enrollment', icon: 'enroll', steps: 'Connect → Consent → Session → Capture → PAD → Template', ready: backend === 'core' ? status?.canEnroll ?? null : caps ? true : null },
    { id: 'daily', title: 'Daily Verification', icon: 'daily', steps: 'Connect → Session → Capture → PAD → Match → Verification', ready: backend === 'core' ? status?.canVerifyDaily ?? null : caps ? true : null },
    { id: 'order', title: 'Order Verification', icon: 'order', steps: 'Connect → Order → Session → Capture → PAD → Match → Proof', ready: backend === 'core' ? status?.canVerifyOrder ?? null : caps ? true : null },
  ];
  const err = (k: string) => errors[k] ? <p className="alert-box" role="alert"><b>{errors[k]}</b>: {describe(errors[k]).text}</p> : null;
  return (
    <div className="stack">
      <p className="callout callout-ne"><Icon name="question" size={16} /><span>PAD hiện <b>NOT_EVALUATED</b> → production fail closed. Lab không có thẩm quyền cấp FaceID proof và không có nút nào bỏ qua gate; mọi kết quả đến từ backend.</span></p>

      {!hasResearch && !hasCore && (
        <Card title="Bắt đầu" icon="plug">
          <ol className="list">
            <li>Chạy <code>./dev-local.sh faceid</code> (stack cô lập, DB dùng một lần).</li>
            <li>Mở Connection Settings và dán token từ file fixture riêng tư.</li>
            <li>Chọn chế độ <b>Research</b> (đo lường) hoặc <b>Face Core</b> (gate thật) ở thanh trên cùng.</li>
          </ol>
          <div className="btn-row"><ActionButton variant="primary" icon="plug" onClick={onConnection}>Nhập token</ActionButton></div>
        </Card>
      )}

      <div className="flow-cards">
        {flows.map(fl => (
          <button key={fl.id} type="button" className="flow-card" onClick={() => onView(fl.id)} aria-label={`Mở ${fl.title}`}>
            <span className="flow-card-head"><Icon name={fl.icon} size={18} /><b>{fl.title}</b>
              {fl.ready == null ? <Badge tone="neutral">chưa kiểm tra</Badge> : backend === 'core' ? <Badge status={fl.ready ? 'PASS' : 'BLOCKED'}>{fl.ready ? 'sẵn sàng' : 'bị chặn'}</Badge> : <Badge tone="info">đo lường</Badge>}
            </span>
            <span className="flow-card-steps">{fl.steps}</span>
          </button>
        ))}
      </div>

      <div className="view-grid">
        <Card title="Research service" icon="cpu" labelledBy="ov-research"
          actions={<ActionButton icon="refresh" variant="ghost" onClick={onRefreshCaps} reason={hasResearch ? null : 'Cần Research token.'}>Tải lại</ActionButton>}>
          {err('caps')}
          {caps ? (
            <Kv rows={[
              ['Identity model', <code className="wrap">{caps.modelVersion ?? '—'}</code>],
              ['PAD measurer', caps.padReady ? 'ready' : `unavailable ${caps.padErrorCode ?? ''}`],
              ['PAD evaluated', <><Badge status="NOT_EVALUATED">false</Badge> <code>{caps.padEvaluationStatus}</code></>],
              ['Camera upload', <><Badge status={caps.cameraAllowed ? 'ALLOWED' : 'BLOCKED'}>{caps.cameraAllowed ? 'ALLOWED' : 'BLOCKED'}</Badge> protocol={caps.protocolReference ?? '—'} consent={String(caps.participantConsentReady ?? false)}</>],
              ['Session TTL', `${caps.sessionTtlMs ? caps.sessionTtlMs / 1000 + 's' : '—'} · ${caps.maxAttemptsPerSession ?? 3} lần/session`],
            ]} />
          ) : <Empty>{hasResearch ? 'Chưa tải. Bấm “Tải lại”.' : 'Chưa có Research token.'}</Empty>}
        </Card>
        <Card title="Face Core" icon="server" labelledBy="ov-core"
          actions={<ActionButton icon="refresh" variant="ghost" onClick={onRefreshStatus} reason={hasCore ? null : 'Cần Face Core JWT.'}>Tải lại</ActionButton>}>
          {err('status')}
          {status ? (
            <Kv rows={[
              ['Enrollment', status.enrollmentStatus],
              ['Blockers', status.blockers.length ? <Badge status="BLOCKED">{status.blockers.length} gate đang chặn</Badge> : <Badge status="PASS">none</Badge>],
              ['can enroll/daily/order', `${status.canEnroll} / ${status.canVerifyDaily} / ${status.canVerifyOrder}`],
              ['PAD', <Badge status="NOT_EVALUATED">{status.padDecision}</Badge>],
            ]} />
          ) : <Empty>{hasCore ? 'Chưa tải. Bấm “Tải lại”.' : 'Chưa có Face Core JWT.'}</Empty>}
          {status && status.blockers.length > 0 && (
            <ul className="blockers" aria-label="Face Core blockers">{status.blockers.map(b => <li key={b}><Badge status="BLOCKED">{b}</Badge><span>{describe(b).text}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
