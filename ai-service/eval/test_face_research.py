"""Synthetic plumbing tests, not PAD/identity accuracy measurements."""
import base64,os,sys,unittest
from pathlib import Path
from unittest.mock import Mock,patch
from types import SimpleNamespace
import cv2,numpy as np
from fastapi.testclient import TestClient
sys.path.insert(0,str(Path(__file__).parents[1]))
from face_research import infer_research
from face_research_app import create_app
from pad_mn3 import Measurement

class Detector:
    def setInputSize(self,size): pass
    def detect(self,image): return None,np.array([[10.2,12.7,100.4,102.1]+[30,30]*5+[.99]],dtype=np.float32)
class Recognizer:
    def alignCrop(self,image,face): return image
    def feature(self,image): return np.ones((1,128),np.float32)
    def match(self,*args): return .75
class ResearchTests(unittest.TestCase):
    def setUp(self):
        self.image=np.random.default_rng(42).integers(60,200,(160,160,3),dtype=np.uint8)
        self.models=SimpleNamespace(detector=Detector(),recognizer=Recognizer(),model_version='synthetic-unit-model')
        self.pad=Mock();self.pad.error=None;self.pad.measure.return_value=Measurement(.8,.2)
        _,png=cv2.imencode('.png',self.image)
        self.photo='data:image/png;base64,'+base64.b64encode(png).decode()
    def test_independent_measurements_no_authority_or_embedding(self):
        r=infer_research({'photo':self.photo,'referencePhoto':self.photo},self.models,self.pad)
        self.assertEqual(r['identityScore'],.75);self.assertEqual(r['padRealScore'],.8)
        self.assertEqual(self.pad.measure.call_args.args[0].shape,(128,128,3))
        np.testing.assert_array_equal(self.pad.measure.call_args_list[0].args[0],cv2.resize(self.image[12:115,10:111],(128,128),interpolation=cv2.INTER_LINEAR))
        self.assertFalse(r['verified']);self.assertFalse(r['enrolled']);self.assertIsNone(r['proof'])
        self.assertNotIn('embedding',r);self.assertEqual(r['padDecision'],'NOT_EVALUATED')
        self.assertTrue(all(v>=0 for v in r['latencyMs'].values()))
    def test_identity_error_does_not_fabricate_or_suppress_pad_score(self):
        self.models.recognizer.feature=Mock(side_effect=RuntimeError())
        r=infer_research({'photo':self.photo},self.models,self.pad)
        self.assertIsNone(r['identityScore']);self.assertEqual(r['padRealScore'],.8)
    def test_pad_error_does_not_become_pass_or_suppress_identity(self):
        self.pad.measure.side_effect=RuntimeError('timeout')
        r=infer_research({'photo':self.photo,'referencePhoto':self.photo},self.models,self.pad)
        self.assertEqual(r['identityScore'],.75);self.assertIsNone(r['padRealScore']);self.assertEqual(r['errorCode'],'PAD_TECHNICAL_ERROR')
    def test_no_reference_never_releases_embedding(self):
        r=infer_research({'photo':self.photo},self.models,self.pad)
        self.assertIsNone(r['identityScore']);self.assertEqual(r['identityDecision'],'REFERENCE_NOT_PROVIDED');self.assertNotIn('embedding',r)
    def test_quality_recorded_separately(self):
        _,png=cv2.imencode('.png',np.zeros((160,160,3),np.uint8))
        r=infer_research({'photo':'data:image/png;base64,'+base64.b64encode(png).decode()},self.models,self.pad)
        self.assertEqual(r['quality']['decision'],'FAIL');self.assertEqual(r['padDecision'],'NOT_EVALUATED')
    def test_bad_capture_no_scores(self):
        r=infer_research({'photo':'https://invalid'},self.models,self.pad)
        self.assertIsNone(r['padRealScore']);self.assertIsNone(r['identityScore']);self.assertFalse(r['verified'])
    def test_authenticated_synthetic_only_api(self):
        env={'FACE_RESEARCH_ISOLATED':'true','FACE_RESEARCH_AI_TOKEN':'t'*40,'FACE_RESEARCH_CAPTURE_APPROVED':'false'}
        with patch.dict(os.environ,env):
            app=create_app(self.models,self.pad)
            with TestClient(app) as c:
                body={'sessionId':'session','workerId':'worker','synthetic':True}
                self.assertEqual(c.post('/research/infer',json=body).status_code,401)
                headers={'x-face-research-token':'t'*40}
                self.assertEqual(c.post('/research/infer',json={'sessionId':'s','workerId':'w','photo':self.photo},headers=headers).status_code,403)
                self.assertEqual(c.post('/research/infer',json={**body,'photo':self.photo},headers=headers).status_code,400)
                r=c.post('/research/infer',json=body,headers=headers)
                self.assertEqual(r.status_code,200);self.assertFalse(r.json()['verified'])
                self.assertFalse(c.get('/research/capabilities',headers=headers).json()['proofAllowed'])
    def test_isolation_missing(self):
        with patch.dict(os.environ,{'FACE_RESEARCH_ISOLATED':'false'}):
            c=TestClient(create_app(self.models,self.pad))
            self.assertEqual(c.get('/research/capabilities').status_code,503)

if __name__=='__main__':unittest.main()


class Faces:
    """Stub detector returning N synthetic boxes (no person imagery)."""
    def __init__(self, n, box=(10.2, 12.7, 100.4, 102.1), score=.99): self.n, self.box, self.score = n, box, score
    def setInputSize(self, size): pass
    def detect(self, image):
        if self.n == 0: return None, None
        return None, np.array([list(self.box) + [30, 30] * 5 + [self.score]] * self.n, dtype=np.float32)


class LabDiagnosticsTests(unittest.TestCase):
    """FaceID Lab: structured stage diagnostics; stubbed models, synthetic pixels."""
    def setUp(self):
        self.pad = Mock(); self.pad.error = None; self.pad.measure.return_value = Measurement(.999, .001)
    def run_with(self, image, detector):
        _, png = cv2.imencode('.png', image)
        models = SimpleNamespace(detector=detector, recognizer=Recognizer(), model_version='synthetic-unit-model')
        return infer_research({'photo': 'data:image/png;base64,' + base64.b64encode(png).decode(), 'referencePhoto': 'data:image/png;base64,' + base64.b64encode(png).decode()}, models, self.pad)
    def texture(self, low=60, high=200):
        return np.random.default_rng(7).integers(low, high, (160, 160, 3), dtype=np.uint8)
    def test_high_pad_real_score_still_not_evaluated(self):
        r = self.run_with(self.texture(), Faces(1))
        self.assertEqual(r['padRealScore'], .999)
        self.assertEqual(r['padDecision'], 'NOT_EVALUATED')
        self.assertEqual(r['padPolicy']['decision'], 'NOT_EVALUATED')
        self.assertEqual(r['padPolicy']['reason'], 'PAD_BLOCKED_DATA')
        self.assertFalse(r['padPolicy']['evaluated'])
        self.assertEqual(r['identityDecision'], 'MEASURED')
        self.assertEqual(r['identityPolicy']['status'], 'PROVISIONAL_UNCALIBRATED')
    def test_detection_geometry_without_landmarks(self):
        r = self.run_with(self.texture(), Faces(1))
        self.assertEqual(r['detection']['faceCount'], 1)
        self.assertEqual(len(r['detection']['box']), 4)
        self.assertAlmostEqual(r['detection']['score'], .99, places=5)
        self.assertTrue(r['alignment']['performed'])
        self.assertNotIn('landmarks', r['detection'])
        self.assertNotIn('embedding', str(r))
    def test_no_face(self):
        r = self.run_with(self.texture(), Faces(0))
        self.assertEqual(r['errorCode'], 'NO_FACE'); self.assertEqual(r['quality']['reasons'], ['NO_FACE'])
        self.assertIsNone(r['identityScore']); self.assertIsNone(r['padRealScore'])
        self.assertEqual(r['padPolicy']['reason'], 'PAD_NOT_RUN_NO_SINGLE_FACE')
        self.pad.measure.assert_not_called()
    def test_multiple_faces(self):
        r = self.run_with(self.texture(), Faces(2))
        self.assertEqual(r['errorCode'], 'MULTIPLE_FACES'); self.assertEqual(r['detection']['faceCount'], 2)
        self.assertIsNone(r['detection']['box']); self.assertIsNone(r['identityScore'])
        self.pad.measure.assert_not_called()
    def test_low_confidence_detection(self):
        r = self.run_with(self.texture(), Faces(1, score=.4))
        self.assertEqual(r['errorCode'], 'INVALID_DETECTION'); self.assertIsNone(r['identityScore'])
    def test_small_face(self):
        r = self.run_with(self.texture(), Faces(1, box=(10, 10, 40, 40)))
        self.assertEqual(r['errorCode'], 'FACE_SIZE_OR_CROP'); self.assertIn('FACE_SIZE_OR_CROP', r['quality']['reasons'])
    def test_dark_and_flat_image_quality_reasons(self):
        r = self.run_with(np.full((160, 160, 3), 10, np.uint8), Faces(1))
        self.assertEqual(r['quality']['decision'], 'FAIL')
        self.assertIn('TOO_DARK', r['quality']['reasons']); self.assertIn('BLUR', r['quality']['reasons'])
    def test_overexposed(self):
        r = self.run_with(self.texture(235, 256), Faces(1))
        self.assertIn('TOO_BRIGHT', r['quality']['reasons'])
    def test_blurred_texture(self):
        r = self.run_with(cv2.GaussianBlur(self.texture(), (31, 31), 12), Faces(1))
        self.assertIn('BLUR', r['quality']['reasons']); self.assertNotIn('TOO_DARK', r['quality']['reasons'])
    def test_pad_timeout_is_inconclusive_with_reason(self):
        self.pad.measure.side_effect = RuntimeError('PAD_TIMEOUT')
        r = self.run_with(self.texture(), Faces(1))
        self.assertEqual(r['padPolicy'], {'decision': 'INCONCLUSIVE', 'reason': 'PAD_TIMEOUT', 'evaluated': False, 'threshold': None, 'evaluationReference': None})
        self.assertEqual(r['padDecision'], 'NOT_EVALUATED')
    def test_capabilities_report_gate_status(self):
        env = {'FACE_RESEARCH_ISOLATED': 'true', 'FACE_RESEARCH_AI_TOKEN': 't' * 40}
        models = SimpleNamespace(detector=Faces(1), recognizer=Recognizer(), model_version='synthetic-unit-model')
        with patch.dict(os.environ, env):
            with TestClient(create_app(models, self.pad)) as c:
                caps = c.get('/research/capabilities', headers={'x-face-research-token': 't' * 40}).json()
        self.assertEqual(caps['padEvaluationStatus'], 'PAD_BLOCKED_DATA')
        self.assertFalse(caps['padEvaluated']); self.assertFalse(caps['proofAllowed'])
        self.assertEqual(caps['identityPolicy']['status'], 'PROVISIONAL_UNCALIBRATED')
