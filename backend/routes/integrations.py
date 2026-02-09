from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from core.database import db
from core.auth import get_current_user

router = APIRouter(prefix="/integrations", tags=["Integrations"])

class IntegrationConnectRequest(BaseModel):
    integration_id: str
    config: Optional[Dict[str, Any]] = None

class IntegrationDisconnectRequest(BaseModel):
    integration_id: str

AVAILABLE_INTEGRATIONS = {
    "razorpay": {"name": "Razorpay", "category": "Payment", "description": "Online fee collection, auto-reconciliation, UPI & card payments"},
    "ccavenue": {"name": "CCAvenue", "category": "Payment", "description": "Multi-mode payments (CC, DC, Net Banking, UPI)"},
    "paytm": {"name": "Paytm", "category": "Payment", "description": "UPI and wallet payments for fees"},
    "twilio_sms": {"name": "Twilio (SMS)", "category": "Communication", "description": "SMS notifications for attendance, fees & alerts"},
    "whatsapp_business": {"name": "WhatsApp Business", "category": "Communication", "description": "Official WhatsApp messaging for parents & staff"},
    "email_smtp": {"name": "Email (SMTP)", "category": "Communication", "description": "Email notifications via SendGrid, Mailgun or custom SMTP"},
    "firebase_fcm": {"name": "Push Notifications", "category": "Communication", "description": "Firebase Cloud Messaging for mobile push alerts"},
    "openai": {"name": "OpenAI", "category": "AI", "description": "AI-powered paper generation, content creation & Tino AI assistant"},
    "elevenlabs": {"name": "ElevenLabs", "category": "AI", "description": "AI voice synthesis for Tino Voice assistant"},
    "google_vision": {"name": "Google Vision", "category": "AI", "description": "AI-powered face recognition & document scanning"},
    "tally_erp": {"name": "Tally ERP", "category": "Accounting", "description": "Auto-sync fee data with Tally accounting software"},
    "zoho_books": {"name": "Zoho Books", "category": "Accounting", "description": "Cloud accounting integration for financial reporting"},
    "google_oauth": {"name": "Google OAuth", "category": "Authentication", "description": "Sign in with Google for staff & parent portals"},
    "aadhaar_verify": {"name": "Aadhaar Verification", "category": "Authentication", "description": "Student & staff identity verification via Aadhaar"},
    "aws_s3": {"name": "AWS S3", "category": "Storage", "description": "Cloud media storage for documents, photos & backups"},
    "google_cloud": {"name": "Google Cloud Storage", "category": "Storage", "description": "Backup & analytics storage on Google Cloud"},
    "firebase_db": {"name": "Firebase", "category": "Storage", "description": "Real-time database for live notifications & chat"},
}

@router.get("/list")
async def list_integrations(current_user: dict = Depends(get_current_user)):
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID required")

    connected = await db.integrations.find(
        {"school_id": school_id}, {"_id": 0}
    ).to_list(100)

    connected_map = {item["integration_id"]: item for item in connected}

    result = []
    for int_id, info in AVAILABLE_INTEGRATIONS.items():
        conn = connected_map.get(int_id)
        result.append({
            "id": int_id,
            "name": info["name"],
            "category": info["category"],
            "description": info["description"],
            "status": "connected" if conn else "not_connected",
            "connected_at": conn.get("connected_at") if conn else None,
            "config": conn.get("config", {}) if conn else {},
        })

    return {"success": True, "integrations": result}


@router.post("/connect")
async def connect_integration(
    req: IntegrationConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID required")

    if req.integration_id not in AVAILABLE_INTEGRATIONS:
        raise HTTPException(status_code=404, detail="Integration not found")

    existing = await db.integrations.find_one({
        "school_id": school_id,
        "integration_id": req.integration_id
    })

    if existing:
        await db.integrations.update_one(
            {"school_id": school_id, "integration_id": req.integration_id},
            {"$set": {
                "config": req.config or {},
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "connected_by": current_user.get("id")
            }}
        )
    else:
        await db.integrations.insert_one({
            "school_id": school_id,
            "integration_id": req.integration_id,
            "config": req.config or {},
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "connected_by": current_user.get("id"),
            "status": "connected"
        })

    info = AVAILABLE_INTEGRATIONS[req.integration_id]
    return {
        "success": True,
        "message": f"{info['name']} connected successfully",
        "integration": {
            "id": req.integration_id,
            "name": info["name"],
            "status": "connected"
        }
    }


@router.post("/disconnect")
async def disconnect_integration(
    req: IntegrationDisconnectRequest,
    current_user: dict = Depends(get_current_user)
):
    school_id = current_user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="School ID required")

    result = await db.integrations.delete_one({
        "school_id": school_id,
        "integration_id": req.integration_id
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Integration not connected")

    info = AVAILABLE_INTEGRATIONS.get(req.integration_id, {})
    return {
        "success": True,
        "message": f"{info.get('name', req.integration_id)} disconnected",
    }
