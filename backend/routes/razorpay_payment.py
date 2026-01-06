"""
Razorpay Payment Integration for Schooltino
- Create payment orders
- Verify payments
- Support for fee payments
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import os
import razorpay
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/razorpay", tags=["Razorpay Payments"])

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

def get_database():
    return db

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Models
class CreateOrder(BaseModel):
    amount: int  # Amount in paise (multiply by 100)
    currency: str = "INR"
    student_id: str
    student_name: str
    school_id: str
    invoice_id: Optional[str] = None
    fee_type: str = "tuition"
    description: Optional[str] = None

class VerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    student_id: str
    school_id: str

# ============== PAYMENT ENDPOINTS ==============

@router.get("/config")
async def get_razorpay_config():
    """Get Razorpay public key for frontend"""
    if not RAZORPAY_KEY_ID:
        raise HTTPException(status_code=503, detail="Razorpay not configured")
    
    return {
        "key_id": RAZORPAY_KEY_ID,
        "currency": "INR",
        "name": "Schooltino",
        "description": "School Fee Payment"
    }

@router.post("/create-order")
async def create_payment_order(data: CreateOrder):
    """Create a Razorpay order for fee payment"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")
    
    db = get_database()
    
    try:
        # Create Razorpay order
        order_data = {
            "amount": data.amount,  # Amount in paise
            "currency": data.currency,
            "payment_capture": 1,  # Auto capture payment
            "notes": {
                "student_id": data.student_id,
                "school_id": data.school_id,
                "invoice_id": data.invoice_id or "",
                "fee_type": data.fee_type
            }
        }
        
        razor_order = razorpay_client.order.create(data=order_data)
        
        # Save order to database
        payment_record = {
            "id": str(uuid.uuid4()),
            "razorpay_order_id": razor_order["id"],
            "student_id": data.student_id,
            "student_name": data.student_name,
            "school_id": data.school_id,
            "invoice_id": data.invoice_id,
            "fee_type": data.fee_type,
            "amount": data.amount,
            "currency": data.currency,
            "description": data.description,
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.razorpay_payments.insert_one(payment_record)
        
        return {
            "order_id": razor_order["id"],
            "amount": razor_order["amount"],
            "currency": razor_order["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "student_name": data.student_name,
            "description": data.description or f"Fee payment - {data.fee_type}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(data: VerifyPayment):
    """Verify Razorpay payment signature and update records"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Razorpay not configured")
    
    db = get_database()
    
    try:
        # Verify signature
        params = {
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params)
        
        # Get payment details from Razorpay
        payment = razorpay_client.payment.fetch(data.razorpay_payment_id)
        
        # Update payment record
        update_result = await db.razorpay_payments.update_one(
            {"razorpay_order_id": data.razorpay_order_id},
            {"$set": {
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature,
                "status": "paid",
                "payment_method": payment.get("method"),
                "paid_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get payment record
        payment_record = await db.razorpay_payments.find_one(
            {"razorpay_order_id": data.razorpay_order_id},
            {"_id": 0}
        )
        
        # If linked to invoice, update invoice
        if payment_record and payment_record.get("invoice_id"):
            await db.invoices.update_one(
                {"id": payment_record["invoice_id"]},
                {
                    "$inc": {"paid_amount": payment_record["amount"] / 100},  # Convert paise to rupees
                    "$set": {"last_payment_date": datetime.now(timezone.utc).isoformat()}
                }
            )
            
            # Check if fully paid
            invoice = await db.invoices.find_one({"id": payment_record["invoice_id"]})
            if invoice and invoice.get("paid_amount", 0) >= invoice.get("final_amount", 0):
                await db.invoices.update_one(
                    {"id": payment_record["invoice_id"]},
                    {"$set": {"status": "paid"}}
                )
        
        # Create payment record in main payments collection
        await db.payments.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": data.school_id,
            "student_id": data.student_id,
            "invoice_id": payment_record.get("invoice_id") if payment_record else None,
            "amount": (payment_record.get("amount", 0) / 100) if payment_record else 0,
            "payment_mode": "razorpay",
            "transaction_id": data.razorpay_payment_id,
            "payment_date": datetime.now(timezone.utc).isoformat(),
            "status": "completed",
            "remarks": f"Razorpay payment - {payment.get('method', 'online')}"
        })
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "payment_id": data.razorpay_payment_id,
            "amount": payment_record.get("amount", 0) / 100 if payment_record else 0
        }
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.get("/payment-status/{order_id}")
async def get_payment_status(order_id: str):
    """Get payment status by order ID"""
    db = get_database()
    
    payment = await db.razorpay_payments.find_one(
        {"razorpay_order_id": order_id},
        {"_id": 0}
    )
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment

@router.get("/student-payments/{student_id}")
async def get_student_payments(student_id: str, limit: int = 20):
    """Get payment history for a student"""
    db = get_database()
    
    payments = await db.razorpay_payments.find(
        {"student_id": student_id, "status": "paid"},
        {"_id": 0}
    ).sort("paid_at", -1).limit(limit).to_list(limit)
    
    return {"payments": payments}

@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhooks"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Razorpay not configured")
    
    db = get_database()
    
    try:
        payload = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")
        webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
        
        if webhook_secret:
            razorpay_client.utility.verify_webhook_signature(
                payload.decode(),
                signature,
                webhook_secret
            )
        
        data = await request.json()
        event = data.get("event", "")
        
        if event == "payment.captured":
            payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            
            await db.razorpay_payments.update_one(
                {"razorpay_order_id": order_id},
                {"$set": {
                    "status": "paid",
                    "webhook_event": event,
                    "webhook_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        elif event == "payment.failed":
            payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            
            await db.razorpay_payments.update_one(
                {"razorpay_order_id": order_id},
                {"$set": {
                    "status": "failed",
                    "failure_reason": payment_entity.get("error_description"),
                    "webhook_event": event,
                    "webhook_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "processed"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
