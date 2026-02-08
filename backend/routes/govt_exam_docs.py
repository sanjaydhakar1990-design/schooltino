"""
GOVERNMENT EXAM DOCUMENTS & NOTIFICATIONS MODULE
- Upload government exam notifications
- Upload admit cards for board exams
- Class-specific visibility
- Auto-show on app open for relevant students/teachers
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from core.database import db
import os
import uuid
import aiofiles
from pathlib import Path

router = APIRouter(prefix="/govt-exam", tags=["Government Exam Documents"])

UPLOAD_DIR = Path("./uploads/govt_docs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Models
class GovtExamDocument(BaseModel):
    school_id: str
    document_type: str  # notification, admit_card, date_sheet, result, circular
    title: str
    description: Optional[str] = None
    exam_name: str  # Board Exam, CBSE, MPBSE, etc.
    target_classes: List[str]  # ["Class 10", "Class 12"]
    priority: str = "normal"  # urgent, high, normal
    valid_from: str
    valid_until: str
    show_on_app_open: bool = True
    created_by: str

# ============== DOCUMENT UPLOAD ==============

@router.post("/upload")
async def upload_govt_document(
    school_id: str = Form(...),
    document_type: str = Form(...),
    title: str = Form(...),
    exam_name: str = Form(...),
    target_classes: str = Form(...),  # Comma-separated: "Class 10,Class 12"
    priority: str = Form("normal"),
    valid_from: str = Form(...),
    valid_until: str = Form(...),
    show_on_app_open: bool = Form(True),
    created_by: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...)
):
    """Upload a government exam document/notification"""
    
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and images allowed")
    
    # Save file
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    file_name = f"govt_{document_type}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    file_url = f"/api/uploads/govt_docs/{file_name}"
    
    # Parse target classes
    classes_list = [c.strip() for c in target_classes.split(",")]
    
    doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "document_type": document_type,
        "title": title,
        "description": description,
        "exam_name": exam_name,
        "target_classes": classes_list,
        "priority": priority,
        "file_url": file_url,
        "file_name": file.filename,
        "file_type": file.content_type,
        "valid_from": valid_from,
        "valid_until": valid_until,
        "show_on_app_open": show_on_app_open,
        "is_active": True,
        "view_count": 0,
        "acknowledged_by": [],
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.govt_exam_docs.insert_one(doc)
    doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Document '{title}' uploaded successfully",
        "document": doc
    }

@router.get("/documents/{school_id}")
async def get_all_documents(
    school_id: str,
    document_type: Optional[str] = None,
    class_name: Optional[str] = None,
    active_only: bool = True
):
    """Get all government exam documents"""
    query = {"school_id": school_id}
    
    if document_type:
        query["document_type"] = document_type
    
    if active_only:
        query["is_active"] = True
        query["valid_until"] = {"$gte": datetime.now().strftime("%Y-%m-%d")}
    
    if class_name:
        query["target_classes"] = {"$in": [class_name]}
    
    docs = await db.govt_exam_docs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {
        "total": len(docs),
        "documents": docs
    }

# ============== APP OPEN NOTIFICATIONS ==============

@router.get("/app-open-notifications/{school_id}")
async def get_app_open_notifications(
    school_id: str,
    user_type: str,  # student, teacher
    class_name: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Get notifications to show when app opens"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    query = {
        "school_id": school_id,
        "show_on_app_open": True,
        "is_active": True,
        "valid_from": {"$lte": today},
        "valid_until": {"$gte": today}
    }
    
    if class_name:
        query["target_classes"] = {"$in": [class_name]}
    
    docs = await db.govt_exam_docs.find(query, {"_id": 0}).sort([
        ("priority", -1),
        ("created_at", -1)
    ]).to_list(10)
    
    # Filter out already acknowledged by this user
    if user_id:
        docs = [d for d in docs if user_id not in d.get("acknowledged_by", [])]
    
    # Sort by priority
    priority_order = {"urgent": 0, "high": 1, "normal": 2}
    docs.sort(key=lambda x: priority_order.get(x.get("priority", "normal"), 2))
    
    return {
        "has_notifications": len(docs) > 0,
        "count": len(docs),
        "notifications": docs
    }

@router.post("/acknowledge/{document_id}")
async def acknowledge_document(document_id: str, user_id: str):
    """Mark document as acknowledged by user"""
    result = await db.govt_exam_docs.update_one(
        {"id": document_id},
        {
            "$addToSet": {"acknowledged_by": user_id},
            "$inc": {"view_count": 1}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"success": True, "message": "Document acknowledged"}

# ============== STUDENT/TEACHER SPECIFIC ==============

@router.get("/student/{school_id}/{student_id}")
async def get_student_documents(school_id: str, student_id: str):
    """Get documents for a specific student based on their class"""
    # Get student's class
    student = await db.students.find_one({"id": student_id, "school_id": school_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    class_name = student.get("class_name", "")
    today = datetime.now().strftime("%Y-%m-%d")
    
    docs = await db.govt_exam_docs.find({
        "school_id": school_id,
        "is_active": True,
        "valid_until": {"$gte": today},
        "target_classes": {"$in": [class_name]}
    }, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Separate by type
    notifications = [d for d in docs if d.get("document_type") == "notification"]
    admit_cards = [d for d in docs if d.get("document_type") == "admit_card"]
    date_sheets = [d for d in docs if d.get("document_type") == "date_sheet"]
    others = [d for d in docs if d.get("document_type") not in ["notification", "admit_card", "date_sheet"]]
    
    return {
        "student_name": student.get("name"),
        "class": class_name,
        "notifications": notifications,
        "admit_cards": admit_cards,
        "date_sheets": date_sheets,
        "other_documents": others,
        "total": len(docs)
    }

@router.get("/teacher/{school_id}/{teacher_id}")
async def get_teacher_documents(school_id: str, teacher_id: str):
    """Get documents for teacher - based on classes they teach"""
    # Get teacher's assigned classes
    allocations = await db.subject_allocations.find({
        "teacher_id": teacher_id,
        "school_id": school_id
    }).to_list(50)
    
    class_ids = list(set([a.get("class_id") for a in allocations]))
    
    # Get class names
    classes = await db.classes.find({"id": {"$in": class_ids}}).to_list(50)
    class_names = [c.get("name", "") + " " + c.get("section", "") for c in classes]
    class_names = [c.strip() for c in class_names]
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    docs = await db.govt_exam_docs.find({
        "school_id": school_id,
        "is_active": True,
        "valid_until": {"$gte": today},
        "$or": [
            {"target_classes": {"$in": class_names}},
            {"target_classes": {"$size": 0}}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {
        "teaching_classes": class_names,
        "documents": docs,
        "total": len(docs)
    }

# ============== DOCUMENT TYPES ==============

@router.get("/document-types")
async def get_document_types():
    """Get available document types"""
    return {
        "document_types": [
            {"id": "notification", "name": "Exam Notification", "icon": "📢"},
            {"id": "admit_card", "name": "Admit Card", "icon": "🎫"},
            {"id": "date_sheet", "name": "Date Sheet / Time Table", "icon": "📅"},
            {"id": "result", "name": "Result / Mark Sheet", "icon": "📊"},
            {"id": "circular", "name": "Circular", "icon": "📋"},
            {"id": "syllabus", "name": "Syllabus", "icon": "📚"},
            {"id": "guidelines", "name": "Exam Guidelines", "icon": "📖"},
            {"id": "fee_notice", "name": "Fee Notice", "icon": "💰"},
            {"id": "other", "name": "Other Document", "icon": "📄"}
        ],
        "exam_boards": [
            "CBSE", "MPBSE", "ICSE", "State Board", "NEET", "JEE", "CUET", "Other"
        ],
        "priorities": [
            {"id": "urgent", "name": "Urgent", "color": "red"},
            {"id": "high", "name": "High", "color": "orange"},
            {"id": "normal", "name": "Normal", "color": "blue"}
        ]
    }

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, school_id: str):
    """Delete a document"""
    doc = await db.govt_exam_docs.find_one({"id": document_id, "school_id": school_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    file_name = doc.get("file_url", "").split("/")[-1]
    file_path = UPLOAD_DIR / file_name
    if file_path.exists():
        file_path.unlink()
    
    await db.govt_exam_docs.delete_one({"id": document_id})
    
    return {"success": True, "message": "Document deleted"}
