"""Optional LOCAL detector for unverified proposals only; no production approval implied."""
import json
import math
from pathlib import Path


def descriptor(path, catalog, ontology):
    from batch import file_hash
    path = Path(path).resolve()
    m = json.loads(path.read_text())
    if m.get('backend')=='grounding-dino':
        from grounding import descriptor as grounding_descriptor
        return grounding_descriptor(path,catalog,ontology)
    if m.get('schema') != 'fixgo.studio.pseudo-detector.v1' or m.get('task') != 'detect':
        raise ValueError('Expected local pseudo detector manifest, task detect')
    weights = (path.parent/m['weights']).resolve()
    if not weights.is_relative_to(path.parent) or not weights.is_file() or file_hash(weights) != m.get('weightsSha256'):
        raise ValueError('Local sign weights missing or checksum mismatch')
    classes = m.get('classes', [])
    targets = {t['id']: t for t in catalog['targets']}
    if not isinstance(classes, list) or not classes or len(classes) > 100 or len({c['name'] for c in classes}) != len(classes):
        raise ValueError('Invalid pseudo detector class map')
    for c in classes:
        if c.get('kind') == 'sign':
            if c.get('code') not in ontology or c['name'] != 'sign:'+c['code'] or (c.get('targetId') and c['targetId'] not in targets):
                raise ValueError('Unknown sign/target')
        elif c.get('kind') == 'object':
            if c.get('targetId') not in targets or c['name'] != 'object:'+targets[c['targetId']]['slug']:
                raise ValueError('Unknown object class')
        else:
            raise ValueError('Only object/sign classes supported')
    if not any(c['kind'] == 'sign' for c in classes):
        raise ValueError('Sign model must actually have sign classes')
    threshold = m.get('threshold', .5)
    if type(threshold) not in (int, float) or not math.isfinite(threshold) or not .05 <= threshold <= 1:
        raise ValueError('Invalid sign confidence threshold')
    return {'manifestPath': str(path), 'manifestSha256': file_hash(path), 'path': str(weights),
            'sha256': file_hash(weights), 'classes': classes, 'threshold': threshold,
            'warning': 'Unverified pseudo-label model; no calibration or production approval implied'}


def contained(sign, obj):
    x,y,xx,yy = sign; a,b,c,d = obj
    return xx>x and yy>y and max(0,min(xx,c)-max(x,a))*max(0,min(yy,d)-max(y,b))/((xx-x)*(yy-y)) >= .8


class SignModel:
    def __init__(self, config, by_id):
        from ultralytics import YOLO
        from batch import file_hash
        if file_hash(config['path']) != config['sha256']:
            raise ValueError('Sign weights changed before load')
        self.model = YOLO(config['path'])
        if self.model.task != 'detect' or self.model.names != {i:c['name'] for i,c in enumerate(config['classes'])}:
            raise ValueError('Loaded sign model task/class map differs from manifest')
        self.config, self.targets = config, by_id

    def predict(self, image, existing):
        c = self.config
        prediction = self.model.predict(image, device='cpu', conf=c['threshold'], save=False, verbose=False, max_det=100)[0]
        objects, signs = [], []
        if prediction.boxes is not None:
            for n, (cls, score, xyxy) in enumerate(zip(prediction.boxes.cls.tolist(), prediction.boxes.conf.tolist(), prediction.boxes.xyxyn.tolist())):
                if int(cls) != cls or not 0 <= int(cls) < len(c['classes']):
                    continue
                if not math.isfinite(score) or not c['threshold'] <= score <= 1 or len(xyxy) != 4 or not all(math.isfinite(v) and 0 <= v <= 1 for v in xyxy) or not xyxy[0]<xyxy[2] or not xyxy[1]<xyxy[3]:
                    continue
                meta = c['classes'][int(cls)]
                box = {'id': 'pseudo-'+str(n), 'kind': meta['kind'], 'label': meta.get('targetId') if meta['kind']=='object' else meta['code'],
                       'xyxy': xyxy, 'score': float(score), 'objectId': None, 'annotationSource': 'AI', 'modelVersion': c['sha256']}
                if box['kind'] == 'object':
                    objects.append(box)
                else:
                    box['compatibleTargetId'] = meta.get('targetId'); signs.append(box)
        # A joint model owns its object geometry; do not create ambiguous duplicates with the base detector.
        objects = objects if any(m['kind']=='object' for m in c['classes']) else existing
        linked, issues = [], []
        for sign in signs:
            matches = [o for o in objects if (not sign['compatibleTargetId'] or o['label']==sign['compatibleTargetId']) and contained(sign['xyxy'], o['xyxy'])]
            if len(matches) != 1:
                issues.append('SIGN_OBJECT_ASSOCIATION_UNCERTAIN'); continue
            sign['objectId'] = matches[0]['id']; sign.pop('compatibleTargetId'); linked.append(sign)
        return objects+linked, sorted(set(issues))
