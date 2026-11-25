"""Propose group splits in a NEW JSONL; never copy/move/remove images."""
import argparse
import hashlib
import json
from pathlib import Path
from annotation import Sample


def propose(samples, seed):
    parent = list(range(len(samples)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    seen, incomplete = {}, set()
    for i, s in enumerate(samples):
        if not all((s.provenance.deviceId, s.provenance.sessionId, s.provenance.duplicateGroup)):
            incomplete.add(i)
        keys = [('sha256', s.sha256)] + [(key, getattr(s.provenance, key)) for key in
                ('deviceId', 'sessionId', 'siteId', 'duplicateGroup') if getattr(s.provenance, key)]
        for key in keys:
            if key in seen:
                parent[find(i)] = find(seen[key])
            seen[key] = i
    quarantined = {find(i) for i in incomplete}
    members = {}
    for i, s in enumerate(samples):
        members.setdefault(find(i), []).append(s.id)
    assigned = {}
    for group, ids in members.items():
        score = int(hashlib.sha256((seed+'|'+ '|'.join(sorted(ids))).encode()).hexdigest()[:8], 16) / 2**32
        assigned[group] = 'quarantine' if group in quarantined else (
            'train' if score < .7 else 'validation' if score < .85 else 'test')
    return [s.model_copy(update={'split': assigned[find(i)]}) for i, s in enumerate(samples)]


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--dataset', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--seed', default='fixgo-ai01-v1')
    a = p.parse_args()
    data = [Sample.model_validate_json(line) for line in a.dataset.read_text().splitlines() if line.strip()]
    with a.out.open('x') as f:
        for sample in propose(data, a.seed):
            f.write(sample.model_dump_json()+'\n')
