# Face v2 audit and v3 binding hardening — 2026-11-13

Original v2 migration is unchanged. New forward migration:
`server/prisma/migrations/20261113200000_face_binding_hardening/migration.sql`.
Only disposable PostgreSQL was used. No project snapshot/connection/history mutation.

## Findings and resolution

| Finding in v2 | Resolution / evidence |
|---|---|
| FK IDs exist, but do not bind worker/review/epoch/template/session/proof tuples | Compound unique keys/FKs now bind worker+user, review+worker+epoch, template+worker+version+epoch+model and proof to the same session context. Direct invalid DML tests reject wrong worker, purpose, order, epoch, version/model. |
| Optional template FK can be skipped by MATCH SIMPLE | CHECK requires a non-null template for DAILY/ORDER, null for ENROLLMENT. Review ID is mandatory and bound to worker/epoch. |
| Nullable order FK SET NULL contradicts CHECK requiring orderId for ORDER | Old behavior reproduced on v2: CHECK violation rolls back hard delete. v3 uses explicit RESTRICT for both session/proof order FKs; history stays intact. Order without biometric references still deletes normally. Cancellation/FSM is unchanged. |
| History could be retargeted or TTL/consumption rewritten by a writer bug | Immutable session scope/nonce/expiry and proof scope/score/TTL; terminal session, consumption and revocation cannot be undone. Attempt/version/epoch counters cannot regress. |
| Proof row could refer to an unfinished session | INSERT guard requires completed session and consistent current published template/epoch/consent; proof time is inside source session validity. |
| Review/template authority not reinforced at DB write boundary | New review INSERT checks current ACTIVE Admin and approved ACTIVE Worker; template INSERT checks reviewed authority, consent, planned next version and epoch. This does not retroactively certify historical reviewer authority or prove an external identity document. |
| Old current-template lookup ignored state epoch/version fence | Lookup now requires current state epoch and published lastVersion. Historical records remain unchanged but cannot grant. |
| Duplicate successful submit could report success for an expired proof or changed assignee | Retry rechecks order ownership/stage and current template/proof validity; expired/revoked/consumed/missing proof rejects instead of returning verified=true. No new timestamp/proof is minted. |
| Capability network I/O introduced inside worker transaction | Capabilities are fetched before opening the worker transaction, so a stalled AI readiness request cannot hold its row lock. |

## Historical order owner versus current assignment

Order.workerId is mutable business state; historical biometric worker IDs must NOT
cascade to a new assignee. We deliberately do not use a composite FK to mutable
Order.workerId that would prohibit legitimate historical retention/reassignment. Instead:
- Immutable proof/session record the worker who originally captured evidence.
- BEFORE INSERT authority guards check and lock current order assignment/stage (FOR SHARE).
- Service create/finalize/duplicate-read and consume check current assignee/stage under
  the existing worker->order transaction locks. Reassignment tests deny new issuance/
  consumption/duplicate-success while retaining the old historical association.
- A separate compound sessionId+orderId FK prevents attaching an ORDER proof to a
  different order than its source session. DAILY null order is covered by base tuple
  FK plus purpose CHECK on both records.

This preserves ARC-01 transition/quote/photo/wallet rules. Direct SQL helpers must still
follow the documented transaction lock order. DB constraints defend against writer bugs;
a privileged database administrator can alter/disable them and is outside that guarantee.

## Encryption and deletion boundary

AES-GCM AAD worker/version/model authentication remains required on read. Database only
validates envelope shape; it cannot authenticate ciphertext without the key. Test copies
an old encrypted envelope into a newly published version: decryption fails, no proof.
Malformed envelopes/JSON null reject; erased ciphertext cannot be restored through update.
Reset/withdrawal revoke epoch/sessions/proofs and erase managed encrypted payload atomically.
Key custody/KMS, WAL/backups/legacy object retention and consent/participant policy remain
release blockers; deleting a SQL payload is not physical backup/key destruction.

## Compatibility, preflight and rollback

New migration wraps all DDL in BEGIN/COMMIT. Invalid existing v2 lineage causes rollback;
no rows are repaired, deleted or marked trusted. Harness intentionally preserves an invalid
v2 row, proves DDL rollback restores old FK and keeps that row, then clears its own synthetic
fixture before valid rehearsal. Newly added compound FKs/CHECKs validate existing rows;
new INSERT authority triggers are not a retrospective identity-certification mechanism.
An approved metadata/data-quality review is still required for any real historical rows.

Prisma schema represents compound relationships and delete policies. Live isolated diff
to declared schema is empty. Custom CHECKs/partial index/triggers are SQL-owned; catalog
verification and behavioral DML tests supplement ORM diff. Do not generate/drop them
blindly from an introspection-only migration.

Hardening rollback to v2 is tested with `face-binding-rollback-isolated.sql`, preserving
template row count, followed by reapply. Full isolated v2+v3 cleanup/reapply also passes.
These scripts are exclusively for disposable tests; production rollback must disable
issuance and retain/revoke evidence. Rolling back hardening reintroduces v2 weaknesses
and must not be used as an operational security rollback.

Current project DB compatibility is UNKNOWN. See schema-reconciliation-plan.md for the
read-only snapshot/catalog/history comparison proposal. No migrate resolve/checksum
rewrite/baseline record insertion was executed or authorized.
