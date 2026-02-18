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

    def do_PUT(self):
        self.do_POST()

    def do_DELETE(self):
        self.do_POST()

    def do_PATCH(self):
        self.do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def log_message(self, format, *args):
        pass


class ReusableHTTPServer(http.server.HTTPServer):
    allow_reuse_address = True
    allow_reuse_port = True

    def server_bind(self):
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def main():
    health_server = ReusableHTTPServer(("0.0.0.0", 5000), HealthHandler)
    health_thread = threading.Thread(target=health_server.serve_forever, daemon=True)
    health_thread.start()
    print("[startup] Health check server ready on port 5000", flush=True)

    sys.path.insert(0, SCRIPT_DIR)
    os.chdir(SCRIPT_DIR)

    print("[startup] Importing application...", flush=True)
    start = time.time()
    from server import app as fastapi_app
    elapsed = time.time() - start
    print(f"[startup] Application imported in {elapsed:.1f}s", flush=True)

    print("[startup] Stopping health server, starting uvicorn...", flush=True)
    health_server.shutdown()
    time.sleep(0.2)

    import uvicorn
    uvicorn.run(fastapi_app, host="0.0.0.0", port=5000, log_level="info")


if __name__ == "__main__":
    main()
