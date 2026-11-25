"""Optional local detector. No CLIP/text/filename fallback can manufacture fault boxes."""
import hashlib
import json
import logging
import math
import os
from pathlib import Path


def empty(status='disabled'):
    return {'status': status, 'modelVersion': None, 'weightsSha256': None, 'detections': []}


def valid_box(box):
    return (isinstance(box, list) and len(box) == 4 and
            all(type(v) in (int, float) and math.isfinite(v) and 0 <= v <= 1 for v in box) and
            box[0] < box[2] and box[1] < box[3])


def containment(sign, obj):
    x1, y1 = max(sign[0], obj[0]), max(sign[1], obj[1])
    x2, y2 = min(sign[2], obj[2]), min(sign[3], obj[3])
    return max(0, x2-x1)*max(0, y2-y1)/((sign[2]-sign[0])*(sign[3]-sign[1]))


class VisualDetector:
    def __init__(self, model, manifest):
        self.model, self.manifest = model, manifest

    def predict(self, image):
        result = self.model.predict(source=image, conf=min(c['threshold'] for c in self.manifest['classes']),
                                    imgsz=self.manifest['imageSize'], device='cpu', verbose=False, max_det=100)
        candidates = []
        for prediction in result[:1]:
            if prediction.boxes is None: continue
            for cls, confidence, coords in zip(prediction.boxes.cls.tolist(), prediction.boxes.conf.tolist(), prediction.boxes.xyxyn.tolist()):
                if int(cls) != cls or not 0 <= int(cls) < len(self.manifest['classes']): continue
                meta = self.manifest['classes'][int(cls)]
                if not math.isfinite(confidence) or not meta['threshold'] <= confidence <= 1 or not valid_box(coords): continue
                candidates.append({'id': f"visual-{len(candidates)}", 'kind': meta['kind'],
                    'categorySlug': meta['categorySlug'], 'targetSlug': meta['targetSlug'],
                    'code': meta['code'], 'confidence': float(confidence), 'xyxy': coords})
        objects = [b for b in candidates if b['kind'] == 'object']
        signs = []
        for sign in (b for b in candidates if b['kind'] == 'sign'):
            matches = [b for b in objects if b['targetSlug'] == sign['targetSlug'] and b['categorySlug'] == sign['categorySlug'] and containment(sign['xyxy'], b['xyxy']) >= .8]
            # An overlapping/ambiguous second object cannot silently receive a sign.
            if len(matches) == 1: signs.append({**sign, 'objectId': matches[0]['id']})
        detections = objects + signs
        return {'status': 'detected' if detections else 'no_evidence', 'modelVersion': self.manifest['modelVersion'],
                'weightsSha256': self.manifest['weightsSha256'], 'detections': detections}


def load_visual_detector():
    if os.environ.get('VISUAL_SERVICE_DETECTOR_ENABLED') != 'true': return None
    try:
        path = Path(os.environ['VISUAL_SERVICE_MODEL_MANIFEST']).resolve()
        manifest = json.loads(path.read_text())
        if manifest.get('schemaVersion') != 'fixgo.visual-detector.v1' or manifest.get('task') != 'detect': raise ValueError('Unsupported manifest')
        validation = manifest.get('validation', {})
        if validation.get('approvedForPilot') is not True or not validation.get('reviewedBy') or not validation.get('reportSha256'): raise ValueError('Model must have reviewed evaluation')
        report = (path.parent / validation['report']).resolve()
        if not report.is_relative_to(path.parent) or hashlib.sha256(report.read_bytes()).hexdigest() != validation['reportSha256']: raise ValueError('Evaluation checksum mismatch')
        weights = (path.parent / manifest['weights']).resolve()
        if not weights.is_relative_to(path.parent) or hashlib.sha256(weights.read_bytes()).hexdigest() != manifest['weightsSha256']: raise ValueError('Weights checksum mismatch')
        if not isinstance(manifest.get('modelVersion'), str) or not manifest['modelVersion'].strip(): raise ValueError('Missing version')
        if type(manifest.get('imageSize')) is not int or not 128 <= manifest['imageSize'] <= 1280: raise ValueError('Invalid image size')
        classes = manifest['classes']
        if not isinstance(classes, list) or not 2 <= len(classes) <= 100 or {c['kind'] for c in classes} != {'object', 'sign'}: raise ValueError('Object and sign classes required')
        if len({c['name'] for c in classes}) != len(classes): raise ValueError('Duplicate classes')
        for c in classes:
            if c['kind'] not in ['object','sign'] or any(not isinstance(c.get(k),str) or not c[k].strip() for k in ['name','categorySlug','targetSlug','code']): raise ValueError('Missing class metadata')
            if type(c.get('threshold')) not in (float,int) or not .5 <= c['threshold'] <= 1: raise ValueError('Missing calibrated threshold')
        from ultralytics import YOLO
        model = YOLO(str(weights))
        if model.task != 'detect' or model.names != {i:c['name'] for i,c in enumerate(classes)}: raise ValueError('Model class map mismatch')
        return VisualDetector(model, manifest)
    except Exception:
        logging.getLogger(__name__).warning("VISUAL_MODEL_UNAVAILABLE: model/evaluation manifest invalid; no fault inference enabled.")
        # Do not leak local paths or load a general COCO model as a fault detector.
        return None


def analyze_visual(image, detector, enabled=None):
    enabled = os.environ.get('VISUAL_SERVICE_DETECTOR_ENABLED') == 'true' if enabled is None else enabled
    if not enabled: return empty()
    if detector is None: return empty('unavailable')
    try: return detector.predict(image)
    except Exception: return empty('unavailable')
