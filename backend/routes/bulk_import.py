"""
Bulk Import Routes - Import Students and Employees from CSV/Excel
AI-powered data parsing and validation
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, List
import os
import uuid
import csv
import io
from datetime import datetime
import json

router = APIRouter(prefix="/api/bulk-import", tags=["bulk-import"])

# Sample templates
STUDENT_TEMPLATE_HEADERS = [
    "name", "class_name", "section", "gender", "dob", "father_name", "mother_name",
    "mobile", "address", "aadhar_no", "caste", "religion", "category",
    "previous_school", "blood_group", "admission_date"
]

EMPLOYEE_TEMPLATE_HEADERS = [
    "name", "designation", "mobile", "email", "address", "qualification",
    "joining_date", "salary", "aadhar_no", "pan_number", "department",
    "blood_group", "emergency_contact"
]


@router.get("/template/{import_type}")
async def get_import_template(import_type: str):
    """Get CSV template for import"""
    if import_type == "student":
        headers = STUDENT_TEMPLATE_HEADERS
        sample_data = [
            "Rahul Kumar", "Class 5", "A", "male", "2015-05-10", "Rajesh Kumar", "Sunita Devi",
            "9876543210", "123 Main Street, City", "123456789012", "General", "Hindu", "APL",
            "Previous School Name", "B+", "2024-04-01"
        ]
    elif import_type == "employee":
        headers = EMPLOYEE_TEMPLATE_HEADERS
        sample_data = [
            "Priya Sharma", "Teacher", "9876543210", "priya@school.com", "456 Street, City",
            "M.A., B.Ed.", "2024-01-15", "35000", "123456789012", "ABCDE1234F", "Science",
            "O+", "9876543211"
        ]
    else:
        raise HTTPException(status_code=400, detail="Invalid import type. Use 'student' or 'employee'")
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample_data)
    
    return {
        "headers": headers,
        "sample_csv": output.getvalue(),
        "instructions": {
            "hi": "इस template को download करें और अपना data भरें। फिर upload करें।",
            "en": "Download this template, fill your data, and upload."
        }
    }


@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    import_type: str = Form(...),
    school_id: str = Form(...)
):
    """Preview data before importing - shows parsed data with validation"""
    
    # Read file
    contents = await file.read()
    
    # Detect file type and parse
    if file.filename.endswith('.csv'):
        data = parse_csv(contents.decode('utf-8'))
    elif file.filename.endswith(('.xlsx', '.xls')):
        data = parse_excel(contents)
    else:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    if not data:
        raise HTTPException(status_code=400, detail="No data found in file")
    
    # Validate and preview
    validated_data = []
    errors = []
    
    for idx, row in enumerate(data):
        validation = validate_row(row, import_type, idx + 2)  # +2 for header row and 0-index
        validated_data.append({
            "row_number": idx + 2,
            "data": row,
            "is_valid": validation["is_valid"],
            "errors": validation["errors"],
            "warnings": validation.get("warnings", [])
        })
        if not validation["is_valid"]:
            errors.extend(validation["errors"])
    
    return {
        "total_rows": len(data),
        "valid_rows": sum(1 for d in validated_data if d["is_valid"]),
        "invalid_rows": sum(1 for d in validated_data if not d["is_valid"]),
        "preview_data": validated_data[:10],  # Show first 10 rows
        "all_errors": errors[:20],  # Show first 20 errors
        "headers_found": list(data[0].keys()) if data else [],
        "expected_headers": STUDENT_TEMPLATE_HEADERS if import_type == "student" else EMPLOYEE_TEMPLATE_HEADERS
    }


@router.post("/execute")
async def execute_import(
    file: UploadFile = File(...),
    import_type: str = Form(...),
    school_id: str = Form(...),
    skip_invalid: bool = Form(True)
):
    """Execute the actual import"""
    from core.database import db
    
    # Read and parse file
    contents = await file.read()
    
    if file.filename.endswith('.csv'):
        data = parse_csv(contents.decode('utf-8'))
    elif file.filename.endswith(('.xlsx', '.xls')):
        data = parse_excel(contents)
    else:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    if not data:
        raise HTTPException(status_code=400, detail="No data found in file")
    
    # Process each row
    success_count = 0
    error_count = 0
    errors = []
    created_ids = []
    
    # Get classes for mapping
    classes = {}
    if import_type == "student":
        class_docs = await db.classes.find({"school_id": school_id}, {"_id": 0}).to_list(100)
        for cls in class_docs:
            key = f"{cls.get('name', '')}_{cls.get('section', 'A')}".lower()
            classes[key] = cls.get('id')
            # Also map without section
            classes[cls.get('name', '').lower()] = cls.get('id')
    
    for idx, row in enumerate(data):
        try:
            validation = validate_row(row, import_type, idx + 2)
            if not validation["is_valid"] and not skip_invalid:
                error_count += 1
                errors.append({"row": idx + 2, "errors": validation["errors"]})
                continue
            
            if import_type == "student":
                record = await create_student_from_row(row, school_id, classes, db)
            else:
                record = await create_employee_from_row(row, school_id, db)
            
            if record:
                success_count += 1
                created_ids.append(record.get('id'))
            else:
                error_count += 1
                
        except Exception as e:
            error_count += 1
            errors.append({"row": idx + 2, "error": str(e)})
    
    return {
        "success": True,
        "total_processed": len(data),
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:20],
        "created_ids": created_ids[:10],
        "message": f"{success_count} {import_type}s imported successfully!"
    }


def parse_csv(content: str) -> List[dict]:
    """Parse CSV content into list of dicts"""
    reader = csv.DictReader(io.StringIO(content))
    return list(reader)


def parse_excel(content: bytes) -> List[dict]:
    """Parse Excel content into list of dicts"""
    try:
        import openpyxl
        from io import BytesIO
        
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True)
        sheet = wb.active
        
        headers = [cell.value for cell in sheet[1] if cell.value]
        data = []
        
        for row in sheet.iter_rows(min_row=2):
            row_data = {}
            for idx, cell in enumerate(row):
                if idx < len(headers):
                    row_data[headers[idx]] = cell.value
            if any(row_data.values()):  # Skip empty rows
                data.append(row_data)
        
        return data
    except ImportError:
        # Fallback: treat as CSV
        return parse_csv(content.decode('utf-8', errors='ignore'))


def validate_row(row: dict, import_type: str, row_number: int) -> dict:
    """Validate a single row of data"""
    errors = []
    warnings = []
    
    if import_type == "student":
        # Required fields
        if not row.get('name'):
            errors.append(f"Row {row_number}: Name is required")
        if not row.get('father_name'):
            errors.append(f"Row {row_number}: Father name is required")
        if not row.get('mobile'):
            errors.append(f"Row {row_number}: Mobile is required")
        
        # Validate mobile format
        mobile = str(row.get('mobile', '')).strip()
        if mobile and len(mobile) != 10:
            warnings.append(f"Row {row_number}: Mobile should be 10 digits")
        
        # Validate gender
        gender = str(row.get('gender', '')).lower().strip()
        if gender and gender not in ['male', 'female', 'other', 'm', 'f']:
            warnings.append(f"Row {row_number}: Gender should be male/female/other")
    
    else:  # employee
        if not row.get('name'):
            errors.append(f"Row {row_number}: Name is required")
        if not row.get('mobile'):
            errors.append(f"Row {row_number}: Mobile is required")
        if not row.get('email'):
            warnings.append(f"Row {row_number}: Email is recommended")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }


async def create_student_from_row(row: dict, school_id: str, classes: dict, db) -> dict:
    """Create a student record from CSV row"""
    
    # Find class ID
    class_name = str(row.get('class_name', '')).strip()
    section = str(row.get('section', 'A')).strip() or 'A'
    class_key = f"{class_name}_{section}".lower()
    class_id = classes.get(class_key) or classes.get(class_name.lower())
    
    if not class_id:
        # Create class if doesn't exist
        class_id = f"CLS-{uuid.uuid4().hex[:8].upper()}"
        await db.classes.insert_one({
            "id": class_id,
            "name": class_name,
            "section": section,
            "school_id": school_id,
            "created_at": datetime.utcnow().isoformat()
        })
        classes[class_key] = class_id
    
    # Generate student ID
    year = datetime.now().year
    count = await db.students.count_documents({"student_id": {"$regex": f"^STU-{year}-"}})
    student_id = f"STU-{year}-{str(count + 1).zfill(5)}"
    
    # Normalize gender
    gender = str(row.get('gender', 'male')).lower().strip()
    if gender in ['m', 'male']:
        gender = 'male'
    elif gender in ['f', 'female']:
        gender = 'female'
    else:
        gender = 'other'
    
    student_data = {
        "id": f"STD-{uuid.uuid4().hex[:12].upper()}",
        "student_id": student_id,
        "admission_no": student_id,
        "name": str(row.get('name', '')).strip(),
        "class_id": class_id,
        "class_name": class_name,
        "section": section,
        "gender": gender,
        "dob": str(row.get('dob', '')).strip(),
        "father_name": str(row.get('father_name', '')).strip(),
        "mother_name": str(row.get('mother_name', '')).strip(),
        "mobile": str(row.get('mobile', '')).strip(),
        "address": str(row.get('address', '')).strip(),
        "aadhar_no": str(row.get('aadhar_no', '')).strip(),
        "caste": str(row.get('caste', '')).strip(),
        "religion": str(row.get('religion', '')).strip(),
        "category": str(row.get('category', '')).strip(),
        "previous_school": str(row.get('previous_school', '')).strip(),
        "blood_group": str(row.get('blood_group', '')).strip(),
        "admission_date": str(row.get('admission_date', datetime.now().strftime('%Y-%m-%d'))).strip(),
        "school_id": school_id,
        "status": "active",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "import_source": "bulk_import"
    }
    
    await db.students.insert_one(student_data)
    
    # Update class count
    await db.classes.update_one({"id": class_id}, {"$inc": {"student_count": 1}})
    
    return student_data


async def create_employee_from_row(row: dict, school_id: str, db) -> dict:
    """Create an employee record from CSV row"""
    
    employee_id = f"EMP-{uuid.uuid4().hex[:8].upper()}"
    
    employee_data = {
        "id": employee_id,
        "name": str(row.get('name', '')).strip(),
        "designation": str(row.get('designation', 'teacher')).strip().lower(),
        "mobile": str(row.get('mobile', '')).strip(),
        "email": str(row.get('email', '')).strip(),
        "address": str(row.get('address', '')).strip(),
        "qualification": str(row.get('qualification', '')).strip(),
        "joining_date": str(row.get('joining_date', datetime.now().strftime('%Y-%m-%d'))).strip(),
        "salary": float(row.get('salary', 0)) if row.get('salary') else None,
        "aadhar_no": str(row.get('aadhar_no', '')).strip(),
        "pan_number": str(row.get('pan_number', '')).strip(),
        "department": str(row.get('department', '')).strip(),
        "blood_group": str(row.get('blood_group', '')).strip(),
        "emergency_contact": str(row.get('emergency_contact', '')).strip(),
        "school_id": school_id,
        "is_active": True,
        "has_login": False,
        "role": "teacher",
        "created_at": datetime.utcnow().isoformat(),
        "import_source": "bulk_import"
    }
    
    await db.staff.insert_one(employee_data)
    return employee_data
