"""Resolve supported detector labels against a caller-supplied live catalog.

Call only after the detector's class-specific quality/confidence gate passes.
This module does not infer labels, diagnose faults, or confirm an order.
"""
import json
from pathlib import Path

_MAPPING = json.loads(Path(__file__).with_suffix('.json').read_text(encoding='utf-8'))


def resolve_source_label(label, catalog, *, selected_target_id=None):
    """Return active choices; selection narrows context but never confirms a service.

    catalog must contain fresh categories, targets and services from the backend.
    Missing/inactive entries fail closed; snapshot names/prices are never served.
    """
    result = {'sourceLabel': label, 'status': 'unsupported', 'services': [],
              'targets': [], 'question': None, 'requiresCustomerConfirmation': True,
              'mappingVersion': _MAPPING['schema']}
    rule = next((r for r in _MAPPING['labels'] if r['sourceLabel'] == label), None)
    if rule is None or rule['mode'] == 'unsupported':
        return result
    if not all(isinstance(catalog.get(k), list) for k in ('categories', 'targets', 'services')):
        result['status'] = 'catalog_unavailable'
        return result
    categories = {x['id'] for x in catalog['categories'] if x.get('isActive') is True}
    targets = {x['id']: x for x in catalog['targets']
               if x.get('isActive') is True and x.get('categoryId') in categories
               and x['id'] in rule['targetIds']}
    expected = {x['id']: x for x in rule['services']}
    services = []
    for service in catalog['services']:
        target = targets.get(service.get('targetId'))
        if not target or service.get('isActive') is not True:
            continue
        if service.get('categoryId') != target['categoryId']:
            continue
        if selected_target_id and target['id'] != selected_target_id:
            continue
        if rule['mode'] != 'choose_need':
            original = expected.get(service['id'])
            if not original or any(service.get(k) != original[k] for k in ('slug', 'targetId', 'categoryId')):
                continue
        services.append({k: service.get(k) for k in
                         ('id', 'name', 'slug', 'targetId', 'categoryId', 'basePrice', 'unit')})
    result.update(status=rule['mode'] if services else 'catalog_unavailable',
                  services=services, targets=[{'id': t['id'], 'name': t['name']} for t in targets.values()
                                              if any(s['targetId'] == t['id'] for s in services)],
                  question=rule['question'])
    if selected_target_id and selected_target_id not in targets:
        result.update(status='context_mismatch', services=[], targets=[])
    return result
