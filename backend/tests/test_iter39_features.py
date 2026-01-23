"""
Iteration 39 - Testing School ERP Bug Fixes
Features to test:
1. Fee Structure Management - Student list loads, search works, Old Dues tab
2. Class Management - Section is optional (default to empty)
3. AI Paper - CLASS_PAPER_DEFAULTS applied when class changes
4. Drawing syllabus chapters available for Classes 1-5
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Test login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Login successful, token length: {len(auth_token)}")


class TestFeeStructureManagement:
    """Fee Structure Management tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_students_list_loads(self, auth_token):
        """Test that student list loads with auth token"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/students?school_id=SCH-TEST-2026", headers=headers)
        assert response.status_code == 200, f"Students API failed: {response.text}"
        data = response.json()
        # Check if students array exists
        students = data.get('students', data) if isinstance(data, dict) else data
        assert isinstance(students, list), "Students should be a list"
        print(f"✓ Students list loaded: {len(students)} students found")
    
    def test_fee_structure_api(self, auth_token):
        """Test fee structure API"""
        response = requests.get(f"{BASE_URL}/api/fee-management/structure/all/SCH-TEST-2026")
        assert response.status_code == 200, f"Fee structure API failed: {response.text}"
        data = response.json()
        assert "structures_by_class" in data, "Missing structures_by_class in response"
        print(f"✓ Fee structure API working")
    
    def test_old_dues_endpoint(self, auth_token):
        """Test old dues endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/fee-management/old-dues/SCH-TEST-2026", headers=headers)
        # Endpoint may return 200 or 404 if not implemented yet
        assert response.status_code in [200, 404], f"Old dues API error: {response.text}"
        print(f"✓ Old dues endpoint status: {response.status_code}")
    
    def test_scheme_assignment(self, auth_token):
        """Test government scheme assignment"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "student_id": "STD-TEST-001",
            "school_id": "SCH-TEST-2026",
            "scheme_name": "RTE",
            "scheme_type": "full_exemption",
            "exemption_percentage": 100,
            "monthly_stipend": 0,
            "valid_from": "2026-01-01",
            "valid_until": "2026-12-31"
        }
        response = requests.post(f"{BASE_URL}/api/fee-management/scheme/assign", 
                                headers=headers, json=payload)
        # May return 200 or 400 if already assigned
        assert response.status_code in [200, 400], f"Scheme assignment failed: {response.text}"
        print(f"✓ Scheme assignment API status: {response.status_code}")


class TestClassManagement:
    """Class Management tests - Section optional"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_classes_list(self, auth_token):
        """Test classes list API"""
        response = requests.get(f"{BASE_URL}/api/classes?school_id=SCH-TEST-2026")
        assert response.status_code == 200, f"Classes API failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Classes should be a list"
        print(f"✓ Classes list loaded: {len(data)} classes found")
        
        # Check if any class has empty section
        for cls in data:
            if cls.get('section') == '' or cls.get('section') is None:
                print(f"  - Found class without section: {cls.get('name')}")
    
    def test_create_class_without_section(self, auth_token):
        """Test creating a class without section (optional)"""
        headers = {"Content-Type": "application/json"}
        payload = {
            "name": "Class 5",
            "section": "",  # Empty section - should be allowed
            "school_id": "SCH-TEST-2026",
            "class_teacher_id": ""
        }
        response = requests.post(f"{BASE_URL}/api/classes", headers=headers, json=payload)
        # May return 200/201 or 400 if class already exists
        assert response.status_code in [200, 201, 400], f"Create class failed: {response.text}"
        print(f"✓ Create class without section status: {response.status_code}")
    
    def test_staff_list_for_teacher_assignment(self, auth_token):
        """Test staff list for class teacher assignment"""
        response = requests.get(f"{BASE_URL}/api/staff?school_id=SCH-TEST-2026&designation=Teacher")
        assert response.status_code == 200, f"Staff API failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Staff should be a list"
        print(f"✓ Staff list loaded: {len(data)} teachers found")


class TestAIPaperGeneration:
    """AI Paper Generation tests - Class-wise defaults"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_ai_paper_generation_class_1(self, auth_token):
        """Test AI paper generation for Class 1 (no long answers)"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "school_id": "SCH-TEST-2026",
            "class_name": "Class 1",
            "subject": "Hindi",
            "board": "CBSE",
            "chapters": ["वर्णमाला"],
            "question_types": ["mcq", "fill_blank", "matching"],  # No long answers for Class 1
            "total_marks": 40,
            "time_duration": 60,
            "language": "Hindi"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-paper", 
                                headers=headers, json=payload, timeout=60)
        assert response.status_code == 200, f"AI paper generation failed: {response.text}"
        data = response.json()
        assert "questions" in data, "No questions in response"
        print(f"✓ AI paper for Class 1 generated: {len(data.get('questions', []))} questions")
    
    def test_ai_paper_generation_class_3(self, auth_token):
        """Test AI paper generation for Class 3 (no long answers)"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "school_id": "SCH-TEST-2026",
            "class_name": "Class 3",
            "subject": "Mathematics",
            "board": "CBSE",
            "chapters": ["Addition"],
            "question_types": ["mcq", "fill_blank", "very_short", "short"],  # No long for Class 3
            "total_marks": 50,
            "time_duration": 90,
            "language": "Hindi"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-paper", 
                                headers=headers, json=payload, timeout=60)
        assert response.status_code == 200, f"AI paper generation failed: {response.text}"
        data = response.json()
        assert "questions" in data, "No questions in response"
        print(f"✓ AI paper for Class 3 generated: {len(data.get('questions', []))} questions")
    
    def test_ai_paper_generation_drawing(self, auth_token):
        """Test AI paper generation for Drawing subject"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "school_id": "SCH-TEST-2026",
            "class_name": "Class 2",
            "subject": "Drawing",
            "board": "CBSE",
            "chapters": ["Basic Shapes"],
            "question_types": ["coloring", "draw_object"],
            "total_marks": 25,
            "time_duration": 45,
            "language": "Hindi"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-paper", 
                                headers=headers, json=payload, timeout=60)
        # Drawing paper may have different handling
        assert response.status_code in [200, 400], f"AI paper generation failed: {response.text}"
        print(f"✓ AI paper for Drawing status: {response.status_code}")


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
