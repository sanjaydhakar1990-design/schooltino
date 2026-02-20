"""
DUAL CREDIT SYSTEM - School + Personal Wallets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Problem: School ke 500 credits → 100 students → 2 din mein khatam!

Solution: 2-Level Credit System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEVEL 1 - SCHOOL CREDITS (Admin buys):
   → Shared pool for whole school
   → Basic/emergency use
   → When personal credits = 0

LEVEL 2 - PERSONAL CREDITS (Individual buy):
   → Student/Teacher ka apna wallet
   → Bahut sasta (₹10 se start)
   → UPI/Card se recharge
   → Parents pay kar sakte hain

USAGE PRIORITY:
   1. Personal credits use first
   2. If personal = 0 → School credits use
   3. If both = 0 → Soft limit (warning + works)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal
from motor.motor_asyncio import AsyncIOMotorClient
import httpx

router = APIRouter(prefix="/dual-credits", tags=["Dual Credits"])

# ── DB
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME   = os.environ.get("DB_NAME", "schooltino")
_client   = AsyncIOMotorClient(MONGO_URL)
db        = _client[DB_NAME]

# ══════════════════════════════════════════
#  SCHOOL PLANS (Admin Level) - WITH FREE CREDITS PER USER
# ══════════════════════════════════════════

SCHOOL_PLANS = {
    "free_trial": {
        "name": "Free Trial / मुफ्त ट्रायल",
        "school_credits": 100,
        "per_user_credits": 5,    # Har student/teacher ko 5 free
        "price": 0,
        "validity_days": 30,
        "description": "100 school credits + 5 credits har user ko"
    },
    "starter": {
        "name": "Starter Plan / शुरुआती",
        "school_credits": 500,
        "per_user_credits": 10,   # Har user ko 10 free
        "price": 499,
        "validity_days": 90,
        "description": "500 school + 10 credits per student/teacher"
    },
    "growth": {
        "name": "Growth Plan / विकास",
        "school_credits": 1000,
        "per_user_credits": 20,   # Har user ko 20 free
        "price": 999,
        "validity_days": 90,
        "description": "1000 school + 20 credits per student/teacher"
    },
    "premium": {
        "name": "Premium Plan / प्रीमियम",
        "school_credits": 2000,
        "per_user_credits": 50,   # Har user ko 50 free
        "price": 1999,
        "validity_days": 180,
        "description": "2000 school + 50 credits per student/teacher"
    }
}

# ══════════════════════════════════════════
#  PERSONAL CREDIT PACKS (Individual Level) - BAHUT SASTA!
# ══════════════════════════════════════════

PERSONAL_PACKS = {
    "mini": {
        "name": "Mini Pack / छोटा पैक",
        "credits": 20,
        "price": 10,
        "description": "20 credits sirf ₹10 mein!",
        "best_for": "Students - 1 week ke liye"
    },
    "student": {
        "name": "Student Pack / विद्यार्थी पैक",
        "credits": 50,
        "price": 20,
        "description": "50 credits ₹20 - Most Popular!",
        "best_for": "Students - 1 month"
    },
    "teacher": {
        "name": "Teacher Pack / शिक्षक पैक",
        "credits": 100,
        "price": 35,
        "description": "100 credits ₹35",
        "best_for": "Teachers - unlimited use"
    },
    "mega": {
        "name": "Mega Pack / मेगा पैक",
        "credits": 500,
        "price": 150,
        "description": "500 credits ₹150 - Best Value!",
        "best_for": "Heavy users - 3 months"
    }
}

# ══════════════════════════════════════════
#  PRICING ANALYSIS
# ══════════════════════════════════════════

"""
PRICING LOGIC:

School Credits (Bulk Rate):
   ₹499 for 500 = ₹0.998 per credit
   Purpose: Shared resources, backups

Personal Credits (Individual Rate):
   ₹20 for 50 = ₹0.40 per credit (60% cheaper!)
   ₹10 for 20 = ₹0.50 per credit
   
Why cheaper for individuals?
   → Encourages self-recharge
   → Reduces school burden
   → More revenue from micro-transactions
   → Students feel ownership

EXAMPLE SCENARIO:
School: 100 students
Admin buys: Starter Plan (₹499)
   → 500 school credits
   → 10 credits per student (100 × 10 = 1000 credits distributed)
   
Total available: 1500 credits (500 + 1000)
Cost to school: ₹499

If students recharge ₹20 each:
   → 100 × 50 = 5000 more credits
   → Total: 6500 credits
   → School + students both happy!
"""

# ══════════════════════════════════════════
#  CREDIT COSTS (Same as before)
# ══════════════════════════════════════════

CREDIT_COSTS = {
    # AI Features
    "ai_study_chat":         2,
    "ai_teacher_assistant":  3,
    "ai_auto_timetable":     10,
    "ai_report_generation":  5,
    
    # Communication
    "whatsapp_message":      1,
    "sms_message":           1,
    "bulk_notification":     0.5,
    "fee_reminder":          1,
    
    # Advanced Features
    "face_recognition_scan": 2,
    "admit_card_generate":   1,
    "id_card_print":         1,
    "online_exam":           5,
    
    # FREE (no credits)
    "basic_attendance":      0,
    "basic_notice":          0,
    "student_profile_view":  0,
    "class_management":      0,
}

# ══════════════════════════════════════════
#  Models
# ══════════════════════════════════════════

class PurchaseSchoolPlan(BaseModel):
    school_id:      str
    plan_id:        str
    payment_method: str
    razorpay_order_id:    Optional[str] = None
    razorpay_payment_id:  Optional[str] = None
    razorpay_signature:   Optional[str] = None

class PurchasePersonalPack(BaseModel):
    user_id:        str
    user_type:      Literal["student", "teacher"]
    school_id:      str
    pack_id:        str
    payment_method: str
    razorpay_order_id:    Optional[str] = None
    razorpay_payment_id:  Optional[str] = None
    razorpay_signature:   Optional[str] = None

class UseCreditsRequest(BaseModel):
    school_id:    str
    user_id:      str
    user_type:    Literal["student", "teacher", "admin"]
    feature:      str
    count:        int = 1
    description:  Optional[str] = None

# ══════════════════════════════════════════
#  GET /dual-credits/plans
# ══════════════════════════════════════════

@router.get("/plans")
async def get_all_plans():
    """Return both school plans and personal packs."""
    return {
        "school_plans": SCHOOL_PLANS,
        "personal_packs": PERSONAL_PACKS,
        "credit_costs": CREDIT_COSTS,
        "pricing_note": "Personal credits 60% saste hain school credits se!"
    }

# ══════════════════════════════════════════
#  GET /dual-credits/balance/{school_id}/{user_id}
# ══════════════════════════════════════════

@router.get("/balance/{school_id}/{user_id}")
async def get_user_balance(school_id: str, user_id: str):
    """Get both school credits and personal credits for a user."""
    
    # School credits
    school_balance = await db.school_credits.find_one(
        {"school_id": school_id}, {"_id": 0}
    )
    
    # Personal credits
    personal_balance = await db.personal_credits.find_one(
        {"user_id": user_id, "school_id": school_id}, {"_id": 0}
    )
    
    if not personal_balance:
        # Auto-create personal wallet
        personal_balance = {
            "user_id": user_id,
            "school_id": school_id,
            "total_credits": 0,
            "used_credits": 0,
            "available_credits": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.personal_credits.insert_one(personal_balance)
    
    return {
        "school_credits": school_balance.get("available_credits", 0) if school_balance else 0,
        "personal_credits": personal_balance.get("available_credits", 0),
        "total_available": (
            (school_balance.get("available_credits", 0) if school_balance else 0) + 
            personal_balance.get("available_credits", 0)
        ),
        "usage_priority": "Personal credits first → School credits → Soft limit",
        "personal_wallet": personal_balance,
        "school_wallet": school_balance
    }

# ══════════════════════════════════════════
#  POST /dual-credits/school/create-order
# ══════════════════════════════════════════

@router.post("/school/create-order")
async def create_school_plan_order(school_id: str, plan_id: str):
    """Create Razorpay order for school plan purchase."""
    plan = SCHOOL_PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    if plan["price"] == 0:
        raise HTTPException(status_code=400, detail="Free trial doesn't need payment")
    
    school = await db.schools.find_one({"school_id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if not razorpay_key_id or not razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    import base64
    auth = base64.b64encode(f"{razorpay_key_id}:{razorpay_key_secret}".encode()).decode()
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.razorpay.com/v1/orders",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/json"
            },
            json={
                "amount": int(plan["price"] * 100),
                "currency": "INR",
                "receipt": f"school_plan_{school_id}_{uuid.uuid4().hex[:8]}",
                "notes": {
                    "school_id": school_id,
                    "school_name": school.get("name", "School"),
                    "plan_id": plan_id,
                    "plan_name": plan["name"]
                }
            }
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Razorpay order failed")
        
        order = resp.json()
    
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": razorpay_key_id,
        "plan": plan
    }

# ══════════════════════════════════════════
#  POST /dual-credits/school/verify-payment
# ══════════════════════════════════════════

@router.post("/school/verify-payment")
async def verify_school_plan(req: PurchaseSchoolPlan):
    """Verify payment and activate school plan + distribute per-user credits."""
    plan = SCHOOL_PLANS.get(req.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Verify Razorpay signature
    if req.payment_method == "razorpay":
        if not all([req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature]):
            raise HTTPException(status_code=400, detail="Razorpay details missing")
        
        import hmac, hashlib
        razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
        generated_sig = hmac.new(
            razorpay_secret.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_sig != req.razorpay_signature:
            raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update school credits
    expiry = (datetime.now(timezone.utc) + timedelta(days=plan["validity_days"])).isoformat()
    
    current = await db.school_credits.find_one({"school_id": req.school_id})
    if current:
        await db.school_credits.update_one(
            {"school_id": req.school_id},
            {
                "$inc": {
                    "total_credits": plan["school_credits"],
                    "available_credits": plan["school_credits"]
                },
                "$set": {
                    "current_plan": req.plan_id,
                    "plan_expiry": expiry,
                    "last_purchase": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    else:
        await db.school_credits.insert_one({
            "school_id": req.school_id,
            "total_credits": plan["school_credits"],
            "used_credits": 0,
            "available_credits": plan["school_credits"],
            "current_plan": req.plan_id,
            "plan_expiry": expiry,
            "last_purchase": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Distribute per-user credits to all students & teachers
    students = await db.students.find(
        {"school_id": req.school_id, "status": "active"}, 
        {"id": 1, "student_id": 1, "name": 1}
    ).to_list(1000)
    
    teachers = await db.users.find(
        {"school_id": req.school_id, "role": {"$in": ["teacher", "principal"]}},
        {"id": 1, "name": 1}
    ).to_list(200)
    
    users_to_credit = []
    for student in students:
        users_to_credit.append({
            "user_id": student.get("id") or student.get("student_id"),
            "user_type": "student",
            "name": student.get("name")
        })
    
    for teacher in teachers:
        users_to_credit.append({
            "user_id": teacher.get("id"),
            "user_type": "teacher",
            "name": teacher.get("name")
        })
    
    distributed_count = 0
    for user in users_to_credit:
        existing = await db.personal_credits.find_one({
            "user_id": user["user_id"],
            "school_id": req.school_id
        })
        
        if existing:
            await db.personal_credits.update_one(
                {"user_id": user["user_id"], "school_id": req.school_id},
                {"$inc": {
                    "total_credits": plan["per_user_credits"],
                    "available_credits": plan["per_user_credits"]
                }}
            )
        else:
            await db.personal_credits.insert_one({
                "user_id": user["user_id"],
                "user_type": user["user_type"],
                "school_id": req.school_id,
                "total_credits": plan["per_user_credits"],
                "used_credits": 0,
                "available_credits": plan["per_user_credits"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        distributed_count += 1
    
    # Record transaction
    school = await db.schools.find_one({"school_id": req.school_id})
    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": req.school_id,
        "school_name": school.get("name") if school else "Unknown",
        "type": "school_plan_purchase",
        "plan_id": req.plan_id,
        "plan_name": plan["name"],
        "school_credits": plan["school_credits"],
        "per_user_credits": plan["per_user_credits"],
        "users_credited": distributed_count,
        "amount_paid": plan["price"],
        "payment_method": req.payment_method,
        "razorpay_order_id": req.razorpay_order_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"✅ {plan['name']} activated!",
        "school_credits_added": plan["school_credits"],
        "users_credited": distributed_count,
        "credits_per_user": plan["per_user_credits"],
        "total_credits_distributed": distributed_count * plan["per_user_credits"],
        "plan_expiry": expiry
    }

# ══════════════════════════════════════════
#  POST /dual-credits/personal/create-order
# ══════════════════════════════════════════

@router.post("/personal/create-order")
async def create_personal_pack_order(user_id: str, pack_id: str):
    """Create Razorpay order for personal credit pack."""
    pack = PERSONAL_PACKS.get(pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if not razorpay_key_id or not razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    import base64
    auth = base64.b64encode(f"{razorpay_key_id}:{razorpay_key_secret}".encode()).decode()
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.razorpay.com/v1/orders",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/json"
            },
            json={
                "amount": int(pack["price"] * 100),
                "currency": "INR",
                "receipt": f"personal_{user_id}_{uuid.uuid4().hex[:8]}",
                "notes": {
                    "user_id": user_id,
                    "pack_id": pack_id,
                    "pack_name": pack["name"]
                }
            }
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail="Razorpay order failed")
        
        order = resp.json()
    
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": razorpay_key_id,
        "pack": pack
    }

# ══════════════════════════════════════════
#  POST /dual-credits/personal/verify-payment
# ══════════════════════════════════════════

@router.post("/personal/verify-payment")
async def verify_personal_pack(req: PurchasePersonalPack):
    """Verify payment and add personal credits."""
    pack = PERSONAL_PACKS.get(req.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    
    # Verify Razorpay
    if req.payment_method == "razorpay":
        if not all([req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature]):
            raise HTTPException(status_code=400, detail="Razorpay details missing")
        
        import hmac, hashlib
        razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
        generated_sig = hmac.new(
            razorpay_secret.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_sig != req.razorpay_signature:
            raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Add credits to personal wallet
    existing = await db.personal_credits.find_one({
        "user_id": req.user_id,
        "school_id": req.school_id
    })
    
    if existing:
        await db.personal_credits.update_one(
            {"user_id": req.user_id, "school_id": req.school_id},
            {"$inc": {
                "total_credits": pack["credits"],
                "available_credits": pack["credits"]
            }}
        )
    else:
        await db.personal_credits.insert_one({
            "user_id": req.user_id,
            "user_type": req.user_type,
            "school_id": req.school_id,
            "total_credits": pack["credits"],
            "used_credits": 0,
            "available_credits": pack["credits"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Record transaction
    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "user_type": req.user_type,
        "school_id": req.school_id,
        "type": "personal_pack_purchase",
        "pack_id": req.pack_id,
        "pack_name": pack["name"],
        "credits": pack["credits"],
        "amount_paid": pack["price"],
        "payment_method": req.payment_method,
        "razorpay_order_id": req.razorpay_order_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"✅ {pack['credits']} credits added!",
        "pack_name": pack["name"],
        "credits_added": pack["credits"],
        "amount_paid": pack["price"]
    }

# ══════════════════════════════════════════
#  POST /dual-credits/use (DUAL PRIORITY)
# ══════════════════════════════════════════

@router.post("/use")
async def use_credits_dual(req: UseCreditsRequest):
    """
    Use credits with PRIORITY SYSTEM:
    1. Try personal credits first
    2. If not enough, use school credits
    3. If both zero, soft limit (still works)
    """
    cost_per_use = CREDIT_COSTS.get(req.feature, 1)
    total_cost = cost_per_use * req.count
    
    if total_cost == 0:
        return {"success": True, "credits_used": 0, "message": "Free feature"}
    
    # Get both balances
    personal = await db.personal_credits.find_one({
        "user_id": req.user_id,
        "school_id": req.school_id
    })
    
    school = await db.school_credits.find_one({"school_id": req.school_id})
    
    personal_avail = personal.get("available_credits", 0) if personal else 0
    school_avail = school.get("available_credits", 0) if school else 0
    
    # PRIORITY LOGIC
    used_from_personal = 0
    used_from_school = 0
    warning = None
    
    if personal_avail >= total_cost:
        # Enough in personal wallet
        used_from_personal = total_cost
        await db.personal_credits.update_one(
            {"user_id": req.user_id, "school_id": req.school_id},
            {"$inc": {"available_credits": -total_cost, "used_credits": total_cost}}
        )
        
        if personal_avail - total_cost <= 10:
            warning = f"⚠️ Only {personal_avail - total_cost} personal credits left! ₹{PERSONAL_PACKS['mini']['price']} se recharge karein."
    
    elif personal_avail + school_avail >= total_cost:
        # Use personal + school combination
        used_from_personal = personal_avail
        used_from_school = total_cost - personal_avail
        
        if personal:
            await db.personal_credits.update_one(
                {"user_id": req.user_id, "school_id": req.school_id},
                {"$inc": {"available_credits": -used_from_personal, "used_credits": used_from_personal}}
            )
        
        await db.school_credits.update_one(
            {"school_id": req.school_id},
            {"$inc": {"available_credits": -used_from_school, "used_credits": used_from_school}}
        )
        
        warning = f"⚠️ Personal credits finished. Used {used_from_school} from school pool. Recharge karo!"
    
    else:
        # SOFT LIMIT - both zero but still work
        warning = f"❌ Dono credits khatam! Personal: {personal_avail}, School: {school_avail}. Feature chalega but urgent recharge karein!"
    
    # Record usage
    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "user_type": req.user_type,
        "school_id": req.school_id,
        "type": "usage",
        "feature": req.feature,
        "credits_used": total_cost,
        "used_from_personal": used_from_personal,
        "used_from_school": used_from_school,
        "count": req.count,
        "description": req.description,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "credits_used": total_cost,
        "used_from_personal": used_from_personal,
        "used_from_school": used_from_school,
        "remaining_personal": max(0, personal_avail - used_from_personal),
        "remaining_school": max(0, school_avail - used_from_school),
        "warning": warning
    }

# ══════════════════════════════════════════
#  GET /dual-credits/usage-stats/{school_id}/{user_id}
# ══════════════════════════════════════════

@router.get("/usage-stats/{school_id}/{user_id}")
async def get_user_usage_stats(school_id: str, user_id: str, days: int = 30):
    """Get detailed usage breakdown for a user."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    usage_records = await db.credit_transactions.find({
        "user_id": user_id,
        "school_id": school_id,
        "type": "usage",
        "created_at": {"$gte": cutoff}
    }).to_list(500)
    
    # Group by feature
    breakdown = {}
    total_personal = 0
    total_school = 0
    
    for rec in usage_records:
        feat = rec.get("feature", "unknown")
        breakdown[feat] = breakdown.get(feat, 0) + rec.get("credits_used", 0)
        total_personal += rec.get("used_from_personal", 0)
        total_school += rec.get("used_from_school", 0)
    
    return {
        "user_id": user_id,
        "school_id": school_id,
        "period_days": days,
        "total_used": total_personal + total_school,
        "used_from_personal": total_personal,
        "used_from_school": total_school,
        "breakdown_by_feature": breakdown,
        "top_features": sorted(breakdown.items(), key=lambda x: x[1], reverse=True)[:5]
    }

# ══════════════════════════════════════════
#  GET /dual-credits/school-summary/{school_id}
# ══════════════════════════════════════════

@router.get("/school-summary/{school_id}")
async def get_school_credit_summary(school_id: str):
    """Admin view: Total personal + school credits for whole school."""
    
    # School credits
    school_balance = await db.school_credits.find_one(
        {"school_id": school_id}, {"_id": 0}
    )
    
    # All personal wallets
    personal_wallets = await db.personal_credits.find(
        {"school_id": school_id}, {"_id": 0}
    ).to_list(1000)
    
    total_personal = sum(w.get("available_credits", 0) for w in personal_wallets)
    
    # Usage last 30 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    usage = await db.credit_transactions.find({
        "school_id": school_id,
        "type": "usage",
        "created_at": {"$gte": cutoff}
    }).to_list(5000)
    
    total_used_personal = sum(u.get("used_from_personal", 0) for u in usage)
    total_used_school = sum(u.get("used_from_school", 0) for u in usage)
    
    return {
        "school_id": school_id,
        "school_credits_available": school_balance.get("available_credits", 0) if school_balance else 0,
        "total_personal_credits": total_personal,
        "total_available": (school_balance.get("available_credits", 0) if school_balance else 0) + total_personal,
        "users_with_credits": len([w for w in personal_wallets if w.get("available_credits", 0) > 0]),
        "total_users": len(personal_wallets),
        "last_30_days": {
            "used_from_personal": total_used_personal,
            "used_from_school": total_used_school,
            "total_used": total_used_personal + total_used_school
        }
    }
