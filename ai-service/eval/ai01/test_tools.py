"""Analytic unit tests only; their constructed records are NOT model evidence."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
sys.path.insert(0, str(Path(__file__).parent))
from metrics import classification, summarize, percentile
from annotation import Sample
from split import propose
from runner import ROOT


class ToolsTests(unittest.TestCase):
    def test_f1_abstention_and_percentile(self):
        result = classification([('a','a'), ('a', None), ('b','a')])
        self.assertAlmostEqual(result['macroF1'], .25)
        self.assertEqual(result['top1'], 1/3)
        self.assertEqual(percentile([10,20], .95), 19.5)
        self.assertIsNone(percentile([], .5))

    def test_error_is_not_abstention_and_false_emission(self):
        rows = [dict(modality='image-only', scorable=True, groundTruth={
            'category':'a', 'target':None, 'recommendedService':[], 'unknown':True,
            'needsInspection':True}, error={'type':'error'})]
        catalog = {'categories':[], 'targets':[], 'services':[]}
        out = summarize(rows, catalog)['image-only']
        self.assertEqual(out['errorRate'], 1)
        self.assertEqual(out['categoryAbstentionRate'], 0)
        self.assertEqual(out['category']['top1'], 0)
        rows[0].update(error=None, resolver={'suggestedServices':[{'id':'bad'}]})
        out = summarize(rows, catalog)['image-only']
        self.assertEqual(out['resolverService']['falseRecommendationPerEmission'], 1)

    def test_manifest_rejects_cross_split_hash_leakage(self):
        import tempfile
        from runner import read_dataset
        raw = json.loads((ROOT/'docs/ai01-evaluation/artifacts/smoke-manifest.jsonl').read_text().splitlines()[0])
        a = dict(raw, id='train-case', split='train')
        b = dict(raw, id='test-case', split='test')
        for row in (a,b):
            row['provenance'] = dict(raw['provenance'], deviceId='same', sessionId='same', duplicateGroup='same')
        with tempfile.TemporaryDirectory() as directory:
            manifest = Path(directory)/'manifest.jsonl'
            manifest.write_text(json.dumps(a)+'\n'+json.dumps(b)+'\n')
            with self.assertRaisesRegex(ValueError, 'group crosses splits'):
                read_dataset(manifest, ROOT/'ai-service', True)

    def test_schema_rejects_fixture_prediction_fields(self):
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            Sample.model_validate({'predicted_cat':'x', 'simulated_latency_ms':1})

    def test_real_resolver_unavailable_and_category_gate(self):
        # Only tests resolver contracts with constructed input; no model accuracy assertion.
        from runner import Resolver
        adapter = Resolver(ROOT/'docs/ai01-evaluation/artifacts/taxonomy.json')
        try:
            image = ROOT/'ai-service/eval/images/sample_appliance.jpg'
            r = adapter.call({'engine':'unavailable'}, image, '', .6)['result']
            self.assertEqual(r['status'], 'unavailable')
            r = adapter.call({'engine':'model', 'confidence':.59,
                             'suggestedCategoryId':'thiet-bi'}, image, '', .6)['result']
            self.assertIsNone(r['suggestedCategoryId'])
            r = adapter.call({'engine':'model', 'confidence':.8,
                             'suggestedCategoryId':'thiet-bi'}, image, '', .6)['result']
            self.assertIsNotNone(r['suggestedCategoryId'])
            self.assertFalse(r.get('suggestedServiceId'))
        finally:
            adapter.close()

    def test_split_keeps_transitive_device_and_session_groups(self):
        # Reuse unlabelled smoke metadata, no artificial image generation.
        raw = json.loads((ROOT/'docs/ai01-evaluation/artifacts/smoke-manifest.jsonl').read_text().splitlines()[0])
        samples = []
        for i in range(3):
            r = json.loads(json.dumps(raw))
            r['id'] = str(i)
            r['sha256'] = str(i)*64
            r['provenance'].update(deviceId='d1' if i<2 else 'd2',
                sessionId='s1' if i==0 else 's2', duplicateGroup='dup'+str(i))
            samples.append(Sample.model_validate(r))
        self.assertEqual(len({s.split for s in propose(samples, 'seed')}), 1)
        samples[0].provenance.duplicateGroup = None
        self.assertEqual({s.split for s in propose(samples, 'seed')}, {'quarantine'})


if __name__ == '__main__':
    unittest.main()
