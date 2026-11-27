"""Grounding UI/API lifecycle with fixture detections only; does not load real weights."""
import subprocess
import threading
from pathlib import Path
from types import SimpleNamespace
from test_redesign import make_fixture
from test_grounding import fixture_manifest
from core import atomic,canonical,digest
from autolabel import load_request,build_report,run_dir
import studio


def main():
    fixture=make_fixture();fixture.s.save(fixture.payload('i2'))
    manifest=fixture_manifest(fixture.root)
    previous_module,previous_manifest=studio.subprocess,studio.GROUNDING_MANIFEST
    def fake_worker(command,**kwargs):
        rid=command[command.index('--run-id')+1];request=load_request(fixture.s.state,rid)
        cfg=__import__('json').loads(manifest.read_text())
        profile={'profileHash':'GROUNDING-UI-FIXTURE-ONLY','signDetector':cfg}
        atomic(fixture.s.state/'active-model-profile.json',profile)
        for i in request['imageIds']:
            if i=='i1' and not request.get('inspectionOnly'):continue
            pred={'boxes':[{'id':'gd-object','kind':'object','label':'t','xyxy':[.1,.1,.8,.8],'objectId':None},
                           {'id':'gd-sign','kind':'sign','label':'burn_mark','xyxy':[.2,.2,.4,.4],'objectId':'gd-object'}],
                  'signCapability':True,'targetCandidates':[{'targetId':'t'}],'uncertain':False,'visibleDefects':['burn_mark'],'signIssues':[]}
            c={'imageId':i,'contentHash':fixture.s.rows[i]['sha256'],'profileHash':profile['profileHash'],'technicalStatus':'SUCCESS','prediction':pred}
            c['cacheHash']=digest(canonical(c).encode());atomic(fixture.s.cache_dir/(i+'.json'),c)
        report=build_report(fixture.inventory,fixture.s.state,rid,profile)
        atomic(run_dir(fixture.s.state,rid)/'progress.json',{'runId':rid,'status':'COMPLETED','processed':len(request['imageIds']),'requested':len(request['imageIds']),'summary':report['summary']})
        return SimpleNamespace(pid=12345,poll=lambda:0)
    http=None
    try:
        studio.GROUNDING_MANIFEST=manifest;studio.subprocess=SimpleNamespace(Popen=fake_worker)
        http=studio.server(fixture.s,8768);thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
        subprocess.run(['node',str(Path(__file__).with_suffix('.cjs'))],check=True)
        assert len(fixture.s.revisions['i2'])==1, 'Inspection overwrote existing human draft'
    finally:
        studio.subprocess=previous_module;studio.GROUNDING_MANIFEST=previous_manifest
        if http:http.shutdown();http.server_close();thread.join()
        fixture.tearDown()

if __name__=='__main__':main()
