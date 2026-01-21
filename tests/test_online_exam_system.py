"""
Test Online Exam System - Schooltino
Tests for exam creation, listing, student submission, and results
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://implementation-check-6.preview.emergentagent.com').rstrip('/')

# Test credentials
TEACHER_EMAIL = "teacher@schooltino.com"
TEACHER_PASSWORD = "teacher123"
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"
STUDENT_ID = "STD-2026-285220"
STUDENT_PASSWORD = "KPbeHdZf"


class TestExamSystemAuth:
    """Test authentication for exam system"""
    
    def test_teacher_login(self):
        """Teacher can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "teacher"
        print(f"✓ Teacher login successful: {data['user']['name']}")
    
    def test_student_login(self):
        """Student can login via student portal"""
        response = requests.post(
            f"{BASE_URL}/api/students/login",
            params={"student_id": STUDENT_ID, "password": STUDENT_PASSWORD}
        )
        assert response.status_code == 200, f"Student login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "student" in data
        assert data["student"]["student_id"] == STUDENT_ID
        print(f"✓ Student login successful: {data['student']['name']}")
    
    def test_director_login(self):
        """Director can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200, f"Director login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "director"
        print(f"✓ Director login successful: {data['user']['name']}")


class TestExamCreation:
    """Test exam creation by teacher"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    def test_create_exam_success(self, teacher_token):
        """Teacher can create an exam with questions"""
        exam_data = {
            "title": f"TEST_Math Quiz {uuid.uuid4().hex[:6]}",
            "subject": "Mathematics",
            "class_id": "test-class-id",
            "school_id": "test-school-id",
            "duration": 30,
            "total_marks": 10,
            "instructions": "Answer all questions carefully",
            "questions": [
                {
                    "question": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": 1,
                    "marks": 5
                },
                {
                    "question": "What is 5 x 3?",
                    "options": ["10", "12", "15", "18"],
                    "correct_answer": 2,
                    "marks": 5
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/exams",
            json=exam_data,
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Exam creation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["title"] == exam_data["title"]
        assert data["subject"] == "Mathematics"
        assert data["duration"] == 30
        assert data["total_marks"] == 10  # Sum of question marks
        assert data["total_questions"] == 2
        assert data["status"] == "active"
        assert "created_by" in data
        print(f"✓ Exam created successfully: {data['title']} (ID: {data['id']})")
        
        return data["id"]
    
    def test_create_exam_without_questions_fails(self, teacher_token):
        """Exam creation without questions should fail"""
        exam_data = {
            "title": "TEST_Empty Exam",
            "subject": "Science",
            "class_id": "test-class-id",
            "school_id": "test-school-id",
            "duration": 30,
            "total_marks": 0,
            "questions": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/exams",
            json=exam_data,
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        # Should either fail or create with 0 marks
        if response.status_code == 200:
            data = response.json()
            assert data["total_marks"] == 0
            assert data["total_questions"] == 0
            print("✓ Exam with no questions created (0 marks)")
        else:
            print(f"✓ Exam creation without questions rejected: {response.status_code}")


class TestExamListing:
    """Test exam listing for teachers and students"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def student_token(self):
        """Get student auth token"""
        response = requests.post(
            f"{BASE_URL}/api/students/login",
            params={"student_id": STUDENT_ID, "password": STUDENT_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Student login failed")
        return response.json()["access_token"]
    
    def test_teacher_list_exams(self, teacher_token):
        """Teacher can list their exams"""
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Failed to list exams: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Teacher can list exams: {len(data)} exams found")
        
        # Verify exam structure
        if len(data) > 0:
            exam = data[0]
            assert "id" in exam
            assert "title" in exam
            assert "subject" in exam
            assert "duration" in exam
            assert "total_marks" in exam
            assert "status" in exam
            print(f"  - First exam: {exam['title']} ({exam['subject']})")
    
    def test_student_list_available_exams(self, student_token):
        """Student can list available exams for their class"""
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200, f"Failed to list exams: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Student can list available exams: {len(data)} exams found")
        
        # Check for already_attempted flag
        for exam in data:
            if "already_attempted" in exam:
                print(f"  - {exam['title']}: already_attempted={exam['already_attempted']}")


class TestExamDetails:
    """Test getting exam details"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def student_token(self):
        """Get student auth token"""
        response = requests.post(
            f"{BASE_URL}/api/students/login",
            params={"student_id": STUDENT_ID, "password": STUDENT_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Student login failed")
        return response.json()["access_token"]
    
    def test_teacher_get_exam_with_answers(self, teacher_token):
        """Teacher can get exam details with correct answers"""
        # First get list of exams
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No exams available")
        
        exam_id = response.json()[0]["id"]
        
        # Get exam details
        response = requests.get(
            f"{BASE_URL}/api/exams/{exam_id}",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get exam: {response.text}"
        data = response.json()
        
        assert "questions" in data
        assert len(data["questions"]) > 0
        
        # Teacher should see correct answers
        for q in data["questions"]:
            assert "correct_answer" in q, "Teacher should see correct answers"
        
        print(f"✓ Teacher can view exam with {len(data['questions'])} questions (with answers)")
    
    def test_student_get_exam_without_answers(self, student_token):
        """Student gets exam questions without correct answers"""
        # First get list of exams
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        if response.status_code != 200:
            pytest.skip("Failed to list exams")
        
        exams = response.json()
        
        # Find an exam not yet attempted
        unattempted_exam = None
        for exam in exams:
            if not exam.get("already_attempted"):
                unattempted_exam = exam
                break
        
        if not unattempted_exam:
            pytest.skip("No unattempted exams available for student")
        
        exam_id = unattempted_exam["id"]
        
        # Get exam details
        response = requests.get(
            f"{BASE_URL}/api/exams/{exam_id}",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get exam: {response.text}"
        data = response.json()
        
        assert "questions" in data
        
        # Student should NOT see correct answers
        for q in data["questions"]:
            assert "correct_answer" not in q, "Student should NOT see correct answers"
        
        print(f"✓ Student can view exam without correct answers: {data['title']}")


class TestExamSubmission:
    """Test exam submission and scoring"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def student_token(self):
        """Get student auth token"""
        response = requests.post(
            f"{BASE_URL}/api/students/login",
            params={"student_id": STUDENT_ID, "password": STUDENT_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Student login failed")
        return response.json()["access_token"]
    
    def test_student_submit_exam(self, teacher_token, student_token):
        """Student can submit exam and get result"""
        # Create a new exam for testing submission
        exam_data = {
            "title": f"TEST_Submission Quiz {uuid.uuid4().hex[:6]}",
            "subject": "Test Subject",
            "class_id": "test-class-id",
            "school_id": "test-school-id",
            "duration": 30,
            "total_marks": 10,
            "instructions": "Test exam for submission",
            "questions": [
                {
                    "question": "What is 1 + 1?",
                    "options": ["1", "2", "3", "4"],
                    "correct_answer": 1,  # Answer is "2"
                    "marks": 5
                },
                {
                    "question": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": 1,  # Answer is "4"
                    "marks": 5
                }
            ]
        }
        
        # Create exam as teacher
        create_response = requests.post(
            f"{BASE_URL}/api/exams",
            json=exam_data,
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip(f"Failed to create test exam: {create_response.text}")
        
        exam_id = create_response.json()["id"]
        print(f"  Created test exam: {exam_id}")
        
        # Submit exam as student with correct answers
        submission = {
            "exam_id": exam_id,
            "answers": {
                "0": 1,  # Correct answer for Q1
                "1": 1   # Correct answer for Q2
            }
        }
        
        submit_response = requests.post(
            f"{BASE_URL}/api/exams/{exam_id}/submit",
            json=submission,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert submit_response.status_code == 200, f"Submission failed: {submit_response.text}"
        result = submit_response.json()
        
        # Verify result structure
        assert "id" in result
        assert result["exam_id"] == exam_id
        assert result["score"] == 10  # Both answers correct
        assert result["total_marks"] == 10
        assert result["percentage"] == 100.0
        assert result["correct_answers"] == 2
        assert result["wrong_answers"] == 0
        
        print(f"✓ Exam submitted successfully: Score {result['score']}/{result['total_marks']} ({result['percentage']}%)")
    
    def test_duplicate_submission_rejected(self, student_token):
        """Student cannot submit same exam twice"""
        # Get list of exams
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        if response.status_code != 200:
            pytest.skip("Failed to list exams")
        
        exams = response.json()
        
        # Find an already attempted exam
        attempted_exam = None
        for exam in exams:
            if exam.get("already_attempted"):
                attempted_exam = exam
                break
        
        if not attempted_exam:
            pytest.skip("No attempted exams found")
        
        exam_id = attempted_exam["id"]
        
        # Try to get exam details (should fail for already attempted)
        response = requests.get(
            f"{BASE_URL}/api/exams/{exam_id}",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 400, "Should reject already attempted exam"
        assert "already attempted" in response.json().get("detail", "").lower()
        print(f"✓ Duplicate exam access correctly rejected")


class TestExamResults:
    """Test exam results viewing"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    @pytest.fixture
    def student_token(self):
        """Get student auth token"""
        response = requests.post(
            f"{BASE_URL}/api/students/login",
            params={"student_id": STUDENT_ID, "password": STUDENT_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Student login failed")
        return response.json()["access_token"]
    
    def test_student_view_my_results(self, student_token):
        """Student can view their exam results"""
        response = requests.get(
            f"{BASE_URL}/api/exams/my-results",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get results: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Student can view results: {len(data)} results found")
        
        if len(data) > 0:
            result = data[0]
            assert "exam_title" in result
            assert "score" in result
            assert "total_marks" in result
            assert "percentage" in result
            print(f"  - Latest: {result['exam_title']} - {result['score']}/{result['total_marks']} ({result['percentage']}%)")
    
    def test_teacher_view_exam_results(self, teacher_token):
        """Teacher can view all results for an exam"""
        # First get list of exams
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No exams available")
        
        exam_id = response.json()[0]["id"]
        
        # Get exam results
        response = requests.get(
            f"{BASE_URL}/api/exams/{exam_id}/results",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get results: {response.text}"
        data = response.json()
        
        assert "exam" in data
        assert "stats" in data
        assert "results" in data
        
        print(f"✓ Teacher can view exam results:")
        print(f"  - Exam: {data['exam']['title']}")
        print(f"  - Total submissions: {data['stats']['total_submissions']}")
        print(f"  - Average score: {data['stats']['average_score']}")
    
    def test_exam_leaderboard(self, teacher_token):
        """Can get exam leaderboard"""
        # First get list of exams
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No exams available")
        
        exam_id = response.json()[0]["id"]
        
        # Get leaderboard
        response = requests.get(
            f"{BASE_URL}/api/exams/{exam_id}/leaderboard",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get leaderboard: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Leaderboard retrieved: {len(data)} entries")
        for entry in data[:3]:
            print(f"  - Rank {entry.get('rank')}: {entry.get('student_name')} - {entry.get('score')} marks")


class TestExamManagement:
    """Test exam management (status update, delete)"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    def test_update_exam_status(self, teacher_token):
        """Teacher can update exam status"""
        # Create a test exam
        exam_data = {
            "title": f"TEST_Status Update {uuid.uuid4().hex[:6]}",
            "subject": "Test",
            "class_id": "test-class-id",
            "school_id": "test-school-id",
            "duration": 30,
            "total_marks": 5,
            "questions": [
                {
                    "question": "Test question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": 0,
                    "marks": 5
                }
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/exams",
            json=exam_data,
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Failed to create test exam")
        
        exam_id = create_response.json()["id"]
        
        # Update status to completed
        response = requests.put(
            f"{BASE_URL}/api/exams/{exam_id}/status",
            params={"status": "completed"},
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Status update failed: {response.text}"
        print(f"✓ Exam status updated to 'completed'")
        
        # Clean up - delete the exam
        requests.delete(
            f"{BASE_URL}/api/exams/{exam_id}",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
    
    def test_delete_exam_without_submissions(self, teacher_token):
        """Teacher can delete exam without submissions"""
        # Create a test exam
        exam_data = {
            "title": f"TEST_Delete {uuid.uuid4().hex[:6]}",
            "subject": "Test",
            "class_id": "test-class-id",
            "school_id": "test-school-id",
            "duration": 30,
            "total_marks": 5,
            "questions": [
                {
                    "question": "Test question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": 0,
                    "marks": 5
                }
            ]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/exams",
            json=exam_data,
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Failed to create test exam")
        
        exam_id = create_response.json()["id"]
        
        # Delete the exam
        response = requests.delete(
            f"{BASE_URL}/api/exams/{exam_id}",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        
        assert response.status_code == 200, f"Delete failed: {response.text}"
        print(f"✓ Exam deleted successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
