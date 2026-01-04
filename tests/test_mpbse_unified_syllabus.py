"""
Test Suite for MPBSE and Unified Syllabus APIs - Iteration 11
Tests:
- MPBSE API endpoints (/api/mpbse/*)
- Unified Syllabus API endpoints (/api/syllabus/*)
- Cross-board search functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMPBSEAPIs:
    """MP Board (MPBSE) Syllabus API Tests"""
    
    def test_mpbse_summary_returns_statistics(self):
        """Test /api/mpbse/summary returns board statistics"""
        response = requests.get(f"{BASE_URL}/api/mpbse/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "MPBSE"
        assert data["total_classes"] == 12
        assert data["total_subjects"] >= 5
        assert data["total_chapters"] >= 200  # Should have 227+ chapters
        assert data["total_topics"] >= 400    # Should have 527+ topics
        assert "subjects" in data
        assert "data_source" in data
        print(f"✓ MPBSE Summary: {data['total_chapters']} chapters, {data['total_topics']} topics")
    
    def test_mpbse_classes_returns_all_classes(self):
        """Test /api/mpbse/classes returns all 12 classes"""
        response = requests.get(f"{BASE_URL}/api/mpbse/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "MPBSE"
        assert data["total"] == 12
        assert "1" in data["classes"]
        assert "12" in data["classes"]
        print(f"✓ MPBSE Classes: {data['total']} classes available")
    
    def test_mpbse_subjects_for_class_10(self):
        """Test /api/mpbse/subjects/10 returns subjects"""
        response = requests.get(f"{BASE_URL}/api/mpbse/subjects/10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert data["board"] == "MPBSE"
        assert "Hindi" in data["subjects"]
        assert "English" in data["subjects"]
        assert "Mathematics" in data["subjects"]
        assert "Science" in data["subjects"]
        assert "Social Science" in data["subjects"]
        print(f"✓ MPBSE Class 10 Subjects: {data['subjects']}")
    
    def test_mpbse_syllabus_class_10_science(self):
        """Test /api/mpbse/syllabus/10?subject=Science returns chapters"""
        response = requests.get(f"{BASE_URL}/api/mpbse/syllabus/10?subject=Science")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert data["board"] == "MPBSE"
        assert data["subject"] == "Science"
        
        chapters = data["data"]["chapters"]
        assert len(chapters) >= 15  # Class 10 Science has 16 chapters
        
        # Verify chapter structure
        first_chapter = chapters[0]
        assert "number" in first_chapter
        assert "name" in first_chapter
        assert "topics" in first_chapter
        print(f"✓ MPBSE Class 10 Science: {len(chapters)} chapters")
    
    def test_mpbse_syllabus_class_9_mathematics(self):
        """Test /api/mpbse/syllabus/9?subject=Mathematics returns chapters"""
        response = requests.get(f"{BASE_URL}/api/mpbse/syllabus/9?subject=Mathematics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "9"
        assert data["subject"] == "Mathematics"
        
        chapters = data["data"]["chapters"]
        assert len(chapters) >= 14  # Class 9 Math has 15 chapters
        print(f"✓ MPBSE Class 9 Mathematics: {len(chapters)} chapters")
    
    def test_mpbse_syllabus_class_12_physics(self):
        """Test /api/mpbse/syllabus/12?subject=Physics returns chapters"""
        response = requests.get(f"{BASE_URL}/api/mpbse/syllabus/12?subject=Physics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "12"
        assert data["subject"] == "Physics"
        
        chapters = data["data"]["chapters"]
        assert len(chapters) >= 10  # Class 12 Physics has 14 chapters
        print(f"✓ MPBSE Class 12 Physics: {len(chapters)} chapters")
    
    def test_mpbse_search_topics(self):
        """Test /api/mpbse/search?query=newton returns results"""
        response = requests.get(f"{BASE_URL}/api/mpbse/search?query=newton")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "MPBSE"
        assert data["query"] == "newton"
        assert len(data["results"]) >= 1
        print(f"✓ MPBSE Search 'newton': {len(data['results'])} results")
    
    def test_mpbse_invalid_class_returns_404(self):
        """Test /api/mpbse/subjects/99 returns 404"""
        response = requests.get(f"{BASE_URL}/api/mpbse/subjects/99")
        assert response.status_code == 404
        print("✓ MPBSE Invalid class returns 404")


class TestUnifiedSyllabusAPIs:
    """Unified Syllabus API Tests - Multi-board support"""
    
    def test_boards_returns_ncert_and_mpbse(self):
        """Test /api/syllabus/boards returns both boards"""
        response = requests.get(f"{BASE_URL}/api/syllabus/boards")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 2
        
        board_codes = [b["code"] for b in data["boards"]]
        assert "NCERT" in board_codes
        assert "MPBSE" in board_codes
        print(f"✓ Unified Boards: {board_codes}")
    
    def test_unified_mpbse_classes(self):
        """Test /api/syllabus/MPBSE/classes returns all classes"""
        response = requests.get(f"{BASE_URL}/api/syllabus/MPBSE/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "MPBSE"
        assert data["board_name"] == "MP Board (MPBSE)"
        assert data["total"] == 12
        print(f"✓ Unified MPBSE Classes: {data['total']} classes")
    
    def test_unified_ncert_classes(self):
        """Test /api/syllabus/NCERT/classes returns all classes"""
        response = requests.get(f"{BASE_URL}/api/syllabus/NCERT/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "NCERT"
        assert data["board_name"] == "NCERT (CBSE)"
        assert data["total"] == 12
        print(f"✓ Unified NCERT Classes: {data['total']} classes")
    
    def test_unified_ncert_syllabus_class_10_math(self):
        """Test /api/syllabus/NCERT/syllabus/10?subject=Mathematics"""
        response = requests.get(f"{BASE_URL}/api/syllabus/NCERT/syllabus/10?subject=Mathematics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "NCERT"
        assert data["board_name"] == "NCERT (CBSE)"
        assert data["class"] == "10"
        assert data["subject"] == "Mathematics"
        
        chapters = data["data"]["chapters"]
        assert len(chapters) >= 14  # NCERT Class 10 Math has 15 chapters
        
        # Verify Quadratic Equations chapter exists
        chapter_names = [ch["name"] for ch in chapters]
        assert "Quadratic Equations" in chapter_names
        print(f"✓ Unified NCERT Class 10 Math: {len(chapters)} chapters")
    
    def test_unified_mpbse_syllabus_class_10_science(self):
        """Test /api/syllabus/MPBSE/syllabus/10?subject=Science"""
        response = requests.get(f"{BASE_URL}/api/syllabus/MPBSE/syllabus/10?subject=Science")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "MPBSE"
        assert data["board_name"] == "MP Board (MPBSE)"
        assert data["class"] == "10"
        assert data["subject"] == "Science"
        
        chapters = data["data"]["chapters"]
        assert len(chapters) >= 15
        print(f"✓ Unified MPBSE Class 10 Science: {len(chapters)} chapters")
    
    def test_unified_search_all_boards_quadratic(self):
        """Test /api/syllabus/search/all?query=quadratic searches both boards"""
        response = requests.get(f"{BASE_URL}/api/syllabus/search/all?query=quadratic")
        assert response.status_code == 200
        
        data = response.json()
        assert data["query"] == "quadratic"
        assert "NCERT" in data["boards_searched"]
        assert "MPBSE" in data["boards_searched"]
        
        # Should find results from both boards
        boards_in_results = set(r.get("board") for r in data["results"])
        assert "NCERT" in boards_in_results or "MPBSE" in boards_in_results
        print(f"✓ Unified Search 'quadratic': {data['total']} results from {data['boards_searched']}")
    
    def test_unified_search_all_boards_nutrition(self):
        """Test /api/syllabus/search/all?query=nutrition"""
        response = requests.get(f"{BASE_URL}/api/syllabus/search/all?query=nutrition")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        print(f"✓ Unified Search 'nutrition': {data['total']} results")
    
    def test_unified_invalid_board_returns_404(self):
        """Test /api/syllabus/INVALID/classes returns 404"""
        response = requests.get(f"{BASE_URL}/api/syllabus/INVALID/classes")
        assert response.status_code == 404
        print("✓ Unified Invalid board returns 404")
    
    def test_unified_board_case_insensitive(self):
        """Test board names are case insensitive"""
        response = requests.get(f"{BASE_URL}/api/syllabus/mpbse/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert data["board"] == "MPBSE"
        print("✓ Unified Board names are case insensitive")


class TestMPBSEDataIntegrity:
    """Verify MPBSE data integrity and completeness"""
    
    def test_class_9_has_all_subjects(self):
        """Verify Class 9 has all required subjects"""
        response = requests.get(f"{BASE_URL}/api/mpbse/subjects/9")
        assert response.status_code == 200
        
        data = response.json()
        required_subjects = ["Hindi", "English", "Mathematics", "Science", "Social Science"]
        for subject in required_subjects:
            assert subject in data["subjects"], f"Missing subject: {subject}"
        print(f"✓ MPBSE Class 9 has all required subjects")
    
    def test_class_10_has_all_subjects(self):
        """Verify Class 10 has all required subjects"""
        response = requests.get(f"{BASE_URL}/api/mpbse/subjects/10")
        assert response.status_code == 200
        
        data = response.json()
        required_subjects = ["Hindi", "English", "Mathematics", "Science", "Social Science"]
        for subject in required_subjects:
            assert subject in data["subjects"], f"Missing subject: {subject}"
        print(f"✓ MPBSE Class 10 has all required subjects")
    
    def test_class_11_has_science_subjects(self):
        """Verify Class 11 has science stream subjects"""
        response = requests.get(f"{BASE_URL}/api/mpbse/subjects/11")
        assert response.status_code == 200
        
        data = response.json()
        science_subjects = ["Physics", "Chemistry", "Mathematics", "Biology"]
        for subject in science_subjects:
            assert subject in data["subjects"], f"Missing subject: {subject}"
        print(f"✓ MPBSE Class 11 has science stream subjects")
    
    def test_class_12_has_science_subjects(self):
        """Verify Class 12 has science stream subjects"""
        response = requests.get(f"{BASE_URL}/api/mpbse/subjects/12")
        assert response.status_code == 200
        
        data = response.json()
        science_subjects = ["Physics", "Chemistry", "Mathematics", "Biology"]
        for subject in science_subjects:
            assert subject in data["subjects"], f"Missing subject: {subject}"
        print(f"✓ MPBSE Class 12 has science stream subjects")
    
    def test_chapters_have_topics(self):
        """Verify chapters have topics array"""
        response = requests.get(f"{BASE_URL}/api/mpbse/syllabus/10?subject=Science")
        assert response.status_code == 200
        
        data = response.json()
        chapters = data["data"]["chapters"]
        
        for chapter in chapters:
            assert "topics" in chapter, f"Chapter {chapter['name']} missing topics"
            assert isinstance(chapter["topics"], list), f"Topics should be a list"
        print(f"✓ All MPBSE Class 10 Science chapters have topics")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
