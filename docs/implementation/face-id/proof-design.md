# Daily versus per-order proof — PARTIAL / storage BLOCKED

Pure session assessment and random 256-bit nonce/hash generation are implemented and
unit tested. Binding covers user, worker, purpose, order, template and model versions,
finite score, identity method, quality, PAD, expiry, consumption and template revocation.
Passing policy returns ELIGIBLE_FOR_ATOMIC_CONSUMPTION, never a proof or authorization.
Synthetic PAD PASS exists only in tests to exercise the policy; production AI always
reports NOT_EVALUATED. No memory store or mock-success API has been introduced.

Daily/per-order capture intake now rejects BEFORE multipart storage using a guard.
Nest HTTP tests verify storage is never called. Existing order ownership guard remains
before capture blocker; services retain assigned-worker/stage checks. Workflow gates
continue to reject all legacy timestamps. No FSM transition or wallet logic was changed.

Durable issuance/atomic consumption and cross-instance idempotency await the additive
schema proposal. Do not confuse pure predicate tests with actual database concurrency
validation. Proposed TTLs and transition integration are in database-proposal.md.
