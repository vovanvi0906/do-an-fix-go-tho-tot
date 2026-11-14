import { STAGES, STAGE_LABEL, describe, type Stage } from './codes';
import type { StageState, StageStatus, Timeline } from './timeline';
import type { Backend, Purpose } from './types';

/**
 * Presentation-only derivation of the workflow stepper and the run outcome from the
 * backend-driven debug timeline. Nothing here decides a gate: every state below is a
 * projection of what the backend (or the client-side camera) already reported.
 */
export type StepState = 'pending' | 'active' | 'success' | 'rejected' | 'blocked' | 'error' | 'skipped' | 'measured';
export interface Step { id: string; label: string; state: StepState; note: string; code?: string | null }

export type ConnectionState = 'none' | 'unchecked' | 'ok' | 'error';
export type ConsentState = 'ok' | 'blocked' | 'unknown';

export interface WorkflowContext {
  purpose: Purpose;
  backend: Backend;
  connection: ConnectionState;
  connectionCode?: string | null;
  consent?: ConsentState;
  orderId?: string;
  hasSession: boolean;
  hasCapture: boolean;
  timeline: Timeline;
}

/** Map a timeline stage status onto the stepper vocabulary. BLOCKED (gate/policy) ≠ FAIL (evaluated, not met). */
export function stepStateOf(status: StageStatus): StepState {
  switch (status) {
    case 'PASS': return 'success';
    case 'FAIL': return 'rejected';
    case 'BLOCKED': return 'blocked';
    case 'NOT_EVALUATED': return 'blocked';
    case 'ERROR': return 'error';
    case 'MEASURED': return 'measured';
    case 'SKIPPED': return 'skipped';
    default: return 'pending';
  }
}

const ORDER_CODES = new Set(['ORDER_ACCESS_DENIED', 'FACE_STAGE_NOT_ALLOWED', 'ORDER_SCOPE_INVALID', 'RESEARCH_ORDER_DENIED', 'RESEARCH_ORDER_STAGE_INVALID', 'RESEARCH_ORDER_SCOPE_INVALID']);
const TERMINAL: StageStatus[] = ['FAIL', 'ERROR', 'BLOCKED'];

const get = (t: Timeline, s: Stage) => t.find(x => x.stage === s)!;
const fromStage = (s: StageState, fallbackNote: string): Pick<Step, 'state' | 'note' | 'code'> => ({
  state: stepStateOf(s.status),
  code: s.code,
  note: s.status === 'PENDING' ? fallbackNote : s.status === 'PASS' && s.code ? s.code.toLowerCase().replace(/_/g, ' ') : s.status === 'NOT_EVALUATED' ? `NOT_EVALUATED — ${describe(s.code).text}` : s.code ? `${s.code}` : s.detail,
});

export function deriveSteps(ctx: WorkflowContext): Step[] {
  const t = ctx.timeline;
  const steps: Step[] = [];
  const auth = get(t, 'AUTH');

  // Connect
  if (auth.status !== 'PENDING') steps.push({ id: 'connect', label: 'Connect', ...fromStage(auth, '') });
  else if (ctx.connection === 'ok') steps.push({ id: 'connect', label: 'Connect', state: 'success', note: ctx.backend === 'core' ? 'Face Core status đã tải' : 'Research capabilities đã tải' });
  else if (ctx.connection === 'error') steps.push({ id: 'connect', label: 'Connect', state: 'error', code: ctx.connectionCode, note: ctx.connectionCode ?? 'Không kết nối được' });
  else if (ctx.connection === 'unchecked') steps.push({ id: 'connect', label: 'Connect', state: 'active', note: 'Token đã nhập, chưa kiểm tra' });
  else steps.push({ id: 'connect', label: 'Connect', state: 'active', note: `Cần ${ctx.backend === 'core' ? 'Face Core JWT' : 'Research token'}` });

  // Consent (enrollment) / Order authorization (order)
  const session = get(t, 'SESSION');
  if (ctx.purpose === 'ENROLLMENT') {
    const c = ctx.consent ?? 'unknown';
    steps.push({ id: 'consent', label: 'Consent', state: c === 'ok' ? 'success' : c === 'blocked' ? 'blocked' : 'pending',
      code: c === 'blocked' ? (ctx.backend === 'core' ? 'CONSENT_REQUIRED' : 'RESEARCH_CONSENT_REQUIRED') : null,
      note: c === 'ok' ? 'Consent hợp lệ' : c === 'blocked' ? (ctx.backend === 'core' ? 'CONSENT_REQUIRED' : 'Operator chưa cấu hình consent người tham gia') : 'Chưa tải trạng thái' });
  }
  if (ctx.purpose === 'ORDER') {
    if (session.code && ORDER_CODES.has(session.code)) steps.push({ id: 'order', label: 'Order authorization', ...fromStage(session, '') });
    else if (session.status === 'PASS') steps.push({ id: 'order', label: 'Order authorization', state: 'success', note: 'Backend chấp nhận đơn cho worker này' });
    else if (!ctx.orderId) steps.push({ id: 'order', label: 'Order authorization', state: 'active', note: 'Nhập Order ID' });
    else steps.push({ id: 'order', label: 'Order authorization', state: 'pending', note: 'Backend kiểm tra khi tạo session' });
  }

  // Session
  if (ctx.purpose === 'ORDER' && session.code && ORDER_CODES.has(session.code)) steps.push({ id: 'session', label: 'Session', state: 'skipped', note: 'Không tạo được vì đơn bị từ chối' });
  else steps.push({ id: 'session', label: 'Session', ...fromStage(session, 'Chưa tạo session') });

  // Capture
  const cam = get(t, 'CAMERA');
  if (cam.status === 'SKIPPED' && cam.code === 'SYNTHETIC_SERVER_PIXELS') steps.push({ id: 'capture', label: 'Capture', state: 'skipped', code: cam.code, note: 'Synthetic: server tự tạo ảnh' });
  else if (cam.status === 'PENDING') steps.push({ id: 'capture', label: 'Capture', state: 'pending', note: ctx.hasCapture ? 'Ảnh sẵn sàng (chưa gửi)' : 'Chưa chụp' });
  else steps.push({ id: 'capture', label: 'Capture', ...fromStage(cam, '') });

  // PAD
  steps.push({ id: 'pad', label: 'PAD', ...fromStage(get(t, 'PAD'), 'Chưa chạy') });

  // Match (daily/order)
  if (ctx.purpose !== 'ENROLLMENT') steps.push({ id: 'match', label: 'Match', ...fromStage(get(t, 'MATCH'), 'Chưa chạy') });

  // Final: template / verification / proof
  const proof = get(t, 'PROOF');
  const policy = get(t, 'POLICY');
  const finalLabel = ctx.purpose === 'ENROLLMENT' ? 'Template' : ctx.purpose === 'DAILY' ? 'Verification' : 'Proof';
  if (proof.code === 'TEMPLATE_ENROLLED') steps.push({ id: 'final', label: finalLabel, state: 'success', code: proof.code, note: 'Template đã tạo' });
  else if (ctx.purpose === 'ENROLLMENT' && proof.status === 'BLOCKED') steps.push({ id: 'final', label: finalLabel, state: 'blocked', code: policy.status === 'BLOCKED' ? policy.code : proof.code, note: `Không tạo template${policy.status === 'BLOCKED' && policy.code ? ` (${policy.code})` : ''}` });
  else if (proof.status === 'BLOCKED') steps.push({ id: 'final', label: finalLabel, state: 'blocked', code: proof.code, note: `${proof.code}${policy.status === 'BLOCKED' && policy.code ? ` · ${policy.code}` : ''}` });
  else steps.push({ id: 'final', label: finalLabel, ...fromStage(proof, 'Chưa chạy') });

  // Highlight the next step only while the run has not stopped.
  const stopped = t.some(s => TERMINAL.includes(s.status));
  if (!stopped && !steps.some(s => s.state === 'active')) {
    const next = steps.find(s => s.state === 'pending');
    if (next) next.state = 'active';
  }
  if (!ctx.hasSession && ctx.connection !== 'none') {
    const s = steps.find(x => x.id === 'session');
    if (s && s.state === 'pending' && !steps.some(x => x.state === 'active')) s.state = 'active';
  }
  return steps;
}

export type OutcomeKind = 'idle' | 'running' | 'success' | 'rejected' | 'blocked' | 'error';
export interface Outcome { kind: OutcomeKind; stage: Stage | null; stageLabel: string | null; code: string | null; title: string; text: string; httpRef?: string; ms?: number; padNotEvaluated: boolean }

/** First stage (pipeline order) that stopped the run, or the success/idle state. */
export function outcomeOf(t: Timeline): Outcome {
  const padNotEvaluated = t.some(s => s.status === 'NOT_EVALUATED');
  const total = t.reduce((a, s) => a + (s.ms ?? 0), 0) || undefined;
  if (t.every(s => s.status === 'PENDING')) return { kind: 'idle', stage: null, stageLabel: null, code: null, title: 'Chưa chạy', text: 'Tạo session, chụp ảnh (hoặc dùng synthetic ở research mode) rồi gửi.', padNotEvaluated };
  const proof = get(t, 'PROOF');
  if (proof.status === 'PASS') return { kind: 'success', stage: 'PROOF', stageLabel: STAGE_LABEL.PROOF, code: proof.code, title: 'Backend cấp proof', text: proof.detail, httpRef: proof.ref, ms: total, padNotEvaluated };
  if (proof.code === 'TEMPLATE_ENROLLED') return { kind: 'success', stage: 'PROOF', stageLabel: STAGE_LABEL.PROOF, code: proof.code, title: 'Backend tạo template', text: proof.detail, httpRef: proof.ref, ms: total, padNotEvaluated };
  const stop = STAGES.map(s => get(t, s)).find(s => TERMINAL.includes(s.status));
  if (!stop) {
    const last = [...t].reverse().find(s => s.status !== 'PENDING')!;
    return { kind: 'running', stage: last.stage, stageLabel: STAGE_LABEL[last.stage], code: last.code, title: `${STAGE_LABEL[last.stage]}: ${last.status}`, text: last.detail, httpRef: last.ref, ms: total, padNotEvaluated };
  }
  const kind: OutcomeKind = stop.status === 'FAIL' ? 'rejected' : stop.status === 'ERROR' ? 'error' : 'blocked';
  const verb = kind === 'rejected' ? 'REJECTED' : kind === 'error' ? 'ERROR' : 'BLOCKED';
  return { kind, stage: stop.stage, stageLabel: STAGE_LABEL[stop.stage], code: stop.code, title: `${verb} tại ${STAGE_LABEL[stop.stage]}`, text: describe(stop.code).text, httpRef: stop.ref, ms: total, padNotEvaluated };
}

/** Short status → tone used by every badge/dot in the UI. */
export type Tone = 'success' | 'rejected' | 'blocked' | 'error' | 'neutral' | 'info' | 'ne' | 'active';
export function toneOf(status: StageStatus | StepState | OutcomeKind | string): Tone {
  switch (status) {
    case 'PASS': case 'success': case 'VALID': case 'ALLOWED': case 'ok': return 'success';
    case 'FAIL': case 'rejected': return 'rejected';
    case 'BLOCKED': case 'blocked': case 'INVALID': return 'blocked';
    case 'ERROR': case 'error': case 'INCONCLUSIVE': return 'error';
    case 'NOT_EVALUATED': return 'ne';
    case 'MEASURED': case 'measured': case 'running': return 'info';
    case 'active': return 'active';
    default: return 'neutral';
  }
}

export const STEP_STATE_LABEL: Record<StepState, string> = {
  pending: 'Pending', active: 'Active', success: 'Success', rejected: 'Rejected', blocked: 'Blocked', error: 'Error', skipped: 'Skipped', measured: 'Measured',
};
