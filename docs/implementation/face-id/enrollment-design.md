# Enrollment — PARTIAL, writes BLOCKED

Runtime GET /workers/me/face/status selects worker by JWT subject and checks ACTIVE
WORKER again in the service. Professional approval is not evidence of reviewed identity.
Legacy FaceProfile rows are LEGACY_UNTRUSTED even when isRegistered is true.
PENDING_REVIEW means prerequisites need review, NOT that a review request was queued.
Preflight requires explicit consent, accepts no image/reference/workerId, returns
accepted=false and reviewRequestSubmitted=false. It does not collect biometric data.
Reset preflight never changes or deletes a template and reports workflow unavailable.

Independent template encryption primitive uses AES-256-GCM, random 96-bit IV,
128-bit authentication tag and AAD binding workerId/templateVersion/modelVersion.
Only 128 finite, nonzero components accepted. Caller supplies a 32-byte key;
no key/default is embedded and no runtime template writer invokes this primitive yet.
Tests use synthetic vectors. Production needs KMS/key ID/rotation and approved storage.

Proposed actual enrollment sequence: approved identity evidence review → explicit
consent version → fresh enrollment session → camera capture + quality + evaluated PAD
→ compare to reviewed reference under approved policy → encrypt/version template →
atomic create if absent + audit actor/action/reason. Existing template cannot be
upserted. Re-enrollment requires separate step-up/administrator authorization, version
increment, revocation of all sessions/proofs and immutable metadata audit. Manual review
must never automatically promote model failure or PAD uncertainty to live verification.

Retention/deletion proposal: minimize raw captures, private temporary storage and
short configured deletion deadline, encrypted template while consent is active,
revocation immediate on withdrawal, asynchronous confirmed object deletion and
metadata-only audit retained under an approved policy. Exact retention and access roles
need owner approval before capture/persistence. No real biometric data was accessed.
