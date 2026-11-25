"""Quick canvas browser regression with generated fixture images only."""
import subprocess
import threading
from pathlib import Path
from test_redesign import make_fixture
from studio import server

if __name__ == '__main__':
    fixture = make_fixture()
    http = None
    try:
        http = server(fixture.s, 8768)
        thread = threading.Thread(target=http.serve_forever, daemon=True)
        thread.start()
        subprocess.run(['node', str(Path(__file__).with_suffix('.cjs'))], check=True)
    finally:
        if http:
            http.shutdown()
            http.server_close()
            thread.join()
        fixture.tearDown()
