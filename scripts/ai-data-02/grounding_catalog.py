"""Catalog-aware OBSERVABLE search scopes, not a fault diagnosis/service approval taxonomy."""
import json
from pathlib import Path
from core import atomic,digest,canonical

PROMPTS=Path(__file__).with_name('observable-prompts.json')


def make_scope(store,base_manifest,*,target_id=None,category_id=None):
    base_manifest=Path(base_manifest)
    if not base_manifest.is_file():raise ValueError('Grounding DINO chưa được cài. Chạy grounding_setup.py --download.')
    base=json.loads(base_manifest.read_text())
    config=json.loads(PROMPTS.read_text())
    categories={c['id']:c for c in store.catalog['categories']}
    if target_id and target_id not in store.targets:raise ValueError('Thiết bị không có trong catalog')
    if category_id and category_id not in categories:raise ValueError('Danh mục không có trong catalog')
    if target_id:category_id=None
    targets=[t for t in store.catalog['targets'] if t.get('isActive',True) and (not target_id or t['id']==target_id) and (not category_id or t['categoryId']==category_id)]
    if not targets:raise ValueError('Không có thiết bị phù hợp bộ lọc')
    if target_id and targets[0]['slug'] in config['nonVisualTargets']:
        raise ValueError(config['nonVisualTargets'][targets[0]['slug']])
    objects=[];sign_targets={};unsupported=[];broad=[]
    for target in targets:
        slug=target['slug'];phrases=config['objects'].get(slug)
        if not phrases:unsupported.append(target['id']);continue
        objects.append({'kind':'object','name':'object:'+slug,'targetId':target['id'],'prompts':phrases})
        if slug in config['broadSceneTargets']:broad.append(target['id'])
        category=categories[target['categoryId']]['slug']
        for sign in config['categorySigns'].get(category,[]):
            if sign in store.signs:sign_targets.setdefault(sign,[]).append(target['id'])
    if not objects or not sign_targets:raise ValueError('Chưa có phạm vi đối tượng/dấu hiệu quan sát phù hợp; cần thiết bị cụ thể')
    classes=objects+[{'kind':'sign','name':'sign:'+sign,'code':sign,'targetIds':ids,'prompts':config['signPrompts'][sign]} for sign,ids in sorted(sign_targets.items())]
    manifest={**base,'classes':classes,'scopeMode':'catalog-adaptive','explicitTarget':bool(target_id),'categoryId':category_id,
              'maxUnscopedObjects':8,'broadSceneTargetIds':broad,'unsupportedTargetIds':unsupported,
              'promptCatalogSha256':digest(PROMPTS.read_bytes()),'scopeBuilderSha256':digest(Path(__file__).read_bytes()),
              'warning':'Open-vocabulary observable-sign proposals; no approved fault or service diagnosis.',
              'scopeApproval':'Search hints only; no approved fault/service diagnosis rules.'}
    # Stable immutable per-scope config: changing catalog/prompts changes cache identity.
    from batch import DEFAULT_DETECTOR,file_hash
    if DEFAULT_DETECTOR.is_file():
        manifest['objectDetector']={'path':str(DEFAULT_DETECTOR.resolve()),'sha256':file_hash(DEFAULT_DETECTOR),'confidence':.25}
    data=canonical(manifest);key=digest(data.encode());folder=store.state/'grounding-scopes'
    if folder.is_symlink():raise ValueError('Unsafe grounding scope root')
    folder.mkdir(exist_ok=True)
    path=folder/(key+'.json')
    if path.is_symlink():raise ValueError('Unsafe grounding scope path')
    if path.exists():
        if path.read_text().strip()!=data:raise ValueError('Grounding scope changed outside writer')
    else:atomic(path,manifest)
    return path


def image_scope(config,row):
    objects=[c for c in config['classes'] if c['kind']=='object']
    if config.get('scopeMode')!='catalog-adaptive':return objects,[]
    if config.get('explicitTarget'):return objects,[]
    hints=json.loads(row.get('candidate_target_ids_json') or '[]')
    matches=[c for c in objects if c['targetId'] in hints]
    if matches and len(matches)<=config.get('maxUnscopedObjects',8):return matches,['TARGET_SCOPE_USES_UNVERIFIED_SOURCE_HINT']
    if len(matches)>config.get('maxUnscopedObjects',8):return [],['TARGET_SCOPE_REQUIRED']
    if len(objects)>config.get('maxUnscopedObjects',8):return [],['TARGET_SCOPE_REQUIRED']
    return objects,[]
