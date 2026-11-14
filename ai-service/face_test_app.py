"""Local-only interactive FaceID sandbox. Ephemeral data; no production authority.

Only mounted by the Vite dev bridge with a per-process secret. Uses the existing
YuNet/SFace/MN3 acquisition pipeline, never the production enrollment/proof service.
"""
import asyncio
from contextlib import asynccontextmanager
import hmac
import json
import math
import os
import secrets
import time
from dataclasses import dataclass, field

from fastapi import FastAPI, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from face_core import MAX_BYTES, decode_capture
from face_models import load_face_models
from face_research import acquire, CROP_VERSION, QUALITY_POLICY
from pad_mn3 import ExperimentalMn3Pad, VERSION as PAD_VERSION, PROFILE

SESSION_TTL = 120
WORKSPACE_TTL = 1800
MAX_WORKSPACES = 16
IDENTITY_THRESHOLD = .60
PAD_THRESHOLD = .85  # explicitly provisional test policy, not calibrated PAD approval


@dataclass
class Workspace:
    touched: float
    embedding: object = None
    version: int = 0
    sessions: dict = field(default_factory=dict)


def create_app(models=None, pad=None, clock=time.monotonic):
    workspaces = {}
    lock = asyncio.Lock()

    @asynccontextmanager
    async def lifespan(app):
        if os.environ.get('FACE_TEST_LOCAL_ONLY') != 'true':
            raise RuntimeError('LOCAL_TEST_MODE_REQUIRED')
        app.state.models = models or load_face_models(os.environ.get('FACE_TEST_MODEL_DIR', '/models'))
        app.state.pad = pad or ExperimentalMn3Pad(os.environ.get('FACE_TEST_PAD_MODEL', '/experiment/anti-spoof-mn3.onnx'))
        async def expire():
            while True:
                await asyncio.sleep(30)
                for key, ws in list(workspaces.items()):
                    if clock() - ws.touched >= WORKSPACE_TTL:
                        del workspaces[key]
        sweeper = asyncio.create_task(expire())
        try:
            yield
        finally:
            sweeper.cancel()
            workspaces.clear()

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    def authenticate(request):
        secret = os.environ.get('FACE_TEST_TOKEN', '')
        if os.environ.get('FACE_TEST_LOCAL_ONLY') != 'true' or len(secret) < 32:
            raise HTTPException(503, 'LOCAL_TEST_MODE_REQUIRED')
        if not hmac.compare_digest(secret.encode(), request.headers.get('x-face-test-token', '').encode()):
            raise HTTPException(401, 'LOCAL_TEST_UNAUTHORIZED')
        now = clock()
        for key, ws in list(workspaces.items()):
            if now - ws.touched >= WORKSPACE_TTL:
                del workspaces[key]

    def workspace(request):
        authenticate(request)
        ws = workspaces.get(request.headers.get('x-face-workspace', ''))
        if ws is None:
            raise HTTPException(410, 'TEST_WORKSPACE_EXPIRED')
        ws.touched = clock()
        return ws

    async def body(request, limit=4096):
        if request.headers.get('content-type', '').split(';')[0] != 'application/json':
            raise HTTPException(415, 'JSON_REQUIRED')
        chunks = bytearray()
        async for chunk in request.stream():
            chunks.extend(chunk)
            if len(chunks) > limit:
                raise HTTPException(413, 'TEST_PAYLOAD_TOO_LARGE')
        try:
            value = json.loads(chunks)
            if not isinstance(value, dict):
                raise ValueError()
            return value
        except (ValueError, UnicodeDecodeError):
            raise HTTPException(400, 'TEST_INPUT_INVALID')

    @app.get('/capabilities')
    async def capabilities(request: Request):
        authenticate(request)
        m, p = app.state.models, app.state.pad
        ready = m.detector is not None and m.recognizer is not None and bool(m.model_version)
        return {'testOnly': True, 'proofAllowed': False, 'persistentStorage': False,
                'identityReady': ready, 'padReady': p.error is None,
                'modelVersion': m.model_version, 'padModelVersion': PAD_VERSION,
                'modelError': m.error_code, 'padError': p.error,
                'identityThreshold': IDENTITY_THRESHOLD, 'padThreshold': PAD_THRESHOLD,
                'thresholdStatus': 'PROVISIONAL_UNCALIBRATED', 'qualityPolicy': QUALITY_POLICY,
                'cropVersion': CROP_VERSION, 'preprocessingVersion': PROFILE,
                'sessionTtlSeconds': SESSION_TTL, 'workspaceTtlSeconds': WORKSPACE_TTL}

    @app.post('/workspaces')
    async def new_workspace(request: Request):
        authenticate(request)
        data = await body(request)
        if data != {'consent': True}:
            raise HTTPException(400, 'EXPLICIT_TEST_CONSENT_REQUIRED')
        if len(workspaces) >= MAX_WORKSPACES:
            raise HTTPException(429, 'TEST_WORKSPACE_LIMIT')
        key = secrets.token_urlsafe(32)
        workspaces[key] = Workspace(clock())
        return {'workspace': key, 'expiresInSeconds': WORKSPACE_TTL}

    @app.delete('/workspace')
    async def erase(request: Request):
        authenticate(request)
        workspaces.pop(request.headers.get('x-face-workspace', ''), None)
        return {'deleted': True}

    @app.post('/sessions')
    async def session(request: Request):
        ws = workspace(request)
        data = await body(request)
        if set(data) != {'purpose'} or data['purpose'] not in ('ENROLL', 'VERIFY'):
            raise HTTPException(400, 'TEST_PURPOSE_INVALID')
        if data['purpose'] == 'VERIFY' and ws.embedding is None:
            raise HTTPException(409, 'TEST_TEMPLATE_REQUIRED')
        if data['purpose'] == 'ENROLL' and ws.embedding is not None:
            raise HTTPException(409, 'DELETE_TEST_TEMPLATE_FIRST')
        # Only the latest session is usable; old nonces cannot race a re-enrollment.
        sid, nonce = secrets.token_urlsafe(24), secrets.token_urlsafe(32)
        ws.sessions = {sid: {'nonce': nonce, 'expires': clock() + SESSION_TTL,
                             'purpose': data['purpose'], 'version': ws.version}}
        return {'id': sid, 'nonce': nonce, 'expiresInSeconds': SESSION_TTL}

    def process(photo, ws, purpose):
        m, p = app.state.models, app.state.pad
        if m.detector is None or m.recognizer is None or not m.model_version:
            raise HTTPException(503, 'MODEL_NOT_READY')
        started = time.perf_counter()
        try:
            image = decode_capture(photo)
        except Exception:
            raise HTTPException(400, 'INVALID_TEST_IMAGE')
        timings, diag = {}, {}
        feature, quality, measured, identity_error, pad_error = acquire(image, m.detector, m.recognizer, p, timings, diag=diag)
        score = None
        if feature is not None and purpose == 'VERIFY':
            import cv2
            score = float(m.recognizer.match(feature, ws.embedding, cv2.FaceRecognizerSF_FR_COSINE))
            if not math.isfinite(score) or not -1 <= score <= 1:
                raise HTTPException(503, 'INVALID_IDENTITY_SCORE')
        pad_score = measured.real_score if measured else None
        if pad_score is not None and (not math.isfinite(pad_score) or not 0 <= pad_score <= 1):
            pad_error, pad_score = 'INVALID_PAD_SCORE', None
        quality_pass = quality.get('decision') == 'PASS'
        pad_pass = pad_score is not None and pad_score >= PAD_THRESHOLD and not pad_error
        identity_pass = feature is not None and not identity_error and (purpose == 'ENROLL' or score >= IDENTITY_THRESHOLD)
        accepted = quality_pass and pad_pass and identity_pass
        if accepted and purpose == 'ENROLL':
            ws.embedding = feature.copy()
            ws.version += 1
        timings['totalMs'] = (time.perf_counter() - started) * 1000
        reasons = list(quality.get('reasons', []))
        reasons += [e for e in (identity_error, pad_error) if e]
        if pad_score is not None and not pad_pass:
            reasons.append('TEST_PAD_BELOW_THRESHOLD')
        if score is not None and score < IDENTITY_THRESHOLD:
            reasons.append('TEST_IDENTITY_NON_MATCH')
        return {'testOnly': True, 'verified': False, 'proof': None,
                'purpose': purpose, 'testAccepted': accepted, 'templateVersion': ws.version,
                'templateStoredInMemory': ws.embedding is not None,
                'identityScore': score, 'identityThreshold': IDENTITY_THRESHOLD,
                'identityDecision': ('TEST_MATCH' if score >= IDENTITY_THRESHOLD else 'TEST_NON_MATCH') if score is not None else 'NOT_COMPARED',
                'padRealScore': pad_score, 'padSpoofScore': measured.spoof_score if measured else None,
                'padThreshold': PAD_THRESHOLD, 'padDecision': 'NOT_EVALUATED',
                'testPadDecision': 'TEST_PASS' if pad_pass else 'INCONCLUSIVE' if pad_score is None else 'TEST_FAIL',
                'thresholdStatus': 'PROVISIONAL_UNCALIBRATED', 'quality': quality,
                'detection': diag.get('detection'), 'alignment': diag.get('alignment'),
                'reasons': reasons, 'latencyMs': timings,
                'modelVersion': m.model_version, 'padModelVersion': PAD_VERSION}

    @app.post('/sessions/{sid}/capture')
    async def capture(sid: str, request: Request):
        ws = workspace(request)
        if lock.locked():
            raise HTTPException(409, 'TEST_AI_BUSY')
        data = await body(request, MAX_BYTES * 4 // 3 + 4096)
        if set(data) != {'nonce', 'photo'} or not isinstance(data['nonce'], str):
            raise HTTPException(400, 'TEST_INPUT_INVALID')
        s = ws.sessions.get(sid)
        if not s or s['expires'] <= clock() or s['version'] != ws.version:
            raise HTTPException(409, 'TEST_SESSION_EXPIRED_OR_CONSUMED')
        if not hmac.compare_digest(s['nonce'].encode(), data['nonce'].encode()):
            raise HTTPException(403, 'TEST_NONCE_INVALID')
        # Claim session before any await; failures must use a fresh session.
        del ws.sessions[sid]
        async with lock:
            task = asyncio.create_task(run_in_threadpool(process, data['photo'], ws, s['purpose']))
            try:
                return await asyncio.shield(task)
            except asyncio.CancelledError:
                # Mutable OpenCV model state cannot be shared until worker is finished.
                await task
                raise
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(503, 'TEST_INFERENCE_FAILED')

    return app


app = create_app()
