// Similarity is not a probability or a liveness result.
export function validFaceResult(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r) || typeof r.reason !== 'string') return false;
  if (r.status === 'MATCH' || r.status === 'NON_MATCH') {
    return r.engine === 'model' && r.method === 'sface_cosine' &&
      typeof r.confidence === 'number' && Number.isFinite(r.confidence) &&
      r.confidence >= -1 && r.confidence <= 1 &&
      r.verified === (r.status === 'MATCH') &&
      (r.status === 'MATCH' ? r.confidence >= 0.60 : r.confidence < 0.60);
  }
  return ['INCONCLUSIVE', 'TECHNICAL_ERROR'].includes(r.status) &&
    r.verified === false && r.confidence === null && r.method === 'none' && r.engine === 'unavailable';
}

// Existing timestamps have no purpose, template version or session provenance.
// FACE-CORE-02 must replace this gate with durable, scoped verification proof.
export function hasTrustedFaceProof() { return false; }

// New template contract. A MATCH here is still insufficient to authorize without PAD/proof.
export function validTemplateFaceResult(r, expected) {
  if (!r || typeof r !== 'object' || Array.isArray(r) || !expected ||
      r.workerId !== expected.workerId || r.sessionId !== expected.sessionId ||
      !['MATCH', 'NON_MATCH', 'INCONCLUSIVE', 'TECHNICAL_ERROR'].includes(r.identityDecision) ||
      !['PASS', 'FAIL', 'NOT_EVALUATED', 'INCONCLUSIVE'].includes(r.padDecision) ||
      !['PASS', 'FAIL', 'NOT_EVALUATED'].includes(r.qualityDecision) ||
      typeof r.errorCode !== 'string') return false;
  if (['MATCH', 'NON_MATCH'].includes(r.identityDecision)) {
    return r.modelVersion === expected.modelVersion && r.templateVersion === expected.templateVersion &&
      r.verificationMethod === 'yunet_sface_cosine' && r.qualityDecision === 'PASS' &&
      typeof r.identityScore === 'number' && Number.isFinite(r.identityScore) &&
      r.identityScore >= -1 && r.identityScore <= 1 &&
      (r.identityDecision === 'MATCH' ? r.identityScore >= expected.threshold : r.identityScore < expected.threshold);
  }
  return r.identityScore === null && r.verificationMethod === 'none';
}
