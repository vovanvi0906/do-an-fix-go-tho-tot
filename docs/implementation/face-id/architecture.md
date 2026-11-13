# Face core implementation — 2026-11-13

## Baselines and dependency map

Worker branch starts at 4edb191; integration/fixgo-sprint-02 remains 803ec32.
Audit source is untracked in the main worktree, baseline be082dc; copied all 34 files
including evidence, with byte-identical SHA-256 manifest. No source was copied.

Selected Face ID diff of 803ec32 applied cleanly (not merged/cherry-picked):
FastAPI face endpoint → face-result validator → FastApiAiClient → WorkersService daily
and OrdersService per-order → workflow/availability gates. This reuses the existing
hotfix rather than inventing parallel fallback logic. Diagnosis/recommendation untouched.
The generic AiService face method is outside assigned paths: 803ec32 also fixes its
signature and removes identity-card approval; that hunk is NOT included here and must
be retained when integrating with 803ec32. This branch is not a standalone substitute
for all changes on integration.

## Planned files and trust boundaries

- ai-service/face_core.py and face_router.py: isolated matcher, quality and PAD contracts;
  main.py only face integration. Existing Customer endpoints remain in main.py.
- server/src/modules/workers/face/: enrollment eligibility/status and proposal-backed
  proof primitives, tests. No writes of real templates until identity review, PAD,
  encryption/retention and durable storage are approved.
- server/src/infrastructure/external/ai/: strict transport/decision/provenance.
- workers and orders services: no proof from legacy photos, avatars, scores or timestamps.
- worker-app face-verification feature: camera-only capture; backend status, explicit
  blockers, cancellation, no local success or gallery substitution.

JWT identity selects worker/template; client reference or workerId never authorizes.
AI reports measurements only. Nest owns authorization. Face match is not PAD and
nonce alone cannot establish camera origin. Daily proof and single-use order proof
need durable transactionally checked records; existing schema cannot represent these.
No in-memory production proof store will be substituted for database persistence.

## Hotfix reconciliation

| Audit finding | 803ec32 | Worker branch after Phase 0 |
|---|---|---|
| model/decode/reference fallback success | DONE | DONE, reused exact face diff |
| detection-only success / multiple faces | DONE | DONE |
| invalid score / hardcoded confidence | DONE | DONE |
| Nest fallback and unbounded face fetch | DONE | DONE |
| avatar as reference / automatic KYC | DONE | DONE |
| legacy timestamps grant authorization | DONE (all blocked) | DONE (same intentional outage) |
| generic AiService signature/KYC | DONE | MISSING, outside ownership; preserve integration fix |
| trusted enrollment / versioned encrypted template | MISSING | MISSING initially |
| calibrated 1:1, quality and provenance | PARTIAL | PARTIAL initially |
| daily/order sessions, atomic consumption | MISSING | MISSING initially |
| evaluated PAD | MISSING | MISSING initially |

All current online/matching/start gates intentionally reject legacy timestamps.
This is the behavior already on integration; no rollout is silently enabled here.
Unit tests establish branch behavior, not real-world biometric security.
