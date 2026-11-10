"""Exercise the actual endpoint body with deterministic models, without loading weights."""
import ast
import types
import unittest
from pathlib import Path


def endpoint_namespace():
    tree = ast.parse((Path(__file__).resolve().parent.parent / 'main.py').read_text())
    function = next(node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.name == 'diagnose')
    function.decorator_list = []
    function.returns = None
    for arg in function.args.args:
        arg.annotation = None
    function.args.defaults = [ast.Constant(None)] * 3
    module = ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[]))
    scope = {
        'decode_image_to_cv2': lambda _: object(), 'HAS_CLIP': True,
        'is_clip_ready': lambda: True, 'predict_clip_full': lambda _: None,
        'predict_target_from_feat': lambda *_: None,
        'predict_sub_service_from_feat': lambda *_: None,
        'get_services_by_category': lambda *_: [],
        'format_vnd': lambda v: f"{v:,} đ",
        'match_category_by_keywords': lambda *_: None,
        'match_target_by_keywords': lambda *_: None,
        'TARGET_PROMPTS': {},
        'CLIP_MIN_CONF': 0.5, 'CLIP_MIN_MARGIN': 0.1,
        'DiagnoseResponse': lambda **kwargs: {k: v for k, v in kwargs.items() if not (k.startswith('suggestedService') and v is None)},
        'logger': types.SimpleNamespace(warning=lambda *args: None),
    }
    exec(compile(module, 'main.py:diagnose', 'exec'), scope)
    return scope


class DiagnosisContractTests(unittest.IsolatedAsyncioTestCase):
    async def call(self, scope, url='https://example.test/sua_dien.jpg', model=None):
        async def body():
            return {'imageUrl': url, 'description': 'sửa điện'}
        request = types.SimpleNamespace(json=body, app=types.SimpleNamespace(
            state=types.SimpleNamespace(yolo_cls_model=model)))
        return await scope['diagnose'](request)

    async def test_unreadable_image_has_no_confidence_or_fake_diagnosis(self):
        scope = endpoint_namespace()
        scope['decode_image_to_cv2'] = lambda _: None
        result = await self.call(scope)
        self.assertEqual(result['engine'], 'unavailable')
        self.assertIsNone(result['confidence'])
        self.assertNotIn('suggestedCategoryId', result)

    async def test_filename_and_description_do_not_replace_missing_models(self):
        result = await self.call(endpoint_namespace())
        self.assertEqual(result['engine'], 'unavailable')
        self.assertNotIn('suggestedServiceId', result)

    async def test_clip_classifies_group_without_claiming_specific_damage(self):
        scope = endpoint_namespace()
        scope['predict_clip_full'] = lambda _: {'category_probs': {'dien_lanh': 0.9, 'sua_dien': 0.1}}
        result = await self.call(scope)
        self.assertEqual(result['suggestedCategoryId'], 'dien-lanh')
        self.assertEqual(result['detectedLabels'], ['dien_lanh'])
        self.assertNotIn('suggestedServiceId', result)

    async def test_ambiguous_and_out_of_scope_images_abstain(self):
        for scores in [{'dien_lanh': 0.51, 'sua_dien': 0.49}, {'other_unclear': 0.99, 'sua_dien': 0.01}]:
            scope = endpoint_namespace()
            scope['predict_clip_full'] = lambda _, scores=scores: {'category_probs': scores}
            result = await self.call(scope)
            self.assertIsNone(result['suggestedCategoryId'])

    async def test_ensemble_scores_determine_category(self):
        scope = endpoint_namespace()
        scope['predict_clip_full'] = lambda _: {'category_probs': {'dien_lanh': 0.9, 'sua_dien': 0.1}}
        prediction = types.SimpleNamespace(names={0: 'dien_lanh', 1: 'sua_dien'},
            probs=types.SimpleNamespace(data=types.SimpleNamespace(tolist=lambda: [0.8, 0.2])))
        model = types.SimpleNamespace(predict=lambda **_: [prediction])
        result = await self.call(scope, model=model)
        self.assertEqual(result['decision_source'], 'ensemble')
        self.assertAlmostEqual(result['confidence'], 0.85, delta=0.03)
        self.assertEqual(result['suggestedCategoryId'], 'dien-lanh')


if __name__ == '__main__':
    unittest.main()
