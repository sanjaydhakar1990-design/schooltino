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
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import bcrypt
import jwt
from functools import wraps

# SECRET HIDDEN URL - Change this to your preferred secret path
router = APIRouter(prefix="/owner-console-x7k9m2", tags=["Platform Owner"])

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'schooltino')
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[db_name]

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
