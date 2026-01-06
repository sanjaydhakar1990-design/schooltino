# /app/backend/routes/password_reset.py
"""
Forgot Password / Password Reset System
- OTP based password reset via email/mobile
- Works for all roles: Director, Teacher, Student, Accountant
- Secure token-based reset
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import os
import sys
import random
import string
import bcrypt

sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

router = APIRouter(prefix="/password-reset", tags=["Password Reset"])


# ==================== MODELS ====================

class ForgotPasswordRequest(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    student_id: Optional[str] = None  # For students who login with ID
    role: str = "auto"  # auto, director, teacher, student, accountant

class VerifyOTPRequest(BaseModel):
    email: Optional[str] = None
    mobile: Optional[str] = None
    student_id: Optional[str] = None
    otp: str
    role: str = "auto"

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str
    confirm_password: str


# ==================== HELPER FUNCTIONS ====================

def generate_otp(length: int = 6) -> str:
    """Generate numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

def generate_reset_token() -> str:
    """Generate secure reset token"""
    return str(uuid.uuid4()) + '-' + ''.join(random.choices(string.ascii_letters + string.digits, k=16))


# ==================== FORGOT PASSWORD - SEND OTP ====================

@router.post("/forgot")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Step 1: User requests password reset
    - Send OTP to email/mobile
    - For students: Can use student_id
    """
    user = None
    identifier = None
    user_type = None
    
    # Find user based on provided info
    if data.student_id:
        # Student login with ID
        user = await db.students.find_one(
            {"$or": [{"id": data.student_id}, {"student_id": data.student_id}]},
            {"_id": 0}
        )
        if user:
            identifier = data.student_id
            user_type = "student"
    
    elif data.email:
        # Check in users collection first (teachers, directors, accountants)
        user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
        if user:
            identifier = data.email.lower()
            user_type = user.get("role", "user")
        else:
            # Check students with email
            user = await db.students.find_one({"email": data.email.lower()}, {"_id": 0})
            if user:
                identifier = data.email.lower()
                user_type = "student"
    
    elif data.mobile:
        # Check users
        user = await db.users.find_one({"mobile": data.mobile}, {"_id": 0})
        if user:
            identifier = data.mobile
            user_type = user.get("role", "user")
        else:
            # Check students
            user = await db.students.find_one({"mobile": data.mobile}, {"_id": 0})
            if user:
                identifier = data.mobile
                user_type = "student"
    
    if not user:
        # Don't reveal if user exists (security)
        return {
            "success": True,
            "message": "Agar yeh account exist karta hai, toh OTP bhej diya gaya hai",
            "demo_mode": True
        }
    
    # Generate OTP
    otp = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store OTP in database
    otp_record = {
        "id": str(uuid.uuid4()),
        "user_id": user.get("id"),
        "identifier": identifier,
        "user_type": user_type,
        "otp": otp,
        "otp_hash": bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode(),
        "expires_at": otp_expiry.isoformat(),
        "verified": False,
        "reset_token": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.password_reset_otps.insert_one(otp_record)
    
    # In production, send OTP via email/SMS
    # For demo, we return OTP (remove in production!)
    
    # Mask identifier for response
    masked_identifier = identifier
    if "@" in str(identifier):
        parts = identifier.split("@")
        masked_identifier = f"{parts[0][:2]}***@{parts[1]}"
    elif identifier and len(identifier) > 4:
        masked_identifier = f"{identifier[:2]}***{identifier[-2:]}"
    
    return {
        "success": True,
        "message": f"OTP sent to {masked_identifier}",
        "user_type": user_type,
        "user_name": user.get("name", "User"),
        "expires_in_minutes": 10,
        # DEMO MODE - Remove in production!
        "demo_otp": otp,
        "demo_mode": True,
        "note": "Demo mode - OTP shown for testing. In production, OTP will be sent via SMS/Email"
    }


# ==================== VERIFY OTP ====================

@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest):
    """
    Step 2: Verify OTP and get reset token
    """
    identifier = data.email or data.mobile or data.student_id
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Email, mobile ya student ID required hai")
    
    if not data.otp or len(data.otp) != 6:
        raise HTTPException(status_code=400, detail="Valid 6-digit OTP daalein")
    
    # Find latest OTP record
    otp_record = await db.password_reset_otps.find_one(
        {
            "identifier": identifier.lower() if "@" in identifier else identifier,
            "verified": False
        },
        sort=[("created_at", -1)]
    )
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP nahi mila ya already used ho gaya")
    
    # Check expiry
    expiry = datetime.fromisoformat(otp_record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP expire ho gaya. Naya OTP request karein")
    
    # Verify OTP
    if not bcrypt.checkpw(data.otp.encode(), otp_record["otp_hash"].encode()):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    return {
        "valid": True,
        "message": "OTP verified",
        "user_type": otp_record.get("user_type"),
        "expires_at": token_expiry
    }


# ==================== ADMIN RESET STUDENT PASSWORD ====================

class AdminResetStudentPassword(BaseModel):
    student_id: str
    school_id: str
    admin_id: str  # ID of the admin/admission staff doing the reset

@router.post("/admin/reset-student-password")
async def admin_reset_student_password(data: AdminResetStudentPassword):
    """
    Admin/Admission staff can reset student password
    Generates a new temporary password that student must change on login
    """
    # Verify admin has permission
    admin = await db.users.find_one(
        {"id": data.admin_id},
        {"_id": 0, "role": 1, "school_id": 1}
    )
    
    if not admin:
        raise HTTPException(status_code=403, detail="Admin not found")
    
    allowed_roles = ["director", "admission_staff", "admin", "principal", "vice_principal"]
    if admin.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="You don't have permission to reset student passwords")
    
    # Find student
    student = await db.students.find_one(
        {
            "$or": [
                {"id": data.student_id},
                {"student_id": data.student_id}
            ],
            "school_id": data.school_id
        }
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in this school")
    
    # Generate new temporary password
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    hashed_password = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update student password
    await db.students.update_one(
        {"id": student["id"]},
        {"$set": {
            "password": hashed_password,
            "password_reset_required": True,
            "password_reset_by": data.admin_id,
            "password_reset_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log the action
    await db.password_reset_logs.insert_one({
        "id": str(uuid.uuid4()),
        "student_id": student["id"],
        "student_name": student.get("name"),
        "student_sid": student.get("student_id"),
        "school_id": data.school_id,
        "reset_by": data.admin_id,
        "reset_by_role": admin.get("role"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"Password reset for {student.get('name')}",
        "student_id": student.get("student_id"),
        "student_name": student.get("name"),
        "temporary_password": temp_password,
        "note": "Student ko ye password dein. Pehle login pe change karna hoga."
    }


@router.get("/admin/student-password-history/{school_id}")
async def get_password_reset_history(school_id: str, limit: int = 50):
    """Get password reset history for a school"""
    
    history = await db.password_reset_logs.find(
        {"school_id": school_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "school_id": school_id,
        "total": len(history),
        "history": history
    }


class BulkStudentPasswordReset(BaseModel):
    student_ids: list
    school_id: str
    admin_id: str

@router.post("/admin/bulk-reset-passwords")
async def bulk_reset_student_passwords(data: BulkStudentPasswordReset):
    """Reset passwords for multiple students at once"""
    
    # Verify admin
    admin = await db.users.find_one({"id": data.admin_id}, {"_id": 0, "role": 1})
    if not admin or admin.get("role") not in ["director", "admission_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    results = []
    
    for student_id in data.student_ids:
        student = await db.students.find_one({
            "$or": [{"id": student_id}, {"student_id": student_id}],
            "school_id": data.school_id
        })
        
        if not student:
            results.append({
                "student_id": student_id,
                "success": False,
                "error": "Not found"
            })
            continue
        
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        hashed = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        await db.students.update_one(
            {"id": student["id"]},
            {"$set": {
                "password": hashed,
                "password_reset_required": True,
                "password_reset_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        results.append({
            "student_id": student.get("student_id"),
            "student_name": student.get("name"),
            "success": True,
            "temporary_password": temp_password
        })
    
    return {
        "success": True,
        "message": f"Passwords reset for {len([r for r in results if r['success']])} students",
        "results": results
    }


# ==================== RESET PASSWORD ====================

@router.post("/reset")
async def reset_password(data: ResetPasswordRequest):
    """
    Step 3: Set new password using reset token
    """
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords match nahi ho rahe")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password kam se kam 6 characters ka hona chahiye")
    
    # Find token record
    otp_record = await db.password_reset_otps.find_one(
        {"reset_token": data.reset_token, "verified": True}
    )
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid ya expired reset token")
    
    # Check token expiry
    token_expiry = otp_record.get("token_expires_at")
    if token_expiry:
        expiry = datetime.fromisoformat(token_expiry.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expiry:
            raise HTTPException(status_code=400, detail="Reset token expire ho gaya. Dobara try karein")
    
    user_id = otp_record.get("user_id")
    user_type = otp_record.get("user_type")
    
    # Hash new password
    hashed_pw = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update password based on user type
    if user_type == "student":
        result = await db.students.update_one(
            {"id": user_id},
            {"$set": {
                "password": hashed_pw,
                "password_updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "password": hashed_pw,
                "password_updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Password update nahi ho paya")
    
    # Invalidate reset token
    await db.password_reset_otps.update_one(
        {"id": otp_record["id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Delete old OTPs for this user
    await db.password_reset_otps.delete_many({
        "user_id": user_id,
        "id": {"$ne": otp_record["id"]}
    })
    
    return {
        "success": True,
        "message": "Password successfully change ho gaya! Ab login kar sakte ho",
        "user_type": user_type
    }


# ==================== RESEND OTP ====================

@router.post("/resend-otp")
async def resend_otp(data: ForgotPasswordRequest):
    """
    Resend OTP if expired or not received
    """
    # Reuse forgot password logic
    return await forgot_password(data)


# ==================== CHECK TOKEN VALIDITY ====================

@router.get("/check-token/{token}")
async def check_reset_token(token: str):
    """
    Check if reset token is still valid
    """
    otp_record = await db.password_reset_otps.find_one(
        {"reset_token": token, "verified": True, "used": {"$ne": True}}
    )
    
    if not otp_record:
        return {"valid": False, "message": "Token invalid hai"}
    
    token_expiry = otp_record.get("token_expires_at")
    if token_expiry:
        expiry = datetime.fromisoformat(token_expiry.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expiry:
            return {"valid": False, "message": "Token expire ho gaya"}
    
    return {
        "valid": True,
        "user_type": otp_record.get("user_type"),
        "expires_at": token_expiry
    }
