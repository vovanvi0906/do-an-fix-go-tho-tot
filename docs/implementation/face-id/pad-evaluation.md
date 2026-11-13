# PAD evaluation — integration BLOCKED

Reviewed 2026-11-13 using upstream sources. No weights downloaded or inference on
real people performed. Runtime UnavailablePad implements PadProvider and always
returns NOT_EVALUATED. PASS/FAIL contract requires model provenance; no approved
provider is wired. Session policy refuses NOT_EVALUATED/INCONCLUSIVE/FAIL.

Candidate: MiniFASNet in [Minivision Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing).
The repository publishes an [Apache-2.0 license](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/master/LICENSE).
This establishes repository licensing, not a completed review of each checkpoint,
training dataset, third-party detector or ONNX conversion. Those artifacts need exact
source/commit/SHA-256 and redistribution/license review before approval/download.

The [upstream README](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/master/README_EN.md)
describes compact models and Android deployment, making this a candidate for CPU
experiments. Its warnings tie performance to camera and scene; published vendor
results are not FixGo measurements. Reproduce preprocessing, crop scales and score
fusion before comparing. [Dependencies](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/blob/master/requirements.txt)
pin old PyTorch/torchvision/OpenCV/numpy versions; do not install these over FixGo.
Use an isolated, reviewed environment or validated conversion with numerical parity.
CPU latency, memory and Android compatibility remain unmeasured here.

[NIST FATE PAD report](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based)
evaluates passive PAD separately from recognition. Treat print, screen and video
presentation attacks separately; no inference that a detector or cosine match is live.
Blink alone is insufficient. PAD does not establish camera origin or defeat arbitrary
camera hooks/injection/deepfakes.

## Approval-dependent experiment

Use consented volunteers and authorized artifacts on isolated accounts, never existing
worker photos. Split subjects, sessions and camera devices across train/validation/test;
freeze held-out test and avoid near-duplicate frames across splits. Record permitted
purpose, deletion date, provenance, capture device/light and presentation instrument.
Include bona fide, print (materials/sizes), phone displays (brightness/models), video
replay, blur/dark and multiple faces. Report each attack type/device separately.
Choose PAD threshold and identity threshold on validation only with approved targets.

Compute FMR = false matches / impostor comparisons; FNMR = rejected genuine matches /
genuine comparisons; TAR = 1-FNMR at declared validation-selected FAR/FMR target.
Report acquisition/quality/PAD/technical failures separately to avoid hiding abstentions.
PAD APCER = attacks accepted / attack trials (per instrument); BPCER = bona fide
rejected / bona fide trials; ACER = (APCER+BPCER)/2 with aggregation rule explicit.
Include confidence intervals, denominators, coverage and subgroup/device limitations.
Latency p50/p95: measured end-to-end and per inference stage after warmup, CPU thread
count/model artifact/device recorded; report timeout/nonresponse and cold start apart.

All FixGo biometric/PAD metrics: NOT MEASURED. Acceptance targets, sample size,
checkpoint license review, download, consent/storage and Android trials need approval.
