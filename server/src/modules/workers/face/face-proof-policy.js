import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Pure policy building blocks. Not an issuer/store; runtime gates stay disabled until
// durable schema + transaction integration and PAD/enrollment policy are approved.
export const PROPOSED_SESSION_TTL_MS = 120000;
export const PROPOSED_DAILY_TTL_MS = 8 * 60 * 60 * 1000;
export const PROPOSED_ORDER_TTL_MS = 5 * 60 * 1000;
export const hashNonce = nonce => createHash('sha256').update(nonce).digest('hex');
export function createFaceChallenge() {
  const nonce = randomBytes(32).toString('base64url');
  return { nonce, nonceHash: hashNonce(nonce) };
}
const finiteDate = value => value instanceof Date && Number.isFinite(value.getTime());
const boundString = value => typeof value === 'string' && value.length > 0;

export function assessFaceSession({ session, actor, nonce, template, evidence, now = new Date(), threshold = .60 }) {
  if (!finiteDate(now) || !session || !actor || !template || !evidence ||
      !Number.isFinite(threshold) || threshold < -1 || threshold > 1) return 'INVALID_CONTEXT';
  if (actor.role !== 'WORKER' || actor.status !== 'ACTIVE') return 'ACTIVE_WORKER_REQUIRED';
  if (!boundString(session.id) || !boundString(session.workerId) || !boundString(session.userId) ||
      session.workerId !== actor.workerId || session.userId !== actor.userId) return 'WRONG_WORKER';
  if (!['DAILY', 'ORDER'].includes(session.purpose) || session.purpose !== actor.purpose ||
      (session.purpose === 'ORDER' ? !boundString(session.orderId) || session.orderId !== actor.orderId : session.orderId !== null || actor.orderId != null)) return 'WRONG_PURPOSE_OR_ORDER';
  if (!finiteDate(session.createdAt) || !finiteDate(session.expiresAt) || session.createdAt > now ||
      session.expiresAt <= now || session.expiresAt - session.createdAt > PROPOSED_SESSION_TTL_MS ||
      session.expiresAt <= session.createdAt) return 'SESSION_EXPIRED';
  if (session.consumedAt !== null) return 'SESSION_CONSUMED';
  if (typeof nonce !== 'string' || nonce.length > 128 || !/^[a-f0-9]{64}$/.test(session.nonceHash || '') ||
      !timingSafeEqual(Buffer.from(hashNonce(nonce), 'hex'), Buffer.from(session.nonceHash, 'hex'))) return 'INVALID_NONCE';
  if (template.status !== 'ACTIVE' || template.workerId !== session.workerId ||
      !Number.isSafeInteger(template.version) || template.version < 1 ||
      !boundString(template.modelVersion) || template.version !== session.templateVersion || template.modelVersion !== session.modelVersion) return 'TEMPLATE_REVOKED_OR_CHANGED';
  if (evidence.workerId !== session.workerId || evidence.sessionId !== session.id ||
      evidence.templateVersion !== template.version || evidence.modelVersion !== template.modelVersion) return 'EVIDENCE_BINDING_MISMATCH';
  if (evidence.identityDecision !== 'MATCH' || evidence.verificationMethod !== 'yunet_sface_cosine' ||
      typeof evidence.identityScore !== 'number' || !Number.isFinite(evidence.identityScore) ||
      evidence.identityScore < threshold || evidence.identityScore > 1 || evidence.qualityDecision !== 'PASS') return 'IDENTITY_NOT_VERIFIED';
  if (evidence.padDecision !== 'PASS') return 'PAD_NOT_PASSED';
  return 'ELIGIBLE_FOR_ATOMIC_CONSUMPTION';
}

// Predicate for the proposed FaceProof table. Must execute updateMany plus order
// transition in ONE serializable DB transaction, require count===1, rollback on failure.
// A prior findUnique + later unconditional update is never sufficient.
export function orderProofConsumptionWhere({ proofId, workerId, orderId, templateVersion, now = new Date() }) {
  if (![proofId, workerId, orderId].every(boundString) || !Number.isSafeInteger(templateVersion) || templateVersion < 1 || !finiteDate(now)) throw new Error('INVALID_PROOF_CONTEXT');
  return { id: proofId, workerId, orderId, templateVersion, purpose: 'ORDER',
    consumedAt: null, revokedAt: null, issuedAt: { lte: now }, expiresAt: { gt: now } };
}
