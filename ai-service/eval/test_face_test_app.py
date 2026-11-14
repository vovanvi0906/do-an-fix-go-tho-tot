"""Sandbox flow tests using synthetic pixels, not biometric accuracy tests."""
import base64
import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch
import cv2
import numpy as np
from fastapi.testclient import TestClient
sys.path.insert(0, str(Path(__file__).parents[1]))
from face_test_app import create_app
from pad_mn3 import Measurement

class Detector:
    def setInputSize(self, size): pass
    def detect(self, image):
        return None, np.array([[10, 10, 100, 100] + [30, 30] * 5 + [.99]], dtype=np.float32)
class Recognizer:
    def alignCrop(self, image, face): return image
    def feature(self, image): return np.ones((1, 128), np.float32)
    def match(self, *args): return .8

class FaceSandboxTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {'FACE_TEST_LOCAL_ONLY': 'true', 'FACE_TEST_TOKEN': 's' * 40})
        self.env.start()
        self.now = 1000
        self.models = SimpleNamespace(detector=Detector(), recognizer=Recognizer(), model_version='unit-test', error_code=None)
        self.pad = Mock(error=None)
        self.pad.measure.return_value = Measurement(.95, .05)
        self.client = TestClient(create_app(self.models, self.pad, lambda: self.now))
        self.client.__enter__()
        self.headers = {'x-face-test-token': 's' * 40}
        image = np.random.default_rng(12).integers(70, 190, (160, 160, 3), dtype=np.uint8)
        _, encoded = cv2.imencode('.png', image)
        self.photo = 'data:image/png;base64,' + base64.b64encode(encoded).decode()
    def tearDown(self):
        self.client.__exit__(None, None, None); self.env.stop()
    def workspace(self):
        r = self.client.post('/workspaces', headers=self.headers, json={'consent': True})
        self.assertEqual(r.status_code, 200)
        return {**self.headers, 'x-face-workspace': r.json()['workspace']}
    def session(self, headers, purpose='ENROLL'):
        r = self.client.post('/sessions', headers=headers, json={'purpose': purpose})
        self.assertEqual(r.status_code, 200); return r.json()
    def capture(self, headers, session, photo=None):
        return self.client.post('/sessions/' + session['id'] + '/capture', headers=headers,
                                json={'nonce': session['nonce'], 'photo': photo or self.photo})
    def test_consent_auth_and_local_mode_required(self):
        self.assertEqual(self.client.get('/capabilities').status_code, 401)
        self.assertEqual(self.client.post('/workspaces', headers=self.headers, json={'consent': False}).status_code, 400)
        with patch.dict(os.environ, {'FACE_TEST_LOCAL_ONLY': 'false'}):
            self.assertEqual(self.client.get('/capabilities', headers=self.headers).status_code, 503)
    def test_enroll_verify_no_authority_or_biometric_output(self):
        h = self.workspace()
        enrolled = self.capture(h, self.session(h)).json()
        self.assertTrue(enrolled['testAccepted']); self.assertEqual(enrolled['templateVersion'], 1)
        measured = self.capture(h, self.session(h, 'VERIFY')).json()
        self.assertTrue(measured['testAccepted']); self.assertEqual(measured['identityScore'], .8)
        self.assertFalse(measured['verified']); self.assertIsNone(measured['proof'])
        self.assertEqual(measured['padDecision'], 'NOT_EVALUATED')
        self.assertNotIn('embedding', measured); self.assertNotIn('photo', measured)
    def test_no_template_on_pad_failure_and_technical_error(self):
        h = self.workspace(); self.pad.measure.return_value = Measurement(.2, .8)
        result = self.capture(h, self.session(h)).json()
        self.assertFalse(result['testAccepted']); self.assertFalse(result['templateStoredInMemory'])
        self.pad.measure.side_effect = RuntimeError('failure')
        result = self.capture(h, self.session(h)).json()
        self.assertFalse(result['testAccepted']); self.assertIsNone(result['padRealScore'])
        self.assertFalse(result['templateStoredInMemory'])
    def test_reject_blur_even_when_pad_good(self):
        h = self.workspace()
        _, image = cv2.imencode('.png', np.full((160, 160, 3), 120, np.uint8))
        result = self.capture(h, self.session(h), 'data:image/png;base64,' + base64.b64encode(image).decode()).json()
        self.assertFalse(result['testAccepted']); self.assertIn('BLUR', result['reasons'])
        self.assertFalse(result['templateStoredInMemory'])
    def test_single_use_expiry_wrong_nonce_and_workspace(self):
        a, b = self.workspace(), self.workspace(); s = self.session(a)
        self.assertEqual(self.capture(b, s).status_code, 409)
        self.assertEqual(self.capture(a, {**s, 'nonce': 'wrong'}).status_code, 403)
        self.assertEqual(self.capture(a, s).status_code, 200)
        self.assertEqual(self.capture(a, s).status_code, 409)
        expired = self.session(b); self.now += 121
        self.assertEqual(self.capture(b, expired).status_code, 409)
        self.now += 1801
        self.assertEqual(self.client.post('/sessions', headers=b, json={'purpose': 'ENROLL'}).status_code, 410)
    def test_mismatch_delete_and_reenrollment_guard(self):
        h = self.workspace(); self.capture(h, self.session(h))
        self.assertEqual(self.client.post('/sessions', headers=h, json={'purpose': 'ENROLL'}).status_code, 409)
        self.models.recognizer.match = lambda *args: .2
        result = self.capture(h, self.session(h, 'VERIFY')).json()
        self.assertFalse(result['testAccepted']); self.assertEqual(result['identityDecision'], 'TEST_NON_MATCH')
        self.assertTrue(self.client.delete('/workspace', headers=h).json()['deleted'])
        self.assertEqual(self.client.post('/sessions', headers=h, json={'purpose': 'VERIFY'}).status_code, 410)
    def test_bad_image_consumes_session_and_no_external_fetch(self):
        h = self.workspace(); s = self.session(h)
        self.assertEqual(self.capture(h, s, 'https://example.org/person.jpg').status_code, 400)
        self.assertEqual(self.capture(h, s).status_code, 409)
if __name__ == '__main__': unittest.main()
