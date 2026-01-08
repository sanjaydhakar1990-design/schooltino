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
        "school_id": school_id
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
async def get_exams(school_id: str):
    """Get all exams for a school"""
    db = get_database()
    exams = await db.exams.find({"school_id": school_id}).sort("created_at", -1).to_list(50)
    
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
