"""Pinned local YuNet/SFace loader. Never downloads models or reads face images."""
import hashlib
from pathlib import Path
from dataclasses import dataclass

ARTIFACTS = {
    'face_detection_yunet_2023mar.onnx': '8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4',
    'face_recognition_sface_2021dec.onnx': '0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79',
}


@dataclass
class FaceModels:
    detector: object = None
    recognizer: object = None
    model_version: str | None = None
    error_code: str | None = None


def load_face_models(directory):
    try:
        import cv2
    except ImportError:
        return FaceModels(error_code='OPENCV_UNAVAILABLE')
    paths = [Path(directory) / name for name in ARTIFACTS]
    try:
        for path, expected in zip(paths, ARTIFACTS.values()):
            if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                return FaceModels(error_code='MODEL_HASH_MISMATCH')
        detector = cv2.FaceDetectorYN.create(str(paths[0]), '', (320, 320), score_threshold=.6, nms_threshold=.3, top_k=5000)
        recognizer = cv2.FaceRecognizerSF.create(str(paths[1]), '')
        # Detect ordinary artifact changes while loading. Deployment must make artifacts read-only.
        if any(hashlib.sha256(p.read_bytes()).hexdigest() != h for p, h in zip(paths, ARTIFACTS.values())):
            return FaceModels(error_code='MODEL_CHANGED_DURING_LOAD')
        return FaceModels(detector, recognizer, 'yunet-sface:' + ':'.join(ARTIFACTS.values()))
    except OSError:
        return FaceModels(error_code='MODEL_FILES_UNAVAILABLE')
    except Exception:
        return FaceModels(error_code='MODEL_LOAD_FAILED')
