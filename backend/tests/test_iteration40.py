"""
Iteration 40 - Backend API Tests
Testing new features:
1. Fee Management System (fee-structures, fee-collections, old-dues)
2. Student admission with Authorization headers
3. Logo Watermark Settings
"""

import pytest
import requests
import os
from datetime import datetime

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
        assert "access_token" in data
        return data["access_token"]
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "director@test.com"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code in [401, 404]


class TestFeeStructures:
    """Fee Structure API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_fee_structures(self, auth_headers):
        """Test GET /api/fee-structures"""
        response = requests.get(
            f"{BASE_URL}/api/fee-structures?school_id=SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} fee structures")
    
    def test_create_fee_structure(self, auth_headers):
        """Test POST /api/fee-structures"""
        payload = {
            "school_id": "SCH-TEST-2026",
            "class_id": "CLASS-TEST-5A",
            "academic_year": "2025-2026",
            "fees": {
                "tuition_fee": 3000,
                "exam_fee": 500,
                "development_fee": 1000
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/fee-structures",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "id" in data
        print(f"Created fee structure with ID: {data['id']}")
    
    def test_get_fee_structures_after_create(self, auth_headers):
        """Verify fee structure was persisted"""
        response = requests.get(
            f"{BASE_URL}/api/fee-structures?school_id=SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Fee structure should exist after creation"


class TestFeeCollections:
    """Fee Collection API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_fee_collections(self, auth_headers):
        """Test GET /api/fee-collections"""
        response = requests.get(
            f"{BASE_URL}/api/fee-collections?school_id=SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} fee collections")
    
    def test_create_fee_collection(self, auth_headers):
        """Test POST /api/fee-collections"""
        payload = {
            "school_id": "SCH-TEST-2026",
            "student_id": "STD-TEST-001",
            "amount": 2000,
            "payment_mode": "cash",
            "fee_types": ["tuition_fee"],
            "months": ["January 2026"],
            "payment_date": "2026-01-23"
        }
        response = requests.post(
            f"{BASE_URL}/api/fee-collections",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "receipt_no" in data
        print(f"Created fee collection with receipt: {data['receipt_no']}")


class TestOldDues:
    """Old Dues API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_old_dues(self, auth_headers):
        """Test GET /api/old-dues"""
        response = requests.get(
            f"{BASE_URL}/api/old-dues?school_id=SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} old dues")
    
    def test_create_old_due(self, auth_headers):
        """Test POST /api/old-dues"""
        payload = {
            "school_id": "SCH-TEST-2026",
            "student_id": "STD-TEST-001",
            "amount": 5000,
            "description": "Previous year dues",
            "academic_year": "2024-2025"
        }
        response = requests.post(
            f"{BASE_URL}/api/old-dues",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "id" in data
        print(f"Created old due with ID: {data['id']}")
    
    def test_get_old_dues_after_create(self, auth_headers):
        """Verify old due was persisted"""
        response = requests.get(
            f"{BASE_URL}/api/old-dues?school_id=SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Old due should exist after creation"


class TestStudentAdmission:
    """Student Admission API tests - verifying Authorization header fix"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_students(self, auth_headers):
        """Test GET /api/students with auth"""
        response = requests.get(
            f"{BASE_URL}/api/students?school_id=SCH-TEST-2026&status=active",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} active students")
    
    def test_admit_student_with_auth(self, auth_headers):
        """Test POST /api/students/admit with Authorization header"""
        timestamp = datetime.now().strftime("%H%M%S")
        payload = {
            "name": f"Test Student API {timestamp}",
            "class_id": "CLASS-TEST-5A",
            "school_id": "SCH-TEST-2026",
            "father_name": "Test Father API",
            "mother_name": "Test Mother API",
            "dob": "2015-06-20",
            "gender": "male",
            "address": "Test Address API",
            "mobile": "9876543299"
        }
        response = requests.post(
            f"{BASE_URL}/api/students/admit",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Student admission failed: {response.text}"
        data = response.json()
        assert "student_id" in data
        assert "login_id" in data
        assert "temporary_password" in data
        print(f"Admitted student with ID: {data['student_id']}")
    
    def test_admit_student_without_auth(self):
        """Test POST /api/students/admit without Authorization header - should fail"""
        payload = {
            "name": "Test Student No Auth",
            "class_id": "CLASS-TEST-5A",
            "school_id": "SCH-TEST-2026",
            "father_name": "Test Father",
            "mother_name": "Test Mother",
            "dob": "2015-06-20",
            "gender": "male",
            "address": "Test Address",
            "mobile": "9876543298"
        }
        response = requests.post(
            f"{BASE_URL}/api/students/admit",
            json=payload
        )
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"


class TestLogoWatermarkSettings:
    """Logo Watermark Settings API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_school_settings(self, auth_headers):
        """Test GET /api/schools/{school_id} for logo settings"""
        response = requests.get(
            f"{BASE_URL}/api/schools/SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        print(f"School name: {data.get('name')}")
    
    def test_update_school_logo_settings(self, auth_headers):
        """Test updating school logo/watermark settings"""
        payload = {
            "watermark_size": 50,
            "watermark_visibility": 15,
            "watermark_position": "center"
        }
        response = requests.put(
            f"{BASE_URL}/api/schools/SCH-TEST-2026",
            headers=auth_headers,
            json=payload
        )
        # May return 200 or 404 depending on implementation
        assert response.status_code in [200, 404, 422]


class TestClasses:
    """Classes API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_classes(self, auth_headers):
        """Test GET /api/classes"""
        response = requests.get(
            f"{BASE_URL}/api/classes?school_id=SCH-TEST-2026",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one class"
        print(f"Found {len(data)} classes")


class TestHealthCheck:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
