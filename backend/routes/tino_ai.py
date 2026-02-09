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
from core.database import db
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/tino-ai", tags=["Tino AI"])

class TinoMessage(BaseModel):
    message: str
    school_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    language: Optional[str] = "hi"

class TinoResponse(BaseModel):
    response: str
    data: Optional[dict] = None
    action_taken: Optional[str] = None
    suggestions: Optional[List[str]] = None

TINO_SYSTEM_PROMPT = """You are AI Tino, a helpful text-only assistant for SchoolTino ERP system.

STRICT RULES:
1. You are a TEXT-ONLY assistant - no voice, no actions, no system control
2. You CANNOT open forms, update data, or perform system actions
3. You can ONLY provide information, answer questions, and give suggestions
4. Always respond in the SAME language as the user's query
   - Hindi query -> Pure Hindi response
   - English query -> Pure English response  
   - Hinglish -> Hinglish response

What You Can Do:
1. Answer questions about SchoolTino features
2. Provide guidance on how to use the system
3. Give suggestions and recommendations
4. Generate text content (like announcements, notices)
5. Explain school management concepts
6. Help with fee calculations, attendance insights
7. Draft messages for parents/staff

What You CANNOT Do:
1. Open any forms or dashboards
2. Update, delete, or modify any data
3. Execute system commands
4. Control the application
5. Make changes to records

Response Format:
- Keep responses concise and helpful (max 200 words)
- If user asks you to perform an action, politely tell them to use the dashboard manually
- Use the school context data provided to give accurate information
- Be friendly and professional"""


async def get_school_context(school_id: str) -> dict:
    """Fetch real-time school data for context"""
    try:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        school = await db.schools.find_one({"school_id": school_id}, {"_id": 0})
        student_count = await db.students.count_documents({"school_id": school_id, "status": "active"})
        staff_count = await db.users.count_documents({
            "school_id": school_id, 
            "role": {"$in": ["teacher", "principal", "admin_staff", "accountant"]}
        })
        class_count = await db.classes.count_documents({"school_id": school_id})
        
        attendance_records = await db.attendance.find({
            "school_id": school_id,
            "date": {"$gte": today.isoformat()[:10]}
        }).to_list(1000)
        
        present_count = sum(1 for a in attendance_records if a.get("status") == "present")
        absent_count = sum(1 for a in attendance_records if a.get("status") == "absent")
        
        fee_collections = await db.fee_collections.find({
            "school_id": school_id,
            "payment_date": {"$gte": today.isoformat()[:10]}
        }).to_list(1000)
        
        today_collection = sum(f.get("amount_paid", 0) for f in fee_collections)
        
        recent_notices = await db.notices.find(
            {"school_id": school_id},
            {"_id": 0, "title": 1, "created_at": 1}
        ).sort("created_at", -1).limit(3).to_list(3)
        
        pending_leaves = await db.leaves.count_documents({
            "school_id": school_id,
            "status": "pending"
        })
        
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


@router.post("/chat", response_model=TinoResponse)
async def chat_with_tino(request: TinoMessage):
    """Chat with AI Tino using OpenAI API"""
    try:
        message_lower = request.message.lower()
        blocked_keywords = [
            'form kholo', 'open form', 'admission kholo', 'kholo', 
            'data update', 'update karo', 'form fill', 'fill karo',
            'record update', 'delete karo', 'remove karo',
        ]
        
        if any(keyword in message_lower for keyword in blocked_keywords):
            is_hindi = request.language == 'hi' or any(c in request.message for c in 'अआइईउऊएऐओऔ')
            if is_hindi:
                return TinoResponse(
                    response="Namaste! Main sirf text assistant hoon. Forms ya data update ke liye dashboard mein manually jaayein. Main aapko information aur suggestions de sakta hoon.",
                    action_taken="blocked_system_command"
                )
            else:
                return TinoResponse(
                    response="Hello! I'm a text-only assistant. For forms or data updates, please use the dashboard manually. I can provide information and suggestions.",
                    action_taken="blocked_system_command"
                )
        
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        
        if not openai_api_key:
            return TinoResponse(
                response="AI service not configured. Please add your OpenAI API key in Settings to enable Tino AI." if request.language == 'en' else "AI service configure nahi hai. Tino AI enable karne ke liye Settings mein OpenAI API key add karein.",
                action_taken="no_api_key"
            )
        
        context = await get_school_context(request.school_id)
        
        context_str = f"""
School Data:
- School: {context.get('school_name')}
- Date: {context.get('current_date')} ({context.get('current_day')})
- Total Students: {context.get('total_students')}
- Total Staff: {context.get('total_staff')}
- Total Classes: {context.get('total_classes')}
- Today Attendance: {context.get('today_attendance', {}).get('present', 0)} present, {context.get('today_attendance', {}).get('absent', 0)} absent
- Today Fee Collection: Rs {context.get('today_fee_collection', 0):,.0f}
- Pending Leaves: {context.get('pending_leaves', 0)}
- Fee Defaulters: {context.get('fee_defaulters', 0)}
- Recent Notices: {', '.join(context.get('recent_notices', [])) or 'None'}
"""
        
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
        
        messages = [
            {"role": "system", "content": TINO_SYSTEM_PROMPT},
            {"role": "system", "content": f"Current School Context:\n{context_str}"},
            {"role": "user", "content": request.message}
        ]
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content or "No response generated."
        
        suggestions = []
        if context.get('fee_defaulters', 0) > 0:
            suggestions.append("Fee defaulters ki list dekhein")
        if context.get('pending_leaves', 0) > 0:
            suggestions.append("Pending leave requests approve karein")
        if context.get('today_attendance', {}).get('total_marked', 0) == 0:
            suggestions.append("Aaj ki attendance mark karein")
        
        default_suggestions = [
            "Aaj ki fee collection batao",
            "Attendance summary dikhao",
            "Is mahine ki summary do"
        ]
        suggestions.extend([s for s in default_suggestions if s not in suggestions][:2])
        
        return TinoResponse(
            response=ai_response,
            data=context,
            suggestions=suggestions[:4],
            action_taken="openai_response"
        )
        
    except Exception as e:
        print(f"Tino AI Error: {e}")
        import traceback
        traceback.print_exc()
        error_msg = "Technical issue - please try again" if request.language == 'en' else "Technical samasya - phir se try karein"
        return TinoResponse(
            response=error_msg,
            action_taken="error"
        )


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
        
        if any(word in message_lower for word in ["attendance", "haziri"]):
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            query = {"school_id": request.school_id, "date": today}
            records = await db.attendance.find(query).to_list(100)
            present = sum(1 for r in records if r.get("status") == "present")
            absent = sum(1 for r in records if r.get("status") == "absent")
            return {
                "command": "attendance",
                "data": {"present": present, "absent": absent, "total": len(records)},
                "message": f"Aaj ki attendance: {present} present, {absent} absent"
            }
            
        elif any(word in message_lower for word in ["fee", "fees", "collection"]):
            first_day = datetime.now().replace(day=1).strftime("%Y-%m-%d")
            collections = await db.fee_collections.find({
                "school_id": request.school_id,
                "payment_date": {"$gte": first_day}
            }).to_list(1000)
            total = sum(c.get("amount_paid", 0) for c in collections)
            return {
                "command": "fee_summary",
                "data": {"total_collection": total, "count": len(collections)},
                "message": f"Is mahine ki fee collection: Rs {total:,.0f}"
            }
            
        elif any(word in message_lower for word in ["student", "students"]):
            count = await db.students.count_documents({
                "school_id": request.school_id, "status": "active"
            })
            return {
                "command": "student_count",
                "data": {"count": count},
                "message": f"Total active students: {count}"
            }
            
        else:
            return await chat_with_tino(request)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
