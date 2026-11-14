"""PAD decision gate: measurement -> PadEvidence only through a reviewed evaluation record.

A PAD model score is a measurement. It becomes a PASS/FAIL decision only when an
evaluation record for the *exact* artifact, model, preprocessing and crop versions exists
in APPROVED_EVALUATIONS, which is pinned in source and therefore changes only by code
review. A record must carry: artifact hash, dataset provenance, threshold-selection
procedure on a calibration split, independent evaluation on a subject-disjoint split,
per-instrument metrics, documented limitations and an explicit approval.

The registry is intentionally empty: no FixGo presentation-attack trial has been executed.
Runtime status is therefore BLOCKED_DATA and every outcome is NOT_EVALUATED (or
INCONCLUSIVE on measurement error).

There is no environment flag, request field, nonce, face detection or identity score that
can turn a measurement into PASS. Tests may construct a gate with an explicit synthetic
registry to verify the decision logic; runtime callers must not.
"""
from dataclasses import dataclass, field
import math
import re

# Instruments that an evaluation must cover separately (see faceid-pad-protocol.md).
REQUIRED_INSTRUMENTS = ('print', 'screen', 'video_replay')
# Proposed minimums/targets for review; not accepted policy until approved.
MIN_BONA_FIDE_TRIALS = 300
MIN_ATTACK_TRIALS_PER_INSTRUMENT = 100
MIN_BONA_FIDE_SUBJECTS = 30
MAX_APCER = 0.05
MAX_BPCER = 0.10
MAX_FAILURE_TO_ACQUIRE = 0.05
APPROVER_ROLES = ('SECURITY_LEAD', 'PRODUCT_OWNER_AND_SECURITY_LEAD')

# Reviewed records only. Key = PAD model version string. Intentionally empty.
APPROVED_EVALUATIONS: dict = {}

MEASUREMENT_ERRORS = {'PAD_MODEL_MISSING', 'PAD_CHECKSUM_MISMATCH', 'PAD_PREPROCESS_INVALID',
                      'PAD_OUTPUT_INVALID', 'PAD_TIMEOUT', 'PAD_BUSY', 'PAD_TECHNICAL_ERROR'}
SHA256 = re.compile(r'[a-f0-9]{64}')


def _rate(v, maximum):
    return type(v) in (int, float) and math.isfinite(v) and 0 <= v <= maximum


@dataclass(frozen=True)
class PadEvaluationRecord:
    # Provenance of what was evaluated
    model_version: str
    artifact_sha256: str
    preprocessing: str
    crop_version: str
    # Data and procedure
    protocol_reference: str
    dataset_manifest_sha256: str
    threshold_selection: str            # procedure id, chosen on the calibration split only
    real_score_threshold: float
    calibration_split: str
    evaluation_split: str
    subject_disjoint: bool              # calibration/evaluation share no subject
    report_sha256: str                  # face_metrics.py output on the evaluation split
    # Independent evaluation results (evaluation split)
    bona_fide_trials: int
    bona_fide_subjects: int
    bpcer: float
    failure_to_acquire_rate: float
    attacks: dict = field(default_factory=dict)  # instrument -> {'trials': int, 'apcer': float}
    limitations: tuple = ()
    # Approval
    approval_reference: str | None = None
    approved_by_role: str | None = None

    def data_problems(self):
        """Evidence problems (missing/insufficient/failing data). Empty list = evidence acceptable."""
        out = []
        if not all(isinstance(v, str) and v for v in (self.model_version, self.preprocessing, self.crop_version,
                                                      self.protocol_reference, self.threshold_selection)):
            out.append('EVALUATION_PROVENANCE_MISSING')
        for name in ('artifact_sha256', 'dataset_manifest_sha256', 'report_sha256'):
            if not isinstance(getattr(self, name), str) or not SHA256.fullmatch(getattr(self, name)):
                out.append(name.upper() + '_INVALID')
        if self.calibration_split == self.evaluation_split or not all(isinstance(v, str) and v for v in (self.calibration_split, self.evaluation_split)):
            out.append('INDEPENDENT_EVALUATION_SPLIT_REQUIRED')
        if self.subject_disjoint is not True:
            out.append('SUBJECT_DISJOINT_SPLITS_REQUIRED')
        t = self.real_score_threshold
        if type(t) not in (int, float) or not math.isfinite(t) or not 0 < t < 1:
            out.append('EVALUATION_THRESHOLD_INVALID')
        if type(self.bona_fide_trials) is not int or self.bona_fide_trials < MIN_BONA_FIDE_TRIALS:
            out.append('BONA_FIDE_TRIALS_INSUFFICIENT')
        if type(self.bona_fide_subjects) is not int or self.bona_fide_subjects < MIN_BONA_FIDE_SUBJECTS:
            out.append('BONA_FIDE_SUBJECTS_INSUFFICIENT')
        if not _rate(self.bpcer, MAX_BPCER):
            out.append('BPCER_NOT_ACCEPTABLE')
        if not _rate(self.failure_to_acquire_rate, MAX_FAILURE_TO_ACQUIRE):
            out.append('FAILURE_TO_ACQUIRE_NOT_ACCEPTABLE')
        for name in REQUIRED_INSTRUMENTS:
            a = self.attacks.get(name) if isinstance(self.attacks, dict) else None
            if not isinstance(a, dict) or type(a.get('trials')) is not int or a['trials'] < MIN_ATTACK_TRIALS_PER_INSTRUMENT:
                out.append(f'ATTACK_TRIALS_INSUFFICIENT:{name}')
            elif not _rate(a.get('apcer'), MAX_APCER):
                out.append(f'APCER_NOT_ACCEPTABLE:{name}')
        if not isinstance(self.limitations, tuple) or not self.limitations or not all(isinstance(x, str) and x for x in self.limitations):
            out.append('LIMITATIONS_UNDOCUMENTED')
        return out

    def approval_problems(self):
        out = []
        if not isinstance(self.approval_reference, str) or not self.approval_reference.strip():
            out.append('APPROVAL_REFERENCE_MISSING')
        if self.approved_by_role not in APPROVER_ROLES:
            out.append('APPROVER_ROLE_INVALID')
        return out

    # Backwards-compatible name used by earlier callers/tests.
    def problems(self):
        return self.data_problems() + self.approval_problems()


@dataclass(frozen=True)
class PadDecision:
    decision: str           # PASS | FAIL | NOT_EVALUATED | INCONCLUSIVE
    reason: str             # machine code explaining the decision
    evaluated: bool         # True only when an approved evaluation record was applied
    real_score: float | None = None
    spoof_score: float | None = None
    threshold: float | None = None
    evaluation_reference: str | None = None

    def as_dict(self):
        return {'decision': self.decision, 'reason': self.reason, 'evaluated': self.evaluated,
                'threshold': self.threshold, 'evaluationReference': self.evaluation_reference}


class PadDecisionGate:
    """Combine an (already measured) PAD score with an approved evaluation record."""

    def __init__(self, model_version, preprocessing, crop_version, registry=None, artifact_sha256=None):
        self.model_version, self.preprocessing, self.crop_version = model_version, preprocessing, crop_version
        self.artifact_sha256 = artifact_sha256
        self.registry = APPROVED_EVALUATIONS if registry is None else registry

    def status(self):
        """None when an acceptable, approved record applies; otherwise a blocking code."""
        record = self.registry.get(self.model_version)
        if record is None:
            return 'PAD_BLOCKED_DATA'
        if not isinstance(record, PadEvaluationRecord):
            return 'PAD_EVALUATION_RECORD_INVALID'
        if (record.model_version, record.preprocessing, record.crop_version) != (self.model_version, self.preprocessing, self.crop_version) or \
                (self.artifact_sha256 is not None and record.artifact_sha256 != self.artifact_sha256):
            return 'PAD_EVALUATION_VERSION_MISMATCH'
        data = record.data_problems()
        if data:
            return 'PAD_EVALUATION_REJECTED:' + data[0]
        if record.approval_problems():
            return 'PAD_BLOCKED_APPROVAL'
        return None

    def decide(self, measurement=None, error_code=None):
        if error_code is not None or measurement is None:
            code = error_code if error_code in MEASUREMENT_ERRORS else 'PAD_TECHNICAL_ERROR'
            return PadDecision('INCONCLUSIVE', code, False)
        real, spoof = getattr(measurement, 'real_score', None), getattr(measurement, 'spoof_score', None)
        if not all(type(v) is float and math.isfinite(v) and 0 <= v <= 1 for v in (real, spoof)) or abs(real + spoof - 1) > 1e-4:
            return PadDecision('INCONCLUSIVE', 'PAD_OUTPUT_INVALID', False)
        if getattr(measurement, 'model_version', None) != self.model_version or getattr(measurement, 'preprocessing', None) != self.preprocessing:
            return PadDecision('INCONCLUSIVE', 'PAD_MEASUREMENT_VERSION_MISMATCH', False, real, spoof)
        blocked = self.status()
        if blocked:
            # Score is shown for research, but never converted into a decision.
            return PadDecision('NOT_EVALUATED', blocked, False, real, spoof)
        record = self.registry[self.model_version]
        passed = real >= record.real_score_threshold
        return PadDecision('PASS' if passed else 'FAIL', 'REAL_SCORE_AT_OR_ABOVE_THRESHOLD' if passed else 'REAL_SCORE_BELOW_THRESHOLD',
                           True, real, spoof, record.real_score_threshold, record.approval_reference)
