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
    role: str = "teacher"  # director, principal, vice_principal, co_director, teacher, accountant, admission_staff, clerk
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
    permissions: Optional[dict] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Permission Models
class PermissionUpdate(BaseModel):
    user_id: str
    permissions: dict  # {"dashboard": True, "students": False, "fees": True, etc.}

class UserPermissions(BaseModel):
    # Admin Panel Sections
    dashboard: bool = False
    school_analytics: bool = False
    user_management: bool = False  # Can create Principal, VP, Co-Director only
    students: bool = False  # View students
    student_admission: bool = False  # Can admit students
    staff: bool = False
    classes: bool = False
    class_assignment: bool = False  # Assign teachers to classes
    attendance: bool = False
    leave_management: bool = False
    leave_approval: bool = False
    fees: bool = False
    fee_collection: bool = False  # Cash collection
    fee_approval: bool = False  # Approve cash payments
    notices: bool = False
    notice_create: bool = False
    sms_center: bool = False
    gallery: bool = False
    ai_paper: bool = False
    ai_content: bool = False
    cctv: bool = False
    website_integration: bool = False
    audit_logs: bool = False
    settings: bool = False
    meetings: bool = False  # Zoom meetings
    reports: bool = False  # View all reports

# Default permissions for each role
DEFAULT_PERMISSIONS = {
    "director": {
        "dashboard": True, "school_analytics": True, "user_management": True,
        "students": True, "student_admission": True, "staff": True, "classes": True,
        "class_assignment": True, "attendance": True, "leave_management": True,
        "leave_approval": True, "fees": True, "fee_collection": True, "fee_approval": True,
        "notices": True, "notice_create": True, "sms_center": True, "gallery": True,
        "ai_paper": True, "ai_content": True, "cctv": True, "website_integration": True,
        "audit_logs": True, "settings": True, "meetings": True, "reports": True
    },
    "principal": {
        "dashboard": True, "school_analytics": True, "user_management": False,
        "students": True, "student_admission": False, "staff": True, "classes": True,
        "class_assignment": True, "attendance": True, "leave_management": True,
        "leave_approval": True, "fees": True, "fee_collection": False, "fee_approval": True,
        "notices": True, "notice_create": True, "sms_center": True, "gallery": True,
        "ai_paper": True, "ai_content": True, "cctv": True, "website_integration": False,
        "audit_logs": True, "settings": False, "meetings": True, "reports": True
    },
    "vice_principal": {
        "dashboard": True, "school_analytics": True, "user_management": False,
        "students": True, "student_admission": False, "staff": True, "classes": True,
        "class_assignment": False, "attendance": True, "leave_management": True,
        "leave_approval": True, "fees": True, "fee_collection": False, "fee_approval": False,
        "notices": True, "notice_create": True, "sms_center": False, "gallery": True,
        "ai_paper": True, "ai_content": False, "cctv": True, "website_integration": False,
        "audit_logs": False, "settings": False, "meetings": True, "reports": True
    },
    "co_director": {
        "dashboard": True, "school_analytics": True, "user_management": False,
        "students": True, "student_admission": False, "staff": True, "classes": True,
        "class_assignment": False, "attendance": True, "leave_management": True,
        "leave_approval": False, "fees": True, "fee_collection": False, "fee_approval": False,
        "notices": True, "notice_create": True, "sms_center": True, "gallery": True,
        "ai_paper": True, "ai_content": True, "cctv": True, "website_integration": False,
        "audit_logs": True, "settings": False, "meetings": True, "reports": True
    },
    "admission_staff": {
        "dashboard": True, "school_analytics": False, "user_management": False,
        "students": True, "student_admission": True, "staff": False, "classes": False,
        "class_assignment": False, "attendance": False, "leave_management": False,
        "leave_approval": False, "fees": False, "fee_collection": False, "fee_approval": False,
        "notices": False, "notice_create": False, "sms_center": False, "gallery": False,
        "ai_paper": False, "ai_content": False, "cctv": False, "website_integration": False,
        "audit_logs": False, "settings": False, "meetings": False, "reports": False
    },
    "accountant": {
        "dashboard": True, "school_analytics": False, "user_management": False,
        "students": True, "student_admission": False, "staff": False, "classes": False,
        "class_assignment": False, "attendance": False, "leave_management": False,
        "leave_approval": False, "fees": True, "fee_collection": True, "fee_approval": False,
        "notices": False, "notice_create": False, "sms_center": False, "gallery": False,
        "ai_paper": False, "ai_content": False, "cctv": False, "website_integration": False,
        "audit_logs": False, "settings": False, "meetings": False, "reports": False
    },
    "clerk": {
        "dashboard": True, "school_analytics": False, "user_management": False,
        "students": True, "student_admission": False, "staff": False, "classes": False,
        "class_assignment": False, "attendance": True, "leave_management": False,
        "leave_approval": False, "fees": False, "fee_collection": False, "fee_approval": False,
        "notices": True, "notice_create": False, "sms_center": False, "gallery": True,
        "ai_paper": False, "ai_content": False, "cctv": False, "website_integration": False,
        "audit_logs": False, "settings": False, "meetings": False, "reports": False
    }
}

# School Models - Comprehensive School Registration
class SchoolCreate(BaseModel):
    # Basic Info
    name: str
    address: str
    board_type: str  # CBSE, ICSE, State Board, IB
    city: str
    state: str
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    
    # Extended Info for AI
    registration_number: Optional[str] = None  # School registration/affiliation number
    established_year: Optional[int] = None  # Year school was established
    website_url: Optional[str] = None  # School website
    logo_url: Optional[str] = None  # School logo
    school_photo_url: Optional[str] = None  # Main school building photo
    
    # School Details for AI Context
    school_type: Optional[str] = None  # Primary, Secondary, Senior Secondary, K-12
    medium: Optional[str] = None  # Hindi, English, Regional
    shift: Optional[str] = None  # Morning, Day, Both
    total_capacity: Optional[int] = None  # Max student capacity
    
    # About School (for AI context)
    motto: Optional[str] = None  # School motto
    principal_name: Optional[str] = None
    principal_message: Optional[str] = None
    about_school: Optional[str] = None  # Brief description
    vision: Optional[str] = None
    mission: Optional[str] = None
    achievements: Optional[str] = None  # Notable achievements
    facilities: Optional[List[str]] = None  # Labs, Library, Sports, etc.
    
    # Social & Contact
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    
    # App Customization
    app_requirements: Optional[str] = None  # What features school needs most
    ai_assistant_name: Optional[str] = None  # Custom AI assistant name for this school

class SchoolResponse(BaseModel):
    id: str
    name: str
    address: str
    board_type: str
    city: str
    state: str
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Extended Info
    registration_number: Optional[str] = None
    established_year: Optional[int] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    school_photo_url: Optional[str] = None
    
    # School Details
    school_type: Optional[str] = None
    medium: Optional[str] = None
    shift: Optional[str] = None
    total_capacity: Optional[int] = None
    
    # About School
    motto: Optional[str] = None
    principal_name: Optional[str] = None
    principal_message: Optional[str] = None
    about_school: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    achievements: Optional[str] = None
    facilities: Optional[List[str]] = None
    
    # Social
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    
    # App Settings
    app_requirements: Optional[str] = None
    ai_assistant_name: Optional[str] = None
    
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

# ==================== SUBSCRIPTION MODELS ====================

class SubscriptionPlan(BaseModel):
    plan_type: str  # free_trial, monthly, yearly
    school_id: str
    
class SubscriptionResponse(BaseModel):
    id: str
    school_id: str
    plan_type: str  # free_trial, monthly, yearly
    status: str  # active, expired, cancelled
    start_date: str
    end_date: str
    ai_enabled_until: Optional[str] = None  # AI only 3 days in free trial
    amount: float
    created_at: str

# Subscription pricing
SUBSCRIPTION_PLANS = {
    "free_trial": {
        "duration_days": 30,
        "ai_duration_days": 3,
        "price": 0,
        "features": ["all_features", "ai_3_days"]
    },
    "monthly": {
        "duration_days": 30,
        "ai_duration_days": 30,
        "price": 17999,
        "features": ["all_features", "ai_unlimited", "priority_support"]
    },
    "yearly": {
        "duration_days": 365,
        "ai_duration_days": 365,
        "price": 179988,  # 14999 * 12
        "monthly_equivalent": 14999,
        "features": ["all_features", "ai_unlimited", "priority_support", "discount_17%"]
    }
}

# ==================== SETUP WIZARD MODELS ====================

class SetupStep(BaseModel):
    step_number: int
    title: str
    description: str
    is_completed: bool = False
    data: Optional[Dict[str, Any]] = None

class SchoolSetupWizard(BaseModel):
    school_id: str
    current_step: int = 1
    total_steps: int = 7
    steps: List[SetupStep]
    is_completed: bool = False

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
    
    # Check if it's a student login
    if payload.get("role") == "student":
        student = await db.students.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        if not student:
            raise HTTPException(status_code=401, detail="Student not found")
        # Add role for consistency
        student["role"] = "student"
        return student
    
    # Regular user (admin, teacher, staff)
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

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    # For students, return student-specific data
    if current_user.get("role") == "student":
        return {
            "id": current_user["id"],
            "name": current_user["name"],
            "role": "student",
            "student_id": current_user.get("student_id"),
            "class_id": current_user.get("class_id"),
            "school_id": current_user.get("school_id"),
            "mobile": current_user.get("mobile"),
            "father_name": current_user.get("father_name"),
            "mother_name": current_user.get("mother_name")
        }
    
    # Get permissions for user
    user_role = current_user["role"]
    if user_role == "director":
        permissions = DEFAULT_PERMISSIONS["director"]
    elif "permissions" in current_user and current_user["permissions"]:
        permissions = current_user["permissions"]
    else:
        permissions = DEFAULT_PERMISSIONS.get(user_role, {})
    
    # For regular users - return with permissions
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "mobile": current_user.get("mobile"),
        "school_id": current_user.get("school_id"),
        "created_at": current_user["created_at"],
        "permissions": permissions
    }

# ==================== USER MANAGEMENT ROUTES ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    mobile: Optional[str] = None
    school_id: Optional[str] = None
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

# ==================== PERMISSION MANAGEMENT ROUTES ====================

@api_router.get("/users/{user_id}/permissions")
async def get_user_permissions(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get permissions for a user"""
    if current_user["role"] not in ["director", "principal"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If custom permissions exist, return those, else return default for role
    if "permissions" in user and user["permissions"]:
        return {"user_id": user_id, "permissions": user["permissions"], "role": user["role"]}
    
    # Return default permissions for role
    default_perms = DEFAULT_PERMISSIONS.get(user["role"], {})
    return {"user_id": user_id, "permissions": default_perms, "role": user["role"], "is_default": True}

@api_router.put("/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, perm_data: dict, current_user: dict = Depends(get_current_user)):
    """Director updates permissions for a user"""
    # Only Director can update permissions
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can update permissions")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot modify Director's own permissions
    if user["role"] == "director":
        raise HTTPException(status_code=400, detail="Cannot modify Director permissions")
    
    # Update permissions
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "permissions": perm_data.get("permissions", {}),
            "permissions_updated_at": datetime.now(timezone.utc).isoformat(),
            "permissions_updated_by": current_user["id"]
        }}
    )
    
    await log_audit(current_user["id"], "update_permissions", "users", {
        "user_id": user_id,
        "user_name": user["name"],
        "permissions": perm_data.get("permissions", {})
    })
    
    return {"message": "Permissions updated successfully", "user_id": user_id}

@api_router.post("/users/{user_id}/grant-full-access")
async def grant_full_access(user_id: str, current_user: dict = Depends(get_current_user)):
    """Director grants full admin access to a user (like Co-Director)"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can grant full access")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Grant all permissions except user_management and settings
    full_access = DEFAULT_PERMISSIONS["director"].copy()
    full_access["user_management"] = False  # Only Director can create users
    full_access["settings"] = False  # Only Director can change settings
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "permissions": full_access,
            "full_access_granted": True,
            "full_access_granted_at": datetime.now(timezone.utc).isoformat(),
            "full_access_granted_by": current_user["id"]
        }}
    )
    
    await log_audit(current_user["id"], "grant_full_access", "users", {
        "user_id": user_id,
        "user_name": user["name"]
    })
    
    return {"message": f"Full access granted to {user['name']}", "user_id": user_id}

@api_router.post("/users/{user_id}/revoke-access")
async def revoke_access(user_id: str, current_user: dict = Depends(get_current_user)):
    """Director revokes all special permissions, resets to default role permissions"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can revoke access")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Reset to default permissions for role
    default_perms = DEFAULT_PERMISSIONS.get(user["role"], {})
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "permissions": default_perms,
            "full_access_granted": False,
            "permissions_updated_at": datetime.now(timezone.utc).isoformat(),
            "permissions_updated_by": current_user["id"]
        }}
    )
    
    await log_audit(current_user["id"], "revoke_access", "users", {
        "user_id": user_id,
        "user_name": user["name"]
    })
    
    return {"message": f"Access revoked for {user['name']}, reset to default permissions", "user_id": user_id}

@api_router.get("/permissions/my")
async def get_my_permissions(current_user: dict = Depends(get_current_user)):
    """Get current user's permissions"""
    # Director has all permissions
    if current_user["role"] == "director":
        return {"permissions": DEFAULT_PERMISSIONS["director"], "role": "director", "is_director": True}
    
    # Check if custom permissions exist
    if "permissions" in current_user and current_user["permissions"]:
        return {"permissions": current_user["permissions"], "role": current_user["role"], "is_director": False}
    
    # Return default permissions for role
    default_perms = DEFAULT_PERMISSIONS.get(current_user["role"], {})
    return {"permissions": default_perms, "role": current_user["role"], "is_director": False, "is_default": True}

# ==================== TEACHER-CLASS ASSIGNMENT ROUTES ====================

@api_router.post("/teachers/{teacher_id}/assign-class")
async def assign_teacher_to_class(teacher_id: str, assignment: dict, current_user: dict = Depends(get_current_user)):
    """Principal assigns teacher to class and subject"""
    # Check permission
    user_perms = current_user.get("permissions", DEFAULT_PERMISSIONS.get(current_user["role"], {}))
    if current_user["role"] not in ["director", "principal"] and not user_perms.get("class_assignment"):
        raise HTTPException(status_code=403, detail="Not authorized to assign teachers")
    
    teacher = await db.users.find_one({"id": teacher_id, "role": "teacher"}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    class_id = assignment.get("class_id")
    subject = assignment.get("subject")
    is_class_teacher = assignment.get("is_class_teacher", False)
    
    # Update teacher's assignment
    await db.users.update_one(
        {"id": teacher_id},
        {"$set": {
            "assigned_classes": assignment.get("class_ids", [class_id] if class_id else []),
            "assigned_subjects": assignment.get("subjects", [subject] if subject else []),
            "is_class_teacher": is_class_teacher,
            "class_teacher_of": class_id if is_class_teacher else None,
            "assignment_updated_at": datetime.now(timezone.utc).isoformat(),
            "assignment_updated_by": current_user["id"]
        }}
    )
    
    # If class teacher, update class record too
    if is_class_teacher and class_id:
        await db.classes.update_one(
            {"id": class_id},
            {"$set": {
                "class_teacher_id": teacher_id,
                "class_teacher_name": teacher["name"]
            }}
        )
    
    await log_audit(current_user["id"], "assign_teacher", "teachers", {
        "teacher_id": teacher_id,
        "teacher_name": teacher["name"],
        "class_id": class_id,
        "subject": subject,
        "is_class_teacher": is_class_teacher
    })
    
    return {"message": f"Teacher {teacher['name']} assigned successfully"}

@api_router.get("/teachers/{teacher_id}/assignments")
async def get_teacher_assignments(teacher_id: str, current_user: dict = Depends(get_current_user)):
    """Get teacher's class and subject assignments"""
    teacher = await db.users.find_one({"id": teacher_id, "role": "teacher"}, {"_id": 0, "password": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return {
        "teacher_id": teacher_id,
        "teacher_name": teacher["name"],
        "assigned_classes": teacher.get("assigned_classes", []),
        "assigned_subjects": teacher.get("assigned_subjects", []),
        "is_class_teacher": teacher.get("is_class_teacher", False),
        "class_teacher_of": teacher.get("class_teacher_of")
    }

@api_router.delete("/teachers/{teacher_id}/remove-assignment/{class_id}")
async def remove_teacher_from_class(teacher_id: str, class_id: str, current_user: dict = Depends(get_current_user)):
    """Principal removes teacher from a class"""
    user_perms = current_user.get("permissions", DEFAULT_PERMISSIONS.get(current_user["role"], {}))
    if current_user["role"] not in ["director", "principal"] and not user_perms.get("class_assignment"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    teacher = await db.users.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Remove class from teacher's assignments
    current_classes = teacher.get("assigned_classes", [])
    if class_id in current_classes:
        current_classes.remove(class_id)
    
    update_data = {"assigned_classes": current_classes}
    
    # If was class teacher of this class, remove that too
    if teacher.get("class_teacher_of") == class_id:
        update_data["is_class_teacher"] = False
        update_data["class_teacher_of"] = None
        # Update class record
        await db.classes.update_one(
            {"id": class_id},
            {"$set": {"class_teacher_id": None, "class_teacher_name": None}}
        )
    
    await db.users.update_one({"id": teacher_id}, {"$set": update_data})
    
    await log_audit(current_user["id"], "remove_teacher_assignment", "teachers", {
        "teacher_id": teacher_id,
        "class_id": class_id
    })
    
    return {"message": "Teacher removed from class"}

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

@api_router.put("/schools/{school_id}", response_model=SchoolResponse)
async def update_school(school_id: str, school: SchoolCreate, current_user: dict = Depends(get_current_user)):
    """Update school details - only Director can update"""
    if current_user["role"] not in ["director", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.schools.find_one({"id": school_id})
    if not existing:
        raise HTTPException(status_code=404, detail="School not found")
    
    update_data = school.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user["id"]
    
    await db.schools.update_one({"id": school_id}, {"$set": update_data})
    await log_audit(current_user["id"], "update", "schools", {"school_id": school_id, "name": school.name})
    
    updated = await db.schools.find_one({"id": school_id}, {"_id": 0})
    return SchoolResponse(**updated)

@api_router.post("/schools/{school_id}/upload-photo")
async def upload_school_photo(school_id: str, file: UploadFile = File(...), photo_type: str = "logo", current_user: dict = Depends(get_current_user)):
    """Upload school logo or main photo"""
    if current_user["role"] not in ["director", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WEBP allowed")
    
    # Save file
    file_ext = file.filename.split(".")[-1]
    file_name = f"school_{school_id}_{photo_type}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / "images" / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Update school with photo URL
    photo_url = f"/api/uploads/images/{file_name}"
    field = "logo_url" if photo_type == "logo" else "school_photo_url"
    
    await db.schools.update_one({"id": school_id}, {"$set": {field: photo_url}})
    
    return {"message": "Photo uploaded", "url": photo_url, "type": photo_type}

@api_router.get("/schools/{school_id}/ai-context")
async def get_school_ai_context(school_id: str, current_user: dict = Depends(get_current_user)):
    """Get school context for AI to use - all school details in one object"""
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Get additional stats
    student_count = await db.students.count_documents({"school_id": school_id, "is_active": True})
    staff_count = await db.staff.count_documents({"school_id": school_id, "is_active": True})
    class_count = await db.classes.count_documents({"school_id": school_id})
    
    ai_context = {
        **school,
        "stats": {
            "total_students": student_count,
            "total_staff": staff_count,
            "total_classes": class_count
        },
        "context_summary": f"""
School: {school.get('name', 'Unknown')}
Established: {school.get('established_year', 'N/A')}
Board: {school.get('board_type', 'N/A')}
Location: {school.get('city', '')}, {school.get('state', '')}
Type: {school.get('school_type', 'N/A')}
Medium: {school.get('medium', 'N/A')}
Motto: {school.get('motto', 'N/A')}
About: {school.get('about_school', 'N/A')}
Vision: {school.get('vision', 'N/A')}
Mission: {school.get('mission', 'N/A')}
Principal: {school.get('principal_name', 'N/A')}
Students: {student_count}
Staff: {staff_count}
Classes: {class_count}
Facilities: {', '.join(school.get('facilities', []))}
Achievements: {school.get('achievements', 'N/A')}
Website: {school.get('website_url', 'N/A')}
"""
    }
    
    return ai_context

# Note: Director's first account is created via /api/auth/setup-director (one-time only)

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
    allowed_roles = ["teacher", "principal", "vice_principal", "director", "admission_staff", "clerk", "staff"]
    if current_user["role"] not in allowed_roles:
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

class TeacherAIRequest(BaseModel):
    prompt: str
    type: str = "general"  # general, lesson_plan, paper, worksheet

@api_router.post("/ai/teacher-assistant")
async def teacher_ai_assistant(request: TeacherAIRequest, current_user: dict = Depends(get_current_user)):
    """TeachTino AI Assistant - Helps teachers with lesson plans, papers, worksheets using GPT-4o"""
    if current_user["role"] not in ["teacher", "principal", "vice_principal", "director", "staff", "student"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    openai_key = os.environ.get("OPENAI_API_KEY")
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Build system prompt based on request type
        system_prompts = {
            "lesson_plan": """You are TeachTino AI - an expert teaching assistant for Indian schools.
Create detailed lesson plans in Hindi-English mix. Follow NCERT syllabus structure.
Include: Learning objectives, Prerequisites, Introduction, Main content, Activities, Assessment, Homework.""",
            
            "paper": """You are TeachTino AI - an expert question paper generator for Indian schools.
Create question papers following CBSE/NCERT pattern. Include:
- Section A: MCQ (1 mark each)
- Section B: Short Answer (2-3 marks)
- Section C: Long Answer (5 marks)
Mix Hindi and English. Include answer key.""",
            
            "worksheet": """You are TeachTino AI - an expert worksheet creator for Indian schools.
Create engaging worksheets with:
- Fill in the blanks
- Match the following
- True/False
- Short questions
- Activity-based questions
Follow NCERT syllabus.""",
            
            "general": """You are TeachTino AI - a helpful teaching assistant for Indian school teachers.
Help with lesson planning, student assessment, teaching strategies, and educational content.
Respond in Hindi-English mix. Be practical and helpful."""
        }
        
        system_prompt = system_prompts.get(request.type, system_prompts["general"])
        session_id = f"teacher-{current_user.get('id', 'default')[:8]}-{str(uuid.uuid4())[:8]}"
        
        chat = LlmChat(
            api_key=emergent_key or openai_key,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=request.prompt)
        response = await chat.send_message(user_msg)
        
        return {"response": response, "type": request.type, "ai_powered": True}
        
    except Exception as e:
        print(f"AI Error: {e}")
        # Fallback to basic response
        return {"response": f"AI temporarily unavailable. Your query: {request.prompt}", "error": str(e)}

# ==================== TEACHER SYLLABUS & AI DAILY PLAN ====================

@api_router.get("/teacher/syllabus")
async def get_teacher_syllabus(current_user: dict = Depends(get_current_user)):
    """Get syllabus progress for teacher's classes"""
    # Get classes assigned to this teacher
    my_classes = await db.classes.find(
        {"class_teacher_id": current_user["id"]},
        {"_id": 0}
    ).to_list(20)
    
    # If no specific classes, return all for school
    if not my_classes:
        school_id = current_user.get("school_id")
        my_classes = await db.classes.find(
            {"school_id": school_id},
            {"_id": 0}
        ).to_list(20)
    
    # Get syllabus for each class
    syllabus_list = []
    for cls in my_classes:
        syllabus = await db.syllabus.find_one(
            {"class_id": cls["id"]},
            {"_id": 0}
        )
        if syllabus:
            syllabus_list.append(syllabus)
        else:
            # Create default syllabus entry
            syllabus_list.append({
                "id": str(uuid.uuid4()),
                "class_id": cls["id"],
                "class_name": cls.get("name", "Unknown"),
                "section": cls.get("section", ""),
                "subject": "General",
                "total_chapters": 15,
                "completed_chapters": 0,
                "current_topic": "Not Started",
                "progress": 0,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "test_results": {"avg_score": 0, "top_score": 0, "lowest_score": 0}
            })
    
    return syllabus_list

@api_router.put("/teacher/syllabus/{syllabus_id}")
async def update_syllabus(syllabus_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update syllabus progress"""
    result = await db.syllabus.update_one(
        {"id": syllabus_id},
        {"$set": {
            **data,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "updated_by": current_user["id"]
        }},
        upsert=True
    )
    return {"message": "Syllabus updated", "id": syllabus_id}

@api_router.get("/teacher/ai-daily-plan")
async def get_ai_daily_plan(current_user: dict = Depends(get_current_user)):
    """AI-generated daily teaching plan"""
    today = datetime.now(timezone.utc)
    teacher_name = current_user.get("name", "Teacher").split()[0]
    
    # Get teacher's classes
    my_classes = await db.classes.find(
        {"class_teacher_id": current_user["id"]},
        {"_id": 0}
    ).to_list(10)
    
    # Generate AI plan (mock for now - can integrate with actual AI)
    today_classes = []
    times = ["8:00 AM", "9:00 AM", "10:30 AM", "11:30 AM", "1:00 PM", "2:00 PM"]
    for idx, cls in enumerate(my_classes[:6]):
        today_classes.append({
            "time": times[idx] if idx < len(times) else f"{8+idx}:00 AM",
            "class": f"{cls.get('name', 'Class')} - {cls.get('section', 'A')}",
            "topic": "Continue from last class",
            "duration": "45 min"
        })
    
    # Get weak students from this teacher's classes
    class_ids = [c["id"] for c in my_classes]
    
    # For demo, create mock weak students data
    weak_students = []
    students = await db.students.find(
        {"class_id": {"$in": class_ids}, "status": "active"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    # Identify students with low test scores (mock logic)
    for student in students[:5]:  # Limit to 5 weak students
        weak_students.append({
            "id": student["id"],
            "name": student["name"],
            "class": f"{student.get('class_name', 'Class')}",
            "weak_topics": ["Topic 1", "Topic 2"],
            "avg_score": 45,
            "last_test": 42,
            "attendance": 80,
            "ai_strategy": "Focus on conceptual clarity. Use visual aids and practice worksheets.",
            "improvement_plan": [
                "Daily 15-min revision",
                "Peer learning sessions",
                "Weekly progress check"
            ]
        })
    
    return {
        "today_plan": {
            "greeting": f"Good Morning, {teacher_name}! 🌅",
            "today_classes": today_classes,
            "focus_areas": [
                "Check yesterday's homework",
                "Prepare for upcoming unit test",
                "Review weak students' progress"
            ],
            "ai_tip": f"💡 Today is {today.strftime('%A')} - Great day for interactive learning activities!"
        },
        "tomorrow_suggestions": [
            {"class": c.get("name", "Class"), "suggestion": "Review previous topics", "priority": "medium"}
            for c in my_classes[:3]
        ],
        "weak_students": weak_students
    }

@api_router.get("/teacher/weak-students")
async def get_weak_students(current_user: dict = Depends(get_current_user)):
    """Get weak students for teacher's classes with AI strategies"""
    my_classes = await db.classes.find(
        {"class_teacher_id": current_user["id"]},
        {"_id": 0}
    ).to_list(10)
    
    class_ids = [c["id"] for c in my_classes]
    
    # Get students with weak performance (demo data)
    weak_students = await db.weak_students.find(
        {"class_id": {"$in": class_ids}},
        {"_id": 0}
    ).to_list(20)
    
    return weak_students

@api_router.post("/teacher/weak-students/{student_id}/strategy")
async def save_weak_student_strategy(student_id: str, strategy: dict, current_user: dict = Depends(get_current_user)):
    """Save AI-generated or custom strategy for weak student"""
    result = await db.weak_students.update_one(
        {"student_id": student_id},
        {"$set": {
            "ai_strategy": strategy.get("ai_strategy"),
            "improvement_plan": strategy.get("improvement_plan"),
            "updated_by": current_user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Strategy saved", "student_id": student_id}

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

@api_router.post("/student/notices/{notice_id}/read")
async def mark_notice_read(notice_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notice as read by student"""
    await db.notice_reads.update_one(
        {"notice_id": notice_id, "user_id": current_user.get("id", current_user.get("student_id"))},
        {"$set": {"read_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Notice marked as read"}

@api_router.get("/student/homework")
async def get_student_homework(current_user: dict = Depends(get_current_user)):
    """Get homework for student's class"""
    student = await db.students.find_one(
        {"$or": [{"id": current_user.get("id")}, {"student_id": current_user.get("student_id")}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    homework = await db.homework.find({
        "class_id": student["class_id"],
        "school_id": student["school_id"]
    }, {"_id": 0}).sort("due_date", 1).to_list(20)
    
    return homework

@api_router.get("/student/leaves")
async def get_student_leaves(current_user: dict = Depends(get_current_user)):
    """Get student's leave applications"""
    student = await db.students.find_one(
        {"$or": [{"id": current_user.get("id")}, {"student_id": current_user.get("student_id")}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    leaves = await db.student_leaves.find({
        "student_id": student["id"]
    }, {"_id": 0}).sort("created_at", -1).to_list(20)
    
    return leaves

class StudentLeaveRequest(BaseModel):
    leave_type: str
    from_date: str
    to_date: Optional[str] = None
    reason: str
    half_day: bool = False

@api_router.post("/student/leaves")
async def apply_student_leave(leave_data: StudentLeaveRequest, current_user: dict = Depends(get_current_user)):
    """Apply for leave (student/parent)"""
    student = await db.students.find_one(
        {"$or": [{"id": current_user.get("id")}, {"student_id": current_user.get("student_id")}]},
        {"_id": 0}
    )
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    leave_id = str(uuid.uuid4())
    leave_doc = {
        "id": leave_id,
        "student_id": student["id"],
        "student_name": student["name"],
        "class_id": student["class_id"],
        "school_id": student["school_id"],
        "leave_type": leave_data.leave_type,
        "from_date": leave_data.from_date,
        "to_date": leave_data.to_date or leave_data.from_date,
        "reason": leave_data.reason,
        "half_day": leave_data.half_day,
        "status": "pending_teacher",  # pending_teacher -> pending_principal -> approved/rejected
        "created_at": datetime.now(timezone.utc).isoformat(),
        "applied_by": current_user.get("id", current_user.get("student_id"))
    }
    
    await db.student_leaves.insert_one(leave_doc)
    
    return {"message": "Leave application submitted", "id": leave_id, "status": "pending_teacher"}

class StudentAIRequest(BaseModel):
    prompt: str

@api_router.post("/student/ai-helper")
async def student_ai_helper(request: StudentAIRequest, current_user: dict = Depends(get_current_user)):
    """StudyTino AI Helper - Safe study assistant for students using GPT-4o"""
    
    openai_key = os.environ.get("OPENAI_API_KEY")
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Safe study assistant with guardrails
        system_prompt = """You are StudyTino AI - a safe, friendly study assistant for Indian school students (Class 1-12).

RULES:
1. ONLY help with academic/study-related questions
2. Follow NCERT/CBSE syllabus
3. Explain in simple Hindi-English mix (Hinglish)
4. Be encouraging and supportive
5. If asked anything inappropriate, politely redirect to studies
6. Never share personal opinions on politics, religion, or controversial topics
7. For difficult topics, use simple examples and diagrams description

RESPONSE FORMAT:
- Start with emoji related to subject
- Explain concept simply
- Give 2-3 examples
- End with a study tip
- Keep response concise (under 300 words)

You help with: Math, Science, English, Hindi, Social Studies, Computer Science, and all NCERT subjects."""
        
        session_id = f"student-{current_user.get('id', 'default')[:8]}-{str(uuid.uuid4())[:8]}"
        
        chat = LlmChat(
            api_key=emergent_key or openai_key,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=request.prompt)
        response = await chat.send_message(user_msg)
        
        return {"response": response, "ai_powered": True}
        
    except Exception as e:
        print(f"Student AI Error: {e}")
        return {"response": f"AI temporarily unavailable. Aapka question: {request.prompt}\n\nPlease try again later.", "error": str(e)}

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

# ==================== LEAVE MANAGEMENT SYSTEM ====================

class LeaveRequest(BaseModel):
    leave_type: str  # sick, personal, emergency, casual
    from_date: str
    to_date: str
    reason: str
    half_day: bool = False
    attachment_url: Optional[str] = None

class LeaveResponse(BaseModel):
    id: str
    applicant_id: str
    applicant_name: str
    applicant_type: str  # student, teacher, staff
    leave_type: str
    from_date: str
    to_date: str
    days: int
    reason: str
    status: str  # pending, approved, rejected
    approved_by: Optional[str] = None
    created_at: str

@api_router.post("/leave/apply", response_model=LeaveResponse)
async def apply_leave(request: LeaveRequest, current_user: dict = Depends(get_current_user)):
    """Apply for leave - Student/Teacher/Staff"""
    # Calculate days
    from_dt = datetime.strptime(request.from_date, "%Y-%m-%d")
    to_dt = datetime.strptime(request.to_date, "%Y-%m-%d")
    days = (to_dt - from_dt).days + 1
    if request.half_day:
        days = 0.5
    
    # Determine applicant type
    applicant_type = "staff"
    if current_user["role"] == "teacher":
        applicant_type = "teacher"
    elif current_user["role"] == "student":
        applicant_type = "student"
    
    leave_data = {
        "id": str(uuid.uuid4()),
        "applicant_id": current_user["id"],
        "applicant_name": current_user["name"],
        "applicant_type": applicant_type,
        "applicant_role": current_user["role"],
        "leave_type": request.leave_type,
        "from_date": request.from_date,
        "to_date": request.to_date,
        "days": days,
        "half_day": request.half_day,
        "reason": request.reason,
        "attachment_url": request.attachment_url,
        "status": "pending",
        "approved_by": None,
        "approved_at": None,
        "school_id": current_user.get("school_id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leaves.insert_one(leave_data)
    await log_audit(current_user["id"], "apply", "leaves", {
        "type": request.leave_type,
        "days": days
    })
    
    return LeaveResponse(
        id=leave_data["id"],
        applicant_id=leave_data["applicant_id"],
        applicant_name=leave_data["applicant_name"],
        applicant_type=leave_data["applicant_type"],
        leave_type=leave_data["leave_type"],
        from_date=leave_data["from_date"],
        to_date=leave_data["to_date"],
        days=leave_data["days"],
        reason=leave_data["reason"],
        status=leave_data["status"],
        approved_by=leave_data["approved_by"],
        created_at=leave_data["created_at"]
    )

@api_router.get("/leave/my-leaves")
async def get_my_leaves(current_user: dict = Depends(get_current_user)):
    """Get current user's leave applications"""
    leaves = await db.leaves.find(
        {"applicant_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return leaves

@api_router.get("/leave/pending")
async def get_pending_leaves(current_user: dict = Depends(get_current_user)):
    """Get pending leave applications for approval"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to view pending leaves")
    
    query = {"status": "pending", "school_id": current_user.get("school_id")}
    
    # Teachers can only approve student leaves
    if current_user["role"] == "teacher":
        query["applicant_type"] = "student"
    
    leaves = await db.leaves.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return leaves

@api_router.post("/leave/{leave_id}/approve")
async def approve_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    """Approve a leave application"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    leave = await db.leaves.find_one({"id": leave_id})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    
    # Teachers can only approve student leaves
    if current_user["role"] == "teacher" and leave["applicant_type"] != "student":
        raise HTTPException(status_code=403, detail="Teachers can only approve student leaves")
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "approved_by_name": current_user["name"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit(current_user["id"], "approve", "leaves", {"leave_id": leave_id})
    return {"success": True, "message": "Leave approved"}

@api_router.post("/leave/{leave_id}/reject")
async def reject_leave(leave_id: str, reason: str = "", current_user: dict = Depends(get_current_user)):
    """Reject a leave application"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {
            "status": "rejected",
            "rejected_by": current_user["id"],
            "rejected_by_name": current_user["name"],
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit(current_user["id"], "reject", "leaves", {"leave_id": leave_id})
    return {"success": True, "message": "Leave rejected"}

@api_router.get("/leave/balance")
async def get_leave_balance(current_user: dict = Depends(get_current_user)):
    """Get leave balance for current user"""
    # Default leave allocation per year
    allocation = {
        "sick": 12,
        "casual": 10,
        "personal": 5,
        "emergency": 3
    }
    
    # Calculate used leaves
    year_start = datetime.now().replace(month=1, day=1).strftime("%Y-%m-%d")
    used_leaves = await db.leaves.aggregate([
        {
            "$match": {
                "applicant_id": current_user["id"],
                "status": "approved",
                "from_date": {"$gte": year_start}
            }
        },
        {
            "$group": {
                "_id": "$leave_type",
                "total_days": {"$sum": "$days"}
            }
        }
    ]).to_list(10)
    
    used = {item["_id"]: item["total_days"] for item in used_leaves}
    
    balance = {}
    for leave_type, total in allocation.items():
        balance[leave_type] = {
            "total": total,
            "used": used.get(leave_type, 0),
            "remaining": total - used.get(leave_type, 0)
        }
    
    return {"balance": balance, "year": datetime.now().year}

# ==================== CCTV DASHBOARD (MOCK) ====================

@api_router.get("/cctv/dashboard")
async def get_cctv_dashboard(current_user: dict = Depends(get_current_user)):
    """CCTV Dashboard - Mock data for future hardware integration"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "security"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mock CCTV data
    return {
        "status": "mock",
        "message": "CCTV integration ready for hardware connection",
        "cameras": [
            {"id": "CAM001", "name": "Main Gate", "status": "online", "location": "Entrance"},
            {"id": "CAM002", "name": "Playground", "status": "online", "location": "Ground Floor"},
            {"id": "CAM003", "name": "Corridor A", "status": "online", "location": "Building A"},
            {"id": "CAM004", "name": "Corridor B", "status": "offline", "location": "Building B"},
            {"id": "CAM005", "name": "Parking", "status": "online", "location": "Back Side"},
            {"id": "CAM006", "name": "Cafeteria", "status": "online", "location": "Ground Floor"}
        ],
        "alerts": [
            {"id": "ALT001", "type": "motion", "camera": "Main Gate", "time": "09:15 AM", "status": "reviewed"},
            {"id": "ALT002", "type": "crowd", "camera": "Playground", "time": "10:30 AM", "status": "pending"},
            {"id": "ALT003", "type": "restricted_area", "camera": "Parking", "time": "11:45 AM", "status": "pending"}
        ],
        "ai_features": {
            "face_recognition": {"status": "ready", "description": "Identify students/staff from face"},
            "attendance_tracking": {"status": "ready", "description": "Auto-mark attendance via CCTV"},
            "behavior_detection": {"status": "planned", "description": "Detect unusual behavior"},
            "crowd_monitoring": {"status": "ready", "description": "Monitor crowd density"},
            "gate_access": {"status": "ready", "description": "Control gate based on student status"}
        },
        "statistics": {
            "total_cameras": 6,
            "online": 5,
            "offline": 1,
            "alerts_today": 3,
            "recordings_gb": 245
        }
    }

@api_router.get("/cctv/camera/{camera_id}")
async def get_camera_feed(camera_id: str, current_user: dict = Depends(get_current_user)):
    """Get camera feed info (Mock)"""
    if current_user["role"] not in ["director", "principal", "vice_principal", "security"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "camera_id": camera_id,
        "status": "mock",
        "message": "Live feed will be available after hardware integration",
        "stream_url": None,
        "last_motion": datetime.now(timezone.utc).isoformat(),
        "recording": True
    }

@api_router.get("/cctv/alerts")
async def get_cctv_alerts(current_user: dict = Depends(get_current_user)):
    """Get CCTV alerts (Mock)"""
    return {
        "alerts": [
            {
                "id": "ALT001",
                "type": "unauthorized_entry",
                "camera": "Main Gate",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "description": "Unknown person detected at main gate",
                "status": "pending",
                "priority": "high"
            },
            {
                "id": "ALT002", 
                "type": "crowd_alert",
                "camera": "Playground",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "description": "Crowd density exceeded threshold",
                "status": "reviewed",
                "priority": "medium"
            }
        ]
    }

# ==================== ZOOM MEETINGS ====================

class MeetingCreate(BaseModel):
    topic: str
    description: Optional[str] = None
    start_time: str
    duration: int = 60
    password: Optional[str] = None
    participants: Optional[str] = None
    school_id: Optional[str] = None
    host_id: Optional[str] = None
    host_name: Optional[str] = None

class MeetingSummaryRequest(BaseModel):
    recording_id: str
    transcript: Optional[str] = None

@api_router.get("/meetings")
async def get_meetings(school_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all meetings for the school"""
    query = {"is_active": True}
    if school_id:
        query["school_id"] = school_id
    
    meetings = await db.meetings.find(query, {"_id": 0}).sort("start_time", -1).to_list(100)
    return meetings

@api_router.post("/meetings")
async def create_meeting(meeting: MeetingCreate, current_user: dict = Depends(get_current_user)):
    """Create a new meeting (Zoom integration placeholder)"""
    meeting_id = str(uuid.uuid4())
    
    # In production, this would call Zoom API
    # For now, create a mock meeting entry
    meeting_doc = {
        "id": meeting_id,
        "topic": meeting.topic,
        "description": meeting.description,
        "start_time": meeting.start_time,
        "duration": meeting.duration,
        "password": meeting.password,
        "participants": meeting.participants,
        "school_id": meeting.school_id,
        "host_id": current_user["id"],
        "host_name": current_user["name"],
        "join_url": f"https://zoom.us/j/{uuid.uuid4().hex[:10]}",
        "status": "scheduled",
        "participants_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["id"],
        "is_active": True
    }
    
    await db.meetings.insert_one(meeting_doc)
    await log_audit(current_user["id"], "create", "meetings", {"meeting_id": meeting_id, "topic": meeting.topic})
    
    meeting_doc.pop("_id", None)
    return meeting_doc

# IMPORTANT: Static routes MUST be defined BEFORE dynamic routes with path parameters
@api_router.get("/meetings/recordings")
async def get_recordings(school_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get meeting recordings"""
    query = {}
    if school_id:
        query["school_id"] = school_id
    
    recordings = await db.meeting_recordings.find(query, {"_id": 0}).sort("recorded_date", -1).to_list(50)
    return recordings

@api_router.get("/meetings/summaries")
async def get_summaries(school_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all AI-generated meeting summaries"""
    summaries = await db.meeting_summaries.find({}, {"_id": 0}).sort("generated_at", -1).to_list(50)
    return summaries

@api_router.post("/meetings/recordings/{recording_id}/summarize")
async def summarize_recording(recording_id: str, current_user: dict = Depends(get_current_user)):
    """Generate AI summary for a meeting recording"""
    recording = await db.meeting_recordings.find_one({"id": recording_id})
    
    # Check if summary already exists
    existing = await db.meeting_summaries.find_one({"recording_id": recording_id})
    if existing:
        existing.pop("_id", None)
        return existing
    
    # In production, this would:
    # 1. Get transcript from Zoom API
    # 2. Send to OpenAI for summarization
    # For now, create a mock summary
    
    summary_doc = {
        "id": str(uuid.uuid4()),
        "recording_id": recording_id,
        "meeting_topic": recording.get("topic", "Meeting") if recording else "Meeting",
        "summary": "This meeting covered important discussion points regarding school operations.",
        "key_points": [
            "Budget allocation discussed",
            "New academic calendar proposed",
            "Staff training schedule finalized"
        ],
        "action_items": [
            "Submit budget proposal by Friday",
            "Circulate new calendar to all",
            "Schedule training sessions"
        ],
        "sentiment": "Positive - Productive meeting",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": current_user["id"]
    }
    
    await db.meeting_summaries.insert_one(summary_doc)
    
    summary_doc.pop("_id", None)
    return summary_doc

# Dynamic routes with path parameters come AFTER static routes
@api_router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    """Get single meeting details"""
    meeting = await db.meetings.find_one({"id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@api_router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    """Delete/Cancel a meeting"""
    meeting = await db.meetings.find_one({"id": meeting_id})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    await db.meetings.update_one({"id": meeting_id}, {"$set": {"is_active": False, "status": "cancelled"}})
    await log_audit(current_user["id"], "delete", "meetings", {"meeting_id": meeting_id})
    
    return {"message": "Meeting cancelled"}

# ==================== SUBSCRIPTION & BILLING ====================

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": "free_trial",
                "name": "Free Trial",
                "duration": "1 Month",
                "price": 0,
                "price_display": "FREE",
                "features": [
                    "All features for 30 days",
                    "AI features for 3 days",
                    "Unlimited students & staff",
                    "Email support"
                ],
                "ai_note": "AI features available for first 3 days only"
            },
            {
                "id": "monthly",
                "name": "Monthly Plan",
                "duration": "1 Month",
                "price": 17999,
                "price_display": "₹17,999/month",
                "features": [
                    "All features unlimited",
                    "AI features unlimited",
                    "Priority support",
                    "Monthly billing"
                ]
            },
            {
                "id": "yearly",
                "name": "Yearly Plan",
                "duration": "12 Months",
                "price": 179988,
                "price_display": "₹14,999/month",
                "original_price": "₹17,999/month",
                "savings": "₹35,988/year (17% OFF)",
                "features": [
                    "All features unlimited",
                    "AI features unlimited",
                    "Priority support",
                    "Pay yearly, save more"
                ],
                "badge": "BEST VALUE"
            }
        ]
    }

@api_router.post("/subscription/activate")
async def activate_subscription(plan: SubscriptionPlan, current_user: dict = Depends(get_current_user)):
    """Activate a subscription plan for a school"""
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only Director can manage subscriptions")
    
    plan_details = SUBSCRIPTION_PLANS.get(plan.plan_type)
    if not plan_details:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=plan_details["duration_days"])
    ai_end_date = now + timedelta(days=plan_details["ai_duration_days"])
    
    subscription_doc = {
        "id": str(uuid.uuid4()),
        "school_id": plan.school_id,
        "plan_type": plan.plan_type,
        "status": "active",
        "start_date": now.isoformat(),
        "end_date": end_date.isoformat(),
        "ai_enabled_until": ai_end_date.isoformat(),
        "amount": plan_details["price"],
        "features": plan_details["features"],
        "created_at": now.isoformat(),
        "created_by": current_user["id"]
    }
    
    # Deactivate any existing subscription
    await db.subscriptions.update_many(
        {"school_id": plan.school_id, "status": "active"},
        {"$set": {"status": "replaced"}}
    )
    
    await db.subscriptions.insert_one(subscription_doc)
    await log_audit(current_user["id"], "activate_subscription", "subscriptions", {
        "school_id": plan.school_id,
        "plan": plan.plan_type,
        "amount": plan_details["price"]
    })
    
    subscription_doc.pop("_id", None)
    return subscription_doc

@api_router.get("/subscription/current/{school_id}")
async def get_current_subscription(school_id: str, current_user: dict = Depends(get_current_user)):
    """Get current subscription for a school"""
    subscription = await db.subscriptions.find_one(
        {"school_id": school_id, "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        return {
            "status": "no_subscription",
            "message": "No active subscription. Start your free trial!",
            "recommended_plan": "free_trial"
        }
    
    # Check if expired
    end_date = datetime.fromisoformat(subscription["end_date"].replace("Z", "+00:00"))
    if end_date < datetime.now(timezone.utc):
        await db.subscriptions.update_one(
            {"id": subscription["id"]},
            {"$set": {"status": "expired"}}
        )
        return {
            "status": "expired",
            "message": "Your subscription has expired. Please renew to continue.",
            "expired_on": subscription["end_date"],
            "recommended_plan": "monthly"
        }
    
    # Check AI status
    ai_end = datetime.fromisoformat(subscription["ai_enabled_until"].replace("Z", "+00:00"))
    ai_active = ai_end > datetime.now(timezone.utc)
    
    return {
        **subscription,
        "ai_active": ai_active,
        "days_remaining": (end_date - datetime.now(timezone.utc)).days,
        "ai_days_remaining": max(0, (ai_end - datetime.now(timezone.utc)).days) if ai_active else 0
    }

# ==================== DIRECTOR SETUP WIZARD ====================

SETUP_STEPS = [
    {
        "step_number": 1,
        "title": "School Details",
        "description": "Add your school's basic information, logo, and photos",
        "route": "/school-registration",
        "icon": "School"
    },
    {
        "step_number": 2,
        "title": "Add Classes",
        "description": "Create classes and sections (e.g., Class 1-A, Class 10-B)",
        "route": "/classes",
        "icon": "GraduationCap"
    },
    {
        "step_number": 3,
        "title": "Add Staff",
        "description": "Add teachers, principal, and other staff members",
        "route": "/staff",
        "icon": "Users"
    },
    {
        "step_number": 4,
        "title": "Add Students",
        "description": "Add students and assign them to classes",
        "route": "/students",
        "icon": "UserPlus"
    },
    {
        "step_number": 5,
        "title": "Fee Structure",
        "description": "Set up fee categories and amounts",
        "route": "/fees",
        "icon": "Wallet"
    },
    {
        "step_number": 6,
        "title": "Connect Website",
        "description": "Link your school website for automatic updates",
        "route": "/website",
        "icon": "Globe"
    },
    {
        "step_number": 7,
        "title": "Setup CCTV",
        "description": "Connect CCTV cameras for smart monitoring",
        "route": "/cctv",
        "icon": "Video"
    }
]

@api_router.get("/setup/wizard")
async def get_setup_wizard(current_user: dict = Depends(get_current_user)):
    """Get setup wizard status for the school"""
    school_id = current_user.get("school_id")
    
    # Get existing wizard or create new
    wizard = await db.setup_wizards.find_one({"school_id": school_id}, {"_id": 0})
    
    if not wizard:
        # Check completion status for each step
        steps_status = []
        for step in SETUP_STEPS:
            is_completed = await check_step_completion(school_id, step["step_number"])
            steps_status.append({
                **step,
                "is_completed": is_completed
            })
        
        current_step = 1
        for i, step in enumerate(steps_status):
            if not step["is_completed"]:
                current_step = step["step_number"]
                break
            current_step = step["step_number"] + 1
        
        wizard = {
            "school_id": school_id,
            "current_step": min(current_step, 7),
            "total_steps": 7,
            "steps": steps_status,
            "is_completed": all(s["is_completed"] for s in steps_status),
            "completion_percentage": sum(1 for s in steps_status if s["is_completed"]) * 100 // 7
        }
    
    return wizard

async def check_step_completion(school_id: str, step_number: int) -> bool:
    """Check if a setup step is completed"""
    if step_number == 1:  # School details
        school = await db.schools.find_one({"id": school_id})
        return school is not None and school.get("name") is not None
    elif step_number == 2:  # Classes
        count = await db.classes.count_documents({"school_id": school_id})
        return count > 0
    elif step_number == 3:  # Staff
        count = await db.staff.count_documents({"school_id": school_id})
        return count > 0
    elif step_number == 4:  # Students
        count = await db.students.count_documents({"school_id": school_id})
        return count > 0
    elif step_number == 5:  # Fees
        count = await db.fee_categories.count_documents({"school_id": school_id})
        return count > 0
    elif step_number == 6:  # Website
        settings = await db.website_settings.find_one({"school_id": school_id})
        return settings is not None and settings.get("is_connected", False)
    elif step_number == 7:  # CCTV
        # CCTV is optional, mark as skippable
        return True
    return False

@api_router.post("/setup/complete-step/{step_number}")
async def complete_setup_step(step_number: int, current_user: dict = Depends(get_current_user)):
    """Mark a setup step as completed"""
    school_id = current_user.get("school_id")
    
    await db.setup_wizards.update_one(
        {"school_id": school_id},
        {
            "$set": {
                f"steps.{step_number - 1}.is_completed": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"message": f"Step {step_number} completed", "next_step": step_number + 1}

@api_router.get("/setup/ai-guide")
async def get_ai_setup_guide(current_user: dict = Depends(get_current_user)):
    """AI-generated personalized setup guide"""
    school_id = current_user.get("school_id")
    wizard = await get_setup_wizard(current_user)
    
    incomplete_steps = [s for s in wizard["steps"] if not s["is_completed"]]
    
    if not incomplete_steps:
        return {
            "message": "🎉 Congratulations! Your school setup is complete!",
            "tips": [
                "Start adding daily attendance",
                "Create your first notice",
                "Generate AI question papers for upcoming exams"
            ],
            "next_action": {
                "title": "Explore Dashboard",
                "route": "/dashboard"
            }
        }
    
    next_step = incomplete_steps[0]
    
    guides = {
        1: {
            "message": f"👋 Welcome! Let's start by adding your school details.",
            "instructions": [
                "Enter your school name and registration number",
                "Upload your school logo and building photo",
                "Add contact details and social media links",
                "This helps AI understand your school better!"
            ]
        },
        2: {
            "message": "📚 Great! Now let's create your class structure.",
            "instructions": [
                "Add all classes from nursery to 12th (as applicable)",
                "Create sections (A, B, C) for each class",
                "You can add class teachers later"
            ]
        },
        3: {
            "message": "👨‍🏫 Time to add your teaching staff!",
            "instructions": [
                "Start with the Principal and Vice Principal",
                "Add all teachers with their subjects",
                "Each staff member gets their own TeachTino login"
            ]
        },
        4: {
            "message": "👨‍🎓 Now add your students.",
            "instructions": [
                "You can add students one by one or upload Excel",
                "Each student gets a unique ID and StudyTino login",
                "Parents can track their child's progress"
            ]
        },
        5: {
            "message": "💰 Set up your fee structure.",
            "instructions": [
                "Create fee categories (Tuition, Transport, etc.)",
                "Set amounts for each class",
                "Parents can pay online through the app"
            ]
        },
        6: {
            "message": "🌐 Connect your school website.",
            "instructions": [
                "Enter your website URL",
                "Schooltino can auto-update your website",
                "Notices, events, and results sync automatically"
            ]
        },
        7: {
            "message": "📹 Set up CCTV monitoring (Optional).",
            "instructions": [
                "Connect IP cameras for smart monitoring",
                "AI can auto-detect attendance from CCTV",
                "Get alerts for unusual activities"
            ]
        }
    }
    
    guide = guides.get(next_step["step_number"], {
        "message": "Continue with your setup.",
        "instructions": []
    })
    
    return {
        **guide,
        "current_step": next_step,
        "completion_percentage": wizard["completion_percentage"],
        "remaining_steps": len(incomplete_steps)
    }

# ==================== MARKETING MATERIALS DOWNLOAD ====================

@api_router.get("/download/marketing-materials")
async def download_marketing_materials():
    """Download marketing materials ZIP file"""
    zip_path = UPLOAD_DIR / "marketing_materials.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Marketing materials not found")
    return FileResponse(
        path=str(zip_path),
        filename="Schooltino_Marketing_Materials.zip",
        media_type="application/zip"
    )

# ==================== DIRECTOR UNIQUE ID GENERATION ====================

@api_router.post("/auth/create-director")
async def create_director_for_school(
    email: EmailStr,
    name: str,
    mobile: Optional[str] = None,
    school_name: Optional[str] = None
):
    """Create a new Director account with unique ID - Public endpoint for onboarding"""
    # Check if email already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique director ID
    director_id = str(uuid.uuid4())
    
    # Generate temporary password (8 chars)
    temp_password = generate_temp_password()
    hashed_pw = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()
    
    # Create school first if name provided
    school_id = None
    if school_name:
        school_id = str(uuid.uuid4())
        school_doc = {
            "id": school_id,
            "name": school_name,
            "address": "",
            "board_type": "CBSE",
            "city": "",
            "state": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.schools.insert_one(school_doc)
    
    # Create director user
    user_doc = {
        "id": director_id,
        "email": email,
        "password": hashed_pw,
        "name": name,
        "role": "director",
        "mobile": mobile,
        "school_id": school_id,
        "status": "active",
        "password_change_required": True,  # Must change password on first login
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.users.insert_one(user_doc)
    
    # Auto-activate free trial
    if school_id:
        now = datetime.now(timezone.utc)
        subscription_doc = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "plan_type": "free_trial",
            "status": "active",
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=30)).isoformat(),
            "ai_enabled_until": (now + timedelta(days=3)).isoformat(),
            "amount": 0,
            "features": ["all_features", "ai_3_days"],
            "created_at": now.isoformat()
        }
        await db.subscriptions.insert_one(subscription_doc)
    
    return {
        "message": "Director account created successfully!",
        "director_id": director_id,
        "email": email,
        "temporary_password": temp_password,
        "school_id": school_id,
        "instructions": [
            "Login with the email and temporary password",
            "You will be asked to change your password on first login",
            "Complete the setup wizard to configure your school"
        ],
        "subscription": {
            "plan": "free_trial",
            "duration": "30 days",
            "ai_access": "3 days",
            "message": "Your free trial has started!"
        }
    }

@api_router.post("/auth/change-password")
async def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    if not bcrypt.checkpw(old_password.encode(), user["password"].encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    hashed_pw = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "password": hashed_pw,
                "password_change_required": False,
                "password_changed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await log_audit(current_user["id"], "change_password", "users", {"user_id": current_user["id"]})
    
    return {"message": "Password changed successfully"}

# ==================== ONETINO INTEGRATION API ====================

@api_router.get("/onetino/school-stats")
async def get_school_stats_for_onetino(current_user: dict = Depends(get_current_user)):
    """Get school statistics for OneTino EduOne dashboard"""
    school_id = current_user.get("school_id")
    
    # Get counts
    total_students = await db.students.count_documents({"school_id": school_id, "status": "active"})
    total_staff = await db.staff.count_documents({"school_id": school_id})
    total_classes = await db.classes.count_documents({"school_id": school_id})
    
    # Get school info
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    
    # Recent activity
    recent_notices = await db.notices.count_documents({
        "school_id": school_id,
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    
    return {
        "school_id": school_id,
        "school_name": school.get("name") if school else "Unknown",
        "statistics": {
            "total_students": total_students,
            "total_staff": total_staff,
            "total_classes": total_classes,
            "notices_this_week": recent_notices
        },
        "subscription": {
            "plan": "premium",
            "status": "active",
            "valid_until": "2026-12-31"
        },
        "features_enabled": [
            "voice_assistant",
            "ai_content_studio",
            "sms_center",
            "website_integration",
            "cctv_ready"
        ],
        "last_activity": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/onetino/all-schools")
async def get_all_schools_for_onetino(api_key: str = None):
    """Get all schools connected to OneTino (Super Admin API)"""
    # In production, verify OneTino API key
    if api_key != "onetino-master-key":
        # For now, allow without key for testing
        pass
    
    schools = await db.schools.find({}, {"_id": 0}).to_list(100)
    
    school_stats = []
    for school in schools:
        students = await db.students.count_documents({"school_id": school["id"], "status": "active"})
        staff = await db.staff.count_documents({"school_id": school["id"]})
        
        school_stats.append({
            "id": school["id"],
            "name": school.get("name"),
            "city": school.get("city"),
            "state": school.get("state"),
            "students": students,
            "staff": staff,
            "status": "active",
            "subscription": "premium"
        })
    
    return {
        "total_schools": len(school_stats),
        "schools": school_stats,
        "total_students": sum(s["students"] for s in school_stats),
        "total_staff": sum(s["staff"] for s in school_stats)
    }

@api_router.get("/onetino/issues")
async def get_issues_for_onetino(current_user: dict = Depends(get_current_user)):
    """Get support issues/tickets for OneTino dashboard"""
    school_id = current_user.get("school_id")
    
    # Mock issues for now
    return {
        "issues": [
            {
                "id": "ISS001",
                "school_id": school_id,
                "title": "SMS not sending",
                "description": "SMS feature showing sent but parents not receiving",
                "status": "open",
                "priority": "high",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ],
        "stats": {
            "open": 1,
            "in_progress": 0,
            "resolved": 5
        }
    }

@api_router.post("/onetino/report-issue")
async def report_issue_to_onetino(
    title: str,
    description: str,
    priority: str = "medium",
    current_user: dict = Depends(get_current_user)
):
    """Report an issue to OneTino support"""
    issue = {
        "id": str(uuid.uuid4()),
        "school_id": current_user.get("school_id"),
        "reported_by": current_user["id"],
        "reporter_name": current_user["name"],
        "title": title,
        "description": description,
        "priority": priority,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.support_issues.insert_one(issue)
    
    return {"success": True, "issue_id": issue["id"], "message": "Issue reported to OneTino support"}

# ==================== ONLINE EXAM SYSTEM ====================

class ExamQuestion(BaseModel):
    question: str
    options: List[str]  # 4 options for MCQ
    correct_answer: int  # Index of correct option (0-3)
    marks: int = 1

class ExamCreate(BaseModel):
    title: str
    subject: str
    class_id: str
    school_id: str
    duration: int  # in minutes
    total_marks: int
    instructions: Optional[str] = None
    questions: List[ExamQuestion]
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    negative_marking: bool = False
    negative_marks: float = 0.25  # Marks to deduct per wrong answer

class ExamResponse(BaseModel):
    id: str
    title: str
    subject: str
    class_id: str
    class_name: Optional[str] = None
    school_id: str
    duration: int
    total_marks: int
    total_questions: int
    instructions: Optional[str] = None
    status: str  # draft, active, completed
    created_by: str
    created_by_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    negative_marking: bool = False
    negative_marks: float = 0.25
    created_at: str

class ExamSubmission(BaseModel):
    exam_id: str
    answers: Dict[str, int]  # {question_index: selected_option_index}

class ExamResultResponse(BaseModel):
    id: str
    exam_id: str
    exam_title: str
    subject: str
    student_id: str
    student_name: str
    score: float
    total_marks: int
    percentage: float
    correct_answers: int
    wrong_answers: int
    unanswered: int
    time_taken: int  # in seconds
    submitted_at: str
    rank: Optional[int] = None
    total_students: Optional[int] = None

@api_router.post("/exams", response_model=ExamResponse)
async def create_exam(exam: ExamCreate, current_user: dict = Depends(get_current_user)):
    """Teacher creates a new exam"""
    if current_user["role"] not in ["director", "principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to create exams")
    
    # Calculate total marks from questions
    total_marks = sum(q.marks for q in exam.questions)
    
    # Get class info
    class_doc = await db.classes.find_one({"id": exam.class_id}, {"_id": 0})
    class_name = f"{class_doc['name']}-{class_doc['section']}" if class_doc else None
    
    exam_data = {
        "id": str(uuid.uuid4()),
        "title": exam.title,
        "subject": exam.subject,
        "class_id": exam.class_id,
        "class_name": class_name,
        "school_id": exam.school_id,
        "duration": exam.duration,
        "total_marks": total_marks,
        "total_questions": len(exam.questions),
        "instructions": exam.instructions,
        "questions": [q.model_dump() for q in exam.questions],
        "status": "active",
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "start_time": exam.start_time or datetime.now(timezone.utc).isoformat(),
        "end_time": exam.end_time or (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "negative_marking": exam.negative_marking,
        "negative_marks": exam.negative_marks,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.exams.insert_one(exam_data)
    
    await log_audit(current_user["id"], "create_exam", "exams", {
        "exam_id": exam_data["id"],
        "title": exam.title,
        "subject": exam.subject,
        "questions": len(exam.questions)
    })
    
    return ExamResponse(
        id=exam_data["id"],
        title=exam_data["title"],
        subject=exam_data["subject"],
        class_id=exam_data["class_id"],
        class_name=exam_data["class_name"],
        school_id=exam_data["school_id"],
        duration=exam_data["duration"],
        total_marks=exam_data["total_marks"],
        total_questions=exam_data["total_questions"],
        instructions=exam_data["instructions"],
        status=exam_data["status"],
        created_by=exam_data["created_by"],
        created_by_name=exam_data["created_by_name"],
        start_time=exam_data["start_time"],
        end_time=exam_data["end_time"],
        negative_marking=exam_data["negative_marking"],
        negative_marks=exam_data["negative_marks"],
        created_at=exam_data["created_at"]
    )

@api_router.get("/exams")
async def get_exams(
    school_id: Optional[str] = None,
    class_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all exams (for teachers) or available exams (for students)"""
    query = {}
    
    # Students see only active exams for their class
    if current_user.get("role") == "student":
        query["class_id"] = current_user.get("class_id")
        query["status"] = "active"
        # Check if exam is within valid time
        now = datetime.now(timezone.utc).isoformat()
        query["start_time"] = {"$lte": now}
        query["end_time"] = {"$gte": now}
    else:
        # Teachers/Admin can filter
        if school_id:
            query["school_id"] = school_id
        if class_id:
            query["class_id"] = class_id
        if status:
            query["status"] = status
        # Teachers see their own exams
        if current_user["role"] == "teacher":
            query["created_by"] = current_user["id"]
    
    exams = await db.exams.find(query, {"_id": 0, "questions": 0}).sort("created_at", -1).to_list(100)
    
    # For students, check if already attempted
    if current_user.get("role") == "student":
        student_id = current_user.get("id")
        for exam in exams:
            result = await db.exam_results.find_one({
                "exam_id": exam["id"],
                "student_id": student_id
            })
            exam["already_attempted"] = result is not None
            if result:
                exam["my_score"] = result.get("score")
                exam["my_percentage"] = result.get("percentage")
    
    return exams

@api_router.get("/exams/my-results")
async def get_my_exam_results(current_user: dict = Depends(get_current_user)):
    """Get student's exam results"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view their results")
    
    results = await db.exam_results.find(
        {"student_id": current_user.get("id")},
        {"_id": 0, "answers": 0}
    ).sort("submitted_at", -1).to_list(100)
    
    # Add rank for each result
    for result in results:
        all_results = await db.exam_results.find(
            {"exam_id": result["exam_id"]},
            {"_id": 0, "score": 1}
        ).sort("score", -1).to_list(1000)
        
        rank = 1
        for r in all_results:
            if r["score"] > result["score"]:
                rank += 1
        
        result["rank"] = rank
        result["total_students"] = len(all_results)
    
    return results

@api_router.get("/exams/{exam_id}")
async def get_exam(exam_id: str, current_user: dict = Depends(get_current_user)):
    """Get exam details (with questions for taking exam)"""
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # For students, check if already attempted
    if current_user.get("role") == "student":
        result = await db.exam_results.find_one({
            "exam_id": exam_id,
            "student_id": current_user.get("id")
        })
        if result:
            raise HTTPException(status_code=400, detail="You have already attempted this exam")
        
        # Remove correct answers from questions for students
        for q in exam.get("questions", []):
            q.pop("correct_answer", None)
    
    return exam

@api_router.post("/exams/{exam_id}/submit", response_model=ExamResultResponse)
async def submit_exam(exam_id: str, submission: ExamSubmission, current_user: dict = Depends(get_current_user)):
    """Student submits exam answers"""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit exams")
    
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check if already attempted
    existing = await db.exam_results.find_one({
        "exam_id": exam_id,
        "student_id": current_user.get("id")
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this exam")
    
    # Calculate score
    questions = exam.get("questions", [])
    correct_answers = 0
    wrong_answers = 0
    unanswered = 0
    score = 0
    
    for idx, q in enumerate(questions):
        answer_key = str(idx)
        if answer_key in submission.answers:
            if submission.answers[answer_key] == q["correct_answer"]:
                correct_answers += 1
                score += q["marks"]
            else:
                wrong_answers += 1
                if exam.get("negative_marking"):
                    score -= exam.get("negative_marks", 0.25)
        else:
            unanswered += 1
    
    # Ensure score doesn't go negative
    score = max(0, score)
    
    total_marks = exam["total_marks"]
    percentage = round((score / total_marks) * 100, 2) if total_marks > 0 else 0
    
    # Get student info
    student = current_user
    student_name = student.get("name", "Unknown")
    
    result_data = {
        "id": str(uuid.uuid4()),
        "exam_id": exam_id,
        "exam_title": exam["title"],
        "subject": exam["subject"],
        "class_id": exam["class_id"],
        "school_id": exam["school_id"],
        "student_id": current_user.get("id"),
        "student_name": student_name,
        "answers": submission.answers,
        "score": score,
        "total_marks": total_marks,
        "percentage": percentage,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered": unanswered,
        "time_taken": 0,  # Can be tracked from frontend
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.exam_results.insert_one(result_data)
    
    # Calculate rank
    all_results = await db.exam_results.find(
        {"exam_id": exam_id},
        {"_id": 0, "score": 1}
    ).sort("score", -1).to_list(1000)
    
    rank = 1
    for r in all_results:
        if r["score"] > score:
            rank += 1
    
    await log_audit(current_user.get("id"), "submit_exam", "exams", {
        "exam_id": exam_id,
        "score": score,
        "percentage": percentage
    })
    
    return ExamResultResponse(
        id=result_data["id"],
        exam_id=exam_id,
        exam_title=exam["title"],
        subject=exam["subject"],
        student_id=result_data["student_id"],
        student_name=student_name,
        score=score,
        total_marks=total_marks,
        percentage=percentage,
        correct_answers=correct_answers,
        wrong_answers=wrong_answers,
        unanswered=unanswered,
        time_taken=0,
        submitted_at=result_data["submitted_at"],
        rank=rank,
        total_students=len(all_results)
    )

@api_router.get("/exams/{exam_id}/results")
async def get_exam_results(exam_id: str, current_user: dict = Depends(get_current_user)):
    """Teacher views all results for an exam"""
    if current_user["role"] not in ["director", "principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    results = await db.exam_results.find(
        {"exam_id": exam_id},
        {"_id": 0, "answers": 0}
    ).sort("score", -1).to_list(1000)
    
    # Add ranks
    for idx, result in enumerate(results):
        result["rank"] = idx + 1
        result["total_students"] = len(results)
    
    # Calculate statistics
    if results:
        scores = [r["score"] for r in results]
        stats = {
            "total_submissions": len(results),
            "highest_score": max(scores),
            "lowest_score": min(scores),
            "average_score": round(sum(scores) / len(scores), 2),
            "pass_count": len([s for s in scores if (s / exam["total_marks"] * 100) >= 40]),
            "fail_count": len([s for s in scores if (s / exam["total_marks"] * 100) < 40])
        }
    else:
        stats = {
            "total_submissions": 0,
            "highest_score": 0,
            "lowest_score": 0,
            "average_score": 0,
            "pass_count": 0,
            "fail_count": 0
        }
    
    return {
        "exam": {
            "id": exam["id"],
            "title": exam["title"],
            "subject": exam["subject"],
            "total_marks": exam["total_marks"],
            "total_questions": exam["total_questions"]
        },
        "stats": stats,
        "results": results
    }

@api_router.put("/exams/{exam_id}/status")
async def update_exam_status(exam_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Update exam status (active, completed, draft)"""
    if current_user["role"] not in ["director", "principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status not in ["draft", "active", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.exams.update_one(
        {"id": exam_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    return {"message": f"Exam status updated to {status}"}

@api_router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an exam"""
    if current_user["role"] not in ["director", "principal", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    exam = await db.exams.find_one({"id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check if exam has submissions
    submissions = await db.exam_results.count_documents({"exam_id": exam_id})
    if submissions > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete exam with {submissions} submissions. Mark as completed instead.")
    
    await db.exams.delete_one({"id": exam_id})
    
    await log_audit(current_user["id"], "delete_exam", "exams", {"exam_id": exam_id})
    
    return {"message": "Exam deleted successfully"}

@api_router.get("/exams/{exam_id}/leaderboard")
async def get_exam_leaderboard(exam_id: str, limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get top performers for an exam"""
    results = await db.exam_results.find(
        {"exam_id": exam_id},
        {"_id": 0, "student_name": 1, "score": 1, "percentage": 1, "submitted_at": 1}
    ).sort("score", -1).limit(limit).to_list(limit)
    
    for idx, r in enumerate(results):
        r["rank"] = idx + 1
    
    return results

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
