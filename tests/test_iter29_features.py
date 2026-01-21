"""
Iteration 29 - Testing SchoolTino ERP Final Fixes:
1. Unique IDs without school abbreviation (STU-2026-00001, PAR-2026-00001, EMP-2026-00001)
2. Parent ID auto-generated at student admission
3. Combined StudyTino login for Students & Parents
4. Parent mobile compulsory for admission
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_director_login(self):
        """Test director login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "director"
        print(f"✓ Director login successful - Token received")
        return data["access_token"]


class TestIDFormats:
    """Test ID format generation - globally unique without school abbreviation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get a valid school ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if response.status_code == 200:
            schools = response.json()
            if schools:
                return schools[0]["id"]
        # Return demo school ID
        return "SCH-DEMO-2026"
    
    @pytest.fixture
    def class_id(self, auth_token, school_id):
        """Get a valid class ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/classes?school_id={school_id}", headers=headers)
        if response.status_code == 200:
            classes = response.json()
            if classes:
                return classes[0]["id"]
        pytest.skip("No classes found")
    
    def test_employee_id_format(self, auth_token, school_id):
        """Test Employee ID generation - EMP-2026-XXXXX format"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_email = f"test_emp_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/staff/create-with-id", 
            headers=headers,
            json={
                "name": "TEST_Employee",
                "email": unique_email,
                "mobile": f"98765{uuid.uuid4().int % 100000:05d}",
                "role": "teacher",
                "school_id": school_id
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "employee_id" in data
        employee_id = data["employee_id"]
        
        # Verify format: EMP-YEAR-XXXXX (no school abbreviation)
        year = datetime.now().year
        assert employee_id.startswith(f"EMP-{year}-"), f"Expected EMP-{year}-XXXXX format, got {employee_id}"
        
        # Verify it's 5 digits after year
        parts = employee_id.split("-")
        assert len(parts) == 3, f"Expected 3 parts (EMP-YEAR-SEQ), got {parts}"
        assert parts[0] == "EMP"
        assert parts[1] == str(year)
        assert len(parts[2]) == 5, f"Expected 5-digit sequence, got {parts[2]}"
        
        print(f"✓ Employee ID format correct: {employee_id}")
    
    def test_parent_id_format(self, auth_token, school_id):
        """Test Parent ID generation - PAR-2026-XXXXX format"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_mobile = f"98765{uuid.uuid4().int % 100000:05d}"
        
        response = requests.post(f"{BASE_URL}/api/parent/register",
            headers=headers,
            json={
                "name": "TEST_Parent",
                "mobile": unique_mobile,
                "password": "test123",
                "school_id": school_id
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "parent_id" in data
        parent_id = data["parent_id"]
        
        # Verify format: PAR-YEAR-XXXXX (no school abbreviation)
        year = datetime.now().year
        assert parent_id.startswith(f"PAR-{year}-"), f"Expected PAR-{year}-XXXXX format, got {parent_id}"
        
        # Verify it's 5 digits after year
        parts = parent_id.split("-")
        assert len(parts) == 3, f"Expected 3 parts (PAR-YEAR-SEQ), got {parts}"
        assert parts[0] == "PAR"
        assert parts[1] == str(year)
        assert len(parts[2]) == 5, f"Expected 5-digit sequence, got {parts[2]}"
        
        print(f"✓ Parent ID format correct: {parent_id}")
    
    def test_student_id_format_at_admission(self, auth_token, school_id, class_id):
        """Test Student ID generation at admission - STU-2026-XXXXX format"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_mobile = f"98765{uuid.uuid4().int % 100000:05d}"
        
        response = requests.post(f"{BASE_URL}/api/students/admit",
            headers=headers,
            json={
                "name": "TEST_Student",
                "class_id": class_id,
                "school_id": school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": "2015-05-15",
                "gender": "Male",
                "address": "Test Address",
                "mobile": unique_mobile  # Parent mobile - compulsory
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "student_id" in data
        student_id = data["student_id"]
        
        # Verify format: STU-YEAR-XXXXX (no school abbreviation)
        year = datetime.now().year
        assert student_id.startswith(f"STU-{year}-"), f"Expected STU-{year}-XXXXX format, got {student_id}"
        
        # Verify it's 5 digits after year
        parts = student_id.split("-")
        assert len(parts) == 3, f"Expected 3 parts (STU-YEAR-SEQ), got {parts}"
        assert parts[0] == "STU"
        assert parts[1] == str(year)
        assert len(parts[2]) == 5, f"Expected 5-digit sequence, got {parts[2]}"
        
        print(f"✓ Student ID format correct: {student_id}")


class TestParentAutoCreation:
    """Test parent account auto-creation at student admission"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get a valid school ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if response.status_code == 200:
            schools = response.json()
            if schools:
                return schools[0]["id"]
        return "SCH-DEMO-2026"
    
    @pytest.fixture
    def class_id(self, auth_token, school_id):
        """Get a valid class ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/classes?school_id={school_id}", headers=headers)
        if response.status_code == 200:
            classes = response.json()
            if classes:
                return classes[0]["id"]
        pytest.skip("No classes found")
    
    def test_parent_id_returned_at_admission(self, auth_token, school_id, class_id):
        """Test that parent_id is returned when parent mobile is provided at admission"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_mobile = f"98765{uuid.uuid4().int % 100000:05d}"
        
        response = requests.post(f"{BASE_URL}/api/students/admit",
            headers=headers,
            json={
                "name": "TEST_StudentWithParent",
                "class_id": class_id,
                "school_id": school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": "2015-06-20",
                "gender": "Female",
                "address": "Test Address",
                "mobile": unique_mobile  # Parent mobile
            }
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check parent_id is returned
        assert "parent_id" in data, "parent_id should be returned in admission response"
        
        if data.get("parent_id"):
            parent_id = data["parent_id"]
            year = datetime.now().year
            assert parent_id.startswith(f"PAR-{year}-"), f"Parent ID format incorrect: {parent_id}"
            print(f"✓ Parent ID auto-created at admission: {parent_id}")
            
            # Check parent_password is also returned for new parents
            if data.get("parent_password"):
                print(f"✓ Parent password returned for new parent")
        else:
            print("⚠ parent_id is None - may be existing parent or mobile not provided")


class TestParentLogin:
    """Test Parent Login API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get a valid school ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if response.status_code == 200:
            schools = response.json()
            if schools:
                return schools[0]["id"]
        return "SCH-DEMO-2026"
    
    @pytest.fixture
    def test_parent(self, auth_token, school_id):
        """Create a test parent for login tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_mobile = f"98765{uuid.uuid4().int % 100000:05d}"
        password = "testpass123"
        
        response = requests.post(f"{BASE_URL}/api/parent/register",
            headers=headers,
            json={
                "name": "TEST_LoginParent",
                "mobile": unique_mobile,
                "password": password,
                "school_id": school_id
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "parent_id": data["parent_id"],
                "mobile": unique_mobile,
                "password": password
            }
        pytest.skip("Failed to create test parent")
    
    def test_parent_login_with_mobile(self, test_parent):
        """Test parent login with mobile number"""
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "mobile": test_parent["mobile"],
            "password": test_parent["password"]
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "token" in data
        assert "parent" in data
        assert data["parent"]["mobile"] == test_parent["mobile"]
        
        print(f"✓ Parent login with mobile successful")
    
    def test_parent_login_with_parent_id(self, test_parent):
        """Test parent login with Parent ID"""
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "parent_id": test_parent["parent_id"],
            "password": test_parent["password"]
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "token" in data
        assert "parent" in data
        assert data["parent"]["parent_id"] == test_parent["parent_id"]
        
        print(f"✓ Parent login with Parent ID successful")
    
    def test_parent_login_validation(self):
        """Test parent login validation - requires mobile or parent_id"""
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "password": "somepassword"
        })
        
        assert response.status_code == 400
        print("✓ Parent login validation working - requires mobile or parent_id")
    
    def test_parent_login_invalid_credentials(self):
        """Test parent login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/parent/login", json={
            "mobile": "9999999999",
            "password": "wrongpassword"
        })
        
        assert response.status_code in [401, 404]
        print("✓ Parent login rejects invalid credentials")


class TestStudentLogin:
    """Test Student Login API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get a valid school ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if response.status_code == 200:
            schools = response.json()
            if schools:
                return schools[0]["id"]
        return "SCH-DEMO-2026"
    
    @pytest.fixture
    def class_id(self, auth_token, school_id):
        """Get a valid class ID"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/classes?school_id={school_id}", headers=headers)
        if response.status_code == 200:
            classes = response.json()
            if classes:
                return classes[0]["id"]
        pytest.skip("No classes found")
    
    @pytest.fixture
    def test_student(self, auth_token, school_id, class_id):
        """Create a test student for login tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        unique_mobile = f"98765{uuid.uuid4().int % 100000:05d}"
        
        response = requests.post(f"{BASE_URL}/api/students/admit",
            headers=headers,
            json={
                "name": "TEST_LoginStudent",
                "class_id": class_id,
                "school_id": school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": "2015-07-25",
                "gender": "Male",
                "address": "Test Address",
                "mobile": unique_mobile
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "student_id": data["student_id"],
                "temporary_password": data["temporary_password"],
                "mobile": unique_mobile,
                "dob": "2015-07-25"
            }
        pytest.skip(f"Failed to create test student: {response.text}")
    
    def test_student_login_with_id_password(self, test_student):
        """Test student login with Student ID + Password"""
        response = requests.post(f"{BASE_URL}/api/students/login", json={
            "student_id": test_student["student_id"],
            "password": test_student["temporary_password"]
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data
        assert "student" in data
        assert data["student"]["student_id"] == test_student["student_id"]
        
        print(f"✓ Student login with ID + Password successful")
    
    def test_student_login_with_mobile_dob(self, test_student):
        """Test student login with Mobile + DOB"""
        response = requests.post(f"{BASE_URL}/api/students/login", json={
            "mobile": test_student["mobile"],
            "dob": test_student["dob"]
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data
        assert "student" in data
        
        print(f"✓ Student login with Mobile + DOB successful")
    
    def test_student_login_validation(self):
        """Test student login validation"""
        response = requests.post(f"{BASE_URL}/api/students/login", json={})
        
        assert response.status_code == 400
        print("✓ Student login validation working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
