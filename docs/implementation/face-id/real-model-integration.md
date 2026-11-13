# YuNet/SFace integration — actual local model smoke, PAD still blocked

Pre-existing main-worktree weights were opened read-only. No model binaries were
downloaded, copied into this worktree, or committed. identity-model-manifest.json records
names/sizes/SHA-256 and upstream commit. The hashes match official OpenCV Zoo LFS pointers.
Upstream [YuNet license is MIT](https://github.com/opencv/opencv_zoo/blob/48b10fa505aeb51fbd127fc60a5c660040e823b7/models/face_detection_yunet/LICENSE)
and [SFace license is Apache-2.0](https://github.com/opencv/opencv_zoo/blob/48b10fa505aeb51fbd127fc60a5c660040e823b7/models/face_recognition_sface/LICENSE).
This is source/license provenance, not clearance of participant/training data or PAD.
Retain required notices before any artifact redistribution.

face_models.py pins the two exact official hashes and loads only local files. Missing,
changed, wrong-hash or failed model load returns no usable bundle. Set FACE_MODEL_DIR to
an approved read-only artifact directory; default remains ai-service/weights. There is
no downloader or fallback. Require immutable/controlled filesystem artifacts in deployment;
before/after hashes detect ordinary load-time changes, not arbitrary privileged filesystem
adversaries. main.py changes only face loading/provenance; YOLO/CLIP/customer functions
and CLIP bootstrap remain unchanged.

Actual path: YuNet detections/landmarks → exactly-one/quality → SFace alignCrop → finite
128-component embedding → cosine against the backend-selected authenticated/decrypted
versioned template. Identity and PAD are independent measurements:

- identityDecision/identityScore/identityMatched describe the matcher.
- qualityDecision describes capture suitability.
- padDecision/padModelVersion/padErrorCode describe PAD; no approved provider is present.
- AI compatibility verified stays false. Identity MATCH does not create authorization.
- Nest proof issuance still requires explicit identity MATCH, finite score, exact method/
  model/template/session/worker binding, quality PASS and evaluated provider PAD PASS.

Internal authenticated GET /ai/face-capabilities publishes identityModelReady/modelVersion
separately from PAD readiness. Nest gateway reads real identity readiness but will NOT
approve PAD from an AI boolean or environment flag. POST /ai/face-enroll runs acquisition/
quality/SFace feature preparation but returns no embedding while PAD is NOT_EVALUATED.
POST /ai/face-verify can report identity MATCH separately while verified=false and PAD
NOT_EVALUATED. These internal measurements do not bypass the public capture readiness gate.

## Actually tested

- Real OpenCV loaded both pre-existing SHA-verified networks.
- Real YuNet returned no face on a synthetic blank image.
- Real SFace generated finite shape(1,128) from random synthetic noise; this is not a face
  or an identity accuracy test, and that vector was not persisted/released as enrollment.
- An isolated loopback FastAPI app with those real models was called through the actual
  Babel-transpiled Nest FastApiAiClient/FaceEvidenceGateway. Capabilities showed identity
  readiness, PAD stayed false, blank enrollment/verification rejected, no embedding/proof.
- Stub-detector/recognizer tests independently exercise quality PASS/identity MATCH with
  PAD NOT_EVALUATED and assert verified=false/no enrollment vector publication.

No portrait, real person, trusted identity document, PAD model or genuine/impostor pair
was used. FMR/FNMR, PAD accuracy, CPU/Android latency and camera origin remain unmeasured.
OpenCV emitted its existing graph-target warning during smoke; CPU inference calls still
completed. This does not establish device compatibility or production performance.

## Remaining gated work

Before real capture/persistence: approved consent/identity review procedures, participants,
retention/KMS and controlled data test protocol. Before PAD binaries: approval of the
existing exact checkpoint/dependency experiment proposal. After licensed/evaluated PAD,
implement its provider and approved version/decision policy, then validate enrollment
and genuine/impostor matching with independent held-out data. Do not turn on proof success
using model readiness alone or a mock provider. No project database migration is authorized.
