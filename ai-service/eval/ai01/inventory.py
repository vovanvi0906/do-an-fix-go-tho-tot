"""Read images only; exact/pixel duplicates and pHash candidates, never split originals."""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inventory(root, threshold=6):
    items, errors = [], []
    for p in sorted(root.rglob('*')):
        if p.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
            continue
        rel = p.relative_to(root)
        row = {'path': str(rel), 'split': rel.parts[0],
               'folderLabel': p.parent.name, 'sha256': digest(p.read_bytes()),
               'provenance': 'unverified_per_file', 'deviceId': None, 'sessionId': None}
        img = cv2.imread(str(p))
        if img is None:
            errors.append(str(rel))
            row['decodeError'] = True
        else:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            low = cv2.dct(cv2.resize(gray, (32, 32)).astype(np.float32))[:8, :8].flatten()
            # Ignore DC in both threshold and bits (63 effective bits).
            bits = low[1:] > np.median(low[1:])
            row.update(width=img.shape[1], height=img.shape[0],
                       pixelSha256=digest(img.tobytes()+str(img.shape).encode()),
                       phash=f'{sum(int(b) << i for i, b in enumerate(bits)):016x}')
        items.append(row)
    groups = defaultdict(list)
    pixels = defaultdict(list)
    for r in items:
        groups[r['sha256']].append(r['path'])
        if 'pixelSha256' in r:
            pixels[r['pixelSha256']].append(r['path'])
    near = []
    for i, a in enumerate(items):
        if 'phash' not in a:
            continue
        for b in items[i+1:]:
            if 'phash' not in b or a['sha256'] == b['sha256']:
                continue
            distance = (int(a['phash'], 16) ^ int(b['phash'], 16)).bit_count()
            if distance <= threshold:
                near.append({'a': a['path'], 'b': b['path'], 'distance': distance,
                             'crossSplit': a['split'] != b['split']})
    splits = {s: {'files': sum(r['split'] == s for r in items),
                  'uniqueSha256': len({r['sha256'] for r in items if r['split'] == s})}
              for s in sorted({r['split'] for r in items})}
    overlap = {f'{a}/{b}': len({r['sha256'] for r in items if r['split'] == a} &
                              {r['sha256'] for r in items if r['split'] == b})
               for a, b in [('train', 'val'), ('train', 'test'), ('val', 'test')]}
    return {'algorithm': {'exact': 'SHA256 bytes', 'pixel': 'OpenCV decoded BGR + shape',
                          'near': 'DCT pHash 32x32, 63 AC bits; candidates require human review',
                          'hammingThreshold': threshold}, 'files': len(items), 'splits': splits,
            'folderLabels': dict(Counter(r['folderLabel'] for r in items)),
            'uniqueSha256': len(groups), 'crossSplitSharedHashes': overlap,
            'exactDuplicateGroups': [v for v in groups.values() if len(v) > 1],
            'pixelDuplicateGroups': [v for v in pixels.values() if len(v) > 1],
            'nearCandidatePairs': len(near),
            'crossSplitNearCandidatePairs': sum(n['crossSplit'] for n in near),
            'decodeErrors': errors, 'independentSplitVerified': False,
            'items': items, 'nearCandidates': near}


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--root', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--threshold', type=int, default=6)
    a = p.parse_args()
    report = inventory(a.root, a.threshold)
    a.out.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({k: v for k, v in report.items() if k not in
                      {'items', 'nearCandidates', 'exactDuplicateGroups', 'pixelDuplicateGroups'}}, indent=2))
