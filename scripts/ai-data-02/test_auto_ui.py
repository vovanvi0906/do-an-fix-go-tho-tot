"""Browser exercises automation API/UI with explicitly stubbed fixture-only predictions."""
import subprocess
import threading
from pathlib import Path
from types import SimpleNamespace
from test_redesign import make_fixture
from core import atomic, canonical, digest
from autolabel import load_request, build_report, run_dir
import studio


def main():
    fixture=make_fixture()
    fixture.s.save(fixture.payload('i3',True))
    http=None
    original=studio.subprocess
    def fake_worker(command, **kwargs):
        run_id=command[command.index('--run-id')+1]
        request=load_request(fixture.s.state,run_id)
        profile={'profileHash':'FIXTURE-AUTO-MODEL-NOT-REAL'}
        atomic(fixture.s.state/'active-model-profile.json',profile)
        for i in request['imageIds']:
            p={'boxes':[{'id':'fixture-object','kind':'object','label':'t','xyxy':[.1,.1,.8,.8],'objectId':None,'score':.9}],
               'targetCandidates':[{'targetId':'t'}],'uncertain':i=='i2','visibleDefects':None,'signIssues':[]}
            c={'imageId':i,'contentHash':fixture.s.rows[i]['sha256'],'profileHash':profile['profileHash'],'technicalStatus':'SUCCESS','prediction':p}
            c['cacheHash']=digest(canonical(c).encode());atomic(fixture.s.cache_dir/(i+'.json'),c)
        report=build_report(fixture.inventory,fixture.s.state,run_id,profile)
        atomic(run_dir(fixture.s.state,run_id)/'progress.json',{'runId':run_id,'status':'COMPLETED','processed':len(request['imageIds']),'requested':len(request['imageIds']),'cacheHits':0,'failed':0,'summary':report['summary']})
        return SimpleNamespace(pid=12345,poll=lambda:0)
    try:
        studio.subprocess=SimpleNamespace(Popen=fake_worker)
        http=studio.server(fixture.s,8768,auto_inspect=False)
        thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
        subprocess.run(['node',str(Path(__file__).with_suffix('.cjs'))],check=True)
        assert set(fixture.s.studio_latest)=={'i3'}, 'Automation changed human journal'
    finally:
        studio.subprocess=original
        if http:http.shutdown();http.server_close();thread.join()
        fixture.tearDown()

if __name__=='__main__':main()
