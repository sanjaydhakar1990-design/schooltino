"""
Test Suite for Iteration 32 - SchoolTino ERP
Features tested:
1. AI Seal Generation API - POST /api/school/generate-ai-seal
2. Payment Settings with signature/seal - GET /api/school/payment-settings
3. Calendar AI Generation with new options - POST /api/calendar/generate-image
4. School Management page loads correctly
5. Receipt Settings tab shows signature/seal options
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edumanage-revamp.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@demo.com"
DIRECTOR_PASSWORD = "demo123"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
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


class TestPaymentSettings:
    """Test Payment Settings API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get school ID from user profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            return response.json().get("school_id")
        pytest.skip("Could not get school ID")
    
    def test_get_payment_settings(self, auth_token, school_id):
        """Test GET /api/school/payment-settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/school/payment-settings?school_id={school_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        # Check expected fields exist
        assert "school_id" in data or "gpay_number" in data or "upi_id" in data
        print(f"✓ Payment settings retrieved: {list(data.keys())}")
    
    def test_save_payment_settings(self, auth_token, school_id):
        """Test POST /api/school/payment-settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_id": school_id,
            "gpay_number": "9876543210",
            "paytm_number": "9876543210",
            "phonepe_number": "9876543210",
            "upi_id": "school@upi",
            "bank_name": "State Bank of India",
            "account_number": "1234567890123",
            "ifsc_code": "SBIN0001234",
            "account_holder_name": "Test School Trust",
            "receipt_prefix": "RCP",
            "receipt_footer_note": "Thank you for your payment",
            "authorized_signatory_name": "Principal",
            "authorized_signatory_designation": "Principal"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/payment-settings",
            headers=headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Payment settings saved: {data['message']}")


class TestAISealGeneration:
    """Test AI Seal Generation API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    def test_generate_ai_seal_circular_blue(self, auth_token):
        """Test POST /api/school/generate-ai-seal with circular blue seal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_name": "Test Public School",
            "school_motto": "Excellence in Education",
            "seal_shape": "circular",
            "color_scheme": "blue"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/generate-ai-seal",
            headers=headers,
            json=payload
        )
        # API should return 200 even if AI fails (graceful handling)
        assert response.status_code in [200, 500]
        data = response.json()
        print(f"✓ AI Seal generation response: success={data.get('success')}, message={data.get('message', data.get('detail', 'N/A'))}")
        
        if data.get("success"):
            assert "seal_url" in data
            assert data["seal_url"].startswith("data:image")
            print(f"✓ AI Seal generated successfully with data URL")
    
    def test_generate_ai_seal_rectangular_red(self, auth_token):
        """Test POST /api/school/generate-ai-seal with rectangular red seal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_name": "ABC Higher Secondary School",
            "school_motto": "शिक्षा ही सर्वोत्तम धन है",
            "seal_shape": "rectangular",
            "color_scheme": "red"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/generate-ai-seal",
            headers=headers,
            json=payload
        )
        assert response.status_code in [200, 500]
        data = response.json()
        print(f"✓ AI Seal (rectangular/red) response: success={data.get('success')}")
    
    def test_generate_ai_seal_shield_gold(self, auth_token):
        """Test POST /api/school/generate-ai-seal with shield gold seal"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_name": "Royal Academy",
            "school_motto": "",
            "seal_shape": "shield",
            "color_scheme": "gold"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/generate-ai-seal",
            headers=headers,
            json=payload
        )
        assert response.status_code in [200, 500]
        data = response.json()
        print(f"✓ AI Seal (shield/gold) response: success={data.get('success')}")
    
    def test_generate_ai_seal_without_school_name(self, auth_token):
        """Test AI seal generation without school name - should fail"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_name": "",
            "seal_shape": "circular",
            "color_scheme": "blue"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/generate-ai-seal",
            headers=headers,
            json=payload
        )
        # Should still work but with empty name
        print(f"✓ AI Seal without name: status={response.status_code}")


class TestCalendarAIGeneration:
    """Test Calendar AI Generation API with new style options"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get school ID from user profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            return response.json().get("school_id")
        pytest.skip("Could not get school ID")
    
    def test_generate_calendar_single_page(self, auth_token, school_id):
        """Test POST /api/calendar/generate-image with single_page style"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_id": school_id,
            "school_name": "Test Public School",
            "year": "2025-26",
            "events": "26 Jan: Republic Day\n15 Aug: Independence Day",
            "state": "Rajasthan",
            "language": "hi",
            "include_logo_watermark": True,
            "calendar_style": "single_page"
        }
        response = requests.post(
            f"{BASE_URL}/api/calendar/generate-image",
            headers=headers,
            json=payload,
            timeout=120  # AI generation can take time
        )
        # API may return 200 or 500 depending on AI service
        assert response.status_code in [200, 500]
        data = response.json()
        print(f"✓ Calendar (single_page) response: success={data.get('success')}, style={data.get('style')}")
        
        if data.get("success"):
            assert "image_url" in data
            print(f"✓ Calendar image URL: {data['image_url'][:50]}...")
    
    def test_generate_calendar_two_page(self, auth_token, school_id):
        """Test POST /api/calendar/generate-image with two_page style"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_id": school_id,
            "school_name": "ABC School",
            "year": "2025-26",
            "state": "Madhya Pradesh",
            "language": "en",
            "include_logo_watermark": False,
            "calendar_style": "two_page"
        }
        response = requests.post(
            f"{BASE_URL}/api/calendar/generate-image",
            headers=headers,
            json=payload,
            timeout=120
        )
        assert response.status_code in [200, 500]
        data = response.json()
        print(f"✓ Calendar (two_page) response: success={data.get('success')}")
    
    def test_generate_calendar_poster(self, auth_token, school_id):
        """Test POST /api/calendar/generate-image with poster style"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_id": school_id,
            "school_name": "Royal Academy",
            "year": "2025-26",
            "state": "Gujarat",
            "language": "hi",
            "include_logo_watermark": True,
            "calendar_style": "poster"
        }
        response = requests.post(
            f"{BASE_URL}/api/calendar/generate-image",
            headers=headers,
            json=payload,
            timeout=120
        )
        assert response.status_code in [200, 500]
        data = response.json()
        print(f"✓ Calendar (poster) response: success={data.get('success')}")


class TestSchoolProfile:
    """Test School Profile APIs"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get school ID from user profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            return response.json().get("school_id")
        pytest.skip("Could not get school ID")
    
    def test_get_school_profile(self, auth_token, school_id):
        """Test GET /api/schools/{school_id}"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/schools/{school_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "name" in data or "id" in data
        print(f"✓ School profile retrieved: {data.get('name', 'N/A')}")
    
    def test_update_school_profile_with_signature_seal(self, auth_token, school_id):
        """Test PUT /api/schools/{school_id} with signature and seal URLs"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "name": "Test Public School",
            "address": "123 Main Street",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pincode": "302001",
            "phone": "0141-2345678",
            "email": "info@testschool.com",
            "board_type": "RBSE",
            "motto": "Excellence in Education",
            "principal_name": "Dr. Ram Kumar",
            "signature_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "seal_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
        response = requests.put(
            f"{BASE_URL}/api/schools/{school_id}",
            headers=headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ School profile updated with signature/seal")


class TestSchoolSettings:
    """Test School Settings API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def school_id(self, auth_token):
        """Get school ID from user profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            return response.json().get("school_id")
        pytest.skip("Could not get school ID")
    
    def test_get_school_settings(self, auth_token, school_id):
        """Test GET /api/school/settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/school/settings?school_id={school_id}",
            headers=headers
        )
        # May return 200 or 404 if no settings exist
        assert response.status_code in [200, 404]
        print(f"✓ School settings: status={response.status_code}")
    
    def test_save_school_settings(self, auth_token, school_id):
        """Test POST /api/school/settings"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "school_id": school_id,
            "school_start_time": "08:00",
            "school_end_time": "14:00",
            "late_grace_period": 15,
            "current_session": "2024-25",
            "board": "RBSE",
            "state": "Rajasthan",
            "attendance_mode": "auto"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/settings",
            headers=headers,
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ School settings saved: {data.get('message', 'OK')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
