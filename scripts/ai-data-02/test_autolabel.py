"""Automated-label gates tested with fixture pixels and explicitly stubbed predictions."""
import copy
import csv
import json
import unittest
from unittest.mock import patch
from pathlib import Path
import test_studio
from core import Studio, atomic, canonical, digest
from autolabel import request_run, build_report, export_pseudo, read_report, snapshot, analyze
from trial import prepare as prepare_trial


class AutoLabelTests(unittest.TestCase):
    payload = test_studio.StudioTests.payload

    def setUp(self):
        test_studio.StudioTests.setUp(self)
        self.s.close()
        rows=list(self.s.rows.values())
        claim={'workspace':'outletv2','project':'outlet-4xvv4','version':1,'url':'https://universe.roboflow.com/outletv2/outlet-4xvv4/dataset/1'}
        for row in rows:
            row.update(corpus='raw_source',source_claim_json=canonical(claim))
        with self.inventory.open('w',newline='') as stream:
            writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
        self.s=Studio(self.inventory,self.root/'auto-state')
        self.profile={'schema':'fixgo.studio.model-profile.v1','profileHash':'fixture-model-profile'}
        atomic(self.s.state/'active-model-profile.json',self.profile)
        for i in self.s.rows:self.cache(i)

    def tearDown(self):
        test_studio.StudioTests.tearDown(self)

    def cache(self,i,**changes):
        prediction={'targetCandidates':[{'targetId':'t','confidence':.95}], 'boxes':[{'id':'ai-object-0','kind':'object','label':'t','xyxy':[.1,.1,.8,.8],'objectId':None,'score':.95}],
                    'uncertain':False,'visibleDefects':None,'signIssues':[]}
        prediction.update(changes)
        c={'imageId':i,'contentHash':self.s.rows[i]['sha256'],'profileHash':self.profile['profileHash'],'technicalStatus':'SUCCESS','prediction':prediction}
        c['cacheHash']=digest(canonical(c).encode());atomic(self.s.cache_dir/(i+'.json'),c)

    def report(self):
        request=request_run(self.s,list(self.s.rows))
        return request,build_report(self.inventory,self.s.state,request['runId'],self.profile)

    def rights(self):
        dataset=self.s.source_profiles.for_row(self.s.rows['i0'])
        return self.s.source_profiles.save({'datasetId':dataset['id'],'expectedRevision':None,'reviewer':'Fixture rights owner',
             'sourceEvidence':'Generated fixture source evidence only','licenseStatus':'VERIFIED','licenseType':'owned','licenseConfirmed':True,
             'licenseEvidence':'Generated fixture ownership evidence; never applies to real images'})

    def test_report_does_not_make_absence_normal_or_verify(self):
        request,report=self.report()
        self.assertEqual(report['summary']['proposed'],4)
        self.assertFalse(report['summary']['hasSignModel'])
        self.assertEqual(self.s.studio_latest,{})
        for record in report['records']:
            self.assertEqual(record['outcome'],'UNKNOWN');self.assertFalse(record['humanVerified'])
            self.assertIn('NO_SIGN_MODEL',record['warnings'])
        self.assertEqual(read_report(self.s.state,request['runId'])['runId'],request['runId'])

    def test_queue_keeps_human_revisions_and_drafts(self):
        event=self.s.save(self.payload())
        request,report=self.report()
        self.assertNotIn('i0',request['imageIds']);self.assertEqual(request['skippedHumanImages'],['i0'])
        self.assertEqual(self.s.studio_latest['i0'],event)

    def test_conflicts_and_errors_are_separated(self):
        self.cache('i0',uncertain=True)
        self.cache('i1',targetCandidates=[{'targetId':'wrong-target'}])
        self.cache('i2',boxes=[])
        Path(self.s.rows['i3']['path']).write_bytes(b'changed')
        _,report=self.report();by_id={r['imageId']:r for r in report['records']}
        self.assertIn('MODEL_UNCERTAIN',by_id['i0']['issues'])
        self.assertIn('CLASSIFIER_DETECTOR_DISAGREE',by_id['i1']['issues'])
        self.assertIn('NO_OBJECT_GEOMETRY',by_id['i2']['issues'])
        self.assertEqual(by_id['i3']['bucket'],'ERROR')
        self.assertEqual(report['summary']['needsReview'],3)

    def test_pseudo_export_requires_ack_rights_and_real_sign_model(self):
        request,_=self.report()
        with self.assertRaises(ValueError):export_pseudo(self.s,request['runId'],'no-ack')
        with self.assertRaisesRegex(ValueError,'rights'):export_pseudo(self.s,request['runId'],'no-rights',acknowledged=True)
        self.rights()
        with self.assertRaisesRegex(ValueError,'No sign detector'):export_pseudo(self.s,request['runId'],'fake-signs','objects-and-signs',True)
        result=export_pseudo(self.s,request['runId'],'fixture-pseudo',acknowledged=True)
        out=Path(result['path']);m=json.loads((out/'manifest.json').read_text())
        self.assertEqual(m['schema'],'fixgo.studio.pseudo.v1');self.assertFalse(m['humanVerified'])
        self.assertEqual(m['labelStatus'],'AI_UNVERIFIED');self.assertTrue((out/'ATTRIBUTION.txt').is_file())
        self.assertTrue(all(name.startswith('object:') for name in m['classMapping'].values()))
        self.assertTrue(all('sign:' not in (out/'data.yaml').read_text() for _ in [0]))
        with self.assertRaises(ValueError):export_pseudo(self.s,request['runId'],'fixture-pseudo',acknowledged=True)
        with self.assertRaises(ValueError):prepare_trial(self.s,out,{},['burn_mark'],self.root/'must-not-train')
        self.assertFalse((self.root/'must-not-train').exists())

    def test_export_rechecks_human_source_and_report_tampering(self):
        request,_=self.report();self.rights()
        self.s.save(self.payload('i0',True))
        result=export_pseudo(self.s,request['runId'],'human-kept',acknowledged=True)
        self.assertEqual(result['images'],3)
        folder=self.s.state/'auto-runs'/request['runId'];(folder/'report.json').write_text('{}')
        with self.assertRaisesRegex(ValueError,'checksum'):read_report(self.s.state,request['runId'])

    def test_whole_filter_selection_and_exposure_grouping(self):
        from selection import filtered_ids
        self.assertEqual(len(filtered_ids(self.s,{'page':99,'category':'c'})),4)
        self.assertEqual(filtered_ids(self.s,{'q':'0.png'}),['i0'])
        ctx=snapshot(self.inventory,self.s.state)
        ctx.rows['i0']['pixel_sha256']='bridge';ctx.rows['i1']['pixel_sha256']='bridge';ctx.rows['i1']['phash_component_id']='more';ctx.rows['i2']['phash_component_id']='more';ctx.rows['i1']['component_exposure_json']='["train"]'
        records=analyze(ctx,['i0','i2'],self.profile)
        self.assertEqual(records[0]['group']['component'],records[1]['group']['component'])
        self.assertTrue(all(r['split']=='train' for r in records));self.assertTrue(all(r['duplicateCandidate'] for r in records))

    def test_batch_continues_after_bad_image_with_stub_model(self):
        import batch
        Path(self.s.rows['i0']['path']).write_bytes(b'bad-source')
        with patch.object(batch,'profile',return_value=self.profile):
            result=batch.run(self.inventory,self.s.state,['i0','i1'],max_images=50000)
        self.assertEqual(result['processed'],2);self.assertEqual(result['failed'],1);self.assertEqual(result['cacheHits'],1)
        marker=self.s.state/'STOP';marker.touch()
        with patch.object(batch,'profile',return_value=self.profile):
            stopped=batch.run(self.inventory,self.s.state,['i1'],stop_path=marker)
        self.assertEqual(stopped['status'],'CANCELLED');self.assertEqual(stopped['processed'],0)

    def test_queue_over_500_and_exact_duplicate_cache_reuse(self):
        import batch
        original=dict(self.s.rows['i0']);self.s.close()
        rows=[{**original,'image_id':'i'+str(n),'proposed_source_component':'g'+str(n)} for n in range(501)]
        with self.inventory.open('w',newline='') as stream:
            writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
        self.s=Studio(self.inventory,self.root/'large-auto-state');self.cache('i0')
        with self.assertRaises(ValueError):batch.run(self.inventory,self.s.state,list(self.s.rows))
        with patch.object(batch,'profile',return_value=self.profile),patch.object(batch,'RealModels',side_effect=AssertionError('No inference needed for exact same pixels')):
            result=batch.run(self.inventory,self.s.state,list(self.s.rows),max_images=50000)
        self.assertEqual(result['processed'],501);self.assertEqual(result['cacheHits'],501);self.assertEqual(result['exactDuplicateReuse'],500)
        c=json.loads((self.s.cache_dir/'i500.json').read_text());self.assertEqual(c['imageId'],'i500');self.assertIn('reusedFromImageId',c)

    def test_model_load_failure_fails_once_and_can_resume_cache(self):
        import batch
        (self.s.cache_dir/'i0.json').unlink()
        with patch.object(batch,'profile',return_value=self.profile),patch.object(batch,'RealModels',side_effect=RuntimeError('Fixture missing model')) as model:
            with self.assertRaises(batch.ModelLoadError):batch.run(self.inventory,self.s.state,['i0','i1'])
        self.assertEqual(model.call_count,1)
        self.assertEqual(json.loads((self.s.state/'batch-progress.json').read_text())['status'],'FAILED')
        self.cache('i0')
        with patch.object(batch,'profile',return_value=self.profile):resumed=batch.run(self.inventory,self.s.state,['i0','i1'])
        self.assertEqual(resumed['cacheHits'],2);self.assertEqual(resumed['status'],'COMPLETED')

    def test_optional_sign_model_exports_positive_proposals_only(self):
        self.profile['signDetector']={'classes':[{'kind':'sign','code':'burn_mark','name':'sign:burn_mark'}]}
        atomic(self.s.state/'active-model-profile.json',self.profile)
        for i in self.s.rows:self.cache(i,visibleDefects=[],signCapability=True)
        c=json.loads((self.s.cache_dir/'i0.json').read_text());c['prediction']['boxes'].append({'id':'sign0','kind':'sign','label':'burn_mark','xyxy':[.2,.2,.3,.3],'objectId':'ai-object-0','score':.9});c['prediction']['visibleDefects']=['burn_mark'];c.pop('cacheHash');c['cacheHash']=digest(canonical(c).encode());atomic(self.s.cache_dir/'i0.json',c)
        request,_=self.report();self.rights()
        result=export_pseudo(self.s,request['runId'],'sign-pseudo','objects-and-signs',True)
        self.assertEqual(result['images'],1);self.assertEqual(result['excluded'],3)
        out=Path(result['path']);m=json.loads((out/'manifest.json').read_text());self.assertIn('sign:burn_mark',m['classMapping'].values())
        self.assertEqual(m['records'][0]['outcome'],'UNKNOWN')
        self.assertTrue(any(line.startswith('1 ') for label in (out/'labels').rglob('*.txt') for line in label.read_text().splitlines()))

    def test_sign_manifest_hash_classes_and_geometry_with_stub_detector(self):
        from sign_model import descriptor,SignModel
        from types import SimpleNamespace as NS
        from trial import sha
        weights=self.root/'stub.pt';weights.write_bytes(b'fixture artifact, not a loadable model')
        manifest=self.root/'sign.json';data={'schema':'fixgo.studio.pseudo-detector.v1','task':'detect','weights':weights.name,'weightsSha256':sha(weights),'classes':[{'kind':'sign','name':'sign:burn_mark','code':'burn_mark'}],'threshold':.5}
        manifest.write_text(canonical(data));config=descriptor(manifest,self.s.catalog,self.s.signs)
        model=SignModel.__new__(SignModel);model.config=config;model.targets=self.s.targets
        def tensor(value):return NS(tolist=lambda:value)
        result=NS(boxes=NS(cls=tensor([0,0]),conf=tensor([.9,.9]),xyxyn=tensor([[.2,.2,.3,.3],[.85,.85,.95,.95]])))
        model.model=NS(predict=lambda *a,**k:[result])
        boxes,issues=model.predict(None,[{'id':'object','kind':'object','label':'t','xyxy':[.1,.1,.8,.8]}])
        self.assertEqual(len(boxes),2);self.assertEqual(boxes[1]['objectId'],'object');self.assertIn('SIGN_OBJECT_ASSOCIATION_UNCERTAIN',issues)
        data['classes'][0]['code']='hidden_fault';manifest.write_text(canonical(data))
        with self.assertRaises(ValueError):descriptor(manifest,self.s.catalog,self.s.signs)
        data['classes'][0]['code']='burn_mark';data['weightsSha256']='0'*64;manifest.write_text(canonical(data))
        with self.assertRaises(ValueError):descriptor(manifest,self.s.catalog,self.s.signs)


if __name__=='__main__':unittest.main(verbosity=2)
