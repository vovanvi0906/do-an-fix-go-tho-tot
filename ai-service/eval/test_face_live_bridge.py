"""Actual Nest transport -> loopback FastAPI -> existing official models, synthetic blank only."""
import base64
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import threading
import time
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).parents[1]))
import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI
from face_models import load_face_models
from face_router import router

@unittest.skipUnless(os.environ.get('FACE_TEST_MODEL_DIR'), 'explicit local weights required; no download fallback')
class LiveTransportSmoke(unittest.TestCase):
    def test_actual_nest_transport_and_real_models_fail_closed_without_face_or_pad(self):
        models=load_face_models(os.environ['FACE_TEST_MODEL_DIR'])
        self.assertIsNone(models.error_code)
        app=FastAPI();app.include_router(router)
        app.state.face_detector=models.detector;app.state.face_recognizer=models.recognizer;app.state.face_model_version=models.model_version
        sock=socket.socket();sock.bind(('127.0.0.1',0));sock.listen(8)
        port=sock.getsockname()[1]
        server=uvicorn.Server(uvicorn.Config(app,log_level='error',lifespan='off'))
        thread=threading.Thread(target=server.run,kwargs={'sockets':[sock]},daemon=True)
        _,encoded=cv2.imencode('.png',np.zeros((320,320,3),dtype=np.uint8))
        payload={'baseUrl':f'http://127.0.0.1:{port}','photo':'data:image/png;base64,'+base64.b64encode(encoded).decode()}
        with patch.dict(os.environ,{'AI_FACE_SERVICE_TOKEN':'synthetic-local-smoke-token'}):
            try:
                thread.start()
                deadline=time.monotonic()+5
                while not server.started and time.monotonic()<deadline:time.sleep(.01)
                self.assertTrue(server.started)
                root=Path(__file__).resolve().parents[2]
                response=subprocess.run(['node','test/face/real-ai-bridge.cjs'],input=json.dumps(payload),text=True,cwd=root/'server',capture_output=True,timeout=20)
                self.assertEqual(response.returncode,0,response.stderr)
                result=json.loads(response.stdout)
                self.assertTrue(result['identityModelReady']);self.assertFalse(result['padEvaluated'])
                self.assertEqual(result['sampleError'],'NO_FACE');self.assertEqual(result['identityDecision'],'INCONCLUSIVE')
                self.assertFalse(result['verified']);self.assertFalse(result['embeddingReleased'])
                self.assertEqual(result['padDecision'],'NOT_EVALUATED')
            finally:
                server.should_exit=True;thread.join(timeout=5);sock.close()
