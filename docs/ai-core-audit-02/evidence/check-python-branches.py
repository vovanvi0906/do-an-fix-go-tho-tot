"""Offline forensic branch checks: AST bodies only, no app startup/models/images/network."""
import ast
import asyncio
import json
import types
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
TREE = ast.parse((ROOT / 'ai-service/main.py').read_text())
def extract(name, scope):
    node = next(n for n in TREE.body if isinstance(n, ast.AsyncFunctionDef) and n.name == name)
    node.decorator_list = []
    node.returns = None
    for a in node.args.args:
        a.annotation = None
    node.args.defaults = [ast.Constant(None)] * (len(node.args.args) - 1)
    module = ast.fix_missing_locations(ast.Module(body=[node], type_ignores=[]))
    exec(compile(module, 'audited-main.py', 'exec'), scope)
    return scope[name]
class Image:
    shape = (224, 224, 3)
class Detector:
    def __init__(self, count): self.count = count
    def setInputSize(self, _): pass
    def detect(self, _): return None, [[0]*14 + [.9] for _ in range(self.count)]
class Recognizer:
    def __init__(self, score, broken=False): self.score, self.broken = score, broken
    def alignCrop(self, *_): return Image()
    def feature(self, _):
        if self.broken: raise ValueError('fixture feature error')
        return object()
    def match(self, *_): return self.score
async def main():
    rows = []
    cases = [
        ('model_missing', None, None, True, True),
        ('decode_failure', Detector(1), Recognizer(.8), False, True),
        ('zero_faces', Detector(0), Recognizer(.8), True, True),
        ('two_faces_first_is_used', Detector(2), Recognizer(.8), True, True),
        ('reference_absent', Detector(1), Recognizer(.8), True, False),
        ('reference_undecodable', Detector(1), Recognizer(.8), True, True),
        ('recognizer_missing', Detector(1), None, True, True),
        ('embedding_error', Detector(1), Recognizer(.8, True), True, True),
        ('low_similarity', Detector(1), Recognizer(.2), True, True),
        ('above_threshold_control', Detector(1), Recognizer(.8), True, True),
    ]
    for name, detector, recognizer, readable, reference in cases:
        scope = {'decode_image_to_cv2': lambda value: Image() if readable and value and not (name == 'reference_undecodable' and value == 'fixture-reference') else None,
                 'FaceVerifyResponse': lambda **kw: kw,
                 'cv2': types.SimpleNamespace(FaceRecognizerSF_FR_COSINE=0),
                 'logger': types.SimpleNamespace(warning=lambda *a: None)}
        fn = extract('face_verify', scope)
        async def body(): return {'workerId': 'fixture-worker', 'photoUrl': 'fixture-image', 'idCardImageUrl': 'fixture-reference' if reference else ''}
        req = types.SimpleNamespace(json=body, app=types.SimpleNamespace(state=types.SimpleNamespace(face_detector=detector, face_recognizer=recognizer)))
        result = await fn(req)
        expected = name != 'low_similarity'
        assert result['verified'] is expected, name
        rows.append({'case': name, 'verified':result['verified'], 'confidence':result['confidence'], 'engine':result['engine'], 'evidenceType':'OFFLINE_STUBBED_BRANCH_NOT_MODEL_ACCURACY'})
    scope = {'HAS_OPENCV': False, 'CompareBeforeAfterResponse': lambda **kw: kw}
    result = await extract('compare_before_after', scope)(types.SimpleNamespace())
    assert result['passed'] is True and result['matchScore'] == .92
    rows.append({'case':'compare_no_opencv','passed':result['passed'],'matchScore':result['matchScore'],'engine':result['engine'],'evidenceType':'OFFLINE_STUBBED_BRANCH_NOT_MODEL_ACCURACY'})
    print(json.dumps({'checks':len(rows),'assertions':'PASS_CURRENT_BEHAVIOR_NOT_SECURITY_PASS','network':'none','biometricInput':'none','results':rows},indent=2))
asyncio.run(main())
