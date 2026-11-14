"""Local-artifact smoke tests; never downloads, never reads photos or people."""
import base64
import os
import sys
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).parents[1]))
import cv2
import numpy as np
from face_models import ARTIFACTS, load_face_models
from face_core import FacePolicy, compare_capture, enroll_capture
from test_face_security import Detector, Recognizer
from face_router import router
from fastapi import FastAPI
from fastapi.testclient import TestClient

class EnrollmentBoundaryTests(unittest.TestCase):
    def test_quality_sample_never_releases_embedding_without_pad(self):
        image=np.random.default_rng(42).integers(60,200,(160,160,3),dtype=np.uint8)
        with patch('face_core.decode_capture',return_value=image):
            result=enroll_capture(b'synthetic',1,'synthetic',Detector(),Recognizer(),'synthetic',FacePolicy())
        self.assertEqual(result['qualityDecision'],'PASS')
        self.assertEqual(result['padDecision'],'NOT_EVALUATED')
        self.assertFalse(result['verified']); self.assertNotIn('embedding',result)
    def test_identity_match_remains_separate_and_cannot_be_authorization(self):
        image=np.random.default_rng(42).integers(60,200,(160,160,3),dtype=np.uint8)
        with patch('face_core.decode_capture',return_value=image):
            result=compare_capture(b'synthetic',[.125]*128,1,'synthetic',Detector(),Recognizer(),'synthetic',FacePolicy())
        self.assertEqual(result['identityDecision'],'MATCH'); self.assertTrue(result['identityMatched'])
        self.assertFalse(result['verified']); self.assertEqual(result['padDecision'],'NOT_EVALUATED')
    def test_missing_or_wrong_hash_artifacts_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(load_face_models(directory).error_code,'MODEL_FILES_UNAVAILABLE')
            for name in ARTIFACTS: (Path(directory)/name).write_bytes(b'synthetic-invalid-model')
            self.assertEqual(load_face_models(directory).error_code,'MODEL_HASH_MISMATCH')

@unittest.skipUnless(os.environ.get('FACE_TEST_MODEL_DIR'), 'explicit local weights directory required; no download fallback')
class ActualModelSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models=load_face_models(os.environ['FACE_TEST_MODEL_DIR'])
        if cls.models.error_code: raise AssertionError(cls.models.error_code)
    def test_real_detector_rejects_blank_capture_and_real_recognizer_emits_finite_shape(self):
        models=self.models
        blank=np.zeros((320,320,3),dtype=np.uint8)
        models.detector.setInputSize((320,320)); _, faces=models.detector.detect(blank)
        self.assertTrue(faces is None or len(faces)==0)
        # Synthetic noise is NOT a face/template and not an identity accuracy experiment.
        feature=models.recognizer.feature(np.random.default_rng(42).integers(0,255,(112,112,3),dtype=np.uint8))
        self.assertEqual(feature.shape,(1,128)); self.assertTrue(np.isfinite(feature).all())
    def test_actual_router_capabilities_and_enrollment_fail_closed_with_real_loaded_models(self):
        app=FastAPI(); app.include_router(router)
        app.state.face_detector=self.models.detector; app.state.face_recognizer=self.models.recognizer
        app.state.face_model_version=self.models.model_version
        _, encoded=cv2.imencode('.png',np.zeros((320,320,3),dtype=np.uint8))
        photo='data:image/png;base64,'+base64.b64encode(encoded).decode()
        with patch.dict(os.environ,{'AI_FACE_SERVICE_TOKEN':'synthetic-local-smoke-token'}),TestClient(app) as client:
            headers={'x-face-service-token':'synthetic-local-smoke-token'}
            caps=client.get('/ai/face-capabilities',headers=headers).json()
            self.assertTrue(caps['identityModelReady']); self.assertFalse(caps['padEvaluated'])
            result=client.post('/ai/face-enroll',headers=headers,json=dict(workerId='synthetic',sessionId='synthetic',templateVersion=1,modelVersion=self.models.model_version,photo=photo)).json()
            self.assertEqual(result['errorCode'],'NO_FACE'); self.assertFalse(result['verified']); self.assertNotIn('embedding',result)
