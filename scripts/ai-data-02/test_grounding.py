"""Grounding adapter contract tests with fixture artifacts and explicit prediction stubs."""
import json
import unittest
from pathlib import Path
from types import SimpleNamespace as NS
from unittest.mock import patch
import test_studio
from core import canonical
from grounding import descriptor,nms,link_signs,GroundingModel
from trial import sha


def fixture_manifest(root,target='t'):
    model=root/'grounding-fixture';model.mkdir(exist_ok=True)
    files={}
    for name in ['config.json','model.safetensors','preprocessor_config.json','tokenizer.json','tokenizer_config.json']:
        (model/name).write_text('{"model_type":"grounding-dino"}' if name.endswith('.json') else 'fixture only, not a real model')
        files[name]=sha(model/name)
    manifest=root/'grounding-fixture.json'
    manifest.write_text(canonical({'schema':'fixgo.studio.grounding-dino.v1','backend':'grounding-dino','task':'detect','modelDirectory':str(model),'files':files,
        'device':'cpu','shortestEdge':640,'longestEdge':1024,'objectThreshold':.3,'signThreshold':.25,'textThreshold':.2,'nmsIou':.5,'maximumSignObjectAreaRatio':.8,
        'classes':[{'kind':'object','name':'object:o-cam-dien','targetId':target,'prompts':['electrical outlet']},
                   {'kind':'sign','name':'sign:burn_mark','code':'burn_mark','targetId':target,'prompts':['burn mark']}]}))
    return manifest


class GroundingTests(unittest.TestCase):
    def setUp(self):test_studio.StudioTests.setUp(self)
    def tearDown(self):test_studio.StudioTests.tearDown(self)

    def test_descriptor_pins_artifacts_prompts_and_scope(self):
        manifest=fixture_manifest(self.root)
        config=descriptor(manifest,self.s.catalog,self.s.signs)
        self.assertEqual(config['backend'],'grounding-dino');self.assertEqual(config['nestedObjectContainment'],.95)
        (Path(config['modelDirectory'])/'model.safetensors').write_text('tampered')
        with self.assertRaises(ValueError):descriptor(manifest,self.s.catalog,self.s.signs)

    def test_invalid_prompt_or_target_rejected(self):
        manifest=fixture_manifest(self.root);m=json.loads(manifest.read_text());m['classes'][1]['prompts']=['burn mark. person.'];manifest.write_text(canonical(m))
        with self.assertRaises(ValueError):descriptor(manifest,self.s.catalog,self.s.signs)
        m['classes'][1]['prompts']=['burn mark'];m['classes'][1]['targetId']='invented';manifest.write_text(canonical(m))
        with self.assertRaises(ValueError):descriptor(manifest,self.s.catalog,self.s.signs)

    def test_nested_object_duplicates_removed_but_distinct_objects_kept(self):
        objects=[{'kind':'object','label':'t','xyxy':[.1,.1,.5,.8],'score':.9},
                 {'kind':'object','label':'t','xyxy':[0,0,1,1],'score':.5},
                 {'kind':'object','label':'t','xyxy':[.6,.2,.9,.7],'score':.8}]
        kept=nms(objects,.5);self.assertEqual(len(kept),2)
        self.assertEqual(kept[0]['score'],.9);self.assertEqual(kept[1]['score'],.8)

    def test_signs_require_unique_parent_and_not_whole_object(self):
        obj={'id':'o','kind':'object','label':'t','xyxy':[.1,.1,.9,.9]}
        signs=[{'id':'s','kind':'sign','label':'burn_mark','targetId':'t','xyxy':[.2,.2,.4,.4]},
               {'id':'whole','kind':'sign','label':'burn_mark','targetId':'t','xyxy':[.1,.1,.9,.9]},
               {'id':'outside','kind':'sign','label':'burn_mark','targetId':'t','xyxy':[0,0,.05,.05]}]
        linked,issues=link_signs([obj],signs,.8)
        self.assertEqual([s['id'] for s in linked],['s']);self.assertEqual(linked[0]['objectId'],'o')
        self.assertIn('SIGN_SPANS_WHOLE_OBJECT',issues);self.assertIn('SIGN_OBJECT_ASSOCIATION_UNCERTAIN',issues)
        linked,_=link_signs([obj,{**obj,'id':'ambiguous'}],[signs[0]],.8);self.assertEqual(linked,[])

    def test_existing_detector_routes_unscoped_image_and_keeps_geometry(self):
        model=GroundingModel.__new__(GroundingModel)
        obj={'id':'','kind':'object','label':'t','xyxy':[.1,.1,.9,.9],'score':.9,'model':'existing strict-v2 YOLO'}
        model.config={'scopeMode':'catalog-adaptive','explicitTarget':False,'maxUnscopedObjects':1,
                      'classes':[{'kind':'object','targetId':'t','name':'object:outlet'},
                                 {'kind':'object','targetId':'other','name':'object:other'},
                                 {'kind':'sign','code':'burn_mark','name':'sign:burn_mark','targetIds':['t']}],
                      'maximumSignObjectAreaRatio':.8}
        model.detect_existing_objects=lambda image:[dict(obj)]
        calls=[]
        def detect(image,meta):
            calls.append(meta['name'])
            return [{'id':'','kind':'sign','label':'burn_mark','targetIds':['t'],'xyxy':[.3,.3,.5,.5],'score':.8}]
        model.detect_class=detect
        boxes,issues,timing,diagnostics=model.predict(None,{'candidate_target_ids_json':'[]'})
        self.assertEqual(calls,['sign:burn_mark'])
        self.assertEqual(boxes[0]['xyxy'],obj['xyxy'])
        self.assertEqual(boxes[1]['objectId'],boxes[0]['id'])
        self.assertEqual(diagnostics['targetIdsSearched'],['t'])
        self.assertIn('TARGET_SCOPE_USES_OBJECT_DETECTOR',diagnostics['scopeWarnings'])
        self.assertEqual(issues,[])

    def test_explicit_target_survives_other_detector_class(self):
        model=GroundingModel.__new__(GroundingModel)
        model.config={'scopeMode':'catalog-adaptive','explicitTarget':True,'classes':[
            {'kind':'object','targetId':'t','name':'object:t'},
            {'kind':'sign','code':'burn_mark','name':'sign:burn_mark','targetIds':['t']}],
            'maximumSignObjectAreaRatio':.8}
        model.detect_existing_objects=lambda image:[{'kind':'object','label':'other'}]
        calls=[]
        model.detect_class=lambda image,meta:calls.append(meta['name']) or []
        boxes,issues,_,diagnostics=model.predict(None,{})
        self.assertEqual(calls,['object:t','sign:burn_mark'])
        self.assertEqual(boxes,[])
        self.assertEqual(diagnostics['targetIdsSearched'],['t'])

    def test_grounding_runtime_does_not_load_clip_yolo(self):
        import batch
        model=object()
        with patch('grounding.GroundingModel',return_value=model),patch('sys.path',list(__import__('sys').path)):
            runtime=batch.RealModels({'runtimeEngine':'grounding-dino','cpuThreads':2,'signDetector':{}},self.s.catalog)
        self.assertIs(runtime.grounding,model);self.assertFalse(hasattr(runtime,'classifier'))

    def test_inspection_request_can_process_reviewed_without_overwriting(self):
        from autolabel import request_run
        e=self.s.save(test_studio.StudioTests.payload(self,verified=True))
        request=request_run(self.s,['i0'],include_reviewed=True)
        self.assertEqual(request['imageIds'],['i0']);self.assertTrue(request['inspectionOnly'])
        self.assertEqual(self.s.studio_latest['i0'],e)


if __name__=='__main__':unittest.main(verbosity=2)
