"""
Student Health Module
- Health records management
- Immunization tracking
- Medical history
- Health checkup scheduling
- Emergency contacts
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, date
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

router = APIRouter(prefix="/health", tags=["Health Module"])

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

# Models
class HealthRecord(BaseModel):
    student_id: str
    blood_group: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    vision_left: Optional[str] = None
    vision_right: Optional[str] = None
    hearing: Optional[str] = None  # normal, mild_loss, moderate_loss
    dental_health: Optional[str] = None
    allergies: Optional[List[str]] = []
    chronic_conditions: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []
    special_needs: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = []
    notes: Optional[str] = None

class ImmunizationRecord(BaseModel):
    student_id: str
    vaccine_name: str
    dose_number: int = 1
    date_given: str
    administered_by: Optional[str] = None
    batch_number: Optional[str] = None
    next_due_date: Optional[str] = None
    notes: Optional[str] = None

class MedicalIncident(BaseModel):
    student_id: str
    incident_type: str  # injury, illness, allergic_reaction, fever, other
    description: str
    severity: str = "low"  # low, medium, high, emergency
    treatment_given: Optional[str] = None
    sent_home: bool = False
    parent_notified: bool = False
    follow_up_required: bool = False

class HealthCheckup(BaseModel):
    title: str
    checkup_type: str  # general, dental, eye, ear, annual
    scheduled_date: str
    class_ids: Optional[List[str]] = []  # Empty means all classes
    doctor_name: Optional[str] = None
    notes: Optional[str] = None

# API Endpoints

@router.post("/records")
async def create_health_record(record: HealthRecord, school_id: str):
    """Create or update student health record"""
    db = get_database()
    
    # Check if student exists
    student = await db.students.find_one({
        "student_id": record.student_id,
        "school_id": school_id
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    record_doc = {
        "student_id": record.student_id,
        "school_id": school_id,
        "student_name": student.get("name"),
        "class_name": student.get("class_name"),
        "blood_group": record.blood_group,
        "height_cm": record.height_cm,
        "weight_kg": record.weight_kg,
        "bmi": round(record.weight_kg / ((record.height_cm / 100) ** 2), 1) if record.height_cm and record.weight_kg else None,
        "vision_left": record.vision_left,
        "vision_right": record.vision_right,
        "hearing": record.hearing,
        "dental_health": record.dental_health,
        "allergies": record.allergies,
        "chronic_conditions": record.chronic_conditions,
        "current_medications": record.current_medications,
        "special_needs": record.special_needs,
        "dietary_restrictions": record.dietary_restrictions,
        "notes": record.notes,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - create or update
    await db.health_records.update_one(
        {"student_id": record.student_id, "school_id": school_id},
        {"$set": record_doc},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Health record saved",
        "record": record_doc
    }

@router.get("/records/{student_id}")
async def get_health_record(student_id: str, school_id: str):
    """Get student health record"""
    db = get_database()
    
    record = await db.health_records.find_one(
        {"student_id": student_id, "school_id": school_id},
        {"_id": 0}
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")
    
    # Get immunization history
    immunizations = await db.immunizations.find(
        {"student_id": student_id, "school_id": school_id},
        {"_id": 0}
    ).sort("date_given", -1).to_list(length=50)
    
    # Get recent incidents
    incidents = await db.medical_incidents.find(
        {"student_id": student_id, "school_id": school_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=10)
    
    return {
        "health_record": record,
        "immunizations": immunizations,
        "recent_incidents": incidents
    }

@router.post("/immunizations")
async def add_immunization(record: ImmunizationRecord, school_id: str):
    """Add immunization record"""
    db = get_database()
    
    student = await db.students.find_one({
        "student_id": record.student_id,
        "school_id": school_id
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    imm_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "student_id": record.student_id,
        "student_name": student.get("name"),
        "vaccine_name": record.vaccine_name,
        "dose_number": record.dose_number,
        "date_given": record.date_given,
        "administered_by": record.administered_by,
        "batch_number": record.batch_number,
        "next_due_date": record.next_due_date,
        "notes": record.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.immunizations.insert_one(imm_doc)
    imm_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Immunization record added for {record.vaccine_name}",
        "record": imm_doc
    }

@router.get("/immunizations/due")
async def get_due_immunizations(school_id: str, days_ahead: int = 30):
    """Get students with upcoming immunizations"""
    db = get_database()
    
    from datetime import timedelta
    future_date = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
    today = datetime.now().strftime('%Y-%m-%d')
    
    due_immunizations = await db.immunizations.find({
        "school_id": school_id,
        "next_due_date": {"$gte": today, "$lte": future_date}
    }, {"_id": 0}).sort("next_due_date", 1).to_list(length=100)
    
    return {
        "due_count": len(due_immunizations),
        "period": f"Next {days_ahead} days",
        "due_immunizations": due_immunizations
    }

@router.post("/incidents")
async def report_medical_incident(incident: MedicalIncident, school_id: str, reported_by: str):
    """Report medical incident"""
    db = get_database()
    
    student = await db.students.find_one({
        "student_id": incident.student_id,
        "school_id": school_id
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    incident_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "student_id": incident.student_id,
        "student_name": student.get("name"),
        "class_name": student.get("class_name"),
        "incident_type": incident.incident_type,
        "description": incident.description,
        "severity": incident.severity,
        "treatment_given": incident.treatment_given,
        "sent_home": incident.sent_home,
        "parent_notified": incident.parent_notified,
        "follow_up_required": incident.follow_up_required,
        "reported_by": reported_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.medical_incidents.insert_one(incident_doc)
    incident_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": "Medical incident reported",
        "incident": incident_doc
    }

@router.get("/incidents/today")
async def get_todays_incidents(school_id: str):
    """Get all medical incidents for today"""
    db = get_database()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    incidents = await db.medical_incidents.find({
        "school_id": school_id,
        "created_at": {"$regex": f"^{today}"}
    }, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    
    by_severity = {
        "emergency": len([i for i in incidents if i.get("severity") == "emergency"]),
        "high": len([i for i in incidents if i.get("severity") == "high"]),
        "medium": len([i for i in incidents if i.get("severity") == "medium"]),
        "low": len([i for i in incidents if i.get("severity") == "low"])
    }
    
    return {
        "date": today,
        "total": len(incidents),
        "by_severity": by_severity,
        "incidents": incidents
    }

@router.post("/checkups")
async def schedule_health_checkup(checkup: HealthCheckup, school_id: str):
    """Schedule a health checkup"""
    db = get_database()
    
    checkup_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "title": checkup.title,
        "checkup_type": checkup.checkup_type,
        "scheduled_date": checkup.scheduled_date,
        "class_ids": checkup.class_ids,
        "doctor_name": checkup.doctor_name,
        "notes": checkup.notes,
        "status": "scheduled",
        "students_checked": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.health_checkups.insert_one(checkup_doc)
    checkup_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": "Health checkup scheduled",
        "checkup": checkup_doc
    }

@router.get("/checkups")
async def get_scheduled_checkups(school_id: str):
    """Get all scheduled checkups"""
    db = get_database()
    
    checkups = await db.health_checkups.find(
        {"school_id": school_id},
        {"_id": 0}
    ).sort("scheduled_date", 1).to_list(length=50)
    
    return {
        "total": len(checkups),
        "checkups": checkups
    }

@router.get("/analytics")
async def get_health_analytics(school_id: str):
    """Get health module analytics"""
    db = get_database()
    
    # Blood group distribution
    blood_group_pipeline = [
        {"$match": {"school_id": school_id, "blood_group": {"$ne": None}}},
        {"$group": {"_id": "$blood_group", "count": {"$sum": 1}}}
    ]
    blood_groups = await db.health_records.aggregate(blood_group_pipeline).to_list(length=10)
    
    # BMI distribution
    bmi_pipeline = [
        {"$match": {"school_id": school_id, "bmi": {"$ne": None}}},
        {"$bucket": {
            "groupBy": "$bmi",
            "boundaries": [0, 18.5, 25, 30, 40],
            "default": "obese",
            "output": {"count": {"$sum": 1}}
        }}
    ]
    
    # Allergy count
    allergy_count = await db.health_records.count_documents({
        "school_id": school_id,
        "allergies": {"$ne": []}
    })
    
    # Incident stats this month
    this_month = datetime.now().strftime('%Y-%m')
    incident_count = await db.medical_incidents.count_documents({
        "school_id": school_id,
        "created_at": {"$regex": f"^{this_month}"}
    })
    
    # Students with health records
    total_records = await db.health_records.count_documents({"school_id": school_id})
    
    return {
        "total_health_records": total_records,
        "blood_group_distribution": {bg["_id"]: bg["count"] for bg in blood_groups},
        "students_with_allergies": allergy_count,
        "incidents_this_month": incident_count,
        "upcoming_checkups": await db.health_checkups.count_documents({
            "school_id": school_id,
            "status": "scheduled"
        })
    }
