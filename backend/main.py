import http.server
import http.client
import threading
import socket
import os
import sys
import time
import mimetypes

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
FRONTEND_BUILD = os.path.join(PROJECT_DIR, "frontend", "build")
BACKEND_PORT = 8001

_index_cache = b""
try:
    with open(os.path.join(FRONTEND_BUILD, "index.html"), "rb") as f:
        _index_cache = f.read()
except Exception:
    pass

_backend_ready = False


class AppHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self._route()

    def do_POST(self):
        self._route()

    def do_PUT(self):
        self._route()

    def do_DELETE(self):
        self._route()

    def do_PATCH(self):
        self._route()

    def _route(self):
        if self.path.startswith("/api/"):
            self._proxy()
            return
        if self.path == "/health":
            self._json_response(200, b'{"status":"ok"}')
            return
        if self.path == "/":
            self._serve_index()
            return
        self._serve_static()

    def _json_response(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_index(self):
        if _index_cache:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(_index_cache)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(_index_cache)
        else:
            self._json_response(200, b'{"status":"ok","app":"Schooltino"}')

    def _serve_static(self):
        file_path = os.path.join(FRONTEND_BUILD, self.path.lstrip("/"))
        real_path = os.path.realpath(file_path)
        build_real = os.path.realpath(FRONTEND_BUILD)
        if real_path.startswith(build_real) and os.path.isfile(real_path):
            ct, _ = mimetypes.guess_type(real_path)
            with open(real_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", ct or "application/octet-stream")
            self.send_header("Content-Length", str(len(content)))
            cache = "public, max-age=31536000" if "/static/" in self.path else "no-cache"
            self.send_header("Cache-Control", cache)
            self.end_headers()
            self.wfile.write(content)
        else:
            self._serve_index()

    def _proxy(self):
        if not _backend_ready:
            self._json_response(503, b'{"status":"loading","message":"Starting up..."}')
            return
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            conn = http.client.HTTPConnection("127.0.0.1", BACKEND_PORT, timeout=120)
            fwd_headers = {}
            for k, v in self.headers.items():
                if k.lower() not in ("host", "transfer-encoding"):
                    fwd_headers[k] = v
            conn.request(self.command, self.path, body=body, headers=fwd_headers)
            resp = conn.getresponse()
            resp_body = resp.read()
            self.send_response(resp.status)
            skip = {"transfer-encoding", "connection", "content-length"}
            for h, v in resp.getheaders():
                if h.lower() not in skip:
                    self.send_header(h, v)
            self.send_header("Content-Length", str(len(resp_body)))
            self.end_headers()
            self.wfile.write(resp_body)
            conn.close()
        except Exception as e:
            err = f'{{"error":"Backend unavailable","detail":"{str(e)}"}}'.encode()
            self._json_response(502, err)

    def log_message(self, format, *args):
        pass


def _start_backend():
    global _backend_ready
    sys.path.insert(0, SCRIPT_DIR)
    os.chdir(SCRIPT_DIR)
    try:
        print("[startup] Importing application...", flush=True)
        t = time.time()
        from server import app as fastapi_app
        print(f"[startup] Application imported in {time.time()-t:.1f}s", flush=True)
        import uvicorn
        _backend_ready = True
        print(f"[startup] Backend ready on internal port {BACKEND_PORT}", flush=True)
        uvicorn.run(fastapi_app, host="127.0.0.1", port=BACKEND_PORT, log_level="info")
    except Exception as e:
        import traceback
        print(f"[startup] FATAL ERROR: {e}", flush=True)
        traceback.print_exc()
        print("[startup] Backend failed to start", flush=True)


def main():
    server = http.server.ThreadingHTTPServer(("0.0.0.0", 5000), AppHandler)
    server.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    proxy_thread = threading.Thread(target=server.serve_forever, daemon=True)
    proxy_thread.start()
    print("[startup] Server ready on port 5000", flush=True)

    backend_thread = threading.Thread(target=_start_backend)
    backend_thread.start()
    backend_thread.join()


if __name__ == "__main__":
    main()
