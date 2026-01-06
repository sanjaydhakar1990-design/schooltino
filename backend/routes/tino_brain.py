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

# OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None

try:
    from openai import OpenAI
    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
except:
    pass

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

TINO_SYSTEM_PROMPT = """You are TINO BRAIN - the unified AI intelligence system for Schooltino.
You have access to ALL school data and can:

1. **Know Everything**: Students, teachers, classes, attendance, fees, performance, locations
2. **Monitor CCTV**: Detect fights, unusual activity, track people via face recognition
3. **Proactive Alerts**: Warn before problems occur
4. **Execute Actions**: Create notices, mark attendance, send notifications
5. **Counsel Students**: Guide students when needed

Current Role: {role}
School: {school_name}

IMPORTANT RULES:
- Always respond in Hinglish (Hindi + English mix)
- Be concise and actionable
- If you detect a problem, immediately suggest action
- For critical issues (fights, emergencies), prioritize alerting officials
- Track context from previous conversations
- Execute commands immediately when confirmed

Available Actions:
- get_student_info(student_id)
- get_teacher_info(teacher_id)
- get_class_status(class_id)
- get_attendance_report(date, class_id)
- get_fee_status(student_id)
- get_cctv_status(location)
- create_alert(type, priority, message)
- send_notification(user_ids, message)
- get_location_tracking(person_id)
- analyze_behavior(student_id)
- get_school_overview()
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

    """Get intelligent response from OpenAI"""
    if not openai_client:
        return "AI service not available. Please configure OpenAI API key."
    
    try:
        system_prompt = TINO_SYSTEM_PROMPT.format(
            role=role,
            school_name=context.get("school_name", "School")
        )
        
        # Add context
        system_prompt += f"\n\nCurrent School Status:\n"
        system_prompt += f"- Total Students: {context.get('total_students', 0)}\n"
        system_prompt += f"- Total Staff: {context.get('total_staff', 0)}\n"
        system_prompt += f"- Today's Attendance: {context.get('today_attendance', {}).get('percentage', 0)}%\n"
        system_prompt += f"- Pending Fees: {context.get('pending_fees_count', 0)} students\n"
        system_prompt += f"- Active Alerts: {context.get('active_alerts', 0)}\n"
        
        if context.get("recent_events"):
            system_prompt += f"\nRecent CCTV Events:\n"
            for event in context.get("recent_events", []):
                system_prompt += f"- {event.get('type')} at {event.get('location')}\n"
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": query})
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"AI response error: {e}")
        return f"AI error: {str(e)}"

# ============== API ENDPOINTS ==============

@router.get("/status")
async def get_brain_status():
    """Get Tino Brain status"""
    return {
        "status": "active",
        "ai_available": openai_client is not None,
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
    
    # Detect intent and get AI response
    ai_response = await get_ai_response(
        request.query, 
        request.user_role, 
        context,
        conversation_history
    )
    
    # Save conversation
    await db.tino_conversations.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": request.school_id,
        "user_id": request.user_id,
        "user_role": request.user_role,
        "message": request.query,
        "is_user": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    await db.tino_conversations.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": request.school_id,
        "user_id": request.user_id,
        "user_role": request.user_role,
        "message": ai_response,
        "is_user": False,
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
    
    # 11. CLASS STATUS
    elif any(k in query_lower for k in ["class status", "class ka", "class mein", "kitne students"]):
        result = await get_class_status(query_lower, request.school_id, db)
        data = result
        action_taken = "class_status_fetched"
    
    # 12. CREATE ALERT
    elif any(k in query_lower for k in ["alert banao", "alert create", "warning do", "emergency alert"]):
        result = await create_smart_alert(query_lower, request.school_id, db)
        data = result
        action_taken = "alert_created"
        execution_results.append(f"✅ Alert created: {result.get('title', 'New Alert')}")
    
    # Add execution results to AI response if actions were taken
    if execution_results:
        ai_response = ai_response + "\n\n" + "\n".join(execution_results)
    
    # Generate audio response
    audio_b64 = None
    try:
        from elevenlabs import ElevenLabs
        ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
        if ELEVENLABS_API_KEY:
            eleven = ElevenLabs(api_key=ELEVENLABS_API_KEY)
            voice_id = "pNInz6obpgDQGcFmaJgB" if request.voice_gender == "male" else "21m00Tcm4TlvDq8ikWAM"
            audio_gen = eleven.text_to_speech.convert(
                text=ai_response[:500],  # Limit for TTS
                voice_id=voice_id,
                model_id="eleven_multilingual_v2"
            )
            import base64
            audio_data = b""
            for chunk in audio_gen:
                audio_data += chunk
            audio_b64 = base64.b64encode(audio_data).decode()
    except:
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
    if openai_client:
        prompt = f"""
        Student Behavior Score: {behavior['behavior_score']}/100
        Concerns: {', '.join(behavior['concerns']) or 'None'}
        Issue reported: {issue}
        
        Generate 3-5 talking points for counseling this student in Hinglish.
        Be empathetic but firm. Focus on improvement.
        """
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a school counselor AI assistant. Be empathetic and helpful."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300
        )
        
        talking_points = response.choices[0].message.content
    else:
        talking_points = "AI not available for counseling suggestions"
    
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
