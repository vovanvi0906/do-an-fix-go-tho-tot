> FACE-RESEARCH-E2E: standalone measurement pipeline/API/camera-flow code implemented; 24 real HTTP/PG synthetic checks PASS. See [current report](research-e2e-report.md). Camera policy and physical-device/real-face tests remain blocked; production gates unchanged.

> 2026-11-13 update: approved isolated MN3 synthetic CPU experiment completed. See [results](pad-technical-experiment.md). Weights now downloaded outside Git; historical no-download statements below describe the previous phase. No real-data evaluation or proof enablement approved.

> Latest: read-only project catalog comparison is complete (project-schema-readonly-report.md). Primary proposed PAD research baseline is anti-spoof-mn3; see pad-selection-report.md and participant-test-protocol.md. Download, real-data evaluation and project DDL are still unapproved.

> Latest audit: [v2/v3 migration review](migration-review-v3.md), [real model integration](real-model-integration.md), [executed v3 tests](test-report-v3.md), and [read-only schema reconciliation proposal](schema-reconciliation-plan.md). The original v2 migration is unchanged; forward hardening is tested only on disposable PostgreSQL. YuNet/SFace load from existing SHA-verified local artifacts, but PAD and real-data approvals still block successful enrollment/proof runtime.

# Face Core v2 — current status and decisions required

This supersedes the f6737fd utilities-only milestone. Persistence, enrollment/proof
orchestration and HTTP flows now execute against disposable PostgreSQL with synthetic
fixtures. It is still NOT a deployable/evaluated biometric identity system.

| Phase | Status | Delivered / remaining boundary |
|---|---|---|
| 0 Fail-closed security | DONE | Legacy URLs/timestamps never grant; new runtime provider not ready => capture blocked. |
| 1 Enrollment backend | DONE for isolated synthetic protocol; PARTIAL overall | Admin review record + consent + session + immutable encrypted version + withdrawal/reset transaction. Real identity review procedure, KMS/data/participant policy and evaluated PAD still required. |
| 2 1:1 Verification | PARTIAL | Pinned local YuNet/SFace loader and actual Nest→FastAPI→OpenCV negative smoke tested; identity MATCH separated from PAD and AI verified=false. Successful backend protocol tests still inject synthetic evidence; real-face accuracy remains unmeasured. |
| 3 Durable daily/order proof | DONE on isolated PostgreSQL | Purpose/order/worker/epoch/version/nonce/TTL, persisted attempts/idempotency, atomic start-work consumption and rollback/race tests. Production migration/enforcement still unapproved. |
| 4 PAD | BLOCKED | Exact upstream checkpoint pair/commit metadata and download experiment proposal. No binaries downloaded, no evaluated provider, no fake-pass flag. |
| 5 Worker UI | PARTIAL / ANDROID PENDING | Consent, camera-only scoped sessions, upload/readback, withdrawal, fresh daily/order proof display/start gate. No physical Android/camera/injection validation. |
| 6 Tests/evaluation | PARTIAL | PostgreSQL/Nest HTTP integration plus unit/UI tests pass. Real FMR/FNMR/PAD/latency metrics NOT MEASURED. |

## DONE / PARTIAL / MISSING reconciliation

| Item | Status | Evidence / limitation |
|---|---|---|
| Additive schema/migration/rollback | DONE on disposable DB | v2 unchanged; v3 adds compound lineage FKs, explicit Order DELETE RESTRICT, immutable session/proof guards and active epoch lookup. v3 rollback/reapply preserves records; project DB not inspected or changed. |
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

1. Review the completed read-only comparison: migration history is absent and registration_proofs must be preserved with backend-auth. Approve a reconciled baseline/forward application plan separately before any DB migration or migrate resolve. Those writes remain NOT authorized.
2. Approve actual Admin identity-evidence procedure/custody, consent language, participant
   scope, real-data purpose, KMS/key access/rotation, backup/object/metadata retention and
   deletion SLA. No real face collection is enabled or performed.
3. Review [PAD selection](pad-selection-report.md) and approve the exact pinned anti-spoof-mn3 artifact
   and isolated dependency/CPU/parity experiment. This does not authorize real face data
   or production PAD PASS. Benchmark acceptance targets/data/device protocol still needed.
4. Review experimental TTL/limits and rollout/support policy before production enforcement;
   these are configurable experimental defaults, not an accepted production policy.
5. Review private AI transport/TLS, secret custody, ingress/resource quotas, physical
   Android QA and unresolved generic AiService integration hunk from 803ec32.

Only schema/migration metadata was read under explicit authorization; no application rows were read. No project DB migration/db push/reset/seed; no model weights or real faces; no automatic
push/merge/rebase/reset; no Antigravity AI Recommendation or dev-local-usb.sh changes.
