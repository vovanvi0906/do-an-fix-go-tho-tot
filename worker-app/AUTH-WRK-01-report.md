# AUTH-WRK-01 — Worker authentication, approval and shift check-in

Date: 2026-11-12 (Asia/Ho_Chi_Minh). Status: PARTIAL / backend blockers.
Branch: `agent/codex-worker`. Baseline: `34fb42513e1ef278d6ad72945fcf016c0d92822a`; working tree was clean. Final implementation commit: the commit containing this report (`git log -1 --format=%H -- worker-app/AUTH-WRK-01-report.md`). No push/merge. Only worker-app files changed.

## Audit and resulting behavior

Before: restore trusted cached role; late auth/profile/refresh results could publish after an identity change; daily check-in bypassed its next read with a local boolean; availability ignored response contents and did not hydrate isOnline; job detail treated the daily timestamp as order verification.

After:
- Login/register/Google responses must contain backend WORKER identity and access token. Restore validates `/users/profile`, including refresh if needed, instead of trusting cached role. Existing worker route guard remains. Logout disconnects sockets. Foreground refreshes server identity.
- Session epochs reject obsolete API/auth/profile/refresh responses. Serialized identity writes ensure old storage writes finish before newer identity commits. Client `updateUser` refetches server data instead of granting client-supplied permissions. A rejected refresh credential clears the session; transient network failures retain credentials for retry. Resource 403 remains a denied action rather than logging out a valid worker.
- `/workers/me` hydrates approval/user status/services/online on focus, foreground and reconnect using the existing recovery hook. DRAFT/PENDING/APPROVED/REJECTED are actual schema states; a lock is User.status=BLOCKED, not an invented approval status.
- Draft/rejected workers can edit name/CCCD, choose actual active catalog service IDs, save `/workers/me`, PUT `/workers/me/services`, POST `/workers/me/submit-approval`, and refetch. No local approval grant. Registration skills alone do not create WorkerService rows. No paper/photo verification is claimed from an entered CCCD or OTP wizard.
- Daily selfie POST `/workers/verify-face-daily` is followed by GET `/workers/me`. Validity is a finite, nonfuture timestamp under 24h (current backend policy). Failure/timeout remains retryable failure. No local flag skips verification, and check-in does not automatically switch online.
- Online requires latest profile eligibility, no known active order/recovery error, location permission/current GPS, and matching boolean ACK from PATCH `/workers/status`. Status is refetched afterward. Active-order restore/detail/history/travel/arrival remain on ORD-02/ARC-01 behavior; new offers/acceptance are suppressed while busy or recovery uncertain.
- A daily timestamp is never displayed as order-specific proof. Order Face submission is blocked because the existing API cannot provide reliable separate proof. ARRIVED→start is visibly disabled pending the backend contract. This deliberately limits job execution until the blocker is resolved; the backend FSM is unchanged.

## Backend source findings and blockers (read-only)

1. **Per-order proof missing / shared field.** `server/src/modules/orders/orders.service.js::verifyFace` (POST `/orders/:id/face-verify`, `face-verify-upload`) updates only WorkerProfile.faceVerifiedAt and kycStatus; it does not persist order-scoped verification. `order-workflow.service.js::requireFace` consumes that same timestamp. Neither GET `/orders/:id` nor GET `/workers/me` exposes a distinct order decision. Cannot implement trustworthy order-success restoration or allow start based on daily check-in.
   Proposed contract: order snapshot `verification: { orderId, workerId, status, verifiedAt, expiresAt, verificationId, purpose: 'ORDER', method }`; separately `shiftVerification` with purpose SHIFT; server-issued expiry, identity-match provenance and explicit start gate. Mutation returns/refetches that proof; errors never grant a timestamp.
2. **Daily AI provenance unsafe.** `workers.service.js::verifyFaceDaily` uses `allowFallback:false` in FastApiAiClient, but this only disables the Nest fallback on transport errors. `ai-service/main.py` `/ai/face-verify` itself can return `verified=True, confidence=0.95, engine='heuristic'`, or detection-only `engine='model'` when reference recognition fails. WorkersService accepts boolean/confidence without engine/method proof and returns only faceVerifiedAt. Client cannot distinguish those timestamps from actual identity matches. AC-05 therefore FAIL at full-system policy level even though frontend timeout/rejection handling passes. Backend must reject heuristic/detection-only results, persist identity-match provenance, revoke invalid legacy sessions by policy, and expose trusted decision/expiry. No backend/AI files changed.
3. **Face reference enrollment absent from worker routes.** Daily check-in requires `worker.faceProfile.facePhotoUrl`; registration creates neither FaceProfile nor a reference photo. PATCH `/workers/me` accepts CCCD number, not document/reference upload; avatar is not that registered FaceProfile. Add authorized reference enrollment/upload/review contract. New accounts can submit normal profile approval but may remain unable to check in without administrative provisioning.
4. **Busy/online consistency.** WorkersService.updateAvailability lacks an active-order guard. UI prevents enabling/accepting when an active snapshot exists, but cannot guarantee atomic cross-device eligibility. Server must enforce busy policy transactionally and define isOnline versus available while assigned. No GPS-01/tracking implementation added.
5. **Expiry derived on client.** `/workers/me` has faceVerifiedAt without serverNow/expiresAt; local clock skew and old verification provenance remain limitations. Proposed explicit `valid/expiresAt/serverNow` contract.

## Validation and acceptance

Automated tests are Jest tests with API/camera/location mocks, not live backend/DB/AI or mobile E2E evidence. Source audit confirms backend role/approval guards; no real account or AI was exercised.

| AC | Result | Evidence / limitation |
|---|---|---|
| 01 Worker login/register | NOT_VERIFIED | Automated role/session/registration tests pass; live backend not exercised |
| 02 Reject CUSTOMER/ADMIN Home | NOT_VERIFIED | Service rejects backend nonworker role; existing layout guards Home; device/deep-link E2E absent |
| 03 Approval policy | NOT_VERIFIED | Eligibility + approval API sequencing tests; backend policy audited, no real approval/DB run |
| 04 Restore shift check-in | NOT_VERIFIED | Refetch/expiry tests pass; no real Face/kill/relaunch |
| 05 Failed verification cannot bypass | FAIL | Frontend rejects timeout/missing persisted timestamp; backend heuristic/detection-only success remains blocker 2 |
| 06 Separate order verification | FAIL | No daily→order substitution; reliable order verification unavailable and start intentionally blocked |
| 07 Backend ACK online | NOT_VERIFIED | Permission denied/mismatching ACK tests pass; no real GPS/API E2E |
| 08 Session/order relaunch | NOT_VERIFIED | Restore/stale-response tests pass; force-close on device not performed |
| 09 ORD-02 regression | PASS (automated scope) | Current-order recovery, detail/history, reconnect, denied read, travel/arrival suites pass; start restriction disclosed above |
| 10 Tests/typecheck/build | PASS | Commands/results below; check:build is config validation, not a native binary build |

Final commands:
- `npm run test:ci` from worker-app: 16 suites, 118 tests PASS.
- `./node_modules/.bin/tsc --noEmit` from worker-app: PASS (project TS scope; JSX checked by Jest/Babel where imported).
- `npm run check:build` from worker-app: PASS; development local endpoint fallback enabled.
- `git diff --check`: PASS.

Environment: dependencies initially absent. `npm ci` failed due to baseline package-lock missing/inconsistent transitive Babel entries. `npm install --no-package-lock --no-audit --no-fund` installed local dependencies for validation; package manifest/lock unchanged. A reproducible clean install remains a baseline tooling limitation.

## Files and tests

Application files: auth AuthContext/authService; new sessionEpoch and workerEligibility helpers; new WorkerApprovalForm; apiClient/tokenRefreshHandler; login-worker/register-worker; dashboard; job detail; face screen, result modal and useFaceVerification (no invented confidence score when missing). Existing worker layout/FSM/recovery hook/backend remain unchanged.
Tests: auth/loginWorker/workerSession (server restore and auth races); tokenRefresh (queue, rejected credentials, network error and stale refresh); workerActiveOrder (ORD-02 and permission/ACK); orderFsm (blocked start without order proof); new workerApproval, workerEligibility and shiftVerification suites. This report is also within worker-app.

## Required real-device / integration follow-up

After backend blockers are fixed: Android/iOS worker login/refresh/logout and wrong-role deep links; account A→B during pending requests; offline startup then retry; draft→pending→approved/rejected/blocked; enrollment and real matching/mismatching/reference-unreadable/AI-down tests; check-in return/refocus/relaunch and 24h boundary with clock skew; camera/GPS denied and settings changes; online ACK loss/reconnect; active-order relaunch in every nonterminal state; per-order proof and start gate with the same orderId. Preserve shared database: no seed/reset/migration or live mutation tests were run.
