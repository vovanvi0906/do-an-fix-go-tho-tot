"""Mathematical unit fixtures only, not experimental biometric metrics."""
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).parent))
from face_metrics import summarize
class MetricsTests(unittest.TestCase):
    def row(self,id,task,label,score=None,outcome='SCORED',**extra):return dict(trial_id=id,task=task,label=label,score=score,outcome=outcome,**extra)
    def test_empty_never_becomes_zero_error(self):
        r=summarize([],.6,.5);self.assertEqual(r['status'],'NOT_MEASURED');self.assertIsNone(r['identity']['fmr']);self.assertIsNone(r['pad']['bpcer'])
    def test_identity_denominators_keep_nonacquisition_separate(self):
        rows=[self.row('g1','identity','genuine',.8),self.row('g2','identity','genuine',.4),self.row('g3','identity','genuine',outcome='NO_FACE'),self.row('i1','identity','impostor',.7),self.row('i2','identity','impostor',.1)]
        r=summarize(rows,.6,.5)['identity'];self.assertEqual(r['fnmr'],.5);self.assertEqual(r['fmr'],.5);self.assertEqual(r['genuine_operational_non_accept_rate'],2/3)
    def test_pad_species_denominators(self):
        rows=[self.row('p','pad','print',.9),self.row('s','pad','screen',.1),self.row('b','pad','bona_fide',.9)]
        r=summarize(rows,.6,.5)['pad'];self.assertEqual(r['apcer_by_attack']['print'],1);self.assertEqual(r['apcer_by_attack']['screen'],0);self.assertIsNone(r['apcer_by_attack']['video_replay']);self.assertEqual(r['missing_attack_types'],['video_replay'])
    def test_latency_uses_observed_values_only(self):
        rows=[self.row('a','identity','genuine',.8,cpu_inference_ms=10),self.row('b','identity','genuine',.8,cpu_inference_ms=30)]
        r=summarize(rows,.6,.5)['identity']['latency'];self.assertEqual(r['cpu_inference_ms']['p50'],20);self.assertIsNone(r['end_to_end_ms']['p95'])
    def test_invalid_duplicate_and_image_payloads_reject(self):
        for rows in [[self.row('x','pad','print',float('nan'))],[self.row('x','pad','print',.5)]*2,[self.row('x','identity','genuine',.9,image='forbidden')]]:
            with self.assertRaises(ValueError):summarize(rows,.6,.5)
