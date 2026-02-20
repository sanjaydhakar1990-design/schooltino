# TeachTino Subjects Not Showing - FIX

## Problem:
"My Subjects: 0" dikha raha hai dashboard pe

## Root Causes:

### 1. Teacher ko subjects allocate nahi kiye
**Check database:**
```javascript
// MongoDB query
db.teacher_subjects.find({
  teacher_id: "TEACHER_ID",
  school_id: "SCHOOL_ID"
})

// Should return subjects like:
{
  teacher_id: "xxx",
  class_id: "yyy",
  subjects: ["Math", "Science", "English"]
}
```

**Fix: Admin panel se subjects allocate karo**
- SchoolTino → Teachers → Select Teacher
- Edit → Assign Subjects
- Save

### 2. API endpoint not returning data

**Backend check:**
```bash
# Test endpoint
curl http://your-backend-url/api/teachers/subjects?teacher_id=xxx&school_id=yyy
```

**Frontend check (TeachTinoDashboard.js):**
```javascript
// Line ~150-200 mein ye code hona chahiye:

useEffect(() => {
  const fetchTeacherData = async () => {
    try {
      const token = localStorage.getItem('token');
      const teacherId = user?.id || user?.teacher_id;
      const schoolId = user?.school_id;
      
      // Subjects fetch
      const subjectsRes = await axios.get(
        `${API}/teachers/subjects?teacher_id=${teacherId}&school_id=${schoolId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Subjects API Response:', subjectsRes.data); // DEBUG
      
      setSubjects(subjectsRes.data.subjects || []);
      
    } catch (error) {
      console.error('Subjects fetch error:', error);
    }
  };
  
  fetchTeacherData();
}, [user]);
```

### 3. Backend route missing or broken

**Check server.py:**
```python
# Should have this route:
@router.get("/teachers/subjects")
async def get_teacher_subjects(teacher_id: str, school_id: str):
    # Find teacher's classes
    classes = await db.classes.find({
        "school_id": school_id,
        "class_teacher_id": teacher_id
    }).to_list(100)
    
    # Get unique subjects
    subjects = []
    for cls in classes:
        if cls.get("subjects"):
            subjects.extend(cls["subjects"])
    
    unique_subjects = list(set(subjects))
    
    return {
        "teacher_id": teacher_id,
        "subjects": unique_subjects,
        "classes": [{"class_id": c["class_id"], "class_name": c["name"]} for c in classes]
    }
```

## IMMEDIATE FIX STEPS:

### Step 1: Check browser console
```
F12 → Console → Look for errors
```

### Step 2: Check API call
```
F12 → Network → Find /teachers/subjects call
- Status code?
- Response data?
```

### Step 3: Temporary hardcode for testing
```javascript
// TeachTinoDashboard.js mein temporarily add karo:

useEffect(() => {
  // TEMP FIX - Replace with actual API call
  setSubjects([
    { name: "Mathematics", code: "MATH" },
    { name: "Science", code: "SCI" },
    { name: "English", code: "ENG" }
  ]);
}, []);
```

### Step 4: Database check
```javascript
// MongoDB shell
use schooltino

// Check if teacher has class allocated
db.classes.find({ 
  class_teacher_id: "DEEPIKA_TEACHER_ID" 
})

// Check subjects in that class
db.classes.findOne({ 
  class_id: "UKG" 
}).subjects
```

## PERMANENT FIX:

Create `/backend/routes/teacher_dashboard.py`:

```python
from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter(prefix="/teachers", tags=["Teacher Dashboard"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "schooltino")
_client = AsyncIOMotorClient(MONGO_URL)
db = _client[DB_NAME]

@router.get("/subjects")
async def get_teacher_subjects(teacher_id: str, school_id: str):
    """Get subjects allocated to teacher"""
    
    # Method 1: From classes where teacher is class_teacher
    classes = await db.classes.find({
        "school_id": school_id,
        "class_teacher_id": teacher_id
    }).to_list(100)
    
    subjects_from_classes = []
    for cls in classes:
        if cls.get("subjects"):
            subjects_from_classes.extend(cls["subjects"])
    
    # Method 2: From teacher_subjects collection (if exists)
    teacher_subjects_doc = await db.teacher_subjects.find_one({
        "teacher_id": teacher_id,
        "school_id": school_id
    })
    
    if teacher_subjects_doc:
        subjects_from_doc = teacher_subjects_doc.get("subjects", [])
    else:
        subjects_from_doc = []
    
    # Combine both
    all_subjects = list(set(subjects_from_classes + subjects_from_doc))
    
    # Format nicely
    subject_list = []
    for subj in all_subjects:
        if isinstance(subj, str):
            subject_list.append({
                "name": subj,
                "code": subj.upper()[:3]
            })
        elif isinstance(subj, dict):
            subject_list.append(subj)
    
    return {
        "teacher_id": teacher_id,
        "school_id": school_id,
        "count": len(subject_list),
        "subjects": subject_list,
        "classes": [
            {
                "class_id": c.get("class_id"),
                "class_name": c.get("name"),
                "subjects": c.get("subjects", [])
            }
            for c in classes
        ]
    }
```

Register in server.py:
```python
from routes.teacher_dashboard import router as teacher_dashboard_router

api_router.include_router(teacher_dashboard_router)
```

## TESTING CHECKLIST:

- [ ] API endpoint returns data
- [ ] Frontend receives subjects
- [ ] Count displays correctly
- [ ] Subjects listed properly
- [ ] No console errors
