"""Read-only raw audit + source-supervised development export. Never trains a model."""
import argparse
import csv
import gzip
import hashlib
import json
import math
import re
import shutil
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import cv2
import numpy as np
import yaml

EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
DIRECT_SIGNS = {'Birdpoop': ('bird_droppings', 'Vết giống phân chim'), 'Dirt': ('surface_soiling', 'Bụi / bẩn bám'), 'Leaf': ('leaf_debris', 'Lá / rác lá')}
MIN_TRAIN, MIN_VAL, MIN_GROUPS = 20, 5, 3


def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_file(p): return sha_bytes(p.read_bytes())
def canonical(v): return json.dumps(v, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
def save(p, value): p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


class Union:
    def __init__(self, n): self.parents = list(range(n))
    def find(self, a):
        while self.parents[a] != a:
            self.parents[a] = self.parents[self.parents[a]]; a = self.parents[a]
        return a
    def join(self, a, b):
        a, b = self.find(a), self.find(b)
        if a != b: self.parents[max(a, b)] = min(a, b)


def parse_label(text, class_count, width, height):
    annotations, errors, warnings = [], [], []
    for line_no, line in enumerate(text.splitlines(), 1):
        if not line.strip(): continue
        try:
            values = list(map(float, line.split()))
            if not values or not all(math.isfinite(v) for v in values): raise ValueError('non_finite')
            cid = int(values[0]); v = values[1:]
            if values[0] != cid or not 0 <= cid < class_count: raise ValueError('invalid_class')
            if any(x < 0 or x > 1 for x in v): raise ValueError('coordinate_out_of_range')
            if len(v) == 4:
                x, y, w, h = v
                if w <= 0 or h <= 0: raise ValueError('zero_area')
                if x-w/2 < -1e-5 or y-h/2 < -1e-5 or x+w/2 > 1+1e-5 or y+h/2 > 1+1e-5:
                    raise ValueError('bbox_outside_image')
                fmt, box = 'bbox', v
            elif len(v) >= 6 and len(v) % 2 == 0:
                pts = np.array(v, dtype=np.float32).reshape(-1, 2)
                if cv2.contourArea(pts) <= 1e-8: raise ValueError('zero_area_polygon')
                lo, hi = pts.min(axis=0), pts.max(axis=0)
                box = [float((lo[0]+hi[0])/2), float((lo[1]+hi[1])/2), float(hi[0]-lo[0]), float(hi[1]-lo[1])]
                fmt = 'polygon'
            else: raise ValueError('invalid_yolo_shape')
            if box[2]*width < 2 or box[3]*height < 2 or box[2]*box[3]*width*height < 4:
                warnings.append(f'tiny_box:{line_no}')
            if box[2]*box[3] > .98: warnings.append(f'almost_full_frame_box:{line_no}')
            annotations.append({'classId': cid, 'format': fmt, 'coordinates': v, 'bbox': box})
        except (ValueError, OverflowError) as error:
            errors.append(f'{line_no}:{error}')
    if not annotations and not errors: errors.append('empty_annotation_not_verified_negative')
    return annotations, errors, warnings


def visual_candidates(image, name):
    # Conservative, explainable layout heuristics. They do not certify an advert
    # or its absence. No OCR/model inference or ground truth is manufactured.
    h, w = image.shape[:2]; small = cv2.resize(image, (max(1, int(w*min(1, 320/max(h,w)))), max(1, int(h*min(1, 320/max(h,w))))))
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY); hh, ww = gray.shape
    binary = (gray < 150).astype(np.uint8)
    _, _, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    text_like = sum(2 <= x[2] <= 28 and 5 <= x[3] <= 25 and 5 <= x[4] <= 350 and .12 <= x[2]/x[3] <= 3 for x in stats[1:])
    white = float(np.mean(gray > 235)); edges = cv2.Canny(gray, 80, 180)
    columns = np.flatnonzero((edges > 0).sum(axis=0) > hh*.72)
    rows = np.flatnonzero((edges > 0).sum(axis=1) > ww*.72)
    def runs(v, limit):
        v = [int(i) for i in v if limit*.1 < i < limit*.9]
        return sum(i == 0 or x-v[i-1] > 4 for i, x in enumerate(v))
    result = []
    if re.search(r'advert|banner|poster|sale|catalog|amazon|shutterstock|price', name, re.I): result.append('advertisement_filename_candidate')
    if white > .35 and text_like >= 30: result.append('advertisement_layout_candidate')
    if runs(columns, ww) >= 2 or runs(rows, hh) >= 2: result.append('composite_layout_candidate')
    return result, {'whiteFraction': round(white, 3), 'textLikeComponents': int(text_like), 'method': 'layout/filename heuristic, unverified, no OCR'}


def normalize_mapping(mapping, catalog):
    cats = {c['id']: c for c in catalog['categories'] if c['isActive']}
    targets = {t['id']: t for t in catalog['targets'] if t['isActive'] and t['categoryId'] in cats}
    result = []
    for original in mapping['entries']:
        e = dict(original); candidates, missing = [], []
        for c in e['catalogTargetCandidates']:
            t = targets.get(c['targetId'])
            if not t or t['slug'] != c['targetSlug']: missing.append(c['targetId']); continue
            cat = cats[t['categoryId']]
            candidates.append(dict(targetId=t['id'], targetSlug=t['slug'], targetName=t['name'], categoryId=cat['id'], categoryName=cat['name'], categorySlug=cat['slug']))
        state = 'pending_context'
        if e['scopeProposal'] == 'out_of_scope_current_target' and not candidates: state = 'out_of_scope'
        elif e['scopeProposal'] == 'in_scope_object' and len(candidates) == 1 and not missing: state = 'usable_source_candidate'
        sign = DIRECT_SIGNS.get(e['sourceLabel']) if e['dataset'] == 'giupviec' else None
        category_ids = {c['categoryId'] for c in candidates}
        # Plant closeups can support category-only weak supervision, never a
        # particular plant-scale target or a diagnosis without context review.
        category = next(iter(category_ids)) if len(category_ids) == 1 and (state == 'usable_source_candidate' or e['normalizedObjectProposal'] == 'plant_leaf') else None
        e.update(mappingState=state, humanReview='pending', approvedGroundTruth=False, catalogTargetCandidates=candidates,
                 staleCatalogIds=missing, sourceClaim=e.get('sourceDiseaseClaim'), normalizedSignCandidate=sign[0] if sign else None,
                 signNameVi=sign[1] if sign else None, categoryCandidateId=category,
                 semantics={'object': e['normalizedObjectProposal'], 'visibleSignCandidates': e['visibleSignProposals'],
                            'sourceFaultOrDiseaseClaim': e.get('sourceDiseaseClaim') or (e['sourceLabel'] if e['dataset'] == 'suanuoc' and e['sourceLabel'] != 'faucet' else None),
                            'confirmedCause': None, 'recommendedServices': None})
        result.append(e)
    return result


def scan_one(args):
    p, raw, metadata, old = args
    rel = str(p.relative_to(raw)); ds = p.relative_to(raw).parts[0]; meta = metadata[ds]
    payload = p.read_bytes(); image = cv2.imdecode(np.frombuffer(payload, np.uint8), cv2.IMREAD_COLOR)
    label = p.parent.parent/'labels'/(p.stem+'.txt')
    row = dict(id=old['id'] if old else 'new-'+sha_bytes(rel.encode())[:12], path=rel, dataset=ds, sourceSplit=p.relative_to(raw).parts[1],
               sha256=sha_bytes(payload), annotationPath=str(label.relative_to(raw)), annotationSha256=sha_file(label) if label.exists() else None,
               yamlSha256=meta['yamlSha256'], errors=[], geometryWarnings=[], annotations=[], sourceClassIds=[],
               source=meta['roboflow'], sourceVerification='unverified', humanReview='pending', approvedGroundTruth=False, independentlyReviewed=False,
               aiExposed=True, datasetType='source-supervised-development', splitPurpose='development_only', confirmedCause=None)
    if image is None: row['errors'].append('decode_error')
    else:
        h,w=image.shape[:2];gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
        low=cv2.dct(cv2.resize(gray,(32,32)).astype(np.float32))[:8,:8].flatten();bits=low[1:]>np.median(low[1:])
        row.update(width=w,height=h,pixelSha256=sha_bytes(image.tobytes()+str(image.shape).encode()),phash=f'{sum(int(b)<<i for i,b in enumerate(bits)):016x}')
        if not label.exists(): row['errors'].append('missing_annotation')
        else:
            try: row['annotations'],row['errors'],row['geometryWarnings']=parse_label(label.read_text(),len(meta['names']),w,h)
            except (UnicodeError,OSError): row['errors'].append('unreadable_annotation')
        row['visualCandidates'],row['visualEvidence']=visual_candidates(image,p.name)
    row.setdefault('visualCandidates',[])
    row['sourceClassIds']=sorted({a['classId'] for a in row['annotations']})
    base=re.split(r'\.rf\.[0-9a-f]+',p.stem,flags=re.I)[0]
    row['sourceFamilyCandidate']=f'{ds}:{base}'
    row['sourceFamilyEvidence']='Roboflow project + filename before .rf suffix; conservative candidate, not verified device/session'
    row['snapshotMatchesTask03B']=bool(old and row['sha256']==old['sha256'] and row['annotationSha256']==old.get('annotationSha256'))
    return row


def prepare(raw, source, out, workers=4):
    raw, source, out = raw.resolve(), source.resolve(), out.resolve()
    if out == raw or out.is_relative_to(raw) or raw.is_relative_to(out): raise ValueError('Export must be separate from raw')
    if (out/'summary.json').exists() or (out/'records.jsonl').exists(): raise ValueError('Do not overwrite an existing preparation run')
    out.mkdir(parents=True, exist_ok=True)
    catalog=json.loads((out/'catalog-db.json').read_text())
    if not catalog.get('identity') or catalog['identity'][0]['read_only'] != 'on': raise ValueError('Verified read-only DB snapshot required')
    pins=json.loads((source/'SHA256SUMS.json').read_text())
    for name in ['dataset-mapping-proposal.json','images.jsonl']:
        if sha_file(source/name)!=pins[name]: raise ValueError('TASK03B checksum mismatch: '+name)
    mapping=json.loads((source/'dataset-mapping-proposal.json').read_text()); normalized=normalize_mapping(mapping,catalog)
    by_class={(e['dataset'],e['classId']):e for e in normalized}
    metadata={}
    for d in mapping['datasets']:
        file=raw/d['dataset']/'data.yaml'; y=yaml.safe_load(file.read_text()); digest=sha_file(file)
        if digest!=d['yamlSha256']: raise ValueError('YAML changed since TASK03B: '+d['dataset'])
        metadata[d['dataset']]=dict(y,yamlSha256=digest)
    old={r['path']:r for r in map(json.loads,(source/'images.jsonl').read_text().splitlines()) if not r['reference']}
    files=sorted(p for p in raw.rglob('*') if p.suffix.lower() in EXTENSIONS)
    if any(not p.resolve().is_relative_to(raw) for p in files): raise ValueError('Image symlink outside raw')
    def progress(phase, done, **extra):
        save(out/'progress.json',dict(phase=phase,processed=done,total=len(files),**extra));print(phase,done,'/',len(files),flush=True)
    progress('scanning',0);cv2.setNumThreads(1)
    records=[]
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for i,r in enumerate(pool.map(scan_one,((p,raw,metadata,old.get(str(p.relative_to(raw)))) for p in files))):
            records.append(r)
            if (i+1)%1000==0: progress('scanning',i+1)
    progress('grouping',len(records))
    n=len(records); groups=Union(n);sha_groups=defaultdict(list);pixel_groups=defaultdict(list);families=defaultdict(list)
    for i,r in enumerate(records):
        sha_groups[r['sha256']].append(i)
        if r.get('pixelSha256'):pixel_groups[r['pixelSha256']].append(i)
        families[r['sourceFamilyCandidate']].append(i)
    for lookup in [sha_groups,pixel_groups,families]:
        for members in lookup.values():
            for j in members[1:]:groups.join(members[0],j)
    conflicts=set(); redundant=set()
    for members in pixel_groups.values():
        if len(members)<2: continue
        signatures={canonical(sorted((a['classId'],a['format'],a['coordinates']) for a in records[j]['annotations'])) for j in members}
        if len(signatures)>1: conflicts.update(members)
        else: redundant.update(members[1:])
    phashes=np.array([int(r.get('phash','0'),16) for r in records],dtype=np.uint64)
    lut=np.array([int(i).bit_count() for i in range(256)],dtype=np.uint8)
    near_images=set();near_pairs=0
    with gzip.open(out/'near-pairs.csv.gz','wt') as f:
        f.write('a_id,b_id,hamming_distance\n')
        for i,r in enumerate(records):
            if not r.get('phash'):continue
            xor=np.bitwise_xor(phashes[i+1:],phashes[i]);dist=lut[xor.view(np.uint8).reshape(-1,8)].sum(axis=1)
            for j in (np.flatnonzero(dist<=6)+i+1).tolist():
                b=records[j]
                if not b.get('phash') or r['sha256']==b['sha256']:continue
                groups.join(i,j);near_images.update([i,j]);near_pairs+=1;f.write(f"{r['id']},{b['id']},{int(dist[j-i-1])}\n")
            if i%4000==0:progress('phash_pairs',i,nearPairs=near_pairs)
    task_names=['object_detection','visible_sign_detection','category_classification'];classes={t:{} for t in task_names}
    for e in normalized:
        if e['mappingState']=='usable_source_candidate':
            c=e['catalogTargetCandidates'][0];classes['object_detection'][c['targetId']]={'key':c['targetId'],'slug':c['targetSlug'],'name':c['targetName'],'categoryId':c['categoryId']}
        if e['normalizedSignCandidate']:classes['visible_sign_detection'][e['normalizedSignCandidate']]={'key':e['normalizedSignCandidate'],'slug':e['normalizedSignCandidate'],'name':e['signNameVi']}
        if e['categoryCandidateId']:
            c=next(c for c in catalog['categories'] if c['id']==e['categoryCandidateId']);classes['category_classification'][c['id']]={'key':c['id'],'slug':c['slug'],'name':c['name']}
    class_order={task:sorted(values, key=lambda key: values[key]['slug']) if task=='category_classification' else sorted(values) for task,values in classes.items()}
    manual_index={};counters=Counter(); group_counts=Counter()
    for i,r in enumerate(records):
        root=groups.find(i);r['leakageGroup']='group-'+records[root]['id'];group_counts[root]+=1
        r['developmentSplit']='val' if int(sha_bytes(('fixgo-source-v1:'+r['leakageGroup']).encode())[:8],16)/0xffffffff<.2 else 'train'
        entries=[by_class[(r['dataset'],c)] for c in r['sourceClassIds']]
        r['mappingKeys']=[e['mappingKey'] for e in entries]
        r['manualReasons']=[]
        if r['errors']:r['manualReasons'].append('invalid_or_missing_annotation')
        if r['geometryWarnings']:r['manualReasons'].append('unusual_geometry')
        if r['visualCandidates']:r['manualReasons']+=r['visualCandidates']
        if any(e['mappingState']=='pending_context' for e in entries):r['manualReasons'].append('mapping_needs_context')
        if any(e['mappingState']=='out_of_scope' for e in entries):r['manualReasons'].append('out_of_scope_candidate')
        if any(e['semantics']['sourceFaultOrDiseaseClaim'] for e in entries):r['manualReasons'].append('source_fault_claim_needs_confirmation')
        if i in conflicts:r['manualReasons'].append('conflicting_labels_same_pixels')
        if i in near_images:r['manualReasons'].append('near_duplicate_candidate')
        r['exactRedundant']=i in redundant;r['duplicateLabelConflict']=i in conflicts
        r['sourceNormalizedProposals']=[dict(mappingKey=e['mappingKey'],mappingState=e['mappingState'],objectCandidates=e['catalogTargetCandidates'],visibleSignCandidates=e['visibleSignProposals'],sourceFaultOrDiseaseClaim=e['semantics']['sourceFaultOrDiseaseClaim'],confirmedCause=None) for e in entries]
        common=[]
        if r['errors']:common.append('invalid_source')
        if r['visualCandidates']:common.append('visual_layout_requires_review')
        if i in redundant:common.append('redundant_exact_copy')
        if i in conflicts:common.append('conflicting_labels')
        r['tasks']={}
        for task in task_names:
            blocked=list(common);labels=[]
            if task.endswith('detection') and r['geometryWarnings']:blocked.append('geometry_requires_review')
            if not entries:blocked.append('no_source_class')
            if task=='object_detection':
                if any(e['mappingState']!='usable_source_candidate' for e in entries):blocked.append('unresolved_object_mapping')
                labels=[e['catalogTargetCandidates'][0]['targetId'] for e in entries if e['mappingState']=='usable_source_candidate']
            elif task=='visible_sign_detection':
                if any(not e['normalizedSignCandidate'] for e in entries):blocked.append('no_direct_localized_sign_mapping')
                labels=[e['normalizedSignCandidate'] for e in entries if e['normalizedSignCandidate']]
            else:
                labels=list({e['categoryCandidateId'] for e in entries if e['categoryCandidateId']})
                if any(not e['categoryCandidateId'] for e in entries) or len(labels)!=1:blocked.append('no_single_category_mapping')
            r['tasks'][task]={'included':not blocked,'labels':sorted(set(labels)),'blockers':blocked}
        r['partition']='development_unverified' if any(t['included'] for t in r['tasks'].values()) else 'quarantine'
        r['benchmarkEligible']=False
        if r['manualReasons']:manual_index[r['id']]={'reasons':r['manualReasons'],'priority':0 if r['errors'] or r['visualCandidates'] or i in conflicts else 1 if 'mapping_needs_context' in r['manualReasons'] else 2}
        counters.update(r['manualReasons'])
    # Small, deterministic spot checks are suggested for otherwise usable source
    # labels. This is a queue, never a synthetic human review or confirmation.
    for key in sorted(by_class):
        eligible=[r for r in records if r['dataset']==key[0] and key[1] in r['sourceClassIds'] and not r['manualReasons'] and any(t['included'] for t in r['tasks'].values())]
        seen=set()
        for r in eligible:
            if r['leakageGroup'] in seen:continue
            seen.add(r['leakageGroup']);r['manualReasons'].append('source_label_spot_check');manual_index[r['id']]={'reasons':r['manualReasons'],'priority':2}
            if len(seen)>=10:break
    progress('exporting',n)
    stats={};manifest_files=[]
    for task in task_names:
        folder=out/task;folder.mkdir(exist_ok=False);included=[r for r in records if r['tasks'][task]['included']]
        ids=class_order[task];numbers={k:i for i,k in enumerate(ids)};counts={k:Counter() for k in ids};class_groups={k:defaultdict(set) for k in ids}
        for r in included:
            split=r['developmentSplit'];src=raw/r['path']
            if task=='category_classification':
                slug=classes[task][r['tasks'][task]['labels'][0]]['slug'];dest=folder/split/slug/(r['id']+src.suffix.lower())
            else:dest=folder/'images'/split/(r['id']+src.suffix.lower())
            dest.parent.mkdir(parents=True,exist_ok=True)
            if shutil.disk_usage(out).free < 1024**3:raise RuntimeError('Less than 1GiB available; stop without touching raw')
            shutil.copyfile(src,dest)
            if sha_file(dest)!=r['sha256']:raise ValueError('Copied image hash mismatch')
            if task.endswith('detection'):
                label_file=folder/'labels'/split/(r['id']+'.txt');label_file.parent.mkdir(parents=True,exist_ok=True);lines=[]
                for a in r['annotations']:
                    e=by_class[(r['dataset'],a['classId'])];key=e['catalogTargetCandidates'][0]['targetId'] if task=='object_detection' else e['normalizedSignCandidate']
                    # Polygon -> enclosing bbox only in the exported derived label.
                    lines.append(str(numbers[key])+' '+' '.join(f'{v:.8f}' for v in a['bbox']))
                label_file.write_text('\n'.join(lines)+'\n')
            for key in r['tasks'][task]['labels']:
                counts[key][split]+=1;class_groups[key][split].add(r['leakageGroup'])
        class_stats=[]
        for key in ids:
            c=dict(classes[task][key],trainImages=counts[key]['train'],valImages=counts[key]['val'],trainGroups=len(class_groups[key]['train']),valGroups=len(class_groups[key]['val']))
            c['enoughForExploratoryTrial']=c['trainImages']>=MIN_TRAIN and c['valImages']>=MIN_VAL and c['trainGroups']>=2 and c['valGroups']>=1 and c['trainGroups']+c['valGroups']>=MIN_GROUPS
            class_stats.append(c)
        train_groups={r['leakageGroup'] for r in included if r['developmentSplit']=='train'};val_groups={r['leakageGroup'] for r in included if r['developmentSplit']=='val'}
        if train_groups&val_groups:raise ValueError('Leakage group crosses split')
        config={'description':'UNVERIFIED source-supervised-development; NOT approved Ground Truth or independent benchmark','approved_ground_truth':False,'independent_test':False,'provenance_manifest':str(out/'records.jsonl'),'path':str(folder),'train':'images/train','val':'images/val','names':{numbers[k]:classes[task][k]['name'] for k in ids}}
        if task.endswith('detection'):(folder/'data.yaml').write_text(yaml.safe_dump(config,allow_unicode=True,sort_keys=False))
        save(folder/'class-map.json',{'classes':class_stats,'classIndexToKey':{str(numbers[k]):k for k in ids}})
        save(folder/'experiment.json',{'task':'detect' if task.endswith('detection') else 'classify','dataset':str(folder/'data.yaml') if task.endswith('detection') else str(folder),
             'initialization':'explicit local compatible model weights required; no automatic download','epochs':10,'imgsz':640 if task.endswith('detection') else 224,'batch':8,'seed':23,
             'sourceSupervised':True,'humanVerified':False,'approvedGroundTruth':False,'officialBenchmark':False,'launchAuthorized':False,
             'outputPolicy':'new experiment folder outside raw, production weights and inference; never activate automatically'})
        stats[task]={'images':len(included),'trainImages':sum(r['developmentSplit']=='train' for r in included),'valImages':sum(r['developmentSplit']=='val' for r in included),
                     'groups':len(train_groups|val_groups),'classes':class_stats,'allClassesMeetTrialMinimum':bool(class_stats) and all(c['enoughForExploratoryTrial'] for c in class_stats),'groupOverlap':0}
    with (out/'records.jsonl').open('x') as f:
        for r in records:f.write(json.dumps(r,ensure_ascii=False)+'\n')
    with (out/'manual-review.jsonl').open('x') as f:
        for image_id,review in sorted(manual_index.items(),key=lambda v:(v[1]['priority'],v[0])):f.write(json.dumps(dict(imageId=image_id,**review),ensure_ascii=False)+'\n')
    save(out/'review-index.json',manual_index);save(out/'normalized-mapping.json',{'catalogSnapshotSha256':sha_file(out/'catalog-db.json'),'mappingSnapshotSha256':sha_file(source/'dataset-mapping-proposal.json'),'approvedGroundTruth':False,'entries':normalized})
    # Verify original bytes once more after export. Nothing under raw is written.
    unchanged=all(sha_file(raw/r['path'])==r['sha256'] and (sha_file(raw/r['annotationPath']) if (raw/r['annotationPath']).exists() else None)==r['annotationSha256'] for r in records)
    if not unchanged:raise ValueError('Raw changed during preparation; run cannot be finalized')
    current_files=sorted(str(p.relative_to(raw)) for p in raw.rglob('*') if p.suffix.lower() in EXTENSIONS)
    if current_files!=[r['path'] for r in records]:raise ValueError('Raw image inventory changed during preparation')
    for ds,meta in metadata.items():
        if sha_file(raw/ds/'data.yaml')!=meta['yamlSha256']:raise ValueError('YAML changed during export')
    classes_report=[]
    for e in normalized:
        members=[r for r in records if r['dataset']==e['dataset'] and e['classId'] in r['sourceClassIds']]
        classes_report.append({'mappingKey':e['mappingKey'],'sourceLabel':e['sourceLabel'],'mappingState':e['mappingState'],'images':len(members),'technicallyValidImages':sum(not r['errors'] for r in members),'manualReviewImages':sum(bool(r['manualReasons']) for r in members)})
    save(out/'source-class-counts.json',classes_report)
    summary={'schemaVersion':'fixgo.ai01.preparation.v1','status':'prepared_not_trained','createdAt':datetime.now(timezone.utc).isoformat(),'exportRoot':str(out),'catalogCounts':{k:len(catalog[k]) for k in ['categories','targets']},
       'catalogVerifiedReadOnly':True,'counts':{'scanned':n,'usableAnyTask':sum(any(t['included'] for t in r['tasks'].values()) for r in records),'excludedAllTasks':sum(not any(t['included'] for t in r['tasks'].values()) for r in records),'matchingTask03B':sum(r['snapshotMatchesTask03B'] for r in records),'technicalErrorImages':sum(bool(r['errors']) for r in records),
       'decodeErrors':sum('decode_error' in r['errors'] for r in records),'missingLabels':sum('missing_annotation' in r['errors'] for r in records),
       'emptyLabels':sum('empty_annotation_not_verified_negative' in r['errors'] for r in records),'invalidLabelFormatImages':sum(any(e not in ['empty_annotation_not_verified_negative','missing_annotation','decode_error'] for e in r['errors']) for r in records),
       'geometryWarningImages':sum(bool(r['geometryWarnings']) for r in records),'exactGroups':sum(len(v)>1 for v in sha_groups.values()),'exactImages':sum(len(v) for v in sha_groups.values() if len(v)>1),'redundantExactCopies':len(redundant),
       'conflictingDuplicateImages':len(conflicts),'nearPairs':near_pairs,'nearImages':len(near_images),'leakageGroups':len(group_counts),'largestLeakageGroup':max(group_counts.values(),default=0),
       'advertisementCandidates':sum(any('advertisement' in x for x in r['visualCandidates']) for r in records),'compositeCandidates':sum('composite_layout_candidate' in r['visualCandidates'] for r in records),'manualReview':len(manual_index)},
       'manualReasonCounts':dict(Counter(reason for r in records for reason in r['manualReasons'])),'mappingCounts':dict(Counter(e['mappingState'] for e in normalized)),'humanApprovedMappings':0,
       'tasks':stats,'minimumTrialCriteria':{'trainImages':MIN_TRAIN,'valImages':MIN_VAL,'totalGroups':MIN_GROUPS,'trainGroups':2,'valGroups':1,'meaning':'engineering minimum for exploratory trial, not statistical sufficiency or verified labels'},
       'leakageChecks':{'sha256Overlap':0,'pixelOverlap':0,'phashPairsCrossSplit':0,'filenameFamilyCrossSplit':0,'threshold':6,'exhaustiveRawPairs':True,'splitSeed':'fixgo-source-v1','sourceSplitTrusted':False,'physicalDeviceSessionVerified':False,'independentTestCreated':False},
       'rawUnchangedAfterExport':True,'approvedGroundTruth':False,'trained':False,'deployed':False,
       'limitations':['All exported source labels remain unverified weak supervision; not approved ground truth.', 'Ad/composite layout heuristics only identify review candidates; no OCR or confirmed ad detection.', 'No precise plumbing fault/disease cause labels inferred; ambiguous claims stay in manual review.', 'Filename families and pHash conservatively group likely related photos; physical device/session identities are unavailable.', 'All train/val partitions are development only; no independent benchmark/test is created.']}
    save(out/'summary.json',summary)
    # Record bytes of every exported file; summary is published only after raw checks.
    manifest={str(p.relative_to(out)):sha_file(p) for p in sorted(out.rglob('*')) if p.is_file() and p.name not in ['SHA256SUMS.json','progress.json']}
    save(out/'SHA256SUMS.json',manifest);progress('complete',n)
    print(json.dumps({'status':summary['status'],'counts':summary['counts'],'mappingCounts':summary['mappingCounts'],'taskImages':{k:v['images'] for k,v in stats.items()}},ensure_ascii=False),flush=True)
    return summary


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--raw',type=Path,required=True);p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--workers',type=int,default=4)
    a=p.parse_args();prepare(a.raw,a.source,a.out,a.workers)
