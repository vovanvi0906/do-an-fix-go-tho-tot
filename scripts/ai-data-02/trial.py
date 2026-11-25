"""Offline Studio trial adapter and separately reviewed test freeze. Never trains/activates."""
import argparse
import copy
import hashlib
import io
import json
import os
import shutil
import tempfile
from collections import Counter
from pathlib import Path

from PIL import Image
import yaml
from core import Studio, REPO, canonical, digest, read_asset, safe_id, now
from exporter import partition

MINIMUM = {'trainImagesPerSign': 20, 'valImagesPerSign': 5, 'trainGroupsPerSign': 2, 'valGroupsPerSign': 1, 'normalTrainImages': 5, 'normalValImages': 2}

DEFAULT_SIGNS = ['burn_mark', 'crack', 'broken_part', 'wet_surface']


def require(ok, message):
    if not ok:
        raise ValueError(message)


def text(value, minimum=10):
    return isinstance(value, str) and minimum <= len(value.strip()) <= 5000


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def local(root, relative):
    require(isinstance(relative, str) and not Path(relative).is_absolute(), 'Relative path required')
    path = root / relative
    require(path.resolve().is_relative_to(root.resolve()) and not any(p.is_symlink() for p in [path, *path.parents] if p != root.parent), 'Unsafe path/symlink')
    require(path.is_file(), 'Missing file: ' + relative)
    return path


def image_info(payload):
    with Image.open(io.BytesIO(payload)) as im:
        require(im.width * im.height <= 25_000_000 and im.getexif().get(274, 1) == 1 and getattr(im, 'n_frames', 1) == 1, 'Normalize image/EXIF before review')
        im.load()
        rgb = im.convert('RGB')
        # Same dimensions and decoded RGB bytes, independent of encoded file format.
        pixel = digest(str(rgb.size).encode() + rgb.tobytes())
        small = rgb.convert('L').resize((9, 8))
        px = list(small.tobytes())
        dhash = sum((px[y*9+x] > px[y*9+x+1]) << (y*8+x) for y in range(8) for x in range(8))
        return im.size, pixel, dhash


def check_pins(store):
    pins = json.loads((store.state/'inventory-pin.json').read_text())
    require(pins == {'inventory_sha256': sha(store.inventory),
                     'catalog_sha256': sha(store.audit/'evidence/catalog.json'),
                     'ontology_sha256': sha(store.audit/'evidence/ontology.json')}, 'Live inventory/catalog/ontology changed')


def scope(store, signs):
    require(isinstance(signs, list) and signs and len(signs) == len(set(signs)) and all(s in store.signs for s in signs), 'Unknown/duplicate sign scope')
    # Keep every catalog object: no dropped object annotation can become background.
    objects = sorted(store.targets.values(), key=lambda t: t['slug'])
    classes = ['object:' + t['slug'] for t in objects] + ['sign:' + s for s in sorted(signs)]
    return classes


def validate_record(store, record, row, signs, attestation):
    require(record.get('reviewStatus') == 'HUMAN_VERIFIED', 'Human verification required')
    require(record.get('licenseStatus') == 'VERIFIED' and record.get('licenseConfirmed') is True and record.get('licenseType') in ['owned', 'licensed', 'permission'] and text(record.get('licenseEvidence'), 20) and text(record.get('sourceEvidence')), 'Actual rights/provenance evidence required')
    require(text(record.get('reviewer'), 2) and text(record.get('reviewedAt')), 'Reviewer/time required')
    checks = record.get('reviewChecks', {})
    require(all(checks.get(k) is True for k in ['imageSeen', 'objectExtent', 'allSigns', 'objectAssociation']), 'Complete review required')
    boxes = store.validate_boxes(record.get('boundingBoxes'), row)
    sign_boxes = [b for b in boxes if b['kind'] == 'sign']
    require(all(b['label'] in signs for b in sign_boxes), 'Image has excluded sign: exclude whole image, never drop boxes')
    objects = {b['id']: b for b in boxes if b['kind'] == 'object'}
    def inside(sign, obj):
        x1, y1, x2, y2 = sign['xyxy']; a, b, c, d = obj['xyxy']
        return max(0, min(x2, c)-max(x1, a))*max(0, min(y2, d)-max(y1, b))/((x2-x1)*(y2-y1)) >= .8
    for sign in sign_boxes:
        linked = objects[sign['objectId']]
        matches = [obj for obj in objects.values() if obj['label'] == linked['label'] and inside(sign, obj)]
        require(len(matches) == 1 and matches[0]['id'] == linked['id'], 'Sign/object geometry ambiguous for runtime association')
    outcome = record.get('outcome')
    require(outcome in ['NORMAL', 'ABNORMAL', 'OUT_OF_SCOPE'], 'Unresolved outcome')
    require((outcome == 'OUT_OF_SCOPE' and not boxes and not record.get('targetIds')) or
            (outcome == 'NORMAL' and not sign_boxes and any(b['kind'] == 'object' for b in boxes)) or
            (outcome == 'ABNORMAL' and sign_boxes and checks.get('signTargetCompatibility') is True), 'Outcome/boxes mismatch')
    require(isinstance(attestation, dict) and text(attestation.get('reviewer'), 2) and text(attestation.get('groupEvidence'), 20), 'Human device/scene grouping evidence required')
    require(set(attestation.get('reviewedSigns', [])) == set(signs), 'Explicit task coverage required')
    keys = attestation.get('groupKeys')
    require(isinstance(keys, list) and keys and len(keys) == len(set(keys)) and all(text(k, 2) for k in keys), 'Device/scene/session/source group keys required')
    return boxes


def lines_for(store, boxes, classes):
    lines = []
    for b in boxes:
        name = 'object:' + store.targets[b['label']]['slug'] if b['kind'] == 'object' else 'sign:' + b['label']
        x1, y1, x2, y2 = b['xyxy']
        lines.append(f'{classes.index(name)} {(x1+x2)/2:.9f} {(y1+y2)/2:.9f} {x2-x1:.9f} {y2-y1:.9f}')
    return '\n'.join(lines) + ('\n' if lines else '')


def publish(out, manifest, assets, classes, protected):
    out = Path(out).absolute()
    require(not out.exists() and not out.is_symlink(), 'Output version already exists')
    for p in [*protected, Path.home()/'Work/datasetai', Path.home()/'Downloads']:
        p = Path(p).resolve()
        require(not out.resolve().is_relative_to(p) and not p.is_relative_to(out.resolve()), 'Output overlaps input/state/repository')
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix='.trial-', dir=out.parent))
    try:
        for relative, data in assets.items():
            path = tmp / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        splits = sorted({r['split'] for r in manifest['records']})
        config = {'path': str(out.resolve()), 'names': dict(enumerate(classes))}
        config.update({s: 'images/' + s for s in splits})
        (tmp/'data.yaml').write_text(yaml.safe_dump(config, allow_unicode=True, sort_keys=False))
        manifest.update(adapterSha256=sha(Path(__file__)), createdAt=now(), classMapping=dict(enumerate(classes)), trainingExecuted=False,
                        productionActivation=False, automaticallyApproved=False)
        (tmp/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
        pins = {str(p.relative_to(tmp)): sha(p) for p in sorted(tmp.rglob('*')) if p.is_file()}
        (tmp/'SHA256SUMS.json').write_text(canonical(pins)+'\n')
        # Version creation is serialized even across separate tool processes.
        lock = out.parent / ('.' + out.name + '.publish.lock')
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        try:
            require(not out.exists(), 'Output version already exists')
            tmp.rename(out)
        finally:
            os.close(fd)
            lock.unlink()
        return {'path': str(out), 'manifestSha256': sha(out/'manifest.json'), 'sealSha256': sha(out/'SHA256SUMS.json')}
    finally:
        if tmp.exists():
            shutil.rmtree(tmp)


def verify(folder, expected_seal):
    folder = Path(folder).resolve()
    require(sha(folder/'SHA256SUMS.json') == expected_seal, 'External seal mismatch')
    pins = json.loads((folder/'SHA256SUMS.json').read_text())
    require(isinstance(pins, dict) and 'manifest.json' in pins and 'data.yaml' in pins, 'Incomplete seal')
    actual = {str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file()} - {'SHA256SUMS.json'}
    require(actual == set(pins), 'Bundle file set changed')
    for name, expected in pins.items():
        require(sha(local(folder, name)) == expected, 'Bundle checksum mismatch: ' + name)
    return json.loads((folder/'manifest.json').read_text())


def prepare(store, export_dir, review, signs, out):
    check_pins(store)
    export_dir = Path(export_dir).resolve()
    require(export_dir.parent == (store.state/'exports').resolve(), 'Use export owned by this Studio state')
    mpath = local(export_dir, 'manifest.json')
    manifest_bytes = mpath.read_bytes()
    m = json.loads(manifest_bytes)
    require(m.get('schema') == 'fixgo.studio.development.v1' and m.get('format') == 'yolo' and m.get('independentTest') is False, 'Expected Studio development YOLO export')
    require(m.get('inventoryPins') == json.loads((store.state/'inventory-pin.json').read_text()), 'Inventory pins changed')
    require(review.get('schema') == 'fixgo.studio.trial-review.v1' and review.get('exportManifestSha256') == digest(manifest_bytes), 'Review must pin export manifest')
    require(review.get('approvedForTrial') is True and text(review.get('reviewer'), 2) and text(review.get('evidence'), 20), 'Explicit trial review required')
    classes = scope(store, signs)
    records = m.get('records', [])
    ids = [r['imageId'] for r in records]
    require(ids and len(ids) == len(set(ids)) and set(ids) <= set(store.rows), 'Invalid record IDs')
    splits, grouping = partition(store, ids, m['seed'])
    require(set(splits.values()) == {'train', 'val'}, 'Both train and val required')
    assets, output, groups = {}, [], {}
    source_classes = m.get('classMapping', {})
    with store.mutex:
        store.check_studio()
        for r in records:
            i = r['imageId']; row = store.rows[i]
            latest = store.studio_latest.get(i)
            require(latest is not None, 'Missing live audit revision')
            require(all(r.get(k) == v for k, v in latest.items()), 'Stale/tampered annotation revision: '+i)
            require(r.get('split') == splits[i] and r.get('splitGrouping') == grouping[i], 'Split/group changed')
            store.source_profiles.validate_record(row, r)
            if r.get('sourceProfileHash'):
                require(any(e.get('eventHash') == r['sourceProfileHash'] and e == store.source_profiles.latest.get(e.get('datasetId')) for e in m.get('sourceProfiles', [])), 'Missing/tampered source profile snapshot')
            a = review.get('images', {}).get(i, {})
            boxes = validate_record(store, r, row, signs, a)
            path = local(export_dir, r['exportImage'])
            payload = path.read_bytes()
            require(digest(payload) == row['sha256'] == r['contentHash'] == digest(read_asset(row['path'])), 'Source/export hash mismatch')
            size, pixel, _ = image_info(payload)
            require(size == (int(row['width']), int(row['height'])), 'Image dimensions changed')
            # Compare serialized source labels too, then rebuild using the remapped class list.
            original = [source_classes[str(n)] for n in range(len(source_classes))]
            label = local(export_dir, 'labels/'+r['split']+'/'+i+'.txt')
            require(label.read_text() == lines_for(store, boxes, original), 'Export labels disagree with audited boxes')
            keys = ['human:'+k for k in a['groupKeys']] + ['component:'+grouping[i]['component'], 'pixel:'+pixel]
            for k in keys:
                require(k not in groups or groups[k] == r['split'], 'Human/duplicate group crosses train/val')
                groups[k] = r['split']
            image_name = 'images/'+r['split']+'/'+i+path.suffix.lower()
            assets[image_name] = payload
            assets['labels/'+r['split']+'/'+i+'.txt'] = lines_for(store, boxes, classes).encode()
            output.append({**copy.deepcopy(r), 'exportImage': image_name, 'humanGrouping': a, 'pixelFingerprint': pixel})
    support = {s: dict(Counter('sign:'+b['label'] for r in output if r['split'] == s for b in r['boundingBoxes'] if b['kind'] == 'sign')) for s in ['train', 'val']}
    # Count transitive human/duplicate groups, including aliases, for support gates.
    parents = {}
    def root(k):
        parents.setdefault(k, k)
        while parents[k] != k:
            parents[k] = parents[parents[k]]; k = parents[k]
        return k
    for r in output:
        keys = ['human:'+k for k in r['humanGrouping']['groupKeys']] + ['component:'+r['splitGrouping']['component'], 'pixel:'+r['pixelFingerprint']]
        for k in keys[1:]: parents[root(k)] = root(keys[0])
    for s in ['train', 'val']:
        require(all(support[s].get('sign:'+sign, 0) > 0 for sign in signs), 'Every selected sign needs positive support in '+s)
        require(sum(r['split'] == s and r['outcome'] == 'NORMAL' for r in output) >= MINIMUM['normalTrainImages' if s == 'train' else 'normalValImages'], 'Insufficient reviewed normal images in '+s)
        for sign in signs:
            positive = [r for r in output if r['split'] == s and any(b['kind'] == 'sign' and b['label'] == sign for b in r['boundingBoxes'])]
            require(len(positive) >= MINIMUM[s+'ImagesPerSign'], 'Insufficient positive images for '+sign+' in '+s)
            require(len({root('human:'+r['humanGrouping']['groupKeys'][0]) for r in positive}) >= MINIMUM[s+'GroupsPerSign'], 'Insufficient independent groups for '+sign+' in '+s)
    if m.get('sourceProfiles'):
        from source_profiles import attribution
        assets['ATTRIBUTION.txt'] = attribution(m['sourceProfiles']).encode()
    assets['snapshots/catalog.json'] = (store.audit/'evidence/catalog.json').read_bytes()
    assets['snapshots/ontology.json'] = (store.audit/'evidence/ontology.json').read_bytes()
    result = {'schema': 'fixgo.studio.trial.v1', 'independentTest': False, 'records': output,
              'signs': signs, 'review': review, 'sourceManifestSha256': digest(manifest_bytes),
              'sourceProfiles': m.get('sourceProfiles', []), 'inventoryPins': m['inventoryPins'], 'supportBoxes': support, 'minimumTrialCriteria': MINIMUM,
              'limitations': ['Trial eligibility is not production approval; sample size and balance need evaluation.']}
    return publish(out, result, assets, classes, [REPO, store.state, store.inventory.parent, export_dir])


def freeze(store, packet_path, development, development_seal, out):
    """Freeze externally reviewed NEW images; never promotes Studio/pilot images to test."""
    check_pins(store)
    packet_path = Path(packet_path).resolve()
    p = json.loads(packet_path.read_text())
    dev = verify(development, development_seal)
    require(dev.get('schema') == 'fixgo.studio.trial.v1', 'Pin a prepared development trial')
    require(dev.get('inventoryPins') == json.loads((store.state/'inventory-pin.json').read_text()), 'Development inventory pins changed')
    require(p.get('schema') == 'fixgo.independent-test-intake.v1' and p.get('developmentSealSha256') == development_seal, 'Intake/development seal mismatch')
    require(text(p.get('custodian'), 2) and text(p.get('evidence'), 20), 'Custodian and independence evidence required')
    require(all(p.get(k) is True for k in ['newCollection', 'noDevelopmentUse', 'reviewedWithoutModelProposals', 'groupSeparationReviewed']), 'Explicit independence declarations required')
    signs = dev['signs']; classes = scope(store, signs)
    require(classes == [dev['classMapping'][str(i)] for i in range(len(dev['classMapping']))], 'Class/ontology scope changed')
    require(p.get('ontologySha256') == dev['inventoryPins']['ontology_sha256'], 'Ontology hash required')
    records = p.get('records', [])
    ids = [r['imageId'] for r in records]
    require(ids and len(ids) == len(set(ids)) and not set(ids) & set(store.rows), 'Test IDs must be new and unique')
    # Recompute fingerprints from all known source images, not only selected training data.
    # Near duplicates are candidates; conservative rejection requires a new collection.
    known_sha = {r['sha256'] for r in store.rows.values()}
    known_pixel, known_near = set(), []
    for row in store.rows.values():
        data = read_asset(row['path'])
        require(digest(data) == row['sha256'], 'Development source changed during separation audit')
        _, pixel, near = image_info(data)
        known_pixel.add(pixel); known_near.append(near)
    known_groups = {k for r in dev['records'] for k in r['humanGrouping']['groupKeys']}
    assets, output, test_pixels = {}, [], set()
    for r in records:
        safe_id(r['imageId'])
        require(r.get('split') == 'test' and r.get('priorExposure') == 'none' and r.get('realOrSynthetic') == 'real', 'Only new unexposed real test images')
        require(r.get('reviewer') != p['custodian'] and text(r.get('independenceEvidence'), 20), 'Separate reviewer and independence evidence required')
        path = local(packet_path.parent, r['imageFile'])
        require(not path.resolve().is_relative_to(Path(development).resolve()) and not path.resolve().is_relative_to(store.state), 'No development/state image as test')
        payload = path.read_bytes(); content_hash = digest(payload)
        require(content_hash == r.get('contentHash') and content_hash not in known_sha, 'Known/changed test image')
        size, pixel, near = image_info(payload)
        require(pixel not in known_pixel and pixel not in test_pixels, 'Decoded duplicate in development/test')
        require(all((near ^ n).bit_count() > 6 for n in known_near), 'Near-duplicate candidate against development inventory')
        row = {'width': str(size[0]), 'height': str(size[1]), 'exif_orientation': '1'}
        a = r.get('humanGrouping', {})
        require(not set(a.get('groupKeys', [])) & known_groups, 'Human group overlaps development')
        boxes = validate_record(store, r, row, signs, a)
        test_pixels.add(pixel)
        ext = path.suffix.lower()
        require(ext in ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'], 'Unsupported image extension')
        name = 'images/test/'+r['imageId']+ext
        assets[name] = payload
        assets['labels/test/'+r['imageId']+'.txt'] = lines_for(store, boxes, classes).encode()
        output.append({**copy.deepcopy(r), 'exportImage': name, 'pixelFingerprint': pixel})
    require(all(any(b['kind'] == 'sign' and b['label'] == s for r in output for b in r['boundingBoxes']) for s in signs), 'Test requires every selected sign')
    require(any(r['outcome'] == 'NORMAL' for r in output), 'Test requires reviewed normal images')
    assets['snapshots/catalog.json'] = (store.audit/'evidence/catalog.json').read_bytes()
    assets['snapshots/ontology.json'] = (store.audit/'evidence/ontology.json').read_bytes()
    manifest = {'schema': 'fixgo.independent-test.freeze.v1', 'status': 'frozen_pending_organizational_review',
                'independentTest': False, 'independenceDeclared': True, 'benchmarkApproved': False,
                'records': output, 'signs': signs, 'intakeSha256': sha(packet_path),
                'developmentSealSha256': development_seal, 'inventoryPins': dev['inventoryPins'],
                'declarations': {k: v for k, v in p.items() if k != 'records'},
                'separationAudit': {'inventoryImages': len(store.rows), 'nearDuplicateMethod': 'dhash64_hamming_le_6',
                                    'semanticIndependenceProven': False},
                'limitations': ['Declarations and conservative duplicate checks do not establish semantic independence or verify identity/rights. Keep seal externally; local hashes are not signatures.']}
    return publish(out, manifest, assets, classes, [REPO, store.state, store.inventory.parent, packet_path.parent, Path(development)])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for name in ['prepare', 'freeze']:
        cmd = sub.add_parser(name)
        cmd.add_argument('--inventory', type=Path, default=REPO/'docs/ai-data-audit/image-inventory.csv')
        cmd.add_argument('--state', type=Path, default=Path.home()/'.local/share/fixgo-dataset-studio')
        cmd.add_argument('--out', type=Path, required=True)
    prep = sub.choices['prepare']
    prep.add_argument('--export', type=Path, required=True)
    prep.add_argument('--review', type=Path, required=True)
    prep.add_argument('--signs', nargs='+', default=DEFAULT_SIGNS)
    fr = sub.choices['freeze']
    fr.add_argument('--packet', type=Path, required=True)
    fr.add_argument('--development', type=Path, required=True)
    fr.add_argument('--development-seal', required=True)
    check = sub.add_parser('verify')
    check.add_argument('--bundle', type=Path, required=True)
    check.add_argument('--seal', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'verify':
            m = verify(args.bundle, args.seal)
            print(canonical({'verified': True, 'schema': m['schema']})); return 0
        store = Studio(args.inventory, args.state)
        try:
            if args.command == 'prepare':
                result = prepare(store, args.export, json.loads(args.review.read_text()), args.signs, args.out)
            else:
                result = freeze(store, args.packet, args.development, args.development_seal, args.out)
            print(canonical(result))
        finally:
            store.close()
        return 0
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(canonical({'blocked': True, 'reason': str(error)})); return 2


if __name__ == '__main__':
    raise SystemExit(main())
