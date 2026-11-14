import { useEffect, useState } from 'react';
import type { CoreStatus, ResearchCapabilities } from '../../lib/types';
import type { FlowState, RunRecord } from '../FlowPanel';
import { toneOf } from '../../lib/workflow';
import { Icon, type IconName } from '../Icon';
import { Badge, Meter } from '../ui';
import type { View } from './Sidebar';

const f = (v: number | null | undefined, d = 3) => (v == null ? '—' : v.toFixed(d));

function Section({ title, icon, children, onMore, moreLabel }: { title: string; icon: IconName; children: React.ReactNode; onMore?: () => void; moreLabel?: string }) {
  return (
    <section className="rail-section" aria-label={title}>
      <header><h3><Icon name={icon} size={14} />{title}</h3>{onMore && <button type="button" className="link" onClick={onMore} aria-label={moreLabel}>Chi tiết<Icon name="chevronRight" size={12} /></button>}</header>
      {children}
    </section>
  );
}
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="rail-row"><span>{k}</span><span>{v}</span></div>;

/** Right inspector: compact read-only summary of the latest run + live session. Data comes from backend responses only. */
export function InspectorRail({ run, flow, caps, status, onView }: { run: RunRecord | null; flow: FlowState | null; caps: ResearchCapabilities | null; status: CoreStatus | null; onView: (v: View) => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const m = run?.measurement ?? null;
  const d = m?.detection;
  const q = m?.quality;
  const pad = m?.padPolicy;
  const ip = m?.identityPolicy ?? caps?.identityPolicy ?? null;
  const s = flow?.session;
  const remaining = s ? Math.max(0, Math.round((Date.parse(s.expiresAt) - now) / 1000)) : null;
  const proofStage = flow?.timeline.find(x => x.stage === 'PROOF') ?? run?.timeline.find(x => x.stage === 'PROOF');
  const stamp = run ? `${run.purpose} · ${run.backend} · ${new Date(run.at).toLocaleTimeString()}` : null;

  return (
    <aside className="rail" aria-label="Inspector">
      <div className="rail-head"><h2>Inspector</h2><span className="muted small">{stamp ?? 'Chưa có lần chạy'}</span></div>

      <Section title="Face Detection" icon="identity" onMore={() => onView('identity')} moreLabel="Mở Identity Inspector">
        {d ? <>
          <Row k="Faces" v={<Badge status={d.faceCount === 1 ? 'PASS' : 'FAIL'}>{d.faceCount}</Badge>} />
          <Row k="Score" v={f(d.score)} />
          <Row k="Image" v={`${d.imageWidth}×${d.imageHeight}`} />
        </> : <p className="rail-empty">{run && !m ? 'Face Core không trả chi tiết detection.' : 'Chưa có số đo.'}</p>}
      </Section>

      <Section title="Quality" icon="check">
        {q ? <>
          <Row k="Decision" v={<Badge status={q.decision === 'PASS' ? 'PASS' : q.decision === 'FAIL' ? 'FAIL' : 'NOT_EVALUATED'}>{q.decision}</Badge>} />
          <Row k="Brightness" v={f(q.brightness, 1)} />
          <Row k="Sharpness" v={f(q.sharpness, 1)} />
          {q.reasons.length > 0 && <Row k="Reasons" v={<code>{q.reasons.join(', ')}</code>} />}
        </> : <p className="rail-empty">Chưa có số đo.</p>}
      </Section>

      <Section title="PAD" icon="pad" onMore={() => onView('pad')} moreLabel="Mở PAD Inspector">
        <Row k="Policy" v={<Badge status={pad?.decision ?? 'NOT_EVALUATED'} />} />
        <Row k="Reason" v={<code>{pad?.reason ?? caps?.padEvaluationStatus ?? status?.padDecision ?? '—'}</code>} />
        <Row k="real / spoof" v={m ? `${f(m.padRealScore)} / ${f(m.padSpoofScore)}` : '—'} />
        <p className="rail-note">Điểm MN3 là số đo, không phải quyết định PASS.</p>
      </Section>

      <Section title="Identity similarity" icon="activity" onMore={() => onView('identity')} moreLabel="Mở Identity Inspector (similarity)">
        {m?.identityScore != null ? <>
          <Meter value={m.identityScore} min={-1} max={1} threshold={ip?.threshold} label="cosine similarity" />
          <Row k="cosine" v={<b>{m.identityScore.toFixed(4)}</b>} />
          <Row k="threshold" v={`${ip?.threshold ?? '—'} (${ip?.status ?? '—'})`} />
        </> : <p className="rail-empty">{m ? <>Không có điểm: <code>{m.identityDecision}</code></> : 'Chưa có số đo.'}</p>}
      </Section>

      <Section title="Session / Proof" icon="session" onMore={() => onView('inspect')} moreLabel="Mở Session/Proof Inspector">
        {s ? <>
          <Row k="Session" v={<code>{s.id.slice(0, 8)}…</code>} />
          <Row k="Purpose" v={s.purpose} />
          <Row k="Expires" v={<span className={remaining === 0 ? 'text-blocked' : ''}>{remaining === 0 ? 'hết hạn' : `${remaining}s`}</span>} />
        </> : <p className="rail-empty">Không có session đang mở.</p>}
        <Row k="Proof" v={proofStage && proofStage.status !== 'PENDING' ? <Badge tone={toneOf(proofStage.status)}>{proofStage.code ?? proofStage.status}</Badge> : '—'} />
        {status && <Row k="Daily proof" v={status.dailyProof ? <Badge status="PASS">active</Badge> : <span className="muted">không có</span>} />}
      </Section>
    </aside>
  );
}
