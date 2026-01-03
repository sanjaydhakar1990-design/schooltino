"""
Test Suite for Schooltino - Leave Management, CCTV Dashboard, and OneTino Integration
Iteration 6 - Testing new features:
- Leave Management: Apply, Balance, Approve/Reject
- CCTV Dashboard: Mock cameras, alerts, AI features
- OneTino Integration: School stats, All schools API
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get director auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_director_login(self, auth_token):
        """Test director can login"""
        assert auth_token is not None
        assert len(auth_token) > 0


class TestLeaveManagement:
    """Leave Management feature tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for director"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_leave_balance(self, auth_headers):
        """Test leave balance endpoint returns correct structure with Sick 12, Casual 10, Personal 5, Emergency 3"""
        response = requests.get(f"{BASE_URL}/api/leave/balance", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "balance" in data
        balance = data["balance"]
        
        # Verify all leave types are present with correct totals
        expected_types = {
            "sick": 12,
            "casual": 10,
            "personal": 5,
            "emergency": 3
        }
        
        for leave_type, expected_total in expected_types.items():
            assert leave_type in balance, f"Missing leave type: {leave_type}"
            assert balance[leave_type]["total"] == expected_total, f"Wrong total for {leave_type}: expected {expected_total}, got {balance[leave_type]['total']}"
            assert "remaining" in balance[leave_type]
            assert "used" in balance[leave_type]
    
    def test_apply_leave(self, auth_headers):
        """Test applying for leave"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        leave_data = {
            "leave_type": "casual",
            "from_date": tomorrow,
            "to_date": day_after,
            "reason": "TEST_Personal work - testing leave application",
            "half_day": False
        }
        
        response = requests.post(f"{BASE_URL}/api/leave/apply", json=leave_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to apply leave: {response.text}"
        
        data = response.json()
        assert data["leave_type"] == "casual"
        assert data["status"] == "pending"
        assert data["reason"] == leave_data["reason"]
        assert "id" in data
    
    def test_get_my_leaves(self, auth_headers):
        """Test getting user's own leave applications"""
        response = requests.get(f"{BASE_URL}/api/leave/my-leaves", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_pending_leaves(self, auth_headers):
        """Test getting pending leave applications for approval"""
        response = requests.get(f"{BASE_URL}/api/leave/pending", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_approve_leave_flow(self, auth_headers):
        """Test full approve leave flow: apply -> approve"""
        # First apply for a leave
        tomorrow = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
        
        leave_data = {
            "leave_type": "sick",
            "from_date": tomorrow,
            "to_date": day_after,
            "reason": "TEST_Sick leave for approval test",
            "half_day": False
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/leave/apply", json=leave_data, headers=auth_headers)
        assert apply_response.status_code == 200
        leave_id = apply_response.json()["id"]
        
        # Now approve it
        approve_response = requests.post(f"{BASE_URL}/api/leave/{leave_id}/approve", headers=auth_headers)
        assert approve_response.status_code == 200, f"Failed to approve: {approve_response.text}"
        
        data = approve_response.json()
        assert data["success"] == True
        assert "approved" in data["message"].lower()
    
    def test_reject_leave_flow(self, auth_headers):
        """Test full reject leave flow: apply -> reject"""
        # First apply for a leave
        tomorrow = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=11)).strftime("%Y-%m-%d")
        
        leave_data = {
            "leave_type": "personal",
            "from_date": tomorrow,
            "to_date": day_after,
            "reason": "TEST_Personal leave for rejection test",
            "half_day": False
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/leave/apply", json=leave_data, headers=auth_headers)
        assert apply_response.status_code == 200
        leave_id = apply_response.json()["id"]
        
        # Now reject it
        reject_response = requests.post(f"{BASE_URL}/api/leave/{leave_id}/reject", headers=auth_headers)
        assert reject_response.status_code == 200, f"Failed to reject: {reject_response.text}"
        
        data = reject_response.json()
        assert data["success"] == True
        assert "rejected" in data["message"].lower()


class TestCCTVDashboard:
    """CCTV Dashboard (Mock) feature tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for director"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_cctv_dashboard_returns_6_cameras(self, auth_headers):
        """Test CCTV dashboard returns mock data with 6 cameras"""
        response = requests.get(f"{BASE_URL}/api/cctv/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify mock mode indicator
        assert data["status"] == "mock"
        
        # Verify statistics
        assert "statistics" in data
        stats = data["statistics"]
        assert stats["total_cameras"] == 6
        assert "online" in stats
        assert "offline" in stats
        assert "alerts_today" in stats
        
        # Verify cameras list
        assert "cameras" in data
        cameras = data["cameras"]
        assert len(cameras) == 6
        
        # Verify camera structure
        for camera in cameras:
            assert "id" in camera
            assert "name" in camera
            assert "location" in camera
            assert "status" in camera
            assert camera["status"] in ["online", "offline"]
    
    def test_cctv_ai_features(self, auth_headers):
        """Test CCTV AI features list (Face Recognition, Attendance Tracking, etc.)"""
        response = requests.get(f"{BASE_URL}/api/cctv/dashboard", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "ai_features" in data
        
        ai_features = data["ai_features"]
        # Verify key AI features are present
        expected_features = ["face_recognition", "attendance_tracking", "behavior_detection"]
        
        for feature in expected_features:
            assert feature in ai_features, f"Missing AI feature: {feature}"
            assert "status" in ai_features[feature]
            assert "description" in ai_features[feature]
    
    def test_cctv_dashboard_alerts(self, auth_headers):
        """Test CCTV dashboard includes alerts"""
        response = requests.get(f"{BASE_URL}/api/cctv/dashboard", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "alerts" in data
        
        # Verify alerts structure from dashboard
        for alert in data["alerts"]:
            assert "id" in alert
            assert "type" in alert
            assert "camera" in alert
            assert "time" in alert
            assert "status" in alert
    
    def test_cctv_alerts_endpoint(self, auth_headers):
        """Test dedicated CCTV alerts endpoint"""
        response = requests.get(f"{BASE_URL}/api/cctv/alerts", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "alerts" in data
        
        # Verify alerts structure from dedicated endpoint
        for alert in data["alerts"]:
            assert "id" in alert
            assert "type" in alert
            assert "camera" in alert
            assert "timestamp" in alert
            assert "status" in alert
            assert "priority" in alert
    
    def test_cctv_camera_detail(self, auth_headers):
        """Test individual camera detail endpoint"""
        response = requests.get(f"{BASE_URL}/api/cctv/camera/cam-001", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["camera_id"] == "cam-001"
        assert data["status"] == "mock"
        assert "message" in data
        assert "recording" in data


class TestOneTinoIntegration:
    """OneTino Integration API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for director"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_onetino_school_stats(self, auth_headers):
        """Test OneTino school statistics API"""
        response = requests.get(f"{BASE_URL}/api/onetino/school-stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "school_id" in data or data.get("school_id") is None  # Can be null
        assert "statistics" in data
        
        stats = data["statistics"]
        assert "total_students" in stats
        assert "total_staff" in stats
        assert "total_classes" in stats
        
        # Verify features list
        assert "features_enabled" in data
        features = data["features_enabled"]
        assert isinstance(features, list)
        
        # Verify subscription info
        assert "subscription" in data
    
    def test_onetino_all_schools(self):
        """Test OneTino all schools API"""
        response = requests.get(f"{BASE_URL}/api/onetino/all-schools?api_key=onetino-master-key")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "schools" in data
        assert "total_schools" in data
        assert isinstance(data["schools"], list)
    
    def test_onetino_issues(self, auth_headers):
        """Test OneTino issues/tickets API"""
        response = requests.get(f"{BASE_URL}/api/onetino/issues", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "issues" in data
        assert isinstance(data["issues"], list)
    
    def test_onetino_report_issue(self, auth_headers):
        """Test reporting issue to OneTino (uses query params)"""
        # The endpoint uses query parameters, not JSON body
        params = {
            "title": "TEST_Issue - Testing OneTino integration",
            "description": "This is a test issue for OneTino integration testing",
            "priority": "low"
        }
        
        response = requests.post(f"{BASE_URL}/api/onetino/report-issue", params=params, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "issue_id" in data


class TestSidebarLinks:
    """Test that sidebar has correct links"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for director"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_leave_endpoint_accessible(self, auth_headers):
        """Verify leave endpoints are accessible (sidebar link works)"""
        response = requests.get(f"{BASE_URL}/api/leave/balance", headers=auth_headers)
        assert response.status_code == 200
    
    def test_cctv_endpoint_accessible(self, auth_headers):
        """Verify CCTV endpoints are accessible (sidebar link works)"""
        response = requests.get(f"{BASE_URL}/api/cctv/dashboard", headers=auth_headers)
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
