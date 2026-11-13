# API contracts

Metadata endpoints return {success:true,data:...}; success indicates request handling only,
not biometric enrollment. Preflight data.accepted is always false.

All Nest paths below have the application's /api prefix. JWT ACTIVE WORKER required;
workerId/reference/template/proof decision are never accepted from mobile as authority.

| Endpoint | Runtime behavior |
|---|---|
| GET /workers/me/face/status | capabilities, blockers, legacy quarantine; no biometric fields |
| POST /workers/me/face/enrollment/preflight | body {consent:true}; accepted=false; no persisted request |
| POST /workers/me/face/reset/preflight | body {consent:true}; blocked, no template mutation |
| POST /workers/verify-face-daily | legacy intake blocked; no proof issuance |
| POST /orders/:id/face-verify[-upload] | existing ownership/stage checks; no proof issuance |

Internal POST /ai/face-verify (alias /api/v1/ai/verify-face): JSON only, shared
AI_FACE_SERVICE_TOKEN supplied in x-face-service-token, same env on Nest and AI;
missing configuration 503, invalid token 401. Private network/TLS still required.
Input backend-selected workerId, sessionId, photo (JPEG/PNG data URI), templateEmbedding
(128 finite nonzero components), integer templateVersion, modelVersion. The backend
transport method verifyFaceTemplate is implemented but no public route may call it
until durable session + trusted template provisioning is approved. Legacy URL/multipart
matching is retired and fails closed. No local paths or URL fetch in the face decoder.

Output identityDecision MATCH/NON_MATCH/INCONCLUSIVE/TECHNICAL_ERROR,
identityScore raw cosine [-1,1] or null (not probability), verificationMethod
'yunet_sface_cosine' or 'none', modelVersion actual loaded artifact SHA-256 pair,
templateVersion, qualityDecision PASS/FAIL/NOT_EVALUATED,
padDecision NOT_EVALUATED, errorCode, workerId/sessionId echoes.
Compatibility status/verified/confidence/method fields describe identity only;
verified does NOT authorize daily/online/order transition. Nest legacy gates are closed.
New transport validates exact worker/session/model/template and finite scores; it never
converts unavailable/unknown method into matching. Transport timeout 15 seconds.

FACE_IDENTITY_THRESHOLD set identically on AI/Nest, default .60 retained as provisional
baseline, independent of AI_CONFIDENCE_THRESHOLD. No accuracy/FAR claim for this default.
Payload limit ~5MiB encoded image plus JSON/vector overhead; image <=12 million pixels.
Authenticated service requests only; deployment must impose rate/concurrency quotas.
Use a cryptographically random service secret from deployment secret storage, shared only
by Nest and AI; never include it in the mobile application.
Public biometric capture is unavailable, so repeated requests cannot issue sessions or
run inference through these flows. Full cross-instance retry limits await durable storage.
