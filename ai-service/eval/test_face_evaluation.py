"""Mathematical/validation fixtures for face_evaluation.py. Synthetic numbers, NOT biometric results."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from face_evaluation import (calibrate_and_evaluate, select_threshold, validate_manifest, wilson, pad_metrics,
                             identity_metrics, DEFAULT_MINIMUMS)

COND = {'lighting': 'normal', 'motion': 'none', 'occlusion': 'none', 'faces': 'single'}


def sample(i, subject, attack='bona_fide', split='calibration', device='DEV-A', **cond):
    return {'sample_id': f'x{i}', 'subject_id': subject, 'capture_device': device, 'attack_type': attack,
            'ground_truth': 'bona_fide' if attack == 'bona_fide' else 'attack', 'consent_reference': 'CONSENT-SYN-1',
            'model_version': 'm', 'conditions': {**COND, **cond}, 'media_sha256': f'{i:064x}', 'split': split,
            'evaluated_at': '2026-11-14T10:00:00Z'}


def pad(i, label, score, outcome='SCORED', ms=3.0):
    return {'trial_id': f'x{i}', 'task': 'pad', 'label': label, 'outcome': outcome,
            'score': score if outcome == 'SCORED' else None, 'cpu_inference_ms': ms, 'end_to_end_ms': None}


class ManifestTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(validate_manifest([sample(1, 'S001'), sample(2, 'S002', split='evaluation')]), {'calibration': 1, 'evaluation': 1})

    def test_rejections(self):
        cases = [
            ([sample(1, 'S001'), sample(2, 'S001', split='evaluation')], 'SUBJECT_OVERLAP'),
            ([{**sample(1, 'S001'), 'name': 'x'}], 'MANIFEST_FIELDS_EXACT'),
            ([{**sample(1, 'Nguyen Van A')}], 'SUBJECT_PSEUDONYM'),
            ([{**sample(1, 'S001'), 'ground_truth': 'attack'}], 'GROUND_TRUTH_INCONSISTENT'),
            ([{**sample(1, 'S001'), 'consent_reference': ''}], 'CONSENT_REFERENCE_REQUIRED'),
            ([sample(1, 'S001'), {**sample(2, 'S002'), 'media_sha256': f'{1:064x}'}], 'DUPLICATE_MEDIA'),
            ([sample(1, 'S001'), sample(1, 'S002')], 'SAMPLE_ID'),
            ([{**sample(1, 'S001'), 'split': 'test'}], 'SPLIT_INVALID'),
            ([sample(1, 'S001', lighting='dim')], 'CONDITIONS_INVALID'),
            ([{**sample(1, 'S001'), 'evaluated_at': 'yesterday'}], 'EVALUATED_AT'),
        ]
        for entries, code in cases:
            with self.assertRaisesRegex(ValueError, code):
                validate_manifest(entries)


class MetricTests(unittest.TestCase):
    def test_wilson(self):
        self.assertIsNone(wilson(0, 0))
        lo, hi = wilson(0, 100)
        self.assertEqual(lo, 0.0); self.assertAlmostEqual(hi, 0.037, places=3)

    def test_threshold_selected_just_above_worst_attack(self):
        rows = [pad(1, 'print', .3), pad(2, 'screen', .6), pad(3, 'video_replay', .2), pad(4, 'bona_fide', .9)]
        t = select_threshold(rows, 'pad', 0.0)
        self.assertGreater(t, .6); self.assertLess(t, .6000001)
        self.assertIsNone(select_threshold([pad(1, 'print', .3)], 'pad', 0.0))  # missing attack types

    def test_pad_metrics_separate_acquisition_and_technical(self):
        man = {f'x{i}': sample(i, 'S001') for i in range(1, 9)}
        rows = [pad(1, 'bona_fide', .9), pad(2, 'bona_fide', .2), pad(3, 'bona_fide', None, 'NO_FACE'),
                pad(4, 'bona_fide', None, 'TIMEOUT'), pad(5, 'print', .8), pad(6, 'print', .1),
                pad(7, 'screen', .1), pad(8, 'video_replay', None, 'TECHNICAL_ERROR')]
        m = pad_metrics(rows, .5, man, {**DEFAULT_MINIMUMS, 'per_condition': 1})
        self.assertEqual(m['bpcer']['rate'], .5)                          # 1 of 2 scored bona fide rejected
        self.assertEqual(m['by_label']['bona_fide']['failure_to_acquire']['rate'], .25)
        self.assertEqual(m['by_label']['bona_fide']['technical_failure']['rate'], .25)
        self.assertEqual(m['apcer']['print']['rate'], .5)
        self.assertEqual(m['apcer']['screen']['rate'], 0)
        self.assertIsNone(m['apcer']['video_replay']['rate'])            # no scored replay → not 0
        self.assertEqual(m['apcer_max'], .5); self.assertEqual(m['acer'], .5)
        self.assertTrue(any('video_replay' in b for b in m['blocked']))

    def test_identity_metrics(self):
        rows = [{'trial_id': 'g', 'task': 'identity', 'label': 'genuine', 'outcome': 'SCORED', 'score': .4, 'cpu_inference_ms': None, 'end_to_end_ms': 100},
                {'trial_id': 'i', 'task': 'identity', 'label': 'impostor', 'outcome': 'SCORED', 'score': .7, 'cpu_inference_ms': None, 'end_to_end_ms': 120},
                {'trial_id': 'q', 'task': 'identity', 'label': 'genuine', 'outcome': 'QUALITY_REJECTED', 'score': None, 'cpu_inference_ms': None, 'end_to_end_ms': None}]
        m = identity_metrics(rows, .6, DEFAULT_MINIMUMS)
        self.assertEqual((m['fmr']['rate'], m['fnmr']['rate']), (1.0, 1.0))
        self.assertAlmostEqual(m['quality_rejection']['rate'], 1 / 3)
        self.assertEqual(m['genuine_score_histogram'], {'0.40': 1})
        self.assertEqual(m['verification_latency_ms']['p50'], 110)


class ProcedureTests(unittest.TestCase):
    def build(self, n_subjects=8):
        manifest, trials, i = [], [], 0
        for split in ('calibration', 'evaluation'):
            for s in range(n_subjects):
                subject = f'S{(0 if split == "calibration" else 500) + s:03d}'
                for label, score in (('bona_fide', .9), ('print', .2), ('screen', .3), ('video_replay', .1)):
                    i += 1
                    manifest.append(sample(i, subject, label, split)); trials.append(pad(i, label, score))
        ids = [m for m in manifest if m['attack_type'] == 'bona_fide']
        for a, b in zip(ids[:n_subjects], ids[1:n_subjects]):  # impostor pairs within calibration
            trials.append({'trial_id': f'p{a["sample_id"]}', 'task': 'identity', 'label': 'impostor', 'outcome': 'SCORED', 'score': .2,
                           'cpu_inference_ms': None, 'end_to_end_ms': None, 'probe_sample_id': a['sample_id'], 'reference_sample_id': b['sample_id']})
        return trials, manifest

    def test_insufficient_data_is_blocked_not_a_pass(self):
        trials, manifest = self.build()
        r = calibrate_and_evaluate(trials, manifest, {'pad_max_apcer': .05, 'identity_max_fmr': .001})
        self.assertEqual(r['status'], 'BLOCKED_DATA')
        self.assertTrue(r['pad_threshold'] > .3)
        self.assertEqual(r['pad']['apcer']['print']['rate'], 0)
        self.assertTrue(any('bona_fide:scored 8 < 300' in b for b in r['blocked']))

    def test_threshold_chosen_on_calibration_only(self):
        trials, manifest = self.build()
        # Make evaluation attacks stronger than any calibration attack: threshold must NOT adapt.
        for t in trials:
            if t['task'] == 'pad' and t['label'] == 'print' and int(t['trial_id'][1:]) > 32:
                t['score'] = .95
        r = calibrate_and_evaluate(trials, manifest, {'pad_max_apcer': 0, 'identity_max_fmr': 0}, {'per_condition': 1})
        self.assertLess(r['pad_threshold'], .31)
        self.assertEqual(r['pad']['apcer']['print']['rate'], 1.0)   # honestly reported failure

    def test_cross_split_identity_pair_rejected(self):
        trials, manifest = self.build()
        trials.append({'trial_id': 'bad', 'task': 'identity', 'label': 'impostor', 'outcome': 'SCORED', 'score': .1,
                       'cpu_inference_ms': None, 'end_to_end_ms': None, 'probe_sample_id': 'x1', 'reference_sample_id': 'x33'})
        with self.assertRaisesRegex(ValueError, 'CROSSES_SPLITS'):
            calibrate_and_evaluate(trials, manifest, {'pad_max_apcer': .05, 'identity_max_fmr': .001})

    def test_trial_cannot_carry_images_or_unscored_score(self):
        trials, manifest = self.build()
        for bad in ({**trials[0], 'image': 'x'}, {**trials[0], 'outcome': 'NO_FACE'}):
            with self.assertRaises(ValueError):
                calibrate_and_evaluate([bad] + trials[1:], manifest, {'pad_max_apcer': .05, 'identity_max_fmr': .001})

    def test_empty_inputs(self):
        r = calibrate_and_evaluate([], [], {'pad_max_apcer': .05, 'identity_max_fmr': .001})
        self.assertEqual(r['status'], 'BLOCKED_DATA'); self.assertIsNone(r['pad_threshold'])


if __name__ == '__main__':
    unittest.main()
