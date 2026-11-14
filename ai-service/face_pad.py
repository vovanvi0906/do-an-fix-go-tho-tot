"""Evaluated PAD adapter for Face Core. An installed model alone is not approval."""
import math
import cv2
from pad_contract import PadEvidence
from pad_mn3 import ExperimentalMn3Pad, VERSION, PROFILE, SHA256
from pad_policy import PadDecisionGate

CROP_VERSION = 'yunet-tight-bbox-floor-ceil-clamped-linear-128-v1'


class EvaluatedMn3Pad:
    def __init__(self, path, model=None, registry=None):
        self.model = model if model is not None else ExperimentalMn3Pad(path)
        self.gate = PadDecisionGate(VERSION, PROFILE, CROP_VERSION, registry=registry, artifact_sha256=SHA256)

    def capabilities(self):
        blocked = self.model.error or self.gate.status()
        record = self.gate.registry.get(VERSION)
        return {'padEvaluated': blocked is None, 'padModelVersion': VERSION if blocked is None else None,
                'padEvaluationReference': record.approval_reference if blocked is None else None,
                'padErrorCode': blocked}

    def assess(self, capture):
        caps = self.capabilities()
        if not caps['padEvaluated']:
            return PadEvidence('NOT_EVALUATED', error_code=caps['padErrorCode'])
        try:
            image, detector = capture
            h, w = image.shape[:2]
            detector.setInputSize((w, h))
            _, faces = detector.detect(image)
            if faces is None or len(faces) != 1:
                return PadEvidence('INCONCLUSIVE', VERSION, 'PAD_SINGLE_FACE_REQUIRED')
            x, y, fw, fh = map(float, faces[0][:4])
            if not all(math.isfinite(v) for v in (x, y, fw, fh)) or min(fw, fh) < 80 or x < 0 or y < 0 or x + fw > w or y + fh > h:
                return PadEvidence('INCONCLUSIVE', VERSION, 'PAD_CROP_INVALID')
            crop = image[max(0, math.floor(y)):min(h, math.ceil(y + fh)), max(0, math.floor(x)):min(w, math.ceil(x + fw))]
            measured = self.model.measure(cv2.resize(crop, (128, 128), interpolation=cv2.INTER_LINEAR))
            decision = self.gate.decide(measured)
            return PadEvidence(decision.decision, VERSION, None if decision.decision == 'PASS' else decision.reason)
        except Exception:
            return PadEvidence('INCONCLUSIVE', VERSION, 'PAD_PROCESSING_FAILED')
