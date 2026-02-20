# /app/backend/routes/syllabus_progress.py
"""
Syllabus Progress Tracking & AI Chapter Summary
- Teachers update syllabus progress
- Students see real-time updates
- AI generates chapter summaries
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import uuid
import os
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Emergent LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

router = APIRouter(prefix="/syllabus-progress", tags=["Syllabus Progress"])


# ==================== MODELS ====================

class ChapterProgressUpdate(BaseModel):
    school_id: str
    class_id: str
    class_name: str  # e.g., "Class 10-A"
    subject: str
    board: str  # NCERT or MPBSE
    chapter_number: int
    chapter_name: str
    status: str  # not_started, in_progress, completed
    topics_covered: Optional[List[str]] = []
    notes: Optional[str] = None

class ChapterSummaryRequest(BaseModel):
    board: str  # NCERT or MPBSE
    class_num: str
    subject: str
    chapter_number: int
    chapter_name: str
    language: str = "hinglish"  # hindi, english, hinglish
    include_formulas: bool = True
    include_key_points: bool = True

class BulkProgressUpdate(BaseModel):
    school_id: str
    class_id: str
    class_name: str
    subject: str
    board: str
    chapters: List[Dict]  # [{chapter_number, status, topics_covered}]


# ==================== HELPER FUNCTIONS ====================

async def get_current_user_from_token(token: str):
    """Extract user from JWT token"""
    import jwt
    JWT_SECRET = os.environ.get('JWT_SECRET')
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if payload.get("role") == "student":
            user = await db.students.find_one({"id": user_id}, {"_id": 0})
            if user:
                user["role"] = "student"
                return user
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except:
        return None

async def notify_students_of_update(school_id: str, class_id: str, subject: str, chapter_name: str, teacher_name: str):
    """Create notification for students when syllabus is updated"""
    notification = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "class_id": class_id,
        "type": "syllabus_update",
        "title": f"📚 Syllabus Updated - {subject}",
        "message": f"{teacher_name} ने {chapter_name} complete किया। अब आप इस chapter की summary पढ़ सकते हैं।",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read_by": []
    }
    await db.notifications.insert_one(notification)
    return notification


# ==================== PROGRESS TRACKING APIS ====================

@router.post("/update")
async def update_chapter_progress(
    progress: ChapterProgressUpdate,
    authorization: str = None
):
    """
    Teacher updates syllabus progress for a class
    Automatically reflects in StudentDashboard
    """
    # Get teacher info from token
    teacher = None
    if authorization:
        token = authorization.replace("Bearer ", "")
        teacher = await get_current_user_from_token(token)
    
    teacher_name = teacher.get("name", "Teacher") if teacher else "Teacher"
    teacher_id = teacher.get("id", "unknown") if teacher else "unknown"
    
    # Create/Update progress record
    progress_record = {
        "id": str(uuid.uuid4()),
        "school_id": progress.school_id,
        "class_id": progress.class_id,
        "class_name": progress.class_name,
        "subject": progress.subject,
        "board": progress.board,
        "chapter_number": progress.chapter_number,
        "chapter_name": progress.chapter_name,
        "status": progress.status,
        "topics_covered": progress.topics_covered,
        "notes": progress.notes,
        "updated_by": teacher_id,
        "updated_by_name": teacher_name,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - update if exists, insert if not
    await db.syllabus_progress.update_one(
        {
            "school_id": progress.school_id,
            "class_id": progress.class_id,
            "subject": progress.subject,
            "chapter_number": progress.chapter_number
        },
        {"$set": progress_record},
        upsert=True
    )
    
    # If chapter completed, notify students
    if progress.status == "completed":
        await notify_students_of_update(
            progress.school_id,
            progress.class_id,
            progress.subject,
            progress.chapter_name,
            teacher_name
        )
    
    # AI Confirmation Message
    ai_message = ""
    if progress.status == "completed":
        ai_message = f"✅ {teacher_name} ji, {progress.chapter_name} successfully complete mark ho gaya hai! Sabhi {progress.class_name} ke students ko notification bhej diya gaya hai."
    elif progress.status == "in_progress":
        ai_message = f"📖 {progress.chapter_name} in-progress mark ho gaya hai. Jab complete ho jaye tab update kar dena!"
    else:
        ai_message = f"📋 {progress.chapter_name} ka status update ho gaya hai."
    
    return {
        "success": True,
        "message": "Progress updated successfully",
        "ai_confirmation": ai_message,
        "progress": {
            "class_name": progress.class_name,
            "subject": progress.subject,
            "chapter": progress.chapter_name,
            "status": progress.status
        },
        "notification_sent": progress.status == "completed"
    }


@router.get("/class/{school_id}/{class_id}")
async def get_class_progress(school_id: str, class_id: str, subject: Optional[str] = None):
    """
    Get syllabus progress for a class
    Used by both TeachTino and StudyTino
    """
    query = {"school_id": school_id, "class_id": class_id}
    if subject:
        query["subject"] = subject
    
    progress_records = await db.syllabus_progress.find(
        query,
        {"_id": 0}
    ).sort("chapter_number", 1).to_list(100)
    
    # Group by subject
    by_subject = {}
    for record in progress_records:
        subj = record["subject"]
        if subj not in by_subject:
            by_subject[subj] = {
                "subject": subj,
                "board": record.get("board", "NCERT"),
                "chapters": [],
                "completed_count": 0,
                "in_progress_count": 0,
                "total_count": 0
            }
        
        by_subject[subj]["chapters"].append(record)
        by_subject[subj]["total_count"] += 1
        
        if record["status"] == "completed":
            by_subject[subj]["completed_count"] += 1
        elif record["status"] == "in_progress":
            by_subject[subj]["in_progress_count"] += 1
    
    # Calculate percentages
    for subj_data in by_subject.values():
        total = subj_data["total_count"]
        if total > 0:
            subj_data["completion_percentage"] = round(
                (subj_data["completed_count"] / total) * 100, 1
            )
        else:
            subj_data["completion_percentage"] = 0
    
    return {
        "school_id": school_id,
        "class_id": class_id,
        "subjects": list(by_subject.values()),
        "total_subjects": len(by_subject)
    }


@router.get("/student/{school_id}/{class_id}")
async def get_student_syllabus_progress(school_id: str, class_id: str):
    """
    Get syllabus progress for students
    Shows what teachers have marked complete
    """
    progress_data = await get_class_progress(school_id, class_id)
    
    # Add student-friendly summary
    summary_parts = []
    for subj in progress_data["subjects"]:
        if subj["completed_count"] > 0:
            summary_parts.append(
                f"{subj['subject']}: {subj['completed_count']} chapters complete ({subj['completion_percentage']}%)"
            )
    
    progress_data["summary"] = " | ".join(summary_parts) if summary_parts else "No progress recorded yet"
    
    return progress_data


@router.get("/analytics/{school_id}/{class_id}")
async def get_syllabus_analytics(
    school_id: str,
    class_id: str,
    subject: Optional[str] = None,
    range: str = "month"
):
    """Get syllabus analytics for week/month/year"""
    query = {"school_id": school_id, "class_id": class_id}
    if subject:
        query["subject"] = subject

    records = await db.syllabus_progress.find(query, {"_id": 0}).to_list(500)

    total = len(records)
    completed = len([r for r in records if r.get("status") == "completed"])
    in_progress = len([r for r in records if r.get("status") == "in_progress"])
    not_started = max(total - completed - in_progress, 0)

    now = datetime.now(timezone.utc)
    days = 30
    if range == "week":
        days = 7
    elif range == "year":
        days = 365
    range_start = now - timedelta(days=days)

    completed_in_range = 0
    updated_in_range = 0
    for record in records:
        updated_at = record.get("updated_at")
        if updated_at:
            try:
                updated_dt = datetime.fromisoformat(updated_at)
                if updated_dt >= range_start:
                    updated_in_range += 1
                    if record.get("status") == "completed":
                        completed_in_range += 1
            except Exception:
                pass

    completion_percentage = round((completed / total) * 100, 1) if total else 0

    return {
        "school_id": school_id,
        "class_id": class_id,
        "subject": subject,
        "range": range,
        "summary": {
            "total_chapters": total,
            "completed": completed,
            "in_progress": in_progress,
            "not_started": not_started,
            "completion_percentage": completion_percentage
        },
        "range_stats": {
            "updated_in_range": updated_in_range,
            "completed_in_range": completed_in_range
        }
    }


# ==================== AI CHAPTER SUMMARY ====================

@router.post("/ai/summarize-chapter")
async def generate_chapter_summary(request: ChapterSummaryRequest):
    """
    AI generates chapter summary in Hindi/English/Hinglish
    With key points, formulas, and important concepts
    """
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Build prompt based on request
    language_instruction = {
        "hindi": "पूरा summary Hindi में लिखो।",
        "english": "Write the entire summary in English.",
        "hinglish": "Summary Hinglish mein likho (Hindi + English mix, jaise log normally bolte hain)."
    }.get(request.language, "Summary Hinglish mein likho.")
    
    formula_instruction = "Include all important formulas with explanations." if request.include_formulas else ""
    key_points_instruction = "Include 5-7 key points that students must remember." if request.include_key_points else ""
    
    prompt = f"""
You are an expert teacher creating a chapter summary for students.

Board: {request.board}
Class: {request.class_num}
Subject: {request.subject}
Chapter {request.chapter_number}: {request.chapter_name}

{language_instruction}

Create a comprehensive summary that includes:
1. Chapter Overview (2-3 lines)
2. Main Concepts Explained Simply
{f"3. Important Formulas (with examples)" if request.include_formulas else ""}
{f"4. Key Points to Remember (bullet points)" if request.include_key_points else ""}
5. Common Exam Questions Topics
6. Quick Revision Tips

Make it student-friendly, easy to understand, and exam-focused.
Use emojis to make it engaging.
"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chapter-summary-{request.chapter_number}",
            system_message="You are an expert teacher creating chapter summaries for students."
        ).with_model("openai", "gpt-4o-mini")
        
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)
        summary = response
        
        # Store the generated summary for future reference
        summary_record = {
            "id": str(uuid.uuid4()),
            "board": request.board,
            "class_num": request.class_num,
            "subject": request.subject,
            "chapter_number": request.chapter_number,
            "chapter_name": request.chapter_name,
            "language": request.language,
            "summary": summary,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chapter_summaries.insert_one(summary_record)
        
        return {
            "success": True,
            "chapter": {
                "board": request.board,
                "class": request.class_num,
                "subject": request.subject,
                "number": request.chapter_number,
                "name": request.chapter_name
            },
            "summary": summary,
            "language": request.language,
            "cached": False
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.get("/ai/summary/{board}/{class_num}/{subject}/{chapter_num}")
async def get_cached_summary(
    board: str,
    class_num: str,
    subject: str,
    chapter_num: int,
    language: str = "hinglish"
):
    """
    Get cached chapter summary or generate new one
    """
    # Check for cached summary
    cached = await db.chapter_summaries.find_one({
        "board": board.upper(),
        "class_num": class_num,
        "subject": subject,
        "chapter_number": chapter_num,
        "language": language
    }, {"_id": 0})
    
    if cached:
        return {
            "success": True,
            "chapter": {
                "board": board,
                "class": class_num,
                "subject": subject,
                "number": chapter_num,
                "name": cached.get("chapter_name", "")
            },
            "summary": cached["summary"],
            "language": language,
            "cached": True,
            "generated_at": cached.get("generated_at")
        }
    
    return {
        "success": False,
        "message": "No cached summary found. Use POST /ai/summarize-chapter to generate.",
        "cached": False
    }


# ==================== NOTIFICATIONS ====================

@router.get("/notifications/{school_id}/{class_id}")
async def get_syllabus_notifications(school_id: str, class_id: str, limit: int = 10):
    """
    Get syllabus update notifications for students
    """
    notifications = await db.notifications.find(
        {
            "school_id": school_id,
            "class_id": class_id,
            "type": "syllabus_update"
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "notifications": notifications,
        "total": len(notifications)
    }


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, student_id: str):
    """
    Mark notification as read by student
    """
    await db.notifications.update_one(
        {"id": notification_id},
        {"$addToSet": {"read_by": student_id}}
    )
    return {"success": True}
