import { useCallback, useMemo, useState } from 'react';
import { ApiError, LabClient, type RequestTrace } from './lib/api';
import { describe } from './lib/codes';
import { trialFrom, type TrialCondition, type TrialRow, type PadLabel, type IdentityLabel } from './lib/trials';
import type { Backend, CoreStatus, LabInspect, ResearchCapabilities } from './lib/types';
import { FlowPanel, type RunRecord } from './components/FlowPanel';
import { IdentityInspector, PadInspector, SessionInspector } from './components/Inspectors';
import { TrialsPanel, type TrialSettings } from './components/Trials';

type Tab = 'enroll' | 'daily' | 'order' | 'pad' | 'identity' | 'inspect' | 'trials' | 'requests';
const TABS: [Tab, string][] = [
  ['enroll', 'A. Enrollment'], ['daily', 'B. Daily check-in'], ['order', 'C. Order proof'], ['pad', 'D. PAD Inspector'],
  ['identity', 'E. Identity Inspector'], ['inspect', 'Session/Proof Inspector'], ['trials', 'PAD trials'], ['requests', 'Requests'],
];

export function App() {
  // Tokens: React state only (memory). Never localStorage/sessionStorage/IndexedDB/URL.
  const [researchToken, setResearchToken] = useState('');
  const [coreToken, setCoreToken] = useState('');
  const [otherToken, setOtherToken] = useState('');
  const [otherCoreToken, setOtherCoreToken] = useState('');
  const [backend, setBackend] = useState<Backend>('research');
  const [tab, setTab] = useState<Tab>('enroll');
  const [traces, setTraces] = useState<RequestTrace[]>([]);
  const [caps, setCaps] = useState<ResearchCapabilities | null>(null);
  const [status, setStatus] = useState<CoreStatus | null>(null);
  const [inspect, setInspect] = useState<LabInspect | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [orderId, setOrderId] = useState('');
  const [lastRun, setLastRun] = useState<RunRecord | null>(null);
  const [trials, setTrials] = useState<TrialRow[]>([]);
  const [conditions, setConditions] = useState<TrialCondition[]>([]);
  const [trialSettings, setTrialSettings] = useState<TrialSettings>({ recording: false, task: 'pad', label: 'bona_fide', device: '', lighting: '', instrument: '' });

  const trace = useCallback((t: RequestTrace) => setTraces(prev => [t, ...prev].slice(0, 200)), []);
  const research = useMemo(() => (researchToken ? new LabClient('', researchToken.trim(), trace) : null), [researchToken, trace]);
  const core = useMemo(() => (coreToken ? new LabClient('', coreToken.trim(), trace) : null), [coreToken, trace]);
  const otherResearch = useMemo(() => (otherToken ? new LabClient('', otherToken.trim(), trace) : null), [otherToken, trace]);
  const otherCore = useMemo(() => (otherCoreToken ? new LabClient('', otherCoreToken.trim(), trace) : null), [otherCoreToken, trace]);

  async function load<T>(key: string, fn: () => Promise<T>, set: (v: T | null) => void) {
    setErrors(e => ({ ...e, [key]: null }));
    try { set(await fn()); } catch (e) { set(null); setErrors(prev => ({ ...prev, [key]: e instanceof ApiError ? e.code : 'UNKNOWN' })); }
  }
  const refreshCaps = () => research && load('caps', () => research.researchCapabilities(), setCaps);
  const refreshStatus = () => core && load('status', () => core.coreStatus(orderId || undefined), setStatus);
  const refreshInspect = () => core && load('inspect', () => core.coreInspect(orderId || undefined), setInspect);

  const onRun = useCallback((r: RunRecord) => {
    setLastRun(r);
    if (r.measurement && trialSettings.recording) {
      const row = trialFrom(r.measurement, trialSettings.task, trialSettings.label as PadLabel | IdentityLabel, r.e2eMs);
      setTrials(prev => [...prev, row]);
      setConditions(prev => [...prev, { trial_id: row.trial_id, device: trialSettings.device, lighting: trialSettings.lighting, instrument: trialSettings.instrument, note: `${r.purpose}` }]);
    }
  }, [trialSettings]);

  async function consent() {
    if (!core || !status) return;
    await load('consent', () => core.coreConsent(status.requiredConsentVersion), () => undefined);
    refreshStatus();
  }
  async function withdraw() {
    if (!core || !confirm('Thu hồi consent sẽ xóa ciphertext template, thu hồi mọi session/proof và đưa worker offline. Tiếp tục với tài khoản TEST?')) return;
    await load('withdraw', () => core.coreWithdraw(), () => undefined);
    refreshStatus();
  }

  const err = (key: string) => errors[key] ? <p className="err" role="alert">{errors[key]}: {describe(errors[key]).text}</p> : null;
  const flowProps = { backend, research, core, other: backend === 'research' ? otherResearch : otherCore, onRun,
    researchCameraAllowed: caps?.cameraAllowed === true, coreBlockers: status?.blockers ?? [] };
  async function eraseResearch() {
    if (!research || !confirm('Xóa mọi phiên và số đo nghiên cứu của tài khoản research này?')) return;
    await load('erase', () => research.researchErase(), () => undefined);
  }

  return (
    <div className="app">
      <header>
        <h1>FixGo · Worker FaceID Lab</h1>
        <p className="banner">Dev/staging only. Lab không có thẩm quyền cấp FaceID proof; mọi gate do backend quyết định. PAD hiện <b>NOT_EVALUATED</b> → production fail closed.</p>
      </header>

      <section className="panel">
        <h2>Kết nối</h2>
        <div className="grid4">
          <label>Research token (lab :3107)<input type="password" autoComplete="off" spellCheck={false} value={researchToken} onChange={e => setResearchToken(e.target.value)} placeholder="token từ fixtures.json riêng tư" /></label>
          <label>Worker TEST JWT (Face Core /api)<input type="password" autoComplete="off" spellCheck={false} value={coreToken} onChange={e => setCoreToken(e.target.value)} placeholder="access token của tài khoản worker test" /></label>
          <label>Research token worker #2 (kiểm thử âm)<input type="password" autoComplete="off" spellCheck={false} value={otherToken} onChange={e => setOtherToken(e.target.value)} placeholder="researchOtherToken" /></label>
          <label>Face Core JWT worker #2 (kiểm thử âm)<input type="password" autoComplete="off" spellCheck={false} value={otherCoreToken} onChange={e => setOtherCoreToken(e.target.value)} placeholder="coreOtherToken" /></label>
        </div>
        <div className="row wrap">
          <label><input type="radio" checked={backend === 'research'} onChange={() => setBackend('research')} /> Research lab (đo lường thật, không thẩm quyền)</label>
          <label><input type="radio" checked={backend === 'core'} onChange={() => setBackend('core')} /> Face Core (gate production thật)</label>
          <button onClick={refreshCaps} disabled={!research}>Research capabilities</button>
          <button onClick={refreshStatus} disabled={!core}>Face Core status</button>
          <button onClick={eraseResearch} disabled={!research}>Xóa phiên research của tôi</button>
          <button onClick={() => { setResearchToken(''); setCoreToken(''); setOtherToken(''); setOtherCoreToken(''); setCaps(null); setStatus(null); setInspect(null); }}>Xóa token khỏi bộ nhớ</button>
        </div>
        {err('caps')}{err('status')}{err('erase')}
        <div className="grid2">
          <div>
            <h3>Research</h3>
            {caps ? (
              <dl className="kv">
                <dt>Identity model</dt><dd><code className="wrap">{caps.modelVersion ?? '—'}</code></dd>
                <dt>PAD measurer</dt><dd>{caps.padReady ? 'ready' : `unavailable ${caps.padErrorCode ?? ''}`}</dd>
                <dt>PAD evaluated</dt><dd><span className="badge b-NOT_EVALUATED">false</span> <code>{caps.padEvaluationStatus}</code></dd>
                <dt>Camera upload</dt><dd><span className={`badge b-${caps.cameraAllowed ? 'PASS' : 'BLOCKED'}`}>{caps.cameraAllowed ? 'ALLOWED' : 'BLOCKED'}</span> protocol={caps.protocolReference ?? '—'} consent={String(caps.participantConsentReady ?? false)}</dd>
                <dt>Session TTL</dt><dd>{caps.sessionTtlMs ? caps.sessionTtlMs / 1000 + 's' : '—'} · {caps.maxAttemptsPerSession ?? 3} lần/session</dd>
              </dl>
            ) : <p className="muted">Chưa tải.</p>}
          </div>
          <div>
            <h3>Face Core</h3>
            {status ? (
              <dl className="kv">
                <dt>Enrollment</dt><dd>{status.enrollmentStatus}</dd>
                <dt>Blockers</dt><dd>{status.blockers.length ? status.blockers.map(b => <span key={b} className="badge b-BLOCKED" title={describe(b).text}>{b}</span>) : <span className="badge b-PASS">none</span>}</dd>
                <dt>can enroll/daily/order</dt><dd>{String(status.canEnroll)} / {String(status.canVerifyDaily)} / {String(status.canVerifyOrder)}</dd>
                <dt>PAD</dt><dd><span className="badge b-NOT_EVALUATED">{status.padDecision}</span></dd>
              </dl>
            ) : <p className="muted">Chưa tải.</p>}
          </div>
        </div>
      </section>

      <nav className="tabs" role="tablist">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {tab === 'enroll' && (
        <>
          <section className="panel">
            <h2>A. Enrollment testing</h2>
            <div className="grid2">
              <div>
                <h3>Consent ({backend === 'core' ? 'Face Core' : 'research'})</h3>
                {backend === 'core' ? (status ? (
                  <dl className="kv">
                    <dt>Required</dt><dd>{status.requiredConsentVersion}</dd>
                    <dt>Recorded</dt><dd>{status.consentVersion ?? '—'} <span className={`badge b-${status.consentRequired ? 'BLOCKED' : 'PASS'}`}>{status.consentRequired ? 'CONSENT_REQUIRED' : 'VALID'}</span></dd>
                    <dt>Identity review</dt><dd>{String(status.identityReviewApproved)}</dd>
                  </dl>
                ) : <p className="muted">Tải Face Core status.</p>) : <p>Research: consent người tham gia do operator cấu hình (participants + protocolReference); Lab không thể tự tạo. Trạng thái: <b>{String(caps?.participantConsentReady ?? false)}</b>.</p>}
                {backend === 'core' && (
                  <div className="row">
                    <button onClick={consent} disabled={!core || !status}>Ghi nhận consent (test account)</button>
                    <button onClick={withdraw} disabled={!core} className="danger">Thu hồi consent + xóa template</button>
                  </div>
                )}
                {err('consent')}{err('withdraw')}
              </div>
              <div>
                <h3>Template</h3>
                {backend === 'core' && status ? (
                  <dl className="kv">
                    <dt>Version</dt><dd>{status.templateVersion ?? '— (chưa có)'}</dd>
                    <dt>Model</dt><dd><code className="wrap">{status.template?.modelVersion ?? '—'}</code></dd>
                    <dt>Thu hồi</dt><dd>{status.template?.revokedAt ?? 'không'}{status.template?.deletedAt ? ` · xóa ${status.template.deletedAt}` : ''}</dd>
                  </dl>
                ) : <p>Research: enrollment chỉ đo quality/PAD trên 1 ảnh; feature bị hủy; <b>không</b> tạo template.</p>}
                <p className="muted small">Lịch sử template/revocation đầy đủ: tab Session/Proof Inspector.</p>
              </div>
            </div>
          </section>
          <FlowPanel purpose="ENROLLMENT" {...flowProps} />
        </>
      )}

      {tab === 'daily' && (
        <>
          <section className="panel">
            <h2>B. Daily check-in testing</h2>
            <p>Research: chụp <b>reference</b> và <b>probe</b> live trong cùng session → cosine SFace thật (không dùng avatar). Face Core: 1 ảnh so với template mã hóa; proof DAILY hết hạn theo <code>FACE_DAILY_TTL_MS</code>{inspect ? ` = ${Number(inspect.policy.dailyProofTtlMs) / 3600000}h` : ''}.</p>
            {status?.dailyProof ? <p>Daily proof hiện tại: <code>{status.dailyProof.id}</code> hết hạn {status.dailyProof.expiresAt}</p> : backend === 'core' && <p className="muted">Không có daily proof còn hiệu lực.</p>}
          </section>
          <FlowPanel purpose="DAILY" {...flowProps} />
        </>
      )}

      {tab === 'order' && (
        <>
          <section className="panel">
            <h2>C. Order proof testing</h2>
            <div className="row wrap">
              <label>Order ID (đơn TEST được gán, trạng thái ARRIVED)<input value={orderId} onChange={e => setOrderId(e.target.value.trim())} placeholder="uuid" /></label>
              <button onClick={() => { refreshStatus(); refreshInspect(); }} disabled={!core || !orderId}>Xem proof của đơn</button>
            </div>
            {err('inspect')}
            {backend === 'core' && status?.orderProof && <p>Proof ORDER đang hiệu lực: <code>{status.orderProof.id}</code>, hết hạn {status.orderProof.expiresAt}</p>}
            {inspect?.order && (
              <div className="scroll"><table className="tbl">
                <thead><tr><th>Proof</th><th>lifecycle</th><th>issued</th><th>expires</th><th>consumed</th></tr></thead>
                <tbody>{inspect.proofs.filter(p => p.orderId === orderId).map(p => <tr key={p.id}><td><code>{p.id.slice(0, 8)}</code></td><td className={`lc-${p.lifecycle}`}>{p.lifecycle}</td><td>{p.issuedAt}</td><td>{p.expiresAt}</td><td>{p.consumedAt ?? '—'}</td></tr>)}</tbody>
              </table></div>
            )}
            <p className="muted small">Proof chỉ được tiêu thụ bởi chuyển trạng thái ARRIVED→IN_PROGRESS của Order FSM (một lần, atomic). Lab không có nút tiêu thụ/cấp proof.</p>
          </section>
          <FlowPanel purpose="ORDER" orderId={orderId || undefined} {...flowProps} />
        </>
      )}

      {tab === 'pad' && <PadInspector caps={caps} run={lastRun} />}
      {tab === 'identity' && <IdentityInspector run={lastRun} />}
      {tab === 'inspect' && (
        <section className="panel">
          <h2>Session / Proof Inspector (Face Core)</h2>
          <div className="row"><button onClick={refreshInspect} disabled={!core}>Tải</button><span className="muted small">Chỉ đọc metadata của chính worker trong JWT; không nonce/ảnh/embedding.</span></div>
          <SessionInspector data={inspect} error={errors.inspect ?? null} />
        </section>
      )}
      {tab === 'trials' && (
        <TrialsPanel rows={trials} conditions={conditions} settings={trialSettings} onSettings={setTrialSettings}
          onClear={() => { setTrials([]); setConditions([]); }} identityThreshold={caps?.identityPolicy?.threshold ?? 0.6} />
      )}
      {tab === 'requests' && (
        <section className="panel">
          <h2>Requests</h2>
          <p className="muted small">Chỉ method/path/status/thời gian/mã lỗi. Không ghi token, body, ảnh.</p>
          <div className="scroll"><table className="tbl">
            <thead><tr><th>time</th><th>method</th><th>path</th><th>status</th><th>ms</th><th>code</th></tr></thead>
            <tbody>{traces.map((t, i) => <tr key={i}><td>{t.at.slice(11, 19)}</td><td>{t.method}</td><td><code>{t.path}</code></td><td>{t.status}</td><td>{t.ms.toFixed(0)}</td><td>{t.code ?? ''}</td></tr>)}</tbody>
          </table></div>
        </section>
      )}
    </div>
  );
}
