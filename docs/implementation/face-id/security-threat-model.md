# Security threat model and residual risk

Assets: identity linkage, templates, consent, fresh sessions, scoped authorization,
order transition integrity, private captures and metadata audit.

| Boundary / threat | Implemented control | Residual / release blocker |
|---|---|---|
| Mobile impersonation | JWT + WORKER guards; status service rechecks ACTIVE WORKER | Full device/account takeover and step-up reset policy |
| Avatar substitution | No avatar reference; legacy templates quarantined | Reviewed identity evidence authority and provisioning |
| AI unavailable/detection-only/nonfinite | Strict outcomes, finite embedding/score, no fallback pass | Real model and domain evaluation |
| AI endpoint spoofing | Face-only shared secret, finite/provenance validation, bounded Nest fetch | Private TLS/network, key custody/rotation, gateway quotas |
| URL/path injection | Face decoder accepts bounded inline JPEG/PNG only | Image parser dependencies, OS/memory isolation and resource budget |
| Shared mutable detector | Process lock around detect/alignment/matching, threadpool offload | Authenticated request queue quotas/CPU profiling |
| Multiple faces / low image quality | Exact one face, crop/size, light/blur gates | Pose/occlusion and quality calibration not evaluated |
| Print/screen/video | NOT_EVALUATED, capture/proof issuance blocked | Approved licensed PAD and held-out device/attack evaluation |
| Request/result replay | Nonce/TTL/binding/consumed-state pure policy; no issuer enabled | Durable sessions, attempt quotas, fresh capture binding |
| Two start requests / wrong order | Existing ownership/FSM + all legacy proof gates reject | Transactional proof consumption, concurrency/idempotency tests on isolated DB |
| Template tampering/swapping | AES-GCM utility binds worker/version/model, synthetic tests | KMS, encrypted storage integration, access audit and retention |
| Unnecessary image collection | Public face guards reject BEFORE Cloudinary storage | Future approved enrollment temporary private object lifecycle |
| Manual review failure | No auto KYC/proof grant on AI failure; preflight never queues fake request | Real reviewed identity/re-enrollment/withdrawal workflow |
| Logging | New code logs no captures/vectors/private URLs or exception content | Persisted actor/action/reason audit and wider legacy logger review |
| Camera hook/deepfake | No claim; no success path through unevaluated capture | Separate capture integrity/attestation threat model, adaptive attack research |

The encryption primitive alone is not production secure storage. nonce/session IDs
alone do not establish that the camera is live. A positive cosine score is identity
similarity only and does not authorize any action. Model hashes are artifact provenance,
not a certification of accuracy or resistance to adversarial images.

Keep integration's generic AiService signature/KYC fix when assembling branches;
it is outside this task's source ownership and was deliberately not overwritten.
Customer diagnosis/recommendation functions are unchanged by AST comparison against
4edb191; router isolation avoids touching Antigravity's classifier/catalog modules.
Lifespan changes are restricted to face model hash metadata; hash I/O failure disables
face provenance without failing Customer model startup. No shared source was copied.
