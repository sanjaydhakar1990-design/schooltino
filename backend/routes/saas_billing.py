"""
saas_billing.py - SaaS Subscription & Billing for Schooltino

ENDPOINTS:
  POST /billing/subscribe          - Start subscription (Razorpay order)
  POST /billing/verify-payment     - Verify Razorpay payment
  GET  /billing/plans              - List all plans with pricing
  GET  /billing/status/{school_id} - Get current subscription status
  POST /billing/cancel             - Cancel subscription
  GET  /billing/invoices           - List past invoices
  POST /billing/trial/start        - Start 14-day free trial
  GET  /billing/usage              - Usage stats (students, AI queries)
  POST /billing/credits/add        - Add dual credits (super admin only)
  GET  /billing/credits/balance    - Check credit balance

INDIAN PRICING (INR):
  Starter   : ₹999/month  | ₹9,990/year  (save ₹999)
  Growth    : ₹2,499/month | ₹24,990/year (save ₹2,499)
  Pro       : ₹4,999/month | ₹49,990/year (save ₹4,999)
  Enterprise: ₹9,999/month | ₹99,990/year
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

from core.database import db
from core.tenant import get_tenant_user, TenantContext, PLAN_FEATURES, PLAN_PRICING

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["SaaS Billing"])


# ====================== MODELS ======================

class SubscribeRequest(BaseModel):
    plan: str           # starter, growth, pro, enterprise
    billing_cycle: str  # monthly, yearly
    school_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    school_id: str
    plan: str
    billing_cycle: str

class TrialStartRequest(BaseModel):
    school_id: str

class CreditAddRequest(BaseModel):
    school_id: str
    credits: int
    reason: str


# ====================== GET ALL PLANS ======================

@router.get("/plans")
async def get_plans():
    """Public endpoint - list all subscription plans"""
    plans = []
    for plan_name, pricing in PLAN_PRICING.items():
        if plan_name in ("free", "trial"):
            continue
        features = PLAN_FEATURES.get(plan_name, {})
        plans.append({
            "id": plan_name,
            "label": pricing["label"],
            "monthly_price": pricing["monthly"],
            "yearly_price": pricing["yearly"],
            "yearly_savings": pricing["monthly"] * 12 - pricing["yearly"],
            "max_students": features.get("max_students", 0),
            "max_teachers": features.get("max_teachers", 0),
            "ai_features": features.get("ai_features", False),
            "ai_queries_per_day": features.get("ai_queries_per_day", 0),
            "key_features": [
                k for k, v in features.items()
                if v is True and k not in ("sms_notifications", "email_notifications")
            ]
        })
    return {"plans": plans, "currency": "INR"}


# ====================== FREE TRIAL ======================

@router.post("/trial/start")
async def start_trial(data: TrialStartRequest):
    """
    Start a 14-day free trial for a school.
    No credit card required.
    """
    school = await db.schools.find_one({"id": data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Check if trial already used
    existing_sub = await db.subscriptions.find_one({"school_id": data.school_id})
    if existing_sub and existing_sub.get("trial_used"):
        raise HTTPException(
            status_code=400,
            detail="Trial already used. Please subscribe to a plan."
        )

    trial_end = datetime.now(timezone.utc) + timedelta(days=14)

    await db.subscriptions.update_one(
        {"school_id": data.school_id},
        {"$set": {
            "school_id": data.school_id,
            "plan_type": "trial",
            "status": "trial",
            "billing_cycle": None,
            "amount": 0,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "valid_until": trial_end.isoformat(),
            "trial_used": True,
            "trial_end_date": trial_end.isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    await db.schools.update_one(
        {"id": data.school_id},
        {"$set": {
            "is_trial": True,
            "subscription_status": "trial",
            "trial_end_date": trial_end.isoformat()
        }}
    )

    return {
        "success": True,
        "message": "14-day free trial started! Enjoy all features.",
        "trial_ends": trial_end.isoformat(),
        "plan": "trial",
        "features": PLAN_FEATURES["trial"]
    }


# ====================== CREATE SUBSCRIPTION ORDER (Razorpay) ======================

@router.post("/subscribe")
async def create_subscription_order(data: SubscribeRequest):
    """
    Create a Razorpay order for school subscription.
    Returns order_id to use on frontend with Razorpay checkout.
    """
    if data.plan not in PLAN_PRICING or data.plan in ("free", "trial"):
        raise HTTPException(status_code=400, detail="Invalid plan")

    if data.billing_cycle not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="billing_cycle must be monthly or yearly")

    amount_inr = PLAN_PRICING[data.plan][data.billing_cycle]

    # Load Razorpay
    razorpay_key = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET")

    if not razorpay_key or not razorpay_secret:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    try:
        import razorpay
        client = razorpay.Client(auth=(razorpay_key, razorpay_secret))

        order = client.order.create({
            "amount": amount_inr * 100,    # Razorpay uses paise
            "currency": "INR",
            "receipt": f"SCH-{data.school_id[:8]}-{uuid.uuid4().hex[:6]}",
            "notes": {
                "school_id": data.school_id,
                "plan": data.plan,
                "billing_cycle": data.billing_cycle
            }
        })

        # Store pending order
        await db.subscription_orders.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": data.school_id,
            "razorpay_order_id": order["id"],
            "plan": data.plan,
            "billing_cycle": data.billing_cycle,
            "amount": amount_inr,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {
            "success": True,
            "order_id": order["id"],
            "amount": amount_inr,
            "currency": "INR",
            "plan": data.plan,
            "billing_cycle": data.billing_cycle,
            "razorpay_key": razorpay_key
        }

    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=503, detail=f"Payment setup failed: {str(e)}")


import os
import hmac
import hashlib


# ====================== VERIFY PAYMENT ======================

@router.post("/verify-payment")
async def verify_payment(data: VerifyPaymentRequest):
    """
    Verify Razorpay payment signature and activate subscription.
    Called after successful payment on frontend.
    """
    razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")

    # Verify signature
    body = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_signature = hmac.new(
        razorpay_secret.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed. Invalid signature.")

    # Calculate expiry
    now = datetime.now(timezone.utc)
    if data.billing_cycle == "yearly":
        valid_until = now + timedelta(days=365)
    else:
        valid_until = now + timedelta(days=30)

    amount = PLAN_PRICING[data.plan][data.billing_cycle]

    # Activate subscription
    await db.subscriptions.update_one(
        {"school_id": data.school_id},
        {"$set": {
            "school_id": data.school_id,
            "plan_type": data.plan,
            "status": "active",
            "billing_cycle": data.billing_cycle,
            "amount": amount,
            "started_at": now.isoformat(),
            "valid_until": valid_until.isoformat(),
            "last_payment_id": data.razorpay_payment_id,
            "updated_at": now.isoformat()
        }},
        upsert=True
    )

    # Update school record
    await db.schools.update_one(
        {"id": data.school_id},
        {"$set": {
            "is_trial": False,
            "subscription_status": "active",
            "subscription_plan": data.plan,
            "subscription_valid_until": valid_until.isoformat()
        }}
    )

    # Save payment record
    await db.subscription_payments.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": data.school_id,
        "razorpay_order_id": data.razorpay_order_id,
        "razorpay_payment_id": data.razorpay_payment_id,
        "plan": data.plan,
        "billing_cycle": data.billing_cycle,
        "amount": amount,
        "currency": "INR",
        "status": "success",
        "paid_at": now.isoformat()
    })

    return {
        "success": True,
        "message": f"🎉 {PLAN_PRICING[data.plan]['label']} Plan activated!",
        "plan": data.plan,
        "valid_until": valid_until.isoformat(),
        "features": PLAN_FEATURES[data.plan]
    }


# ====================== SUBSCRIPTION STATUS ======================

@router.get("/status/{school_id}")
async def get_subscription_status(school_id: str):
    """Get current subscription status for a school"""
    subscription = await db.subscriptions.find_one(
        {"school_id": school_id}, {"_id": 0}
    )

    if not subscription:
        return {
            "school_id": school_id,
            "plan": "free",
            "status": "free",
            "features": PLAN_FEATURES["free"],
            "valid_until": None
        }

    plan = subscription.get("plan_type", "free")
    valid_until = subscription.get("valid_until")
    status = subscription.get("status", "free")

    # Check if expired
    if valid_until:
        try:
            expiry = datetime.fromisoformat(valid_until.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expiry:
                plan = "free"
                status = "expired"
        except Exception:
            pass

    # Student/teacher count
    student_count = await db.students.count_documents({"school_id": school_id, "status": "active"})
    teacher_count = await db.users.count_documents({"school_id": school_id, "role": "teacher"})

    features = PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])
    max_students = features.get("max_students", 50)
    max_teachers = features.get("max_teachers", 10)

    return {
        "school_id": school_id,
        "plan": plan,
        "plan_label": PLAN_PRICING.get(plan, {}).get("label", plan.title()),
        "status": status,
        "valid_until": valid_until,
        "billing_cycle": subscription.get("billing_cycle"),
        "amount": subscription.get("amount", 0),
        "features": features,
        "usage": {
            "students": student_count,
            "max_students": max_students,
            "student_usage_pct": round(student_count / max_students * 100, 1) if max_students > 0 else 0,
            "teachers": teacher_count,
            "max_teachers": max_teachers,
        }
    }


# ====================== BILLING INVOICES ======================

@router.get("/invoices/{school_id}")
async def get_invoices(school_id: str, limit: int = 12):
    """Get billing history/invoices for a school"""
    limit = min(limit, 50)
    invoices = await db.subscription_payments.find(
        {"school_id": school_id},
        {"_id": 0}
    ).sort("paid_at", -1).limit(limit).to_list(limit)
    return {"invoices": invoices, "total": len(invoices)}


# ====================== DUAL CREDITS SYSTEM ======================

@router.get("/credits/balance/{school_id}")
async def get_credits_balance(school_id: str):
    """Get credit balance for a school"""
    credit_doc = await db.school_credits.find_one(
        {"school_id": school_id}, {"_id": 0}
    )
    if not credit_doc:
        return {"school_id": school_id, "credits": 0, "transactions": []}

    # Recent transactions
    recent = await db.credit_transactions.find(
        {"school_id": school_id}, {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)

    return {
        "school_id": school_id,
        "credits": credit_doc.get("credits", 0),
        "total_earned": credit_doc.get("total_earned", 0),
        "total_spent": credit_doc.get("total_spent", 0),
        "recent_transactions": recent
    }


@router.post("/credits/use")
async def use_credits(school_id: str, amount: int, reason: str, ctx: TenantContext = Depends(get_tenant_user)):
    """Deduct credits for premium features"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid credit amount")

    credit_doc = await db.school_credits.find_one({"school_id": school_id})
    current = credit_doc.get("credits", 0) if credit_doc else 0

    if current < amount:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. You have {current}, need {amount}. Please buy more credits."
        )

    await db.school_credits.update_one(
        {"school_id": school_id},
        {"$inc": {"credits": -amount, "total_spent": amount}},
        upsert=True
    )

    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "type": "debit",
        "amount": amount,
        "reason": reason,
        "balance_after": current - amount,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "success": True,
        "credits_used": amount,
        "balance": current - amount
    }


# ====================== CANCEL SUBSCRIPTION ======================

@router.post("/cancel/{school_id}")
async def cancel_subscription(school_id: str, reason: str = ""):
    """Cancel subscription (access continues until valid_until date)"""
    await db.subscriptions.update_one(
        {"school_id": school_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancellation_reason": reason
        }}
    )
    return {
        "success": True,
        "message": "Subscription cancelled. Access continues until your billing period ends."
    }
