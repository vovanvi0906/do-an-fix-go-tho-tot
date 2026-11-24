import asyncio
import importlib
import json
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from recommendation.visual_detector import VisualDetector, analyze_visual, load_visual_detector

class Array:
    def __init__(self, v):self.v=v
    def tolist(self):return self.v

def detector(boxes=None):
    classes=[{'kind':'object','categorySlug':'sua-dien','targetSlug':'o-cam-dien','code':'o-cam-dien','threshold':.75},
             {'kind':'sign','categorySlug':'sua-dien','targetSlug':'o-cam-dien','code':'burn_mark','threshold':.8}]
    boxes=boxes if boxes is not None else [(0,.95,[.1,.1,.9,.9]),(1,.9,[.2,.2,.4,.4])]
    result=types.SimpleNamespace(boxes=types.SimpleNamespace(cls=Array([b[0] for b in boxes]),conf=Array([b[1] for b in boxes]),xyxyn=Array([b[2] for b in boxes])))
    return VisualDetector(types.SimpleNamespace(predict=lambda **kw:[result]),{'classes':classes,'imageSize':640,'modelVersion':'TEST-FIXTURE','weightsSha256':'a'*64})

class VisualDetectorTests(unittest.TestCase):
    def test_disabled_and_missing_model_never_invent_signs(self):
        self.assertEqual(analyze_visual(None,detector(),False)['detections'],[])
        self.assertEqual(analyze_visual(None,None,True)['status'],'unavailable')
    def test_object_and_sign_are_spatially_associated(self):
        result=detector().predict(object());self.assertEqual(len(result['detections']),2)
        self.assertEqual(result['detections'][1]['objectId'],result['detections'][0]['id'])
    def test_outside_ambiguous_low_confidence_and_invalid_boxes_abstain(self):
        variants=[[(0,.95,[.1,.1,.4,.4]),(1,.9,[.6,.6,.9,.9])],[(0,.95,[.1,.1,.9,.9]),(0,.95,[.15,.15,.8,.8]),(1,.9,[.2,.2,.4,.4])],[(0,.95,[.1,.1,.9,.9]),(1,.79,[.2,.2,.4,.4])],[(0,.95,[.1,.1,.9,.9]),(1,.99,[float('nan'),.2,.4,.4])]]
        for boxes in variants:self.assertFalse(any(b['kind']=='sign' for b in detector(boxes).predict(object())['detections']))
    def test_general_detector_or_unreviewed_manifest_cannot_load(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'manifest.json';p.write_text(json.dumps({'schemaVersion':'fixgo.visual-detector.v1','task':'detect','validation':{'approvedForPilot':False}}))
            with patch.dict(os.environ,{'VISUAL_SERVICE_DETECTOR_ENABLED':'true','VISUAL_SERVICE_MODEL_MANIFEST':str(p)}):self.assertIsNone(load_visual_detector())
    def test_detector_failure_degrades_without_fault_labels(self):
        bad=types.SimpleNamespace(predict=lambda _:(_ for _ in ()).throw(RuntimeError()))
        self.assertEqual(analyze_visual(None,bad,True)['status'],'unavailable')
    def test_actual_v2_endpoint_can_use_detector_without_clip_or_yolo_classifier(self):
        router=importlib.import_module('recommendation.router')
        clip=types.SimpleNamespace(is_ready=lambda:False,get_target_embeddings=lambda:None)
        request=types.SimpleNamespace(headers={},state=types.SimpleNamespace(),app=types.SimpleNamespace(state=types.SimpleNamespace(visual_service_detector=detector(),yolo_cls_model=None)))
        response=types.SimpleNamespace(headers={})
        async def extract(*args):return b'fixture',None,''
        with patch.dict(sys.modules,{'clip_classifier':clip}),patch.dict(os.environ,{'VISUAL_SERVICE_DETECTOR_ENABLED':'true'}),patch.object(router,'extract_request_data',extract),patch.object(router,'decode_image_to_cv2',lambda _:object()),patch.object(router,'get_catalog_state',lambda:{'targets':{}}):
            result=asyncio.run(router.diagnose_v2(request,response,None,None,None))
        self.assertEqual(result.suggestedCategoryId,'sua-dien');self.assertEqual(result.engine,'model')
        self.assertEqual(result.visualAnalysis.detections[1].code,'burn_mark')

if __name__=='__main__':unittest.main()
