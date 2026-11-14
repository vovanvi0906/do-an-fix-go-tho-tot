"""Synthetic approved-record wiring tests; fixtures are NOT evaluation evidence."""
import base64
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock
import cv2
import numpy as np
sys.path.insert(0, str(Path(__file__).parents[1]))
from face_pad import EvaluatedMn3Pad
from face_core import enroll_capture, compare_capture, FacePolicy
from pad_mn3 import Measurement, VERSION
from eval.test_pad_policy import record
from eval.test_face_research import Detector, Recognizer

class EvaluatedProviderTests(unittest.TestCase):
    def setUp(self):
        self.model = Mock(error=None)
        self.model.measure.return_value = Measurement(.95,.05)
        self.provider = EvaluatedMn3Pad('/unused', model=self.model, registry={VERSION:record()})
        self.image = np.random.default_rng(4).integers(70,190,(160,160,3),dtype=np.uint8)
        _, encoded = cv2.imencode('.png',self.image)
        self.photo = 'data:image/png;base64,'+base64.b64encode(encoded).decode()
    def test_runtime_without_review_never_releases_template(self):
        provider = EvaluatedMn3Pad('/unused',model=self.model)
        self.assertFalse(provider.capabilities()['padEvaluated'])
        result = enroll_capture(self.photo,1,'model',Detector(),Recognizer(),'model',FacePolicy(),provider)
        self.assertNotIn('embedding',result)
        self.assertEqual(result['padDecision'],'NOT_EVALUATED')
    def test_approved_exact_provider_can_release_embedding_to_internal_backend(self):
        result = enroll_capture(self.photo,1,'model',Detector(),Recognizer(),'model',FacePolicy(),self.provider)
        self.assertEqual(result['padDecision'],'PASS'); self.assertEqual(len(result['embedding']),128)
        self.assertEqual(result['padModelVersion'],VERSION); self.assertFalse(result['verified'])
        compared = compare_capture(self.photo,result['embedding'],1,'model',Detector(),Recognizer(),'model',FacePolicy(),self.provider)
        self.assertEqual(compared['identityDecision'],'MATCH'); self.assertEqual(compared['padDecision'],'PASS')
    def test_fail_or_error_prevents_enrollment(self):
        self.model.measure.return_value = Measurement(.2,.8)
        result = enroll_capture(self.photo,1,'model',Detector(),Recognizer(),'model',FacePolicy(),self.provider)
        self.assertEqual(result['padDecision'],'FAIL'); self.assertNotIn('embedding',result)
        self.model.measure.side_effect = RuntimeError('failure')
        result = enroll_capture(self.photo,1,'model',Detector(),Recognizer(),'model',FacePolicy(),self.provider)
        self.assertEqual(result['padDecision'],'INCONCLUSIVE'); self.assertNotIn('embedding',result)
if __name__ == '__main__': unittest.main()
