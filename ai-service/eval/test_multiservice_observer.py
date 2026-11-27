import asyncio,importlib,json,os,sys,tempfile,types,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from recommendation.multiservice_observer import MultiServiceObserver,analyze_observer,load_observer,scope_observations,digest,SERVICE_GROUPS


def proposal(code,score=.8):
    return {'code':code,'name':code,'definition':'TEST FIXTURE','confidence':score,'xyxy':[.1,.2,.4,.7],'objectId':None}

def observer(fail=()):
    release={'modelVersion':'TEST-PILOT','coverage':[],'classes':{c:{'geometryType':'device_context' if c=='scorched_outlet' else 'visible_region','relatedServiceGroups':['sua-dien'] if c=='scorched_outlet' else []} for c in ['crack','scorched_outlet']}}
    experts=[]
    for ident,codes,props in [('general',['scorched_outlet'],[proposal('crack'),proposal('scorched_outlet'),proposal('scorched_outlet',.1)]),('crack',['crack'],[proposal('crack')])]:
        def predict(image,ident=ident,props=props):
            if ident in fail:raise RuntimeError('fixture unavailable')
            return {'proposals':props}
        experts.append(({'id':ident,'includeCodes':codes,'thresholds':{c:.3 for c in codes}},types.SimpleNamespace(predict=predict,manifest={'weightsSha256':'a'*64})))
    return MultiServiceObserver(release,experts,'b'*64)

class ObserverTests(unittest.TestCase):
    def test_evaluation_receipt_requires_matching_report_and_protocol_checksums(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'bundle.json').write_text('{}')
            (root/'report.json').write_text(json.dumps({'cases':1,'productionValidated':False}))
            (root/'protocol.json').write_text(json.dumps({'cases':1}))
            release={'schema':'fixgo.multiservice-observer.v1','status':'PILOT_AI_UNVERIFIED','modelVersion':'fixture-tested','models':[{'id':'crack','manifest':'bundle.json','manifestSha256':digest(root/'bundle.json'),'includeCodes':['crack'],'thresholds':{'crack':.4}}],'classes':{'crack':{'name':'Crack','geometryType':'visible_region','relatedServiceGroups':[]}},'coverage':[{'categorySlug':g,'status':'no_domain_dataset','signCodes':[]} for g in SERVICE_GROUPS],'quality':{'evaluation':{'status':'limited_scope_evaluated','cases':1,'productionValidated':False,'report':'report.json','reportSha256':digest(root/'report.json'),'protocol':'protocol.json','protocolSha256':digest(root/'protocol.json')}}}
            p=root/'release.json';p.write_text(json.dumps(release));expert=types.SimpleNamespace(manifest={'classes':[{'code':'crack'}],'threshold':.15})
            with patch.dict(os.environ,{'MULTISERVICE_OBSERVER_ENABLED':'true','MULTISERVICE_OBSERVER_MANIFEST':str(p)}),patch('recommendation.multiservice_observer.load_candidate',return_value=expert):
                self.assertIsNotNone(load_observer())
                (root/'report.json').write_text(json.dumps({'cases':999,'productionValidated':False}))
                self.assertIsNone(load_observer())
    def test_context_gating_and_unsupported_gardening_never_confirm_absence(self):
        model=observer();model.release['classes']['scorched_outlet']['contextMode']='category'
        raw=model.predict(None)
        water=scope_observations(raw,model,'sua-nuoc')
        self.assertEqual([p['code'] for p in water['proposals']],['crack'])
        garden=scope_observations(raw,model,'lam-vuon')
        self.assertEqual(garden['proposals'],[]);self.assertEqual(garden['contextStatus'],'unsupported_category')
        model.release['classes']['scorched_outlet']['unscopedThreshold']=.9
        self.assertEqual(len(scope_observations(raw,model,None)['proposals']),1)
    def test_weak_class_is_disabled_and_reported_not_silently_called_normal(self):
        model=observer();model.release['classes']['scorched_outlet'].update(enabled=False,name='Socket context')
        result=model.predict(None)
        self.assertEqual([p['code'] for p in result['proposals']],['crack'])
        self.assertEqual(result['unavailableSigns'][0]['code'],'scorched_outlet')
    def test_expert_ownership_thresholds_geometry_and_no_fault_confirmation(self):
        result=observer().predict(None)
        self.assertEqual([p['code'] for p in result['proposals']],['scorched_outlet','crack'])
        self.assertEqual([p['modelId'] for p in result['proposals']],['general','crack'])
        self.assertEqual(result['proposals'][0]['geometryType'],'device_context')
        self.assertTrue(all(p['objectId'] is None for p in result['proposals']))
        self.assertNotIn('suggestedServiceId',result)
    def test_failed_expert_keeps_other_signs_and_reports_partial_result(self):
        result=observer(('crack',)).predict(None)
        self.assertEqual(result['degradedModels'],['crack']);self.assertEqual(len(result['proposals']),1)
        self.assertEqual(result['absenceMeans'],'NOT_DETECTED_DOES_NOT_MEAN_NORMAL')
    def test_total_failure_and_disable_are_explicit(self):
        self.assertEqual(observer(('crack','general')).predict(None)['status'],'unavailable')
        with patch.dict(os.environ,{'MULTISERVICE_OBSERVER_ENABLED':'false'}):self.assertEqual(analyze_observer(None,observer())['status'],'disabled')
    def test_checksum_failure_cannot_load_models(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'bundle.json').write_text('{}');p=root/'release.json'
            p.write_text(json.dumps({'schema':'fixgo.multiservice-observer.v1','status':'PILOT_AI_UNVERIFIED','modelVersion':'fixture','models':[{'id':'general','manifest':'bundle.json','manifestSha256':'0'*64}]}))
            with patch.dict(os.environ,{'MULTISERVICE_OBSERVER_ENABLED':'true','MULTISERVICE_OBSERVER_MANIFEST':str(p)}),patch('recommendation.multiservice_observer.load_candidate') as load:
                self.assertIsNone(load_observer());load.assert_not_called()
    def test_api_preserves_evidence_even_without_category_and_never_selects_service(self):
        router=importlib.import_module('recommendation.router')
        clip=types.SimpleNamespace(is_ready=lambda:False,get_target_embeddings=lambda:None)
        request=types.SimpleNamespace(headers={},state=types.SimpleNamespace(),app=types.SimpleNamespace(state=types.SimpleNamespace(multiservice_observer=observer(),yolo_cls_model=None,visual_service_detector=None)))
        async def extract(*args):return b'fixture',None,''
        with patch.dict(sys.modules,{'clip_classifier':clip}),patch.dict(os.environ,{'MULTISERVICE_OBSERVER_ENABLED':'true','VISUAL_SERVICE_DETECTOR_ENABLED':'false'}),patch.object(router,'extract_request_data',extract),patch.object(router,'decode_image_to_cv2',lambda _:object()),patch.object(router,'get_catalog_state',lambda:{'targets':{}}):
            result=asyncio.run(router.diagnose_v2(request,types.SimpleNamespace(headers={}),None,None,None))
        self.assertIsNone(result.suggestedCategoryId);self.assertIsNone(result.suggestedTargetId)
        self.assertEqual(result.observableAnalysis.modelVersion,'TEST-PILOT');self.assertEqual(len(result.observableAnalysis.proposals),2)
        self.assertEqual(result.model_version,'fixgo-ai-rec-v2-multiservice')
        self.assertEqual(result.engine,'model')

    def test_default_release_enables_only_signs_that_passed_held_out_gate(self):
        from recommendation.multiservice_observer import DEFAULT_MANIFEST
        release=json.loads(Path(DEFAULT_MANIFEST).read_text())
        self.assertEqual(release['modelVersion'],'fixgo-multiservice-observer-v2-gated')
        self.assertEqual(sorted(c for c,m in release['classes'].items() if m.get('enabled',True)),['crack'])
        for code,meta in release['classes'].items():
            if not meta.get('enabled',True):self.assertIn(meta['unavailableReason'],['insufficient_held_out_positives','below_held_out_quality_gate','no_held_out_evaluation'])
        for group in release['coverage']:self.assertEqual(sorted(group['availableSignCodes']+group['unavailableSignCodes']),sorted(group['signCodes']))
        model=MultiServiceObserver(release,[],'sha');result=model.predict(None)
        self.assertEqual({s['code'] for s in result['unavailableSigns']},set(release['classes'])-{'crack'})
        self.assertTrue(all(s['reason']=='insufficient_development_quality' for s in result['unavailableSigns']))

if __name__=='__main__':unittest.main()
