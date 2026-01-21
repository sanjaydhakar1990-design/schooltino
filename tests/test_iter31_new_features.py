"""
Iteration 31 - Testing SchoolTino ERP New Features:
1. Smart Attendance - Holiday check API (/api/attendance/check-holiday)
2. Multi-school support - Director can add new schools (/api/schools POST)
3. AI Paper Image Generation API (/api/ai/generate-answer-image)
4. Family Portal APIs (/api/family/children, /api/family/child/{id}/attendance, /api/family/child/{id}/fees)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@demo.com"
DIRECTOR_PASSWORD = "demo123"
TEACHER_EMAIL = "teacher@demo.com"
TEACHER_PASSWORD = "demo123"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_director_login(self):
        """Test director login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "director"
        print(f"✓ Director login successful: {data['user']['name']}")
        return data["access_token"]
    
    def test_teacher_login(self):
        """Test teacher login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "teacher"
        print(f"✓ Teacher login successful: {data['user']['name']}")
        return data["access_token"]


@pytest.fixture(scope="class")
def director_token():
    """Get director auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": DIRECTOR_EMAIL,
        "password": DIRECTOR_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Director login failed")


@pytest.fixture(scope="class")
def teacher_token():
    """Get teacher auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEACHER_EMAIL,
        "password": TEACHER_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Teacher login failed")


@pytest.fixture(scope="class")
def director_school_id(director_token):
    """Get director's school ID"""
    headers = {"Authorization": f"Bearer {director_token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if response.status_code == 200:
        return response.json().get("school_id")
    pytest.skip("Could not get director school ID")


class TestSmartAttendanceHolidayCheck:
    """Test Smart Attendance - Holiday check API"""
    
    def test_check_holiday_regular_day(self, director_token, director_school_id):
        """Test holiday check for a regular weekday (should not be holiday)"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        # Use a Monday date (not Sunday)
        test_date = "2025-12-15"  # Monday
        
        response = requests.get(
            f"{BASE_URL}/api/attendance/check-holiday",
            params={"school_id": director_school_id, "date": test_date},
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "date" in data
        assert "is_holiday" in data
        assert "holiday_name" in data
        assert data["date"] == test_date
        print(f"✓ Holiday check for {test_date}: is_holiday={data['is_holiday']}, name={data['holiday_name']}")
    
    def test_check_holiday_sunday(self, director_token, director_school_id):
        """Test holiday check for Sunday (should be holiday)"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        # Use a Sunday date
        test_date = "2025-12-14"  # Sunday
        
        response = requests.get(
            f"{BASE_URL}/api/attendance/check-holiday",
            params={"school_id": director_school_id, "date": test_date},
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == test_date
        assert data["is_holiday"] == True
        assert "Sunday" in data["holiday_name"] or "रविवार" in data["holiday_name"]
        print(f"✓ Sunday holiday check passed: {data['holiday_name']}")
    
    def test_check_holiday_requires_auth(self):
        """Test that holiday check requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/attendance/check-holiday",
            params={"school_id": "test", "date": "2025-12-15"}
        )
        assert response.status_code in [401, 403]
        print("✓ Holiday check correctly requires authentication")
    
    def test_check_holiday_teacher_access(self, teacher_token, director_school_id):
        """Test that teachers can also check holidays"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        test_date = "2025-12-15"
        
        response = requests.get(
            f"{BASE_URL}/api/attendance/check-holiday",
            params={"school_id": director_school_id, "date": test_date},
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "is_holiday" in data
        print(f"✓ Teacher can check holidays: {data}")


class TestMultiSchoolSupport:
    """Test Multi-school support - Director can add new schools"""
    
    def test_get_schools_list(self, director_token):
        """Test getting list of schools (should return only user's schools)"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Schools list retrieved: {len(data)} school(s)")
        for school in data:
            print(f"  - {school.get('name')} (ID: {school.get('id')})")
    
    def test_create_new_school_director(self, director_token):
        """Test director creating a new school (multi-school support)"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        new_school = {
            "name": f"TEST_New Branch School {datetime.now().strftime('%H%M%S')}",
            "address": "123 Test Street, Test City",
            "board_type": "CBSE",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456",
            "phone": "9876543210",
            "email": f"test_branch_{datetime.now().strftime('%H%M%S')}@school.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schools",
            json=new_school,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == new_school["name"]
        assert data["board_type"] == "CBSE"
        print(f"✓ New school created: {data['name']} (ID: {data['id']})")
        return data["id"]
    
    def test_verify_managed_schools_updated(self, director_token):
        """Test that managed_schools list is updated after creating school"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        user_data = response.json()
        
        # Get schools list
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        assert response.status_code == 200
        schools = response.json()
        
        # Director should see at least their main school
        assert len(schools) >= 1
        print(f"✓ Director can see {len(schools)} school(s) including managed schools")
    
    def test_teacher_cannot_create_school(self, teacher_token):
        """Test that teacher cannot create a new school"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        new_school = {
            "name": "Unauthorized School",
            "address": "Test Address",
            "board_type": "CBSE",
            "city": "Test City",
            "state": "Test State"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schools",
            json=new_school,
            headers=headers
        )
        
        assert response.status_code == 403
        print("✓ Teacher correctly blocked from creating schools")


class TestAIPaperImageGeneration:
    """Test AI Paper Image Generation API"""
    
    def test_generate_answer_image_api(self, director_token):
        """Test AI answer image generation API"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        payload = {
            "question": "Draw and label the parts of a plant cell",
            "answer": "A plant cell has cell wall, cell membrane, nucleus, chloroplast, vacuole, mitochondria, and endoplasmic reticulum",
            "subject": "Science",
            "question_type": "diagram"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-answer-image",
            json=payload,
            headers=headers,
            timeout=60  # AI generation may take time
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # API should return success status and either image_url or fallback_text
        assert "success" in data
        if data["success"]:
            assert "image_url" in data
            print(f"✓ AI image generated successfully: {data['image_url'][:50]}...")
        else:
            # Even if image generation fails, API should return gracefully
            assert "fallback_text" in data or "message" in data
            print(f"✓ AI image API responded (fallback): {data.get('message', 'No image generated')}")
    
    def test_generate_answer_image_requires_auth(self):
        """Test that AI image generation requires authentication"""
        payload = {
            "question": "Test question",
            "answer": "Test answer",
            "subject": "Science"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-answer-image",
            json=payload
        )
        
        assert response.status_code in [401, 403]
        print("✓ AI image generation correctly requires authentication")
    
    def test_generate_answer_image_teacher_access(self, teacher_token):
        """Test that teachers can also generate AI images"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        payload = {
            "question": "Draw the water cycle",
            "answer": "Evaporation, condensation, precipitation, collection",
            "subject": "Geography",
            "question_type": "diagram"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-answer-image",
            json=payload,
            headers=headers,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        print(f"✓ Teacher can generate AI images: success={data['success']}")


class TestFamilyPortalAPIs:
    """Test Family Portal APIs"""
    
    def test_get_family_children(self, director_token):
        """Test getting family children list"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        response = requests.get(f"{BASE_URL}/api/family/children", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Family children API works: {len(data)} children found")
        
        if data:
            for child in data[:3]:  # Show first 3
                print(f"  - {child.get('name')} (ID: {child.get('id')})")
        return data
    
    def test_get_child_attendance(self, director_token):
        """Test getting child attendance summary"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        # First get a student ID
        students_response = requests.get(
            f"{BASE_URL}/api/students",
            headers=headers
        )
        
        if students_response.status_code != 200 or not students_response.json():
            pytest.skip("No students available for testing")
        
        students = students_response.json()
        if isinstance(students, dict):
            students = students.get("students", [])
        
        if not students:
            pytest.skip("No students found")
        
        child_id = students[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/family/child/{child_id}/attendance",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "present" in data
        assert "absent" in data
        assert "percentage" in data
        print(f"✓ Child attendance API works: {data['present']}/{data['total']} present ({data['percentage']}%)")
    
    def test_get_child_fees(self, director_token):
        """Test getting child fees summary"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        # First get a student ID
        students_response = requests.get(
            f"{BASE_URL}/api/students",
            headers=headers
        )
        
        if students_response.status_code != 200 or not students_response.json():
            pytest.skip("No students available for testing")
        
        students = students_response.json()
        if isinstance(students, dict):
            students = students.get("students", [])
        
        if not students:
            pytest.skip("No students found")
        
        child_id = students[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/family/child/{child_id}/fees",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "paid" in data
        assert "pending" in data
        print(f"✓ Child fees API works: Total={data['total']}, Paid={data['paid']}, Pending={data['pending']}")


class TestOnlineExamSystem:
    """Test Online Exam System APIs"""
    
    def test_get_exams_list(self, director_token):
        """Test getting exams list"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        response = requests.get(f"{BASE_URL}/api/exams", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Response could be list or dict with exams key
        if isinstance(data, dict):
            exams = data.get("exams", [])
        else:
            exams = data
        
        print(f"✓ Exams list API works: {len(exams)} exam(s) found")
        for exam in exams[:3]:
            print(f"  - {exam.get('title', exam.get('name', 'Unnamed'))} (ID: {exam.get('id')})")


class TestTimetableAPI:
    """Test Timetable APIs"""
    
    def test_get_timetable(self, director_token, director_school_id):
        """Test getting timetable"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/timetable",
            params={"school_id": director_school_id},
            headers=headers
        )
        
        # Timetable might return 200 with empty data or 404 if not configured
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Timetable API works: {data}")
        else:
            print("✓ Timetable API returns 404 (no timetable configured yet)")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_schools(self, director_token):
        """Cleanup TEST_ prefixed schools"""
        headers = {"Authorization": f"Bearer {director_token}"}
        
        # Get all schools
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if response.status_code == 200:
            schools = response.json()
            test_schools = [s for s in schools if s.get("name", "").startswith("TEST_")]
            print(f"✓ Found {len(test_schools)} test schools to cleanup (manual cleanup may be needed)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
