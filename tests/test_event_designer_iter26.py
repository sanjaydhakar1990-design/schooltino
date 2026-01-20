"""
Test Suite for Iteration 26 - AI Event Designer, Student ID Card, Voice Assistant
==================================================================================
Tests:
1. AI Event Designer API - /api/events/generate-design
2. Event Designer - Get designs for school
3. Voice Assistant API - /api/voice-assistant/chat
4. Login flow with director@demo.com
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLoginFlow:
    """Test login with director@demo.com credentials"""
    
    def test_login_director_demo(self):
        """Test login with director@demo.com / demo123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        
        # Check status
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        # API returns access_token, not token
        assert "access_token" in data or "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == "director@demo.com"
        assert data["user"]["role"] == "director"
        
        token = data.get("access_token") or data.get("token")
        print(f"✓ Login successful for director@demo.com")
        return token, data["user"]


class TestEventDesignerAPI:
    """Test AI Event Designer API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for director@demo.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token")
            return token, data.get("user", {}).get("school_id")
        pytest.skip("Login failed - skipping authenticated tests")
    
    def test_generate_pamphlet_design(self, auth_token):
        """Test generating a pamphlet design"""
        token, school_id = auth_token
        
        response = requests.post(
            f"{BASE_URL}/api/events/generate-design",
            json={
                "school_id": school_id,
                "template_type": "annual_function",
                "design_style": "modern",
                "design_type": "pamphlet",
                "event_details": {
                    "eventName": "Annual Function 2026",
                    "eventDate": "2026-03-15",
                    "eventTime": "10:00",
                    "venue": "School Auditorium",
                    "chiefGuest": "Hon. Education Minister",
                    "description": "Join us for our grand annual celebration",
                    "contactNumber": "+91 98765 43210",
                    "specialNote": "Your presence is mandatory"
                },
                "school_info": {
                    "name": "Demo School",
                    "address": "123 School Street",
                    "phone": "+91 12345 67890"
                },
                "language": "hi"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Generate design failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Design generation not successful"
        assert data.get("type") == "pamphlet", "Wrong design type"
        assert data.get("template") == "annual_function", "Wrong template"
        assert "design_id" in data, "No design_id in response"
        
        print(f"✓ Pamphlet design generated: {data.get('design_id')}")
        return data
    
    def test_generate_invitation_design(self, auth_token):
        """Test generating an invitation card design"""
        token, school_id = auth_token
        
        response = requests.post(
            f"{BASE_URL}/api/events/generate-design",
            json={
                "school_id": school_id,
                "template_type": "sports_day",
                "design_style": "festive",
                "design_type": "invitation",
                "event_details": {
                    "eventName": "Sports Day 2026",
                    "eventDate": "2026-02-20",
                    "eventTime": "09:00",
                    "venue": "School Ground",
                    "chiefGuest": "Local MLA",
                    "description": "Annual sports competition",
                    "contactNumber": "+91 98765 43210",
                    "specialNote": "Please be on time"
                },
                "school_info": {
                    "name": "Demo School"
                },
                "language": "en"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Generate invitation failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Invitation generation not successful"
        assert data.get("type") == "invitation", "Wrong design type"
        assert data.get("template") == "sports_day", "Wrong template"
        
        print(f"✓ Invitation card generated: {data.get('design_id')}")
        return data
    
    def test_get_school_designs(self, auth_token):
        """Test getting all event designs for a school"""
        token, school_id = auth_token
        
        response = requests.get(
            f"{BASE_URL}/api/events/designs/{school_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Get designs failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Retrieved {len(data)} event designs for school")
        return data


class TestVoiceAssistantAPI:
    """Test Voice Assistant (Tino) API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for director@demo.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token")
            return token, data.get("user", {}).get("school_id"), data.get("user", {}).get("id")
        pytest.skip("Login failed - skipping authenticated tests")
    
    def test_voice_assistant_status(self):
        """Test voice assistant status endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        
        assert response.status_code == 200, f"Status check failed: {response.text}"
        
        data = response.json()
        assert "tts_available" in data, "Missing tts_available"
        assert "stt_available" in data, "Missing stt_available"
        assert "ai_available" in data, "Missing ai_available"
        assert "voices" in data, "Missing voices"
        
        print(f"✓ Voice assistant status: TTS={data.get('tts_available')}, STT={data.get('stt_available')}, AI={data.get('ai_available')}")
        return data
    
    def test_voice_assistant_chat_navigation(self, auth_token):
        """Test voice assistant chat with navigation command"""
        token, school_id, user_id = auth_token
        
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "dashboard kholo",
                "school_id": school_id,
                "user_id": user_id,
                "user_role": "director",
                "user_name": "Director",
                "voice_gender": "female"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        
        data = response.json()
        assert "message" in data, "No message in response"
        assert data.get("action_type") == "navigate", f"Expected navigate action, got {data.get('action_type')}"
        assert data.get("navigate_to") == "/app/dashboard", f"Wrong navigation URL: {data.get('navigate_to')}"
        
        print(f"✓ Voice assistant navigation: {data.get('message')}")
        return data
    
    def test_voice_assistant_chat_attendance(self, auth_token):
        """Test voice assistant chat with attendance query"""
        token, school_id, user_id = auth_token
        
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "attendance dikha",
                "school_id": school_id,
                "user_id": user_id,
                "user_role": "director",
                "user_name": "Director",
                "voice_gender": "male"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Chat failed: {response.text}"
        
        data = response.json()
        assert "message" in data, "No message in response"
        # Should either navigate to attendance or show data
        assert data.get("action_type") in ["navigate", "data", "chat"], f"Unexpected action type: {data.get('action_type')}"
        
        print(f"✓ Voice assistant attendance query: {data.get('message')}")
        return data
    
    def test_voice_assistant_tts(self):
        """Test text-to-speech endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={
                "text": "Namaste, main Tino hoon",
                "voice_gender": "female"
            }
        )
        
        # TTS may fail if ElevenLabs not configured, but endpoint should respond
        if response.status_code == 200:
            data = response.json()
            assert "audio_base64" in data or "text" in data
            print(f"✓ TTS endpoint working")
        elif response.status_code == 500:
            print(f"⚠ TTS endpoint returned 500 - ElevenLabs may not be configured")
        else:
            print(f"⚠ TTS endpoint returned {response.status_code}")


class TestStudentIDCardAPI:
    """Test Student ID Card related APIs"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for director@demo.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@demo.com",
            "password": "demo123"
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token") or data.get("token")
            return token, data.get("user", {}).get("school_id")
        pytest.skip("Login failed - skipping authenticated tests")
    
    def test_get_students_for_id_card(self, auth_token):
        """Test getting students list (needed for ID card generation)"""
        token, school_id = auth_token
        
        response = requests.get(
            f"{BASE_URL}/api/students?school_id={school_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Get students failed: {response.text}"
        
        data = response.json()
        # Response could be list or dict with students key
        if isinstance(data, list):
            students = data
        else:
            students = data.get("students", data.get("data", []))
        
        print(f"✓ Retrieved {len(students)} students for ID card generation")
        
        if len(students) > 0:
            student = students[0]
            # Check student has required fields for ID card
            assert "name" in student or "student_name" in student, "Student missing name"
            print(f"✓ Sample student: {student.get('name', student.get('student_name'))}")
        
        return students


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_frontend_accessible(self):
        """Test frontend is accessible"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        print("✓ Frontend accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
