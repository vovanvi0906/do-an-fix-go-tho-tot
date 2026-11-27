"""Dataset inheritance gates using synthetic fixtures; no real dataset rights verified."""
import json
import unittest
import test_studio
from pathlib import Path
from core import canonical
from exporter import export
from source_profiles import identity


class ProfileTests(unittest.TestCase):
    payload = test_studio.StudioTests.payload

    def setUp(self):
        test_studio.StudioTests.setUp(self)
        claim = {'workspace': 'outletv2', 'project': 'outlet-4xvv4', 'version': 1,
                 'url': 'https://universe.roboflow.com/outletv2/outlet-4xvv4/dataset/1'}
        for i in ['i0', 'i1']:
            self.s.rows[i]['corpus'] = 'raw_source'
            self.s.rows[i]['source_claim_json'] = canonical(claim)
        from source_profiles import Profiles
        self.s.source_profiles = Profiles(self.s)
        self.dataset = self.s.source_profiles.for_row(self.s.rows['i0'])

    def tearDown(self):
        test_studio.StudioTests.tearDown(self)

    def profile_payload(self):
        old = self.s.source_profiles.latest.get(self.dataset['id'])
        return {'datasetId': self.dataset['id'], 'expectedRevision': (old or {}).get('eventHash'),
                'reviewer': 'Fixture owner', 'sourceEvidence': 'Generated fixture source; not a real source attestation',
                'licenseStatus': 'VERIFIED', 'licenseType': 'licensed', 'licenseConfirmed': True,
                'licenseEvidence': 'Generated fixture rights evidence; never applies to real images'}

    def test_imported_roboflow_corpus_retains_exact_source_identity(self):
        row=dict(self.s.rows['i0'],corpus='roboflow-dirty-air-filter-v2')
        self.assertEqual(identity(row),identity(self.s.rows['i0']))
        claim=json.loads(row['source_claim_json']);claim['url']='https://example.com/wrong';row['source_claim_json']=canonical(claim)
        self.assertIsNone(identity(row))
        self.assertIsNone(identity(dict(self.s.rows['i0'],corpus='user_synthetic_zip')))

    def test_one_profile_inherited_without_bulk_verification(self):
        payload = self.profile_payload(); payload['licenseEvidence'] = '  '+payload['licenseEvidence']+'  '
        saved = self.s.source_profiles.save(payload)
        self.assertEqual(saved['licenseEvidence'], payload['licenseEvidence'].strip())
        self.assertNotEqual(self.s.status('i0'), 'HUMAN_VERIFIED')
        self.assertEqual(self.s.studio_latest, {})
        for i in ['i0','i1']:
            p = self.payload(i, True); p['sourceProfileHash'] = saved['eventHash']
            p['licenseEvidence'] = 'Injected client evidence must not override profile'
            event = self.s.save(p)
            self.assertEqual(event['licenseEvidence'], saved['licenseEvidence'])
            self.assertEqual(event['sourceProfileHash'], saved['eventHash'])
        result = export(self.s, ['i0','i1'], 'yolo', 'inherited')
        manifest = json.loads((Path(result['path'])/'manifest.json').read_text())
        self.assertEqual(len(manifest['records']), 2)
        self.assertEqual(manifest['sourceProfiles'][0]['eventHash'], saved['eventHash'])

    def test_profile_cannot_cross_dataset_version_or_synthetic(self):
        saved = self.s.source_profiles.save(self.profile_payload())
        for variant in ['unrelated', 'version', 'synthetic']:
            row = dict(self.s.rows['i0'])
            if variant == 'unrelated': row = dict(self.s.rows['i2'])
            elif variant == 'version':
                claim = json.loads(row['source_claim_json']); claim.update(version=2, url='https://universe.roboflow.com/outletv2/outlet-4xvv4/dataset/2'); row['source_claim_json'] = canonical(claim)
            else: row['corpus'] = 'user_synthetic_zip'
            with self.assertRaises(ValueError): self.s.source_profiles.inherit(row, saved['eventHash'])

    def test_confirmation_types_revision_and_revocation(self):
        bad = self.profile_payload(); bad['licenseConfirmed'] = 'true'
        with self.assertRaises(ValueError): self.s.source_profiles.save(bad)
        first = self.s.source_profiles.save(self.profile_payload())
        p = self.payload(verified=True); p['sourceProfileHash'] = first['eventHash']; self.s.save(p)
        bad = self.profile_payload(); bad['expectedRevision'] = None
        with self.assertRaises(ValueError): self.s.source_profiles.save(bad)
        revoke = self.profile_payload(); revoke.update(licenseStatus='RESTRICTED', licenseConfirmed=False)
        self.s.source_profiles.save(revoke)
        with self.assertRaises(ValueError): export(self.s, ['i0'], 'metadata', 'revoked')
        with self.assertRaises(ValueError): self.s.save(self.payload_with_hash(first['eventHash']))

    def payload_with_hash(self, value):
        return {**self.payload(verified=True), 'sourceProfileHash': value}

    def test_audit_reload_and_tamper(self):
        from source_profiles import Profiles
        saved = self.s.source_profiles.save(self.profile_payload())
        loaded = Profiles(self.s)
        self.assertEqual(loaded.latest[self.dataset['id']]['eventHash'], saved['eventHash'])
        self.s.source_profiles.path.write_text(self.s.source_profiles.path.read_text().replace('Fixture owner', 'Tampered owner'))
        with self.assertRaises(ValueError): self.s.source_profiles.list()
        with self.assertRaises(ValueError): Profiles(self.s)

    def test_restore_removes_inheritance_and_confirmation(self):
        profile = self.s.source_profiles.save(self.profile_payload())
        event = self.s.save(self.payload_with_hash(profile['eventHash']))
        restored = self.s.restore({'imageId': 'i0', 'revision': event['eventHash'], 'expectedRevision': event['eventHash'],
                                  'reviewer': 'Fixture owner', 'note': 'Restore isolated fixture only'})
        self.assertIsNone(restored['sourceProfileHash']); self.assertFalse(restored['licenseConfirmed'])
        self.assertEqual(restored['reviewStatus'], 'NEEDS_REVIEW')


if __name__ == '__main__':
    unittest.main(verbosity=2)
