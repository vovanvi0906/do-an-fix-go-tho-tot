import unittest
from evaluate_multiservice_trial import measure
class MetricTests(unittest.TestCase):
    def test_one_match_duplicate_and_negative_image_alert(self):
        p={'a':[{'classId':0,'score':.9,'xyxy':[0,0,1,1]},{'classId':0,'score':.8,'xyxy':[0,0,1,1]}],'b':[{'classId':0,'score':.6,'xyxy':[0,0,1,1]}]}
        t={'a':[{'classId':0,'xyxy':[0,0,1,1]}],'b':[]}
        r=measure(p,t,.5,{0:'x'});self.assertEqual((r['TP'],r['FP'],r['FN']),(1,2,0));self.assertEqual(r['negativeImagesWithAlerts'],1)
    def test_wrong_class_cannot_match(self):
        p={'a':[{'classId':1,'score':.9,'xyxy':[0,0,1,1]}]};t={'a':[{'classId':0,'xyxy':[0,0,1,1]}]}
        r=measure(p,t,.5,{0:'x',1:'y'});self.assertEqual((r['TP'],r['FP'],r['FN']),(0,1,1))
    def test_missing_prediction_is_not_silently_ignored(self):
        with self.assertRaises(ValueError):measure({}, {'missing':[]},.5,{0:'x'})
if __name__=='__main__':unittest.main()
