"""
constants.py - Central place for all system-wide constants.
Use these instead of magic strings throughout the codebase.
"""


# ====================== USER ROLES ======================

class UserRole:
    """
    All possible user roles in the system.
    Always use these constants instead of raw strings like "director", "teacher", etc.

    Usage:
        from core.constants import UserRole
        if user["role"] == UserRole.DIRECTOR:
            ...
    """
    SUPER_ADMIN   = "super_admin"
    DIRECTOR      = "director"
    CO_DIRECTOR   = "co_director"
    PRINCIPAL     = "principal"
    VICE_PRINCIPAL = "vice_principal"
    ADMIN_STAFF   = "admin_staff"
    TEACHER       = "teacher"
    ACCOUNTANT    = "accountant"
    CLERK         = "clerk"
    ADMISSION_STAFF = "admission_staff"
    STUDENT       = "student"
    PARENT        = "parent"

    # Groups for quick permission checks
    ADMIN_ROLES = [DIRECTOR, CO_DIRECTOR, PRINCIPAL, VICE_PRINCIPAL, ADMIN_STAFF]
    STAFF_ROLES = [DIRECTOR, CO_DIRECTOR, PRINCIPAL, VICE_PRINCIPAL, ADMIN_STAFF,
                   TEACHER, ACCOUNTANT, CLERK, ADMISSION_STAFF]
    FINANCE_ROLES = [DIRECTOR, CO_DIRECTOR, ACCOUNTANT, ADMIN_STAFF]
    ALL_ROLES = [SUPER_ADMIN, DIRECTOR, CO_DIRECTOR, PRINCIPAL, VICE_PRINCIPAL,
                 ADMIN_STAFF, TEACHER, ACCOUNTANT, CLERK, ADMISSION_STAFF, STUDENT, PARENT]

    @classmethod
    def is_admin(cls, role: str) -> bool:
        return role in cls.ADMIN_ROLES

    @classmethod
    def is_staff(cls, role: str) -> bool:
        return role in cls.STAFF_ROLES

    @classmethod
    def can_manage_fees(cls, role: str) -> bool:
        return role in cls.FINANCE_ROLES


# ====================== ATTENDANCE STATUS ======================

class AttendanceStatus:
    PRESENT  = "present"
    ABSENT   = "absent"
    LATE     = "late"
    HALF_DAY = "half_day"
    HOLIDAY  = "holiday"
    ALL = [PRESENT, ABSENT, LATE, HALF_DAY, HOLIDAY]


# ====================== FEE STATUS ======================

class FeeStatus:
    PAID     = "paid"
    PENDING  = "pending"
    PARTIAL  = "partial"
    OVERDUE  = "overdue"
    WAIVED   = "waived"
    ALL = [PAID, PENDING, PARTIAL, OVERDUE, WAIVED]


# ====================== LEAVE STATUS ======================

class LeaveStatus:
    PENDING  = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    ALL = [PENDING, APPROVED, REJECTED, CANCELLED]


# ====================== EXAM TYPES ======================

class ExamType:
    UNIT_TEST   = "unit_test"
    MID_TERM    = "mid_term"
    FINAL       = "final"
    QUARTERLY   = "quarterly"
    HALF_YEARLY = "half_yearly"
    ANNUAL      = "annual"
    PRACTICE    = "practice"


# ====================== GENDER ======================

class Gender:
    MALE   = "male"
    FEMALE = "female"
    OTHER  = "other"
    ALL = [MALE, FEMALE, OTHER]


# ====================== PAYMENT METHODS ======================

class PaymentMethod:
    CASH   = "cash"
    UPI    = "upi"
    CARD   = "card"
    NEFT   = "neft"
    RTGS   = "rtgs"
    CHEQUE = "cheque"
    ONLINE = "online"
    ALL = [CASH, UPI, CARD, NEFT, RTGS, CHEQUE, ONLINE]


# ====================== SUBSCRIPTION PLANS ======================

class SubscriptionPlan:
    FREE    = "free"
    BASIC   = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    ALL = [FREE, BASIC, PREMIUM, ENTERPRISE]


# ====================== PAGINATION DEFAULTS ======================

class Pagination:
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE     = 100
    DEFAULT_PAGE      = 1


# ====================== CACHE TTL (seconds) ======================

class CacheTTL:
    SHORT  = 60         # 1 minute
    MEDIUM = 300        # 5 minutes
    LONG   = 3600       # 1 hour
    DAILY  = 86400      # 24 hours


# ====================== API TIMEOUTS (seconds) ======================

class APITimeout:
    OPENAI    = 30
    RAZORPAY  = 15
    SMS       = 10
    EMAIL     = 10
    DEFAULT   = 20
