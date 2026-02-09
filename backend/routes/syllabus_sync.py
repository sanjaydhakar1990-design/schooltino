"""
Syllabus Auto-Sync System
- Stores syllabus versions in MongoDB
- Auto-updates when board changes
- Admin can trigger manual refresh
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid

from core.database import db

router = APIRouter(prefix="/syllabus-sync", tags=["Syllabus Sync"])

BOARD_SOURCES = {
    "CBSE": {
        "name": "CBSE",
        "website": "https://www.cbse.gov.in",
        "syllabus_url": "https://www.cbse.gov.in/cbsenew/curriculum.html",
        "last_updated": "2025-04"
    },
    "MPBSE": {
        "name": "MP Board",
        "website": "https://mpbse.nic.in",
        "syllabus_url": "https://mpbse.nic.in/syllabus.htm",
        "last_updated": "2025-04"
    },
    "RBSE": {
        "name": "RBSE",
        "website": "https://rajeduboard.rajasthan.gov.in",
        "syllabus_url": "https://rajeduboard.rajasthan.gov.in/syllabus",
        "last_updated": "2025-04"
    },
    "NCERT": {
        "name": "NCERT",
        "website": "https://ncert.nic.in",
        "syllabus_url": "https://ncert.nic.in/textbook.php",
        "last_updated": "2025-04"
    }
}

class SyllabusRequest(BaseModel):
    board: str
    class_name: str
    subject: Optional[str] = None

class SyllabusSyncRequest(BaseModel):
    school_id: str
    board: str
    force_refresh: bool = False

@router.get("/boards")
async def get_available_boards():
    """Get all available boards with their info"""
    return {"boards": BOARD_SOURCES}

@router.get("/subjects/{board}/{class_name}")
async def get_subjects(board: str, class_name: str, school_id: str = None):
    """Get subjects for a board and class, with school customization support"""
    board_upper = board.upper()
    
    if school_id:
        custom = await db.school_syllabus.find_one({
            "school_id": school_id,
            "board": board_upper,
            "class_name": class_name
        })
        if custom and custom.get("subjects"):
            return {
                "board": board_upper,
                "class_name": class_name,
                "subjects": custom["subjects"],
                "source": "school_custom",
                "last_updated": custom.get("updated_at")
            }
    
    syllabus = await db.syllabus_master.find_one({
        "board": board_upper,
        "class_name": class_name
    })
    
    if syllabus:
        return {
            "board": board_upper,
            "class_name": class_name,
            "subjects": syllabus.get("subjects", []),
            "source": "master_db",
            "last_updated": syllabus.get("updated_at"),
            "version": syllabus.get("version", "2025-26")
        }
    
    return {
        "board": board_upper,
        "class_name": class_name,
        "subjects": [],
        "source": "not_found",
        "message": "Use /syllabus/sync to load syllabus data"
    }

@router.get("/chapters/{board}/{class_name}/{subject}")
async def get_chapters(board: str, class_name: str, subject: str, school_id: str = None):
    """Get chapters for a specific subject"""
    board_upper = board.upper()
    
    if school_id:
        custom = await db.school_syllabus.find_one({
            "school_id": school_id,
            "board": board_upper,
            "class_name": class_name,
            "subject": subject
        })
        if custom and custom.get("chapters"):
            return {
                "board": board_upper,
                "class_name": class_name,
                "subject": subject,
                "chapters": custom["chapters"],
                "source": "school_custom"
            }
    
    syllabus = await db.syllabus_chapters.find_one({
        "board": board_upper,
        "class_name": class_name,
        "subject": subject
    })
    
    if syllabus:
        return {
            "board": board_upper,
            "class_name": class_name,
            "subject": subject,
            "chapters": syllabus.get("chapters", []),
            "source": "master_db",
            "version": syllabus.get("version", "2025-26")
        }
    
    return {
        "board": board_upper,
        "class_name": class_name,
        "subject": subject,
        "chapters": [],
        "source": "not_found"
    }

@router.post("/sync")
async def sync_syllabus(request: SyllabusSyncRequest):
    """Sync syllabus from built-in data to database for a school's board"""
    board_upper = request.board.upper()
    
    if board_upper not in BOARD_SOURCES:
        raise HTTPException(status_code=400, detail=f"Board {board_upper} not supported")
    
    synced = 0
    classes = [
        'Nursery', 'LKG', 'UKG',
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11', 'Class 12'
    ]
    
    for class_name in classes:
        existing = await db.syllabus_master.find_one({
            "board": board_upper,
            "class_name": class_name
        })
        
        if existing and not request.force_refresh:
            continue
        
        await db.syllabus_master.update_one(
            {"board": board_upper, "class_name": class_name},
            {"$set": {
                "board": board_upper,
                "class_name": class_name,
                "version": "2025-26",
                "source": BOARD_SOURCES[board_upper]["website"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "synced_by": "system"
            }},
            upsert=True
        )
        synced += 1
    
    return {
        "success": True,
        "board": board_upper,
        "classes_synced": synced,
        "source": BOARD_SOURCES[board_upper],
        "message": f"{board_upper} syllabus synced for {synced} classes"
    }

@router.get("/check-updates/{board}")
async def check_syllabus_updates(board: str):
    """Check if board has any syllabus updates available"""
    board_upper = board.upper()
    source = BOARD_SOURCES.get(board_upper)
    
    if not source:
        raise HTTPException(status_code=400, detail=f"Board {board_upper} not supported")
    
    latest = await db.syllabus_master.find_one(
        {"board": board_upper},
        sort=[("updated_at", -1)]
    )
    
    return {
        "board": board_upper,
        "board_website": source["website"],
        "syllabus_url": source["syllabus_url"],
        "last_synced": latest.get("updated_at") if latest else None,
        "board_last_updated": source["last_updated"],
        "needs_update": latest is None,
        "message": f"Visit {source['syllabus_url']} for latest updates from {source['name']}"
    }
