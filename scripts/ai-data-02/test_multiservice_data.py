import unittest
from multiservice_data import parse_annotation
class GeometryTests(unittest.TestCase):
    def test_yolo_box(self):
        a=parse_annotation('0 0.5 0.5 0.2 0.4',['stain'])
        self.assertEqual(a['geometry'],'bbox');self.assertAlmostEqual(a['xyxy'][0],.4);self.assertAlmostEqual(a['xyxy'][3],.7)
    def test_polygon_keeps_enclosing_extent(self):
        a=parse_annotation('0 0.1 0.2 0.8 0.3 0.6 0.9',['stain'])
        self.assertEqual(a['geometry'],'polygon_enclosing_bbox');self.assertEqual(a['xyxy'],[.1,.2,.8,.9])
    def test_rejects_invalid_class_nonfinite_and_bounds(self):
        for row in ['1 0.5 0.5 0.2 0.2','0 nan 0.5 0.2 0.2','0 0 0 .5 .5','0 0.1 0.1 1.2 0.5 0.5 0.9','0 .5 .5 -1 1','0 0.1 0.2 0.3']:
            with self.subTest(row=row),self.assertRaises((ValueError,IndexError)):parse_annotation(row,['x'])
if __name__=='__main__':unittest.main()
