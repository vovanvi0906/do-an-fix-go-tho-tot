import sys
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import Mock
import numpy as np
sys.path.insert(0, str(Path(__file__).parents[1]))
from pad_mn3 import ExperimentalMn3Pad, preprocess, validate_output, MEAN, SCALE

class Mn3Tests(unittest.TestCase):
    def provider(self, output=None):
        p = ExperimentalMn3Pad('/missing-pad-model')
        p.error = None
        p.request = Mock()
        p.request.wait_for.return_value = True
        p.request.get_output_tensor.return_value.data = np.array([[.9,.1]] if output is None else output)
        return p
    def test_missing(self):
        self.assertEqual(ExperimentalMn3Pad('/missing-pad-model').assess(None).error_code, 'PAD_MODEL_MISSING')
    def test_checksum(self):
        with tempfile.NamedTemporaryFile() as f:
            f.write(b'not a model'); f.flush()
            self.assertEqual(ExperimentalMn3Pad(f.name).assess(None).error_code, 'PAD_CHECKSUM_MISMATCH')
    def test_channel_normalization(self):
        crop=np.full((128,128,3),[10,30,90],dtype=np.uint8)
        np.testing.assert_allclose(preprocess(crop)[0,:,0,0], (np.array([90,30,10])-MEAN)/SCALE)
    def test_preprocessing_invalid(self):
        for crop in [None,np.zeros((128,128,3)),np.zeros((1,3,128,128),dtype=np.uint8)]:
            self.assertEqual(self.provider().assess(crop).error_code,'PAD_PREPROCESS_INVALID')
        with self.assertRaises(ValueError): preprocess(np.zeros((128,128,3),dtype=np.uint8),'RGB')
    def test_invalid_outputs(self):
        for value in [[[float('nan'),0]],[[float('inf'),0]],[[2,-1]],[[.2,.2]],[.5,.5]]:
            self.assertEqual(self.provider(value).assess(np.zeros((128,128,3),dtype=np.uint8)).error_code,'PAD_OUTPUT_INVALID')
    def test_timeout_poison(self):
        p=self.provider(); p.request.wait_for.return_value=False
        self.assertEqual(p.assess(np.zeros((128,128,3),dtype=np.uint8)).error_code,'PAD_TIMEOUT')
        p.request.wait_for.return_value=True
        self.assertEqual(p.assess(np.zeros((128,128,3),dtype=np.uint8)).error_code,'PAD_TIMEOUT')
        self.assertEqual(p.request.start_async.call_count,1)
    def test_technical_error(self):
        p=self.provider(); p.request.start_async.side_effect=Exception('secret detail')
        evidence=p.assess(np.zeros((128,128,3),dtype=np.uint8))
        self.assertEqual((evidence.decision,evidence.error_code),('INCONCLUSIVE','PAD_TECHNICAL_ERROR'))
    def test_valid_scores_never_authorize(self):
        for output in [[[1.,0.]],[[0.,1.]],[[.5,.5]]]:
            self.assertEqual(self.provider(output).assess(np.zeros((128,128,3),dtype=np.uint8)).decision,'NOT_EVALUATED')
    def test_busy(self):
        p=self.provider(); p.lock.acquire()
        try: self.assertEqual(p.assess(np.zeros((128,128,3),dtype=np.uint8)).error_code,'PAD_BUSY')
        finally: p.lock.release()
