from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
from core.database import db
from core.auth import get_current_user
import uuid
import os
import aiofiles
from pathlib import Path
from fastapi import Depends

router = APIRouter(prefix="/school-feed", tags=["School Feed"])

UPLOAD_DIR = Path("./uploads/feed")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/{school_id}")
async def get_feed_posts(school_id: str):
    posts = await db.school_feed.find(
        {"school_id": school_id, "is_deleted": {"$ne": True}}
    ).sort("created_at", -1).to_list(100)

    for post in posts:
        post.pop("_id", None)

    return {"posts": posts}


@router.post("")
async def create_post(data: dict, current_user: dict = Depends(get_current_user)):
    school_id = data.get("school_id")
    content = data.get("content", "")
    post_type = data.get("type", "activity")
    photo_url = data.get("photo_url")

    if not school_id:
        raise HTTPException(status_code=400, detail="school_id is required")
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content is required")

    post_id = f"POST-{uuid.uuid4().hex[:12]}"

    post = {
        "id": post_id,
        "school_id": school_id,
        "author_id": current_user.get("id", ""),
        "author_name": current_user.get("name", "Unknown"),
        "author_role": current_user.get("role", "teacher"),
        "author_avatar": current_user.get("name", "U")[0].upper(),
        "content": content.strip(),
        "type": post_type,
        "photo_url": photo_url,
        "likes": [],
        "likes_count": 0,
        "comments": [],
        "comments_count": 0,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.school_feed.insert_one(post)
    post.pop("_id", None)

    return {"success": True, "post": post}


@router.post("/upload")
async def upload_feed_photo(
    file: UploadFile = File(...),
    school_id: str = Form("")
):
    allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, GIF, WEBP) are allowed")

    ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    filename = f"feed_{uuid.uuid4().hex[:12]}{ext}"
    filepath = UPLOAD_DIR / filename

    content = await file.read()
    async with aiofiles.open(str(filepath), "wb") as f:
        await f.write(content)

    photo_url = f"/uploads/feed/{filename}"

    return {"success": True, "photo_url": photo_url}


@router.post("/{post_id}/like")
async def toggle_like(post_id: str, data: dict = {}):
    user_id = data.get("user_id", "anonymous")

    post = await db.school_feed.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    likes = post.get("likes", [])

    if user_id in likes:
        likes.remove(user_id)
    else:
        likes.append(user_id)

    await db.school_feed.update_one(
        {"id": post_id},
        {"$set": {"likes": likes, "likes_count": len(likes)}}
    )

    return {"success": True, "liked": user_id in likes, "likes_count": len(likes)}


@router.post("/{post_id}/comment")
async def add_comment(post_id: str, data: dict):
    comment_text = data.get("text", "").strip()
    user_id = data.get("user_id", "anonymous")
    user_name = data.get("user_name", "Anonymous")

    if not comment_text:
        raise HTTPException(status_code=400, detail="Comment text is required")

    post = await db.school_feed.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = {
        "id": f"CMT-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "user_name": user_name,
        "text": comment_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.school_feed.update_one(
        {"id": post_id},
        {
            "$push": {"comments": comment},
            "$inc": {"comments_count": 1}
        }
    )

    return {"success": True, "comment": comment}


@router.delete("/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.school_feed.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user_role = current_user.get("role", "")
    admin_roles = ["director", "principal", "vice_principal", "admin", "super_admin"]

    if current_user.get("id") != post.get("author_id") and user_role not in admin_roles:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    await db.school_feed.update_one(
        {"id": post_id},
        {"$set": {"is_deleted": True}}
    )

    return {"success": True, "message": "Post deleted"}
