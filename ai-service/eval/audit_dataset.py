"""Read-only split leakage audit. Exit 1 if exact duplicates cross splits."""
import hashlib
import json
from pathlib import Path


def audit_dataset(root):
    splits = {}
    for split in ('train', 'val', 'test'):
        paths = [p for p in (Path(root) / split).rglob('*')
                 if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')]
        hashes = {hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        splits[split] = {'files': len(paths), 'hashes': hashes}
    overlaps = {f'{a}/{b}': len(splits[a]['hashes'] & splits[b]['hashes'])
                for a, b in [('train', 'val'), ('train', 'test'), ('val', 'test')]}
    return {'splits': {s: {'files': v['files'], 'unique': len(v['hashes'])}
                       for s, v in splits.items()}, 'overlaps': overlaps,
            'valid': not any(overlaps.values()) and all(v['files'] for v in splits.values())}


if __name__ == '__main__':
    report = audit_dataset(Path(__file__).resolve().parent.parent / 'dataset')
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['valid'] else 1)
