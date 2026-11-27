import json,unittest
from pathlib import Path
from types import SimpleNamespace
from evaluate_crack_specialist import infer,eligible_for_reserved_test
from multiservice_data import BASE

class Values:
    def __init__(self,values):self.values=values
    def tolist(self):return self.values

class FakeDetector:
    names={0:'sign:surface_soiling',1:'sign:crack'}
    def predict(self,**kwargs):
        boxes=SimpleNamespace(cls=Values([0,1]),conf=Values([.9,.8]),xyxyn=Values([[0,0,1,1],[.1,.2,.4,.8]]))
        return [SimpleNamespace(path='wall.jpg',boxes=boxes,speed={'inference':10.})]

class SpecialistTests(unittest.TestCase):
    def test_incomplete_candidate_does_not_consume_reserved_test(self):
        baseline={'F1':.5,'recall':.5}
        candidate={'F1':.75,'precision':.75,'recall':.8,'negativeImagesWithAlerts':0}
        self.assertFalse(eligible_for_reserved_test(candidate,baseline))
        candidate.update(precision=.85,F1=.82)
        self.assertTrue(eligible_for_reserved_test(candidate,baseline))
        candidate['negativeImagesWithAlerts']=1
        self.assertFalse(eligible_for_reserved_test(candidate,baseline))
    def test_multiclass_baseline_keeps_only_crack_and_remaps_id(self):
        pred,_=infer(FakeDetector(),Path('/unused'),320)
        self.assertEqual(pred,{'wall':[{'classId':0,'score':.8,'xyxy':[.1,.2,.4,.8]}]})
    def test_exported_negatives_have_explicit_scope_review(self):
        from build_reviewed_scope_packs import latest_events,REVIEW
        latest,_=latest_events(REVIEW/'visual-review-events.jsonl')
        rows=json.loads((BASE/'02-curated/fixgo-crack-reviewed-v5/manifest.json').read_text())['records']
        for row in rows:
            if not row['boxes']:
                self.assertIn('crack',latest[row['reviewId']]['decision']['negativeScopes'])
                self.assertEqual(Path(row['label']).read_text(),'')
        splits={}
        for row in rows:
            for key in [row['groupId'],row['sourceSha256']]:
                self.assertEqual(splits.setdefault(key,row['split']),row['split'])
        self.assertFalse(any(row['split']=='test' for row in rows))

if __name__=='__main__':unittest.main()
