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
