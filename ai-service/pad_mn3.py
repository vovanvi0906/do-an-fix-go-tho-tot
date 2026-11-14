"""Experimental CPU PAD. Scores are measurements, never authorization evidence.
Input is an already selected 128x128 BGR uint8 crop; no face detection here.
"""
from dataclasses import dataclass
import hashlib
from pathlib import Path
import threading
import numpy as np
from pad_contract import PadEvidence

SHA256 = 'c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262'
VERSION = 'experimental:anti-spoof-mn3:' + SHA256
PROFILE = 'bgr-u8-128-to-rgb-nchw-normalized-v1'
MEAN = np.array([151.2405, 119.5950, 107.8395], dtype=np.float32)
SCALE = np.array([63.0105, 56.4570, 55.0035], dtype=np.float32)


def preprocess(crop, profile=PROFILE):
    if profile != PROFILE or not isinstance(crop, np.ndarray) or crop.dtype != np.uint8 or crop.shape != (128, 128, 3):
        raise ValueError('PAD_PREPROCESS_INVALID')
    return np.ascontiguousarray(((crop[:, :, ::-1].astype(np.float32) - MEAN) / SCALE).transpose(2, 0, 1)[None])


def validate_output(output):
    values = np.asarray(output)
    if values.shape != (1, 2) or not np.isfinite(values).all() or (values < 0).any() or (values > 1).any() or abs(float(values.sum()) - 1) > 1e-4:
        raise ValueError('PAD_OUTPUT_INVALID')
    return float(values[0, 0]), float(values[0, 1])


@dataclass(frozen=True)
class Measurement:
    real_score: float
    spoof_score: float
    model_version: str = VERSION
    preprocessing: str = PROFILE
    evaluated: bool = False


class ExperimentalMn3Pad:
    """Single request, bounded async wait. Busy/late requests cannot yield evidence."""
    def __init__(self, model_path, timeout_ms=1000, threads=2):
        self.error = None
        self.request = None
        self.lock = threading.Lock()
        self.timeout_ms = timeout_ms
        if not isinstance(timeout_ms, int) or timeout_ms <= 0:
            raise ValueError('PAD_TIMEOUT_INVALID')
        try:
            data = Path(model_path).read_bytes()
            if hashlib.sha256(data).hexdigest() != SHA256:
                self.error = 'PAD_CHECKSUM_MISMATCH'
                return
            import openvino as ov
            core = ov.Core()
            # Parse the verified in-memory bytes, eliminating path replacement races.
            model = core.read_model(data)
            if list(model.input().shape) != [1, 3, 128, 128] or list(model.output().shape) != [1, 2]:
                raise ValueError('PAD_MODEL_CONTRACT_INVALID')
            compiled = core.compile_model(model, 'CPU', {'INFERENCE_NUM_THREADS': threads, 'NUM_STREAMS': 1, 'INFERENCE_PRECISION_HINT': 'f32'})
            self.request = compiled.create_infer_request()
        except FileNotFoundError:
            self.error = 'PAD_MODEL_MISSING'
        except Exception:
            self.error = 'PAD_TECHNICAL_ERROR'

    def measure(self, crop, profile=PROFILE):
        if self.error:
            raise RuntimeError(self.error)
        tensor = preprocess(crop, profile)
        if not self.lock.acquire(blocking=False):
            raise RuntimeError('PAD_BUSY')
        try:
            self.request.start_async({0: tensor}, share_inputs=False)
            if not self.request.wait_for(self.timeout_ms):
                # Poison provider: no late result or subsequent request can be used.
                self.error = 'PAD_TIMEOUT'
                self.request.cancel()
                raise RuntimeError('PAD_TIMEOUT')
            real, spoof = validate_output(self.request.get_output_tensor(0).data.copy())
            return Measurement(real, spoof)
        finally:
            self.lock.release()

    def assess(self, capture):
        try:
            self.measure(capture)
            return PadEvidence('NOT_EVALUATED', VERSION, 'PAD_EXPERIMENTAL_NOT_EVALUATED')
        except (ValueError, RuntimeError) as exc:
            code = str(exc)
            if code not in {'PAD_MODEL_MISSING', 'PAD_CHECKSUM_MISMATCH', 'PAD_PREPROCESS_INVALID', 'PAD_OUTPUT_INVALID', 'PAD_TIMEOUT', 'PAD_BUSY', 'PAD_TECHNICAL_ERROR'}:
                code = 'PAD_TECHNICAL_ERROR'
            return PadEvidence('INCONCLUSIVE', VERSION, code)
        except Exception:
            return PadEvidence('INCONCLUSIVE', VERSION, 'PAD_TECHNICAL_ERROR')
