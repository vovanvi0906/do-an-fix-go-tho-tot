import { describe, expect, it } from 'vitest';
import { assessGeometry, pixelQuality, stableProgress } from './faceQuality';
const detection = (overrides = {}) => ({ boundingBox: { originX: 300, originY: 150, width: 350, height: 400 }, keypoints: [{ x: .4, y: .4 }, { x: .6, y: .4 }, { x: .5, y: .5 }], ...overrides });
describe('capture guidance', () => {
  it('requires exactly one sufficiently large complete face', () => {
    expect(assessGeometry([], 1000, 800).ok).toBe(false);
    expect(assessGeometry([detection(), detection()], 1000, 800).ok).toBe(false);
    expect(assessGeometry([detection()], 1000, 800).ok).toBe(true);
    expect(assessGeometry([detection({ boundingBox: { originX: 400, originY: 250, width: 100, height: 100 } })], 1000, 800).ok).toBe(false);
  });
  it('resets stability on bad quality or frame gaps', () => {
    expect(stableProgress(null, { ok: true }, 100, null)).toEqual({ since: 100, progress: 0 });
    expect(stableProgress(100, { ok: true }, 1400, 1320).progress).toBe(1);
    expect(stableProgress(100, { ok: false }, 700, 620).since).toBeNull();
    expect(stableProgress(100, { ok: true }, 1400, 1000).progress).toBe(0);
  });
  it('rejects dark and blurred frames', () => {
    const data = new Uint8ClampedArray(16 * 16 * 4).fill(120);
    const quality = pixelQuality({ data, width: 16, height: 16 });
    expect(quality.brightness).toBeCloseTo(120); expect(quality.sharpness).toBe(0); expect(quality.ok).toBe(false);
    expect(pixelQuality({ data: new Uint8ClampedArray(data.length), width: 16, height: 16 }).message).toContain('sáng');
  });
});
