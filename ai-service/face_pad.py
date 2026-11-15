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
        if not (caps['padEvaluated'] or caps.get('padExperimentalReady')):
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
            return self.decide_measurement(measured)
        except Exception:
            return PadEvidence('INCONCLUSIVE', VERSION, 'PAD_PROCESSING_FAILED')


    def decide_measurement(self, measured):
        decision = self.gate.decide(measured)
        return PadEvidence(decision.decision, VERSION, None if decision.decision == 'PASS' else decision.reason)


class ThresholdMn3Pad(EvaluatedMn3Pad):
    """Real model inference with a provisional threshold, never an evaluation approval."""
    def __init__(self, path, threshold, model=None):
        if type(threshold) not in (int, float) or not math.isfinite(threshold) or not 0 < threshold < 1:
            raise ValueError('PAD_THRESHOLD_INVALID')
        super().__init__(path, model=model)
        self.threshold = threshold

    def capabilities(self):
        ready = self.model.error is None
        return dict(padEvaluated=False, padExperimentalReady=ready,
                    padMode='experimental', padThreshold=self.threshold,
                    padModelVersion=VERSION if ready else None,
                    padEvaluationReference=None, padErrorCode=self.model.error)

    def decide_measurement(self, measured):
        real, spoof = measured.real_score, measured.spoof_score
        if not all(type(x) in (int, float) and math.isfinite(x) and 0 <= x <= 1 for x in (real, spoof)) or abs(real + spoof - 1) > 1e-4:
            return PadEvidence('INCONCLUSIVE', VERSION, 'PAD_OUTPUT_INVALID')
        passed = real >= self.threshold
        return PadEvidence('PASS' if passed else 'FAIL', VERSION, None if passed else 'PAD_BELOW_EXPERIMENTAL_THRESHOLD')


def configured_pad(environ):
    path = environ.get('FACE_PAD_MODEL_PATH')
    if not path:
        return None
    mode = environ.get('FACE_PAD_MODE', 'evaluated')
    if mode == 'experimental':
        if environ.get('NODE_ENV') == 'production' or environ.get('APP_ENV') == 'production':
            raise ValueError('EXPERIMENTAL_PAD_NOT_ALLOWED_IN_PRODUCTION')
        return ThresholdMn3Pad(path, float(environ.get('FACE_PAD_THRESHOLD', '.85')))
    if mode != 'evaluated':
        raise ValueError('PAD_MODE_INVALID')
    return EvaluatedMn3Pad(path)
