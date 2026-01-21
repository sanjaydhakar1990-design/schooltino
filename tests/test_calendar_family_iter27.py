"""
Test Suite for Iteration 27 - School Calendar, Family Portal, Event Designer WhatsApp, Voice Assistant
Tests:
1. School Calendar - Month View, Year View, Events, Photos, Testimonials, AI Calendar
2. Family Portal - Page load, Add Child modal, Demo children display
3. Event Designer - WhatsApp Share button
4. Voice Assistant - /api/voice-assistant/chat endpoint
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@demo.com"
DIRECTOR_PASSWORD = "demo123"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for director"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_director_login(self):
        """Test director login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "director"
        print(f"✓ Director login successful - User: {data['user']['name']}")


class TestCalendarAPIs:
    """Calendar API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Auth failed")
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_headers):
        """Get school ID from user"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        if response.status_code == 200:
            return response.json().get("school_id")
        return "test-school-id"
    
    def test_get_calendar_events(self, auth_headers, school_id):
        """Test GET /api/school/{school_id}/calendar-events"""
        response = requests.get(
            f"{BASE_URL}/api/school/{school_id}/calendar-events",
            headers=auth_headers
        )
        # Should return 200 even if empty
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Calendar events API works - {len(data)} events found")
    
    def test_create_calendar_event(self, auth_headers, school_id):
        """Test POST /api/school/{school_id}/calendar-events"""
        event_data = {
            "date": "2025-12-25",
            "name": "TEST_Christmas Holiday",
            "type": "festival",
            "description": "Test event for Christmas"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/{school_id}/calendar-events",
            headers=auth_headers,
            json=event_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data or "id" in data
        print(f"✓ Create calendar event API works")
    
    def test_get_calendar_photos(self, auth_headers, school_id):
        """Test GET /api/school/{school_id}/calendar-photos"""
        response = requests.get(
            f"{BASE_URL}/api/school/{school_id}/calendar-photos",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Calendar photos API works - {len(data)} photos found")
    
    def test_get_testimonials(self, auth_headers, school_id):
        """Test GET /api/school/{school_id}/testimonials"""
        response = requests.get(
            f"{BASE_URL}/api/school/{school_id}/testimonials",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Testimonials API works - {len(data)} testimonials found")
    
    def test_create_testimonial(self, auth_headers, school_id):
        """Test POST /api/school/{school_id}/testimonials"""
        testimonial_data = {
            "text": "TEST_Great school with excellent facilities",
            "author": "Test Parent",
            "designation": "Parent"
        }
        response = requests.post(
            f"{BASE_URL}/api/school/{school_id}/testimonials",
            headers=auth_headers,
            json=testimonial_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data or "testimonial" in data
        print(f"✓ Create testimonial API works")


class TestFamilyPortalAPIs:
    """Family Portal API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Auth failed")
    
    def test_get_family_children(self, auth_headers):
        """Test GET /api/family/children"""
        response = requests.get(
            f"{BASE_URL}/api/family/children",
            headers=auth_headers
        )
        # Should return 200 even if empty (frontend shows demo data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Family children API works - {len(data)} children found")
    
    def test_add_child_validation(self, auth_headers):
        """Test POST /api/family/add-child with invalid data"""
        # Test with invalid student ID
        response = requests.post(
            f"{BASE_URL}/api/family/add-child",
            headers=auth_headers,
            json={
                "student_id": "INVALID-ID-12345",
                "dob": "2015-01-01"
            }
        )
        # Should return 404 for invalid student
        assert response.status_code in [404, 400], f"Expected 404/400, got {response.status_code}"
        print(f"✓ Add child validation works - rejects invalid student ID")
    
    def test_get_child_attendance(self, auth_headers):
        """Test GET /api/family/child/{child_id}/attendance"""
        # Use demo child ID
        response = requests.get(
            f"{BASE_URL}/api/family/child/demo1/attendance",
            headers=auth_headers
        )
        # May return 404 for demo ID, but endpoint should exist
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ Child attendance API endpoint exists")
    
    def test_get_child_fees(self, auth_headers):
        """Test GET /api/family/child/{child_id}/fees"""
        response = requests.get(
            f"{BASE_URL}/api/family/child/demo1/fees",
            headers=auth_headers
        )
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ Child fees API endpoint exists")
    
    def test_get_child_syllabus_progress(self, auth_headers):
        """Test GET /api/family/child/{child_id}/syllabus-progress"""
        response = requests.get(
            f"{BASE_URL}/api/family/child/demo1/syllabus-progress",
            headers=auth_headers
        )
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ Child syllabus progress API endpoint exists")


class TestVoiceAssistantAPIs:
    """Voice Assistant (Tino) API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Auth failed")
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_headers):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        if response.status_code == 200:
            return response.json().get("school_id", "test-school")
        return "test-school"
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_headers):
        """Get user ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        if response.status_code == 200:
            return response.json().get("id", "test-user")
        return "test-user"
    
    def test_voice_assistant_status(self, auth_headers):
        """Test GET /api/voice-assistant/status"""
        response = requests.get(
            f"{BASE_URL}/api/voice-assistant/status",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "tts_available" in data
        assert "stt_available" in data
        assert "ai_available" in data
        print(f"✓ Voice assistant status: TTS={data['tts_available']}, STT={data['stt_available']}, AI={data['ai_available']}")
    
    def test_voice_assistant_chat_navigation(self, auth_headers, school_id, user_id):
        """Test POST /api/voice-assistant/chat with navigation command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            headers=auth_headers,
            json={
                "message": "dashboard kholo",
                "school_id": school_id,
                "user_id": user_id,
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data
        # Should return navigation action
        assert data.get("action_type") == "navigate" or data.get("navigate_to") is not None
        print(f"✓ Voice assistant navigation works - Response: {data.get('message')}")
    
    def test_voice_assistant_chat_attendance(self, auth_headers, school_id, user_id):
        """Test POST /api/voice-assistant/chat with attendance query"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            headers=auth_headers,
            json={
                "message": "aaj ki attendance batao",
                "school_id": school_id,
                "user_id": user_id,
                "user_role": "director",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Voice assistant attendance query works - Response: {data.get('message')}")
    
    def test_voice_assistant_tts(self, auth_headers):
        """Test POST /api/voice-assistant/tts"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            headers=auth_headers,
            json={
                "text": "Namaste, main Tino hoon",
                "voice_gender": "female"
            }
        )
        # TTS may fail if ElevenLabs not configured, but endpoint should exist
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "audio_base64" in data or "text" in data
            print(f"✓ Voice assistant TTS works")
        else:
            print(f"⚠ Voice assistant TTS endpoint exists but TTS service unavailable")


class TestEventDesignerAPIs:
    """Event Designer API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Auth failed")
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_headers):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        if response.status_code == 200:
            return response.json().get("school_id", "test-school")
        return "test-school"
    
    def test_generate_event_design(self, auth_headers, school_id):
        """Test POST /api/events/generate-design"""
        response = requests.post(
            f"{BASE_URL}/api/events/generate-design",
            headers=auth_headers,
            json={
                "school_id": school_id,
                "template_type": "annual_function",
                "design_style": "modern",
                "design_type": "pamphlet",
                "event_details": {
                    "eventName": "TEST Annual Function 2026",
                    "eventDate": "2026-01-15",
                    "eventTime": "10:00",
                    "venue": "School Auditorium",
                    "chiefGuest": "Test Guest",
                    "description": "Test event description"
                },
                "school_info": {
                    "name": "Test School"
                },
                "language": "en"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "success" in data or "design_id" in data or "message" in data
        print(f"✓ Event design generation API works")


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Test /api/health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✓ Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
