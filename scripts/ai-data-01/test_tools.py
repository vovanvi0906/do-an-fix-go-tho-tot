"""Meaningful isolation, dedup search and annotation safety tests; fixtures only in /tmp."""
import csv,hashlib,json,random,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
from PIL import Image
from common import BKTree,parse_yolo,image_facts,choose_pilot
from review import Store,server

class DataToolsTests(unittest.TestCase):
    def test_exact_hamming_search_matches_bruteforce(self):
        rng=random.Random(42);values={rng.getrandbits(63) for _ in range(120)};base=next(iter(values));values.update(base^(1<<i) for i in range(12));tree=BKTree()
        for v in values:tree.add(v)
        for query in [base,*list(values)[:10]]:
            self.assertEqual(set(tree.search(query,6)),{(v,(v^query).bit_count()) for v in values if (v^query).bit_count()<=6})
    def test_pilot_never_reuses_a_component_across_targets(self):
        slugs=['o-cam-dien','may-lanh-dieu-hoa','voi-nuoc-voi-sen','tu-lanh-tu-lanh-side-by-side','may-giat-may-giat-say'];targets={s:{'id':s,'slug':s} for s in slugs};rows=[]
        for slug in slugs:
            for n,group in enumerate(['shared',slug+'-one',slug+'-two']):rows.append(dict(image_id=slug+str(n),path='TEST_ONLY',corpus='raw_source',direct_object_candidate_ids_json=json.dumps([slug]),decode_status='OK',annotation_status='PARSED_SOURCE_UNVERIFIED',prepared_development_split='val',proposed_source_component=group,component_exposure_json='[]'))
        queue=choose_pilot(rows,targets,2);self.assertEqual(len(queue),10);self.assertEqual(len({r['proposed_source_component'] for r in queue}),10);self.assertTrue(all(not r['independent_test_eligible'] for r in queue))
    def test_bbox_and_polygon_invalid_geometry_not_accepted(self):
        annotations,issues=parse_yolo('0 0.5 0.5 0.4 0.4\n0 0 0 1 0 1 1\n0 nan 0.5 0.2 0.2\n1 0.5 0.5 0.5 0.5\n0 0.99 0.5 0.5 0.5',['outlet'],100,100)
        self.assertEqual([a['format'] for a in annotations],['bbox','polygon']);self.assertEqual(len(issues),3)
    def test_unreadable_image_keeps_byte_hash_in_inventory(self):
        from audit import inspect
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'bad.jpg';p.write_bytes(b'not an image');row=inspect({'path':str(p),'_names':[]})
            self.assertEqual(row['decode_status'],'UNUSABLE_OR_READ_ERROR');self.assertEqual(row['sha256'],hashlib.sha256(p.read_bytes()).hexdigest())
    def fixture(self,root):
        audit=root/'audit';(audit/'evidence').mkdir(parents=True);image=root/'source.png';Image.new('RGB',(64,64),'white').save(image);sha=hashlib.sha256(image.read_bytes()).hexdigest();inventory=audit/'image-inventory.csv'
        rows=[dict(image_id='one',path=str(image),sha256=sha,width=64,height=64),dict(image_id='two',path=str(image),sha256=sha,width=64,height=64)]
        with inventory.open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
        (audit/'evidence/catalog.json').write_text(json.dumps({'targets':[{'id':'outlet','categoryId':'electric','name':'Outlet'}]}));(audit/'evidence/ontology.json').write_text(json.dumps({'signs':{'burn_mark':{'name':'Burn'}}}))
        return Store(inventory,root/'review-state'),image,sha
    def payload(self,sha):return dict(image_ids=['one'],decision='label_proposal',reviewer='TEST ONLY REVIEWER',note='TEST ONLY observed fixture',target_ids=['outlet'],sign_labels=[],boxes=[dict(kind='object',label='outlet',xyxy=[.1,.1,.9,.9])],expected_sha256={'one':sha})
    def test_review_proposals_never_change_source_or_approve(self):
        with tempfile.TemporaryDirectory() as tmp:
            store,image,sha=self.fixture(Path(tmp));before=image.read_bytes();store.propose(self.payload(sha));e=store.events[-1]
            self.assertFalse(e['approved_ground_truth']);self.assertFalse(e['training_eligible']);self.assertFalse(e['rights_verified']);self.assertEqual(before,image.read_bytes());self.assertEqual(image_facts(str(image))['sha256'],sha);store.close()
    def test_no_batch_bbox_copy_or_fake_approval_or_stale_image(self):
        with tempfile.TemporaryDirectory() as tmp:
            store,image,sha=self.fixture(Path(tmp));p=self.payload(sha);p.update(image_ids=['one','two'],expected_sha256={'one':sha,'two':sha})
            with self.assertRaises(ValueError):store.propose(p)
            p=self.payload(sha);p['approved_ground_truth']=True
            with self.assertRaises(ValueError):store.propose(p)
            image.write_bytes(b'changed fixture')
            with self.assertRaises(ValueError):store.propose(self.payload(sha))
            self.assertFalse(store.log.exists());store.close()
    def test_review_state_is_pinned_to_inventory_revision(self):
        with tempfile.TemporaryDirectory() as tmp:
            store,image,sha=self.fixture(Path(tmp));inventory=store.inventory;state=store.state;store.close();inventory.write_text(inventory.read_text().replace('64,64','128,64'))
            with self.assertRaises(ValueError):Store(inventory,state)
            self.assertFalse((state/'proposals.jsonl').exists())
    def test_negative_proposal_cannot_bulk_confirm_or_contradict_boxes(self):
        with tempfile.TemporaryDirectory() as tmp:
            store,image,sha=self.fixture(Path(tmp));p=self.payload(sha);p.update(image_ids=['one','two'],boxes=[],expected_sha256={'one':sha,'two':sha},sign_observation='none_visible_candidate')
            with self.assertRaises(ValueError):store.propose(p)
            p=self.payload(sha);p.update(boxes=[{'kind':'sign','label':'burn_mark','xyxy':[.1,.1,.8,.8]}],sign_observation='none_visible_candidate')
            with self.assertRaises(ValueError):store.propose(p)
            self.assertFalse(store.log.exists());store.close()
    def test_log_tamper_is_not_silently_repaired(self):
        with tempfile.TemporaryDirectory() as tmp:
            store,image,sha=self.fixture(Path(tmp));store.propose(self.payload(sha));store.log.write_text(store.log.read_text()+'{}\n')
            with self.assertRaises(ValueError):store.propose(self.payload(sha))
            store.close()
    def test_loopback_api_requires_token_and_serves_only_inventory_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            store,image,sha=self.fixture(Path(tmp));http=server(store);thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start();base=f'http://127.0.0.1:{http.server_address[1]}'
            try:
                self.assertEqual(http.server_address[0],'127.0.0.1')
                config=json.load(urllib.request.urlopen(base+'/api/config'));body=json.dumps(self.payload(sha)).encode();req=urllib.request.Request(base+'/api/propose',body,headers={'Content-Type':'application/json'})
                with self.assertRaises(urllib.error.HTTPError) as cm:urllib.request.urlopen(req)
                self.assertEqual(cm.exception.code,403);cm.exception.close()
                req.add_header('X-Audit-Token',config['token']);self.assertEqual(json.load(urllib.request.urlopen(req))['saved'],1)
                with self.assertRaises(urllib.error.HTTPError) as cm:urllib.request.urlopen(base+'/api/image?id=../../etc/passwd')
                cm.exception.close()
                self.assertEqual(hashlib.sha256(image.read_bytes()).hexdigest(),sha)
            finally:http.shutdown();http.server_close();thread.join();store.close()

if __name__=='__main__':unittest.main()
