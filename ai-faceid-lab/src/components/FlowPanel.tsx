import { useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ApiError, LabClient, newRequestKey } from '../lib/api';
import { Camera, type Shot, type UploadPolicy } from './Camera';
import { TimelineHost, TimelineView } from './TimelineView';
import { describe, type Stage } from '../lib/codes';
import { applyCoreResult, applyError, applyMeasurement, emptyTimeline, setStage, type Timeline } from '../lib/timeline';
import { deriveSteps, outcomeOf, type ConnectionState, type ConsentState } from '../lib/workflow';
import type { Backend, Measurement, Purpose, Quality, SessionMeta } from '../lib/types';
import { Stepper, StateLegend } from './Stepper';
import { ResultCard } from './ResultCard';
import { ActionButton, Badge, Card, Hints } from './ui';
import { Icon } from './Icon';

export interface RunRecord { purpose: Purpose; backend: Backend; measurement: Measurement | null; timeline: Timeline; probeUrl: string | null; e2eMs: number | null; at: number }
/** Live flow state reported to the shell (inspector rail + debug drawer). Contains no nonce. */
export interface FlowState { purpose: Purpose; backend: Backend; session: Omit<SessionMeta, 'nonce'> | null; requestKey: string; timeline: Timeline; busy: boolean }

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const mask = (v: string) => (v.length > 8 ? `${v.slice(0, 6)}…(${v.length})` : '••••');
const PURPOSE_LABEL: Record<Purpose, string> = { ENROLLMENT: 'Enrollment', DAILY: 'Daily verification', ORDER: 'Order verification' };

/**
 * One verification flow (ENROLLMENT/DAILY/ORDER) against either backend.
 *  - research: isolated measurement lab, never authority.
 *  - core: real Face Core gates (session → capture → evidence → proof).
 * The UI only presents; every gate result comes from the backend response.
 */
export function FlowPanel({ purpose, backend, research, core, other, orderId, onRun, children, researchCameraAllowed, coreBlockers = [],
  connection, connectionCode, consent, uploadPolicy, lastQuality, onState }: {
  purpose: Purpose;
  coreBlockers?: string[];
  researchCameraAllowed: boolean;
  backend: Backend;
  research: LabClient | null;
  core: LabClient | null;
  other: LabClient | null;
  orderId?: string;
  onRun: (r: RunRecord) => void;
  children?: React.ReactNode;
  connection?: ConnectionState;
  connectionCode?: string | null;
  consent?: ConsentState;
  uploadPolicy?: UploadPolicy;
  lastQuality?: Quality | null;
  onState?: (s: FlowState) => void;
}) {
  const client = backend === 'research' ? research : core;
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [requestKey, setRequestKey] = useState(newRequestKey());
  const [timeline, setTimeline] = useState<Timeline>(emptyTimeline());
  const [shots, setShots] = useState<Record<string, Shot | undefined>>({});
  const [busy, setBusy] = useState(false);
  const now = useNow();
  const host = useContext(TimelineHost);
  const hintId = useId();
  const needsReference = backend === 'research' && purpose !== 'ENROLLMENT';
  const slots = needsReference ? ['reference', 'probe'] : ['probe'];
  const onShots = useCallback((s: Record<string, Shot | undefined>) => setShots(s), []);

  useEffect(() => { setSession(null); setTimeline(emptyTimeline()); setRequestKey(newRequestKey()); }, [backend, purpose, orderId]);
  useEffect(() => {
    if (!onState) return;
    const safe = session ? (({ nonce: _n, ...rest }) => rest)(session) : null; // nonce never leaves this component
    onState({ purpose, backend, session: safe, requestKey, timeline, busy });
  }, [onState, purpose, backend, session, requestKey, timeline, busy]);

  const blockers = backend === 'core' ? coreBlockers : [];
  const remaining = session ? Math.max(0, Math.round((Date.parse(session.expiresAt) - now) / 1000)) : null;

  async function guard<T>(phase: Parameters<typeof applyError>[1], fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('UNKNOWN', 0);
      const stage = stageFor(err.code, phase);
      const next = applyError(emptyTimeline(), stage, err.code, err.status, blockers);
      setTimeline(next);
      onRun({ purpose, backend, measurement: null, timeline: next, probeUrl: null, e2eMs: null, at: Date.now() });
      return null;
    }
  }

  async function createSession(opts: { orderOverride?: string; reuseKey?: boolean } = {}) {
    if (!client) return;
    setBusy(true);
    const key = opts.reuseKey ? requestKey : newRequestKey();
    setRequestKey(key);
    setTimeline(emptyTimeline());
    const oid = purpose === 'ORDER' ? (opts.orderOverride ?? orderId) : undefined;
    const s = await guard('SESSION', () => backend === 'research' ? client.researchSession(purpose, key, oid) : client.coreSession(purpose, key, oid));
    if (s) {
      setSession(s);
      const ref = `session ${s.id.slice(0, 8)}`;
      setTimeline(t => setStage(setStage(t, 'AUTH', { status: 'PASS', code: 'AUTHENTICATED', ref, detail: backend === 'core' ? 'JWT hợp lệ (JwtStrategy), role WORKER, worker ACTIVE; ownership kiểm tra phía server.' : 'Research JWT hợp lệ (audience riêng), worker APPROVED/ACTIVE.' }), 'SESSION', { ref, status: 'PASS', code: 'SESSION_CREATED', detail: `Session ${s.id.slice(0, 8)}… state=${s.state}, hết hạn ${new Date(s.expiresAt).toLocaleTimeString()} (nonce ràng buộc session/worker${purpose === 'ORDER' ? '/order' : ''}).` }));
    } else setSession(null);
    setBusy(false);
  }

  async function submit(kind: 'synthetic' | 'camera', opts: { nonce?: string; via?: LabClient | null } = {}) {
    const via = opts.via ?? client;
    if (!via || !session) return;
    const nonce = opts.nonce ?? session.nonce;
    setBusy(true);
    let t = timeline;
    if (kind === 'synthetic') t = setStage(t, 'CAMERA', { status: 'SKIPPED', code: 'SYNTHETIC_SERVER_PIXELS', detail: 'Không dùng camera: AI service tự tạo ảnh trống (không chứa người).' });
    else {
      if (backend === 'research' && !researchCameraAllowed) {
        // Data minimisation: do not transmit frames the service has not been approved to receive.
        const next = applyError(setStage(t, 'CAMERA', { status: 'BLOCKED', code: 'NOT_UPLOADED', detail: 'Ảnh giữ trong trình duyệt, không gửi đi.' }), 'POLICY', 'RESEARCH_CAPTURE_NOT_APPROVED');
        setTimeline(next); setBusy(false); return;
      }
      if (!shots.probe || (needsReference && !shots.reference)) {
        setTimeline(applyError(t, 'CAMERA', needsReference ? 'RESEARCH_REFERENCE_CAPTURE_REQUIRED' : 'CAMERA_NOT_READY'));
        setBusy(false); return;
      }
      t = setStage(t, 'CAMERA', { status: 'PASS', code: 'LIVE_CAPTURE', detail: `${needsReference ? 'reference + probe' : 'probe'} JPEG từ camera (${Math.round(shots.probe.blob.size / 1024)} KB).` });
    }
    setTimeline(t);
    const started = performance.now();
    try {
      if (backend === 'research') {
        const m = kind === 'synthetic' ? await via.researchSynthetic(session.id, nonce) : await via.researchCapture(session.id, nonce, shots.probe!.blob, shots.reference?.blob);
        const next = applyMeasurement(t, m);
        setTimeline(next);
        onRun({ purpose, backend, measurement: m, timeline: next, probeUrl: kind === 'camera' ? shots.probe!.url : null, e2eMs: performance.now() - started, at: Date.now() });
      } else {
        const r = await via.coreCapture(session.id, nonce, shots.probe!.blob);
        const next = applyCoreResult(t, r, `session ${session.id.slice(0, 8)}`);
        setTimeline(next);
        onRun({ purpose, backend, measurement: null, timeline: next, probeUrl: null, e2eMs: performance.now() - started, at: Date.now() });
      }
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('UNKNOWN', 0);
      const next = applyError(t, stageFor(err.code, 'DETECTION'), err.code, err.status, blockers, `session ${session.id.slice(0, 8)}`);
      setTimeline(next);
      onRun({ purpose, backend, measurement: null, timeline: next, probeUrl: null, e2eMs: performance.now() - started, at: Date.now() });
    }
    setBusy(false);
  }

  const hasCapture = !!shots.probe;
  const steps = useMemo(() => deriveSteps({
    purpose, backend, timeline, orderId, consent, connectionCode, hasSession: !!session, hasCapture,
    connection: connection ?? (client ? 'unchecked' : 'none'),
  }), [purpose, backend, timeline, orderId, consent, connectionCode, session, hasCapture, connection, client]);
  const outcome = useMemo(() => outcomeOf(timeline), [timeline]);

  // Disabled reasons: say why and what to do next.
  const noClient = !client ? `Chưa có ${backend === 'core' ? 'Face Core JWT' : 'Research token'} — mở Connection Settings.` : null;
  const noOrder = purpose === 'ORDER' && !orderId ? 'Nhập Order ID của đơn TEST (trạng thái ARRIVED).' : null;
  const noSession = !session ? 'Chưa có session — bấm “Tạo session” trước.' : null;
  const noOther = !other ? `Cần ${backend === 'core' ? 'Face Core JWT' : 'Research token'} worker #2 trong Connection Settings.` : null;
  const camBlocked = backend === 'research' && !researchCameraAllowed && session ? 'Research capture chưa được duyệt: bấm gửi sẽ được ghi nhận là BLOCKED và ảnh không rời trình duyệt.' : null;
  const createReason = noClient ?? noOrder;
  const sendReason = noClient ?? noSession;
  const timelineEl = <TimelineView timeline={timeline} />;

  return (
    <div className="flow" aria-busy={busy}>
      <div className="flow-steps">
        <Stepper steps={steps} label={`${PURPOSE_LABEL[purpose]} workflow`} />
        <StateLegend />
      </div>
      {busy && <p className="busy" role="status"><span className="spinner" aria-hidden="true" />Đang xử lý…</p>}

      <div className="flow-grid">
        <div className="flow-camera">
          <Card title="Camera" icon="camera" className="card-camera">
            <Camera slots={slots} onShots={onShots} disabled={busy} uploadPolicy={uploadPolicy ?? (backend === 'core' ? 'backend' : researchCameraAllowed ? 'allowed' : 'unknown')}
              lastQuality={lastQuality} onError={code => setTimeline(t => applyError(t, 'CAMERA', code))} />
          </Card>
        </div>

        <div className="flow-side">
          <ResultCard outcome={outcome} researchOnly={backend === 'research'} />

          <Card title="1 · Session" icon="session" actions={session ? <Badge tone={remaining === 0 ? 'blocked' : 'info'}>{remaining === 0 ? 'EXPIRED' : session.state}</Badge> : undefined}>
            <div className="btn-row">
              <ActionButton variant="primary" icon="play" onClick={() => createSession()} reason={createReason} busy={busy} describedBy={hintId}>Tạo session {purpose}</ActionButton>
              <ActionButton icon="refresh" onClick={() => createSession({ reuseKey: true })} reason={noClient ?? (!session ? 'Cần một session trước để retry cùng requestKey.' : null)} busy={busy}
                title="Gửi lại cùng requestKey: phải trả về cùng session (idempotent)" describedBy={hintId}>Retry cùng requestKey</ActionButton>
            </div>
            {session ? (
              <dl className="kv">
                <div className="kv-row"><dt>id</dt><dd><code data-testid="session-id">{session.id}</code></dd></div>
                <div className="kv-row"><dt>state</dt><dd>{session.state}</dd></div>
                <div className="kv-row"><dt>nonce</dt><dd><code>{mask(session.nonce)}</code></dd></div>
                <div className="kv-row"><dt>expires</dt><dd className={remaining === 0 ? 'text-blocked' : ''}>{new Date(session.expiresAt).toLocaleTimeString()} · còn {remaining}s{remaining === 0 ? ' (hết hạn — gửi để kiểm tra từ chối)' : ''}</dd></div>
                {session.templateVersion != null && <div className="kv-row"><dt>template v</dt><dd>{session.templateVersion}</dd></div>}
                {session.orderId && <div className="kv-row"><dt>order</dt><dd><code>{session.orderId}</code></dd></div>}
              </dl>
            ) : <p className="muted small">Chưa có session.</p>}
          </Card>

          <Card title="2 · Gửi" icon="send">
            <div className="btn-row">
              {backend === 'research' && <ActionButton variant="primary" icon="cpu" onClick={() => submit('synthetic')} reason={sendReason} busy={busy} describedBy={hintId}>Synthetic (server tự tạo ảnh)</ActionButton>}
              <ActionButton variant={backend === 'core' ? 'primary' : 'secondary'} icon="send" onClick={() => submit('camera')} reason={sendReason} busy={busy} describedBy={hintId}>Gửi ảnh camera</ActionButton>
            </div>
            {camBlocked && <p className="field-hint"><Icon name="lock" size={14} /> {camBlocked}</p>}
            {session && !hasCapture && !camBlocked && <p className="field-hint">Chụp {needsReference ? 'reference + probe' : 'probe'} trước khi gửi ảnh camera.</p>}
          </Card>

          <details className="card card-collapsible" open>
            <summary><Icon name="scenarios" size={16} />Kiểm thử âm tính</summary>
            <div className="btn-row">
              <ActionButton icon="x" onClick={() => backend === 'research' ? submit('synthetic', { nonce: 'replayed-or-forged-nonce' }) : submit('camera', { nonce: 'replayed-or-forged-nonce' })} reason={sendReason} busy={busy} describedBy={hintId}>Nonce sai/replay</ActionButton>
              <ActionButton icon="enroll" onClick={() => backend === 'research' ? submit('synthetic', { via: other }) : submit('camera', { via: other })} reason={sendReason ?? noOther} busy={busy}
                title="Dùng token của worker test thứ hai" describedBy={hintId}>Session của worker khác</ActionButton>
              {purpose === 'ORDER' && <ActionButton icon="order" onClick={() => createSession({ orderOverride: newRequestKey() })} reason={noClient} busy={busy} describedBy={hintId}>Order không thuộc worker</ActionButton>}
            </div>
            <p className="field-hint">Kết quả mong đợi: backend từ chối (BLOCKED tại Session). Lab không tự giả lập kết quả.</p>
          </details>
          <Hints id={hintId} items={[createReason, !createReason && sendReason, !sendReason && noOther]} />
          {children}
        </div>
      </div>

      {host ? createPortal(timelineEl, host) : <section className="card" aria-label="Debug timeline"><h3 className="sr-only">Debug timeline</h3>{timelineEl}</section>}
    </div>
  );
}

/** Stage where a rejection is shown as the stopping point (owner stage is also annotated by applyError). */
function stageFor(code: string, fallback: Stage): Stage {
  const owner = describe(code).stage;
  if (owner === 'AUTH' || owner === 'SESSION' || owner === 'CAMERA' || owner === 'IMAGE') return owner;
  if (owner === 'POLICY' || owner === 'PAD') return fallback === 'SESSION' ? 'SESSION' : 'POLICY';
  return fallback;
}
