import { ApiError, LabClient, errorCodeFrom, type RequestTrace } from './api';

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }); }) as unknown as typeof fetch;
  return { fn, calls };
}

describe('errorCodeFrom', () => {
  test.each([
    [400, { statusCode: 400, message: 'PAD_NOT_EVALUATED', error: 'Bad Request' }, 'PAD_NOT_EVALUATED'],
    [400, { success: false, statusCode: 400, error: { message: 'CONSENT_REQUIRED' } }, 'CONSENT_REQUIRED'],
    [403, { message: 'RESEARCH_CAPTURE_NOT_APPROVED' }, 'RESEARCH_CAPTURE_NOT_APPROVED'],
    [400, { message: ['FACE_INPUT_INVALID: x'] }, 'FACE_INPUT_INVALID'],
    [401, { message: 'Unauthorized' }, 'UNAUTHORIZED'],
    [504, null, 'RESEARCH_AI_TIMEOUT'],
    [500, null, 'HTTP_500'],
  ])('%s %j -> %s', (status, body, code) => expect(errorCodeFrom(status, body)).toBe(code));
});

describe('LabClient', () => {
  test('bearer header, no cookies, unwrap data, trace has no token/body', async () => {
    const { fn, calls } = fakeFetch(201, { success: true, data: { id: 's', nonce: 'n' } });
    const traces: RequestTrace[] = [];
    const c = new LabClient('', 'secret-token-value', t => traces.push(t), fn);
    const s = await c.researchSession('DAILY', 'k');
    expect(s).toEqual({ id: 's', nonce: 'n' });
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe('Bearer secret-token-value');
    expect(calls[0].init.credentials).toBe('omit');
    expect(JSON.stringify(traces)).not.toContain('secret-token-value');
    expect(JSON.stringify(traces)).not.toContain('"k"');
  });
  test('rejection becomes ApiError with code and status', async () => {
    const { fn } = fakeFetch(400, { statusCode: 400, message: 'INVALID_NONCE' });
    await expect(new LabClient('', 't', undefined, fn).researchSynthetic('s', 'bad')).rejects.toEqual(new ApiError('INVALID_NONCE', 400));
  });
  test('network failure is NETWORK_UNAVAILABLE', async () => {
    const fn = (async () => { throw new TypeError('fail'); }) as unknown as typeof fetch;
    await expect(new LabClient('', 't', undefined, fn).researchCapabilities()).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' });
  });
  test('research capture: multipart image+reference, nonce in header (not body)', async () => {
    const { fn, calls } = fakeFetch(201, { success: true, data: {} });
    await new LabClient('', 't', undefined, fn).researchCapture('s/1', 'nonce-1', new Blob(['a'], { type: 'image/jpeg' }), new Blob(['b'], { type: 'image/jpeg' }));
    expect(calls[0].url).toBe('/face-research/sessions/s%2F1/capture');
    expect((calls[0].init.headers as Record<string, string>)['x-research-nonce']).toBe('nonce-1');
    const form = calls[0].init.body as FormData;
    expect(form.get('image')).toBeInstanceOf(Blob);
    expect(form.get('reference')).toBeInstanceOf(Blob);
    expect(form.get('nonce')).toBeNull();
  });
  test('Face Core never sends a client workerId', async () => {
    const { fn, calls } = fakeFetch(201, { success: true, data: {} });
    const c = new LabClient('', 't', undefined, fn);
    await c.coreSession('ORDER', 'k', 'o1');
    await c.coreConsent('v1');
    for (const call of calls) expect(String(call.init.body)).not.toMatch(/workerId/);
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ consent: true, version: 'v1' });
    expect(calls[0].url).toBe('/api/workers/me/face/sessions');
  });
});
