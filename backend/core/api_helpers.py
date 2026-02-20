"""
api_helpers.py - Safe wrappers for external API calls with timeout and retry logic.

Usage:
    from core.api_helpers import safe_openai_call, safe_razorpay_call, with_timeout

    # With timeout:
    result = await with_timeout(some_async_func(), timeout_seconds=30)

    # Safe OpenAI call:
    response = await safe_openai_call(client, messages, model="gpt-4o")
"""

import asyncio
import logging
from typing import Any, Optional, Callable
from core.constants import APITimeout

logger = logging.getLogger(__name__)


# ====================== GENERIC TIMEOUT WRAPPER ======================

async def with_timeout(coroutine, timeout_seconds: int = APITimeout.DEFAULT, fallback=None):
    """
    Run an async coroutine with a timeout.
    Returns fallback value if timeout occurs instead of crashing.

    Usage:
        result = await with_timeout(my_async_func(), timeout_seconds=30)
    """
    try:
        return await asyncio.wait_for(coroutine, timeout=timeout_seconds)
    except asyncio.TimeoutError:
        logger.warning(f"Operation timed out after {timeout_seconds}s")
        return fallback
    except Exception as e:
        logger.error(f"Operation failed: {type(e).__name__}: {e}")
        return fallback


# ====================== OPENAI / AI CALLS ======================

async def safe_ai_call(
    call_fn: Callable,
    prompt: str,
    timeout_seconds: int = APITimeout.OPENAI,
    fallback_message: str = "AI temporarily unavailable. Please try again later."
) -> str:
    """
    Safely call an AI function with timeout.
    Returns a friendly fallback message on failure instead of crashing.
    """
    try:
        result = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(None, lambda: call_fn(prompt)),
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        logger.warning(f"AI call timed out after {timeout_seconds}s")
        return fallback_message
    except Exception as e:
        logger.error(f"AI call failed: {type(e).__name__}: {e}")
        return fallback_message


# ====================== RAZORPAY CALLS ======================

async def safe_razorpay_call(fn: Callable, *args, timeout_seconds: int = APITimeout.RAZORPAY, **kwargs):
    """
    Safely call Razorpay API with timeout.
    Raises HTTP 503 on failure instead of crashing the server.
    """
    from fastapi import HTTPException
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: fn(*args, **kwargs)),
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        logger.error(f"Razorpay API timed out after {timeout_seconds}s")
        raise HTTPException(
            status_code=503,
            detail="Payment gateway timeout. Please try again in a moment."
        )
    except Exception as e:
        logger.error(f"Razorpay API error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Payment service error: {str(e)}"
        )


# ====================== EMAIL / SMS CALLS ======================

async def safe_notification_send(fn: Callable, *args, timeout_seconds: int = APITimeout.SMS, **kwargs) -> bool:
    """
    Safely send email/SMS notification with timeout.
    Returns True on success, False on failure (non-critical).
    """
    try:
        loop = asyncio.get_event_loop()
        await asyncio.wait_for(
            loop.run_in_executor(None, lambda: fn(*args, **kwargs)),
            timeout=timeout_seconds
        )
        return True
    except asyncio.TimeoutError:
        logger.warning(f"Notification send timed out after {timeout_seconds}s")
        return False
    except Exception as e:
        logger.warning(f"Notification send failed: {type(e).__name__}: {e}")
        return False


# ====================== DATABASE HELPERS ======================

async def safe_db_query(query_coroutine, fallback=None, operation_name: str = "DB query"):
    """
    Safely execute a database query with error handling.
    Returns fallback on failure instead of crashing.
    """
    try:
        return await query_coroutine
    except Exception as e:
        logger.error(f"{operation_name} failed: {type(e).__name__}: {e}")
        return fallback


def paginate_query(query, page: int = 1, page_size: int = None):
    """
    Apply safe pagination to a MongoDB query.
    Prevents fetching unlimited records.
    """
    from core.constants import Pagination
    if page_size is None:
        page_size = Pagination.DEFAULT_PAGE_SIZE
    # Cap page size to maximum
    page_size = min(page_size, Pagination.MAX_PAGE_SIZE)
    page = max(1, page)
    skip = (page - 1) * page_size
    return query.skip(skip).limit(page_size)
