"""
Student Complaint System for Schooltino
- Students can complain to Admin/Teacher/Both
- Track complaint status
- Resolution workflow
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from database import get_database

router = APIRouter(prefix="/complaints", tags=["Complaints"])

# Models
class CreateComplaint(BaseModel):
    student_id: str
    student_name: str
    class_id: str
    class_name: str
    school_id: str
    complaint_to: str  # admin, teacher, both
    category: str  # academic, bullying, facilities, other
    subject: str
    description: str
    is_anonymous: bool = False

class ResolveComplaint(BaseModel):
    complaint_id: str
    resolved_by: str
    resolution_notes: str
    status: str  # resolved, rejected, in_progress

# ============== COMPLAINTS ==============

@router.post("/create")
async def create_complaint(data: CreateComplaint):
    """Create a new complaint"""
    db = get_database()
    
    complaint = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id if not data.is_anonymous else "anonymous",
        "student_name": data.student_name if not data.is_anonymous else "Anonymous Student",
        "class_id": data.class_id,
        "class_name": data.class_name,
        "school_id": data.school_id,
        "complaint_to": data.complaint_to,
        "category": data.category,
        "subject": data.subject,
        "description": data.description,
        "is_anonymous": data.is_anonymous,
        "status": "pending",  # pending, in_progress, resolved, rejected
        "created_at": datetime.now(timezone.utc).isoformat(),
        "resolved_at": None,
        "resolved_by": None,
        "resolution_notes": None,
        "priority": "normal"  # low, normal, high, urgent
    }
    
    # Auto-detect priority based on keywords
    urgent_keywords = ["urgent", "emergency", "danger", "bully", "hurt", "scared"]
    if any(kw in data.description.lower() for kw in urgent_keywords):
        complaint["priority"] = "high"
    
    await db.complaints.insert_one(complaint)
    
    # Create notification for recipients
    if data.complaint_to in ["admin", "both"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": data.school_id,
            "type": "complaint",
            "title": f"New Complaint: {data.category}",
            "message": f"New complaint from {complaint['student_name']} - {data.subject}",
            "for_role": "admin",
            "status": "unread",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    if data.complaint_to in ["teacher", "both"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": data.school_id,
            "type": "complaint",
            "title": f"New Complaint: {data.category}",
            "message": f"New complaint from {complaint['student_name']} - {data.subject}",
            "for_role": "teacher",
            "class_id": data.class_id,
            "status": "unread",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {
        "message": "Complaint submitted successfully",
        "complaint_id": complaint["id"],
        "status": "pending"
    }

@router.get("/student/{student_id}")
async def get_student_complaints(student_id: str):
    """Get all complaints by a student"""
    db = get_database()
    
    complaints = await db.complaints.find({
        "student_id": student_id
    }, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return {"complaints": complaints}

@router.get("/school/{school_id}")
async def get_school_complaints(school_id: str, status: Optional[str] = None, role: Optional[str] = None):
    """Get all complaints for a school (for admin/teacher)"""
    db = get_database()
    
    query = {"school_id": school_id}
    if status:
        query["status"] = status
    if role:
        query["complaint_to"] = {"$in": [role, "both"]}
    
    complaints = await db.complaints.find(
        query, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Count by status
    stats = {
        "pending": sum(1 for c in complaints if c.get("status") == "pending"),
        "in_progress": sum(1 for c in complaints if c.get("status") == "in_progress"),
        "resolved": sum(1 for c in complaints if c.get("status") == "resolved"),
        "total": len(complaints)
    }
    
    return {"complaints": complaints, "stats": stats}

@router.put("/resolve")
async def resolve_complaint(data: ResolveComplaint):
    """Resolve or update complaint status"""
    db = get_database()
    
    result = await db.complaints.update_one(
        {"id": data.complaint_id},
        {"$set": {
            "status": data.status,
            "resolved_by": data.resolved_by,
            "resolution_notes": data.resolution_notes,
            "resolved_at": datetime.now(timezone.utc).isoformat() if data.status == "resolved" else None
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return {"message": f"Complaint {data.status}", "complaint_id": data.complaint_id}

@router.get("/categories")
async def get_complaint_categories():
    """Get available complaint categories"""
    return {
        "categories": [
            {"id": "academic", "label": "Academic Issues", "label_hi": "पढ़ाई की समस्या"},
            {"id": "bullying", "label": "Bullying/Harassment", "label_hi": "धमकाना/परेशान करना"},
            {"id": "facilities", "label": "Facilities/Infrastructure", "label_hi": "सुविधाएं"},
            {"id": "teacher", "label": "Teacher Related", "label_hi": "शिक्षक संबंधित"},
            {"id": "fees", "label": "Fees Related", "label_hi": "फीस संबंधित"},
            {"id": "transport", "label": "Transport Issues", "label_hi": "बस/वाहन समस्या"},
            {"id": "food", "label": "Food/Canteen", "label_hi": "खाना/कैंटीन"},
            {"id": "other", "label": "Other", "label_hi": "अन्य"}
        ]
    }
