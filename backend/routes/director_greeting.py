# /app/backend/routes/director_greeting.py
"""
AI Personalized Greeting System for Director
- Time-based greeting (Good Morning/Afternoon/Evening/Night)
- Custom greeting (Hare Krishna, Jai Shree Ram, etc.)
- First entry detection - asks "How are you?"
- Tracks entry/exit to avoid repetitive greetings
- Voice greeting via TTS
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timezone, timedelta
import uuid
import os
import sys

sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

router = APIRouter(prefix="/director-greeting", tags=["Director Greeting"])


# ==================== MODELS ====================

class GreetingSettingsUpdate(BaseModel):
    user_id: str
    custom_greeting: Optional[str] = None  # "Hare Krishna", "Jai Shree Ram", etc.
    enable_time_greeting: bool = True
    enable_custom_greeting: bool = True
    enable_wellness_check: bool = True  # "Aap kaise ho?"
    language: str = "hinglish"  # hindi, english, hinglish
    greeting_voice: bool = True
    entry_cooldown_minutes: int = 60  # Don't ask again for 60 mins

class EntryLogRequest(BaseModel):
    user_id: str
    school_id: str
    entry_type: str = "face_recognition"  # face_recognition, manual, cctv
    location: Optional[str] = "main_gate"


# ==================== HELPER FUNCTIONS ====================

def get_time_greeting(language: str = "hinglish") -> Dict:
    """
    Get appropriate greeting based on current time
    """
    now = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)  # IST
    hour = now.hour
    
    greetings = {
        "english": {
            "morning": "Good Morning",
            "afternoon": "Good Afternoon", 
            "evening": "Good Evening",
            "night": "Good Night"
        },
        "hindi": {
            "morning": "सुप्रभात",
            "afternoon": "नमस्कार",
            "evening": "शुभ संध्या",
            "night": "शुभ रात्रि"
        },
        "hinglish": {
            "morning": "Good Morning",
            "afternoon": "Good Afternoon",
            "evening": "Good Evening",
            "night": "Good Night"
        }
    }
    
    lang_greetings = greetings.get(language, greetings["hinglish"])
    
    if 5 <= hour < 12:
        period = "morning"
    elif 12 <= hour < 17:
        period = "afternoon"
    elif 17 <= hour < 21:
        period = "evening"
    else:
        period = "night"
    
    return {
        "period": period,
        "greeting": lang_greetings[period],
        "hour": hour,
        "emoji": {
            "morning": "🌅",
            "afternoon": "☀️",
            "evening": "🌆",
            "night": "🌙"
        }[period]
    }


def get_wellness_message(language: str, name: str) -> str:
    """
    Get wellness check message
    """
    messages = {
        "english": f"How are you today, {name}? Hope you're doing well!",
        "hindi": f"{name} ji, aap kaise hain? Sab theek toh hai?",
        "hinglish": f"{name} ji, kaise hain aap aaj? Hope sab badhiya hai!"
    }
    return messages.get(language, messages["hinglish"])


# ==================== ENDPOINTS ====================

@router.get("/greet/{user_id}")
async def get_director_greeting(user_id: str, school_id: str):
    """
    Generate personalized greeting for director when recognized
    Checks if first entry today - asks wellness
    """
    # Get user and settings
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        return {"success": False, "message": "User not found"}
    
    settings = await db.greeting_settings.find_one({"user_id": user_id}, {"_id": 0})
    if not settings:
        settings = {
            "custom_greeting": None,
            "enable_time_greeting": True,
            "enable_custom_greeting": True,
            "enable_wellness_check": True,
            "language": "hinglish",
            "entry_cooldown_minutes": 60
        }
    
    # Check last entry
    cooldown_minutes = settings.get("entry_cooldown_minutes", 60)
    cooldown_time = datetime.now(timezone.utc) - timedelta(minutes=cooldown_minutes)
    
    last_entry = await db.director_entries.find_one(
        {
            "user_id": user_id,
            "school_id": school_id,
            "entry_time": {"$gte": cooldown_time.isoformat()}
        },
        sort=[("entry_time", -1)]
    )
    
    # Build greeting
    greeting_parts = []
    name = user.get("name", "Sir")
    first_name = name.split()[0] if name else "Sir"
    language = settings.get("language", "hinglish")
    
    # 1. Custom greeting first (if enabled)
    if settings.get("enable_custom_greeting") and settings.get("custom_greeting"):
        greeting_parts.append(settings["custom_greeting"])
    
    # 2. Time-based greeting
    if settings.get("enable_time_greeting", True):
        time_info = get_time_greeting(language)
        greeting_parts.append(f"{time_info['greeting']}, {first_name} ji! {time_info['emoji']}")
    
    # 3. Wellness check (only if first entry in cooldown period)
    is_first_entry = last_entry is None
    if is_first_entry and settings.get("enable_wellness_check", True):
        wellness_msg = get_wellness_message(language, first_name)
        greeting_parts.append(wellness_msg)
    
    # Log this entry
    entry_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "school_id": school_id,
        "entry_time": datetime.now(timezone.utc).isoformat(),
        "entry_type": "greeting_triggered",
        "is_first_entry_today": is_first_entry,
        "greeting_shown": True
    }
    await db.director_entries.insert_one(entry_record)
    
    # Full greeting message
    full_greeting = " ".join(greeting_parts)
    
    # For voice TTS
    voice_text = full_greeting.replace("🌅", "").replace("☀️", "").replace("🌆", "").replace("🌙", "").strip()
    
    return {
        "success": True,
        "greeting": full_greeting,
        "voice_text": voice_text,
        "is_first_entry": is_first_entry,
        "show_wellness_response": is_first_entry and settings.get("enable_wellness_check"),
        "user_name": name,
        "time_info": get_time_greeting(language),
        "settings": {
            "custom_greeting": settings.get("custom_greeting"),
            "language": settings.get("language"),
            "voice_enabled": settings.get("greeting_voice", True)
        }
    }


@router.post("/settings")
async def update_greeting_settings(data: GreetingSettingsUpdate):
    """
    Update personalized greeting settings for director
    """
    settings_data = {
        "user_id": data.user_id,
        "custom_greeting": data.custom_greeting,
        "enable_time_greeting": data.enable_time_greeting,
        "enable_custom_greeting": data.enable_custom_greeting,
        "enable_wellness_check": data.enable_wellness_check,
        "language": data.language,
        "greeting_voice": data.greeting_voice,
        "entry_cooldown_minutes": data.entry_cooldown_minutes,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.greeting_settings.update_one(
        {"user_id": data.user_id},
        {"$set": settings_data},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Greeting settings updated!",
        "settings": settings_data
    }


@router.get("/settings/{user_id}")
async def get_greeting_settings(user_id: str):
    """
    Get current greeting settings for a user
    """
    settings = await db.greeting_settings.find_one({"user_id": user_id}, {"_id": 0})
    
    if not settings:
        # Default settings
        settings = {
            "user_id": user_id,
            "custom_greeting": None,
            "enable_time_greeting": True,
            "enable_custom_greeting": True,
            "enable_wellness_check": True,
            "language": "hinglish",
            "greeting_voice": True,
            "entry_cooldown_minutes": 60
        }
    
    # Preset custom greetings for selection
    preset_greetings = [
        {"value": "Hare Krishna 🙏", "label": "Hare Krishna"},
        {"value": "Jai Shree Ram 🙏", "label": "Jai Shree Ram"},
        {"value": "Om Namah Shivaya 🙏", "label": "Om Namah Shivaya"},
        {"value": "Sat Sri Akal 🙏", "label": "Sat Sri Akal"},
        {"value": "Jai Jinendra 🙏", "label": "Jai Jinendra"},
        {"value": "As-salamu alaykum 🙏", "label": "As-salamu alaykum"},
        {"value": "Namaste 🙏", "label": "Namaste"},
        {"value": "Pranam 🙏", "label": "Pranam"},
    ]
    
    return {
        "settings": settings,
        "preset_greetings": preset_greetings,
        "languages": [
            {"value": "english", "label": "English"},
            {"value": "hindi", "label": "Hindi"},
            {"value": "hinglish", "label": "Hinglish"}
        ]
    }


@router.post("/log-entry")
async def log_director_entry(data: EntryLogRequest):
    """
    Log director entry/exit for tracking
    Used by CCTV face recognition or manual check-in
    """
    # Get user
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0, "name": 1, "role": 1})
    
    entry_record = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "user_name": user.get("name") if user else None,
        "user_role": user.get("role") if user else None,
        "school_id": data.school_id,
        "entry_type": data.entry_type,
        "location": data.location,
        "entry_time": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    
    await db.director_entries.insert_one(entry_record)
    
    # Trigger greeting
    greeting_response = await get_director_greeting(data.user_id, data.school_id)
    
    return {
        "success": True,
        "entry_logged": True,
        "greeting": greeting_response
    }


@router.post("/wellness-response")
async def record_wellness_response(user_id: str, response: str, mood: Optional[str] = None):
    """
    Record director's response to wellness check
    For future AI analysis and personalization
    """
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "response": response,
        "mood": mood,  # happy, okay, tired, stressed, etc.
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    
    await db.wellness_responses.insert_one(record)
    
    # AI response based on mood
    ai_responses = {
        "happy": "Bahut accha! Aaj ka din productive rahe! 🎉",
        "okay": "Sab theek ho jayega. Main hoon na aapke saath! 💪",
        "tired": "Aap thak gaye ho. Thoda rest le lein break mein. ☕",
        "stressed": "Tension mat lijiye. Ek ek karke sab handle ho jayega. 🙏",
        "default": "Aapka din mangalmay ho! 🌟"
    }
    
    ai_reply = ai_responses.get(mood, ai_responses["default"])
    
    return {
        "success": True,
        "message": "Response recorded",
        "ai_reply": ai_reply,
        "mood_detected": mood
    }


@router.get("/entry-history/{user_id}")
async def get_entry_history(user_id: str, days: int = 7):
    """
    Get director's entry history for last N days
    """
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    entries = await db.director_entries.find(
        {"user_id": user_id, "entry_time": {"$gte": start_date}},
        {"_id": 0}
    ).sort("entry_time", -1).to_list(100)
    
    # Group by date
    by_date = {}
    for entry in entries:
        date = entry.get("date") or entry.get("entry_time", "")[:10]
        if date not in by_date:
            by_date[date] = []
        by_date[date].append(entry)
    
    return {
        "user_id": user_id,
        "total_entries": len(entries),
        "days": days,
        "by_date": by_date,
        "entries": entries[:20]  # Last 20
    }
