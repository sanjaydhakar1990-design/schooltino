import http.server
import threading
import socket
import os
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_BUILD = os.path.join(os.path.dirname(SCRIPT_DIR), "frontend", "build")
INDEX_PATH = os.path.join(FRONTEND_BUILD, "index.html")

_index_cache = b""
try:
    with open(INDEX_PATH, "rb") as f:
        _index_cache = f.read()
except Exception:
    pass


class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        if self.path == "/health":
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(_index_cache or b'{"status":"ok","app":"Schooltino"}')

    def do_POST(self):
        cl = int(self.headers.get("Content-Length", 0))
        if cl > 0:
            self.rfile.read(cl)
        self.send_response(503)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"loading","message":"Starting up..."}')

    do_PUT = do_POST
    do_DELETE = do_POST
    do_PATCH = do_POST

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def log_message(self, format, *args):
        pass


def _wait_for_port(port, timeout=10):
    for _ in range(timeout * 10):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(("0.0.0.0", port))
            s.close()
            return True
        except OSError:
            time.sleep(0.1)
    return False


def main():
    health_server = http.server.HTTPServer(("0.0.0.0", 5000), HealthHandler)
    health_server.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    health_thread = threading.Thread(target=health_server.serve_forever, daemon=True)
    health_thread.start()
    print("[startup] Health check server ready on port 5000", flush=True)

    import uvicorn
    print("[startup] uvicorn pre-imported", flush=True)

    sys.path.insert(0, SCRIPT_DIR)
    os.chdir(SCRIPT_DIR)
    print("[startup] Importing application...", flush=True)
    start = time.time()
    from server import app as fastapi_app
    elapsed = time.time() - start
    print(f"[startup] Application imported in {elapsed:.1f}s", flush=True)

    print("[startup] Releasing port 5000...", flush=True)
    health_server.shutdown()
    health_server.server_close()
    try:
        health_server.socket.close()
    except Exception:
        pass

    if _wait_for_port(5000, timeout=10):
        print("[startup] Port 5000 released, starting uvicorn...", flush=True)
    else:
        print("[startup] Warning: port 5000 may still be in use, attempting anyway...", flush=True)

    uvicorn.run(fastapi_app, host="0.0.0.0", port=5000, log_level="info")


if __name__ == "__main__":
    main()
