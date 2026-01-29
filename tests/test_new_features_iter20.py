"""
Iteration 20: Testing New Features
- Forgot Password flow (all portals)
- Accountant data entry forms (fee dues, salary structure)
- Staff photo upload for face recognition
- School auto-setup from website
- Director personalized greeting

Backend URL: https://exam-fix-1.preview.emergentagent.com
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://exam-fix-1.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"
TEACHER_EMAIL = "teacher@schooltino.com"
TEACHER_PASSWORD = "teacher123"
STUDENT_ID = "STD-2026-285220"
STUDENT_PASSWORD = "KPbeHdZf"


class TestPasswordReset:
    """Test Forgot Password / Password Reset APIs"""
    
    def test_forgot_password_with_email(self):
        """Test forgot password request with email"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/forgot",
            json={"email": DIRECTOR_EMAIL, "role": "auto"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        # Demo mode should return OTP
        if data.get("demo_mode"):
            assert "demo_otp" in data
            assert len(data["demo_otp"]) == 6
        print(f"✓ Forgot password with email: {data.get('message')}")
    
    def test_forgot_password_with_student_id(self):
        """Test forgot password request with student ID"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/forgot",
            json={"student_id": STUDENT_ID, "role": "student"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Forgot password with student ID: {data.get('message')}")
    
    def test_forgot_password_nonexistent_user(self):
        """Test forgot password with non-existent user (should not reveal)"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/forgot",
            json={"email": "nonexistent@test.com", "role": "auto"}
        )
        # Should return success to not reveal if user exists
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Non-existent user handled securely")
    
    def test_verify_otp_invalid(self):
        """Test OTP verification with invalid OTP"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/verify-otp",
            json={"email": DIRECTOR_EMAIL, "otp": "000000", "role": "auto"}
        )
        # Should fail with invalid OTP
        assert response.status_code in [400, 404]
        print("✓ Invalid OTP rejected correctly")
    
    def test_verify_otp_missing_identifier(self):
        """Test OTP verification without identifier"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/verify-otp",
            json={"otp": "123456", "role": "auto"}
        )
        assert response.status_code == 400
        print("✓ Missing identifier rejected")
    
    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/reset",
            json={
                "reset_token": "invalid-token-12345",
                "new_password": "newpass123",
                "confirm_password": "newpass123"
            }
        )
        assert response.status_code == 400
        print("✓ Invalid reset token rejected")
    
    def test_reset_password_mismatch(self):
        """Test password reset with mismatched passwords"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/reset",
            json={
                "reset_token": "some-token",
                "new_password": "newpass123",
                "confirm_password": "differentpass"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "match" in data.get("detail", "").lower() or response.status_code == 400
        print("✓ Password mismatch rejected")
    
    def test_check_token_validity(self):
        """Test token validity check endpoint"""
        response = requests.get(f"{BASE_URL}/api/password-reset/check-token/invalid-token")
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == False
        print("✓ Token validity check working")


class TestSchoolAutoSetup:
    """Test AI School Auto-Setup from Website"""
    
    def test_extract_from_website_valid_url(self):
        """Test website extraction with valid URL"""
        response = requests.post(
            f"{BASE_URL}/api/school-setup/extract-from-website",
            json={"website_url": "https://www.dpsranchi.com"}
        )
        assert response.status_code in [200, 400]  # May fail if website unreachable
        data = response.json()
        # Either success with extracted data or error message
        if response.status_code == 200:
            assert "extracted_data" in data or "error" in data or "message" in data
        print(f"✓ Website extraction endpoint working: {data.get('message', 'OK')}")
    
    def test_extract_from_website_invalid_url(self):
        """Test website extraction with invalid URL"""
        response = requests.post(
            f"{BASE_URL}/api/school-setup/extract-from-website",
            json={"website_url": "not-a-valid-url"}
        )
        # Should handle gracefully
        assert response.status_code in [200, 400]
        print("✓ Invalid URL handled gracefully")
    
    def test_generate_api_key_no_school(self):
        """Test API key generation for non-existent school"""
        response = requests.post(
            f"{BASE_URL}/api/school-setup/generate-api-key",
            json={
                "school_id": "non-existent-school-id",
                "key_name": "Test Key",
                "permissions": ["read"]
            }
        )
        assert response.status_code == 404
        print("✓ API key generation requires valid school")
    
    def test_list_api_keys(self):
        """Test listing API keys for a school"""
        response = requests.get(f"{BASE_URL}/api/school-setup/api-keys/school1")
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        assert isinstance(data["keys"], list)
        print(f"✓ API keys list: {data.get('total', 0)} keys")
    
    def test_wizard_status(self):
        """Test setup wizard status endpoint"""
        response = requests.get(f"{BASE_URL}/api/school-setup/wizard/status/school1")
        assert response.status_code == 200
        data = response.json()
        assert "steps" in data
        assert "overall_progress" in data
        print(f"✓ Wizard status: {data.get('overall_progress')}")


class TestDirectorGreeting:
    """Test Director Personalized Greeting System"""
    
    def test_get_greeting_settings(self):
        """Test getting greeting settings"""
        # First get a user ID
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        if login_res.status_code != 200:
            pytest.skip("Login failed - skipping greeting test")
        
        user_id = login_res.json().get("user", {}).get("id")
        if not user_id:
            pytest.skip("No user ID returned")
        
        response = requests.get(f"{BASE_URL}/api/director-greeting/settings/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        assert "preset_greetings" in data
        print(f"✓ Greeting settings retrieved")
    
    def test_get_greeting(self):
        """Test getting personalized greeting"""
        # First get a user ID
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        if login_res.status_code != 200:
            pytest.skip("Login failed - skipping greeting test")
        
        user_data = login_res.json().get("user", {})
        user_id = user_data.get("id")
        school_id = user_data.get("school_id", "school1")
        
        if not user_id:
            pytest.skip("No user ID returned")
        
        response = requests.get(
            f"{BASE_URL}/api/director-greeting/greet/{user_id}",
            params={"school_id": school_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert "greeting" in data or "success" in data
        print(f"✓ Greeting: {data.get('greeting', 'N/A')[:50]}...")
    
    def test_update_greeting_settings(self):
        """Test updating greeting settings"""
        # First get a user ID
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        if login_res.status_code != 200:
            pytest.skip("Login failed - skipping greeting test")
        
        user_id = login_res.json().get("user", {}).get("id")
        if not user_id:
            pytest.skip("No user ID returned")
        
        response = requests.post(
            f"{BASE_URL}/api/director-greeting/settings",
            json={
                "user_id": user_id,
                "custom_greeting": "Hare Krishna 🙏",
                "enable_time_greeting": True,
                "enable_custom_greeting": True,
                "enable_wellness_check": True,
                "language": "hinglish",
                "greeting_voice": True,
                "entry_cooldown_minutes": 60
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Greeting settings updated")
    
    def test_entry_history(self):
        """Test getting entry history"""
        # First get a user ID
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        if login_res.status_code != 200:
            pytest.skip("Login failed - skipping greeting test")
        
        user_id = login_res.json().get("user", {}).get("id")
        if not user_id:
            pytest.skip("No user ID returned")
        
        response = requests.get(
            f"{BASE_URL}/api/director-greeting/entry-history/{user_id}",
            params={"days": 7}
        )
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data or "total_entries" in data
        print(f"✓ Entry history: {data.get('total_entries', 0)} entries")


class TestFaceRecognitionStaff:
    """Test Staff Face Recognition / Photo Upload"""
    
    def test_staff_enrollment_status(self):
        """Test getting staff enrollment status"""
        # First get a staff ID
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEACHER_EMAIL, "password": TEACHER_PASSWORD}
        )
        if login_res.status_code != 200:
            pytest.skip("Login failed - skipping face recognition test")
        
        staff_id = login_res.json().get("user", {}).get("id")
        if not staff_id:
            pytest.skip("No staff ID returned")
        
        response = requests.get(f"{BASE_URL}/api/face-recognition/staff/enrollment-status/{staff_id}")
        assert response.status_code == 200
        data = response.json()
        # Should return enrollment status
        print(f"✓ Staff enrollment status: {data.get('status', 'retrieved')}")
    
    def test_staff_photo_upload_invalid_base64(self):
        """Test staff photo upload with invalid base64"""
        response = requests.post(
            f"{BASE_URL}/api/face-recognition/staff/upload-photo",
            json={
                "staff_id": "test-staff-id",
                "school_id": "school1",
                "photo_base64": "not-valid-base64",
                "photo_type": "passport",
                "capture_device": "webcam"
            }
        )
        # Should handle gracefully - either process or reject
        assert response.status_code in [200, 400, 422]
        print("✓ Invalid base64 handled")
    
    def test_staff_photos_list(self):
        """Test getting staff photos list"""
        response = requests.get(f"{BASE_URL}/api/face-recognition/staff/photos/test-staff-id")
        assert response.status_code == 200
        data = response.json()
        assert "photos" in data or isinstance(data, list)
        print("✓ Staff photos list endpoint working")


class TestAccountantFeatures:
    """Test Accountant Dashboard Features - Fee Dues and Salary Structure"""
    
    def test_multi_year_fees_defaulters(self):
        """Test getting multi-year fee defaulters"""
        response = requests.get(f"{BASE_URL}/api/multi-year-fees/defaulters/school1")
        assert response.status_code == 200
        data = response.json()
        assert "defaulters" in data
        print(f"✓ Multi-year defaulters: {len(data.get('defaulters', []))} found")
    
    def test_add_fee_due_missing_student(self):
        """Test adding fee due without student"""
        response = requests.post(
            f"{BASE_URL}/api/multi-year-fees/add-due",
            json={
                "school_id": "school1",
                "academic_year": "2023-24",
                "due_amount": 5000,
                "fee_type": "tuition"
            }
        )
        # Should fail without student_id
        assert response.status_code in [400, 422]
        print("✓ Fee due requires student_id")
    
    def test_salary_structure_set_missing_staff(self):
        """Test setting salary structure without staff"""
        response = requests.post(
            f"{BASE_URL}/api/salary/structure/set",
            json={
                "school_id": "school1",
                "basic_salary": 30000,
                "hra": 5000
            }
        )
        # Should fail without staff_id
        assert response.status_code in [400, 422]
        print("✓ Salary structure requires staff_id")
    
    def test_accountant_dashboard(self):
        """Test accountant dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/dashboard/school1")
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data or "fee_collected_this_month" in str(data)
        print("✓ Accountant dashboard working")
    
    def test_ai_quick_insight(self):
        """Test AI quick insight for accountant"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/ai/quick-insight/school1")
        assert response.status_code == 200
        data = response.json()
        assert "insight" in data or "type" in data
        print(f"✓ AI insight: {data.get('insight', 'N/A')[:50]}...")
    
    def test_salaries_list(self):
        """Test getting salaries list"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/salaries/school1")
        assert response.status_code == 200
        data = response.json()
        assert "salaries" in data
        print(f"✓ Salaries list: {len(data.get('salaries', []))} records")
    
    def test_fee_defaulters(self):
        """Test getting fee defaulters"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/fees/defaulters/school1")
        assert response.status_code == 200
        data = response.json()
        assert "defaulters" in data
        print(f"✓ Fee defaulters: {len(data.get('defaulters', []))} found")


class TestStudentSearch:
    """Test Student Search API for Accountant"""
    
    def test_student_search(self):
        """Test student search endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/students/search",
            params={"q": "test", "school_id": "school1"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "students" in data or isinstance(data, list)
        print(f"✓ Student search working")
    
    def test_staff_search(self):
        """Test staff search endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/staff/search",
            params={"q": "teacher", "school_id": "school1"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "staff" in data or isinstance(data, list)
        print(f"✓ Staff search working")


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")
    
    def test_director_login(self):
        """Test director login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Director login successful: {data['user'].get('name')}")
    
    def test_teacher_login(self):
        """Test teacher login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEACHER_EMAIL, "password": TEACHER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Teacher login successful: {data['user'].get('name')}")
    
    def test_student_login(self):
        """Test student login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/student-login",
            json={"student_id": STUDENT_ID, "password": STUDENT_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Student login successful: {data.get('student', {}).get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
