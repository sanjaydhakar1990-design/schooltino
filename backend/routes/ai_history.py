"""
AI Conversation History and Undo/Restore API
- Save all AI interactions
- Retrieve conversation history
- Undo/Restore AI actions
"""
import os
import logging
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-history", tags=["AI History"])


# Pydantic Models
class AIConversation(BaseModel):
    user_input: str
    ai_response: str
    action_type: str  # 'voice', 'paper', 'content', 'command'
    action_data: Optional[dict] = None
    status: str = "completed"  # 'completed', 'failed', 'undone'


class AIConversationResponse(BaseModel):
    id: str
    user_input: str
    ai_response: str
    action_type: str
    action_data: Optional[dict] = None
    status: str
    created_at: str
    can_undo: bool = False


class UndoRequest(BaseModel):
    conversation_id: str
    reason: Optional[str] = None


class UndoResponse(BaseModel):
    success: bool
    message: str
    restored_data: Optional[dict] = None


# Helper to get current user (simplified)
async def get_current_user_from_token(authorization: str = None):
    # This would normally validate JWT token
    return {"id": "user123", "school_id": "school123", "role": "director"}


def get_db():
    """Get database instance from server module"""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import load_dotenv
    load_dotenv()
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    return client[os.environ['DB_NAME']]

db = None

def get_database():
    global db
    if db is None:
        db = get_db()
    return db


@router.post("/save")
async def save_ai_conversation(
    conversation: AIConversation,
    school_id: str,
    user_id: str
):
    """Save an AI conversation to history"""
    db = get_database()
    
    try:
        doc = {
            "school_id": school_id,
            "user_id": user_id,
            "user_input": conversation.user_input,
            "ai_response": conversation.ai_response,
            "action_type": conversation.action_type,
            "action_data": conversation.action_data,
            "status": conversation.status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "can_undo": conversation.action_type in ["command", "paper", "content"],
            "undo_data": None  # Will store data needed for undo
        }
        
        # Store undo data for certain actions
        if conversation.action_type == "command" and conversation.action_data:
            doc["undo_data"] = {
                "action": conversation.action_data.get("action"),
                "affected_ids": conversation.action_data.get("affected_ids", []),
                "original_state": conversation.action_data.get("original_state")
            }
        
        result = await db.ai_conversations.insert_one(doc)
        
        return {
            "success": True,
            "conversation_id": str(result.inserted_id),
            "message": "Conversation saved"
        }
        
    except Exception as e:
        logger.error(f"Failed to save AI conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list/{school_id}")
async def get_ai_history(
    school_id: str,
    limit: int = 50,
    action_type: Optional[str] = None
):
    """Get AI conversation history for a school"""
    db = get_database()
    
    try:
        query = {"school_id": school_id}
        if action_type:
            query["action_type"] = action_type
        
        cursor = db.ai_conversations.find(
            query,
            {"_id": 1, "user_input": 1, "ai_response": 1, "action_type": 1, 
             "status": 1, "created_at": 1, "can_undo": 1}
        ).sort("created_at", -1).limit(limit)
        
        conversations = []
        async for doc in cursor:
            conversations.append({
                "id": str(doc["_id"]),
                "user_input": doc.get("user_input", ""),
                "ai_response": doc.get("ai_response", ""),
                "action_type": doc.get("action_type", ""),
                "status": doc.get("status", "completed"),
                "created_at": doc.get("created_at", ""),
                "can_undo": doc.get("can_undo", False) and doc.get("status") == "completed"
            })
        
        return {
            "conversations": conversations,
            "total": len(conversations)
        }
        
    except Exception as e:
        logger.error(f"Failed to get AI history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/undo")
async def undo_ai_action(request: UndoRequest, school_id: str):
    """Undo an AI action if possible"""
    db = get_database()
    
    try:
        # Find the conversation
        conversation = await db.ai_conversations.find_one({
            "_id": ObjectId(request.conversation_id),
            "school_id": school_id
        })
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if not conversation.get("can_undo"):
            raise HTTPException(status_code=400, detail="This action cannot be undone")
        
        if conversation.get("status") == "undone":
            raise HTTPException(status_code=400, detail="This action was already undone")
        
        undo_data = conversation.get("undo_data", {})
        action = undo_data.get("action")
        restored_data = None
        
        # Perform undo based on action type
        if action == "create_all_classes":
            # Delete the classes that were created
            affected_ids = undo_data.get("affected_ids", [])
            if affected_ids:
                result = await db.classes.delete_many({
                    "_id": {"$in": [ObjectId(id) for id in affected_ids]},
                    "school_id": school_id
                })
                restored_data = {"deleted_classes": result.deleted_count}
        
        elif action == "add_student":
            affected_ids = undo_data.get("affected_ids", [])
            if affected_ids:
                result = await db.students.delete_many({
                    "_id": {"$in": [ObjectId(id) for id in affected_ids]},
                    "school_id": school_id
                })
                restored_data = {"deleted_students": result.deleted_count}
        
        elif conversation.get("action_type") == "paper":
            # Delete generated paper
            paper_id = undo_data.get("paper_id")
            if paper_id:
                await db.generated_papers.delete_one({"_id": ObjectId(paper_id)})
                restored_data = {"deleted_paper": paper_id}
        
        elif conversation.get("action_type") == "content":
            # Mark content as deleted
            content_id = undo_data.get("content_id")
            if content_id:
                await db.ai_content.update_one(
                    {"_id": ObjectId(content_id)},
                    {"$set": {"deleted": True}}
                )
                restored_data = {"deleted_content": content_id}
        
        # Mark conversation as undone
        await db.ai_conversations.update_one(
            {"_id": ObjectId(request.conversation_id)},
            {
                "$set": {
                    "status": "undone",
                    "undone_at": datetime.now(timezone.utc).isoformat(),
                    "undo_reason": request.reason
                }
            }
        )
        
        return UndoResponse(
            success=True,
            message="Action undone successfully",
            restored_data=restored_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to undo action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore/{conversation_id}")
async def restore_ai_action(conversation_id: str, school_id: str):
    """Restore a previously undone action"""
    db = get_database()
    
    try:
        conversation = await db.ai_conversations.find_one({
            "_id": ObjectId(conversation_id),
            "school_id": school_id,
            "status": "undone"
        })
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Undone conversation not found")
        
        undo_data = conversation.get("undo_data", {})
        action = undo_data.get("action")
        original_state = undo_data.get("original_state")
        
        # Restore based on action type
        if action == "create_all_classes" and original_state:
            # Re-create the classes
            for class_data in original_state:
                class_data.pop("_id", None)
                await db.classes.insert_one(class_data)
        
        # Mark as restored
        await db.ai_conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "status": "restored",
                    "restored_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Action restored successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to restore action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear/{school_id}")
async def clear_ai_history(school_id: str, days_old: int = 30):
    """Clear old AI conversation history"""
    db = get_database()
    
    try:
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days_old)).isoformat()
        
        result = await db.ai_conversations.delete_many({
            "school_id": school_id,
            "created_at": {"$lt": cutoff_date},
            "status": {"$ne": "completed"}  # Keep completed ones for reference
        })
        
        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "message": f"Cleared {result.deleted_count} old conversations"
        }
        
    except Exception as e:
        logger.error(f"Failed to clear history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{school_id}")
async def get_ai_usage_stats(school_id: str):
    """Get AI usage statistics"""
    db = get_database()
    
    try:
        # Count by action type
        pipeline = [
            {"$match": {"school_id": school_id}},
            {"$group": {
                "_id": "$action_type",
                "count": {"$sum": 1}
            }}
        ]
        
        type_counts = {}
        async for doc in db.ai_conversations.aggregate(pipeline):
            type_counts[doc["_id"]] = doc["count"]
        
        # Total count
        total = await db.ai_conversations.count_documents({"school_id": school_id})
        
        # Recent activity (last 7 days)
        from datetime import timedelta
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        recent = await db.ai_conversations.count_documents({
            "school_id": school_id,
            "created_at": {"$gte": week_ago}
        })
        
        return {
            "total_conversations": total,
            "by_type": type_counts,
            "last_7_days": recent,
            "most_used": max(type_counts, key=type_counts.get) if type_counts else None
        }
        
    except Exception as e:
        logger.error(f"Failed to get AI stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
