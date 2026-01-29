# ./routes/ncert.py
"""
NCERT Syllabus API Routes
Real NCERT curriculum data from official sources
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
import sys
import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))
from services.ncert_syllabus import NCERTSyllabusService

router = APIRouter(prefix="/ncert", tags=["NCERT Syllabus"])


@router.get("/classes")
async def get_all_classes():
    """Get all available NCERT classes (1-12)"""
    classes = NCERTSyllabusService.get_all_classes()
    return {
        "classes": classes,
        "total": len(classes),
        "source": "NCERT Official Curriculum"
    }


@router.get("/subjects/{class_num}")
async def get_subjects(class_num: str):
    """Get all subjects for a specific class"""
    subjects = NCERTSyllabusService.get_subjects_for_class(class_num)
    if not subjects:
        raise HTTPException(status_code=404, detail=f"Class {class_num} not found")
    
    return {
        "class": class_num,
        "subjects": subjects,
        "total": len(subjects)
    }


@router.get("/syllabus/{class_num}")
async def get_syllabus(
    class_num: str,
    subject: Optional[str] = Query(None, description="Filter by subject")
):
    """
    Get complete syllabus for a class
    - Without subject: Returns all subjects with chapters
    - With subject: Returns only that subject's syllabus
    """
    result = NCERTSyllabusService.get_syllabus(class_num, subject)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.get("/chapter/{class_num}/{subject}/{chapter_num}")
async def get_chapter(class_num: str, subject: str, chapter_num: int):
    """Get specific chapter details with topics"""
    chapter = NCERTSyllabusService.get_chapter_details(class_num, subject, chapter_num)
    if not chapter:
        raise HTTPException(
            status_code=404, 
            detail=f"Chapter {chapter_num} not found for Class {class_num} {subject}"
        )
    
    return chapter


@router.get("/search")
async def search_syllabus(
    query: str = Query(..., min_length=2, description="Search query"),
    class_num: Optional[str] = Query(None, description="Filter by class")
):
    """
    Search for topics, chapters across NCERT syllabus
    - query: Search term (minimum 2 characters)
    - class_num: Optional filter by class
    """
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    results = NCERTSyllabusService.search_topics(query, class_num)
    
    return {
        "query": query,
        "class_filter": class_num,
        "results": results,
        "total": len(results)
    }


@router.get("/progress-template/{class_num}/{subject}")
async def get_progress_template(class_num: str, subject: str):
    """
    Get syllabus progress tracking template
    Teachers can use this to track chapter completion
    """
    template = NCERTSyllabusService.get_syllabus_progress_template(class_num, subject)
    if not template:
        raise HTTPException(
            status_code=404, 
            detail=f"Syllabus not found for Class {class_num} {subject}"
        )
    
    syllabus = NCERTSyllabusService.get_syllabus(class_num, subject)
    
    return {
        "class": class_num,
        "subject": subject,
        "book": syllabus["data"]["book"],
        "chapters": template,
        "total_chapters": len(template)
    }


@router.get("/books")
async def get_all_books():
    """Get list of all NCERT books by class"""
    all_books = []
    
    for class_num in NCERTSyllabusService.get_all_classes():
        syllabus = NCERTSyllabusService.get_syllabus(class_num)
        for subject, data in syllabus.get("subjects", {}).items():
            all_books.append({
                "class": class_num,
                "subject": subject,
                "book_name": data.get("book", ""),
                "chapters_count": len(data.get("chapters", []))
            })
    
    return {
        "books": all_books,
        "total": len(all_books),
        "source": "NCERT Official Textbooks"
    }


@router.get("/summary")
async def get_syllabus_summary():
    """Get summary statistics of NCERT syllabus data"""
    total_chapters = 0
    total_topics = 0
    subjects_set = set()
    
    for class_num in NCERTSyllabusService.get_all_classes():
        syllabus = NCERTSyllabusService.get_syllabus(class_num)
        for subject, data in syllabus.get("subjects", {}).items():
            subjects_set.add(subject)
            chapters = data.get("chapters", [])
            total_chapters += len(chapters)
            for ch in chapters:
                total_topics += len(ch.get("topics", []))
    
    return {
        "total_classes": len(NCERTSyllabusService.get_all_classes()),
        "total_subjects": len(subjects_set),
        "total_chapters": total_chapters,
        "total_topics": total_topics,
        "subjects": sorted(list(subjects_set)),
        "data_source": "NCERT Official Curriculum (https://ncert.nic.in/syllabus.php)"
    }
