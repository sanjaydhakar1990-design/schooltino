"""
Unified Team Management API
Merges users + staff/employees into single view
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/team", tags=["Unified Team"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "schooltino")
_client = AsyncIOMotorClient(MONGO_URL)
db = _client[DB_NAME]

@router.get("/members")
async def get_unified_team(school_id: str):
    """
    Get unified team view - merges users + staff + employees
    Returns single source of truth for all team members
    """
    
    # Get all users (login accounts)
    users = await db.users.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(200)
    
    # Get staff records
    staff_records = await db.staff.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(200)
    
    # Get employee records
    employee_records = await db.employees.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(200)
    
    # Create mapping: user_id → staff/employee data
    staff_map = {s.get("user_id"): s for s in staff_records if s.get("user_id")}
    employee_map = {e.get("user_id"): e for e in employee_records if e.get("user_id")}
    
    # Merge data
    unified_team = []
    for user in users:
        user_id = user.get("id")
        
        # Base data from users
        member = {
            "id": user_id,  # Main ID for all operations
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": user.get("role"),
            "school_id": school_id,
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at"),
        }
        
        # Merge staff data if exists
        if user_id in staff_map:
            staff = staff_map[user_id]
            member.update({
                "staff_id": staff.get("id"),  # Original staff ID (for reference)
                "designation": staff.get("designation"),
                "joining_date": staff.get("joining_date"),
                "salary": staff.get("salary"),
                "department": staff.get("department"),
            })
        
        # Merge employee data if exists
        if user_id in employee_map:
            emp = employee_map[user_id]
            member.update({
                "employee_id": emp.get("id"),
                "designation": emp.get("designation") or member.get("designation"),
                "joining_date": emp.get("joining_date") or member.get("joining_date"),
            })
        
        unified_team.append(member)
    
    return {
        "total": len(unified_team),
        "members": unified_team,
        "stats": {
            "total_users": len(users),
            "total_staff": len(staff_records),
            "total_employees": len(employee_records),
            "merged": len(unified_team)
        }
    }

@router.get("/teachers")
async def get_teachers(school_id: str):
    """Get only teachers/principals for dropdowns"""
    
    users = await db.users.find(
        {
            "school_id": school_id,
            "role": {"$in": ["teacher", "principal", "vice_principal"]}
        },
        {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1, "phone": 1}
    ).to_list(200)
    
    # Also check employees/staff with teacher designation
    employees = await db.employees.find(
        {
            "school_id": school_id,
            "user_id": {"$ne": None}
        },
        {"_id": 0, "user_id": 1, "name": 1, "designation": 1}
    ).to_list(200)
    
    # Filter employees who are teachers but might not be in users
    teacher_user_ids = {u["id"] for u in users}
    for emp in employees:
        if emp.get("user_id") and emp["user_id"] not in teacher_user_ids:
            designation = emp.get("designation", "").lower()
            if "teacher" in designation or "principal" in designation:
                users.append({
                    "id": emp["user_id"],
                    "name": emp.get("name"),
                    "email": "",
                    "role": "teacher",
                    "phone": ""
                })
    
    return {
        "total": len(users),
        "teachers": users
    }
