"""Gate tests use generated fixtures only; no real image receives verification."""
import copy
import csv
import json
import random
import unittest
from pathlib import Path

from PIL import Image
import test_studio
from core import Studio, canonical, digest
from exporter import export, partition
from trial import prepare, freeze, verify, sha, validate_record


class TrialTests(unittest.TestCase):
    payload = test_studio.StudioTests.payload

    def setUp(self):
        test_studio.StudioTests.setUp(self)
        self.s.close()
        rows = list(self.s.rows.values())
        for n in range(4, 80):
            path = self.root/f'{n}.png'
            Image.new('RGB', (100, 100), (n*3, 40, 80)).save(path)
            rows.append({**rows[0], 'image_id': f'i{n}', 'path': str(path), 'sha256': sha(path), 'proposed_source_component': f'g{n}'})
        with self.inventory.open('w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
        # New pin in a separate state for the expanded fixture inventory.
        self.s = Studio(self.inventory, self.root/'expanded-state')
        splits, _ = partition(self.s, list(self.s.rows), 42)
        seen = {'train': 0, 'val': 0}
        for i, split in splits.items():
            p = self.payload(i, True)
            if seen[split] >= (5 if split == 'train' else 2):
                p['outcome'] = 'ABNORMAL'
                p['reviewChecks']['signTargetCompatibility'] = True
                p['boxes'].append({'id': 'sign1', 'kind': 'sign', 'label': 'burn_mark', 'xyxy': [.2,.2,.3,.3], 'objectId': 'object1'})
            seen[split] += 1
            self.s.save(p)
        self.export = Path(export(self.s, list(self.s.rows), 'yolo', 'source')['path'])
        self.review = {'schema': 'fixgo.studio.trial-review.v1', 'exportManifestSha256': sha(self.export/'manifest.json'),
                       'approvedForTrial': True, 'reviewer': 'Fixture supervisor', 'evidence': 'Fixture only organizational trial review',
                       'images': {i: {'reviewer': 'Fixture grouper', 'groupEvidence': 'Fixture independent device and scene', 'reviewedSigns': ['burn_mark'], 'groupKeys': [i+'-scene']} for i in self.s.rows}}
        self.out = self.root/'artifacts'/'trial-v1'

    def tearDown(self):
        test_studio.StudioTests.tearDown(self)

    def prepare(self):
        return prepare(self.s, self.export, self.review, ['burn_mark'], self.out)

    def packet(self, seal):
        folder = self.root/'intake'; folder.mkdir(exist_ok=True)
        records = []
        for n in range(2):
            rng = random.Random(100+n)
            im = Image.new('RGB', (100,100)); im.putdata([tuple(rng.randrange(256) for _ in range(3)) for _ in range(10000)])
            image = folder/f'new{n}.png'; im.save(image)
            p = self.payload('i0', True)
            r = {'imageId': f'new{n}', 'imageFile': image.name, 'contentHash': sha(image), 'split': 'test',
                 'priorExposure': 'none', 'realOrSynthetic': 'real', 'reviewStatus': p['reviewStatus'],
                 'reviewer': 'Fixture independent reviewer', 'reviewedAt': '2026-11-25T00:00:00Z',
                 'licenseStatus': p['licenseStatus'], 'licenseConfirmed': True, 'licenseType': p['licenseType'],
                 'licenseEvidence': p['licenseEvidence'], 'sourceEvidence': p['sourceEvidence'],
                 'reviewChecks': p['reviewChecks'], 'outcome': 'NORMAL', 'targetIds': ['t'],
                 'boundingBoxes': p['boxes'], 'independenceEvidence': 'Generated isolated fixture, never real test evidence',
                 'humanGrouping': {'reviewer': 'Fixture grouper', 'groupEvidence': 'Fixture isolated new device and session',
                                   'groupKeys': [f'new{n}-scene'], 'reviewedSigns': ['burn_mark']}}
            if n == 0:
                r['outcome'] = 'ABNORMAL'; r['reviewChecks']['signTargetCompatibility'] = True
                r['boundingBoxes'].append({'id': 'sign', 'kind': 'sign', 'label': 'burn_mark', 'xyxy': [.2,.2,.3,.3], 'objectId': 'object1'})
            records.append(r)
        packet = {'schema': 'fixgo.independent-test-intake.v1', 'developmentSealSha256': seal,
                  'ontologySha256': json.loads((self.s.state/'inventory-pin.json').read_text())['ontology_sha256'],
                  'custodian': 'Fixture custodian', 'evidence': 'Generated fixture intake; no real independence claim',
                  'newCollection': True, 'noDevelopmentUse': True, 'reviewedWithoutModelProposals': True,
                  'groupSeparationReviewed': True, 'records': records}
        path = folder/'packet.json'; path.write_text(canonical(packet))
        return path, packet

    def test_prepare_roundtrip_remapping_and_no_overwrite(self):
        result = self.prepare(); m = verify(self.out, result['sealSha256'])
        self.assertEqual(m['classMapping'], {'0': 'object:o-cam-dien', '1': 'sign:burn_mark'})
        self.assertEqual({r['split'] for r in m['records']}, {'train','val'})
        self.assertFalse(m['automaticallyApproved'])
        with self.assertRaises(ValueError): self.prepare()

    def test_stale_revision_and_label_tamper_block_before_publish(self):
        self.s.save(self.payload('i0', True))
        with self.assertRaisesRegex(ValueError, 'revision'): self.prepare()
        self.assertFalse(self.out.exists())

    def test_bad_export_label(self):
        label = next((self.export/'labels').rglob('*.txt')); label.write_text('99 0.5 0.5 1 1\n')
        with self.assertRaisesRegex(ValueError, 'labels'): self.prepare()
        self.assertFalse(self.out.exists())

    def test_coverage_rights_and_human_group_overlap(self):
        original = copy.deepcopy(self.review)
        self.review['images']['i0']['reviewedSigns'] = []
        with self.assertRaisesRegex(ValueError, 'coverage'): self.prepare()
        self.review = original
        for a in self.review['images'].values(): a['groupKeys'] = ['shared-device']
        with self.assertRaisesRegex(ValueError, 'crosses'): self.prepare()
        self.assertFalse(self.out.exists())

    def test_trial_approval_and_minimum_coverage(self):
        self.review['approvedForTrial'] = 'true'
        with self.assertRaisesRegex(ValueError, 'trial review'): self.prepare()
        self.review['approvedForTrial'] = True
        # A task without positive labels must never be ready just because export succeeded.
        self.s.signs['crack'] = {'name': 'Fixture crack'}
        for a in self.review['images'].values(): a['reviewedSigns'].append('crack')
        with self.assertRaisesRegex(ValueError, 'positive support'):
            prepare(self.s, self.export, self.review, ['burn_mark', 'crack'], self.out)
        self.assertFalse(self.out.exists())

    def test_freeze_traversal_and_seal_rejected(self):
        result = self.prepare(); path, packet = self.packet(result['sealSha256'])
        packet['records'][0]['imageFile'] = '../0.png'
        path.write_text(canonical(packet))
        with self.assertRaisesRegex(ValueError, 'Unsafe path'):
            freeze(self.s, path, self.out, result['sealSha256'], self.root/'artifacts'/'bad-path')
        with self.assertRaisesRegex(ValueError, 'seal'):
            freeze(self.s, path, self.out, '0'*64, self.root/'artifacts'/'bad-seal')

    def test_rights_unknown_outcome_and_orphan_blocked(self):
        r = copy.deepcopy(next(r for r in self.s.studio_latest.values() if r['outcome'] == 'ABNORMAL'))
        row = self.s.rows[r['imageId']]; a = self.review['images'][r['imageId']]
        for field, value in [('licenseConfirmed', 'true'), ('outcome', 'UNKNOWN')]:
            bad = copy.deepcopy(r); bad[field] = value
            with self.assertRaises(ValueError): validate_record(self.s, bad, row, ['burn_mark'], a)
        bad = copy.deepcopy(r); bad['boundingBoxes'][-1]['objectId'] = 'missing'
        with self.assertRaises(ValueError): validate_record(self.s, bad, row, ['burn_mark'], a)

    def test_excluded_sign_and_ambiguous_geometry_blocked(self):
        r = copy.deepcopy(next(r for r in self.s.studio_latest.values() if r['outcome'] == 'ABNORMAL'))
        row = self.s.rows[r['imageId']]; a = self.review['images'][r['imageId']]
        with self.assertRaisesRegex(ValueError, 'excluded sign'):
            validate_record(self.s, r, row, ['crack'], a)
        r['boundingBoxes'].append({**r['boundingBoxes'][0], 'id': 'overlapping-object'})
        with self.assertRaisesRegex(ValueError, 'ambiguous'):
            validate_record(self.s, r, row, ['burn_mark'], a)

    def test_seal_tamper_and_extra_file(self):
        result = self.prepare()
        (self.out/'extra.txt').write_text('extra')
        with self.assertRaisesRegex(ValueError, 'file set'): verify(self.out, result['sealSha256'])
        (self.out/'extra.txt').unlink()
        (self.out/'data.yaml').write_text('changed')
        with self.assertRaisesRegex(ValueError, 'checksum'): verify(self.out, result['sealSha256'])

    def test_freeze_new_intake_and_verify(self):
        result = self.prepare(); packet, _ = self.packet(result['sealSha256'])
        out = self.root/'artifacts'/'test-v1'
        frozen = freeze(self.s, packet, self.out, result['sealSha256'], out)
        m = verify(out, frozen['sealSha256'])
        self.assertEqual(m['status'], 'frozen_pending_organizational_review')
        self.assertFalse(m['independentTest']); self.assertFalse(m['benchmarkApproved'])
        self.assertEqual({r['split'] for r in m['records']}, {'test'})

    def test_freeze_rejects_known_images_groups_and_exposure(self):
        result = self.prepare(); path, packet = self.packet(result['sealSha256'])
        original = copy.deepcopy(packet)
        for mutation in ['exposure', 'group', 'known']:
            p = copy.deepcopy(original)
            if mutation == 'exposure': p['noDevelopmentUse'] = 'true'
            if mutation == 'group': p['records'][0]['humanGrouping']['groupKeys'] = ['i0-scene']
            if mutation == 'known':
                source = Path(self.s.rows['i0']['path']); destination = path.parent/'known.png'
                destination.write_bytes(source.read_bytes())
                p['records'][0]['imageFile'] = destination.name; p['records'][0]['contentHash'] = sha(destination)
            path.write_text(canonical(p))
            with self.assertRaises(ValueError): freeze(self.s, path, self.out, result['sealSha256'], self.root/'artifacts'/('bad-'+mutation))
            self.assertFalse((self.root/'artifacts'/('bad-'+mutation)).exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
