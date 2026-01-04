# /app/backend/core/helpers.py
"""Helper functions"""

from datetime import datetime, timezone
import uuid
from .database import db

async def log_audit(user_id: str, action: str, module: str, details: dict = None, ip_address: str = None):
    """Log an audit entry"""
    audit_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "module": module,
        "details": details or {},
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_entry)
    return audit_entry
