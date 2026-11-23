"""Export existing catalog evidence. Does not import Prisma or access database."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from service_catalog import CLASSES, CLASS_PROMPTS, SUB_SERVICES_CATALOG
from target_catalog import TARGET_PROMPTS


def export(snapshot):
    evidence = json.loads(snapshot.read_text())
    categories, targets, services = {}, {}, {}
    for r in evidence['rows']:
        c, t, s = r['categoryId'], r['targetId'], r['serviceId']
        categories[c] = dict(id=c, slug=r['categorySlug'], name=r['categoryName'], isActive=True)
        targets[t] = dict(id=t, slug=r['targetSlug'], name=r['targetName'], categoryId=c,
                          isActive=True, sortOrder=0)
        services[s] = dict(id=s, slug=r['serviceSlug'], name=r['serviceName'], categoryId=c,
                           targetId=t, basePrice=r.get('basePrice'), maxPrice=r.get('maxPrice'),
                           unit=r.get('unit'), isActive=True)
    target_by_slug = {r['slug']: r for r in targets.values()}
    service_by_slug = {r['slug']: r for r in services.values()}
    crosswalk = {'targets': [], 'services': []}
    for slug, meta in TARGET_PROMPTS.items():
        observed = target_by_slug.get(slug)
        crosswalk['targets'].append({'staticSlug': slug, 'staticCategory': meta['category'],
            'observedHistoricalId': observed['id'] if observed else None,
            'status': 'historical_slug_match_NOT_current_DB_verified' if observed else 'unmatched_static_fallback'})
    for category, rows in SUB_SERVICES_CATALOG.items():
        for row in rows:
            observed = service_by_slug.get(row['slug'])
            crosswalk['services'].append({'staticSlug': row['slug'], 'staticCategory': category,
                'staticTargetSlug': row.get('target_slug'),
                'observedHistoricalId': observed['id'] if observed else None,
                'status': 'historical_slug_match_NOT_current_DB_verified' if observed else 'unmatched_static_fallback'})
    return {'staticCrosswalk': crosswalk, 'evidence': {'source': str(snapshot), 'sha256': hashlib.sha256(snapshot.read_bytes()).hexdigest(),
                         'sourceStatus': evidence.get('status'),
                         'verification': 'historical_API_snapshot_NOT_verified_current_database',
                         'activityAssumption': 'isActive=true reconstructed; not present in flattened snapshot',
                         'missing': ['current DB verification', 'maxPrice if absent', 'symptoms', 'symptomServices']},
            'categories': list(categories.values()), 'targets': list(targets.values()),
            'services': list(services.values()), 'symptoms': [], 'symptomServices': [],
            'staticFallback': {'verification': 'static_slug_NOT_database_ID',
                               'classes': CLASSES, 'classPrompts': CLASS_PROMPTS,
                               'targets': TARGET_PROMPTS, 'services': SUB_SERVICES_CATALOG}}


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--snapshot', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    a = p.parse_args()
    a.out.write_text(json.dumps(export(a.snapshot), ensure_ascii=False, indent=2)+'\n')
