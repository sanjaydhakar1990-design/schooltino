# /app/backend/routes/__init__.py
from .ncert import router as ncert_router
from .mpbse import router as mpbse_router
from .syllabus import router as syllabus_router
from .syllabus_progress import router as syllabus_progress_router
from .fee_payment import router as fee_payment_router
from .ai_accountant import router as ai_accountant_router
