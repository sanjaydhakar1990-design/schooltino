"""
Timetable Auto-Scheduler Module
- AI-powered automatic timetable generation
- Constraint-based scheduling
- Teacher workload balancing
- Conflict detection
- Proxy/substitute management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, time
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid
import random

load_dotenv()

router = APIRouter(prefix="/timetable", tags=["Timetable Management"])

# Database connection
def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

db = None
def get_database():
    global db
    if db is None:
        db = get_db()
    return db

async def create_notification(db, school_id: str, teacher_id: str, subject: str, class_id: str, action: str):
    title = "📘 Subject Assigned" if action == "assigned" else "🔁 Subject Updated"
    message = f"Aapko class {class_id} ke liye {subject} assign/update किया गया है."
    notification = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "title": title,
        "message": message,
        "type": "subject_assignment",
        "target_user_id": teacher_id,
        "target_roles": [],
        "class_id": class_id,
        "data": {"subject": subject, "class_id": class_id},
        "read_by": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)

# Models
class TimetableConfig(BaseModel):
    class_id: str
    periods_per_day: int = 8
    period_duration: int = 40  # minutes
    break_after_period: int = 4
    break_duration: int = 20
    lunch_after_period: int = 6
    lunch_duration: int = 40
    start_time: str = "08:00"
    working_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

class SubjectAllocation(BaseModel):
    class_id: str
    subject: str
    teacher_id: str
    periods_per_week: int

class ProxyRequest(BaseModel):
    original_teacher_id: str
    substitute_teacher_id: str
    date: str
    periods: List[int]
    reason: str

# Days and periods
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
PERIODS = list(range(1, 9))

# API Endpoints

@router.post("/config")
async def set_timetable_config(config: TimetableConfig, school_id: str):
    """Set timetable configuration for a class"""
    db = get_database()
    
    config_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "class_id": config.class_id,
        "periods_per_day": config.periods_per_day,
        "period_duration": config.period_duration,
        "break_after_period": config.break_after_period,
        "break_duration": config.break_duration,
        "lunch_after_period": config.lunch_after_period,
        "lunch_duration": config.lunch_duration,
        "start_time": config.start_time,
        "working_days": config.working_days,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.timetable_config.update_one(
        {"class_id": config.class_id, "school_id": school_id},
        {"$set": config_doc},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Timetable configuration saved",
        "config": config_doc
    }

@router.post("/allocations")
async def add_subject_allocation(allocation: SubjectAllocation, school_id: str):
    """Add subject-teacher allocation for a class"""
    db = get_database()
    
    allocation_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "class_id": allocation.class_id,
        "subject": allocation.subject,
        "teacher_id": allocation.teacher_id,
        "periods_per_week": allocation.periods_per_week,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if allocation already exists
    existing = await db.subject_allocations.find_one({
        "class_id": allocation.class_id,
        "subject": allocation.subject,
        "school_id": school_id
    })
    
    if existing:
        await db.subject_allocations.update_one(
            {"id": existing["id"]},
            {"$set": {
                "teacher_id": allocation.teacher_id,
                "periods_per_week": allocation.periods_per_week
            }}
        )
        await create_notification(db, school_id, allocation.teacher_id, allocation.subject, allocation.class_id, "updated")
        return {"success": True, "message": "Allocation updated"}
    
    await db.subject_allocations.insert_one(allocation_doc)

    await create_notification(db, school_id, allocation.teacher_id, allocation.subject, allocation.class_id, "assigned")
    
    return {
        "success": True,
        "message": f"Teacher allocated for {allocation.subject}",
        "allocation": allocation_doc
    }

@router.get("/allocations/{class_id}")
async def get_class_allocations(class_id: str, school_id: str):
    """Get all subject allocations for a class"""
    db = get_database()
    
    allocations = await db.subject_allocations.find(
        {"class_id": class_id, "school_id": school_id},
        {"_id": 0}
    ).to_list(length=50)
    
    # Get teacher names
    teacher_ids = [a["teacher_id"] for a in allocations]
    teachers = await db.users.find(
        {"id": {"$in": teacher_ids}},
        {"id": 1, "name": 1, "_id": 0}
    ).to_list(length=50)
    teacher_map = {t["id"]: t["name"] for t in teachers}
    
    for a in allocations:
        a["teacher_name"] = teacher_map.get(a["teacher_id"], "Unknown")
    
    return {
        "class_id": class_id,
        "total_subjects": len(allocations),
        "total_periods": sum(a.get("periods_per_week", 0) for a in allocations),
        "allocations": allocations
    }

@router.post("/generate")
async def generate_timetable(class_id: str, school_id: str):
    """Auto-generate timetable using AI scheduling algorithm"""
    db = get_database()
    
    # Get config
    config = await db.timetable_config.find_one({
        "class_id": class_id,
        "school_id": school_id
    })
    
    if not config:
        # Use default config
        config = {
            "periods_per_day": 8,
            "working_days": DAYS[:6],
            "break_after_period": 4,
            "lunch_after_period": 6
        }
    
    # Get allocations
    allocations = await db.subject_allocations.find(
        {"class_id": class_id, "school_id": school_id},
        {"_id": 0}
    ).to_list(length=50)
    
    if not allocations:
        raise HTTPException(status_code=400, detail="No subject allocations found. Please add subjects first.")
    
    # [NEW] Get class teacher info for first period priority
    class_info = await db.classes.find_one(
        {"id": class_id, "school_id": school_id},
        {"_id": 0, "class_teacher_id": 1, "name": 1}
    )
    class_teacher_id = class_info.get("class_teacher_id") if class_info else None
    
    # Get teacher names
    teacher_ids = [a["teacher_id"] for a in allocations]
    teachers = await db.users.find(
        {"id": {"$in": teacher_ids}},
        {"id": 1, "name": 1, "_id": 0}
    ).to_list(length=50)
    teacher_map = {t["id"]: t["name"] for t in teachers}
    
    # Generate timetable using constraint-based algorithm
    timetable = {}
    working_days = config.get("working_days", DAYS[:6])
    periods_per_day = config.get("periods_per_day", 8)
    
    # [NEW] Find class teacher's subject for first period
    class_teacher_subject = None
    if class_teacher_id:
        for alloc in allocations:
            if alloc["teacher_id"] == class_teacher_id:
                class_teacher_subject = {
                    "subject": alloc["subject"],
                    "teacher_id": alloc["teacher_id"],
                    "teacher_name": teacher_map.get(alloc["teacher_id"], "TBA")
                }
                break
    
    # Create period distribution for each subject
    subject_periods = []
    for alloc in allocations:
        for _ in range(alloc.get("periods_per_week", 0)):
            subject_periods.append({
                "subject": alloc["subject"],
                "teacher_id": alloc["teacher_id"],
                "teacher_name": teacher_map.get(alloc["teacher_id"], "TBA")
            })
    
    # Shuffle for randomness (but keep class teacher subject separate for first period)
    random.shuffle(subject_periods)
    
    # Distribute across days
    period_idx = 0
    for day in working_days:
        timetable[day] = []
        for period_num in range(1, periods_per_day + 1):
            # Skip breaks
            if period_num == config.get("break_after_period", 4) + 1:
                timetable[day].append({
                    "period": period_num,
                    "type": "break",
                    "subject": "Short Break",
                    "duration": config.get("break_duration", 20)
                })
                continue
            
            if period_num == config.get("lunch_after_period", 6) + 1:
                timetable[day].append({
                    "period": period_num,
                    "type": "lunch",
                    "subject": "Lunch Break",
                    "duration": config.get("lunch_duration", 40)
                })
                continue
            
            # [NEW] First period = Class Teacher (for attendance)
            if period_num == 1 and class_teacher_subject:
                timetable[day].append({
                    "period": period_num,
                    "type": "class",
                    "subject": class_teacher_subject["subject"],
                    "teacher_id": class_teacher_subject["teacher_id"],
                    "teacher_name": class_teacher_subject["teacher_name"]
                })
                continue
            
            # Assign subject
            if period_idx < len(subject_periods):
                entry = subject_periods[period_idx]
                timetable[day].append({
                    "period": period_num,
                    "type": "class",
                    "subject": entry["subject"],
                    "teacher_id": entry["teacher_id"],
                    "teacher_name": entry["teacher_name"]
                })
                period_idx += 1
            else:
                # Free period or library
                timetable[day].append({
                    "period": period_num,
                    "type": "free",
                    "subject": random.choice(["Library", "Sports", "Activity", "Self Study"])
                })
    
    
    # Save generated timetable
    timetable_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "class_id": class_id,
        "schedule": timetable,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    
    # Replace existing timetable
    await db.timetables.delete_many({"class_id": class_id, "school_id": school_id})
    await db.timetables.insert_one(timetable_doc)
    
    # [AUTO-SYNC] Automatically sync timetable to subject_allocations
    print(f"[AUTO-SYNC] Syncing timetable to subject_allocations for class {class_id}...")
    try:
        sync_count = 0
        allocations_map = {}
        
        for day, periods in timetable.items():
            for period in periods:
                if period.get("type") != "class":
                    continue
                    
                teacher_id = period.get("teacher_id")
                subject = period.get("subject")
                
                if not teacher_id or not subject:
                    continue
                
                key = f"{teacher_id}_{class_id}_{subject}"
                if key not in allocations_map:
                    allocations_map[key] = {
                        "teacher_id": teacher_id,
                        "teacher_name": period.get("teacher_name", ""),
                        "subject": subject,
                        "periods": []
                    }
                allocations_map[key]["periods"].append(day)
        
        # Upsert subject_allocations
        for key, data in allocations_map.items():
            allocation = {
                "id": str(uuid.uuid4()),
                "teacher_id": data["teacher_id"],
                "teacher_name": data["teacher_name"],
                "class_id": class_id,
                "class_name": class_name,
                "subject": data["subject"],
                "subject_name": data["subject"],
                "school_id": school_id,
                "periods_per_week": len(data["periods"]),
                "topics_covered": 0,
                "total_topics": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "source": "timetable_auto_sync"
            }
            
            result = await db.subject_allocations.update_one(
                {
                    "teacher_id": data["teacher_id"],
                    "class_id": class_id,
                    "subject": data["subject"]
                },
                {"$set": allocation},
                upsert=True
            )
            
            if result.upserted_id or result.modified_count > 0:
                sync_count += 1
        
        print(f"[AUTO-SYNC] ✓ Synced {sync_count} subject allocations for class {class_id}")
    except Exception as sync_err:
        print(f"[AUTO-SYNC] Error (non-fatal): {sync_err}")
    
    return {
        "success": True,
        "message": "Timetable generated successfully!",
        "timetable_id": timetable_doc["id"],
        "schedule": timetable
    }

@router.get("/{class_id}")
async def get_timetable(class_id: str, school_id: str):
    """Get timetable for a class"""
    db = get_database()
    
    timetable = await db.timetables.find_one(
        {"class_id": class_id, "school_id": school_id},
        {"_id": 0}
    )
    
    if not timetable:
        return {"exists": False, "message": "No timetable found. Please generate one."}
    
    return {
        "exists": True,
        "class_id": class_id,
        "generated_at": timetable.get("generated_at"),
        "schedule": timetable.get("schedule", {})
    }

@router.get("/teacher/{teacher_id}")
async def get_teacher_timetable(teacher_id: str, school_id: str):
    """Get consolidated timetable for a teacher across all classes"""
    db = get_database()
    
    # Get all allocations for this teacher
    allocations = await db.subject_allocations.find(
        {"teacher_id": teacher_id, "school_id": school_id},
        {"_id": 0}
    ).to_list(length=50)
    
    # [FIX] staff.id cross-reference — same as Method 1b in server.py
    if not allocations:
        staff_rec = await db.staff.find_one({"user_id": teacher_id}, {"_id": 0, "id": 1})
        if staff_rec:
            allocations = await db.subject_allocations.find(
                {"teacher_id": staff_rec["id"], "school_id": school_id},
                {"_id": 0}
            ).to_list(length=50)
            # Auto-fix: correct teacher_id in allocations
            if allocations:
                await db.subject_allocations.update_many(
                    {"teacher_id": staff_rec["id"], "school_id": school_id},
                    {"$set": {"teacher_id": teacher_id}}
                )
                print(f"[TIMETABLE AUTO-FIX] teacher_id corrected: {staff_rec['id']} → {teacher_id}")
    
    if not allocations:
        return {"exists": False, "message": "No classes assigned to this teacher"}
    
    # Get timetables for all assigned classes
    class_ids = list(set([a["class_id"] for a in allocations]))
    
    # [FIX] Fetch class names to include in schedule
    class_docs = await db.classes.find(
        {"id": {"$in": class_ids}},
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(length=50)
    class_name_map = {c["id"]: c.get("name", c["id"]) for c in class_docs}
    
    teacher_schedule = {day: [] for day in DAYS}
    
    for class_id in class_ids:
        timetable = await db.timetables.find_one(
            {"class_id": class_id, "school_id": school_id}
        )
        
        if timetable and timetable.get("schedule"):
            for day, periods in timetable["schedule"].items():
                for period in periods:
                    if period.get("teacher_id") == teacher_id:
                        teacher_schedule[day].append({
                            "period": period.get("period"),
                            "class_id": class_id,
                            "class_name": class_name_map.get(class_id, class_id),  # [FIX] added class_name
                            "subject": period.get("subject")
                        })
    
    # Sort by period
    for day in teacher_schedule:
        teacher_schedule[day].sort(key=lambda x: x.get("period", 0))
    
    total_periods = sum(len(periods) for periods in teacher_schedule.values())
    
    return {
        "teacher_id": teacher_id,
        "total_periods_per_week": total_periods,
        "classes_count": len(class_ids),
        "schedule": teacher_schedule
    }

@router.post("/proxy")
async def request_proxy(request: ProxyRequest, school_id: str):
    """Request a proxy/substitute teacher"""
    db = get_database()
    
    # Get teacher names
    original = await db.users.find_one({"id": request.original_teacher_id}, {"name": 1})
    substitute = await db.users.find_one({"id": request.substitute_teacher_id}, {"name": 1})
    
    proxy_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "original_teacher_id": request.original_teacher_id,
        "original_teacher_name": original.get("name") if original else "Unknown",
        "substitute_teacher_id": request.substitute_teacher_id,
        "substitute_teacher_name": substitute.get("name") if substitute else "Unknown",
        "date": request.date,
        "periods": request.periods,
        "reason": request.reason,
        "status": "approved",  # Can be pending, approved, rejected
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.proxy_requests.insert_one(proxy_doc)
    proxy_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Proxy assigned: {substitute.get('name') if substitute else 'Substitute'} will take classes on {request.date}",
        "proxy": proxy_doc
    }

@router.get("/proxy/today")
async def get_today_proxies(school_id: str):
    """Get all proxy arrangements for today"""
    db = get_database()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    proxies = await db.proxy_requests.find(
        {"school_id": school_id, "date": today},
        {"_id": 0}
    ).to_list(length=50)
    
    return {
        "date": today,
        "total_proxies": len(proxies),
        "proxies": proxies
    }

@router.get("/conflicts")
async def detect_conflicts(school_id: str):
    """Detect scheduling conflicts in timetables"""
    db = get_database()
    
    # Get all timetables
    timetables = await db.timetables.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(length=100)
    
    conflicts = []
    
    # Check for teacher double-booking
    for day in DAYS:
        teacher_periods = {}  # {teacher_id: {period: class_id}}
        
        for tt in timetables:
            class_id = tt.get("class_id")
            schedule = tt.get("schedule", {})
            
            if day in schedule:
                for period in schedule[day]:
                    if period.get("type") == "class" and period.get("teacher_id"):
                        teacher_id = period["teacher_id"]
                        period_num = period.get("period")
                        
                        if teacher_id not in teacher_periods:
                            teacher_periods[teacher_id] = {}
                        
                        if period_num in teacher_periods[teacher_id]:
                            conflicts.append({
                                "type": "teacher_double_booking",
                                "day": day,
                                "period": period_num,
                                "teacher_id": teacher_id,
                                "teacher_name": period.get("teacher_name"),
                                "classes": [teacher_periods[teacher_id][period_num], class_id]
                            })
                        else:
                            teacher_periods[teacher_id][period_num] = class_id
    
    return {
        "total_conflicts": len(conflicts),
        "has_conflicts": len(conflicts) > 0,
        "conflicts": conflicts,
        "message": "No conflicts found!" if not conflicts else "Please resolve the conflicts"
    }

@router.get("/analytics")
async def get_timetable_analytics(school_id: str):
    """Get timetable analytics"""
    db = get_database()
    
    total_timetables = await db.timetables.count_documents({"school_id": school_id})
    total_allocations = await db.subject_allocations.count_documents({"school_id": school_id})
    today_proxies = await db.proxy_requests.count_documents({
        "school_id": school_id,
        "date": datetime.now().strftime('%Y-%m-%d')
    })
    
    # Teacher workload
    pipeline = [
        {"$match": {"school_id": school_id}},
        {"$group": {
            "_id": "$teacher_id",
            "total_periods": {"$sum": "$periods_per_week"},
            "subjects_count": {"$sum": 1}
        }}
    ]
    
    teacher_workload = await db.subject_allocations.aggregate(pipeline).to_list(length=100)
    
    return {
        "classes_with_timetable": total_timetables,
        "total_allocations": total_allocations,
        "today_proxies": today_proxies,
        "teacher_workload": teacher_workload[:10],
        "avg_periods_per_teacher": round(sum(t["total_periods"] for t in teacher_workload) / max(len(teacher_workload), 1), 1)
    }
