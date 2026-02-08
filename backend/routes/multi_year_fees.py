# ./routes/multi_year_fees.py
"""
Multi-Year Fee Management System
- Track fee dues from previous years (2-3 years)
- Year-wise dues breakdown
- Carry forward pending fees
- Payment allocation across years
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
import os
import sys
import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))

from core.database import db

router = APIRouter(prefix="/multi-year-fees", tags=["Multi-Year Fees"])


# ==================== MODELS ====================

class PreviousYearDueCreate(BaseModel):
    student_id: str
    school_id: str
    academic_year: str  # e.g., "2022-23", "2023-24"
    due_amount: float
    fee_type: str = "tuition"  # tuition, exam, transport, hostel, other
    description: Optional[str] = None
    original_due_date: Optional[str] = None
    remarks: Optional[str] = None

class PaymentAllocationCreate(BaseModel):
    student_id: str
    school_id: str
    payment_amount: float
    payment_mode: str = "cash"  # cash, online, cheque
    transaction_id: Optional[str] = None
    allocations: List[Dict]  # [{year: "2022-23", amount: 5000}, ...]
    remarks: Optional[str] = None


# ==================== ADD PREVIOUS YEAR DUES ====================

@router.post("/add-due")
async def add_previous_year_due(data: PreviousYearDueCreate):
    """
    Admin adds previous year fee dues for a student
    Use this for carry forward fees from 2-3 years back
    """
    # Validate student exists
    student = await db.students.find_one(
        {"$or": [{"id": data.student_id}, {"student_id": data.student_id}]},
        {"_id": 0, "name": 1, "class_id": 1, "id": 1, "student_id": 1}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create due record
    due_record = {
        "id": str(uuid.uuid4()),
        "student_id": data.student_id,
        "student_name": student.get("name"),
        "school_id": data.school_id,
        "academic_year": data.academic_year,
        "due_amount": data.due_amount,
        "paid_amount": 0,
        "remaining_amount": data.due_amount,
        "fee_type": data.fee_type,
        "description": data.description or f"Previous Year ({data.academic_year}) {data.fee_type.title()} Fee",
        "original_due_date": data.original_due_date,
        "remarks": data.remarks,
        "status": "pending",  # pending, partial, paid
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.multi_year_dues.insert_one(due_record)
    
    # Update student's total dues
    await db.students.update_one(
        {"$or": [{"id": data.student_id}, {"student_id": data.student_id}]},
        {
            "$inc": {"total_previous_dues": data.due_amount},
            "$set": {"has_previous_dues": True, "updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {
        "success": True,
        "message": f"₹{data.due_amount} due added for {data.academic_year}",
        "due_id": due_record["id"],
        "student_name": student.get("name")
    }


@router.post("/bulk-add-dues")
async def bulk_add_previous_year_dues(school_id: str, dues: List[Dict]):
    """
    Bulk add previous year dues for multiple students
    Useful for importing old fee data
    """
    added = 0
    errors = []
    
    for due_data in dues:
        try:
            student_id = due_data.get("student_id")
            student = await db.students.find_one(
                {"$or": [{"id": student_id}, {"student_id": student_id}]},
                {"_id": 0, "name": 1}
            )
            
            if not student:
                errors.append(f"Student {student_id} not found")
                continue
            
            due_record = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "student_name": student.get("name"),
                "school_id": school_id,
                "academic_year": due_data.get("academic_year"),
                "due_amount": due_data.get("due_amount", 0),
                "paid_amount": due_data.get("paid_amount", 0),
                "remaining_amount": due_data.get("due_amount", 0) - due_data.get("paid_amount", 0),
                "fee_type": due_data.get("fee_type", "tuition"),
                "description": due_data.get("description", "Previous Year Fee"),
                "status": "pending" if due_data.get("paid_amount", 0) == 0 else "partial",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.multi_year_dues.insert_one(due_record)
            added += 1
            
            # Update student
            remaining = due_record["remaining_amount"]
            if remaining > 0:
                await db.students.update_one(
                    {"$or": [{"id": student_id}, {"student_id": student_id}]},
                    {
                        "$inc": {"total_previous_dues": remaining},
                        "$set": {"has_previous_dues": True}
                    }
                )
        except Exception as e:
            errors.append(str(e))
    
    return {
        "success": True,
        "added": added,
        "errors": errors[:10]  # First 10 errors
    }


# ==================== GET STUDENT DUES (YEAR-WISE) ====================

@router.get("/student/{student_id}")
async def get_student_year_wise_dues(student_id: str):
    """
    Get complete year-wise dues breakdown for a student
    Shows current year + previous 2-3 years
    """
    # Get all dues for student
    dues = await db.multi_year_dues.find(
        {"student_id": student_id, "status": {"$in": ["pending", "partial"]}},
        {"_id": 0}
    ).sort("academic_year", -1).to_list(50)
    
    # Get student info
    student = await db.students.find_one(
        {"$or": [{"id": student_id}, {"student_id": student_id}]},
        {"_id": 0, "name": 1, "class_id": 1, "school_id": 1, "total_previous_dues": 1}
    )
    
    # Group by year
    year_wise = {}
    total_pending = 0
    
    for due in dues:
        year = due.get("academic_year", "Unknown")
        if year not in year_wise:
            year_wise[year] = {
                "academic_year": year,
                "dues": [],
                "total_due": 0,
                "total_paid": 0,
                "remaining": 0
            }
        
        year_wise[year]["dues"].append(due)
        year_wise[year]["total_due"] += due.get("due_amount", 0)
        year_wise[year]["total_paid"] += due.get("paid_amount", 0)
        year_wise[year]["remaining"] += due.get("remaining_amount", 0)
        total_pending += due.get("remaining_amount", 0)
    
    # Current academic year calculation
    current_year = datetime.now().year
    current_month = datetime.now().month
    if current_month >= 4:  # April onwards
        current_academic_year = f"{current_year}-{str(current_year + 1)[-2:]}"
    else:
        current_academic_year = f"{current_year - 1}-{str(current_year)[-2:]}"
    
    # Get current year dues from regular fee system
    current_invoices = await db.fee_invoices.find(
        {"student_id": student_id, "status": {"$in": ["pending", "partial", "overdue"]}},
        {"_id": 0}
    ).to_list(20)
    
    current_year_due = sum(
        inv.get("final_amount", inv.get("amount", 0)) - inv.get("paid_amount", 0) 
        for inv in current_invoices
    )
    
    return {
        "student_id": student_id,
        "student_name": student.get("name") if student else None,
        "class_id": student.get("class_id") if student else None,
        "current_academic_year": current_academic_year,
        "summary": {
            "total_previous_years_pending": total_pending,
            "current_year_pending": current_year_due,
            "grand_total_pending": total_pending + current_year_due,
            "years_with_dues": len(year_wise)
        },
        "year_wise_breakdown": list(year_wise.values()),
        "current_year_invoices": current_invoices[:10]
    }


# ==================== GET ALL DEFAULTERS ====================

@router.get("/defaulters/{school_id}")
async def get_all_fee_defaulters(school_id: str, min_amount: float = 0):
    """
    Get all students with previous year dues
    For admin dashboard - fee collection overview
    """
    # Aggregate dues by student
    pipeline = [
        {"$match": {"school_id": school_id, "status": {"$in": ["pending", "partial"]}}},
        {"$group": {
            "_id": "$student_id",
            "student_name": {"$first": "$student_name"},
            "total_dues": {"$sum": "$remaining_amount"},
            "years": {"$addToSet": "$academic_year"},
            "oldest_due_year": {"$min": "$academic_year"},
            "due_count": {"$sum": 1}
        }},
        {"$match": {"total_dues": {"$gt": min_amount}}},
        {"$sort": {"total_dues": -1}},
        {"$limit": 100}
    ]
    
    defaulters = await db.multi_year_dues.aggregate(pipeline).to_list(100)
    
    # Calculate summary
    total_pending = sum(d.get("total_dues", 0) for d in defaulters)
    
    return {
        "school_id": school_id,
        "total_defaulters": len(defaulters),
        "total_pending_amount": total_pending,
        "defaulters": [
            {
                "student_id": d["_id"],
                "student_name": d.get("student_name"),
                "total_dues": d.get("total_dues", 0),
                "years_pending": d.get("years", []),
                "oldest_due": d.get("oldest_due_year"),
                "due_count": d.get("due_count", 0)
            }
            for d in defaulters
        ]
    }


# ==================== RECORD PAYMENT AGAINST PREVIOUS DUES ====================

@router.post("/pay")
async def record_payment_for_previous_dues(data: PaymentAllocationCreate):
    """
    Record payment and allocate across multiple year dues
    Admin can specify which year's dues to clear first
    """
    # Validate total allocation matches payment
    total_allocated = sum(a.get("amount", 0) for a in data.allocations)
    if abs(total_allocated - data.payment_amount) > 0.01:
        raise HTTPException(
            status_code=400, 
            detail=f"Allocation total (₹{total_allocated}) doesn't match payment (₹{data.payment_amount})"
        )
    
    # Generate receipt
    receipt_no = f"MYRCP-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:4].upper()}"
    
    # Process each allocation
    allocations_done = []
    
    for allocation in data.allocations:
        year = allocation.get("year")
        amount = allocation.get("amount", 0)
        
        if amount <= 0:
            continue
        
        # Find and update the due for this year
        due = await db.multi_year_dues.find_one(
            {
                "student_id": data.student_id,
                "academic_year": year,
                "status": {"$in": ["pending", "partial"]}
            }
        )
        
        if due:
            new_paid = due.get("paid_amount", 0) + amount
            new_remaining = due.get("due_amount", 0) - new_paid
            new_status = "paid" if new_remaining <= 0 else "partial"
            
            await db.multi_year_dues.update_one(
                {"id": due["id"]},
                {"$set": {
                    "paid_amount": new_paid,
                    "remaining_amount": max(0, new_remaining),
                    "status": new_status,
                    "last_payment_date": datetime.now(timezone.utc).isoformat(),
                    "last_payment_receipt": receipt_no,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            allocations_done.append({
                "year": year,
                "amount_paid": amount,
                "new_status": new_status,
                "remaining": max(0, new_remaining)
            })
    
    # Create payment record
    payment_record = {
        "id": str(uuid.uuid4()),
        "receipt_no": receipt_no,
        "student_id": data.student_id,
        "school_id": data.school_id,
        "total_amount": data.payment_amount,
        "payment_mode": data.payment_mode,
        "transaction_id": data.transaction_id,
        "allocations": allocations_done,
        "remarks": data.remarks,
        "payment_type": "multi_year",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.multi_year_payments.insert_one(payment_record)
    
    # Update student's total previous dues
    total_cleared = sum(a.get("amount_paid", 0) for a in allocations_done)
    await db.students.update_one(
        {"$or": [{"id": data.student_id}, {"student_id": data.student_id}]},
        {
            "$inc": {"total_previous_dues": -total_cleared},
            "$push": {"multi_year_payment_history": {
                "receipt_no": receipt_no,
                "amount": data.payment_amount,
                "date": datetime.now(timezone.utc).isoformat()
            }}
        }
    )
    
    return {
        "success": True,
        "message": f"Payment of ₹{data.payment_amount} recorded successfully!",
        "receipt_no": receipt_no,
        "allocations": allocations_done
    }


# ==================== DELETE/WAIVE DUE ====================

@router.delete("/due/{due_id}")
async def delete_or_waive_due(due_id: str, waive: bool = False, reason: Optional[str] = None):
    """
    Delete or waive a previous year due
    Waive = Mark as cleared without payment (concession/scholarship)
    """
    due = await db.multi_year_dues.find_one({"id": due_id})
    
    if not due:
        raise HTTPException(status_code=404, detail="Due record not found")
    
    if waive:
        # Mark as waived (don't delete, keep record)
        await db.multi_year_dues.update_one(
            {"id": due_id},
            {"$set": {
                "status": "waived",
                "waived_amount": due.get("remaining_amount", 0),
                "waive_reason": reason or "Waived by admin",
                "waived_at": datetime.now(timezone.utc).isoformat(),
                "remaining_amount": 0,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update student's dues
        waived_amount = due.get("remaining_amount", 0)
        await db.students.update_one(
            {"$or": [{"id": due["student_id"]}, {"student_id": due["student_id"]}]},
            {"$inc": {"total_previous_dues": -waived_amount}}
        )
        
        return {
            "success": True,
            "message": f"Due of ₹{waived_amount} waived successfully",
            "reason": reason
        }
    else:
        # Hard delete
        remaining = due.get("remaining_amount", 0)
        await db.multi_year_dues.delete_one({"id": due_id})
        
        # Update student's dues
        await db.students.update_one(
            {"$or": [{"id": due["student_id"]}, {"student_id": due["student_id"]}]},
            {"$inc": {"total_previous_dues": -remaining}}
        )
        
        return {
            "success": True,
            "message": "Due record deleted successfully"
        }


# ==================== YEAR-WISE SUMMARY FOR SCHOOL ====================

@router.get("/summary/{school_id}")
async def get_year_wise_summary(school_id: str):
    """
    Get overall year-wise fee dues summary for school
    For director/admin dashboard
    """
    pipeline = [
        {"$match": {"school_id": school_id, "status": {"$in": ["pending", "partial"]}}},
        {"$group": {
            "_id": "$academic_year",
            "total_dues": {"$sum": "$due_amount"},
            "total_paid": {"$sum": "$paid_amount"},
            "remaining": {"$sum": "$remaining_amount"},
            "student_count": {"$addToSet": "$student_id"},
            "due_count": {"$sum": 1}
        }},
        {"$sort": {"_id": -1}}
    ]
    
    year_summary = await db.multi_year_dues.aggregate(pipeline).to_list(10)
    
    # Format response
    formatted = []
    total_pending = 0
    total_students = set()
    
    for year in year_summary:
        students = year.get("student_count", [])
        total_students.update(students)
        total_pending += year.get("remaining", 0)
        
        formatted.append({
            "academic_year": year["_id"],
            "total_dues": year.get("total_dues", 0),
            "collected": year.get("total_paid", 0),
            "pending": year.get("remaining", 0),
            "students_with_dues": len(students),
            "collection_percentage": round(
                (year.get("total_paid", 0) / year.get("total_dues", 1)) * 100, 1
            )
        })
    
    return {
        "school_id": school_id,
        "total_pending_all_years": total_pending,
        "total_students_with_dues": len(total_students),
        "years_with_dues": len(formatted),
        "year_wise_summary": formatted
    }
