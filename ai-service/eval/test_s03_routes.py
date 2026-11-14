"""Integrated production route ownership and fail-closed smoke; no lifespan or media."""
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).parents[1]))
from fastapi.testclient import TestClient
import main

class IntegratedRoutes(unittest.TestCase):
    def test_production_routes(self):
        expected = {'/ai/v2/diagnose': 'recommendation.router', '/ai/face-verify': 'face_router',
                    '/api/v1/ai/verify-face': 'face_router', '/ai/face-enroll': 'face_router',
                    '/ai/face-capabilities': 'face_router'}
        from recommendation.router import router as recommendation
        from face_router import router as face
        for path, module in expected.items():
            routes = [r for r in [*recommendation.routes, *face.routes] if getattr(r, 'path', None) == path]
            self.assertEqual(len(routes), 1, path)
            self.assertEqual(routes[0].endpoint.__module__, module)
        paths = main.app.openapi()['paths']
        self.assertTrue(set(expected).issubset(paths))
        self.assertFalse(any('research' in path for path in paths))
        client = TestClient(main.app)
        with patch('recommendation.router.decode_image_to_cv2', return_value=None):
            response = client.post('/ai/v2/diagnose', json={})
        self.assertEqual(response.status_code, 200)
        self.assertIn('targetCandidates', response.json())
        self.assertIn('categoryCandidates', response.json())
        with patch.dict(os.environ, {'AI_FACE_SERVICE_TOKEN': ''}):
            self.assertEqual(client.post('/ai/face-verify', json={}).status_code, 503)
        with patch.dict(os.environ, {'AI_FACE_SERVICE_TOKEN': 's03-synthetic'}):
            response = client.post('/ai/face-verify', json={}, headers={'x-face-service-token': 's03-synthetic'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['verified'])
        self.assertEqual(response.json()['padDecision'], 'NOT_EVALUATED')
        self.assertNotIn('embedding', response.json())
        self.assertNotIn('proof', response.json())
