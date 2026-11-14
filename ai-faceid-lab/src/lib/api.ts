import { codeOf } from './codes';
import type { CoreStatus, CoreSubmitResult, LabInspect, Measurement, Purpose, ResearchCapabilities, SessionMeta } from './types';

/** Error carrying the backend machine code. Never includes request bodies or tokens. */
export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); this.name = 'ApiError'; }
}

type FetchLike = typeof fetch;

/** Extract a machine code from either Nest default or FixGo filter error shapes. */
export function errorCodeFrom(status: number, body: unknown): string {
  const b = body as { message?: unknown; error?: { message?: unknown } | string } | null;
  const candidates = [b?.message, typeof b?.error === 'object' ? b?.error?.message : b?.error];
  for (const c of candidates) {
    const list = Array.isArray(c) ? c : [c];
    for (const item of list) { const code = codeOf(item); if (code) return code; }
  }
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 504) return 'RESEARCH_AI_TIMEOUT';
  return `HTTP_${status}`;
}

export interface RequestTrace { method: string; path: string; status: number; ms: number; code: string | null; at: string }

/**
 * Minimal client. Token lives only in memory (passed per instance) and is never logged,
 * persisted or echoed in traces. Traces record method/path/status/timing only.
 */
export class LabClient {
  constructor(private readonly base: string, private readonly token: string, private readonly onTrace?: (t: RequestTrace) => void, private readonly fetchImpl: FetchLike = (...a) => fetch(...a)) {}

  private async request<T>(method: string, path: string, init: { json?: unknown; form?: FormData; headers?: Record<string, string> } = {}): Promise<T> {
    const headers: Record<string, string> = { ...(init.headers || {}) };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    let body: BodyInit | undefined;
    if (init.json !== undefined) { headers['content-type'] = 'application/json'; body = JSON.stringify(init.json); }
    if (init.form) body = init.form;
    const started = performance.now();
    let res: Response;
    try {
      res = await this.fetchImpl(this.base + path, { method, headers, body, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    } catch {
      this.onTrace?.({ method, path: redact(path), status: 0, ms: performance.now() - started, code: 'NETWORK_UNAVAILABLE', at: new Date().toISOString() });
      throw new ApiError('NETWORK_UNAVAILABLE', 0);
    }
    let parsed: unknown = null;
    try { parsed = await res.json(); } catch { parsed = null; }
    const code = res.ok ? null : errorCodeFrom(res.status, parsed);
    this.onTrace?.({ method, path: redact(path), status: res.status, ms: performance.now() - started, code, at: new Date().toISOString() });
    if (!res.ok) throw new ApiError(code!, res.status);
    const env = parsed as { success?: boolean; data?: T };
    return (env && 'data' in env ? env.data : parsed) as T;
  }

  // ---- Isolated research lab (standalone Nest :3107) ----
  researchCapabilities() { return this.request<ResearchCapabilities>('GET', '/face-research/capabilities'); }
  researchSession(purpose: Purpose, requestKey: string, orderId?: string) {
    return this.request<SessionMeta>('POST', '/face-research/sessions', { json: { purpose, requestKey, ...(orderId ? { orderId } : {}) } });
  }
  researchSynthetic(sessionId: string, nonce: string) {
    return this.request<Measurement>('POST', `/face-research/sessions/${encodeURIComponent(sessionId)}/synthetic`, { json: { nonce } });
  }
  researchCapture(sessionId: string, nonce: string, image: Blob, reference?: Blob) {
    const form = new FormData();
    form.append('image', image, 'probe.jpg');
    if (reference) form.append('reference', reference, 'reference.jpg');
    return this.request<Measurement>('POST', `/face-research/sessions/${encodeURIComponent(sessionId)}/capture`, { form, headers: { 'x-research-nonce': nonce } });
  }
  researchErase() { return this.request<{ sessionsDeleted: number }>('DELETE', '/face-research/sessions'); }

  // ---- Face Core (main backend /api, worker JWT; unchanged permissions) ----
  coreStatus(orderId?: string) { return this.request<CoreStatus>('GET', `/api/workers/me/face/capabilities${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`); }
  coreConsent(version: string) { return this.request<{ consentVersion: string; consentedAt: string }>('POST', '/api/workers/me/face/consent', { json: { consent: true, version } }); }
  coreSession(purpose: Purpose, requestKey: string, orderId?: string) {
    return this.request<SessionMeta>('POST', '/api/workers/me/face/sessions', { json: { purpose, requestKey, ...(orderId ? { orderId } : {}) } });
  }
  coreCapture(sessionId: string, nonce: string, image: Blob) {
    const form = new FormData();
    form.append('nonce', nonce);
    form.append('image', image, 'capture.jpg');
    return this.request<CoreSubmitResult>('POST', `/api/workers/me/face/sessions/${encodeURIComponent(sessionId)}/capture`, { form });
  }
  coreWithdraw() { return this.request<{ withdrawnAt: string }>('DELETE', '/api/workers/me/face/template'); }
  coreInspect(orderId?: string) { return this.request<LabInspect>('GET', `/api/workers/me/face/lab/inspect${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`); }
}

/** Keep IDs out of the visible trace (they are already in the panels). */
function redact(path: string) {
  return path.replace(/\/sessions\/[^/?]+/, '/sessions/:id').replace(/orderId=[^&]+/, 'orderId=:order');
}

export function newRequestKey(): string {
  return crypto.randomUUID();
}
