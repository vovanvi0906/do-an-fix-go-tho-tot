"""Match the Studio library filters across the entire inventory, never just one page."""
from core import array


def filtered_ids(store, query):
    allowed = {'category','target','source','status','label','q','group','pilot','duplicate','page'}
    if not isinstance(query, dict) or set(query)-allowed or any(not isinstance(v, (str, int)) for v in query.values()):
        raise ValueError('Unknown/invalid Studio filter')
    result = []
    for i, row in store.rows.items():
        if str(query.get('pilot'))=='1' and i not in store.pilot: continue
        if query.get('source') and row['corpus']!=query['source']: continue
        if query.get('group') and query['group'] not in row['proposed_source_component']: continue
        if query.get('q') and query['q'].casefold() not in (i+' '+row['path']).casefold(): continue
        if str(query.get('duplicate'))=='1' and not (row.get('sha_group_id') or row.get('phash_component_id')): continue
        if query.get('status') and store.status(i)!=query['status']: continue
        if query.get('category') or query.get('target') or query.get('label'):
            human = store.studio_latest.get(i) or {}
            ai = store.ai(i) or {}
            targets = set(human.get('targetIds', [])) | set(array(row.get('candidate_target_ids_json'))) | {t['targetId'] for t in ai.get('prediction',{}).get('targetCandidates',[])}
            if query.get('target') and query['target'] not in targets: continue
            if query.get('category') and not any(store.targets.get(t,{}).get('categoryId')==query['category'] for t in targets): continue
            signs = set(human.get('defectLabels',[])) | set(array(row.get('sign_candidates_json')))
            if query.get('label') and query['label'] not in signs: continue
        result.append(i)
    return result
