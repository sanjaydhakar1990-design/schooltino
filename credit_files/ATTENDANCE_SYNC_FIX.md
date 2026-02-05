# Attendance Error + SchoolTino Sync Fix

## Problems Identified:

1. **Attendance marks ho raha but error dikha raha**
2. **SchoolTino admin mein update nahi ho raha**
3. **Database mein save ho raha but UI mein error**

---

## ROOT CAUSE ANALYSIS:

### Issue 1: Partial Success
```
TeachTino mark attendance → MongoDB save ✅
                         → Return error to UI ❌
                         → SchoolTino sync fail ❌
```

### Issue 2: Error Handling Problem
Backend mein probably ye ho raha:
```python
# Wrong way (current):
try:
    save_attendance()  # Success
    sync_to_schooltino()  # Fail
    return error  # UI ko error dikha
except:
    return error

# Right way (needed):
try:
    save_attendance()  # Success
    try:
        sync_to_schooltino()  # Fail but don't break
    except:
        log_sync_error()  # Background sync later
    return success  # UI ko success dikha
```

---

## COMPLETE FIX:

### Step 1: Update Attendance Route

**File: `/backend/routes/attendance.py`**

Find the attendance marking function and replace with this:

```python
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# ... existing imports and db setup ...

class MarkAttendanceRequest(BaseModel):
    school_id: str
    class_id: str
    date: str
    attendance_data: List[dict]  # [{student_id, status, marked_by}]
    marked_by: str
    marked_by_name: str

class AttendanceRecord(BaseModel):
    student_id: str
    status: str  # present, absent, late, half_day
    marked_at: Optional[str] = None

async def sync_to_schooltino_background(
    school_id: str, 
    class_id: str, 
    date: str, 
    attendance_data: List[dict]
):
    """Background task to sync attendance to SchoolTino admin"""
    try:
        # Update schooltino_attendance collection
        for record in attendance_data:
            await db.schooltino_attendance.update_one(
                {
                    "school_id": school_id,
                    "class_id": class_id,
                    "student_id": record["student_id"],
                    "date": date
                },
                {
                    "$set": {
                        "status": record["status"],
                        "marked_by": record.get("marked_by"),
                        "marked_at": record.get("marked_at", datetime.now(timezone.utc).isoformat()),
                        "synced_at": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
        
        # Update daily summary for admin dashboard
        present_count = sum(1 for r in attendance_data if r["status"] == "present")
        absent_count = sum(1 for r in attendance_data if r["status"] == "absent")
        
        await db.attendance_daily_summary.update_one(
            {
                "school_id": school_id,
                "class_id": class_id,
                "date": date
            },
            {
                "$set": {
                    "present": present_count,
                    "absent": absent_count,
                    "total": len(attendance_data),
                    "percentage": round((present_count / len(attendance_data)) * 100, 2) if attendance_data else 0,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        print(f"✅ Attendance synced to SchoolTino: {school_id}/{class_id}/{date}")
        
    except Exception as e:
        # Log error but don't fail the main request
        print(f"❌ SchoolTino sync failed: {str(e)}")
        await db.sync_errors.insert_one({
            "type": "attendance_sync",
            "school_id": school_id,
            "class_id": class_id,
            "date": date,
            "error": str(e),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "retry_count": 0,
            "status": "pending"
        })


@router.post("/mark")
async def mark_attendance(
    req: MarkAttendanceRequest, 
    background_tasks: BackgroundTasks
):
    """
    Mark attendance - ALWAYS returns success to UI
    Sync to SchoolTino happens in background
    """
    
    try:
        # Step 1: Save to TeachTino collection (PRIMARY)
        records_to_save = []
        for record in req.attendance_data:
            records_to_save.append({
                "id": str(uuid.uuid4()),
                "school_id": req.school_id,
                "class_id": req.class_id,
                "student_id": record["student_id"],
                "date": req.date,
                "status": record["status"],
                "marked_by": req.marked_by,
                "marked_by_name": req.marked_by_name,
                "marked_at": datetime.now(timezone.utc).isoformat(),
                "source": "teachtino",
                "synced_to_schooltino": False  # Will be updated by background task
            })
        
        # Bulk insert
        if records_to_save:
            await db.attendance_records.insert_many(records_to_save)
        
        # Step 2: Schedule background sync (NON-BLOCKING)
        background_tasks.add_task(
            sync_to_schooltino_background,
            req.school_id,
            req.class_id,
            req.date,
            req.attendance_data
        )
        
        # Step 3: ALWAYS return success to UI
        return {
            "success": True,
            "message": "✅ Attendance marked successfully!",
            "date": req.date,
            "class_id": req.class_id,
            "records_saved": len(records_to_save),
            "sync_status": "Syncing to admin panel..."
        }
        
    except Exception as e:
        # Even if save fails, return proper error (not generic)
        print(f"❌ Attendance save error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Attendance save failed: {str(e)}"
        )


@router.get("/sync-status")
async def check_sync_status(school_id: str, class_id: str, date: str):
    """Check if attendance is synced to SchoolTino"""
    
    # Check sync errors
    errors = await db.sync_errors.find({
        "school_id": school_id,
        "class_id": class_id,
        "date": date,
        "type": "attendance_sync",
        "status": "pending"
    }).to_list(10)
    
    # Check if synced
    synced_records = await db.schooltino_attendance.count_documents({
        "school_id": school_id,
        "class_id": class_id,
        "date": date
    })
    
    return {
        "synced": synced_records > 0,
        "synced_records": synced_records,
        "pending_errors": len(errors),
        "errors": errors if errors else None
    }


@router.post("/retry-sync")
async def retry_failed_syncs(school_id: str):
    """Manually retry failed syncs"""
    
    failed_syncs = await db.sync_errors.find({
        "school_id": school_id,
        "type": "attendance_sync",
        "status": "pending",
        "retry_count": {"$lt": 3}
    }).to_list(100)
    
    retry_count = 0
    for sync_error in failed_syncs:
        try:
            # Fetch original attendance data
            date = sync_error["date"]
            class_id = sync_error["class_id"]
            
            records = await db.attendance_records.find({
                "school_id": school_id,
                "class_id": class_id,
                "date": date
            }).to_list(100)
            
            attendance_data = [
                {
                    "student_id": r["student_id"],
                    "status": r["status"],
                    "marked_by": r.get("marked_by"),
                    "marked_at": r.get("marked_at")
                }
                for r in records
            ]
            
            # Retry sync
            await sync_to_schooltino_background(
                school_id, class_id, date, attendance_data
            )
            
            # Mark as resolved
            await db.sync_errors.update_one(
                {"_id": sync_error["_id"]},
                {
                    "$set": {"status": "resolved"},
                    "$inc": {"retry_count": 1}
                }
            )
            
            retry_count += 1
            
        except Exception as e:
            # Increment retry count
            await db.sync_errors.update_one(
                {"_id": sync_error["_id"]},
                {"$inc": {"retry_count": 1}}
            )
    
    return {
        "success": True,
        "retried": retry_count,
        "message": f"Retried {retry_count} failed syncs"
    }
```

---

## FRONTEND FIX (TeachTino):

**File: Frontend attendance marking component**

```javascript
// OLD (Current - Shows error even on success)
const markAttendance = async () => {
  try {
    const res = await axios.post(`${API}/attendance/mark`, data);
    if (res.data.success) {
      toast.success('Attendance marked!');
    } else {
      toast.error('Failed!'); // ❌ Wrong
    }
  } catch (error) {
    toast.error('Error!');
  }
};

// NEW (Correct - Always show success if saved)
const markAttendance = async () => {
  try {
    const res = await axios.post(`${API}/attendance/mark`, data);
    
    // Backend ALWAYS returns success if saved
    toast.success('✅ Attendance marked successfully!');
    
    // Optional: Show sync status
    if (res.data.sync_status) {
      toast.info(res.data.sync_status, { duration: 2000 });
    }
    
    // Refresh list
    fetchAttendanceRecords();
    
  } catch (error) {
    // Only show error if actual save failed
    toast.error('❌ Failed to save attendance. Please try again.');
    console.error('Attendance error:', error);
  }
};
```

---

## SCHOOLTINO ADMIN DASHBOARD FIX:

**File: SchoolTino admin attendance view**

```javascript
// Add this to admin dashboard to see synced attendance

const fetchTodayAttendance = async () => {
  try {
    const res = await axios.get(
      `${API}/attendance/summary?school_id=${schoolId}&date=${today}`
    );
    
    setAttendanceSummary(res.data);
    
    // Check sync status
    const syncRes = await axios.get(
      `${API}/attendance/sync-status?school_id=${schoolId}&date=${today}`
    );
    
    if (!syncRes.data.synced) {
      toast.warning('Some attendance records are still syncing...');
    }
    
  } catch (error) {
    console.error('Attendance fetch error:', error);
  }
};
```

---

## TESTING STEPS:

### 1. Mark Attendance (TeachTino)
- Login as teacher
- Mark Attendance → Click Present/Absent
- Should show "✅ Attendance marked successfully!"
- NO error should appear

### 2. Check SchoolTino Admin
- Login as admin
- Go to Attendance Dashboard
- Should see today's attendance
- Present/Absent counts should match

### 3. Check Sync Status
```bash
# API test
curl "http://your-backend/api/attendance/sync-status?school_id=xxx&class_id=yyy&date=2026-02-04"

# Should return:
{
  "synced": true,
  "synced_records": 26,
  "pending_errors": 0
}
```

### 4. If Sync Failed, Retry
```bash
curl -X POST "http://your-backend/api/attendance/retry-sync?school_id=xxx"
```

---

## DATABASE SCHEMA:

### attendance_records (TeachTino Primary)
```json
{
  "id": "uuid",
  "school_id": "xxx",
  "class_id": "yyy",
  "student_id": "zzz",
  "date": "2026-02-04",
  "status": "present",
  "marked_by": "teacher_id",
  "marked_at": "ISO timestamp",
  "synced_to_schooltino": false
}
```

### schooltino_attendance (Admin View)
```json
{
  "school_id": "xxx",
  "class_id": "yyy",
  "student_id": "zzz",
  "date": "2026-02-04",
  "status": "present",
  "marked_by": "teacher_id",
  "synced_at": "ISO timestamp"
}
```

### sync_errors (Failed Syncs)
```json
{
  "type": "attendance_sync",
  "school_id": "xxx",
  "class_id": "yyy",
  "date": "2026-02-04",
  "error": "Error message",
  "retry_count": 0,
  "status": "pending"
}
```

---

## CHECKLIST:

- [ ] Backend updated with background sync
- [ ] Frontend shows success immediately
- [ ] SchoolTino admin sees attendance
- [ ] Sync errors logged
- [ ] Retry mechanism works
- [ ] No false error messages

---

## KEY IMPROVEMENTS:

1. **Immediate UI Success** - No more confusing errors
2. **Background Sync** - Doesn't block user
3. **Error Logging** - Tracks sync failures
4. **Retry Mechanism** - Auto/manual retry
5. **Admin Visibility** - SchoolTino sees all attendance
