import type { Measurement } from './types';

/**
 * Controlled-trial recorder for PAD/identity evaluation. Rows match the offline
 * aggregator `ai-service/eval/face_metrics.py` field whitelist exactly: scores,
 * outcomes and latency only — never images, embeddings, names or tokens.
 * Kept in memory; exported only when the operator clicks download.
 */
export type PadLabel = 'bona_fide' | 'print' | 'screen' | 'video_replay';
export type IdentityLabel = 'genuine' | 'impostor';
export type TrialTask = 'pad' | 'identity';
export type Outcome = 'SCORED' | 'NO_FACE' | 'MULTIPLE_FACES' | 'QUALITY_REJECTED' | 'INCONCLUSIVE' | 'TECHNICAL_ERROR' | 'TIMEOUT';

export interface TrialRow {
  trial_id: string;
  task: TrialTask;
  label: PadLabel | IdentityLabel;
  outcome: Outcome;
  score: number | null;
  cpu_inference_ms: number | null;
  end_to_end_ms: number | null;
}

/** Operator-entered acquisition conditions; separate file, free of personal data. */
export interface TrialCondition { trial_id: string; device: string; lighting: string; instrument: string; note: string }

export const PAD_LABELS: PadLabel[] = ['bona_fide', 'print', 'screen', 'video_replay'];
export const IDENTITY_LABELS: IdentityLabel[] = ['genuine', 'impostor'];

export function outcomeFor(m: Measurement, task: TrialTask): Outcome {
  if (m.errorCode === 'NO_FACE') return 'NO_FACE';
  if (m.errorCode === 'MULTIPLE_FACES') return 'MULTIPLE_FACES';
  if (m.errorCode === 'PAD_TIMEOUT') return 'TIMEOUT';
  if (m.errorCode === 'RESEARCH_PROCESSING_FAILED' || m.errorCode?.endsWith('TECHNICAL_ERROR')) return 'TECHNICAL_ERROR';
  const score = task === 'pad' ? m.padRealScore : m.identityScore;
  if (score == null) return m.quality.decision === 'FAIL' ? 'QUALITY_REJECTED' : 'INCONCLUSIVE';
  return 'SCORED';
}

export function trialFrom(m: Measurement, task: TrialTask, label: PadLabel | IdentityLabel, endToEndMs: number | null, id: string = crypto.randomUUID()): TrialRow {
  const outcome = outcomeFor(m, task);
  const score = outcome === 'SCORED' ? (task === 'pad' ? m.padRealScore : m.identityScore) : null;
  const cpu = task === 'pad' ? m.latencyMs.probePadMs : (m.latencyMs.probeSfaceMs ?? 0) + (m.latencyMs.identityComparisonMs ?? 0);
  const valid = (task === 'pad' ? PAD_LABELS : IDENTITY_LABELS) as string[];
  if (!valid.includes(label)) throw new Error('INVALID_TRIAL_LABEL');
  return { trial_id: id, task, label, outcome, score: score ?? null,
    cpu_inference_ms: Number.isFinite(cpu) ? cpu : null, end_to_end_ms: endToEndMs != null && Number.isFinite(endToEndMs) ? endToEndMs : null };
}

export function toJsonl(rows: TrialRow[]): string {
  const keys: (keyof TrialRow)[] = ['trial_id', 'task', 'label', 'outcome', 'score', 'cpu_inference_ms', 'end_to_end_ms'];
  return rows.map(r => JSON.stringify(Object.fromEntries(keys.map(k => [k, r[k]])))).join('\n') + (rows.length ? '\n' : '');
}

/** Descriptive per-label summary for the UI. NOT a security metric; see face_metrics.py. */
export function summarize(rows: TrialRow[], task: TrialTask, threshold: number) {
  const labels = task === 'pad' ? PAD_LABELS : IDENTITY_LABELS;
  return labels.map(label => {
    const all = rows.filter(r => r.task === task && r.label === label);
    const scored = all.filter(r => r.outcome === 'SCORED' && r.score != null);
    const accepted = scored.filter(r => (r.score as number) >= threshold).length;
    return { label, trials: all.length, scored: scored.length, accepted, rate: scored.length ? accepted / scored.length : null };
  });
}

export function download(name: string, text: string, type = 'application/x-ndjson') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
