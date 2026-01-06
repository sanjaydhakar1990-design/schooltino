"""
Group Chat System for Schooltino
- Class-wise student groups
- Staff/Admin groups
- Real-time messaging with WebSocket support (future)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
from database import get_database

router = APIRouter(prefix="/chat", tags=["Group Chat"])

# Models
class ChatMessage(BaseModel):
    group_id: str
    content: str
    sender_id: str
    sender_name: str
    sender_role: str
    message_type: str = "text"  # text, image, file
    attachment_url: Optional[str] = None

class CreateGroup(BaseModel):
    name: str
    group_type: str  # class, staff, admin, custom
    school_id: str
    class_id: Optional[str] = None
    members: List[str] = []
    created_by: str

# ============== GROUP MANAGEMENT ==============

@router.post("/groups/create")
async def create_chat_group(data: CreateGroup):
    """Create a new chat group"""
    db = get_database()
    
    group = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "group_type": data.group_type,
        "school_id": data.school_id,
        "class_id": data.class_id,
        "members": data.members,
        "created_by": data.created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
        "last_message": None,
        "last_message_at": None
    }
    
    await db.chat_groups.insert_one(group)
    
    return {"message": "Group created", "group_id": group["id"], "group": group}

@router.get("/groups/{school_id}")
async def get_school_groups(school_id: str, user_id: str, user_role: str):
    """Get all groups accessible to a user"""
    db = get_database()
    
    # Different access based on role
    if user_role in ["director", "principal", "admin"]:
        # Can see all groups
        groups = await db.chat_groups.find({
            "school_id": school_id,
            "is_active": True
        }, {"_id": 0}).to_list(100)
    elif user_role == "teacher":
        # Can see staff groups and their class groups
        groups = await db.chat_groups.find({
            "school_id": school_id,
            "is_active": True,
            "$or": [
                {"group_type": "staff"},
                {"members": user_id}
            ]
        }, {"_id": 0}).to_list(100)
    else:
        # Students - can see only their class group
        groups = await db.chat_groups.find({
            "school_id": school_id,
            "is_active": True,
            "members": user_id
        }, {"_id": 0}).to_list(100)
    
    return {"groups": groups}

@router.get("/groups/class/{class_id}")
async def get_or_create_class_group(class_id: str, school_id: str):
    """Get or create a class group"""
    db = get_database()
    
    # Check if group exists
    group = await db.chat_groups.find_one({
        "class_id": class_id,
        "group_type": "class",
        "school_id": school_id
    }, {"_id": 0})
    
    if group:
        return group
    
    # Get class info
    class_info = await db.classes.find_one({"id": class_id})
    class_name = class_info.get("name", "Class") if class_info else "Class"
    section = class_info.get("section", "") if class_info else ""
    
    # Get all students in this class
    students = await db.students.find({
        "class_id": class_id,
        "is_active": True
    }).to_list(500)
    
    member_ids = [s.get("id") for s in students]
    
    # Create new group
    group = {
        "id": str(uuid.uuid4()),
        "name": f"{class_name} {section} Chat",
        "group_type": "class",
        "school_id": school_id,
        "class_id": class_id,
        "members": member_ids,
        "created_by": "system",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
        "last_message": None,
        "last_message_at": None
    }
    
    await db.chat_groups.insert_one(group)
    
    return group

@router.get("/groups/staff/{school_id}")
async def get_or_create_staff_group(school_id: str):
    """Get or create staff group"""
    db = get_database()
    
    group = await db.chat_groups.find_one({
        "group_type": "staff",
        "school_id": school_id
    }, {"_id": 0})
    
    if group:
        return group
    
    # Get all staff
    staff = await db.users.find({
        "school_id": school_id,
        "role": {"$in": ["teacher", "principal", "vice_principal", "accountant"]},
        "is_active": True
    }).to_list(200)
    
    member_ids = [s.get("id") for s in staff]
    
    group = {
        "id": str(uuid.uuid4()),
        "name": "Staff Group",
        "group_type": "staff",
        "school_id": school_id,
        "class_id": None,
        "members": member_ids,
        "created_by": "system",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
        "last_message": None,
        "last_message_at": None
    }
    
    await db.chat_groups.insert_one(group)
    
    return group

# ============== MESSAGES ==============

@router.post("/messages/send")
async def send_message(msg: ChatMessage):
    """Send a message to a group"""
    db = get_database()
    
    message = {
        "id": str(uuid.uuid4()),
        "group_id": msg.group_id,
        "content": msg.content,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "message_type": msg.message_type,
        "attachment_url": msg.attachment_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_deleted": False,
        "read_by": [msg.sender_id]
    }
    
    await db.chat_messages.insert_one(message)
    
    # Update group's last message
    await db.chat_groups.update_one(
        {"id": msg.group_id},
        {"$set": {
            "last_message": msg.content[:50],
            "last_message_at": message["created_at"]
        }}
    )
    
    return {"message": "Sent", "message_id": message["id"], "data": message}

@router.get("/messages/{group_id}")
async def get_messages(group_id: str, limit: int = 50, before: Optional[str] = None):
    """Get messages for a group"""
    db = get_database()
    
    query = {"group_id": group_id, "is_deleted": False}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.chat_messages.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"messages": list(reversed(messages)), "group_id": group_id}

@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user_id: str):
    """Delete a message (soft delete)"""
    db = get_database()
    
    # Check if user owns the message
    msg = await db.chat_messages.find_one({"id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if msg.get("sender_id") != user_id:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")
    
    await db.chat_messages.update_one(
        {"id": message_id},
        {"$set": {"is_deleted": True, "content": "Message deleted"}}
    )
    
    return {"message": "Deleted"}
