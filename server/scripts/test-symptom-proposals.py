import csv, json, re, sys
from pathlib import Path
base = Path(__file__).resolve().parents[2] / 'docs/ai-recommendation/data'
symptoms = list(csv.DictReader((base/'symptoms.csv').open()))
mappings = list(csv.DictReader((base/'symptom-service-mappings.csv').open()))
assert symptoms and len({s['symptom_id'] for s in symptoms}) == len(symptoms)
assert len({(s['target_id'],s['code']) for s in symptoms}) == len(symptoms)
by_id = {s['symptom_id']:s for s in symptoms}
assert {m['symptom_id'] for m in mappings} == set(by_id)
for s in symptoms:
    assert s['review_status'] == 'NEEDS_REVIEW' and s['is_active'] == 'false'
    assert re.fullmatch('[a-z][a-z0-9_]{1,79}',s['code'])
    assert isinstance(json.loads(s['aliases']),list)
    assert s['kind'] in ['USER_REPORTED','VISUAL_OBSERVABLE','REQUIRES_TECHNICIAN_CHECK']
for m in mappings:
    assert m['target_id'] == by_id[m['symptom_id']]['target_id']
    assert m['review_status'] == 'NEEDS_REVIEW' and m['is_active'] == 'false'
if len(sys.argv)>1:
    source=json.loads(Path(sys.argv[1]).read_text()); services={s['id']:s for s in source['services']}
    assert {s['target_id'] for s in symptoms} == {t['id'] for t in source['targets']}
    for m in mappings:
        s=services[m['service_id']]
        assert s['targetId']==m['target_id'] and s['categoryId']==by_id[m['symptom_id']]['category_id']
print(f'PASS: {len(symptoms)} review-only symptoms and {len(mappings)} catalog-ID mappings; no import.')
