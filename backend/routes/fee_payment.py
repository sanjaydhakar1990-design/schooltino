# ./routes/fee_payment.py
"""
Student Fee Payment System
- UPI/Credit Card/Debit Card payments
- Direct school account transfer
- Auto receipt generation
- Payment history
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
import os
import sys
import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))

from core.database import db

router = APIRouter(prefix="/fee-payment", tags=["Fee Payment"])


# ==================== MODELS ====================

class InitiatePaymentRequest(BaseModel):
    student_id: str
    school_id: str
    amount: float
    fee_type: str  # tuition, exam, transport, uniform, books, other
    month: Optional[str] = None  # e.g., "2024-12"
    payment_method: str  # upi, credit_card, debit_card, net_banking
    description: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    payment_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    status: str  # success, failed

class FeeStructure(BaseModel):
    school_id: str
    class_id: str
    fee_type: str
    amount: float
    due_day: int = 10
    late_fee: float = 0
    description: Optional[str] = None


# ==================== HELPER FUNCTIONS ====================

def generate_receipt_number():
    """Generate unique receipt number"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    unique = str(uuid.uuid4())[:6].upper()
    return f"RCP-{timestamp}-{unique}"

def generate_payment_id():
    """Generate unique payment ID"""
    return f"PAY-{uuid.uuid4().hex[:12].upper()}"


# ==================== FEE STRUCTURE APIs ====================

@router.get("/structure/{school_id}/{class_id}")
async def get_fee_structure(school_id: str, class_id: str):
    """
    Get fee structure for a class
    """
    fees = await db.fee_structures.find(
        {"school_id": school_id, "class_id": class_id, "is_active": True},
        {"_id": 0}
    ).to_list(50)
    
    if not fees:
        # Return default fee structure
        fees = [
            {"fee_type": "tuition", "amount": 2500, "due_day": 10, "description": "Monthly Tuition Fee"},
            {"fee_type": "exam", "amount": 500, "due_day": 15, "description": "Examination Fee"},
            {"fee_type": "transport", "amount": 1500, "due_day": 10, "description": "Transport Fee"},
            {"fee_type": "uniform", "amount": 2000, "due_day": 0, "description": "Uniform Fee (One-time)"},
            {"fee_type": "books", "amount": 3000, "due_day": 0, "description": "Books & Stationery"}
        ]
    
    return {
        "school_id": school_id,
        "class_id": class_id,
        "fee_structure": fees,
        "total_monthly": sum(f["amount"] for f in fees if f.get("due_day", 0) > 0)
    }


# ==================== STUDENT FEE STATUS ====================

@router.get("/status/{student_id}")
async def get_student_fee_status(student_id: str):
    """
    Get complete fee status for a student
    Shows pending, paid, and upcoming fees
    """
    # Get student details
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all payments for this student
    payments = await db.fee_payments.find(
        {"student_id": student.get("id", student_id)},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get pending invoices
    pending_invoices = await db.fee_invoices.find(
        {"student_id": student.get("id", student_id), "status": {"$in": ["pending", "partial", "overdue"]}},
        {"_id": 0}
    ).to_list(50)
    
    # Calculate totals
    total_paid = sum(p.get("amount", 0) for p in payments if p.get("status") == "success")
    total_pending = sum(inv.get("final_amount", inv.get("amount", 0)) - inv.get("paid_amount", 0) for inv in pending_invoices)
    
    # Current month dues
    current_month = datetime.now().strftime('%Y-%m')
    current_month_due = sum(
        inv.get("final_amount", inv.get("amount", 0)) - inv.get("paid_amount", 0)
        for inv in pending_invoices
        if inv.get("month", "") == current_month
    )
    
    return {
        "student_id": student_id,
        "student_name": student.get("name", "Student"),
        "class_id": student.get("class_id"),
        "summary": {
            "total_paid_this_year": total_paid,
            "total_pending": total_pending,
            "current_month_due": current_month_due,
            "last_payment_date": payments[0].get("created_at") if payments else None
        },
        "pending_invoices": pending_invoices[:10],
        "recent_payments": payments[:10]
    }


# ==================== INITIATE PAYMENT ====================

@router.post("/initiate")
async def initiate_payment(request: InitiatePaymentRequest):
    """
    Initiate a fee payment
    Creates payment record and returns payment details
    For UPI - returns UPI intent URL
    For Cards - returns Razorpay order ID
    """
    # Get student
    student = await db.students.find_one({"id": request.student_id}, {"_id": 0})
    if not student:
        student = await db.students.find_one({"student_id": request.student_id}, {"_id": 0})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get school for payment details
    school = await db.schools.find_one({"id": request.school_id}, {"_id": 0})
    school_name = school.get("name", "School") if school else "School"
    school_upi = school.get("upi_id", "school@upi") if school else "school@upi"
    
    payment_id = generate_payment_id()
    
    # Create payment record
    payment_record = {
        "id": payment_id,
        "student_id": student.get("id", request.student_id),
        "student_name": student.get("name", "Student"),
        "school_id": request.school_id,
        "school_name": school_name,
        "amount": request.amount,
        "fee_type": request.fee_type,
        "month": request.month,
        "payment_method": request.payment_method,
        "description": request.description or f"{request.fee_type.title()} Fee Payment",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.fee_payments.insert_one(payment_record)
    
    # Generate payment URL/details based on method
    payment_response = {
        "payment_id": payment_id,
        "amount": request.amount,
        "student_name": student.get("name"),
        "school_name": school_name,
        "fee_type": request.fee_type,
        "status": "initiated"
    }
    
    if request.payment_method == "upi":
        # UPI Intent URL
        upi_url = f"upi://pay?pa={school_upi}&pn={school_name}&am={request.amount}&cu=INR&tn={payment_id}"
        payment_response["upi_url"] = upi_url
        payment_response["upi_id"] = school_upi
        payment_response["qr_data"] = upi_url  # For QR code generation
        
    elif request.payment_method in ["credit_card", "debit_card", "net_banking"]:
        # For Razorpay integration (mocked for now)
        razorpay_order_id = f"order_{uuid.uuid4().hex[:16]}"
        payment_response["razorpay_order_id"] = razorpay_order_id
        payment_response["razorpay_key"] = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_demo")
        
        # Update payment record with order ID
        await db.fee_payments.update_one(
            {"id": payment_id},
            {"$set": {"razorpay_order_id": razorpay_order_id}}
        )
    
    return payment_response


# ==================== VERIFY PAYMENT ====================

@router.post("/verify")
async def verify_payment(request: PaymentVerifyRequest):
    """
    Verify payment completion and generate receipt
    """
    # Get payment record
    payment = await db.fee_payments.find_one({"id": request.payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment["status"] == "success":
        return {
            "success": True,
            "message": "Payment already verified",
            "receipt_number": payment.get("receipt_number")
        }
    
    # Update payment status
    if request.status == "success":
        receipt_number = generate_receipt_number()
        
        update_data = {
            "status": "success",
            "receipt_number": receipt_number,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if request.razorpay_payment_id:
            update_data["razorpay_payment_id"] = request.razorpay_payment_id
        if request.razorpay_signature:
            update_data["razorpay_signature"] = request.razorpay_signature
        
        await db.fee_payments.update_one(
            {"id": request.payment_id},
            {"$set": update_data}
        )
        
        # Create receipt record
        receipt = {
            "id": str(uuid.uuid4()),
            "receipt_number": receipt_number,
            "payment_id": request.payment_id,
            "student_id": payment["student_id"],
            "student_name": payment.get("student_name", "Student"),
            "school_id": payment["school_id"],
            "school_name": payment.get("school_name", "School"),
            "amount": payment["amount"],
            "fee_type": payment["fee_type"],
            "month": payment.get("month"),
            "payment_method": payment["payment_method"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.fee_receipts.insert_one(receipt)
        
        # ========== AUTO-UPDATE STUDENT FEE STATUS ==========
        # Update student's payment history and fee status
        student_id = payment["student_id"]
        month = payment.get("month", datetime.now().strftime('%Y-%m'))
        
        await db.students.update_one(
            {"$or": [{"id": student_id}, {"student_id": student_id}]},
            {
                "$push": {"payment_history": {
                    "payment_id": request.payment_id,
                    "receipt_number": receipt_number,
                    "amount": payment["amount"],
                    "fee_type": payment["fee_type"],
                    "month": month,
                    "paid_at": datetime.now(timezone.utc).isoformat()
                }},
                "$inc": {"total_paid_amount": payment["amount"]},
                "$set": {
                    "last_payment_date": datetime.now(timezone.utc).isoformat(),
                    "last_payment_amount": payment["amount"],
                    f"fee_status.{month.replace('-', '_')}": "paid"
                }
            }
        )
        
        # Update any pending invoices for this month
        await db.fee_invoices.update_many(
            {"student_id": student_id, "month": month, "status": {"$in": ["pending", "partial", "overdue"]}},
            {"$set": {
                "status": "paid",
                "paid_amount": payment["amount"],
                "paid_at": datetime.now(timezone.utc).isoformat(),
                "receipt_number": receipt_number
            }}
        )
        # ========== END AUTO-UPDATE ==========
        
        return {
            "success": True,
            "message": "Payment verified successfully!",
            "receipt_number": receipt_number,
            "receipt": {
                "receipt_number": receipt_number,
                "amount": payment["amount"],
                "fee_type": payment["fee_type"],
                "student_name": payment.get("student_name"),
                "school_name": payment.get("school_name"),
                "payment_date": datetime.now(timezone.utc).isoformat(),
                "payment_method": payment["payment_method"]
            }
        }
    else:
        await db.fee_payments.update_one(
            {"id": request.payment_id},
            {"$set": {
                "status": "failed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": False,
            "message": "Payment failed. Please try again.",
            "payment_id": request.payment_id
        }


# ==================== GET RECEIPT ====================

@router.get("/receipt/{receipt_number}")
async def get_receipt(receipt_number: str):
    """
    Get receipt details for download/print
    """
    receipt = await db.fee_receipts.find_one(
        {"receipt_number": receipt_number},
        {"_id": 0}
    )
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Get school details for receipt header
    school = await db.schools.find_one({"id": receipt["school_id"]}, {"_id": 0})
    
    receipt["school_details"] = {
        "name": school.get("name") if school else receipt.get("school_name"),
        "address": school.get("address") if school else "",
        "phone": school.get("phone") if school else "",
        "email": school.get("email") if school else "",
        "logo_url": school.get("logo_url") if school else ""
    }
    
    return receipt


# ==================== PAYMENT HISTORY ====================

@router.get("/history/{student_id}")
async def get_payment_history(student_id: str, limit: int = 20):
    """
    Get payment history for a student
    """
    payments = await db.fee_payments.find(
        {"student_id": student_id, "status": "success"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "student_id": student_id,
        "payments": payments,
        "total_count": len(payments)
    }


# ==================== CASH PAYMENT (SCHOOL COUNTER) ====================

class CashPaymentRequest(BaseModel):
    student_id: str
    school_id: str
    amount: float
    fee_type: str  # tuition, exam, transport, etc.
    month: Optional[str] = None
    collected_by: str  # staff ID who collected
    remarks: Optional[str] = None

@router.post("/cash-payment")
async def record_cash_payment(request: CashPaymentRequest):
    """
    Record cash payment collected at school counter.
    Instantly reflects in student's account.
    """
    # Verify student exists
    student = await db.students.find_one({
        "$or": [
            {"id": request.student_id},
            {"student_id": request.student_id}
        ],
        "school_id": request.school_id
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get school info
    school = await db.schools.find_one({"id": request.school_id})
    school_name = school.get("name", "School") if school else "School"
    
    # Generate IDs
    payment_id = generate_payment_id()
    receipt_number = generate_receipt_number()
    month = request.month or datetime.now().strftime('%Y-%m')
    
    # Create payment record - INSTANT SUCCESS for cash
    payment_record = {
        "id": payment_id,
        "student_id": student.get("id"),
        "student_sid": student.get("student_id"),
        "student_name": student.get("name"),
        "school_id": request.school_id,
        "school_name": school_name,
        "amount": request.amount,
        "fee_type": request.fee_type,
        "month": month,
        "payment_method": "cash",
        "status": "success",  # Cash is instantly successful
        "receipt_number": receipt_number,
        "collected_by": request.collected_by,
        "remarks": request.remarks,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "verified_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.fee_payments.insert_one(payment_record)
    
    # Create receipt
    receipt = {
        "id": str(uuid.uuid4()),
        "receipt_number": receipt_number,
        "payment_id": payment_id,
        "student_id": student.get("id"),
        "student_sid": student.get("student_id"),
        "student_name": student.get("name"),
        "father_name": student.get("father_name"),
        "class_name": student.get("class_name"),
        "section": student.get("section"),
        "school_id": request.school_id,
        "school_name": school_name,
        "amount": request.amount,
        "amount_in_words": number_to_words(request.amount),
        "fee_type": request.fee_type,
        "month": month,
        "payment_method": "cash",
        "collected_by": request.collected_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fee_receipts.insert_one(receipt)
    
    # ========== INSTANT UPDATE IN STUDENT'S APP ==========
    # Update student's payment history and fee status
    await db.students.update_one(
        {"id": student.get("id")},
        {
            "$push": {"payment_history": {
                "payment_id": payment_id,
                "receipt_number": receipt_number,
                "amount": request.amount,
                "fee_type": request.fee_type,
                "month": month,
                "payment_method": "cash",
                "paid_at": datetime.now(timezone.utc).isoformat()
            }},
            "$inc": {"total_paid_amount": request.amount},
            "$set": {
                "last_payment_date": datetime.now(timezone.utc).isoformat(),
                "last_payment_amount": request.amount,
                f"fee_status.{month.replace('-', '_')}": "paid"
            }
        }
    )
    
    # Update any pending fee invoices for this month
    await db.fee_invoices.update_many(
        {
            "student_id": student.get("id"),
            "month": month,
            "status": {"$in": ["pending", "partial", "overdue"]}
        },
        {"$set": {
            "status": "paid",
            "paid_amount": request.amount,
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "receipt_number": receipt_number,
            "payment_method": "cash"
        }}
    )
    
    # Update fees collection for this month
    await db.fees.update_many(
        {
            "student_id": student.get("id"),
            "month": month,
            "school_id": request.school_id
        },
        {"$set": {
            "status": "paid",
            "paid_amount": request.amount,
            "payment_date": datetime.now(timezone.utc).isoformat(),
            "receipt_no": receipt_number,
            "payment_mode": "cash"
        }}
    )
    # ========== END INSTANT UPDATE ==========
    
    # Remove MongoDB _id before returning
    receipt.pop('_id', None)
    
    return {
        "success": True,
        "message": f"₹{request.amount} cash payment recorded for {student.get('name')}",
        "receipt_number": receipt_number,
        "payment_id": payment_id,
        "receipt": receipt,
        "student_updated": True,
        "note": "Payment will instantly show in student's app"
    }

def number_to_words(num):
    """Convert number to words (Indian format)"""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 
            'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    if num < 20:
        return ones[int(num)]
    elif num < 100:
        return tens[int(num)//10] + ('' if num%10 == 0 else ' ' + ones[int(num)%10])
    elif num < 1000:
        return ones[int(num)//100] + ' Hundred' + ('' if num%100 == 0 else ' and ' + number_to_words(num%100))
    elif num < 100000:
        return number_to_words(num//1000) + ' Thousand' + ('' if num%1000 == 0 else ' ' + number_to_words(num%1000))
    elif num < 10000000:
        return number_to_words(num//100000) + ' Lakh' + ('' if num%100000 == 0 else ' ' + number_to_words(num%100000))
    else:
        return number_to_words(num//10000000) + ' Crore' + ('' if num%10000000 == 0 else ' ' + number_to_words(num%10000000))


# ==================== SCHOOL PAYMENT SETTINGS ====================

@router.post("/school-settings")
async def update_school_payment_settings(
    school_id: str,
    upi_id: Optional[str] = None,
    bank_name: Optional[str] = None,
    account_number: Optional[str] = None,
    ifsc_code: Optional[str] = None,
    account_holder_name: Optional[str] = None,
    razorpay_key_id: Optional[str] = None
):
    """
    Update school's payment receiving settings
    """
    update_data = {}
    if upi_id:
        update_data["upi_id"] = upi_id
    if bank_name:
        update_data["bank_name"] = bank_name
    if account_number:
        update_data["account_number"] = account_number
    if ifsc_code:
        update_data["ifsc_code"] = ifsc_code
    if account_holder_name:
        update_data["account_holder_name"] = account_holder_name
    if razorpay_key_id:
        update_data["razorpay_key_id"] = razorpay_key_id
    
    if update_data:
        await db.schools.update_one(
            {"id": school_id},
            {"$set": update_data}
        )
    
    return {
        "success": True,
        "message": "Payment settings updated successfully"
    }
