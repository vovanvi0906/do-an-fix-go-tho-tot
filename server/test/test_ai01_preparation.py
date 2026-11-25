"""Small synthetic tests; never touch source data, models, or database."""
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/ai01'))
from prepare_dataset import parse_label, normalize_mapping, Union
from prepared_dataset import PreparedDataset
from train_prepared import validate


class PreparationTests(unittest.TestCase):
    def test_yolo_format_bounds_and_polygon_conversion(self):
        a,e,w=parse_label('0 .5 .5 .4 .2\n',1,100,100)
        self.assertFalse(e);self.assertEqual(a[0]['bbox'],[.5,.5,.4,.2])
        a,e,w=parse_label('0 .1 .1 .9 .1 .9 .9 .1 .9',1,100,100)
        self.assertFalse(e);self.assertAlmostEqual(a[0]['bbox'][2],.8,places=6)
        for text in ['2 .5 .5 .1 .1','0 nan .5 .1 .1','0 .95 .5 .3 .2','0 .5 .5 0 .2','0 .1 .1 .1 .1 .1 .1']:
            self.assertTrue(parse_label(text,1,100,100)[1])
    def test_empty_not_automatically_negative_and_tiny_box_requires_review(self):
        self.assertEqual(parse_label('',1,100,100)[1],['empty_annotation_not_verified_negative'])
        self.assertTrue(parse_label('0 .5 .5 .001 .001',1,100,100)[2])
    def test_mapping_uses_live_active_taxonomy_and_never_approves(self):
        base={'mappingKey':'x/v1/0','dataset':'x','sourceLabel':'water_leak','scopeProposal':'conditional','normalizedObjectProposal':None,'visibleSignProposals':['wet_candidate'],'sourceDiseaseClaim':None,'catalogTargetCandidates':[{'targetId':'t','targetSlug':'pipe'}]}
        catalog={'categories':[{'id':'c','name':'Nước','slug':'water','isActive':True}],'targets':[{'id':'t','slug':'pipe','name':'Ống','categoryId':'c','isActive':True}]}
        e=normalize_mapping({'entries':[base]},catalog)[0]
        self.assertEqual(e['mappingState'],'pending_context');self.assertFalse(e['approvedGroundTruth']);self.assertEqual(e['humanReview'],'pending');self.assertIsNone(e['semantics']['confirmedCause'])
        base['scopeProposal']='in_scope_object';self.assertEqual(normalize_mapping({'entries':[base]},catalog)[0]['mappingState'],'usable_source_candidate')
        catalog['targets'][0]['isActive']=False;self.assertEqual(normalize_mapping({'entries':[base]},catalog)[0]['mappingState'],'pending_context')
    def test_transitive_source_phash_union(self):
        groups=Union(4);groups.join(0,1);groups.join(1,2)
        self.assertEqual(groups.find(0),groups.find(2));self.assertNotEqual(groups.find(0),groups.find(3))
    def test_no_prepared_report_does_not_fabricate_progress(self):
        with tempfile.TemporaryDirectory() as t:
            r=PreparedDataset(Path(t)/'01-raw').overview({})
            self.assertFalse(r['available']);self.assertIsNone(r['progress']);self.assertEqual(r['queueCount'],0)
    def test_validation_never_loads_training_model(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(FileNotFoundError):validate(Path(t)/'prepared',Path(t)/'raw')
        self.assertNotIn('ultralytics',sys.modules)


if __name__=='__main__':unittest.main()
