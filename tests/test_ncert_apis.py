"""
Test NCERT Syllabus APIs - Iteration 10
Tests for the new modular NCERT routes with real NCERT curriculum data
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://schoolerp-6.preview.emergentagent.com').rstrip('/')


class TestNCERTSummary:
    """Test /api/ncert/summary endpoint"""
    
    def test_ncert_summary_returns_statistics(self):
        """NCERT API /api/ncert/summary returns statistics"""
        response = requests.get(f"{BASE_URL}/api/ncert/summary")
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "total_classes" in data
        assert "total_subjects" in data
        assert "total_chapters" in data
        assert "total_topics" in data
        assert "subjects" in data
        assert "data_source" in data
        
        # Verify values are reasonable
        assert data["total_classes"] == 12  # Classes 1-12
        assert data["total_subjects"] >= 5  # At least 5 subjects
        assert data["total_chapters"] >= 100  # Should have many chapters
        assert data["total_topics"] >= 200  # Should have many topics
        assert isinstance(data["subjects"], list)
        print(f"✓ NCERT Summary: {data['total_classes']} classes, {data['total_subjects']} subjects, {data['total_chapters']} chapters, {data['total_topics']} topics")


class TestNCERTClasses:
    """Test /api/ncert/classes endpoint"""
    
    def test_ncert_classes_returns_all_12_classes(self):
        """NCERT API /api/ncert/classes returns all 12 classes"""
        response = requests.get(f"{BASE_URL}/api/ncert/classes")
        assert response.status_code == 200
        
        data = response.json()
        assert "classes" in data
        assert "total" in data
        assert "source" in data
        
        # Verify all 12 classes
        assert data["total"] == 12
        classes = data["classes"]
        assert len(classes) == 12
        
        # Verify classes are 1-12
        expected_classes = [str(i) for i in range(1, 13)]
        assert sorted(classes, key=int) == expected_classes
        print(f"✓ NCERT Classes: {classes}")


class TestNCERTSubjects:
    """Test /api/ncert/subjects/{class_num} endpoint"""
    
    def test_ncert_subjects_class_10(self):
        """NCERT API /api/ncert/subjects/10 returns Class 10 subjects"""
        response = requests.get(f"{BASE_URL}/api/ncert/subjects/10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert "subjects" in data
        assert "total" in data
        
        subjects = data["subjects"]
        assert len(subjects) >= 4  # At least Hindi, English, Math, Science
        
        # Class 10 should have these core subjects
        expected_subjects = ["Hindi", "English", "Mathematics", "Science", "Social Science"]
        for subj in expected_subjects:
            assert subj in subjects, f"Missing subject: {subj}"
        
        print(f"✓ Class 10 Subjects: {subjects}")
    
    def test_ncert_subjects_class_6(self):
        """NCERT API /api/ncert/subjects/6 returns Class 6 subjects"""
        response = requests.get(f"{BASE_URL}/api/ncert/subjects/6")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "6"
        assert len(data["subjects"]) >= 4
        print(f"✓ Class 6 Subjects: {data['subjects']}")
    
    def test_ncert_subjects_class_12(self):
        """NCERT API /api/ncert/subjects/12 returns Class 12 subjects"""
        response = requests.get(f"{BASE_URL}/api/ncert/subjects/12")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "12"
        # Class 12 has Physics, Chemistry, Math, Biology
        subjects = data["subjects"]
        assert "Physics" in subjects or "Mathematics" in subjects
        print(f"✓ Class 12 Subjects: {subjects}")
    
    def test_ncert_subjects_invalid_class(self):
        """NCERT API returns 404 for invalid class"""
        response = requests.get(f"{BASE_URL}/api/ncert/subjects/99")
        assert response.status_code == 404


class TestNCERTSyllabus:
    """Test /api/ncert/syllabus/{class_num} endpoint"""
    
    def test_ncert_syllabus_class_10_science(self):
        """NCERT API /api/ncert/syllabus/10?subject=Science returns chapters with topics"""
        response = requests.get(f"{BASE_URL}/api/ncert/syllabus/10?subject=Science")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert data["subject"] == "Science"
        assert "data" in data
        
        syllabus_data = data["data"]
        assert "book" in syllabus_data
        assert "chapters" in syllabus_data
        
        chapters = syllabus_data["chapters"]
        assert len(chapters) >= 10  # Class 10 Science has 16 chapters
        
        # Verify chapter structure
        first_chapter = chapters[0]
        assert "number" in first_chapter
        assert "name" in first_chapter
        assert "topics" in first_chapter
        assert isinstance(first_chapter["topics"], list)
        
        print(f"✓ Class 10 Science: {len(chapters)} chapters, Book: {syllabus_data['book']}")
        print(f"  First chapter: {first_chapter['name']} with {len(first_chapter['topics'])} topics")
    
    def test_ncert_syllabus_class_10_math(self):
        """NCERT API /api/ncert/syllabus/10?subject=Mathematics returns chapters"""
        response = requests.get(f"{BASE_URL}/api/ncert/syllabus/10?subject=Mathematics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["subject"] == "Mathematics"
        chapters = data["data"]["chapters"]
        
        # Class 10 Math has 15 chapters
        assert len(chapters) >= 10
        
        # Check for specific chapters
        chapter_names = [ch["name"] for ch in chapters]
        assert any("Real Numbers" in name for name in chapter_names)
        assert any("Quadratic" in name for name in chapter_names)
        
        print(f"✓ Class 10 Mathematics: {len(chapters)} chapters")
    
    def test_ncert_syllabus_all_subjects(self):
        """NCERT API /api/ncert/syllabus/10 without subject returns all subjects"""
        response = requests.get(f"{BASE_URL}/api/ncert/syllabus/10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert "subjects" in data
        
        subjects = data["subjects"]
        assert len(subjects) >= 4
        print(f"✓ Class 10 All Subjects: {list(subjects.keys())}")


class TestNCERTSearch:
    """Test /api/ncert/search endpoint"""
    
    def test_ncert_search_pythagoras(self):
        """NCERT API /api/ncert/search?query=pythagoras finds matching topics"""
        response = requests.get(f"{BASE_URL}/api/ncert/search?query=pythagoras")
        assert response.status_code == 200
        
        data = response.json()
        assert data["query"] == "pythagoras"
        assert "results" in data
        assert "total" in data
        
        results = data["results"]
        assert len(results) >= 1  # Should find Pythagoras theorem
        
        # Verify result structure
        if results:
            result = results[0]
            assert "class" in result
            assert "subject" in result
            assert "chapter" in result
            assert "match_type" in result
        
        print(f"✓ Search 'pythagoras': Found {len(results)} results")
    
    def test_ncert_search_photosynthesis(self):
        """NCERT API search for photosynthesis"""
        response = requests.get(f"{BASE_URL}/api/ncert/search?query=photosynthesis")
        assert response.status_code == 200
        
        data = response.json()
        # Photosynthesis might not be in the data, but search should work
        assert "results" in data
        print(f"✓ Search 'photosynthesis': Found {data['total']} results")
    
    def test_ncert_search_with_class_filter(self):
        """NCERT API search with class filter"""
        response = requests.get(f"{BASE_URL}/api/ncert/search?query=equation&class_num=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class_filter"] == "10"
        
        # All results should be from class 10
        for result in data["results"]:
            assert result["class"] == "10"
        
        print(f"✓ Search 'equation' in Class 10: Found {data['total']} results")
    
    def test_ncert_search_short_query_rejected(self):
        """NCERT API rejects queries shorter than 2 characters"""
        response = requests.get(f"{BASE_URL}/api/ncert/search?query=a")
        assert response.status_code == 422  # Validation error


class TestNCERTChapter:
    """Test /api/ncert/chapter/{class_num}/{subject}/{chapter_num} endpoint"""
    
    def test_ncert_chapter_class_10_math_chapter_4(self):
        """NCERT API /api/ncert/chapter/10/Mathematics/4 returns specific chapter"""
        response = requests.get(f"{BASE_URL}/api/ncert/chapter/10/Mathematics/4")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert data["subject"] == "Mathematics"
        assert "book" in data
        assert "chapter" in data
        
        chapter = data["chapter"]
        assert chapter["number"] == 4
        assert "name" in chapter
        assert "topics" in chapter
        
        print(f"✓ Class 10 Math Chapter 4: {chapter['name']}")
        print(f"  Topics: {chapter['topics'][:3]}...")
    
    def test_ncert_chapter_class_10_science_chapter_1(self):
        """NCERT API returns Class 10 Science Chapter 1"""
        response = requests.get(f"{BASE_URL}/api/ncert/chapter/10/Science/1")
        assert response.status_code == 200
        
        data = response.json()
        chapter = data["chapter"]
        assert chapter["number"] == 1
        assert "Chemical Reactions" in chapter["name"]
        print(f"✓ Class 10 Science Chapter 1: {chapter['name']}")
    
    def test_ncert_chapter_not_found(self):
        """NCERT API returns 404 for non-existent chapter"""
        response = requests.get(f"{BASE_URL}/api/ncert/chapter/10/Mathematics/99")
        assert response.status_code == 404


class TestNCERTBooks:
    """Test /api/ncert/books endpoint"""
    
    def test_ncert_books_returns_all_books(self):
        """NCERT API /api/ncert/books returns all NCERT books"""
        response = requests.get(f"{BASE_URL}/api/ncert/books")
        assert response.status_code == 200
        
        data = response.json()
        assert "books" in data
        assert "total" in data
        assert "source" in data
        
        books = data["books"]
        assert len(books) >= 20  # Should have many books across classes
        
        # Verify book structure
        book = books[0]
        assert "class" in book
        assert "subject" in book
        assert "book_name" in book
        assert "chapters_count" in book
        
        # Check for specific books
        class_10_books = [b for b in books if b["class"] == "10"]
        assert len(class_10_books) >= 4  # At least 4 subjects in class 10
        
        print(f"✓ NCERT Books: {data['total']} total books")
        print(f"  Class 10 books: {len(class_10_books)}")


class TestNCERTProgressTemplate:
    """Test /api/ncert/progress-template/{class_num}/{subject} endpoint"""
    
    def test_ncert_progress_template(self):
        """NCERT API returns progress template for tracking"""
        response = requests.get(f"{BASE_URL}/api/ncert/progress-template/10/Mathematics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["class"] == "10"
        assert data["subject"] == "Mathematics"
        assert "book" in data
        assert "chapters" in data
        assert "total_chapters" in data
        
        chapters = data["chapters"]
        assert len(chapters) >= 10
        
        # Verify template structure
        chapter = chapters[0]
        assert "chapter_number" in chapter
        assert "chapter_name" in chapter
        assert "topics" in chapter
        assert "status" in chapter
        assert chapter["status"] == "not_started"
        assert "completion_percentage" in chapter
        
        print(f"✓ Progress Template: {len(chapters)} chapters for tracking")
    
    def test_ncert_progress_template_not_found(self):
        """NCERT API returns 404 for invalid subject"""
        response = requests.get(f"{BASE_URL}/api/ncert/progress-template/10/InvalidSubject")
        assert response.status_code == 404


class TestNCERTDataIntegrity:
    """Test data integrity and consistency"""
    
    def test_class_10_has_complete_data(self):
        """Verify Class 10 has complete syllabus data"""
        # Get all subjects
        subjects_res = requests.get(f"{BASE_URL}/api/ncert/subjects/10")
        subjects = subjects_res.json()["subjects"]
        
        for subject in subjects:
            syllabus_res = requests.get(f"{BASE_URL}/api/ncert/syllabus/10?subject={subject}")
            assert syllabus_res.status_code == 200
            
            data = syllabus_res.json()
            chapters = data["data"]["chapters"]
            
            # Each subject should have chapters
            assert len(chapters) >= 5, f"{subject} has too few chapters"
            
            # Each chapter should have topics
            for ch in chapters:
                assert len(ch.get("topics", [])) >= 1, f"Chapter {ch['name']} has no topics"
        
        print(f"✓ Class 10 data integrity verified for {len(subjects)} subjects")
    
    def test_summary_matches_actual_data(self):
        """Verify summary statistics match actual data"""
        summary_res = requests.get(f"{BASE_URL}/api/ncert/summary")
        summary = summary_res.json()
        
        classes_res = requests.get(f"{BASE_URL}/api/ncert/classes")
        classes = classes_res.json()
        
        assert summary["total_classes"] == classes["total"]
        print(f"✓ Summary matches actual data: {summary['total_classes']} classes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
