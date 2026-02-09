from fastapi import APIRouter, HTTPException, Query
from core.database import db
from datetime import datetime, timezone
from bson import ObjectId
import uuid

router = APIRouter(prefix="/branches", tags=["Branches"])

@router.get("")
async def get_branches(school_id: str = Query(...)):
    branches = await db.branches.find({"school_id": school_id}).to_list(100)
    for b in branches:
        b["id"] = str(b.pop("_id"))
        student_count = await db.students.count_documents({"school_id": school_id, "branch_id": b["id"]})
        staff_count = await db.users.count_documents({"school_id": school_id, "branch_id": b["id"]})
        b["students"] = student_count
        b["staff"] = staff_count
    
    if not branches:
        branches = [{
            "id": "main",
            "name": "Main Campus",
            "address": "",
            "is_main": True,
            "is_active": True,
            "students": await db.students.count_documents({"school_id": school_id}),
            "staff": await db.users.count_documents({"school_id": school_id})
        }]
    
    return {"branches": branches}

@router.post("")
async def create_branch(data: dict):
    school_id = data.get("school_id")
    if not school_id:
        raise HTTPException(400, "school_id required")
    
    branch = {
        "school_id": school_id,
        "name": data.get("name", ""),
        "code": data.get("code", ""),
        "address": data.get("address", ""),
        "city": data.get("city", ""),
        "state": data.get("state", ""),
        "pincode": data.get("pincode", ""),
        "principal_name": data.get("principal_name", ""),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "is_main": False,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.branches.insert_one(branch)
    return {"success": True, "id": str(result.inserted_id)}

@router.put("/{branch_id}")
async def update_branch(branch_id: str, data: dict):
    update_data = {k: v for k, v in data.items() if k not in ["id", "_id", "school_id"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    try:
        await db.branches.update_one({"_id": ObjectId(branch_id)}, {"$set": update_data})
    except:
        await db.branches.update_one({"id": branch_id}, {"$set": update_data})
    
    return {"success": True}

@router.delete("/{branch_id}")
async def delete_branch(branch_id: str):
    try:
        await db.branches.delete_one({"_id": ObjectId(branch_id)})
    except:
        await db.branches.delete_one({"id": branch_id})
    return {"success": True}
