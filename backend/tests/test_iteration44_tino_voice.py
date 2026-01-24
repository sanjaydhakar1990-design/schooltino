"""
Iteration 44 - Tino AI Voice & Theme Testing
Tests for:
- ElevenLabs voice integration
- Tino AI chat functionality
- Voice settings endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTinoVoiceEndpoints:
    """Test Tino Voice API endpoints"""
    
    def test_get_available_voices(self):
        """Test /api/tino-voice/voices returns 4 voice options"""
        response = requests.get(f"{BASE_URL}/api/tino-voice/voices")
        assert response.status_code == 200
        
        data = response.json()
        assert "voices" in data
        assert len(data["voices"]) == 4
        
        # Verify voice options
        voice_ids = [v["id"] for v in data["voices"]]
        assert "male_hindi" in voice_ids
        assert "female_hindi" in voice_ids
        assert "male_english" in voice_ids
        assert "female_english" in voice_ids
        
        # Verify voice structure
        for voice in data["voices"]:
            assert "id" in voice
            assert "name" in voice
            assert "description" in voice
            assert "gender" in voice
            assert "language" in voice
    
    def test_voice_status_elevenlabs_configured(self):
        """Test /api/tino-voice/status confirms ElevenLabs is configured"""
        response = requests.get(f"{BASE_URL}/api/tino-voice/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "elevenlabs_configured" in data
        assert data["elevenlabs_configured"] == True
        assert data["available_voices"] == 4
        assert data["tts_enabled"] == True
        assert data["stt_enabled"] == True
    
    def test_tts_endpoint_exists(self):
        """Test /api/tino-voice/tts endpoint exists"""
        # Test with minimal payload
        response = requests.post(
            f"{BASE_URL}/api/tino-voice/tts",
            json={
                "text": "Hello",
                "voice_type": "male_hindi"
            }
        )
        # Should return 200 (success) or valid response
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert "voice_type" in data
        assert data["voice_type"] == "male_hindi"


class TestTinoAIChat:
    """Test Tino AI Chat endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "director@test.com", "password": "test1234"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_tino_ai_quick_stats(self, auth_token):
        """Test /api/tino-ai/quick-stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/SCH-TEST-2026",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Verify stats structure
        assert "total_students" in data or "students" in str(data).lower()
    
    def test_tino_ai_chat_hindi(self, auth_token):
        """Test Tino AI chat with Hindi message"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            json={
                "message": "नमस्ते",
                "school_id": "SCH-TEST-2026",
                "language": "hindi"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        # Response should contain Hindi or be relevant
        assert len(data["response"]) > 0
    
    def test_tino_ai_chat_english(self, auth_token):
        """Test Tino AI chat with English message"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            json={
                "message": "Hello",
                "school_id": "SCH-TEST-2026",
                "language": "english"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0


class TestAuthAndNavigation:
    """Test authentication and navigation"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "director@test.com", "password": "test1234"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "director"
    
    def test_school_data(self):
        """Test school data endpoint"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "director@test.com", "password": "test1234"}
        )
        token = login_response.json().get("access_token")
        
        # Get school data
        response = requests.get(
            f"{BASE_URL}/api/schools/SCH-TEST-2026",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
