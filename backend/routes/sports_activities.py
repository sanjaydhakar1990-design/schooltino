"""
Sports & Extra-curricular Activities System
- Track sports participation
- Activity events and achievements
- Student performance tracking
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from database import get_database

router = APIRouter(prefix="/activities", tags=["Sports & Activities"])

# Models
class CreateActivity(BaseModel):
    name: str
    category: str  # sports, cultural, academic, club
    description: Optional[str] = None
    school_id: str
    schedule: Optional[str] = None  # e.g., "Mon, Wed, Fri - 4:00 PM"
    coach_name: Optional[str] = None
    max_participants: int = 50

class EnrollStudent(BaseModel):
    activity_id: str
    student_id: str
    student_name: str
    class_id: str
    school_id: str

class RecordAchievement(BaseModel):
    student_id: str
    student_name: str
    activity_id: str
    school_id: str
    achievement_type: str  # gold, silver, bronze, participation, certificate
    event_name: str
    event_date: str
    position: Optional[str] = None
    notes: Optional[str] = None

class CreateEvent(BaseModel):
    name: str
    event_type: str  # sports_day, cultural_fest, competition
    school_id: str
    event_date: str
    description: Optional[str] = None
    activities: List[str] = []

# ============== ACTIVITIES ==============

@router.post("/create")
async def create_activity(data: CreateActivity):
    """Create a new activity"""
    db = get_database()
    
    activity = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "category": data.category,
        "description": data.description,
        "school_id": data.school_id,
        "schedule": data.schedule,
        "coach_name": data.coach_name,
        "max_participants": data.max_participants,
        "enrolled_count": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.activities.insert_one(activity)
    
    return {"message": "Activity created", "activity_id": activity["id"]}

@router.get("/school/{school_id}")
async def get_school_activities(school_id: str, category: Optional[str] = None):
    """Get all activities for a school"""
    db = get_database()
    
    query = {"school_id": school_id, "is_active": True}
    if category:
        query["category"] = category
    
    activities = await db.activities.find(query, {"_id": 0}).to_list(100)
    
    return {"activities": activities}

@router.get("/categories")
async def get_activity_categories():
    """Get activity categories"""
    return {
        "categories": [
            {
                "id": "sports",
                "label": "Sports",
                "label_hi": "खेल",
                "icon": "trophy",
                "activities": ["Cricket", "Football", "Basketball", "Volleyball", "Badminton", 
                              "Table Tennis", "Athletics", "Swimming", "Kabaddi", "Kho-Kho",
                              "Chess", "Carrom", "Yoga", "Martial Arts"]
            },
            {
                "id": "cultural",
                "label": "Cultural",
                "label_hi": "सांस्कृतिक",
                "icon": "music",
                "activities": ["Dance", "Music", "Drama", "Art & Craft", "Debate", 
                              "Elocution", "Quiz", "Poetry", "Storytelling"]
            },
            {
                "id": "academic",
                "label": "Academic",
                "label_hi": "शैक्षणिक",
                "icon": "book",
                "activities": ["Science Club", "Math Club", "Computer Club", "Robotics",
                              "Olympiad Prep", "Essay Writing", "Book Club"]
            },
            {
                "id": "clubs",
                "label": "Clubs",
                "label_hi": "क्लब",
                "icon": "users",
                "activities": ["NCC", "NSS", "Scouts & Guides", "Eco Club", 
                              "Social Service", "Photography", "Gardening"]
            }
        ]
    }

# ============== ENROLLMENT ==============

@router.post("/enroll")
async def enroll_student(data: EnrollStudent):
    """Enroll a student in an activity"""
    db = get_database()
    
    # Check if already enrolled
    existing = await db.activity_enrollments.find_one({
        "activity_id": data.activity_id,
        "student_id": data.student_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")
    
    enrollment = {
        "id": str(uuid.uuid4()),
        "activity_id": data.activity_id,
        "student_id": data.student_id,
        "student_name": data.student_name,
        "class_id": data.class_id,
        "school_id": data.school_id,
        "enrolled_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    
    await db.activity_enrollments.insert_one(enrollment)
    
    # Update activity count
    await db.activities.update_one(
        {"id": data.activity_id},
        {"$inc": {"enrolled_count": 1}}
    )
    
    return {"message": "Enrolled successfully", "enrollment_id": enrollment["id"]}

@router.get("/student/{student_id}")
async def get_student_activities(student_id: str):
    """Get all activities a student is enrolled in"""
    db = get_database()
    
    enrollments = await db.activity_enrollments.find({
        "student_id": student_id,
        "status": "active"
    }, {"_id": 0}).to_list(50)
    
    # Get activity details
    activity_ids = [e["activity_id"] for e in enrollments]
    activities = await db.activities.find({
        "id": {"$in": activity_ids}
    }, {"_id": 0}).to_list(50)
    
    # Get achievements
    achievements = await db.achievements.find({
        "student_id": student_id
    }, {"_id": 0}).sort("event_date", -1).to_list(50)
    
    return {
        "enrollments": enrollments,
        "activities": activities,
        "achievements": achievements
    }

# ============== ACHIEVEMENTS ==============

@router.post("/achievement")
async def record_achievement(data: RecordAchievement):
    """Record a student achievement"""
    db = get_database()
    
    achievement = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id,
        "student_name": data.student_name,
        "activity_id": data.activity_id,
        "school_id": data.school_id,
        "achievement_type": data.achievement_type,
        "event_name": data.event_name,
        "event_date": data.event_date,
        "position": data.position,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.achievements.insert_one(achievement)
    
    return {"message": "Achievement recorded", "achievement_id": achievement["id"]}

@router.get("/achievements/{school_id}")
async def get_school_achievements(school_id: str, limit: int = 50):
    """Get recent achievements for a school"""
    db = get_database()
    
    achievements = await db.achievements.find({
        "school_id": school_id
    }, {"_id": 0}).sort("event_date", -1).limit(limit).to_list(limit)
    
    return {"achievements": achievements}

# ============== EVENTS ==============

@router.post("/events/create")
async def create_event(data: CreateEvent):
    """Create a sports/cultural event"""
    db = get_database()
    
    event = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "event_type": data.event_type,
        "school_id": data.school_id,
        "event_date": data.event_date,
        "description": data.description,
        "activities": data.activities,
        "status": "upcoming",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.activity_events.insert_one(event)
    
    return {"message": "Event created", "event_id": event["id"]}

@router.get("/events/{school_id}")
async def get_school_events(school_id: str):
    """Get upcoming events"""
    db = get_database()
    
    events = await db.activity_events.find({
        "school_id": school_id
    }, {"_id": 0}).sort("event_date", 1).to_list(50)
    
    return {"events": events}
