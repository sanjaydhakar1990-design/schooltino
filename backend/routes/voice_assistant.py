"""
Voice Assistant API Routes
- Speech-to-Text using OpenAI Whisper
- Text-to-Speech using ElevenLabs (Female voice)
- AI Command Processing with confirmation
"""
import os
import io
import base64
import logging
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
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

# ElevenLabs setup
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# Female voice ID - Rachel (default female voice in ElevenLabs)
FEMALE_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel - soft female voice

# Initialize clients
eleven_client = None
stt_client = None

try:
    from elevenlabs import ElevenLabs
    from elevenlabs.types import VoiceSettings
    if ELEVENLABS_API_KEY:
        eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        logger.info("ElevenLabs client initialized successfully")
except ImportError as e:
    logger.warning(f"ElevenLabs not installed: {e}")
except Exception as e:
    logger.error(f"Failed to initialize ElevenLabs: {e}")

try:
    from emergentintegrations.llm.openai import OpenAISpeechToText
    if EMERGENT_LLM_KEY:
        stt_client = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        logger.info("OpenAI STT client initialized successfully")
except ImportError as e:
    logger.warning(f"emergentintegrations not installed: {e}")
except Exception as e:
    logger.error(f"Failed to initialize STT: {e}")


# Pydantic Models
class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = FEMALE_VOICE_ID


class TTSResponse(BaseModel):
    audio_base64: str
    text: str


class CommandRequest(BaseModel):
    command: str
    school_id: str
    user_id: str
    confirmed: bool = False


class CommandResponse(BaseModel):
    message: str
    action: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_message: Optional[str] = None
    data: Optional[dict] = None
    audio_base64: Optional[str] = None


class VoiceAvailability(BaseModel):
    tts_available: bool
    stt_available: bool
    message: str


# Available voice commands
VOICE_COMMANDS = {
    "create_all_classes": {
        "keywords": ["create all classes", "sabhi classes banao", "sab class banao", "nursery se 12th tak", "all classes create"],
        "action": "create_all_classes",
        "confirmation_required": True,
        "confirmation_message": "Kya aap Nursery se Class 12th tak sabhi classes create karna chahte hain?"
    },
    "add_student": {
        "keywords": ["add student", "student add karo", "naya student", "new student"],
        "action": "add_student",
        "confirmation_required": True,
        "confirmation_message": "Kya aap naya student add karna chahte hain?"
    },
    "show_attendance": {
        "keywords": ["attendance dikha", "show attendance", "aaj ki attendance", "today attendance"],
        "action": "show_attendance",
        "confirmation_required": False
    },
    "fee_status": {
        "keywords": ["fee status", "pending fees", "fee collection", "kitni fee baki"],
        "action": "fee_status",
        "confirmation_required": False
    },
    "send_notice": {
        "keywords": ["notice bhejo", "send notice", "announcement", "sabko batao"],
        "action": "send_notice",
        "confirmation_required": True,
        "confirmation_message": "Kya aap notice send karna chahte hain?"
    },
    "show_dashboard": {
        "keywords": ["dashboard dikha", "show dashboard", "overview", "summary"],
        "action": "show_dashboard",
        "confirmation_required": False
    }
}


def detect_command(text: str) -> Optional[dict]:
    """Detect command from transcribed text"""
    text_lower = text.lower()
    
    for cmd_key, cmd_data in VOICE_COMMANDS.items():
        for keyword in cmd_data["keywords"]:
            if keyword in text_lower:
                return {
                    "command_key": cmd_key,
                    **cmd_data
                }
    return None


def generate_audio_response(text: str, voice_id: str = FEMALE_VOICE_ID) -> Optional[str]:
    """Generate TTS audio using ElevenLabs"""
    if not eleven_client:
        return None
    
    try:
        from elevenlabs.types import VoiceSettings
        
        voice_settings = VoiceSettings(
            stability=0.7,
            similarity_boost=0.8,
            style=0.5,
            use_speaker_boost=True
        )
        
        audio_generator = eleven_client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        # Collect audio data
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        # Convert to base64
        audio_b64 = base64.b64encode(audio_data).decode()
        return audio_b64
        
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        return None


@router.get("/status", response_model=VoiceAvailability)
async def check_voice_status():
    """Check if voice services are available"""
    tts_ok = eleven_client is not None and ELEVENLABS_API_KEY is not None
    stt_ok = stt_client is not None and EMERGENT_LLM_KEY is not None
    
    if tts_ok and stt_ok:
        message = "Voice Assistant ready! Main aapki madad ke liye taiyar hoon."
    elif tts_ok:
        message = "Text-to-Speech available, but Speech-to-Text not configured."
    elif stt_ok:
        message = "Speech-to-Text available, but Text-to-Speech not configured."
    else:
        message = "Voice services not configured. Please add API keys."
    
    return VoiceAvailability(
        tts_available=tts_ok,
        stt_available=stt_ok,
        message=message
    )


@router.post("/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: str = Form(default="hi")
):
    """Transcribe audio to text using OpenAI Whisper"""
    if not stt_client:
        raise HTTPException(
            status_code=503,
            detail="Speech-to-Text service not available. Please configure EMERGENT_LLM_KEY."
        )
    
    try:
        # Read audio content
        audio_content = await audio_file.read()
        audio_io = io.BytesIO(audio_content)
        audio_io.name = audio_file.filename or "audio.webm"
        
        # Transcribe using Whisper
        response = await stt_client.transcribe(
            file=audio_io,
            model="whisper-1",
            response_format="json",
            language=language
        )
        
        transcribed_text = response.text if hasattr(response, 'text') else str(response)
        
        # Detect command
        detected_cmd = detect_command(transcribed_text)
        
        return {
            "transcribed_text": transcribed_text,
            "detected_command": detected_cmd
        }
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using ElevenLabs female voice"""
    if not eleven_client:
        raise HTTPException(
            status_code=503,
            detail="Text-to-Speech service not available. Please configure ELEVENLABS_API_KEY."
        )
    
    try:
        audio_b64 = generate_audio_response(request.text, request.voice_id)
        
        if not audio_b64:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        
        return TTSResponse(
            audio_base64=audio_b64,
            text=request.text
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.post("/process-command", response_model=CommandResponse)
async def process_voice_command(request: CommandRequest):
    """Process voice command and execute action with confirmation"""
    from core.database import db
    
    # Detect command from text
    detected_cmd = detect_command(request.command)
    
    if not detected_cmd:
        response_text = "Maaf kijiye, main aapka command samajh nahi paya. Kripya dobara bolein."
        audio_b64 = generate_audio_response(response_text)
        
        return CommandResponse(
            message=response_text,
            audio_base64=audio_b64
        )
    
    action = detected_cmd["action"]
    requires_confirmation = detected_cmd.get("confirmation_required", False)
    
    # If confirmation is required and not confirmed
    if requires_confirmation and not request.confirmed:
        confirmation_msg = detected_cmd.get("confirmation_message", "Kya aap confirm karte hain?")
        audio_b64 = generate_audio_response(confirmation_msg)
        
        return CommandResponse(
            message=confirmation_msg,
            action=action,
            requires_confirmation=True,
            confirmation_message=confirmation_msg,
            audio_base64=audio_b64
        )
    
    # Execute confirmed commands
    result = await execute_command(action, request.school_id, db)
    
    response_text = result.get("message", "Command executed successfully!")
    audio_b64 = generate_audio_response(response_text)
    
    return CommandResponse(
        message=response_text,
        action=action,
        requires_confirmation=False,
        data=result.get("data"),
        audio_base64=audio_b64
    )


async def execute_command(action: str, school_id: str, db) -> dict:
    """Execute the confirmed command"""
    
    if action == "create_all_classes":
        return await create_all_classes(school_id, db)
    
    elif action == "show_attendance":
        return await get_attendance_summary(school_id, db)
    
    elif action == "fee_status":
        return await get_fee_status(school_id, db)
    
    elif action == "show_dashboard":
        return {"message": "Dashboard page par redirect kar raha hoon.", "data": {"redirect": "/app/dashboard"}}
    
    elif action == "add_student":
        return {"message": "Student add karne ke liye Students page par jaayein.", "data": {"redirect": "/app/students"}}
    
    elif action == "send_notice":
        return {"message": "Notice bhejne ke liye Notices page par jaayein.", "data": {"redirect": "/app/notices"}}
    
    return {"message": "Command processed."}


async def create_all_classes(school_id: str, db) -> dict:
    """Create all classes from Nursery to 12th"""
    
    class_names = [
        "Nursery", "LKG", "UKG",
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
        "Class 11", "Class 12"
    ]
    
    created_count = 0
    existing_count = 0
    
    for class_name in class_names:
        # Check if class already exists
        existing = await db.classes.find_one({
            "school_id": school_id,
            "name": class_name
        })
        
        if existing:
            existing_count += 1
            continue
        
        # Create new class
        class_doc = {
            "school_id": school_id,
            "name": class_name,
            "sections": ["A"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "voice_assistant"
        }
        
        await db.classes.insert_one(class_doc)
        created_count += 1
    
    if created_count > 0:
        message = f"Maine {created_count} nayi classes create kar di hain! Nursery se Class 12th tak."
    elif existing_count > 0:
        message = f"Sabhi {existing_count} classes pehle se exist karti hain."
    else:
        message = "Classes create ho gayi hain."
    
    return {
        "message": message,
        "data": {
            "created": created_count,
            "existing": existing_count
        }
    }


async def get_attendance_summary(school_id: str, db) -> dict:
    """Get today's attendance summary"""
    from datetime import date
    
    today = date.today().isoformat()
    
    # Get attendance records for today
    attendance = await db.attendance.find({
        "school_id": school_id,
        "date": today
    }).to_list(1000)
    
    total = len(attendance)
    present = sum(1 for a in attendance if a.get("status") == "present")
    absent = total - present
    
    if total > 0:
        percentage = round((present / total) * 100, 1)
        message = f"Aaj ki attendance: {present} students present hain, {absent} absent. Attendance {percentage}% hai."
    else:
        message = "Aaj ki attendance abhi record nahi hui hai."
    
    return {
        "message": message,
        "data": {
            "total": total,
            "present": present,
            "absent": absent
        }
    }


async def get_fee_status(school_id: str, db) -> dict:
    """Get fee collection status"""
    
    # Get pending fees
    students_with_pending = await db.students.count_documents({
        "school_id": school_id,
        "fee_status": {"$ne": "paid"}
    })
    
    # Get recent payments
    recent_payments = await db.payments.find({
        "school_id": school_id
    }).sort("created_at", -1).limit(5).to_list(5)
    
    total_collected = sum(p.get("amount", 0) for p in recent_payments)
    
    message = f"{students_with_pending} students ki fees pending hai. Recent collection ₹{total_collected:,.0f} hai."
    
    return {
        "message": message,
        "data": {
            "pending_students": students_with_pending,
            "recent_collection": total_collected
        }
    }


@router.get("/available-commands")
async def get_available_commands():
    """Get list of available voice commands"""
    commands = []
    for cmd_key, cmd_data in VOICE_COMMANDS.items():
        commands.append({
            "command": cmd_key,
            "keywords": cmd_data["keywords"][:2],  # Show first 2 keywords
            "requires_confirmation": cmd_data.get("confirmation_required", False)
        })
    
    return {
        "commands": commands,
        "languages": ["Hindi", "Hinglish", "English"],
        "tip": "Aap Hindi ya English mein bol sakte hain!"
    }
