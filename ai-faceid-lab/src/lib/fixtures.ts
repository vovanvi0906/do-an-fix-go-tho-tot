import type { Measurement } from './types';

/** Synthetic measurement shaped like the whitelisted research response. No person data. */
export function measurement(change: Partial<Measurement> = {}): Measurement {
  return {
    researchOnly: true, verified: false, enrolled: false, proof: null, sessionId: 's1', purpose: 'DAILY', orderId: null,
    identityDecision: 'MEASURED', identityScore: 0.72, padDecision: 'NOT_EVALUATED', padRealScore: 0.98, padSpoofScore: 0.02,
    referencePadRealScore: 0.97, referencePadSpoofScore: 0.03,
    quality: { decision: 'PASS', faceCount: 1, brightness: 120, sharpness: 150, reasons: [] }, referenceQuality: null,
    detection: { faceCount: 1, imageWidth: 640, imageHeight: 480, score: 0.95, box: [200, 100, 180, 200] }, referenceDetection: null,
    alignment: { method: 'sface_align_crop_5pt', performed: true },
    padPolicy: { decision: 'NOT_EVALUATED', reason: 'PAD_BLOCKED_DATA', evaluated: false, threshold: null, evaluationReference: null },
    identityPolicy: { threshold: 0.6, status: 'PROVISIONAL_UNCALIBRATED', method: 'yunet_sface_cosine' },
    qualityPolicy: { minFacePixels: 80, minBrightness: 40, maxBrightness: 220, minSharpness: 60, minDetectionScore: 0.6 },
    modelVersion: 'yunet-sface:x', padModelVersion: 'experimental:anti-spoof-mn3:y', cropVersion: 'c', preprocessingVersion: 'p', policyVersion: 'research-no-decision-v1',
    errorCode: null, identityErrorCode: null, padErrorCode: null, referenceIdentityErrorCode: null, referencePadErrorCode: null,
    latencyMs: { decodeMs: 2, probeDetectionMs: 10, probeCropResizeMs: .1, probeSfaceMs: 15, probePadMs: 8, identityComparisonMs: .1, totalMs: 40 },
    ...change,
  };
}
