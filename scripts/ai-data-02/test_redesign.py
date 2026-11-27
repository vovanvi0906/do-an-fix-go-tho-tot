"""Browser QA with isolated generated fixtures; never writes the real Studio state."""
import subprocess
import threading
from pathlib import Path
from test_studio import StudioTests
from studio import server

def make_fixture():
    fixture = StudioTests()
    fixture.setUp()
    from source_profiles import Profiles
    from core import canonical
    for i in ['i0', 'i1']:
        fixture.s.rows[i]['object_box_reuse_candidates_json'] = canonical([{'target_id':'t','candidate_enclosing_xyxy':[.1,.1,.8,.8],'geometry_transform':'fixture'}])
        fixture.s.rows[i].update(corpus='raw_source', source_claim_json=canonical({'workspace':'outletv2','project':'outlet-4xvv4','version':1,'url':'https://universe.roboflow.com/outletv2/outlet-4xvv4/dataset/1'}))
    fixture.s.targets['t2'] = {'id':'t2','slug':'quat','name':'Quạt','categoryId':'c'}
    fixture.s.source_profiles = Profiles(fixture.s)
    return fixture


if __name__ == '__main__':
    fixture = make_fixture()
    http = None
    try:
        http = server(fixture.s, 8768,auto_inspect=False)
        thread = threading.Thread(target=http.serve_forever, daemon=True)
        thread.start()
        subprocess.run(['node', str(Path(__file__).with_suffix('.cjs'))], check=True)
    finally:
        if http:
            http.shutdown()
            http.server_close()
            thread.join()
        fixture.tearDown()
