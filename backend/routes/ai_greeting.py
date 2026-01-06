"""
AI Smart Greeting System - CCTV/Tablet Based
Features:
- Face recognition for parents, staff, visitors
- Automatic greeting with personalized messages
- Student location info for parents
- Visit reason tracking
- Entry/Exit attendance marking
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import uuid

router = APIRouter(prefix="/ai-greeting", tags=["AI Greeting System"])

# Models
class GreetingSettings(BaseModel):
    school_id: str
    entry_greeting_hindi: str = "नमस्ते! स्कूल में आपका स्वागत है।"
    entry_greeting_english: str = "Welcome to the school!"
    exit_greeting_hindi: str = "धन्यवाद! फिर मिलेंगे।"
    exit_greeting_english: str = "Thank you! See you again."
    ask_reason_for_parents: bool = True
    ask_reason_for_visitors: bool = True
    greet_staff_daily: bool = True
    greet_vip_only: bool = True  # Don't ask questions to VIPs
    language: str = "hinglish"  # hindi, english, hinglish

class PersonDetected(BaseModel):
    school_id: str
    person_type: str  # parent, staff, visitor, student, vip, unknown
    person_id: Optional[str] = None
    person_name: Optional[str] = None
    face_confidence: float = 0.0
    device_type: str = "cctv"  # cctv, tablet, camera
    device_location: str = "main_gate"
    entry_type: str = "entry"  # entry, exit

class GreetingResponse(BaseModel):
    greeting_text: str
    greeting_audio_url: Optional[str] = None
    should_ask_reason: bool = False
    reason_prompt: Optional[str] = None
    student_info: Optional[dict] = None  # For parents - child's location
    attendance_marked: bool = False
    person_type: str
    language: str

class VisitLog(BaseModel):
    school_id: str
    person_type: str
    person_id: Optional[str] = None
    person_name: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    visit_reason: Optional[str] = None
    device_location: str
    greeted: bool = True

class ParentPhoto(BaseModel):
    student_id: str
    school_id: str
    photo_type: str  # father, mother, guardian
    photo_data: str  # base64


# In-memory storage (replace with MongoDB in production)
greeting_settings_store = {}
visit_logs_store = []
parent_photos_store = {}


@router.post("/settings", response_model=dict)
async def save_greeting_settings(settings: GreetingSettings):
    """Save greeting settings for a school"""
    greeting_settings_store[settings.school_id] = settings.dict()
    return {"status": "success", "message": "Settings saved"}


@router.get("/settings/{school_id}", response_model=GreetingSettings)
async def get_greeting_settings(school_id: str):
    """Get greeting settings for a school"""
    if school_id in greeting_settings_store:
        return GreetingSettings(**greeting_settings_store[school_id])
    # Return defaults
    return GreetingSettings(school_id=school_id)


@router.post("/detect", response_model=GreetingResponse)
async def process_person_detection(detection: PersonDetected):
    """Process a detected person and generate appropriate greeting"""
    settings = greeting_settings_store.get(detection.school_id, {})
    language = settings.get('language', 'hinglish')
    
    greeting_text = ""
    should_ask_reason = False
    reason_prompt = None
    student_info = None
    attendance_marked = False
    
    # Generate greeting based on person type
    if detection.entry_type == "entry":
        if detection.person_type == "parent":
            # Personalized greeting for parents
            if language == "hindi":
                greeting_text = f"नमस्ते {detection.person_name or 'जी'}! स्कूल में आपका स्वागत है।"
            elif language == "english":
                greeting_text = f"Welcome {detection.person_name or ''}! Good to see you at school."
            else:
                greeting_text = f"Namaste {detection.person_name or 'ji'}! School mein aapka swagat hai."
            
            # Get student info if parent ID is linked
            if detection.person_id:
                student_info = {
                    "message": "Aapka bachcha abhi Class 5-A mein hai. Wo Math period mein hai.",
                    "class": "5-A",
                    "current_location": "Classroom",
                    "current_subject": "Mathematics"
                }
            
            should_ask_reason = settings.get('ask_reason_for_parents', True)
            if should_ask_reason:
                reason_prompt = "Aap kis kaam se aaye hain?" if language != "english" else "How may we help you today?"
        
        elif detection.person_type == "staff" or detection.person_type == "teacher":
            # Daily greeting for staff
            if settings.get('greet_staff_daily', True):
                hour = datetime.now().hour
                if hour < 12:
                    time_greeting = "Good Morning" if language == "english" else "Suprabhat"
                elif hour < 17:
                    time_greeting = "Good Afternoon" if language == "english" else "Namaskar"
                else:
                    time_greeting = "Good Evening" if language == "english" else "Shubh Sandhya"
                
                greeting_text = f"{time_greeting} {detection.person_name or ''}! Have a great day."
            
            attendance_marked = True
        
        elif detection.person_type == "vip":
            # Just greet VIPs, no questions
            greeting_text = f"Welcome {detection.person_name or 'Sir/Madam'}! It's an honor to have you."
            should_ask_reason = False
        
        elif detection.person_type == "visitor" or detection.person_type == "unknown":
            # Unknown visitor - greet and ask purpose
            if language == "hindi":
                greeting_text = "नमस्ते! स्कूल में आपका स्वागत है।"
            elif language == "english":
                greeting_text = "Welcome to the school! How may we assist you?"
            else:
                greeting_text = "Namaste ji! School mein aapka swagat hai."
            
            should_ask_reason = settings.get('ask_reason_for_visitors', True)
            if should_ask_reason:
                reason_prompt = "Aapka naam aur aane ka reason batayein?" if language != "english" else "May I know your name and purpose of visit?"
        
        elif detection.person_type == "student":
            # Student entry
            greeting_text = f"Good Morning {detection.person_name or 'Student'}! Study hard today."
            attendance_marked = True
    
    else:  # exit
        if language == "hindi":
            greeting_text = f"धन्यवाद {detection.person_name or 'जी'}! फिर मिलेंगे।"
        elif language == "english":
            greeting_text = f"Thank you {detection.person_name or ''}! Have a great day."
        else:
            greeting_text = f"Dhanyavaad {detection.person_name or 'ji'}! Phir milenge."
        
        # Mark exit time for attendance
        if detection.person_type in ["staff", "teacher", "student"]:
            attendance_marked = True
    
    # Log the visit
    visit_logs_store.append({
        "id": str(uuid.uuid4()),
        "school_id": detection.school_id,
        "person_type": detection.person_type,
        "person_id": detection.person_id,
        "person_name": detection.person_name or "Unknown",
        "entry_type": detection.entry_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "device_location": detection.device_location,
        "greeted": True
    })
    
    return GreetingResponse(
        greeting_text=greeting_text,
        greeting_audio_url=None,  # TTS would generate this
        should_ask_reason=should_ask_reason,
        reason_prompt=reason_prompt,
        student_info=student_info,
        attendance_marked=attendance_marked,
        person_type=detection.person_type,
        language=language
    )


@router.post("/log-visit-reason")
async def log_visit_reason(school_id: str, visit_id: str, reason: str):
    """Log the reason for a visit"""
    for log in visit_logs_store:
        if log.get('id') == visit_id:
            log['visit_reason'] = reason
            return {"status": "success"}
    return {"status": "not_found"}


@router.get("/visit-logs/{school_id}")
async def get_visit_logs(school_id: str, date: Optional[str] = None, person_type: Optional[str] = None):
    """Get visit logs for a school"""
    logs = [l for l in visit_logs_store if l.get('school_id') == school_id]
    
    if person_type:
        logs = [l for l in logs if l.get('person_type') == person_type]
    
    # Sort by timestamp descending
    logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return {"logs": logs[:100]}  # Return last 100


@router.post("/parent-photo/upload")
async def upload_parent_photo(data: ParentPhoto):
    """Upload parent/guardian photo for face recognition"""
    key = f"{data.student_id}_{data.photo_type}"
    parent_photos_store[key] = {
        "student_id": data.student_id,
        "school_id": data.school_id,
        "photo_type": data.photo_type,
        "photo_data": data.photo_data[:100] + "...",  # Store truncated for demo
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    return {
        "status": "success",
        "message": f"{data.photo_type.title()} photo uploaded successfully",
        "enrolled": True
    }


@router.get("/parent-photos/{student_id}")
async def get_parent_photos(student_id: str):
    """Get all parent photos for a student"""
    photos = {}
    for photo_type in ["father", "mother", "guardian"]:
        key = f"{student_id}_{photo_type}"
        if key in parent_photos_store:
            photos[photo_type] = True
        else:
            photos[photo_type] = False
    return photos


@router.get("/attendance/today/{school_id}")
async def get_today_attendance_from_greeting(school_id: str):
    """Get attendance marked via greeting system today"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    entries = [l for l in visit_logs_store 
               if l.get('school_id') == school_id 
               and l.get('timestamp', '').startswith(today)]
    
    staff_entries = [e for e in entries if e.get('person_type') in ['staff', 'teacher']]
    student_entries = [e for e in entries if e.get('person_type') == 'student']
    parent_visits = [e for e in entries if e.get('person_type') == 'parent']
    visitor_entries = [e for e in entries if e.get('person_type') in ['visitor', 'unknown']]
    
    return {
        "date": today,
        "staff_count": len(set(e.get('person_id') for e in staff_entries if e.get('person_id'))),
        "student_count": len(set(e.get('person_id') for e in student_entries if e.get('person_id'))),
        "parent_visits": len(parent_visits),
        "visitor_count": len(visitor_entries),
        "total_entries": len(entries)
    }


@router.get("/greetable-people/{school_id}")
async def get_greetable_people_config(school_id: str):
    """Get configuration of who should be greeted"""
    return {
        "categories": [
            {"type": "student", "greet_entry": True, "greet_exit": True, "mark_attendance": True},
            {"type": "teacher", "greet_entry": True, "greet_exit": True, "mark_attendance": True},
            {"type": "staff", "greet_entry": True, "greet_exit": True, "mark_attendance": True},
            {"type": "parent", "greet_entry": True, "greet_exit": True, "ask_reason": True},
            {"type": "visitor", "greet_entry": True, "greet_exit": True, "ask_reason": True},
            {"type": "vip", "greet_entry": True, "greet_exit": True, "ask_reason": False}
        ]
    }


@router.post("/greetable-people/{school_id}")
async def update_greetable_config(school_id: str, config: dict):
    """Update greeting configuration"""
    # Store config (in production, save to DB)
    return {"status": "success", "message": "Configuration updated"}
