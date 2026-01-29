"""
SCHOOL GALLERY & EVENTS MODULE
- Upload event photos
- Organize by event/category
- Students can view photos
- Event-wise gallery
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import aiofiles
from pathlib import Path

router = APIRouter(prefix="/gallery", tags=["School Gallery"])

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'schooltino')
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[db_name]

UPLOAD_DIR = Path("./uploads/gallery")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Models
class EventCreate(BaseModel):
    school_id: str
    event_name: str
    event_date: str
    event_type: str  # annual_function, sports_day, independence_day, republic_day, farewell, etc.
    description: Optional[str] = None
    classes_involved: Optional[List[str]] = None  # If empty, all classes can see
    is_public: bool = True
    created_by: str

class PhotoUpload(BaseModel):
    event_id: str
    caption: Optional[str] = None
    tags: Optional[List[str]] = None

# ============== EVENTS ==============

@router.post("/events")
async def create_event(event: EventCreate):
    """Create a new event for gallery"""
    event_doc = {
        "id": str(uuid.uuid4()),
        "school_id": event.school_id,
        "event_name": event.event_name,
        "event_date": event.event_date,
        "event_type": event.event_type,
        "description": event.description,
        "classes_involved": event.classes_involved,
        "is_public": event.is_public,
        "photo_count": 0,
        "cover_photo": None,
        "created_by": event.created_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gallery_events.insert_one(event_doc)
    event_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Event '{event.event_name}' created successfully",
        "event": event_doc
    }

@router.get("/events/{school_id}")
async def get_events(school_id: str, class_id: Optional[str] = None):
    """Get all events for a school - filtered by class if specified"""
    query = {"school_id": school_id}
    
    events = await db.gallery_events.find(query, {"_id": 0}).sort("event_date", -1).to_list(100)
    
    # Filter by class if specified
    if class_id:
        filtered_events = []
        for event in events:
            classes = event.get("classes_involved", [])
            if not classes or class_id in classes or event.get("is_public", True):
                filtered_events.append(event)
        events = filtered_events
    
    return {
        "total": len(events),
        "events": events
    }

@router.get("/events/{school_id}/{event_id}")
async def get_event_details(school_id: str, event_id: str):
    """Get single event with all photos"""
    event = await db.gallery_events.find_one({
        "id": event_id,
        "school_id": school_id
    }, {"_id": 0})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all photos for this event
    photos = await db.gallery_photos.find({
        "event_id": event_id,
        "school_id": school_id
    }, {"_id": 0}).sort("uploaded_at", -1).to_list(500)
    
    return {
        "event": event,
        "photos": photos,
        "total_photos": len(photos)
    }

# ============== PHOTOS ==============

@router.post("/upload/{school_id}/{event_id}")
async def upload_photo(
    school_id: str,
    event_id: str,
    file: UploadFile = File(...),
    caption: str = Form(None),
    uploaded_by: str = Form(...)
):
    """Upload a photo to an event"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only images (JPEG, PNG, WEBP, GIF) allowed")
    
    # Check event exists
    event = await db.gallery_events.find_one({"id": event_id, "school_id": school_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Save file
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_name = f"{event_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    photo_url = f"/api/uploads/gallery/{file_name}"
    
    photo_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "event_id": event_id,
        "file_name": file_name,
        "photo_url": photo_url,
        "caption": caption,
        "uploaded_by": uploaded_by,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gallery_photos.insert_one(photo_doc)
    
    # Update photo count and set cover if first photo
    update_data = {"$inc": {"photo_count": 1}}
    if not event.get("cover_photo"):
        update_data["$set"] = {"cover_photo": photo_url}
    
    await db.gallery_events.update_one({"id": event_id}, update_data)
    
    photo_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": "Photo uploaded successfully",
        "photo": photo_doc
    }

@router.post("/upload-multiple/{school_id}/{event_id}")
async def upload_multiple_photos(
    school_id: str,
    event_id: str,
    files: List[UploadFile] = File(...),
    uploaded_by: str = Form(...)
):
    """Upload multiple photos to an event"""
    # Check event exists
    event = await db.gallery_events.find_one({"id": event_id, "school_id": school_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    uploaded_photos = []
    for file in files:
        if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
            continue
        
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        file_name = f"{event_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        photo_url = f"/api/uploads/gallery/{file_name}"
        
        photo_doc = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "event_id": event_id,
            "file_name": file_name,
            "photo_url": photo_url,
            "caption": None,
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.gallery_photos.insert_one(photo_doc)
        photo_doc.pop('_id', None)
        uploaded_photos.append(photo_doc)
    
    # Update photo count
    await db.gallery_events.update_one(
        {"id": event_id},
        {"$inc": {"photo_count": len(uploaded_photos)}}
    )
    
    # Set cover photo if not set
    if not event.get("cover_photo") and uploaded_photos:
        await db.gallery_events.update_one(
            {"id": event_id},
            {"$set": {"cover_photo": uploaded_photos[0]["photo_url"]}}
        )
    
    return {
        "success": True,
        "message": f"{len(uploaded_photos)} photos uploaded successfully",
        "photos": uploaded_photos
    }

@router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str, school_id: str):
    """Delete a photo"""
    photo = await db.gallery_photos.find_one({"id": photo_id, "school_id": school_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete file
    file_path = UPLOAD_DIR / photo["file_name"]
    if file_path.exists():
        file_path.unlink()
    
    # Delete from DB
    await db.gallery_photos.delete_one({"id": photo_id})
    
    # Update photo count
    await db.gallery_events.update_one(
        {"id": photo["event_id"]},
        {"$inc": {"photo_count": -1}}
    )
    
    return {"success": True, "message": "Photo deleted"}

# ============== STUDENT VIEW ==============

@router.get("/student/{school_id}/{student_id}")
async def get_student_gallery(school_id: str, student_id: str):
    """Get gallery for student - only shows relevant events"""
    # Get student's class
    student = await db.students.find_one({"id": student_id, "school_id": school_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    class_id = student.get("class_id")
    
    # Get events visible to this student
    events = await db.gallery_events.find({
        "school_id": school_id,
        "$or": [
            {"is_public": True},
            {"classes_involved": {"$in": [class_id]}},
            {"classes_involved": {"$size": 0}},
            {"classes_involved": {"$exists": False}}
        ]
    }, {"_id": 0}).sort("event_date", -1).to_list(50)
    
    return {
        "student_name": student.get("name"),
        "class": student.get("class_name"),
        "total_events": len(events),
        "events": events
    }

# ============== EVENT TYPES ==============

@router.get("/event-types")
async def get_event_types():
    """Get available event types"""
    return {
        "event_types": [
            {"id": "annual_function", "name": "Annual Function", "icon": "🎭"},
            {"id": "sports_day", "name": "Sports Day", "icon": "🏃"},
            {"id": "independence_day", "name": "Independence Day", "icon": "🇮🇳"},
            {"id": "republic_day", "name": "Republic Day", "icon": "🇮🇳"},
            {"id": "teachers_day", "name": "Teachers Day", "icon": "👩‍🏫"},
            {"id": "childrens_day", "name": "Children's Day", "icon": "👧"},
            {"id": "farewell", "name": "Farewell", "icon": "👋"},
            {"id": "welcome_party", "name": "Welcome Party", "icon": "🎉"},
            {"id": "science_fair", "name": "Science Fair", "icon": "🔬"},
            {"id": "cultural_program", "name": "Cultural Program", "icon": "🎵"},
            {"id": "prize_distribution", "name": "Prize Distribution", "icon": "🏆"},
            {"id": "excursion", "name": "Excursion/Trip", "icon": "🚌"},
            {"id": "workshop", "name": "Workshop", "icon": "🛠️"},
            {"id": "other", "name": "Other Event", "icon": "📷"}
        ]
    }
