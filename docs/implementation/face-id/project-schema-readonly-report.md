# Project schema read-only comparison — 2026-11-13

Authorization: user permitted verified connection + schema/migration metadata only;
no application/biometric rows or database writes. This comparison has been executed.

## Target verification and boundary

Configuration resolves to localhost:5432/ondemand_db. Docker metadata identifies
ondemand_postgres, postgis/postgis:16-3.4-alpine, port5432 and the main repository's
Compose working directory. A first READ ONLY identity query confirmed the expected
actual DB/port; collection then used REPEATABLE READ READ ONLY, 15s statement timeout
and 1s lock timeout. Read-only setting was checked as on. PostgreSQL reports16.4,
PostGIS3.4.3 and btree_gist1.7 (plus existing PostGIS companion extensions).

Only fixed pg_catalog schema queries and a conditional, explicitly allowlisted
_prisma_migrations metadata query are implemented. The latter relation was absent,
so NO migration-history rows were selected. No users, profiles, registrations,
reviews, templates or proof rows were read, counted or copied. Existing configured
DB account was used in a forced read-only session; no dedicated role/grant was created.
For future repeated audits prefer a dedicated least-privilege account when separately
provisioned. No .env, password or raw snapshot was committed.

Raw catalog/identity and detailed diff JSON are outside Git in a private mode700 temporary
directory, files mode600. Snapshot SHA-256:
`185831ca2e38c15e313ce4eb0a641195e6fc616090359ad73f6cd0b51c335097`.
Function definitions were hashed, not exported as source. This is a bounded catalog
snapshot (public tables/columns/enums/constraints/indexes/triggers/non-extension
functions + extension versions), not a full restorable pg_dump or application backup.

## Observed drift

A new disposable PostGIS container, no network/publication/project volume, reconstructed
the declared f6737fd baseline and applied v2+v3 there only. Catalog comparisons yielded:

| Category | Project vs declared pre-face baseline | Project vs v2+v3 target |
|---|---|---|
| Columns | 0 missing, 6 extra, 0 changed | 72 missing, 6 extra, 0 changed |
| Enum labels | No differences | No differences |
| Constraints | 0 missing, 1 extra, 0 changed | 28 missing, 1 extra, 0 changed |
| Indexes | 0 missing, 2 extra, 0 changed | 21 missing, 2 extra, 0 changed |
| Custom triggers | No differences | 7 missing |
| Non-extension functions | No differences | 7 missing |

The six extra columns belong to existing **registration_proofs**:
tokenHash, phone, purpose, expiresAt, consumedAt, createdAt; extra PK and expiry index
belong to that table. These are column names only, not registration/token/phone values.
It is absent from this worktree's declared Prisma schema and MUST be preserved/owned
with the backend-auth work. Do not use db push to erase it or invent a duplicate model.
The 72 missing target columns are the six biometric tables; target guards/FKs/indexes
are not present on the project DB. No face migration was applied by this work.

No _prisma_migrations relation exists in the inspected public catalog. This establishes
missing history metadata, not the reason (manual push/history deletion/etc. not verified).
Historical init files also do not encode all later declared User/OrderStatus structure;
no history replay/baseline was performed on the project DB.

## Safe application plan — proposal only, separate approval required

1. Coordinate canonical schema ownership with backend-auth so registration_proofs and
   its PK/index are retained. Do not merge branches automatically or edit auth code here.
2. Prepare a reviewed baseline from approved schema metadata; validate it on a fresh
   isolated clone with matching major/extensions. Use synthetic records only. A full
   schema-only export can be taken if needed under the same verified read-only boundary;
   review private definitions before restoring/sharing.
3. Reconcile migration history in a separately reviewed plan. With a nonempty DB and no
   history table, do not blindly run migrate deploy or mark migrations applied. Any
   future migrate resolve/baseline-history write requires explicit approval; none now.
4. Rehearse v2/v3 forward DDL on that baseline, verify preserved auth objects and all
   custom guards, and repeat race/rollback tests. No FaceProfile/legacy timestamp is
   backfilled as trusted biometric evidence. Invalid lineage must block deployment.
5. Approve operational backup/restore, lock budget and maintenance/feature rollout.
   New worker unique index/FKs can lock parent tables; no production size/load estimate
   was collected because authorization was schema-only. Keep FACE_CORE_ENABLED=false
   and capture approval false until evaluation/data gates are satisfied.
6. Only after the user approves a concrete application plan perform any project DDL/
   history operation. Rollback should disable/revoke and preserve evidence, not use
   destructive disposable-test SQL on real data.

Tools: server/scripts/face/snapshot-readonly.py, catalog-readonly.sql and
compare-snapshot.cjs. Collector requires explicit expected host/port/database and output;
no fallback connection. Comparator connects only to its own temporary container; it
never connects back to the snapshot's project database. Container was removed afterward.
