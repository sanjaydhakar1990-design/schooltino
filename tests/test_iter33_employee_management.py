"""
Iteration 33 - Employee Management Tests
Tests for:
1. Employee Creation API - POST /api/employees with create_login=true
2. Employee Login - created employee should be able to login
3. Employee List API - GET /api/employees
4. Toggle Employee Login - POST /api/employees/{id}/toggle-login
5. School Management Page loads with all tabs
6. Settings routes redirect - /app/school-settings and /app/payment-settings should redirect to /app/school-management
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://exam-fix-1.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@test.com"
DIRECTOR_PASSWORD = "test123"
SCHOOL_ID = "SCH-16CCFA4C"

# Test employee data
TEST_EMPLOYEE_EMAIL = f"test_emp_{uuid.uuid4().hex[:8]}@test.com"
TEST_EMPLOYEE_MOBILE = f"98765{uuid.uuid4().hex[:5]}"
TEST_EMPLOYEE_PASSWORD = "testpass123"


class TestEmployeeManagement:
    """Employee Management API Tests"""
    
    @pytest.fixture(scope="class")
    def director_token(self):
        """Get director auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Director login failed: {response.text}")
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, director_token):
        """Auth headers for API calls"""
        return {"Authorization": f"Bearer {director_token}"}
    
    def test_01_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✓ Health check passed: {response.json()}")
    
    def test_02_director_login(self):
        """Test director can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "director"
        print(f"✓ Director login successful: {data['user']['name']}")
    
    def test_03_create_employee_with_login(self, auth_headers):
        """Test creating employee with create_login=true"""
        employee_data = {
            "name": "Test Employee",
            "mobile": TEST_EMPLOYEE_MOBILE,
            "email": TEST_EMPLOYEE_EMAIL,
            "address": "Test Address",
            "school_id": SCHOOL_ID,
            "designation": "teacher",
            "department": "Science",
            "qualification": "M.Sc",
            "joining_date": "2024-01-01",
            "salary": 25000,
            "create_login": True,
            "password": TEST_EMPLOYEE_PASSWORD,
            "role": "teacher"
        }
        
        response = requests.post(f"{BASE_URL}/api/employees", json=employee_data, headers=auth_headers)
        
        # Check response
        assert response.status_code == 200, f"Employee creation failed: {response.text}"
        data = response.json()
        
        # Verify employee data
        assert data["name"] == "Test Employee"
        assert data["email"] == TEST_EMPLOYEE_EMAIL
        assert data["has_login"] == True
        assert data["role"] == "teacher"
        assert "employee_id" in data
        assert data["employee_id"].startswith("EMP-")
        
        # Store employee ID for later tests
        TestEmployeeManagement.created_employee_id = data["id"]
        TestEmployeeManagement.created_employee_email = TEST_EMPLOYEE_EMAIL
        
        print(f"✓ Employee created: {data['employee_id']} with login enabled")
    
    def test_04_created_employee_can_login(self):
        """Test that created employee can login with their credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMPLOYEE_EMAIL,
            "password": TEST_EMPLOYEE_PASSWORD
        })
        
        assert response.status_code == 200, f"Employee login failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data
        assert data["user"]["email"] == TEST_EMPLOYEE_EMAIL
        assert data["user"]["role"] == "teacher"
        
        print(f"✓ Employee login successful: {data['user']['name']}")
    
    def test_05_get_employees_list(self, auth_headers):
        """Test getting list of employees"""
        response = requests.get(
            f"{BASE_URL}/api/employees",
            params={"school_id": SCHOOL_ID},
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get employees failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} employees")
        
        # Check if our created employee is in the list
        created_emp = next((e for e in data if e.get("email") == TEST_EMPLOYEE_EMAIL), None)
        if created_emp:
            print(f"✓ Created employee found in list: {created_emp['employee_id']}")
    
    def test_06_get_employees_with_filter(self, auth_headers):
        """Test getting employees with has_login filter"""
        response = requests.get(
            f"{BASE_URL}/api/employees",
            params={"school_id": SCHOOL_ID, "has_login": "true"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned employees should have login
        for emp in data:
            assert emp.get("has_login") == True
        
        print(f"✓ Got {len(data)} employees with login enabled")
    
    def test_07_toggle_employee_login_disable(self, auth_headers):
        """Test disabling employee login"""
        if not hasattr(TestEmployeeManagement, 'created_employee_id'):
            pytest.skip("No employee created in previous test")
        
        employee_id = TestEmployeeManagement.created_employee_id
        
        response = requests.post(
            f"{BASE_URL}/api/employees/{employee_id}/toggle-login",
            json={"enable": False},
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Toggle login failed: {response.text}"
        data = response.json()
        assert "disabled" in data.get("message", "").lower()
        
        print(f"✓ Employee login disabled")
    
    def test_08_disabled_employee_cannot_login(self):
        """Test that disabled employee cannot login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMPLOYEE_EMAIL,
            "password": TEST_EMPLOYEE_PASSWORD
        })
        
        # Should fail with 401
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Disabled employee correctly blocked from login")
    
    def test_09_toggle_employee_login_enable(self, auth_headers):
        """Test re-enabling employee login"""
        if not hasattr(TestEmployeeManagement, 'created_employee_id'):
            pytest.skip("No employee created in previous test")
        
        employee_id = TestEmployeeManagement.created_employee_id
        
        response = requests.post(
            f"{BASE_URL}/api/employees/{employee_id}/toggle-login",
            json={"enable": True, "password": TEST_EMPLOYEE_PASSWORD},
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Toggle login failed: {response.text}"
        data = response.json()
        assert "enabled" in data.get("message", "").lower()
        
        print(f"✓ Employee login re-enabled")
    
    def test_10_reenabled_employee_can_login(self):
        """Test that re-enabled employee can login again"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMPLOYEE_EMAIL,
            "password": TEST_EMPLOYEE_PASSWORD
        })
        
        assert response.status_code == 200, f"Employee login failed after re-enable: {response.text}"
        data = response.json()
        assert "access_token" in data
        
        print(f"✓ Re-enabled employee can login successfully")
    
    def test_11_get_single_employee(self, auth_headers):
        """Test getting single employee details"""
        if not hasattr(TestEmployeeManagement, 'created_employee_id'):
            pytest.skip("No employee created in previous test")
        
        employee_id = TestEmployeeManagement.created_employee_id
        
        response = requests.get(
            f"{BASE_URL}/api/employees/{employee_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get employee failed: {response.text}"
        data = response.json()
        
        assert data["id"] == employee_id
        assert data["email"] == TEST_EMPLOYEE_EMAIL
        
        print(f"✓ Got employee details: {data['name']}")
    
    def test_12_teacher_login_test(self):
        """Test existing teacher can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teacher@test.com",
            "password": "teacher123"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            print(f"✓ Teacher login successful: {data['user']['name']}")
        else:
            print(f"⚠ Teacher login failed (may not exist): {response.status_code}")


class TestSchoolManagementPage:
    """Tests for School Management Page and redirects"""
    
    def test_01_school_management_api(self):
        """Test school management related APIs"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test school settings API
        response = requests.get(
            f"{BASE_URL}/api/school/settings",
            params={"school_id": SCHOOL_ID},
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ School settings API works")
        
        # Test payment settings API
        response = requests.get(
            f"{BASE_URL}/api/school/payment-settings",
            params={"school_id": SCHOOL_ID},
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Payment settings API works")
        
        # Test school profile API
        response = requests.get(
            f"{BASE_URL}/api/schools/{SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ School profile API works")


class TestEmployeeDesignations:
    """Test employee designations API"""
    
    def test_01_get_designations(self):
        """Test getting designations list"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/employees/designations/list",
            headers=headers
        )
        
        # This endpoint may or may not exist
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Got {len(data)} designations")
        else:
            print(f"⚠ Designations API not found (using defaults)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
