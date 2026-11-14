// Display gating only; backend always rechecks/consumes durable proof in its transaction.
export function isCurrentFaceProof(proof, purpose, orderId = null, now = Date.now()) {
  const issued = Date.parse(proof?.issuedAt), expiry = Date.parse(proof?.expiresAt);
  return typeof proof?.id === 'string' && proof.id.length > 0 && proof.purpose === purpose &&
    proof.orderId === orderId && Number.isSafeInteger(proof.templateVersion) && proof.templateVersion > 0 &&
    proof.consumedAt === null && Number.isFinite(issued) && Number.isFinite(expiry) &&
    issued <= now && expiry > now && expiry > issued;
}
