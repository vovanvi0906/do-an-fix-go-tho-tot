# Proposed consented Android identity/PAD protocol — NOT APPROVED / NOT STARTED

No participant was recruited or contacted, no face was captured, and no dataset was
downloaded. This document requests owner/institution review before any such action.
Model-download approval alone does not authorize this protocol.

## Participants and permitted materials

Propose a 24-adult volunteer pilot (8 calibration, 16 held-out test), with at least two
sessions on different days per participant and at least two Android camera models.
This is a feasibility pilot, not sufficient certification of low FMR/APCER. Expand
sample size only after setting risk/precision targets and considering subject correlation.
No minors, coerced workers/customers, ID-card photos, scraped images or existing FixGo
biometrics. Refusal/withdrawal must not affect employment/service access in the study.

Separate explicit consent: enrollment/1:1 comparison, stored encrypted template, capture
retention, creating authorized print/still/video replay materials, who may access them,
withdrawal route and any limited retention of deidentified aggregates. Use a readable
approved Vietnamese form, document version/actor/time and give a copy to participants.
Name responsible reviewer/data controller and contact before recruitment. Admin study
review is a test-identity attestation; do not collect government identity documents.

Only the consenting person's authorized images/video may be printed or replayed. Mark
materials as experiment-only; no copies outside the study. Keep raw media in private
local encrypted storage, mapping pseudonyms separately; never Git, logs or public URLs.
Proposed retention for approval: delete raw media within30days of final run, printed
copies shredded, templates withdrawn/deleted after the study; review WAL/backups and
metadata retention explicitly. Participants may request earlier removal. No collection
until those exact terms and deletion process are approved.

## Evaluation data choices

Primary: the above local Android protocol, because device/display/domain conditions
must match FixGo. Optional external validation only after separate rights review:
- [OULU-NPU](https://sites.google.com/site/oulunpudatabase/welcome) is a mobile PAD set with
  print/video replay; its [access procedure](https://sites.google.com/site/oulunpudatabase/download)
  requires institutional EULA approval. It is not currently licensed/downloaded here.
- [CelebA-Spoof](https://github.com/ZhangYuanhan-AI/CelebA-Spoof#dataset-agreement) is research-
  restricted and overlaps training provenance of the proposed model. It is NOT an
  independent FixGo held-out test or a freely redistributable app dataset.
No assumption that public availability supplies consent/permission for every use.

## Split, capture and attack matrix

Freeze subject split before capture/tuning. Keep calibration/test subjects separate;
no near-duplicate frames across splits. Enrollment uses sessionA; genuine verification
uses sessionB/day/device variations. Impostor comparisons use different participants
under consent without altering account/template ownership in the app. Preserve the
existing worker/JWT/nonce/template linkage, use isolated accounts/DB exclusively.

For every test participant/device condition, collect a predeclared number of independent
attempts (proposal: three each, randomized order):

| Trial | Conditions / authorized material |
|---|---|
| Genuine / bona fide | Normal light, low light, mild pose, glasses where applicable; capture according to policy |
| Print | Matte/glossy where allowed, at least two sizes/angles; label material explicitly |
| Screen still | Two display models, low/high brightness, visible/hidden borders |
| Video replay | Authorized recorded face video played on a separate phone/display; capture via real camera, not direct file injection |
| Acquisition failures | No face, multiple consenting persons, blur/occlusion; no identity/PAD score invented |
| Technical | Offline/timeout/cancel/retry/expired nonce; cannot mint success |

One presentation/capture attempt is one statistical trial. Video frames from one clip
are correlated and must not inflate sample count. Keep attack source/device and day
metadata private. Additional burst/temporal capture is a separate protocol/model change,
only if measured failure motivates it; no architecture expansion now.

Record failure-to-enroll separately: all consenting participants attempted versus
successful enrollment, with reasons. Do not silently drop rejected subjects, provision
an avatar or bypass PAD to obtain a template. Conditional identity results must disclose
the enrolled cohort and attrition. This enrollment tally is a separate study record;
the current score aggregator supports identity/PAD trials, not enrollment cohorts.

## Thresholds, metrics and denominators

Retain current .60 identity threshold only as an unvalidated starting configuration.
Select final identity/PAD thresholds on CALIBRATION data for pre-approved risk targets,
freeze them with model/preprocessing hashes and validation reference before opening
held-out test. Never tune on held-out failures. Report achieved FMR alongside TAR at
that configured threshold; do not call it TAR at a target FAR unless the measured
operating point and uncertainty justify that statement.

- FMR = accepted impostor / scored impostor; FNMR = rejected genuine / scored genuine.
- TAR = accepted genuine / scored genuine, with achieved FMR and configured threshold.
- APCER per print/screen/video instrument = attacks accepted / scored attack trials.
- BPCER = bona fide rejected / scored bona fide trials.
- Report NO_FACE, MULTIPLE_FACES, QUALITY_REJECTED, INCONCLUSIVE, TECHNICAL_ERROR and
  TIMEOUT counts/rates separately, using ALL attempts as denominators.
- Also report operational genuine/bona-fide non-acceptance including acquisition and
  inconclusive failures; this is not the same as conditional FNMR/BPCER.
- CPU inference/wall-clock and total Android round-trip p50/p95, cold starts and peak
  RSS; n for each measured timing stage. Do not substitute mocked elapsed time.

Report per device/lighting/attack and participant-level variability. Confidence intervals
must account for repeated subjects/clips (e.g. subject-cluster bootstrap reviewed before
analysis); small zero-error pilot is not proof of zero risk. Publish no real metrics
until measured input exists. Define acceptable FMR/APCER, maximum BPCER/non-acquisition
and latency budget BEFORE running acceptance; these targets still await owner approval.

## Existing offline measurement tool

`ai-service/eval/face_metrics.py` aggregates deidentified score/outcome records without
loading media, running models or granting proof. It rejects duplicate IDs, nonfinite
scores, invented scores on unscored trials and image/vector fields. It reports separate
conditional/operational rates and null for missing denominators. Its unit fixtures
only verify mathematics, never become experimental metrics. No real trial report exists.
Protocol JSON must include approval reference, identity/PAD model versions, dataset
manifest hash, threshold-selection reference and held_out_test split. Runtime gate is
unaffected by this offline declaration; the file does not itself authorize collection.

## Android end-to-end milestones

1. Approve exact model download/dependencies; verify checksum and synthetic CPU parity.
2. Approve this protocol, consent, participants, reviewers, retention/key custody and
   accuracy/latency targets. Use disposable DB with existing v2/v3 schema only.
3. Implement evaluated PAD provider using existing interface (no fallback PASS), with
   model/threshold/preprocessing/evaluation provenance. Keep it in experiment until
   measured acceptance is reviewed. Identity matching/PAD remain separate decisions.
4. On Android: Admin identity review → consent → session → camera enrollment → YuNet/
   SFace + quality/PAD → encrypted template. Separate DAILY and ORDER captures must pass
   both identity and PAD; read back persisted proof; start-work atomically consumes order
   proof. Run permission, retry, expiry, ownership and withdrawal cases on actual devices.
5. Review held-out results and limitations. If video replay or cross-device performance
   fails target, block release; do not lower thresholds to make the demo pass.
6. Only after a separate project migration/rollout approval consider real FixGo integration.
