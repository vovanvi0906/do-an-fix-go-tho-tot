# Additive Face Core v2 schema diff

Authorized scope: disposable PostgreSQL only. No project DB connection/mutation.

Six new tables: biometric_states (consent, epoch and monotonic version), biometric_reviews
(Admin reviewer, reviewed evidence pointer+digest, authority expiry), biometric_templates
(immutable encrypted vectors/key ID/model/version), biometric_sessions (nonce hash,
request key, purpose/order, lease state/attempts), biometric_proofs (scoped TTL/consumption),
biometric_audits (actor/action/reason, no payload). Legacy FaceProfile, FaceVerification,
WorkerProfile.faceVerifiedAt, orders and recommendation columns are unchanged.
Prisma only gains inverse relations on User/WorkerProfile/Order; formatting is cosmetic.

Migration: server/prisma/migrations/20261113190000_face_core_v2/migration.sql.
CHECK constraints enforce purpose/order, state, positive expiry/version/epoch and finite
bounded similarity. Partial unique index allows one active template per worker. Trigger
prevents template identity/model/version/key/ciphertext overwrite; only revocation and
ciphertext erasure are allowed. Retired version metadata remains for revocation/audit.

Backward compatibility: FACE_CORE_ENABLED defaults false. Disabled code never queries
the new tables; existing legacy endpoints remain fail-closed. Enabling requires this
migration and key configuration. No legacy photo/boolean/timestamp is backfilled into
trusted data. Old application code can run with additive tables present before feature use. Once review rows exist, the reviewer foreign key intentionally restricts hard-deleting that Admin; account lifecycle/retention must be reviewed before rollout. Once new flows
are used, roll back by disabling issuance/enforcement safely, not restoring fail-open code.

Historical migration chain does not reproduce current schema: init has older OrderStatus
and User definitions. The isolated harness builds the exact f6737fd schema baseline via
offline Prisma diff (PostGIS owns spatial_ref_sys), then applies ONLY the new migration
SQL in a transaction. This establishes migration compatibility with the declared schema,
not with any uninspected project DB. Schema drift and migration history must be reconciled
against an approved project-DB snapshot before suggesting production deploy.

Destructive rollback file: server/prisma/face-core-rollback-isolated.sql; exclusively
for disposable tests. It drops six new tables/function, never legacy tables. Harness
asserts legacy user row count unchanged and reapplies migration. For real biometric data,
retain additive tables, disable feature, revoke proofs and follow approved deletion/backup
retention procedure; do not run this destructive SQL on a project database.
