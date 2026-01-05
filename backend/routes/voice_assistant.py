"""
Voice Assistant API Routes - Tino AI
- Speech-to-Text using OpenAI Whisper
- Text-to-Speech using ElevenLabs (Male/Female voices)
- AI Command Processing with OpenAI GPT for smart responses
- Role-based actions for Director, Teacher, Staff, Student
"""
import os
import io
import base64
import logging
import uuid
from typing import Optional, List
from datetime import datetime, timezone, date
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

# API Keys
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# ElevenLabs Voice IDs - Best Hindi voices
VOICE_IDS = {
    "male": "pNInz6obpgDQGcFmaJgB",      # Adam - Deep male voice
    "female": "21m00Tcm4TlvDq8ikWAM"     # Rachel - Soft female voice
}

# Alternative Hindi-friendly voices
HINDI_VOICES = {
    "male": "ErXwobaYiN019PkySvjV",       # Antoni - Clear male
    "female": "EXAVITQu4vr4xnSDxMaL"      # Bella - Natural female
}

# Initialize clients
eleven_client = None
stt_client = None
openai_client = None

try:
    from elevenlabs import ElevenLabs
    if ELEVENLABS_API_KEY:
        eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        logger.info("ElevenLabs client initialized")
except Exception as e:
    logger.warning(f"ElevenLabs init failed: {e}")

try:
    from emergentintegrations.llm.openai import OpenAISpeechToText
    if EMERGENT_LLM_KEY:
        stt_client = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        logger.info("OpenAI STT initialized")
except Exception as e:
    logger.warning(f"STT init failed: {e}")

try:
    from openai import OpenAI
    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized")
except Exception as e:
    logger.warning(f"OpenAI init failed: {e}")


# Pydantic Models
class TTSRequest(BaseModel):
    text: str
    voice_gender: str = "female"  # male or female

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
    action_type: Optional[str] = None  # redirect, data, execute
    requires_confirmation: bool = False
    confirmation_message: Optional[str] = None
    data: Optional[dict] = None
    audio_base64: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    school_id: str
    user_id: str
    user_role: str = "director"
    user_name: str = "User"
    voice_gender: str = "female"


# Role-based system prompts
ROLE_PROMPTS = {
    "director": """You are Tino, an AI assistant for school directors. You help with:
- School management overview
- Staff and student management
- Fee collection status
- Attendance reports
- Creating classes and notices
Always be professional, helpful and speak in Hinglish (mix of Hindi and English).
Keep responses short and actionable. Actually DO the work when asked.""",

    "teacher": """You are Tino, an AI assistant for teachers. You help with:
- Class management
- Student attendance
- Creating question papers
- Syllabus progress
- Leave applications
Always be supportive and speak in Hinglish. Keep responses concise.""",

    "student": """You are Tino, an AI assistant for students. You help with:
- Homework and study tips
- Exam schedules
- Fee payment status
- Attendance records
Be friendly and encouraging. Speak in simple Hinglish.""",

    "accountant": """You are Tino, an AI assistant for school accountants. You help with:
- Fee collection and pending dues
- Salary management
- Expense tracking
- Financial reports
Be precise with numbers. Speak in Hinglish."""
}


def get_voice_id(gender: str) -> str:
    """Get ElevenLabs voice ID based on gender"""
    return VOICE_IDS.get(gender, VOICE_IDS["female"])


def generate_audio(text: str, gender: str = "female") -> Optional[str]:
    """Generate TTS audio using ElevenLabs"""
    if not eleven_client:
        return None
    
    try:
        from elevenlabs.types import VoiceSettings
        
        voice_id = get_voice_id(gender)
        
        voice_settings = VoiceSettings(
            stability=0.7,
            similarity_boost=0.8,
            style=0.4,
            use_speaker_boost=True
        )
        
        audio_generator = eleven_client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            voice_settings=voice_settings
        )
        
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        return base64.b64encode(audio_data).decode()
        
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        return None


async def get_ai_response(message: str, role: str, context: dict = None) -> str:
    """Get AI response using OpenAI GPT"""
    if not openai_client:
        return "AI service not available. Please configure OpenAI API key."
    
    try:
        system_prompt = ROLE_PROMPTS.get(role, ROLE_PROMPTS["director"])
        
        # Add context if available
        if context:
            system_prompt += f"\n\nCurrent context:\n"
            if context.get("school_name"):
                system_prompt += f"- School: {context['school_name']}\n"
            if context.get("total_students"):
                system_prompt += f"- Total Students: {context['total_students']}\n"
            if context.get("pending_fees"):
                system_prompt += f"- Pending Fees: ₹{context['pending_fees']}\n"
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"AI response failed: {e}")
        return f"Maaf kijiye, kuch technical problem hai. Error: {str(e)}"


# Command detection and execution
COMMANDS = {
    "create_classes": {
        "keywords": ["create all classes", "sabhi classes", "nursery se 12th", "sab class banao", "classes create"],
        "roles": ["director", "principal"],
        "confirm": True,
        "message": "Kya aap Nursery se Class 12th tak sabhi classes create karna chahte hain?"
    },
    "show_attendance": {
        "keywords": ["attendance", "hajri", "kitne present", "aaj ki attendance"],
        "roles": ["director", "teacher", "principal"],
        "confirm": False
    },
    "fee_status": {
        "keywords": ["fee", "fees", "pending", "collection", "kitni fee", "baki fee"],
        "roles": ["director", "accountant", "principal"],
        "confirm": False
    },
    "add_student": {
        "keywords": ["add student", "naya student", "student add", "admission"],
        "roles": ["director", "admission_staff", "clerk"],
        "confirm": False,
        "redirect": "/app/students"
    },
    "send_notice": {
        "keywords": ["notice", "announcement", "sabko batao", "circular"],
        "roles": ["director", "teacher", "principal"],
        "confirm": False,
        "redirect": "/app/notices"
    },
    "ai_paper": {
        "keywords": ["paper", "question paper", "exam paper", "paper banao"],
        "roles": ["director", "teacher"],
        "confirm": False,
        "redirect": "/app/ai-paper"
    },
    "my_classes": {
        "keywords": ["meri class", "my class", "assigned class"],
        "roles": ["teacher"],
        "confirm": False
    },
    "my_fees": {
        "keywords": ["meri fee", "my fee", "fee status"],
        "roles": ["student"],
        "confirm": False
    }
}


def detect_command(text: str, role: str) -> Optional[dict]:
    """Detect command from text based on user role"""
    text_lower = text.lower()
    
    for cmd_key, cmd_data in COMMANDS.items():
        # Check if role is allowed
        if role not in cmd_data.get("roles", []):
            continue
            
        for keyword in cmd_data["keywords"]:
            if keyword in text_lower:
                return {"key": cmd_key, **cmd_data}
    
    return None


# API Endpoints
@router.get("/status")
async def check_status():
    """Check voice services availability"""
    return {
        "tts_available": eleven_client is not None,
        "stt_available": stt_client is not None,
        "ai_available": openai_client is not None,
        "voices": {
            "male": {"id": VOICE_IDS["male"], "name": "Adam"},
            "female": {"id": VOICE_IDS["female"], "name": "Rachel"}
        },
        "message": "Tino AI ready!" if all([eleven_client, openai_client]) else "Some services not configured"
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
    if not eleven_client:
        raise HTTPException(status_code=503, detail="TTS not available")
    
    audio_b64 = generate_audio(request.text, request.voice_gender)
    
    if not audio_b64:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    
    return {"audio_base64": audio_b64, "text": request.text, "voice": request.voice_gender}


@router.post("/chat", response_model=CommandResponse)
async def chat_with_tino(request: ChatMessage):
    """Chat with Tino AI - supports text input"""
    db = get_database()
    
    # Get school context
    context = {}
    try:
        school = await db.schools.find_one({"id": request.school_id})
        if school:
            context["school_name"] = school.get("name", "School")
        
        # Get stats
        student_count = await db.students.count_documents({"school_id": request.school_id})
        context["total_students"] = student_count
        
        # Get pending fees (simplified)
        pending = await db.fees.count_documents({"school_id": request.school_id, "status": "pending"})
        context["pending_fees"] = pending * 5000  # Approximate
    except:
        pass
    
    # Detect if it's a command
    cmd = detect_command(request.message, request.user_role)
    
    if cmd:
        # Handle command
        if cmd.get("redirect"):
            response_text = f"Aapko {cmd['key'].replace('_', ' ')} page par le ja raha hoon."
            audio_b64 = generate_audio(response_text, request.voice_gender)
            
            return CommandResponse(
                message=response_text,
                action=cmd["key"],
                action_type="redirect",
                data={"redirect": cmd["redirect"]},
                audio_base64=audio_b64
            )
        
        if cmd.get("confirm"):
            audio_b64 = generate_audio(cmd["message"], request.voice_gender)
            return CommandResponse(
                message=cmd["message"],
                action=cmd["key"],
                requires_confirmation=True,
                confirmation_message=cmd["message"],
                audio_base64=audio_b64
            )
        
        # Execute command
        result = await execute_command(cmd["key"], request.school_id, request.user_role, db)
        audio_b64 = generate_audio(result["message"], request.voice_gender)
        
        return CommandResponse(
            message=result["message"],
            action=cmd["key"],
            action_type="data",
            data=result.get("data"),
            audio_base64=audio_b64
        )
    
    # No command detected - use AI for general chat
    ai_response = await get_ai_response(request.message, request.user_role, context)
    audio_b64 = generate_audio(ai_response, request.voice_gender)
    
    # Save conversation
    try:
        await db.ai_conversations.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": request.school_id,
            "user_id": request.user_id,
            "user_role": request.user_role,
            "user_input": request.message,
            "ai_response": ai_response,
            "action_type": "chat",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except:
        pass
    
    return CommandResponse(
        message=ai_response,
        action_type="chat",
        audio_base64=audio_b64
    )


@router.post("/execute-command", response_model=CommandResponse)
async def execute_confirmed_command(request: CommandRequest):
    """Execute a confirmed command"""
    db = get_database()
    
    # Detect command
    cmd = detect_command(request.command, request.user_role)
    
    if not cmd:
        response_text = "Command samajh nahi aaya. Kripya dobara try karein."
        audio_b64 = generate_audio(response_text, request.voice_gender)
        return CommandResponse(message=response_text, audio_base64=audio_b64)
    
    # Execute
    result = await execute_command(cmd["key"], request.school_id, request.user_role, db)
    audio_b64 = generate_audio(result["message"], request.voice_gender)
    
    # Save to history
    try:
        await db.ai_conversations.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": request.school_id,
            "user_id": request.user_id,
            "user_input": request.command,
            "ai_response": result["message"],
            "action_type": "command",
            "action_data": {"command": cmd["key"], "result": result.get("data")},
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except:
        pass
    
    return CommandResponse(
        message=result["message"],
        action=cmd["key"],
        action_type="execute",
        data=result.get("data"),
        audio_base64=audio_b64
    )


async def execute_command(cmd_key: str, school_id: str, role: str, db) -> dict:
    """Execute command based on key"""
    
    if cmd_key == "create_classes":
        return await create_all_classes(school_id, db)
    
    elif cmd_key == "show_attendance":
        return await get_attendance_summary(school_id, db)
    
    elif cmd_key == "fee_status":
        return await get_fee_status(school_id, db)
    
    elif cmd_key == "my_classes":
        return {"message": "Aapki assigned classes dekhne ke liye Classes section mein jaayein.", 
                "data": {"redirect": "/app/classes"}}
    
    elif cmd_key == "my_fees":
        return {"message": "Aapki fee details dekhne ke liye Fee section check karein.",
                "data": {"redirect": "/fee-payment"}}
    
    return {"message": "Command executed."}


async def create_all_classes(school_id: str, db) -> dict:
    """Create all classes from Nursery to 12th"""
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
        msg = f"Done! Maine {created} nayi classes create kar di hain - Nursery se Class 12th tak. Ab aap students add kar sakte hain."
    else:
        msg = f"Sabhi {existing} classes pehle se exist karti hain. Koi nayi class create nahi hui."
    
    return {"message": msg, "data": {"created": created, "existing": existing}}


async def get_attendance_summary(school_id: str, db) -> dict:
    """Get today's attendance"""
    today = date.today().isoformat()
    
    # Count students
    total_students = await db.students.count_documents({"school_id": school_id, "is_active": True})
    
    # Get today's attendance
    attendance_records = await db.attendance.find({
        "school_id": school_id,
        "date": today
    }).to_list(1000)
    
    present = sum(1 for a in attendance_records if a.get("status") == "present")
    absent = len(attendance_records) - present
    
    if len(attendance_records) > 0:
        pct = round((present / len(attendance_records)) * 100, 1)
        msg = f"Aaj ki attendance report: {present} students present, {absent} absent. Attendance {pct}% hai."
    elif total_students > 0:
        msg = f"Aaj ki attendance abhi mark nahi hui. Total {total_students} students hain."
    else:
        msg = "Abhi koi student registered nahi hai. Pehle students add karein."
    
    return {
        "message": msg,
        "data": {
            "total": total_students,
            "present": present,
            "absent": absent,
            "date": today
        }
    }


async def get_fee_status(school_id: str, db) -> dict:
    """Get fee collection status"""
    # Count pending fees
    pending_count = await db.fees.count_documents({
        "school_id": school_id,
        "status": {"$in": ["pending", "partial"]}
    })
    
    # Count paid
    paid_count = await db.fees.count_documents({
        "school_id": school_id,
        "status": "paid"
    })
    
    # Get total students
    total_students = await db.students.count_documents({"school_id": school_id})
    
    if pending_count > 0:
        msg = f"Fee Status: {pending_count} students ki fee pending hai. {paid_count} students ne pay kar diya hai."
    elif total_students > 0:
        msg = f"Bahut badhiya! Sabhi {total_students} students ki fee clear hai."
    else:
        msg = "Abhi koi fee record nahi hai. Pehle students add karein aur fee structure set karein."
    
    return {
        "message": msg,
        "data": {
            "pending": pending_count,
            "paid": paid_count,
            "total_students": total_students
        }
    }


# Legacy endpoint compatibility
@router.post("/process-command", response_model=CommandResponse)
async def process_command_legacy(request: CommandRequest):
    """Legacy endpoint - redirects to chat"""
    chat_request = ChatMessage(
        message=request.command,
        school_id=request.school_id,
        user_id=request.user_id,
        user_role=request.user_role,
        voice_gender=request.voice_gender
    )
    return await chat_with_tino(chat_request)
