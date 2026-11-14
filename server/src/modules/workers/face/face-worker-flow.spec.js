import { FaceCoreService } from './face-core.service';
import { FaceEvidenceGateway } from './face-evidence.gateway';

function harness() {
  const events = [];
  const state = {
    epoch: 0,
    lastVersion: 0,
    consentVersion: 'v1',
    consentedAt: new Date(),
    withdrawnAt: null,
  };
  const worker = {
    id: 'w',
    userId: 'u',
    approvalStatus: 'APPROVED',
    user: { role: 'WORKER', status: 'ACTIVE' },
  };
  let current = null,
    review = null,
    order = { workerId: 'w', status: 'ACCEPTED' };
  const tx = {
    $queryRaw: jest.fn(async () => [{ now: new Date() }]),
    user: {
      findUnique: jest.fn(async ({ where }) =>
        where.id === 'admin'
          ? { role: 'ADMIN', status: 'ACTIVE' }
          : { ...worker.user, workerProfile: worker },
      ),
    },
    workerProfile: { findUnique: jest.fn(async () => worker) },
    biometricState: {
      findUnique: jest.fn(async () => state),
      upsert: jest.fn(async () => state),
    },
    biometricTemplate: { findFirst: jest.fn(async () => current) },
    biometricReview: {
      findFirst: jest.fn(async () => review),
      findUnique: jest.fn(async () => review),
      create: jest.fn(async ({ data }) => ({ id: 'review-id', ...data })),
    },
    biometricProof: { findFirst: jest.fn(async () => null) },
    order: { findUnique: jest.fn(async () => order) },
    biometricAudit: {
      findMany: jest.fn(async ({ where }) =>
        [...events]
          .reverse()
          .filter((event) =>
            Object.entries(where).every(([key, value]) => event[key] === value),
          ),
      ),
      create: jest.fn(async ({ data }) => {
        const event = {
          ...data,
          id: `request-${events.length}`,
          createdAt: new Date(),
        };
        events.push(event);
        return event;
      }),
      findFirst: jest.fn(
        async ({ where }) =>
          [...events]
            .reverse()
            .find((event) =>
              Object.entries(where).every(
                ([key, value]) => event[key] === value,
              ),
            ) || null,
      ),
    },
  };
  const prisma = { ...tx, $transaction: (fn) => fn(tx) };
  const gateway = {
    capabilities: jest.fn(async () => ({
      identityModelReady: true,
      modelVersion: 'model',
      padEvaluated: true,
      padModelVersion: 'pad',
    })),
  };
  const core = new FaceCoreService(prisma, gateway, {
    enabled: true,
    captureApproved: true,
    consentVersion: 'v1',
    keys: { k: Buffer.alloc(32) },
    currentKeyId: 'k',
    nonceKey: Buffer.alloc(32),
    sessionMs: 120000,
    dailyMs: 28800000,
    orderMs: 300000,
    attempts: 3,
    windowAttempts: 5,
    windowMs: 900000,
    timeoutMs: 15000,
    threshold: 0.6,
  });
  return {
    core,
    tx,
    events,
    state,
    worker,
    gateway,
    template: (value) => {
      current = value;
    },
    review: (value) => {
      review = value;
    },
    order: (value) => {
      order = value;
    },
  };
}
it('persists one pending request per epoch and does not create a template or proof', async () => {
  const { core, tx, events } = harness();
  const first = await core.requestReview('u', {
    consent: true,
    kind: 'ENROLLMENT',
  });
  const retry = await core.requestReview('u', {
    consent: true,
    kind: 'ENROLLMENT',
  });
  expect(retry.request.id).toBe(first.request.id);
  expect(events).toHaveLength(1);
  expect(tx.biometricTemplate.findFirst).not.toHaveBeenCalled();
  expect((await core.status('u')).reviewRequestSubmitted).toBe(true);
  expect((await core.status('u')).canEnroll).toBe(false);
});
it('request requires consent, approved worker and correct first/reset kind', async () => {
  const h = harness();
  await expect(
    h.core.requestReview('u', { consent: false, kind: 'ENROLLMENT' }),
  ).rejects.toThrow('CONSENT');
  await expect(
    h.core.requestReview('u', { consent: true, kind: 'REENROLLMENT' }),
  ).rejects.toThrow('KIND');
  h.worker.approvalStatus = 'PENDING';
  await expect(
    h.core.requestReview('u', { consent: true, kind: 'ENROLLMENT' }),
  ).rejects.toThrow('APPROVAL');
  expect(h.events).toHaveLength(0);
});
it('reset request keeps active template, admin rejection closes only that request', async () => {
  const h = harness();
  h.state.lastVersion = 1;
  h.template({ id: 'template', version: 1, modelVersion: 'model' });
  const submitted = await h.core.requestReview('u', {
    consent: true,
    kind: 'REENROLLMENT',
  });
  expect((await h.core.status('u')).templateVersion).toBe(1);
  await expect(
    h.core.rejectReviewRequest('u', 'w', {
      requestId: submitted.request.id,
      reason: 'no',
    }),
  ).rejects.toThrow('ADMIN');
  await h.core.rejectReviewRequest('admin', 'w', {
    requestId: submitted.request.id,
    reason: 'Need identity evidence',
  });
  expect((await h.core.status('u')).reviewRequestSubmitted).toBe(false);
  expect((await h.core.status('u')).templateVersion).toBe(1);
  await expect(
    h.core.rejectReviewRequest('admin', 'w', {
      requestId: submitted.request.id,
      reason: 'again',
    }),
  ).rejects.toThrow('NOT_PENDING');
});
it('approval binds to pending request and resolves it atomically', async () => {
  const h = harness();
  const { request } = await h.core.requestReview('u', {
    consent: true,
    kind: 'ENROLLMENT',
  });
  const data = {
    requestId: request.id,
    kind: 'ENROLLMENT',
    reviewedIdentity: true,
    evidenceReference: 'review:unit',
    evidenceDigest: 'a'.repeat(64),
    reason: 'Synthetic review only',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  await expect(
    h.core.review('admin', 'w', { ...data, requestId: 'wrong' }),
  ).rejects.toThrow('NOT_PENDING');
  await h.core.review('admin', 'w', data);
  expect(await h.core.pendingReview(h.tx, 'w', 0)).toBeNull();
  expect(h.tx.biometricReview.create).toHaveBeenCalledTimes(1);
});
it('capabilities reflect model mismatch and order stage, not template existence alone', async () => {
  const h = harness();
  h.template({ id: 't', version: 1, modelVersion: 'model' });
  h.review({
    id: 'r',
    workerId: 'w',
    epoch: 0,
    expiresAt: new Date(Date.now() - 86400000),
  });
  expect(await h.core.status('u', 'o')).toMatchObject({
    canVerifyDaily: true,
    canVerifyOrder: false,
  });
  h.order({ workerId: 'w', status: 'ARRIVED' });
  expect((await h.core.status('u', 'o')).canVerifyOrder).toBe(true);
  h.gateway.capabilities.mockResolvedValue({
    identityModelReady: false,
    modelVersion: null,
    padEvaluated: true,
  });
  expect((await h.core.status('u')).blockers).toContain(
    'IDENTITY_MODEL_NOT_READY',
  );
  await expect(h.core.ready()).rejects.toThrow('IDENTITY_MODEL_NOT_READY');
});
it('PAD gateway requires both reviewed server allowlist and matching AI evaluation reference', async () => {
  const client = {
    faceCapabilities: jest.fn(async () => ({
      identityModelReady: true,
      modelVersion: 'model',
      padEvaluated: true,
      padModelVersion: 'pad',
      padEvaluationReference: 'approved-eval',
    })),
  };
  expect(
    (await new FaceEvidenceGateway(client).capabilities()).padEvaluated,
  ).toBe(false);
  expect(
    (
      await new FaceEvidenceGateway(client, {
        pad: 'approved-eval',
      }).capabilities()
    ).padEvaluated,
  ).toBe(true);
  expect(
    (await new FaceEvidenceGateway(client, { pad: 'other' }).capabilities())
      .padEvaluated,
  ).toBe(false);
});
