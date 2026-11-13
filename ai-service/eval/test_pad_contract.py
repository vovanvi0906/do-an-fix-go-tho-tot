import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).parents[1]))
from pad_contract import PadEvidence, UnavailablePad

class PadContractTests(unittest.TestCase):
    def test_default_never_passes(self):
        for capture in [None, b'synthetic', 'face-detected']:
            self.assertEqual(UnavailablePad().assess(capture).decision, 'NOT_EVALUATED')
    def test_decisions_need_provenance(self):
        for decision in ['PASS', 'FAIL', 'unknown']:
            with self.assertRaises(ValueError): PadEvidence(decision)
        self.assertEqual(PadEvidence('INCONCLUSIVE').decision, 'INCONCLUSIVE')
