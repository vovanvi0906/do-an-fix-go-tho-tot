import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { FaceLabDebugGuard, faceLabEnabled } from './face-lab.guard';
import { FaceLabInspectorService, proofLifecycle, sessionLifecycle } from './face-lab-inspector.service';

const NOW = new Date('2026-11-14T10:00:00Z');
const later = ms => new Date(+NOW + ms);

describe('FaceLabDebugGuard', () => {
  test.each([
    [{ FACE_LAB_DEBUG_ENABLED: 'true', NODE_ENV: 'development' }, true],
    [{ FACE_LAB_DEBUG_ENABLED: 'true', NODE_ENV: 'staging' }, true],
    [{ FACE_LAB_DEBUG_ENABLED: 'true', NODE_ENV: 'production' }, false],
    [{ FACE_LAB_DEBUG_ENABLED: 'true' }, false],
    [{ FACE_LAB_DEBUG_ENABLED: '1', NODE_ENV: 'development' }, false],
    [{ NODE_ENV: 'development' }, false],
  ])('env %j enabled=%s', (env, expected) => {
    expect(faceLabEnabled(env)).toBe(expected);
    const guard = new FaceLabDebugGuard(env);
    if (expected) expect(guard.canActivate()).toBe(true);
    else expect(() => guard.canActivate()).toThrow(NotFoundException);
  });
});

describe('lifecycle helpers', () => {
  const base = { issuedAt: later(-1000), expiresAt: later(1000), consumedAt: null, revokedAt: null };
  test.each([
    [{}, 'ACTIVE'], [{ consumedAt: NOW }, 'CONSUMED'], [{ revokedAt: NOW, consumedAt: NOW }, 'REVOKED'],
    [{ expiresAt: NOW }, 'EXPIRED'], [{ issuedAt: later(5) }, 'NOT_YET_VALID'],
  ])('proof %j -> %s', (change, expected) => expect(proofLifecycle({ ...base, ...change }, NOW)).toBe(expected));
  test('pending session past expiry reads EXPIRED; terminal states unchanged', () => {
    expect(sessionLifecycle({ state: 'PENDING', expiresAt: NOW }, NOW)).toBe('EXPIRED');
    expect(sessionLifecycle({ state: 'SUCCEEDED', expiresAt: later(-5) }, NOW)).toBe('SUCCEEDED');
  });
});

function harness({ order = { id: 'o1', workerId: 'w1', status: 'ARRIVED' }, user } = {}) {
  const calls = {};
  const record = name => args => { calls[name] = args; return Promise.resolve(rows[name]); };
  const rows = {
    state: { workerId: 'w1', epoch: 2, lastVersion: 1, consentVersion: 'v1', consentedAt: later(-9e5), withdrawnAt: null },
    templates: [{ id: 't1', version: 1, epoch: 2, modelVersion: 'm', createdAt: later(-9e5), revokedAt: null, deletedAt: null }],
    sessions: [{ id: 's1', purpose: 'ORDER', orderId: 'o1', state: 'PENDING', attempts: 1, epoch: 2, templateVersion: 1, errorCode: null, createdAt: later(-200000), expiresAt: later(-80000), consumedAt: null }],
    proofs: [{ id: 'p1', sessionId: 's0', purpose: 'ORDER', orderId: 'o1', templateVersion: 1, epoch: 2, policyVersion: 'x', identityScore: .8, issuedAt: later(-1000), expiresAt: later(1000), consumedAt: NOW, revokedAt: null }],
    audits: [{ action: 'PROOF_ISSUED', reason: 'ORDER', createdAt: later(-1000) }],
  };
  const tx = {
    $queryRaw: () => Promise.resolve([{ now: NOW }]),
    user: { findUnique: () => Promise.resolve(user ?? { id: 'u1', role: 'WORKER', status: 'ACTIVE', workerProfile: { id: 'w1', approvalStatus: 'APPROVED' } }) },
    order: { findUnique: () => Promise.resolve(order) },
    biometricState: { findUnique: record('state') },
    biometricTemplate: { findMany: record('templates') },
    biometricSession: { findMany: record('sessions') },
    biometricProof: { findMany: record('proofs') },
    biometricAudit: { findMany: record('audits') },
  };
  const prisma = { $transaction: fn => fn(tx) };
  const core = {
    options: { consentVersion: 'v1', sessionMs: 120000, dailyMs: 1, orderMs: 1, attempts: 3, windowAttempts: 5, windowMs: 1, timeoutMs: 1, threshold: .6, captureApproved: false },
    policy: jest.fn(), now: t => t.$queryRaw().then(r => r[0].now), cryptoReady: () => false,
    consentValid: s => s && s.consentVersion === 'v1' && s.consentedAt && !s.withdrawnAt,
    gateway: { capabilities: async () => ({ identityModelReady: true, modelVersion: 'm', padEvaluated: false, padModelVersion: null }) },
  };
  return { service: new FaceLabInspectorService(prisma, core), calls, core, rows };
}

describe('FaceLabInspectorService', () => {
  test('returns lifecycle metadata scoped by JWT worker and never biometric/secret fields', async () => {
    const { service, calls } = harness();
    const r = await service.inspect('u1', 'o1');
    expect(calls.sessions.where).toEqual({ workerId: 'w1', orderId: 'o1' });
    expect(calls.proofs.where).toEqual({ workerId: 'w1', orderId: 'o1' });
    for (const name of ['sessions', 'templates', 'proofs']) {
      const selected = Object.keys(calls[name].select);
      for (const banned of ['nonceHash', 'captureDigest', 'claimId', 'encrypted', 'keyId', 'reviewId', 'requestKey', 'userId']) expect(selected).not.toContain(banned);
    }
    expect(Object.keys(calls.audits.select)).not.toContain('actorId');
    expect(r.proofs[0].lifecycle).toBe('CONSUMED');
    expect(r.sessions[0].lifecycle).toBe('EXPIRED');
    expect(r.templates[0].status).toBe('ACTIVE');
    expect(r.order).toEqual({ id: 'o1', status: 'ARRIVED', faceStageAllowed: true });
    expect(r.policy).toMatchObject({ padEvaluated: false, keysConfigured: false, thresholdStatus: 'PROVISIONAL_UNCALIBRATED' });
    expect(JSON.stringify(r)).not.toMatch(/nonce|embedding|ciphertext/i);
  });
  test('foreign order is denied instead of exposing other worker records', async () => {
    const { service } = harness({ order: { id: 'o2', workerId: 'other', status: 'ARRIVED' } });
    await expect(service.inspect('u1', 'o2')).rejects.toThrow(ForbiddenException);
  });
  test('missing order is denied with the same code', async () => {
    const { service } = harness({ order: null });
    await expect(service.inspect('u1', 'missing')).rejects.toThrow('ORDER_ACCESS_DENIED');
  });
  test('non-worker or inactive user denied', async () => {
    const { service } = harness({ user: { id: 'u1', role: 'WORKER', status: 'SUSPENDED', workerProfile: { id: 'w1' } } });
    await expect(service.inspect('u1')).rejects.toThrow('ACTIVE_WORKER_REQUIRED');
  });
  test('Face Core disabled propagates policy refusal', async () => {
    const { service, core } = harness();
    core.policy.mockImplementation(() => { throw new ForbiddenException('FACE_CORE_DISABLED'); });
    await expect(service.inspect('u1')).rejects.toThrow('FACE_CORE_DISABLED');
  });
  test('withdrawn consent reported invalid and deleted template/revoked proof visible', async () => {
    const { service, rows } = harness();
    rows.state = { ...rows.state, epoch: 3, consentVersion: null, consentedAt: null, withdrawnAt: NOW };
    rows.templates = [{ ...rows.templates[0], revokedAt: NOW, deletedAt: NOW }];
    rows.proofs = [{ ...rows.proofs[0], consumedAt: null, revokedAt: NOW }];
    rows.sessions = [{ ...rows.sessions[0], state: 'REVOKED', errorCode: 'TEMPLATE_REVOKED' }];
    const r = await service.inspect('u1');
    expect(r.consent).toMatchObject({ valid: false, withdrawnAt: NOW.toISOString() });
    expect(r.templates[0].status).toBe('DELETED');
    expect(r.proofs[0].lifecycle).toBe('REVOKED');
    expect(r.sessions[0]).toMatchObject({ lifecycle: 'REVOKED', stale: true, errorCode: 'TEMPLATE_REVOKED' });
  });
});
