"""
Test Suite for Iteration 9 Features:
- Razorpay Payment Integration
- CCTV Auto-Detection & Management
- Cloud Storage & Backup Management
- Admin Activity Dashboard
"""

import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"
TEACHER_EMAIL = "teacher@schooltino.com"
TEACHER_PASSWORD = "teacher123"


class TestSetup:
    """Setup and authentication tests"""
    
    @pytest.fixture(scope="class")
    def director_token(self):
        """Get director authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token"), data.get("user", {}).get("school_id")
        pytest.skip("Director login failed - skipping authenticated tests")
    
    @pytest.fixture(scope="class")
    def teacher_token(self):
        """Get teacher authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token"), data.get("user", {}).get("school_id")
        pytest.skip("Teacher login failed - skipping authenticated tests")


class TestRazorpayPaymentConfig:
    """Test Razorpay payment configuration API"""
    
    def test_get_payment_config(self):
        """Test GET /api/payments/config returns plan details"""
        response = requests.get(f"{BASE_URL}/api/payments/config")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "configured" in data, "Response should have 'configured' field"
        assert "plans" in data, "Response should have 'plans' field"
        
        # Verify plan structure
        plans = data["plans"]
        assert "monthly" in plans, "Should have monthly plan"
        assert "yearly" in plans, "Should have yearly plan"
        
        # Verify monthly plan details
        monthly = plans["monthly"]
        assert "amount" in monthly, "Monthly plan should have amount"
        assert "display_amount" in monthly, "Monthly plan should have display_amount"
        assert "duration" in monthly, "Monthly plan should have duration"
        
        # Verify yearly plan details
        yearly = plans["yearly"]
        assert "amount" in yearly, "Yearly plan should have amount"
        assert "savings" in yearly, "Yearly plan should have savings"
        
        print(f"✓ Payment config retrieved - Configured: {data['configured']}")
        print(f"  Monthly: {monthly.get('display_amount')}, Yearly: {yearly.get('display_amount')}")


class TestCCTVManagement:
    """Test CCTV Auto-Detection & Management APIs"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get director auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            school_id = response.json().get("user", {}).get("school_id")
            return {"Authorization": f"Bearer {token}"}, school_id
        pytest.skip("Director login failed")
    
    def test_cctv_auto_detect(self, auth_headers):
        """Test POST /api/cctv/auto-detect scans network and finds cameras"""
        headers, school_id = auth_headers
        
        response = requests.post(f"{BASE_URL}/api/cctv/auto-detect", json={
            "school_id": school_id,
            "ip_range_start": "192.168.1.1",
            "ip_range_end": "192.168.1.254"
        }, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "scan_id" in data, "Response should have scan_id"
        assert "status" in data, "Response should have status"
        assert "detected_cameras" in data, "Response should have detected_cameras count"
        assert "cameras" in data, "Response should have cameras list"
        assert "message" in data, "Response should have message"
        
        print(f"✓ CCTV auto-detect completed - Found {data['detected_cameras']} cameras")
        for cam in data.get("cameras", []):
            print(f"  - {cam.get('name')} at {cam.get('ip_address')} ({cam.get('location')})")
    
    def test_get_cameras(self, auth_headers):
        """Test GET /api/cctv/cameras/{school_id} lists all cameras"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/cctv/cameras/{school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of cameras"
        
        print(f"✓ Retrieved {len(data)} cameras for school")
        if data:
            for cam in data[:3]:  # Show first 3
                print(f"  - {cam.get('name')}: {cam.get('status')} at {cam.get('location')}")
    
    def test_add_camera_manually(self, auth_headers):
        """Test POST /api/cctv/cameras to add camera manually"""
        headers, school_id = auth_headers
        
        camera_data = {
            "name": "TEST_Manual Camera",
            "ip_address": "192.168.1.200",
            "port": 554,
            "location": "TEST_Location",
            "camera_type": "ip",
            "school_id": school_id
        }
        
        response = requests.post(f"{BASE_URL}/api/cctv/cameras", json=camera_data, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have camera id"
        assert data["name"] == camera_data["name"], "Camera name should match"
        assert data["location"] == camera_data["location"], "Camera location should match"
        
        print(f"✓ Camera added manually - ID: {data['id']}")
        
        # Store camera ID for cleanup
        return data["id"]
    
    def test_recording_settings(self, auth_headers):
        """Test POST /api/cctv/recording-settings"""
        headers, school_id = auth_headers
        
        settings_data = {
            "school_id": school_id,
            "recording_enabled": True,
            "retention_days": 30,
            "motion_detection": True,
            "alert_on_motion": False,
            "cloud_backup_enabled": False
        }
        
        response = requests.post(f"{BASE_URL}/api/cctv/recording-settings", json=settings_data, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have message"
        assert "settings" in data, "Response should have settings"
        
        print(f"✓ Recording settings updated - Retention: {settings_data['retention_days']} days")
    
    def test_get_recording_settings(self, auth_headers):
        """Test GET /api/cctv/recording-settings/{school_id}"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/cctv/recording-settings/{school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data, "Response should have school_id"
        assert "recording_enabled" in data, "Response should have recording_enabled"
        assert "retention_days" in data, "Response should have retention_days"
        
        print(f"✓ Recording settings retrieved - Enabled: {data['recording_enabled']}")


class TestStorageBackup:
    """Test Cloud Storage & Backup Management APIs"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get director auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            school_id = response.json().get("user", {}).get("school_id")
            return {"Authorization": f"Bearer {token}"}, school_id
        pytest.skip("Director login failed")
    
    def test_ai_auto_setup_storage(self, auth_headers):
        """Test POST /api/storage/ai-setup for AI auto-configuration"""
        headers, school_id = auth_headers
        
        response = requests.post(f"{BASE_URL}/api/storage/ai-setup?school_id={school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data, "Response should have success field"
        assert data["success"] == True, "AI setup should succeed"
        assert "configuration" in data, "Response should have configuration"
        assert "message" in data, "Response should have message"
        
        config = data["configuration"]
        assert "storage_tier" in config, "Config should have storage_tier"
        assert "ai_recommendations" in config, "Config should have AI recommendations"
        
        print(f"✓ AI Storage setup completed - Tier: {config.get('storage_tier')}")
        for rec in config.get("ai_recommendations", [])[:3]:
            print(f"  - {rec}")
    
    def test_configure_storage(self, auth_headers):
        """Test POST /api/storage/configure"""
        headers, school_id = auth_headers
        
        config_data = {
            "school_id": school_id,
            "provider": "local",
            "auto_backup": True,
            "backup_schedule": "daily",
            "retention_days": 90,
            "backup_items": ["database", "documents", "photos"]
        }
        
        response = requests.post(f"{BASE_URL}/api/storage/configure", json=config_data, headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have message"
        assert "config" in data, "Response should have config"
        
        print(f"✓ Storage configured - Provider: {config_data['provider']}, Schedule: {config_data['backup_schedule']}")
    
    def test_get_storage_config(self, auth_headers):
        """Test GET /api/storage/config/{school_id}"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/storage/config/{school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data, "Response should have school_id"
        assert "provider" in data, "Response should have provider"
        assert "auto_backup" in data, "Response should have auto_backup"
        
        print(f"✓ Storage config retrieved - Provider: {data.get('provider')}, Auto-backup: {data.get('auto_backup')}")
    
    def test_trigger_backup(self, auth_headers):
        """Test POST /api/storage/backup/trigger"""
        headers, school_id = auth_headers
        
        response = requests.post(
            f"{BASE_URL}/api/storage/backup/trigger?school_id={school_id}&backup_type=full",
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "backup_id" in data, "Response should have backup_id"
        assert "status" in data, "Response should have status"
        assert "size_mb" in data, "Response should have size_mb"
        
        print(f"✓ Backup triggered - ID: {data['backup_id']}, Size: {data['size_mb']} MB, Status: {data['status']}")
    
    def test_get_backup_history(self, auth_headers):
        """Test GET /api/storage/backups/{school_id}"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/storage/backups/{school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of backups"
        
        print(f"✓ Retrieved {len(data)} backups")
        if data:
            for backup in data[:3]:
                print(f"  - {backup.get('backup_type')}: {backup.get('size_mb')} MB ({backup.get('status')})")
    
    def test_get_storage_usage(self, auth_headers):
        """Test GET /api/storage/usage/{school_id}"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/storage/usage/{school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "usage" in data, "Response should have usage"
        assert "counts" in data, "Response should have counts"
        
        usage = data["usage"]
        assert "database_mb" in usage, "Usage should have database_mb"
        assert "total_mb" in usage, "Usage should have total_mb"
        
        print(f"✓ Storage usage - Total: {usage.get('total_mb')} MB")
        print(f"  Database: {usage.get('database_mb')} MB, Documents: {usage.get('documents_mb')} MB")


class TestAdminActivityDashboard:
    """Test Admin Activity Dashboard APIs"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get director auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            school_id = response.json().get("user", {}).get("school_id")
            return {"Authorization": f"Bearer {token}"}, school_id
        pytest.skip("Director login failed")
    
    def test_get_dashboard_overview(self, auth_headers):
        """Test GET /api/admin/dashboard-overview/{school_id}"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-overview/{school_id}", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "stats" in data, "Response should have stats"
        assert "summary" in data, "Response should have summary"
        
        stats = data["stats"]
        assert "exams_created" in stats, "Stats should have exams_created"
        assert "attendance_marked" in stats, "Stats should have attendance_marked"
        assert "leaves_pending" in stats, "Stats should have leaves_pending"
        
        print(f"✓ Dashboard overview retrieved")
        print(f"  Summary: {data.get('summary')}")
        print(f"  Exams: {stats.get('exams_created')}, Attendance: {stats.get('attendance_marked')}, Pending Leaves: {stats.get('leaves_pending')}")
    
    def test_get_teacher_activities(self, auth_headers):
        """Test GET /api/admin/teacher-activities/{school_id}"""
        headers, school_id = auth_headers
        
        response = requests.get(f"{BASE_URL}/api/admin/teacher-activities/{school_id}?limit=30", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list of activities"
        
        print(f"✓ Retrieved {len(data)} teacher activities")
        if data:
            for activity in data[:5]:
                print(f"  - {activity.get('user_name', 'Unknown')}: {activity.get('action')} ({activity.get('module')})")
    
    def test_teacher_cannot_access_admin_dashboard(self):
        """Test that teacher cannot access admin dashboard"""
        # Login as teacher
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Teacher login failed")
        
        token = login_response.json().get("access_token")
        school_id = login_response.json().get("user", {}).get("school_id")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access admin dashboard
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-overview/{school_id}", headers=headers)
        
        assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
        print("✓ Teacher correctly denied access to admin dashboard")


class TestSubscriptionPlans:
    """Test subscription plans API"""
    
    def test_get_subscription_plans(self):
        """Test GET /api/subscription/plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plans" in data, "Response should have plans"
        
        plans = data["plans"]
        assert len(plans) >= 2, "Should have at least 2 plans"
        
        print(f"✓ Retrieved {len(plans)} subscription plans")
        for plan in plans:
            print(f"  - {plan.get('name')}: {plan.get('price_display')} ({plan.get('duration')})")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
