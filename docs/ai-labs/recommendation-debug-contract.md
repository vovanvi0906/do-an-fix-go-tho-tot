# Recommendation internal telemetry contract

Scope reviewed in AI-REC-LAB-02 proposal and authorized by AI-REC-LAB-03. No production success-body fields removed. No shared entrypoint/schema edits.

## Authentication / environments

- Disabled unless `RECOMMENDATION_DEBUG_ENABLED=true` AND NODE_ENV is `development`, `staging` or `test`. `production` always rejects with 404.
- Secret `RECOMMENDATION_DEBUG_TOKEN` must contain at least 32 characters, compared with timing-safe comparison. No default token.
- Nest route: `POST /api/internal/recommendation/inspect`; `Authorization: Bearer <debug token>`.
- Backend-to-AI route: `POST /ai/v2/internal/diagnose-debug`; `X-Recommendation-Debug-Token: <debug token>`; hidden from public AI OpenAPI schema.
- Production configuration is not changed. Lab test bootstrap generates/reads an ignored, mode-0600 `.runtime/debug-token` file. Token stays in browser memory; never saved in trace/export.

## Payload / response

Backend request: JSON `{imageUrl, description?}` using the stored incident URL from a successful upload. AI accepts the existing multipart/JSON image input contract. Correlation travels in X-Request-ID.

Response:

```text
{
 result: existing DiagnosisV2Response,
 debug: {
   requestId,
   stagesMs: {image_decode,clip,yolo,category_fusion,target_resolution,total},
   stageOutcomes, modelsLoaded, clipScores, yoloScores,
   gates: {categoryMinConfidence,categoryMinMargin,categoryAccepted,confidence,targetMinSimilarity,targetAccepted},
   model: {declaredVersion,clip,yoloSha256,clipArtifactSha256,clipRevision,clipArtifactFile},
   catalog: {version,source,targetCount}
 },
 backend: {requestId,confidenceThreshold,thresholdSource,categoryThresholdPassed,categoryResolved,categoryGateAccepted,canonicalTargetId,catalogResolutionMs,aiHttpElapsedMs}
}
```

Scores/stages belong to the SAME AI request. Image decode includes URL fetch; total is not pure model compute. Model-loading readiness is reported; cold load latency is not fabricated. User confirmation, symptoms, mapping and service outcome remain separate API trace stages.

Backend confidence-only threshold pass does not imply catalog resolution; `categoryGateAccepted` includes active category resolution. `canonicalTargetId` is scoped to that active category. Threshold values remain AI .48 / margin .10 / target cosine .20 and backend configured .6 by default.

Bad/missing auth: 401. Disabled/production: 404. AI transport unavailable: 502 DEBUG_AI_UNAVAILABLE. Internal model exception: 502 MODEL_STAGE_FAILED with safe stage name. Catalog unavailable/schema missing: 503 with safe code. Raw image/URL, credentials, DSN and stack traces are not returned in debug metadata. The existing result has no image URL; Lab redacts any sensitive response fields before export.

Normal `/orders/diagnose*` keeps its success schema. It now echoes the middleware correlation ID in its existing requestId field and forwards it to AI. Valid image upload shape remains unchanged. Invalid image errors are corrected to 400/413; storage failures remain 502/504 and cannot become fake success.

Benchmark metadata capture is opt-in via the UI. It runs this inspector as an ADDITIONAL inference, records `telemetrySampledSeparately=true`, and never describes it as intermediate tensors/latency of the independent V2 benchmark request. Fingerprints are sampled from the fixed test-runtime cache/config; no production model pinning guarantee is implied.
