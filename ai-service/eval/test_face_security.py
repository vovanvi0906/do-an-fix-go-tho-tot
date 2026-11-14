"""Offline production module/ASGI tests. Synthetic pixels/vectors; no weights or network."""
import asyncio
import base64
import json
import math
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parents[1]))
import cv2
import numpy as np
from fastapi import FastAPI
from fastapi.testclient import TestClient
from face_core import FacePolicy, compare_capture, decode_capture, extract_embedding, outcome
from face_router import router


class Detector:
    def __init__(self, count=1): self.count = count
    def setInputSize(self, size): self.size = size
    def detect(self, image):
        face = np.array([10, 10, 100, 100] + [30, 30] * 5 + [.99])
        return None, np.array([face] * self.count) if self.count else None


class Recognizer:
    def __init__(self, score=.8): self.score = score
    def alignCrop(self, image, face): return image
    def feature(self, image): return np.ones((1, 128), dtype=np.float32)
    def match(self, *args): return self.score


class FaceTests(unittest.TestCase):
    def setUp(self):
        self.image = np.random.default_rng(42).integers(60, 200, (160, 160, 3), dtype=np.uint8)
        self.template = [.125] * 128

    def compare(self, **kw):
        args = dict(capture=b'synthetic', template=self.template, version=1, expected_model='synthetic-v1',
                    detector=Detector(), recognizer=Recognizer(), model_version='synthetic-v1', policy=FacePolicy())
        args.update(kw)
        with patch('face_core.decode_capture', return_value=self.image):
            return compare_capture(**args)

    def test_identity_match_is_not_pad_or_proof(self):
        r = self.compare()
        self.assertEqual(r['identityDecision'], 'MATCH')
        self.assertEqual(r['identityScore'], .8)
        self.assertEqual(r['padDecision'], 'NOT_EVALUATED')
        self.assertNotIn('proof', r)
        self.assertEqual(r['templateVersion'], 1)

    def test_non_match(self):
        self.assertEqual(self.compare(recognizer=Recognizer(.2))['identityDecision'], 'NON_MATCH')

    def test_missing_models(self):
        for kwargs in [dict(detector=None), dict(recognizer=None), dict(model_version=None)]:
            self.assertEqual(self.compare(**kwargs)['identityDecision'], 'TECHNICAL_ERROR')

    def test_invalid_templates_and_versions(self):
        for template in [None, [], [0] * 128, [float('nan')] * 128, [True] * 128]:
            self.assertEqual(self.compare(template=template)['identityDecision'], 'INCONCLUSIVE')
        for version in [None, True, 0, '1']:
            self.assertEqual(self.compare(version=version)['identityDecision'], 'INCONCLUSIVE')
        self.assertEqual(self.compare(expected_model='different')['errorCode'], 'MODEL_VERSION_MISMATCH')

    def test_no_and_multiple_faces(self):
        for count, code in [(0, 'NO_FACE'), (2, 'MULTIPLE_FACES')]:
            self.assertEqual(self.compare(detector=Detector(count))['errorCode'], code)

    def test_quality(self):
        for value, code in [(5, 'LIGHTING'), (250, 'LIGHTING'), (100, 'BLUR')]:
            self.image[:] = value
            r = self.compare()
            self.assertEqual(r['errorCode'], code)
            self.assertEqual(r['qualityDecision'], 'FAIL')

    def test_invalid_scores(self):
        for score in [float('nan'), float('inf'), '0.9', True, 2, -2, None]:
            self.assertEqual(self.compare(recognizer=Recognizer(score))['identityDecision'], 'TECHNICAL_ERROR')

    def test_feature_and_alignment_failure(self):
        for method, returned in [('feature', np.ones((1, 64))), ('feature', np.full((1, 128), np.nan)), ('alignCrop', None)]:
            with patch.object(Recognizer, method, return_value=returned):
                self.assertEqual(self.compare()['identityDecision'], 'TECHNICAL_ERROR')
        with patch.object(Recognizer, 'feature', side_effect=RuntimeError('do not log biometric input')):
            self.assertEqual(self.compare()['identityDecision'], 'TECHNICAL_ERROR')

    def test_face_threshold_separate_and_finite(self):
        self.assertEqual(self.compare(policy=FacePolicy(threshold=.9))['identityDecision'], 'NON_MATCH')
        for value in [math.nan, math.inf, 2]:
            with self.assertRaises(ValueError): FacePolicy(threshold=value)

    def test_decode_inline_only(self):
        for value in ['https://example.test/private', '/tmp/private', 'data:image/jpeg;base64,INVALID', b'invalid']:
            with self.assertRaises(Exception): decode_capture(value)
        _, encoded = cv2.imencode('.png', self.image)
        inline = 'data:image/png;base64,' + base64.b64encode(encoded).decode()
        self.assertEqual(decode_capture(inline).shape, self.image.shape)


class RouterTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)
        self.client = TestClient(self.app)
        self.secret = patch.dict(os.environ, {'AI_FACE_SERVICE_TOKEN': 'synthetic-token'})
        self.secret.start()
        self.headers = {'x-face-service-token': 'synthetic-token'}
    def tearDown(self): self.secret.stop()

    def test_auth_fail_closed(self):
        self.assertEqual(self.client.post('/ai/face-verify', json={}).status_code, 401)
        with patch.dict(os.environ, {'AI_FACE_SERVICE_TOKEN': ''}):
            self.assertEqual(self.client.post('/ai/face-verify', json={}).status_code, 503)

    def test_json_contract_and_model_unavailable(self):
        response = self.client.post('/ai/face-verify', json={'workerId': 'synthetic-w', 'sessionId': 's'}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['identityDecision'], 'TECHNICAL_ERROR')
        self.assertFalse(response.json()['verified'])
        self.assertEqual(response.json()['sessionId'], 's')
        self.assertEqual(self.client.post('/api/v1/ai/verify-face', json={}, headers=self.headers).status_code, 200)
        self.assertEqual(self.client.post('/ai/face-verify', json=[], headers=self.headers).status_code, 400)
        self.assertEqual(self.client.post('/ai/face-verify', content=b'bad', headers=self.headers).status_code, 415)
        self.assertEqual(self.client.post('/ai/face-verify', content=b'{', headers={**self.headers, 'content-type': 'application/json'}).status_code, 400)

    def test_payload_size(self):
        self.assertEqual(self.client.post('/ai/face-verify', content=b' ' * 7_100_000,
            headers={**self.headers, 'content-type': 'application/json'}).status_code, 413)


if __name__ == '__main__': unittest.main()
