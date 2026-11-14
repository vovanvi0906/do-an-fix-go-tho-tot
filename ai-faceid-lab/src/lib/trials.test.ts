import { outcomeFor, summarize, toJsonl, trialFrom } from './trials';
import { measurement } from './fixtures';

const FIELDS = ['trial_id', 'task', 'label', 'outcome', 'score', 'cpu_inference_ms', 'end_to_end_ms'];

test('rows contain exactly the face_metrics.py whitelist', () => {
  const row = trialFrom(measurement(), 'pad', 'print', 123, 't1');
  expect(Object.keys(row).sort()).toEqual([...FIELDS].sort());
  const line = JSON.parse(toJsonl([row]).trim());
  expect(Object.keys(line)).toEqual(FIELDS);
  expect(line).toMatchObject({ task: 'pad', label: 'print', outcome: 'SCORED', score: 0.98, cpu_inference_ms: 8, end_to_end_ms: 123 });
});
test('identity trial uses cosine and SFace timing', () => {
  const row = trialFrom(measurement(), 'identity', 'impostor', null, 't2');
  expect(row).toMatchObject({ score: 0.72, cpu_inference_ms: 15.1, end_to_end_ms: null });
});
test('non-scored outcomes never invent a score', () => {
  const m = measurement({ errorCode: 'NO_FACE', padRealScore: null, identityScore: null });
  expect(trialFrom(m, 'pad', 'screen', 1, 'x')).toMatchObject({ outcome: 'NO_FACE', score: null });
  expect(outcomeFor(measurement({ errorCode: 'MULTIPLE_FACES' }), 'pad')).toBe('MULTIPLE_FACES');
  expect(outcomeFor(measurement({ padRealScore: null, quality: { decision: 'FAIL', faceCount: 1, brightness: 1, sharpness: 1, reasons: ['TOO_DARK'] } }), 'pad')).toBe('QUALITY_REJECTED');
  expect(outcomeFor(measurement({ errorCode: 'PAD_TIMEOUT', padRealScore: null }), 'pad')).toBe('TIMEOUT');
});
test('label must match task', () => {
  expect(() => trialFrom(measurement(), 'pad', 'genuine', 1)).toThrow('INVALID_TRIAL_LABEL');
});
test('summary is descriptive per label', () => {
  const rows = [trialFrom(measurement({ padRealScore: .9, padSpoofScore: .1 }), 'pad', 'print', 1, 'a'), trialFrom(measurement({ padRealScore: .2, padSpoofScore: .8 }), 'pad', 'print', 1, 'b')];
  const s = summarize(rows, 'pad', .5).find(x => x.label === 'print')!;
  expect(s).toEqual({ label: 'print', trials: 2, scored: 2, accepted: 1, rate: .5 });
  expect(summarize(rows, 'pad', .5).find(x => x.label === 'video_replay')!.rate).toBeNull();
});
