# Worker flow and physical Android QA — PENDING

Current flow when schema/feature is enabled: Admin professional approval + identity
review API → Worker enrollment screen records consent → backend scoped session → front
camera → memory upload → backend inference/finalization → refetch persisted template.
Daily screen uses separate DAILY session/proof. Job detail at ARRIVED uses ORDER session
and reads orderProof by authenticated orderId; start button calls normal status API,
whose server transaction checks and consumes proof with all existing ARC-01 prerequisites.
Upload/local navigation flags never enable work. Daily proof does not satisfy an order.

Runtime gateway currently reports PAD_NOT_EVALUATED and data capture is not approved,
so camera stays unavailable. No gallery option. Schema/flags alone cannot fake PAD.
Consent/review metadata may be tested with synthetic records on isolated DB; physical
face collection is still forbidden until policies/people are approved.

Withdrawal requires explicit UI confirmation, calls DELETE template, then refetches
status. It erases v2 ciphertext and revokes sessions/proofs. Reset is Admin-reviewed;
no self-service approval queue/Admin screen exists. Enrollment success is shown separately
from daily/order verification success. Failed network retry keeps the request key/
nonce/capture for idempotency; expired sessions require a new capture. Back cancels local
requests; returning/refocusing refetches backend state. No local proof/image persistence.
Ordinary background clears ephemeral capture; native camera Activity is handled separately
so OS camera transitions do not discard a legitimate capture. Device behavior needs QA.

- [ ] Isolated Android debug build/test accounts; no real participants without approval.
- [ ] TalkBack, large text, checkbox/consent policy, pending/error announcements.
- [ ] Permission denied/permanent denial, camera cancel, native camera Activity lifecycle.
- [ ] Correct enrollment/daily/order context and scope; no gallery/substitution.
- [ ] Timeout/retry retains same idempotency key, successful readback bound to same proof.
- [ ] Expired session/proof, quota, reset during inference and account switching.
- [ ] Offline/background/kill/relaunch/refocus fetches current backend proof, no local success.
- [ ] Withdrawal confirmation, server ACK, ciphertext erasure and disabled online/start state.
- [ ] ARRIVED proof only; wrong-order proof does not enable start; failed BEFORE/quote check
      keeps proof unconsumed; successful start shows refreshed server status.
- [ ] Logs contain no images/vectors/secret headers/private evidence/capture payload.
- [ ] After PAD/data approval: quality feedback, consented genuine/impostor and authorized
      print/screen/video tests; report per device/attack. Injection is separate from PAD.

Jest/Nest/PostgreSQL success is not physical Android or biometric security PASS.
