# PAD selection for FixGo — decision proposal, 2026-11-13

Recommendation: request approval for a NON-COMMERCIAL ISOLATED RESEARCH experiment with
**anti-spoof-mn3 (MobileNetV3) from Intel Open Model Zoo**, CPU backend first. Do not
download yet. Keep MiniFASNet as a secondary comparison candidate, not an automatic
fallback. No candidate has demonstrated adequate FixGo attack rejection so far.

## Why this candidate

| Candidate | Evidence supporting trial | Limitation / decision |
|---|---|---|
| anti-spoof-mn3 | Official distributor identifies the original model license; published artifact URL/size/checksum; native ONNX avoids third-party conversion/PyTorch pickle. CPU-oriented ecosystem matches current Intel host. | Trained on CelebA-Spoof; research data restrictions need separate treatment. Cross-device performance unproven. Preferred research baseline. |
| MiniFASNetV2 + V1SE pair | Official pinned checkpoints, small files, upstream Android implementation. | Repository Apache-2.0 does not separately document checkpoint training rights/protocol; old dependency pins and .pth loader require more review. Retain as secondary, no download. |
| Remote commercial PAD SDK | Could supply maintained model and mobile capture SDK. | No selected vendor/license, data processing terms, offline capability or measured CPU budget. No account, spend or biometric upload authorized. Not selected. |

[OMZ model card](https://github.com/openvinotoolkit/open_model_zoo/blob/master/models/public/anti-spoof-mn3/README.md)
reports MobileNetV3, 0.15 GFLOPs and 3.02M parameters. Its 3.81% ACER is a publisher
benchmark, NOT FixGo evidence and NOT a guarantee for print/screen/video attacks here.
The [original research repository](https://github.com/kprokofi/light-weight-face-anti-spoofing)
reports different cross-dataset results; domain shift must be tested on our cameras.
No accuracy number from a public table will become a FixGo measured metric.

## Model/weight provenance and license decision

[OMZ descriptor](https://github.com/openvinotoolkit/open_model_zoo/blob/master/models/public/anti-spoof-mn3/model.yml)
identifies `anti-spoof-mn3.onnx`, 12,270,179 bytes and an Intel storage source. Exact
source commits, descriptor hash, SHA-384 checksum (algorithm verified in upstream download_engine/cache.py) and metadata-only HEAD result are frozen in
pad-mn3-source-metadata.json. Only descriptor/code/license text and HEAD were requested;
no binary body was downloaded. Verify expected checksum, record SHA-256 and retain
license notices after a separately approved download; reject source/hash mismatch.

The model card explicitly labels the ORIGINAL MODEL MIT. The [upstream MIT license](https://github.com/kprokofi/light-weight-face-anti-spoofing/blob/master/LICENSE)
and [Intel's model-specific Android licensing answer](https://www.intel.com/content/www/us/en/support/articles/000102082/software/development-software.html)
support that attribution. Descriptor's license URL instead points to an Apache-2.0
training_extensions fork. Record BOTH notices; do not silently relabel the descriptor
or claim a repository banner alone settles every artifact/data right. This is enough
publisher evidence to propose a restricted research trial for owner approval, not a
legal determination or permission for unrestricted product distribution.

[CelebA-Spoof's own dataset agreement](https://github.com/ZhangYuanhan-AI/CelebA-Spoof#dataset-agreement)
restricts dataset/derived-data use to non-commercial research and restricts redistribution.
Model licensing and training-data rights are separate. Do not download its images,
assume MIT overrides dataset terms, or approve commercial FixGo deployment on this basis.
Ask institution/data-rights owner to review intended thesis scope and clarify any
commercial/derived-weights ambiguity before distribution. No publisher contact was sent.

## CPU/dependency plan (proposed budgets, not benchmarks)

Observed development host: Intel Core i5-13420H, x86_64, 12 logical CPUs and about15GiB
RAM; resource availability is shared and changes. Android acts as capture client;
FastAPI performs CPU inference. Native on-device Android inference is NOT established
and is not required for this first experiment.

Start with one isolated Python3.11 environment/container, OpenVINO CPU runtime, numpy
and existing OpenCV for crops. PyPI metadata currently identifies OpenVINO2026.4.1 (Python>=3.10);
its Linux x86_64 CPython3.11 wheel hash/size and numpy/telemetry dependencies are recorded
in pad-runtime-package-metadata.json. No package was installed/downloaded. The telemetry
dependency must be accounted for; block all external egress during inference/benchmark.
Freeze the full tested dependency lock and confirm compatibility after approval; do not install old upstream training dependencies into FixGo. No additional
face-detector weights: compare reviewed YuNet crops with the expected training crop
geometry, recording this as a preprocessing adaptation. Do not assume parity.

Apply the trial budget only to the isolated face experiment, never to the shared
Customer/Recommendation service or its AI_SERVICE_URL. Shared-stack sizing is a later
load test; do not change Antigravity configuration.

Budget trial: 2 CPU cores, 1GiB process cap, batch1, one request/stream; compare 1/2/4
inference threads, including cold/warm runs. Measure RSS, CPU and wall time, preprocessing,
YuNet/SFace/PAD stages and end-to-end latency separately. No network during inference.
The [OpenVINO CPU documentation](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes/cpu-device.html)
provides CPU support; it does not prove this model meets our latency target. If memory/
latency or accuracy is unacceptable, stop rather than weaken the gate.

Input: original ONNX expects RGB NCHW128x128 and documented mean/scale. Output real-class
index is0; treat softmax value as an uncalibrated classifier score. OpenVINO-converted
IR has different preprocessing expectations; do not normalize/reverse channels twice.
Use one frozen preprocessing specification and parity checks before evaluating people.
Do not reuse the face-identity cosine threshold for PAD.

## Print, screen and video replay

This is passive RGB frame classification, not a temporal challenge-response model.
It can be evaluated against frames captured while an authorized print, phone still or
video is physically presented to the Android camera; video-file support is not proof
of video-replay resistance. Start with existing single-capture session protocol and
independent repeated presentations. Report APCER separately per instrument/device.
A static frame model may accept a high-quality display replay. If that failure is
unacceptable, block release and evaluate a licensed temporal/burst alternative; do not
hide it with blink heuristics or silently pool frames as independent trials.

PAD does not establish camera origin, stop arbitrary injected frames or guarantee
anti-deepfake. [NIST PAD evaluation](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based)
treats presentation attacks as an independent evaluation task from face matching.

## Approval requested, concrete scope

Authorize fetching ONLY the pinned OMZ ONNX artifact from the recorded Intel URL,
checksum verification and isolated CPU/preprocessing benchmark with synthetic/non-person
inputs first. Do not authorize real participant data, dataset downloads, model training,
PAD PASS in runtime, commercial distribution, project DB migrations or remote uploads.
A second, separate approval is needed for participant protocol and held-out evaluation.
After measured acceptance and explicit provider/policy approval, implement the provider
behind existing PAD interface, pin model/evaluation versions, and require both identity
and PAD PASS. Until then all current capture/proof readiness gates stay closed.
