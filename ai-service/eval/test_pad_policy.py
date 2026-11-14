"""PAD decision-gate unit tests. Synthetic records verify logic only; they are NOT evidence."""
import sys
import unittest
from dataclasses import replace
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1]))
import pad_policy
from pad_policy import PadDecisionGate, PadEvaluationRecord, APPROVED_EVALUATIONS
from pad_mn3 import Measurement, VERSION, PROFILE, SHA256
from face_research import CROP_VERSION


def record(**change):
    base = PadEvaluationRecord(model_version=VERSION, artifact_sha256=SHA256, preprocessing=PROFILE, crop_version=CROP_VERSION,
                               protocol_reference='SYNTHETIC-UNIT-TEST-ONLY', dataset_manifest_sha256='b' * 64,
                               threshold_selection='bpcer-target-on-calibration-v1', real_score_threshold=.9,
                               calibration_split='calibration', evaluation_split='evaluation', subject_disjoint=True,
                               report_sha256='a' * 64, bona_fide_trials=300, bona_fide_subjects=30, bpcer=.05,
                               failure_to_acquire_rate=.01,
                               attacks={k: {'trials': 100, 'apcer': .01} for k in ('print', 'screen', 'video_replay')},
                               limitations=('passive single frame; no injection resistance',),
                               approval_reference='SYNTHETIC-UNIT-TEST-ONLY', approved_by_role='SECURITY_LEAD')
    return replace(base, **change)


class RuntimeRegistryTests(unittest.TestCase):
    def test_runtime_registry_is_empty_so_no_runtime_pass_exists(self):
        self.assertEqual(APPROVED_EVALUATIONS, {})
        gate = PadDecisionGate(VERSION, PROFILE, CROP_VERSION)
        self.assertEqual(gate.status(), 'PAD_BLOCKED_DATA')

    def test_high_real_score_without_evaluation_is_not_evaluated(self):
        for real in (1.0, .99999, .5):
            d = PadDecisionGate(VERSION, PROFILE, CROP_VERSION).decide(Measurement(real, 1 - real))
            self.assertEqual(d.decision, 'NOT_EVALUATED')
            self.assertFalse(d.evaluated)
            self.assertIsNone(d.threshold)
            self.assertEqual(d.real_score, real)

    def test_no_environment_switch(self):
        src = Path(pad_policy.__file__).read_text()
        self.assertNotIn('os.environ', src)
        self.assertNotIn('getenv', src)


class DecisionLogicTests(unittest.TestCase):
    def gate(self, rec=None):
        return PadDecisionGate(VERSION, PROFILE, CROP_VERSION, {VERSION: rec or record()}, artifact_sha256=SHA256)

    def test_measurement_errors_are_inconclusive_never_pass(self):
        for code in ('PAD_TIMEOUT', 'PAD_BUSY', 'PAD_MODEL_MISSING', 'PAD_CHECKSUM_MISMATCH', 'anything else'):
            d = self.gate().decide(None, code)
            self.assertEqual(d.decision, 'INCONCLUSIVE')
            self.assertIn(d.reason, pad_policy.MEASUREMENT_ERRORS)
        self.assertEqual(self.gate().decide(None).decision, 'INCONCLUSIVE')

    def test_invalid_scores_inconclusive(self):
        for m in (Measurement(float('nan'), .5), Measurement(.7, .7), Measurement(1.5, -.5)):
            self.assertEqual(self.gate().decide(m).reason, 'PAD_OUTPUT_INVALID')
        self.assertEqual(self.gate().decide(type('M', (), {'real_score': 1, 'spoof_score': 0})()).decision, 'INCONCLUSIVE')

    def test_measurement_from_other_model_or_preprocessing_rejected(self):
        self.assertEqual(self.gate().decide(Measurement(.95, .05, model_version='other')).reason, 'PAD_MEASUREMENT_VERSION_MISMATCH')
        self.assertEqual(self.gate().decide(Measurement(.95, .05, preprocessing='rgb')).reason, 'PAD_MEASUREMENT_VERSION_MISMATCH')

    def test_threshold_applied_only_with_acceptable_record(self):
        self.assertEqual(self.gate().decide(Measurement(.95, .05)).decision, 'PASS')
        self.assertEqual(self.gate().decide(Measurement(.9, .1)).decision, 'PASS')
        self.assertEqual(self.gate().decide(Measurement(.89, .11)).decision, 'FAIL')

    def test_record_version_mismatch_blocks(self):
        for change in ({'crop_version': 'other'}, {'preprocessing': 'other'}, {'model_version': 'other'}, {'artifact_sha256': 'c' * 64}):
            d = self.gate(record(**change)).decide(Measurement(.99, .01))
            self.assertEqual(d.decision, 'NOT_EVALUATED')
            self.assertEqual(d.reason, 'PAD_EVALUATION_VERSION_MISMATCH')

    def test_insufficient_or_failing_evaluations_block(self):
        bad = [
            ({'bona_fide_trials': 299}, 'BONA_FIDE_TRIALS_INSUFFICIENT'),
            ({'bpcer': .2}, 'BPCER_NOT_ACCEPTABLE'),
            ({'report_sha256': 'nope'}, 'REPORT_SHA256_INVALID'),
            ({'real_score_threshold': 0}, 'EVALUATION_THRESHOLD_INVALID'),
            ({'subject_disjoint': False}, 'SUBJECT_DISJOINT_SPLITS_REQUIRED'),
            ({'evaluation_split': 'calibration'}, 'INDEPENDENT_EVALUATION_SPLIT_REQUIRED'),
            ({'dataset_manifest_sha256': ''}, 'DATASET_MANIFEST_SHA256_INVALID'),
            ({'bona_fide_subjects': 5}, 'BONA_FIDE_SUBJECTS_INSUFFICIENT'),
            ({'failure_to_acquire_rate': .5}, 'FAILURE_TO_ACQUIRE_NOT_ACCEPTABLE'),
            ({'limitations': ()}, 'LIMITATIONS_UNDOCUMENTED'),
            ({'protocol_reference': ''}, 'EVALUATION_PROVENANCE_MISSING'),
            ({'attacks': {'print': {'trials': 100, 'apcer': .01}, 'screen': {'trials': 100, 'apcer': .01}}}, 'ATTACK_TRIALS_INSUFFICIENT:video_replay'),
            ({'attacks': {k: {'trials': 100, 'apcer': .2} for k in ('print', 'screen', 'video_replay')}}, 'APCER_NOT_ACCEPTABLE:print'),
            ({'attacks': {k: {'trials': 99, 'apcer': 0} for k in ('print', 'screen', 'video_replay')}}, 'ATTACK_TRIALS_INSUFFICIENT:print'),
        ]
        for change, reason in bad:
            d = self.gate(record(**change)).decide(Measurement(.99, .01))
            self.assertEqual(d.decision, 'NOT_EVALUATED', change)
            self.assertEqual(d.reason, 'PAD_EVALUATION_REJECTED:' + reason)

    def test_good_evidence_without_approval_is_blocked_approval(self):
        for change in ({'approval_reference': None}, {'approval_reference': '  '}, {'approved_by_role': 'DEVELOPER'}, {'approved_by_role': None}):
            d = self.gate(record(**change)).decide(Measurement(.99, .01))
            self.assertEqual((d.decision, d.reason, d.evaluated), ('NOT_EVALUATED', 'PAD_BLOCKED_APPROVAL', False), change)

    def test_data_problems_reported_before_approval(self):
        d = self.gate(record(bona_fide_trials=1, approval_reference=None)).decide(Measurement(.99, .01))
        self.assertEqual(d.reason, 'PAD_EVALUATION_REJECTED:BONA_FIDE_TRIALS_INSUFFICIENT')

    def test_non_record_registry_entry_rejected(self):
        gate = PadDecisionGate(VERSION, PROFILE, CROP_VERSION, {VERSION: {'real_score_threshold': .1}})
        self.assertEqual(gate.decide(Measurement(.99, .01)).reason, 'PAD_EVALUATION_RECORD_INVALID')


if __name__ == '__main__':
    unittest.main()
