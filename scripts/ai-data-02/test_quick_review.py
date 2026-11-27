"""Single explicit confirmation preserves review/geometry/rights gates."""
import unittest
import test_studio
from exporter import export


class QuickReviewTests(unittest.TestCase):
    payload = test_studio.StudioTests.payload

    def setUp(self):
        test_studio.StudioTests.setUp(self)

    def tearDown(self):
        test_studio.StudioTests.tearDown(self)

    def test_single_action_records_confirmation(self):
        p = self.payload(verified=True)
        p['reviewChecks'] = {}
        p['reviewAction'] = 'confirm_visible_labels'
        saved = self.s.save(p)
        self.assertEqual(saved['reviewAction'], 'confirm_visible_labels')
        self.assertTrue(all(saved['reviewChecks'].values()))
        self.assertFalse(saved['approvedGroundTruth'])

    def test_action_does_not_resolve_unknown_or_missing_sign(self):
        for outcome in ['UNKNOWN', 'ABNORMAL']:
            p = self.payload(verified=True)
            p.update(reviewAction='confirm_visible_labels', reviewChecks={}, outcome=outcome)
            with self.assertRaises(ValueError): self.s.save(p)
        for action in [True, 'auto_verify', '']:
            p = self.payload(verified=True); p['reviewAction'] = action
            with self.assertRaises(ValueError): self.s.save(p)
        p = self.payload(); p['reviewAction'] = 'confirm_visible_labels'
        with self.assertRaises(ValueError): self.s.save(p)

    def test_action_never_grants_rights_or_bypasses_revision(self):
        p = self.payload(verified=True)
        p.update(reviewAction='confirm_visible_labels', reviewChecks={}, licenseStatus='UNVERIFIED', licenseConfirmed=False)
        self.s.save(p)
        with self.assertRaises(ValueError): export(self.s, ['i0'], 'yolo', 'blocked-rights')
        with self.assertRaises(ValueError): self.s.save(p)


if __name__ == '__main__':
    unittest.main(verbosity=2)
