"""
TINO BRAIN - Unified AI Intelligence System
============================================
Single AI that manages everything:
- Dashboard insights for Admin/Teacher/Staff/Student
- CCTV monitoring and anomaly detection
- Face recognition integration
- Proactive alerts and notifications
- Student behavior monitoring
- Real-time tracking and reporting
- Voice command execution
"""
import os
import uuid
import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from enum import Enum

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tino-brain", tags=["Tino Brain - Unified AI"])

from core.database import db

def get_database():
    return db

# OpenAI client - Use Emergent LLM Key for better reliability
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")
openai_client = None

# Try Emergent Integrations first
emergent_chat = None
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    if EMERGENT_LLM_KEY:
        emergent_chat = True  # Flag to use emergent
        logger.info("Using Emergent LLM Key for Tino Brain")
except ImportError:
    logger.warning("emergentintegrations not installed, falling back to direct OpenAI")

# Fallback to direct OpenAI
try:
    from openai import OpenAI
    if OPENAI_API_KEY and not emergent_chat:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
except:
    pass

# Helper function to get AI response
async def get_ai_response(prompt: str, system_message: str, session_id: str = None) -> str:
    """Get AI response using Emergent LLM or fallback to OpenAI"""
    try:
        # Use Emergent LLM Key (preferred)
        if EMERGENT_LLM_KEY:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id or f"tino-{uuid.uuid4().hex[:8]}",
                system_message=system_message
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            return response
        
        # Fallback to direct OpenAI
        elif openai_client:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
            return "AI service unavailable. Please try again later."
            
    except Exception as e:
        logger.error(f"AI response error: {str(e)}")
        raise Exception(f"AI error: {str(e)}")

# ============== ENUMS & MODELS ==============

class AlertPriority(str, Enum):
    CRITICAL = "critical"    # Immediate action needed (fight, emergency)
    HIGH = "high"           # Important (unauthorized area, missing student)
    MEDIUM = "medium"       # Attention needed (misbehavior, late arrival)
    LOW = "low"             # Informational (reminders, updates)

class AlertType(str, Enum):
    FIGHT_DETECTED = "fight_detected"
    UNAUTHORIZED_AREA = "unauthorized_area"
    MISSING_STUDENT = "missing_student"
    UNUSUAL_CROWD = "unusual_crowd"
    MISBEHAVIOR = "misbehavior"
    ATTENDANCE_ISSUE = "attendance_issue"
    FEE_REMINDER = "fee_reminder"
    PERFORMANCE_DROP = "performance_drop"
    HEALTH_CONCERN = "health_concern"
    CUSTOM = "custom"

class TinoBrainQuery(BaseModel):
    query: str
    school_id: str
    user_id: str
    user_role: str
    user_name: str = "User"
    voice_gender: str = "female"
    language: str = "hinglish"  # hindi, english, hinglish - AI will respond in this language
    context: Optional[Dict] = None

class TinoBrainResponse(BaseModel):
    message: str
    data: Optional[Dict] = None
    action_taken: Optional[str] = None
    alerts: Optional[List[Dict]] = None
    suggestions: Optional[List[str]] = None
    audio_base64: Optional[str] = None

class AlertCreate(BaseModel):
    school_id: str
    alert_type: AlertType
    priority: AlertPriority
    title: str
    description: str
    related_ids: Optional[List[str]] = None
    location: Optional[str] = None
    auto_notify: bool = True

class CCTVEvent(BaseModel):
    school_id: str
    camera_id: str
    event_type: str  # fight, crowd, unauthorized, face_detected
    confidence: float
    location: str
    detected_faces: Optional[List[str]] = None
    timestamp: Optional[str] = None
    image_url: Optional[str] = None

# ============== TINO BRAIN CORE ==============

# Language-specific prompts for AI responses
LANGUAGE_INSTRUCTIONS = {
    "hindi": """
LANGUAGE: आपको शुद्ध हिंदी में जवाब देना है।
- सभी जवाब हिंदी में दें
- अंग्रेजी शब्दों का उपयोग न करें (तकनीकी शब्दों को छोड़कर)
- विनम्र और मधुर भाषा का प्रयोग करें
- "जी", "आप", "कृपया" जैसे आदरसूचक शब्द लगाएं
उदाहरण: "जी बिल्कुल! सभी विद्यार्थियों की उपस्थिति दर्ज कर दी गई है।"
""",
    "english": """
LANGUAGE: You must respond in proper English only.
- Give all responses in English
- Be polite and professional
- Use formal language with Sir/Ma'am
- Be concise but complete
Example: "Certainly! All students' attendance has been marked successfully."
""",
    "hinglish": """
LANGUAGE: Hinglish mein jawab do (Hindi + English mix).
- Natural conversational style
- Hindi words with English structure bhi theek hai
- Friendly aur helpful tone rakho
- "Ji", "Sir/Ma'am" lagao respect ke liye
Example: "Ji zaroor! Sab students ki attendance laga di ✅"
"""
}

# Gender-specific tone instructions
GENDER_TONE = {
    "male": """
TONE: Use masculine tone in responses.
- "Main kar raha hoon" instead of "kar rahi hoon"
- "Bhej raha hoon" instead of "bhej rahi hoon"
- Professional but friendly
""",
    "female": """
TONE: Use feminine tone in responses.
- "Main kar rahi hoon" instead of "kar raha hoon"  
- "Bhej rahi hoon" instead of "bhej raha hoon"
- Sweet and helpful tone
"""
}

TINO_SYSTEM_PROMPT = """You are TINO BRAIN - the unified AI intelligence system for Schooltino.
You have FULL ACCESS and can EXECUTE ACTIONS directly.
You are like ALEXA/SIRI for school - Admin bole aur kaam ho jaye!

Current Role: {role}
School: {school_name}

{language_instruction}
{tone_instruction}

🔥 YOUR POWERS (YOU CAN ACTUALLY DO THESE):
1. ✅ Mark attendance: "sab ki attendance laga do" / "Class 5 ko present mark karo"
2. ✅ Send notices: "notice bhejo ki kal chutti hai" / "announcement karo exam ke baare mein"
3. ✅ Fee reminders: "fee reminder bhejo" / "pending fees walo ko yaad dilao"
4. ✅ Send SMS/Notifications: "parents ko message bhejo" / "sms bhejo meeting ke liye"
5. ✅ Get student info: "Rahul ki details batao" / "Class 5 ke students"
6. ✅ Check absent students: "aaj kaun absent hai" / "gayab students ki list"
7. ✅ Fee status: "pending fees kitni hai" / "fee collection status"
8. ✅ School overview: "school ka pura status" / "sab batao"
9. ✅ Create alerts: "urgent alert banao" / "emergency warning do"

🧠 CLASS INTELLIGENCE - SPECIAL POWER:
When admin says "Is class ki condition batao" or "Class 10 ka status":
- 📊 Attendance batao (aaj aur weekly trend)
- 📚 Syllabus progress (subject-wise kitna complete hua)
- 📉 Weak students (kaun peeche hai aur kyun)
- 👨‍🏫 Teacher performance (kaun achha padha raha, kaun manage nahi kar raha)
- 🏆 Class ranking (sab classes mein ye kahan hai)

CLASS INTELLIGENCE COMMANDS:
- "Is class ki condition batao" → Full class report
- "Weak bachhe kaun hai" → List weak students with reasons
- "Teacher kaisa padha raha" → Teacher performance ratings
- "Syllabus kitna complete hua" → Subject-wise syllabus status
- "Class compare karo" → All classes ranking

IMPORTANT RULES:
- ALWAYS respond in the specified language above
- When user gives a command, CONFIRM that you're executing it
- Be madhur (sweet) and helpful in tone
- Give DIRECT answers with DATA, not vague responses
- For sensitive actions (delete, fee waiver), ask for confirmation
- If action succeeded, tell clearly what was done
- If action failed, explain why
- DETECT user's language from their message and match it if no language specified
"""

async def get_school_context(school_id: str, db) -> Dict:
    """Get comprehensive school context for AI"""
    context = {
        "school_name": "School",
        "total_students": 0,
        "total_staff": 0,
        "total_classes": 0,
        "today_attendance": {"present": 0, "absent": 0, "percentage": 0},
        "pending_fees_count": 0,
        "active_alerts": 0,
        "recent_events": []
    }
    
    try:
        # School info
        school = await db.schools.find_one({"id": school_id})
        if school:
            context["school_name"] = school.get("name", "School")
        
        # Counts
        context["total_students"] = await db.students.count_documents({"school_id": school_id, "is_active": True})
        context["total_staff"] = await db.users.count_documents({"school_id": school_id, "role": {"$ne": "student"}})
        context["total_classes"] = await db.classes.count_documents({"school_id": school_id})
        
        # Today's attendance
        today = date.today().isoformat()
        attendance = await db.attendance.find({"school_id": school_id, "date": today}).to_list(1000)
        present = sum(1 for a in attendance if a.get("status") == "present")
        total = len(attendance)
        context["today_attendance"] = {
            "present": present,
            "absent": total - present,
            "total": total,
            "percentage": round((present / total * 100), 1) if total > 0 else 0
        }
        
        # Pending fees
        context["pending_fees_count"] = await db.fees.count_documents({
            "school_id": school_id, 
            "status": {"$in": ["pending", "partial"]}
        })
        
        # Active alerts
        context["active_alerts"] = await db.tino_alerts.count_documents({
            "school_id": school_id,
            "status": "active"
        })
        
        # Recent CCTV events
        recent = await db.cctv_events.find({
            "school_id": school_id
        }).sort("timestamp", -1).limit(5).to_list(5)
        context["recent_events"] = [
            {"type": e.get("event_type"), "location": e.get("location"), "time": e.get("timestamp")}
            for e in recent
        ]
        
    except Exception as e:
        logger.error(f"Context fetch error: {e}")
    
    return context

async def execute_tino_action(action: str, params: Dict, school_id: str, db) -> Dict:
    """Execute actions based on AI decision"""
    
    if action == "get_student_info":
        student = await db.students.find_one(
            {"id": params.get("student_id"), "school_id": school_id},
            {"_id": 0}
        )
        return {"student": student} if student else {"error": "Student not found"}
    
    elif action == "get_class_status":
        class_id = params.get("class_id")
        cls = await db.classes.find_one({"id": class_id}, {"_id": 0})
        students = await db.students.count_documents({"class_id": class_id, "is_active": True})
        today = date.today().isoformat()
        attendance = await db.attendance.find({"class_id": class_id, "date": today}).to_list(100)
        present = sum(1 for a in attendance if a.get("status") == "present")
        
        return {
            "class": cls,
            "total_students": students,
            "present_today": present,
            "absent_today": len(attendance) - present
        }
    
    elif action == "create_alert":
        alert = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "type": params.get("type"),
            "priority": params.get("priority", "medium"),
            "title": params.get("title"),
            "description": params.get("description"),
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "tino_brain"
        }
        await db.tino_alerts.insert_one(alert)
        return {"alert_created": True, "alert_id": alert["id"]}
    
    elif action == "send_notification":
        # Create notification for users
        notification = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "user_ids": params.get("user_ids", []),
            "message": params.get("message"),
            "type": "tino_alert",
            "status": "unread",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        return {"notification_sent": True}
    
    elif action == "get_school_overview":
        return await get_school_context(school_id, db)
    
    return {"message": "Action executed"}

# ============== SMART ACTION FUNCTIONS ==============

async def execute_attendance_action(query: str, school_id: str, db) -> Dict:
    """Execute attendance marking based on query"""
    today = date.today().isoformat()
    
    # Check if it's bulk attendance or individual
    if "sab" in query or "all" in query or "puri class" in query:
        # Mark all students present for today
        students = await db.students.find({"school_id": school_id, "is_active": True}).to_list(1000)
        marked = 0
        for student in students:
            existing = await db.attendance.find_one({
                "student_id": student.get("id"),
                "date": today
            })
            if not existing:
                await db.attendance.insert_one({
                    "id": str(uuid.uuid4()),
                    "school_id": school_id,
                    "student_id": student.get("id"),
                    "student_name": student.get("name"),
                    "class_id": student.get("class_id"),
                    "date": today,
                    "status": "present",
                    "marked_by": "tino_brain",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                marked += 1
        return {"message": f"{marked} students ko present mark kar diya", "marked_count": marked, "date": today}
    
    return {"message": "Attendance command samajh nahi aaya. Kripya specify karein.", "error": True}

async def execute_notice_action(query: str, school_id: str, user_id: str, db) -> Dict:
    """Create notice based on query"""
    # Extract notice content from query
    # Simple extraction - after "notice" word
    content = query
    for word in ["notice bhejo", "notice create", "announcement karo", "notice laga", "sab ko batao"]:
        content = content.replace(word, "").strip()
    
    if not content or len(content) < 5:
        content = "Important Notice - Please check with administration"
    
    notice = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "title": "Tino AI Notice",
        "content": content,
        "type": "general",
        "target_audience": ["all"],
        "priority": "normal",
        "is_popup": True,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "published"
    }
    await db.notices.insert_one(notice)
    
    return {
        "message": f"Notice create kar diya: '{content[:50]}...'",
        "notice_id": notice["id"],
        "sent_to": "all"
    }

async def execute_fee_reminder(school_id: str, db) -> Dict:
    """Send fee reminders to pending students"""
    pending = await db.fees.find({
        "school_id": school_id,
        "status": {"$in": ["pending", "partial"]}
    }).to_list(500)
    
    reminders_sent = 0
    for fee in pending:
        notification = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "user_id": fee.get("student_id"),
            "title": "Fee Payment Reminder",
            "message": f"Aapki pending fees ₹{fee.get('amount', 0)} hai. Kripya jaldi pay karein.",
            "type": "fee_reminder",
            "status": "unread",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        reminders_sent += 1
    
    return {
        "message": f"{reminders_sent} students ko fee reminder bhej diya",
        "reminders_sent": reminders_sent
    }

async def execute_sms_action(query: str, school_id: str, db) -> Dict:
    """Send SMS/notifications based on query"""
    # Extract message
    content = query
    for word in ["sms bhejo", "message bhejo", "notification bhejo", "parents ko batao"]:
        content = content.replace(word, "").strip()
    
    if not content or len(content) < 3:
        content = "School se important message"
    
    # Get all parents/guardians
    students = await db.students.find({"school_id": school_id, "is_active": True}).to_list(1000)
    sent_count = 0
    
    for student in students:
        notification = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "student_id": student.get("id"),
            "parent_phone": student.get("parent_phone"),
            "title": "School Notification",
            "message": content,
            "type": "sms",
            "status": "queued",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        sent_count += 1
    
    return {
        "message": f"{sent_count} parents ko message queue kar diya",
        "sent_count": sent_count,
        "content": content[:50]
    }

async def get_student_details(query: str, school_id: str, db) -> Dict:
    """Get student details"""
    # Try to extract student name from query
    students = await db.students.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0, "id": 1, "name": 1, "class_name": 1, "roll_no": 1, "parent_phone": 1}
    ).limit(10).to_list(10)
    
    return {
        "message": f"{len(students)} students found",
        "students": students
    }

async def get_absent_students(school_id: str, db) -> Dict:
    """Get today's absent students"""
    today = date.today().isoformat()
    
    # Get all students
    all_students = await db.students.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0}
    ).to_list(1000)
    
    # Get today's attendance
    attendance = await db.attendance.find({
        "school_id": school_id,
        "date": today
    }).to_list(1000)
    
    present_ids = {a.get("student_id") for a in attendance if a.get("status") == "present"}
    absent_students = [s for s in all_students if s.get("id") not in present_ids]
    
    return {
        "message": f"Aaj {len(absent_students)} students absent hain",
        "absent_count": len(absent_students),
        "absent_students": [{"name": s.get("name"), "class": s.get("class_name")} for s in absent_students[:20]],
        "date": today
    }

async def get_pending_fees(school_id: str, db) -> Dict:
    """Get pending fees summary"""
    pending = await db.fees.find({
        "school_id": school_id,
        "status": {"$in": ["pending", "partial"]}
    }, {"_id": 0}).to_list(500)
    
    total_pending = sum(f.get("amount", 0) for f in pending)
    
    return {
        "message": f"Total ₹{total_pending:,.0f} pending hai {len(pending)} students se",
        "total_pending": total_pending,
        "pending_count": len(pending),
        "top_defaulters": [
            {"student_id": f.get("student_id"), "amount": f.get("amount")}
            for f in sorted(pending, key=lambda x: x.get("amount", 0), reverse=True)[:5]
        ]
    }

async def get_class_status(query: str, school_id: str, db) -> Dict:
    """Get class status"""
    classes = await db.classes.find({"school_id": school_id}, {"_id": 0}).to_list(50)
    
    class_stats = []
    for cls in classes:
        student_count = await db.students.count_documents({
            "school_id": school_id,
            "class_id": cls.get("id"),
            "is_active": True
        })
        class_stats.append({
            "class_name": cls.get("name"),
            "section": cls.get("section"),
            "students": student_count,
            "teacher": cls.get("class_teacher")
        })
    
    return {
        "message": f"{len(classes)} classes hain school mein",
        "classes": class_stats,
        "total_classes": len(classes)
    }

async def create_smart_alert(query: str, school_id: str, db) -> Dict:
    """Create alert from natural language"""
    # Determine priority from query
    priority = "medium"
    if any(w in query for w in ["urgent", "emergency", "critical", "turant"]):
        priority = "critical"
    elif any(w in query for w in ["important", "jaruri", "high"]):
        priority = "high"
    
    # Extract title
    title = query.replace("alert banao", "").replace("alert create", "").replace("warning do", "").strip()
    if not title or len(title) < 3:
        title = "New Alert from Tino Brain"
    
    alert = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "type": "custom",
        "priority": priority,
        "title": title[:100],
        "description": f"AI Generated Alert: {title}",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "tino_brain"
    }
    await db.tino_alerts.insert_one(alert)
    
    return {
        "message": f"Alert create kar diya - Priority: {priority}",
        "alert_id": alert["id"],
        "title": title[:100],
        "priority": priority
    }

# ============== AI RESPONSE GENERATION ==============

def detect_language_from_text(text: str) -> str:
    """Detect language from user's text"""
    # Check for Hindi characters (Devanagari)
    hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    # Check for English words
    english_words = ['the', 'is', 'are', 'what', 'how', 'please', 'show', 'tell']
    english_count = sum(1 for word in english_words if word.lower() in text.lower())
    
    # Hinglish indicators
    hinglish_words = ['kya', 'hai', 'karo', 'batao', 'bhai', 'yaar', 'achha', 'theek', 'haan', 'nahi', 'kaise', 'kyun', 'kaun', 'kahan', 'kitna']
    hinglish_count = sum(1 for word in hinglish_words if word.lower() in text.lower())
    
    if hindi_chars > 5:
        return "hindi"
    elif hinglish_count >= 2:
        return "hinglish"
    elif english_count >= 2:
        return "english"
    else:
        return "hinglish"  # Default to Hinglish

async def get_ai_response_with_context(query: str, role: str, context: Dict, conversation_history: List = None, language: str = "hinglish", voice_gender: str = "female") -> str:
    """Get intelligent response from AI with language and tone support"""
    
    try:
        # Get language instruction
        lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["hinglish"])
        tone_instruction = GENDER_TONE.get(voice_gender, GENDER_TONE["female"])
        
        system_prompt = TINO_SYSTEM_PROMPT.format(
            role=role,
            school_name=context.get("school_name", "School"),
            language_instruction=lang_instruction,
            tone_instruction=tone_instruction
        )
        
        # Add context
        system_prompt += "\n\nCurrent School Status:\n"
        system_prompt += f"- Total Students: {context.get('total_students', 0)}\n"
        system_prompt += f"- Total Staff: {context.get('total_staff', 0)}\n"
        system_prompt += f"- Today's Attendance: {context.get('today_attendance', {}).get('percentage', 0)}%\n"
        system_prompt += f"- Pending Fees: {context.get('pending_fees_count', 0)} students\n"
        system_prompt += f"- Active Alerts: {context.get('active_alerts', 0)}\n"
        
        if context.get("recent_events"):
            system_prompt += "\nRecent CCTV Events:\n"
            for event in context.get("recent_events", []):
                system_prompt += f"- {event.get('type')} at {event.get('location')}\n"
        
        # Build prompt with history
        full_prompt = query
        if conversation_history:
            history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history[-5:]])
            full_prompt = f"Previous conversation:\n{history_text}\n\nUser: {query}"
        
        # Use the unified AI response function
        response = await get_ai_response(full_prompt, system_prompt)
        return response
        
    except Exception as e:
        logger.error(f"AI response error: {e}")
        return f"AI error: {str(e)}"

# ============== API ENDPOINTS ==============

@router.get("/status")
async def get_brain_status():
    """Get Tino Brain status"""
    ai_available = bool(EMERGENT_LLM_KEY) or (openai_client is not None)
    return {
        "status": "active",
        "ai_available": ai_available,
        "using_emergent": bool(EMERGENT_LLM_KEY),
        "capabilities": [
            "school_overview",
            "student_tracking",
            "cctv_monitoring",
            "alert_management",
            "proactive_notifications",
            "behavior_analysis",
            "voice_commands"
        ],
        "message": "Tino Brain ready to serve! 🧠"
    }

@router.post("/query", response_model=TinoBrainResponse)
async def query_tino_brain(request: TinoBrainQuery, background_tasks: BackgroundTasks):
    """
    Main endpoint - Ask Tino anything
    Tino will understand, analyze, and take action
    """
    db = get_database()
    
    # Get school context
    context = await get_school_context(request.school_id, db)
    context.update(request.context or {})
    
    # Get conversation history for this user
    history = await db.tino_conversations.find({
        "user_id": request.user_id,
        "school_id": request.school_id
    }).sort("timestamp", -1).limit(10).to_list(10)
    
    conversation_history = [
        {"role": "user" if h.get("is_user") else "assistant", "content": h.get("message")}
        for h in reversed(history)
    ]
    
    # Detect language from user's query if not specified or default
    language = request.language
    if not language or language == "hinglish":
        # Auto-detect from query
        detected_lang = detect_language_from_text(request.query)
        language = detected_lang
    
    # Detect intent and get AI response with language and voice gender
    ai_response = await get_ai_response_with_context(
        request.query, 
        request.user_role, 
        context,
        conversation_history,
        language=language,
        voice_gender=request.voice_gender
    )
    
    # Save conversation
    await db.tino_conversations.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": request.school_id,
        "user_id": request.user_id,
        "user_role": request.user_role,
        "message": request.query,
        "is_user": True,
        "language": language,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    await db.tino_conversations.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": request.school_id,
        "user_id": request.user_id,
        "user_role": request.user_role,
        "message": ai_response,
        "is_user": False,
        "language": language,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Check for command patterns and execute REAL ACTIONS
    action_taken = None
    data = None
    execution_results = []
    
    query_lower = request.query.lower()
    
    # ============== ACTION EXECUTION ENGINE ==============
    
    # 1. ATTENDANCE ACTIONS
    if any(k in query_lower for k in ["attendance laga", "attendance mark", "hazri laga", "present mark"]):
        # Extract class/student info from query
        result = await execute_attendance_action(query_lower, request.school_id, db)
        data = result
        action_taken = "attendance_marked"
        execution_results.append(f"✅ {result.get('message', 'Attendance action completed')}")
    
    # 2. NOTICE/ANNOUNCEMENT ACTIONS
    elif any(k in query_lower for k in ["notice bhejo", "announcement karo", "notice create", "sab ko batao", "notice laga"]):
        result = await execute_notice_action(query_lower, request.school_id, request.user_id, db)
        data = result
        action_taken = "notice_created"
        execution_results.append(f"✅ {result.get('message', 'Notice created')}")
    
    # 3. FEE REMINDER ACTIONS
    elif any(k in query_lower for k in ["fee reminder", "fees yaad dila", "payment remind", "fee notice"]):
        result = await execute_fee_reminder(request.school_id, db)
        data = result
        action_taken = "fee_reminder_sent"
        execution_results.append(f"✅ {result.get('message', 'Fee reminders sent')}")
    
    # 4. SMS/NOTIFICATION ACTIONS
    elif any(k in query_lower for k in ["sms bhejo", "message bhejo", "notification bhejo", "parents ko batao"]):
        result = await execute_sms_action(query_lower, request.school_id, db)
        data = result
        action_taken = "notification_sent"
        execution_results.append(f"✅ {result.get('message', 'Notifications sent')}")
    
    # 5. STUDENT INFO QUERIES
    elif any(k in query_lower for k in ["student info", "student details", "bacche ki jankari", "student ka"]):
        result = await get_student_details(query_lower, request.school_id, db)
        data = result
        action_taken = "student_info_fetched"
    
    # 6. ABSENT STUDENTS LIST
    elif any(k in query_lower for k in ["kaun absent", "absent list", "absent hai", "nahi aaya", "gayab hai"]):
        result = await get_absent_students(request.school_id, db)
        data = result
        action_taken = "absent_list_fetched"
    
    # 7. FEE STATUS/PENDING FEES
    elif any(k in query_lower for k in ["pending fees", "fees pending", "fee status", "kitni fees"]):
        result = await get_pending_fees(request.school_id, db)
        data = result
        action_taken = "fee_status_fetched"
    
    # 8. SCHOOL OVERVIEW
    elif any(k in query_lower for k in ["school overview", "school ka status", "puri jankari", "sab batao", "school status"]):
        data = await get_school_context(request.school_id, db)
        action_taken = "get_school_overview"
    
    # 9. LOCATION TRACKING
    elif any(k in query_lower for k in ["kaun kahan", "location", "track", "kahan hai"]):
        result = await get_location_tracking(request.school_id)
        data = result
        action_taken = "location_tracking"
    
    # 10. ALERTS CHECK
    elif any(k in query_lower for k in ["alert", "problem", "issue", "emergency", "koi dikkat"]):
        alerts = await db.tino_alerts.find({
            "school_id": request.school_id,
            "status": "active"
        }, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
        data = {"active_alerts": alerts, "count": len(alerts)}
        action_taken = "check_alerts"
    
    # 11. CLASS INTELLIGENCE - COMPREHENSIVE CLASS STATUS 🧠
    elif any(k in query_lower for k in ["class ki condition", "class condition", "class ka status", "is class", "yahan ki condition", "class intelligence", "class report"]):
        # Extract class from query and get full intelligence
        result = await handle_class_intelligence_query(query_lower, request.school_id, db)
        if result.get("class_intelligence"):
            data = result["class_intelligence"]
            ai_response = result["message"]  # Use the comprehensive summary
            action_taken = "class_intelligence_fetched"
        else:
            data = result
    
    # 12. WEAK STUDENTS QUERY
    elif any(k in query_lower for k in ["weak student", "weak bachhe", "kamzor", "kisko help", "peeche hai"]):
        # Get class from query or show all
        result = await handle_class_intelligence_query(query_lower, request.school_id, db)
        if result.get("class_intelligence"):
            weak_data = result["class_intelligence"].get("weak_students", {})
            data = weak_data
            if weak_data.get("weak_count", 0) > 0:
                weak_list = "\n".join([f"• {s['name']} - {', '.join(s.get('reason', []))}" for s in weak_data.get("weak_students", [])[:5]])
                ai_response = f"📉 {weak_data['weak_count']} weak students:\n{weak_list}"
            else:
                ai_response = "✅ Is class mein koi weak student nahi hai!"
            action_taken = "weak_students_fetched"
        else:
            data = result
    
    # 13. TEACHER PERFORMANCE QUERY
    elif any(k in query_lower for k in ["teacher kaisa", "teacher performance", "kaun achha padha", "teacher ki rating", "syllabus kaisa"]):
        result = await handle_class_intelligence_query(query_lower, request.school_id, db)
        if result.get("class_intelligence"):
            teacher_data = result["class_intelligence"].get("teacher_performance", {})
            data = teacher_data
            teacher_summary = []
            for t in teacher_data.get("teachers", [])[:5]:
                teacher_summary.append(f"• {t['teacher_name']} ({t['subject']}): {t['rating_hindi']} - Syllabus {t['syllabus_completion']}%")
            ai_response = "👨‍🏫 Teacher Performance:\n" + "\n".join(teacher_summary)
            action_taken = "teacher_performance_fetched"
        else:
            data = result
    
    # 14. SYLLABUS PROGRESS QUERY
    elif any(k in query_lower for k in ["syllabus kitna", "syllabus complete", "course kahan", "padhai kahan tak"]):
        result = await handle_class_intelligence_query(query_lower, request.school_id, db)
        if result.get("class_intelligence"):
            syllabus_data = result["class_intelligence"].get("syllabus", {})
            data = syllabus_data
            subject_summary = []
            for s in syllabus_data.get("subjects", []):
                status = "✅" if s['percentage'] >= 70 else "⚠️" if s['percentage'] >= 50 else "❌"
                subject_summary.append(f"{status} {s['subject']}: {s['percentage']}%")
            ai_response = f"📚 Syllabus Status (Overall: {syllabus_data.get('overall_percentage', 0)}%):\n" + "\n".join(subject_summary)
            action_taken = "syllabus_status_fetched"
        else:
            data = result
    
    # 15. CLASS COMPARISON
    elif any(k in query_lower for k in ["class compare", "sabse achhi class", "best class", "class ranking"]):
        result = await get_class_comparison(request.school_id)
        data = result
        ranking_text = []
        for c in result.get("rankings", [])[:5]:
            ranking_text.append(f"{c['rank']}. {c['class_name']} - Score: {c['overall_score']}% (Attendance: {c['attendance_rate']}%)")
        ai_response = "🏆 Class Rankings:\n" + "\n".join(ranking_text)
        action_taken = "class_comparison_fetched"
    
    # 16. BASIC CLASS STATUS
    elif any(k in query_lower for k in ["class status", "class ka", "class mein", "kitne students"]):
        result = await get_class_status(query_lower, request.school_id, db)
        data = result
        action_taken = "class_status_fetched"
    
    # 17. CREATE ALERT
    elif any(k in query_lower for k in ["alert banao", "alert create", "warning do", "emergency alert"]):
        result = await create_smart_alert(query_lower, request.school_id, db)
        data = result
        action_taken = "alert_created"
        execution_results.append(f"✅ Alert created: {result.get('title', 'New Alert')}")
    
    # 18. ADMIT CARD GENERATION
    elif any(k in query_lower for k in ["admit card", "admitcard", "admit_card", "प्रवेश पत्र", "hall ticket", "hallticket", "एडमिट कार्ड", "admit cards", "generate admit"]):
        from routes.admit_card import ai_generate_admit_cards
        result = await ai_generate_admit_cards(query_lower, request.school_id, db)
        data = result
        if result.get("success"):
            ai_response = result.get("message", "Admit cards generated!")
            action_taken = "admit_cards_generated"
            execution_results.append(f"✅ {result.get('generated', 0)} Admit Cards Generated")
        else:
            ai_response = result.get("message", "Admit card generation failed")
    
    # Add execution results to AI response if actions were taken
    if execution_results:
        ai_response = ai_response + "\n\n" + "\n".join(execution_results)
    
    # Generate audio response with best multilingual voices
    audio_b64 = None
    try:
        from elevenlabs import ElevenLabs
        ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
        if ELEVENLABS_API_KEY:
            eleven = ElevenLabs(api_key=ELEVENLABS_API_KEY)
            
            # Use best multilingual voices based on gender
            if request.voice_gender == "male":
                voice_id = "TX3LPaxmHKxFdv7VOQHJ"  # Liam - Best multilingual male
            else:
                voice_id = "EXAVITQu4vr4xnSDxMaL"  # Sarah - Best multilingual female
            
            audio_gen = eleven.text_to_speech.convert(
                text=ai_response[:500],  # Limit for TTS
                voice_id=voice_id,
                model_id="eleven_multilingual_v2",  # Best for Hindi/English/Hinglish
                voice_settings={
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.5,  # Natural conversational style
                    "use_speaker_boost": True
                }
            )
            import base64
            audio_data = b""
            for chunk in audio_gen:
                audio_data += chunk
            audio_b64 = base64.b64encode(audio_data).decode()
    except Exception as e:
        logger.error(f"TTS error: {e}")
        pass
    
    return TinoBrainResponse(
        message=ai_response,
        data=data,
        action_taken=action_taken,
        audio_base64=audio_b64
    )

@router.post("/cctv-event")
async def process_cctv_event(event: CCTVEvent, background_tasks: BackgroundTasks):
    """
    Process CCTV event and take automatic action
    Called by CCTV system when anomaly detected
    """
    db = get_database()
    
    # Save event
    event_doc = {
        "id": str(uuid.uuid4()),
        "school_id": event.school_id,
        "camera_id": event.camera_id,
        "event_type": event.event_type,
        "confidence": event.confidence,
        "location": event.location,
        "detected_faces": event.detected_faces or [],
        "timestamp": event.timestamp or datetime.now(timezone.utc).isoformat(),
        "image_url": event.image_url,
        "processed": False
    }
    await db.cctv_events.insert_one(event_doc)
    
    # Determine alert priority
    priority = AlertPriority.LOW
    auto_notify_roles = []
    
    if event.event_type == "fight":
        priority = AlertPriority.CRITICAL
        auto_notify_roles = ["director", "principal", "teacher"]
    elif event.event_type == "unauthorized":
        priority = AlertPriority.HIGH
        auto_notify_roles = ["director", "principal"]
    elif event.event_type == "crowd":
        priority = AlertPriority.MEDIUM
        auto_notify_roles = ["principal", "teacher"]
    elif event.event_type == "misbehavior":
        priority = AlertPriority.MEDIUM
        auto_notify_roles = ["teacher"]
    
    # Create alert if confidence is high enough
    if event.confidence > 0.7:
        alert = {
            "id": str(uuid.uuid4()),
            "school_id": event.school_id,
            "type": event.event_type,
            "priority": priority.value,
            "title": f"{event.event_type.replace('_', ' ').title()} Detected",
            "description": f"CCTV detected {event.event_type} at {event.location} with {event.confidence*100:.0f}% confidence",
            "location": event.location,
            "camera_id": event.camera_id,
            "detected_faces": event.detected_faces,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "tino_brain_cctv"
        }
        await db.tino_alerts.insert_one(alert)
        
        # Auto-notify relevant staff
        if auto_notify_roles:
            staff = await db.users.find({
                "school_id": event.school_id,
                "role": {"$in": auto_notify_roles}
            }).to_list(100)
            
            for s in staff:
                notification = {
                    "id": str(uuid.uuid4()),
                    "school_id": event.school_id,
                    "user_id": s.get("id"),
                    "title": f"🚨 {alert['title']}",
                    "message": alert["description"],
                    "type": "cctv_alert",
                    "priority": priority.value,
                    "status": "unread",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.notifications.insert_one(notification)
        
        # Mark event as processed
        await db.cctv_events.update_one(
            {"id": event_doc["id"]},
            {"$set": {"processed": True, "alert_id": alert["id"]}}
        )
        
        return {
            "processed": True,
            "alert_created": True,
            "alert_id": alert["id"],
            "priority": priority.value,
            "notifications_sent": len(auto_notify_roles)
        }
    
    return {
        "processed": True,
        "alert_created": False,
        "reason": "Confidence too low"
    }

@router.get("/alerts/{school_id}")
async def get_active_alerts(school_id: str, priority: Optional[str] = None):
    """Get active alerts for school"""
    db = get_database()
    
    query = {"school_id": school_id, "status": "active"}
    if priority:
        query["priority"] = priority
    
    alerts = await db.tino_alerts.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "alerts": alerts,
        "total": len(alerts),
        "critical_count": sum(1 for a in alerts if a.get("priority") == "critical"),
        "high_count": sum(1 for a in alerts if a.get("priority") == "high")
    }

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, resolution: str = "Resolved"):
    """Mark alert as resolved"""
    db = get_database()
    
    result = await db.tino_alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolution": resolution
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert resolved", "alert_id": alert_id}

@router.get("/student-behavior/{student_id}")
async def analyze_student_behavior(student_id: str, school_id: str):
    """Analyze student behavior patterns"""
    db = get_database()
    
    # Get student
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get attendance history
    attendance = await db.attendance.find({
        "student_id": student_id
    }).sort("date", -1).limit(30).to_list(30)
    
    present_days = sum(1 for a in attendance if a.get("status") == "present")
    total_days = len(attendance)
    attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
    
    # Get any alerts related to student
    alerts = await db.tino_alerts.find({
        "related_ids": student_id
    }).sort("created_at", -1).limit(10).to_list(10)
    
    # Get CCTV events where student was detected
    cctv_events = await db.cctv_events.find({
        "detected_faces": student_id
    }).sort("timestamp", -1).limit(10).to_list(10)
    
    # Behavior analysis
    behavior_score = 100
    concerns = []
    
    if attendance_rate < 75:
        behavior_score -= 20
        concerns.append(f"Low attendance: {attendance_rate:.1f}%")
    
    critical_alerts = [a for a in alerts if a.get("priority") == "critical"]
    if critical_alerts:
        behavior_score -= len(critical_alerts) * 15
        concerns.append(f"{len(critical_alerts)} critical incidents")
    
    misbehavior_events = [e for e in cctv_events if e.get("event_type") in ["fight", "misbehavior"]]
    if misbehavior_events:
        behavior_score -= len(misbehavior_events) * 10
        concerns.append(f"{len(misbehavior_events)} behavior incidents on CCTV")
    
    behavior_score = max(0, behavior_score)
    
    # Recommendations
    recommendations = []
    if behavior_score < 50:
        recommendations.append("Immediate counseling session recommended")
        recommendations.append("Parent-teacher meeting required")
    elif behavior_score < 75:
        recommendations.append("Monitor closely for next 2 weeks")
        recommendations.append("One-on-one discussion with class teacher")
    
    return {
        "student": {
            "id": student.get("id"),
            "name": student.get("name"),
            "class": student.get("class_name")
        },
        "attendance": {
            "rate": round(attendance_rate, 1),
            "present": present_days,
            "total": total_days
        },
        "behavior_score": behavior_score,
        "concerns": concerns,
        "recommendations": recommendations,
        "recent_alerts": len(alerts),
        "cctv_incidents": len(misbehavior_events)
    }

@router.get("/location-tracking/{school_id}")
async def get_location_tracking(school_id: str):
    """Get real-time location tracking from face recognition"""
    db = get_database()
    
    # Get recent face detections from CCTV
    recent_detections = await db.cctv_events.find({
        "school_id": school_id,
        "event_type": "face_detected",
        "timestamp": {"$gte": (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()}
    }).sort("timestamp", -1).to_list(100)
    
    # Group by person
    person_locations = {}
    for detection in recent_detections:
        for face_id in detection.get("detected_faces", []):
            if face_id not in person_locations:
                person_locations[face_id] = {
                    "person_id": face_id,
                    "last_location": detection.get("location"),
                    "last_seen": detection.get("timestamp"),
                    "camera_id": detection.get("camera_id")
                }
    
    return {
        "tracking": list(person_locations.values()),
        "total_tracked": len(person_locations),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

@router.get("/dashboard-insights/{school_id}")
async def get_dashboard_insights(school_id: str, role: str = "director"):
    """Get AI-powered dashboard insights"""
    db = get_database()
    context = await get_school_context(school_id, db)
    
    insights = []
    action_items = []
    
    # Attendance insights
    att = context.get("today_attendance", {})
    if att.get("percentage", 100) < 80:
        insights.append({
            "type": "warning",
            "title": "Low Attendance Today",
            "message": f"Only {att.get('percentage')}% attendance. {att.get('absent', 0)} students absent.",
            "action": "Check with class teachers"
        })
    
    # Fee insights
    if context.get("pending_fees_count", 0) > 10:
        insights.append({
            "type": "info",
            "title": "Fee Collection Pending",
            "message": f"{context['pending_fees_count']} students have pending fees",
            "action": "Send fee reminders"
        })
    
    # Alert insights
    if context.get("active_alerts", 0) > 0:
        critical = await db.tino_alerts.count_documents({
            "school_id": school_id,
            "status": "active",
            "priority": "critical"
        })
        if critical > 0:
            insights.append({
                "type": "critical",
                "title": f"{critical} Critical Alerts",
                "message": "Immediate attention required!",
                "action": "View alerts"
            })
    
    # Action items
    if att.get("total", 0) == 0:
        action_items.append("Mark today's attendance")
    
    return {
        "school_overview": context,
        "insights": insights,
        "action_items": action_items,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/counsel-student")
async def counsel_student(
    student_id: str,
    school_id: str,
    issue: str,
    counselor_id: str
):
    """AI-assisted student counseling"""
    db = get_database()
    
    # Get student behavior analysis
    behavior = await analyze_student_behavior(student_id, school_id)
    
    # Generate counseling points using AI
    talking_points = "AI not available for counseling suggestions"
    
    if EMERGENT_LLM_KEY or openai_client:
        prompt = f"""
        Student Behavior Score: {behavior['behavior_score']}/100
        Concerns: {', '.join(behavior['concerns']) or 'None'}
        Issue reported: {issue}
        
        Generate 3-5 talking points for counseling this student in Hinglish.
        Be empathetic but firm. Focus on improvement.
        """
        
        try:
            talking_points = await get_ai_response(
                prompt,
                "You are a school counselor AI assistant. Be empathetic and helpful."
            )
        except Exception as e:
            logger.error(f"Counseling AI error: {e}")
            talking_points = "AI error occurred. Please try again."
    
    # Save counseling session
    session = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "student_id": student_id,
        "counselor_id": counselor_id,
        "issue": issue,
        "behavior_score_at_session": behavior['behavior_score'],
        "talking_points": talking_points,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.counseling_sessions.insert_one(session)
    
    return {
        "session_id": session["id"],
        "student_behavior": behavior,
        "talking_points": talking_points,
        "recommendations": behavior['recommendations']
    }


# ============== CHAT HISTORY ENDPOINTS ==============

@router.get("/chat-history/{user_id}")
async def get_chat_history(user_id: str, school_id: str, limit: int = 50):
    """Get chat history for a user - grouped by sessions"""
    db = get_database()
    
    # Get all conversations for user
    conversations = await db.tino_conversations.find({
        "user_id": user_id,
        "school_id": school_id
    }, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Group by date (session)
    sessions = {}
    for conv in reversed(conversations):
        date_key = conv.get("timestamp", "")[:10]  # YYYY-MM-DD
        if date_key not in sessions:
            sessions[date_key] = {
                "date": date_key,
                "messages": [],
                "message_count": 0
            }
        sessions[date_key]["messages"].append({
            "id": conv.get("id"),
            "message": conv.get("message"),
            "is_user": conv.get("is_user"),
            "timestamp": conv.get("timestamp")
        })
        sessions[date_key]["message_count"] += 1
    
    return {
        "user_id": user_id,
        "sessions": list(sessions.values()),
        "total_messages": len(conversations)
    }

@router.delete("/chat-history/{user_id}/clear")
async def clear_chat_history(user_id: str, school_id: str):
    """Clear all chat history for a user"""
    db = get_database()
    
    result = await db.tino_conversations.delete_many({
        "user_id": user_id,
        "school_id": school_id
    })
    
    return {
        "message": "Chat history cleared",
        "deleted_count": result.deleted_count
    }

@router.delete("/chat-history/message/{message_id}")
async def delete_chat_message(message_id: str):
    """Delete a specific chat message"""
    db = get_database()
    
    result = await db.tino_conversations.delete_one({"id": message_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message deleted", "id": message_id}

@router.get("/chat-sessions/{user_id}")
async def get_chat_sessions(user_id: str, school_id: str):
    """Get list of chat sessions with preview"""
    db = get_database()
    
    pipeline = [
        {"$match": {"user_id": user_id, "school_id": school_id}},
        {"$addFields": {"date": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {
            "_id": "$date",
            "first_message": {"$first": "$message"},
            "message_count": {"$sum": 1},
            "last_timestamp": {"$max": "$timestamp"}
        }},
        {"$sort": {"last_timestamp": -1}},
        {"$limit": 30}
    ]
    
    sessions = await db.tino_conversations.aggregate(pipeline).to_list(30)
    
    return {
        "sessions": [
            {
                "date": s["_id"],
                "preview": s["first_message"][:50] + "..." if len(s.get("first_message", "")) > 50 else s.get("first_message", ""),
                "message_count": s["message_count"],
                "last_activity": s["last_timestamp"]
            }
            for s in sessions
        ],
        "total_sessions": len(sessions)
    }


# ============== CLASS INTELLIGENCE SYSTEM ==============
# Admin walks into class, asks "Is class ki condition batao" → Tino tells everything

class ClassIntelligenceRequest(BaseModel):
    school_id: str
    class_id: Optional[str] = None
    class_name: Optional[str] = None
    camera_id: Optional[str] = None  # CCTV se class detect kare
    user_id: str
    user_role: str = "director"

class TeacherPerformanceMetrics(BaseModel):
    teacher_id: str
    teacher_name: str
    subjects: List[str]
    syllabus_completion: float  # percentage
    average_class_attendance: float
    student_performance: float  # average marks
    class_management_score: float  # based on incidents/complaints
    rating: str  # excellent, good, needs_improvement, poor

async def get_class_from_camera(camera_id: str, school_id: str, db) -> Optional[str]:
    """Get class_id from CCTV camera location"""
    camera = await db.cctv_devices.find_one({
        "camera_id": camera_id,
        "school_id": school_id
    })
    if camera:
        return camera.get("class_id") or camera.get("location_class_id")
    return None

async def get_syllabus_progress(school_id: str, class_id: str, db) -> Dict:
    """Get detailed syllabus progress for a class - subject wise"""
    progress_data = await db.syllabus_progress.find({
        "school_id": school_id,
        "class_id": class_id
    }).to_list(100)
    
    # Group by subject
    subject_progress = {}
    for p in progress_data:
        subject = p.get("subject", "Unknown")
        if subject not in subject_progress:
            subject_progress[subject] = {
                "subject": subject,
                "total_chapters": 0,
                "completed_chapters": 0,
                "percentage": 0,
                "teacher_name": p.get("teacher_name", ""),
                "last_updated": p.get("updated_at", "")
            }
        subject_progress[subject]["total_chapters"] += 1
        if p.get("status") == "completed":
            subject_progress[subject]["completed_chapters"] += 1
    
    # Calculate percentages
    for subject in subject_progress:
        total = subject_progress[subject]["total_chapters"]
        completed = subject_progress[subject]["completed_chapters"]
        subject_progress[subject]["percentage"] = round((completed / total * 100), 1) if total > 0 else 0
    
    overall = sum(s["percentage"] for s in subject_progress.values()) / len(subject_progress) if subject_progress else 0
    
    return {
        "subjects": list(subject_progress.values()),
        "overall_percentage": round(overall, 1),
        "behind_subjects": [s["subject"] for s in subject_progress.values() if s["percentage"] < 50]
    }

async def get_weak_students(school_id: str, class_id: str, db) -> Dict:
    """Identify weak students based on attendance, marks, and behavior"""
    students = await db.students.find({
        "school_id": school_id,
        "class_id": class_id,
        "is_active": True
    }).to_list(100)
    
    weak_students = []
    at_risk_students = []
    excellent_students = []
    
    for student in students:
        student_id = student.get("id")
        
        # Get attendance
        attendance = await db.attendance.find({
            "student_id": student_id
        }).to_list(100)
        present = sum(1 for a in attendance if a.get("status") == "present")
        attendance_rate = (present / len(attendance) * 100) if attendance else 100
        
        # Get marks/results
        results = await db.results.find({
            "student_id": student_id
        }).to_list(50)
        avg_marks = sum(r.get("marks", 0) for r in results) / len(results) if results else 50
        
        # Get behavior incidents
        incidents = await db.tino_alerts.count_documents({
            "related_ids": student_id,
            "priority": {"$in": ["critical", "high"]}
        })
        
        # Calculate overall score
        score = (attendance_rate * 0.3) + (avg_marks * 0.5) + ((100 - incidents * 10) * 0.2)
        score = max(0, min(100, score))
        
        student_info = {
            "id": student_id,
            "name": student.get("name", "Unknown"),
            "roll_no": student.get("roll_no", ""),
            "attendance_rate": round(attendance_rate, 1),
            "avg_marks": round(avg_marks, 1),
            "incidents": incidents,
            "overall_score": round(score, 1)
        }
        
        if score < 40:
            student_info["reason"] = []
            if attendance_rate < 60:
                student_info["reason"].append("कम attendance")
            if avg_marks < 40:
                student_info["reason"].append("कम marks")
            if incidents > 2:
                student_info["reason"].append("behavior issues")
            weak_students.append(student_info)
        elif score < 60:
            at_risk_students.append(student_info)
        elif score > 85:
            excellent_students.append(student_info)
    
    return {
        "weak_students": weak_students,
        "weak_count": len(weak_students),
        "at_risk_students": at_risk_students,
        "at_risk_count": len(at_risk_students),
        "excellent_students": excellent_students[:5],  # Top 5
        "excellent_count": len(excellent_students)
    }

async def get_teacher_performance(school_id: str, class_id: str, db) -> Dict:
    """Get teacher performance for the class"""
    # Get class teachers
    class_info = await db.classes.find_one({"id": class_id})
    
    # Get subject allocations for this class
    allocations = await db.subject_allocations.find({
        "school_id": school_id,
        "class_id": class_id
    }).to_list(50)
    
    teachers_performance = []
    
    for alloc in allocations:
        teacher_id = alloc.get("teacher_id")
        teacher = await db.users.find_one({"id": teacher_id})
        if not teacher:
            continue
        
        # Get syllabus completion
        syllabus = await db.syllabus_progress.find({
            "school_id": school_id,
            "class_id": class_id,
            "teacher_id": teacher_id
        }).to_list(50)
        total_chapters = len(syllabus)
        completed = sum(1 for s in syllabus if s.get("status") == "completed")
        syllabus_completion = (completed / total_chapters * 100) if total_chapters > 0 else 0
        
        # Get student results in teacher's subjects
        results = await db.results.find({
            "school_id": school_id,
            "class_id": class_id,
            "subject": alloc.get("subject")
        }).to_list(100)
        avg_student_marks = sum(r.get("marks", 0) for r in results) / len(results) if results else 50
        
        # Get complaints against teacher
        complaints = await db.complaints.count_documents({
            "school_id": school_id,
            "against_id": teacher_id,
            "status": {"$ne": "resolved"}
        })
        
        # Calculate class management score
        class_management = max(0, 100 - complaints * 20)
        
        # Overall rating
        overall = (syllabus_completion * 0.4) + (avg_student_marks * 0.4) + (class_management * 0.2)
        
        if overall >= 80:
            rating = "excellent"
            rating_hindi = "बहुत अच्छा पढ़ा रहे हैं 👍"
        elif overall >= 60:
            rating = "good"
            rating_hindi = "अच्छा पढ़ा रहे हैं"
        elif overall >= 40:
            rating = "needs_improvement"
            rating_hindi = "syllabus पीछे चल रहा है"
        else:
            rating = "poor"
            rating_hindi = "class manage नहीं कर पा रहे 😟"
        
        teachers_performance.append({
            "teacher_id": teacher_id,
            "teacher_name": teacher.get("name", "Unknown"),
            "subject": alloc.get("subject"),
            "syllabus_completion": round(syllabus_completion, 1),
            "avg_student_marks": round(avg_student_marks, 1),
            "class_management_score": class_management,
            "overall_score": round(overall, 1),
            "rating": rating,
            "rating_hindi": rating_hindi,
            "complaints": complaints
        })
    
    # Sort by overall score
    teachers_performance.sort(key=lambda x: x["overall_score"], reverse=True)
    
    return {
        "teachers": teachers_performance,
        "best_teacher": teachers_performance[0] if teachers_performance else None,
        "needs_attention": [t for t in teachers_performance if t["rating"] in ["needs_improvement", "poor"]]
    }

async def get_class_attendance_analysis(school_id: str, class_id: str, db) -> Dict:
    """Detailed attendance analysis for class"""
    today = date.today().isoformat()
    
    # Today's attendance
    today_attendance = await db.attendance.find({
        "school_id": school_id,
        "class_id": class_id,
        "date": today
    }).to_list(100)
    
    present_today = sum(1 for a in today_attendance if a.get("status") == "present")
    total_today = len(today_attendance)
    
    # Last 7 days trend
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    week_attendance = await db.attendance.find({
        "school_id": school_id,
        "class_id": class_id,
        "date": {"$gte": week_ago}
    }).to_list(1000)
    
    present_week = sum(1 for a in week_attendance if a.get("status") == "present")
    total_week = len(week_attendance)
    
    # Chronic absentees (absent > 3 times this week)
    student_absences = {}
    for a in week_attendance:
        if a.get("status") == "absent":
            sid = a.get("student_id")
            student_absences[sid] = student_absences.get(sid, 0) + 1
    
    chronic_absentees = []
    for sid, count in student_absences.items():
        if count >= 3:
            student = await db.students.find_one({"id": sid})
            chronic_absentees.append({
                "id": sid,
                "name": student.get("name") if student else "Unknown",
                "absent_days": count
            })
    
    return {
        "today": {
            "present": present_today,
            "absent": total_today - present_today,
            "total": total_today,
            "percentage": round((present_today / total_today * 100), 1) if total_today > 0 else 0
        },
        "week_average": round((present_week / total_week * 100), 1) if total_week > 0 else 0,
        "chronic_absentees": chronic_absentees,
        "attendance_marked": total_today > 0
    }

@router.get("/class-intelligence/{school_id}/{class_id}")
async def get_class_intelligence(school_id: str, class_id: str):
    """
    🧠 COMPREHENSIVE CLASS INTELLIGENCE
    Admin walks into class → Asks "Is class ki condition batao"
    → Tino gives complete report
    """
    db = get_database()
    
    # Get class info
    class_info = await db.classes.find_one({"id": class_id})
    if not class_info:
        # Try finding by name
        class_info = await db.classes.find_one({
            "school_id": school_id,
            "name": {"$regex": class_id, "$options": "i"}
        })
    
    class_name = class_info.get("name", class_id) if class_info else class_id
    class_id = class_info.get("id", class_id) if class_info else class_id
    
    # Get all intelligence data
    syllabus = await get_syllabus_progress(school_id, class_id, db)
    weak_students = await get_weak_students(school_id, class_id, db)
    teacher_perf = await get_teacher_performance(school_id, class_id, db)
    attendance = await get_class_attendance_analysis(school_id, class_id, db)
    
    # Student count
    total_students = await db.students.count_documents({
        "school_id": school_id,
        "class_id": class_id,
        "is_active": True
    })
    
    # Generate AI Summary in Hinglish
    summary_parts = []
    
    # Attendance summary
    if attendance["today"]["total"] > 0:
        summary_parts.append(f"📊 आज {attendance['today']['present']}/{attendance['today']['total']} students present हैं ({attendance['today']['percentage']}%)")
    else:
        summary_parts.append("⚠️ आज attendance अभी नहीं लगी है")
    
    # Syllabus summary
    summary_parts.append(f"📚 Overall syllabus {syllabus['overall_percentage']}% complete है")
    if syllabus['behind_subjects']:
        summary_parts.append(f"   ⚠️ {', '.join(syllabus['behind_subjects'])} में syllabus पीछे है")
    
    # Weak students
    if weak_students['weak_count'] > 0:
        summary_parts.append(f"📉 {weak_students['weak_count']} students weak हैं")
        for ws in weak_students['weak_students'][:3]:
            reasons = ", ".join(ws.get("reason", []))
            summary_parts.append(f"   - {ws['name']}: {reasons}")
    else:
        summary_parts.append("✅ कोई weak student नहीं है!")
    
    # Teacher performance
    if teacher_perf['needs_attention']:
        for t in teacher_perf['needs_attention']:
            summary_parts.append(f"👨‍🏫 {t['teacher_name']} ({t['subject']}): {t['rating_hindi']}")
    
    if teacher_perf['best_teacher']:
        bt = teacher_perf['best_teacher']
        summary_parts.append(f"🌟 Best Teacher: {bt['teacher_name']} ({bt['subject']}) - {bt['rating_hindi']}")
    
    return {
        "class_id": class_id,
        "class_name": class_name,
        "total_students": total_students,
        "summary": "\n".join(summary_parts),
        "attendance": attendance,
        "syllabus": syllabus,
        "weak_students": weak_students,
        "teacher_performance": teacher_perf,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/class-intelligence/from-camera")
async def get_class_intelligence_from_camera(request: ClassIntelligenceRequest):
    """
    🎥 CCTV-Based Class Detection
    Admin is detected at a CCTV camera → System identifies which class
    → Returns that class's complete intelligence
    """
    db = get_database()
    
    class_id = request.class_id
    
    # If camera_id provided, detect class from camera location
    if request.camera_id and not class_id:
        class_id = await get_class_from_camera(request.camera_id, request.school_id, db)
    
    # If class_name provided, find class_id
    if request.class_name and not class_id:
        class_info = await db.classes.find_one({
            "school_id": request.school_id,
            "name": {"$regex": request.class_name, "$options": "i"}
        })
        if class_info:
            class_id = class_info.get("id")
    
    if not class_id:
        return {
            "error": True,
            "message": "Class identify नहीं हो पाई। Please class name बताएं।",
            "hint": "Example: 'Class 10-A ki condition batao'"
        }
    
    # Get full class intelligence
    intelligence = await get_class_intelligence(request.school_id, class_id)
    
    return intelligence

@router.get("/class-comparison/{school_id}")
async def get_class_comparison(school_id: str):
    """Compare all classes - who's doing best, who needs attention"""
    db = get_database()
    
    classes = await db.classes.find({"school_id": school_id}).to_list(50)
    
    class_rankings = []
    for cls in classes:
        class_id = cls.get("id")
        
        # Quick metrics
        student_count = await db.students.count_documents({
            "school_id": school_id,
            "class_id": class_id,
            "is_active": True
        })
        
        # Today's attendance
        today = date.today().isoformat()
        attendance = await db.attendance.find({
            "school_id": school_id,
            "class_id": class_id,
            "date": today
        }).to_list(100)
        present = sum(1 for a in attendance if a.get("status") == "present")
        att_rate = (present / len(attendance) * 100) if attendance else 0
        
        # Syllabus
        syllabus = await db.syllabus_progress.find({
            "school_id": school_id,
            "class_id": class_id
        }).to_list(100)
        completed = sum(1 for s in syllabus if s.get("status") == "completed")
        syllabus_rate = (completed / len(syllabus) * 100) if syllabus else 0
        
        # Overall score
        score = (att_rate * 0.4) + (syllabus_rate * 0.6)
        
        class_rankings.append({
            "class_id": class_id,
            "class_name": cls.get("name"),
            "student_count": student_count,
            "attendance_rate": round(att_rate, 1),
            "syllabus_completion": round(syllabus_rate, 1),
            "overall_score": round(score, 1),
            "class_teacher": cls.get("class_teacher")
        })
    
    # Sort by overall score
    class_rankings.sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Add rank
    for i, c in enumerate(class_rankings):
        c["rank"] = i + 1
    
    return {
        "rankings": class_rankings,
        "best_class": class_rankings[0] if class_rankings else None,
        "needs_attention": [c for c in class_rankings if c["overall_score"] < 50]
    }

# ============== ENHANCED AI QUERY FOR CLASS INTELLIGENCE ==============

async def handle_class_intelligence_query(query: str, school_id: str, db) -> Dict:
    """
    Handle natural language queries about class condition
    Examples:
    - "Is class ki condition batao"
    - "Class 10 ka status kya hai"
    - "Weak bachhe kaun hai"
    - "Teacher kaisa padha raha hai"
    """
    query_lower = query.lower()
    
    # Extract class name from query
    class_patterns = [
        r"class\s*(\d+)[- ]?([a-zA-Z])?",
        r"कक्षा\s*(\d+)",
        r"(\d+)(th|st|nd|rd)?\s*(class|कक्षा)",
    ]
    
    import re
    class_id = None
    class_name = None
    
    for pattern in class_patterns:
        match = re.search(pattern, query_lower)
        if match:
            class_num = match.group(1)
            section = match.group(2) if len(match.groups()) > 1 and match.group(2) else ""
            class_name = f"Class {class_num}"
            if section:
                class_name += f"-{section.upper()}"
            break
    
    # Find class in database
    if class_name:
        class_info = await db.classes.find_one({
            "school_id": school_id,
            "name": {"$regex": class_name, "$options": "i"}
        })
        if class_info:
            class_id = class_info.get("id")
    
    if not class_id:
        # Check if "is class" or "yahan" implies current location
        if any(k in query_lower for k in ["is class", "yahan", "यहां", "इस class", "current class"]):
            return {
                "need_class_context": True,
                "message": "Kaunsi class ki baat kar rahe ho? Class ka naam batao ya CCTV se detect karo.",
                "hint": "Example: 'Class 10-A ki condition batao'"
            }
    
    if class_id:
        # Get full intelligence
        intelligence = await get_class_intelligence(school_id, class_id)
        return {
            "class_intelligence": intelligence,
            "message": intelligence.get("summary"),
            "data": intelligence
        }
    
    return {"error": True, "message": "Class identify nahi ho payi"}

