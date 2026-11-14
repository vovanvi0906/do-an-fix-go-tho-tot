# FaceID Lab — UI/UX redesign (dashboard)

Branch: `integration/ai-testing-labs` · Scope: `ai-faceid-lab/` only (presentation layer).
Engine, backend, AI service, Prisma, PAD policy, JWT guards and API contracts are **unchanged**.

## Evidence

| | Path |
|---|---|
| Before (old UI, 1366 px desktop / 412 px Pixel 7) | `docs/ai-labs/evidence/faceid-lab-ui-03/before/*.png` + `playwright-results-old-ui.json` |
| After (new UI, 1440 px desktop / 390 px mobile) | `docs/ai-labs/evidence/faceid-lab-ui-03/after/*.png` + `playwright-results.json` |

Matching pairs: `01-connection`, `02-enroll-core-blocked`, `03-enroll-research-camera-not-uploaded`,
`04-enroll-research-no-face`, `05-pad-inspector`, `06-identity-inspector`, `07-daily-negative`,
`08-daily-expired` (after only; the old run timed out first), `09-order-negative`, `10-session-proof-inspector`,
`11-camera-denied`, `12-no-camera`, `13-offline`, `14-timeout`, `15-requests`. New: `00-not-connected`,
`00-connection-dialog`, `16-test-scenarios`.

## Layout

```
┌ Sidebar ─────┬ Topbar: title · env tag · Backend/AI/Database/PAD pills · Research|Face Core · Connection ┐
│ Overview     ├──────────────────────────────────────────────────────────────┬───────────────────────┤
│ Workflows    │ Main: view header                                            │ Inspector rail        │
│  Enrollment  │   context cards (consent/template · daily proof · order ID)  │  Face Detection       │
│  Daily       │   Stepper (Pending/Active/Success/Rejected/Blocked/Error)    │  Quality              │
│  Order       │   ┌ Camera stage 16:9 ─────────┐ ┌ Result + next action ┐  │  PAD score + policy   │
│ Inspectors   │   │ live/upload chips, guide   │ │ 1·Session            │  │  Identity similarity  │
│  PAD/Identity│   │ capture · thumbs · quality │ │ 2·Gửi                │  │  Session / Proof      │
│  Session/Prf │   └────────────────────────────┘ │ Kiểm thử âm tính     │  │                       │
│ Testing      │                                   └──────────────────────┘  │                       │
│  Scenarios   ├──────────────────────────────────────────────────────────────┴───────────────────────┤
│  Debug/Req   │ Debug drawer: 10-dot strip · stop code · latency · last request │ Timeline · Requests · Correlation │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────────┘
```

Responsive: ≥1280 px three columns; 1024–1279 px rail moves below main; 761–1023 px icon-only sidebar and
camera full width; ≤760 px sidebar becomes a horizontal strip, stepper 2×N grid, Connection dialog full-screen.

## Component structure

```
src/
  App.tsx                       shell, state (unchanged handlers), health derivation, view routing (#/view, no secrets)
  styles.css                    dark tokens, 8px spacing scale, semantic tones, breakpoints
  lib/workflow.ts  (new)        pure: stepper steps + run outcome derived from the backend timeline
  lib/guidance.ts  (new)        "next action" text per code (never suggests bypassing a gate)
  lib/workflow.test.ts (new)    12 tests: step lists, BLOCKED≠FAIL, PAD_NOT_EVALUATED, research no-authority…
  components/
    Icon.tsx, ui.tsx (new)      icon set; Badge, Card, ActionButton (+disabled reason), Hints, Kv, Meter, Empty
    Stepper.tsx, ResultCard.tsx (new)
    FlowPanel.tsx               same logic/labels; stepper + camera + cards; timeline portaled to drawer
    Camera.tsx                  camera stage: chips, guide, error/permission state, thumbs, quality row
    TimelineView.tsx            restyled; TimelineHost context + MiniStrip
    Inspectors.tsx, Trials.tsx  restyled cards, same content
    layout/ Sidebar, Topbar, ConnectionSettings, InspectorRail, DebugDrawer (new)
    views/  Overview, TestScenarios (new)
```

## Feature parity (nothing removed)

| Old | New location |
|---|---|
| 4 token fields + mode radios + capability/status/erase/clear buttons | Connection Settings dialog; mode switch in topbar; capability/status cards on Overview |
| A/B/C tabs | Enrollment / Daily Verification / Order Verification |
| D/E inspectors, Session/Proof Inspector | Sidebar → Inspectors (+ summary in rail) |
| PAD trials + export | Test Scenarios (+ negative-test catalog) |
| Requests | Debug/Requests (full table + last-run summary) and drawer “Requests” tab |
| Debug timeline (10 stages) | Bottom Debug drawer, same `data-stage`/`data-status` markup |
| Negative tests (nonce, other worker, foreign order, retry requestKey) | “Kiểm thử âm tính” card in each workflow |

## Tests

| Check | Result |
|---|---|
| `npm test` (vitest) | **82/82 pass** — the original 70 unchanged and passing, +12 new workflow tests |
| `npm run typecheck` / `npm run build` | pass |
| Playwright, isolated stack (`./dev-local.sh faceid`, disposable PostgreSQL) | **24/24 pass** (12 desktop 1440 px + 12 mobile 390 px), `after/playwright-results.json` |
| Before (old UI, same stack) | 20/22; the 2 failures were the daily-expiry test timing out (TTL 120 s > 90 s test timeout). Fixed in the spec with `test.setTimeout(sessionTtlMs + 90 s)`. |

E2E covers: token entry (password fields, dialog focus/Escape), enrollment (Face Core consent →
BLOCKED by data policy + PAD; withdraw), research camera capture **not uploaded** (no `/capture` request),
synthetic NO_FACE + inspectors, daily negatives + real expiry, order ownership/not-ARRIVED + inspector scope,
camera permission denied, no camera API, offline, 504 timeout, every section without horizontal overflow,
no tokens in page text/URL, empty storage/cookies.

## Accessibility / UX checklist

- [x] Status = colour + icon + text everywhere (badges, stepper, timeline, pills).
- [x] BLOCKED (gate/policy, incl. PAD NOT_EVALUATED) visually and verbally distinct from REJECTED (evaluated, not met) and ERROR (technical); legend in each workflow.
- [x] Disabled buttons: `title` + visible hint list (`aria-describedby`) with the reason and next step.
- [x] Result card is `role=status` (polite); only real errors use `role=alert`.
- [x] Dialog: `aria-modal`, labelled, focus moved in, Tab trapped, Escape closes, focus returns to opener.
- [x] Skip link, `aria-current` on nav, landmarks (nav/header/main/aside/drawer region), visible focus ring.
- [x] `prefers-reduced-motion` honoured; touch targets ≥36 px (40 px in mobile nav).
- [x] No horizontal page scroll at 390 px and 1440 px (asserted in E2E).

## Security invariants (unchanged, still enforced)

- Tokens only in React state; `security.test.ts` still bans storage/cookies/console/file inputs/data URLs.
- No tokens in URL: the view hash is `#/<view>` only (asserted in E2E). The nonce is masked and is not passed to the shell (`FlowState` omits it).
- Camera frames are sent only from `FlowPanel.submit`, after the existing `researchCameraAllowed` check; the UI shows “Upload: blocked” and the stepper marks Capture BLOCKED.
- No success is simulated: stepper and result are pure projections of the backend timeline. Research MATCH is shown as *Measured*, never Success; PAD NOT_EVALUATED maps to Blocked.

## Known limitations

- Database health is inferred from successful backend responses (the Lab has no DB endpoint and shouldn't get one).
- Face detection overlay exists only on the captured image after a research measurement (Identity Inspector). There is no live detection, because the Lab doesn't run models in the browser.
- The quality indicators under the camera come from the last server measurement. The Lab doesn't estimate quality client-side.
- Face Core success responses carry no per-stage scores, so the rail shows “Face Core không trả chi tiết detection”.
- Dark theme only. Collapsed drawer on mobile is a sticky 48 px bar.
