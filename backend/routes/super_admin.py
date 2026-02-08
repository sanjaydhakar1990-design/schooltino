"""
SUPER ADMIN PANEL - Platform Owner Dashboard
- View all registered schools
- Manage subscriptions & trials
- Track earnings
- Monitor API usage (OpenAI, ElevenLabs, Razorpay)
- School analytics
- API Keys Management

SECRET URL: /owner-console-x7k9m2
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from core.database import db
import os
import uuid
import bcrypt
import jwt
from functools import wraps

# SECRET HIDDEN URL - Change this to your preferred secret path
router = APIRouter(prefix="/owner-console-x7k9m2", tags=["Platform Owner"])

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'schooltino-super-secret-key-2026')

# ==================== MODELS ====================

class SuperAdminLogin(BaseModel):
    email: str
    password: str

class SuperAdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    mobile: Optional[str] = None

class SchoolSubscriptionUpdate(BaseModel):
    school_id: str
    plan_type: str  # basic, ai_powered, enterprise
    billing_cycle: str  # monthly, yearly
    status: str  # active, suspended, cancelled, trial
    valid_until: str
    amount: float
    notes: Optional[str] = None

class TrialConfig(BaseModel):
    school_id: str
    trial_days: int
    features: List[str]  # Which features to enable
    notes: Optional[str] = None

class APIKeyConfig(BaseModel):
    service: str  # openai, elevenlabs, razorpay, emergent
    api_key: str
    secret_key: Optional[str] = None  # For Razorpay
    is_active: bool = True
    monthly_limit: Optional[float] = None  # Cost limit
    notes: Optional[str] = None

class SchoolStatusUpdate(BaseModel):
    school_id: str
    status: str  # active, suspended, blocked
    reason: Optional[str] = None

# ==================== AUTHENTICATION ====================

async def verify_super_admin(token: str):
    """Verify super admin token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Not a super admin")
        
        admin = await db.super_admins.find_one({"id": payload.get("sub")})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login")
async def super_admin_login(credentials: SuperAdminLogin):
    """Super Admin Login"""
    admin = await db.super_admins.find_one({"email": credentials.email})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    token_data = {
        "sub": admin["id"],
        "email": admin["email"],
        "role": "super_admin",
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
    
    # Update last login
    await db.super_admins.update_one(
        {"id": admin["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": admin["id"],
            "name": admin["name"],
            "email": admin["email"],
            "role": "super_admin"
        }
    }

@router.post("/create-admin")
async def create_super_admin(admin_data: SuperAdminCreate, master_key: str):
    """Create a new super admin (requires master key)"""
    # Master key for creating first admin
    if master_key != "SCHOOLTINO-MASTER-2026":
        raise HTTPException(status_code=403, detail="Invalid master key")
    
    # Check if email exists
    existing = await db.super_admins.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(admin_data.password.encode(), bcrypt.gensalt()).decode()
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": admin_data.email,
        "password": hashed_password,
        "name": admin_data.name,
        "mobile": admin_data.mobile,
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.super_admins.insert_one(admin_doc)
    admin_doc.pop('_id', None)
    admin_doc.pop('password', None)
    
    return {
        "success": True,
        "message": "Super Admin created successfully",
        "admin": admin_doc
    }

@router.get("/verify")
async def verify_admin_token(token: str):
    """Verify super admin token"""
    admin = await verify_super_admin(token)
    return {
        "valid": True,
        "admin": {
            "id": admin["id"],
            "name": admin["name"],
            "email": admin["email"],
            "role": "super_admin"
        }
    }

# ==================== DASHBOARD ====================

@router.get("/dashboard")
async def get_super_admin_dashboard(token: str):
    """Get main dashboard data"""
    await verify_super_admin(token)
    
    # Get counts
    total_schools = await db.schools.count_documents({})
    active_schools = await db.schools.count_documents({"is_active": True})
    trial_schools = await db.schools.count_documents({"is_trial": True})
    
    total_students = await db.students.count_documents({})
    total_staff = await db.staff.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Get subscriptions
    subscriptions = await db.subscriptions.find({}).to_list(1000)
    
    # Calculate earnings
    total_earnings = sum([s.get("amount", 0) for s in subscriptions if s.get("status") == "active"])
    monthly_earnings = sum([s.get("amount", 0) for s in subscriptions 
                          if s.get("status") == "active" and s.get("billing_cycle") == "monthly"])
    yearly_earnings = sum([s.get("amount", 0) for s in subscriptions 
                         if s.get("status") == "active" and s.get("billing_cycle") == "yearly"])
    
    # Plan distribution
    plan_counts = {
        "basic": await db.subscriptions.count_documents({"plan_type": "basic", "status": "active"}),
        "ai_powered": await db.subscriptions.count_documents({"plan_type": "ai_powered", "status": "active"}),
        "enterprise": await db.subscriptions.count_documents({"plan_type": "enterprise", "status": "active"})
    }
    
    # Recent registrations (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_schools = await db.schools.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Issues/Complaints
    open_issues = await db.support_tickets.count_documents({"status": {"$in": ["open", "pending"]}})
    
    return {
        "schools": {
            "total": total_schools,
            "active": active_schools,
            "trial": trial_schools,
            "recent_30_days": recent_schools
        },
        "users": {
            "total_students": total_students,
            "total_staff": total_staff,
            "total_users": total_users
        },
        "earnings": {
            "total": total_earnings,
            "monthly_recurring": monthly_earnings,
            "yearly_recurring": yearly_earnings,
            "currency": "INR"
        },
        "subscriptions": {
            "by_plan": plan_counts,
            "total_active": sum(plan_counts.values())
        },
        "support": {
            "open_issues": open_issues
        },
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

# ==================== SCHOOLS MANAGEMENT ====================

@router.get("/schools")
async def get_all_schools(
    token: str,
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all registered schools with pagination"""
    await verify_super_admin(token)
    
    query = {}
    if status:
        if status == "active":
            query["is_active"] = True
        elif status == "trial":
            query["is_trial"] = True
        elif status == "suspended":
            query["is_active"] = False
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    schools = await db.schools.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    total = await db.schools.count_documents(query)
    
    # Enrich with subscription and stats
    enriched_schools = []
    for school in schools:
        # Get subscription
        subscription = await db.subscriptions.find_one(
            {"school_id": school["id"]}, 
            {"_id": 0}
        )
        
        # Get counts
        student_count = await db.students.count_documents({"school_id": school["id"]})
        staff_count = await db.staff.count_documents({"school_id": school["id"]})
        
        school["subscription"] = subscription
        school["stats"] = {
            "students": student_count,
            "staff": staff_count
        }
        enriched_schools.append(school)
    
    return {
        "schools": enriched_schools,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@router.get("/schools/{school_id}")
async def get_school_details(school_id: str, token: str):
    """Get detailed information about a specific school"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Get subscription
    subscription = await db.subscriptions.find_one({"school_id": school_id}, {"_id": 0})
    
    # Get payment history
    payments = await db.subscription_payments.find(
        {"school_id": school_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    # Get users
    director = await db.users.find_one({"school_id": school_id, "role": "director"}, {"_id": 0, "password": 0})
    staff_count = await db.staff.count_documents({"school_id": school_id})
    student_count = await db.students.count_documents({"school_id": school_id})
    
    # Get support tickets
    tickets = await db.support_tickets.find(
        {"school_id": school_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    # Activity log
    recent_activity = await db.audit_logs.find(
        {"school_id": school_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(20)
    
    return {
        "school": school,
        "subscription": subscription,
        "payments": payments,
        "director": director,
        "stats": {
            "staff": staff_count,
            "students": student_count
        },
        "support_tickets": tickets,
        "recent_activity": recent_activity
    }

@router.put("/schools/{school_id}/status")
async def update_school_status(school_id: str, update: SchoolStatusUpdate, token: str):
    """Update school status (activate/suspend/block)"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    update_data = {
        "is_active": update.status == "active",
        "status": update.status,
        "status_reason": update.reason,
        "status_updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.schools.update_one({"id": school_id}, {"$set": update_data})
    
    # Log action
    await db.admin_actions.insert_one({
        "id": str(uuid.uuid4()),
        "action": "school_status_update",
        "school_id": school_id,
        "old_status": school.get("status", "active"),
        "new_status": update.status,
        "reason": update.reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"School status updated to {update.status}",
        "school_id": school_id
    }

# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.get("/subscriptions")
async def get_all_subscriptions(token: str, status: Optional[str] = None):
    """Get all subscriptions"""
    await verify_super_admin(token)
    
    query = {}
    if status:
        query["status"] = status
    
    subscriptions = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with school names
    for sub in subscriptions:
        school = await db.schools.find_one({"id": sub.get("school_id")}, {"name": 1, "_id": 0})
        sub["school_name"] = school.get("name") if school else "Unknown"
    
    return {
        "total": len(subscriptions),
        "subscriptions": subscriptions
    }

@router.put("/subscriptions/{school_id}")
async def update_subscription(school_id: str, update: SchoolSubscriptionUpdate, token: str):
    """Update school subscription"""
    await verify_super_admin(token)
    
    # Get current subscription
    current = await db.subscriptions.find_one({"school_id": school_id})
    
    subscription_data = {
        "school_id": school_id,
        "plan_type": update.plan_type,
        "billing_cycle": update.billing_cycle,
        "status": update.status,
        "valid_until": update.valid_until,
        "amount": update.amount,
        "notes": update.notes,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if current:
        await db.subscriptions.update_one(
            {"school_id": school_id},
            {"$set": subscription_data}
        )
    else:
        subscription_data["id"] = str(uuid.uuid4())
        subscription_data["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.subscriptions.insert_one(subscription_data)
    
    # Update school's subscription info
    await db.schools.update_one(
        {"id": school_id},
        {"$set": {
            "subscription_plan": update.plan_type,
            "subscription_status": update.status,
            "subscription_valid_until": update.valid_until,
            "is_trial": update.status == "trial"
        }}
    )
    
    return {
        "success": True,
        "message": "Subscription updated successfully",
        "subscription": subscription_data
    }

@router.post("/subscriptions/{school_id}/extend-trial")
async def extend_trial(school_id: str, days: int, token: str):
    """Extend trial period for a school"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    new_end_date = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    
    await db.schools.update_one(
        {"id": school_id},
        {"$set": {
            "trial_end_date": new_end_date,
            "is_trial": True
        }}
    )
    
    await db.subscriptions.update_one(
        {"school_id": school_id},
        {"$set": {
            "status": "trial",
            "valid_until": new_end_date
        }},
        upsert=True
    )
    
    return {
        "success": True,
        "message": f"Trial extended by {days} days",
        "new_end_date": new_end_date
    }

# ==================== EARNINGS & PAYMENTS ====================

@router.get("/earnings")
async def get_earnings_report(token: str, period: str = "all"):
    """Get earnings report"""
    await verify_super_admin(token)
    
    query = {}
    if period == "month":
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        query["created_at"] = {"$gte": start_date}
    elif period == "year":
        start_date = (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
        query["created_at"] = {"$gte": start_date}
    
    payments = await db.subscription_payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    total_earnings = sum([p.get("amount", 0) for p in payments if p.get("status") == "success"])
    pending_payments = sum([p.get("amount", 0) for p in payments if p.get("status") == "pending"])
    
    # Monthly breakdown
    monthly_data = {}
    for payment in payments:
        if payment.get("status") == "success":
            month = payment.get("created_at", "")[:7]  # YYYY-MM
            if month not in monthly_data:
                monthly_data[month] = 0
            monthly_data[month] += payment.get("amount", 0)
    
    return {
        "total_earnings": total_earnings,
        "pending_payments": pending_payments,
        "total_transactions": len(payments),
        "monthly_breakdown": monthly_data,
        "recent_payments": payments[:20]
    }

# ==================== SUPPORT TICKETS ====================

@router.get("/support-tickets")
async def get_support_tickets(token: str, status: Optional[str] = None):
    """Get all support tickets"""
    await verify_super_admin(token)
    
    query = {}
    if status:
        query["status"] = status
    
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with school names
    for ticket in tickets:
        school = await db.schools.find_one({"id": ticket.get("school_id")}, {"name": 1, "_id": 0})
        ticket["school_name"] = school.get("name") if school else "Unknown"
    
    return {
        "total": len(tickets),
        "open": sum(1 for t in tickets if t.get("status") in ["open", "pending"]),
        "tickets": tickets
    }

@router.put("/support-tickets/{ticket_id}")
async def update_ticket(ticket_id: str, status: str, response: Optional[str], token: str):
    """Update support ticket"""
    await verify_super_admin(token)
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if response:
        update_data["admin_response"] = response
        update_data["responded_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.support_tickets.update_one(
        {"id": ticket_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {
        "success": True,
        "message": "Ticket updated"
    }

# ==================== ANALYTICS ====================

@router.get("/analytics")
async def get_analytics(token: str):
    """Get platform analytics"""
    await verify_super_admin(token)
    
    # School growth over time
    schools = await db.schools.find({}, {"created_at": 1, "_id": 0}).to_list(1000)
    
    growth_data = {}
    for school in schools:
        month = school.get("created_at", "")[:7]
        if month:
            growth_data[month] = growth_data.get(month, 0) + 1
    
    # Feature usage
    tino_brain_queries = await db.tino_queries.count_documents({})
    papers_generated = await db.generated_papers.count_documents({})
    
    # Most active schools (by login count)
    active_schools = await db.audit_logs.aggregate([
        {"$match": {"action": "login"}},
        {"$group": {"_id": "$school_id", "logins": {"$sum": 1}}},
        {"$sort": {"logins": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    return {
        "school_growth": growth_data,
        "feature_usage": {
            "tino_brain_queries": tino_brain_queries,
            "ai_papers_generated": papers_generated
        },
        "most_active_schools": active_schools
    }

# ==================== QUICK ACTIONS ====================

@router.post("/quick-actions/message-all")
async def message_all_schools(message: str, subject: str, token: str):
    """Send message to all schools"""
    await verify_super_admin(token)
    
    # Create system notice for all schools
    notice = {
        "id": str(uuid.uuid4()),
        "type": "system_announcement",
        "subject": subject,
        "message": message,
        "for_all_schools": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.system_notices.insert_one(notice)
    
    schools_count = await db.schools.count_documents({})
    
    return {
        "success": True,
        "message": f"Notice sent to {schools_count} schools"
    }

# ==================== TRIAL CONTROL ====================

@router.post("/trial/start/{school_id}")
async def start_school_trial(school_id: str, days: int, features: str, token: str):
    """Put a school on trial period with specific features"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    trial_end = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    feature_list = [f.strip() for f in features.split(",")] if features else ["all"]
    
    # Update school
    await db.schools.update_one(
        {"id": school_id},
        {"$set": {
            "is_trial": True,
            "is_active": True,
            "trial_start_date": datetime.now(timezone.utc).isoformat(),
            "trial_end_date": trial_end,
            "trial_features": feature_list,
            "subscription_status": "trial"
        }}
    )
    
    # Create/Update subscription record
    await db.subscriptions.update_one(
        {"school_id": school_id},
        {"$set": {
            "school_id": school_id,
            "status": "trial",
            "plan_type": "trial",
            "valid_until": trial_end,
            "trial_features": feature_list,
            "amount": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Log action
    await db.admin_actions.insert_one({
        "id": str(uuid.uuid4()),
        "action": "start_trial",
        "school_id": school_id,
        "school_name": school.get("name"),
        "trial_days": days,
        "features": feature_list,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"Trial started for {school.get('name')} - {days} days",
        "trial_end": trial_end,
        "features": feature_list
    }

@router.post("/trial/convert-to-paid/{school_id}")
async def convert_to_paid(school_id: str, plan_type: str, billing_cycle: str, amount: float, token: str):
    """Convert trial school to paid subscription"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Calculate valid_until based on billing cycle
    if billing_cycle == "monthly":
        valid_until = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    else:  # yearly
        valid_until = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    
    # Update school
    await db.schools.update_one(
        {"id": school_id},
        {"$set": {
            "is_trial": False,
            "is_active": True,
            "subscription_plan": plan_type,
            "subscription_status": "active",
            "subscription_valid_until": valid_until,
            "converted_from_trial": True,
            "converted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update subscription
    await db.subscriptions.update_one(
        {"school_id": school_id},
        {"$set": {
            "status": "active",
            "plan_type": plan_type,
            "billing_cycle": billing_cycle,
            "amount": amount,
            "valid_until": valid_until,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Log action
    await db.admin_actions.insert_one({
        "id": str(uuid.uuid4()),
        "action": "convert_to_paid",
        "school_id": school_id,
        "school_name": school.get("name"),
        "plan_type": plan_type,
        "amount": amount,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"{school.get('name')} converted to {plan_type} plan",
        "subscription": {
            "plan": plan_type,
            "billing_cycle": billing_cycle,
            "amount": amount,
            "valid_until": valid_until
        }
    }

@router.post("/trial/end/{school_id}")
async def end_school_trial(school_id: str, token: str):
    """End trial for a school (deactivate)"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    await db.schools.update_one(
        {"id": school_id},
        {"$set": {
            "is_trial": False,
            "is_active": False,
            "subscription_status": "expired",
            "trial_ended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.subscriptions.update_one(
        {"school_id": school_id},
        {"$set": {"status": "expired"}}
    )
    
    return {
        "success": True,
        "message": f"Trial ended for {school.get('name')}"
    }

# ==================== API KEYS MANAGEMENT ====================

@router.get("/api-keys")
async def get_api_keys(token: str):
    """Get all configured API keys (masked)"""
    await verify_super_admin(token)
    
    keys = await db.platform_api_keys.find({}, {"_id": 0}).to_list(20)
    
    # Mask API keys for security
    for key in keys:
        if key.get("api_key"):
            key["api_key"] = key["api_key"][:8] + "..." + key["api_key"][-4:] if len(key.get("api_key", "")) > 12 else "***"
        if key.get("secret_key"):
            key["secret_key"] = "***hidden***"
    
    return {
        "keys": keys,
        "services": ["openai", "elevenlabs", "razorpay", "emergent", "twilio", "sendgrid"]
    }

@router.post("/api-keys")
async def save_api_key(config: APIKeyConfig, token: str):
    """Save or update an API key"""
    await verify_super_admin(token)
    
    key_data = {
        "service": config.service,
        "api_key": config.api_key,
        "secret_key": config.secret_key,
        "is_active": config.is_active,
        "monthly_limit": config.monthly_limit,
        "notes": config.notes,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if exists
    existing = await db.platform_api_keys.find_one({"service": config.service})
    
    if existing:
        await db.platform_api_keys.update_one(
            {"service": config.service},
            {"$set": key_data}
        )
    else:
        key_data["id"] = str(uuid.uuid4())
        key_data["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.platform_api_keys.insert_one(key_data)
    
    return {
        "success": True,
        "message": f"{config.service} API key saved"
    }

@router.delete("/api-keys/{service}")
async def delete_api_key(service: str, token: str):
    """Delete an API key"""
    await verify_super_admin(token)
    
    result = await db.platform_api_keys.delete_one({"service": service})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"success": True, "message": f"{service} API key deleted"}

# ==================== API USAGE TRACKING ====================

@router.get("/api-usage")
async def get_api_usage(token: str, period: str = "month"):
    """Get API usage statistics across all schools"""
    await verify_super_admin(token)
    
    # Calculate date range
    if period == "week":
        start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    elif period == "month":
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    else:  # all
        start_date = "2020-01-01"
    
    # OpenAI/Emergent LLM Usage (Tino Brain queries)
    tino_queries = await db.tino_queries.find(
        {"timestamp": {"$gte": start_date}},
        {"_id": 0, "school_id": 1, "tokens_used": 1, "cost": 1}
    ).to_list(10000)
    
    openai_total_queries = len(tino_queries)
    openai_total_tokens = sum([q.get("tokens_used", 0) for q in tino_queries])
    openai_estimated_cost = openai_total_tokens * 0.00001  # Approximate cost
    
    # Group by school
    school_openai_usage = {}
    for q in tino_queries:
        sid = q.get("school_id", "unknown")
        if sid not in school_openai_usage:
            school_openai_usage[sid] = {"queries": 0, "tokens": 0, "cost": 0}
        school_openai_usage[sid]["queries"] += 1
        school_openai_usage[sid]["tokens"] += q.get("tokens_used", 0)
        school_openai_usage[sid]["cost"] += q.get("cost", 0)
    
    # ElevenLabs Usage (Voice/TTS)
    voice_usage = await db.voice_usage.find(
        {"timestamp": {"$gte": start_date}},
        {"_id": 0, "school_id": 1, "characters": 1, "cost": 1}
    ).to_list(10000)
    
    elevenlabs_total_chars = sum([v.get("characters", 0) for v in voice_usage])
    elevenlabs_estimated_cost = elevenlabs_total_chars * 0.00003  # Approximate cost
    
    # Group by school
    school_voice_usage = {}
    for v in voice_usage:
        sid = v.get("school_id", "unknown")
        if sid not in school_voice_usage:
            school_voice_usage[sid] = {"requests": 0, "characters": 0, "cost": 0}
        school_voice_usage[sid]["requests"] += 1
        school_voice_usage[sid]["characters"] += v.get("characters", 0)
        school_voice_usage[sid]["cost"] += v.get("cost", 0)
    
    # Razorpay Transactions
    razorpay_txns = await db.fee_payments.find(
        {"created_at": {"$gte": start_date}, "payment_method": {"$ne": "cash"}},
        {"_id": 0, "school_id": 1, "amount": 1, "status": 1}
    ).to_list(10000)
    
    razorpay_total_txns = len(razorpay_txns)
    razorpay_total_amount = sum([t.get("amount", 0) for t in razorpay_txns if t.get("status") == "success"])
    razorpay_fees = razorpay_total_amount * 0.02  # 2% Razorpay fee
    
    # Get school names
    schools = await db.schools.find({}, {"id": 1, "name": 1, "_id": 0}).to_list(500)
    school_names = {s["id"]: s["name"] for s in schools}
    
    # Top consumers
    top_openai_users = sorted(school_openai_usage.items(), key=lambda x: x[1]["tokens"], reverse=True)[:10]
    top_openai_users = [
        {"school_id": k, "school_name": school_names.get(k, "Unknown"), **v}
        for k, v in top_openai_users
    ]
    
    return {
        "period": period,
        "summary": {
            "openai": {
                "total_queries": openai_total_queries,
                "total_tokens": openai_total_tokens,
                "estimated_cost": round(openai_estimated_cost, 2)
            },
            "elevenlabs": {
                "total_requests": len(voice_usage),
                "total_characters": elevenlabs_total_chars,
                "estimated_cost": round(elevenlabs_estimated_cost, 2)
            },
            "razorpay": {
                "total_transactions": razorpay_total_txns,
                "total_amount": round(razorpay_total_amount, 2),
                "estimated_fees": round(razorpay_fees, 2)
            },
            "total_estimated_cost": round(openai_estimated_cost + elevenlabs_estimated_cost + razorpay_fees, 2)
        },
        "top_openai_consumers": top_openai_users,
        "by_school": {
            "openai": school_openai_usage,
            "voice": school_voice_usage
        }
    }

@router.get("/api-usage/school/{school_id}")
async def get_school_api_usage(school_id: str, token: str):
    """Get API usage for a specific school"""
    await verify_super_admin(token)
    
    school = await db.schools.find_one({"id": school_id}, {"_id": 0, "name": 1})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Last 30 days
    start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    # Tino Brain queries
    tino_queries = await db.tino_queries.count_documents({
        "school_id": school_id,
        "timestamp": {"$gte": start_date}
    })
    
    # AI Papers generated
    papers = await db.generated_papers.count_documents({
        "school_id": school_id,
        "created_at": {"$gte": start_date}
    })
    
    # Voice usage
    voice_requests = await db.voice_usage.count_documents({
        "school_id": school_id,
        "timestamp": {"$gte": start_date}
    })
    
    # Fee transactions
    fee_txns = await db.fee_payments.count_documents({
        "school_id": school_id,
        "created_at": {"$gte": start_date}
    })
    
    return {
        "school_id": school_id,
        "school_name": school.get("name"),
        "period": "last_30_days",
        "usage": {
            "tino_brain_queries": tino_queries,
            "ai_papers_generated": papers,
            "voice_requests": voice_requests,
            "fee_transactions": fee_txns
        },
        "estimated_costs": {
            "openai": round(tino_queries * 0.002, 2),  # ~$0.002 per query
            "elevenlabs": round(voice_requests * 0.01, 2),  # ~$0.01 per request
            "total": round(tino_queries * 0.002 + voice_requests * 0.01, 2)
        }
    }

# ==================== COST ALERTS ====================

@router.get("/cost-alerts")
async def get_cost_alerts(token: str):
    """Get cost alerts and high usage warnings"""
    await verify_super_admin(token)
    
    alerts = []
    
    # Check schools with high usage
    start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    # Get all schools
    schools = await db.schools.find({}, {"id": 1, "name": 1, "_id": 0}).to_list(500)
    
    for school in schools:
        queries = await db.tino_queries.count_documents({
            "school_id": school["id"],
            "timestamp": {"$gte": start_date}
        })
        
        if queries > 500:  # High usage threshold
            alerts.append({
                "type": "high_openai_usage",
                "severity": "warning" if queries < 1000 else "critical",
                "school_id": school["id"],
                "school_name": school["name"],
                "metric": f"{queries} queries in 7 days",
                "estimated_cost": f"₹{round(queries * 0.15, 2)}"
            })
    
    # Check API key limits
    api_keys = await db.platform_api_keys.find({}, {"_id": 0}).to_list(20)
    for key in api_keys:
        if key.get("monthly_limit"):
            # Check current usage against limit
            # This would need actual tracking
            pass
    
    return {
        "total_alerts": len(alerts),
        "critical": sum(1 for a in alerts if a.get("severity") == "critical"),
        "warnings": sum(1 for a in alerts if a.get("severity") == "warning"),
        "alerts": alerts
    }

# ==================== ADMIN ACTIONS LOG ====================

@router.get("/action-log")
async def get_admin_action_log(token: str, limit: int = 50):
    """Get log of all admin actions"""
    await verify_super_admin(token)
    
    actions = await db.admin_actions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    return {
        "total": len(actions),
        "actions": actions
    }

# ==================== WHATSAPP API MANAGEMENT (BOTBIZ) ====================

class WhatsAppConfig(BaseModel):
    api_key: str
    api_secret: Optional[str] = None
    instance_id: str
    phone_number: str
    webhook_url: Optional[str] = None
    is_active: bool = True

class MessagePackCreate(BaseModel):
    name: str
    messages_count: int
    price: float
    validity_days: int
    description: Optional[str] = None
    is_active: bool = True

class SchoolMessagePack(BaseModel):
    school_id: str
    pack_id: str
    messages_purchased: int
    amount_paid: float
    payment_method: str  # cash, online

@router.get("/whatsapp/config")
async def get_whatsapp_config(token: str):
    """Get WhatsApp API configuration (BotBiz)"""
    await verify_super_admin(token)
    
    config = await db.whatsapp_config.find_one({}, {"_id": 0})
    
    if config and config.get("api_key"):
        # Mask API key
        config["api_key"] = config["api_key"][:8] + "..." + config["api_key"][-4:] if len(config.get("api_key", "")) > 12 else "***"
    
    return {
        "config": config,
        "is_configured": config is not None
    }

@router.post("/whatsapp/config")
async def save_whatsapp_config(config: WhatsAppConfig, token: str):
    """Save WhatsApp API configuration"""
    await verify_super_admin(token)
    
    config_data = {
        "api_key": config.api_key,
        "api_secret": config.api_secret,
        "instance_id": config.instance_id,
        "phone_number": config.phone_number,
        "webhook_url": config.webhook_url,
        "is_active": config.is_active,
        "provider": "botbiz",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing = await db.whatsapp_config.find_one({})
    if existing:
        await db.whatsapp_config.update_one({}, {"$set": config_data})
    else:
        config_data["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.whatsapp_config.insert_one(config_data)
    
    return {
        "success": True,
        "message": "WhatsApp configuration saved"
    }

# ==================== MESSAGE PACKS ====================

@router.get("/whatsapp/packs")
async def get_message_packs(token: str):
    """Get all message packs available for sale"""
    await verify_super_admin(token)
    
    packs = await db.message_packs.find({}, {"_id": 0}).to_list(50)
    
    return {
        "packs": packs
    }

@router.post("/whatsapp/packs")
async def create_message_pack(pack: MessagePackCreate, token: str):
    """Create a new message pack for schools to buy"""
    await verify_super_admin(token)
    
    pack_data = {
        "id": str(uuid.uuid4()),
        "name": pack.name,
        "messages_count": pack.messages_count,
        "price": pack.price,
        "validity_days": pack.validity_days,
        "description": pack.description,
        "is_active": pack.is_active,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.message_packs.insert_one(pack_data)
    pack_data.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Pack '{pack.name}' created",
        "pack": pack_data
    }

@router.put("/whatsapp/packs/{pack_id}")
async def update_message_pack(pack_id: str, pack: MessagePackCreate, token: str):
    """Update a message pack"""
    await verify_super_admin(token)
    
    await db.message_packs.update_one(
        {"id": pack_id},
        {"$set": {
            "name": pack.name,
            "messages_count": pack.messages_count,
            "price": pack.price,
            "validity_days": pack.validity_days,
            "description": pack.description,
            "is_active": pack.is_active,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Pack updated"}

@router.delete("/whatsapp/packs/{pack_id}")
async def delete_message_pack(pack_id: str, token: str):
    """Delete a message pack"""
    await verify_super_admin(token)
    
    await db.message_packs.delete_one({"id": pack_id})
    return {"success": True, "message": "Pack deleted"}

# ==================== SCHOOL MESSAGE MANAGEMENT ====================

@router.get("/whatsapp/schools")
async def get_schools_message_status(token: str):
    """Get message balance and usage for all schools"""
    await verify_super_admin(token)
    
    schools = await db.schools.find({}, {"id": 1, "name": 1, "_id": 0}).to_list(500)
    
    school_status = []
    for school in schools:
        # Get message balance
        balance = await db.school_message_balance.find_one(
            {"school_id": school["id"]},
            {"_id": 0}
        )
        
        # Get usage this month
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0).isoformat()
        usage = await db.whatsapp_messages.count_documents({
            "school_id": school["id"],
            "sent_at": {"$gte": start_of_month}
        })
        
        school_status.append({
            "school_id": school["id"],
            "school_name": school["name"],
            "balance": balance.get("balance", 0) if balance else 0,
            "usage_this_month": usage,
            "last_purchase": balance.get("last_purchase") if balance else None
        })
    
    return {
        "total_schools": len(schools),
        "schools": school_status
    }

@router.post("/whatsapp/assign-pack")
async def assign_message_pack_to_school(assignment: SchoolMessagePack, token: str):
    """Assign a message pack to a school (manual sale)"""
    await verify_super_admin(token)
    
    # Get pack details
    pack = await db.message_packs.find_one({"id": assignment.pack_id})
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    
    # Get school
    school = await db.schools.find_one({"id": assignment.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Calculate expiry
    expiry = (datetime.now(timezone.utc) + timedelta(days=pack.get("validity_days", 30))).isoformat()
    
    # Create purchase record
    purchase = {
        "id": str(uuid.uuid4()),
        "school_id": assignment.school_id,
        "school_name": school.get("name"),
        "pack_id": assignment.pack_id,
        "pack_name": pack.get("name"),
        "messages_purchased": assignment.messages_purchased or pack.get("messages_count"),
        "amount_paid": assignment.amount_paid,
        "payment_method": assignment.payment_method,
        "validity_until": expiry,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.message_purchases.insert_one(purchase)
    
    # Update school balance
    current_balance = await db.school_message_balance.find_one({"school_id": assignment.school_id})
    new_balance = (current_balance.get("balance", 0) if current_balance else 0) + purchase["messages_purchased"]
    
    await db.school_message_balance.update_one(
        {"school_id": assignment.school_id},
        {"$set": {
            "school_id": assignment.school_id,
            "balance": new_balance,
            "last_purchase": datetime.now(timezone.utc).isoformat(),
            "validity_until": expiry
        }},
        upsert=True
    )
    
    return {
        "success": True,
        "message": f"{purchase['messages_purchased']} messages assigned to {school.get('name')}",
        "new_balance": new_balance,
        "purchase": purchase
    }

@router.get("/whatsapp/usage")
async def get_whatsapp_usage(token: str, period: str = "month"):
    """Get WhatsApp message usage statistics"""
    await verify_super_admin(token)
    
    if period == "week":
        start_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    elif period == "month":
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    else:
        start_date = "2020-01-01"
    
    # Total messages sent
    total_messages = await db.whatsapp_messages.count_documents({
        "sent_at": {"$gte": start_date}
    })
    
    # Messages by school
    pipeline = [
        {"$match": {"sent_at": {"$gte": start_date}}},
        {"$group": {"_id": "$school_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    school_usage = await db.whatsapp_messages.aggregate(pipeline).to_list(20)
    
    # Get school names
    schools = await db.schools.find({}, {"id": 1, "name": 1, "_id": 0}).to_list(500)
    school_names = {s["id"]: s["name"] for s in schools}
    
    for usage in school_usage:
        usage["school_name"] = school_names.get(usage["_id"], "Unknown")
    
    # Total purchases this period
    purchases = await db.message_purchases.find(
        {"created_at": {"$gte": start_date}},
        {"_id": 0}
    ).to_list(100)
    
    total_revenue = sum([p.get("amount_paid", 0) for p in purchases])
    
    return {
        "period": period,
        "total_messages_sent": total_messages,
        "total_purchases": len(purchases),
        "total_revenue": total_revenue,
        "top_schools": school_usage,
        "recent_purchases": purchases[:10]
    }

@router.post("/whatsapp/send-broadcast")
async def send_broadcast_message(
    message: str,
    school_ids: Optional[str] = None,  # Comma-separated, or 'all'
    message_type: str = "announcement",  # announcement, subscription, fee_reminder
    token: str = None
):
    """Send broadcast message to schools via WhatsApp"""
    await verify_super_admin(token)
    
    # Get WhatsApp config
    config = await db.whatsapp_config.find_one({})
    if not config or not config.get("is_active"):
        raise HTTPException(status_code=400, detail="WhatsApp not configured")
    
    # Determine target schools
    if school_ids == "all" or not school_ids:
        schools = await db.schools.find({"is_active": True}, {"id": 1, "name": 1, "phone": 1, "_id": 0}).to_list(500)
    else:
        ids = [s.strip() for s in school_ids.split(",")]
        schools = await db.schools.find({"id": {"$in": ids}}, {"id": 1, "name": 1, "phone": 1, "_id": 0}).to_list(100)
    
    # Get directors' phone numbers
    recipients = []
    for school in schools:
        director = await db.users.find_one(
            {"school_id": school["id"], "role": "director"},
            {"mobile": 1, "name": 1, "_id": 0}
        )
        if director and director.get("mobile"):
            recipients.append({
                "school_id": school["id"],
                "school_name": school["name"],
                "phone": director["mobile"],
                "name": director["name"]
            })
    
    # Log broadcast (actual sending would use BotBiz API)
    broadcast = {
        "id": str(uuid.uuid4()),
        "message": message,
        "message_type": message_type,
        "recipients_count": len(recipients),
        "status": "queued",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.whatsapp_broadcasts.insert_one(broadcast)
    
    return {
        "success": True,
        "message": f"Broadcast queued for {len(recipients)} schools",
        "broadcast_id": broadcast["id"],
        "recipients": len(recipients),
        "note": "Messages will be sent via BotBiz API"
    }

@router.get("/whatsapp/purchases/{school_id}")
async def get_school_purchases(school_id: str, token: str):
    """Get purchase history for a school"""
    await verify_super_admin(token)
    
    purchases = await db.message_purchases.find(
        {"school_id": school_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    balance = await db.school_message_balance.find_one(
        {"school_id": school_id},
        {"_id": 0}
    )
    
    return {
        "school_id": school_id,
        "current_balance": balance.get("balance", 0) if balance else 0,
        "validity_until": balance.get("validity_until") if balance else None,
        "purchases": purchases
    }
