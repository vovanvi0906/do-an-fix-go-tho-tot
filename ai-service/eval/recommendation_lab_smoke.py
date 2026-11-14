"""Offline real-pixel smoke with the existing V2 router and local weights.
No main lifespan, Face modules, DB writes, sync or model downloads.
Bundled images are synthetic; this is not an accuracy benchmark.
"""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import time

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['BACKEND_API_URL'] = 'http://127.0.0.1:9/api'


async def run(output: Path):
    import httpx
    from fastapi import FastAPI
    from ultralytics import YOLO
    import clip_classifier
    from recommendation.router import router
    root = Path(__file__).resolve().parents[1]
    weights = root / 'weights/yolov8n-cls-fixgo.pt'
    app = FastAPI()
    app.include_router(router)
    app.state.yolo_cls_model = YOLO(str(weights))
    clip_ready = clip_classifier.load_clip()
    records = []
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://lab.test') as client:
        for folder in sorted((root / 'dataset/test').iterdir()):
            images = sorted(folder.glob('*.jpg'))
            if not images:
                continue
            image = images[0]
            data = image.read_bytes()
            started = time.perf_counter()
            response = await client.post('/ai/v2/diagnose', files={'file': (image.name, data, 'image/jpeg')}, data={'description': ''})
            records.append({'sample': str(image.relative_to(root)), 'provenance': 'synthetic_opencv_templates', 'sha256': hashlib.sha256(data).hexdigest(), 'http_status': response.status_code, 'asgi_elapsed_ms': round((time.perf_counter() - started) * 1000, 2), 'response': response.json()})
    report = {'kind': 'real_pixel_inference_smoke_not_accuracy_benchmark', 'transport': 'in-process ASGI using existing V2 route', 'clip_ready': clip_ready, 'yolo_sha256': hashlib.sha256(weights.read_bytes()).hexdigest(), 'catalog_source': 'existing static fallback (backend deliberately disconnected)', 'limitations': ['Synthetic/leaky dataset; no generalization claims', 'No backend/DB/Cloudinary flow', 'Declared model_version is not a weights hash'], 'records': records}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'clip_ready': clip_ready, 'samples': len(records), 'model_responses': sum(r['response'].get('engine') == 'model' for r in records), 'output': str(output)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    asyncio.run(run(args.output))
