"""Whole-queue automatic proposals and segregated, explicitly unverified YOLO exports."""
import argparse
import fcntl
import csv
import json
import os
import threading
import resource
import shutil
import tempfile
import uuid
from collections import Counter, defaultdict
from pathlib import Path
from types import SimpleNamespace

from PIL import Image
import io
from core import REPO, Studio, atomic, array, canonical, digest, now, read_asset, safe_id
from exporter import partition
from batch import run as infer, DEFAULT_DETECTOR, valid_cache
from trial import sha

LIMIT = 50000


def require(ok, message):
    if not ok:
        raise ValueError(message)


def run_dir(state, run_id):
    safe_id(run_id)
    base = Path(state)/'auto-runs'
    path = base/run_id
    require(not base.is_symlink() and not path.is_symlink() and path.resolve().is_relative_to(base.resolve()), 'Unsafe auto run path')
    return path


def request_run(store, ids, sign_manifest=None, *, include_reviewed=False):
    require(isinstance(ids, list) and 1 <= len(ids) <= LIMIT and len(ids)==len(set(ids)) and all(i in store.rows for i in ids), 'Select 1..50000 known images')
    # Human annotations/drafts are kept out of the automatic queue, not overwritten or demoted.
    protected = [i for i in ids if i in store.studio_latest]
    ids = [i for i in ids if i not in store.studio_latest] if not include_reviewed else ids
    require(ids, 'All selected images already have human review/drafts; choose unreviewed images')
    if sign_manifest:
        from sign_model import descriptor
        descriptor(sign_manifest, store.catalog, store.signs)
    run_id = 'auto-'+uuid.uuid4().hex[:16]
    folder = run_dir(store.state, run_id)
    folder.mkdir(parents=True, exist_ok=False)
    request = {'schema': 'fixgo.studio.auto-request.v1', 'runId': run_id, 'createdAt': now(),
               'imageIds': ids, 'skippedHumanImages': protected if not include_reviewed else [], 'inspectionOnly':include_reviewed, 'inventoryPins': json.loads((store.state/'inventory-pin.json').read_text()),
               'signManifest': str(Path(sign_manifest).resolve()) if sign_manifest else None,
               'signManifestSha256': sha(sign_manifest) if sign_manifest else None,
               'threads': 2, 'ramMiB': 3072, 'automaticHumanVerification': False}
    atomic(folder/'request.json', request)
    atomic(store.state/('grounding-active.json' if include_reviewed else 'auto-active.json'), {'runId': run_id})
    atomic(folder/'progress.json', {'runId': run_id, 'status': 'STARTING', 'requested': len(ids), 'processed': 0})
    return request


def load_request(state, run_id):
    path = run_dir(state, run_id)/'request.json'
    require(path.is_file() and not path.is_symlink(), 'Missing auto request')
    request = json.loads(path.read_text())
    require(request.get('schema')=='fixgo.studio.auto-request.v1' and request.get('runId')==run_id, 'Invalid request schema')
    return request


def snapshot(inventory, state):
    pins = json.loads((state/'inventory-pin.json').read_text())
    audit = inventory.parent
    require(pins == {'inventory_sha256': sha(inventory), 'catalog_sha256': sha(audit/'evidence/catalog.json'),
                     'ontology_sha256': sha(audit/'evidence/ontology.json')}, 'Inventory/catalog/ontology changed')
    with inventory.open(newline='') as stream:
        rows = {r['image_id']: r for r in csv.DictReader(stream)}
    catalog = json.loads((audit/'evidence/catalog.json').read_text())
    context = SimpleNamespace(rows=rows, targets={t['id']: t for t in catalog['targets']},
                              signs=json.loads((audit/'evidence/ontology.json').read_text())['signs'], state=state, pins=pins)
    return context


def analyze(context, ids, profile):
    splits, grouping = partition(context, ids, 42)
    grouped = defaultdict(list)
    for i in ids:
        grouped[grouping[i]['component']].append(i)
    representatives = {i: min(grouped[grouping[i]['component']]) for i in ids}
    records = []
    for i in ids:
        row = context.rows[i]
        record = {'imageId': i, 'contentHash': row['sha256'], 'sourcePath': row['path'],
                  'split': splits[i], 'group': grouping[i], 'representativeId': representatives[i],
                  'duplicateCandidate': len(grouped[grouping[i]['component']])>1,
                  'reviewStatus': 'AI_PROPOSED', 'humanVerified': False, 'outcome': 'UNKNOWN',
                  'signCoverage': 'MODEL_PROPOSED_NOT_VERIFIED' if profile.get('signDetector') else 'UNAVAILABLE',
                  'boxes': [], 'issues': [], 'warnings': [], 'cacheHash': None, 'modelProfileHash': profile['profileHash']}
        try:
            path = context.state/'ai-cache'/(safe_id(i)+'.json')
            require(valid_cache(path, row, profile), 'No successful current-model cache')
            if digest(read_asset(row['path'])) != row['sha256']:
                raise ValueError('Source changed')
            cache = json.loads(path.read_text()); prediction = cache['prediction']
            raw_boxes = prediction.get('boxes', [])
            require(isinstance(raw_boxes, list), 'Invalid AI geometry')
            boxes = [{k: b.get(k) for k in ['id','kind','label','xyxy','objectId']} | {'annotationSource':'AI'} for b in raw_boxes]
            Studio.validate_boxes(context, boxes, row)
            record.update(boxes=boxes, cacheHash=cache['cacheHash'], targetCandidates=prediction.get('targetCandidates', []), searchScope={k:prediction.get('groundingDiagnostics',{}).get(k) for k in ['targetIdsSearched','signCodesSearched','scopeWarnings']})
            objects = [b for b in boxes if b['kind']=='object']
            signs = [b for b in boxes if b['kind']=='sign']
            if not objects:
                record['issues'].append('NO_OBJECT_GEOMETRY')
            # Keep classification/geometry disagreements in the inspection queue.
            candidates = prediction.get('targetCandidates') or []
            object_labels = {b['label'] for b in objects}
            if candidates and object_labels and candidates[0].get('targetId') not in object_labels:
                record['issues'].append('CLASSIFIER_DETECTOR_DISAGREE')
            source_labels = set(array(row.get('candidate_target_ids_json')))
            if source_labels and object_labels and not object_labels <= source_labels:
                record['issues'].append('SOURCE_MODEL_DISAGREE')
            if prediction.get('uncertain'):
                record['issues'].append('MODEL_UNCERTAIN')
            record['issues'].extend(prediction.get('signIssues', []))
            record['warnings'].extend(prediction.get('groundingWarnings', []))
            if prediction.get('visibleDefects') is not None and not profile.get('signDetector'):
                record['issues'].append('UNSUPPORTED_SIGN_CLAIM')
            if signs and not profile.get('signDetector'):
                record['issues'].append('UNSUPPORTED_SIGN_GEOMETRY')
            if not profile.get('signDetector'):
                record['warnings'].append('NO_SIGN_MODEL')
            elif not signs:
                record['warnings'].append('NO_SIGN_DETECTED_NOT_A_NORMAL_LABEL')
            if 'synthetic' in row.get('real_or_synthetic','').lower():
                record['warnings'].append('SYNTHETIC_DEVELOPMENT_ONLY')
            if record['duplicateCandidate']:
                record['warnings'].append('GROUP_OR_DUPLICATE_CANDIDATE')
            if row.get('format','').lower() not in ['png','jpeg','jpg','webp','bmp','tiff','tif']:
                record['issues'].append('UNSUPPORTED_SOURCE_FORMAT')
            if row.get('exif_orientation','1') not in ['', '1'] or row.get('frames','1') not in ['', '1']:
                record['issues'].append('SOURCE_NORMALIZATION_REQUIRED')
            record['technicalStatus'] = 'SUCCESS'
        except Exception as error:
            record['technicalStatus'] = 'ERROR'
            record['issues'].append('TECHNICAL_ERROR')
            record['error'] = str(error)[:250]
        record['issues'] = sorted(set(record['issues']))
        record['bucket'] = 'ERROR' if record['technicalStatus']=='ERROR' else 'NEEDS_REVIEW' if record['issues'] else 'PROPOSED'
        records.append(record)
    return records


def build_report(inventory, state, run_id, profile):
    context = snapshot(inventory, state)
    request = load_request(state, run_id)
    require(context.pins==request['inventoryPins'], 'Request snapshot changed')
    records = analyze(context, request['imageIds'], profile)
    counts = Counter(r['bucket'] for r in records)
    report = {'automationCodeSha256':sha(Path(__file__)), 'schema': 'fixgo.studio.auto-report.v1', 'runId': run_id, 'createdAt': now(),
              'requestSha256': sha(run_dir(state, run_id)/'request.json'), 'inventoryPins': context.pins,
              'modelProfile': profile, 'records': records,
              'summary': {'requested': len(records), 'proposed': counts['PROPOSED'], 'needsReview': counts['NEEDS_REVIEW'],
                          'failed': counts['ERROR'], 'duplicateOrGroupCandidates': sum(r['duplicateCandidate'] for r in records),
                          'hasSignModel': bool(profile.get('signDetector')), 'humanVerifiedCreated': 0},
              'limitations': ['All labels are automatic and unverified.', 'No detection does not mean normal.',
                              'Duplicate/source groups are conservative proxies, not proven scene identity.']}
    folder = run_dir(state, run_id)
    atomic(folder/'report.json', report)
    atomic(folder/'report-seal.json', {'reportSha256': sha(folder/'report.json')})
    return report


def read_report(state, run_id):
    folder = run_dir(state, run_id)
    require((folder/'report.json').is_file(), 'Auto report not ready; wait for completion')
    require(not (folder/'report.json').is_symlink() and not (folder/'report-seal.json').is_symlink(), 'Unsafe report path')
    require(sha(folder/'report.json')==json.loads((folder/'report-seal.json').read_text())['reportSha256'], 'Report checksum changed')
    report = json.loads((folder/'report.json').read_text())
    require(report.get('schema')=='fixgo.studio.auto-report.v1' and report.get('runId')==run_id, 'Invalid report schema')
    require(report['requestSha256']==sha(folder/'request.json'), 'Auto request changed')
    return report


def export_pseudo(store, run_id, version, task='objects', acknowledged=False):
    with (store.state/'batch.lock').open('a') as lock:
        try:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ValueError('AI worker is still running; export after completion') from error
        return _export_pseudo(store,run_id,version,task,acknowledged)


def _export_pseudo(store, run_id, version, task='objects', acknowledged=False):
    require(acknowledged is True, 'Explicit acknowledgement: unverified AI labels only')
    require(task in ['objects','objects-and-signs'], 'Unknown pseudo-label task')
    try:safe_id(version)
    except ValueError as error:raise ValueError('Tên phiên bản xuất không hợp lệ. Nhập ví dụ filter-v1; chỉ dùng chữ, số, dấu - hoặc _.') from error
    report = read_report(store.state, run_id)
    context = snapshot(store.inventory, store.state)
    require(report['inventoryPins']==context.pins, 'Export inventory changed')
    active = json.loads((store.state/'active-model-profile.json').read_text())
    require(active['profileHash']==report['modelProfile']['profileHash'], 'Active model profile changed; rerun automation')
    if task=='objects-and-signs':
        require(bool(report['summary']['hasSignModel']), 'No sign detector available; cannot export defect labels')
    # Recompute cache/source issues before exporting; never trust report flags alone.
    current = analyze(context, [r['imageId'] for r in report['records']], report['modelProfile'])
    class_names = ['object:'+t['slug'] for t in sorted(store.targets.values(), key=lambda t:t['slug'])]
    if task=='objects-and-signs':
        class_names += ['sign:'+s for s in sorted({c['code'] for c in report['modelProfile']['signDetector']['classes'] if c['kind']=='sign'})]
    base = store.state/'pseudo-exports'
    require(not base.is_symlink(), 'Unsafe pseudo export root')
    base.mkdir(exist_ok=True)
    destination = base/version
    require(not destination.exists() and not destination.is_symlink(), 'Pseudo export version already exists')
    selected, excluded = [], []
    with store.mutex:
        store.check_studio(); store.source_profiles.check()
        for r in current:
            i = r['imageId']; row = store.rows[i]
            reason = list(r['issues'])
            if i in store.studio_latest:
                reason.append('HUMAN_REVISION_EXISTS')
            if task=='objects-and-signs' and not any(b['kind']=='sign' for b in r['boxes']):
                reason.append('NO_POSITIVE_SIGN_PROPOSAL_NOT_A_VERIFIED_NEGATIVE')
            source = store.source_profiles.for_row(row)
            rights = (source or {}).get('profile')
            if not rights or rights['licenseStatus']!='VERIFIED' or rights['licenseConfirmed'] is not True:
                reason.append('DATASET_RIGHTS_NOT_VERIFIED')
            if reason:
                excluded.append({'imageId': i, 'reasons': sorted(set(reason))}); continue
            selected.append({**r, 'rightsProfile': rights})
        require(selected, 'No eligible automatic labels: inspect report and dataset rights first')
        tmp = Path(tempfile.mkdtemp(prefix='.building-', dir=base))
        try:
            for split in ['train','val']:
                (tmp/'images'/split).mkdir(parents=True); (tmp/'labels'/split).mkdir(parents=True)
            for r in selected:
                row = store.rows[r['imageId']]
                payload = read_asset(row['path'])
                require(digest(payload)==r['contentHash'], 'Source changed during export')
                with Image.open(io.BytesIO(payload)) as image:
                    require(image.width*image.height<=25_000_000 and (image.width,image.height)==(int(row['width']),int(row['height'])) and image.getexif().get(274,1)==1 and getattr(image,'n_frames',1)==1, 'Normalize source dimensions/EXIF/multiframe')
                    image.load()
                ext = {'jpeg':'jpg','tiff':'tif'}.get(row['format'].lower(), row['format'].lower())
                require(ext in ['png','jpg','webp','bmp','tif'], 'Unsupported export format')
                relative = f"images/{r['split']}/{r['imageId']}.{ext}"
                (tmp/relative).write_bytes(payload)
                lines = []
                for b in r['boxes']:
                    if task=='objects' and b['kind']=='sign':
                        continue
                    name = 'object:'+store.targets[b['label']]['slug'] if b['kind']=='object' else 'sign:'+b['label']
                    x,y,xx,yy = b['xyxy']; lines.append(f'{class_names.index(name)} {(x+xx)/2:.9f} {(y+yy)/2:.9f} {xx-x:.9f} {yy-y:.9f}')
                (tmp/'labels'/r['split']/(r['imageId']+'.txt')).write_text('\n'.join(lines)+'\n')
                r['exportImage'] = relative
            import yaml
            (tmp/'data.yaml').write_text(yaml.safe_dump({'path':str(destination.resolve()),'train':'images/train','val':'images/val','names':dict(enumerate(class_names))}, allow_unicode=True))
            manifest = {'schema':'fixgo.studio.pseudo.v1','version':version,'task':task,'runId':run_id,'createdAt':now(),
                        'labelStatus':'AI_UNVERIFIED','humanVerified':False,'independentTest':False,'trainingExecuted':False,
                        'automaticallyApproved':False,'classMapping':dict(enumerate(class_names)), 'modelProfile':report['modelProfile'],
                        'inventoryPins':report['inventoryPins'],'sourceReportSha256':sha(run_dir(store.state,run_id)/'report.json'),
                        'records':selected,'excluded':excluded, 'hasTrainAndValidation':{r['split'] for r in selected}=={'train','val'},
                        'warning':'Research pseudo-labels only. No accuracy or verified-negative claim; not accepted by official/trial gates.'}
            (tmp/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
            from source_profiles import attribution
            profiles = {r['rightsProfile']['eventHash']:r['rightsProfile'] for r in selected}
            (tmp/'ATTRIBUTION.txt').write_text(attribution(list(profiles.values())))
            (tmp/'README.txt').write_text('AI-UNVERIFIED pseudo labels. Not HUMAN_VERIFIED, not independent test. Official exporter and trial adapter remain gated.\n')
            atomic(tmp/'SHA256SUMS.json', {str(p.relative_to(tmp)):sha(p) for p in sorted(tmp.rglob('*')) if p.is_file()})
            tmp.rename(destination)
        except BaseException:
            shutil.rmtree(tmp); raise
    return {'path':str(destination),'images':len(selected),'excluded':len(excluded),'labelStatus':'AI_UNVERIFIED','task':task}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory', type=Path, required=True)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--run-id', required=True)
    args = parser.parse_args()
    folder = run_dir(args.state, args.run_id)
    monitor_stop=threading.Event()
    def whole_job_guard():
        while not monitor_stop.wait(.25):
            try:
                rss=int(next(line.split()[1] for line in Path('/proc/self/status').read_text().splitlines() if line.startswith('VmRSS:')))/1024
                if rss>3072:
                    atomic(folder/'progress.json',{'runId':args.run_id,'status':'FAILED','error':'RSS_LIMIT_EXCEEDED','observedRssMiB':rss,'rssLimitMiB':3072})
                    os._exit(70)
            except OSError:
                return
    threading.Thread(target=whole_job_guard,daemon=True).start()
    try:
        request = load_request(args.state, args.run_id)
        context = snapshot(args.inventory, args.state)
        require(context.pins==request['inventoryPins'], 'Request inventory changed')
        if request['signManifest']:
            require(sha(request['signManifest'])==request['signManifestSha256'], 'Sign manifest changed since request')
        result = infer(args.inventory, args.state, request['imageIds'], threads=request['threads'], ram_mb=request['ramMiB'],
                       max_images=LIMIT, sign_manifest=request['signManifest'], stop_path=folder/'STOP')
        atomic(folder/'progress.json', {'runId':args.run_id,'status':'BUILDING_REPORT',**{k:v for k,v in result.items() if k!='status'}})
        with (args.state/'batch.lock').open('a') as report_lock:
            fcntl.flock(report_lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            profile = json.loads((args.state/'active-model-profile.json').read_text())
            require(profile['profileHash']==result['profileHash'], 'Another worker changed the model profile before reporting')
            report = build_report(args.inventory, args.state, args.run_id, profile)
        atomic(folder/'progress.json', {**result,'peakRssMiB':round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,2),'runId':args.run_id,'summary':report['summary'],'status':result['status']})
        print(canonical(report['summary']))
        return 0 if result['status']=='COMPLETED' else 2
    except Exception as error:
        atomic(folder/'progress.json', {'runId':args.run_id,'status':'FAILED','error':str(error)[:500]})
        raise
    finally:
        monitor_stop.set()


if __name__=='__main__':
    raise SystemExit(main())
