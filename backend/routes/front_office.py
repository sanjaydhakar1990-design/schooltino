"""
Front Office / Visitor Management Module
- Visitor registration and gate pass
- Visitor check-in/check-out tracking
- Purpose tracking
- Notifications to staff
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from core.database import db
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

router = APIRouter(prefix="/front-office", tags=["Front Office"])

def get_database():
    return db

# Models
class VisitorCreate(BaseModel):
    name: str
    phone: str
    purpose: str  # meeting, delivery, parent_visit, vendor, interview, other
    whom_to_meet: str  # Staff/Teacher name
    id_proof_type: Optional[str] = None  # aadhar, pan, driving_license, voter_id
    id_proof_number: Optional[str] = None
    vehicle_number: Optional[str] = None
    num_visitors: int = 1
    expected_duration: Optional[int] = 30  # minutes
    notes: Optional[str] = None

class VisitorCheckOut(BaseModel):
    checkout_notes: Optional[str] = None
    items_returned: Optional[List[str]] = None

class GatePassRequest(BaseModel):
    student_id: str
    reason: str  # early_leave, medical, emergency, other
    authorized_by: str
    pickup_person_name: str
    pickup_person_phone: str
    pickup_person_relation: str

# API Endpoints
@router.post("/visitors/checkin")
async def visitor_checkin(visitor: VisitorCreate, school_id: str):
    """Register new visitor and generate gate pass"""
    db = get_database()
    
    visitor_id = f"VIS-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    visitor_doc = {
        "visitor_id": visitor_id,
        "school_id": school_id,
        "name": visitor.name,
        "phone": visitor.phone,
        "purpose": visitor.purpose,
        "whom_to_meet": visitor.whom_to_meet,
        "id_proof_type": visitor.id_proof_type,
        "id_proof_number": visitor.id_proof_number,
        "vehicle_number": visitor.vehicle_number,
        "num_visitors": visitor.num_visitors,
        "expected_duration": visitor.expected_duration,
        "notes": visitor.notes,
        "checkin_time": datetime.now(timezone.utc).isoformat(),
        "checkout_time": None,
        "status": "checked_in",
        "badge_number": str(uuid.uuid4())[:4].upper(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.visitors.insert_one(visitor_doc)
    
    # Remove _id from response
    visitor_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Visitor {visitor.name} checked in successfully",
        "visitor": visitor_doc,
        "gate_pass": {
            "pass_id": visitor_id,
            "badge_number": visitor_doc["badge_number"],
            "valid_for": f"{visitor.expected_duration} minutes"
        }
    }

@router.post("/visitors/{visitor_id}/checkout")
async def visitor_checkout(visitor_id: str, checkout: VisitorCheckOut, school_id: str):
    """Check out a visitor"""
    db = get_database()
    
    visitor = await db.visitors.find_one({
        "visitor_id": visitor_id,
        "school_id": school_id
    })
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    if visitor.get("status") == "checked_out":
        raise HTTPException(status_code=400, detail="Visitor already checked out")
    
    checkout_time = datetime.now(timezone.utc).isoformat()
    checkin_time = datetime.fromisoformat(visitor["checkin_time"].replace('Z', '+00:00'))
    duration = int((datetime.now(timezone.utc) - checkin_time).total_seconds() / 60)
    
    await db.visitors.update_one(
        {"visitor_id": visitor_id},
        {
            "$set": {
                "checkout_time": checkout_time,
                "status": "checked_out",
                "duration_minutes": duration,
                "checkout_notes": checkout.checkout_notes,
                "items_returned": checkout.items_returned
            }
        }
    )
    
    return {
        "success": True,
        "message": f"Visitor checked out successfully",
        "duration": f"{duration} minutes"
    }

@router.get("/visitors/today")
async def get_todays_visitors(school_id: str):
    """Get all visitors for today"""
    db = get_database()
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    visitors = await db.visitors.find({
        "school_id": school_id,
        "checkin_time": {"$regex": f"^{today}"}
    }, {"_id": 0}).sort("checkin_time", -1).to_list(length=100)
    
    checked_in = len([v for v in visitors if v.get("status") == "checked_in"])
    checked_out = len([v for v in visitors if v.get("status") == "checked_out"])
    
    return {
        "date": today,
        "total_visitors": len(visitors),
        "currently_in": checked_in,
        "checked_out": checked_out,
        "visitors": visitors
    }

@router.get("/visitors/history")
async def get_visitor_history(
    school_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    purpose: Optional[str] = None,
    limit: int = 50
):
    """Get visitor history with filters"""
    db = get_database()
    
    query = {"school_id": school_id}
    
    if from_date:
        query["checkin_time"] = {"$gte": from_date}
    if to_date:
        if "checkin_time" in query:
            query["checkin_time"]["$lte"] = to_date + "T23:59:59"
        else:
            query["checkin_time"] = {"$lte": to_date + "T23:59:59"}
    if purpose:
        query["purpose"] = purpose
    
    visitors = await db.visitors.find(query, {"_id": 0}).sort("checkin_time", -1).to_list(length=limit)
    
    return {
        "total": len(visitors),
        "visitors": visitors
    }

# Student Gate Pass
@router.post("/gate-pass/student")
async def create_student_gate_pass(request: GatePassRequest, school_id: str):
    """Create gate pass for student early leave"""
    db = get_database()
    
    # Verify student exists
    student = await db.students.find_one({
        "student_id": request.student_id,
        "school_id": school_id
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    pass_id = f"GP-{datetime.now().strftime('%Y%m%d%H%M')}-{str(uuid.uuid4())[:4].upper()}"
    
    gate_pass = {
        "pass_id": pass_id,
        "school_id": school_id,
        "student_id": request.student_id,
        "student_name": student.get("name"),
        "class_name": student.get("class_name"),
        "section": student.get("section"),
        "reason": request.reason,
        "authorized_by": request.authorized_by,
        "pickup_person": {
            "name": request.pickup_person_name,
            "phone": request.pickup_person_phone,
            "relation": request.pickup_person_relation
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "used": False,
        "used_at": None
    }
    
    await db.gate_passes.insert_one(gate_pass)
    gate_pass.pop('_id', None)
    
    return {
        "success": True,
        "message": "Gate pass created",
        "gate_pass": gate_pass
    }

@router.get("/gate-pass/today")
async def get_todays_gate_passes(school_id: str):
    """Get all student gate passes for today"""
    db = get_database()
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    passes = await db.gate_passes.find({
        "school_id": school_id,
        "created_at": {"$regex": f"^{today}"}
    }, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    
    return {
        "date": today,
        "total": len(passes),
        "gate_passes": passes
    }

@router.post("/gate-pass/{pass_id}/use")
async def use_gate_pass(pass_id: str, school_id: str):
    """Mark gate pass as used"""
    db = get_database()
    
    result = await db.gate_passes.update_one(
        {"pass_id": pass_id, "school_id": school_id, "used": False},
        {
            "$set": {
                "used": True,
                "used_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Gate pass not found or already used")
    
    return {"success": True, "message": "Gate pass used"}

# Analytics
@router.get("/analytics")
async def get_front_office_analytics(school_id: str, period: str = "month"):
    """Get front office analytics"""
    db = get_database()
    
    # Get visitor stats by purpose
    pipeline = [
        {"$match": {"school_id": school_id}},
        {"$group": {
            "_id": "$purpose",
            "count": {"$sum": 1}
        }}
    ]
    
    purpose_stats = await db.visitors.aggregate(pipeline).to_list(length=20)
    
    # Get daily visitor count for last 7 days
    from datetime import timedelta
    daily_stats = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        count = await db.visitors.count_documents({
            "school_id": school_id,
            "checkin_time": {"$regex": f"^{date}"}
        })
        daily_stats.append({"date": date, "count": count})
    
    return {
        "by_purpose": {stat["_id"]: stat["count"] for stat in purpose_stats},
        "daily_trend": daily_stats[::-1],
        "total_this_month": sum(s["count"] for s in daily_stats)
    }
