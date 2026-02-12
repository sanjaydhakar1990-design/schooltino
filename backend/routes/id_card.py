# ./routes/id_card.py
"""
ID Card Generation System
- Auto-generate ID cards for students and staff
- Include photo, QR code, details
- Downloadable format
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import os
import sys
import base64

import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))

from core.database import db

router = APIRouter(prefix="/id-card", tags=["ID Card"])


# ==================== MODELS ====================

class IDCardData(BaseModel):
    person_id: str
    person_type: str  # student, teacher, staff, director
    school_id: Optional[str] = None
    include_photo: bool = True



# ==================== HELPER FUNCTIONS ====================

def get_role_color(role: str) -> str:
    """Get role-based color for ID card
    Higher Authority: Gold/Purple shades
    Admin Department: Green/Blue shades
    Support Staff: Gray shades
    """
    colors = {
        # Higher Authority - Gold/Purple/Red (Premium look)
        "director": "#b91c1c",       # Dark Red for Director (Top Authority)
        "co_director": "#9333ea",    # Violet for Co-Director
        "principal": "#dc2626",      # Red for Principal
        "vice_principal": "#ea580c", # Orange for Vice Principal
        
        # Admin Department - Green/Teal shades
        "admin": "#047857",          # Dark Green for Admin
        "accountant": "#059669",     # Green for Accountant
        "clerk": "#0891b2",          # Cyan for Clerk
        
        # Teaching Staff - Blue shades
        "teacher": "#1e40af",        # Blue for Teacher
        "librarian": "#4f46e5",      # Indigo for Librarian
        
        # Support Staff - Gray/Brown shades
        "peon": "#64748b",           # Slate for Peon
        "driver": "#ca8a04",         # Yellow for Driver
        "guard": "#374151",          # Gray for Guard
        "sweeper": "#64748b",        # Slate for Sweeper
        "helper": "#78716c",         # Stone for Helper
        "cook": "#a16207",           # Amber for Cook
    }
    return colors.get(role.lower() if role else "", "#1e40af")

def get_role_hindi(role: str) -> str:
    """Get Hindi translation of role"""
    hindi = {
        "director": "निदेशक",
        "co_director": "सह-निदेशक",
        "principal": "प्रधानाचार्य",
        "vice_principal": "उप-प्रधानाचार्य",
        "admin": "प्रशासक",
        "teacher": "शिक्षक",
        "accountant": "लेखाकार",
        "clerk": "लिपिक",
        "librarian": "पुस्तकालयाध्यक्ष",
        "peon": "चपरासी",
        "driver": "चालक",
        "guard": "सुरक्षा कर्मी",
        "sweeper": "सफाई कर्मचारी",
        "helper": "सहायक",
        "cook": "रसोइया",
    }
    return hindi.get(role.lower() if role else "", "")

def is_higher_authority(role: str) -> bool:
    """Check if role is higher authority for special styling"""
    higher_roles = ["director", "co_director", "principal", "vice_principal"]
    return role.lower() in higher_roles if role else False



# ==================== GENERATE ID CARD ====================

@router.post("/generate")
async def generate_id_card_post(data: IDCardData):
    """
    Generate ID card data for student/teacher/staff via POST
    Returns all data needed to render an ID card
    """
    return await generate_id_card(data.person_type, data.person_id, data.school_id)

@router.get("/generate/{person_type}/{person_id}")
async def generate_id_card(person_type: str, person_id: str, school_id: Optional[str] = None):
    """
    Generate ID card data for student/teacher/staff
    Returns all data needed to render an ID card
    """
    if person_type not in ["student", "teacher", "staff", "director", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid person type")
    
    # Get person details based on type
    person = None
    collection = None
    
    if person_type == "student":
        # Try students collection
        person = await db.students.find_one(
            {"$or": [{"id": person_id}, {"student_id": person_id}]},
            {"_id": 0}
        )
        collection = "students"
    else:
        # Try staff collection first
        person = await db.staff.find_one({"id": person_id}, {"_id": 0})
        if not person:
            # Try users collection
            person = await db.users.find_one({"id": person_id}, {"_id": 0})
            collection = "users"
        else:
            collection = "staff"
    
    if not person:
        raise HTTPException(status_code=404, detail=f"{person_type.title()} not found")
    
    # Get actual role from database for correct designation
    actual_role = person.get("designation") or person.get("role") or person_type
    
    # Get school info including board_type for Samgra ID requirement
    school = None
    board_type = None
    sid = school_id or person.get("school_id")
    if sid:
        school = await db.schools.find_one({"id": sid}, {"_id": 0, "name": 1, "address": 1, "phone": 1, "logo": 1, "logo_url": 1, "email": 1, "board_type": 1})
        board_type = school.get("board_type") if school else None
    
    # Check if Samgra ID is required (MP Board schools)
    requires_samgra_id = board_type and board_type.upper() in ["MPBSE", "MP BOARD", "MP"]
    
    # Get photo if available
    photo = None
    if person_type == "student":
        photo_record = await db.student_face_photos.find_one(
            {"student_id": person_id, "photo_type": "passport"},
            {"_id": 0, "photo_data": 1}
        )
        if photo_record:
            photo = photo_record.get("photo_data")
        elif person.get("photo"):
            photo = person.get("photo")
        elif person.get("photo_url"):
            photo = person.get("photo_url")
    else:
        # Staff photo
        photo_record = await db.staff_photos.find_one(
            {"staff_id": person_id, "photo_type": "passport"},
            {"_id": 0, "photo_data": 1}
        )
        if photo_record:
            photo = photo_record.get("photo_data")
        elif person.get("photo"):
            photo = person.get("photo")
        elif person.get("photo_url"):
            photo = person.get("photo_url")
    
    # Make relative photo URLs absolute so they work in ID cards and print popups
    if photo and not photo.startswith("data:") and not photo.startswith("http"):
        backend_url = os.environ.get("REPLIT_DEV_DOMAIN", "")
        if backend_url:
            photo = f"https://{backend_url}{photo}"
        else:
            photo = f"http://localhost:8000{photo}"
    
    # Build ID card data
    if person_type == "student":
        # Get class name from class_id
        class_display = person.get("class_name") or person.get("class_display")
        if not class_display and person.get("class_id"):
            # Fetch class name from database
            class_doc = await db.classes.find_one({"id": person.get("class_id")})
            if class_doc:
                class_display = class_doc.get("name", "")
        
        # Format class display (hide section A if only one section)
        section = person.get("section", "")
        class_with_section = class_display
        if section and section.upper() != "A":
            class_with_section = f"{class_display} - {section}"
        
        # Get parent phone - try multiple fields including mobile
        parent_phone = (
            person.get("parent_phone") or 
            person.get("father_phone") or 
            person.get("mother_phone") or 
            person.get("guardian_phone") or
            person.get("mobile") or  # Mobile is commonly used for parent contact
            person.get("phone")
        )
        
        id_card = {
            "card_type": "STUDENT ID CARD",
            "id_number": person.get("student_id") or person.get("admission_no") or person.get("id")[:8].upper() if person.get("id") else "",
            "name": person.get("name"),
            "class": class_with_section,
            "section": section if section.upper() != "A" else "",
            "roll_no": person.get("roll_no"),
            "dob": person.get("dob"),
            "blood_group": person.get("blood_group"),
            "father_name": person.get("father_name"),
            "mother_name": person.get("mother_name"),
            "parent_phone": parent_phone,  # Explicit parent phone field
            "phone": parent_phone,  # Also keep as phone for backward compatibility
            "emergency_contact": person.get("emergency_contact") or person.get("guardian_phone"),
            "address": person.get("address"),
            "admission_date": person.get("admission_date"),
            "valid_until": f"{datetime.now().year + 1}-03-31",
            # Samgra ID for MP Board schools only
            "samgra_id": person.get("samgra_id") if requires_samgra_id else None,
            "show_samgra_id": requires_samgra_id,
            "board_type": board_type
        }
    else:
        # Determine correct role/designation for ID card display
        display_role = actual_role.upper() if actual_role else person_type.upper()
        
        # Role-based card type for proper labeling
        role_map = {
            "director": "DIRECTOR",
            "principal": "PRINCIPAL", 
            "vice_principal": "VICE PRINCIPAL",
            "co_director": "CO-DIRECTOR",
            "teacher": "TEACHER",
            "accountant": "ACCOUNTANT",
            "clerk": "CLERK",
            "librarian": "LIBRARIAN",
            "peon": "SUPPORT STAFF",
            "driver": "TRANSPORT STAFF",
            "guard": "SECURITY",
            "sweeper": "SUPPORT STAFF",
            "helper": "SUPPORT STAFF",
            "cook": "SUPPORT STAFF",
            "admin": "ADMIN"
        }
        
        card_type_label = role_map.get(actual_role.lower(), display_role) if actual_role else display_role
        
        # Check if this is a higher authority role
        higher_authority = is_higher_authority(actual_role) if actual_role else False
        
        id_card = {
            "card_type": f"{card_type_label} ID CARD",
            "id_number": person.get("employee_id") or person.get("id"),
            "name": person.get("name"),
            "designation": person.get("designation") or actual_role.title() if actual_role else person_type.title(),
            "designation_hindi": get_role_hindi(actual_role) if actual_role else "",
            "department": person.get("department"),
            "dob": person.get("dob"),
            "blood_group": person.get("blood_group"),
            "phone": person.get("phone"),
            "emergency_contact": person.get("emergency_contact"),
            "address": person.get("address"),
            "joining_date": person.get("joining_date") or person.get("created_at"),
            "valid_until": f"{datetime.now().year + 1}-03-31",
            "role_color": get_role_color(actual_role) if actual_role else "#1e40af",
            "is_higher_authority": higher_authority  # For special styling (gold border, etc)
        }
    
    # Generate QR code data (for verification)
    qr_data = f"SCHOOLTINO|{person_type.upper()}|{id_card['id_number']}|{id_card['name']}"
    
    return {
        "success": True,
        "id_card": id_card,
        "photo": photo,
        "has_photo": photo is not None,
        "school": {
            "name": school.get("name") if school else "School Name",
            "address": school.get("address") if school else "",
            "phone": school.get("phone") if school else "",
            "logo_url": school.get("logo_url") or school.get("logo") if school else None,
            "email": school.get("email") if school else ""
        },
        "qr_data": qr_data,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/text/{person_type}/{person_id}")
async def get_id_card_text(person_type: str, person_id: str):
    """
    Get ID card as downloadable text format
    """
    card_data = await generate_id_card(person_type, person_id)
    
    if not card_data.get("success"):
        raise HTTPException(status_code=404, detail="Card generation failed")
    
    id_card = card_data["id_card"]
    school = card_data["school"]
    
    # Build text format
    card_text = f"""
╔══════════════════════════════════════════════════════════════════╗
║                        {school['name'].upper()[:50].center(50)}                        ║
║                        {school['address'][:50].center(50)}                        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║                    {id_card['card_type'].center(40)}                    ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   ID NUMBER:   {str(id_card['id_number'])[:25].ljust(25)}                        ║
║   NAME:        {str(id_card['name'])[:25].ljust(25)}                        ║
"""
    
    if person_type == "student":
        card_text += f"""║   CLASS:       {str(id_card.get('class', 'N/A'))[:25].ljust(25)}                        ║
║   ROLL NO:     {str(id_card.get('roll_no', 'N/A'))[:25].ljust(25)}                        ║
║   FATHER:      {str(id_card.get('father_name', 'N/A'))[:25].ljust(25)}                        ║
║   PHONE:       {str(id_card.get('phone', 'N/A'))[:25].ljust(25)}                        ║
"""
    else:
        card_text += f"""║   DESIGNATION: {str(id_card.get('designation', 'N/A'))[:25].ljust(25)}                        ║
║   PHONE:       {str(id_card.get('phone', 'N/A'))[:25].ljust(25)}                        ║
║   EMAIL:       {str(id_card.get('email', 'N/A'))[:25].ljust(25)}                        ║
"""
    
    card_text += f"""║                                                                  ║
║   BLOOD GROUP: {str(id_card.get('blood_group', 'N/A'))[:10].ljust(10)}                                     ║
║   VALID UNTIL: {str(id_card.get('valid_until', 'N/A'))[:15].ljust(15)}                                ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║           QR CODE: {card_data['qr_data'][:40].ljust(40)}          ║
╚══════════════════════════════════════════════════════════════════╝

                    IF FOUND, PLEASE RETURN TO SCHOOL
"""
    
    return {
        "success": True,
        "card_text": card_text,
        "filename": f"ID_Card_{id_card['id_number']}.txt"
    }


# ==================== BULK ID CARDS ====================

@router.post("/bulk-generate")
async def bulk_generate_id_cards(school_id: str, person_type: str, person_ids: List[str]):
    """
    Generate ID cards for multiple persons at once
    """
    cards = []
    errors = []
    
    for person_id in person_ids[:50]:  # Limit to 50
        try:
            card = await generate_id_card(person_type, person_id, school_id)
            if card.get("success"):
                cards.append({
                    "id": person_id,
                    "name": card["id_card"]["name"],
                    "card": card
                })
        except Exception as e:
            errors.append(f"{person_id}: {str(e)}")
    
    return {
        "success": True,
        "generated": len(cards),
        "errors": errors[:10],
        "cards": cards
    }


# ==================== STAFF PHOTO UPLOAD ====================

class StaffPhotoUpload(BaseModel):
    staff_id: str
    school_id: str
    photo_base64: str
    photo_type: str = "passport"  # passport, front, etc.

@router.post("/staff-photo")
async def upload_staff_photo(data: StaffPhotoUpload):
    """
    Upload photo for teacher/staff
    For face recognition and ID card
    """
    # Check if staff exists
    staff = await db.staff.find_one({"id": data.staff_id}, {"_id": 0, "name": 1})
    if not staff:
        staff = await db.users.find_one({"id": data.staff_id}, {"_id": 0, "name": 1})
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    photo_id = str(uuid.uuid4())
    
    photo_record = {
        "id": photo_id,
        "staff_id": data.staff_id,
        "school_id": data.school_id,
        "photo_type": data.photo_type,
        "photo_data": data.photo_base64,
        "staff_name": staff.get("name"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - replace if exists
    await db.staff_photos.update_one(
        {"staff_id": data.staff_id, "photo_type": data.photo_type},
        {"$set": photo_record},
        upsert=True
    )
    
    # Update staff record
    await db.staff.update_one(
        {"id": data.staff_id},
        {"$set": {
            "has_photo": True,
            "photo_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.users.update_one(
        {"id": data.staff_id},
        {"$set": {
            "has_photo": True,
            "photo_updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"Photo uploaded for {staff.get('name')}",
        "photo_id": photo_id
    }


@router.get("/staff-photos/{staff_id}")
async def get_staff_photos(staff_id: str):
    """Get all photos for a staff member"""
    photos = await db.staff_photos.find(
        {"staff_id": staff_id},
        {"_id": 0, "photo_data": 0}  # Exclude large photo data in list
    ).to_list(10)
    
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0, "name": 1})
    if not staff:
        staff = await db.users.find_one({"id": staff_id}, {"_id": 0, "name": 1})
    
    return {
        "staff_id": staff_id,
        "staff_name": staff.get("name") if staff else None,
        "total_photos": len(photos),
        "photos": photos
    }


@router.get("/staff-photo/{staff_id}/{photo_type}")
async def get_staff_photo(staff_id: str, photo_type: str = "passport"):
    """Get specific photo for a staff member"""
    photo = await db.staff_photos.find_one(
        {"staff_id": staff_id, "photo_type": photo_type},
        {"_id": 0}
    )
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {
        "success": True,
        "photo": photo
    }
