> Historical v1 proposal. Additive v2 schema is implemented/tested on disposable PostgreSQL; see [schema-diff-v2.md](schema-diff-v2.md). No project migration is authorized.

# Database and proof rollout proposal — APPROVAL REQUIRED

No Prisma schema, migration SQL or database has been changed/executed.
Existing FaceProfile has one row per worker, optional unversioned JSON embedding and
URL; FaceVerification has order/score/time but no nonce, purpose, expiry, consumption,
revocation, template version, consent or provenance. Reusing these fields as loosely
shaped JSON/session state would hide rather than solve the missing guarantees.

## Additive migration proposal

- Extend FaceProfile with status (PENDING_REVIEW/ACTIVE/REVOKED), integer version,
  modelVersion, encryptionKeyId, encryptedTemplate, consentVersion/consentedAt,
  identityReviewId, reviewerId/reviewedAt, revokedAt. Stop using public facePhotoUrl
  as authority; make it nullable only after reader migration. Never backfill ACTIVE
  from isRegistered or an existing URL.
- IdentityReview: worker, trusted identity evidence reference (private, not avatar),
  reviewer/decision/reason/time. Professional approval and idCardVerified boolean
  alone cannot populate approved biometric identity evidence.
- FaceSession: UUID, worker/user, purpose DAILY/ORDER/ENROLLMENT, order nullable,
  templateVersion/modelVersion, nonceHash, createdAt/expiresAt, consumedAt,
  attempt count, request idempotency key (unique per worker/purpose/order scope).
- FaceProof: UUID, unique sessionId, worker, purpose, order, templateVersion,
  modelVersion, identity method/threshold-policy version, quality/PAD decision and
  PAD model/version, issuedAt/expiresAt, consumedAt, revokedAt. CHECK purpose/order
  consistency; indexes worker+purpose+expiry and order+worker+consumedAt.
- Metadata audit: actor/action/target opaque IDs/reason/result/time/correlation ID.
  No photos, embeddings, private URLs, tokens or nonces in audit/logs.

## Transactions and concurrency

Session request first checks current JWT account, assigned order and allowed stage;
unique idempotency scope returns SAME live session, never creates a new check merely
because a client retried. Lock worker/template so reset cannot race proof issuance.
Before inference claim bounded attempt atomically, verify nonce binding and TTL;
after inference recheck current template/account/session inside serializable transaction.
Conditional update session consumedAt where null + current version + expiry, require
count=1; insert proof with unique sessionId in same transaction. A failed compare
cannot issue proof. Retry after committed success returns same proof by idempotency key
only to same actor/scope, never extends expiration or creates fresh evidence.

Daily proof proposed TTL 8h; order proof 5min; capture session 120s. These are proposals,
not an activated policy. Daily is reusable for shift availability/matching within TTL;
order proof is bound to assigned worker and order at ARRIVED, consumed exactly once
with IN_PROGRESS transition, order status compare-and-set, timeline insert and other
existing FSM operations in the SAME DB transaction. Session expiry uses database clock.
Conditional orderProofConsumptionWhere is an independently tested predicate only;
there is no runtime consumer or atomic database concurrency test until schema approval.
A daily proof cannot satisfy order proof; two orders cannot share order proof.

## Rollout, impact and rollback

1. Review schema, consent/privacy, identity authority, TTL/retry targets and PAD criteria.
2. Create migration in isolated test database; test concurrent sessions/consumption,
   duplicate idempotency keys, reset race, rollback when transition fails.
3. Deploy additive schema; trusted provisioning in isolated evaluation environment.
4. Evaluate identity and PAD; shadow measurements never authorize.
5. Explicit enforcement release, supported workers re-enroll; legacy timestamps never
   migrate to valid proof. Current 803ec32 already blocks online/accept/start without
   proof; communicate the outage and support path before production rollout.
6. Rollback application to fail-closed release, revoke new proofs, disable issuance,
   retain additive columns/tables until reviewed cleanup. Never restore old fail-open
   behavior or resurrect revoked consent/templates. No destructive down migration
   against live biometric data without separate approval.

Per-worker retry proposal: 5 attempts/15min and 3 per session, durable cross-instance
counter + gateway limits. Exact limits and accessible assisted review need approval.
