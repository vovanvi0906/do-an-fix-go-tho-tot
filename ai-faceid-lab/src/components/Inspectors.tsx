import { Fragment } from 'react';
import { describe, PAD_LIMITATIONS } from '../lib/codes';
import type { LabInspect, Measurement, ResearchCapabilities } from '../lib/types';
import type { RunRecord } from './FlowPanel';

const f = (v: number | null | undefined, d = 4) => (v == null ? '—' : v.toFixed(d));

export function PadInspector({ caps, run }: { caps: ResearchCapabilities | null; run: RunRecord | null }) {
  const m = run?.measurement;
  const p = m?.padPolicy;
  return (
    <section className="panel">
      <h2>PAD Inspector</h2>
      <div className="grid2">
        <div>
          <h3>Provider status</h3>
          <dl className="kv">
            <dt>Provider</dt><dd>{caps ? (caps.padReady ? 'MN3 loaded (experimental, measurement only)' : `Không sẵn sàng: ${caps.padErrorCode ?? 'unknown'}`) : '— (chưa kết nối research)'}</dd>
            <dt>padEvaluated</dt><dd><span className="badge b-NOT_EVALUATED">{String(caps?.padEvaluated ?? false)}</span></dd>
            <dt>Evaluation record</dt><dd><code>{caps?.padEvaluationStatus ?? '—'}</code><div className="small">{caps?.padEvaluationStatus ? describe(caps.padEvaluationStatus).text : ''}</div></dd>
            <dt>Model</dt><dd><code className="wrap">{caps?.padModelVersion ?? '—'}</code></dd>
            <dt>Proof allowed</dt><dd>{String(caps?.proofAllowed ?? false)}</dd>
            <dt>Production gate</dt><dd>Face Core <code>ready()</code> yêu cầu <code>padEvaluated=true</code> + <code>padModelVersion</code>; gateway hiện luôn trả false → <code>PAD_NOT_EVALUATED</code>.</dd>
          </dl>
        </div>
        <div>
          <h3>Lần đo gần nhất</h3>
          {m ? (
            <dl className="kv">
              <dt>PAD decision</dt><dd><span className={`badge b-${p?.decision ?? 'NOT_EVALUATED'}`}>{p?.decision ?? m.padDecision}</span></dd>
              <dt>Lý do</dt><dd><code>{p?.reason ?? m.padErrorCode ?? '—'}</code><div className="small">{describe(p?.reason ?? m.padErrorCode ?? 'PAD_NOT_EVALUATED').text}</div></dd>
              <dt>evaluated</dt><dd>{String(p?.evaluated ?? false)}</dd>
              <dt>real / spoof</dt><dd>{f(m.padRealScore)} / {f(m.padSpoofScore)} <span className="muted small">(số đo)</span></dd>
              {m.referencePadRealScore != null && <><dt>reference real/spoof</dt><dd>{f(m.referencePadRealScore)} / {f(m.referencePadSpoofScore)}</dd></>}
              <dt>Timing</dt><dd>PAD {f(m.latencyMs.probePadMs, 1)} ms · crop {f(m.latencyMs.probeCropResizeMs, 2)} ms · tổng {f(m.latencyMs.totalMs, 1)} ms</dd>
              <dt>Preprocess</dt><dd><code>{m.preprocessingVersion}</code></dd>
              <dt>Crop</dt><dd><code>{m.cropVersion}</code></dd>
            </dl>
          ) : <p className="muted">Chưa có lần đo nào trong research mode.</p>}
        </div>
      </div>
      <h3>Giới hạn phương pháp chống giả mạo</h3>
      <ul>{PAD_LIMITATIONS.map(x => <li key={x}>{x}</li>)}</ul>
    </section>
  );
}

function Box({ m, url }: { m: Measurement; url: string | null }) {
  const d = m.detection;
  if (!d) return null;
  return (
    <svg className="det" viewBox={`0 0 ${d.imageWidth} ${d.imageHeight}`} role="img" aria-label="Detection overlay">
      {url ? <image href={url} width={d.imageWidth} height={d.imageHeight} /> : <rect width={d.imageWidth} height={d.imageHeight} className="det-bg" />}
      {d.box && <rect x={d.box[0]} y={d.box[1]} width={d.box[2]} height={d.box[3]} className="det-box" />}
      <text x={8} y={24} className="det-text">faces={d.faceCount}{d.score != null ? ` score=${d.score.toFixed(3)}` : ''}</text>
    </svg>
  );
}

export function IdentityInspector({ run }: { run: RunRecord | null }) {
  const m = run?.measurement;
  if (!m) return <section className="panel"><h2>Identity Inspector</h2><p className="muted">Chạy một phép đo research (Enrollment/Daily/Order) để xem chi tiết.</p></section>;
  const q = m.quality, qp = m.qualityPolicy, ip = m.identityPolicy;
  const check = (ok: boolean | null) => (ok == null ? '—' : ok ? '✓' : '✗');
  const score = m.identityScore;
  return (
    <section className="panel">
      <h2>Identity Inspector</h2>
      <div className="grid2">
        <div>
          <h3>YuNet detection</h3>
          <Box m={m} url={run?.probeUrl ?? null} />
          <dl className="kv">
            <dt>Ảnh</dt><dd>{m.detection ? `${m.detection.imageWidth}×${m.detection.imageHeight}` : '—'}</dd>
            <dt>Box</dt><dd>{m.detection?.box ? m.detection.box.map(v => v.toFixed(0)).join(', ') : '—'}</dd>
            <dt>Alignment</dt><dd>{m.alignment ? `${m.alignment.method} · ${m.alignment.performed ? 'đã thực hiện' : 'chưa thực hiện'}` : '—'} <span className="muted small">(landmarks không xuất ra)</span></dd>
            <dt>Thời gian</dt><dd>detect {f(m.latencyMs.probeDetectionMs, 1)} ms · SFace {f(m.latencyMs.probeSfaceMs, 1)} ms</dd>
          </dl>
        </div>
        <div>
          <h3>Quality checks</h3>
          <table className="tbl">
            <thead><tr><th>Check</th><th>Giá trị</th><th>Ngưỡng</th><th /></tr></thead>
            <tbody>
              <tr><td>Số khuôn mặt</td><td>{q.faceCount ?? '—'}</td><td>= 1</td><td>{check(q.faceCount == null ? null : q.faceCount === 1)}</td></tr>
              <tr><td>Detector score</td><td>{f(m.detection?.score, 3)}</td><td>≥ {qp?.minDetectionScore ?? 0.6}</td><td>{check(m.detection?.score == null ? null : m.detection.score >= (qp?.minDetectionScore ?? .6))}</td></tr>
              <tr><td>Kích thước mặt</td><td>{m.detection?.box ? Math.min(m.detection.box[2], m.detection.box[3]).toFixed(0) + 'px' : '—'}</td><td>≥ {qp?.minFacePixels ?? 80}px</td><td>{check(m.detection?.box ? Math.min(m.detection.box[2], m.detection.box[3]) >= (qp?.minFacePixels ?? 80) : null)}</td></tr>
              <tr><td>Độ sáng</td><td>{f(q.brightness, 1)}</td><td>{qp ? `${qp.minBrightness}–${qp.maxBrightness}` : '40–220'}</td><td>{check(q.brightness == null ? null : !q.reasons.some(r => r === 'TOO_DARK' || r === 'TOO_BRIGHT'))}</td></tr>
              <tr><td>Độ nét</td><td>{f(q.sharpness, 1)}</td><td>≥ {qp?.minSharpness ?? 60}</td><td>{check(q.sharpness == null ? null : !q.reasons.includes('BLUR'))}</td></tr>
            </tbody>
          </table>
          <p>Quality: <span className={`badge b-${q.decision === 'PASS' ? 'PASS' : 'FAIL'}`}>{q.decision}</span> {q.reasons.join(', ')}</p>
          <h3>SFace cosine</h3>
          {score != null ? (
            <>
              <div className="meter" aria-label="cosine">
                <div className="meter-fill" style={{ width: `${Math.max(0, Math.min(1, (score + 1) / 2)) * 100}%` }} />
                {ip && <div className="meter-th" style={{ left: `${((ip.threshold + 1) / 2) * 100}%` }} title={`threshold ${ip.threshold}`} />}
              </div>
              <p>cosine = <b>{score.toFixed(4)}</b> · threshold {ip?.threshold ?? '—'} <code>{ip?.status}</code></p>
            </>
          ) : <p className="muted">Không có điểm: <code>{m.identityDecision}</code> {m.identityErrorCode || m.referenceIdentityErrorCode || ''}</p>}
          <dl className="kv">
            <dt>Identity decision</dt><dd><code>{m.identityDecision}</code> <span className="muted small">(research không kết luận MATCH/NON_MATCH)</span></dd>
            <dt>Model</dt><dd><code className="wrap">{m.modelVersion}</code></dd>
            <dt>Embedding</dt><dd>Không bao giờ rời AI process; không có trong response/log.</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function SessionInspector({ data, error }: { data: LabInspect | null; error: string | null }) {
  if (error) return <p className="err" role="alert">{error}: {describe(error).text}{error === 'NOT_FOUND' ? ' — inspector chỉ bật khi FACE_LAB_DEBUG_ENABLED=true và NODE_ENV ∈ development/test/staging.' : ''}</p>;
  if (!data) return <p className="muted">Chưa tải.</p>;
  return (
    <div>
      <dl className="kv">
        <dt>Server time</dt><dd>{data.serverTime}</dd>
        <dt>Worker</dt><dd>{data.worker.approvalStatus}</dd>
        <dt>Consent</dt><dd><span className={`badge b-${data.consent.valid ? 'PASS' : 'BLOCKED'}`}>{data.consent.valid ? 'VALID' : 'INVALID'}</span> version={data.consent.version ?? '—'} (cần {data.consent.requiredVersion}){data.consent.withdrawnAt ? ` · thu hồi ${data.consent.withdrawnAt}` : ''}</dd>
        <dt>Epoch / last v</dt><dd>{data.biometricState ? `${data.biometricState.epoch} / ${data.biometricState.lastVersion}` : '—'}</dd>
        {data.order && <><dt>Order</dt><dd>{data.order.id} · {data.order.status} · {data.order.faceStageAllowed ? 'được xác thực' : 'chưa ARRIVED'}</dd></>}
      </dl>
      <h4>Policy</h4>
      <dl className="kv">{Object.entries(data.policy).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{String(v)}</dd></Fragment>)}</dl>
      <h4>Templates</h4>
      <Table rows={data.templates} cols={['version', 'epoch', 'status', 'createdAt', 'revokedAt', 'deletedAt']} />
      <h4>Sessions</h4>
      <Table rows={data.sessions} cols={['purpose', 'orderId', 'state', 'lifecycle', 'attempts', 'errorCode', 'expiresAt', 'stale']} />
      <h4>Proofs</h4>
      <Table rows={data.proofs} cols={['purpose', 'orderId', 'lifecycle', 'identityScore', 'issuedAt', 'expiresAt', 'consumedAt', 'revokedAt']} />
      <h4>Audit</h4>
      <Table rows={data.audit} cols={['action', 'reason', 'createdAt']} />
    </div>
  );
}

function Table({ rows, cols }: { rows: object[]; cols: string[] }) {
  if (!rows.length) return <p className="muted small">Không có bản ghi.</p>;
  return (
    <div className="scroll"><table className="tbl">
      <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(c => { const v = (r as Record<string, unknown>)[c]; return <td key={c} className={c === 'lifecycle' ? `lc-${String(v)}` : ''}>{v == null ? '—' : typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(4)) : String(v)}</td>; })}</tr>)}</tbody>
    </table></div>
  );
}
