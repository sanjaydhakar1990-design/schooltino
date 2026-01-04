# /app/backend/routes/mpbse.py
"""
MP Board (MPBSE) Syllabus API Routes
Madhya Pradesh Board of Secondary Education
Data from https://mpbse.nic.in/syllabus.htm
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
sys.path.append('/app/backend')
from services.mpbse_syllabus import MPBSESyllabusService

router = APIRouter(prefix="/mpbse", tags=["MPBSE Syllabus"])


@router.get("/classes")
async def get_all_classes():
    """Get all available MP Board classes (1-12)"""
    classes = MPBSESyllabusService.get_all_classes()
    return {
        "classes": classes,
        "total": len(classes),
        "board": "MPBSE",
        "source": "MP Board Official Curriculum (https://mpbse.nic.in)"
    }


@router.get("/subjects/{class_num}")
async def get_subjects(class_num: str):
    """Get all subjects for a specific class"""
    subjects = MPBSESyllabusService.get_subjects_for_class(class_num)
    if not subjects:
        raise HTTPException(status_code=404, detail=f"Class {class_num} not found")
    
    return {
        "class": class_num,
        "board": "MPBSE",
        "subjects": subjects,
        "total": len(subjects)
    }


@router.get("/syllabus/{class_num}")
async def get_syllabus(
    class_num: str,
    subject: Optional[str] = Query(None, description="Filter by subject")
):
    """Get complete syllabus for a class"""
    result = MPBSESyllabusService.get_syllabus(class_num, subject)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.get("/search")
async def search_syllabus(
    query: str = Query(..., min_length=2, description="Search query"),
    class_num: Optional[str] = Query(None, description="Filter by class")
):
    """Search for topics, chapters across MP Board syllabus"""
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    results = MPBSESyllabusService.search_topics(query, class_num)
    
    return {
        "query": query,
        "board": "MPBSE",
        "class_filter": class_num,
        "results": results,
        "total": len(results)
    }


@router.get("/summary")
async def get_syllabus_summary():
    """Get summary statistics of MP Board syllabus data"""
    total_chapters = 0
    total_topics = 0
    subjects_set = set()
    
    for class_num in MPBSESyllabusService.get_all_classes():
        syllabus = MPBSESyllabusService.get_syllabus(class_num)
        for subject, data in syllabus.get("subjects", {}).items():
            subjects_set.add(subject)
            chapters = data.get("chapters", [])
            total_chapters += len(chapters)
            for ch in chapters:
                total_topics += len(ch.get("topics", []))
    
    return {
        "board": "MPBSE",
        "total_classes": len(MPBSESyllabusService.get_all_classes()),
        "total_subjects": len(subjects_set),
        "total_chapters": total_chapters,
        "total_topics": total_topics,
        "subjects": sorted(list(subjects_set)),
        "data_source": "MP Board Official Curriculum (https://mpbse.nic.in/syllabus.htm)"
    }
