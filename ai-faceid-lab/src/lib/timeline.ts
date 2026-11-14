import { STAGES, describe, type Stage } from './codes';
import type { Measurement, CoreSubmitResult } from './types';

export type StageStatus = 'PENDING' | 'PASS' | 'FAIL' | 'BLOCKED' | 'ERROR' | 'NOT_EVALUATED' | 'MEASURED' | 'SKIPPED';
/** One debug stage. `ref` = publishable correlation (session id prefix / HTTP status); `version` = model/config. */
export interface StageState { stage: Stage; status: StageStatus; code: string | null; detail: string; ms?: number; ref?: string; version?: string; policy?: string }
export type Timeline = StageState[];

export function emptyTimeline(): Timeline {
  return STAGES.map(stage => ({ stage, status: 'PENDING', code: null, detail: 'Chưa chạy.' }));
}

export function setStage(t: Timeline, stage: Stage, patch: Partial<StageState>): Timeline {
  return t.map(s => (s.stage === stage ? { ...s, ...patch } : s));
}

/** Any stage still PENDING after the flow stopped is marked SKIPPED, with the reason. */
export function closeTimeline(t: Timeline, why: string): Timeline {
  return t.map(s => (s.status === 'PENDING' ? { ...s, status: 'SKIPPED', detail: why } : s));
}

const sum = (l: Record<string, number> | undefined, keys: string[]) => {
  const values = keys.map(k => l?.[k]).filter((v): v is number => typeof v === 'number');
  return values.length ? values.reduce((a, b) => a + b, 0) : undefined;
};
const short = (v: string | undefined | null) => (v ? v.slice(0, 8) : undefined);
/** Model versions embed full SHA-256 pins; show a stable short form. */
export const shortVersion = (v: string | null | undefined) =>
  v ? v.replace(/([a-f0-9]{12})[a-f0-9]{52}/g, '$1…') : undefined;

/**
 * Apply a backend rejection that happened while executing `phase`.
 * The phase stage is marked BLOCKED/FAIL/ERROR; the stage owning the code (if different)
 * also records the cause (e.g. PAD_NOT_EVALUATED raised while creating a session).
 * `blockers` (Face Core status) lets the timeline show every gate that would still refuse,
 * not only the first one the backend happened to check.
 */
export function applyError(t: Timeline, phase: Stage, code: string | null, httpStatus?: number, blockers: string[] = [], ref?: string): Timeline {
  const info = describe(code);
  const phaseStatus: StageStatus = info.kind === 'ERROR' ? 'ERROR' : info.stage === phase && info.kind === 'FAIL' ? 'FAIL' : 'BLOCKED';
  const statusText = httpStatus ? ` (HTTP ${httpStatus})` : '';
  const correlation = [ref, httpStatus ? `HTTP ${httpStatus}` : undefined].filter(Boolean).join(' · ') || undefined;
  let next = t;
  // A business rejection with an HTTP status means the server already accepted JWT + role.
  if (httpStatus && httpStatus > 0 && info.stage !== 'AUTH' && phase !== 'AUTH' && next.find(s => s.stage === 'AUTH')?.status === 'PENDING') {
    next = setStage(next, 'AUTH', { status: 'PASS', code: 'AUTHENTICATED', detail: 'Server chấp nhận token/role; lỗi xảy ra ở bước nghiệp vụ sau đó.', ref: correlation });
  }
  next = setStage(next, phase, { status: phaseStatus, code: info.code, detail: info.text + statusText, ref: correlation });
  if (info.stage !== phase) {
    const ownStatus: StageStatus = info.kind === 'NOT_EVALUATED' ? 'NOT_EVALUATED' : info.kind === 'ERROR' ? 'ERROR' : info.kind === 'FAIL' ? 'FAIL' : 'BLOCKED';
    next = setStage(next, info.stage, { status: ownStatus, code: info.code, detail: info.text, ref: correlation });
  }
  for (const b of blockers) {
    if (b === info.code) continue;
    const bi = describe(b);
    const cur = next.find(s => s.stage === bi.stage);
    if (cur && cur.status === 'PENDING') {
      next = setStage(next, bi.stage, { status: bi.kind === 'NOT_EVALUATED' ? 'NOT_EVALUATED' : 'BLOCKED', code: b, detail: `${bi.text} (blocker hiện hành từ Face Core status)` });
    }
  }
  if (info.stage !== 'PROOF' && phase !== 'PROOF') {
    next = setStage(next, 'PROOF', { status: 'BLOCKED', code: 'PROOF_NOT_ISSUED', detail: `Không cấp proof vì ${info.code}.` });
  }
  return closeTimeline(next, `Không chạy: luồng dừng tại ${info.code}.`);
}

/** Map a whitelisted research measurement onto IMAGE…PROOF stages. */
export function applyMeasurement(t: Timeline, m: Measurement): Timeline {
  const l = m.latencyMs;
  const q = m.quality;
  const ref = `session ${short(m.sessionId)}`;
  const identityVersion = shortVersion(m.modelVersion);
  let next = t;
  if (m.errorCode === 'RESEARCH_PROCESSING_FAILED') {
    next = setStage(next, 'IMAGE', { status: 'ERROR', code: m.errorCode, detail: describe(m.errorCode).text, ms: l.totalMs, ref });
    next = setStage(next, 'POLICY', { status: 'BLOCKED', code: 'RESEARCH_NO_AUTHORITY', detail: describe('RESEARCH_NO_AUTHORITY').text, ref, policy: m.policyVersion });
    next = setStage(next, 'PROOF', { status: 'BLOCKED', code: 'PROOF_NOT_ISSUED_RESEARCH_ONLY', detail: describe('PROOF_NOT_ISSUED_RESEARCH_ONLY').text, ref });
    return closeTimeline(next, 'Không chạy: pipeline lỗi kỹ thuật trước bước này.');
  }
  const d = m.detection;
  next = setStage(next, 'IMAGE', { status: 'PASS', code: 'IMAGE_DECODED', ms: l.decodeMs, ref,
    detail: d ? `JPEG/PNG hợp lệ, ${d.imageWidth}×${d.imageHeight}px, ≤ 5 MB, ≤ 12 MP.` : 'Ảnh giải mã thành công.' });
  const detCodes = q.reasons.filter(r => describe(r).stage === 'DETECTION');
  const detCode = detCodes[0] ?? (m.errorCode && describe(m.errorCode).stage === 'DETECTION' ? m.errorCode : null);
  const detParts = [`faces=${d?.faceCount ?? q.faceCount ?? '?'}`];
  if (d?.score != null) detParts.push(`score=${d.score.toFixed(3)}`);
  if (d?.box) detParts.push(`box=${d.box.map(v => v.toFixed(0)).join(',')}`);
  next = setStage(next, 'DETECTION', { status: detCode ? 'FAIL' : 'PASS', code: detCode ?? 'ONE_FACE', ms: l.probeDetectionMs, ref, version: identityVersion,
    detail: `${detParts.join(', ')}${detCode ? ' — ' + describe(detCode).text : m.alignment?.performed ? ' — alignment 5 điểm OK.' : ''}` });
  const qualityCodes = q.reasons.filter(r => describe(r).stage === 'QUALITY');
  if (detCode) {
    next = setStage(next, 'QUALITY', { status: 'SKIPPED', code: null, detail: 'Không đánh giá quality vì không có đúng một khuôn mặt hợp lệ.' });
  } else {
    const parts: string[] = [];
    if (q.brightness != null) parts.push(`brightness=${q.brightness.toFixed(1)}`);
    if (q.sharpness != null) parts.push(`sharpness=${q.sharpness.toFixed(1)}`);
    const reasons = qualityCodes.map(c => `${c}: ${describe(c).text}`).join(' ');
    const qp = m.qualityPolicy;
    next = setStage(next, 'QUALITY', { status: q.decision === 'PASS' ? 'PASS' : 'FAIL', code: qualityCodes[0] ?? (q.decision === 'PASS' ? 'QUALITY_PASS' : 'QUALITY_FAIL'),
      detail: `${parts.join(', ')}${reasons ? ' — ' + reasons : ''}`, ms: l.probeCropResizeMs, ref,
      policy: qp ? `brightness ${qp.minBrightness}–${qp.maxBrightness}, sharpness ≥ ${qp.minSharpness}, face ≥ ${qp.minFacePixels}px (PROVISIONAL)` : undefined });
  }
  const pad = m.padPolicy;
  const padMs = sum(l, ['probePadMs']);
  const padVersion = shortVersion(m.padModelVersion);
  if (!pad) {
    next = setStage(next, 'PAD', { status: 'NOT_EVALUATED', code: 'PAD_NOT_EVALUATED', detail: describe('PAD_NOT_EVALUATED').text, ms: padMs, ref, version: padVersion });
  } else {
    const scores = m.padRealScore != null ? ` real=${m.padRealScore.toFixed(4)} spoof=${m.padSpoofScore?.toFixed(4)} (số đo, không phải quyết định).` : '';
    const status: StageStatus = pad.decision === 'INCONCLUSIVE' ? 'ERROR' : pad.decision === 'PASS' ? 'PASS' : pad.decision === 'FAIL' ? 'FAIL' : 'NOT_EVALUATED';
    next = setStage(next, 'PAD', { status, code: pad.reason, detail: describe(pad.reason).text + scores, ms: padMs, ref, version: padVersion,
      policy: `evaluated=${pad.evaluated} · ${m.preprocessingVersion}` });
  }
  const sfaceMs = sum(l, ['probeSfaceMs', 'referenceSfaceMs', 'identityComparisonMs']);
  const th = m.identityPolicy?.threshold;
  const idPolicy = m.identityPolicy ? `cosine ≥ ${th} (${m.identityPolicy.status})` : undefined;
  if (m.identityDecision === 'MEASURED' && m.identityScore != null) {
    const cmp = th == null ? '' : m.identityScore >= th ? ` ≥ ngưỡng tham chiếu ${th}` : ` < ngưỡng tham chiếu ${th}`;
    next = setStage(next, 'MATCH', { status: 'MEASURED', code: 'COSINE_MEASURED', detail: `cosine=${m.identityScore.toFixed(4)}${cmp} (ngưỡng PROVISIONAL, chưa hiệu chỉnh; research không kết luận MATCH).`, ms: sfaceMs, ref, version: identityVersion, policy: idPolicy });
  } else if (m.identityDecision === 'REFERENCE_NOT_PROVIDED') {
    next = setStage(next, 'MATCH', { status: 'SKIPPED', code: 'REFERENCE_NOT_PROVIDED', detail: 'Enrollment: chỉ trích xuất tạm thời, không so khớp; embedding bị hủy.', ms: sfaceMs, ref, version: identityVersion });
  } else {
    const code = m.identityErrorCode || m.referenceIdentityErrorCode || m.errorCode || 'INCONCLUSIVE';
    next = setStage(next, 'MATCH', { status: describe(code).kind === 'ERROR' ? 'ERROR' : 'SKIPPED', code, detail: `Không có điểm so khớp: ${describe(code).text}`, ms: sfaceMs, ref, version: identityVersion, policy: idPolicy });
  }
  next = setStage(next, 'POLICY', { status: 'BLOCKED', code: 'RESEARCH_NO_AUTHORITY', ref, policy: m.policyVersion,
    detail: 'Research lab chỉ đo. Production yêu cầu: data policy + consent + identity review + PAD PASS đã đánh giá + quality PASS + cosine ≥ ngưỡng.' });
  return setStage(next, 'PROOF', { status: 'BLOCKED', code: 'PROOF_NOT_ISSUED_RESEARCH_ONLY', detail: describe('PROOF_NOT_ISSUED_RESEARCH_ONLY').text, ref });
}

/** Face Core success (only reachable once an evaluated PAD provider exists). */
export function applyCoreResult(t: Timeline, r: CoreSubmitResult, ref?: string): Timeline {
  let next = t;
  for (const stage of ['IMAGE', 'DETECTION', 'QUALITY', 'PAD', 'MATCH', 'POLICY'] as Stage[]) next = setStage(next, stage, { status: 'PASS', code: 'BACKEND_ACCEPTED', detail: 'Backend chấp nhận evidence (response không chứa chi tiết điểm).', ref });
  if (r.enrolled) return setStage(next, 'PROOF', { status: 'SKIPPED', code: 'TEMPLATE_ENROLLED', detail: `Enrollment tạo template v${r.template?.version}. Enrollment không cấp proof.`, ref });
  if (r.verified && r.proof) return setStage(next, 'PROOF', { status: 'PASS', code: 'PROOF_ISSUED', detail: `Proof ${r.proof.purpose} ${r.proof.id} hết hạn ${r.proof.expiresAt}.`, ref: `proof ${short(r.proof.id)}` });
  return setStage(next, 'PROOF', { status: 'BLOCKED', code: 'PROOF_NOT_ISSUED', detail: 'Backend không cấp proof.', ref });
}
