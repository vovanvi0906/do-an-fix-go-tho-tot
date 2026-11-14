import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, LabClient, type RequestTrace } from './lib/api';
import { describe } from './lib/codes';
import { emptyTimeline } from './lib/timeline';
import { trialFrom, type TrialCondition, type TrialRow, type PadLabel, type IdentityLabel } from './lib/trials';
import type { Backend, CoreStatus, LabInspect, Purpose, ResearchCapabilities } from './lib/types';
import type { ConnectionState, Tone } from './lib/workflow';
import { FlowPanel, type FlowState, type RunRecord } from './components/FlowPanel';
import { IdentityInspector, PadInspector, SessionInspector, Table } from './components/Inspectors';
import { TrialsPanel, type TrialSettings } from './components/Trials';
import { TimelineHost, TimelineView } from './components/TimelineView';
import { Sidebar, VIEWS, isView, type View } from './components/layout/Sidebar';
import { Topbar, type Health } from './components/layout/Topbar';
import { ConnectionSettings, type Tokens } from './components/layout/ConnectionSettings';
import { InspectorRail } from './components/layout/InspectorRail';
import { DebugDrawer, RequestTable } from './components/layout/DebugDrawer';
import { Overview } from './components/views/Overview';
import { TestScenarios } from './components/views/TestScenarios';
import { ActionButton, Badge, Card, Empty, Kv } from './components/ui';
import { Icon } from './components/Icon';
import { outcomeOf } from './lib/workflow';

const FLOW_VIEWS: Partial<Record<View, Purpose>> = { enroll: 'ENROLLMENT', daily: 'DAILY', order: 'ORDER' };
const DESCRIPTION: Record<View, string> = {
  overview: 'Trạng thái dịch vụ, gate đang chặn và lối vào từng workflow.',
  enroll: 'Consent → session → chụp → PAD → template. Research chỉ đo quality/PAD trên 1 ảnh, không tạo template.',
  daily: 'Research: chụp reference + probe live trong cùng session → cosine SFace thật. Face Core: 1 ảnh so với template mã hóa.',
  order: 'Proof ORDER chỉ được tiêu thụ bởi chuyển trạng thái ARRIVED→IN_PROGRESS của Order FSM. Lab không có nút cấp/tiêu thụ proof.',
  pad: 'Trạng thái PAD provider, số đo MN3 gần nhất và giới hạn phương pháp.',
  identity: 'Detection YuNet, quality checks và cosine SFace của lần đo research gần nhất.',
  inspect: 'Metadata template/session/proof/audit của chính worker trong JWT (Face Core lab inspector).',
  scenarios: 'Kịch bản kiểm thử âm tính và ghi trial có kiểm soát (export dữ liệu đánh giá).',
  requests: 'Lịch sử request (không body/token/ảnh) và tóm tắt lần chạy gần nhất.',
};
const initialView = (): View => {
  const h = typeof location !== 'undefined' ? location.hash.replace(/^#\/?/, '') : '';
  return isView(h) ? h : 'overview';
};
const wideScreen = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1100px)').matches;

export function App() {
  // Tokens: React state only (memory). Never localStorage/sessionStorage/IndexedDB/URL.
  const [tokens, setTokens] = useState<Tokens>({ research: '', core: '', otherResearch: '', otherCore: '' });
  const [backend, setBackend] = useState<Backend>('research');
  const [view, setViewState] = useState<View>(initialView);
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
  const [connOpen, setConnOpen] = useState(false);
  const [flow, setFlow] = useState<FlowState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(wideScreen);
  const [timelineHost, setTimelineHost] = useState<HTMLElement | null>(null);

  const trace = useCallback((t: RequestTrace) => setTraces(prev => [t, ...prev].slice(0, 200)), []);
  const research = useMemo(() => (tokens.research ? new LabClient('', tokens.research.trim(), trace) : null), [tokens.research, trace]);
  const core = useMemo(() => (tokens.core ? new LabClient('', tokens.core.trim(), trace) : null), [tokens.core, trace]);
  const otherResearch = useMemo(() => (tokens.otherResearch ? new LabClient('', tokens.otherResearch.trim(), trace) : null), [tokens.otherResearch, trace]);
  const otherCore = useMemo(() => (tokens.otherCore ? new LabClient('', tokens.otherCore.trim(), trace) : null), [tokens.otherCore, trace]);

  const setView = useCallback((v: View) => {
    setViewState(v);
    if (!FLOW_VIEWS[v]) setFlow(null);
    try { history.replaceState(null, '', `#/${v}`); } catch { /* sandboxed: ignore */ }
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, []);

  async function load<T>(key: string, fn: () => Promise<T>, set: (v: T | null) => void) {
    setErrors(e => ({ ...e, [key]: null }));
    try { set(await fn()); } catch (e) { set(null); setErrors(prev => ({ ...prev, [key]: e instanceof ApiError ? e.code : 'UNKNOWN' })); }
  }
  const refreshCaps = () => research && load('caps', () => research.researchCapabilities(), setCaps);
  const refreshStatus = () => core && load('status', () => core.coreStatus(orderId || undefined), setStatus);
  const refreshInspect = () => core && load('inspect', () => core.coreInspect(orderId || undefined), setInspect);
  const connectAll = () => { refreshCaps(); refreshStatus(); };

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
  async function eraseResearch() {
    if (!research || !confirm('Xóa mọi phiên và số đo nghiên cứu của tài khoản research này?')) return;
    await load('erase', () => research.researchErase(), () => undefined);
  }
  const clearTokens = () => { setTokens({ research: '', core: '', otherResearch: '', otherCore: '' }); setCaps(null); setStatus(null); setInspect(null); };
  const closeConn = useCallback(() => setConnOpen(false), []);

  // ---- Derived presentation state (read-only projections of backend responses) ----
  const connResearch: ConnectionState = !research ? 'none' : caps ? 'ok' : errors.caps ? 'error' : 'unchecked';
  const connCore: ConnectionState = !core ? 'none' : status ? 'ok' : errors.status ? 'error' : 'unchecked';
  const conn = backend === 'core' ? connCore : connResearch;
  const connTone = (c: ConnectionState): Tone => (c === 'ok' ? 'success' : c === 'error' ? 'error' : 'neutral');
  const connText = (c: ConnectionState, key: string) => (c === 'ok' ? 'Online' : c === 'error' ? errors[key] ?? 'Error' : c === 'unchecked' ? 'Chưa kiểm tra' : 'Chưa cấu hình');
  const dbSeen = traces.some(t => t.status >= 200 && t.status < 300 && (t.path.startsWith('/api/') || t.path.startsWith('/face-research/sessions')));
  const padValue = status?.padDecision ?? (caps ? caps.padEvaluationStatus ?? 'NOT_EVALUATED' : null);
  const health: Health[] = [
    { key: 'backend', label: 'Backend', icon: 'server', value: `${backend === 'core' ? 'Core' : 'Research'} · ${connText(conn, backend === 'core' ? 'status' : 'caps')}`, tone: connTone(conn),
      detail: `Research: ${connText(connResearch, 'caps')} · Face Core: ${connText(connCore, 'status')}` },
    { key: 'ai', label: 'AI', icon: 'cpu', value: caps ? (caps.modelVersion ? 'Ready' : 'Not ready') : status?.blockers.includes('MODEL_NOT_READY') ? 'Not ready' : 'Chưa kiểm tra',
      tone: caps ? (caps.modelVersion ? 'success' : 'error') : status?.blockers.includes('MODEL_NOT_READY') ? 'error' : 'neutral',
      detail: caps ? `YuNet/SFace: ${caps.modelVersion ?? 'không sẵn sàng'} · MN3: ${caps.padReady ? 'loaded' : caps.padErrorCode ?? 'không sẵn sàng'}` : 'Cần Research capabilities' },
    { key: 'db', label: 'Database', icon: 'database', value: status || dbSeen ? 'Reachable' : 'Chưa kiểm tra', tone: status || dbSeen ? 'success' : 'neutral',
      detail: 'Lab không truy cập DB trực tiếp; suy ra từ response thành công của backend (Face Core status / research session).' },
    { key: 'pad', label: 'PAD', icon: 'pad', value: padValue ?? 'Chưa kiểm tra', tone: padValue == null ? 'neutral' : /PASS/.test(padValue) && !/NOT/.test(padValue) ? 'success' : 'ne',
      detail: 'PAD chưa được đánh giá → mọi gate production fail closed (PAD_NOT_EVALUATED).' },
  ];
  const tokenCount = Object.values(tokens).filter(Boolean).length;
  const purpose = FLOW_VIEWS[view];
  const consentState = purpose === 'ENROLLMENT' ? (backend === 'core' ? (status ? (status.consentRequired ? 'blocked' : 'ok') : 'unknown') : (caps ? (caps.participantConsentReady ? 'ok' : 'blocked') : 'unknown')) : undefined;
  const flowProps = {
    backend, research, core, other: backend === 'research' ? otherResearch : otherCore, onRun, onState: setFlow,
    researchCameraAllowed: caps?.cameraAllowed === true, coreBlockers: status?.blockers ?? [],
    connection: conn, connectionCode: errors[backend === 'core' ? 'status' : 'caps'] ?? null,
    uploadPolicy: backend === 'core' ? 'backend' as const : caps ? (caps.cameraAllowed ? 'allowed' as const : 'blocked' as const) : 'unknown' as const,
    lastQuality: lastRun?.measurement && lastRun.purpose === purpose ? lastRun.measurement.quality : null,
  };
  const reqErrors = traces.filter(t => t.status === 0 || t.status >= 400).length;
  const badges: Partial<Record<View, { text: string; tone: string }>> = {};
  if (backend === 'core' && status) {
    if (!status.canEnroll) badges.enroll = { text: 'blocked', tone: 'blocked' };
    if (!status.canVerifyDaily) badges.daily = { text: 'blocked', tone: 'blocked' };
    if (!status.canVerifyOrder) badges.order = { text: 'blocked', tone: 'blocked' };
  }
  if (trials.length) badges.scenarios = { text: String(trials.length), tone: 'info' };
  if (reqErrors) badges.requests = { text: String(reqErrors), tone: 'error' };
  const err = (key: string) => errors[key] ? <p className="alert-box" role="alert"><b>{errors[key]}</b>: {describe(errors[key]).text}</p> : null;
  const drawerTimeline = purpose && flow ? flow.timeline : lastRun?.timeline ?? emptyTimeline();
  const showRail = view !== 'overview' && view !== 'inspect' && view !== 'scenarios' && view !== 'requests';
  const viewMeta = VIEWS.find(v => v.id === view)!;

  useEffect(() => { if (!research) setCaps(null); }, [research]);
  useEffect(() => { if (!core) setStatus(null); }, [core]);

  return (
    <TimelineHost.Provider value={timelineHost}>
      <a className="skip" href="#main">Bỏ qua tới nội dung chính</a>
      <div className="shell">
        <Sidebar view={view} onView={setView} badges={badges} />
        <div className="shell-main">
          <Topbar health={health} backend={backend} onBackend={setBackend} onConnection={() => setConnOpen(true)} tokenCount={tokenCount} />
          <div className={`content ${showRail ? 'with-rail' : ''}`}>
            <main id="main" tabIndex={-1} aria-labelledby="view-title">
              <div className="view-head">
                <div>
                  <h2 id="view-title"><Icon name={viewMeta.icon} size={20} />{viewMeta.label}</h2>
                  <p className="view-desc">{DESCRIPTION[view]}</p>
                </div>
                {purpose && <Badge tone={backend === 'core' ? 'active' : 'info'}>{backend === 'core' ? 'Face Core · gate thật' : 'Research · chỉ đo'}</Badge>}
              </div>

              {view === 'overview' && <Overview caps={caps} status={status} backend={backend} errors={errors} hasResearch={!!research} hasCore={!!core}
                onConnection={() => setConnOpen(true)} onRefreshCaps={refreshCaps} onRefreshStatus={refreshStatus} onView={setView} />}

              {view === 'enroll' && (
                <div className="stack">
                  <div className="view-grid">
                    <Card title={`Consent (${backend === 'core' ? 'Face Core' : 'research'})`} icon="check">
                      {backend === 'core' ? (status ? (
                        <Kv rows={[
                          ['Required', status.requiredConsentVersion],
                          ['Recorded', <>{status.consentVersion ?? '—'} <Badge status={status.consentRequired ? 'BLOCKED' : 'VALID'}>{status.consentRequired ? 'CONSENT_REQUIRED' : 'VALID'}</Badge></>],
                          ['Identity review', String(status.identityReviewApproved)],
                        ]} />
                      ) : <Empty>Tải Face Core status (Connection Settings → Kết nối &amp; kiểm tra).</Empty>) : <p className="small">Research: consent người tham gia do operator cấu hình (participants + protocolReference); Lab không thể tự tạo. Trạng thái: <b>{String(caps?.participantConsentReady ?? false)}</b>.</p>}
                      {backend === 'core' && (
                        <div className="btn-row">
                          <ActionButton variant="primary" icon="check" onClick={consent} reason={!core ? 'Cần Face Core JWT.' : !status ? 'Tải Face Core status trước.' : null}>Ghi nhận consent (test account)</ActionButton>
                          <ActionButton variant="danger" icon="trash" onClick={withdraw} reason={!core ? 'Cần Face Core JWT.' : null}>Thu hồi consent + xóa template</ActionButton>
                        </div>
                      )}
                      {err('consent')}{err('withdraw')}
                    </Card>
                    <Card title="Template" icon="identity">
                      {backend === 'core' && status ? (
                        <Kv rows={[
                          ['Version', status.templateVersion ?? '— (chưa có)'],
                          ['Model', <code className="wrap">{status.template?.modelVersion ?? '—'}</code>],
                          ['Thu hồi', `${status.template?.revokedAt ?? 'không'}${status.template?.deletedAt ? ` · xóa ${status.template.deletedAt}` : ''}`],
                        ]} />
                      ) : <p className="small">Research: enrollment chỉ đo quality/PAD trên 1 ảnh; feature bị hủy; <b>không</b> tạo template.</p>}
                      <p className="field-hint">Lịch sử template/revocation đầy đủ: Session/Proof.</p>
                    </Card>
                  </div>
                  <FlowPanel purpose="ENROLLMENT" consent={consentState} {...flowProps} />
                </div>
              )}

              {view === 'daily' && (
                <div className="stack">
                  {backend === 'core' && (
                    <Card title="Daily proof hiện tại" icon="daily">
                      {status?.dailyProof ? <p className="small">Proof <code>{status.dailyProof.id}</code> hết hạn {status.dailyProof.expiresAt}{inspect ? ` · TTL = ${Number(inspect.policy.dailyProofTtlMs) / 3600000}h` : ''}</p> : <p className="muted small">Không có daily proof còn hiệu lực.</p>}
                    </Card>
                  )}
                  <FlowPanel purpose="DAILY" {...flowProps} />
                </div>
              )}

              {view === 'order' && (
                <div className="stack">
                  <Card title="Order authorization" icon="order">
                    <div className="order-row">
                      <label className="field">Order ID (đơn TEST được gán, trạng thái ARRIVED)<input value={orderId} onChange={e => setOrderId(e.target.value.trim())} placeholder="uuid" autoComplete="off" spellCheck={false} /></label>
                      <ActionButton icon="refresh" onClick={() => { refreshStatus(); refreshInspect(); }} reason={!core ? 'Cần Face Core JWT để xem proof.' : !orderId ? 'Nhập Order ID trước.' : null}>Xem proof của đơn</ActionButton>
                    </div>
                    {err('inspect')}
                    {backend === 'core' && status?.orderProof && <p className="small">Proof ORDER đang hiệu lực: <code>{status.orderProof.id}</code>, hết hạn {status.orderProof.expiresAt}</p>}
                    {inspect?.order && <Table rows={inspect.proofs.filter(p => p.orderId === orderId)} cols={['id', 'lifecycle', 'issuedAt', 'expiresAt', 'consumedAt']} />}
                    <p className="field-hint">Ownership và trạng thái ARRIVED do backend kiểm tra khi tạo session.</p>
                  </Card>
                  <FlowPanel purpose="ORDER" orderId={orderId || undefined} {...flowProps} />
                </div>
              )}

              {view === 'pad' && <PadInspector caps={caps} run={lastRun} />}
              {view === 'identity' && <IdentityInspector run={lastRun} />}
              {view === 'inspect' && (
                <div className="stack">
                  <Card title="Session / Proof Inspector (Face Core)" icon="session"
                    actions={<ActionButton icon="refresh" variant="primary" onClick={refreshInspect} reason={!core ? 'Cần Face Core JWT.' : null}>Tải</ActionButton>}>
                    <p className="field-hint">Chỉ đọc metadata của chính worker trong JWT; không nonce/ảnh/embedding.</p>
                  </Card>
                  <SessionInspector data={inspect} error={errors.inspect ?? null} />
                </div>
              )}
              {view === 'scenarios' && (
                <TestScenarios onView={setView} hasOther={!!(backend === 'research' ? otherResearch : otherCore)}>
                  <TrialsPanel rows={trials} conditions={conditions} settings={trialSettings} onSettings={setTrialSettings}
                    onClear={() => { setTrials([]); setConditions([]); }} identityThreshold={caps?.identityPolicy?.threshold ?? 0.6} />
                </TestScenarios>
              )}
              {view === 'requests' && (
                <div className="stack">
                  <LastRunSummary run={lastRun} onOpenDrawer={() => setDrawerOpen(true)} />
                  <Card title={`Requests (${traces.length})`} icon="debug" actions={reqErrors ? <Badge status="ERROR">{reqErrors} lỗi</Badge> : undefined}>
                    <p className="field-hint">Chỉ method/path/status/thời gian/mã lỗi. Không ghi token, body, ảnh.</p>
                    <RequestTable traces={traces} />
                  </Card>
                </div>
              )}
            </main>
            {showRail && <InspectorRail run={lastRun} flow={flow} caps={caps} status={status} onView={setView} />}
          </div>
          <DebugDrawer timeline={drawerTimeline} traces={traces} sessionId={flow?.session?.id ?? null} requestKey={flow?.requestKey ?? null}
            setHost={setTimelineHost} open={drawerOpen} onOpen={setDrawerOpen}
            fallback={purpose ? null : lastRun ? <TimelineView timeline={drawerTimeline} /> : <Empty icon="debug">Chưa có lần chạy. Timeline 10 stage xuất hiện khi chạy một workflow.</Empty>} />
        </div>
      </div>
      <ConnectionSettings open={connOpen} onClose={closeConn} tokens={tokens} onTokens={setTokens} backend={backend}
        onConnect={connectAll} onClear={clearTokens} onErase={eraseResearch} researchConn={connResearch} coreConn={connCore} errors={errors} />
    </TimelineHost.Provider>
  );
}

function LastRunSummary({ run, onOpenDrawer }: { run: RunRecord | null; onOpenDrawer: () => void }) {
  if (!run) return <Card title="Lần chạy gần nhất" icon="activity"><Empty>Chưa có lần chạy.</Empty></Card>;
  const o = outcomeOf(run.timeline);
  return (
    <Card title="Lần chạy gần nhất" icon="activity" actions={<ActionButton icon="chevronUp" variant="ghost" onClick={onOpenDrawer}>Mở timeline</ActionButton>}>
      <Kv rows={[
        ['Workflow', `${run.purpose} · ${run.backend}`],
        ['Kết quả', <><Badge tone={o.kind === 'idle' ? 'neutral' : o.kind === 'running' ? 'info' : o.kind === 'success' ? 'success' : o.kind === 'rejected' ? 'rejected' : o.kind === 'error' ? 'error' : 'blocked'}>{o.kind.toUpperCase()}</Badge> {o.stageLabel ?? ''}</>],
        ['Code', <code>{o.code ?? '—'}</code>],
        ['End-to-end', run.e2eMs != null ? `${run.e2eMs.toFixed(0)} ms` : '—'],
        ['Thời điểm', new Date(run.at).toLocaleTimeString()],
      ]} />
      <div className="scroll"><table className="tbl">
        <thead><tr><th>Stage</th><th>Status</th><th>Code</th><th>ms</th><th>ref</th></tr></thead>
        <tbody>{run.timeline.map(s => <tr key={s.stage}><td>{s.stage}</td><td><Badge status={s.status} /></td><td>{s.code ? <code>{s.code}</code> : ''}</td><td>{s.ms != null ? s.ms.toFixed(1) : ''}</td><td>{s.ref ?? ''}</td></tr>)}</tbody>
      </table></div>
    </Card>
  );
}
