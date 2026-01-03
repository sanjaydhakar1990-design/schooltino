from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import qrcode
from io import BytesIO
import base64
import aiofiles

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "documents").mkdir(exist_ok=True)

load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'schooltino-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="Schooltino API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "teacher"  # director, principal, vice_principal, teacher, accountant, exam_controller
    mobile: Optional[str] = None
    school_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    mobile: Optional[str] = None
    school_id: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# School Models
class SchoolCreate(BaseModel):
    name: str
    address: str
    board_type: str  # CBSE, ICSE, State Board
    city: str
    state: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None

class SchoolResponse(BaseModel):
    id: str
    name: str
    address: str
    board_type: str
    city: str
    state: str
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: str
    is_active: bool = True

# Class Models
class ClassCreate(BaseModel):
    name: str  # Class 1, Class 2, etc.
    section: str  # A, B, C
    school_id: str
    class_teacher_id: Optional[str] = None

class ClassResponse(BaseModel):
    id: str
    name: str
    section: str
    school_id: str
    class_teacher_id: Optional[str] = None
    student_count: int = 0
    created_at: str

# Student Models
class StudentCreate(BaseModel):
    name: str
    class_id: str
    school_id: str
    father_name: str
    mother_name: str
    dob: str
    gender: str
    address: str
    mobile: str  # Parent mobile for OTP
    email: Optional[EmailStr] = None
    blood_group: Optional[str] = None
    photo_url: Optional[str] = None
    aadhar_no: Optional[str] = None
    previous_school: Optional[str] = None

class StudentAdmissionResponse(BaseModel):
    id: str
    student_id: str  # Auto-generated: STD-2026-000123
    name: str
    class_id: str
    class_name: Optional[str] = None
    section: Optional[str] = None
    school_id: str
    father_name: str
    mother_name: str
    dob: str
    gender: str
    mobile: str
    login_id: str  # Same as student_id
    temporary_password: str  # Auto-generated, show once
    status: str  # pending_approval, active, suspended, left
    created_at: str

class StudentResponse(BaseModel):
    id: str
    student_id: str
    admission_no: Optional[str] = None
    name: str
    class_id: str
    class_name: Optional[str] = None
    section: Optional[str] = None
    school_id: str
    father_name: str
    mother_name: str
    dob: str
    gender: str
    address: str
    mobile: str
    email: Optional[str] = None
    blood_group: Optional[str] = None
    photo_url: Optional[str] = None
    status: str = "active"
    is_active: bool = True
    created_at: str

# Staff Models
class StaffCreate(BaseModel):
    name: str
    employee_id: str
    school_id: str
    designation: str  # Teacher, Accountant, Librarian, etc.
    department: Optional[str] = None
    qualification: str
    joining_date: str
    mobile: str
    email: EmailStr
    address: str
    salary: Optional[float] = None
    photo_url: Optional[str] = None

class StaffResponse(BaseModel):
    id: str
    name: str
    employee_id: str
    school_id: str
    designation: str
    department: Optional[str] = None
    qualification: str
    joining_date: str
    mobile: str
    email: str
    address: str
    salary: Optional[float] = None
    photo_url: Optional[str] = None
    is_active: bool = True
    created_at: str

# Attendance Models
class AttendanceCreate(BaseModel):
    student_id: str
    class_id: str
    school_id: str
    date: str
    status: str  # present, absent, late, leave
    remarks: Optional[str] = None

class BulkAttendanceCreate(BaseModel):
    class_id: str
    school_id: str
    date: str
    attendance: List[Dict[str, str]]  # [{student_id, status, remarks}]

class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    class_id: str
    school_id: str
    date: str
    status: str
    remarks: Optional[str] = None
    marked_by: Optional[str] = None
    created_at: str

# Fee Models
class FeePlanCreate(BaseModel):
    name: str  # Monthly, Quarterly, Annual
    school_id: str
    class_ids: List[str]
    amount: float
    due_day: int = 10  # Due on 10th of each month
    late_fee: float = 0
    description: Optional[str] = None

class FeePlanResponse(BaseModel):
    id: str
    name: str
    school_id: str
    class_ids: List[str]
    amount: float
    due_day: int
    late_fee: float
    description: Optional[str] = None
    is_active: bool = True
    created_at: str

class FeeInvoiceCreate(BaseModel):
    student_id: str
    fee_plan_id: str
    school_id: str
    month: str  # 2024-01
    amount: float
    due_date: str
    discount: float = 0
    discount_reason: Optional[str] = None

class FeeInvoiceResponse(BaseModel):
    id: str
    invoice_no: str
    student_id: str
    student_name: Optional[str] = None
    fee_plan_id: str
    school_id: str
    month: str
    amount: float
    discount: float
    final_amount: float
    due_date: str
    status: str  # pending, paid, overdue, partial
    paid_amount: float = 0
    payment_date: Optional[str] = None
    created_at: str

class FeePaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_mode: str  # cash, online, cheque
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None

class FeePaymentResponse(BaseModel):
    id: str
    receipt_no: str
    invoice_id: str
    amount: float
    payment_mode: str
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None
    received_by: Optional[str] = None
    created_at: str

# Notice Models
class NoticeCreate(BaseModel):
    title: str
    content: str
    school_id: str
    target_audience: List[str]  # all, teachers, students, parents
    priority: str = "normal"  # low, normal, high, urgent
    attachment_url: Optional[str] = None
    valid_till: Optional[str] = None

class NoticeResponse(BaseModel):
    id: str
    title: str
    content: str
    school_id: str
    target_audience: List[str]
    priority: str
    attachment_url: Optional[str] = None
    valid_till: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    is_active: bool = True
    created_at: str

# Audit Log Model
class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    action: str
    module: str
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: str

# AI Paper Generator Models
class PaperGenerateRequest(BaseModel):
    subject: str
    class_name: str
    chapter: str
    difficulty: str  # easy, medium, hard, mixed
    question_types: List[str]  # mcq, short, long, fill_blank
    total_marks: int
    time_duration: int  # in minutes
    language: str = "english"

class PaperGenerateResponse(BaseModel):
    id: str
    subject: str
    class_name: str
    chapter: str
    questions: List[Dict[str, Any]]
    total_marks: int
    time_duration: int
    created_at: str

# Dashboard Stats
class DashboardStats(BaseModel):
    total_students: int
    total_staff: int
    total_classes: int
    attendance_today: Dict[str, int]
    fee_collection_month: float
    pending_fees: float
    recent_notices: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]

# ==================== HELPER FUNCTIONS ====================

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def log_audit(user_id: str, action: str, module: str, details: dict, ip_address: str = None):
    audit_log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "module": module,
        "details": details,
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_log)

def generate_invoice_no():
    return f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

def generate_receipt_no():
    return f"RCP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

# ==================== AUTH ROUTES ====================

# PUBLIC REGISTRATION IS DISABLED
# Only Director can create users via /api/users/create
# Initial Director is created via /api/auth/setup-director (one-time only)

@api_router.post("/auth/setup-director", response_model=TokenResponse)
async def setup_director(user: UserRegister):
    """
    One-time setup to create the first Director account.
    After first Director is created, this endpoint is disabled.
    """
    # Check if any Director already exists
    existing_director = await db.users.find_one({"role": "director"})
    if existing_director:
        raise HTTPException(status_code=403, detail="Director already exists. Contact existing Director to create accounts.")
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    
    # Create Director user
    user_data = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hashed_pw,
        "name": user.name,
        "role": "director",  # Force role to director
        "mobile": user.mobile,
        "school_id": user.school_id,
        "status": "active",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_data)
    
    # Generate token
    token = create_jwt_token(user_data)
    
    user_response = UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        name=user_data["name"],
        role=user_data["role"],
        mobile=user_data["mobile"],
        school_id=user_data["school_id"],
        created_at=user_data["created_at"]
    )
    
    await log_audit(user_data["id"], "setup_director", "auth", {"name": user.name, "email": user.email})
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/check-setup")
async def check_setup():
    """Check if initial Director setup is needed"""
    existing_director = await db.users.find_one({"role": "director"})
    return {
        "setup_required": existing_director is None,
        "message": "Director setup required" if not existing_director else "System ready"
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    # Check if user is pending approval
    if user.get("status") == "pending":
        raise HTTPException(status_code=401, detail="Account pending approval from Director")
    
    if user.get("status") == "rejected":
        raise HTTPException(status_code=401, detail="Account has been rejected")
    
    token = create_jwt_token(user)
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        mobile=user.get("mobile"),
        school_id=user.get("school_id"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        mobile=current_user.get("mobile"),
        school_id=current_user.get("school_id"),
        created_at=current_user["created_at"]
    )

# ==================== USER MANAGEMENT ROUTES ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    mobile: Optional[str] = None
    school_id: str
    created_by: str
    status: str = "active"  # active, pending, rejected

class UserListResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    mobile: Optional[str] = None
    school_id: str
    status: str
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: str

@api_router.post("/users/create", response_model=UserListResponse)
async def create_user_account(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    """Director/Principal creates user accounts for their school staff"""
    
    # Check permissions
    if current_user["role"] not in ["director", "principal", "vice_principal"]:
        raise HTTPException(status_code=403, detail="Not authorized to create users")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_pw = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # If Principal creates, status is pending (needs Director approval)
    # If Director creates, status is active
    status = "active" if current_user["role"] == "director" else "pending"
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hashed_pw,
        "name": user_data.name,
        "role": user_data.role,
        "mobile": user_data.mobile,
        "school_id": user_data.school_id,
        "status": status,
        "created_by": current_user["id"],
        "is_active": status == "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    await log_audit(current_user["id"], "create_user", "users", {
        "user_id": new_user["id"],
        "name": user_data.name,
        "role": user_data.role,
        "status": status
    })
    
    return UserListResponse(
        id=new_user["id"],
        name=new_user["name"],
        email=new_user["email"],
        role=new_user["role"],
        mobile=new_user["mobile"],
        school_id=new_user["school_id"],
        status=new_user["status"],
        created_by=new_user["created_by"],
        created_at=new_user["created_at"]
    )

@api_router.get("/users/school/{school_id}", response_model=List[UserListResponse])
async def get_school_users(school_id: str, current_user: dict = Depends(get_current_user)):
    """Get all active users for a school"""
    users = await db.users.find(
        {"school_id": school_id, "status": "active", "is_active": True},
        {"_id": 0, "password": 0}
    ).to_list(200)
    
    result = []
    for u in users:
        creator = None
        if u.get("created_by"):
            creator = await db.users.find_one({"id": u["created_by"]}, {"_id": 0, "name": 1})
        result.append(UserListResponse(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            role=u["role"],
            mobile=u.get("mobile"),
            school_id=u["school_id"],
            status=u.get("status", "active"),
            created_by=u.get("created_by"),
            created_by_name=creator["name"] if creator else None,
            created_at=u["created_at"]
        ))
    
    return result

@api_router.get("/users/pending/{school_id}", response_model=List[UserListResponse])
async def get_pending_users(school_id: str, current_user: dict = Depends(get_current_user)):
    """Get pending approval users - only Director can see this"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can view pending users")
    
    users = await db.users.find(
        {"school_id": school_id, "status": "pending"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    result = []
    for u in users:
        creator = None
        if u.get("created_by"):
            creator = await db.users.find_one({"id": u["created_by"]}, {"_id": 0, "name": 1})
        result.append(UserListResponse(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            role=u["role"],
            mobile=u.get("mobile"),
            school_id=u["school_id"],
            status=u.get("status", "pending"),
            created_by=u.get("created_by"),
            created_by_name=creator["name"] if creator else None,
            created_at=u["created_at"]
        ))
    
    return result

@api_router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Director approves a pending user"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can approve users")
    
    result = await db.users.update_one(
        {"id": user_id, "status": "pending"},
        {"$set": {"status": "active", "is_active": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found or already processed")
    
    await log_audit(current_user["id"], "approve_user", "users", {"user_id": user_id})
    
    return {"message": "User approved successfully"}

@api_router.post("/users/{user_id}/reject")
async def reject_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Director rejects a pending user"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can reject users")
    
    result = await db.users.update_one(
        {"id": user_id, "status": "pending"},
        {"$set": {"status": "rejected", "is_active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found or already processed")
    
    await log_audit(current_user["id"], "reject_user", "users", {"user_id": user_id})
    
    return {"message": "User rejected"}

@api_router.post("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Director deactivates an active user"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can deactivate users")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "status": "deactivated"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await log_audit(current_user["id"], "deactivate_user", "users", {"user_id": user_id})
    
    return {"message": "User deactivated"}

class SuspendUserRequest(BaseModel):
    reason: str  # fees_pending, misconduct, document_pending, other
    reason_details: Optional[str] = None
    suspend_until: Optional[str] = None  # date or "until_approval"

@api_router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, data: SuspendUserRequest, current_user: dict = Depends(get_current_user)):
    """Director/Principal can suspend a user temporarily"""
    if current_user["role"] not in ["director", "principal", "vice_principal"]:
        raise HTTPException(status_code=403, detail="Not authorized to suspend users")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "status": "suspended",
            "is_active": False,
            "suspension_reason": data.reason,
            "suspension_details": data.reason_details,
            "suspend_until": data.suspend_until,
            "suspended_by": current_user["id"],
            "suspended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit(current_user["id"], "suspend_user", "users", {
        "user_id": user_id,
        "reason": data.reason,
        "until": data.suspend_until
    })
    
    return {"message": "User suspended", "reason": data.reason}

@api_router.post("/users/{user_id}/unsuspend")
async def unsuspend_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Director/Principal can unsuspend a user"""
    if current_user["role"] not in ["director", "principal"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.users.update_one(
        {"id": user_id, "status": "suspended"},
        {"$set": {
            "status": "active",
            "is_active": True,
            "suspension_reason": None,
            "suspension_details": None,
            "suspend_until": None
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found or not suspended")
    
    await log_audit(current_user["id"], "unsuspend_user", "users", {"user_id": user_id})
    
    return {"message": "User unsuspended and activated"}

@api_router.post("/users/{user_id}/reactivate")
async def reactivate_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Only Director can reactivate a deactivated user"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can reactivate users")
    
    result = await db.users.update_one(
        {"id": user_id, "status": "deactivated"},
        {"$set": {"status": "active", "is_active": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found or not deactivated")
    
    await log_audit(current_user["id"], "reactivate_user", "users", {"user_id": user_id})
    
    return {"message": "User reactivated"}

class TransferUserRequest(BaseModel):
    new_user_name: str
    new_user_email: EmailStr
    new_user_mobile: Optional[str] = None
    new_password: str
    transfer_reason: str

@api_router.post("/users/{user_id}/transfer")
async def transfer_user_account(user_id: str, data: TransferUserRequest, current_user: dict = Depends(get_current_user)):
    """Director transfers a user account to new person (e.g., teacher changed)
    This keeps the same ID/role but changes the person"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can transfer accounts")
    
    # Check if email already exists
    existing = await db.users.find_one({"email": data.new_user_email})
    if existing and existing["id"] != user_id:
        raise HTTPException(status_code=400, detail="New email already registered")
    
    old_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not old_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    hashed_pw = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update user with new person details
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "name": data.new_user_name,
            "email": data.new_user_email,
            "mobile": data.new_user_mobile,
            "password": hashed_pw,
            "status": "active",
            "is_active": True,
            "transferred_at": datetime.now(timezone.utc).isoformat(),
            "transfer_reason": data.transfer_reason,
            "previous_holder": old_user["name"]
        }}
    )
    
    await log_audit(current_user["id"], "transfer_account", "users", {
        "user_id": user_id,
        "from": old_user["name"],
        "to": data.new_user_name,
        "reason": data.transfer_reason
    })
    
    return {
        "message": "Account transferred successfully",
        "from": old_user["name"],
        "to": data.new_user_name
    }

@api_router.get("/users/{user_id}/details")
async def get_user_details(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get full details of a user including suspension info"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# ==================== SCHOOL ROUTES ====================

@api_router.post("/schools", response_model=SchoolResponse)
async def create_school(school: SchoolCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    school_data = {
        "id": str(uuid.uuid4()),
        **school.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.schools.insert_one(school_data)
    await log_audit(current_user["id"], "create", "schools", {"school_id": school_data["id"], "name": school.name})
    
    return SchoolResponse(**school_data)

@api_router.get("/schools", response_model=List[SchoolResponse])
async def get_schools(current_user: dict = Depends(get_current_user)):
    schools = await db.schools.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [SchoolResponse(**s) for s in schools]

@api_router.get("/schools/{school_id}", response_model=SchoolResponse)
async def get_school(school_id: str, current_user: dict = Depends(get_current_user)):
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return SchoolResponse(**school)

# ==================== CLASS ROUTES ====================

@api_router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    class_doc = {
        "id": str(uuid.uuid4()),
        **class_data.model_dump(),
        "student_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.classes.insert_one(class_doc)
    await log_audit(current_user["id"], "create", "classes", {"class_id": class_doc["id"], "name": class_data.name})
    
    return ClassResponse(**class_doc)

@api_router.get("/classes", response_model=List[ClassResponse])
async def get_classes(school_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if school_id:
        query["school_id"] = school_id
    classes = await db.classes.find(query, {"_id": 0}).to_list(100)
    return [ClassResponse(**c) for c in classes]

@api_router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    return ClassResponse(**class_doc)

@api_router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(class_id: str, class_data: ClassCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.classes.update_one(
        {"id": class_id},
        {"$set": class_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    
    await log_audit(current_user["id"], "update", "classes", {"class_id": class_id})
    updated = await db.classes.find_one({"id": class_id}, {"_id": 0})
    return ClassResponse(**updated)

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.classes.delete_one({"id": class_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    
    await log_audit(current_user["id"], "delete", "classes", {"class_id": class_id})
    return {"message": "Class deleted successfully"}

# ==================== STUDENT ADMISSION ROUTES ====================

def generate_student_id(school_id: str) -> str:
    """Generate unique student ID like STD-2026-000123"""
    year = datetime.now().year
    random_part = str(uuid.uuid4().int)[:6].zfill(6)
    return f"STD-{year}-{random_part}"

def generate_temp_password() -> str:
    """Generate temporary password for student"""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return ''.join([chars[ord(os.urandom(1)) % len(chars)] for _ in range(8)])

@api_router.post("/students/admit", response_model=StudentAdmissionResponse)
async def admit_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    """
    Admission Staff adds new student.
    Auto-generates Student ID and temporary password.
    Director/Principal can later approve if needed.
    """
    # Allow admission staff, clerk, accountant, teacher, principal, director
    allowed_roles = ["director", "principal", "vice_principal", "teacher", "accountant", "clerk", "admission_staff"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized for admission")
    
    # Generate unique student ID
    student_id = generate_student_id(student.school_id)
    
    # Check if student_id already exists (very rare)
    while await db.students.find_one({"student_id": student_id}):
        student_id = generate_student_id(student.school_id)
    
    # Generate temporary password
    temp_password = generate_temp_password()
    hashed_pw = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()
    
    # Determine status - if Director/Principal adds, directly active
    # If staff adds, pending approval (optional - can be configured)
    status = "active" if current_user["role"] in ["director", "principal"] else "active"
    
    # Create student record
    student_data = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "admission_no": student_id,  # Same as student_id for backward compatibility
        **student.model_dump(),
        "status": status,
        "is_active": True,
        "password": hashed_pw,
        "password_changed": False,
        "admitted_by": current_user["id"],
        "admitted_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.students.insert_one(student_data)
    
    # Update class student count
    await db.classes.update_one({"id": student.class_id}, {"$inc": {"student_count": 1}})
    
    # Get class info
    class_doc = await db.classes.find_one({"id": student.class_id}, {"_id": 0})
    
    await log_audit(current_user["id"], "admit_student", "students", {
        "student_id": student_id,
        "name": student.name,
        "class": class_doc["name"] if class_doc else ""
    })
    
    return StudentAdmissionResponse(
        id=student_data["id"],
        student_id=student_id,
        name=student.name,
        class_id=student.class_id,
        class_name=class_doc["name"] if class_doc else None,
        section=class_doc["section"] if class_doc else None,
        school_id=student.school_id,
        father_name=student.father_name,
        mother_name=student.mother_name,
        dob=student.dob,
        gender=student.gender,
        mobile=student.mobile,
        login_id=student_id,
        temporary_password=temp_password,  # Show only once!
        status=status,
        created_at=student_data["created_at"]
    )

@api_router.post("/students/login")
async def student_login(student_id: str = None, password: str = None, mobile: str = None, dob: str = None):
    """Student login with Student ID + Password OR Mobile + DOB"""
    
    student = None
    
    if student_id and password:
        # Login with Student ID + Password
        student = await db.students.find_one({"student_id": student_id}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=401, detail="Invalid Student ID")
        
        if not bcrypt.checkpw(password.encode(), student["password"].encode()):
            raise HTTPException(status_code=401, detail="Invalid password")
    
    elif mobile and dob:
        # Login with Mobile + DOB
        student = await db.students.find_one({"mobile": mobile, "dob": dob}, {"_id": 0})
        if not student:
            raise HTTPException(status_code=401, detail="Invalid Mobile or Date of Birth")
    
    else:
        raise HTTPException(status_code=400, detail="Provide Student ID + Password OR Mobile + DOB")
    
    if student.get("status") == "suspended":
        raise HTTPException(status_code=401, detail="Account suspended. Contact school office.")
    
    if student.get("status") == "left":
        raise HTTPException(status_code=401, detail="Account deactivated.")
    
    if not student.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account not active")
    
    # Create token for student
    token_payload = {
        "sub": student["id"],
        "student_id": student["student_id"],
        "role": "student",
        "school_id": student["school_id"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": {
            "id": student["id"],
            "student_id": student["student_id"],
            "name": student["name"],
            "class_id": student["class_id"],
            "school_id": student["school_id"],
            "password_changed": student.get("password_changed", False)
        }
    }

@api_router.post("/students/{student_id}/change-password")
async def student_change_password(student_id: str, old_password: str, new_password: str):
    """Student changes password (mandatory on first login)"""
    student = await db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if not bcrypt.checkpw(old_password.encode(), student["password"].encode()):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    new_hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    await db.students.update_one(
        {"student_id": student_id},
        {"$set": {"password": new_hashed, "password_changed": True}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.post("/students/{id}/suspend")
async def suspend_student(id: str, reason: str, details: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Suspend a student (fees pending, discipline, etc.)"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.students.update_one(
        {"id": id},
        {"$set": {
            "status": "suspended",
            "is_active": False,
            "suspension_reason": reason,
            "suspension_details": details,
            "suspended_by": current_user["id"],
            "suspended_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await log_audit(current_user["id"], "suspend_student", "students", {"student_id": id, "reason": reason})
    
    return {"message": "Student suspended"}

@api_router.post("/students/{id}/unsuspend")
async def unsuspend_student(id: str, current_user: dict = Depends(get_current_user)):
    """Unsuspend a student"""
    if current_user["role"] not in ["director", "principal"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.students.update_one(
        {"id": id, "status": "suspended"},
        {"$set": {
            "status": "active",
            "is_active": True,
            "suspension_reason": None,
            "suspension_details": None
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found or not suspended")
    
    await log_audit(current_user["id"], "unsuspend_student", "students", {"student_id": id})
    
    return {"message": "Student unsuspended"}

@api_router.post("/students/{id}/mark-left")
async def mark_student_left(id: str, reason: str, tc_number: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Mark student as left (TC issued)"""
    if current_user["role"] not in ["director", "principal"]:
        raise HTTPException(status_code=403, detail="Only Director/Principal can mark student as left")
    
    student = await db.students.find_one({"id": id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.students.update_one(
        {"id": id},
        {"$set": {
            "status": "left",
            "is_active": False,
            "left_reason": reason,
            "tc_number": tc_number,
            "left_at": datetime.now(timezone.utc).isoformat(),
            "left_by": current_user["id"]
        }}
    )
    
    # Update class count
    await db.classes.update_one({"id": student["class_id"]}, {"$inc": {"student_count": -1}})
    
    await log_audit(current_user["id"], "mark_student_left", "students", {"student_id": id, "reason": reason})
    
    return {"message": "Student marked as left"}

@api_router.post("/students", response_model=StudentResponse)
async def create_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    """Legacy endpoint - redirects to admit"""
    if current_user["role"] not in ["director", "principal", "admin", "teacher", "accountant", "clerk"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Generate student ID
    student_id = generate_student_id(student.school_id)
    while await db.students.find_one({"student_id": student_id}):
        student_id = generate_student_id(student.school_id)
    
    temp_password = generate_temp_password()
    hashed_pw = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()
    
    student_data = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "admission_no": student_id,
        **student.model_dump(),
        "status": "active",
        "is_active": True,
        "password": hashed_pw,
        "password_changed": False,
        "admitted_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.students.insert_one(student_data)
    
    await db.classes.update_one({"id": student.class_id}, {"$inc": {"student_count": 1}})
    
    await log_audit(current_user["id"], "create", "students", {"student_id": student_data["id"], "name": student.name})
    
    return StudentResponse(**student_data)

@api_router.get("/students", response_model=List[StudentResponse])
async def get_students(
    school_id: Optional[str] = None,
    class_id: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if school_id:
        query["school_id"] = school_id
    if class_id:
        query["class_id"] = class_id
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["active", "suspended"]}  # Don't show left students by default
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}},
            {"admission_no": {"$regex": search, "$options": "i"}}
        ]
    
    students = await db.students.find(query, {"_id": 0, "password": 0}).to_list(500)
    
    # Enrich with class info
    for student in students:
        class_doc = await db.classes.find_one({"id": student["class_id"]}, {"_id": 0})
        if class_doc:
            student["class_name"] = class_doc["name"]
            student["section"] = class_doc["section"]
        # Ensure required fields exist
        if "student_id" not in student:
            student["student_id"] = student.get("admission_no", "N/A")
        if "status" not in student:
            student["status"] = "active" if student.get("is_active", True) else "inactive"
    
    return [StudentResponse(**s) for s in students]

@api_router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    class_doc = await db.classes.find_one({"id": student["class_id"]}, {"_id": 0})
    if class_doc:
        student["class_name"] = class_doc["name"]
        student["section"] = class_doc["section"]
    
    return StudentResponse(**student)

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.students.update_one(
        {"id": student_id},
        {"$set": student.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await log_audit(current_user["id"], "update", "students", {"student_id": student_id})
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return StudentResponse(**updated)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.students.update_one({"id": student_id}, {"$set": {"is_active": False}})
    await db.classes.update_one({"id": student["class_id"]}, {"$inc": {"student_count": -1}})
    
    await log_audit(current_user["id"], "delete", "students", {"student_id": student_id})
    return {"message": "Student deactivated successfully"}

# ==================== STAFF ROUTES ====================

@api_router.post("/staff", response_model=StaffResponse)
async def create_staff(staff: StaffCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.staff.find_one({"employee_id": staff.employee_id, "school_id": staff.school_id})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    staff_data = {
        "id": str(uuid.uuid4()),
        **staff.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.staff.insert_one(staff_data)
    await log_audit(current_user["id"], "create", "staff", {"staff_id": staff_data["id"], "name": staff.name})
    
    return StaffResponse(**staff_data)

@api_router.get("/staff", response_model=List[StaffResponse])
async def get_staff(
    school_id: Optional[str] = None,
    designation: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_active": True}
    if school_id:
        query["school_id"] = school_id
    if designation:
        query["designation"] = designation
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"employee_id": {"$regex": search, "$options": "i"}}
        ]
    
    staff_list = await db.staff.find(query, {"_id": 0}).to_list(200)
    return [StaffResponse(**s) for s in staff_list]

@api_router.get("/staff/{staff_id}", response_model=StaffResponse)
async def get_staff_member(staff_id: str, current_user: dict = Depends(get_current_user)):
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return StaffResponse(**staff)

@api_router.put("/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(staff_id: str, staff: StaffCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.staff.update_one(
        {"id": staff_id},
        {"$set": staff.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    await log_audit(current_user["id"], "update", "staff", {"staff_id": staff_id})
    updated = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    return StaffResponse(**updated)

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.staff.update_one({"id": staff_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    await log_audit(current_user["id"], "delete", "staff", {"staff_id": staff_id})
    return {"message": "Staff deactivated successfully"}

# ==================== ATTENDANCE ROUTES ====================

@api_router.post("/attendance", response_model=AttendanceResponse)
async def mark_attendance(attendance: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    # Check if already marked
    existing = await db.attendance.find_one({
        "student_id": attendance.student_id,
        "date": attendance.date
    })
    if existing:
        # Update existing
        await db.attendance.update_one(
            {"id": existing["id"]},
            {"$set": {"status": attendance.status, "remarks": attendance.remarks, "marked_by": current_user["id"]}}
        )
        updated = await db.attendance.find_one({"id": existing["id"]}, {"_id": 0})
        return AttendanceResponse(**updated)
    
    attendance_data = {
        "id": str(uuid.uuid4()),
        **attendance.model_dump(),
        "marked_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.attendance.insert_one(attendance_data)
    
    return AttendanceResponse(**attendance_data)

@api_router.post("/attendance/bulk", response_model=List[AttendanceResponse])
async def mark_bulk_attendance(data: BulkAttendanceCreate, current_user: dict = Depends(get_current_user)):
    results = []
    for att in data.attendance:
        attendance_data = {
            "id": str(uuid.uuid4()),
            "student_id": att["student_id"],
            "class_id": data.class_id,
            "school_id": data.school_id,
            "date": data.date,
            "status": att["status"],
            "remarks": att.get("remarks"),
            "marked_by": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert
        await db.attendance.update_one(
            {"student_id": att["student_id"], "date": data.date},
            {"$set": attendance_data},
            upsert=True
        )
        results.append(AttendanceResponse(**attendance_data))
    
    await log_audit(current_user["id"], "bulk_mark", "attendance", {
        "class_id": data.class_id,
        "date": data.date,
        "count": len(data.attendance)
    })
    
    return results

@api_router.get("/attendance", response_model=List[AttendanceResponse])
async def get_attendance(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    date: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if class_id:
        query["class_id"] = class_id
    if student_id:
        query["student_id"] = student_id
    if date:
        query["date"] = date
    if from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}
    
    attendance_list = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    # Enrich with student names
    for att in attendance_list:
        student = await db.students.find_one({"id": att["student_id"]}, {"_id": 0, "name": 1})
        if student:
            att["student_name"] = student["name"]
    
    return [AttendanceResponse(**a) for a in attendance_list]

@api_router.get("/attendance/stats")
async def get_attendance_stats(
    school_id: str,
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    total_students = await db.students.count_documents({"school_id": school_id, "is_active": True})
    present = await db.attendance.count_documents({"school_id": school_id, "date": date, "status": "present"})
    absent = await db.attendance.count_documents({"school_id": school_id, "date": date, "status": "absent"})
    late = await db.attendance.count_documents({"school_id": school_id, "date": date, "status": "late"})
    
    return {
        "date": date,
        "total_students": total_students,
        "present": present,
        "absent": absent,
        "late": late,
        "not_marked": total_students - present - absent - late
    }

# ==================== FEE ROUTES ====================

@api_router.post("/fees/plans", response_model=FeePlanResponse)
async def create_fee_plan(plan: FeePlanCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "accountant", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    plan_data = {
        "id": str(uuid.uuid4()),
        **plan.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fee_plans.insert_one(plan_data)
    await log_audit(current_user["id"], "create", "fee_plans", {"plan_id": plan_data["id"]})
    
    return FeePlanResponse(**plan_data)

@api_router.get("/fees/plans", response_model=List[FeePlanResponse])
async def get_fee_plans(school_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"is_active": True}
    if school_id:
        query["school_id"] = school_id
    plans = await db.fee_plans.find(query, {"_id": 0}).to_list(100)
    return [FeePlanResponse(**p) for p in plans]

@api_router.post("/fees/invoices", response_model=FeeInvoiceResponse)
async def create_fee_invoice(invoice: FeeInvoiceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "accountant", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    invoice_data = {
        "id": str(uuid.uuid4()),
        "invoice_no": generate_invoice_no(),
        **invoice.model_dump(),
        "final_amount": invoice.amount - invoice.discount,
        "status": "pending",
        "paid_amount": 0,
        "payment_date": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fee_invoices.insert_one(invoice_data)
    await log_audit(current_user["id"], "create", "fee_invoices", {"invoice_id": invoice_data["id"]})
    
    return FeeInvoiceResponse(**invoice_data)

@api_router.get("/fees/invoices", response_model=List[FeeInvoiceResponse])
async def get_fee_invoices(
    school_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if school_id:
        query["school_id"] = school_id
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    
    invoices = await db.fee_invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with student names
    for inv in invoices:
        student = await db.students.find_one({"id": inv["student_id"]}, {"_id": 0, "name": 1})
        if student:
            inv["student_name"] = student["name"]
    
    return [FeeInvoiceResponse(**i) for i in invoices]

@api_router.post("/fees/payments", response_model=FeePaymentResponse)
async def create_fee_payment(payment: FeePaymentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "accountant", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get invoice
    invoice = await db.fee_invoices.find_one({"id": payment.invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update invoice
    new_paid = invoice.get("paid_amount", 0) + payment.amount
    new_status = "paid" if new_paid >= invoice["final_amount"] else "partial"
    
    await db.fee_invoices.update_one(
        {"id": payment.invoice_id},
        {"$set": {
            "paid_amount": new_paid,
            "status": new_status,
            "payment_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    payment_data = {
        "id": str(uuid.uuid4()),
        "receipt_no": generate_receipt_no(),
        **payment.model_dump(),
        "received_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fee_payments.insert_one(payment_data)
    await log_audit(current_user["id"], "create", "fee_payments", {"payment_id": payment_data["id"], "amount": payment.amount})
    
    return FeePaymentResponse(**payment_data)

@api_router.get("/fees/payments", response_model=List[FeePaymentResponse])
async def get_fee_payments(
    invoice_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if invoice_id:
        query["invoice_id"] = invoice_id
    if from_date and to_date:
        query["created_at"] = {"$gte": from_date, "$lte": to_date}
    
    payments = await db.fee_payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [FeePaymentResponse(**p) for p in payments]

@api_router.get("/fees/stats")
async def get_fee_stats(school_id: str, month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Total expected
    invoices = await db.fee_invoices.find({"school_id": school_id, "month": month}, {"_id": 0}).to_list(1000)
    total_expected = sum(i.get("final_amount", 0) for i in invoices)
    total_collected = sum(i.get("paid_amount", 0) for i in invoices)
    pending = total_expected - total_collected
    
    return {
        "month": month,
        "total_expected": total_expected,
        "total_collected": total_collected,
        "pending": pending,
        "collection_rate": round((total_collected / total_expected * 100) if total_expected > 0 else 0, 2)
    }

# ==================== NOTICE ROUTES ====================

@api_router.post("/notices", response_model=NoticeResponse)
async def create_notice(notice: NoticeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notice_data = {
        "id": str(uuid.uuid4()),
        **notice.model_dump(),
        "created_by": current_user["id"],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notices.insert_one(notice_data)
    await log_audit(current_user["id"], "create", "notices", {"notice_id": notice_data["id"], "title": notice.title})
    
    # Get creator name
    notice_data["created_by_name"] = current_user["name"]
    
    return NoticeResponse(**notice_data)

@api_router.get("/notices", response_model=List[NoticeResponse])
async def get_notices(
    school_id: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_active": True}
    if school_id:
        query["school_id"] = school_id
    if priority:
        query["priority"] = priority
    
    notices = await db.notices.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with creator names
    for notice in notices:
        user = await db.users.find_one({"id": notice.get("created_by")}, {"_id": 0, "name": 1})
        if user:
            notice["created_by_name"] = user["name"]
    
    return [NoticeResponse(**n) for n in notices]

@api_router.delete("/notices/{notice_id}")
async def delete_notice(notice_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.notices.update_one({"id": notice_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    await log_audit(current_user["id"], "delete", "notices", {"notice_id": notice_id})
    return {"message": "Notice deleted successfully"}

# ==================== AUDIT LOG ROUTES ====================

@api_router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    module: Optional[str] = None,
    user_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["director", "principal", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {}
    if module:
        query["module"] = module
    if user_id:
        query["user_id"] = user_id
    if from_date and to_date:
        query["created_at"] = {"$gte": from_date, "$lte": to_date}
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    # Enrich with user names
    for log in logs:
        user = await db.users.find_one({"id": log["user_id"]}, {"_id": 0, "name": 1})
        if user:
            log["user_name"] = user["name"]
    
    return [AuditLogResponse(**log_item) for log_item in logs]

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(school_id: str, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Counts
    total_students = await db.students.count_documents({"school_id": school_id, "is_active": True})
    total_staff = await db.staff.count_documents({"school_id": school_id, "is_active": True})
    total_classes = await db.classes.count_documents({"school_id": school_id})
    
    # Attendance today
    present = await db.attendance.count_documents({"school_id": school_id, "date": today, "status": "present"})
    absent = await db.attendance.count_documents({"school_id": school_id, "date": today, "status": "absent"})
    late = await db.attendance.count_documents({"school_id": school_id, "date": today, "status": "late"})
    
    # Fee collection this month
    invoices = await db.fee_invoices.find({"school_id": school_id, "month": current_month}, {"_id": 0}).to_list(1000)
    fee_collected = sum(i.get("paid_amount", 0) for i in invoices)
    pending_fees = sum(i.get("final_amount", 0) - i.get("paid_amount", 0) for i in invoices)
    
    # Recent notices
    recent_notices = await db.notices.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0, "id": 1, "title": 1, "priority": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(5)
    
    # Recent audit logs
    recent_activities = await db.audit_logs.find(
        {},
        {"_id": 0, "action": 1, "module": 1, "user_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(10)
    
    for activity in recent_activities:
        user = await db.users.find_one({"id": activity["user_id"]}, {"_id": 0, "name": 1})
        if user:
            activity["user_name"] = user["name"]
    
    return DashboardStats(
        total_students=total_students,
        total_staff=total_staff,
        total_classes=total_classes,
        attendance_today={"present": present, "absent": absent, "late": late},
        fee_collection_month=fee_collected,
        pending_fees=pending_fees,
        recent_notices=recent_notices,
        recent_activities=recent_activities
    )

# ==================== AI PAPER GENERATOR ====================

@api_router.post("/ai/generate-paper", response_model=PaperGenerateResponse)
async def generate_paper(request: PaperGenerateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["director", "principal", "teacher", "exam_controller", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        system_prompt = f"""You are an expert question paper generator for Indian schools. 
Generate questions for {request.class_name} students in {request.subject} subject.
Chapter/Topic: {request.chapter}
Difficulty: {request.difficulty}
Total Marks: {request.total_marks}
Time Duration: {request.time_duration} minutes
Language: {request.language}

Generate questions in these types: {', '.join(request.question_types)}

Return JSON format:
{{
    "questions": [
        {{
            "type": "mcq|short|long|fill_blank",
            "question": "question text",
            "options": ["a", "b", "c", "d"],  // only for mcq
            "answer": "correct answer",
            "marks": 1,
            "difficulty": "easy|medium|hard"
        }}
    ]
}}

Ensure:
- Questions are age-appropriate
- Mix of difficulty levels
- Total marks match {request.total_marks}
- Clear and grammatically correct questions
- Provide answer key"""

        chat = LlmChat(
            api_key=openai_key,
            session_id=f"paper-{str(uuid.uuid4())[:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=f"Generate a {request.subject} question paper for {request.class_name} on {request.chapter}")
        response = await chat.send_message(user_msg)
        
        # Parse response
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            questions_data = json.loads(json_match.group())
        else:
            questions_data = {"questions": []}
        
        paper_data = {
            "id": str(uuid.uuid4()),
            "subject": request.subject,
            "class_name": request.class_name,
            "chapter": request.chapter,
            "questions": questions_data.get("questions", []),
            "total_marks": request.total_marks,
            "time_duration": request.time_duration,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Save to DB
        await db.generated_papers.insert_one(paper_data)
        await log_audit(current_user["id"], "generate", "ai_papers", {"paper_id": paper_data["id"], "subject": request.subject})
        
        return PaperGenerateResponse(**paper_data)
        
    except Exception as e:
        logging.error(f"AI Paper generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate paper: {str(e)}")

@api_router.get("/ai/papers", response_model=List[PaperGenerateResponse])
async def get_generated_papers(
    subject: Optional[str] = None,
    class_name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if subject:
        query["subject"] = subject
    if class_name:
        query["class_name"] = class_name
    
    papers = await db.generated_papers.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [PaperGenerateResponse(**p) for p in papers]

# ==================== AI CONTENT GENERATOR (Pamphlets/Banners) ====================

class ContentGenerateRequest(BaseModel):
    content_type: str  # admission_pamphlet, topper_banner, event_poster, activity_banner
    school_name: str
    details: Dict[str, Any]  # Dynamic based on content_type
    language: str = "english"
    generate_image: bool = True  # New: Generate image along with text

class ContentGenerateResponse(BaseModel):
    id: str
    content_type: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None  # New: For inline image display
    text_content: str
    created_at: str

@api_router.post("/ai/generate-content", response_model=ContentGenerateResponse)
async def generate_ai_content(request: ContentGenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generate AI-powered pamphlets, banners, posters for school with IMAGE"""
    if current_user["role"] not in ["director", "principal", "vice_principal"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        raise HTTPException(status_code=500, detail="Emergent LLM key not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import base64
        
        content_id = str(uuid.uuid4())
        text_content = ""
        image_base64 = None
        
        # Image generation prompts based on content type
        image_prompts = {
            "admission_pamphlet": f"""Create a professional and vibrant school admission pamphlet/flyer design for an Indian school.
School Name: {request.school_name}
Academic Year: {request.details.get('academic_year', '2025-26')}
Classes Offered: {request.details.get('classes', 'Nursery to Class 12')}
Key Features: {request.details.get('features', 'Smart Classes, Sports, Computer Lab, Science Lab')}
Contact: {request.details.get('contact', '')}

Design Requirements:
- Modern, colorful design suitable for Indian school
- Include school name prominently at top
- Show happy students/school imagery
- Display "Admissions Open" text
- Include key features as bullet points or icons
- Professional and trustworthy look
- Bright colors like blue, green, orange
- Include contact information area""",

            "topper_banner": f"""Create a celebratory congratulations banner for a school topper/achiever.
School Name: {request.school_name}
Student Name: {request.details.get('student_name', 'Student Name')}
Class: {request.details.get('class', '')}
Marks/Percentage: {request.details.get('marks', '95%')}
Achievement: {request.details.get('achievement', 'Class Topper')}

Design Requirements:
- Festive, celebratory design
- Gold/yellow colors for achievement theme
- "Congratulations" text prominently displayed
- Space for student photo placeholder (circle)
- School name and logo area
- Stars, confetti, trophy imagery
- Professional Indian school style""",

            "event_poster": f"""Create an attractive event poster for a school function/event.
School Name: {request.school_name}
Event Name: {request.details.get('event_name', 'Annual Day')}
Event Date: {request.details.get('date', '')}
Venue: {request.details.get('venue', 'School Auditorium')}
Description: {request.details.get('description', 'You are cordially invited')}

Design Requirements:
- Eye-catching, festive design
- Event name prominently displayed
- Date and venue clearly visible
- Indian school event theme
- Colorful and inviting
- Include decorative elements
- Professional yet fun design""",

            "activity_banner": f"""Create an announcement banner for a school activity/program.
School Name: {request.school_name}
Activity Name: {request.details.get('activity', 'Science Exhibition')}
Details: {request.details.get('details', 'All students are invited to participate')}

Design Requirements:
- Informative, engaging design
- Activity name clearly visible
- School branding
- Relevant imagery for the activity
- Call to action style
- Bright, appealing colors"""
        }
        
        # Text content prompts
        text_prompts = {
            "admission_pamphlet": f"""Create admission pamphlet text content for {request.school_name}:
- Academic Year: {request.details.get('academic_year', '2025-26')}
- Classes: {request.details.get('classes', 'Nursery to 12th')}
- Features: {request.details.get('features', 'Smart Classes, Sports, Labs')}
- Contact: {request.details.get('contact', '')}
Generate: Catchy tagline, 5 key selling points, admission process brief.
Language: {request.language}. Make it professional.""",

            "topper_banner": f"""Create congratulatory text for school topper banner:
- School: {request.school_name}
- Student: {request.details.get('student_name', '')}
- Class: {request.details.get('class', '')}
- Marks: {request.details.get('marks', '')}
Generate: Congratulation message, inspirational quote.
Language: {request.language}.""",

            "event_poster": f"""Create event poster text content:
- School: {request.school_name}
- Event: {request.details.get('event_name', '')}
- Date: {request.details.get('date', '')}
- Venue: {request.details.get('venue', '')}
Generate: Invitation text, event highlights.
Language: {request.language}.""",

            "activity_banner": f"""Create activity banner text:
- School: {request.school_name}
- Activity: {request.details.get('activity', '')}
- Details: {request.details.get('details', '')}
Generate: Announcement text, participation details.
Language: {request.language}."""
        }
        
        # Step 1: Generate text content
        text_chat = LlmChat(
            api_key=emergent_key,
            session_id=f"text-{content_id[:8]}",
            system_message="You are a professional content creator for Indian schools. Create engaging content in the requested language."
        ).with_model("openai", "gpt-4o")
        
        text_prompt = text_prompts.get(request.content_type, text_prompts["admission_pamphlet"])
        text_msg = UserMessage(text=text_prompt)
        text_content = await text_chat.send_message(text_msg)
        
        # Step 2: Generate image if requested
        if request.generate_image:
            try:
                image_chat = LlmChat(
                    api_key=emergent_key,
                    session_id=f"image-{content_id[:8]}",
                    system_message="You are a professional graphic designer creating school marketing materials."
                ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
                
                image_prompt = image_prompts.get(request.content_type, image_prompts["admission_pamphlet"])
                image_msg = UserMessage(text=image_prompt)
                
                img_text, images = await image_chat.send_message_multimodal_response(image_msg)
                
                if images and len(images) > 0:
                    image_base64 = images[0].get('data', '')
                    logging.info(f"Image generated successfully, base64 length: {len(image_base64) if image_base64 else 0}")
                    
            except Exception as img_error:
                logging.error(f"Image generation failed: {str(img_error)}")
                # Continue without image
        
        content_data = {
            "id": content_id,
            "content_type": request.content_type,
            "school_name": request.school_name,
            "details": request.details,
            "text_content": text_content,
            "image_base64": image_base64,
            "image_url": None,
            "created_by": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Don't store huge base64 in DB, store separately or just keep reference
        db_data = {**content_data}
        db_data["has_image"] = image_base64 is not None
        db_data.pop("image_base64", None)  # Don't store base64 in main collection
        
        await db.ai_content.insert_one(db_data)
        await log_audit(current_user["id"], "generate_content", "ai_content", {
            "type": request.content_type,
            "school": request.school_name,
            "has_image": image_base64 is not None
        })
        
        return ContentGenerateResponse(
            id=content_data["id"],
            content_type=content_data["content_type"],
            text_content=content_data["text_content"],
            image_base64=image_base64,
            image_url=content_data["image_url"],
            created_at=content_data["created_at"]
        )
        
    except Exception as e:
        logging.error(f"AI Content generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

# ==================== TEACHTINO - TEACHER PORTAL ROUTES ====================

class TeacherDashboardStats(BaseModel):
    my_classes: List[Dict[str, Any]]
    total_students: int
    attendance_today: Dict[str, int]
    pending_homework: int
    upcoming_exams: int
    recent_notices: List[Dict[str, Any]]

@api_router.get("/teacher/dashboard", response_model=TeacherDashboardStats)
async def get_teacher_dashboard(current_user: dict = Depends(get_current_user)):
    """Dashboard for TeachTino - Teacher Portal"""
    if current_user["role"] not in ["teacher", "principal", "vice_principal", "director"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    school_id = current_user.get("school_id")
    
    # Get classes where user is class teacher
    my_classes = await db.classes.find(
        {"class_teacher_id": current_user["id"]},
        {"_id": 0}
    ).to_list(20)
    
    # If no specific classes, get all classes for school (for principal/director)
    if not my_classes and current_user["role"] in ["principal", "vice_principal", "director"]:
        my_classes = await db.classes.find(
            {"school_id": school_id},
            {"_id": 0}
        ).to_list(50)
    
    # Get total students in my classes
    class_ids = [c["id"] for c in my_classes]
    total_students = await db.students.count_documents({
        "class_id": {"$in": class_ids},
        "status": "active"
    }) if class_ids else 0
    
    # Today's attendance
    present = await db.attendance.count_documents({
        "class_id": {"$in": class_ids},
        "date": today,
        "status": "present"
    }) if class_ids else 0
    absent = await db.attendance.count_documents({
        "class_id": {"$in": class_ids},
        "date": today,
        "status": "absent"
    }) if class_ids else 0
    
    # Recent notices
    notices = await db.notices.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0, "id": 1, "title": 1, "priority": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(5)
    
    return TeacherDashboardStats(
        my_classes=my_classes,
        total_students=total_students,
        attendance_today={"present": present, "absent": absent},
        pending_homework=0,  # TODO: Implement homework module
        upcoming_exams=0,  # TODO: Implement exam schedule
        recent_notices=notices
    )

@api_router.get("/teacher/my-classes")
async def get_my_classes(current_user: dict = Depends(get_current_user)):
    """Get classes assigned to teacher"""
    if current_user["role"] not in ["teacher", "principal", "vice_principal", "director"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    classes = await db.classes.find(
        {"class_teacher_id": current_user["id"]},
        {"_id": 0}
    ).to_list(20)
    
    # Enrich with student count
    for cls in classes:
        cls["student_count"] = await db.students.count_documents({
            "class_id": cls["id"],
            "status": "active"
        })
    
    return classes

@api_router.get("/teacher/class/{class_id}/students")
async def get_class_students(class_id: str, current_user: dict = Depends(get_current_user)):
    """Get all students in a class for teacher"""
    students = await db.students.find(
        {"class_id": class_id, "status": "active"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return students

# ==================== STUDYTINO - STUDENT PORTAL ROUTES ====================

class StudentDashboardStats(BaseModel):
    profile: Dict[str, Any]
    attendance_summary: Dict[str, Any]
    fee_status: Dict[str, Any]
    recent_notices: List[Dict[str, Any]]
    timetable: List[Dict[str, Any]]

@api_router.get("/student/dashboard")
async def get_student_dashboard(current_user: dict = Depends(get_current_user)):
    """Dashboard for StudyTino - Student Portal"""
    # Get student by user ID or student_id
    student = await db.students.find_one(
        {"id": current_user.get("id")},
        {"_id": 0, "password": 0}
    )
    
    if not student:
        # Try finding by student_id if it's a student login
        student = await db.students.find_one(
            {"student_id": current_user.get("student_id")},
            {"_id": 0, "password": 0}
        )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    school_id = student["school_id"]
    
    # Get class info
    class_info = await db.classes.find_one({"id": student["class_id"]}, {"_id": 0})
    
    # Attendance summary (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    attendance = await db.attendance.find({
        "student_id": student["id"],
        "date": {"$gte": thirty_days_ago}
    }, {"_id": 0}).to_list(30)
    
    present_days = len([a for a in attendance if a["status"] == "present"])
    absent_days = len([a for a in attendance if a["status"] == "absent"])
    total_days = len(attendance) or 1
    
    # Fee status
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    fee_invoices = await db.fee_invoices.find({
        "student_id": student["id"]
    }, {"_id": 0}).sort("created_at", -1).to_list(5)
    
    pending_fees = sum(
        inv.get("final_amount", 0) - inv.get("paid_amount", 0) 
        for inv in fee_invoices if inv.get("status") != "paid"
    )
    
    # Recent notices for students
    notices = await db.notices.find({
        "school_id": school_id,
        "is_active": True,
        "target_audience": {"$in": ["all", "students", "parents"]}
    }, {"_id": 0}).sort("created_at", -1).to_list(5)
    
    return {
        "profile": {
            **student,
            "class_name": class_info["name"] if class_info else "",
            "section": class_info["section"] if class_info else ""
        },
        "attendance_summary": {
            "present": present_days,
            "absent": absent_days,
            "total": total_days,
            "percentage": round(present_days / total_days * 100, 1)
        },
        "fee_status": {
            "pending": pending_fees,
            "recent_invoices": fee_invoices
        },
        "recent_notices": notices,
        "timetable": []  # TODO: Implement timetable
    }

@api_router.get("/student/attendance")
async def get_student_attendance(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get student's attendance history"""
    student = await db.students.find_one(
        {"$or": [{"id": current_user.get("id")}, {"student_id": current_user.get("student_id")}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    query = {"student_id": student["id"]}
    if from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}
    
    attendance = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return attendance

@api_router.get("/student/fees")
async def get_student_fees(current_user: dict = Depends(get_current_user)):
    """Get student's fee details"""
    student = await db.students.find_one(
        {"$or": [{"id": current_user.get("id")}, {"student_id": current_user.get("student_id")}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    invoices = await db.fee_invoices.find(
        {"student_id": student["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {
        "invoices": invoices,
        "total_pending": sum(
            inv.get("final_amount", 0) - inv.get("paid_amount", 0) 
            for inv in invoices if inv.get("status") != "paid"
        )
    }

@api_router.get("/student/notices")
async def get_student_notices(current_user: dict = Depends(get_current_user)):
    """Get notices relevant to student"""
    student = await db.students.find_one(
        {"$or": [{"id": current_user.get("id")}, {"student_id": current_user.get("student_id")}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    notices = await db.notices.find({
        "school_id": student["school_id"],
        "is_active": True,
        "target_audience": {"$in": ["all", "students", "parents"]}
    }, {"_id": 0}).sort("created_at", -1).to_list(20)
    
    return notices

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== IMAGE UPLOAD & GALLERY ====================

class ImageUploadResponse(BaseModel):
    id: str
    filename: str
    url: str
    category: str
    uploaded_at: str

@api_router.post("/images/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form(default="gallery"),  # gallery, event, notice, student, staff
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=None),
    current_user: dict = Depends(get_current_user)
):
    """Upload image to school gallery"""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF images allowed")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = UPLOAD_DIR / "images" / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Store in DB
    image_data = {
        "id": str(uuid.uuid4()),
        "filename": unique_filename,
        "original_name": file.filename,
        "url": f"/api/images/{unique_filename}",
        "category": category,
        "title": title or file.filename,
        "description": description,
        "school_id": current_user.get("school_id"),
        "uploaded_by": current_user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.images.insert_one(image_data)
    await log_audit(current_user["id"], "upload", "images", {"filename": unique_filename, "category": category})
    
    return ImageUploadResponse(
        id=image_data["id"],
        filename=unique_filename,
        url=image_data["url"],
        category=category,
        uploaded_at=image_data["uploaded_at"]
    )

@api_router.get("/images/{filename}")
async def get_image(filename: str):
    """Serve uploaded image"""
    file_path = UPLOAD_DIR / "images" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

@api_router.get("/images")
async def list_images(
    category: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """List all uploaded images"""
    query = {"school_id": current_user.get("school_id")}
    if category:
        query["category"] = category
    
    images = await db.images.find(query, {"_id": 0}).sort("uploaded_at", -1).to_list(limit)
    return images

@api_router.delete("/images/{image_id}")
async def delete_image(image_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an image"""
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file
    file_path = UPLOAD_DIR / "images" / image["filename"]
    if file_path.exists():
        file_path.unlink()
    
    await db.images.delete_one({"id": image_id})
    return {"message": "Image deleted"}

# ==================== QR CODE GENERATOR ====================

@api_router.get("/qr/student/{student_id}")
async def generate_student_qr(student_id: str, current_user: dict = Depends(get_current_user)):
    """Generate QR code for student ID card"""
    student = await db.students.find_one({"id": student_id}, {"_id": 0, "password": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # QR data contains student info
    qr_data = f"SCHOOLTINO|STUDENT|{student['student_id']}|{student['name']}|{student.get('class_id', '')}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "student_id": student["student_id"],
        "name": student["name"],
        "qr_code": qr_base64,
        "qr_data": qr_data
    }

@api_router.get("/qr/staff/{staff_id}")
async def generate_staff_qr(staff_id: str, current_user: dict = Depends(get_current_user)):
    """Generate QR code for staff ID card"""
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    qr_data = f"SCHOOLTINO|STAFF|{staff['id']}|{staff['name']}|{staff.get('role', '')}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "staff_id": staff["id"],
        "name": staff["name"],
        "qr_code": qr_base64
    }

# ==================== SMS & NOTIFICATION SYSTEM ====================

class SMSRequest(BaseModel):
    recipient_type: str  # all_parents, class, individual
    class_id: Optional[str] = None
    student_id: Optional[str] = None
    mobile: Optional[str] = None
    message: str
    template: Optional[str] = None  # fee_reminder, attendance_alert, notice, custom

class SMSResponse(BaseModel):
    id: str
    recipients_count: int
    status: str
    sent_at: str

@api_router.post("/sms/send", response_model=SMSResponse)
async def send_sms(request: SMSRequest, current_user: dict = Depends(get_current_user)):
    """Send SMS to parents/guardians (Mock - ready for Twilio integration)"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "accountant"]:
        raise HTTPException(status_code=403, detail="Not authorized to send SMS")
    
    recipients = []
    
    if request.recipient_type == "all_parents":
        students = await db.students.find(
            {"school_id": current_user.get("school_id"), "status": "active"},
            {"_id": 0, "parent_mobile": 1, "name": 1}
        ).to_list(1000)
        recipients = [s for s in students if s.get("parent_mobile")]
        
    elif request.recipient_type == "class" and request.class_id:
        students = await db.students.find(
            {"class_id": request.class_id, "status": "active"},
            {"_id": 0, "parent_mobile": 1, "name": 1}
        ).to_list(100)
        recipients = [s for s in students if s.get("parent_mobile")]
        
    elif request.recipient_type == "individual":
        if request.student_id:
            student = await db.students.find_one({"id": request.student_id}, {"_id": 0, "parent_mobile": 1, "name": 1})
            if student and student.get("parent_mobile"):
                recipients = [student]
        elif request.mobile:
            recipients = [{"parent_mobile": request.mobile, "name": "Individual"}]
    
    # Log SMS (Mock - would integrate with Twilio/MSG91 in production)
    sms_log = {
        "id": str(uuid.uuid4()),
        "message": request.message,
        "template": request.template,
        "recipients_count": len(recipients),
        "recipients": [r.get("parent_mobile") for r in recipients],
        "status": "sent",  # Mock status
        "sent_by": current_user["id"],
        "school_id": current_user.get("school_id"),
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sms_logs.insert_one(sms_log)
    await log_audit(current_user["id"], "send_sms", "sms", {"recipients": len(recipients), "template": request.template})
    
    return SMSResponse(
        id=sms_log["id"],
        recipients_count=len(recipients),
        status="sent",
        sent_at=sms_log["sent_at"]
    )

@api_router.get("/sms/templates")
async def get_sms_templates():
    """Get predefined SMS templates"""
    return {
        "templates": [
            {
                "id": "fee_reminder",
                "name": "Fee Reminder",
                "message": "Dear Parent, This is a reminder that fee of Rs. {amount} for {student_name} is pending. Please pay by {due_date}. - {school_name}"
            },
            {
                "id": "attendance_alert",
                "name": "Attendance Alert",
                "message": "Dear Parent, Your ward {student_name} was marked {status} on {date}. - {school_name}"
            },
            {
                "id": "exam_notice",
                "name": "Exam Notice",
                "message": "Dear Parent, Exams for {student_name} will begin from {date}. Please ensure regular attendance. - {school_name}"
            },
            {
                "id": "result_declared",
                "name": "Result Declared",
                "message": "Dear Parent, Results for {exam_name} are now available. {student_name} scored {marks}. - {school_name}"
            }
        ]
    }

# ==================== REPORT CARD GENERATOR ====================

class ReportCardRequest(BaseModel):
    student_id: str
    exam_name: str
    subjects: List[Dict[str, Any]]  # [{subject, marks_obtained, total_marks, grade}]
    remarks: Optional[str] = None
    class_teacher_name: Optional[str] = None

class ReportCardResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    class_name: str
    exam_name: str
    total_marks: int
    obtained_marks: int
    percentage: float
    grade: str
    subjects: List[Dict[str, Any]]
    created_at: str

@api_router.post("/reports/generate", response_model=ReportCardResponse)
async def generate_report_card(request: ReportCardRequest, current_user: dict = Depends(get_current_user)):
    """Generate student report card"""
    student = await db.students.find_one({"id": request.student_id}, {"_id": 0, "password": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get class info
    class_info = await db.classes.find_one({"id": student.get("class_id")}, {"_id": 0})
    
    # Calculate totals
    total_marks = sum(s.get("total_marks", 100) for s in request.subjects)
    obtained_marks = sum(s.get("marks_obtained", 0) for s in request.subjects)
    percentage = round((obtained_marks / total_marks) * 100, 2) if total_marks > 0 else 0
    
    # Calculate grade
    if percentage >= 90:
        grade = "A+"
    elif percentage >= 80:
        grade = "A"
    elif percentage >= 70:
        grade = "B+"
    elif percentage >= 60:
        grade = "B"
    elif percentage >= 50:
        grade = "C"
    elif percentage >= 40:
        grade = "D"
    else:
        grade = "F"
    
    report_card = {
        "id": str(uuid.uuid4()),
        "student_id": student["id"],
        "student_name": student["name"],
        "student_roll": student.get("admission_no", ""),
        "class_id": student.get("class_id"),
        "class_name": f"{class_info['name']} - {class_info.get('section', '')}" if class_info else "",
        "exam_name": request.exam_name,
        "subjects": request.subjects,
        "total_marks": total_marks,
        "obtained_marks": obtained_marks,
        "percentage": percentage,
        "grade": grade,
        "remarks": request.remarks,
        "class_teacher_name": request.class_teacher_name,
        "school_id": current_user.get("school_id"),
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.report_cards.insert_one(report_card)
    await log_audit(current_user["id"], "generate", "report_cards", {"student": student["name"], "exam": request.exam_name})
    
    return ReportCardResponse(
        id=report_card["id"],
        student_id=report_card["student_id"],
        student_name=report_card["student_name"],
        class_name=report_card["class_name"],
        exam_name=report_card["exam_name"],
        total_marks=report_card["total_marks"],
        obtained_marks=report_card["obtained_marks"],
        percentage=report_card["percentage"],
        grade=report_card["grade"],
        subjects=report_card["subjects"],
        created_at=report_card["created_at"]
    )

@api_router.get("/reports/student/{student_id}")
async def get_student_reports(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get all report cards for a student"""
    reports = await db.report_cards.find({"student_id": student_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return reports

# ==================== WEBSITE INTEGRATION API ====================
# Public API endpoints for school websites to fetch data

@api_router.get("/public/school/{school_id}/info")
async def get_public_school_info(school_id: str):
    """Public API - Get school info for external website"""
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Return only public info
    return {
        "name": school.get("name"),
        "address": school.get("address"),
        "city": school.get("city"),
        "state": school.get("state"),
        "board": school.get("board_type"),
        "logo_url": school.get("logo_url"),
        "contact": school.get("contact"),
        "email": school.get("email"),
        "website": school.get("website")
    }

@api_router.get("/public/school/{school_id}/notices")
async def get_public_notices(school_id: str, limit: int = 10):
    """Public API - Get active notices for external website"""
    notices = await db.notices.find(
        {"school_id": school_id, "is_active": True, "is_public": True},
        {"_id": 0, "id": 1, "title": 1, "content": 1, "priority": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(limit)
    return {"notices": notices}

@api_router.get("/public/school/{school_id}/events")
async def get_public_events(school_id: str, limit: int = 10):
    """Public API - Get upcoming events for external website"""
    events = await db.events.find(
        {"school_id": school_id, "is_public": True},
        {"_id": 0}
    ).sort("event_date", 1).to_list(limit)
    return {"events": events}

@api_router.get("/public/school/{school_id}/gallery")
async def get_public_gallery(school_id: str, limit: int = 20):
    """Public API - Get school gallery images for external website"""
    images = await db.images.find(
        {"school_id": school_id, "category": {"$in": ["gallery", "event"]}},
        {"_id": 0, "id": 1, "url": 1, "title": 1, "category": 1, "uploaded_at": 1}
    ).sort("uploaded_at", -1).to_list(limit)
    return {"images": images}

@api_router.get("/public/school/{school_id}/results")
async def get_public_results(school_id: str, exam_name: Optional[str] = None):
    """Public API - Get published results for external website"""
    query = {"school_id": school_id, "is_published": True}
    if exam_name:
        query["exam_name"] = exam_name
    
    results = await db.report_cards.find(
        query,
        {"_id": 0, "student_name": 1, "class_name": 1, "exam_name": 1, "percentage": 1, "grade": 1}
    ).sort("percentage", -1).to_list(100)
    return {"results": results}

# ==================== AI VOICE ASSISTANT ====================

class VoiceCommandRequest(BaseModel):
    command: str  # Text from speech-to-text
    context: Optional[Dict[str, Any]] = None  # Current page, selected items

class VoiceCommandResponse(BaseModel):
    action: str  # navigate, create, read, update, confirm
    message: str
    data: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False

@api_router.post("/ai/voice-command", response_model=VoiceCommandResponse)
async def process_voice_command(request: VoiceCommandRequest, current_user: dict = Depends(get_current_user)):
    """Process voice command from AI assistant"""
    command = request.command.lower().strip()
    
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        raise HTTPException(status_code=500, detail="AI key not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        system_prompt = f"""You are an AI assistant for Schooltino school management system. 
The current user is {current_user['name']} with role {current_user['role']}.

Based on the voice command, determine the action and respond in JSON format:
{{
    "action": "navigate|create|read|update|delete|generate|confirm",
    "target": "dashboard|students|staff|attendance|fees|notices|reports|ai-content",
    "message": "Human readable response",
    "data": {{any relevant data}},
    "requires_confirmation": true/false
}}

Common commands:
- "dashboard dikhao" → navigate to dashboard
- "attendance mark karo" → navigate to attendance
- "student add karo" → navigate to students with create mode
- "fee reminder bhejo" → navigate to SMS with fee template
- "pamphlet banao" → navigate to AI content studio
- "notice publish karo" → navigate to notices
- "report card banao" → navigate to reports

Respond in Hinglish (Hindi + English mix)."""

        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"voice-{current_user['id'][:8]}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=f"Voice command: {request.command}")
        response = await chat.send_message(user_msg)
        
        # Parse JSON response
        import json
        import re
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {
                "action": "error",
                "message": response,
                "requires_confirmation": False
            }
        
        return VoiceCommandResponse(
            action=result.get("action", "unknown"),
            message=result.get("message", "Command processed"),
            data=result.get("data"),
            requires_confirmation=result.get("requires_confirmation", False)
        )
        
    except Exception as e:
        logging.error(f"Voice command error: {str(e)}")
        return VoiceCommandResponse(
            action="error",
            message=f"Sorry, couldn't process command: {str(e)}",
            requires_confirmation=False
        )

# ==================== AI IMAGE FROM UPLOADED PHOTOS ====================

@api_router.post("/ai/generate-from-image")
async def generate_content_from_image(
    image_id: str = Form(...),
    content_type: str = Form(default="admission_pamphlet"),
    school_name: str = Form(...),
    additional_text: Optional[str] = Form(default=None),
    current_user: dict = Depends(get_current_user)
):
    """Generate AI content using uploaded school image"""
    if current_user["role"] not in ["director", "principal", "vice_principal"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get uploaded image
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Read image file
    file_path = UPLOAD_DIR / "images" / image["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        raise HTTPException(status_code=500, detail="AI key not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        # Read image as base64
        with open(file_path, "rb") as f:
            image_bytes = f.read()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Generate with image reference
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"img-gen-{str(uuid.uuid4())[:8]}",
            system_message="You are a professional graphic designer. Create school promotional material."
        ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        prompt = f"""Using the school image provided, create a professional {content_type} design for {school_name}.
{additional_text or ''}
Make it attractive, professional, and suitable for Indian schools."""

        msg = UserMessage(
            text=prompt,
            file_contents=[ImageContent(image_base64)]
        )
        
        text_response, generated_images = await chat.send_message_multimodal_response(msg)
        
        result_image = None
        if generated_images and len(generated_images) > 0:
            result_image = generated_images[0].get('data', '')
        
        return {
            "success": True,
            "text_content": text_response,
            "generated_image": result_image,
            "source_image_id": image_id
        }
        
    except Exception as e:
        logging.error(f"AI image generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate: {str(e)}")

# ==================== PARENT COMMUNICATION ====================

class MessageRequest(BaseModel):
    recipient_type: str  # parent, teacher, admin
    recipient_id: Optional[str] = None
    student_id: Optional[str] = None  # For parent messages
    subject: str
    message: str

@api_router.post("/messages/send")
async def send_message(request: MessageRequest, current_user: dict = Depends(get_current_user)):
    """Send internal message"""
    message_data = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "sender_role": current_user["role"],
        "recipient_type": request.recipient_type,
        "recipient_id": request.recipient_id,
        "student_id": request.student_id,
        "subject": request.subject,
        "message": request.message,
        "is_read": False,
        "school_id": current_user.get("school_id"),
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_data)
    
    return {"success": True, "message_id": message_data["id"]}

@api_router.get("/messages/inbox")
async def get_inbox(current_user: dict = Depends(get_current_user)):
    """Get user's inbox messages"""
    messages = await db.messages.find(
        {"recipient_id": current_user["id"]},
        {"_id": 0}
    ).sort("sent_at", -1).to_list(50)
    return {"messages": messages}

@api_router.get("/messages/sent")
async def get_sent_messages(current_user: dict = Depends(get_current_user)):
    """Get user's sent messages"""
    messages = await db.messages.find(
        {"sender_id": current_user["id"]},
        {"_id": 0}
    ).sort("sent_at", -1).to_list(50)
    return {"messages": messages}

# ==================== WEBSITE SYNC SETTINGS ====================

class WebsiteSyncRequest(BaseModel):
    website_url: str
    api_key: Optional[str] = None
    sync_notices: bool = True
    sync_events: bool = True
    sync_gallery: bool = True
    sync_results: bool = False

@api_router.post("/website/configure")
async def configure_website_sync(request: WebsiteSyncRequest, current_user: dict = Depends(get_current_user)):
    """Configure website sync settings"""
    if current_user["role"] not in ["director", "principal"]:
        raise HTTPException(status_code=403, detail="Only Director/Principal can configure website sync")
    
    school_id = current_user.get("school_id")
    
    config = {
        "school_id": school_id,
        "website_url": request.website_url,
        "api_key": request.api_key or str(uuid.uuid4()),
        "sync_notices": request.sync_notices,
        "sync_events": request.sync_events,
        "sync_gallery": request.sync_gallery,
        "sync_results": request.sync_results,
        "configured_by": current_user["id"],
        "configured_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert config
    await db.website_config.update_one(
        {"school_id": school_id},
        {"$set": config},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Website sync configured successfully",
        "api_key": config["api_key"],
        "embed_code": f'<script src="https://schooltino.com/widget.js" data-school="{school_id}" data-key="{config["api_key"]}"></script>'
    }

@api_router.get("/website/config")
async def get_website_config(current_user: dict = Depends(get_current_user)):
    """Get website sync configuration"""
    config = await db.website_config.find_one(
        {"school_id": current_user.get("school_id")},
        {"_id": 0}
    )
    return config or {"configured": False}

# ==================== APP CONFIG ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
