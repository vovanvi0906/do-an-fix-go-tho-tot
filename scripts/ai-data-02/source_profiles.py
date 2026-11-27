"""Dataset-scoped provenance/rights declarations; never changes image review status."""
import json
from pathlib import Path
from core import canonical, digest, now

FIELDS = ['sourceEvidence', 'licenseStatus', 'licenseType', 'licenseEvidence', 'licenseConfirmed']


def identity(row):
    corpus=row.get('corpus','')
    if corpus != 'raw_source' and not corpus.startswith('roboflow-'):
        return None
    claim = json.loads(row.get('source_claim_json') or '{}')
    workspace, project, version = claim.get('workspace'), claim.get('project'), claim.get('version')
    if not all(isinstance(x, str) and x for x in [workspace, project]) or type(version) is not int or version < 1:
        return None
    url = f'https://universe.roboflow.com/{workspace}/{project}/dataset/{version}'
    if claim.get('url') != url:
        return None
    return {'id': digest(url.encode()), 'url': url, 'workspace': workspace, 'project': project, 'version': version}


def attribution(profiles):
    lines = ['# Dataset sources and rights declarations',
             'Images copied without re-encoding. Bounding-box labels reviewed/edited in Studio; trial class IDs may be remapped. Original preprocessing/augmentation belongs to the source version.', '']
    for profile in profiles:
        lines += [profile['sourceEvidence'], profile['url'], profile['licenseEvidence'],
                  'Profile confirmed by '+profile['reviewer']+' at '+profile['reviewedAt'], '']
    return '\n'.join(lines)+'\n'


class Profiles:
    def __init__(self, store):
        self.store = store
        self.path = store.state/'source-profiles.jsonl'
        self.head = '0'*64
        self.latest = {}
        self.datasets = {}
        for row in store.rows.values():
            entry = identity(row)
            if entry:
                found = self.datasets.setdefault(entry['id'], {**entry, 'images': 0})
                found['images'] += 1
        if self.path.is_symlink():
            raise ValueError('Symlink profile log refused')
        if self.path.exists():
            for line in self.path.read_text().splitlines():
                event = json.loads(line)
                body = {k: v for k, v in event.items() if k != 'eventHash'}
                if event['previousHash'] != self.head or digest(canonical(body).encode()) != event['eventHash']:
                    raise ValueError('Dataset profile audit corrupted')
                self.head = event['eventHash']
                self.latest[event['datasetId']] = event
        self.log_hash = digest(self.path.read_bytes()) if self.path.exists() else None
        self.seeds = json.loads(Path(__file__).with_name('roboflow-sources.json').read_text())

    def check(self):
        if self.path.is_symlink() or (digest(self.path.read_bytes()) if self.path.exists() else None) != self.log_hash:
            raise ValueError('Dataset profile log changed outside writer')

    def list(self):
        self.check()
        return [self.describe(d) for d in self.datasets.values()]

    def describe(self, dataset):
        seed = next((s for s in self.seeds if s['url'] == dataset['url']), None)
        return {**dataset, 'publicObservation': seed, 'profile': self.latest.get(dataset['id'])}

    def for_row(self, row):
        entry = identity(row)
        return self.describe(self.datasets[entry['id']]) if entry and entry['id'] in self.datasets else None

    def save(self, payload):
        import os
        with self.store.mutex:
            self.store.check_studio(); self.check()
            allowed = {'datasetId', 'expectedRevision', 'reviewer', *FIELDS}
            if not isinstance(payload, dict) or set(payload)-allowed:
                raise ValueError('Unknown dataset profile fields')
            dataset_id = payload.get('datasetId')
            if dataset_id not in self.datasets:
                raise ValueError('Unknown exact dataset/version')
            old = self.latest.get(dataset_id)
            if payload.get('expectedRevision') != (old or {}).get('eventHash'):
                raise ValueError('Dataset profile changed: reload')
            reviewer = payload.get('reviewer')
            if not isinstance(reviewer, str) or not 2 <= len(reviewer.strip()) <= 200:
                raise ValueError('Reviewer name required')
            for field, minimum in [('sourceEvidence', 10), ('licenseEvidence', 20)]:
                if not isinstance(payload.get(field), str) or not minimum <= len(payload[field].strip()) <= 5000:
                    raise ValueError('Dataset source and rights evidence required')
            if payload.get('licenseStatus') not in ['VERIFIED', 'UNVERIFIED', 'RESTRICTED'] or type(payload.get('licenseConfirmed')) is not bool:
                raise ValueError('Invalid profile status/confirmation')
            if payload['licenseStatus'] == 'VERIFIED' and (payload['licenseConfirmed'] is not True or payload.get('licenseType') not in ['owned', 'licensed', 'permission']):
                raise ValueError('Explicit dataset rights confirmation required')
            event = {'schema': 'fixgo.studio.source-profile.v1', 'datasetId': dataset_id,
                     'url': self.datasets[dataset_id]['url'], 'reviewer': reviewer.strip(), 'reviewedAt': now(),
                     'previousHash': self.head, 'parentRevision': (old or {}).get('eventHash'),
                     **{k: payload.get(k) for k in FIELDS}}
            event['sourceEvidence'] = event['sourceEvidence'].strip()
            event['licenseEvidence'] = event['licenseEvidence'].strip()
            event['eventHash'] = digest(canonical(event).encode())
            with self.path.open('a', encoding='utf-8') as stream:
                stream.write(canonical(event)+'\n'); stream.flush(); os.fsync(stream.fileno())
            self.head = event['eventHash']; self.latest[dataset_id] = event
            self.log_hash = digest(self.path.read_bytes())
            return event

    def inherit(self, row, profile_hash):
        self.check()
        source = self.for_row(row)
        profile = (source or {}).get('profile')
        if not profile or profile['eventHash'] != profile_hash or profile['licenseStatus'] != 'VERIFIED':
            raise ValueError('Dataset profile missing, changed or not verified')
        return {k: profile[k] for k in FIELDS}

    def validate_record(self, row, record):
        if record.get('sourceProfileHash'):
            expected = self.inherit(row, record['sourceProfileHash'])
            if any(record.get(k) != v for k, v in expected.items()):
                raise ValueError('Annotation provenance differs from pinned dataset profile')
