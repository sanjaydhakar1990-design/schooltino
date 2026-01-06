"""
Test Tino Brain Action Execution - Iteration 25
Tests for:
1. Sidebar profile link navigation
2. Tino Brain action execution (not just text responses)
3. Profile page accessibility
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTinoBrainActions:
    """Test Tino Brain executes real actions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("access_token")
        self.user = data.get("user", {})
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_tino_brain_status(self):
        """Test Tino Brain status endpoint"""
        response = requests.get(f"{BASE_URL}/api/tino-brain/status")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "active"
        assert data.get("ai_available") == True
        print(f"✅ Tino Brain status: {data.get('status')}")
        
    def test_absent_list_action(self):
        """Test 'aaj kaun absent hai' executes real action"""
        response = requests.post(
            f"{BASE_URL}/api/tino-brain/query",
            headers=self.headers,
            json={
                "query": "aaj kaun absent hai",
                "school_id": self.user.get("school_id", "SCH-DEMO-001"),
                "user_id": self.user.get("id"),
                "user_role": self.user.get("role", "director"),
                "user_name": self.user.get("name", "Director")
            }
        )
        assert response.status_code == 200, f"Query failed: {response.text}"
        data = response.json()
        
        # Verify action was taken
        assert "action_taken" in data, "No action_taken field in response"
        assert data.get("action_taken") == "absent_list_fetched", f"Wrong action: {data.get('action_taken')}"
        
        # Verify data was returned
        assert "data" in data, "No data field in response"
        assert "absent_count" in data.get("data", {}), "No absent_count in data"
        
        print(f"✅ Absent list action executed: {data.get('action_taken')}")
        print(f"   Absent count: {data.get('data', {}).get('absent_count')}")
        
    def test_school_status_action(self):
        """Test 'school ka status' executes real action"""
        response = requests.post(
            f"{BASE_URL}/api/tino-brain/query",
            headers=self.headers,
            json={
                "query": "school ka status batao",
                "school_id": self.user.get("school_id", "SCH-DEMO-001"),
                "user_id": self.user.get("id"),
                "user_role": self.user.get("role", "director"),
                "user_name": self.user.get("name", "Director")
            }
        )
        assert response.status_code == 200, f"Query failed: {response.text}"
        data = response.json()
        
        # Verify action was taken
        assert "action_taken" in data, "No action_taken field in response"
        assert data.get("action_taken") == "get_school_overview", f"Wrong action: {data.get('action_taken')}"
        
        # Verify school data was returned
        assert "data" in data, "No data field in response"
        school_data = data.get("data", {})
        assert "total_students" in school_data, "No total_students in data"
        assert "total_staff" in school_data, "No total_staff in data"
        
        print(f"✅ School status action executed: {data.get('action_taken')}")
        print(f"   Students: {school_data.get('total_students')}, Staff: {school_data.get('total_staff')}")
        
    def test_notice_creation_action(self):
        """Test 'notice bhejo' creates actual notice"""
        response = requests.post(
            f"{BASE_URL}/api/tino-brain/query",
            headers=self.headers,
            json={
                "query": "notice bhejo ki test notice from pytest",
                "school_id": self.user.get("school_id", "SCH-DEMO-001"),
                "user_id": self.user.get("id"),
                "user_role": self.user.get("role", "director"),
                "user_name": self.user.get("name", "Director")
            }
        )
        assert response.status_code == 200, f"Query failed: {response.text}"
        data = response.json()
        
        # Verify action was taken
        assert "action_taken" in data, "No action_taken field in response"
        assert data.get("action_taken") == "notice_created", f"Wrong action: {data.get('action_taken')}"
        
        # Verify notice was created
        assert "data" in data, "No data field in response"
        notice_data = data.get("data", {})
        assert "notice_id" in notice_data, "No notice_id in data - notice not created"
        
        print(f"✅ Notice creation action executed: {data.get('action_taken')}")
        print(f"   Notice ID: {notice_data.get('notice_id')}")
        
    def test_fee_reminder_action(self):
        """Test 'fee reminder bhejo' executes action"""
        response = requests.post(
            f"{BASE_URL}/api/tino-brain/query",
            headers=self.headers,
            json={
                "query": "fee reminder bhejo pending walo ko",
                "school_id": self.user.get("school_id", "SCH-DEMO-001"),
                "user_id": self.user.get("id"),
                "user_role": self.user.get("role", "director"),
                "user_name": self.user.get("name", "Director")
            }
        )
        assert response.status_code == 200, f"Query failed: {response.text}"
        data = response.json()
        
        # Verify action was taken
        assert "action_taken" in data, "No action_taken field in response"
        assert data.get("action_taken") == "fee_reminder_sent", f"Wrong action: {data.get('action_taken')}"
        
        # Verify reminders data
        assert "data" in data, "No data field in response"
        reminder_data = data.get("data", {})
        assert "reminders_sent" in reminder_data, "No reminders_sent in data"
        
        print(f"✅ Fee reminder action executed: {data.get('action_taken')}")
        print(f"   Reminders sent: {reminder_data.get('reminders_sent')}")


class TestProfileNavigation:
    """Test profile page accessibility"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data.get("access_token")
        self.user = data.get("user", {})
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_user_profile_endpoint(self):
        """Test user profile endpoint returns data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.headers
        )
        assert response.status_code == 200, f"Profile fetch failed: {response.text}"
        data = response.json()
        
        assert "email" in data, "No email in profile"
        assert data.get("email") == "director@schooltino.com"
        
        print(f"✅ Profile endpoint works: {data.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
