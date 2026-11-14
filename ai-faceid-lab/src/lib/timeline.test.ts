import { applyCoreResult, applyError, applyMeasurement, emptyTimeline, setStage, type Timeline } from './timeline';
import { measurement } from './fixtures';
import { codeOf, describe as describeCode } from './codes';

const st = (t: Timeline, stage: string) => t.find(s => s.stage === stage)!;

describe('applyError (backend rejection mapping)', () => {
  test('PAD unavailable: Face Core refuses session creation with PAD_NOT_EVALUATED', () => {
    const t = applyError(emptyTimeline(), 'SESSION', 'PAD_NOT_EVALUATED', 400);
    expect(st(t, 'SESSION')).toMatchObject({ status: 'BLOCKED', code: 'PAD_NOT_EVALUATED' });
    expect(st(t, 'PAD')).toMatchObject({ status: 'NOT_EVALUATED', code: 'PAD_NOT_EVALUATED' });
    expect(st(t, 'PROOF').status).toBe('BLOCKED');
    expect(st(t, 'CAMERA').status).toBe('SKIPPED');
    expect(st(t, 'MATCH').status).toBe('SKIPPED');
    expect(t.filter(s => s.status === 'PASS').map(s => s.stage)).toEqual(['AUTH']);
  });
  test.each([
    ['INVALID_NONCE', 'SESSION'], ['RESEARCH_NONCE_INVALID', 'SESSION'], ['SESSION_EXPIRED_OR_REVOKED', 'SESSION'], ['RESEARCH_SESSION_EXPIRED', 'SESSION'],
    ['ORDER_ACCESS_DENIED', 'SESSION'], ['RESEARCH_ORDER_DENIED', 'SESSION'], ['RESEARCH_REPLAY_CHANGED', 'SESSION'],
  ])('session-level rejection %s blocks %s and proof', (code, stage) => {
    const t = applyError(emptyTimeline(), 'SESSION', code);
    expect(st(t, stage).code).toBe(code);
    expect(st(t, 'PROOF').status).toBe('BLOCKED');
  });
  test('consent revoked surfaces at POLICY even when raised during session creation', () => {
    const t = applyError(emptyTimeline(), 'SESSION', 'CONSENT_REQUIRED', 400);
    expect(st(t, 'SESSION').status).toBe('BLOCKED');
    expect(st(t, 'POLICY')).toMatchObject({ status: 'BLOCKED', code: 'CONSENT_REQUIRED' });
  });
  test('proof consumed is a PROOF failure', () => {
    const t = applyError(emptyTimeline(), 'SESSION', 'PROOF_ALREADY_CONSUMED', 409);
    expect(st(t, 'PROOF')).toMatchObject({ status: 'FAIL', code: 'PROOF_ALREADY_CONSUMED' });
  });
  test('model timeout is a technical ERROR, never a pass', () => {
    const t = applyError(emptyTimeline(), 'DETECTION', 'RESEARCH_AI_TIMEOUT', 504);
    expect(st(t, 'DETECTION')).toMatchObject({ status: 'ERROR', code: 'RESEARCH_AI_TIMEOUT' });
    expect(st(t, 'PAD').status).toBe('SKIPPED');
    expect(st(t, 'PROOF').status).toBe('BLOCKED');
  });
  test('camera permission denied stops at CAMERA', () => {
    const t = applyError(setStage(emptyTimeline(), 'SESSION', { status: 'PASS' }), 'CAMERA', 'CAMERA_PERMISSION_DENIED');
    expect(st(t, 'SESSION').status).toBe('PASS');
    expect(st(t, 'CAMERA')).toMatchObject({ status: 'BLOCKED', code: 'CAMERA_PERMISSION_DENIED' });
    expect(st(t, 'QUALITY').status).toBe('SKIPPED');
  });
  test('Face Core blockers annotate every refusing gate, not only the first', () => {
    const t = applyError(emptyTimeline(), 'SESSION', 'BIOMETRIC_DATA_POLICY_NOT_APPROVED', 400, ['BIOMETRIC_DATA_POLICY_NOT_APPROVED', 'PAD_NOT_EVALUATED']);
    expect(st(t, 'POLICY')).toMatchObject({ status: 'BLOCKED', code: 'BIOMETRIC_DATA_POLICY_NOT_APPROVED' });
    expect(st(t, 'PAD')).toMatchObject({ status: 'NOT_EVALUATED', code: 'PAD_NOT_EVALUATED' });
    expect(st(t, 'SESSION').ref).toBe('HTTP 400');
  });
  test('business rejection after auth marks AUTH PASS; offline (no status) does not', () => {
    expect(st(applyError(emptyTimeline(), 'SESSION', 'ORDER_ACCESS_DENIED', 403), 'AUTH').status).toBe('PASS');
    expect(st(applyError(emptyTimeline(), 'SESSION', 'NETWORK_UNAVAILABLE', 0), 'AUTH').status).toBe('SKIPPED');
  });
  test('auth failures stop at AUTH', () => {
    const t = applyError(emptyTimeline(), 'SESSION', 'UNAUTHORIZED', 401);
    expect(st(t, 'AUTH')).toMatchObject({ status: 'BLOCKED', code: 'UNAUTHORIZED' });
  });
  test('BLOCKED_DATA / BLOCKED_APPROVAL PAD reasons are NOT_EVALUATED', () => {
    for (const reason of ['PAD_BLOCKED_DATA', 'PAD_BLOCKED_APPROVAL']) {
      const t = applyMeasurement(emptyTimeline(), measurement({ padPolicy: { decision: 'NOT_EVALUATED', reason, evaluated: false, threshold: null, evaluationReference: null } }));
      expect(st(t, 'PAD')).toMatchObject({ status: 'NOT_EVALUATED', code: reason });
    }
  });
  test('unknown code is reported as error, not swallowed', () => {
    expect(describeCode('SOMETHING_NEW').kind).toBe('ERROR');
  });
});

describe('applyMeasurement (research)', () => {
  test('high PAD real score is still NOT_EVALUATED and no proof', () => {
    const t = applyMeasurement(emptyTimeline(), measurement({ padRealScore: 0.9999, padSpoofScore: 0.0001 }));
    expect(st(t, 'PAD')).toMatchObject({ status: 'NOT_EVALUATED', code: 'PAD_BLOCKED_DATA' });
    expect(st(t, 'POLICY').status).toBe('BLOCKED');
    expect(st(t, 'PROOF')).toMatchObject({ status: 'BLOCKED', code: 'PROOF_NOT_ISSUED_RESEARCH_ONLY' });
  });
  test('cosine shown with provisional threshold, MEASURED not MATCH (genuine-like)', () => {
    const t = applyMeasurement(emptyTimeline(), measurement({ identityScore: 0.81 }));
    expect(st(t, 'MATCH').status).toBe('MEASURED');
    expect(st(t, 'MATCH').detail).toContain('0.8100');
    expect(st(t, 'MATCH').detail).toContain('≥ ngưỡng tham chiếu 0.6');
  });
  test('impostor-like cosine below threshold is reported as below', () => {
    const t = applyMeasurement(emptyTimeline(), measurement({ identityScore: 0.12 }));
    expect(st(t, 'MATCH').detail).toContain('< ngưỡng tham chiếu 0.6');
  });
  test('no face: quality FAIL, PAD not run, no score', () => {
    const t = applyMeasurement(emptyTimeline(), measurement({ errorCode: 'NO_FACE', identityDecision: 'INCONCLUSIVE', identityScore: null, padRealScore: null, padSpoofScore: null,
      quality: { decision: 'FAIL', faceCount: 0, brightness: null, sharpness: null, reasons: ['NO_FACE'] },
      padPolicy: { decision: 'NOT_EVALUATED', reason: 'PAD_NOT_RUN_NO_SINGLE_FACE', evaluated: false, threshold: null, evaluationReference: null } }));
    expect(st(t, 'IMAGE').status).toBe('PASS');
    expect(st(t, 'DETECTION')).toMatchObject({ status: 'FAIL', code: 'NO_FACE' });
    expect(st(t, 'QUALITY').status).toBe('SKIPPED');
    expect(st(t, 'PAD').code).toBe('PAD_NOT_RUN_NO_SINGLE_FACE');
    expect(st(t, 'MATCH').status).not.toBe('MEASURED');
  });
  test('multiple faces and blur/dark reasons are explicit', () => {
    expect(st(applyMeasurement(emptyTimeline(), measurement({ errorCode: 'MULTIPLE_FACES', quality: { decision: 'FAIL', faceCount: 2, brightness: null, sharpness: null, reasons: ['MULTIPLE_FACES'] } })), 'DETECTION').code).toBe('MULTIPLE_FACES');
    const t = applyMeasurement(emptyTimeline(), measurement({ quality: { decision: 'FAIL', faceCount: 1, brightness: 20, sharpness: 10, reasons: ['TOO_DARK', 'BLUR'] } }));
    expect(st(t, 'QUALITY').status).toBe('FAIL');
    expect(st(t, 'QUALITY').detail).toMatch(/TOO_DARK.*BLUR/);
  });
  test('PAD timeout is ERROR', () => {
    const t = applyMeasurement(emptyTimeline(), measurement({ padRealScore: null, padSpoofScore: null, padPolicy: { decision: 'INCONCLUSIVE', reason: 'PAD_TIMEOUT', evaluated: false, threshold: null, evaluationReference: null } }));
    expect(st(t, 'PAD')).toMatchObject({ status: 'ERROR', code: 'PAD_TIMEOUT' });
  });
  test('legacy response without padPolicy defaults to NOT_EVALUATED', () => {
    expect(st(applyMeasurement(emptyTimeline(), measurement({ padPolicy: null })), 'PAD').status).toBe('NOT_EVALUATED');
  });
  test('timings attached per stage', () => {
    const t = applyMeasurement(emptyTimeline(), measurement());
    expect(st(t, 'PAD').ms).toBe(8);
    expect(st(t, 'IMAGE').ms).toBe(2);
    expect(st(t, 'DETECTION').ms).toBe(10);
    expect(st(t, 'QUALITY').ms).toBeCloseTo(0.1);
  });
  test('every inference stage carries session correlation and model/policy version', () => {
    const t = applyMeasurement(emptyTimeline(), measurement());
    for (const s of ['IMAGE', 'DETECTION', 'QUALITY', 'PAD', 'MATCH', 'POLICY', 'PROOF']) expect(st(t, s).ref).toBe('session s1');
    expect(st(t, 'DETECTION').version).toBe('yunet-sface:x');
    expect(st(t, 'PAD').version).toBe('experimental:anti-spoof-mn3:y');
    expect(st(t, 'MATCH').policy).toContain('PROVISIONAL_UNCALIBRATED');
    expect(st(t, 'POLICY').policy).toBe('research-no-decision-v1');
  });
  test('technical pipeline failure stops at IMAGE with ERROR', () => {
    const t = applyMeasurement(emptyTimeline(), measurement({ errorCode: 'RESEARCH_PROCESSING_FAILED', identityScore: null, padRealScore: null }));
    expect(st(t, 'IMAGE').status).toBe('ERROR');
    expect(st(t, 'DETECTION').status).toBe('SKIPPED');
    expect(st(t, 'PROOF').status).toBe('BLOCKED');
  });
});

describe('applyCoreResult', () => {
  test('only an actual backend proof marks PROOF PASS', () => {
    const t = applyCoreResult(emptyTimeline(), { verified: true, proof: { id: 'p', purpose: 'ORDER', orderId: 'o', templateVersion: 1, issuedAt: '', expiresAt: 'x', consumedAt: null } });
    expect(st(t, 'PROOF').status).toBe('PASS');
    expect(st(applyCoreResult(emptyTimeline(), { verified: false }), 'PROOF').status).toBe('BLOCKED');
  });
});

test('codeOf parses FixGo messages', () => {
  expect(codeOf('FACE_INPUT_INVALID: Dữ liệu không hợp lệ')).toBe('FACE_INPUT_INVALID');
  expect(codeOf('PAD_NOT_EVALUATED')).toBe('PAD_NOT_EVALUATED');
  expect(codeOf('Bad Request')).toBeNull();
});
