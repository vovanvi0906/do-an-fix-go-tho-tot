"""Face-only inference. No URL fetch, local paths, persistence or authorization."""
import base64
import math
from dataclasses import dataclass
from pad_contract import UnavailablePad

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = np = None

MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 12_000_000


@dataclass(frozen=True)
class FacePolicy:
    threshold: float = .60  # provisional compatibility baseline, not calibrated
    min_face_pixels: int = 80
    min_brightness: float = 40
    max_brightness: float = 220
    min_sharpness: float = 60

    def __post_init__(self):
        if not math.isfinite(self.threshold) or not -1 <= self.threshold <= 1:
            raise ValueError('INVALID_FACE_THRESHOLD')


def outcome(decision, code, score=None, quality='NOT_EVALUATED', model=None, version=None):
    compared = decision in ('MATCH', 'NON_MATCH')
    return dict(identityDecision=decision, identityScore=score,
                verificationMethod='yunet_sface_cosine' if compared else 'none',
                modelVersion=model, templateVersion=version, qualityDecision=quality,
                padDecision=UnavailablePad().assess(None).decision, errorCode=code,
                # Compatibility fields describe identity only; never an authorization proof.
                status=decision, reason=code, confidence=score, verified=False,
                identityMatched=compared and decision == 'MATCH', padModelVersion=None,
                padErrorCode='PAD_PROVIDER_NOT_APPROVED',
                method='sface_cosine' if compared else 'none', engine='model' if compared else 'unavailable')


def decode_capture(value):
    if cv2 is None or np is None:
        raise ValueError('MODEL_NOT_READY')
    if isinstance(value, str) and value.startswith('data:image/'):
        if len(value) > MAX_BYTES * 4 // 3 + 128:
            raise ValueError('IMAGE_TOO_LARGE')
        header, encoded = value.split(',', 1)
        if header not in ('data:image/jpeg;base64', 'data:image/png;base64'):
            raise ValueError('INVALID_IMAGE_ENCODING')
        value = base64.b64decode(encoded, validate=True)
    if not isinstance(value, bytes) or not 0 < len(value) <= MAX_BYTES:
        raise ValueError('INLINE_IMAGE_REQUIRED')
    # Read dimensions before OpenCV allocation to limit decompression bombs.
    from PIL import Image
    import io
    with Image.open(io.BytesIO(value)) as image:
        if image.format not in ('JPEG', 'PNG') or image.width * image.height > MAX_PIXELS:
            raise ValueError('IMAGE_TOO_LARGE_OR_UNSUPPORTED')
    image = cv2.imdecode(np.frombuffer(value, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError('DECODE_FAILED')
    return image


def valid_embedding(value):
    if not isinstance(value, (list, tuple)) or len(value) != 128:
        return False
    return all(type(v) in (int, float) and math.isfinite(v) for v in value) and 0 < math.hypot(*value) < float('inf')


def extract_embedding(image, detector, recognizer, policy):
    h, w = image.shape[:2]
    detector.setInputSize((w, h))
    _, detected = detector.detect(image)
    count = 0 if detected is None else len(detected)
    if count != 1:
        return None, 'NO_FACE' if count == 0 else 'MULTIPLE_FACES'
    face = detected[0]
    if len(face) != 15 or not np.isfinite(face).all() or face[-1] < .6:
        return None, 'INVALID_DETECTION'
    x, y, fw, fh = face[:4]
    if min(fw, fh) < policy.min_face_pixels or x < 0 or y < 0 or x + fw > w or y + fh > h:
        return None, 'FACE_SIZE_OR_CROP'
    crop = image[int(y):int(y + fh), int(x):int(x + fw)]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    light = float(gray.mean())
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if not policy.min_brightness <= light <= policy.max_brightness:
        return None, 'LIGHTING'
    if not math.isfinite(sharpness) or sharpness < policy.min_sharpness:
        return None, 'BLUR'
    aligned = recognizer.alignCrop(image, face)
    if aligned is None or aligned.size == 0:
        raise ValueError('ALIGNMENT_FAILED')
    feature = recognizer.feature(aligned)
    if feature is None or feature.shape != (1, 128) or not valid_embedding(feature[0].tolist()):
        raise ValueError('INVALID_EMBEDDING')
    return feature, None


def compare_capture(capture, template, version, expected_model, detector, recognizer, model_version, policy):
    if cv2 is None or np is None or detector is None or recognizer is None or not model_version:
        return outcome('TECHNICAL_ERROR', 'MODEL_NOT_READY')
    if type(version) is not int or version < 1 or not valid_embedding(template):
        return outcome('INCONCLUSIVE', 'TRUSTED_TEMPLATE_REQUIRED')
    if expected_model != model_version:
        return outcome('INCONCLUSIVE', 'MODEL_VERSION_MISMATCH', model=model_version, version=version)
    try:
        image = decode_capture(capture)
        feature, problem = extract_embedding(image, detector, recognizer, policy)
        if problem:
            return outcome('INCONCLUSIVE', problem, quality='FAIL', model=model_version, version=version)
        reference = np.array([template], dtype=np.float32)
        if not np.isfinite(reference).all() or np.linalg.norm(reference) == 0:
            raise ValueError('INVALID_EMBEDDING')
        raw = recognizer.match(feature, reference, cv2.FaceRecognizerSF_FR_COSINE)
        if isinstance(raw, (str, bool)):
            raise ValueError('INVALID_SCORE')
        score = float(raw)
        if not math.isfinite(score) or not -1 <= score <= 1:
            raise ValueError('INVALID_SCORE')
        return outcome('MATCH' if score >= policy.threshold else 'NON_MATCH', 'COMPARED', score,
                       'PASS', model_version, version)
    except Exception:
        # Do not emit exception text: it may contain paths, images or embeddings.
        return outcome('TECHNICAL_ERROR', 'FACE_PROCESSING_FAILED', model=model_version, version=version)


def enroll_capture(capture, version, expected_model, detector, recognizer, model_version, policy):
    """Prepare enrollment evidence; do not release an embedding without evaluated PAD."""
    if cv2 is None or np is None or detector is None or recognizer is None or not model_version:
        return outcome('TECHNICAL_ERROR', 'MODEL_NOT_READY')
    if type(version) is not int or version < 1 or expected_model != model_version:
        return outcome('INCONCLUSIVE', 'MODEL_OR_TEMPLATE_VERSION_INVALID', model=model_version)
    try:
        image = decode_capture(capture)
        feature, problem = extract_embedding(image, detector, recognizer, policy)
        if problem:
            return outcome('INCONCLUSIVE', problem, quality='FAIL', model=model_version, version=version)
        # Feature exists only transiently. With no evaluated provider, never expose a
        # template for enrollment or label detection/quality as presentation-attack PASS.
        result = outcome('INCONCLUSIVE', 'PAD_NOT_EVALUATED', quality='PASS', model=model_version, version=version)
        result['verificationMethod'] = 'yunet_sface_embedding'
        return result
    except Exception:
        return outcome('TECHNICAL_ERROR', 'FACE_PROCESSING_FAILED', model=model_version, version=version)
