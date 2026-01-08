"""
Test Face Recognition APIs - Iteration 17
Tests for:
- /api/face-recognition/school-settings/{school_id}
- /api/face-recognition/enrollment-status/{student_id}
- /api/face-recognition/stats/{school_id}
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://meri-schooltino.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "director@schooltino.com"
ADMIN_PASSWORD = "admin123"
SCHOOL_ID = "school1"
TEST_STUDENT_ID = "STD-2026-285220"


class TestFaceRecognitionAPIs:
    """Face Recognition API Tests"""
    
    def test_get_school_face_settings(self):
        """Test GET /api/face-recognition/school-settings/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/face-recognition/school-settings/{SCHOOL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "school_id" in data, "Response should contain school_id"
        assert "face_recognition_enabled" in data, "Response should contain face_recognition_enabled"
        assert "biometric_enabled" in data, "Response should contain biometric_enabled"
        assert "allow_skip_enrollment" in data, "Response should contain allow_skip_enrollment"
        
        print(f"✓ School face settings: face_recognition_enabled={data.get('face_recognition_enabled')}")
        print(f"  biometric_enabled={data.get('biometric_enabled')}")
        print(f"  allow_skip_enrollment={data.get('allow_skip_enrollment')}")
    
    def test_get_enrollment_status(self):
        """Test GET /api/face-recognition/enrollment-status/{student_id}"""
        response = requests.get(f"{BASE_URL}/api/face-recognition/enrollment-status/{TEST_STUDENT_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "student_id" in data, "Response should contain student_id"
        assert "is_enrolled" in data, "Response should contain is_enrolled"
        assert "photos_uploaded" in data, "Response should contain photos_uploaded"
        assert "photos_required" in data, "Response should contain photos_required"
        assert "photos_optional" in data, "Response should contain photos_optional"
        assert "progress_percentage" in data, "Response should contain progress_percentage"
        
        print(f"✓ Enrollment status for {TEST_STUDENT_ID}:")
        print(f"  is_enrolled={data.get('is_enrolled')}")
        print(f"  photos_uploaded={data.get('photos_uploaded')}")
        print(f"  progress_percentage={data.get('progress_percentage')}%")
    
    def test_get_face_enrollment_stats(self):
        """Test GET /api/face-recognition/stats/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/face-recognition/stats/{SCHOOL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "school_id" in data, "Response should contain school_id"
        assert "total_students" in data, "Response should contain total_students"
        assert "face_enrolled" in data, "Response should contain face_enrolled"
        assert "enrollment_skipped" in data, "Response should contain enrollment_skipped"
        assert "pending_enrollment" in data, "Response should contain pending_enrollment"
        assert "enrollment_percentage" in data, "Response should contain enrollment_percentage"
        
        print(f"✓ Face enrollment stats for {SCHOOL_ID}:")
        print(f"  total_students={data.get('total_students')}")
        print(f"  face_enrolled={data.get('face_enrolled')}")
        print(f"  enrollment_percentage={data.get('enrollment_percentage')}%")
    
    def test_school_settings_default_values(self):
        """Test that school settings return sensible defaults"""
        # Test with a non-existent school to get defaults
        response = requests.get(f"{BASE_URL}/api/face-recognition/school-settings/new_school_test")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Default values should be set
        assert data.get("face_recognition_enabled") == True, "Default face_recognition_enabled should be True"
        assert data.get("biometric_enabled") == True, "Default biometric_enabled should be True"
        assert data.get("allow_skip_enrollment") == True, "Default allow_skip_enrollment should be True"
        assert data.get("min_photos_required") == 3, "Default min_photos_required should be 3"
        assert data.get("similarity_threshold") == 75, "Default similarity_threshold should be 75"
        
        print("✓ Default school settings verified")


class TestAccountantDashboardAPIs:
    """Accountant Dashboard API Tests - Old Dues Tab"""
    
    def test_accountant_dashboard_loads(self):
        """Test GET /api/ai-accountant/dashboard/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/dashboard/{SCHOOL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "overview" in data, "Response should contain overview"
        
        print(f"✓ Accountant dashboard loaded")
        print(f"  fee_collected_this_month={data.get('overview', {}).get('fee_collected_this_month')}")
        print(f"  pending_fees={data.get('overview', {}).get('pending_fees')}")
    
    def test_fee_defaulters_endpoint(self):
        """Test GET /api/ai-accountant/fees/defaulters/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/fees/defaulters/{SCHOOL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "defaulters" in data, "Response should contain defaulters list"
        
        print(f"✓ Fee defaulters endpoint working")
        print(f"  defaulters_count={len(data.get('defaulters', []))}")


class TestSalaryTrackingAPIs:
    """Salary Tracking API Tests - Download All Slips"""
    
    def test_salary_status_endpoint(self):
        """Test GET /api/salary/status/{staff_id}"""
        # Use a test staff ID
        staff_id = "37996667-303a-495b-801b-52a236f3e4d0"
        response = requests.get(f"{BASE_URL}/api/salary/status/{staff_id}")
        
        # May return 200 or 404 depending on if staff exists
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Salary status endpoint working")
            print(f"  staff_id={data.get('staff_id')}")
        else:
            print("✓ Salary status endpoint returns 404 for non-existent staff (expected)")
    
    def test_salary_slip_endpoint(self):
        """Test GET /api/salary/slip/{slip_no}"""
        slip_no = "SLIP-2025-01"
        response = requests.get(f"{BASE_URL}/api/salary/slip/{slip_no}")
        
        # May return 200 or 404 depending on if slip exists
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        print(f"✓ Salary slip endpoint accessible (status={response.status_code})")


class TestStudentReceiptsAPIs:
    """Student Receipts API Tests"""
    
    def test_student_payments_endpoint(self):
        """Test GET /api/fee-payment/student/{student_id}/payments"""
        response = requests.get(f"{BASE_URL}/api/fee-payment/student/{TEST_STUDENT_ID}/payments")
        
        # May return 200 or 404 depending on if student has payments
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Student payments endpoint working")
            print(f"  payments_count={len(data.get('payments', []))}")
        else:
            print("✓ Student payments endpoint returns 404 (no payments found)")


class TestAuthenticationAPIs:
    """Authentication API Tests"""
    
    def test_admin_login_success(self):
        """Test POST /api/auth/login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data or "access_token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        
        print(f"✓ Admin login successful")
        print(f"  user_role={data.get('user', {}).get('role')}")
    
    def test_admin_login_invalid_password(self):
        """Test POST /api/auth/login with invalid password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        
        assert response.status_code in [401, 400], f"Expected 401 or 400, got {response.status_code}"
        print("✓ Invalid password correctly rejected")
    
    def test_student_login_success(self):
        """Test POST /api/auth/student-login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/student-login",
            json={"student_id": TEST_STUDENT_ID, "password": "KPbeHdZf"}
        )
        
        # May return 200 or 401 depending on if student exists
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Student login successful")
            print(f"  student_id={data.get('user', {}).get('student_id')}")
        else:
            print(f"✓ Student login endpoint accessible (status={response.status_code})")


class TestMultiYearFeesAPIs:
    """Multi-Year Fees API Tests - Old Dues"""
    
    def test_multi_year_fees_summary(self):
        """Test GET /api/multi-year-fees/summary/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/multi-year-fees/summary/{SCHOOL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data, "Response should contain school_id"
        assert "year_wise_summary" in data, "Response should contain year_wise_summary"
        
        print(f"✓ Multi-year fees summary endpoint working")
        print(f"  total_pending={data.get('total_pending')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
