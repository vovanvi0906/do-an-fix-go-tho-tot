import asyncio,hashlib,importlib,json,os,sys,tempfile,types,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from recommendation.observable_candidate import ObservableCandidate,analyze_candidate,load_candidate

class Values:
    def __init__(self,v):self.v=v
    def tolist(self):return self.v

class CandidateTests(unittest.TestCase):
    def test_proposals_validate_geometry_and_never_invent_parent_or_normal(self):
        boxes=types.SimpleNamespace(cls=Values([0,0,float('nan'),0]),conf=Values([.9,.8,.9,.01]),xyxyn=Values([[.1,.1,.4,.4],[.5,.5,.2,.3],[0,0,1,1],[0,0,1,1]]))
        model=types.SimpleNamespace(predict=lambda **kw:[types.SimpleNamespace(boxes=boxes)])
        c=ObservableCandidate(model,{'classes':[{'code':'crack'}],'threshold':.15,'imgsz':320,'weightsSha256':'a'*64},{'crack':{'displayNameVi':'Nứt','definition':'Visible crack'}})
        r=c.predict(object());self.assertEqual(len(r['proposals']),1);self.assertIsNone(r['proposals'][0]['objectId']);self.assertEqual(r['labelStatus'],'AI_UNVERIFIED')
        self.assertNotIn('suggestedServiceId',r)

    def test_no_detection_and_failure_never_return_normal(self):
        model=types.SimpleNamespace(predict=lambda **kw:[types.SimpleNamespace(boxes=None)])
        c=ObservableCandidate(model,{'classes':[],'threshold':.2,'imgsz':320,'weightsSha256':'a'*64},{})
        self.assertEqual(c.predict(object())['status'],'no_detection')
        with patch.dict(os.environ,{'OBSERVABLE_CANDIDATE_ENABLED':'true'}):
            self.assertEqual(analyze_candidate(None,None)['status'],'unavailable')
        with patch.dict(os.environ,{'OBSERVABLE_CANDIDATE_ENABLED':'false'}):self.assertEqual(analyze_candidate(None,c)['status'],'disabled')

    def test_wrong_hash_or_class_map_cannot_load(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'best.pt').write_bytes(b'fixture');(root/'taxonomy.json').write_text(json.dumps({'classes':[{'code':'crack'}]}))
            manifest={'schema':'fixgo.studio.pseudo-detector.v1','task':'detect','status':'EXPERIMENTAL_NOT_DEPLOYED','labelStatus':'AI_UNVERIFIED','weights':'best.pt','weightsSha256':'0'*64,'taxonomyPath':'taxonomy.json','imgsz':320,'threshold':.15,'classes':[{'kind':'sign','code':'crack','name':'sign:crack'}]}
            p=root/'manifest.json';p.write_text(json.dumps(manifest))
            with patch.dict(os.environ,{'OBSERVABLE_CANDIDATE_ENABLED':'true','OBSERVABLE_CANDIDATE_MANIFEST':str(p)}):
                self.assertIsNone(load_candidate())
                manifest['weightsSha256']=hashlib.sha256(b'fixture').hexdigest();p.write_text(json.dumps(manifest))
                with patch.dict(sys.modules,{'ultralytics':types.SimpleNamespace(YOLO=lambda _:types.SimpleNamespace(task='detect',names={0:'wrong'}))}):self.assertIsNone(load_candidate())

    def test_candidate_cannot_override_main_category_or_select_service(self):
        router=importlib.import_module('recommendation.router')
        clip=types.SimpleNamespace(is_ready=lambda:True,predict_clip_full=lambda _:{'category_probs':{'sua_dien':.95,'sua_nuoc':.05}},get_target_embeddings=lambda:None)
        candidate=types.SimpleNamespace(predict=lambda _:{'status':'proposed','labelStatus':'AI_UNVERIFIED','modelSha256':'a'*64,'absenceMeans':'NOT_DETECTED_DOES_NOT_MEAN_NORMAL','proposals':[{'code':'visible_water','name':'Nước','definition':'TEST FIXTURE','confidence':.99,'xyxy':[.1,.1,.9,.9],'objectId':None}]})
        request=types.SimpleNamespace(headers={},state=types.SimpleNamespace(),app=types.SimpleNamespace(state=types.SimpleNamespace(observable_candidate=candidate,yolo_cls_model=None,visual_service_detector=None)))
        async def extract(*args):return b'fixture',None,''
        results=[]
        with patch.dict(sys.modules,{'clip_classifier':clip}),patch.object(router,'extract_request_data',extract),patch.object(router,'decode_image_to_cv2',lambda _:object()),patch.object(router,'get_catalog_state',lambda:{'targets':{}}):
            for enabled in ['false','true']:
                with patch.dict(os.environ,{'OBSERVABLE_CANDIDATE_ENABLED':enabled,'VISUAL_SERVICE_DETECTOR_ENABLED':'false'}):results.append(asyncio.run(router.diagnose_v2(request,types.SimpleNamespace(headers={}),None,None,None)))
        self.assertEqual(results[0].suggestedCategoryId,results[1].suggestedCategoryId)
        self.assertEqual(results[1].suggestedCategoryId,'sua-dien');self.assertIsNone(results[1].suggestedTargetId)
        self.assertEqual(results[1].observableAnalysis.proposals[0].code,'visible_water')

if __name__=='__main__':unittest.main()
