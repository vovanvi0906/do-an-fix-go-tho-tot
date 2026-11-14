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
