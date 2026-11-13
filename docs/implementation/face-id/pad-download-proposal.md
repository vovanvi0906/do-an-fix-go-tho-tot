# PAD download proposal — not yet approved, NO weights downloaded

Candidate pinned to upstream commit b6d5f04ad78778917853b25c778acef6d5626d15 of
[Minivision Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/tree/b6d5f04ad78778917853b25c778acef6d5626d15).
Candidate checkpoint pair (upstream metadata only, recorded in pad-candidate-metadata.json):

| File | Bytes | Provenance |
|---|---:|---|
| 2.7_80x80_MiniFASNetV2.pth | 1,849,453 | Official repository, pinned Git blob |
| 4_0_0_80x80_MiniFASNetV1SE.pth | 1,856,130 | Same pinned tree; evaluate documented fusion separately |

Git blob SHA-1 in metadata is NOT a downloaded file SHA-256. Compute and freeze SHA-256
only after approval to fetch these exact binaries. No third-party ONNX mirrors/downloads.

License: pinned repository [Apache-2.0](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/b6d5f04ad78778917853b25c778acef6d5626d15/LICENSE)
exists; there is no separate checkpoint/model card reviewed here establishing training
corpus rights or intended deployment scope. Ask the owner to approve research use of
these artifacts under repository terms, preserve notices and separately review training
provenance/third-party detection components. Do not describe this as completed legal
clearance. Do not fetch external RetinaFace weights; test adapting existing YuNet crops
as a separate preprocessing variant, with measured effects rather than assumed parity.

Dependencies: [upstream predictor](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/b6d5f04ad78778917853b25c778acef6d5626d15/src/anti_spoof_predict.py)
uses PyTorch and falls back to CPU. It reloads weights in the prediction path; an adapter
would preload once, select CPU explicitly, use eval/inference mode, freeze preprocessing
and validate crop scales/fusion. Loading .pth requires a reviewed safe serialization path
and isolated environment. [Pinned requirements](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/b6d5f04ad78778917853b25c778acef6d5626d15/requirements.txt)
are old; do not downgrade FixGo dependencies to satisfy them. Propose an isolated modern
CPU PyTorch environment, safe weights-only loading where compatible, and only then an
optional ONNX export with parity tests. Exact compatible versions remain unverified.

Resource experiment proposal, NOT measurements: one CPU inference worker, test 1/2/4
CPU threads; measure RSS peak (including runtime, not just the ~3.7MB checkpoint pair),
warm/cold latency p50/p95, and concurrent-request rejection behavior. Budget proposal:
2 CPU cores and 1GiB process cap for initial feasibility; do not assume it will fit or
meet latency until measured. Vendor README performance is not a FixGo benchmark.

Benchmark: follow pad-evaluation.md with consented/device/session-separated data and
print/screen/video presentation attacks, record APCER per instrument, BPCER, coverage
and latency. No authorized people/dataset/device protocol or acceptance targets yet;
all actual security metrics remain NOT MEASURED. Digital injection/deepfake resistance
is a separate threat. Do not enable runtime PAD readiness from an environment boolean.

Requested approval: exact checkpoint pair + pinned commit + isolated dependency/parity
experiment only. Approval to download does NOT authorize collecting real faces or
turning on proof issuance. Those require separate participant/data policy and measured
acceptance criteria. Until then FaceEvidenceGateway.capabilities returns padEvaluated=false.
