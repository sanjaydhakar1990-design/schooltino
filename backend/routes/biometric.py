"""
Biometric Attendance Module
- Fingerprint and Face Recognition attendance
- Device management
- Real-time sync with attendance system
- Dashboard integration
- Student, Teacher, and Staff support
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from core.database import db
import os
from dotenv import load_dotenv
import uuid
import random

load_dotenv()

router = APIRouter(prefix="/biometric", tags=["Biometric Attendance"])

def get_database():
    return db

# Models
class BiometricDevice(BaseModel):
    device_name: str
    device_type: str = "fingerprint"  # fingerprint, face, card, multi
    location: str  # main_gate, classroom, staff_room
    ip_address: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None

class BiometricEnrollment(BaseModel):
    person_id: str  # student_id or staff_id
    person_type: str  # student, teacher, staff
    biometric_type: str = "fingerprint"  # fingerprint, face
    device_id: str

class ManualAttendance(BaseModel):
    person_id: str
    person_type: str
    attendance_type: str = "in"  # in, out
    reason: Optional[str] = None

class AttendanceQuery(BaseModel):
    date: Optional[str] = None
    person_type: Optional[str] = None
    class_id: Optional[str] = None

# API Endpoints

@router.post("/devices")
async def add_biometric_device(device: BiometricDevice, school_id: str):
    """Add a new biometric device"""
    db = get_database()
    
    device_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "device_name": device.device_name,
        "device_type": device.device_type,
        "location": device.location,
        "ip_address": device.ip_address,
        "serial_number": device.serial_number,
        "manufacturer": device.manufacturer,
        "status": "online",  # online, offline, maintenance
        "last_sync": datetime.now(timezone.utc).isoformat(),
        "enrolled_count": 0,
        "today_punches": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.biometric_devices.insert_one(device_doc)
    device_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Device '{device.device_name}' added successfully",
        "device": device_doc
    }

@router.get("/devices")
async def get_biometric_devices(school_id: str):
    """Get all biometric devices"""
    db = get_database()
    
    devices = await db.biometric_devices.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(length=50)
    
    # Simulate device status updates
    for device in devices:
        device["status"] = random.choice(["online", "online", "online", "offline"]) if random.random() > 0.1 else "offline"
        device["today_punches"] = random.randint(50, 200)
    
    return {
        "total": len(devices),
        "online": len([d for d in devices if d.get("status") == "online"]),
        "offline": len([d for d in devices if d.get("status") == "offline"]),
        "devices": devices
    }

@router.post("/enroll")
async def enroll_biometric(enrollment: BiometricEnrollment, school_id: str):
    """Enroll a person's biometric data"""
    db = get_database()
    
    # Verify person exists
    collection = "students" if enrollment.person_type == "student" else "users"
    id_field = "student_id" if enrollment.person_type == "student" else "id"
    
    person = await db[collection].find_one({
        id_field: enrollment.person_id,
        "school_id": school_id
    })
    
    if not person:
        raise HTTPException(status_code=404, detail=f"{enrollment.person_type.title()} not found")
    
    # Create enrollment record
    enrollment_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "person_id": enrollment.person_id,
        "person_name": person.get("name"),
        "person_type": enrollment.person_type,
        "biometric_type": enrollment.biometric_type,
        "device_id": enrollment.device_id,
        "enrollment_status": "completed",
        "template_id": f"BIO-{str(uuid.uuid4())[:8].upper()}",
        "enrolled_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - update if exists
    await db.biometric_enrollments.update_one(
        {
            "person_id": enrollment.person_id,
            "school_id": school_id,
            "biometric_type": enrollment.biometric_type
        },
        {"$set": enrollment_doc},
        upsert=True
    )
    
    # Update device enrolled count
    await db.biometric_devices.update_one(
        {"id": enrollment.device_id},
        {"$inc": {"enrolled_count": 1}}
    )
    
    return {
        "success": True,
        "message": f"Biometric enrolled for {person.get('name')}",
        "template_id": enrollment_doc["template_id"]
    }

@router.get("/enrollments")
async def get_enrollments(school_id: str, person_type: Optional[str] = None):
    """Get all biometric enrollments"""
    db = get_database()
    
    query = {"school_id": school_id}
    if person_type:
        query["person_type"] = person_type
    
    enrollments = await db.biometric_enrollments.find(
        query,
        {"_id": 0}
    ).to_list(length=500)
    
    return {
        "total": len(enrollments),
        "by_type": {
            "student": len([e for e in enrollments if e.get("person_type") == "student"]),
            "teacher": len([e for e in enrollments if e.get("person_type") == "teacher"]),
            "staff": len([e for e in enrollments if e.get("person_type") == "staff"])
        },
        "enrollments": enrollments
    }

@router.post("/punch")
async def record_biometric_punch(
    person_id: str,
    device_id: str,
    school_id: str,
    punch_type: str = "auto"  # auto, in, out
):
    """Record a biometric punch (simulated for demo)"""
    db = get_database()
    
    # Get enrollment
    enrollment = await db.biometric_enrollments.find_one({
        "person_id": person_id,
        "school_id": school_id
    })
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Person not enrolled in biometric system")
    
    # Determine punch type
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    last_punch = await db.biometric_punches.find_one(
        {"person_id": person_id, "date": today},
        sort=[("timestamp", -1)]
    )
    
    if punch_type == "auto":
        punch_type = "out" if last_punch and last_punch.get("punch_type") == "in" else "in"
    
    punch_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "person_id": person_id,
        "person_name": enrollment.get("person_name"),
        "person_type": enrollment.get("person_type"),
        "device_id": device_id,
        "punch_type": punch_type,
        "date": today,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verification_method": enrollment.get("biometric_type", "fingerprint"),
        "confidence": round(random.uniform(0.95, 0.99), 2)
    }
    
    await db.biometric_punches.insert_one(punch_doc)
    punch_doc.pop('_id', None)
    
    # Update attendance record
    await update_attendance_from_biometric(db, school_id, person_id, enrollment, punch_type, today)
    
    return {
        "success": True,
        "message": f"Punch {punch_type.upper()} recorded for {enrollment.get('person_name')}",
        "punch": punch_doc
    }

async def update_attendance_from_biometric(db, school_id, person_id, enrollment, punch_type, date):
    """Update main attendance system from biometric punch"""
    
    person_type = enrollment.get("person_type")
    
    if person_type == "student":
        # Update student attendance
        await db.attendance.update_one(
            {
                "student_id": person_id,
                "school_id": school_id,
                "date": date
            },
            {
                "$set": {
                    "status": "present",
                    "biometric_verified": True,
                    "check_in_time": datetime.now(timezone.utc).isoformat() if punch_type == "in" else None,
                    "check_out_time": datetime.now(timezone.utc).isoformat() if punch_type == "out" else None,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
    else:
        # Update staff attendance
        await db.staff_attendance.update_one(
            {
                "staff_id": person_id,
                "school_id": school_id,
                "date": date
            },
            {
                "$set": {
                    "status": "present",
                    "biometric_verified": True,
                    "check_in_time": datetime.now(timezone.utc).isoformat() if punch_type == "in" else None,
                    "check_out_time": datetime.now(timezone.utc).isoformat() if punch_type == "out" else None,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )

@router.get("/punches/today")
async def get_today_punches(school_id: str, person_type: Optional[str] = None):
    """Get all biometric punches for today"""
    db = get_database()
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    query = {"school_id": school_id, "date": today}
    if person_type:
        query["person_type"] = person_type
    
    punches = await db.biometric_punches.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).to_list(length=500)
    
    return {
        "date": today,
        "total_punches": len(punches),
        "punch_in": len([p for p in punches if p.get("punch_type") == "in"]),
        "punch_out": len([p for p in punches if p.get("punch_type") == "out"]),
        "punches": punches
    }

@router.get("/attendance/live")
async def get_live_attendance(school_id: str):
    """Get live attendance status from biometric system"""
    db = get_database()
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Get today's punches grouped by person
    pipeline = [
        {"$match": {"school_id": school_id, "date": today}},
        {"$group": {
            "_id": "$person_id",
            "person_name": {"$first": "$person_name"},
            "person_type": {"$first": "$person_type"},
            "first_in": {"$min": {"$cond": [{"$eq": ["$punch_type", "in"]}, "$timestamp", None]}},
            "last_out": {"$max": {"$cond": [{"$eq": ["$punch_type", "out"]}, "$timestamp", None]}},
            "total_punches": {"$sum": 1}
        }}
    ]
    
    attendance = await db.biometric_punches.aggregate(pipeline).to_list(length=1000)
    
    # Calculate statistics
    students_present = len([a for a in attendance if a.get("person_type") == "student"])
    teachers_present = len([a for a in attendance if a.get("person_type") == "teacher"])
    staff_present = len([a for a in attendance if a.get("person_type") == "staff"])
    
    return {
        "date": today,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "students_present": students_present,
            "teachers_present": teachers_present,
            "staff_present": staff_present,
            "total_present": len(attendance)
        },
        "recent_punches": attendance[:20]
    }

@router.get("/analytics")
async def get_biometric_analytics(school_id: str, period: str = "week"):
    """Get biometric attendance analytics"""
    db = get_database()
    
    # Get device stats
    devices = await db.biometric_devices.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(length=50)
    
    # Get enrollment stats
    enrollments = await db.biometric_enrollments.count_documents({"school_id": school_id})
    student_enrollments = await db.biometric_enrollments.count_documents({
        "school_id": school_id, "person_type": "student"
    })
    staff_enrollments = await db.biometric_enrollments.count_documents({
        "school_id": school_id, "person_type": {"$in": ["teacher", "staff"]}
    })
    
    # Get last 7 days attendance trend
    daily_trend = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        count = await db.biometric_punches.count_documents({
            "school_id": school_id,
            "date": date,
            "punch_type": "in"
        })
        daily_trend.append({"date": date, "present": count})
    
    return {
        "devices": {
            "total": len(devices),
            "online": len([d for d in devices if d.get("status") != "offline"]),
            "offline": len([d for d in devices if d.get("status") == "offline"])
        },
        "enrollments": {
            "total": enrollments,
            "students": student_enrollments,
            "staff": staff_enrollments
        },
        "attendance_trend": daily_trend[::-1],
        "note": "Biometric hardware integration is SIMULATED. Connect real devices for production."
    }

@router.post("/sync")
async def sync_biometric_data(device_id: str, school_id: str):
    """Sync attendance data from biometric device"""
    db = get_database()
    
    # In real implementation, this would fetch data from the device
    # For now, we simulate the sync
    
    await db.biometric_devices.update_one(
        {"id": device_id, "school_id": school_id},
        {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": "Device synced successfully",
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "note": "Real device sync requires hardware integration"
    }

@router.delete("/devices/{device_id}")
async def remove_device(device_id: str, school_id: str):
    """Remove a biometric device"""
    db = get_database()
    
    result = await db.biometric_devices.delete_one({
        "id": device_id,
        "school_id": school_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"success": True, "message": "Device removed"}
