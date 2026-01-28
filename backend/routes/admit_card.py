"""
ADMIT CARD SYSTEM
- Generate admit cards for any class/exam
- Fee verification before download
- Admin configurable minimum fee percentage
- Digital signature and seal support
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, date
import uuid
import os
import sys

sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[db_name]

def get_database():
    return db

router = APIRouter(prefix="/admit-card", tags=["Admit Card"])

# ============== MODELS ==============

class AdmitCardSettings(BaseModel):
    school_id: str
    min_fee_percentage: float = 30.0  # Minimum 30% fee required
    require_fee_clearance: bool = True
    show_photo: bool = True
    show_signature: bool = True
    show_seal: bool = True
    signature_authority: str = "director"  # director, principal, class_teacher
    seal_image_url: Optional[str] = None
    signature_image_url: Optional[str] = None

class ExamCreate(BaseModel):
    school_id: str
    exam_name: str  # "Half Yearly", "Annual", "Unit Test 1"
    exam_type: str  # half_yearly, annual, unit_test, quarterly
    start_date: str
    end_date: str
    classes: List[str]  # ["Class 10-A", "Class 10-B"]
    subjects: Optional[List[Dict]] = None  # [{subject, date, time}]
    instructions: Optional[List[str]] = None
    created_by: str

class AdmitCardRequest(BaseModel):
    school_id: str
    exam_id: str
    student_id: str
    
class BulkAdmitCardRequest(BaseModel):
    school_id: str
    exam_id: str
    class_id: str

class FeePaymentForAdmitCard(BaseModel):
    school_id: str
    student_id: str
    exam_id: str
    amount: float
    payment_method: str = "online"

# ============== HELPER FUNCTIONS ==============

async def get_student_fee_status(student_id: str, school_id: str, db) -> Dict:
    """Get student's fee status for admit card eligibility"""
    
    # Get total fees for student
    fee_records = await db.fee_records.find({
        "student_id": student_id,
        "school_id": school_id,
        "academic_year": str(date.today().year)
    }).to_list(100)
    
    total_fee = sum(f.get("amount", 0) for f in fee_records)
    paid_fee = sum(f.get("paid_amount", 0) for f in fee_records)
    pending_fee = total_fee - paid_fee
    
    paid_percentage = (paid_fee / total_fee * 100) if total_fee > 0 else 100
    
    return {
        "total_fee": total_fee,
        "paid_fee": paid_fee,
        "pending_fee": pending_fee,
        "paid_percentage": round(paid_percentage, 1)
    }

async def check_admit_card_eligibility(student_id: str, school_id: str, exam_id: str, db) -> Dict:
    """Check if student is eligible for admit card download"""
    
    # Get admit card settings
    settings = await db.admit_card_settings.find_one({"school_id": school_id})
    min_fee_percentage = settings.get("min_fee_percentage", 30) if settings else 30
    require_fee = settings.get("require_fee_clearance", True) if settings else True
    
    if not require_fee:
        return {"eligible": True, "reason": "Fee clearance not required", "min_amount": 0}
    
    # Get fee status
    fee_status = await get_student_fee_status(student_id, school_id, db)
    
    if fee_status["paid_percentage"] >= min_fee_percentage:
        return {
            "eligible": True,
            "reason": f"Fee clearance OK ({fee_status['paid_percentage']}% paid)",
            "fee_status": fee_status,
            "min_amount": 0
        }
    else:
        # Calculate minimum amount needed
        total_fee = fee_status["total_fee"]
        required_amount = (total_fee * min_fee_percentage / 100) - fee_status["paid_fee"]
        required_amount = max(0, required_amount)
        
        return {
            "eligible": False,
            "reason": f"Minimum {min_fee_percentage}% fee required. Currently {fee_status['paid_percentage']}% paid.",
            "fee_status": fee_status,
            "min_amount": round(required_amount, 2),
            "min_percentage": min_fee_percentage
        }

async def generate_admit_card_data(student_id: str, exam_id: str, school_id: str, db) -> Dict:
    """Generate admit card data for a student"""
    
    # Get student info
    student = await db.students.find_one({"id": student_id, "school_id": school_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get exam info
    exam = await db.exams.find_one({"id": exam_id, "school_id": school_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get school info
    school = await db.schools.find_one({"id": school_id})
    
    # Get class info
    class_info = await db.classes.find_one({"id": student.get("class_id")})
    
    # Get admit card settings
    settings = await db.admit_card_settings.find_one({"school_id": school_id})
    
    # Generate roll number if not exists
    roll_no = student.get("roll_no") or student.get("admission_no") or student_id[:8].upper()
    
    admit_card = {
        "id": str(uuid.uuid4()),
        "admit_card_no": f"AC-{exam_id[:4].upper()}-{student_id[:6].upper()}",
        "school": {
            "name": school.get("name", "School") if school else "School",
            "address": school.get("address", "") if school else "",
            "logo_url": school.get("logo_url") if school else None,
            "phone": school.get("phone", "") if school else ""
        },
        "student": {
            "id": student_id,
            "name": student.get("name", ""),
            "father_name": student.get("father_name", ""),
            "mother_name": student.get("mother_name", ""),
            "roll_no": roll_no,
            "class": class_info.get("name", student.get("class_id")) if class_info else student.get("class_id"),
            "section": student.get("section", ""),
            "photo_url": student.get("photo_url"),
            "dob": student.get("dob", "")
        },
        "exam": {
            "id": exam_id,
            "name": exam.get("exam_name", ""),
            "type": exam.get("exam_type", ""),
            "start_date": exam.get("start_date", ""),
            "end_date": exam.get("end_date", ""),
            "subjects": exam.get("subjects", []),
            "instructions": exam.get("instructions", [
                "विद्यार्थी को परीक्षा से 15 मिनट पहले उपस्थित होना अनिवार्य है।",
                "प्रवेश पत्र के बिना परीक्षा में बैठने की अनुमति नहीं होगी।",
                "परीक्षा कक्ष में मोबाइल फोन ले जाना वर्जित है।",
                "अपना लेखन सामग्री स्वयं लाएं।"
            ])
        },
        "signature": {
            "authority": settings.get("signature_authority", "director") if settings else "director",
            "image_url": settings.get("signature_image_url") if settings else None
        },
        "seal": {
            "image_url": settings.get("seal_image_url") if settings else None
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "valid_until": exam.get("end_date", ""),
        "school_id": school_id,
        "qr_data": {
            "type": "admit_card",
            "admit_card_no": f"AC-{exam_id[:4].upper()}-{student_id[:6].upper()}",
            "student_id": student_id,
            "exam_id": exam_id,
            "school_id": school_id,
            "student_name": student.get("name", ""),
            "roll_no": roll_no,
            "exam_name": exam.get("exam_name", ""),
            "valid_until": exam.get("end_date", ""),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    return admit_card

# ============== API ENDPOINTS ==============

@router.get("/settings/{school_id}")
async def get_admit_card_settings(school_id: str):
    """Get admit card settings for school"""
    db = get_database()
    settings = await db.admit_card_settings.find_one({"school_id": school_id})
    
    if not settings:
        # Return defaults
        return {
            "school_id": school_id,
            "min_fee_percentage": 30,
            "require_fee_clearance": True,
            "show_photo": True,
            "show_signature": True,
            "show_seal": True,
            "signature_authority": "director"
        }
    
    settings.pop("_id", None)
    return settings

@router.post("/settings")
async def save_admit_card_settings(settings: AdmitCardSettings):
    """Save admit card settings for school"""
    db = get_database()
    
    settings_dict = settings.dict()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admit_card_settings.update_one(
        {"school_id": settings.school_id},
        {"$set": settings_dict},
        upsert=True
    )
    
    return {"success": True, "message": "Settings saved successfully"}

@router.post("/exam")
async def create_exam(exam: ExamCreate):
    """Create a new exam for admit card generation"""
    db = get_database()
    
    exam_doc = {
        "id": str(uuid.uuid4()),
        **exam.dict(),
        "status": "upcoming",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.exams.insert_one(exam_doc)
    
    return {
        "success": True,
        "exam_id": exam_doc["id"],
        "message": f"Exam '{exam.exam_name}' created successfully"
    }

@router.get("/exams/{school_id}")
async def get_exams(school_id: str, type: str = None):
    """Get all exams for a school (filter by type: school or board)"""
    db = get_database()
    
    query = {"school_id": school_id}
    if type:
        query["exam_category"] = type
    
    exams = await db.exams.find(query).sort("created_at", -1).to_list(50)
    
    for exam in exams:
        exam.pop("_id", None)
    
    return {"exams": exams}

@router.get("/check-eligibility/{school_id}/{exam_id}/{student_id}")
async def check_eligibility(school_id: str, exam_id: str, student_id: str):
    """Check if student is eligible for admit card download"""
    db = get_database()
    
    eligibility = await check_admit_card_eligibility(student_id, school_id, exam_id, db)
    return eligibility

@router.get("/generate/{school_id}/{exam_id}/{student_id}")
async def generate_admit_card(school_id: str, exam_id: str, student_id: str, force: bool = False):
    """Generate admit card for a student (checks fee eligibility)"""
    db = get_database()
    
    # Check eligibility unless forced (for admin)
    if not force:
        eligibility = await check_admit_card_eligibility(student_id, school_id, exam_id, db)
        if not eligibility["eligible"]:
            return {
                "success": False,
                "eligible": False,
                "message": eligibility["reason"],
                "fee_status": eligibility.get("fee_status"),
                "min_amount": eligibility.get("min_amount", 0),
                "action_required": "pay_fee"
            }
    
    # Generate admit card
    admit_card = await generate_admit_card_data(student_id, exam_id, school_id, db)
    
    # Save generated admit card
    await db.generated_admit_cards.update_one(
        {"student_id": student_id, "exam_id": exam_id},
        {"$set": admit_card},
        upsert=True
    )
    
    return {
        "success": True,
        "eligible": True,
        "admit_card": admit_card
    }

@router.post("/generate-bulk")
async def generate_bulk_admit_cards(request: BulkAdmitCardRequest):
    """Generate admit cards for entire class"""
    db = get_database()
    
    # Get all students in class
    students = await db.students.find({
        "school_id": request.school_id,
        "class_id": request.class_id,
        "is_active": True
    }).to_list(200)
    
    generated = []
    pending_fee = []
    
    for student in students:
        eligibility = await check_admit_card_eligibility(
            student["id"], request.school_id, request.exam_id, db
        )
        
        if eligibility["eligible"]:
            admit_card = await generate_admit_card_data(
                student["id"], request.exam_id, request.school_id, db
            )
            await db.generated_admit_cards.update_one(
                {"student_id": student["id"], "exam_id": request.exam_id},
                {"$set": admit_card},
                upsert=True
            )
            generated.append({
                "student_id": student["id"],
                "name": student.get("name"),
                "status": "generated"
            })
        else:
            pending_fee.append({
                "student_id": student["id"],
                "name": student.get("name"),
                "pending_amount": eligibility.get("min_amount", 0),
                "fee_status": eligibility.get("fee_status")
            })
    
    return {
        "success": True,
        "total_students": len(students),
        "generated_count": len(generated),
        "pending_fee_count": len(pending_fee),
        "generated": generated,
        "pending_fee": pending_fee
    }

@router.post("/pay-and-download")
async def pay_fee_and_download(payment: FeePaymentForAdmitCard):
    """Pay minimum fee and download admit card"""
    db = get_database()
    
    # Record payment
    payment_record = {
        "id": str(uuid.uuid4()),
        "school_id": payment.school_id,
        "student_id": payment.student_id,
        "amount": payment.amount,
        "payment_type": "admit_card_fee",
        "exam_id": payment.exam_id,
        "payment_method": payment.payment_method,
        "status": "completed",
        "paid_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.fee_payments.insert_one(payment_record)
    
    # Update fee record
    await db.fee_records.update_one(
        {"student_id": payment.student_id, "school_id": payment.school_id},
        {"$inc": {"paid_amount": payment.amount}},
        upsert=True
    )
    
    # Now generate admit card
    admit_card = await generate_admit_card_data(
        payment.student_id, payment.exam_id, payment.school_id, db
    )
    
    await db.generated_admit_cards.update_one(
        {"student_id": payment.student_id, "exam_id": payment.exam_id},
        {"$set": admit_card},
        upsert=True
    )
    
    return {
        "success": True,
        "payment_id": payment_record["id"],
        "admit_card": admit_card,
        "message": "Payment successful! Admit card generated."
    }

@router.get("/student/{school_id}/{student_id}")
async def get_student_admit_cards(school_id: str, student_id: str):
    """Get all admit cards for a student (for StudyTino app)"""
    db = get_database()
    
    # Get all exams for the school
    exams = await db.exams.find({
        "school_id": school_id,
        "status": {"$in": ["upcoming", "ongoing"]}
    }).to_list(20)
    
    admit_cards = []
    
    for exam in exams:
        # Check if admit card already generated
        generated = await db.generated_admit_cards.find_one({
            "student_id": student_id,
            "exam_id": exam["id"]
        })
        
        # Check eligibility
        eligibility = await check_admit_card_eligibility(student_id, school_id, exam["id"], db)
        
        admit_cards.append({
            "exam_id": exam["id"],
            "exam_name": exam.get("exam_name"),
            "exam_type": exam.get("exam_type"),
            "start_date": exam.get("start_date"),
            "end_date": exam.get("end_date"),
            "is_generated": generated is not None,
            "is_eligible": eligibility["eligible"],
            "fee_status": eligibility.get("fee_status"),
            "min_amount_required": eligibility.get("min_amount", 0) if not eligibility["eligible"] else 0,
            "admit_card": generated if generated else None
        })
    
    return {"admit_cards": admit_cards}

# ============== AI INTEGRATION ==============

async def ai_generate_admit_cards(query: str, school_id: str, db) -> Dict:
    """AI command to generate admit cards"""
    import re
    
    query_lower = query.lower()
    
    # Detect class from query
    class_match = re.search(r"class\s*(\d+)[- ]?([a-zA-Z])?", query_lower)
    class_name = None
    if class_match:
        class_num = class_match.group(1)
        section = class_match.group(2) or ""
        class_name = f"Class {class_num}"
        if section:
            class_name += f"-{section.upper()}"
    
    # Detect exam type
    exam_type = "general"
    if any(k in query_lower for k in ["half yearly", "halfyearly", "अर्धवार्षिक"]):
        exam_type = "half_yearly"
    elif any(k in query_lower for k in ["annual", "final", "वार्षिक"]):
        exam_type = "annual"
    elif any(k in query_lower for k in ["unit test", "unit"]):
        exam_type = "unit_test"
    elif any(k in query_lower for k in ["quarterly", "त्रैमासिक"]):
        exam_type = "quarterly"
    
    # Find matching exam
    exam = await db.exams.find_one({
        "school_id": school_id,
        "exam_type": exam_type,
        "status": {"$in": ["upcoming", "ongoing"]}
    })
    
    if not exam:
        return {
            "success": False,
            "message": f"कोई {exam_type} exam नहीं मिला। पहले exam create करें।"
        }
    
    # Find class
    if class_name:
        class_info = await db.classes.find_one({
            "school_id": school_id,
            "name": {"$regex": class_name, "$options": "i"}
        })
        
        if class_info:
            # Generate for entire class
            students = await db.students.find({
                "school_id": school_id,
                "class_id": class_info["id"],
                "is_active": True
            }).to_list(200)
            
            generated = 0
            pending = 0
            
            for student in students:
                eligibility = await check_admit_card_eligibility(
                    student["id"], school_id, exam["id"], db
                )
                if eligibility["eligible"]:
                    admit_card = await generate_admit_card_data(
                        student["id"], exam["id"], school_id, db
                    )
                    await db.generated_admit_cards.update_one(
                        {"student_id": student["id"], "exam_id": exam["id"]},
                        {"$set": admit_card},
                        upsert=True
                    )
                    generated += 1
                else:
                    pending += 1
            
            return {
                "success": True,
                "message": f"✅ {class_name} के {generated} students के admit cards generate हो गए!\n⚠️ {pending} students की fee pending है।",
                "generated": generated,
                "pending_fee": pending
            }
    
    return {
        "success": False,
        "message": "Class specify करें। Example: 'Class 10 ke admit card banao'"
    }


# ============== QR CODE VERIFICATION ==============

class QRVerificationRequest(BaseModel):
    qr_data: str  # JSON string from QR code
    
class StudentVerificationResponse(BaseModel):
    verified: bool
    student_name: str = ""
    roll_no: str = ""
    class_name: str = ""
    exam_name: str = ""
    fee_status: str = ""
    entry_allowed: bool = False
    message: str = ""
    photo_url: str = None

@router.post("/verify-qr")
async def verify_admit_card_qr(qr_data: dict):
    """
    Verify admit card QR code at exam hall entrance
    AI will use this to verify student entry
    Returns: Student details, fee status, entry permission
    """
    db = get_database()
    
    try:
        student_id = qr_data.get("student_id")
        exam_id = qr_data.get("exam_id")
        school_id = qr_data.get("school_id")
        admit_card_no = qr_data.get("admit_card_no")
        
        if not all([student_id, exam_id, school_id]):
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Invalid QR code data"
            }
        
        # Get student info
        student = await db.students.find_one({"id": student_id, "school_id": school_id})
        if not student:
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Student not found"
            }
        
        # Get exam info
        exam = await db.exams.find_one({"id": exam_id, "school_id": school_id})
        if not exam:
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Exam not found"
            }
        
        # Check if admit card was actually generated
        generated = await db.generated_admit_cards.find_one({
            "student_id": student_id,
            "exam_id": exam_id
        })
        
        if not generated:
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Admit card not generated - Student may not have paid fees",
                "student_name": student.get("name", ""),
                "roll_no": student.get("roll_no", "")
            }
        
        # Get fee status
        fee_status = await get_student_fee_status(student_id, school_id, db)
        
        # Get class info
        class_info = await db.classes.find_one({"id": student.get("class_id")})
        class_name = class_info.get("name", "") if class_info else student.get("class_id", "")
        
        # Log entry attempt
        entry_log = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "exam_id": exam_id,
            "school_id": school_id,
            "admit_card_no": admit_card_no,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "entry_allowed": True,
            "fee_percentage": fee_status["paid_percentage"]
        }
        await db.exam_entry_logs.insert_one(entry_log)
        
        return {
            "verified": True,
            "entry_allowed": True,
            "student_name": student.get("name", ""),
            "father_name": student.get("father_name", ""),
            "roll_no": student.get("roll_no", generated.get("admit_card_no", "")),
            "class_name": class_name,
            "section": student.get("section", ""),
            "exam_name": exam.get("exam_name", ""),
            "fee_status": f"{fee_status['paid_percentage']}% paid",
            "fee_paid": fee_status["paid_fee"],
            "fee_pending": fee_status["pending_fee"],
            "photo_url": student.get("photo_url"),
            "message": f"✅ Entry Allowed - {student.get('name', '')} ({class_name})",
            "ai_announcement": f"Welcome {student.get('name', '')} from {class_name}. Your seat is ready."
        }
        
    except Exception as e:
        return {
            "verified": False,
            "entry_allowed": False,
            "message": f"Verification error: {str(e)}"
        }


@router.post("/admin-override-entry")
async def admin_override_entry(
    student_id: str,
    exam_id: str,
    school_id: str,
    admin_id: str,
    reason: str = "Admin approved"
):
    """
    Admin can override fee requirement and allow student entry
    """
    db = get_database()
    
    # Log override
    override_log = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "exam_id": exam_id,
        "school_id": school_id,
        "admin_id": admin_id,
        "reason": reason,
        "action": "entry_override",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_overrides.insert_one(override_log)
    
    # Generate admit card forcefully
    admit_card = await generate_admit_card_data(student_id, exam_id, school_id, db)
    admit_card["admin_override"] = True
    admit_card["override_reason"] = reason
    
    await db.generated_admit_cards.update_one(
        {"student_id": student_id, "exam_id": exam_id},
        {"$set": admit_card},
        upsert=True
    )
    
    student = await db.students.find_one({"id": student_id})
    
    return {
        "success": True,
        "message": f"✅ Admin override applied. {student.get('name', '')} can now enter.",
        "admit_card": admit_card
    }


@router.get("/entry-logs/{school_id}/{exam_id}")
async def get_exam_entry_logs(school_id: str, exam_id: str):
    """Get all entry logs for an exam - AI will use this to track who entered"""
    db = get_database()
    
    logs = await db.exam_entry_logs.find({
        "school_id": school_id,
        "exam_id": exam_id
    }).sort("verified_at", -1).to_list(500)
    
    for log in logs:
        log.pop("_id", None)
        # Get student name
        student = await db.students.find_one({"id": log["student_id"]})
        log["student_name"] = student.get("name", "") if student else ""
    
    return {
        "total_entries": len(logs),
        "logs": logs
    }


@router.get("/download-status/{school_id}/{exam_id}")
async def get_download_status(school_id: str, exam_id: str):
    """Track which students have downloaded admit cards"""
    db = get_database()
    
    # Get all generated admit cards for this exam
    generated = await db.generated_admit_cards.find({
        "school_id": school_id,
        "exam_id": exam_id
    }).to_list(500)
    
    downloaded_students = []
    for ac in generated:
        student = await db.students.find_one({"id": ac["student_id"]})
        if student:
            downloaded_students.append({
                "student_id": ac["student_id"],
                "student_name": student.get("name", ""),
                "class": ac.get("student", {}).get("class", ""),
                "roll_no": ac.get("student", {}).get("roll_no", ""),
                "generated_at": ac.get("generated_at", "")
            })
    
    return {
        "exam_id": exam_id,
        "total_downloaded": len(downloaded_students),
        "students": downloaded_students
    }


# ============== NEW APIs FOR IMPROVED SYSTEM ==============

@router.post("/board-exam")
async def create_board_exam(exam_data: dict):
    """Create board exam entry"""
    db = get_database()
    
    exam_doc = {
        "id": str(uuid.uuid4()),
        **exam_data,
        "exam_category": "board",
        "status": "upcoming",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.exams.insert_one(exam_doc)
    
    return {
        "success": True,
        "exam_id": exam_doc["id"],
        "message": f"Board Exam '{exam_data.get('exam_name')}' created successfully"
    }

@router.post("/upload-board-admit-card")
async def upload_board_admit_card(file: dict):
    """Upload board admit card template"""
    # Placeholder for file upload functionality
    # In production, this would handle actual file upload to storage
    
    return {
        "success": True,
        "file_url": f"/uploads/board_admit_cards/{str(uuid.uuid4())}.pdf",
        "message": "File uploaded successfully"
    }

@router.get("/preview/{school_id}/{exam_id}/{student_id}")
async def preview_admit_card(school_id: str, exam_id: str, student_id: str):
    """Generate preview of admit card"""
    db = get_database()
    
    admit_card = await generate_admit_card_data(student_id, exam_id, school_id, db)
    
    return {
        "success": True,
        "preview": admit_card,
        "message": "Preview generated"
    }

@router.post("/publish-studytino")
async def publish_to_studytino(request: dict):
    """Publish admit cards to StudyTino for student download"""
    db = get_database()
    
    school_id = request.get("school_id")
    exam_id = request.get("exam_id")
    
    # Mark exam as published to StudyTino
    await db.exams.update_one(
        {"id": exam_id, "school_id": school_id},
        {"$set": {
            "published_to_studytino": True,
            "studytino_published_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Get all admit cards for this exam
    admit_cards = await db.generated_admit_cards.find({
        "school_id": school_id,
        "exam_id": exam_id
    }).to_list(1000)
    
    return {
        "success": True,
        "published": True,
        "admit_cards_count": len(admit_cards),
        "message": f"{len(admit_cards)} admit cards published to StudyTino"
    }

@router.get("/subjects")
async def get_subjects(school_id: str):
    """Get subjects list for school"""
    db = get_database()
    
    # Get unique subjects from classes
    subjects = [
        {"id": "mathematics", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "hindi", "name": "Hindi (हिन्दी)"},
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "social_science", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "sanskrit", "name": "Sanskrit (संस्कृत)"},
        {"id": "computer", "name": "Computer Science (कंप्यूटर)"},
        {"id": "physics", "name": "Physics (भौतिकी)"},
        {"id": "chemistry", "name": "Chemistry (रसायन)"},
        {"id": "biology", "name": "Biology (जीव विज्ञान)"}
    ]
    
    return subjects

