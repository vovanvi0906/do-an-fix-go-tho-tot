# Read-only schema snapshot and migration-history reconciliation proposal

Status: PLAN ONLY. No connection to the FixGo project DB; no migration history write.
Do not run migrate resolve/deploy/dev, db push/reset or seed on that DB without a new
explicit approval. The existing disposable harness never falls back to DATABASE_URL.

## Proposed snapshot, after explicit authorization

Use a dedicated least-privilege schema-reading role and separate named connection
service (no credentials in repository/command history). Force session read-only and
statement timeout. An operator can run the following locally only after approval:

```sh
PGSERVICE=fixgo_schema_readonly PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=60000' \
  pg_dump --schema-only --no-owner --no-privileges --file=/private/snapshot/fixgo-schema.sql
```

Read pg_catalog definitions for FK/CHECK/unique/indexes (including partial predicates),
triggers/functions, enums, defaults/nullability, extension versions and PostgreSQL
version. Capture only approved migration metadata (migration_name/checksum/finished_at/
rolled_back_at), not application rows. A schema-only dump excludes migration-history
rows. Do not export images, embeddings, encrypted templates, user or identity-review data.
Schema/function definitions can themselves contain secrets; keep snapshots private,
review/redact before sharing, never auto-commit/upload. Record SHA-256, repository HEAD,
Prisma/PG versions and snapshot time so comparisons are reproducible.

## Offline comparison, no project writes

Restore the approved schema snapshot to a newly provisioned isolated database with
matching PG/extensions. Compare three independently labeled sources:

1. Historical migrations replayed from empty in a different disposable DB.
2. Declared pre-face schema (f6737fd) and current target Prisma schema.
3. Approved actual-DB catalog snapshot (without application data).

Use Prisma diff as one input, plus catalog comparisons for partial indexes, CHECKs,
triggers and functions that Prisma cannot completely express. An empty ORM diff alone
is insufficient. Compare OrderStatus/User definitions and PostGIS-owned spatial_ref_sys;
do not drop/recreate extension-owned objects to make a diff look clean.

Classify differences as missing checked-in migration, manual schema drift, legitimate
extension-owned metadata, or security-sensitive incompatible data assumptions. Proposed
v2/v3 DDL must be rehearsed on the snapshot clone with synthetic boundary fixtures;
no production biometric rows are required or authorized. New FK/NOT NULL/immutability
constraints deliberately reject inconsistent lineage; do not auto-repair worker IDs,
versions, review authority, epochs or proof scope, or silently delete bad rows.

## Decision branches for review

- Actual schema equals declared pre-face schema but history does not reproduce it:
  present an explicit reviewed baseline/history plan. Any future migrate resolve is a
  database metadata WRITE requiring separate approval and backup; never perform now.
- Actual schema differs materially: propose a forward migration based on the snapshot,
  identify affected old readers/writers and blockers, test on an isolated clone. Do not
  alter checksums of applied migrations or invent an applied entry for unexecuted SQL.
- Existing v2 rows violate v3: hardening aborts atomically. Produce metadata-only counts/
  reasons under approved access, ask identity/data owner for remediation policy; do not
  infer or grant trusted identities from legacy photos/timestamps.

Before any project deployment proposal: schema diff, history/extension reconciliation,
lineage validation, reader/writer compatibility (including explicit Order DELETE RESTRICT),
rollback/backup retention and sign-off. Production rollback is feature disable/revoke/
retain; isolated rollback SQL is not a production data-erasure plan.
