# ./routes/school_auto_setup.py
"""
AI-Powered School Auto Setup
- Extract school details from website URL
- Auto-configure school settings
- API key generation for third-party integration
- One-click setup for new schools
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import uuid
import os
import sys
import json
import httpx
import re
import secrets

import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# OpenAI for website analysis
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

router = APIRouter(prefix="/school-setup", tags=["School Auto Setup"])


# ==================== MODELS ====================

class WebsiteExtractRequest(BaseModel):
    website_url: str
    school_id: Optional[str] = None

class SchoolDetailsUpdate(BaseModel):
    school_id: str
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    principal_name: Optional[str] = None
    established_year: Optional[int] = None
    board: Optional[str] = None  # CBSE, ICSE, State Board
    school_type: Optional[str] = None  # Public, Private, Government
    logo_url: Optional[str] = None
    website: Optional[str] = None
    affiliation_number: Optional[str] = None
    fee_structure: Optional[Dict] = None

class APIKeyRequest(BaseModel):
    school_id: str
    key_name: str = "Default API Key"
    permissions: List[str] = ["read", "write"]  # read, write, admin


# ==================== WEBSITE SCRAPING HELPER ====================

async def scrape_website_content(url: str) -> str:
    """
    Scrape website content for analysis
    """
    try:
        # Ensure URL has protocol
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                return f"Error: Could not fetch website (Status: {response.status_code})"
            
            # Get text content (limit size)
            content = response.text[:50000]  # First 50KB
            
            # Basic HTML cleaning - remove scripts, styles
            content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r'<[^>]+>', ' ', content)  # Remove HTML tags
            content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
            
            return content.strip()[:15000]  # Limit to 15KB for AI
            
    except Exception as e:
        return f"Error scraping website: {str(e)}"


# ==================== AI EXTRACTION ====================

async def extract_school_details_with_ai(website_content: str, website_url: str) -> Dict:
    """
    Use OpenAI to extract school details from website content
    """
    if not OPENAI_API_KEY:
        return {
            "success": False,
            "error": "AI extraction not available",
            "manual_required": True
        }
    
    try:
        prompt = f"""Analyze this school website content and extract school details.
Website URL: {website_url}

Content:
{website_content}

Extract the following information in JSON format:
{{
    "school_name": "Full official school name",
    "tagline": "School motto or tagline if found",
    "address": "Complete address",
    "city": "City name",
    "state": "State name",
    "pincode": "PIN code if found",
    "phone": "Primary phone number(s)",
    "email": "Official email address",
    "principal_name": "Principal/Director name",
    "established_year": year as number or null,
    "board": "CBSE/ICSE/State Board name",
    "school_type": "Private/Public/Government/Aided",
    "affiliation_number": "Board affiliation number if found",
    "facilities": ["list of facilities mentioned"],
    "classes_offered": "e.g., Nursery to 12th",
    "medium": "English/Hindi/Both",
    "fee_indication": "Low/Medium/High/Premium based on context",
    "social_media": {{"facebook": "", "instagram": "", "twitter": "", "youtube": ""}},
    "awards_recognition": ["any awards or recognitions mentioned"],
    "confidence_score": 0-100 (how confident you are in extracted data)
}}

If information is not found, use null or empty string.
Respond ONLY with valid JSON, no other text."""

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "You are a data extraction expert. Extract school information accurately from website content. Respond only in valid JSON format."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1500,
                    "temperature": 0.3
                }
            )
            
            if response.status_code != 200:
                return {"success": False, "error": f"AI API error: {response.status_code}"}
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            extracted = json.loads(content)
            extracted["success"] = True
            extracted["source_url"] = website_url
            return extracted
            
    except json.JSONDecodeError:
        return {"success": False, "error": "AI response parsing failed", "manual_required": True}
    except Exception as e:
        return {"success": False, "error": str(e), "manual_required": True}


# ==================== ENDPOINTS ====================

@router.post("/extract-from-website")
async def extract_school_from_website(data: WebsiteExtractRequest):
    """
    AI extracts school details from website URL
    One-click school setup - just provide website URL
    """
    # Scrape website
    website_content = await scrape_website_content(data.website_url)
    
    if website_content.startswith("Error"):
        raise HTTPException(status_code=400, detail=website_content)
    
    # Extract with AI
    extracted = await extract_school_details_with_ai(website_content, data.website_url)
    
    if not extracted.get("success"):
        return {
            "success": False,
            "message": "AI extraction failed. Manual entry required.",
            "error": extracted.get("error"),
            "partial_data": extracted
        }
    
    # Save draft if school_id provided
    if data.school_id:
        await db.school_setup_drafts.update_one(
            {"school_id": data.school_id},
            {"$set": {
                "extracted_data": extracted,
                "website_url": data.website_url,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "status": "pending_review"
            }},
            upsert=True
        )
    
    return {
        "success": True,
        "message": "School details extracted successfully! Review and confirm.",
        "extracted_data": extracted,
        "editable": True,
        "next_step": "Review extracted data and confirm or edit"
    }


@router.post("/confirm-setup")
async def confirm_school_setup(data: SchoolDetailsUpdate):
    """
    Confirm and save school details after review/edit
    """
    school = await db.schools.find_one({"id": data.school_id})
    
    update_data = {k: v for k, v in data.dict().items() if v is not None and k != "school_id"}
    update_data["setup_completed"] = True
    update_data["setup_method"] = "ai_extract"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if school:
        # Update existing
        await db.schools.update_one(
            {"id": data.school_id},
            {"$set": update_data}
        )
    else:
        # Create new school
        update_data["id"] = data.school_id or str(uuid.uuid4())
        update_data["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.schools.insert_one(update_data)
    
    # Clear draft
    await db.school_setup_drafts.delete_one({"school_id": data.school_id})
    
    return {
        "success": True,
        "message": "School setup complete!",
        "school_id": data.school_id
    }


# ==================== API KEY MANAGEMENT ====================

@router.post("/generate-api-key")
async def generate_api_key(data: APIKeyRequest):
    """
    Generate API key for school integration
    This key can be used by third-party software to integrate with Schooltino
    """
    # Verify school exists
    school = await db.schools.find_one({"id": data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Generate secure API key
    api_key = f"sk_schooltino_{secrets.token_hex(24)}"
    api_secret = secrets.token_hex(32)
    
    key_record = {
        "id": str(uuid.uuid4()),
        "school_id": data.school_id,
        "key_name": data.key_name,
        "api_key": api_key,
        "api_secret_hash": api_secret[:8] + "..." + api_secret[-4:],  # Partial for display
        "api_secret_full": api_secret,  # Store encrypted in production
        "permissions": data.permissions,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_used": None,
        "usage_count": 0
    }
    
    await db.school_api_keys.insert_one(key_record)
    
    return {
        "success": True,
        "message": "API Key generated! Save the secret key securely.",
        "api_key": api_key,
        "api_secret": api_secret,
        "key_name": data.key_name,
        "permissions": data.permissions,
        "important": "Secret key will not be shown again! Save it now.",
        "integration_docs": {
            "base_url": "https://api.schooltino.com/v1",
            "auth_header": "Authorization: Bearer {api_key}:{api_secret}",
            "endpoints": {
                "students": "/students",
                "attendance": "/attendance",
                "fees": "/fees",
                "results": "/results"
            }
        }
    }


@router.get("/api-keys/{school_id}")
async def list_api_keys(school_id: str):
    """
    List all API keys for a school
    """
    keys = await db.school_api_keys.find(
        {"school_id": school_id, "is_active": True},
        {"_id": 0, "api_secret_full": 0}  # Don't expose full secret
    ).to_list(50)
    
    return {
        "school_id": school_id,
        "keys": keys,
        "total": len(keys)
    }


@router.delete("/api-key/{key_id}")
async def revoke_api_key(key_id: str):
    """
    Revoke/deactivate an API key
    """
    result = await db.school_api_keys.update_one(
        {"id": key_id},
        {"$set": {
            "is_active": False,
            "revoked_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {
        "success": True,
        "message": "API key revoked successfully"
    }


# ==================== QUICK SETUP WIZARD ====================

@router.get("/wizard/status/{school_id}")
async def get_setup_wizard_status(school_id: str):
    """
    Get setup wizard progress for a school
    """
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    
    # Calculate completion
    required_fields = ["name", "address", "phone", "board", "principal_name"]
    completed = sum(1 for f in required_fields if school and school.get(f))
    
    # Check other setup steps
    classes_created = await db.classes.count_documents({"school_id": school_id})
    staff_added = await db.users.count_documents({"school_id": school_id})
    students_added = await db.students.count_documents({"school_id": school_id})
    fee_structure_set = await db.fee_structures.count_documents({"school_id": school_id}) > 0
    
    steps = [
        {"step": "basic_info", "title": "School Details", "completed": completed >= 3, "progress": f"{completed}/{len(required_fields)}"},
        {"step": "classes", "title": "Create Classes", "completed": classes_created > 0, "count": classes_created},
        {"step": "staff", "title": "Add Staff", "completed": staff_added > 0, "count": staff_added},
        {"step": "students", "title": "Add Students", "completed": students_added > 0, "count": students_added},
        {"step": "fees", "title": "Fee Structure", "completed": fee_structure_set, "status": "Set" if fee_structure_set else "Pending"},
    ]
    
    total_steps = len(steps)
    completed_steps = sum(1 for s in steps if s["completed"])
    
    return {
        "school_id": school_id,
        "overall_progress": f"{completed_steps}/{total_steps}",
        "percentage": round((completed_steps / total_steps) * 100),
        "steps": steps,
        "setup_complete": completed_steps == total_steps,
        "next_step": next((s for s in steps if not s["completed"]), None)
    }


@router.post("/wizard/quick-setup")
async def quick_setup_wizard(
    school_name: str,
    director_name: str,
    director_email: str,
    director_phone: str,
    website_url: Optional[str] = None,
    board: str = "CBSE"
):
    """
    One-click quick setup - Creates school with director account
    Optionally extracts details from website
    """
    school_id = f"SCH-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    # If website provided, extract details
    extracted_data = {}
    if website_url:
        website_content = await scrape_website_content(website_url)
        if not website_content.startswith("Error"):
            extracted_data = await extract_school_details_with_ai(website_content, website_url)
    
    # Create school
    school_data = {
        "id": school_id,
        "name": extracted_data.get("school_name") or school_name,
        "address": extracted_data.get("address", ""),
        "city": extracted_data.get("city", ""),
        "state": extracted_data.get("state", ""),
        "phone": director_phone,
        "email": director_email,
        "principal_name": extracted_data.get("principal_name") or director_name,
        "board": extracted_data.get("board") or board,
        "website": website_url,
        "established_year": extracted_data.get("established_year"),
        "setup_method": "quick_wizard",
        "setup_completed": False,
        "ai_extracted_data": extracted_data if extracted_data.get("success") else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.schools.insert_one(school_data)
    
    # Create director account
    import bcrypt
    temp_password = ''.join(secrets.choice('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(10))
    hashed_pw = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()
    
    director_data = {
        "id": str(uuid.uuid4()),
        "name": director_name,
        "email": director_email.lower(),
        "mobile": director_phone,
        "password": hashed_pw,
        "role": "director",
        "school_id": school_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(director_data)
    
    return {
        "success": True,
        "message": "School created! Ab setup complete karein.",
        "school_id": school_id,
        "school_name": school_data["name"],
        "director_credentials": {
            "email": director_email,
            "temp_password": temp_password,
            "note": "Password change kar lein login ke baad"
        },
        "ai_extracted": bool(extracted_data.get("success")),
        "next_steps": [
            "1. Login karein director credentials se",
            "2. School details verify/edit karein",
            "3. Classes create karein",
            "4. Staff add karein",
            "5. Students import karein"
        ]
    }



# ==================== SETUP PROGRESS TRACKING ====================

class SetupProgressRequest(BaseModel):
    school_id: str
    step: str  # cctv, speaker, website, dataImport
    status: str  # completed, skipped, in_progress
    config: Optional[Dict] = {}

@router.post("/progress")
async def save_setup_progress(data: SetupProgressRequest):
    """
    Save setup progress for each step
    Allows resume from Profile page
    """
    await db.setup_progress.update_one(
        {"school_id": data.school_id, "step": data.step},
        {"$set": {
            "status": data.status,
            "config": data.config,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Update overall progress
    all_steps = await db.setup_progress.find({"school_id": data.school_id}, {"_id": 0}).to_list(10)
    completed = sum(1 for s in all_steps if s.get("status") == "completed")
    total_steps = 4  # cctv, speaker, website, dataImport
    
    await db.schools.update_one(
        {"id": data.school_id},
        {"$set": {
            "setup_progress": {
                "completed_steps": completed,
                "total_steps": total_steps,
                "percentage": round((completed / total_steps) * 100),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        }}
    )
    
    return {
        "success": True,
        "step": data.step,
        "status": data.status,
        "progress": f"{completed}/{total_steps}"
    }


@router.get("/progress/{school_id}")
async def get_setup_progress(school_id: str):
    """
    Get setup progress for resume functionality
    """
    progress = await db.setup_progress.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(10)
    
    steps_map = {p["step"]: p for p in progress}
    
    return {
        "school_id": school_id,
        "steps": {
            "cctv": steps_map.get("cctv", {"status": "pending"}),
            "speaker": steps_map.get("speaker", {"status": "pending"}),
            "website": steps_map.get("website", {"status": "pending"}),
            "dataImport": steps_map.get("dataImport", {"status": "pending"})
        },
        "can_resume": any(p.get("status") == "skipped" for p in progress),
        "all_complete": all(steps_map.get(s, {}).get("status") in ["completed", "skipped"] 
                          for s in ["cctv", "speaker", "website", "dataImport"])
    }
