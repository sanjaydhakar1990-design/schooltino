"""
Razorpay Payment Integration for Schooltino
- Create payment orders using SCHOOL's Razorpay account
- Platform subscription uses platform's account
- Each school has their own payment credentials
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

# Platform's Razorpay (for subscription only)
PLATFORM_RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
PLATFORM_RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

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

class SchoolRazorpayConfig(BaseModel):
    school_id: str
    razorpay_key_id: str
    razorpay_key_secret: str
    business_name: Optional[str] = None

# ============== SCHOOL RAZORPAY CONFIG ==============

@router.post("/school/config")
async def save_school_razorpay_config(config: SchoolRazorpayConfig):
    """Save school's Razorpay credentials"""
    db = get_database()
    
    # Verify the credentials work
    try:
        test_client = razorpay.Client(auth=(config.razorpay_key_id, config.razorpay_key_secret))
        # Try to fetch balance to verify credentials
        test_client.order.all({"count": 1})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Razorpay credentials: {str(e)}")
    
    # Save to database (encrypted in production)
    await db.school_razorpay_config.update_one(
        {"school_id": config.school_id},
        {"$set": {
            "school_id": config.school_id,
            "razorpay_key_id": config.razorpay_key_id,
            "razorpay_key_secret": config.razorpay_key_secret,
            "business_name": config.business_name,
            "is_active": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Razorpay configured successfully", "school_id": config.school_id}

@router.get("/school/config/{school_id}")
async def get_school_razorpay_config(school_id: str):
    """Get school's Razorpay config status"""
    db = get_database()
    
    config = await db.school_razorpay_config.find_one(
        {"school_id": school_id},
        {"_id": 0, "razorpay_key_secret": 0}  # Don't expose secret
    )
    
    if config:
        return {
            "is_configured": True,
            "key_id": config.get("razorpay_key_id", "")[:15] + "...",
            "business_name": config.get("business_name")
        }
    
    return {"is_configured": False}

@router.delete("/school/config/{school_id}")
async def remove_school_razorpay_config(school_id: str):
    """Remove school's Razorpay configuration"""
    db = get_database()
    
    await db.school_razorpay_config.delete_one({"school_id": school_id})
    
    return {"message": "Razorpay config removed"}

# Helper function to get school's Razorpay client
async def get_school_razorpay_client(school_id: str):
    """Get Razorpay client for a specific school"""
    db = get_database()
    
    config = await db.school_razorpay_config.find_one({"school_id": school_id, "is_active": True})
    
    if not config:
        return None, None, "School has not configured Razorpay. Please contact school administration."
    
    try:
        client = razorpay.Client(auth=(config["razorpay_key_id"], config["razorpay_key_secret"]))
        return client, config["razorpay_key_id"], None
    except Exception as e:
        return None, None, f"Invalid school Razorpay config: {str(e)}"

# ============== PAYMENT ENDPOINTS ==============

@router.get("/config")
async def get_razorpay_config(school_id: str = None):
    """Get Razorpay public key for frontend - uses school's account for fees"""
    if school_id:
        db = get_database()
        config = await db.school_razorpay_config.find_one({"school_id": school_id, "is_active": True})
        if config:
            return {
                "key_id": config["razorpay_key_id"],
                "currency": "INR",
                "name": config.get("business_name", "School"),
                "description": "School Fee Payment",
                "is_school_account": True
            }
    
    # Fallback to platform account (for subscription)
    if not PLATFORM_RAZORPAY_KEY_ID:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")
    
    return {
        "key_id": PLATFORM_RAZORPAY_KEY_ID,
        "currency": "INR",
        "name": "Schooltino",
        "description": "Subscription Payment",
        "is_school_account": False
    }

@router.post("/create-order")
async def create_payment_order(data: CreateOrder):
    """Create a Razorpay order for fee payment - uses SCHOOL's account"""
    db = get_database()
    
    # Get school's Razorpay client
    razorpay_client, key_id, error = await get_school_razorpay_client(data.school_id)
    
    if error:
        raise HTTPException(status_code=503, detail=error)
    
    try:
        # Create Razorpay order using SCHOOL's account
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
            "payment_to": "school",  # Mark that this goes to school
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.razorpay_payments.insert_one(payment_record)
        
        return {
            "order_id": razor_order["id"],
            "amount": razor_order["amount"],
            "currency": razor_order["currency"],
            "key_id": key_id,  # School's key
            "student_name": data.student_name,
            "description": data.description or f"Fee payment - {data.fee_type}",
            "payment_to": "school"
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
