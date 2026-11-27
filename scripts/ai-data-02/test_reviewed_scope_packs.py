import json,tempfile,unittest
from pathlib import Path
from build_reviewed_scope_packs import checked,latest_events
from multiservice_data import sha

class ReviewSafetyTests(unittest.TestCase):
    def test_invalid_geometry_is_rejected(self):
        for box in [[0,0,0,1],[-.1,0,1,1],[0,0,float('nan'),1],[0,0,1,1.01]]:
            with self.assertRaises(ValueError):checked(box)
    def test_latest_revision_and_tampering(self):
        first={'reviewId':'W001','previousHash':'0'*64,'decision':{'action':'QUARANTINE'}}
        first['eventHash']=sha(json.dumps(first,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())
        second={'reviewId':'W001','previousHash':first['eventHash'],'supersedesEventHash':first['eventHash'],'decision':{'action':'REVISE_SIGN_REGIONS'}}
        second['eventHash']=sha(json.dumps(second,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode())
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'events.jsonl';path.write_text('\n'.join(map(json.dumps,[first,second])))
            latest,head=latest_events(path);self.assertEqual(latest['W001']['decision']['action'],'REVISE_SIGN_REGIONS');self.assertEqual(head,second['eventHash'])
            first['decision']['action']='CHANGED';path.write_text('\n'.join(map(json.dumps,[first,second])))
            with self.assertRaises(ValueError):latest_events(path)

if __name__=='__main__':unittest.main()
