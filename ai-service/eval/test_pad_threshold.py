"""Synthetic wiring tests, not a PAD evaluation report."""
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock
import numpy as np
sys.path.insert(0,str(Path(__file__).parents[1]))
from face_pad import ThresholdMn3Pad, configured_pad
from pad_mn3 import Measurement, VERSION
from eval.test_face_research import Detector

class ThresholdTests(unittest.TestCase):
    def provider(self, real=.9):
        model=Mock(error=None)
        model.measure.return_value=Measurement(real,1-real)
        return ThresholdMn3Pad('/unused',.85,model=model)
    def test_real_model_decision_is_not_evaluation_approval(self):
        p=self.provider()
        self.assertTrue(p.capabilities()['padExperimentalReady'])
        self.assertFalse(p.capabilities()['padEvaluated'])
        self.assertIsNone(p.capabilities()['padEvaluationReference'])
        result=p.assess((np.zeros((160,160,3),dtype=np.uint8),Detector()))
        self.assertEqual(result.decision,'PASS')
        self.assertEqual(result.model_version,VERSION)
        self.assertEqual(p.model.measure.call_args.args[0].shape,(128,128,3))
    def test_low_spoof_and_invalid_scores_never_pass(self):
        self.assertEqual(self.provider(.2).decide_measurement(Measurement(.2,.8)).decision,'FAIL')
        self.assertEqual(self.provider().decide_measurement(Measurement(float('nan'),.1)).decision,'INCONCLUSIVE')
    def test_missing_model_and_exceptions_do_not_pass(self):
        p=self.provider();p.model.error='PAD_MODEL_MISSING'
        self.assertFalse(p.capabilities()['padExperimentalReady'])
        self.assertEqual(p.assess((None,None)).decision,'NOT_EVALUATED')
        p.model.error=None;p.model.measure.side_effect=RuntimeError('timeout')
        self.assertEqual(p.assess((np.zeros((160,160,3),dtype=np.uint8),Detector())).decision,'INCONCLUSIVE')
    def test_invalid_thresholds_and_production_rejected(self):
        for t in [0,1,float('nan'),True]:
            with self.assertRaises(ValueError):ThresholdMn3Pad('/unused',t,model=Mock(error=None))
        with self.assertRaisesRegex(ValueError,'PRODUCTION'):
            configured_pad({'FACE_PAD_MODEL_PATH':'/unused','FACE_PAD_MODE':'experimental','APP_ENV':'production'})
if __name__=='__main__':unittest.main()
