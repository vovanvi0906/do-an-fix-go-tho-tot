# Face Core v2 — executed test report, 2026-11-13

Commands from repository root:

```sh
node server/test/face/run-isolated.cjs
npm --prefix server test -- --runInBand --silent face- workers.service orders.service order-transition.validator
npm --prefix server run build
npm --prefix worker-app run test:ci -- --silent
```

## PostgreSQL integration

30 tests PASS on real PostgreSQL16/PostGIS3.4. Docker image
postgis/postgis:16-3.4, observed digest
sha256:44126d872ac91993766c341e369c539e8196614321765d36a6f1bab0419a5fa5.
The harness creates a unique disposable container, random loopback port, isolated
fixgo_face_test DB and dedicated synthetic-only user. It NEVER falls back to project
DATABASE_URL or reads the app .env; test client URL/current_database are guarded. No
mounted project data/volumes. Container/temp files removed in finally after each run.

Baseline is declared schema at f6737fd, generated offline to SQL; spatial_ref_sys belongs
to PostGIS, so its duplicate CREATE is excluded in fixture bootstrap. New migration SQL
runs in a transaction. After tests the destructive isolated rollback preserves legacy
user row count, migration reapplies successfully. Historical migration-chain drift is
explicitly unresolved for the project DB; no assertion of project deploy readiness.

Coverage: encrypted template/actual PG trigger; Admin review vs professional approval;
no-runtime-PAD/data-policy blocking; concurrent request idempotency and enrollment;
wrong worker/order/nonce, changed replay payload; timeout/late result/retry budget;
PAD failure/uncertainty and invalid score/method/provider/version; daily/order separation;
concurrent start commits once; FSM failure rolls back consumption/audit/status; expiry
by PG time; withdrawal vs in-flight inference; re-enrollment version increment; two-service
instance quotas; retained-key rotation/missing key; second-order reuse; Admin transition
permission/audit; wrong durable template version and blocked-worker proof authorization. Actual Nest HTTP review/consent/session/
multipart/enrollment/daily/order/withdraw also exercised on PG.

The successful evidence gateway is a test-only synthetic fixture, injected through test
module/service construction. It is not a live model, PAD implementation or runtime flag.
HTTP authentication is a test seam selecting synthetic users; real RolesGuard and all
service ownership/authority checks run. Full real JWT login/bootstrap is not tested here.
This is end-to-end BACKEND PROTOCOL testing, not end-to-end biometric security validation.

## Other checks

- Backend relevant unit/HTTP suites: 113 tests / 8 suites PASS.
- Worker full Jest suite: 136 tests / 18 suites PASS (native camera/Expo APIs mocked).
- Backend Babel build PASS. Prisma format/generate succeeded with explicit offline URL;
  no database used for those commands. Dependencies installed locally without scripts;
  existing Firebase dependencies warn Node>=22 while environment is Node20. Full app boot
  and dependency upgrade are outside this change.
- git diff --check PASS; no v2 changes in AI/Customer recommendation sources.
- Previous AI Face/PAD tests remain the 15-test synthetic module/ASGI baseline; AI source
  is unchanged in v2 and no model inference or weights download was performed.

Biometric FMR/FNMR/TAR, APCER/BPCER/ACER, Android latency p50/p95, camera/PAD attacks:
NOT MEASURED. Synthetic .8 scores and test provider PASS are protocol fixtures only.
No Android build/physical device, real participant, live identity document or project DB
was used. No security PASS or production rollout readiness is asserted.
