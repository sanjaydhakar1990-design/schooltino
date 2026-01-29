# ./routes/fee_management.py
"""
Comprehensive Fee Management System
- Class-wise Fee Structure Management
- Student Services (Bus, Hostel, etc.)
- Government Schemes (RTE, Scholarship)
- Auto-update on payment
- Student-wise fee calculation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
import os
import sys
import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

router = APIRouter(prefix="/fee-management", tags=["Fee Management"])


# ==================== MODELS ====================

class FeeStructureCreate(BaseModel):
    school_id: str
    class_id: str
    fee_type: str  # tuition, exam, transport, hostel, uniform, books, sports, lab, library, etc.
    amount: float
    frequency: str = "monthly"  # monthly, quarterly, yearly, one_time
    due_day: int = 10  # Day of month when fee is due
    description: Optional[str] = None
    is_optional: bool = False  # True for optional services like bus, hostel

class StudentServiceUpdate(BaseModel):
    student_id: str
    school_id: str
    services: List[str]  # List of services: ["transport", "hostel", "sports", "lab"]
    transport_route: Optional[str] = None
    hostel_type: Optional[str] = None  # single, shared, dormitory

class GovernmentSchemeAssign(BaseModel):
    student_id: str
    school_id: str
    scheme_name: str  # RTE, SC_ST_Scholarship, OBC_Scholarship, Merit_Scholarship, BPL, etc.
    scheme_type: str  # full_exemption, partial_exemption, reimbursement
    exemption_percentage: float = 100  # % fee exemption
    monthly_stipend: float = 0  # If any monthly stipend
    valid_from: str
    valid_until: str
    documents: Optional[List[str]] = None  # Document IDs
    remarks: Optional[str] = None


# ==================== FEE STRUCTURE MANAGEMENT ====================

@router.post("/structure/create")
async def create_fee_structure(fee: FeeStructureCreate):
    """
    Create/Update fee structure for a class
    Accountant uses this to set class-wise fees
    """
    fee_record = {
        "id": str(uuid.uuid4()),
        "school_id": fee.school_id,
        "class_id": fee.class_id,
        "fee_type": fee.fee_type,
        "amount": fee.amount,
        "frequency": fee.frequency,
        "due_day": fee.due_day,
        "description": fee.description or f"{fee.fee_type.title()} Fee",
        "is_optional": fee.is_optional,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if same fee type exists for this class - update it
    existing = await db.fee_structures.find_one({
        "school_id": fee.school_id,
        "class_id": fee.class_id,
        "fee_type": fee.fee_type
    })
    
    if existing:
        await db.fee_structures.update_one(
            {"id": existing["id"]},
            {"$set": {
                "amount": fee.amount,
                "frequency": fee.frequency,
                "due_day": fee.due_day,
                "description": fee.description or existing.get("description"),
                "is_optional": fee.is_optional,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"success": True, "message": f"{fee.fee_type} fee updated for {fee.class_id}", "id": existing["id"]}
    else:
        await db.fee_structures.insert_one(fee_record)
        return {"success": True, "message": f"{fee.fee_type} fee created for {fee.class_id}", "id": fee_record["id"]}


@router.post("/structure/bulk-create")
async def bulk_create_fee_structure(school_id: str, class_id: str, fees: List[dict]):
    """
    Create multiple fee types for a class at once
    """
    created = 0
    for fee in fees:
        fee_record = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "class_id": class_id,
            "fee_type": fee.get("fee_type"),
            "amount": fee.get("amount", 0),
            "frequency": fee.get("frequency", "monthly"),
            "due_day": fee.get("due_day", 10),
            "description": fee.get("description", ""),
            "is_optional": fee.get("is_optional", False),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.fee_structures.update_one(
            {"school_id": school_id, "class_id": class_id, "fee_type": fee.get("fee_type")},
            {"$set": fee_record},
            upsert=True
        )
        created += 1
    
    return {"success": True, "message": f"{created} fee structures created/updated for {class_id}"}


@router.get("/structure/all/{school_id}")
async def get_all_fee_structures(school_id: str):
    """
    Get fee structure for all classes in a school
    For Accountant dashboard
    """
    structures = await db.fee_structures.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0}
    ).to_list(500)
    
    # Group by class
    by_class = {}
    for s in structures:
        class_id = s.get("class_id", "unknown")
        if class_id not in by_class:
            by_class[class_id] = []
        by_class[class_id].append(s)
    
    return {
        "school_id": school_id,
        "total_fee_types": len(structures),
        "classes": list(by_class.keys()),
        "structures_by_class": by_class
    }


@router.delete("/structure/{fee_id}")
async def delete_fee_structure(fee_id: str):
    """
    Deactivate a fee structure (soft delete)
    """
    result = await db.fee_structures.update_one(
        {"id": fee_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "Fee structure removed"}


# ==================== STUDENT SERVICES ====================

@router.post("/student/services")
async def update_student_services(data: StudentServiceUpdate):
    """
    Update services a student is using (Bus, Hostel, etc.)
    This affects their total fee
    """
    # Update student record with services
    update_data = {
        "services": data.services,
        "uses_transport": "transport" in data.services,
        "uses_hostel": "hostel" in data.services,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if data.transport_route:
        update_data["transport_route"] = data.transport_route
    if data.hostel_type:
        update_data["hostel_type"] = data.hostel_type
    
    # Update student
    result = await db.students.update_one(
        {"id": data.student_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        # Try with student_id field
        await db.students.update_one(
            {"student_id": data.student_id},
            {"$set": update_data}
        )
    
    return {
        "success": True,
        "message": f"Services updated for student",
        "services": data.services
    }


@router.get("/student/services/{student_id}")
async def get_student_services(student_id: str):
    """
    Get services a student is enrolled in
    """
    student = await db.students.find_one(
        {"$or": [{"id": student_id}, {"student_id": student_id}]},
        {"_id": 0, "services": 1, "uses_transport": 1, "uses_hostel": 1, 
         "transport_route": 1, "hostel_type": 1, "name": 1, "class_id": 1}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "student_id": student_id,
        "student_name": student.get("name"),
        "class_id": student.get("class_id"),
        "services": student.get("services", []),
        "uses_transport": student.get("uses_transport", False),
        "uses_hostel": student.get("uses_hostel", False),
        "transport_route": student.get("transport_route"),
        "hostel_type": student.get("hostel_type")
    }


# ==================== GOVERNMENT SCHEMES ====================

@router.post("/scheme/assign")
async def assign_government_scheme(data: GovernmentSchemeAssign):
    """
    Assign a government scheme to a student
    RTE, Scholarship, etc.
    """
    scheme_record = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id,
        "school_id": data.school_id,
        "scheme_name": data.scheme_name,
        "scheme_type": data.scheme_type,
        "exemption_percentage": data.exemption_percentage,
        "monthly_stipend": data.monthly_stipend,
        "valid_from": data.valid_from,
        "valid_until": data.valid_until,
        "documents": data.documents or [],
        "remarks": data.remarks,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.student_schemes.insert_one(scheme_record)
    
    # Update student profile with scheme info
    await db.students.update_one(
        {"$or": [{"id": data.student_id}, {"student_id": data.student_id}]},
        {"$set": {
            "has_scheme": True,
            "scheme_name": data.scheme_name,
            "scheme_type": data.scheme_type,
            "fee_exemption": data.exemption_percentage,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"{data.scheme_name} assigned to student",
        "scheme_id": scheme_record["id"],
        "exemption": f"{data.exemption_percentage}%"
    }


@router.get("/scheme/student/{student_id}")
async def get_student_schemes(student_id: str):
    """
    Get all schemes assigned to a student
    """
    schemes = await db.student_schemes.find(
        {"student_id": student_id, "status": "active"},
        {"_id": 0}
    ).to_list(10)
    
    # Get student basic info
    student = await db.students.find_one(
        {"$or": [{"id": student_id}, {"student_id": student_id}]},
        {"_id": 0, "name": 1, "has_scheme": 1, "scheme_name": 1, "fee_exemption": 1}
    )
    
    return {
        "student_id": student_id,
        "student_name": student.get("name") if student else None,
        "has_scheme": student.get("has_scheme", False) if student else False,
        "schemes": schemes,
        "total_exemption": max([s.get("exemption_percentage", 0) for s in schemes]) if schemes else 0
    }


@router.get("/schemes/all/{school_id}")
async def get_all_schemes(school_id: str):
    """
    Get all government schemes in the school
    """
    schemes = await db.student_schemes.aggregate([
        {"$match": {"school_id": school_id, "status": "active"}},
        {"$group": {
            "_id": "$scheme_name",
            "count": {"$sum": 1},
            "total_exemption": {"$avg": "$exemption_percentage"}
        }},
        {"$sort": {"count": -1}}
    ]).to_list(50)
    
    # Get scheme-wise students
    scheme_students = await db.student_schemes.find(
        {"school_id": school_id, "status": "active"},
        {"_id": 0}
    ).to_list(500)
    
    return {
        "school_id": school_id,
        "scheme_summary": [{"scheme": s["_id"], "students": s["count"], "avg_exemption": s["total_exemption"]} for s in schemes],
        "total_scheme_students": len(scheme_students),
        "scheme_details": scheme_students[:50]  # First 50
    }


# ==================== AVAILABLE SCHEMES LIST ====================

@router.get("/schemes/available")
async def get_available_schemes():
    """
    Get list of available government schemes
    """
    schemes = [
        {
            "code": "RTE",
            "name": "Right to Education (RTE)",
            "description": "Free education under RTE Act 2009",
            "exemption": 100,
            "type": "full_exemption",
            "eligibility": "EWS/BPL families"
        },
        {
            "code": "SC_ST_SCHOLARSHIP",
            "name": "SC/ST Scholarship",
            "description": "Scholarship for SC/ST students",
            "exemption": 100,
            "type": "reimbursement",
            "eligibility": "SC/ST category students"
        },
        {
            "code": "OBC_SCHOLARSHIP",
            "name": "OBC Scholarship",
            "description": "Scholarship for OBC students",
            "exemption": 50,
            "type": "partial_exemption",
            "eligibility": "OBC category with income criteria"
        },
        {
            "code": "MERIT_SCHOLARSHIP",
            "name": "Merit Scholarship",
            "description": "For meritorious students",
            "exemption": 25,
            "type": "partial_exemption",
            "eligibility": "Top 10% students"
        },
        {
            "code": "BPL",
            "name": "BPL Scheme",
            "description": "Below Poverty Line students",
            "exemption": 75,
            "type": "partial_exemption",
            "eligibility": "BPL card holders"
        },
        {
            "code": "GIRL_CHILD",
            "name": "Girl Child Scheme",
            "description": "Fee concession for girl students",
            "exemption": 25,
            "type": "partial_exemption",
            "eligibility": "All girl students"
        },
        {
            "code": "SINGLE_PARENT",
            "name": "Single Parent Scheme",
            "description": "Children of single parents",
            "exemption": 50,
            "type": "partial_exemption",
            "eligibility": "Single parent families"
        },
        {
            "code": "STAFF_CHILD",
            "name": "Staff Child Concession",
            "description": "Children of school staff",
            "exemption": 50,
            "type": "partial_exemption",
            "eligibility": "School employee children"
        },
        {
            "code": "SIBLING_DISCOUNT",
            "name": "Sibling Discount",
            "description": "Discount for siblings",
            "exemption": 10,
            "type": "partial_exemption",
            "eligibility": "2nd child onwards"
        }
    ]
    
    return {"schemes": schemes}


# ==================== STUDENT COMPLETE FEE CALCULATION ====================

@router.get("/student/fee-calculation/{student_id}")
async def calculate_student_fee(student_id: str, month: Optional[str] = None):
    """
    Calculate complete fee for a student including:
    - Base class fees
    - Optional services (bus, hostel)
    - Government scheme discounts
    - Final payable amount
    """
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    # Get student
    student = await db.students.find_one(
        {"$or": [{"id": student_id}, {"student_id": student_id}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    school_id = student.get("school_id", "school1")
    class_id = student.get("class_id", "class1")
    
    # Get class fee structure
    fee_structures = await db.fee_structures.find(
        {"school_id": school_id, "class_id": class_id, "is_active": True},
        {"_id": 0}
    ).to_list(50)
    
    # If no custom structure, use defaults
    if not fee_structures:
        fee_structures = [
            {"fee_type": "tuition", "amount": 2500, "frequency": "monthly", "is_optional": False},
            {"fee_type": "exam", "amount": 500, "frequency": "quarterly", "is_optional": False},
        ]
    
    # Get student services
    student_services = student.get("services", [])
    uses_transport = student.get("uses_transport", False) or "transport" in student_services
    uses_hostel = student.get("uses_hostel", False) or "hostel" in student_services
    
    # Calculate fees
    fee_breakdown = []
    total_base = 0
    total_optional = 0
    
    for fee in fee_structures:
        fee_type = fee.get("fee_type")
        amount = fee.get("amount", 0)
        is_optional = fee.get("is_optional", False)
        frequency = fee.get("frequency", "monthly")
        
        # Skip optional services student doesn't use
        if is_optional:
            if fee_type == "transport" and not uses_transport:
                continue
            if fee_type == "hostel" and not uses_hostel:
                continue
            if fee_type not in student_services and fee_type not in ["transport", "hostel"]:
                continue
        
        # Adjust for frequency
        monthly_amount = amount
        if frequency == "quarterly":
            monthly_amount = amount / 3
        elif frequency == "yearly":
            monthly_amount = amount / 12
        elif frequency == "one_time":
            monthly_amount = 0  # One-time fees handled separately
        
        if is_optional:
            total_optional += monthly_amount
        else:
            total_base += monthly_amount
        
        fee_breakdown.append({
            "fee_type": fee_type,
            "base_amount": amount,
            "frequency": frequency,
            "monthly_equivalent": round(monthly_amount, 2),
            "is_optional": is_optional,
            "applicable": True
        })
    
    # Get scheme discount
    schemes = await db.student_schemes.find(
        {"student_id": student_id, "status": "active"},
        {"_id": 0}
    ).to_list(10)
    
    total_exemption = 0
    scheme_details = []
    for scheme in schemes:
        exemption = scheme.get("exemption_percentage", 0)
        if exemption > total_exemption:
            total_exemption = exemption
        scheme_details.append({
            "name": scheme.get("scheme_name"),
            "exemption": exemption,
            "type": scheme.get("scheme_type")
        })
    
    # Calculate final amounts
    gross_fee = total_base + total_optional
    discount_amount = (total_base * total_exemption / 100)  # Discount on base fees only
    net_payable = gross_fee - discount_amount
    
    return {
        "student_id": student_id,
        "student_name": student.get("name"),
        "class_id": class_id,
        "month": month,
        "fee_breakdown": fee_breakdown,
        "services_used": student_services,
        "uses_transport": uses_transport,
        "uses_hostel": uses_hostel,
        "schemes": scheme_details,
        "calculation": {
            "base_fees": round(total_base, 2),
            "optional_services": round(total_optional, 2),
            "gross_total": round(gross_fee, 2),
            "scheme_exemption_percent": total_exemption,
            "discount_amount": round(discount_amount, 2),
            "net_payable": round(net_payable, 2)
        }
    }


# ==================== AUTO-UPDATE ON PAYMENT ====================

@router.post("/payment/auto-update")
async def auto_update_on_payment(payment_id: str, student_id: str, amount: float, month: str):
    """
    Auto-update student fee status when payment is received
    Called internally after payment verification
    """
    # Update student's payment history
    payment_update = {
        "payment_id": payment_id,
        "amount": amount,
        "month": month,
        "paid_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.students.update_one(
        {"$or": [{"id": student_id}, {"student_id": student_id}]},
        {
            "$push": {"payment_history": payment_update},
            "$inc": {"total_paid": amount},
            "$set": {
                "last_payment_date": datetime.now(timezone.utc).isoformat(),
                "last_payment_amount": amount,
                f"fee_status.{month}": "paid"
            }
        }
    )
    
    # Update fee invoices if any
    await db.fee_invoices.update_many(
        {"student_id": student_id, "month": month, "status": {"$in": ["pending", "partial"]}},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": "Student fee status auto-updated",
        "student_id": student_id,
        "month": month
    }
