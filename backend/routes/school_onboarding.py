"""
school_onboarding.py - School Self-Registration & Onboarding
=============================================================

ANY school can sign up on their own — no manual setup by platform admin needed.

FLOW:
  Step 1: POST /onboarding/register     → School registers, gets 14-day trial
  Step 2: POST /onboarding/verify-email → Verify email OTP
  Step 3: GET  /onboarding/setup-guide  → Step-by-step setup guide
  Step 4: POST /onboarding/complete     → Mark onboarding complete

CONNECTED PLATFORMS:
  - SchoolTino: Admin/Director portal → /dashboard
  - TeachTino:  Teacher/Staff portal  → /teach
  - StudyTino:  Student portal        → /study
  - ParentTino: Parent portal         → /parent
"""

import uuid
import logging
import random
import string
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

from core.database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["School Onboarding"])


# ====================== MODELS ======================

class SchoolRegisterRequest(BaseModel):
    # Director info
    director_name: str
    director_email: EmailStr
    director_mobile: str
    password: str

    # School info
    school_name: str
    school_city: str
    school_state: str
    school_board: str = "CBSE"    # CBSE, ICSE, State Board, IGCSE, IB
    school_type: str = "private"  # private, government, aided, international
    school_phone: Optional[str] = None
    school_address: Optional[str] = None
    total_students_approx: Optional[int] = None   # Helps suggest right plan

    # Platform
    platform_source: str = "website"  # website, google, referral, agent


class VerifyEmailRequest(BaseModel):
    email: str
    otp: str


# ====================== GENERATE UNIQUE SCHOOL CODE ======================

def generate_school_code(school_name: str) -> str:
    """Generate 4-6 char school code from name"""
    words = school_name.upper().split()
    if len(words) >= 3:
        code = "".join(w[0] for w in words[:4])
    elif len(words) == 2:
        code = words[0][:3] + words[1][:2]
    else:
        code = words[0][:5]
    # Add 2 random digits for uniqueness
    code = code[:4] + ''.join(random.choices(string.digits, k=2))
    return code


# ====================== STEP 1: REGISTER ======================

@router.post("/register")
async def register_school(data: SchoolRegisterRequest):
    """
    Register a new school on Schooltino platform.
    - Creates school record
    - Creates director account
    - Starts 14-day FREE trial automatically
    - Sends welcome email
    - No credit card required!
    """
    # Check duplicate email
    existing_user = await db.users.find_one({"email": data.director_email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered. Please login or use a different email."
        )

    # Check duplicate school name in same city
    existing_school = await db.schools.find_one({
        "name": {"$regex": data.school_name, "$options": "i"},
        "city": data.school_city
    })
    if existing_school:
        raise HTTPException(
            status_code=400,
            detail="A school with this name already exists in your city. Contact support if this is an error."
        )

    # Generate IDs
    school_id = f"SCH-{uuid.uuid4().hex[:8].upper()}"
    director_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    school_code = generate_school_code(data.school_name)

    # Hash password
    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=14)

    # Suggest plan based on student count
    suggested_plan = "starter"
    if data.total_students_approx:
        if data.total_students_approx > 2000:
            suggested_plan = "enterprise"
        elif data.total_students_approx > 1000:
            suggested_plan = "pro"
        elif data.total_students_approx > 300:
            suggested_plan = "growth"

    # Create school record
    school_data = {
        "id": school_id,
        "name": data.school_name,
        "school_code": school_code,
        "city": data.school_city,
        "state": data.school_state,
        "board": data.school_board,
        "school_type": data.school_type,
        "phone": data.school_phone or "",
        "address": data.school_address or f"{data.school_city}, {data.school_state}",
        "email": data.director_email.lower(),
        "director_id": director_id,
        "is_active": True,
        "is_trial": True,
        "subscription_status": "trial",
        "trial_end_date": trial_end.isoformat(),
        "onboarding_complete": False,
        "platform_source": data.platform_source,
        "created_at": now.isoformat(),

        # Connected platforms
        "platforms": {
            "schooltino": True,   # Admin portal
            "teachtino": True,    # Teacher portal
            "studytino": True,    # Student portal
            "parenttino": True    # Parent portal
        },

        # Customization
        "theme_color": "#2563eb",    # Default blue
        "logo_url": None,
        "favicon_url": None,
        "welcome_message": f"Welcome to {data.school_name}!"
    }

    await db.schools.insert_one(school_data)

    # Create director account
    director_data = {
        "id": director_id,
        "email": data.director_email.lower(),
        "mobile": data.director_mobile,
        "password": hashed_pw,
        "name": data.director_name,
        "role": "director",
        "school_id": school_id,
        "is_active": True,
        "email_verified": False,
        "created_at": now.isoformat()
    }

    await db.users.insert_one(director_data)

    # Start trial subscription
    await db.subscriptions.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "plan_type": "trial",
        "status": "trial",
        "billing_cycle": None,
        "amount": 0,
        "started_at": now.isoformat(),
        "valid_until": trial_end.isoformat(),
        "trial_used": True,
        "trial_end_date": trial_end.isoformat(),
        "suggested_plan": suggested_plan
    })

    # Initialize credits (give 100 free credits on signup)
    await db.school_credits.insert_one({
        "school_id": school_id,
        "credits": 100,
        "total_earned": 100,
        "total_spent": 0,
        "created_at": now.isoformat()
    })

    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "type": "credit",
        "amount": 100,
        "reason": "Welcome bonus on registration",
        "balance_after": 100,
        "created_at": now.isoformat()
    })

    # Send verification OTP (6-digit)
    otp = ''.join(random.choices(string.digits, k=6))
    otp_hashed = bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()
    await db.email_verifications.insert_one({
        "email": data.director_email.lower(),
        "otp_hash": otp_hashed,
        "expires_at": (now + timedelta(minutes=30)).isoformat(),
        "verified": False,
        "created_at": now.isoformat()
    })

    # TODO: Send welcome email with OTP
    # await send_welcome_email(data.director_email, data.director_name, data.school_name, otp)

    logger.info(f"New school registered: {school_id} - {data.school_name} ({data.school_city})")

    return {
        "success": True,
        "message": f"🎉 Welcome! {data.school_name} has been registered successfully!",
        "school_id": school_id,
        "director_id": director_id,
        "school_code": school_code,
        "trial_end_date": trial_end.isoformat(),
        "trial_days": 14,
        "free_credits": 100,
        "suggested_plan": suggested_plan,
        "next_step": "Please verify your email to activate all features.",
        "platforms": {
            "schooltino_url": f"/login",
            "teachtino_url": f"/teach/login",
            "studytino_url": f"/study/login",
            "parenttino_url": f"/parent/login"
        }
    }


# ====================== STEP 2: VERIFY EMAIL ======================

@router.post("/verify-email")
async def verify_email(data: VerifyEmailRequest):
    """Verify director email with OTP"""
    verification = await db.email_verifications.find_one({
        "email": data.email.lower(),
        "verified": False
    })

    if not verification:
        raise HTTPException(status_code=400, detail="No pending verification found for this email")

    # Check expiry
    expiry = datetime.fromisoformat(verification["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    if not bcrypt.checkpw(data.otp.encode(), verification["otp_hash"].encode()):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Mark verified
    await db.email_verifications.update_one(
        {"email": data.email.lower()},
        {"$set": {"verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.users.update_one(
        {"email": data.email.lower()},
        {"$set": {"email_verified": True}}
    )

    return {
        "success": True,
        "message": "Email verified! You can now access all features."
    }


# ====================== SETUP GUIDE ======================

@router.get("/setup-guide/{school_id}")
async def get_setup_guide(school_id: str):
    """
    Get step-by-step onboarding guide for new school.
    Checks which steps are complete.
    """
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Check completion of each step
    students_count = await db.students.count_documents({"school_id": school_id})
    teachers_count = await db.users.count_documents({"school_id": school_id, "role": "teacher"})
    classes_count  = await db.classes.count_documents({"school_id": school_id})
    fee_structures = await db.fee_structures.count_documents({"school_id": school_id})
    has_logo       = bool(school.get("logo_url"))

    steps = [
        {
            "step": 1,
            "title": "School Profile Setup",
            "description": "Add your school logo, address, and details",
            "complete": has_logo,
            "url": "/settings/school-profile",
            "priority": "high"
        },
        {
            "step": 2,
            "title": "Add Classes & Sections",
            "description": "Create classes (Class 1 to 12) with sections (A, B, C)",
            "complete": classes_count > 0,
            "url": "/classes",
            "count": classes_count,
            "priority": "high"
        },
        {
            "step": 3,
            "title": "Add Teachers & Staff",
            "description": "Invite your teachers and staff members",
            "complete": teachers_count > 0,
            "url": "/staff/add",
            "count": teachers_count,
            "priority": "high"
        },
        {
            "step": 4,
            "title": "Admit Students",
            "description": "Add students individually or import via Excel",
            "complete": students_count > 0,
            "url": "/students/admission",
            "count": students_count,
            "priority": "high"
        },
        {
            "step": 5,
            "title": "Set Up Fee Structure",
            "description": "Define fee types, amounts, and due dates",
            "complete": fee_structures > 0,
            "url": "/fees/structure",
            "priority": "high"
        },
        {
            "step": 6,
            "title": "Configure Timetable",
            "description": "Set class schedules and period timings",
            "complete": False,   # Check timetable collection
            "url": "/timetable",
            "priority": "medium"
        },
        {
            "step": 7,
            "title": "Enable TeachTino for Teachers",
            "description": "Share TeachTino login link with all teachers",
            "complete": teachers_count > 0,
            "url": "/staff",
            "priority": "medium"
        },
        {
            "step": 8,
            "title": "Enable StudyTino for Students",
            "description": "Share StudyTino login credentials with students",
            "complete": students_count > 0,
            "url": "/students",
            "priority": "medium"
        },
        {
            "step": 9,
            "title": "Configure Payment Gateway",
            "description": "Link your Razorpay account for online fee collection",
            "complete": False,
            "url": "/settings/payment",
            "priority": "low"
        },
        {
            "step": 10,
            "title": "Setup SMS/WhatsApp Notifications",
            "description": "Enable parent/student SMS/WhatsApp alerts",
            "complete": False,
            "url": "/settings/notifications",
            "priority": "low"
        }
    ]

    completed = sum(1 for s in steps if s["complete"])
    progress_pct = round(completed / len(steps) * 100)

    return {
        "school_id": school_id,
        "school_name": school.get("name"),
        "progress_percentage": progress_pct,
        "completed_steps": completed,
        "total_steps": len(steps),
        "setup_complete": progress_pct >= 80,
        "steps": steps,
        "tip": "Complete the high priority steps first to start using the system!"
    }


# ====================== CHECK SCHOOL CODE AVAILABILITY ======================

@router.get("/check-code/{code}")
async def check_school_code(code: str):
    """Check if a school code is available"""
    exists = await db.schools.find_one({"school_code": code.upper()})
    return {"available": exists is None, "code": code.upper()}


# ====================== PUBLIC SCHOOL SEARCH ======================

@router.get("/search")
async def search_schools(query: str, city: str = None, limit: int = 10):
    """
    Public endpoint: search for schools by name/city.
    Used when student/parent wants to find their school.
    """
    limit = min(limit, 20)
    filter_q = {
        "is_active": True,
        "name": {"$regex": query, "$options": "i"}
    }
    if city:
        filter_q["city"] = {"$regex": city, "$options": "i"}

    schools = await db.schools.find(
        filter_q,
        {"_id": 0, "id": 1, "name": 1, "city": 1, "state": 1, "school_code": 1, "board": 1, "logo_url": 1}
    ).limit(limit).to_list(limit)

    return {"schools": schools, "count": len(schools)}
