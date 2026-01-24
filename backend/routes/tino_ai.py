"""
Tino AI Command Center - Central AI Assistant for Schooltino
Supports both Hindi and English, Voice and Text commands
Can execute school management tasks through natural language
"""

import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/tino-ai", tags=["Tino AI"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "schooltino")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# Request/Response Models
class TinoMessage(BaseModel):
    message: str
    school_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    language: Optional[str] = "hi"  # 'hi' for Hindi, 'en' for English

class TinoResponse(BaseModel):
    response: str
    data: Optional[dict] = None
    action_taken: Optional[str] = None
    suggestions: Optional[List[str]] = None

# System prompt for Tino AI
TINO_SYSTEM_PROMPT = """You are Tino, an intelligent AI assistant for Schooltino - a school management platform. 
You help school administrators, principals, teachers, and staff manage their school efficiently.

🎓 Your Capabilities:
1. Answer questions about school data (students, attendance, fees, classes)
2. Provide reports and analytics summaries
3. Help with administrative tasks
4. Give suggestions for school management

📋 Guidelines:
- Respond in the same language the user asks (Hindi or English)
- Be concise and helpful
- When providing data, format it nicely
- If you don't have enough information, ask clarifying questions
- Always be respectful and professional

🔧 Available Data Context (will be provided with each query):
- School statistics (total students, staff, classes)
- Today's attendance summary
- Fee collection summary
- Recent notices
- Upcoming events

Remember: You are Tino, the friendly school assistant. Start responses with "🎓 " for official info or "💡 " for suggestions."""


async def get_school_context(school_id: str) -> dict:
    """Fetch real-time school data for context"""
    try:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get school info
        school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
        
        # Get student count
        student_count = await db.students.count_documents({"school_id": school_id, "status": "active"})
        
        # Get staff count
        staff_count = await db.users.count_documents({
            "school_id": school_id, 
            "role": {"$in": ["teacher", "principal", "admin_staff", "accountant"]}
        })
        
        # Get class count
        class_count = await db.classes.count_documents({"school_id": school_id})
        
        # Get today's attendance summary
        attendance_records = await db.attendance.find({
            "school_id": school_id,
            "date": {"$gte": today.isoformat()[:10]}
        }).to_list(1000)
        
        present_count = sum(1 for a in attendance_records if a.get("status") == "present")
        absent_count = sum(1 for a in attendance_records if a.get("status") == "absent")
        
        # Get today's fee collection
        fee_collections = await db.fee_collections.find({
            "school_id": school_id,
            "payment_date": {"$gte": today.isoformat()[:10]}
        }).to_list(1000)
        
        today_collection = sum(f.get("amount_paid", 0) for f in fee_collections)
        
        # Get recent notices
        recent_notices = await db.notices.find(
            {"school_id": school_id},
            {"_id": 0, "title": 1, "created_at": 1}
        ).sort("created_at", -1).limit(3).to_list(3)
        
        # Get pending leaves
        pending_leaves = await db.leaves.count_documents({
            "school_id": school_id,
            "status": "pending"
        })
        
        # Get fee defaulters
        defaulters_count = await db.students.count_documents({
            "school_id": school_id,
            "status": "active",
            "fee_status": "pending"
        })
        
        context = {
            "school_name": school.get("name", "School") if school else "School",
            "total_students": student_count,
            "total_staff": staff_count,
            "total_classes": class_count,
            "today_attendance": {
                "present": present_count,
                "absent": absent_count,
                "total_marked": present_count + absent_count
            },
            "today_fee_collection": today_collection,
            "recent_notices": [n.get("title") for n in recent_notices],
            "pending_leaves": pending_leaves,
            "fee_defaulters": defaulters_count,
            "current_date": datetime.now().strftime("%d %B %Y"),
            "current_day": datetime.now().strftime("%A")
        }
        
        return context
    except Exception as e:
        print(f"Error fetching school context: {e}")
        return {
            "school_name": "School",
            "total_students": 0,
            "total_staff": 0,
            "error": str(e)
        }


async def get_specific_data(school_id: str, query_type: str, params: dict = None):
    """Fetch specific data based on query type"""
    try:
        if query_type == "class_attendance":
            class_id = params.get("class_id") if params else None
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            
            query = {"school_id": school_id, "date": today}
            if class_id:
                query["class_id"] = class_id
                
            records = await db.attendance.find(query).to_list(100)
            return {
                "type": "attendance",
                "date": today,
                "records": len(records),
                "present": sum(1 for r in records if r.get("status") == "present"),
                "absent": sum(1 for r in records if r.get("status") == "absent")
            }
            
        elif query_type == "fee_summary":
            # This month's fee collection
            first_day = datetime.now().replace(day=1).strftime("%Y-%m-%d")
            
            collections = await db.fee_collections.find({
                "school_id": school_id,
                "payment_date": {"$gte": first_day}
            }).to_list(1000)
            
            total = sum(c.get("amount_paid", 0) for c in collections)
            return {
                "type": "fee_summary",
                "period": "This Month",
                "total_collection": total,
                "transaction_count": len(collections)
            }
            
        elif query_type == "student_list":
            class_id = params.get("class_id") if params else None
            query = {"school_id": school_id, "status": "active"}
            if class_id:
                query["class_id"] = class_id
                
            students = await db.students.find(
                query, 
                {"_id": 0, "name": 1, "roll_no": 1, "class_id": 1}
            ).limit(20).to_list(20)
            
            return {
                "type": "student_list",
                "count": len(students),
                "students": students
            }
            
        return None
    except Exception as e:
        print(f"Error fetching specific data: {e}")
        return None


@router.post("/chat", response_model=TinoResponse)
async def chat_with_tino(request: TinoMessage):
    """Main chat endpoint for Tino AI"""
    try:
        if not EMERGENT_LLM_KEY:
            print("ERROR: EMERGENT_LLM_KEY is not configured!")
            raise HTTPException(status_code=500, detail="AI service not configured - Please check EMERGENT_LLM_KEY")
        
        # Get school context
        context = await get_school_context(request.school_id)
        
        # Build context message
        context_str = f"""
📊 Current School Data:
- School: {context.get('school_name')}
- Date: {context.get('current_date')} ({context.get('current_day')})
- Total Students: {context.get('total_students')}
- Total Staff: {context.get('total_staff')}
- Total Classes: {context.get('total_classes')}

📈 Today's Summary:
- Attendance: {context.get('today_attendance', {}).get('present', 0)} present, {context.get('today_attendance', {}).get('absent', 0)} absent
- Fee Collection: ₹{context.get('today_fee_collection', 0):,.0f}
- Pending Leaves: {context.get('pending_leaves', 0)}
- Fee Defaulters: {context.get('fee_defaulters', 0)}

📢 Recent Notices: {', '.join(context.get('recent_notices', [])) or 'None'}
"""
        
        # Prepare session ID
        session_id = request.session_id or f"tino_{request.school_id}_{request.user_id or 'default'}"
        
        print(f"Tino AI: Processing query from session {session_id}")
        print(f"Tino AI: Query = {request.message[:100]}...")
        
        # Initialize LLM Chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=TINO_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        # Add context to user message
        full_message = f"""
{context_str}

User Query: {request.message}
"""
        
        # Send message to LLM
        user_message = UserMessage(text=full_message)
        response_text = await chat.send_message(user_message)
        
        # Ensure response is a string
        if not isinstance(response_text, str):
            response_text = str(response_text) if response_text else "माफ करें, response प्राप्त नहीं हुआ।"
        
        print(f"Tino AI: Got response of length {len(response_text)}")
        
        # Generate smart suggestions based on context
        suggestions = []
        if context.get('fee_defaulters', 0) > 0:
            suggestions.append("Fee defaulters list देखें")
        if context.get('pending_leaves', 0) > 0:
            suggestions.append("Pending leave requests approve करें")
        if context.get('today_attendance', {}).get('total_marked', 0) == 0:
            suggestions.append("आज की attendance mark करें")
        
        # Add some default suggestions
        default_suggestions = [
            "आज की fee collection बताओ",
            "Class 5 की attendance दिखाओ",
            "इस महीने की summary दो"
        ]
        suggestions.extend([s for s in default_suggestions if s not in suggestions][:2])
        
        return TinoResponse(
            response=response_text,
            data=context,
            suggestions=suggestions[:4]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Tino AI Error: {e}")
        print(f"Traceback: {error_trace}")
        # Return a user-friendly error in Hindi
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")


@router.get("/quick-stats/{school_id}")
async def get_quick_stats(school_id: str):
    """Get quick stats for dashboard cards"""
    context = await get_school_context(school_id)
    return context


@router.post("/command")
async def execute_command(request: TinoMessage):
    """Execute a specific command and return structured data"""
    try:
        message_lower = request.message.lower()
        
        # Detect command type from message
        if any(word in message_lower for word in ["attendance", "उपस्थिति", "हाजिरी"]):
            data = await get_specific_data(request.school_id, "class_attendance")
            return {
                "command": "attendance",
                "data": data,
                "message": f"आज की attendance: {data['present']} present, {data['absent']} absent"
            }
            
        elif any(word in message_lower for word in ["fee", "fees", "collection", "फीस"]):
            data = await get_specific_data(request.school_id, "fee_summary")
            return {
                "command": "fee_summary",
                "data": data,
                "message": f"इस महीने की fee collection: ₹{data['total_collection']:,.0f}"
            }
            
        elif any(word in message_lower for word in ["student", "students", "विद्यार्थी", "छात्र"]):
            data = await get_specific_data(request.school_id, "student_list")
            return {
                "command": "student_list",
                "data": data,
                "message": f"Total active students: {data['count']}"
            }
            
        else:
            # For unrecognized commands, use AI
            return await chat_with_tino(request)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
