# Face Core v2 API contracts

Nest prefix /api. Responses {success:true,data:...}; success means request handled,
not identity verified. JWT/ACTIVE account and role checked; services recheck worker/
Admin authority. Default FACE_CORE_ENABLED=false preserves the old fail-closed release.

| Method/path | Body / result |
|---|---|
| GET /workers/me/face/status?orderId=UUID | Metadata only. Legacy status when disabled, durable status when enabled. Order query checks assigned-worker ownership. |
| GET /workers/me/face/capabilities?orderId=UUID | Durable status (requires enabled feature/schema); requiredConsentVersion, templateVersion, review eligibility, blockers, dailyProof and orderProof. |
| POST /workers/me/face/consent | {consent:true,version}; durable consent/audit; does not enroll. |
| POST /admin/workers/:workerId/face/identity-reviews | ADMIN only: {reviewedIdentity:true,kind:ENROLLMENT/REENROLLMENT,evidenceReference,evidenceDigest,reason,expiresAt}. Reference is opaque record ID, not avatar/photo URL. |
| POST /workers/me/face/sessions | {purpose:ENROLLMENT/DAILY/ORDER,requestKey:UUID,orderId?:UUID}; returns {id,nonce,purpose,orderId,templateVersion,expiresAt,state}. Same key returns same unexpired session/nonce; cross-scope reuse rejects. |
| POST /workers/me/face/sessions/:id/capture | Multipart image + nonce. JPEG/PNG <=5MiB in memory; auth/ownership/session/readiness guard before multer. No Cloudinary storage. |
| POST /workers/me/face/sessions/:id/submit | JSON {nonce,photo:dataURI}; small test/integration captures <=90,000 characters, within existing global JSON parser limit. No global Customer parser change. |
| DELETE /workers/me/face/template | Withdrawal transaction: clear consent, erase managed ciphertext, revoke reviews/sessions/proofs, turn worker offline, metadata audit. |
| POST /workers/me/face/enrollment/preflight, /reset/preflight | Legacy compatibility; never claims a queued review or enrollment success. Admin review API supplies actual authority. |

Old /workers/verify-face-daily and /orders/:id/face-verify[-upload] remain blocked.
New session/capture endpoints replace these intakes. No client workerId, reference,
embedding, padDecision, score or verified flag accepted. Runtime DTO validation is
explicit because JS @Bind metadata alone cannot guarantee ValidationPipe enforcement.

Enrollment result: {enrolled:true,verified:false,template:{id,version,modelVersion,...}}.
Enrollment is distinct from a daily/order verification. Verification result:
{verified:true,proof:{id,purpose,orderId,templateVersion,issuedAt,expiresAt,consumedAt}}.
No nonce/hash, capture digest, ciphertext, embedding or review evidence is in status.
Worker UI refetches status and requires the same persisted proof/template version;
upload response alone is insufficient. Start-work never accepts a UI success flag.

Readiness failures: FACE_CORE_DISABLED / BIOMETRIC_DATA_POLICY_NOT_APPROVED /
FACE_KEYS_NOT_CONFIGURED / PAD_NOT_EVALUATED. Scope/nonce/stage/expiry conflicts reject;
FACE_RATE_LIMITED rejects attempts/session quota. Inference/network/score/quality/PAD
failure returns FACE_EVIDENCE_REJECTED, does not issue proof, records a safe error code
and retry count. Requests cannot use old faceVerifiedAt as evidence. No auto-KYC grant.

## AI boundary

Existing internal POST /ai/face-verify: x-face-service-token, JSON inline photo,
backend-selected decrypted templateEmbedding, workerId/sessionId and exact model/
template version. Raw cosine is NOT probability. AI remains YuNet → alignment → SFace
with quality gates; PAD always NOT_EVALUATED. FaceEvidenceGateway.capabilities is
hard-coded unavailable until a licensed/evaluated provider is implemented; there is
no environment option to return test PASS. Synthetic gateway exists only under tests.
Therefore enrollment extraction and successful proof issuance remain blocked in runtime.
AI/Nest token/private TLS/network and licensed provider remain deployment prerequisites.


## Internal model integration update

GET /ai/face-capabilities (same service token) returns identityModelReady/modelVersion
separately from padEvaluated/padModelVersion. Nest accepts identity readiness metadata
but never treats an AI self-reported PAD boolean as approval. POST /ai/face-enroll uses
backend-selected worker/session/model/planned version and inline photo; quality/SFace
acquisition can run independently, but no embedding is returned while PAD is unevaluated.
Identity matching outputs now include identityMatched, padModelVersion and padErrorCode;
AI compatibility verified stays false even for identity MATCH. Only Nest persists and
authorizes proof after all approved checks. Old face-verify endpoints remain blocked.

Idempotent completed submit is successful only while proof/template and current order
ownership/stage remain valid. Expired/consumed/revoked/missing proof or changed assignee
rejects; historical success cannot refresh the proof TTL. v3 makes context immutable and
binds FK tuples; Order hard-delete with biometric history is explicitly RESTRICTED.
