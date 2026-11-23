"""Freeze inputs before evaluation. Never derive parameters from test scores."""
import argparse
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_hashes():
    root = Path(__file__).resolve().parents[3]
    paths = []
    for directory in ('ai-service/eval/ai01', 'ai-service/recommendation',
                      'server/src/modules/orders/diagnosis', 'server/src/modules/symptoms'):
        paths.extend(p for p in (root/directory).glob('*') if p.suffix in {'.py', '.js'})
    paths.extend(root/p for p in ('ai-service/clip_classifier.py', 'ai-service/category_helper.py',
        'ai-service/target_catalog.py', 'ai-service/service_catalog.py',
        'server/scripts/ai01-resolver-offline.cjs', 'server/package-lock.json'))
    return {str(p.relative_to(root)): sha(p) for p in sorted(paths)}


def clip_artifact():
    from huggingface_hub import try_to_load_from_cache
    for name in ('model.safetensors', 'pytorch_model.bin'):
        cached = try_to_load_from_cache('openai/clip-vit-base-patch32', name)
        if isinstance(cached, str) and Path(cached).is_file():
            return {'sha256': sha(cached), 'revision': Path(cached).parent.name}
    raise RuntimeError('CLIP must already exist in local cache')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    for key in ('dataset', 'catalog', 'weights', 'out'):
        p.add_argument('--'+key, type=Path, required=True)
    p.add_argument('--split', choices=['validation', 'test'], required=True)
    p.add_argument('--threshold', type=float, default=.6)
    p.add_argument('--rationale', required=True, help='Development-only selection record; no test-driven tuning')
    a = p.parse_args()
    if not 0 <= a.threshold <= 1:
        p.error('threshold outside [0,1]')
    with a.out.open('x') as f:
        json.dump({'frozenAt': datetime.now(timezone.utc).isoformat(), 'split': a.split,
                   'datasetSha256': sha(a.dataset), 'catalogSha256': sha(a.catalog),
                   'weightsSha256': sha(a.weights), 'resolverThreshold': a.threshold,
                   'symptomCatalogEnabled': False, 'rationale': a.rationale,
                   'sourceHashes': source_hashes(), 'clipArtifact': clip_artifact(),
                   'modalities': ['image-only', 'text-only', 'image+text']}, f, indent=2)
