# Enrollment v2 — durable backend implemented, real capture blocked

New authority is BiometricReview, not WorkerProfile.approvalStatus or idCardVerified.
ACTIVE Admin must attest reviewedIdentity, identify an evidence record by opaque ID
and digest, give a reason, type and expiry (max30days). Worker must be ACTIVE WORKER
and professionally APPROVED. The evidence record is an Admin attestation/reference;
this implementation does not verify an external identity-provider document or compare
capture to an ID photo. Real review procedures/evidence custody still require approval.

Worker records explicit consent to requiredConsentVersion. It is durable and audited.
Only after review+consent+keys+capture-data approval+evaluated PAD can a fresh ENROLLMENT
session be created. Backend selects worker/version/model from JWT/state. No embedding or
avatar is accepted from mobile. The gateway must deliver session/worker/model/version,
quality PASS, evaluated PAD PASS with exact provider version, and finite 128-component
embedding. Production gateway is unavailable; tests inject a synthetic gateway in test
modules only. No real face/image was collected or evaluated.

Under worker row lock, finalize rechecks review/account/consent/epoch/session expiry,
claim and absence of an active template. It creates encrypted immutable version N+1,
consumes the session, increments lastVersion and appends metadata audit in one tx.
Concurrent enrollment cannot overwrite the winner. DB unique indexes/immutability
trigger reinforce the service invariant. There is no template upsert/update API.

AES-256-GCM envelope uses random96-bit IV, 128-bit tag and AAD workerId/version/model;
stored in BiometricTemplate.encrypted, with keyId. Reads select template by JWT worker,
load key by stored ID, authenticate/decrypt and use embedding only in process for AI.
Rotation can retain old key IDs for reads and choose a new current key for new versions.
Missing keys/tampered envelopes cannot grant proof. Environment keyring is an isolated-
experiment adapter, not production KMS. No key/vector/capture/private URL gets logged.

REENROLLMENT requires a new Admin review. Its transaction increments epoch, revokes
previous authority/proofs/sessions, erases old encrypted payload and records new review.
Consent still must be current; after withdrawal it must be recorded anew. Next version
is monotonic even after deletion. There is no Worker reset-request queue/Admin UI yet;
Worker guidance directs them to Admin for the reviewed reset API.

DELETE template withdraws consent and nulls managed ciphertext in the same transaction
as revocations/offline status/audit. It does not pretend to erase PostgreSQL WAL/MVCC/
backups or legacy FaceProfile/Cloudinary objects outside v2 ownership. Backup retention,
legacy inventory/deletion, KMS and metadata/session cleanup need approved policy before
real data. No raw capture is persisted by v2 (multipart memory/AI process only); memory
zeroization is not guaranteed by JS/Python runtimes. Scores/digests/audit remain protected
metadata and require a separately approved retention schedule.
