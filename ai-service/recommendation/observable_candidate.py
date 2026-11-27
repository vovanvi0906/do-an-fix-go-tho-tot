"""Isolated observable-sign proposals; never changes category, target or service decisions."""
import hashlib
import json
import math
import os
import threading
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def empty(status):
    return {'status':status,'labelStatus':'AI_UNVERIFIED','modelSha256':None,
            'proposals':[],'absenceMeans':'NOT_DETECTED_DOES_NOT_MEAN_NORMAL'}


class ObservableCandidate:
    def __init__(self, model, manifest, taxonomy):
        self.model,self.manifest,self.taxonomy=model,manifest,taxonomy
        self.lock=threading.Lock()

    def predict(self, image):
        m=self.manifest
        with self.lock:
            predictions=self.model.predict(source=image,conf=m['threshold'],imgsz=m['imgsz'],
                                           device='cpu',verbose=False,max_det=100)
        proposals=[]
        for prediction in predictions[:1]:
            if prediction.boxes is None:continue
            for c,score,xy in zip(prediction.boxes.cls.tolist(),prediction.boxes.conf.tolist(),prediction.boxes.xyxyn.tolist()):
                if not math.isfinite(c) or c!=int(c) or not 0<=int(c)<len(m['classes']):continue
                if not math.isfinite(score) or not m['threshold']<=score<=1:continue
                if len(xy)!=4 or not all(math.isfinite(v) and 0<=v<=1 for v in xy) or not xy[0]<xy[2] or not xy[1]<xy[3]:continue
                code=m['classes'][int(c)]['code'];meta=self.taxonomy[code]
                proposals.append({'code':code,'name':meta['displayNameVi'],'definition':meta['definition'],
                    'confidence':float(score),'xyxy':xy,'objectId':None})
        return {**empty('proposed' if proposals else 'no_detection'),'modelSha256':m['weightsSha256'],
                'proposals':proposals,'scoreType':'UNCALIBRATED_DETECTOR_SCORE'}


def load_candidate(bundle_path=None):
    if bundle_path is None and os.environ.get('OBSERVABLE_CANDIDATE_ENABLED')!='true':return None
    try:
        path=Path(bundle_path or os.environ['OBSERVABLE_CANDIDATE_MANIFEST']).resolve();m=json.loads(path.read_text())
        if m.get('schema')!='fixgo.studio.pseudo-detector.v1' or m.get('task')!='detect':raise ValueError('Schema')
        if m.get('status')!='EXPERIMENTAL_NOT_DEPLOYED' or m.get('labelStatus')!='AI_UNVERIFIED':raise ValueError('Candidate status required')
        weights=(path.parent/m['weights']).resolve();taxonomy_path=(path.parent/m['taxonomyPath']).resolve()
        if not weights.is_relative_to(path.parent) or not taxonomy_path.is_relative_to(path.parent):raise ValueError('Outside bundle')
        if digest(weights)!=m['weightsSha256']:raise ValueError('Weights hash')
        if not isinstance(m.get('imgsz'),int) or not 128<=m['imgsz']<=1280:raise ValueError('Image size')
        if type(m.get('threshold')) not in (int,float) or not math.isfinite(m['threshold']) or not .05<=m['threshold']<=1:raise ValueError('Threshold')
        classes=m['classes'];taxonomy={c['code']:c for c in json.loads(taxonomy_path.read_text())['classes']}
        if not isinstance(classes,list) or not 1<=len(classes)<=100 or len({c['code'] for c in classes})!=len(classes):raise ValueError('Classes')
        if any(c['kind']!='sign' or c['code'] not in taxonomy or c['name']!='sign:'+c['code'] for c in classes):raise ValueError('Only supported signs')
        from ultralytics import YOLO
        model=YOLO(str(weights))
        if model.task!='detect' or model.names!={i:c['name'] for i,c in enumerate(classes)}:raise ValueError('Model class map')
        return ObservableCandidate(model,m,taxonomy)
    except Exception:
        import logging
        logging.getLogger(__name__).warning('Observable candidate unavailable; primary models unchanged.')
        return None


def analyze_candidate(image, candidate):
    if os.environ.get('OBSERVABLE_CANDIDATE_ENABLED')!='true':return empty('disabled')
    if candidate is None:return empty('unavailable')
    try:return candidate.predict(image)
    except Exception:return empty('unavailable')
