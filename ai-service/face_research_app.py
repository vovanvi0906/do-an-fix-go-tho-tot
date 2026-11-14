"""Separate ASGI application; never imported into the production AI app."""
import asyncio
import base64
from contextlib import asynccontextmanager
import hmac
import json
import os
import threading
from fastapi import FastAPI, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from face_core import MAX_BYTES
from face_models import load_face_models
from face_research import infer_research
from pad_mn3 import ExperimentalMn3Pad


def create_app(models=None, pad=None):
    lock = threading.Lock()
    # Synthetic execution is default. Real-media handling needs separate approved protocol.
    approved = os.environ.get('FACE_RESEARCH_CAPTURE_APPROVED') == 'true' and bool(os.environ.get('FACE_RESEARCH_PROTOCOL_REFERENCE'))
    @asynccontextmanager
    async def lifespan(app):
        if os.environ.get('FACE_RESEARCH_ISOLATED') != 'true':
            raise RuntimeError('RESEARCH_ISOLATION_REQUIRED')
        app.state.models = models or load_face_models(os.environ.get('FACE_RESEARCH_MODEL_DIR', '/nonexistent'))
        app.state.pad = pad or ExperimentalMn3Pad(os.environ.get('FACE_RESEARCH_PAD_MODEL', '/nonexistent'))
        yield
    app = FastAPI(lifespan=lifespan)
    if models is not None: app.state.models = models
    if pad is not None: app.state.pad = pad
    def authenticate(request):
        secret = os.environ.get('FACE_RESEARCH_AI_TOKEN', '')
        if os.environ.get('FACE_RESEARCH_ISOLATED') != 'true' or len(secret) < 32:
            raise HTTPException(503, 'RESEARCH_NOT_CONFIGURED')
        if not hmac.compare_digest(secret.encode(), request.headers.get('x-face-research-token', '').encode()):
            raise HTTPException(401, 'RESEARCH_UNAUTHORIZED')
    @app.get('/research/capabilities')
    async def capabilities(request: Request):
        authenticate(request)
        return {'researchOnly': True, 'captureAllowed': approved, 'padEvaluated': False, 'proofAllowed': False,
                'modelVersion': app.state.models.model_version, 'padReady': app.state.pad.error is None}
    @app.post('/research/infer')
    async def infer(request: Request):
        authenticate(request)
        if request.headers.get('content-type', '').split(';')[0] != 'application/json':
            raise HTTPException(415, 'JSON_REQUIRED')
        chunks = bytearray()
        async for chunk in request.stream():
            chunks.extend(chunk)
            if len(chunks) > 2 * (MAX_BYTES * 4 // 3 + 128) + 4096:
                raise HTTPException(413, 'RESEARCH_PAYLOAD_TOO_LARGE')
        try:
            body = json.loads(chunks)
            if not isinstance(body, dict) or set(body) - {'synthetic', 'photo', 'referencePhoto', 'sessionId', 'workerId'}:
                raise ValueError()
            if not all(isinstance(body.get(k), str) and 0 < len(body[k]) <= 128 for k in ['sessionId', 'workerId']):
                raise ValueError()
        except (ValueError, UnicodeDecodeError):
            raise HTTPException(400, 'RESEARCH_INPUT_INVALID')
        if body.get('synthetic') is True:
            if 'photo' in body or 'referencePhoto' in body:
                raise HTTPException(400, 'SYNTHETIC_PAYLOAD_FORBIDDEN')
            import cv2
            import numpy as np
            _, png = cv2.imencode('.png', np.zeros((320, 320, 3), dtype=np.uint8))
            body['photo'] = 'data:image/png;base64,' + base64.b64encode(png).decode()
        elif not approved:
            raise HTTPException(403, 'RESEARCH_CAPTURE_NOT_APPROVED')
        if not lock.acquire(blocking=False):
            raise HTTPException(409, 'RESEARCH_BUSY')
        # Lock released by worker, even if client disconnects/cancels. No concurrent model mutation.
        def run():
            try:
                result = infer_research(body, app.state.models, app.state.pad)
                return dict(result, sessionId=body['sessionId'], workerId=body['workerId'])
            finally:
                lock.release()
        return await run_in_threadpool(run)
    return app

app = create_app()
