import { useCallback, useEffect, useState } from 'react';
import { ApiError, LabClient, newRequestKey } from '../lib/api';
import { Camera, type Shot } from './Camera';
import { TimelineView } from './TimelineView';
import { describe, type Stage } from '../lib/codes';
import { applyCoreResult, applyError, applyMeasurement, emptyTimeline, setStage, type Timeline } from '../lib/timeline';
import type { Backend, Measurement, Purpose, SessionMeta } from '../lib/types';

export interface RunRecord { purpose: Purpose; backend: Backend; measurement: Measurement | null; timeline: Timeline; probeUrl: string | null; e2eMs: number | null; at: number }

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const mask = (v: string) => (v.length > 8 ? `${v.slice(0, 6)}…(${v.length})` : '••••');

/**
 * One verification flow (ENROLLMENT/DAILY/ORDER) against either backend.
 *  - research: isolated measurement lab, never authority.
 *  - core: real Face Core gates (session → capture → evidence → proof).
 */
export function FlowPanel({ purpose, backend, research, core, other, orderId, onRun, children, researchCameraAllowed, coreBlockers = [] }: {
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
}) {
  const client = backend === 'research' ? research : core;
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [requestKey, setRequestKey] = useState(newRequestKey());
  const [timeline, setTimeline] = useState<Timeline>(emptyTimeline());
  const [shots, setShots] = useState<Record<string, Shot | undefined>>({});
  const [busy, setBusy] = useState(false);
  const now = useNow();
  const needsReference = backend === 'research' && purpose !== 'ENROLLMENT';
  const slots = needsReference ? ['reference', 'probe'] : ['probe'];
  const onShots = useCallback((s: Record<string, Shot | undefined>) => setShots(s), []);

  useEffect(() => { setSession(null); setTimeline(emptyTimeline()); setRequestKey(newRequestKey()); }, [backend, purpose, orderId]);

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

  const ready = !!client && !busy;
  return (
    <section className="panel" aria-busy={busy}>
      {busy && <p className="busy" role="status">Đang xử lý…</p>}
      <div className="grid2">
        <div>
          <h3>Session</h3>
          <div className="row">
            <button onClick={() => createSession()} disabled={!ready || (purpose === 'ORDER' && !orderId)}>Tạo session {purpose}</button>
            <button onClick={() => createSession({ reuseKey: true })} disabled={!ready || !session} title="Gửi lại cùng requestKey: phải trả về cùng session (idempotent)">Retry cùng requestKey</button>
          </div>
          {session ? (
            <dl className="kv">
              <dt>id</dt><dd><code>{session.id}</code></dd>
              <dt>state</dt><dd>{session.state}</dd>
              <dt>nonce</dt><dd><code>{mask(session.nonce)}</code></dd>
              <dt>expires</dt><dd className={remaining === 0 ? 'err' : ''}>{new Date(session.expiresAt).toLocaleTimeString()} · còn {remaining}s{remaining === 0 ? ' (hết hạn — gửi để kiểm tra từ chối)' : ''}</dd>
              {session.templateVersion != null && <><dt>template v</dt><dd>{session.templateVersion}</dd></>}
              {session.orderId && <><dt>order</dt><dd><code>{session.orderId}</code></dd></>}
            </dl>
          ) : <p className="muted">Chưa có session.</p>}
          <h3>Gửi</h3>
          <div className="row">
            {backend === 'research' && <button onClick={() => submit('synthetic')} disabled={!ready || !session}>Synthetic (server tự tạo ảnh)</button>}
            <button onClick={() => submit('camera')} disabled={!ready || !session}>Gửi ảnh camera</button>
          </div>
          <h3>Kiểm thử âm tính</h3>
          <div className="row wrap">
            <button onClick={() => backend === 'research' ? submit('synthetic', { nonce: 'replayed-or-forged-nonce' }) : submit('camera', { nonce: 'replayed-or-forged-nonce' })} disabled={!ready || !session}>Nonce sai/replay</button>
            <button onClick={() => backend === 'research' ? submit('synthetic', { via: other }) : submit('camera', { via: other })} disabled={!ready || !session || !other} title="Dùng token của worker test thứ hai">Session của worker khác</button>
            {purpose === 'ORDER' && <button onClick={() => createSession({ orderOverride: newRequestKey() })} disabled={!ready}>Order không thuộc worker</button>}
          </div>
          {!other && <p className="muted small">Nhập token worker thứ hai ở phần Kết nối để chạy kiểm thử sai worker.</p>}
          {children}
        </div>
        <div>
          <h3>Camera</h3>
          <Camera slots={slots} onShots={onShots} disabled={busy}
            onError={code => setTimeline(t => applyError(t, 'CAMERA', code))} />
        </div>
      </div>
      <h3>Debug timeline</h3>
      <TimelineView timeline={timeline} />
    </section>
  );
}

/** Stage where a rejection is shown as the stopping point (owner stage is also annotated by applyError). */
function stageFor(code: string, fallback: Stage): Stage {
  const owner = describe(code).stage;
  if (owner === 'AUTH' || owner === 'SESSION' || owner === 'CAMERA' || owner === 'IMAGE') return owner;
  if (owner === 'POLICY' || owner === 'PAD') return fallback === 'SESSION' ? 'SESSION' : 'POLICY';
  return fallback;
}
