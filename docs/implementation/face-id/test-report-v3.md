# Binding audit and real-model smoke — executed tests, 2026-11-13

| Check | Actual result |
|---|---|
| PostgreSQL integration | 64 tests PASS, including previous 30 protocol/race tests and new direct-DML binding/lifecycle/replay cases |
| v2 hard-delete reproduction | SET NULL/CHECK failure reproduced, delete rolls back |
| Invalid v2 -> v3 rehearsal | Migration rejects invalid row atomically, old FK and source row remain; no auto-repair |
| ORM/catalog | Isolated Prisma diff empty; Order RESTRICT rules and seven custom trigger names verified |
| Rollback/reapply | v3 -> v2 retains template row count; v3 reapplies; full disposable cleanup retains legacy user count and reapplies both |
| Relevant backend Jest | 119 tests / 9 suites PASS |
| AI Face modules/ASGI and actual models/HTTP bridge | 19 tests PASS |
| PAD boundary contract | 2 tests PASS (no PAD weights/provider) |
| Backend Babel build | PASS, 143 files |
| Source boundaries | Original v2 migration unchanged; 13 non-lifespan main.py functions/classes unchanged; Customer/CLIP bootstrap unchanged |

Reproduce from repository root:

```sh
node server/test/face/run-isolated.cjs
npm --prefix server test -- --runInBand --silent face- workers.service orders.service order-transition.validator
npm --prefix server run build
# Explicit approved LOCAL directory; tests never download/discover weights automatically:
FACE_TEST_MODEL_DIR=/approved/readonly/face-weights python -m unittest discover -s ai-service/eval -p 'test_face*.py'
python -m unittest discover -s ai-service/eval -p test_pad_contract.py
```

Execution used the existing main-worktree Python environment/local weight directory and
local backend dependencies. Real-model tests skip without explicit FACE_TEST_MODEL_DIR;
the reported run supplied it, so the real-model and loopback transport tests ran, not skip.
Inputs were synthetic blank/noise only, no photos/people. Test gateway PAD PASS appears
only in PostgreSQL protocol fixtures; production gateway and AI still report unavailable
PAD and never release an enrollment embedding on that basis. Synthetic success is not
biometric/PAD evaluation or security PASS.

PostgreSQL harness provisions/removes its own random-loopback disposable container;
never uses project DATABASE_URL. Read-only project snapshot/history reconciliation was
only proposed, not executed. No real biometric data, current DB migration, model download,
push/merge/reset/rebase, FSM rule or recommendation changes. Worker UI was unchanged in
this audit; its previous 136-test report is historical and was not rerun as new validation.

Limitations: no valid portrait/genuine/impostor experiment, no licensed/evaluated PAD,
no end-to-end successful real-face enrollment, no physical Android/device/camera attack
QA, no measured biometric or PAD rates/latency. Private transport/resource quotas, KMS,
participant/retention policy and project-schema compatibility still require approval.
