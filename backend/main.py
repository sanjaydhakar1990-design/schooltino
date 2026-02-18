from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from pathlib import Path
import os
import logging
import threading

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Schooltino API", version="1.0.0")

ROOT_DIR = Path(__file__).parent
FRONTEND_BUILD_DIR = ROOT_DIR.parent / "frontend" / "build"

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

_index_html = ""
if FRONTEND_BUILD_DIR.exists():
    idx_path = FRONTEND_BUILD_DIR / "index.html"
    if idx_path.exists():
        _index_html = idx_path.read_text()
        logger.info("index.html pre-loaded into memory")

if FRONTEND_BUILD_DIR.exists():
    static_dir = FRONTEND_BUILD_DIR / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="frontend_static")

_api_loaded = False

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    if _index_html:
        return HTMLResponse(content=_index_html, headers={"Cache-Control": "no-cache"})
    return {"status": "ok", "app": "Schooltino"}

@app.exception_handler(StarletteHTTPException)
async def spa_fallback(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and not request.url.path.startswith("/api/"):
        if FRONTEND_BUILD_DIR.exists():
            req_path = request.url.path.lstrip("/")
            if req_path:
                file_path = FRONTEND_BUILD_DIR / req_path
                if file_path.exists() and file_path.is_file():
                    media_type = None
                    fname = str(file_path)
                    if fname.endswith('.js'):
                        media_type = 'application/javascript'
                    elif fname.endswith('.css'):
                        media_type = 'text/css'
                    elif fname.endswith('.json'):
                        media_type = 'application/json'
                    elif fname.endswith('.png'):
                        media_type = 'image/png'
                    elif fname.endswith('.ico'):
                        media_type = 'image/x-icon'
                    elif fname.endswith('.svg'):
                        media_type = 'image/svg+xml'
                    return FileResponse(str(file_path), media_type=media_type)
        if _index_html:
            return HTMLResponse(content=_index_html, status_code=200, headers={"Cache-Control": "no-cache"})
    return JSONResponse({"detail": str(exc.detail)}, status_code=exc.status_code)

def _load_api_routes():
    global _api_loaded
    try:
        logger.info("Loading API routes from server module...")
        from server import api_router, UPLOAD_DIR, ROOT_DIR as SERVER_ROOT_DIR
        app.include_router(api_router)

        if UPLOAD_DIR.exists():
            app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
        api_static = SERVER_ROOT_DIR / "static"
        if api_static.exists():
            app.mount("/api/static", StaticFiles(directory=str(api_static)), name="api_static")

        _api_loaded = True
        logger.info("API routes loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load API routes: {e}")

_loader = threading.Thread(target=_load_api_routes, daemon=True)
_loader.start()

@app.on_event("shutdown")
async def shutdown():
    try:
        from core.database import client
        if client:
            client.close()
    except Exception:
        pass
