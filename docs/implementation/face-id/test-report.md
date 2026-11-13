# Test report — 2026-11-13

## Executed

| Check | Result | Scope |
|---|---|---|
| Nest Jest: face-, workers.service, orders.service, order-transition.validator | 8 suites / 113 tests PASS | Mock DB; synthetic vectors; HTTP capture guard tested before storage |
| Worker App complete Jest suite | 17 suites / 128 tests PASS | JS/RN mocks, not device tests |
| Focused Worker face/eligibility/dashboard/screen | 4 suites / 31 tests PASS | Consent, pending, daily/order separation, no gallery/upload, legacy rejection, retry/cancel/foreground restore |
| AI test_face_security.py | 13 tests PASS | Imported production matcher and isolated real ASGI router; synthetic pixels/vector, stub models |
| AI test_pad_contract.py | 2 tests PASS | Default never passes; evaluated-decision provenance required |
| Backend Babel build | PASS, 135 files | No database startup or migration |
| Audit SHA-256 | 34/34 copied files equal source and manifest | All evidence included |
| Customer preservation source check | 13 non-face function/class ASTs unchanged vs 4edb191 | Lifespan excluded: face-only hash metadata added |
| git diff --check | PASS | Whitespace/conflict-marker check |

Commands from repository root:

```sh
npm --prefix server test -- --runInBand --silent face- workers.service orders.service order-transition.validator
npm --prefix server run build
npm --prefix worker-app run test:ci
npm --prefix worker-app run test:ci -- shiftVerification workerEligibility workerActiveOrder faceScreen
# Use Python environment with existing requirements plus test-only httpx for TestClient:
python -m unittest discover -s ai-service/eval -p test_face_security.py
python -m unittest discover -s ai-service/eval -p test_pad_contract.py
```

Execution used existing main-worktree ai-service/.venv and backend node_modules
(read through a temporary symlink, removed after checks). Worker dependencies installed
locally with `npm ci --ignore-scripts --legacy-peer-deps --no-audit --no-fund`;
plain npm ci rejected legacy peer lock resolution, while this flag succeeded without
changing package.json/package-lock.json. No model weights were downloaded.
Full Worker suite emits existing AuthProvider/Animated act warnings; focused new face
suite passed cleanly after proper AppState mock/animation cleanup. An initial vector
Jest.each fixture expansion was fixed; final encryption tests pass.

Coverage includes invalid/missing reference/template/model, multiple/no faces,
lighting/blur, alignment/embedding/score failures, MATCH/NON_MATCH, different thresholds,
service auth/JSON/size, backend timeout/wrong worker/provenance, legacy gate rejection,
role/account status, no avatar substitution, AES-GCM tampering/key/context binding,
nonce/expiry/purpose/order/version/revocation policy and manual-review non-grant.
Synthetic PAD PASS only exists in policy tests, never in a runtime provider.

## Not executed / not established

No current or test database was connected. No actual transactional consumption,
concurrent update, idempotency unique-constraint, template reset-race or rollback test.
Pure policy/predicate tests do not prove database atomicity. No real face/identity
reference read; no genuine/impostor benchmark; no print/screen/video PAD measurement;
no Android build/device camera, accessibility or injection test. FAR/FMR, FRR/FNMR,
TAR, APCER/BPCER/ACER, end-to-end latency p50/p95: NOT MEASURED.
Unit/HTTP tests passing do not establish biometric security PASS or production readiness.

## Source reconciliation and commits

- a3cbc21: exact audit/evidence sync and SHA-256 manifest.
- 1cb5f8d: selected 803ec32 Face ID hotfix, no merge/source copy.
- 2cc5938: enrollment capability/preflight and encryption primitive.
- 813640a: separate matcher/router, quality/version/auth and strict transport.
- 12dbd5d: nonce/scoped proof policy, pre-storage capture gate, database proposal.
- faaed86: unavailable PAD boundary and upstream review/evaluation protocol.
- c275a15: Worker blocked-state flows and legacy proof removal.
- Final validation commit: stricter runtime DTO/Swagger/envelope, actor status checks,
  face hash failure isolation, additional HTTP/validation tests and final reports.

integration/fixgo-sprint-02 still points to 803ec32 at final inspection. No merge,
push, reset, rebase or database mutation performed. Generic AiService hotfix from
803ec32 remains an integration prerequisite outside owned source scope.
