from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
import uuid
import os
import sys

sys.path.append(str(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from core.database import db

def get_database():
    return db

router = APIRouter(prefix="/prayer", tags=["Prayer System"])


@router.get("/settings")
async def get_prayer_settings(school_id: str):
    database = get_database()
    settings = await database.prayer_settings.find_one({"school_id": school_id})
    if settings:
        settings.pop("_id", None)
        return settings
    return {
        "school_id": school_id,
        "schedule": {
            "enabled": True,
            "morning_time": "08:00",
            "duration": 15,
            "auto_start": False,
            "prayers_sequence": ["saraswati_vandana", "itni_shakti", "jana_gana_mana"],
            "announcement_before": True,
            "announcement_text": "ध्यान दें! प्रार्थना सभा शुरू हो रही है। कृपया अपने स्थान पर खड़े हों।"
        },
        "prayer_audio_urls": {},
        "custom_prayers": []
    }


@router.post("/settings")
async def save_prayer_settings(data: dict):
    database = get_database()
    school_id = data.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="school_id required")

    doc = {
        "school_id": school_id,
        "schedule": data.get("schedule", {}),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await database.prayer_settings.update_one(
        {"school_id": school_id},
        {"$set": doc},
        upsert=True
    )

    return {"success": True, "message": "Prayer settings saved"}


@router.post("/upload-audio")
async def upload_prayer_audio(
    file: UploadFile = File(...),
    prayer_id: str = Form(...),
    school_id: str = Form(...)
):
    database = get_database()

    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "audio/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only MP3/WAV/OGG audio files allowed")

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "prayer_audio")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
    filename = f"{school_id}_{prayer_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    audio_url = f"/uploads/prayer_audio/{filename}"

    await database.prayer_settings.update_one(
        {"school_id": school_id},
        {"$set": {
            f"prayer_audio_urls.{prayer_id}": audio_url,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    return {
        "success": True,
        "audio_url": audio_url,
        "prayer_id": prayer_id,
        "message": "Audio uploaded successfully"
    }
