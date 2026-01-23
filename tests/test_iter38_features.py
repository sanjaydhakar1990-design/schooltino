"""
Iteration 38 - Testing:
1. AI Paper Generation API - POST /api/ai/generate-paper
2. Fee Scholarship Assignment - POST /api/fee-management/scheme/assign
3. Drawing chapters available for Classes 1-5
4. AI Paper page loads with board selection
5. Print layout dropdown on paper preview
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIPaperGeneration:
    """Test AI Paper Generation API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Login failed - skipping authenticated tests")
    
    def test_ai_generate_paper_hindi(self):
        """Test AI paper generation in Hindi"""
        payload = {
            "subject": "Hindi",
            "class_name": "Class 5",
            "chapter": "वह चिड़िया जो",
            "chapters": ["वह चिड़िया जो"],
            "exam_name": "Unit Test 1",
            "difficulty": "medium",
            "question_types": ["mcq", "short"],
            "total_marks": 40,
            "time_duration": 60,
            "language": "hindi",
            "marks_config": {"mcq": 1, "short": 2},
            "syllabus_year": "2024-25",
            "board": "CBSE"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-paper",
            json=payload,
            headers=self.headers,
            timeout=120  # AI generation can take time
        )
        
        print(f"AI Paper Generation Response Status: {response.status_code}")
        
        # Check status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Validate response structure
        data = response.json()
        assert "questions" in data, "Response should contain 'questions'"
        assert len(data["questions"]) > 0, "Should generate at least 1 question"
        
        # Validate question structure
        first_question = data["questions"][0]
        assert "question" in first_question, "Question should have 'question' field"
        assert "marks" in first_question, "Question should have 'marks' field"
        
        print(f"Generated {len(data['questions'])} questions successfully")
    
    def test_ai_generate_paper_english(self):
        """Test AI paper generation in English"""
        payload = {
            "subject": "Mathematics",
            "class_name": "Class 8",
            "chapter": "Rational Numbers",
            "chapters": ["Rational Numbers"],
            "exam_name": "Half Yearly",
            "difficulty": "medium",
            "question_types": ["mcq", "short", "long"],
            "total_marks": 80,
            "time_duration": 180,
            "language": "english",
            "marks_config": {"mcq": 1, "short": 3, "long": 5},
            "syllabus_year": "2024-25",
            "board": "CBSE"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-paper",
            json=payload,
            headers=self.headers,
            timeout=120
        )
        
        print(f"AI Paper Generation (English) Response Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "questions" in data
        print(f"Generated {len(data['questions'])} questions in English")


class TestFeeScholarshipAssignment:
    """Test Fee Scholarship Assignment API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.school_id = login_response.json().get("user", {}).get("school_id", "SCH-TEST-2026")
        else:
            pytest.skip("Login failed - skipping authenticated tests")
    
    def test_get_available_schemes(self):
        """Test getting available government schemes"""
        response = requests.get(
            f"{BASE_URL}/api/fee-management/schemes/available",
            headers=self.headers
        )
        
        print(f"Available Schemes Response Status: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "schemes" in data, "Response should contain 'schemes'"
        
        # Check for expected schemes
        scheme_codes = [s["code"] for s in data["schemes"]]
        assert "RTE" in scheme_codes, "RTE scheme should be available"
        assert "SC_ST_SCHOLARSHIP" in scheme_codes, "SC/ST Scholarship should be available"
        assert "OBC_SCHOLARSHIP" in scheme_codes, "OBC Scholarship should be available"
        
        print(f"Found {len(data['schemes'])} available schemes: {scheme_codes}")
    
    def test_assign_rte_scheme(self):
        """Test assigning RTE scheme to a student"""
        # First get a student
        students_response = requests.get(
            f"{BASE_URL}/api/students?school_id={self.school_id}&limit=1",
            headers=self.headers
        )
        
        if students_response.status_code != 200:
            pytest.skip("Could not fetch students")
        
        students_data = students_response.json()
        students = students_data.get("students", students_data) if isinstance(students_data, dict) else students_data
        
        if not students or len(students) == 0:
            pytest.skip("No students found for testing")
        
        student = students[0]
        student_id = student.get("id") or student.get("student_id")
        
        # Assign RTE scheme
        payload = {
            "student_id": student_id,
            "school_id": self.school_id,
            "scheme_name": "RTE",
            "scheme_type": "full_exemption",
            "exemption_percentage": 100,
            "monthly_stipend": 0,
            "valid_from": "2024-04-01",
            "valid_until": "2025-03-31"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/fee-management/scheme/assign",
            json=payload,
            headers=self.headers
        )
        
        print(f"RTE Scheme Assignment Response Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Assignment should be successful"
        assert "scheme_id" in data, "Response should contain scheme_id"
        
        print(f"RTE scheme assigned successfully to student {student_id}")
    
    def test_assign_obc_scholarship(self):
        """Test assigning OBC Scholarship to a student"""
        # Get a student
        students_response = requests.get(
            f"{BASE_URL}/api/students?school_id={self.school_id}&limit=2",
            headers=self.headers
        )
        
        if students_response.status_code != 200:
            pytest.skip("Could not fetch students")
        
        students_data = students_response.json()
        students = students_data.get("students", students_data) if isinstance(students_data, dict) else students_data
        
        if not students or len(students) == 0:
            pytest.skip("No students found for testing")
        
        # Use second student if available, else first
        student = students[1] if len(students) > 1 else students[0]
        student_id = student.get("id") or student.get("student_id")
        
        # Assign OBC Scholarship
        payload = {
            "student_id": student_id,
            "school_id": self.school_id,
            "scheme_name": "OBC_SCHOLARSHIP",
            "scheme_type": "partial_exemption",
            "exemption_percentage": 50,
            "monthly_stipend": 0,
            "valid_from": "2024-04-01",
            "valid_until": "2025-03-31"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/fee-management/scheme/assign",
            json=payload,
            headers=self.headers
        )
        
        print(f"OBC Scholarship Assignment Response Status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"OBC Scholarship assigned successfully to student {student_id}")
    
    def test_get_student_schemes(self):
        """Test getting schemes assigned to a student"""
        # Get a student
        students_response = requests.get(
            f"{BASE_URL}/api/students?school_id={self.school_id}&limit=1",
            headers=self.headers
        )
        
        if students_response.status_code != 200:
            pytest.skip("Could not fetch students")
        
        students_data = students_response.json()
        students = students_data.get("students", students_data) if isinstance(students_data, dict) else students_data
        
        if not students or len(students) == 0:
            pytest.skip("No students found for testing")
        
        student = students[0]
        student_id = student.get("id") or student.get("student_id")
        
        response = requests.get(
            f"{BASE_URL}/api/fee-management/scheme/student/{student_id}",
            headers=self.headers
        )
        
        print(f"Get Student Schemes Response Status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "schemes" in data, "Response should contain 'schemes'"
        print(f"Student has {len(data['schemes'])} schemes assigned")


class TestFeeStructureManagement:
    """Test Fee Structure Management APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.school_id = login_response.json().get("user", {}).get("school_id", "SCH-TEST-2026")
        else:
            pytest.skip("Login failed - skipping authenticated tests")
    
    def test_get_all_fee_structures(self):
        """Test getting all fee structures for a school"""
        response = requests.get(
            f"{BASE_URL}/api/fee-management/structure/all/{self.school_id}",
            headers=self.headers
        )
        
        print(f"Get All Fee Structures Response Status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "structures_by_class" in data, "Response should contain 'structures_by_class'"
        print(f"Found fee structures for {len(data.get('classes', []))} classes")
    
    def test_create_fee_structure(self):
        """Test creating a fee structure for a class"""
        payload = {
            "school_id": self.school_id,
            "class_id": "5",
            "fee_type": "tuition",
            "amount": 2500,
            "frequency": "monthly",
            "due_day": 10,
            "description": "Monthly Tuition Fee",
            "is_optional": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/fee-management/structure/create",
            json=payload,
            headers=self.headers
        )
        
        print(f"Create Fee Structure Response Status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"Fee structure created/updated: {data.get('message')}")


class TestHealthAndBasicAPIs:
    """Test basic health and API endpoints"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        print(f"Health Check Response Status: {response.status_code}")
        assert response.status_code == 200
    
    def test_login(self):
        """Test login endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        
        print(f"Login Response Status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
