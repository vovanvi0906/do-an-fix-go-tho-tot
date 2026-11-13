# Concrete next experiment and handoff — 2026-11-13

## Proposed decision

Approve a separate isolated, non-commercial download/CPU feasibility experiment for
anti-spoof-mn3.onnx from the pinned OMZ/Intel source, not a runtime PAD enablement.
See pad-selection-report.md and pad-mn3-source-metadata.json for model-specific MIT
publisher evidence, descriptor Apache link discrepancy, training-data restriction and
artifact size/SHA-384. MiniFASNet is secondary; its earlier proposal is not an approval.
No weights or external face dataset was downloaded; no dependency runtime installed.

## Ready immediately

Existing YuNet/SFace/pinned provenance, encryption, reviewed enrollment authority and
durable daily/order gates remain intact. No production Face ID architecture or schema
was expanded in this task. New work is: verified read-only schema comparison, model/
license/runtime metadata report, proposed participant protocol and an offline score
aggregator. The aggregator has five mathematical unit tests; no experimental rates
were generated from those fixtures. Missing observations remain null/NOT_MEASURED.

## Execution sequence after approvals

1. Approve exact model artifact + CPU environment. Download one pinned ONNX, verify
   SHA-384/size and record SHA-256; reject mismatch. Install pinned isolated runtime,
   disable external egress for inference. Synthetic/no-person runs first: verify shapes,
   color/layout/normalization, class0 real-score direction and finite outputs. Measure
   actual CPU/RSS/cold/warm latency; do not infer performance from GFLOPs/file size.
2. Approve consent/participants/authorized attack media, retention/key custody and
   operating targets using participant-test-protocol.md. No real data before this.
3. Implement the real provider inside the existing PadProvider interface only after
   that experiment. Keep identity/PAD outcomes separate, pin preprocessing/model/
   evaluation versions; unexpected shape, nonfinite output, unavailable/inconclusive
   provider must reject. Do not approve PAD from the AI readiness boolean itself.
4. On isolated Android accounts/DB run Admin review → consent → session camera →
   enrollment quality/PAD → SFace encrypted template → fresh identity+PAD daily/order
   verification → persisted proof readback → atomic order start. Challenge/nonce binds
   requests; physical print/screen/video tests separately assess presentation attacks.
5. Freeze calibration thresholds, run held-out evaluation, compute measured metrics and
   report acquisition failures/nonresponse and operational nonacceptance. A replay or
   cross-device failure blocks acceptance; no threshold reduction for a successful demo.
6. Physical Android permission/background/cancel/retry/withdrawal and camera-injection
   limitations must be reviewed. Project migration remains a separate approval under
   project-schema-readonly-report.md; no baseline/history writes have occurred.

## Actual checks this task

- Verified live project read-only identity/catalog, 253 column metadata records;
  registration_proofs drift and absent migration-history relation reported.
- Disposable target reconstruction/catalog diff succeeded and container removed.
- Five score-aggregation formula/validation tests PASS. They do not measure accuracy.
- Focused existing backend gate regressions: 42 tests / 3 suites PASS; local model/HTTP smoke: 6 tests PASS using pre-existing verified YuNet/SFace and synthetic blank/noise. No new PAD or real participant input.
- No actual FMR/FNMR/TAR, APCER/BPCER, CPU model benchmark or device result exists yet.

Current blockers: download experiment approval; research/distribution rights review;
consent/volunteers/authorized attacks/retention and metric targets; measured PAD acceptance;
physical Android validation; project baseline/auth-schema coordination and separate DDL
approval. There is still no approved runtime provider and no PAD bypass/mock success.
