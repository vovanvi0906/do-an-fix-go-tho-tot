"""Multiservice search scopes are proposals, never an approved diagnosis taxonomy."""
import json
import unittest
from pathlib import Path
import test_studio
from grounding_catalog import make_scope,image_scope,PROMPTS
from grounding import descriptor,link_signs
from test_grounding import fixture_manifest


class CatalogGroundingTests(unittest.TestCase):
    def setUp(self):
        test_studio.StudioTests.setUp(self)
        self.base=fixture_manifest(self.root)
        self.s.catalog={'categories':[{'id':'e','slug':'sua-dien','name':'Điện'},{'id':'w','slug':'sua-nuoc','name':'Nước'},
                                      {'id':'a','slug':'dien-lanh','name':'Điện lạnh'},{'id':'c','slug':'giup-viec','name':'Giúp việc'},
                                      {'id':'g','slug':'lam-vuon','name':'Làm vườn'},{'id':'d','slug':'thiet-bi','name':'Thiết bị'}],
                        'targets':[{'id':'outlet','slug':'o-cam-dien','categoryId':'e','name':'Ổ cắm'},
                                   {'id':'tap','slug':'voi-nuoc-voi-sen','categoryId':'w','name':'Vòi'},
                                   {'id':'washer','slug':'may-giat-may-giat-say','categoryId':'a','name':'Máy giặt'},
                                   {'id':'floor','slug':'san-nha-tuong-tran-noi-that','categoryId':'c','name':'Sàn'},
                                   {'id':'plant','slug':'cay-canh-chau-cay','categoryId':'g','name':'Cây'},
                                   {'id':'stove','slug':'bep-gas-bep-gas-am','categoryId':'d','name':'Bếp'},
                                   {'id':'survey','slug':'kiem-tra-khao-sat-su-co-dien','categoryId':'e','name':'Khảo sát'}]}
        self.s.targets={t['id']:t for t in self.s.catalog['targets']}
        self.s.signs={code:{'name':code} for code in json.loads(PROMPTS.read_text())['signPrompts']}

    def tearDown(self):test_studio.StudioTests.tearDown(self)

    def test_all_six_categories_have_relevant_observable_signs(self):
        expected={'outlet':'burn_mark','tap':'water_dripping','washer':'wet_surface','floor':'surface_soiling','plant':'leaf_debris','stove':'broken_part'}
        for target,sign in expected.items():
            path=make_scope(self.s,self.base,target_id=target)
            config=descriptor(path,self.s.catalog,self.s.signs)
            self.assertEqual([c['targetId'] for c in config['classes'] if c['kind']=='object'],[target])
            self.assertIn(sign,{c['code'] for c in config['classes'] if c['kind']=='sign'})
            self.assertTrue(all(target in c['targetIds'] for c in config['classes'] if c['kind']=='sign'))

    def test_scope_is_immutable_and_explicit_target_overrides_stale_category(self):
        one=make_scope(self.s,self.base,target_id='tap',category_id='e')
        two=make_scope(self.s,self.base,target_id='tap')
        self.assertEqual(one,two)
        content=json.loads(one.read_text());self.assertTrue(content['explicitTarget'])
        self.assertIn('Search hints',content['scopeApproval'])
        one.write_text('{}')
        with self.assertRaises(ValueError):make_scope(self.s,self.base,target_id='tap')

    def test_nonvisual_service_does_not_get_fabricated_box_prompts(self):
        with self.assertRaisesRegex(ValueError,'tác vụ dịch vụ'):make_scope(self.s,self.base,target_id='survey')
        path=make_scope(self.s,self.base)
        config=json.loads(path.read_text());self.assertIn('survey',config['unsupportedTargetIds'])
        self.assertNotIn('survey',{c.get('targetId') for c in config['classes']})

    def test_source_hints_only_narrow_search_not_positive_label(self):
        config=json.loads(make_scope(self.s,self.base).read_text())
        selected,warnings=image_scope(config,{'candidate_target_ids_json':'["washer"]'})
        self.assertEqual([c['targetId'] for c in selected],['washer'])
        self.assertIn('TARGET_SCOPE_USES_UNVERIFIED_SOURCE_HINT',warnings)
        config['maxUnscopedObjects']=2
        selected,warnings=image_scope(config,{'candidate_target_ids_json':'[]'})
        self.assertEqual(selected,[]);self.assertIn('TARGET_SCOPE_REQUIRED',warnings)

    def test_real_catalog_prompt_coverage_and_ontology(self):
        repo=Path(__file__).resolve().parents[2]
        catalog=json.loads((repo/'docs/ai-data-audit/evidence/catalog.json').read_text())
        config=json.loads(PROMPTS.read_text())
        slugs={t['slug'] for t in catalog['targets']}
        self.assertEqual(slugs,set(config['objects'])|set(config['nonVisualTargets']))
        signs=set(json.loads((repo/'docs/ai-data-audit/evidence/ontology.json').read_text())['signs'])
        self.assertEqual(signs,set(config['signPrompts']))
        self.assertEqual({c['slug'] for c in catalog['categories']},set(config['categorySigns']))

    def test_cache_key_includes_search_scope_even_for_identical_pixels(self):
        from batch import scope_hash,valid_cache
        from core import atomic,canonical,digest
        config=json.loads(make_scope(self.s,self.base).read_text())
        profile={'runtimeEngine':'grounding-dino','profileHash':'scope-fixture','signDetector':config}
        row=dict(self.s.rows['i0']);row['candidate_target_ids_json']='["outlet"]'
        other={**row,'image_id':'different-id','candidate_target_ids_json':'["tap"]'}
        self.assertNotEqual(scope_hash(row,profile),scope_hash(other,profile))
        cache={'profileHash':profile['profileHash'],'contentHash':row['sha256'],'scopeHash':scope_hash(row,profile),'technicalStatus':'SUCCESS'}
        cache['cacheHash']=digest(canonical(cache).encode());path=self.root/'scope-cache.json';atomic(path,cache)
        self.assertTrue(valid_cache(path,row,profile));self.assertFalse(valid_cache(path,other,profile))

    def test_switching_compatible_service_scopes_keeps_proposals_visible(self):
        from core import atomic,canonical,digest
        folder=self.s.state/'grounding-scopes';folder.mkdir(exist_ok=True)
        manifest=folder/'fixture.json';manifest.write_text('{}')
        own={'runtimeEngine':'grounding-dino','compatibilityKey':'same-runtime','signDetector':{'manifestPath':str(manifest),'manifestSha256':digest(manifest.read_bytes())}}
        own['profileHash']=digest(canonical(own).encode())
        cache={'profileHash':own['profileHash'],'modelProfile':own,'contentHash':self.s.rows['i0']['sha256'],'technicalStatus':'SUCCESS'}
        cache['cacheHash']=digest(canonical(cache).encode());atomic(self.s.cache_dir/'i0.json',cache)
        atomic(self.s.state/'active-model-profile.json',{'runtimeEngine':'grounding-dino','compatibilityKey':'same-runtime','profileHash':'other-service-scope'})
        self.assertIsNotNone(self.s.ai('i0'))
        manifest.write_text('{"changed":true}')
        self.assertIsNone(self.s.ai('i0'))
        manifest.write_text('{}')
        atomic(self.s.state/'active-model-profile.json',{'runtimeEngine':'grounding-dino','compatibilityKey':'different-runtime','profileHash':'other-version'})
        self.assertIsNone(self.s.ai('i0'))

    def test_multitarget_sign_parent_compatibility(self):
        objects=[{'id':'tap-box','label':'tap','xyxy':[.1,.1,.5,.5]}, {'id':'plant-box','label':'plant','xyxy':[.6,.6,.9,.9]}]
        sign={'id':'wet','kind':'sign','label':'wet_surface','targetIds':['tap','washer'],'xyxy':[.2,.2,.3,.3]}
        linked,issues=link_signs(objects,[sign],.8)
        self.assertEqual(linked[0]['objectId'],'tap-box');self.assertNotIn('targetIds',linked[0]);self.assertEqual(issues,[])
        sign['xyxy']=[.65,.65,.75,.75]
        linked,issues=link_signs(objects,[sign],.8);self.assertEqual(linked,[])


if __name__=='__main__':unittest.main(verbosity=2)
