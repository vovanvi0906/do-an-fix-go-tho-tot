# FixGo Worker FaceID Lab

Standalone React + TypeScript + Vite web app for testing, debugging and evaluating Worker FaceID
**before** it is integrated into the Worker App. Dev/staging only. The Lab cannot issue FaceID proofs.
Every gate is decided by the backend.

Full report: [`docs/ai-labs/faceid-lab-report.md`](../docs/ai-labs/faceid-lab-report.md).

Quickest start, from the repository root. This starts an isolated stack plus the web lab in the background:

```sh
./dev-local.sh faceid            # preflight, start, health check, prints the real URL + token file path
./dev-local.sh faceid --status   # processes, ports, health, PAD/proof policy
./dev-local.sh faceid --stop     # stops only what the launcher started
```

Configure the model paths and ports with `FACE_LAB_*` variables or in `.faceid-lab.local.env` (git-ignored). Run `./dev-local.sh faceid --help` for the list. Details are in [docs/ai-labs/faceid-dev-launcher-report.md](../docs/ai-labs/faceid-dev-launcher-report.md). To run Playwright against the launcher-served lab: `FACEID_LAB_BASE_URL=<printed URL> FACEID_LAB_FIXTURES=<printed path> npx playwright test`.

Manual commands:

```sh
npm ci
npm test          # vitest (unit + component, jsdom)
npm run typecheck
npm run dev       # http://127.0.0.1:5199 (loopback only)
```

Browser E2E (real Chromium, fake camera = synthetic pattern, isolated stack):

```sh
# terminal 1: real research models + real Face Core on disposable PostgreSQL (ports 3107/3118)
FACE_RESEARCH_SOURCE_MODEL_DIR=<weights dir> FACE_RESEARCH_RUNTIME_DIR=$HOME/.cache/fixgo-pad-mn3 \
FACE_LAB_SESSION_TTL_MS=20000 node ../server/scripts/face-lab/lab-stack.cjs
#   prints {"ready":true,"pid":…,"fixturePath":…}; stop with: kill -INT <that pid>
# terminal 2:
FACEID_LAB_FIXTURES=<fixturePath> npx playwright test   # Playwright 1.65.1 ↔ Chromium build 1255
```

The dev proxy forwards `/face-research` → `FACEID_LAB_RESEARCH_URL` (default `http://127.0.0.1:3107`)
and `/api` → `FACEID_LAB_API_URL` (default `http://127.0.0.1:3000`; the lab stack uses `3118`). Both targets must be loopback.

Data rules enforced in code and by `src/lib/security.test.ts`:

- Tokens and frames are held in memory only. No localStorage, sessionStorage, IndexedDB or cookies.
- No console logging, no file upload input and no data-URL encoding of frames.
- The client never sends a `workerId`. Identity always comes from the JWT on the server.
- Camera frames are not sent when the research service has not approved capture.
- Trial export contains only the `face_metrics.py` whitelist: scores, outcomes and latency.
