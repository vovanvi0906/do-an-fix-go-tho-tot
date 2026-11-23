"""Offline benchmark: real ASGI v2 inference -> real JS resolver + frozen catalog."""
import argparse
from datetime import datetime, timezone
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[3]
AI = ROOT / 'ai-service'
sys.path.insert(0, str(AI))
from annotation import Sample
from protocol import sha, source_hashes, clip_artifact
from metrics import summarize


def read_dataset(path, image_root, evaluation):
    samples = [Sample.model_validate_json(line) for line in path.read_text().splitlines() if line.strip()]
    seen, groups = set(), {}
    for s in samples:
        if s.id in seen:
            raise ValueError('duplicate sample ID: '+s.id)
        seen.add(s.id)
        p = (image_root / s.image).resolve()
        if not p.is_relative_to(image_root.resolve()) or sha(p) != s.sha256:
            raise ValueError('image path/hash mismatch: '+s.id)
        if evaluation and s.split in {'train', 'validation', 'test'}:
            if not s.provenance.deviceId or not s.provenance.sessionId or not s.provenance.duplicateGroup:
                raise ValueError('device/session/duplicateGroup required: '+s.id)
        keys = [('sha256', s.sha256)] + [(k, getattr(s.provenance, k)) for k in
                ('deviceId', 'sessionId', 'siteId', 'duplicateGroup') if getattr(s.provenance, k)]
        for key in keys:
            old = groups.setdefault(key, s.split)
            if old != s.split:
                raise ValueError('group crosses splits: '+str(key))
    return samples


class Resolver:
    def __init__(self, catalog):
        env = dict(os.environ, SYMPTOM_CATALOG_ENABLED='false')
        self.proc = subprocess.Popen(['node', str(ROOT/'server/scripts/ai01-resolver-offline.cjs'), str(catalog)],
            cwd=ROOT/'server', env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def call(self, prediction, image, text, threshold, answers=None):
        data = {'prediction': prediction, 'threshold': threshold,
                'input': {'imageUrl': str(image), 'description': text,
                          'requestId': str(uuid.uuid4()), 'answers': answers or {}}}
        self.proc.stdin.write(json.dumps(data)+'\n')
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        if not line:
            raise RuntimeError('resolver process exited')
        result = json.loads(line)
        if 'error' in result:
            raise RuntimeError(json.dumps(result['error'], ensure_ascii=False))
        return result

    def close(self):
        self.proc.stdin.close()
        self.proc.wait(timeout=15)
        self.proc.stdout.close()


def setup_models(weights):
    # No project .env, main lifespan, face models, model downloads or DB/network catalog.
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    os.environ['BACKEND_API_URL'] = 'http://127.0.0.1:9/disabled'
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from ultralytics import YOLO
    import clip_classifier
    from recommendation.router import router, _clip_artifact
    app = FastAPI()
    app.include_router(router)
    @app.middleware('http')
    async def capture_debug(request, call_next):
        response = await call_next(request)
        app.state.last_debug = getattr(request.state, 'recommendation_debug', {})
        return response
    app.state.yolo_cls_model = YOLO(str(weights))
    if not clip_classifier.load_clip():
        raise RuntimeError('CLIP unavailable; benchmark requires both real models')
    return TestClient(app), _clip_artifact()


def run_case(sample, mode, client, resolver, image_root, threshold):
    image = (image_root / sample.image).resolve()
    text = '' if mode == 'image-only' else sample.observation.text
    record = {'sampleId': sample.id, 'modality': mode, 'startedAt': datetime.now(timezone.utc).isoformat(),
              'imageSha256': sample.sha256, 'groundTruth': sample.labels.model_dump(),
              'scorable': sample.review.status in {'double_reviewed', 'adjudicated'},
              'inputText': text, 'error': None}
    start = time.perf_counter()
    try:
        t0 = time.perf_counter()
        if mode == 'text-only':
            from category_helper import match_category_by_keywords
            label = match_category_by_keywords(text) if text else None
            pred = {'engine': 'heuristic', 'decision_source': 'text_keyword_baseline',
                    'suggestedCategoryId': label, 'confidence': None,
                    'categoryCandidates': [{'id': label}] if label else [], 'targetCandidates': []}
        else:
            with image.open('rb') as f:
                response = client.post('/ai/v2/diagnose', files={'file': ('image.jpg', f, 'application/octet-stream')},
                                       data={'description': text})
            response.raise_for_status()
            pred = response.json()
            record['prediction'] = pred
            record['debug'] = client.app.state.last_debug
            stages = record['debug'].get('stageOutcomes', {})
            if stages.get('clip') != 'ready' or stages.get('yolo') != 'ready':
                raise RuntimeError('inference stage failed: '+json.dumps(stages))
            if pred['engine'] != 'model':
                raise RuntimeError('model unavailable or image decode failed: '+json.dumps(pred))
        record['inferenceMs'] = (time.perf_counter()-t0)*1000
        record['prediction'] = pred
        resolved = resolver.call(pred, image, text, threshold)
        record.update(resolver=resolved['result'], resolverMs=resolved['resolverMs'])
        answers = sample.observation.confirmedAnswers.model_dump(exclude_none=True)
        record['hasConfirmedAnswers'] = bool(answers)
        if answers:
            record['confirmedAnswers'] = answers
            record['assistedResolver'] = resolver.call(pred, image, text, threshold, answers)['result']
    except Exception as exc:
        record['error'] = {'type': type(exc).__name__, 'message': str(exc)}
    record['totalMs'] = (time.perf_counter()-start)*1000
    return record


def validate_truth(samples, catalog):
    allowed = {kind: {v for r in catalog[table] for v in (r['id'], r['slug'])}
               for kind, table in [('category', 'categories'), ('target', 'targets'),
                                   ('recommendedService', 'services')]}
    for sample in samples:
        for key, values in allowed.items():
            truth = getattr(sample.labels, key)
            labels = truth if isinstance(truth, list) else [truth] if truth is not None else []
            if any(label not in values for label in labels):
                raise ValueError('ground truth outside catalog: '+sample.id+' / '+key)
        if sample.labels.unknown is None or sample.labels.needsInspection is None:
            raise ValueError('review unknown/needsInspection before evaluation: '+sample.id)
        if len(set(sample.review.annotatorIds)) < 2:
            raise ValueError('two independent reviewer IDs required: '+sample.id)
        if sample.review.status == 'adjudicated' and not sample.review.adjudicatorId:
            raise ValueError('missing adjudicator: '+sample.id)
        if (sample.labels.unknown or sample.labels.needsInspection) and sample.labels.recommendedService:
            raise ValueError('conservative safety protocol requires no repair service: '+sample.id)


def main():
    p = argparse.ArgumentParser()
    for name in ('dataset', 'image-root', 'catalog', 'out'):
        p.add_argument('--'+name, required=True, type=Path)
    p.add_argument('--weights', type=Path, default=AI/'weights/yolov8n-cls-fixgo.pt')
    p.add_argument('--protocol', type=Path)
    p.add_argument('--smoke', action='store_true', help='No quality claims; may use unreviewed records')
    a = p.parse_args()
    a.catalog = a.catalog.resolve()
    if not a.smoke and not a.protocol:
        p.error('evaluation requires a pre-frozen --protocol')
    cfg = json.loads(a.protocol.read_text()) if a.protocol else {
        'split': 'smoke', 'resolverThreshold': .6, 'modalities': ['image-only', 'text-only', 'image+text']}
    for key, file in [('dataset', a.dataset), ('catalog', a.catalog), ('weights', a.weights)]:
        if a.protocol and cfg.get(key+'Sha256') != sha(file):
            p.error(key+' changed after protocol freeze')
    if a.protocol and (cfg.get('sourceHashes') != source_hashes() or cfg.get('clipArtifact') != clip_artifact()):
        p.error('source/prompt/config/CLIP changed after freeze; do not tune using test data')
    if cfg.get('symptomCatalogEnabled', False):
        p.error('this baseline uses legacy symptom rules; v3 requires a verified symptom snapshot adapter')
    samples = read_dataset(a.dataset, a.image_root, not a.smoke)
    selected = [s for s in samples if s.split == cfg['split']]
    if set(cfg['modalities']) != {'image-only', 'text-only', 'image+text'}:
        p.error('protocol must include all three modalities')
    if not selected:
        p.error('no samples in selected split')
    if not a.smoke and any(s.review.status == 'unverified' or s.provenance.origin not in
                           {'field_photo', 'licensed_external'} for s in selected):
        p.error('evaluation requires reviewed real photos')
    catalog = json.loads(a.catalog.read_text())
    if not a.smoke:
        validate_truth(selected, catalog)
    a.out.mkdir(parents=True, exist_ok=False)
    meta = {'startedAt': datetime.now(timezone.utc).isoformat(), 'config': cfg, 'smokeOnly': a.smoke,
            'datasetSha256': sha(a.dataset), 'catalogSha256': sha(a.catalog), 'yoloSha256': sha(a.weights),
            'platform': platform.platform(), 'cpuCount': os.cpu_count(), 'python': sys.version, 'argv': sys.argv,
            'gitHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
            'packages': {n: importlib.metadata.version(n) for n in
                         ('torch', 'ultralytics', 'transformers', 'opencv-python-headless', 'fastapi', 'httpx')},
            'sourceHashes': {str(f.relative_to(ROOT)): sha(f) for directory in
                (AI/'recommendation', AI/'eval/ai01', ROOT/'server/src/modules/orders/diagnosis',
                 ROOT/'server/src/modules/symptoms') for f in sorted(directory.glob('*')) if f.suffix in {'.py', '.js'}},
            'catalogEvidence': json.loads(a.catalog.read_text())['evidence'],
            'scope': 'ASGI in-process v2 + real resolver / in-memory historical catalog; not DB/mobile E2E'}
    for f in [AI/'clip_classifier.py', AI/'category_helper.py', AI/'service_catalog.py', AI/'target_catalog.py',
              ROOT/'server/scripts/ai01-resolver-offline.cjs', ROOT/'server/package-lock.json']:
        meta['sourceHashes'][str(f.relative_to(ROOT))] = sha(f)
    (a.out/'run.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    resolver = None
    try:
        t0 = time.perf_counter()
        client, artifact = setup_models(a.weights)
        import torch
        meta['torchRuntime'] = {'threads': torch.get_num_threads(), 'cudaAvailable': torch.cuda.is_available(),
                                'device': 'cpu', 'clipEvalMode': True}
        meta.update(clipArtifact=artifact, modelSetupMs=(time.perf_counter()-t0)*1000)
        if not artifact.get('clipArtifactSha256'):
            raise RuntimeError('CLIP artifact hash unavailable')
        resolver = Resolver(a.catalog)
        records = []
        with (a.out/'predictions.jsonl').open('x') as f:
            for sample in selected:
                for mode in cfg['modalities']:
                    record = run_case(sample, mode, client, resolver, a.image_root, cfg['resolverThreshold'])
                    if a.smoke:
                        record['scorable'] = False
                    record['sequence'] = len(records)
                    record['latencyPhase'] = 'first_request' if not records else 'subsequent_request'
                    records.append(record)
                    f.write(json.dumps(record, ensure_ascii=False)+'\n')
                    f.flush()
        (a.out/'metrics.json').write_text(json.dumps(summarize(records, json.loads(a.catalog.read_text())), indent=2))
        meta['status'] = 'completed_with_errors' if any(r['error'] for r in records) else 'completed'
    except Exception as exc:
        meta.update(status='failed', error={'type': type(exc).__name__, 'message': str(exc)})
        raise
    finally:
        if resolver:
            resolver.close()
        meta['endedAt'] = datetime.now(timezone.utc).isoformat()
        (a.out/'run.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    return 1 if meta['status'] != 'completed' else 0


if __name__ == '__main__':
    raise SystemExit(main())
