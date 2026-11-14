import { Fragment } from 'react';
import { describe, PAD_LIMITATIONS } from '../lib/codes';
import type { LabInspect, Measurement, ResearchCapabilities } from '../lib/types';
import type { RunRecord } from './FlowPanel';
import { Badge, Card, Empty, Kv, Meter } from './ui';
import { nextAction } from '../lib/guidance';

const f = (v: number | null | undefined, d = 4) => (v == null ? '—' : v.toFixed(d));

export function PadInspector({ caps, run }: { caps: ResearchCapabilities | null; run: RunRecord | null }) {
  const m = run?.measurement;
  const p = m?.padPolicy;
  return (
    <div className="view-grid">
      <Card title="Provider status" icon="pad">
        <Kv rows={[
          ['Provider', caps ? (caps.padReady ? 'MN3 loaded (experimental, measurement only)' : `Không sẵn sàng: ${caps.padErrorCode ?? 'unknown'}`) : '— (chưa kết nối research)'],
          ['padEvaluated', <Badge status="NOT_EVALUATED">{String(caps?.padEvaluated ?? false)}</Badge>],
          ['Evaluation record', <><code>{caps?.padEvaluationStatus ?? '—'}</code><div className="small muted">{caps?.padEvaluationStatus ? describe(caps.padEvaluationStatus).text : ''}</div></>],
          ['Model', <code className="wrap">{caps?.padModelVersion ?? '—'}</code>],
          ['Proof allowed', String(caps?.proofAllowed ?? false)],
          ['Production gate', <>Face Core <code>ready()</code> yêu cầu <code>padEvaluated=true</code> + <code>padModelVersion</code>; gateway hiện luôn trả false → <code>PAD_NOT_EVALUATED</code>.</>],
        ]} />
      </Card>
      <Card title="Lần đo gần nhất" icon="activity">
        {m ? (
          <Kv rows={[
            ['PAD decision', <Badge status={p?.decision ?? 'NOT_EVALUATED'} />],
            ['Lý do', <><code>{p?.reason ?? m.padErrorCode ?? '—'}</code><div className="small muted">{describe(p?.reason ?? m.padErrorCode ?? 'PAD_NOT_EVALUATED').text}</div></>],
            ['evaluated', String(p?.evaluated ?? false)],
            ['real / spoof', <>{f(m.padRealScore)} / {f(m.padSpoofScore)} <span className="muted small">(số đo)</span></>],
            ...(m.referencePadRealScore != null ? [['reference real/spoof', `${f(m.referencePadRealScore)} / ${f(m.referencePadSpoofScore)}`] as [string, string]] : []),
            ['Timing', `PAD ${f(m.latencyMs.probePadMs, 1)} ms · crop ${f(m.latencyMs.probeCropResizeMs, 2)} ms · tổng ${f(m.latencyMs.totalMs, 1)} ms`],
            ['Preprocess', <code>{m.preprocessingVersion}</code>],
            ['Crop', <code>{m.cropVersion}</code>],
          ]} />
        ) : <Empty>Chưa có lần đo nào trong research mode. Chạy Enrollment/Daily/Order ở chế độ Research.</Empty>}
      </Card>
      <Card title="Giới hạn phương pháp chống giả mạo" icon="alert" className="span-2">
        <ul className="list">{PAD_LIMITATIONS.map(x => <li key={x}>{x}</li>)}</ul>
      </Card>
    </div>
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
  if (!m) return <Card title="Identity Inspector" icon="identity"><Empty>Chạy một phép đo research (Enrollment/Daily/Order) để xem chi tiết.</Empty></Card>;
  const q = m.quality, qp = m.qualityPolicy, ip = m.identityPolicy;
  const check = (ok: boolean | null) => (ok == null ? <span className="muted">—</span> : ok ? <Badge status="PASS">đạt</Badge> : <Badge status="FAIL">không đạt</Badge>);
  const score = m.identityScore;
  return (
    <div className="view-grid">
      <Card title="YuNet detection" icon="identity">
        <Box m={m} url={run?.probeUrl ?? null} />
        <Kv rows={[
          ['Ảnh', m.detection ? `${m.detection.imageWidth}×${m.detection.imageHeight}` : '—'],
          ['Box', m.detection?.box ? m.detection.box.map(v => v.toFixed(0)).join(', ') : '—'],
          ['Alignment', <>{m.alignment ? `${m.alignment.method} · ${m.alignment.performed ? 'đã thực hiện' : 'chưa thực hiện'}` : '—'} <span className="muted small">(landmarks không xuất ra)</span></>],
          ['Thời gian', `detect ${f(m.latencyMs.probeDetectionMs, 1)} ms · SFace ${f(m.latencyMs.probeSfaceMs, 1)} ms`],
        ]} />
      </Card>
      <div className="stack">
        <Card title="Quality checks" icon="check" actions={<Badge status={q.decision === 'PASS' ? 'PASS' : 'FAIL'}>{q.decision}</Badge>}>
          <div className="scroll"><table className="tbl">
            <thead><tr><th>Check</th><th>Giá trị</th><th>Ngưỡng</th><th>Kết quả</th></tr></thead>
            <tbody>
              <tr><td>Số khuôn mặt</td><td>{q.faceCount ?? '—'}</td><td>= 1</td><td>{check(q.faceCount == null ? null : q.faceCount === 1)}</td></tr>
              <tr><td>Detector score</td><td>{f(m.detection?.score, 3)}</td><td>≥ {qp?.minDetectionScore ?? 0.6}</td><td>{check(m.detection?.score == null ? null : m.detection.score >= (qp?.minDetectionScore ?? .6))}</td></tr>
              <tr><td>Kích thước mặt</td><td>{m.detection?.box ? Math.min(m.detection.box[2], m.detection.box[3]).toFixed(0) + 'px' : '—'}</td><td>≥ {qp?.minFacePixels ?? 80}px</td><td>{check(m.detection?.box ? Math.min(m.detection.box[2], m.detection.box[3]) >= (qp?.minFacePixels ?? 80) : null)}</td></tr>
              <tr><td>Độ sáng</td><td>{f(q.brightness, 1)}</td><td>{qp ? `${qp.minBrightness}–${qp.maxBrightness}` : '40–220'}</td><td>{check(q.brightness == null ? null : !q.reasons.some(r => r === 'TOO_DARK' || r === 'TOO_BRIGHT'))}</td></tr>
              <tr><td>Độ nét</td><td>{f(q.sharpness, 1)}</td><td>≥ {qp?.minSharpness ?? 60}</td><td>{check(q.sharpness == null ? null : !q.reasons.includes('BLUR'))}</td></tr>
            </tbody>
          </table></div>
          {q.reasons.length > 0 && <p className="small">Lý do: {q.reasons.join(', ')} — {nextAction(q.reasons[0])}</p>}
        </Card>
        <Card title="SFace cosine" icon="activity">
          {score != null ? (
            <>
              <Meter value={score} min={-1} max={1} threshold={ip?.threshold} label="cosine" />
              <p>cosine = <b>{score.toFixed(4)}</b> · threshold {ip?.threshold ?? '—'} <code>{ip?.status}</code></p>
            </>
          ) : <p className="muted">Không có điểm: <code>{m.identityDecision}</code> {m.identityErrorCode || m.referenceIdentityErrorCode || ''}</p>}
          <Kv rows={[
            ['Identity decision', <><code>{m.identityDecision}</code> <span className="muted small">(research không kết luận MATCH/NON_MATCH)</span></>],
            ['Model', <code className="wrap">{m.modelVersion}</code>],
            ['Embedding', 'Không bao giờ rời AI process; không có trong response/log.'],
          ]} />
        </Card>
      </div>
    </div>
  );
}

export function SessionInspector({ data, error }: { data: LabInspect | null; error: string | null }) {
  if (error) return <p className="alert-box" role="alert"><b>{error}</b>: {describe(error).text}{error === 'NOT_FOUND' ? ' — inspector chỉ bật khi FACE_LAB_DEBUG_ENABLED=true và NODE_ENV ∈ development/test/staging.' : ''}</p>;
  if (!data) return <Empty>Chưa tải. Bấm “Tải” (cần Face Core JWT).</Empty>;
  return (
    <div className="stack">
      <div className="view-grid">
        <Card title="Worker & consent" icon="enroll">
          <Kv rows={[
            ['Server time', data.serverTime],
            ['Worker', data.worker.approvalStatus],
            ['Consent', <><Badge status={data.consent.valid ? 'VALID' : 'INVALID'} /> version={data.consent.version ?? '—'} (cần {data.consent.requiredVersion}){data.consent.withdrawnAt ? ` · thu hồi ${data.consent.withdrawnAt}` : ''}</>],
            ['Epoch / last v', data.biometricState ? `${data.biometricState.epoch} / ${data.biometricState.lastVersion}` : '—'],
            ...(data.order ? [['Order', `${data.order.id} · ${data.order.status} · ${data.order.faceStageAllowed ? 'được xác thực' : 'chưa ARRIVED'}`] as [string, string]] : []),
          ]} />
        </Card>
        <Card title="Policy" icon="pad">
          <dl className="kv">{Object.entries(data.policy).map(([k, v]) => <Fragment key={k}><div className="kv-row"><dt>{k}</dt><dd>{String(v)}</dd></div></Fragment>)}</dl>
        </Card>
      </div>
      <Card title="Templates" icon="identity"><Table rows={data.templates} cols={['version', 'epoch', 'status', 'createdAt', 'revokedAt', 'deletedAt']} /></Card>
      <Card title="Sessions" icon="session"><Table rows={data.sessions} cols={['purpose', 'orderId', 'state', 'lifecycle', 'attempts', 'errorCode', 'expiresAt', 'stale']} /></Card>
      <Card title="Proofs" icon="check"><Table rows={data.proofs} cols={['purpose', 'orderId', 'lifecycle', 'identityScore', 'issuedAt', 'expiresAt', 'consumedAt', 'revokedAt']} /></Card>
      <Card title="Audit" icon="debug"><Table rows={data.audit} cols={['action', 'reason', 'createdAt']} /></Card>
    </div>
  );
}

export function Table({ rows, cols }: { rows: object[]; cols: string[] }) {
  if (!rows.length) return <p className="muted small">Không có bản ghi.</p>;
  return (
    <div className="scroll"><table className="tbl">
      <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(c => { const v = (r as Record<string, unknown>)[c]; return <td key={c} className={c === 'lifecycle' ? `lc-${String(v)}` : ''}>{v == null ? '—' : typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(4)) : String(v)}</td>; })}</tr>)}</tbody>
    </table></div>
  );
}
