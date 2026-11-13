"""Measurement-only YuNet/SFace/MN3 pipeline. No template output or authority."""
import math
import time
import cv2
import numpy as np
from face_core import decode_capture, FacePolicy, valid_embedding
from pad_mn3 import VERSION as PAD_VERSION, PROFILE

CROP_VERSION = 'yunet-tight-bbox-floor-ceil-clamped-linear-128-v1'


def acquire(image, detector, recognizer, pad, timings, prefix='probe'):
    start = time.perf_counter()
    h, w = image.shape[:2]
    detector.setInputSize((w, h))
    _, faces = detector.detect(image)
    timings[prefix + 'DetectionMs'] = (time.perf_counter() - start) * 1000
    count = 0 if faces is None else len(faces)
    quality = {'decision': 'FAIL', 'faceCount': count, 'brightness': None, 'sharpness': None}
    if count != 1:
        return None, quality, None, 'NO_FACE' if count == 0 else 'MULTIPLE_FACES', None
    face = faces[0]
    if len(face) != 15 or not np.isfinite(face).all() or face[-1] < .6:
        return None, quality, None, 'INVALID_DETECTION', None
    x, y, fw, fh = map(float, face[:4])
    if min(fw, fh) < 80 or x < 0 or y < 0 or x + fw > w or y + fh > h:
        return None, quality, None, 'FACE_SIZE_OR_CROP', None
    crop = image[max(0, math.floor(y)):min(h, math.ceil(y + fh)), max(0, math.floor(x)):min(w, math.ceil(x + fw))]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    quality.update(brightness=float(gray.mean()), sharpness=float(cv2.Laplacian(gray, cv2.CV_64F).var()))
    policy = FacePolicy()
    quality['decision'] = 'PASS' if policy.min_brightness <= quality['brightness'] <= policy.max_brightness and quality['sharpness'] >= policy.min_sharpness else 'FAIL'
    start = time.perf_counter()
    resized = cv2.resize(crop, (128, 128), interpolation=cv2.INTER_LINEAR)
    timings[prefix + 'CropResizeMs'] = (time.perf_counter() - start) * 1000
    # Identity and PAD run independently, even if one has a technical failure.
    feature, measurement, error, pad_error = None, None, None, None
    start = time.perf_counter()
    try:
        aligned = recognizer.alignCrop(image, face)
        feature = recognizer.feature(aligned)
        if feature is None or feature.shape != (1, 128) or not valid_embedding(feature[0].tolist()):
            raise ValueError()
    except Exception:
        feature, error = None, 'IDENTITY_TECHNICAL_ERROR'
    timings[prefix + 'SfaceMs'] = (time.perf_counter() - start) * 1000
    start = time.perf_counter()
    try:
        measurement = pad.measure(resized)
    except Exception as exc:
        code = str(exc)
        pad_error = code if code in {'PAD_TIMEOUT', 'PAD_MODEL_MISSING', 'PAD_CHECKSUM_MISMATCH', 'PAD_OUTPUT_INVALID', 'PAD_BUSY', 'PAD_PREPROCESS_INVALID'} else 'PAD_TECHNICAL_ERROR'
    timings[prefix + 'PadMs'] = (time.perf_counter() - start) * 1000
    return feature, quality, measurement, error, pad_error


def infer_research(body, models, pad):
    start = time.perf_counter()
    timings = {}
    result = dict(researchOnly=True, verified=False, enrolled=False, proof=None,
                  identityDecision='INCONCLUSIVE', identityScore=None,
                  padDecision='NOT_EVALUATED', padRealScore=None, padSpoofScore=None,
                  referencePadRealScore=None, referencePadSpoofScore=None,
                  quality={'decision': 'NOT_EVALUATED'}, referenceQuality=None,
                  modelVersion=models.model_version, padModelVersion=PAD_VERSION,
                  cropVersion=CROP_VERSION, preprocessingVersion=PROFILE,
                  policyVersion='research-no-decision-v1', errorCode=None, identityErrorCode=None, padErrorCode=None, referenceIdentityErrorCode=None, referencePadErrorCode=None, latencyMs=timings)
    try:
        if models.detector is None or models.recognizer is None or not models.model_version:
            raise ValueError('MODEL_NOT_READY')
        decode_start = time.perf_counter()
        image = decode_capture(body['photo'])
        reference = decode_capture(body['referencePhoto']) if body.get('referencePhoto') else None
        timings['decodeMs'] = (time.perf_counter() - decode_start) * 1000
        feature, quality, measured, error, pad_error = acquire(image, models.detector, models.recognizer, pad, timings)
        result['quality'] = quality
        result.update(errorCode=error or pad_error, identityErrorCode=error, padErrorCode=pad_error)
        if measured:
            result.update(padRealScore=measured.real_score, padSpoofScore=measured.spoof_score)
        if reference is not None:
            ref, ref_quality, ref_pad, ref_error, ref_pad_error = acquire(reference, models.detector, models.recognizer, pad, timings, 'reference')
            result['referenceQuality'] = ref_quality
            result.update(errorCode=error or pad_error or ref_error or ref_pad_error, referenceIdentityErrorCode=ref_error, referencePadErrorCode=ref_pad_error)
            if ref_pad:
                result.update(referencePadRealScore=ref_pad.real_score, referencePadSpoofScore=ref_pad.spoof_score)
            if feature is not None and ref is not None:
                compare_start = time.perf_counter()
                score = float(models.recognizer.match(feature, ref, cv2.FaceRecognizerSF_FR_COSINE))
                timings['identityComparisonMs'] = (time.perf_counter() - compare_start) * 1000
                if not math.isfinite(score) or not -1 <= score <= 1:
                    raise ValueError('INVALID_IDENTITY_SCORE')
                result.update(identityScore=score, identityDecision='MEASURED')
        elif feature is not None:
            result['identityDecision'] = 'REFERENCE_NOT_PROVIDED'
        # No embeddings, templates, binary media or thresholds escape the pipeline.
    except Exception:
        result.update(errorCode='RESEARCH_PROCESSING_FAILED', identityDecision='INCONCLUSIVE', identityScore=None)
    finally:
        timings['totalMs'] = (time.perf_counter() - start) * 1000
    return result
