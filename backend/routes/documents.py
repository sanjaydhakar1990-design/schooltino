"""
Document Upload Routes
- Upload documents for students and employees
- Supports: Birth Certificate, Aadhar, TC, Caste Certificate, etc.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
import os
import uuid
from datetime import datetime
import shutil

router = APIRouter(prefix="/documents", tags=["documents"])

# Import from main server
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

UPLOAD_DIR = "/app/backend/uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    person_id: str = Form(...),
    person_type: str = Form(...),  # 'student' or 'employee'
    school_id: str = Form(...)
):
    """Upload a document for student or employee"""
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or PDF files allowed")
    
    # Validate file size (5MB max)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size should be less than 5MB")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{person_type}_{person_id}_{document_type}_{uuid.uuid4().hex[:8]}.{ext}"
    
    # Create subdirectory for school
    school_dir = os.path.join(UPLOAD_DIR, school_id)
    os.makedirs(school_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(school_dir, unique_filename)
    with open(file_path, 'wb') as f:
        f.write(contents)
    
    # Save to database
    from core.database import db
    
    doc_id = f"DOC-{uuid.uuid4().hex[:12].upper()}"
    file_url = f"/api/documents/file/{school_id}/{unique_filename}"
    
    document_data = {
        "id": doc_id,
        "person_id": person_id,
        "person_type": person_type,
        "school_id": school_id,
        "document_type": document_type,
        "file_name": file.filename,
        "file_path": file_path,
        "file_url": file_url,
        "file_size": len(contents),
        "content_type": file.content_type,
        "uploaded_at": datetime.utcnow().isoformat(),
        "is_verified": False
    }
    
    # Check if document of same type exists, update it
    existing = await db.documents.find_one({
        "person_id": person_id,
        "document_type": document_type
    })
    
    if existing:
        # Delete old file
        if os.path.exists(existing.get('file_path', '')):
            os.remove(existing['file_path'])
        # Update record
        await db.documents.update_one(
            {"id": existing['id']},
            {"$set": document_data}
        )
        document_data['id'] = existing['id']
    else:
        await db.documents.insert_one(document_data)
    
    return {
        "id": document_data['id'],
        "file_url": file_url,
        "message": "Document uploaded successfully"
    }


@router.get("/file/{school_id}/{filename}")
async def serve_document(school_id: str, filename: str):
    """Serve uploaded document file"""
    from fastapi.responses import FileResponse
    
    file_path = os.path.join(UPLOAD_DIR, school_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    content_type = "application/octet-stream"
    if filename.lower().endswith(('.jpg', '.jpeg')):
        content_type = "image/jpeg"
    elif filename.lower().endswith('.png'):
        content_type = "image/png"
    elif filename.lower().endswith('.pdf'):
        content_type = "application/pdf"
    
    return FileResponse(file_path, media_type=content_type)


@router.get("/list/{person_type}/{person_id}")
async def list_documents(person_type: str, person_id: str):
    """List all documents for a person"""
    from core.database import db
    
    documents = await db.documents.find(
        {"person_id": person_id, "person_type": person_type},
        {"_id": 0}
    ).to_list(100)
    
    return documents


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document"""
    from core.database import db
    
    doc = await db.documents.find_one({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    if os.path.exists(doc.get('file_path', '')):
        os.remove(doc['file_path'])
    
    # Delete from database
    await db.documents.delete_one({"id": doc_id})
    
    return {"message": "Document deleted"}


@router.post("/verify/{doc_id}")
async def verify_document(doc_id: str, verified: bool = True):
    """Mark document as verified"""
    from core.database import db
    
    result = await db.documents.update_one(
        {"id": doc_id},
        {"$set": {"is_verified": verified, "verified_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document verification updated"}
