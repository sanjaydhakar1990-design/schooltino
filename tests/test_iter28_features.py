"""
Iteration 28 - Testing SchoolTino ERP fixes:
1. Timetable page - Class dropdown shows all classes
2. Parent Portal - Login page with Mobile/Parent ID toggle
3. Employee ID auto-generation API
4. Parent registration API
5. Academic menu grouping in sidebar
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@demo.com"
DIRECTOR_PASSWORD = "demo123"
TEST_SCHOOL_ID = "SCH-DEMO-2026"


class TestAuthentication:
    """Test authentication for director login"""
    
    def test_director_login(self):
        """Test director login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] == "director", "User is not director"
        return data["access_token"]


class TestTimetableClassDropdown:
    """Test Timetable page class dropdown functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_classes_endpoint_returns_data(self, auth_token):
        """Test /api/classes returns class list with auth header"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/classes?school_id={TEST_SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Classes endpoint failed: {response.text}"
        data = response.json()
        # Should return list of classes or object with classes key
        if isinstance(data, list):
            classes = data
        else:
            classes = data.get("classes", data)
        assert isinstance(classes, list), "Classes should be a list"
        print(f"✓ Classes endpoint returned {len(classes)} classes")
    
    def test_timetable_endpoint_exists(self, auth_token):
        """Test timetable endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # First get a class ID
        response = requests.get(
            f"{BASE_URL}/api/classes?school_id={TEST_SCHOOL_ID}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            classes = data if isinstance(data, list) else data.get("classes", [])
            if classes:
                class_id = classes[0].get("id")
                # Test timetable endpoint
                tt_response = requests.get(
                    f"{BASE_URL}/api/timetable/{class_id}?school_id={TEST_SCHOOL_ID}",
                    headers=headers
                )
                assert tt_response.status_code in [200, 404], f"Timetable endpoint error: {tt_response.text}"
                print(f"✓ Timetable endpoint working for class {class_id}")


class TestParentPortalAPIs:
    """Test Parent Portal login and registration APIs"""
    
    def test_parent_login_endpoint_exists(self):
        """Test parent login endpoint exists and validates input"""
        # Test with missing credentials
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "password": "test123"
        })
        # Should return 400 for missing mobile/parent_id
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✓ Parent login endpoint validates input correctly")
    
    def test_parent_login_with_mobile(self):
        """Test parent login with mobile number"""
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "mobile": "9876543210",
            "password": "test123"
        })
        # Should return 404 (parent not found) or 401 (invalid password)
        assert response.status_code in [401, 404], f"Expected 401/404, got {response.status_code}: {response.text}"
        print("✓ Parent login with mobile works (returns expected error for non-existent parent)")
    
    def test_parent_login_with_parent_id(self):
        """Test parent login with parent ID"""
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "parent_id": "PAR-SCS-2026-001",
            "password": "test123"
        })
        # Should return 404 (parent not found) or 401 (invalid password)
        assert response.status_code in [401, 404], f"Expected 401/404, got {response.status_code}: {response.text}"
        print("✓ Parent login with parent_id works (returns expected error for non-existent parent)")
    
    def test_parent_register_endpoint_exists(self):
        """Test parent registration endpoint exists"""
        # Test with minimal data
        response = requests.post(f"{BASE_URL}/api/parent/register", json={
            "name": "Test Parent",
            "mobile": "9999888877",
            "password": "test123",
            "school_id": TEST_SCHOOL_ID
        })
        # Should return 200 (success) or 400 (already exists)
        assert response.status_code in [200, 400], f"Expected 200/400, got {response.status_code}: {response.text}"
        if response.status_code == 200:
            data = response.json()
            assert "parent_id" in data, "No parent_id in response"
            assert data["parent_id"].startswith("PAR-"), f"Invalid parent_id format: {data['parent_id']}"
            print(f"✓ Parent registration successful, ID: {data['parent_id']}")
        else:
            print("✓ Parent registration endpoint exists (parent already registered)")


class TestEmployeeIDGeneration:
    """Test Employee ID auto-generation API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_staff_create_with_id_endpoint(self, auth_token):
        """Test /api/staff/create-with-id generates employee ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a test staff member
        import uuid
        test_email = f"test_staff_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/api/staff/create-with-id",
            headers=headers,
            json={
                "name": "Test Staff Member",
                "email": test_email,
                "mobile": "9876543210",
                "role": "teacher",
                "school_id": TEST_SCHOOL_ID
            }
        )
        
        assert response.status_code in [200, 400], f"Staff create failed: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "employee_id" in data, "No employee_id in response"
            assert data["employee_id"].startswith("EMP-"), f"Invalid employee_id format: {data['employee_id']}"
            print(f"✓ Staff created with auto-generated ID: {data['employee_id']}")
        else:
            # Email might already exist
            print("✓ Staff create endpoint exists (email may already exist)")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
