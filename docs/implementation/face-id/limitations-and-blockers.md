# Face Core v2 — current status and decisions required

This supersedes the f6737fd utilities-only milestone. Persistence, enrollment/proof
orchestration and HTTP flows now execute against disposable PostgreSQL with synthetic
fixtures. It is still NOT a deployable/evaluated biometric identity system.

| Phase | Status | Delivered / remaining boundary |
|---|---|---|
| 0 Fail-closed security | DONE | Legacy URLs/timestamps never grant; new runtime provider not ready => capture blocked. |
| 1 Enrollment backend | DONE for isolated synthetic protocol; PARTIAL overall | Admin review record + consent + session + immutable encrypted version + withdrawal/reset transaction. Real identity review procedure, KMS/data/participant policy and evaluated PAD still required. |
| 2 1:1 Verification | PARTIAL | Backend selects/decrypts current template; model/version/quality/score/PAD provenance checked. Existing real matcher retained; successful backend tests inject synthetic gateway, not actual faces. |
| 3 Durable daily/order proof | DONE on isolated PostgreSQL | Purpose/order/worker/epoch/version/nonce/TTL, persisted attempts/idempotency, atomic start-work consumption and rollback/race tests. Production migration/enforcement still unapproved. |
| 4 PAD | BLOCKED | Exact upstream checkpoint pair/commit metadata and download experiment proposal. No binaries downloaded, no evaluated provider, no fake-pass flag. |
| 5 Worker UI | PARTIAL / ANDROID PENDING | Consent, camera-only scoped sessions, upload/readback, withdrawal, fresh daily/order proof display/start gate. No physical Android/camera/injection validation. |
| 6 Tests/evaluation | PARTIAL | PostgreSQL/Nest HTTP integration plus unit/UI tests pass. Real FMR/FNMR/PAD/latency metrics NOT MEASURED. |

## DONE / PARTIAL / MISSING reconciliation

| Item | Status | Evidence / limitation |
|---|---|---|
| Additive schema/migration/rollback | DONE on disposable DB | Six new tables, constraints/indexes/template trigger; legacy columns unchanged. Project DB not inspected or changed. |
| Reviewed identity authority | DONE backend / PARTIAL policy | ACTIVE Admin, professional approval, evidence record ID+digest/reason/type/expiry; not approvalStatus alone. External evidence custody and review procedure not implemented. |
| Durable consent | DONE experimental | Versioned record/audit; no automatic enrollment. Actual consent language/policy needs approval. |
| Template encryption/version/no overwrite | DONE backend | AES-GCM AAD binding, stored key ID, monotonic version, DB trigger and race tests. Production KMS pending. |
| Withdrawal/reset | DONE managed v2 | Delete ciphertext, increment epoch, revoke all grants/reviews/sessions and offline worker atomically. Reset needs new Admin review; no self-service review queue/Admin UI. |
| Template select/read by JWT | DONE | Client cannot submit worker/reference/vector/decision; stored key ID drives decryption. |
| Durable sessions/attempt limits/idempotency | DONE | PG row locks across two service instances, request-key uniqueness, stable nonce, timeout/retry/replay tests. No claim of separate-process load benchmark. |
| Daily proof vs order proof | DONE | Separate TTL/purpose; daily availability/matching, order ARRIVED capture/start consumption. |
| Atomic order-proof consumption | DONE | In existing ARC-01 tx; missing BEFORE rolls back proof/audit/status; concurrent start commits once. No FSM/wallet rule changes. |
| Real model enrollment extraction | MISSING until approved PAD | Runtime gateway intentionally unavailable. No raw template/vector intake API or mock-success endpoint. |
| Passive PAD validity/license/benchmark | MISSING | Candidate pinned; checkpoint/data rights, dependency experiment and measured acceptance still pending. |
| Public quotas beyond biometric attempts | PARTIAL | Durable attempt/session limits exist; ingress abuse/CPU/gateway quotas/deployment hardening still required. |
| Real identity/PAD metrics | MISSING | No faces, volunteers, attacks or measured security accuracy. |
| Android camera/accessibility/injection QA | MISSING | JS tests only; device checklist pending. |
| Production data lifecycle | PARTIAL | Immediate managed ciphertext deletion; WAL/backups, legacy Cloudinary/FaceProfile and metadata retention/cleanup policy pending. |
| Production migration readiness | BLOCKED | Existing historical migrations drift from declared schema; approved project snapshot/baseline review needed first. |
| AI Recommendation preservation | DONE by diff | No changes in ai-service/main.py, recommendation/classifier/catalog or Customer code in v2. |

## Decisions still required

1. Review [schema diff/backward compatibility/rollback](schema-diff-v2.md) and integration
   results. Authorize a project-schema snapshot/baseline reconciliation before any
   proposal to run this migration on the project DB. Current DB migration remains NOT authorized.
2. Approve actual Admin identity-evidence procedure/custody, consent language, participant
   scope, real-data purpose, KMS/key access/rotation, backup/object/metadata retention and
   deletion SLA. No real face collection is enabled or performed.
3. Approve [PAD download proposal](pad-download-proposal.md) for the exact pinned artifacts
   and isolated dependency/CPU/parity experiment. This does not authorize real face data
   or production PAD PASS. Benchmark acceptance targets/data/device protocol still needed.
4. Review experimental TTL/limits and rollout/support policy before production enforcement;
   these are configurable experimental defaults, not an accepted production policy.
5. Review private AI transport/TLS, secret custody, ingress/resource quotas, physical
   Android QA and unresolved generic AiService integration hunk from 803ec32.

No project DB migration/db push/reset/seed; no model weights or real faces; no automatic
push/merge/rebase/reset; no Antigravity AI Recommendation or dev-local-usb.sh changes.
