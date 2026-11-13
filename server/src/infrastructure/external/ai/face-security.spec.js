import { FastApiAiClient } from './fastapi-ai.client';
import { validFaceResult, hasTrustedFaceProof } from './face-result';
import { getFallbackFaceVerify } from './aiFallbackHelper';
import { WorkersService } from '../../../modules/workers/workers.service';
import { OrdersService } from '../../../modules/orders/orders.service';
import { OrderWorkflowService } from '../../../modules/orders/order-workflow.service';

const match = { verified: true, confidence: .8, status: 'MATCH', reason: 'COMPARED', engine: 'model', method: 'sface_cosine', workerId: 'w' };
const invalid = [null, {}, ...[NaN, Infinity, '0.9', null, 2].map(confidence => ({ ...match, confidence })),
  { ...match, engine: 'heuristic' }, { ...match, method: 'face_detected' },
  { ...match, status: 'INCONCLUSIVE' }, { ...match, verified: false },
  { ...match, confidence: .2 }, getFallbackFaceVerify()];

describe('FACE-SEC-01 contract and transport', () => {
  let client, originalFetch;
  beforeEach(() => { originalFetch = global.fetch; client = new FastApiAiClient({ get: () => undefined }); });
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });
  test('accepts explicit matching and non-matching contracts only', () => {
    expect(validFaceResult(match)).toBe(true);
    expect(validFaceResult({ ...match, verified: false, status: 'NON_MATCH', confidence: .2 })).toBe(true);
    for (const r of invalid.slice(0, -1)) expect(validFaceResult(r)).toBe(false);
    expect(getFallbackFaceVerify('w', 'clean')).toMatchObject({ verified: false, status: 'TECHNICAL_ERROR', confidence: null });
    expect(hasTrustedFaceProof({ faceVerifiedAt: new Date() })).toBe(false);
  });
  test.each(['network', 'timeout', 'http', 'invalid', 'wrong_worker'])('%s fails closed with a bounded request', async kind => {
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue(new AbortController().signal);
    global.fetch = jest.fn(async () => {
      if (['network', 'timeout'].includes(kind)) throw new Error(kind);
      return { ok: kind !== 'http', json: async () => kind === 'invalid' ? { verified: true, confidence: .95 } : { ...match, workerId: 'other' } };
    });
    expect(await client.verifyFace('w', 'selfie', 'reference', { allowFallback: true })).toMatchObject({ verified: false, status: 'TECHNICAL_ERROR' });
    expect(AbortSignal.timeout).toHaveBeenCalledWith(15000);
  });
  test('aborts a stalled fetch rather than waiting indefinitely', async () => {
    const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
    jest.spyOn(AbortSignal, 'timeout').mockImplementation(() => nativeTimeout(10));
    global.fetch = jest.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    expect(await client.verifyFace('w', 'selfie', 'reference')).toMatchObject({ status: 'TECHNICAL_ERROR', verified: false });
    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(true);
  });

});

describe('FACE-SEC-01 no proof grants', () => {
  let prisma, ai, worker;
  beforeEach(() => {
    worker = { id: 'w', faceProfile: { facePhotoUrl: 'reference' }, avatarUrl: 'avatar' };
    prisma = { workerProfile: { findUnique: jest.fn(async () => worker), update: jest.fn() } };
    ai = { verifyFace: jest.fn(async () => match) };
  });
  test.each([...invalid, match, { ...match, status: 'NON_MATCH', verified: false, confidence: .2 }])('daily/order never persist unproven result %#', async result => {
    ai.verifyFace.mockResolvedValue(result);
    await expect(new WorkersService(prisma, {}, ai).verifyFaceDaily('u', 'selfie')).rejects.toThrow();
    const service = Object.create(OrdersService.prototype);
    Object.assign(service, { prisma, fastApiAiClient: ai, orderWorkflowService: { access: jest.fn(async () => ({ order: { status: 'ARRIVED' } })) } });
    await expect(service.verifyFace('o', 'u', { photoUrl: 'selfie' })).rejects.toThrow();
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
  });
  test('transport rejection does not write proof', async () => {
    ai.verifyFace.mockRejectedValue(new Error('network'));
    await expect(new WorkersService(prisma, {}, ai).verifyFaceDaily('u', 'selfie')).rejects.toThrow('network');
    expect(prisma.workerProfile.update).not.toHaveBeenCalled();
  });
  test('does not substitute avatar for missing reference', async () => {
    worker.faceProfile = null;
    const service = Object.create(OrdersService.prototype);
    Object.assign(service, { prisma, fastApiAiClient: ai, orderWorkflowService: { access: async () => ({ order: { status: 'ARRIVED' } }) } });
    await expect(service.verifyFace('o', 'u', { photoUrl: 'selfie' })).rejects.toThrow('REFERENCE_MISSING');
    expect(ai.verifyFace).not.toHaveBeenCalled();
  });
  test('preserves actor, ownership and stage checks before AI', async () => {
    const workflow = new OrderWorkflowService({ user: { findUnique: async () => ({ id: 'u', status: 'ACTIVE', role: 'WORKER', workerProfile: { id: 'w' } }) }, order: { findUnique: async () => ({ workerId: 'other' }) } });
    await expect(workflow.access('o', null, ['WORKER'])).rejects.toThrow('AUTH_REQUIRED');
    await expect(workflow.access('o', 'u', ['WORKER'])).rejects.toThrow('ORDER_ACCESS_DENIED');
    const service = Object.create(OrdersService.prototype);
    Object.assign(service, { prisma, fastApiAiClient: ai, orderWorkflowService: workflow });
    await expect(service.verifyFace('o', 'u', { photoUrl: 'selfie' })).rejects.toThrow('ORDER_ACCESS_DENIED');
    service.orderWorkflowService = { access: async () => ({ order: { status: 'COMPLETED' } }) };
    await expect(service.verifyFace('o', 'u', { photoUrl: 'selfie' })).rejects.toThrow('FACE_STAGE_NOT_ALLOWED');
    expect(ai.verifyFace).not.toHaveBeenCalled();
    expect(() => workflow.requireFace({ faceVerifiedAt: new Date() })).toThrow('FACE_CHECKIN_EXPIRED');
  });
});
