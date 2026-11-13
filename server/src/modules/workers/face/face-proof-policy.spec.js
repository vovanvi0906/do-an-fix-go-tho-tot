import { assessFaceSession, createFaceChallenge, hashNonce, orderProofConsumptionWhere } from './face-proof-policy';
describe('proposed session policy (offline, no production issuer)', () => {
  let input;
  beforeEach(() => {
    const challenge = createFaceChallenge();
    const now = new Date('2026-11-13T10:00:00Z');
    input = {
      now, nonce: challenge.nonce, threshold: .6,
      actor: { workerId: 'w', userId: 'u', purpose: 'ORDER', orderId: 'o' },
      session: { id: 's', workerId: 'w', userId: 'u', purpose: 'ORDER', orderId: 'o', nonceHash: challenge.nonceHash,
        templateVersion: 1, modelVersion: 'synthetic-v1', createdAt: now, expiresAt: new Date(+now + 120000), consumedAt: null },
      template: { workerId: 'w', version: 1, modelVersion: 'synthetic-v1', status: 'ACTIVE' },
      evidence: { workerId: 'w', sessionId: 's', templateVersion: 1, modelVersion: 'synthetic-v1', identityDecision: 'MATCH',
        identityScore: .8, verificationMethod: 'yunet_sface_cosine', qualityDecision: 'PASS', padDecision: 'PASS' },
    };
  });
  test('synthetic PAD PASS only establishes eligibility, never a grant', () => {
    expect(assessFaceSession(input)).toBe('ELIGIBLE_FOR_ATOMIC_CONSUMPTION');
    expect(createFaceChallenge().nonce).not.toBe(input.nonce);
    expect(hashNonce(input.nonce)).toBe(input.session.nonceHash);
  });
  test.each(['NOT_EVALUATED', 'FAIL', 'INCONCLUSIVE', undefined])('PAD %s cannot grant', padDecision => {
    input.evidence.padDecision = padDecision;
    expect(assessFaceSession(input)).toBe('PAD_NOT_PASSED');
  });
  test.each([
    ['actor', { workerId: 'other' }, 'WRONG_WORKER'],
    ['actor', { userId: 'other' }, 'WRONG_WORKER'],
    ['actor', { orderId: 'other' }, 'WRONG_PURPOSE_OR_ORDER'],
    ['actor', { purpose: 'DAILY' }, 'WRONG_PURPOSE_OR_ORDER'],
    ['session', { expiresAt: new Date('2026-11-13T10:00:00Z') }, 'SESSION_EXPIRED'],
    ['session', { consumedAt: new Date() }, 'SESSION_CONSUMED'],
    ['session', { nonceHash: 'bad' }, 'INVALID_NONCE'],
    ['template', { status: 'REVOKED' }, 'TEMPLATE_REVOKED_OR_CHANGED'],
    ['template', { version: 2 }, 'TEMPLATE_REVOKED_OR_CHANGED'],
    ['evidence', { sessionId: 'old' }, 'EVIDENCE_BINDING_MISMATCH'],
    ['evidence', { identityScore: NaN }, 'IDENTITY_NOT_VERIFIED'],
    ['evidence', { identityDecision: 'NON_MATCH' }, 'IDENTITY_NOT_VERIFIED'],
    ['evidence', { verificationMethod: 'manual_review' }, 'IDENTITY_NOT_VERIFIED'],
  ])('rejects %s %j', (field, change, reason) => {
    Object.assign(input[field], change);
    expect(assessFaceSession(input)).toBe(reason);
  });
  test('nonce replay after consumption and stale nonce rejected', () => {
    expect(assessFaceSession({ ...input, nonce: 'previous' })).toBe('INVALID_NONCE');
    input.session.consumedAt = input.now;
    expect(assessFaceSession(input)).toBe('SESSION_CONSUMED');
  });
  test('daily must not carry order id', () => {
    input.actor.purpose = input.session.purpose = 'DAILY';
    expect(assessFaceSession(input)).toBe('WRONG_PURPOSE_OR_ORDER');
    input.session.orderId = null;
    expect(assessFaceSession(input)).toBe('ELIGIBLE_FOR_ATOMIC_CONSUMPTION');
  });
  test('conditional consumption predicate binds scope and unconsumed state', () => {
    expect(orderProofConsumptionWhere({ proofId: 'p', workerId: 'w', orderId: 'o', templateVersion: 1, now: input.now })).toEqual({
      id: 'p', workerId: 'w', orderId: 'o', purpose: 'ORDER', templateVersion: 1,
      consumedAt: null, revokedAt: null, issuedAt: { lte: input.now }, expiresAt: { gt: input.now },
    });
  });
});
