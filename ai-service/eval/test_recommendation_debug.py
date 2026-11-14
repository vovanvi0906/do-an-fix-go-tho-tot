"""ASGI auth/contracts; real model HTTP evidence is separate."""
import os
import unittest
from unittest.mock import patch
import httpx
from fastapi import FastAPI
from recommendation.router import router
from recommendation.catalog_manager import publish_catalog_snapshot, get_catalog_state

class RecommendationDebugTests(unittest.IsolatedAsyncioTestCase):
    async def request(self, token=None):
        app=FastAPI();app.include_router(router)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as c:
            return await c.post('/ai/v2/internal/diagnose-debug',headers={'x-recommendation-debug-token':token} if token else {},json={})
    async def test_disabled_by_default(self):
        with patch.dict(os.environ,{'RECOMMENDATION_DEBUG_ENABLED':'false','NODE_ENV':'test'}):
            self.assertEqual((await self.request()).status_code,404)
    async def test_never_enabled_in_production(self):
        with patch.dict(os.environ,{'RECOMMENDATION_DEBUG_ENABLED':'true','NODE_ENV':'production','RECOMMENDATION_DEBUG_TOKEN':'x'*64}):
            self.assertEqual((await self.request('x'*64)).status_code,404)
    async def test_auth_required(self):
        with patch.dict(os.environ,{'RECOMMENDATION_DEBUG_ENABLED':'true','NODE_ENV':'test','RECOMMENDATION_DEBUG_TOKEN':'x'*64}):
            self.assertEqual((await self.request()).status_code,401)
            self.assertEqual((await self.request(bytes([233]))).status_code,401)
    async def test_failed_clip_stage_is_sanitized_and_not_fake_success(self):
        with patch.dict(os.environ,{'RECOMMENDATION_DEBUG_ENABLED':'true','NODE_ENV':'test','RECOMMENDATION_DEBUG_TOKEN':'x'*64}), patch('recommendation.router.decode_image_to_cv2',return_value=object()), patch('clip_classifier.is_ready',return_value=True), patch('clip_classifier.predict_clip_full',side_effect=RuntimeError('private-model-path')):
            response=await self.request('x'*64)
            self.assertEqual(response.status_code,502)
            self.assertEqual(response.json()['detail']['stage'],'clip')
            self.assertNotIn('private-model-path',response.text)
    async def test_catalog_publication_is_coherent_and_content_versioned(self):
        publish_catalog_snapshot({'a':{'id':'1','category':'x'}},(['a'],'embeddings'),'backend')
        before=get_catalog_state();self.assertEqual(before['source'],'backend');self.assertEqual(before['target_embeddings'][0],['a'])
        publish_catalog_snapshot({'a':{'id':'1','category':'changed'}},(['a'],'new embeddings'),'backend')
        after=get_catalog_state();self.assertNotEqual(before['version'],after['version']);self.assertEqual(after['target_embeddings'][1],'new embeddings')

class ArtifactFingerprintTests(unittest.TestCase):
    def test_hashes_file_bytes_and_changes_cache_key_with_artifact_version(self):
        import tempfile
        import hashlib
        from pathlib import Path
        from recommendation.router import _artifact_sha256
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'weights.bin'
            path.write_bytes(b'first')
            self.assertEqual(_artifact_sha256(str(path),1,5),hashlib.sha256(b'first').hexdigest())
            path.write_bytes(b'other')
            self.assertEqual(_artifact_sha256(str(path),2,5),hashlib.sha256(b'other').hexdigest())
