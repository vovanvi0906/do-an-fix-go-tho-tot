import { FaceIdentityService } from './face-identity.service';
import { sealTemplate, openTemplate } from './template-crypto';
import { randomBytes } from 'crypto';

describe('enrollment capability, never an approval', () => {
  const make = worker => new FaceIdentityService({ workerProfile: { findUnique: jest.fn(async () => worker) } });
  const worker = { user: { role: 'WORKER', status: 'ACTIVE' }, approvalStatus: 'APPROVED' };
  test('approved professional profile is not approved biometric identity', async () => {
    const service = make(worker);
    expect(await service.status('jwt-user')).toMatchObject({ enrollmentStatus: 'PENDING_REVIEW', canEnroll: false, dailyProof: null });
    expect(service.prisma.workerProfile.findUnique.mock.calls[0][0].where).toEqual({ userId: 'jwt-user' });
    expect(await service.preflight('jwt-user', { consent: true })).toMatchObject({ accepted: false, reviewRequestSubmitted: false });
    expect(await service.preflight('jwt-user', { consent: true }, true)).toMatchObject({ accepted: false, errorCode: 'RESET_REVIEW_WORKFLOW_UNAVAILABLE' });
  });
  test.each([null, { user: { role: 'CUSTOMER', status: 'ACTIVE' } }, { user: { role: 'WORKER', status: 'BLOCKED' } }])('reject missing or unauthorized worker %#', async value => {
    await expect(make(value).status('u')).rejects.toThrow();
  });
  test('legacy reference is quarantined and no overwrite occurs', async () => {
    expect(await make({ ...worker, faceProfile: { id: 'legacy' } }).status('u')).toMatchObject({ enrollmentStatus: 'LEGACY_UNTRUSTED', canEnroll: false, templateVersion: null });
  });
  test.each([{}, { consent: false }, { consent: true, workerId: 'other' }, { consent: true, photoUrl: 'photo' }])('reject no consent or client reference %#', async body => {
    await expect(make(worker).preflight('u', body)).rejects.toThrow('EXPLICIT_CONSENT');
  });
});

describe('encrypted versioned template primitive (synthetic vectors only)', () => {
  const embedding = Array(128).fill(.125);
  const context = { workerId: 'synthetic-worker', templateVersion: 1, modelVersion: 'sface-test' };
  const key = randomBytes(32);
  test('round trip with randomized ciphertext', () => {
    const first = sealTemplate(embedding, context, key);
    expect(openTemplate(first, context, key)).toEqual(embedding);
    expect(sealTemplate(embedding, context, key).ciphertext).not.toBe(first.ciphertext);
  });
  test.each([{ workerId: 'other' }, { templateVersion: 2 }, { modelVersion: 'other' }])('AAD rejects swapped binding %j', change => {
    expect(() => openTemplate(sealTemplate(embedding, context, key), { ...context, ...change }, key)).toThrow();
  });
  test('wrong key and ciphertext modification are rejected', () => {
    const envelope = sealTemplate(embedding, context, key);
    expect(() => openTemplate(envelope, context, randomBytes(32))).toThrow();
    const bytes = Buffer.from(envelope.ciphertext, 'base64'); bytes[0] ^= 1;
    expect(() => openTemplate({ ...envelope, ciphertext: bytes.toString('base64') }, context, key)).toThrow();
  });
  test.each([[], Array(128).fill(NaN), Array(128).fill(0)])('invalid embeddings rejected %#', value => {
    expect(() => sealTemplate(value, context, key)).toThrow('INVALID_EMBEDDING');
  });
});
