"""Internal Face ID router; PAD remains explicitly unevaluated."""
import hmac
import json
import os
import threading
from fastapi import APIRouter, Request, HTTPException
from starlette.concurrency import run_in_threadpool
from face_core import FacePolicy, compare_capture, outcome, MAX_BYTES

router = APIRouter()
# OpenCV detector setInputSize and recognizer are mutable, shared per process.
_model_lock = threading.Lock()


def _compare(state, body):
    try:
        policy = FacePolicy(threshold=float(os.environ.get('FACE_IDENTITY_THRESHOLD', '.60')))
    except ValueError:
        return outcome('TECHNICAL_ERROR', 'INVALID_FACE_POLICY')
    with _model_lock:
        return compare_capture(body.get('photo'), body.get('templateEmbedding'),
                               body.get('templateVersion'), body.get('modelVersion'),
                               getattr(state, 'face_detector', None), getattr(state, 'face_recognizer', None),
                               getattr(state, 'face_model_version', None), policy)


@router.post('/ai/face-verify')
@router.post('/api/v1/ai/verify-face')
async def face_verify(request: Request):
    secret = os.environ.get('AI_FACE_SERVICE_TOKEN', '')
    supplied = request.headers.get('x-face-service-token', '')
    if not secret:
        raise HTTPException(503, 'FACE_SERVICE_AUTH_NOT_CONFIGURED')
    if not hmac.compare_digest(secret.encode(), supplied.encode()):
        raise HTTPException(401, 'FACE_SERVICE_UNAUTHORIZED')
    if request.headers.get('content-type', '').split(';')[0] != 'application/json':
        raise HTTPException(415, 'JSON_REQUIRED')
    chunks = bytearray()
    async for chunk in request.stream():
        chunks.extend(chunk)
        if len(chunks) > MAX_BYTES * 4 // 3 + 16384:
            raise HTTPException(413, 'FACE_PAYLOAD_TOO_LARGE')
    try:
        body = json.loads(chunks)
        if not isinstance(body, dict):
            raise ValueError()
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(400, 'INVALID_FACE_REQUEST')
    result = await run_in_threadpool(_compare, request.app.state, body)
    result['workerId'] = body.get('workerId') if isinstance(body.get('workerId'), str) else None
    result['sessionId'] = body.get('sessionId') if isinstance(body.get('sessionId'), str) else None
    return result
