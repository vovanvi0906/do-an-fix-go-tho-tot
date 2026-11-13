"""Execute production face endpoint AST offline; no model startup/network/biometric data."""
import ast
import asyncio
import math
import types
import unittest
from pathlib import Path
import numpy as np

class FaceSecurityTests(unittest.TestCase):
    def run_case(self, case):
        tree = ast.parse((Path(__file__).parents[1] / 'main.py').read_text())
        node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == 'face_verify')
        node.decorator_list = []
        for arg in node.args.args:
            arg.annotation = None
        node.args.defaults = [ast.Constant(None)] * (len(node.args.args) - 1)
        class Detector:
            def setInputSize(self, _): pass
            def detect(self, image):
                count = {'no_face': 0, 'multiple_faces': 2}.get(case, 1)
                if case == 'reference_no_face' and image[0, 0, 0] == 2: count = 0
                return None, np.ones((count, 15))
        class Recognizer:
            def alignCrop(self, *_):
                if case == 'alignment_error': raise ValueError()
                return np.ones((2, 2, 3))
            def feature(self, _):
                if case == 'embedding_error': raise ValueError()
                return np.full((1, 128), np.nan if case == 'invalid_embedding' else 1)
            def match(self, *_):
                if case == 'comparison_error': raise ValueError()
                return {'non_match': .2, 'nan': float('nan'), 'infinity': float('inf'),
                        'string': '.9', 'out_of_range': 2}.get(case, .8)
        async def body():
            return dict(workerId='w', photoUrl='selfie', idCardImageUrl='' if case == 'reference_missing' else 'reference')
        def decode(value):
            if case == 'decode_failure' or (case == 'reference_decode_failure' and value == 'reference'): return None
            return np.full((2, 2, 3), 2 if value == 'reference' else 1)
        scope = dict(np=np, math=math, decode_image_to_cv2=decode,
                     FaceVerifyResponse=lambda **kw: kw,
                     cv2=types.SimpleNamespace(FaceRecognizerSF_FR_COSINE=0),
                     logger=types.SimpleNamespace(warning=lambda *_: None))
        exec(compile(ast.fix_missing_locations(ast.Module(body=[node], type_ignores=[])), 'main.py', 'exec'), scope)
        request = types.SimpleNamespace(json=body, app=types.SimpleNamespace(state=types.SimpleNamespace(
            face_detector=None if case == 'model_missing' else Detector(),
            face_recognizer=None if case == 'recognizer_missing' else Recognizer())))
        return asyncio.run(scope['face_verify'](request))

    def test_failures_never_verify(self):
        for case in ['model_missing', 'recognizer_missing', 'decode_failure', 'no_face', 'multiple_faces',
                     'reference_missing', 'reference_no_face', 'reference_decode_failure',
                     'alignment_error', 'embedding_error', 'invalid_embedding', 'comparison_error',
                     'nan', 'infinity', 'string', 'out_of_range', 'non_match']:
            with self.subTest(case=case):
                r = self.run_case(case)
                self.assertFalse(r['verified'])
                self.assertEqual(r['status'], 'NON_MATCH' if case == 'non_match' else
                                 'INCONCLUSIVE' if case in ['no_face', 'multiple_faces', 'reference_missing', 'reference_no_face'] else 'TECHNICAL_ERROR')
                if case != 'non_match': self.assertIsNone(r['confidence'])

    def test_match_identity_only(self):
        r = self.run_case('match')
        self.assertTrue(r['verified'])
        self.assertEqual((r['status'], r['method'], r['confidence']), ('MATCH', 'sface_cosine', .8))
        self.assertNotIn('livenessPassed', r)
