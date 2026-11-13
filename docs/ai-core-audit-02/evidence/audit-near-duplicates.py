"""Read-only synthetic catalog dataset inspection, no writes/model loading. Emit JSON."""
from pathlib import Path
import hashlib
import json
from collections import Counter
import cv2
ROOT = Path(__file__).resolve().parents[3] / 'ai-service/dataset'
items = []
for p in sorted(ROOT.rglob('*.jpg')):
    image = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
    small = cv2.resize(image, (9, 8))
    bits = (small[:, 1:] > small[:, :-1]).flatten()
    value = sum(int(bit) << i for i, bit in enumerate(bits))
    split, label = p.relative_to(ROOT).parts[:2]
    items.append((str(p.relative_to(ROOT)), split, label, hashlib.sha256(p.read_bytes()).hexdigest(), value))
pairs = Counter()
for i, a in enumerate(items):
    for b in items[i + 1:]:
        if a[1] == b[1] or a[3] == b[3]: continue
        if (a[4] ^ b[4]).bit_count() <= 4:
            pairs['/'.join(sorted((a[1], b[1]))) ] += 1
print(json.dumps({'method':'dHash64 Hamming<=4 cross split excluding SHA256 equality','nearDuplicateCandidatePairs':dict(pairs),'limitation':'Candidate pairs, not manually confirmed duplicate photos'}, indent=2))
