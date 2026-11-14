import { applyError, applyMeasurement, emptyTimeline, setStage } from './timeline';
import { deriveSteps, outcomeOf, stepStateOf, type WorkflowContext } from './workflow';
import { nextAction } from './guidance';
import { measurement } from './fixtures';

const ctx = (patch: Partial<WorkflowContext> = {}): WorkflowContext => ({
  purpose: 'DAILY', backend: 'research', connection: 'ok', hasSession: false, hasCapture: false, timeline: emptyTimeline(), ...patch,
});
const byId = (steps: ReturnType<typeof deriveSteps>, id: string) => steps.find(s => s.id === id)!;

test('step lists follow each workflow', () => {
  expect(deriveSteps(ctx({ purpose: 'ENROLLMENT' })).map(s => s.label)).toEqual(['Connect', 'Consent', 'Session', 'Capture', 'PAD', 'Template']);
  expect(deriveSteps(ctx({ purpose: 'DAILY' })).map(s => s.label)).toEqual(['Connect', 'Session', 'Capture', 'PAD', 'Match', 'Verification']);
  expect(deriveSteps(ctx({ purpose: 'ORDER' })).map(s => s.label)).toEqual(['Connect', 'Order authorization', 'Session', 'Capture', 'PAD', 'Match', 'Proof']);
});

test('BLOCKED and FAIL stay distinct', () => {
  expect(stepStateOf('BLOCKED')).toBe('blocked');
  expect(stepStateOf('NOT_EVALUATED')).toBe('blocked');
  expect(stepStateOf('FAIL')).toBe('rejected');
  expect(stepStateOf('ERROR')).toBe('error');
});

test('no token → Connect is the active step', () => {
  const steps = deriveSteps(ctx({ connection: 'none' }));
  expect(byId(steps, 'connect').state).toBe('active');
  expect(steps.filter(s => s.state === 'active')).toHaveLength(1);
});

test('PAD_NOT_EVALUATED at session creation: session/PAD/final blocked, nothing succeeds after it', () => {
  const t = applyError(emptyTimeline(), 'SESSION', 'PAD_NOT_EVALUATED', 400);
  const steps = deriveSteps(ctx({ backend: 'core', timeline: t }));
  expect(byId(steps, 'session').state).toBe('blocked');
  expect(byId(steps, 'pad').state).toBe('blocked');
  expect(byId(steps, 'final').state).toBe('blocked');
  expect(steps.some(s => s.state === 'active')).toBe(false);
  const o = outcomeOf(t);
  expect(o.kind).toBe('blocked');
  expect(o.code).toBe('PAD_NOT_EVALUATED');
  expect(o.padNotEvaluated).toBe(true);
});

test('NO_FACE measurement is REJECTED (evaluated), proof still blocked, never success', () => {
  const m = measurement({ errorCode: 'NO_FACE', identityDecision: 'INCONCLUSIVE', identityScore: null,
    quality: { decision: 'FAIL', faceCount: 0, brightness: null, sharpness: null, reasons: ['NO_FACE'] } });
  const t = applyMeasurement(setStage(emptyTimeline(), 'SESSION', { status: 'PASS' }), m);
  const o = outcomeOf(t);
  expect(o.kind).toBe('rejected');
  expect(o.stage).toBe('DETECTION');
  const steps = deriveSteps(ctx({ timeline: t, hasSession: true }));
  expect(byId(steps, 'final').state).toBe('blocked');
  expect(steps.some(s => s.state === 'success' && s.id === 'final')).toBe(false);
});

test('a complete research measurement is BLOCKED by research authority, match shown as measured', () => {
  const t = applyMeasurement(setStage(emptyTimeline(), 'SESSION', { status: 'PASS' }), measurement());
  const o = outcomeOf(t);
  expect(o.kind).toBe('blocked');
  expect(o.code).toBe('RESEARCH_NO_AUTHORITY');
  expect(byId(deriveSteps(ctx({ timeline: t, hasSession: true })), 'match').state).toBe('measured');
});

test('order ownership rejection is shown on Order authorization, session skipped', () => {
  const t = applyError(emptyTimeline(), 'SESSION', 'RESEARCH_ORDER_DENIED', 403);
  const steps = deriveSteps(ctx({ purpose: 'ORDER', orderId: 'x', timeline: t }));
  expect(byId(steps, 'order').state).toBe('blocked');
  expect(byId(steps, 'order').code).toBe('RESEARCH_ORDER_DENIED');
  expect(byId(steps, 'session').state).toBe('skipped');
});

test('order without orderId asks for it', () => {
  expect(byId(deriveSteps(ctx({ purpose: 'ORDER' })), 'order').state).toBe('active');
});

test('enrollment consent state is reflected', () => {
  expect(byId(deriveSteps(ctx({ purpose: 'ENROLLMENT', backend: 'core', consent: 'blocked' })), 'consent').state).toBe('blocked');
  expect(byId(deriveSteps(ctx({ purpose: 'ENROLLMENT', backend: 'core', consent: 'ok' })), 'consent').state).toBe('success');
});

test('network error outcome is ERROR', () => {
  const o = outcomeOf(applyError(emptyTimeline(), 'SESSION', 'NETWORK_UNAVAILABLE', 0));
  expect(o.kind).toBe('error');
  expect(o.code).toBe('NETWORK_UNAVAILABLE');
});

test('idle outcome before any run', () => {
  expect(outcomeOf(emptyTimeline()).kind).toBe('idle');
});

test('guidance never suggests bypassing PAD and covers unknown PAD codes', () => {
  expect(nextAction('PAD_NOT_EVALUATED')).toMatch(/không thể vượt qua/);
  expect(nextAction('PAD_SOMETHING_NEW')).toBe(nextAction('PAD_NOT_EVALUATED'));
  expect(nextAction('WHATEVER')).toMatch(/Debug drawer/);
});
