"""
Iteration 45 - Tino AI Redesign Tests
Testing:
- Tino AI Chat endpoint
- Tino Voice TTS endpoint
- Tino Voice status endpoint
- Tino Voice voices endpoint
- Quick stats endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "director@test.com"
TEST_PASSWORD = "test1234"
TEST_SCHOOL_ID = "SCH-TEST-2026"


class TestTinoVoiceEndpoints:
    """Test Tino Voice API endpoints"""
    
    def test_voice_status_endpoint(self):
        """Test /api/tino-voice/status returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/tino-voice/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "elevenlabs_configured" in data
        assert "available_voices" in data
        assert "tts_enabled" in data
        assert "stt_enabled" in data
        
        # Verify ElevenLabs is configured
        assert data["elevenlabs_configured"] == True
        assert data["available_voices"] == 4
        assert data["tts_enabled"] == True
        print(f"Voice status: {data}")
    
    def test_voices_endpoint(self):
        """Test /api/tino-voice/voices returns 4 voice options"""
        response = requests.get(f"{BASE_URL}/api/tino-voice/voices")
        assert response.status_code == 200
        
        data = response.json()
        assert "voices" in data
        voices = data["voices"]
        
        # Should have 4 voices
        assert len(voices) == 4
        
        # Check voice IDs
        voice_ids = [v["id"] for v in voices]
        assert "male_hindi" in voice_ids
        assert "female_hindi" in voice_ids
        assert "male_english" in voice_ids
        assert "female_english" in voice_ids
        
        # Check voice structure
        for voice in voices:
            assert "id" in voice
            assert "name" in voice
            assert "description" in voice
            assert "gender" in voice
            assert "language" in voice
        
        print(f"Available voices: {voice_ids}")
    
    def test_tts_endpoint_male_english(self):
        """Test /api/tino-voice/tts with male English voice"""
        response = requests.post(
            f"{BASE_URL}/api/tino-voice/tts",
            json={
                "text": "Hello, this is a test",
                "voice_type": "male_english",
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert "audio_base64" in data
        assert "voice_type" in data
        assert "text" in data
        
        # Should have audio data
        assert data["success"] == True
        assert len(data["audio_base64"]) > 0
        assert data["voice_type"] == "male_english"
        print(f"TTS male_english success: {data['success']}, audio length: {len(data['audio_base64'])}")
    
    def test_tts_endpoint_female_hindi(self):
        """Test /api/tino-voice/tts with female Hindi voice"""
        response = requests.post(
            f"{BASE_URL}/api/tino-voice/tts",
            json={
                "text": "नमस्ते, यह एक परीक्षण है",
                "voice_type": "female_hindi",
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert len(data["audio_base64"]) > 0
        assert data["voice_type"] == "female_hindi"
        print(f"TTS female_hindi success: {data['success']}")


class TestTinoAIEndpoints:
    """Test Tino AI Chat endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_login_success(self):
        """Test login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["role"] == "director"
        print(f"Login successful for: {data['user']['email']}")
    
    def test_tino_ai_chat_endpoint(self, auth_token):
        """Test /api/tino-ai/chat endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Hello",
                "school_id": TEST_SCHOOL_ID,
                "language": "en"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert "data" in data
        assert "suggestions" in data
        
        # Response should contain greeting
        assert len(data["response"]) > 0
        print(f"Tino AI response: {data['response'][:100]}...")
    
    def test_tino_ai_chat_hindi(self, auth_token):
        """Test /api/tino-ai/chat with Hindi message"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "आज की attendance कितनी है?",
                "school_id": TEST_SCHOOL_ID,
                "language": "hi"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"Tino AI Hindi response: {data['response'][:100]}...")
    
    def test_quick_stats_endpoint(self, auth_token):
        """Test /api/tino-ai/quick-stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Check for expected stats fields
        assert "total_students" in data or "school_name" in data
        print(f"Quick stats: {data}")


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
