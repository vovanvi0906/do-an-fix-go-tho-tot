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
it('self enrollment needs no identity review or pending admin request', async () => {
  const h = harness();
  expect(await h.core.status('u')).toMatchObject({
    enrollmentStatus: 'NOT_ENROLLED', enrollmentMethod: 'SELF_ENROLLMENT',
    canEnroll: true, canRequestReview: false, blockers: [],
  });
  expect(h.tx.biometricReview.findFirst).not.toHaveBeenCalled();
  expect(h.tx.biometricReview.findUnique).not.toHaveBeenCalled();
  expect(h.tx.biometricAudit.findMany).not.toHaveBeenCalled();
});
it('manual enrollment and reset approval endpoints no longer authorize enrollment', async () => {
  const h = harness();
  await expect(h.core.requestReview('u', {consent:true,kind:'ENROLLMENT'}))
    .rejects.toThrow('MANUAL_IDENTITY_REVIEW_REMOVED');
  await expect(h.core.review('admin', 'w', {}))
    .rejects.toThrow('MANUAL_IDENTITY_REVIEW_REMOVED');
  expect(h.events).toHaveLength(0);
  expect(h.tx.biometricReview.create).not.toHaveBeenCalled();
});
it('self enrollment still requires professional approval, consent and evaluated PAD', async () => {
  const h = harness();
  h.worker.approvalStatus = 'PENDING';
  expect((await h.core.status('u')).blockers).toContain('WORKER_APPROVAL_REQUIRED');
  h.worker.approvalStatus = 'APPROVED'; h.state.consentedAt = null;
  expect((await h.core.status('u')).blockers).toContain('CONSENT_REQUIRED');
  h.state.consentedAt = new Date();
  h.gateway.capabilities.mockResolvedValue({ identityModelReady:true,modelVersion:'model',padEvaluated:false });
  expect((await h.core.status('u')).canEnroll).toBe(false);
  await expect(h.core.ready()).rejects.toThrow('PAD_NOT_EVALUATED');
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

it.each(['MATCHED', 'WORKER_EN_ROUTE', 'IN_PROGRESS'])('AC-05 ORDER session rejects %s before any session insertion', async status => {
  const h = harness(); h.order({ workerId: 'w', status });
  await expect(h.core.createSession('u', { purpose: 'ORDER', orderId: 'o', requestKey: 'request' }))
    .rejects.toThrow('FACE_STAGE_NOT_ALLOWED');
  expect(h.events).toHaveLength(0);
});
it('AC-05 ORDER session rejects a different assigned worker', async () => {
  const h = harness(); h.order({ workerId: 'other', status: 'ARRIVED' });
  await expect(h.core.createSession('u', { purpose: 'ORDER', orderId: 'o', requestKey: 'request' }))
    .rejects.toThrow('ORDER_ACCESS_DENIED');
  expect(h.events).toHaveLength(0);
});

it('experimental PAD requires explicit opt-in, exact model and matching threshold without claiming evaluation', async () => {
  const version='experimental:anti-spoof-mn3:c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262';
  const identity={identityModelReady:true,modelVersion:'identity',padEvaluated:false,padExperimentalReady:true,padMode:'experimental',padThreshold:.85,padModelVersion:version};
  const client={faceCapabilities:jest.fn(async()=>identity)};
  expect((await new FaceEvidenceGateway(client,{},{}).capabilities()).padExperimentalReady).toBe(false);
  const gateway=new FaceEvidenceGateway(client,{}, {experimentalPad:true,padThreshold:.85});
  expect(await gateway.capabilities()).toMatchObject({padEvaluated:false,padExperimentalReady:true,padModelVersion:version});
  identity.padThreshold=.5;
  expect((await gateway.capabilities()).padExperimentalReady).toBe(false);
  identity.padThreshold=.85;identity.padModelVersion='unknown';
  expect((await gateway.capabilities()).padExperimentalReady).toBe(false);
});
it('experimental core accepts real threshold readiness only with opt-in and labels status', async () => {
  const h=harness();
  h.gateway.capabilities.mockResolvedValue({identityModelReady:true,modelVersion:'model',padEvaluated:false,padExperimentalReady:true,padMode:'experimental',padThreshold:.85,padModelVersion:'pad'});
  await expect(h.core.ready()).rejects.toThrow('PAD_NOT_EVALUATED');
  h.core.options.experimentalPad=true;
  await expect(h.core.ready()).resolves.toMatchObject({padExperimentalReady:true});
  expect(await h.core.status('u')).toMatchObject({canEnroll:true,padEvaluated:false,padMode:'experimental'});
});
