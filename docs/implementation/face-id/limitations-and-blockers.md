# Status and decisions required

## Phase status

| Phase | Status | Delivered / boundary |
|---|---|---|
| 0 Security hotfix | DONE within owned paths | Reused 803ec32 face diff; all runtime proof gates closed |
| 1 Enrollment | PARTIAL / BLOCKED | JWT capability/preflight, legacy quarantine, AES-GCM utility; no capture/template writer or actual review queue |
| 2 1:1 Verification | PARTIAL | Isolated YuNet/SFace pipeline, quality/version/finite-score/auth contract; synthetic/stub tests only; transport not wired to public issuance |
| 3 Daily/order proof | PARTIAL / BLOCKED | Scoped nonce/policy/predicate tests, capture blockers, schema/transaction proposal; no durable session/issuer/consumer |
| 4 PAD | PARTIAL / BLOCKED | Explicit unavailable-provider interface, candidate/license/dependency review and experiment plan; no approved model/evaluation |
| 5 Worker UI | PARTIAL / ANDROID PENDING | Enrollment/reset preflight, daily/order status, consent/retry/cancel/restoration; successful capture/session UX remains blocked |
| 6 Tests/evaluation | PARTIAL / ANDROID PENDING | Synthetic unit and ASGI/Nest/UI tests, backend build; no real identity/PAD/device/security certification |

## Requirement reconciliation

DONE means implemented/tested at the stated software boundary; it never implies field
biometric accuracy or production rollout approval.

| Item | DONE / PARTIAL / MISSING | Evidence or missing prerequisite |
|---|---|---|
| Audit sync including evidence | DONE | 34 files with SHA-256 manifest |
| Failure cannot grant success | DONE | Face security tests, all live proof gates disabled |
| Face API timeout, finite scores, no avatar | DONE | Client/AI/service regression tests |
| Separate MATCH/NON_MATCH/INCONCLUSIVE/TECHNICAL_ERROR | DONE | Production matcher and transport contracts |
| Ownership/ACTIVE WORKER status capability | DONE | JWT/role guard + service/HTTP tests |
| Enrollment authorization from reviewed identity | MISSING | Identity evidence/reviewer record and policy |
| Enrollment quality pipeline | PARTIAL | Core checks exist; no capture/provisioning writer; pose/occlusion unvalidated |
| Encrypted versioned template storage | PARTIAL | Tested AES-GCM utility; no KMS/schema/persistence integration |
| No enrollment overwrite | DONE for current API | No writer enabled; legacy row quarantined |
| Approved re-enrollment/deletion/withdrawal/audit | MISSING | Preflight blocked; retention/access/review policy required |
| 1:1 SFace cosine/version provenance | PARTIAL | Synthetic pipeline tests; trusted template runtime provisioning missing |
| Calibrated threshold and genuine/impostor evaluation | MISSING | Consent/test set/target FAR approval |
| Nonce, TTL and scope policy | PARTIAL | Independently tested pure policy; not durable enforcement |
| Daily proof issuance and TTL | MISSING | Additive database proposal and approved shift policy |
| Per-order proof issuance / atomic consumption | MISSING | DB transaction integration; gate currently rejects all legacy proof |
| Cross-instance retry, concurrency, idempotency | MISSING | Durable counters/constraints, isolated-DB tests pending |
| PAD integration/effectiveness | MISSING | No approved checkpoint or held-out test set |
| PAD uncertainty cannot pass | DONE | UnavailablePad + session policy + capture/proof gates |
| Camera-only / backend-driven UI | DONE for blocked release | No gallery/upload, server status, no local success flag |
| Successful enrollment/daily/per-order UX | MISSING | Requires approved backend issuance |
| Android camera/accessibility E2E | MISSING | Checklist only, no physical device test |
| Biometric metrics and latency | MISSING | Not measured; no invented metrics |
| Customer recommendation preservation | DONE by source review | Unchanged non-face function/class ASTs and no classifier/catalog changes |

## Decisions required before dependent implementation

1. Approve additive database design in database-proposal.md, then authorize migration
   creation/testing on an isolated disposable DB. No approval to touch current DB is
   assumed. Production migration/execution remains a separate explicit action.
2. Name the biometric identity reviewer, reviewed evidence source, enrollment/reset
   authority, consent text/version, KMS access, raw/template retention and deletion SLA.
3. Approve proposed TTL/retry policy (session120s, daily8h, order5min; attempts5/15min,
   max3/session) and legacy-proof transition/support communication before enforcement.
4. Approve exact PAD checkpoint/license/dependency experiment proposal before downloading
   weights. Approve volunteers/data purpose/retention, devices and attack instruments
   before collecting/testing real biometric data. Set identity/PAD accuracy targets.
5. Review internal Face API contract change/shared token/private TLS deployment and
   preserve integration hotfix generic AiService change outside this branch's scope.

Current impact: no valid enrollment/proof can be issued. Online/matching/start gates
reject all legacy timestamps, as already intended in integration's 803ec32 hotfix.
This is a fail-closed implementation foundation, not a completed deployable Face ID.
No model was downloaded, no real biometric data read, no DB changed, no merge/push/
reset/rebase, no dev-local-usb.sh or Antigravity recommendation code changes.
