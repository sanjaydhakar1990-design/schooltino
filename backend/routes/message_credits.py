"""
MESSAGE CREDIT SYSTEM FOR SCHOOLS
- Schools buy message credits
- Every message deducts credits
- When credits = 0, messaging stops
- Different message types can have different costs
- Admin can add/manage credits
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

router = APIRouter(prefix="/message-credits", tags=["Message Credits"])

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'schooltino')
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[db_name]

# Message costs (in credits)
MESSAGE_COSTS = {
    "whatsapp_text": 1,       # Simple text message
    "whatsapp_image": 2,      # Message with image
    "whatsapp_document": 2,   # Message with PDF/document
    "whatsapp_template": 1,   # Template message
    "sms": 1,                 # SMS message
    "bulk_whatsapp": 1,       # Bulk WhatsApp (per recipient)
    "fee_reminder": 1,        # Fee reminder
    "attendance_alert": 1,    # Attendance notification
    "exam_notification": 1,   # Exam related
    "event_notification": 1,  # Event notification
    "emergency": 0,           # Emergency messages are free
}

# ==================== MODELS ====================

class CreditPurchase(BaseModel):
    school_id: str
    credits: int
    amount_paid: float
    payment_method: str  # cash, online, free
    notes: Optional[str] = None

class UseCredits(BaseModel):
    school_id: str
    message_type: str
    recipients_count: int
    description: Optional[str] = None

# ==================== CREDIT MANAGEMENT ====================

@router.get("/balance/{school_id}")
async def get_school_credit_balance(school_id: str):
    """Get current credit balance for a school"""
    balance = await db.school_credits.find_one(
        {"school_id": school_id},
        {"_id": 0}
    )
    
    if not balance:
        # Initialize with 0 credits
        balance = {
            "school_id": school_id,
            "total_credits": 0,
            "used_credits": 0,
            "available_credits": 0,
            "last_purchase": None,
            "last_used": None
        }
        await db.school_credits.insert_one(balance)
    
    return balance

@router.post("/add")
async def add_credits_to_school(purchase: CreditPurchase):
    """Add credits to a school (admin function)"""
    # Get school
    school = await db.schools.find_one({"id": purchase.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Get current balance
    current = await db.school_credits.find_one({"school_id": purchase.school_id})
    
    if current:
        new_total = current.get("total_credits", 0) + purchase.credits
        new_available = current.get("available_credits", 0) + purchase.credits
        
        await db.school_credits.update_one(
            {"school_id": purchase.school_id},
            {"$set": {
                "total_credits": new_total,
                "available_credits": new_available,
                "last_purchase": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        await db.school_credits.insert_one({
            "school_id": purchase.school_id,
            "total_credits": purchase.credits,
            "used_credits": 0,
            "available_credits": purchase.credits,
            "last_purchase": datetime.now(timezone.utc).isoformat(),
            "last_used": None
        })
    
    # Record purchase
    purchase_record = {
        "id": str(uuid.uuid4()),
        "school_id": purchase.school_id,
        "school_name": school.get("name"),
        "credits": purchase.credits,
        "amount_paid": purchase.amount_paid,
        "payment_method": purchase.payment_method,
        "notes": purchase.notes,
        "type": "purchase",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.credit_transactions.insert_one(purchase_record)
    
    return {
        "success": True,
        "message": f"{purchase.credits} credits added to {school.get('name')}",
        "new_balance": (current.get("available_credits", 0) if current else 0) + purchase.credits
    }

@router.post("/use")
async def use_credits(usage: UseCredits):
    """Deduct credits when sending messages"""
    # Get current balance
    balance = await db.school_credits.find_one({"school_id": usage.school_id})
    
    if not balance:
        raise HTTPException(status_code=400, detail="No credits available. Please purchase credits first.")
    
    # Calculate credits needed
    cost_per_message = MESSAGE_COSTS.get(usage.message_type, 1)
    total_cost = cost_per_message * usage.recipients_count
    
    if balance.get("available_credits", 0) < total_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient credits. Need {total_cost}, have {balance.get('available_credits', 0)}. Please purchase more credits."
        )
    
    # Deduct credits
    new_available = balance.get("available_credits", 0) - total_cost
    new_used = balance.get("used_credits", 0) + total_cost
    
    await db.school_credits.update_one(
        {"school_id": usage.school_id},
        {"$set": {
            "available_credits": new_available,
            "used_credits": new_used,
            "last_used": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Record usage
    usage_record = {
        "id": str(uuid.uuid4()),
        "school_id": usage.school_id,
        "message_type": usage.message_type,
        "recipients_count": usage.recipients_count,
        "credits_used": total_cost,
        "description": usage.description,
        "type": "usage",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.credit_transactions.insert_one(usage_record)
    
    return {
        "success": True,
        "credits_used": total_cost,
        "remaining_credits": new_available
    }

@router.get("/check/{school_id}")
async def check_can_send(school_id: str, message_type: str = "whatsapp_text", count: int = 1):
    """Check if school has enough credits to send messages"""
    balance = await db.school_credits.find_one({"school_id": school_id})
    
    if not balance:
        return {
            "can_send": False,
            "reason": "No credits available",
            "available": 0,
            "required": MESSAGE_COSTS.get(message_type, 1) * count
        }
    
    cost = MESSAGE_COSTS.get(message_type, 1) * count
    available = balance.get("available_credits", 0)
    
    return {
        "can_send": available >= cost,
        "available": available,
        "required": cost,
        "remaining_after": available - cost if available >= cost else 0
    }

@router.get("/history/{school_id}")
async def get_credit_history(school_id: str, limit: int = 50):
    """Get credit transaction history for a school"""
    transactions = await db.credit_transactions.find(
        {"school_id": school_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    balance = await db.school_credits.find_one(
        {"school_id": school_id},
        {"_id": 0}
    )
    
    return {
        "school_id": school_id,
        "current_balance": balance.get("available_credits", 0) if balance else 0,
        "total_purchased": balance.get("total_credits", 0) if balance else 0,
        "total_used": balance.get("used_credits", 0) if balance else 0,
        "transactions": transactions
    }

@router.get("/costs")
async def get_message_costs():
    """Get message costs in credits"""
    return {
        "costs": MESSAGE_COSTS,
        "description": {
            "whatsapp_text": "Simple WhatsApp text message",
            "whatsapp_image": "WhatsApp message with image",
            "whatsapp_document": "WhatsApp message with PDF/document",
            "whatsapp_template": "WhatsApp template message",
            "sms": "SMS text message",
            "bulk_whatsapp": "Bulk WhatsApp (per recipient)",
            "fee_reminder": "Fee reminder to parents",
            "attendance_alert": "Attendance notification",
            "exam_notification": "Exam related notification",
            "event_notification": "School event notification",
            "emergency": "Emergency messages (FREE)"
        }
    }

# ==================== ADMIN FUNCTIONS ====================

@router.get("/all-schools")
async def get_all_schools_credits():
    """Get credit balance for all schools (admin)"""
    schools = await db.schools.find({}, {"id": 1, "name": 1, "_id": 0}).to_list(500)
    
    result = []
    for school in schools:
        balance = await db.school_credits.find_one(
            {"school_id": school["id"]},
            {"_id": 0}
        )
        
        # Get usage this month
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0).isoformat()
        month_usage = await db.credit_transactions.aggregate([
            {"$match": {
                "school_id": school["id"],
                "type": "usage",
                "created_at": {"$gte": start_of_month}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}
        ]).to_list(1)
        
        result.append({
            "school_id": school["id"],
            "school_name": school["name"],
            "available_credits": balance.get("available_credits", 0) if balance else 0,
            "total_purchased": balance.get("total_credits", 0) if balance else 0,
            "total_used": balance.get("used_credits", 0) if balance else 0,
            "usage_this_month": month_usage[0]["total"] if month_usage else 0,
            "status": "active" if (balance and balance.get("available_credits", 0) > 0) else "no_credits"
        })
    
    return {
        "schools": result,
        "total_schools": len(result)
    }

@router.post("/bulk-add")
async def bulk_add_credits(school_ids: str, credits: int, payment_method: str = "admin", notes: str = None):
    """Add credits to multiple schools at once"""
    ids = [s.strip() for s in school_ids.split(",")]
    
    results = []
    for school_id in ids:
        school = await db.schools.find_one({"id": school_id})
        if not school:
            results.append({"school_id": school_id, "status": "not_found"})
            continue
        
        # Add credits
        current = await db.school_credits.find_one({"school_id": school_id})
        
        if current:
            await db.school_credits.update_one(
                {"school_id": school_id},
                {"$inc": {"total_credits": credits, "available_credits": credits}}
            )
        else:
            await db.school_credits.insert_one({
                "school_id": school_id,
                "total_credits": credits,
                "used_credits": 0,
                "available_credits": credits,
                "last_purchase": datetime.now(timezone.utc).isoformat()
            })
        
        # Record
        await db.credit_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "school_name": school.get("name"),
            "credits": credits,
            "amount_paid": 0,
            "payment_method": payment_method,
            "notes": notes or "Bulk add by admin",
            "type": "purchase",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        results.append({"school_id": school_id, "school_name": school.get("name"), "status": "success"})
    
    return {
        "success": True,
        "message": f"Credits added to {len([r for r in results if r['status'] == 'success'])} schools",
        "results": results
    }

@router.get("/stats")
async def get_credit_stats():
    """Get overall credit statistics"""
    # Total credits purchased
    total_purchased = await db.credit_transactions.aggregate([
        {"$match": {"type": "purchase"}},
        {"$group": {"_id": None, "total": {"$sum": "$credits"}, "revenue": {"$sum": "$amount_paid"}}}
    ]).to_list(1)
    
    # Total credits used
    total_used = await db.credit_transactions.aggregate([
        {"$match": {"type": "usage"}},
        {"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}
    ]).to_list(1)
    
    # This month stats
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0).isoformat()
    
    month_purchased = await db.credit_transactions.aggregate([
        {"$match": {"type": "purchase", "created_at": {"$gte": start_of_month}}},
        {"$group": {"_id": None, "total": {"$sum": "$credits"}, "revenue": {"$sum": "$amount_paid"}}}
    ]).to_list(1)
    
    month_used = await db.credit_transactions.aggregate([
        {"$match": {"type": "usage", "created_at": {"$gte": start_of_month}}},
        {"$group": {"_id": None, "total": {"$sum": "$credits_used"}}}
    ]).to_list(1)
    
    # Schools with low credits
    low_credit_schools = await db.school_credits.count_documents({
        "available_credits": {"$lt": 100, "$gt": 0}
    })
    
    no_credit_schools = await db.school_credits.count_documents({
        "available_credits": 0
    })
    
    return {
        "all_time": {
            "total_credits_sold": total_purchased[0]["total"] if total_purchased else 0,
            "total_revenue": total_purchased[0]["revenue"] if total_purchased else 0,
            "total_credits_used": total_used[0]["total"] if total_used else 0
        },
        "this_month": {
            "credits_sold": month_purchased[0]["total"] if month_purchased else 0,
            "revenue": month_purchased[0]["revenue"] if month_purchased else 0,
            "credits_used": month_used[0]["total"] if month_used else 0
        },
        "alerts": {
            "low_credit_schools": low_credit_schools,
            "no_credit_schools": no_credit_schools
        }
    }
