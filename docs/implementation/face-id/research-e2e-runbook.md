# FACE-RESEARCH-E2E — isolated lab

This is a measurement lab, not another production Face Core implementation. Neither the standalone Nest app nor standalone FastAPI app is imported into the existing applications. No Recommendation/FSM/project DB changes. Default capture approval is false at both services. No template, enrollment success or daily/order proof can be issued by these research routes, even after camera collection receives separate approval.

## Execution and evidence

- [Executed E2E checks](research-e2e-results.json): actual Android **client module**, real Nest TCP server, actual FastAPI TCP server and pinned YuNet/SFace/MN3 loaded. PostgreSQL is a newly owned container. A blank, server-generated PNG traverses this chain and produces NO_FACE. SFace/PAD are correctly not called on a missing face.
- `smoke_research_components.py` additionally executes actual SFace alignCrop/feature/cosine and actual MN3 on random texture. Landmark input is an explicit synthetic fixture, **not a real YuNet detection**. This is component plumbing, not positive end-to-end face validation or an accuracy trial.
- Python pipeline/API tests use explicit detector/recognizer/PAD stubs for positive branch/error/crop assertions; they are not metrics. MN3 missing/checksum/NaN/timeout tests remain separate.
- No Android device was attached (`adb devices` empty). Camera UI/lifecycle tests run in Jest. Do not report physical Android validation as completed.

## Start an interactive synthetic lab

Prerequisites: Docker, existing `server/node_modules`, Prisma client, `worker-app/node_modules`, Python3.11 Docker image; existing pinned YuNet/SFace directory; external PAD artifact and isolated venv from the technical experiment. No model download fallback. Venv includes OpenVINO, ONNX Runtime, numpy, OpenCV, Pillow, FastAPI, uvicorn and httpx; [exact lab lock](research-runtime-requirements.lock). Nothing is installed into the running AI environment.

```sh
FACE_RESEARCH_SOURCE_MODEL_DIR=/home/vanvi/Work/do-an-fix-go-tho-tot/ai-service/weights \
FACE_RESEARCH_RUNTIME_DIR=/home/vanvi/.cache/fixgo-pad-mn3 \
node server/scripts/face-research/test-e2e.cjs --serve
```

The command first runs the synthetic checks, then keeps the lab at `http://127.0.0.1:3107`. It prints paths to private config and synthetic account fixtures, **never token values**. Config/fixture files live in a mode0700 temporary directory and are mode0600. Use the fixture's research token locally in the app; do not paste it into issues/logs. Token audience `fixgo-face-research`, issuer is the lab's random environment ID, HS256 key is independent of project JWT, expiry2h. Restart lab to renew. No real account/login/production token is accepted.

```sh
adb reverse tcp:3107 tcp:3107
adb reverse tcp:8087 tcp:8087
# In worker-app/, use the independent research configuration:
FACE_RESEARCH_APP=true EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 \
  node node_modules/expo/bin/cli start --dev-client --localhost --port 8087
# Open fixgoresearch://face-research in the matching research development build.
```

Alternative emulator address is `http://10.0.2.2:3107`; prefer adb reverse. Research client accepts only loopback/emulator URLs with explicit ports. It has no project refresh interceptor, remote logger or persistent token storage. The research application ID is `com.fixgo.faceresearch`, scheme `fixgoresearch`, entrypoint `expo-router/entry` with router root `research-app/`. The production `app/` root is excluded. This root never loads the Worker AuthProvider, project sockets, account storage, Firebase or remote logger. It does not require production login. The standard Worker variant keeps its existing application ID and configuration. A matching research native development build is required; an existing `com.fixgo.worker` APK is not that build. No APK was built or installed in this phase. Do not run native prebuild over a normal Worker's generated Android project: use a separate disposable native build workspace and verify its application ID before installation.

Select ENROLLMENT/DAILY/ORDER; ORDER uses `orderId` from private synthetic fixtures. Click synthetic measurement; **camera remains disabled**. Pressing synthetic does not send photo data; FastAPI creates blank pixels itself. Observe identity/PAD scores null with NO_FACE, model hashes, quality and timings. Never interpret this result as verification success.

Ctrl+C removes the owned AI/container/network/database and private config directory. Without `--serve`, teardown is automatic in `finally`. Never point preparation at an existing DB. A separate `prepare.cjs <private-config-path>` / `start.cjs <private-config-path>` is available for an operator-managed lab; the former always creates its own database, while the latter only accepts an explicit random research DB name/loopback port and matching marker. No `.env`/DATABASE_URL fallback.

## Isolation and database

Runner owns `fixgo-face-research-<random>` PostgreSQL/PostGIS and an AI container on a Docker **internal network without internet egress**. A host loopback TCP proxy reaches the AI container. Models and source mount read-only; AI root FS read-only with tmpfs `/tmp`, CPU quota2 and memory1GiB. Nest binds loopback only; Android accesses it through adb reverse. The running project AI service is not started, stopped or modified.

PostgreSQL bootstrap applies a baseline derived from committed `f6737fd`, then exact v2 and v3 SQL. It verifies empty Prisma schema diff before adding the **separate research schema**. `server/scripts/face-research/schema.sql` is lab-only, not a project migration and not proposed for production. It holds an environment marker plus durable session rows (no images/embeddings). Application tables v2/v3 stay unchanged; no `_prisma_migrations` history reconciliation or production metadata operation occurs.

Synthetic worker/admin/review/customer/order fixtures are clearly labeled; a synthetic review is not evidence any person has been identified. No existing FixGo records are read. All auth tokens and IDs are for this owned DB only.

## API contract

All Nest routes use `Authorization: Bearer <research JWT>`:

| Route | Input | Behavior |
|---|---|---|
| GET `/face-research/capabilities` | none | Always `proofAllowed=false`, `padEvaluated=false`; camera false unless separate protocol + participant consent/review + both service gates are configured |
| POST `/face-research/sessions` | `purpose`, UUIDv4 `requestKey`, `orderId` only for ORDER | Durable worker-bound idempotent session, HMAC nonce, TTL120s |
| POST `/face-research/sessions/:id/synthetic` | `nonce` only | No client media accepted; real inference on server-generated blank PNG |
| POST `/face-research/sessions/:id/capture` | header `x-research-nonce`, multipart `image`, optional `reference` | Denied before multipart parsing without approved collection and participant records; JPEG/PNG, max5MiB/file, max2files |
| DELETE `/face-research/sessions` | none | Deletes authenticated worker's measurement/session rows; UI deletes camera cache |

Worker resolved from JWT subject plus database profile, never client workerId. ORDER requires assigned ARRIVED order in the research DB. Rechecks ownership/expiry on completion. Nonce binds ID/user/worker/purpose/order/expiry. Same request key/scope returns same session; changed scope conflicts. Capture retries return persisted result only for identical digest. Row locks/claim ID prevent duplicate inference. Max3 attempts/session,5 attempts and5created sessions/15min; deletion removes history, so this is a local lab resource limit, not an abuse-resistant public service quota. Do not expose the server publicly.

Nest → FastAPI uses a separate ≥32-character secret, bounded JSON/response body, real HTTP timeout/abort. FastAPI requires explicit isolated mode. Shared model mutations serialize; concurrent inference is rejected busy rather than queued indefinitely. Model CPU request timeout remains fail-closed. Error responses never release embeddings or grant authority.

Results: `researchOnly=true`, `verified=false`, `enrolled=false`, `proof=null`, separate identity cosine or null, PAD real/spoof scores or null, quality/face count/brightness/sharpness, identity/PAD/crop/preprocessing/policy versions, per-stage latency, session purpose/order. PAD always NOT_EVALUATED. A high real score is not a PAD PASS; identity is MEASURED rather than MATCH until evaluation approves a policy.

## Crop and camera semantics

One YuNet face, finite detection, confidence≥.6, bbox within image, min dimension80px. Tight bbox uses floor left/top and ceil right/bottom, clamped to image, then INTER_LINEAR resize128×128 BGR uint8. No SFace-aligned crop is reused for PAD. This is **research crop policy v1**, to compare/validate on consenting data; not claimed as upstream optimal or calibrated. Quality defaults are provisional. Scores can still be recorded on quality failure, clearly tagged FAIL, because this is measurement only.

SFace uses YuNet landmarks with alignCrop, validates a finite nonzero128-vector, compares transient vectors. Embeddings stay in process memory and never enter HTTP responses/DB/logs. Enrollment mode measures a single capture and discards its feature. Daily/order research mode captures **two live camera images in the same session** for reference/probe comparison; it does not silently use an avatar or claim a persisted trusted enrollment template. Persisted enrollment→verification remains blocked by the evaluated-PAD gate; this paired mode prepares measurement without granting enrollment.

Camera code is implemented for the future approved phase: session before camera, front camera only, no gallery/editing, no EXIF request, session expiry rechecked after return, background/unmount cancellation, local cache cleanup, nonce-bound retry. UI never runs `onSuccess` for production or writes legacy timestamps. Cache deletion failures are surfaced and require stopping/clearing app data; JS deletion does not promise forensic erasure of flash. Android platform/plugin behavior, image orientation and actual cache cleanup still need physical-device validation.

## Before any participant capture

Do **not** enable capture flags for a demo. Requires separate approval of [consent/Android pilot](consent-and-android-pilot-draft.md), named controller/contact, dates, storage/key custody and deletion verification. Both services need approved protocol reference; Nest additionally requires participant consent reference/version/expiry and an active Admin review matching current biometric state epoch with recorded, nonwithdrawn consent. There is no public endpoint to self-approve or generate these records. Research JWT fixture accounts are not consenting people.

No raw media is stored server-side by this lab. Two camera captures exist transiently on Android and during requests; DELETE/unmount clears local files and server measurements. Process/container teardown clears runtime data; persistent experimental exports/backups must be inventoried separately. See the consent appendix for limitations and proposed retention. Metrics remain blocked until approved ground-truth trials exist.

## Verify configuration and bundle before Android installation

From `worker-app/` (these commands do not create an Android native project):

```sh
FACE_RESEARCH_APP=true EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 \
  node node_modules/expo/bin/cli config --type introspect --json > /tmp/fixgo-face-research-expo-config.json
FACE_RESEARCH_APP=true EXPO_NO_DOTENV=1 EXPO_OFFLINE=1 \
  node node_modules/expo/bin/cli export --platform android --source-maps \
  --output-dir /tmp/fixgo-face-research-android-verified
node scripts/verify-research-export.cjs /tmp/fixgo-face-research-android-verified \
  /tmp/fixgo-face-research-expo-config.json /tmp/fixgo-face-research-android-verification.json
```

The verifier checks the introspected native manifest package, scheme/router root, presence
of research modules and absence of production `app/`, auth, account storage, API client,
socket.io/Firebase and remote logger in the **actual Hermes source map**. See the
[committed verification result](research-android-export.json). This verifies JS graph and
configuration, not native runtime startup or camera behavior. No custom Metro config is
needed: installed Expo Router reads `extra.router.root`; normal `app/` root remains the default
when `FACE_RESEARCH_APP` is not true. Keep dotenv disabled so research builds cannot inherit
project API settings accidentally. Do not publish this build or point it at a project DB.

Checklist and boundaries: [Android research checklist](research-android-checklist.md).

Architecture boundary: [research architecture](research-architecture.md). Metro startup/Android manifest was checked locally; native Activity startup remains untested.
