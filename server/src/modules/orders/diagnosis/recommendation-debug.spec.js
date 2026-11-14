import { RecommendationDebugGuard } from './recommendation-debug';
import { catalogRead } from '../../symptoms/symptom-catalog';
import { resolveDiagnosis } from './diagnosis-resolver';
describe('Recommendation debug security and failure gates', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });
  const context = (token) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: token } }),
    }),
  });
  it('is disabled by default and always disabled in production', () => {
    delete process.env.RECOMMENDATION_DEBUG_ENABLED;
    expect(() =>
      new RecommendationDebugGuard().canActivate(context('')),
    ).toThrow();
    process.env.RECOMMENDATION_DEBUG_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    expect(() =>
      new RecommendationDebugGuard().canActivate(context('')),
    ).toThrow();
  });
  it('requires a strong token in dev/staging/test', () => {
    process.env.NODE_ENV = 'test';
    process.env.RECOMMENDATION_DEBUG_ENABLED = 'true';
    process.env.RECOMMENDATION_DEBUG_TOKEN = 'x'.repeat(64);
    expect(() =>
      new RecommendationDebugGuard().canActivate(context('Bearer wrong')),
    ).toThrow();
    expect(
      new RecommendationDebugGuard().canActivate(
        context('Bearer ' + 'x'.repeat(64)),
      ),
    ).toBe(true);
  });
  it.each(['P1001', 'P1002', 'P2021'])(
    'maps catalog availability %s to safe 503',
    async (code) => {
      try {
        await catalogRead(() =>
          Promise.reject({ code, message: 'secret DSN' }),
        );
        throw new Error('expected rejection');
      } catch (e) {
        expect(e.getStatus()).toBe(503);
        expect(JSON.stringify(e.getResponse())).not.toContain('secret');
      }
    },
  );
  it('preserves request ID through resolver and AI transport', async () => {
    const ai = {
      diagnoseIncident: jest.fn().mockResolvedValue({ engine: 'unavailable' }),
    };
    const result = await resolveDiagnosis(
      { serviceCategory: { findMany: async () => [] } },
      ai,
      { imageUrl: 'https://example.test/image', requestId: 'correlation-03' },
    );
    expect(result.requestId).toBe('correlation-03');
    expect(ai.diagnoseIncident).toHaveBeenCalledWith(
      'https://example.test/image',
      '',
      'correlation-03',
    );
  });
});

describe('Diagnosis AI correlation transport', () => {
  it('forwards correlation ID without changing the production JSON payload', async () => {
    const {
      FastApiAiClient,
    } = require('../../../infrastructure/external/ai/fastapi-ai.client');
    const original = global.fetch;
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ engine: 'model' }) });
    try {
      await new FastApiAiClient({ get: () => undefined }).diagnoseIncident(
        'https://example.test/image',
        'reported',
        'transport-03',
      );
      expect(global.fetch.mock.calls[0][1].headers['X-Request-ID']).toBe(
        'transport-03',
      );
      expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
        imageUrl: 'https://example.test/image',
        description: 'reported',
      });
    } finally {
      global.fetch = original;
    }
  });
});

it('preserves a whitelisted failed AI stage without leaking upstream details', async () => {
  const { inspectRecommendation } = require('./recommendation-debug');
  const original = global.fetch;
  global.fetch = jest
    .fn()
    .mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: {
          code: 'MODEL_STAGE_FAILED',
          stage: 'clip',
          secret: 'private-stack',
        },
      }),
    });
  try {
    await expect(
      inspectRecommendation(
        { imageUrl: 'https://example.test/image' },
        'test-stage',
      ),
    ).rejects.toMatchObject({
      response: { code: 'MODEL_STAGE_FAILED', stage: 'clip' },
    });
  } finally {
    global.fetch = original;
  }
});
