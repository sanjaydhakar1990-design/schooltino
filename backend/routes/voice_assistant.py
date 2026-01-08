"""
TINO AI Voice Assistant - Complete Rewrite
==========================================
- Proper Hindi speech with gender-specific language
- ACTUALLY executes commands - opens dashboards, navigates pages
- ElevenLabs Hindi voices
- No more "guide karunga" - actual action lega
"""
import os
import io
import base64
import logging
import uuid
from typing import Optional, List, Dict
from datetime import datetime, timezone, date
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-assistant", tags=["Voice Assistant"])

# Database connection
def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

db = None
def get_database():
    global db
    if db is None:
        db = get_db()
    return db

# API Keys
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# ElevenLabs Best Multilingual Voices - Optimized for Hindi/English/Hinglish
# Using eleven_multilingual_v2 model for best language support
VOICE_IDS = {
    # Best all-rounder multilingual voices
    "male": "TX3LPaxmHKxFdv7VOQHJ",        # Liam - Best multilingual male (clear Hindi/English)
    "female": "EXAVITQu4vr4xnSDxMaL"       # Sarah - Best multilingual female (expressive, natural)
}

# Alternative voices for different styles
VOICE_OPTIONS = {
    "male": {
        "default": "TX3LPaxmHKxFdv7VOQHJ",      # Liam - Multilingual, professional
        "conversational": "IKne3meq5aSn9XLyUdCD", # Charlie - Friendly, conversational
        "deep": "pNInz6obpgDQGcFmaJgB",          # Adam - Deep, authoritative
    },
    "female": {
        "default": "EXAVITQu4vr4xnSDxMaL",      # Sarah - Natural, expressive
        "soft": "XrExE9yKIg1WjnnlVkGX",          # Matilda - Soft, warm
        "energetic": "jBpfuIE2acCO8z3wKNLl",     # Gigi - Energetic, youthful
    }
}

# Fallback voices if primary don't work
FALLBACK_VOICES = {
    "male": "pNInz6obpgDQGcFmaJgB",      # Adam
    "female": "21m00Tcm4TlvDq8ikWAM"     # Rachel
}

# Model for best multilingual support
ELEVENLABS_MODEL = "eleven_multilingual_v2"  # Best for Hindi/English/Hinglish

# Initialize clients
eleven_client = None
stt_client = None
openai_client = None

try:
    from elevenlabs import ElevenLabs
    if ELEVENLABS_API_KEY:
        eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        logger.info("ElevenLabs initialized")
except Exception as e:
    logger.warning(f"ElevenLabs init failed: {e}")

try:
    from emergentintegrations.llm.openai import OpenAISpeechToText
    if EMERGENT_LLM_KEY:
        stt_client = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
except Exception as e:
    logger.warning(f"STT init failed: {e}")

try:
    from openai import OpenAI
    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
except Exception as e:
    logger.warning(f"OpenAI init failed: {e}")


# ============= MODELS =============

class TTSRequest(BaseModel):
    text: str
    voice_gender: str = "female"

class ChatMessage(BaseModel):
    message: str
    school_id: str
    user_id: str
    user_role: str = "director"
    user_name: str = "User"
    voice_gender: str = "female"

class CommandRequest(BaseModel):
    command: str
    school_id: str
    user_id: str
    user_role: str = "director"
    voice_gender: str = "female"
    confirmed: bool = False

class CommandResponse(BaseModel):
    message: str
    action: Optional[str] = None
    action_type: Optional[str] = None  # navigate, execute, data, confirm
    requires_confirmation: bool = False
    confirmation_message: Optional[str] = None
    data: Optional[dict] = None
    audio_base64: Optional[str] = None
    navigate_to: Optional[str] = None  # URL to navigate


# ============= NAVIGATION COMMANDS =============
# Ye commands ACTUALLY navigate karenge - sirf guide nahi

NAVIGATION_COMMANDS = {
    # Dashboard Navigation
    "dashboard": {
        "keywords": ["dashboard", "डैशबोर्ड", "home", "main page", "mera dashboard"],
        "url": "/app/dashboard",
        "response_male": "Dashboard khol raha hoon.",
        "response_female": "Dashboard khol rahi hoon."
    },
    "student_dashboard": {
        "keywords": ["student dashboard", "student ka dashboard", "studytino", "students page"],
        "url": "/app/students",
        "response_male": "Students page khol raha hoon.",
        "response_female": "Students page khol rahi hoon."
    },
    "teacher_dashboard": {
        "keywords": ["teacher dashboard", "teachtino", "teacher page", "teachers"],
        "url": "/app/staff",
        "response_male": "Staff page khol raha hoon.",
        "response_female": "Staff page khol rahi hoon."
    },
    "tino_brain": {
        "keywords": ["tino brain", "brain", "ai dashboard", "master ai"],
        "url": "/app/tino-brain",
        "response_male": "Tino Brain khol raha hoon.",
        "response_female": "Tino Brain khol rahi hoon."
    },
    "attendance": {
        "keywords": ["attendance", "hajri", "उपस्थिति", "attendance page", "hajri lagao"],
        "url": "/app/attendance",
        "response_male": "Attendance page khol raha hoon. Yahan se hajri laga sakte ho.",
        "response_female": "Attendance page khol rahi hoon. Yahan se hajri laga sakte ho."
    },
    "fees": {
        "keywords": ["fees", "fee", "फीस", "payment", "fee page", "fee collection"],
        "url": "/app/fees",
        "response_male": "Fees page khol raha hoon.",
        "response_female": "Fees page khol rahi hoon."
    },
    "notices": {
        "keywords": ["notice", "notices", "announcement", "circular", "notice bhejo"],
        "url": "/app/notices",
        "response_male": "Notices page khol raha hoon. Yahan se notice bhej sakte ho.",
        "response_female": "Notices page khol rahi hoon. Yahan se notice bhej sakte ho."
    },
    "classes": {
        "keywords": ["classes", "class", "कक्षा", "class page"],
        "url": "/app/classes",
        "response_male": "Classes page khol raha hoon.",
        "response_female": "Classes page khol rahi hoon."
    },
    "ai_paper": {
        "keywords": ["paper", "question paper", "exam paper", "paper banao", "ai paper"],
        "url": "/app/ai-paper",
        "response_male": "AI Paper Generator khol raha hoon.",
        "response_female": "AI Paper Generator khol rahi hoon."
    },
    "cctv": {
        "keywords": ["cctv", "camera", "surveillance", "cctv dekho"],
        "url": "/app/cctv",
        "response_male": "CCTV Dashboard khol raha hoon.",
        "response_female": "CCTV Dashboard khol rahi hoon."
    },
    "settings": {
        "keywords": ["settings", "setting", "सेटिंग्स"],
        "url": "/app/settings",
        "response_male": "Settings page khol raha hoon.",
        "response_female": "Settings page khol rahi hoon."
    },
    "analytics": {
        "keywords": ["analytics", "reports", "report", "analysis"],
        "url": "/app/school-analytics",
        "response_male": "School Analytics khol raha hoon.",
        "response_female": "School Analytics khol rahi hoon."
    },
    "leave": {
        "keywords": ["leave", "chutti", "छुट्टी", "leave application"],
        "url": "/app/leave",
        "response_male": "Leave Management khol raha hoon.",
        "response_female": "Leave Management khol rahi hoon."
    },
    "admit_card": {
        "keywords": ["admit card", "admitcard", "admit", "प्रवेश पत्र", "hall ticket", "exam card"],
        "url": "/app/admit-cards",
        "response_male": "Admit Card section khol raha hoon. Yahan se admit cards generate kar sakte ho.",
        "response_female": "Admit Card section khol rahi hoon. Yahan se admit cards generate kar sakte ho."
    },
    "gallery": {
        "keywords": ["gallery", "photos", "images", "गैलरी"],
        "url": "/app/gallery",
        "response_male": "Gallery khol raha hoon.",
        "response_female": "Gallery khol rahi hoon."
    },
    "accountant": {
        "keywords": ["accountant", "accounts", "accounting", "ai accountant"],
        "url": "/app/accountant",
        "response_male": "AI Accountant khol raha hoon.",
        "response_female": "AI Accountant khol rahi hoon."
    },
    "transport": {
        "keywords": ["transport", "bus", "vehicle"],
        "url": "/app/transport",
        "response_male": "Transport page khol raha hoon.",
        "response_female": "Transport page khol rahi hoon."
    },
    "biometric": {
        "keywords": ["biometric", "fingerprint", "finger"],
        "url": "/app/biometric",
        "response_male": "Biometric page khol raha hoon.",
        "response_female": "Biometric page khol rahi hoon."
    },
    "health": {
        "keywords": ["health", "medical", "health module"],
        "url": "/app/health",
        "response_male": "Health Module khol raha hoon.",
        "response_female": "Health Module khol rahi hoon."
    },
    "users": {
        "keywords": ["users", "user management", "staff accounts"],
        "url": "/app/users",
        "response_male": "User Management khol raha hoon.",
        "response_female": "User Management khol rahi hoon."
    },
    "permissions": {
        "keywords": ["permission", "permissions", "role", "access"],
        "url": "/app/permission-manager",
        "response_male": "Permission Manager khol raha hoon.",
        "response_female": "Permission Manager khol rahi hoon."
    }
}

# ============= ACTION COMMANDS =============
# Ye commands actual kaam karenge

ACTION_COMMANDS = {
    "create_classes": {
        "keywords": ["create classes", "sabhi class banao", "nursery se 12th", "classes create karo"],
        "roles": ["director", "principal"],
        "confirm": True,
        "confirm_msg_male": "Kya main Nursery se Class 12th tak sabhi classes create kar doon?",
        "confirm_msg_female": "Kya main Nursery se Class 12th tak sabhi classes create kar doon?"
    },
    "show_attendance": {
        "keywords": ["attendance dikha", "kitne present", "aaj ki attendance", "hajri batao"],
        "roles": ["director", "teacher", "principal"],
        "confirm": False
    },
    "fee_status": {
        "keywords": ["fee status", "pending fee", "kitni fee baki", "fee batao"],
        "roles": ["director", "accountant", "principal"],
        "confirm": False
    },
    "send_notice": {
        "keywords": ["notice bhejo", "announcement karo", "sabko batao"],
        "roles": ["director", "teacher", "principal"],
        "confirm": False,
        "navigate": "/app/notices"
    }
}


def get_voice_id(gender: str) -> str:
    """Get voice ID based on gender"""
    return VOICE_IDS.get(gender, VOICE_IDS["female"])


def generate_audio(text: str, gender: str = "female") -> Optional[str]:
    """Generate TTS audio using ElevenLabs"""
    if not eleven_client:
        return None
    
    try:
        voice_id = get_voice_id(gender)
        
        # Use multilingual model for better Hindi
        audio_generator = eleven_client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            voice_settings={
                "stability": 0.6,
                "similarity_boost": 0.85,
                "style": 0.3,
                "use_speaker_boost": True
            }
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        return base64.b64encode(audio_data).decode()
        
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        # Try fallback voice
        try:
            fallback_id = FALLBACK_VOICES.get(gender, FALLBACK_VOICES["female"])
            audio_generator = eleven_client.text_to_speech.convert(
                text=text,
                voice_id=fallback_id,
                model_id="eleven_multilingual_v2"
            )
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            return base64.b64encode(audio_data).decode()
        except:
            return None


def detect_navigation(text: str) -> Optional[Dict]:
    """Detect navigation command"""
    text_lower = text.lower()
    
    for cmd_key, cmd_data in NAVIGATION_COMMANDS.items():
        for keyword in cmd_data["keywords"]:
            if keyword in text_lower:
                return {"key": cmd_key, **cmd_data}
    
    # Also check for "open X" or "X kholo" patterns
    open_patterns = ["open", "kholo", "khol do", "dikhao", "dikha do", "le jao", "jao"]
    for pattern in open_patterns:
        if pattern in text_lower:
            # Check which page to open
            for cmd_key, cmd_data in NAVIGATION_COMMANDS.items():
                for keyword in cmd_data["keywords"]:
                    if keyword in text_lower:
                        return {"key": cmd_key, **cmd_data}
    
    return None


def detect_action(text: str, role: str) -> Optional[Dict]:
    """Detect action command"""
    text_lower = text.lower()
    
    for cmd_key, cmd_data in ACTION_COMMANDS.items():
        # Check role
        if role not in cmd_data.get("roles", []):
            continue
        
        for keyword in cmd_data["keywords"]:
            if keyword in text_lower:
                return {"key": cmd_key, **cmd_data}
    
    return None


async def get_ai_response(message: str, role: str, gender: str, context: dict = None) -> str:
    """Get AI response with gender-specific language"""
    if not openai_client:
        if gender == "male":
            return "AI service available nahi hai. Baad mein try karo."
        else:
            return "AI service available nahi hai. Baad mein try karo."
    
    try:
        # Gender-specific system prompt
        if gender == "male":
            gender_instruction = """
            IMPORTANT: Tum MALE ho. Apni response mein:
            - "karunga" use karo, "karungi" NAHI
            - "hoon" use karo 
            - "raha hoon" use karo, "rahi hoon" NAHI
            - Male perspective se bolo
            Example: "Main ye kar raha hoon", "Main dikha raha hoon", "Main khol raha hoon"
            """
        else:
            gender_instruction = """
            IMPORTANT: Tum FEMALE ho. Apni response mein:
            - "karungi" use karo, "karunga" NAHI
            - "hoon" use karo
            - "rahi hoon" use karo, "raha hoon" NAHI  
            - Female perspective se bolo
            Example: "Main ye kar rahi hoon", "Main dikha rahi hoon", "Main khol rahi hoon"
            """
        
        system_prompt = f"""Tum Tino ho, ek school AI assistant. 
        
{gender_instruction}

Tumhara kaam:
1. User ki command samajhna
2. ACTUALLY kaam karna - sirf guide mat karo
3. Navigation commands pe directly page kholo
4. Short aur clear response do

User Role: {role}

RULES:
- Agar koi page kholne bole, tum khol sakte ho - "nahi kar sakta" mat bolo
- Agar koi data maange, directly batao
- Response chhota rakho (1-2 sentences max)
- Hinglish mein bolo
"""
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"AI error: {e}")
        if gender == "male":
            return "Kuch technical problem hai. Dobara try karo."
        else:
            return "Kuch technical problem hai. Dobara try karo."


# ============= API ENDPOINTS =============

@router.get("/status")
async def check_status():
    """Check voice services"""
    return {
        "tts_available": eleven_client is not None,
        "stt_available": stt_client is not None,
        "ai_available": openai_client is not None,
        "voices": {
            "male": {"id": VOICE_IDS["male"], "name": "Liam (Multilingual)"},
            "female": {"id": VOICE_IDS["female"], "name": "Sarah (Multilingual)"}
        },
        "voice_options": VOICE_OPTIONS,
        "model": ELEVENLABS_MODEL,
        "message": "Tino AI ready with best multilingual voices!"
    }


@router.post("/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: str = Form(default="hi")
):
    """Transcribe audio to text"""
    if not stt_client:
        raise HTTPException(status_code=503, detail="STT not available")
    
    try:
        audio_content = await audio_file.read()
        audio_io = io.BytesIO(audio_content)
        audio_io.name = audio_file.filename or "audio.webm"
        
        response = await stt_client.transcribe(
            file=audio_io,
            model="whisper-1",
            response_format="json",
            language=language
        )
        
        text = response.text if hasattr(response, 'text') else str(response)
        return {"transcribed_text": text, "language": language}
        
    except Exception as e:
        logger.error(f"Transcribe failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech"""
    audio_b64 = generate_audio(request.text, request.voice_gender)
    
    if not audio_b64:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    
    return {"audio_base64": audio_b64, "text": request.text, "voice": request.voice_gender}


@router.post("/chat", response_model=CommandResponse)
async def chat_with_tino(request: ChatMessage):
    """
    Main chat endpoint - ACTUALLY executes commands
    """
    db = get_database()
    gender = request.voice_gender
    
    # 1. Check for NAVIGATION command first
    nav_cmd = detect_navigation(request.message)
    if nav_cmd:
        response_key = f"response_{gender}"
        response_text = nav_cmd.get(response_key, nav_cmd.get("response_female"))
        audio_b64 = generate_audio(response_text, gender)
        
        return CommandResponse(
            message=response_text,
            action="navigate",
            action_type="navigate",
            navigate_to=nav_cmd["url"],
            audio_base64=audio_b64
        )
    
    # 2. Check for ACTION command
    action_cmd = detect_action(request.message, request.user_role)
    if action_cmd:
        # If needs confirmation
        if action_cmd.get("confirm"):
            confirm_key = f"confirm_msg_{gender}"
            confirm_msg = action_cmd.get(confirm_key, action_cmd.get("confirm_msg_female", "Confirm karein?"))
            audio_b64 = generate_audio(confirm_msg, gender)
            
            return CommandResponse(
                message=confirm_msg,
                action=action_cmd["key"],
                action_type="confirm",
                requires_confirmation=True,
                confirmation_message=confirm_msg,
                audio_base64=audio_b64
            )
        
        # If has navigation
        if action_cmd.get("navigate"):
            if gender == "male":
                response_text = f"{action_cmd['key'].replace('_', ' ').title()} page khol raha hoon."
            else:
                response_text = f"{action_cmd['key'].replace('_', ' ').title()} page khol rahi hoon."
            
            audio_b64 = generate_audio(response_text, gender)
            
            return CommandResponse(
                message=response_text,
                action=action_cmd["key"],
                action_type="navigate",
                navigate_to=action_cmd["navigate"],
                audio_base64=audio_b64
            )
        
        # Execute action
        result = await execute_action(action_cmd["key"], request.school_id, gender, db)
        audio_b64 = generate_audio(result["message"], gender)
        
        return CommandResponse(
            message=result["message"],
            action=action_cmd["key"],
            action_type="data",
            data=result.get("data"),
            audio_base64=audio_b64
        )
    
    # 3. No specific command - use AI for response
    ai_response = await get_ai_response(request.message, request.user_role, gender)
    audio_b64 = generate_audio(ai_response, gender)
    
    # Check if AI suggests navigation
    nav_check = detect_navigation(ai_response)
    
    return CommandResponse(
        message=ai_response,
        action_type="chat",
        navigate_to=nav_check["url"] if nav_check else None,
        audio_base64=audio_b64
    )


@router.post("/execute-command", response_model=CommandResponse)
async def execute_confirmed_command(request: CommandRequest):
    """Execute a confirmed command"""
    db = get_database()
    gender = request.voice_gender
    
    # Find the action
    action_cmd = detect_action(request.command, request.user_role)
    
    if not action_cmd:
        if gender == "male":
            msg = "Command samajh nahi aaya. Dobara bolo."
        else:
            msg = "Command samajh nahi aayi. Dobara bolo."
        audio_b64 = generate_audio(msg, gender)
        return CommandResponse(message=msg, audio_base64=audio_b64)
    
    # Execute
    result = await execute_action(action_cmd["key"], request.school_id, gender, db)
    audio_b64 = generate_audio(result["message"], gender)
    
    return CommandResponse(
        message=result["message"],
        action=action_cmd["key"],
        action_type="execute",
        data=result.get("data"),
        audio_base64=audio_b64
    )


async def execute_action(action_key: str, school_id: str, gender: str, db) -> dict:
    """Execute action and return result"""
    
    if action_key == "create_classes":
        return await create_all_classes(school_id, gender, db)
    
    elif action_key == "show_attendance":
        return await get_attendance_summary(school_id, gender, db)
    
    elif action_key == "fee_status":
        return await get_fee_status(school_id, gender, db)
    
    return {"message": "Command executed."}


async def create_all_classes(school_id: str, gender: str, db) -> dict:
    """Create all classes"""
    class_names = [
        "Nursery", "LKG", "UKG",
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
        "Class 11", "Class 12"
    ]
    
    created = 0
    existing = 0
    
    for name in class_names:
        exists = await db.classes.find_one({"school_id": school_id, "name": name})
        if exists:
            existing += 1
            continue
        
        await db.classes.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "name": name,
            "section": "A",
            "sections": ["A"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "tino_ai"
        })
        created += 1
    
    if created > 0:
        if gender == "male":
            msg = f"Ho gaya! Maine {created} classes create kar di hain - Nursery se Class 12th tak."
        else:
            msg = f"Ho gaya! Maine {created} classes create kar di hain - Nursery se Class 12th tak."
    else:
        if gender == "male":
            msg = f"Sabhi {existing} classes pehle se hain. Koi nayi class nahi banayi."
        else:
            msg = f"Sabhi {existing} classes pehle se hain. Koi nayi class nahi banayi."
    
    return {"message": msg, "data": {"created": created, "existing": existing}}


async def get_attendance_summary(school_id: str, gender: str, db) -> dict:
    """Get today's attendance"""
    today = date.today().isoformat()
    
    total_students = await db.students.count_documents({"school_id": school_id, "is_active": True})
    attendance = await db.attendance.find({"school_id": school_id, "date": today}).to_list(1000)
    
    present = sum(1 for a in attendance if a.get("status") == "present")
    absent = len(attendance) - present
    
    if len(attendance) > 0:
        pct = round((present / len(attendance)) * 100, 1)
        if gender == "male":
            msg = f"Aaj ki attendance: {present} present, {absent} absent. Total {pct}% attendance hai."
        else:
            msg = f"Aaj ki attendance: {present} present, {absent} absent. Total {pct}% attendance hai."
    elif total_students > 0:
        if gender == "male":
            msg = f"Aaj attendance mark nahi hui. Total {total_students} students hain."
        else:
            msg = f"Aaj attendance mark nahi hui. Total {total_students} students hain."
    else:
        if gender == "male":
            msg = "Abhi koi student nahi hai. Pehle students add karo."
        else:
            msg = "Abhi koi student nahi hai. Pehle students add karo."
    
    return {
        "message": msg,
        "data": {"total": total_students, "present": present, "absent": absent, "date": today}
    }


async def get_fee_status(school_id: str, gender: str, db) -> dict:
    """Get fee status"""
    pending = await db.fees.count_documents({"school_id": school_id, "status": {"$in": ["pending", "partial"]}})
    paid = await db.fees.count_documents({"school_id": school_id, "status": "paid"})
    total_students = await db.students.count_documents({"school_id": school_id})
    
    if pending > 0:
        if gender == "male":
            msg = f"Fee Status: {pending} students ki fee pending hai. {paid} ne pay kar diya hai."
        else:
            msg = f"Fee Status: {pending} students ki fee pending hai. {paid} ne pay kar diya hai."
    elif total_students > 0:
        if gender == "male":
            msg = f"Bahut badhiya! Sabhi {total_students} students ki fee clear hai."
        else:
            msg = f"Bahut badhiya! Sabhi {total_students} students ki fee clear hai."
    else:
        if gender == "male":
            msg = "Abhi koi fee record nahi hai."
        else:
            msg = "Abhi koi fee record nahi hai."
    
    return {"message": msg, "data": {"pending": pending, "paid": paid, "total_students": total_students}}


# Legacy endpoint
@router.post("/process-command", response_model=CommandResponse)
async def process_command_legacy(request: CommandRequest):
    """Legacy endpoint"""
    chat_request = ChatMessage(
        message=request.command,
        school_id=request.school_id,
        user_id=request.user_id,
        user_role=request.user_role,
        voice_gender=request.voice_gender
    )
    return await chat_with_tino(chat_request)
