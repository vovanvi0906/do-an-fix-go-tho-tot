# Durable daily/order proof v2

BiometricSession and BiometricProof replace timestamps. Experimental defaults configurable:
120s/session, 8h/daily, 5min/order, 3 inference attempts/session, 5 attempts and session
creations per rolling15min. PostgreSQL clock_timestamp is read AFTER worker row lock;
set DB/server UTC. Request UUID unique per worker. Duplicate live request returns same
session, deterministic HMAC nonce (only hash in DB), never extends time or changes scope.
Nonce key is server-only; revoke live sessions before rotating it (online key versioning
is not implemented). Template keyring rotation is separately supported by stored keyId.

Claim transaction serializes by worker, validates actor, purpose/order, nonce, consent,
epoch, template version/model, expiry and quotas; persists PROCESSING/claimId/attempt.
Inference happens outside the transaction with bounded timeout. Finalize reacquires
worker then order locks and revalidates account, current review/consent/epoch/template,
expiry, claim, method, finite score, quality and PAD/provider provenance. It atomically
consumes session + inserts unique-session proof + audit. Failure cannot issue proof.
Stalled process leaves PROCESSING until session expiry; no unsafe lease reuse.

Duplicate successful submission with identical capture digest returns SAME durable
result, never fresh issuance/TTL. Changed payload or nonce/scope/version mismatch rejects.
Expired sessions reject even if an older success exists; status may expose still-valid
proof by its own TTL. Gateway timeout retries increment durable attempt counters; late
results cannot run finalize after timeout. Withdrawal/reset invalidates in-flight work
by epoch/state and prevents a delayed result from committing. Captures are not stored;
capture digest is sensitive metadata and remains subject to retention approval.

Daily proof allows availability/matching only for current worker/template/epoch/consent,
within TTL. Availability update checks proof under same worker lock as its isOnline write,
so withdrawal cannot race that write. Legacy timestamps never satisfy these gates.

ORDER sessions can be created/submitted only by assigned worker at ARRIVED. The existing
ARC-01 transition still owns FSM/pricing/photos/authorization/history and wallet rules.
Only face guards changed: MATCHED checks durable daily proof; IN_PROGRESS conditionally
consumes correct ORDER proof in the SAME existing transaction as status/history update.
If BEFORE photo/quote validation or status write fails, consumption/audit roll back too.
Repeated start at already IN_PROGRESS remains idempotent without consuming another proof.
Admin's existing transition permission is retained with worker->order lock order and
correct audit actor; no new FSM transitions were introduced.

Core is opt-in (FACE_CORE_ENABLED=false by default). Capture requires separate data
approval and a source-approved evaluated gateway; runtime gateway remains NOT_EVALUATED.
Synthetic PostgreSQL/HTTP tests exercise success/failure/transactions without pretending
that a real biometric or PAD model was evaluated.
