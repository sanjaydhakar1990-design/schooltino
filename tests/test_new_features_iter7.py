"""
Test Suite for Schooltino New Features - Iteration 7
Tests: School Registration, Zoom Meetings, TeachTino AI File Upload
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://schooltino-app.preview.emergentagent.com')

class TestAuthentication:
    """Authentication tests for Director and Teacher"""
    
    def test_director_login(self):
        """Test Director login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "director"
        print(f"✅ Director login successful - Token received")
        return data["token"]
    
    def test_teacher_login(self):
        """Test Teacher login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teacher@schooltino.com",
            "password": "teacher123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "teacher"
        print(f"✅ Teacher login successful - Token received")
        return data["token"]


class TestZoomMeetings:
    """Zoom Meetings API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get director auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_get_meetings(self, auth_token):
        """Test GET /api/meetings - List all meetings"""
        response = requests.get(
            f"{BASE_URL}/api/meetings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/meetings - Found {len(data)} meetings")
    
    def test_create_meeting(self, auth_token):
        """Test POST /api/meetings - Create new meeting"""
        future_time = (datetime.now() + timedelta(days=1)).isoformat()
        meeting_data = {
            "topic": "TEST_Weekly Staff Meeting",
            "description": "Test meeting for automated testing",
            "start_time": future_time,
            "duration": 60,
            "password": "test123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/meetings",
            json=meeting_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["topic"] == "TEST_Weekly Staff Meeting"
        assert data["duration"] == 60
        assert "join_url" in data
        assert data["status"] == "scheduled"
        
        print(f"✅ POST /api/meetings - Meeting created with ID: {data['id']}")
        return data["id"]
    
    def test_get_single_meeting(self, auth_token):
        """Test GET /api/meetings/{id} - Get single meeting"""
        # First create a meeting
        future_time = (datetime.now() + timedelta(days=2)).isoformat()
        create_response = requests.post(
            f"{BASE_URL}/api/meetings",
            json={
                "topic": "TEST_Single Meeting Test",
                "start_time": future_time,
                "duration": 30
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        meeting_id = create_response.json()["id"]
        
        # Get the meeting
        response = requests.get(
            f"{BASE_URL}/api/meetings/{meeting_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == meeting_id
        assert data["topic"] == "TEST_Single Meeting Test"
        
        print(f"✅ GET /api/meetings/{meeting_id} - Meeting retrieved successfully")
    
    def test_delete_meeting(self, auth_token):
        """Test DELETE /api/meetings/{id} - Cancel meeting"""
        # First create a meeting
        future_time = (datetime.now() + timedelta(days=3)).isoformat()
        create_response = requests.post(
            f"{BASE_URL}/api/meetings",
            json={
                "topic": "TEST_Meeting to Delete",
                "start_time": future_time,
                "duration": 45
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        meeting_id = create_response.json()["id"]
        
        # Delete the meeting
        response = requests.delete(
            f"{BASE_URL}/api/meetings/{meeting_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Meeting cancelled"
        
        print(f"✅ DELETE /api/meetings/{meeting_id} - Meeting cancelled successfully")
    
    def test_get_recordings(self, auth_token):
        """Test GET /api/meetings/recordings - List recordings"""
        response = requests.get(
            f"{BASE_URL}/api/meetings/recordings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/meetings/recordings - Found {len(data)} recordings")
    
    def test_get_summaries(self, auth_token):
        """Test GET /api/meetings/summaries - List AI summaries"""
        response = requests.get(
            f"{BASE_URL}/api/meetings/summaries",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/meetings/summaries - Found {len(data)} AI summaries")


class TestSchoolRegistration:
    """School Registration API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get director auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@schooltino.com",
            "password": "admin123"
        })
        return response.json()["token"]
    
    def test_create_school(self, auth_token):
        """Test POST /api/schools - Create new school with comprehensive details"""
        school_data = {
            "name": "TEST_Delhi Public School",
            "registration_number": "CBSE/TEST/12345",
            "established_year": 1995,
            "board_type": "CBSE",
            "school_type": "K-12",
            "medium": "English",
            "shift": "Day",
            "address": "123 Test Street, Test Area",
            "city": "Delhi",
            "state": "Delhi",
            "pincode": "110001",
            "phone": "+91 9876543210",
            "email": "test@school.com",
            "motto": "Knowledge is Power",
            "principal_name": "Dr. Test Principal",
            "about_school": "A premier educational institution",
            "vision": "To provide quality education",
            "mission": "Empowering students for future",
            "facilities": ["Computer Lab", "Library", "Playground"],
            "total_capacity": 2000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schools",
            json=school_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # School creation should succeed
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        print(f"✅ POST /api/schools - School created with ID: {data['id']}")
        return data["id"]
    
    def test_get_schools(self, auth_token):
        """Test GET /api/schools - List all schools"""
        response = requests.get(
            f"{BASE_URL}/api/schools",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/schools - Found {len(data)} schools")


class TestTeacherDashboard:
    """Teacher Dashboard API tests"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teacher@schooltino.com",
            "password": "teacher123"
        })
        return response.json()["token"]
    
    def test_teacher_dashboard_access(self, teacher_token):
        """Test teacher can access dashboard data"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200
        print(f"✅ Teacher dashboard access successful")
    
    def test_teacher_classes(self, teacher_token):
        """Test teacher can get their classes"""
        response = requests.get(
            f"{BASE_URL}/api/classes",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/classes - Teacher has {len(data)} classes")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✅ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
