export type Purpose = 'ENROLLMENT' | 'DAILY' | 'ORDER';
export type Backend = 'research' | 'core';

export interface Quality {
  decision: 'PASS' | 'FAIL' | 'NOT_EVALUATED';
  faceCount: number | null;
  brightness: number | null;
  sharpness: number | null;
  reasons: string[];
}

export interface Detection {
  faceCount: number;
  imageWidth: number;
  imageHeight: number;
  score: number | null;
  box: [number, number, number, number] | null;
}

export interface PadPolicy {
  decision: 'NOT_EVALUATED' | 'INCONCLUSIVE' | 'PASS' | 'FAIL';
  reason: string;
  evaluated: boolean;
  threshold: number | null;
  evaluationReference: string | null;
}

export interface IdentityPolicy { threshold: number; status: string; method: string }
export interface QualityPolicy { minFacePixels: number; minBrightness: number; maxBrightness: number; minSharpness: number; minDetectionScore: number }

/** Research measurement (validated + whitelisted by the research Nest service). */
export interface Measurement {
  researchOnly: true;
  verified: false;
  enrolled: false;
  proof: null;
  sessionId: string;
  purpose: Purpose;
  orderId: string | null;
  identityDecision: 'MEASURED' | 'INCONCLUSIVE' | 'REFERENCE_NOT_PROVIDED';
  identityScore: number | null;
  padDecision: 'NOT_EVALUATED';
  padRealScore: number | null;
  padSpoofScore: number | null;
  referencePadRealScore: number | null;
  referencePadSpoofScore: number | null;
  quality: Quality;
  referenceQuality: Quality | null;
  detection: Detection | null;
  referenceDetection: Detection | null;
  alignment: { method: string; performed: boolean } | null;
  padPolicy: PadPolicy | null;
  identityPolicy: IdentityPolicy | null;
  qualityPolicy: QualityPolicy | null;
  modelVersion: string;
  padModelVersion: string;
  cropVersion: string;
  preprocessingVersion: string;
  policyVersion: string;
  errorCode: string | null;
  identityErrorCode: string | null;
  padErrorCode: string | null;
  referenceIdentityErrorCode: string | null;
  referencePadErrorCode: string | null;
  latencyMs: Record<string, number>;
}

export interface ResearchCapabilities {
  researchOnly: true;
  cameraAllowed: boolean;
  captureApprovedByService?: boolean;
  participantConsentReady?: boolean;
  protocolReference: string | null;
  proofAllowed: false;
  padEvaluated: false;
  syntheticAvailable: boolean;
  modelVersion: string | null;
  padReady: boolean;
  padModelVersion?: string | null;
  padErrorCode?: string | null;
  padEvaluationStatus?: string | null;
  identityPolicy?: IdentityPolicy | null;
  qualityPolicy?: QualityPolicy | null;
  sessionTtlMs?: number;
  maxAttemptsPerSession?: number;
}

export interface SessionMeta {
  id: string;
  purpose: Purpose;
  orderId: string | null;
  nonce: string;
  expiresAt: string;
  state: string;
  templateVersion?: number;
  researchOnly?: boolean;
}

export interface ProofMeta {
  id: string; purpose: Purpose; orderId: string | null; templateVersion: number;
  issuedAt: string; expiresAt: string; consumedAt: string | null;
}

export interface TemplateMeta { id: string; version: number; modelVersion: string; revokedAt: string | null; deletedAt: string | null }

export interface CoreStatus {
  enrollmentStatus: string;
  template: TemplateMeta | null;
  templateVersion: number | null;
  requiredConsentVersion: string;
  consentVersion: string | null;
  consentRequired: boolean;
  identityReviewApproved: boolean;
  blockers: string[];
  canEnroll: boolean;
  canVerifyDaily: boolean;
  canVerifyOrder: boolean;
  padDecision: string;
  dailyProof: ProofMeta | null;
  orderProof: ProofMeta | null;
}

export interface CoreSubmitResult { verified: boolean; enrolled?: boolean; proof?: ProofMeta; template?: TemplateMeta }

export interface LabInspect {
  labOnly: true;
  serverTime: string;
  worker: { approvalStatus: string };
  consent: { valid: boolean; requiredVersion: string; version: string | null; consentedAt: string | null; withdrawnAt: string | null };
  biometricState: { epoch: number; lastVersion: number } | null;
  templates: Array<{ id: string; version: number; epoch: number; modelVersion: string; createdAt: string; revokedAt: string | null; deletedAt: string | null; status: string }>;
  sessions: Array<{ id: string; purpose: Purpose; orderId: string | null; state: string; attempts: number; epoch: number; templateVersion: number; errorCode: string | null; createdAt: string; expiresAt: string; consumedAt: string | null; lifecycle: string; stale: boolean }>;
  proofs: Array<{ id: string; sessionId: string; purpose: Purpose; orderId: string | null; templateVersion: number; epoch: number; policyVersion: string; identityScore: number; issuedAt: string; expiresAt: string; consumedAt: string | null; revokedAt: string | null; lifecycle: string }>;
  audit: Array<{ action: string; reason: string; createdAt: string }>;
  order: { id: string; status: string; faceStageAllowed: boolean } | null;
  policy: Record<string, string | number | boolean | null>;
}
