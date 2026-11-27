import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from recommendation.source_label_mapping import _MAPPING, resolve_source_label


class SourceMappingTests(unittest.TestCase):
    def setUp(self):
        self.catalog = {'categories': [], 'targets': [], 'services': []}
        for rule in _MAPPING['labels']:
            for s in rule['services']:
                self.catalog['services'].append(dict(s, isActive=True, basePrice='150000', unit='điểm'))
                self.catalog['targets'].append(dict(id=s['targetId'], name='Live target', categoryId=s['categoryId'], isActive=True))
                self.catalog['categories'].append(dict(id=s['categoryId'], isActive=True))

    def test_all_twelve_and_unsupported(self):
        self.assertEqual(len(_MAPPING['labels']), 12)
        for label in ('Bathtub', 'Opossum', 'Scorpion', 'Spider', 'Termites', 'unknown'):
            self.assertEqual(resolve_source_label(label, self.catalog)['status'], 'unsupported')

    def test_direct_suggestion_is_not_order_confirmation(self):
        result = resolve_source_label('Clogged Toilet', self.catalog)
        self.assertEqual(result['status'], 'suggest')
        self.assertEqual([s['slug'] for s in result['services']], ['thong-tac-bon-cau'])
        self.assertTrue(result['requiresCustomerConfirmation'])

    def test_context_and_need_remain_required(self):
        for label in ('Clogged Drain', 'Dirty Air Filter', 'Improper wiring for water heater', 'Improper wiring on panel box'):
            self.assertEqual(resolve_source_label(label, self.catalog)['status'], 'confirm_context')
        self.assertEqual(resolve_source_label('Water Heater Thermostat', self.catalog)['status'], 'confirm_need')
        self.assertEqual(resolve_source_label('Clogged Drain', self.catalog, selected_target_id='wrong')['status'], 'context_mismatch')

    def test_disabled_or_reassigned_catalog_entries_are_removed(self):
        for kind in ('services', 'targets', 'categories'):
            catalog = copy.deepcopy(self.catalog)
            for row in catalog[kind]:
                row['isActive'] = False
            self.assertEqual(resolve_source_label('Clogged Toilet', catalog)['services'], [])
        catalog = copy.deepcopy(self.catalog)
        for row in catalog['services']:
            row['targetId'] = 'other'
        self.assertEqual(resolve_source_label('Clogged Toilet', catalog)['services'], [])
        self.assertEqual(resolve_source_label('Clogged Toilet', {})['status'], 'catalog_unavailable')

    def test_live_names_and_prices(self):
        for row in self.catalog['services']:
            row.update(name='Updated name', basePrice='999')
        service = resolve_source_label('Clogged Toilet', self.catalog)['services'][0]
        self.assertEqual((service['name'], service['basePrice']), ('Updated name', '999'))

    def test_laundry_browses_only_confirmed_target(self):
        rule = next(r for r in _MAPPING['labels'] if r['sourceLabel'] == 'Laundry Units')
        for index, target_id in enumerate(rule['targetIds']):
            self.catalog['targets'].append(dict(id=target_id, name='Laundry', categoryId='laundry', isActive=True))
            self.catalog['services'].append(dict(id=f'laundry-{index}', slug='service', targetId=target_id, categoryId='laundry', isActive=True))
        self.catalog['categories'].append(dict(id='laundry', isActive=True))
        result = resolve_source_label('Laundry Units', self.catalog, selected_target_id=rule['targetIds'][0])
        self.assertEqual(result['status'], 'choose_need')
        self.assertEqual(len(result['services']), 1)
        self.assertEqual(result['services'][0]['targetId'], rule['targetIds'][0])


if __name__ == '__main__':
    unittest.main()
