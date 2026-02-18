import asyncio
import threading
import mimetypes
from pathlib import Path

ROOT_DIR = Path(__file__).parent
FRONTEND_BUILD_DIR = ROOT_DIR.parent / "frontend" / "build"
_RESOLVED_BUILD_DIR = FRONTEND_BUILD_DIR.resolve() if FRONTEND_BUILD_DIR.exists() else None

_index_html = b""
try:
    _index_html = (FRONTEND_BUILD_DIR / "index.html").read_bytes()
except Exception:
    pass

_real_app = None
_loading_started = False


def _load_real_app():
    global _real_app
    try:
        import sys
        import os
        if str(ROOT_DIR) not in sys.path:
            sys.path.insert(0, str(ROOT_DIR))
        os.chdir(str(ROOT_DIR))
        from server import app as full_app
        _real_app = full_app
        print("[main] Full application loaded successfully", flush=True)
    except Exception as e:
        print(f"[main] Failed to load application: {e}", flush=True)
        import traceback
        traceback.print_exc()


def _ensure_loading():
    global _loading_started
    if not _loading_started:
        _loading_started = True
        t = threading.Thread(target=_load_real_app, daemon=True)
        t.start()


def _is_safe_path(file_path):
    try:
        resolved = file_path.resolve()
        return _RESOLVED_BUILD_DIR and resolved.is_relative_to(_RESOLVED_BUILD_DIR)
    except Exception:
        return False


async def _drain_body(receive):
    while True:
        msg = await receive()
        if msg.get("type") == "http.request":
            if not msg.get("more_body", False):
                break
        else:
            break


async def _send_response(send, status, content_type, body):
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [
            [b"content-type", content_type],
            [b"content-length", str(len(body)).encode()],
            [b"cache-control", b"no-cache"],
        ],
    })
    await send({"type": "http.response.body", "body": body})


async def _send_file(send, file_path):
    content = file_path.read_bytes()
    ct, _ = mimetypes.guess_type(str(file_path))
    ct_bytes = (ct or "application/octet-stream").encode()
    cache = b"public, max-age=31536000" if "/static/" in str(file_path) else b"no-cache"
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [
            [b"content-type", ct_bytes],
            [b"content-length", str(len(content)).encode()],
            [b"cache-control", cache],
        ],
    })
    await send({"type": "http.response.body", "body": content})


async def app(scope, receive, send):
    if _real_app is not None:
        await _real_app(scope, receive, send)
        return

    if scope["type"] == "lifespan":
        while True:
            msg = await receive()
            if msg["type"] == "lifespan.startup":
                _ensure_loading()
                await send({"type": "lifespan.startup.complete"})
            elif msg["type"] == "lifespan.shutdown":
                try:
                    from core.database import client
                    if client:
                        client.close()
                except Exception:
                    pass
                await send({"type": "lifespan.shutdown.complete"})
                return

    if scope["type"] != "http":
        return

    path = scope.get("path", "/")
    method = scope.get("method", "GET")
    await _drain_body(receive)

    if path == "/health":
        await _send_response(send, 200, b"application/json", b'{"status":"ok"}')
        return

    if path == "/":
        if _index_html:
            await _send_response(send, 200, b"text/html; charset=utf-8", _index_html)
        else:
            await _send_response(send, 200, b"application/json", b'{"status":"ok","app":"Schooltino"}')
        return

    if path.startswith("/api/"):
        await _send_response(send, 503, b"application/json", b'{"status":"loading","message":"Server starting up, please wait..."}')
        return

    if _RESOLVED_BUILD_DIR:
        file_path = FRONTEND_BUILD_DIR / path.lstrip("/")
        if _is_safe_path(file_path) and file_path.exists() and file_path.is_file():
            await _send_file(send, file_path)
            return

    if _index_html:
        await _send_response(send, 200, b"text/html; charset=utf-8", _index_html)
    else:
        await _send_response(send, 404, b"application/json", b'{"detail":"Not found"}')
