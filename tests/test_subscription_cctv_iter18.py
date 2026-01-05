"""
Test Suite for Iteration 18: Subscription Plans & CCTV APIs
- Subscription Plans API: /api/subscription/plans
- CCTV Registration API: /api/face-recognition/cctv/register
- CCTV Devices API: /api/face-recognition/cctv/devices/{school_id}
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "director@schooltino.com"
ADMIN_PASSWORD = "admin123"
TEST_SCHOOL_ID = "school1"


class TestSubscriptionPlans:
    """Test subscription plans API with updated pricing"""
    
    def test_get_subscription_plans_returns_6_plans(self):
        """Verify /api/subscription/plans returns 6 plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "plans" in data, "Response should contain 'plans' key"
        
        plans = data["plans"]
        assert len(plans) == 6, f"Expected 6 plans, got {len(plans)}"
        
        # Verify plan IDs
        plan_ids = [p["id"] for p in plans]
        expected_ids = ["free_trial", "basic", "ai_powered", "cctv_biometric", "gps_tracking", "ai_teacher"]
        for expected_id in expected_ids:
            assert expected_id in plan_ids, f"Missing plan: {expected_id}"
    
    def test_subscription_plans_correct_pricing(self):
        """Verify correct pricing for each plan"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        plans = {p["id"]: p for p in data["plans"]}
        
        # Verify pricing
        expected_prices = {
            "free_trial": 0,
            "basic": 9999,
            "ai_powered": 17999,
            "cctv_biometric": 27999,
            "gps_tracking": 37999,
            "ai_teacher": 47999
        }
        
        for plan_id, expected_price in expected_prices.items():
            assert plan_id in plans, f"Plan {plan_id} not found"
            actual_price = plans[plan_id]["price"]
            assert actual_price == expected_price, f"Plan {plan_id}: expected price {expected_price}, got {actual_price}"
    
    def test_gps_tracking_coming_soon(self):
        """Verify gps_tracking plan has coming_soon: true"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        plans = {p["id"]: p for p in data["plans"]}
        
        gps_plan = plans.get("gps_tracking")
        assert gps_plan is not None, "gps_tracking plan not found"
        assert gps_plan.get("coming_soon") == True, "gps_tracking should have coming_soon: true"
    
    def test_ai_teacher_coming_soon(self):
        """Verify ai_teacher plan has coming_soon: true"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        plans = {p["id"]: p for p in data["plans"]}
        
        ai_teacher_plan = plans.get("ai_teacher")
        assert ai_teacher_plan is not None, "ai_teacher plan not found"
        assert ai_teacher_plan.get("coming_soon") == True, "ai_teacher should have coming_soon: true"
    
    def test_trial_info_one_month_free(self):
        """Verify trial info says '1 Month FREE'"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        trial_info = data.get("trial_info", {})
        
        assert "duration" in trial_info, "trial_info should have 'duration' key"
        duration = trial_info["duration"]
        assert "1 Month" in duration or "1 month" in duration.lower(), f"Trial duration should mention '1 Month', got: {duration}"
        assert "FREE" in duration.upper(), f"Trial duration should mention 'FREE', got: {duration}"
    
    def test_free_trial_plan_details(self):
        """Verify free_trial plan has correct details"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        plans = {p["id"]: p for p in data["plans"]}
        
        free_trial = plans.get("free_trial")
        assert free_trial is not None, "free_trial plan not found"
        assert free_trial["price"] == 0, "free_trial should have price 0"
        assert free_trial.get("ai_included") == True, "free_trial should have ai_included: true"


class TestCCTVAPIs:
    """Test CCTV registration and device management APIs"""
    
    def test_register_cctv_device(self):
        """Test CCTV device registration"""
        device_data = {
            "school_id": TEST_SCHOOL_ID,
            "device_name": f"Test Camera {uuid.uuid4().hex[:6]}",
            "device_ip": "192.168.1.100",
            "rtsp_url": "rtsp://192.168.1.100:554/stream",
            "brand": "hikvision",
            "location": "main_gate",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/face-recognition/cctv/register",
            json=device_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Registration should be successful"
        assert "device_id" in data, "Response should contain device_id"
        assert "supported_brands" in data, "Response should list supported brands"
        
        # Store device_id for later tests
        self.registered_device_id = data["device_id"]
        return data["device_id"]
    
    def test_register_cctv_auto_detect_brand(self):
        """Test CCTV registration with auto-detect brand"""
        device_data = {
            "school_id": TEST_SCHOOL_ID,
            "device_name": f"Auto Detect Camera {uuid.uuid4().hex[:6]}",
            "device_ip": "192.168.1.101",
            "location": "classroom_1"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/face-recognition/cctv/register",
            json=device_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True
        assert "AI will auto-detect" in data.get("message", ""), "Message should mention auto-detect"
    
    def test_get_cctv_devices(self):
        """Test getting CCTV devices for a school"""
        response = requests.get(f"{BASE_URL}/api/face-recognition/cctv/devices/{TEST_SCHOOL_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "school_id" in data, "Response should contain school_id"
        assert "total_devices" in data, "Response should contain total_devices"
        assert "devices" in data, "Response should contain devices list"
        assert isinstance(data["devices"], list), "devices should be a list"
    
    def test_get_cctv_devices_returns_registered_devices(self):
        """Test that registered devices appear in the list"""
        # First register a device
        unique_name = f"Verify Camera {uuid.uuid4().hex[:8]}"
        device_data = {
            "school_id": TEST_SCHOOL_ID,
            "device_name": unique_name,
            "location": "corridor"
        }
        
        reg_response = requests.post(
            f"{BASE_URL}/api/face-recognition/cctv/register",
            json=device_data
        )
        assert reg_response.status_code == 200
        
        # Now get devices and verify
        response = requests.get(f"{BASE_URL}/api/face-recognition/cctv/devices/{TEST_SCHOOL_ID}")
        assert response.status_code == 200
        
        data = response.json()
        device_names = [d.get("device_name") for d in data.get("devices", [])]
        assert unique_name in device_names, f"Registered device '{unique_name}' should appear in devices list"


class TestAdminLogin:
    """Test admin login for authenticated endpoints"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user info"
        assert data["user"]["role"] == "director", "User should be director"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
