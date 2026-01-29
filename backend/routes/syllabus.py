# ./routes/syllabus.py
"""
Unified Syllabus API Routes
Supports multiple boards: NCERT, MPBSE, etc.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))
from services.ncert_syllabus import NCERTSyllabusService
from services.mpbse_syllabus import MPBSESyllabusService

router = APIRouter(prefix="/syllabus", tags=["Unified Syllabus"])

SUPPORTED_BOARDS = {
    "NCERT": {"name": "NCERT (CBSE)", "service": NCERTSyllabusService},
    "MPBSE": {"name": "MP Board (MPBSE)", "service": MPBSESyllabusService}
}


@router.get("/boards")
async def get_available_boards():
    """Get list of all supported education boards"""
    return {
        "boards": [
            {"code": "NCERT", "name": "NCERT (CBSE)", "description": "National Council of Educational Research and Training"},
            {"code": "MPBSE", "name": "MP Board", "description": "Madhya Pradesh Board of Secondary Education"}
        ],
        "total": 2
    }


@router.get("/{board}/classes")
async def get_classes_by_board(board: str):
    """Get all classes for a specific board"""
    board_upper = board.upper()
    if board_upper not in SUPPORTED_BOARDS:
        raise HTTPException(status_code=404, detail=f"Board {board} not supported. Available: NCERT, MPBSE")
    
    service = SUPPORTED_BOARDS[board_upper]["service"]
    classes = service.get_all_classes()
    
    return {
        "board": board_upper,
        "board_name": SUPPORTED_BOARDS[board_upper]["name"],
        "classes": classes,
        "total": len(classes)
    }


@router.get("/{board}/subjects/{class_num}")
async def get_subjects_by_board(board: str, class_num: str):
    """Get subjects for a class from specific board"""
    board_upper = board.upper()
    if board_upper not in SUPPORTED_BOARDS:
        raise HTTPException(status_code=404, detail=f"Board {board} not supported")
    
    service = SUPPORTED_BOARDS[board_upper]["service"]
    subjects = service.get_subjects_for_class(class_num)
    
    if not subjects:
        raise HTTPException(status_code=404, detail=f"Class {class_num} not found in {board_upper}")
    
    return {
        "board": board_upper,
        "class": class_num,
        "subjects": subjects,
        "total": len(subjects)
    }


@router.get("/{board}/syllabus/{class_num}")
async def get_syllabus_by_board(
    board: str,
    class_num: str,
    subject: Optional[str] = Query(None, description="Filter by subject")
):
    """Get complete syllabus for a class from specific board"""
    board_upper = board.upper()
    if board_upper not in SUPPORTED_BOARDS:
        raise HTTPException(status_code=404, detail=f"Board {board} not supported")
    
    service = SUPPORTED_BOARDS[board_upper]["service"]
    result = service.get_syllabus(class_num, subject)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    result["board"] = board_upper
    result["board_name"] = SUPPORTED_BOARDS[board_upper]["name"]
    
    return result


@router.get("/{board}/search")
async def search_by_board(
    board: str,
    query: str = Query(..., min_length=2),
    class_num: Optional[str] = Query(None)
):
    """Search syllabus for a specific board"""
    board_upper = board.upper()
    if board_upper not in SUPPORTED_BOARDS:
        raise HTTPException(status_code=404, detail=f"Board {board} not supported")
    
    service = SUPPORTED_BOARDS[board_upper]["service"]
    results = service.search_topics(query, class_num)
    
    return {
        "board": board_upper,
        "query": query,
        "class_filter": class_num,
        "results": results,
        "total": len(results)
    }


@router.get("/search/all")
async def search_all_boards(
    query: str = Query(..., min_length=2),
    class_num: Optional[str] = Query(None)
):
    """Search syllabus across all boards"""
    all_results = []
    
    for board_code, board_info in SUPPORTED_BOARDS.items():
        service = board_info["service"]
        results = service.search_topics(query, class_num)
        for r in results:
            r["board"] = board_code
        all_results.extend(results)
    
    return {
        "query": query,
        "class_filter": class_num,
        "results": all_results,
        "total": len(all_results),
        "boards_searched": list(SUPPORTED_BOARDS.keys())
    }
