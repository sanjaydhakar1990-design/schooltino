"""
rate_limiter.py - Rate limiting for sensitive endpoints.

Usage in server.py or route files:
    from core.rate_limiter import limiter, RateLimitError
    from fastapi import Request

    # Add to app startup:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Use on any route:
    @router.post("/login")
    @limiter.limit("5/minute")
    async def login(request: Request, ...):
        ...
"""

import logging
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# Try to import slowapi for production-grade rate limiting
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200/minute"],   # Global default
        storage_uri="memory://",          # Use Redis URI in production: "redis://localhost:6379"
    )

    RATE_LIMIT_AVAILABLE = True
    logger.info("Rate limiting enabled via slowapi")

except ImportError:
    # Graceful fallback - rate limiting not available, log warning
    logger.warning(
        "slowapi not installed. Rate limiting is DISABLED. "
        "Install it with: pip install slowapi"
    )
    RATE_LIMIT_AVAILABLE = False
    RateLimitExceeded = Exception

    # Create a no-op limiter that does nothing
    class _NoOpLimiter:
        def limit(self, limit_string: str):
            """No-op decorator when slowapi is not installed"""
            def decorator(func):
                return func
            return decorator

        def shared_limit(self, limit_string: str, scope: str):
            def decorator(func):
                return func
            return decorator

    limiter = _NoOpLimiter()

    async def _rate_limit_exceeded_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )


# ====================== RECOMMENDED LIMITS ======================
# Use these constants as limit strings in your routes

class RateLimits:
    # Auth endpoints - strict limits to prevent brute force
    LOGIN         = "5/minute"        # 5 login attempts per minute per IP
    FORGOT_PASSWORD = "3/minute"      # 3 OTP requests per minute
    VERIFY_OTP    = "10/minute"       # 10 OTP verifications per minute
    RESET_PASSWORD = "5/minute"       # 5 password resets per minute

    # API endpoints - moderate limits
    API_GENERAL   = "60/minute"       # General API calls
    UPLOAD        = "10/minute"       # File uploads
    BULK_IMPORT   = "5/minute"        # Bulk data imports

    # AI endpoints - expensive, limit heavily
    AI_QUERY      = "10/minute"       # AI queries per user
    FACE_RECOGNITION = "30/minute"    # Biometric scans

    # Reporting - moderate
    EXPORT        = "5/minute"        # Report/export generation
