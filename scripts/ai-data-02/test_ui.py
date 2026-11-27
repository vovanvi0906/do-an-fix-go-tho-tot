"""Run with the real, cached pilot Studio already listening on 8767. Fixture is isolated."""
import threading,subprocess
from pathlib import Path
from test_redesign import make_fixture
from studio import server
x=make_fixture();http=None
try:
    http=server(x.s,8768);thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
    subprocess.run(['node',str(Path(__file__).with_name('test_chromium.cjs'))],check=True,cwd=Path(__file__).resolve().parents[2])
finally:
    if http:http.shutdown();http.server_close();thread.join()
    x.tearDown()
