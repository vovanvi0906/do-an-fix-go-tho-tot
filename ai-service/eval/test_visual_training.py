import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from training.visual_service_training import audit, read_journal, prepare_trial

def hashed(e):
    return {**e,'eventHash':hashlib.sha256(json.dumps(e,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()}

class VisualTrainingGates(unittest.TestCase):
    def test_empty_real_state_is_a_blocker_not_a_fake_training_success(self):
        with tempfile.TemporaryDirectory() as d:
            report,rows=audit(Path(d));self.assertFalse(report['readyForTrialTraining']);self.assertEqual(report['reviewedImages'],0);self.assertEqual(rows,[])
            self.assertFalse((Path(d)/'bbox-quality-v1').exists())
    def test_tampered_journal_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            state=Path(d);(state/'bbox-quality-v1').mkdir();(state/'bbox-quality-v1/events.jsonl').write_text(json.dumps({'kind':'bbox_revision','previousHash':'0'*64,'eventHash':'fake'})+'\n')
            with self.assertRaises(ValueError):read_journal(state)
    def export_fixture(self,state,**changes):
        home=state/'bbox-quality-v1';home.mkdir()
        e=hashed(dict(kind='bbox_revision',imageId='img-00000',status='confirmed',boxes=[],previousHash='0'*64,userId='TEST-ONLY',split='train',leakageGroup='test-group',approvedGroundTruth=False,benchmarkEligible=False,rightsVerified=True,rightsEvidence='TEST-ONLY',sourceEvidence='TEST-ONLY',groupEvidence='TEST-ONLY',objectReview='none_visible',signReview='none_visible') | changes)
        folder=home/'exports/bbox-development-fixture';folder.mkdir(parents=True)
        records=folder/'records.jsonl';records.write_text(json.dumps(e)+'\n')
        pins=folder/'SHA256SUMS.json';pins.write_text(json.dumps({'records.jsonl':hashlib.sha256(records.read_bytes()).hexdigest()}))
        export=hashed(dict(kind='bbox_export',previousHash=e['eventHash'],userId=e['userId'],folder=folder.name,sha256=hashlib.sha256(pins.read_bytes()).hexdigest(),imageIds=[e['imageId']]))
        (home/'events.jsonl').write_text(json.dumps(e)+'\n'+json.dumps(export)+'\n')
        return folder,e
    def test_an_arbitrary_dataset_cannot_bypass_existing_export_audit(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):audit(Path(d),Path(d)/'arbitrary')
    def test_records_must_match_current_journal_and_have_frozen_development_split(self):
        with tempfile.TemporaryDirectory() as d:
            state=Path(d);folder,e=self.export_fixture(state);report,rows=audit(state,folder)
            self.assertFalse(report['readyForTrialTraining']);self.assertEqual(len(rows),1)
            log=state/'bbox-quality-v1/events.jsonl';head=json.loads(log.read_text().splitlines()[-1])['eventHash'];new=hashed({**{k:v for k,v in e.items() if k!='eventHash'},'previousHash':head,'reason':'TEST subsequent edit'})
            with log.open('a') as f:f.write(json.dumps(new)+'\n')
            with self.assertRaises(ValueError):audit(state,folder)
    def test_rights_and_unreviewed_signs_still_block_an_audited_export(self):
        for changes in [{'rightsVerified':False},{'rightsEvidence':''},{'signReview':'not_reviewed'}]:
            with tempfile.TemporaryDirectory() as d:
                state=Path(d);folder,_=self.export_fixture(state,**changes)
                with self.assertRaises(ValueError):audit(state,folder)
    def test_recorded_test_split_cannot_be_used(self):
        # Build a structurally audited fixture with an invalid split; never touch raw.
        with tempfile.TemporaryDirectory() as d:
            state=Path(d);folder,e=self.export_fixture(state)
            e=hashed({**{k:v for k,v in e.items() if k!='eventHash'},'split':'test'})
            records=folder/'records.jsonl';records.write_text(json.dumps(e)+'\n');pins=folder/'SHA256SUMS.json';pins.write_text(json.dumps({'records.jsonl':hashlib.sha256(records.read_bytes()).hexdigest()}))
            ex=hashed(dict(kind='bbox_export',previousHash=e['eventHash'],userId=e['userId'],folder=folder.name,sha256=hashlib.sha256(pins.read_bytes()).hexdigest(),imageIds=[e['imageId']]))
            (state/'bbox-quality-v1/events.jsonl').write_text(json.dumps(e)+'\n'+json.dumps(ex)+'\n')
            with self.assertRaises(ValueError):audit(state,folder)

class PreparedTrialGates(unittest.TestCase):
    def fixture(self,root,raw_split='train'):
        raw=root/'01-raw';quality=root/'02-development/ai01-quality-v1';state=root/'state';home=state/'bbox-quality-v1';export=home/'exports/bbox-fixture'
        for p in [raw,quality,export]:p.mkdir(parents=True)
        image=raw/f'electrical/{raw_split}/images/a.jpg';label=raw/f'electrical/{raw_split}/labels/a.txt';yml=raw/'electrical/data.yaml'
        for p,content in [(image,b'TEST-FIXTURE-NOT-A-PHOTO'),(label,b'0 .5 .5 .8 .8'),(yml,b'names: [outlet]')]:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(content)
        sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
        row={'id':'img-00000','path':str(image.relative_to(raw)),'annotationPath':str(label.relative_to(raw)),'dataset':'electrical','developmentSplit':'train','leakageGroup':'g'}
        (quality/'drafts.jsonl').write_text(json.dumps(row)+'\n')
        (quality/'catalog-db.json').write_text(json.dumps({'categories':[{'id':'c','slug':'sua-dien','isActive':True}],'targets':[{'id':'t','categoryId':'c','slug':'o-cam-dien','isActive':True}]}))
        (quality/'sign-ontology.json').write_text(json.dumps({'signs':{'burn_mark':{'name':'TEST burn mark'}}}))
        (quality/'SHA256SUMS.json').write_text(json.dumps({p.name:sha(p) for p in quality.iterdir() if p.is_file()}))
        event=hashed({'kind':'bbox_revision','imageId':'img-00000','previousHash':'0'*64,'userId':'TEST-ONLY','status':'confirmed','split':'train','leakageGroup':'g','approvedGroundTruth':False,'benchmarkEligible':False,'rightsVerified':True,'rightsEvidence':'TEST','sourceEvidence':'TEST','groupEvidence':'TEST','objectReview':'complete','objectExtentReviewed':True,'signReview':'positive','packetHash':sha(quality/'SHA256SUMS.json'),'sha256':sha(image),'sourceAnnotationSha256':sha(label),'sourceYamlSha256':sha(yml),'boxes':[{'id':'o','kind':'object','label':'t','xyxy':[.1,.1,.9,.9]},{'id':'s','kind':'sign','label':'burn_mark','xyxy':[.2,.2,.4,.4]}]})
        (export/'records.jsonl').write_text(json.dumps(event)+'\n');copy=export/'object/images/train/img-00000.jpg';copy.parent.mkdir(parents=True);copy.write_bytes(image.read_bytes())
        (export/'SHA256SUMS.json').write_text(json.dumps({str(p.relative_to(export)):sha(p) for p in export.rglob('*') if p.is_file()}))
        ex=hashed({'kind':'bbox_export','previousHash':event['eventHash'],'userId':'TEST-ONLY','imageIds':['img-00000'],'folder':export.name,'sha256':sha(export/'SHA256SUMS.json')})
        (home/'events.jsonl').write_text(json.dumps(event)+'\n'+json.dumps(ex)+'\n')
        return raw,state,export
    def test_insufficient_sign_support_does_not_create_a_training_directory(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw,state,export=self.fixture(root);out=root/'experiment'
            report,data=prepare_trial(state,export,raw,'o-cam-dien',['burn_mark'],out)
            self.assertFalse(report['readyForTrialTraining']);self.assertEqual(report['classSupport']['sign:burn_mark']['train'],1);self.assertIsNone(data);self.assertFalse(out.exists())
    def test_raw_test_path_is_not_repurposed_even_if_export_calls_it_development_train(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw,state,export=self.fixture(root,'test')
            with self.assertRaisesRegex(ValueError,'test gốc'):prepare_trial(state,export,raw,'o-cam-dien',['burn_mark'],root/'experiment')
    def test_source_changes_are_detected_before_training(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);raw,state,export=self.fixture(root);next(raw.rglob('*.jpg')).write_bytes(b'TAMPERED')
            with self.assertRaisesRegex(ValueError,'đã đổi'):prepare_trial(state,export,raw,'o-cam-dien',['burn_mark'],root/'experiment')

if __name__=='__main__':unittest.main()
