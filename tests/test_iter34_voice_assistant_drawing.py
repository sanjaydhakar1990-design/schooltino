"""
Iteration 34 - Testing Voice Assistant Navigation, Drawing Chapters, AI BG Remove, Employee Login
=================================================================================================
Features to test:
1. Voice Assistant - Chat endpoint with 'admission form open karo' should return navigate_to /app/students
2. Voice Assistant - Chat endpoint with 'calendar kholo' should return navigate_to /app/school-calendar
3. Drawing chapters exist for Nursery_Drawing, LKG_Drawing, UKG_Drawing (frontend data check)
4. School Management Receipt Settings page loads with AI BG Remove buttons
5. Employee creation and login still working
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://erp-revival-1.preview.emergentagent.com').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@test.com"
DIRECTOR_PASSWORD = "test123"
SCHOOL_ID = "SCH-16CCFA4C"


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


class TestVoiceAssistantNavigation:
    """Test Voice Assistant navigation commands"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_voice_assistant_status(self, auth_token):
        """Test voice assistant status endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Voice Assistant Status: TTS={data.get('tts_available')}, STT={data.get('stt_available')}, AI={data.get('ai_available')}")
    
    def test_admission_form_navigation(self, auth_token):
        """Test 'admission form open karo' returns navigate_to /app/students"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/voice-assistant/chat", 
            headers=headers,
            json={
                "message": "admission form open karo",
                "school_id": SCHOOL_ID,
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Admission command response: {json.dumps(data, indent=2)}")
        
        # Verify navigation to students page
        assert data.get("navigate_to") == "/app/students", f"Expected /app/students, got {data.get('navigate_to')}"
        assert data.get("action_type") == "navigate"
        print(f"✓ 'admission form open karo' correctly navigates to /app/students")
    
    def test_calendar_navigation(self, auth_token):
        """Test 'calendar kholo' returns navigate_to /app/school-calendar"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/voice-assistant/chat", 
            headers=headers,
            json={
                "message": "calendar kholo",
                "school_id": SCHOOL_ID,
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Calendar command response: {json.dumps(data, indent=2)}")
        
        # Verify navigation to school calendar page
        assert data.get("navigate_to") == "/app/school-calendar", f"Expected /app/school-calendar, got {data.get('navigate_to')}"
        assert data.get("action_type") == "navigate"
        print(f"✓ 'calendar kholo' correctly navigates to /app/school-calendar")
    
    def test_employees_navigation(self, auth_token):
        """Test 'employees kholo' returns navigate_to /app/employee-management"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/voice-assistant/chat", 
            headers=headers,
            json={
                "message": "employees kholo",
                "school_id": SCHOOL_ID,
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Employees command response: {json.dumps(data, indent=2)}")
        
        # Verify navigation to employee management page
        assert data.get("navigate_to") == "/app/employee-management", f"Expected /app/employee-management, got {data.get('navigate_to')}"
        print(f"✓ 'employees kholo' correctly navigates to /app/employee-management")
    
    def test_timetable_navigation(self, auth_token):
        """Test 'timetable kholo' returns navigate_to /app/timetable"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/voice-assistant/chat", 
            headers=headers,
            json={
                "message": "timetable kholo",
                "school_id": SCHOOL_ID,
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Timetable command response: {json.dumps(data, indent=2)}")
        
        # Verify navigation to timetable page
        assert data.get("navigate_to") == "/app/timetable", f"Expected /app/timetable, got {data.get('navigate_to')}"
        print(f"✓ 'timetable kholo' correctly navigates to /app/timetable")
    
    def test_exams_navigation(self, auth_token):
        """Test 'exam kholo' returns navigate_to /app/online-exam"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/voice-assistant/chat", 
            headers=headers,
            json={
                "message": "exam kholo",
                "school_id": SCHOOL_ID,
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Exam command response: {json.dumps(data, indent=2)}")
        
        # Verify navigation to online exam page
        assert data.get("navigate_to") == "/app/online-exam", f"Expected /app/online-exam, got {data.get('navigate_to')}"
        print(f"✓ 'exam kholo' correctly navigates to /app/online-exam")


class TestAIBackgroundRemoveEndpoint:
    """Test AI Background Remove endpoint exists and is accessible"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_ai_remove_background_endpoint_exists(self, auth_token):
        """Test that AI remove background endpoint exists (without actual file)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # Send request without file to check endpoint exists
        response = requests.post(f"{BASE_URL}/api/school/ai-remove-background", 
            headers=headers,
            data={"image_type": "signature"}
        )
        # Should return 422 (validation error for missing file) not 404
        assert response.status_code in [422, 400], f"Expected 422 or 400, got {response.status_code}"
        print(f"✓ AI Background Remove endpoint exists (returns {response.status_code} for missing file)")


class TestEmployeeManagement:
    """Test Employee creation and login functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_get_employees_list(self, auth_token):
        """Test getting employees list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/employees?school_id={SCHOOL_ID}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # API returns list directly
        if isinstance(data, list):
            print(f"✓ Employees list retrieved: {len(data)} employees")
        else:
            print(f"✓ Employees list retrieved: {len(data.get('employees', []))} employees")
    
    def test_create_employee_with_login(self, auth_token):
        """Test creating employee with login credentials"""
        import uuid
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_id = uuid.uuid4().hex[:6]
        
        employee_data = {
            "name": f"TEST_Teacher_{unique_id}",
            "mobile": f"98765{unique_id[:5]}",
            "email": f"test_teacher_{unique_id}@test.com",
            "address": "Test Address",
            "school_id": SCHOOL_ID,
            "designation": "teacher",
            "department": "Mathematics",
            "qualification": "B.Ed",
            "joining_date": "2024-01-01",
            "salary": 25000,
            "create_login": True,
            "password": "test123",
            "role": "teacher"
        }
        
        response = requests.post(f"{BASE_URL}/api/employees", 
            headers=headers,
            json=employee_data
        )
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        print(f"✓ Employee created: {data.get('name')} with ID {data.get('employee_id')}")
        
        # Store for login test
        return {
            "email": employee_data["email"],
            "password": employee_data["password"],
            "employee_id": data.get("id")
        }
    
    def test_created_employee_can_login(self, auth_token):
        """Test that created employee can login"""
        import uuid
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_id = uuid.uuid4().hex[:6]
        
        # First create employee
        employee_data = {
            "name": f"TEST_LoginTest_{unique_id}",
            "mobile": f"91234{unique_id[:5]}",
            "email": f"test_login_{unique_id}@test.com",
            "address": "Test Address",
            "school_id": SCHOOL_ID,
            "designation": "teacher",
            "department": "Science",
            "qualification": "M.Sc",
            "joining_date": "2024-01-01",
            "salary": 30000,
            "create_login": True,
            "password": "logintest123",
            "role": "teacher"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/employees", 
            headers=headers,
            json=employee_data
        )
        assert create_response.status_code in [200, 201]
        
        # Now try to login with created employee
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": employee_data["email"],
            "password": employee_data["password"]
        })
        assert login_response.status_code == 200, f"Employee login failed: {login_response.text}"
        login_data = login_response.json()
        assert "access_token" in login_data
        assert login_data["user"]["role"] == "teacher"
        print(f"✓ Created employee can login successfully: {login_data['user']['name']}")


class TestSchoolManagementSettings:
    """Test School Management settings endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get auth token")
    
    def test_get_school_profile(self, auth_token):
        """Test getting school profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/schools/{SCHOOL_ID}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ School profile retrieved: {data.get('name')}")
    
    def test_get_payment_settings(self, auth_token):
        """Test getting payment settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/school/payment-settings?school_id={SCHOOL_ID}", headers=headers)
        assert response.status_code == 200
        print(f"✓ Payment settings retrieved")
    
    def test_get_academic_settings(self, auth_token):
        """Test getting academic settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/school/settings?school_id={SCHOOL_ID}", headers=headers)
        assert response.status_code == 200
        print(f"✓ Academic settings retrieved")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
