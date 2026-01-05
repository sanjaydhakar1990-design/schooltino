# /app/backend/routes/salary_management.py
"""
Salary Management System for Teachers & Staff
- Monthly salary tracking
- Due/Credited status
- Salary slip generation
- Deductions and allowances
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
import os
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

router = APIRouter(prefix="/salary", tags=["Salary Management"])


# ==================== MODELS ====================

class SalaryStructureCreate(BaseModel):
    staff_id: str
    school_id: str
    basic_salary: float
    hra: float = 0  # House Rent Allowance
    da: float = 0   # Dearness Allowance
    ta: float = 0   # Travel Allowance
    medical: float = 0
    special_allowance: float = 0
    pf_deduction: float = 0  # Provident Fund
    tax_deduction: float = 0
    other_deductions: float = 0
    effective_from: str

class SalaryPaymentCreate(BaseModel):
    staff_id: str
    school_id: str
    month: str  # e.g., "2025-01"
    gross_salary: float
    deductions: float = 0
    net_salary: float
    payment_mode: str = "bank_transfer"
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None


# ==================== SALARY STRUCTURE ====================

@router.post("/structure/set")
async def set_salary_structure(data: SalaryStructureCreate):
    """
    Set or update salary structure for a staff member
    """
    # Get staff details
    staff = await db.staff.find_one({"id": data.staff_id}, {"_id": 0, "name": 1, "designation": 1})
    if not staff:
        # Check in users collection
        staff = await db.users.find_one({"id": data.staff_id}, {"_id": 0, "name": 1, "role": 1})
    
    # Calculate totals
    total_allowances = data.hra + data.da + data.ta + data.medical + data.special_allowance
    total_deductions = data.pf_deduction + data.tax_deduction + data.other_deductions
    gross_salary = data.basic_salary + total_allowances
    net_salary = gross_salary - total_deductions
    
    structure = {
        "id": str(uuid.uuid4()),
        "staff_id": data.staff_id,
        "staff_name": staff.get("name") if staff else "Unknown",
        "designation": staff.get("designation", staff.get("role", "Staff")) if staff else "Staff",
        "school_id": data.school_id,
        "basic_salary": data.basic_salary,
        "allowances": {
            "hra": data.hra,
            "da": data.da,
            "ta": data.ta,
            "medical": data.medical,
            "special": data.special_allowance
        },
        "deductions": {
            "pf": data.pf_deduction,
            "tax": data.tax_deduction,
            "other": data.other_deductions
        },
        "total_allowances": total_allowances,
        "total_deductions": total_deductions,
        "gross_salary": gross_salary,
        "net_salary": net_salary,
        "effective_from": data.effective_from,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Deactivate old structure
    await db.salary_structures.update_many(
        {"staff_id": data.staff_id, "is_active": True},
        {"$set": {"is_active": False, "effective_until": data.effective_from}}
    )
    
    # Insert new
    await db.salary_structures.insert_one(structure)
    
    # Update staff record
    await db.staff.update_one(
        {"id": data.staff_id},
        {"$set": {
            "salary_gross": gross_salary,
            "salary_net": net_salary,
            "salary_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"Salary structure set for {staff.get('name') if staff else 'Staff'}",
        "structure_id": structure["id"],
        "gross_salary": gross_salary,
        "net_salary": net_salary
    }


@router.get("/structure/{staff_id}")
async def get_salary_structure(staff_id: str):
    """
    Get current salary structure for a staff member
    """
    structure = await db.salary_structures.find_one(
        {"staff_id": staff_id, "is_active": True},
        {"_id": 0}
    )
    
    if not structure:
        # Return default/empty structure
        staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
        if not staff:
            staff = await db.users.find_one({"id": staff_id}, {"_id": 0})
        
        return {
            "staff_id": staff_id,
            "staff_name": staff.get("name") if staff else "Unknown",
            "has_structure": False,
            "message": "No salary structure defined yet"
        }
    
    return {
        "staff_id": staff_id,
        "has_structure": True,
        "structure": structure
    }


# ==================== MONTHLY SALARY STATUS ====================

@router.get("/status/{staff_id}")
async def get_staff_salary_status(staff_id: str, year: Optional[int] = None):
    """
    Get monthly salary status for a staff member
    Shows due/credited status for each month
    """
    if not year:
        year = datetime.now().year
    
    # Get salary structure
    structure = await db.salary_structures.find_one(
        {"staff_id": staff_id, "is_active": True},
        {"_id": 0}
    )
    
    # Get staff info
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0, "name": 1, "designation": 1})
    if not staff:
        staff = await db.users.find_one({"id": staff_id}, {"_id": 0, "name": 1, "role": 1})
    
    # Get all payments for this year
    payments = await db.salary_payments.find(
        {"staff_id": staff_id, "month": {"$regex": f"^{year}"}},
        {"_id": 0}
    ).sort("month", 1).to_list(12)
    
    # Create month-wise status
    months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
    month_names = ["January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"]
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_status = []
    total_paid = 0
    total_pending = 0
    
    for idx, month in enumerate(months):
        month_key = f"{year}-{month}"
        payment = next((p for p in payments if p.get("month") == month_key), None)
        
        # Check if this month is in the future
        is_future = (year > current_year) or (year == current_year and int(month) > current_month)
        
        expected = structure.get("net_salary", 0) if structure else 0
        
        if payment:
            status = "credited"
            paid = payment.get("net_salary", 0)
            total_paid += paid
        elif is_future:
            status = "upcoming"
            paid = 0
        else:
            status = "due"
            paid = 0
            total_pending += expected
        
        monthly_status.append({
            "month": month_key,
            "month_name": month_names[idx],
            "expected_salary": expected,
            "paid_amount": paid,
            "status": status,  # credited, due, upcoming
            "payment_date": payment.get("payment_date") if payment else None,
            "transaction_id": payment.get("transaction_id") if payment else None
        })
    
    return {
        "staff_id": staff_id,
        "staff_name": staff.get("name") if staff else "Unknown",
        "designation": staff.get("designation", staff.get("role", "Staff")) if staff else None,
        "year": year,
        "salary_structure": {
            "gross": structure.get("gross_salary", 0) if structure else 0,
            "net": structure.get("net_salary", 0) if structure else 0,
            "deductions": structure.get("total_deductions", 0) if structure else 0
        },
        "summary": {
            "total_paid_this_year": total_paid,
            "total_pending": total_pending,
            "months_paid": len([m for m in monthly_status if m["status"] == "credited"]),
            "months_pending": len([m for m in monthly_status if m["status"] == "due"])
        },
        "monthly_breakdown": monthly_status
    }


# ==================== CREDIT SALARY ====================

@router.post("/credit")
async def credit_salary(data: SalaryPaymentCreate):
    """
    Credit/Pay salary for a month
    """
    # Check if already paid
    existing = await db.salary_payments.find_one({
        "staff_id": data.staff_id,
        "month": data.month,
        "status": "credited"
    })
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Salary already credited for {data.month}"
        )
    
    # Get staff info
    staff = await db.staff.find_one({"id": data.staff_id}, {"_id": 0, "name": 1})
    if not staff:
        staff = await db.users.find_one({"id": data.staff_id}, {"_id": 0, "name": 1})
    
    # Generate salary slip number
    slip_no = f"SAL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    payment = {
        "id": str(uuid.uuid4()),
        "slip_no": slip_no,
        "staff_id": data.staff_id,
        "staff_name": staff.get("name") if staff else "Staff",
        "school_id": data.school_id,
        "month": data.month,
        "gross_salary": data.gross_salary,
        "deductions": data.deductions,
        "net_salary": data.net_salary,
        "payment_mode": data.payment_mode,
        "transaction_id": data.transaction_id,
        "remarks": data.remarks,
        "status": "credited",
        "payment_date": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.salary_payments.insert_one(payment)
    
    # Update staff record
    await db.staff.update_one(
        {"id": data.staff_id},
        {"$set": {
            "last_salary_month": data.month,
            "last_salary_amount": data.net_salary,
            "last_salary_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"Salary of ₹{data.net_salary} credited for {data.month}",
        "slip_no": slip_no,
        "staff_name": staff.get("name") if staff else "Staff"
    }


# ==================== GET SALARY SLIP ====================

@router.get("/slip/{slip_no}")
async def get_salary_slip(slip_no: str):
    """
    Get salary slip details for download/print
    """
    payment = await db.salary_payments.find_one(
        {"slip_no": slip_no},
        {"_id": 0}
    )
    
    if not payment:
        raise HTTPException(status_code=404, detail="Salary slip not found")
    
    # Get salary structure for breakdown
    structure = await db.salary_structures.find_one(
        {"staff_id": payment["staff_id"], "is_active": True},
        {"_id": 0}
    )
    
    # Get school details
    school = await db.schools.find_one(
        {"id": payment["school_id"]},
        {"_id": 0, "name": 1, "address": 1, "phone": 1}
    )
    
    return {
        "slip_no": slip_no,
        "staff_name": payment.get("staff_name"),
        "staff_id": payment["staff_id"],
        "month": payment["month"],
        "payment_date": payment.get("payment_date"),
        "earnings": {
            "basic": structure.get("basic_salary", 0) if structure else 0,
            "hra": structure.get("allowances", {}).get("hra", 0) if structure else 0,
            "da": structure.get("allowances", {}).get("da", 0) if structure else 0,
            "ta": structure.get("allowances", {}).get("ta", 0) if structure else 0,
            "medical": structure.get("allowances", {}).get("medical", 0) if structure else 0,
            "special": structure.get("allowances", {}).get("special", 0) if structure else 0,
            "gross": payment.get("gross_salary", 0)
        },
        "deductions": {
            "pf": structure.get("deductions", {}).get("pf", 0) if structure else 0,
            "tax": structure.get("deductions", {}).get("tax", 0) if structure else 0,
            "other": structure.get("deductions", {}).get("other", 0) if structure else 0,
            "total": payment.get("deductions", 0)
        },
        "net_salary": payment.get("net_salary", 0),
        "payment_mode": payment.get("payment_mode"),
        "transaction_id": payment.get("transaction_id"),
        "school": {
            "name": school.get("name") if school else "School",
            "address": school.get("address") if school else "",
            "phone": school.get("phone") if school else ""
        }
    }


# ==================== SCHOOL-WIDE SALARY DASHBOARD ====================

@router.get("/dashboard/{school_id}")
async def get_salary_dashboard(school_id: str, month: Optional[str] = None):
    """
    Get salary dashboard for admin/accountant
    Shows all staff salary status for a month
    """
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    # Get all staff
    all_staff = await db.staff.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0, "id": 1, "name": 1, "designation": 1, "salary": 1}
    ).to_list(200)
    
    # Also get users with roles
    all_users = await db.users.find(
        {"school_id": school_id, "is_active": True, "role": {"$in": ["teacher", "accountant", "clerk"]}},
        {"_id": 0, "id": 1, "name": 1, "role": 1}
    ).to_list(200)
    
    staff_list = all_staff + all_users
    
    # Get payments for this month
    payments = await db.salary_payments.find(
        {"school_id": school_id, "month": month, "status": "credited"},
        {"_id": 0}
    ).to_list(200)
    
    paid_ids = {p["staff_id"] for p in payments}
    
    # Get salary structures
    structures = await db.salary_structures.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0}
    ).to_list(200)
    
    structure_map = {s["staff_id"]: s for s in structures}
    
    # Build status list
    staff_status = []
    total_payable = 0
    total_paid = 0
    
    for staff in staff_list:
        staff_id = staff["id"]
        structure = structure_map.get(staff_id, {})
        salary = structure.get("net_salary", staff.get("salary", 0))
        
        is_paid = staff_id in paid_ids
        payment = next((p for p in payments if p["staff_id"] == staff_id), None)
        
        total_payable += salary
        if is_paid:
            total_paid += payment.get("net_salary", salary)
        
        staff_status.append({
            "staff_id": staff_id,
            "name": staff.get("name"),
            "designation": staff.get("designation", staff.get("role", "Staff")),
            "salary": salary,
            "status": "credited" if is_paid else "due",
            "payment_date": payment.get("payment_date") if payment else None,
            "slip_no": payment.get("slip_no") if payment else None
        })
    
    # Sort - due first
    staff_status.sort(key=lambda x: (0 if x["status"] == "due" else 1, x["name"]))
    
    return {
        "school_id": school_id,
        "month": month,
        "summary": {
            "total_staff": len(staff_list),
            "paid_count": len(paid_ids),
            "pending_count": len(staff_list) - len(paid_ids),
            "total_payable": total_payable,
            "total_paid": total_paid,
            "total_pending": total_payable - total_paid
        },
        "staff_list": staff_status
    }


# ==================== BULK CREDIT SALARIES ====================

@router.post("/bulk-credit")
async def bulk_credit_salaries(
    school_id: str, 
    month: str, 
    staff_ids: List[str],
    payment_mode: str = "bank_transfer"
):
    """
    Credit salaries to multiple staff at once
    """
    credited = 0
    errors = []
    
    for staff_id in staff_ids:
        try:
            # Check if already paid
            existing = await db.salary_payments.find_one({
                "staff_id": staff_id, "month": month, "status": "credited"
            })
            if existing:
                errors.append(f"{staff_id}: Already credited")
                continue
            
            # Get structure
            structure = await db.salary_structures.find_one(
                {"staff_id": staff_id, "is_active": True}
            )
            
            if not structure:
                errors.append(f"{staff_id}: No salary structure")
                continue
            
            # Get staff
            staff = await db.staff.find_one({"id": staff_id})
            if not staff:
                staff = await db.users.find_one({"id": staff_id})
            
            # Create payment
            slip_no = f"SAL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
            
            payment = {
                "id": str(uuid.uuid4()),
                "slip_no": slip_no,
                "staff_id": staff_id,
                "staff_name": staff.get("name") if staff else "Staff",
                "school_id": school_id,
                "month": month,
                "gross_salary": structure.get("gross_salary", 0),
                "deductions": structure.get("total_deductions", 0),
                "net_salary": structure.get("net_salary", 0),
                "payment_mode": payment_mode,
                "status": "credited",
                "payment_date": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.salary_payments.insert_one(payment)
            credited += 1
            
        except Exception as e:
            errors.append(f"{staff_id}: {str(e)}")
    
    return {
        "success": True,
        "credited_count": credited,
        "errors": errors[:10],
        "month": month
    }
