"""FaceID-only entry point using the same router and models as main.py.

Run locally: .venv/bin/python -m uvicorn face_app:app --host 127.0.0.1 --port 8000
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from face_models import load_face_models
from face_pad import configured_pad
from face_router import router

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env', override=False)


@asynccontextmanager
async def lifespan(app):
    if not os.environ.get('AI_FACE_SERVICE_TOKEN'):
        raise RuntimeError('FACE_SERVICE_AUTH_NOT_CONFIGURED')
    models = load_face_models(os.environ.get('FACE_MODEL_DIR', str(BASE_DIR / 'weights')))
    app.state.face_detector = models.detector
    app.state.face_recognizer = models.recognizer
    app.state.face_model_version = models.model_version
    app.state.face_pad = configured_pad(os.environ)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(router)
