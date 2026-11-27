import unittest
from evaluate_observer_challenge import score,should_promote
from package_multiservice_observer import conservative_point
from package_tested_observer import operational_signature

class QualityTests(unittest.TestCase):
    def test_zero_detection_and_zero_positive_scope_is_counted_without_crash(self):
        cases=[{'caseId':'negative','suite':'clean','scopes':['crack'],'annotations':[]}]
        result=score(cases,{'negative':{'proposals':[]}},['crack'],'clean')
        self.assertEqual(result['perClass']['crack']['TP'],0);self.assertEqual(result['perClass']['crack']['negativeImages'],1);self.assertFalse(result['perClass']['crack']['recallDefined'])
    def test_unreviewed_classes_are_not_implicit_negatives(self):
        rows=[{'caseId':'a','suite':'clean','scopes':['crack'],'annotations':[{'code':'crack','xyxy':[0,0,1,1]}]}]
        pred={'a':{'proposals':[{'code':'peeling_surface','confidence':.9,'xyxy':[0,0,1,1]}]}}
        result=score(rows,pred,['crack','peeling_surface'])
        self.assertEqual(result['perClass']['crack']['FN'],1);self.assertEqual(result['perClass']['peeling_surface']['scoredImages'],0);self.assertEqual(result['perClass']['peeling_surface']['FP'],0)
    def test_fewer_false_positives_does_not_promote_a_candidate_with_worse_precision_weighted_score(self):
        old={'precision':.67,'F0_5':.68,'negativeScopeImagesWithAlerts':1,'FP':26}
        new={'precision':.69,'F0_5':.66,'negativeScopeImagesWithAlerts':1,'FP':20}
        self.assertFalse(should_promote(old,new));new['F0_5']=.70;self.assertTrue(should_promote(old,new))
    def test_calibration_rejects_tiny_or_weak_support(self):
        point={'precision':1.,'recall':.5,'TP':1,'F1':.66,'threshold':.5}
        self.assertFalse(conservative_point([point])[1]);point['TP']=2;self.assertTrue(conservative_point([point])[1])
    def test_metadata_update_cannot_change_operational_policy(self):
        old={'models':[{'weights':'same'}],'classes':{'crack':{'enabled':True}},'coverage':[],'quality':{}}
        new={**old,'modelVersion':'tested','quality':{'evaluation':{}}}
        self.assertEqual(operational_signature(old),operational_signature(new));new['classes']={'crack':{'enabled':False}};self.assertNotEqual(operational_signature(old),operational_signature(new))

if __name__=='__main__':unittest.main()
