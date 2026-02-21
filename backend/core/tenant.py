"""
tenant.py - Multi-Tenant Isolation for Schooltino SaaS

ARCHITECTURE:
  - Every school is a TENANT with a unique school_id
  - All data in MongoDB has school_id field (document-level isolation)
  - This module ensures:
      1. A school can NEVER access another school's data
      2. Subscription is checked on every request
      3. Feature gating based on plan

USAGE IN ROUTES:
    from core.tenant import get_tenant_user, require_feature

    @router.get("/students")
    async def list_students(ctx: TenantContext = Depends(get_tenant_user)):
        # ctx.school_id is always the authenticated user's school
        # ctx.user is the current user dict
        # ctx.plan is the subscription plan
        students = await db.students.find({"school_id": ctx.school_id}).to_list(100)
        return students

    # Feature gating:
    @router.post("/ai-query")
    async def ai_query(ctx: TenantContext = Depends(require_feature("ai_features"))):
        ...
"""

import logging
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.database import db

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


# ====================== SUBSCRIPTION PLAN FEATURES ======================

PLAN_FEATURES = {
    "free": {
        "max_students": 50,
        "max_teachers": 10,
        "max_classes": 5,
        "ai_features": False,
        "ai_queries_per_day": 0,
        "sms_notifications": False,
        "email_notifications": True,
        "fee_management": True,
        "attendance": True,
        "timetable": True,
        "exams": True,
        "id_cards": False,
        "admit_cards": False,
        "transport": False,
        "face_recognition": False,
        "multi_branch": False,
        "custom_reports": False,
        "bulk_import": False,
        "api_access": False,
        "white_label": False,
        "priority_support": False,
    },
    "trial": {
        "max_students": 200,
        "max_teachers": 20,
        "max_classes": 10,
        "ai_features": True,
        "ai_queries_per_day": 20,
        "sms_notifications": False,
        "email_notifications": True,
        "fee_management": True,
        "attendance": True,
        "timetable": True,
        "exams": True,
        "id_cards": True,
        "admit_cards": True,
        "transport": True,
        "face_recognition": False,
        "multi_branch": False,
        "custom_reports": True,
        "bulk_import": True,
        "api_access": False,
        "white_label": False,
        "priority_support": False,
    },
    "starter": {
        "max_students": 300,
        "max_teachers": 30,
        "max_classes": 15,
        "ai_features": False,
        "ai_queries_per_day": 0,
        "sms_notifications": True,
        "email_notifications": True,
        "fee_management": True,
        "attendance": True,
        "timetable": True,
        "exams": True,
        "id_cards": True,
        "admit_cards": True,
        "transport": True,
        "face_recognition": False,
        "multi_branch": False,
        "custom_reports": True,
        "bulk_import": True,
        "api_access": False,
        "white_label": False,
        "priority_support": False,
    },
    "growth": {
        "max_students": 1500,
        "max_teachers": 100,
        "max_classes": 50,
        "ai_features": True,
        "ai_queries_per_day": 100,
        "sms_notifications": True,
        "email_notifications": True,
        "fee_management": True,
        "attendance": True,
        "timetable": True,
        "exams": True,
        "id_cards": True,
        "admit_cards": True,
        "transport": True,
        "face_recognition": True,
        "multi_branch": False,
        "custom_reports": True,
        "bulk_import": True,
        "api_access": False,
        "white_label": False,
        "priority_support": False,
    },
    "pro": {
        "max_students": 5000,
        "max_teachers": 300,
        "max_classes": 200,
        "ai_features": True,
        "ai_queries_per_day": 500,
        "sms_notifications": True,
        "email_notifications": True,
        "fee_management": True,
        "attendance": True,
        "timetable": True,
        "exams": True,
        "id_cards": True,
        "admit_cards": True,
        "transport": True,
        "face_recognition": True,
        "multi_branch": True,
        "custom_reports": True,
        "bulk_import": True,
        "api_access": True,
        "white_label": False,
        "priority_support": True,
    },
    "enterprise": {
        "max_students": -1,          # Unlimited
        "max_teachers": -1,          # Unlimited
        "max_classes": -1,           # Unlimited
        "ai_features": True,
        "ai_queries_per_day": -1,    # Unlimited
        "sms_notifications": True,
        "email_notifications": True,
        "fee_management": True,
        "attendance": True,
        "timetable": True,
        "exams": True,
        "id_cards": True,
        "admit_cards": True,
        "transport": True,
        "face_recognition": True,
        "multi_branch": True,
        "custom_reports": True,
        "bulk_import": True,
        "api_access": True,
        "white_label": True,
        "priority_support": True,
    },
}

# Pricing in INR (Indian Rupees) - Cheapest School ERP in India!
PLAN_PRICING = {
    "free":       {"monthly": 0,    "yearly": 0,      "label": "Free",       "color": "#6b7280"},
    "trial":      {"monthly": 0,    "yearly": 0,      "label": "14-Day Trial","color": "#8b5cf6"},
    "starter":    {"monthly": 499,  "yearly": 4990,   "label": "Starter",    "color": "#3b82f6"},
    "growth":     {"monthly": 999,  "yearly": 9990,   "label": "Growth",     "color": "#10b981"},
    "pro":        {"monthly": 1999, "yearly": 19990,  "label": "Pro",        "color": "#f59e0b"},
    "enterprise": {"monthly": 3999, "yearly": 39990,  "label": "Enterprise", "color": "#ef4444"},
}

# ====================== MODULE PLAN MAPPING ======================
# Defines which sidebar modules are AVAILABLE per subscription plan
# Modules listed here can be enabled/disabled by the school within their plan

ALL_MODULES = [
    "students", "classes", "attendance", "fee_management",      # Core - Free
    "timetable", "exams_reports", "digital_library", "homework",# Academic - Starter
    "communication_hub", "calendar", "school_feed", "staff",    # Communication - Starter
    "admissions", "transport", "front_office", "inventory",     # Management - Growth
    "ai_tools", "analytics", "live_classes",                    # Advanced - Pro
    "cctv", "multi_branch",                                     # Enterprise only
]

PLAN_MODULES = {
    "free": [
        # Core + Homework (basic academic) - enough to run a basic school
        "students", "classes", "attendance", "fee_management",
        "homework", "school_feed",
    ],
    "trial": [
        # Full access during trial - so they see the value
        "students", "classes", "attendance", "fee_management",
        "timetable", "exams_reports", "digital_library", "homework",
        "communication_hub", "calendar", "school_feed", "staff",
        "admissions", "transport", "front_office", "inventory",
        "ai_tools", "analytics", "live_classes",
    ],
    "starter": [
        # Core + Academic + Communication
        "students", "classes", "attendance", "fee_management",
        "timetable", "exams_reports", "digital_library", "homework",
        "communication_hub", "calendar", "school_feed", "staff",
    ],
    "growth": [
        # All Starter + Management features
        "students", "classes", "attendance", "fee_management",
        "timetable", "exams_reports", "digital_library", "homework",
        "communication_hub", "calendar", "school_feed", "staff",
        "admissions", "transport", "front_office", "inventory",
    ],
    "pro": [
        # All Growth + Advanced features (AI, Analytics, Live)
        "students", "classes", "attendance", "fee_management",
        "timetable", "exams_reports", "digital_library", "homework",
        "communication_hub", "calendar", "school_feed", "staff",
        "admissions", "transport", "front_office", "inventory",
        "ai_tools", "analytics", "live_classes",
    ],
    "enterprise": [
        # Everything including CCTV + Multi-branch
        "students", "classes", "attendance", "fee_management",
        "timetable", "exams_reports", "digital_library", "homework",
        "communication_hub", "calendar", "school_feed", "staff",
        "admissions", "transport", "front_office", "inventory",
        "ai_tools", "analytics", "live_classes",
        "cctv", "multi_branch",
    ],
}

MODULE_INFO = {
    "students":          {"label": "Students",         "icon": "👨‍🎓", "category": "Core",         "desc": "Student profiles, records, ID cards"},
    "classes":           {"label": "Classes",          "icon": "🏫", "category": "Core",         "desc": "Classes, sections, subjects"},
    "attendance":        {"label": "Attendance",       "icon": "✅", "category": "Core",         "desc": "Daily attendance tracking"},
    "fee_management":    {"label": "Fee Management",   "icon": "💰", "category": "Core",         "desc": "Fee collection, receipts, dues"},
    "timetable":         {"label": "Timetable",        "icon": "📅", "category": "Academic",     "desc": "Class scheduling & timetables"},
    "exams_reports":     {"label": "Exams & Reports",  "icon": "📝", "category": "Academic",     "desc": "Exams, marks, report cards"},
    "digital_library":   {"label": "Digital Library",  "icon": "📚", "category": "Academic",     "desc": "Books, resources, e-library"},
    "homework":          {"label": "Homework",         "icon": "📋", "category": "Academic",     "desc": "Homework assignments & submissions"},
    "communication_hub": {"label": "Communication",    "icon": "💬", "category": "Communication","desc": "Notices, SMS, announcements"},
    "calendar":          {"label": "Calendar",         "icon": "🗓️", "category": "Communication","desc": "Events, holidays, schedule"},
    "school_feed":       {"label": "School Feed",      "icon": "📰", "category": "Communication","desc": "School announcements & news feed"},
    "staff":             {"label": "Staff",            "icon": "👩‍💼", "category": "Communication","desc": "Staff management, leave, salary"},
    "admissions":        {"label": "Admissions",       "icon": "🎯", "category": "Management",   "desc": "Admission CRM, enquiries"},
    "transport":         {"label": "Transport",        "icon": "🚌", "category": "Management",   "desc": "Bus routes, vehicle tracking"},
    "front_office":      {"label": "Front Office",     "icon": "🏢", "category": "Management",   "desc": "Visitor management, reception"},
    "inventory":         {"label": "Inventory",        "icon": "📦", "category": "Management",   "desc": "School inventory & assets"},
    "ai_tools":          {"label": "AI Tools",         "icon": "🤖", "category": "Advanced",     "desc": "AI paper generation, insights"},
    "analytics":         {"label": "Analytics",        "icon": "📊", "category": "Advanced",     "desc": "School performance analytics"},
    "live_classes":      {"label": "Live Classes",     "icon": "📹", "category": "Advanced",     "desc": "Online classes, video sessions"},
    "cctv":              {"label": "CCTV",             "icon": "📷", "category": "Enterprise",   "desc": "CCTV monitoring integration"},
    "multi_branch":      {"label": "Multi-Branch",     "icon": "🌐", "category": "Enterprise",   "desc": "Manage multiple school branches"},
}


# ====================== TENANT CONTEXT DATACLASS ======================

@dataclass
class TenantContext:
    """Contains all tenant-specific context for a request"""
    user: dict                          # Current authenticated user
    school_id: str                      # User's school ID (never trust client!)
    school: dict = field(default_factory=dict)  # School record
    plan: str = "free"                  # Subscription plan name
    features: dict = field(default_factory=dict)  # Available features
    is_super_admin: bool = False        # Platform owner
    subscription_valid: bool = True    # Subscription status

    def has_feature(self, feature_name: str) -> bool:
        """Check if current plan includes a feature"""
        return self.features.get(feature_name, False)

    def get_limit(self, limit_name: str) -> int:
        """Get a plan limit (-1 means unlimited)"""
        return self.features.get(limit_name, 0)

    def require_feature(self, feature_name: str):
        """Raise 403 if feature not in plan"""
        if not self.has_feature(feature_name):
            plan_label = PLAN_PRICING.get(self.plan, {}).get("label", self.plan)
            raise HTTPException(
                status_code=403,
                detail=f"'{feature_name}' feature is not available in your {plan_label} plan. "
                       f"Please upgrade to access this feature."
            )


# ====================== CORE TENANT DEPENDENCY ======================

async def get_tenant_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TenantContext:
    """
    Main dependency for all protected routes.
    Returns TenantContext with user, school, and plan info.

    SECURITY:
    - Decodes and validates JWT
    - Fetches fresh user from DB
    - Fetches school subscription
    - NEVER trusts school_id from client request
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication token required")

    try:
        import jwt as pyjwt
        from core.auth import JWT_SECRET, JWT_ALGORITHM
        token = credentials.credentials
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    role = payload.get("role")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Super Admin bypass
    if role == "super_admin":
        admin = await db.super_admins.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Super admin not found")
        return TenantContext(
            user=admin,
            school_id="__SUPER_ADMIN__",
            plan="enterprise",
            features=PLAN_FEATURES["enterprise"],
            is_super_admin=True
        )

    # Fetch user (staff) or student
    if role == "student":
        user = await db.students.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user:
            user["role"] = "student"
    else:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    school_id = user.get("school_id")
    if not school_id:
        raise HTTPException(status_code=403, detail="User not associated with any school")

    # Fetch school + subscription
    school = await db.schools.find_one({"id": school_id}, {"_id": 0}) or {}

    if not school.get("is_active", False):
        raise HTTPException(
            status_code=403,
            detail="Your school account is suspended. Please contact support."
        )

    # Get subscription plan
    subscription = await db.subscriptions.find_one({"school_id": school_id}) or {}
    plan = subscription.get("plan_type", "free")

    # Check subscription validity
    valid_until_str = subscription.get("valid_until")
    subscription_valid = True
    if valid_until_str:
        try:
            valid_until = datetime.fromisoformat(valid_until_str.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > valid_until:
                subscription_valid = False
                plan = "free"   # Downgrade to free on expiry
        except Exception:
            pass

    features = PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])

    return TenantContext(
        user=user,
        school_id=school_id,
        school=school,
        plan=plan,
        features=features,
        is_super_admin=False,
        subscription_valid=subscription_valid
    )


# ====================== ROLE-BASED DEPENDENCIES ======================

async def require_staff(ctx: TenantContext = Depends(get_tenant_user)) -> TenantContext:
    """Only staff members (not students) can access"""
    if ctx.user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Staff access only")
    return ctx


async def require_admin(ctx: TenantContext = Depends(get_tenant_user)) -> TenantContext:
    """Only admin roles can access"""
    from core.constants import UserRole
    admin_roles = [UserRole.DIRECTOR, UserRole.CO_DIRECTOR, UserRole.PRINCIPAL,
                   UserRole.VICE_PRINCIPAL, UserRole.ADMIN_STAFF]
    if ctx.user.get("role") not in admin_roles:
        raise HTTPException(status_code=403, detail="Admin access only")
    return ctx


async def require_director(ctx: TenantContext = Depends(get_tenant_user)) -> TenantContext:
    """Only director/co-director can access"""
    from core.constants import UserRole
    if ctx.user.get("role") not in [UserRole.DIRECTOR, UserRole.CO_DIRECTOR]:
        raise HTTPException(status_code=403, detail="Director access only")
    return ctx


def require_feature(feature_name: str):
    """
    Factory for feature-gated dependencies.
    Usage: @router.get("/ai") async def ai(ctx = Depends(require_feature("ai_features")))
    """
    async def _check_feature(ctx: TenantContext = Depends(get_tenant_user)) -> TenantContext:
        ctx.require_feature(feature_name)
        return ctx
    return _check_feature


def require_role_and_feature(role: str, feature_name: str):
    """Require both a role AND a feature"""
    async def _check(ctx: TenantContext = Depends(get_tenant_user)) -> TenantContext:
        if ctx.user.get("role") != role:
            raise HTTPException(status_code=403, detail=f"Only {role} can access this")
        ctx.require_feature(feature_name)
        return ctx
    return _check


# ====================== HELPER: SAFE SCHOOL_ID ======================

def get_school_id_from_context(ctx: TenantContext, requested_school_id: str = None) -> str:
    """
    ALWAYS use this when a route accepts school_id as a parameter.
    Returns the authenticated user's school_id, ignoring client-provided values
    (unless super admin).

    Usage:
        @router.get("/data/{school_id}")
        async def get_data(school_id: str, ctx = Depends(get_tenant_user)):
            safe_school_id = get_school_id_from_context(ctx, school_id)
            # safe_school_id is always ctx.school_id for regular users
    """
    if ctx.is_super_admin:
        # Super admin can query any school
        return requested_school_id or ctx.school_id

    # For all other users: ALWAYS use their own school_id
    if requested_school_id and requested_school_id != ctx.school_id:
        logger.warning(
            f"SECURITY: User {ctx.user.get('id')} from school {ctx.school_id} "
            f"attempted to access school {requested_school_id}"
        )
        raise HTTPException(
            status_code=403,
            detail="Access denied. You can only access your school's data."
        )
    return ctx.school_id


# ====================== USAGE COUNT TRACKING ======================

async def check_and_increment_ai_quota(school_id: str, plan: str) -> bool:
    """
    Check AI query quota and increment counter.
    Returns True if allowed, False if quota exceeded.
    """
    limit = PLAN_FEATURES.get(plan, {}).get("ai_queries_per_day", 0)
    if limit == -1:
        return True  # Unlimited
    if limit == 0:
        return False  # Not allowed

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"{school_id}:{today}"

    # Use a simple counter in MongoDB
    result = await db.ai_quota.find_one_and_update(
        {"key": key},
        {"$inc": {"count": 1}, "$setOnInsert": {"school_id": school_id, "date": today}},
        upsert=True,
        return_document=True
    )

    count = result.get("count", 1) if result else 1
    return count <= limit
