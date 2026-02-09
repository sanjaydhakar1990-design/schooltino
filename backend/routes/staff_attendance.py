from fastapi import APIRouter, HTTPException, Query
from core.database import db
from datetime import datetime, timezone, timedelta
from bson import ObjectId

router = APIRouter(prefix="/staff-attendance", tags=["Staff Attendance"])

@router.get("/today")
async def get_today_attendance(school_id: str = Query(...)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    records = await db.staff_attendance.find({
        "school_id": school_id,
        "date": {"$gte": today_start, "$lt": today_end}
    }).to_list(500)
    
    for r in records:
        r["id"] = str(r.pop("_id"))
    
    return {"attendance": records}

@router.post("/mark")
async def mark_attendance(data: dict):
    school_id = data.get("school_id")
    staff_id = data.get("staff_id")
    if not school_id or not staff_id:
        raise HTTPException(400, "school_id and staff_id required")
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    existing = await db.staff_attendance.find_one({
        "school_id": school_id,
        "staff_id": staff_id,
        "date": {"$gte": today_start, "$lt": today_end}
    })
    
    if existing:
        raise HTTPException(400, "Already marked for today")
    
    record = {
        "school_id": school_id,
        "staff_id": staff_id,
        "status": data.get("status", "present"),
        "check_in_time": data.get("check_in_time", datetime.now(timezone.utc).isoformat()),
        "method": data.get("method", "manual"),
        "location": data.get("location"),
        "date": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.staff_attendance.insert_one(record)
    return {"success": True, "id": str(result.inserted_id)}

@router.get("/report")
async def attendance_report(school_id: str = Query(...), month: int = Query(None), year: int = Query(None)):
    now = datetime.now(timezone.utc)
    month = month or now.month
    year = year or now.year
    
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    
    records = await db.staff_attendance.find({
        "school_id": school_id,
        "date": {"$gte": start_date, "$lt": end_date}
    }).to_list(5000)
    
    for r in records:
        r["id"] = str(r.pop("_id"))
    
    return {"report": records, "month": month, "year": year}
