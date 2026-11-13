import { FastApiAiClient } from './fastapi-ai.client';
import { validTemplateFaceResult } from './face-result';
const expected = { workerId: 'w', sessionId: 's', templateVersion: 1, modelVersion: 'synthetic-v1', threshold: .6 };
const match = { ...expected, identityDecision: 'MATCH', identityScore: .8, verificationMethod: 'yunet_sface_cosine', qualityDecision: 'PASS', padDecision: 'NOT_EVALUATED', errorCode: 'COMPARED' };
describe('versioned template transport', () => {
  let original;
  beforeEach(() => { original = global.fetch; });
  afterEach(() => { global.fetch = original; });
  test('identity match remains explicitly not PAD evaluated', async () => {
    const client = new FastApiAiClient({ get: k => k === 'AI_FACE_SERVICE_TOKEN' ? 'synthetic-token' : undefined });
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => match }));
    const result = await client.verifyFaceTemplate({ ...expected, photo: 'inline', templateEmbedding: Array(128).fill(.1) });
    expect(result.identityDecision).toBe('MATCH');
    expect(result.padDecision).toBe('NOT_EVALUATED');
    expect(global.fetch.mock.calls[0][1].headers['x-face-service-token']).toBe('synthetic-token');
  });
  test.each([{ workerId: 'other' }, { sessionId: 'other' }, { modelVersion: 'other' }, { templateVersion: 2 },
    { identityScore: NaN }, { identityScore: '0.9' }, { qualityDecision: 'FAIL' }, { verificationMethod: 'detected' }, { padDecision: 'unknown' }])('reject invalid provenance %j', change => {
    expect(validTemplateFaceResult({ ...match, ...change }, expected)).toBe(false);
  });
  test('missing auth configuration does not call service', async () => {
    const saved = process.env.AI_FACE_SERVICE_TOKEN;
    delete process.env.AI_FACE_SERVICE_TOKEN;
    try {
      global.fetch = jest.fn();
      expect(await new FastApiAiClient({ get: () => undefined }).verifyFaceTemplate(expected)).toMatchObject({ identityDecision: 'TECHNICAL_ERROR' });
      expect(global.fetch).not.toHaveBeenCalled();
    } finally { if (saved !== undefined) process.env.AI_FACE_SERVICE_TOKEN = saved; }
  });
});
