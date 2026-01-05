"""
Test Suite for Tino AI Voice Assistant - Iteration 22
Tests: Chat endpoint, TTS endpoint, Status endpoint, Role-based responses
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVoiceAssistantStatus:
    """Test voice assistant status endpoint"""
    
    def test_status_endpoint_returns_200(self):
        """Test that status endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        assert response.status_code == 200
        
    def test_status_returns_tts_available(self):
        """Test that status returns tts_available field"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        data = response.json()
        assert "tts_available" in data
        assert isinstance(data["tts_available"], bool)
        
    def test_status_returns_stt_available(self):
        """Test that status returns stt_available field"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        data = response.json()
        assert "stt_available" in data
        assert isinstance(data["stt_available"], bool)
        
    def test_status_returns_ai_available(self):
        """Test that status returns ai_available field"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        data = response.json()
        assert "ai_available" in data
        assert isinstance(data["ai_available"], bool)
        
    def test_status_returns_voices(self):
        """Test that status returns voice options"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        data = response.json()
        assert "voices" in data
        assert "male" in data["voices"]
        assert "female" in data["voices"]


class TestVoiceAssistantChat:
    """Test voice assistant chat endpoint"""
    
    def test_chat_endpoint_returns_200(self):
        """Test that chat endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "hello",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test User",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        
    def test_chat_returns_message(self):
        """Test that chat returns a message field"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "hello",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test User",
                "voice_gender": "female"
            }
        )
        data = response.json()
        assert "message" in data
        assert len(data["message"]) > 0
        
    def test_chat_attendance_command(self):
        """Test attendance command returns meaningful response"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "attendance dikha do",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test Director",
                "voice_gender": "female"
            }
        )
        data = response.json()
        assert response.status_code == 200
        assert "message" in data
        # Should contain attendance-related info
        assert any(word in data["message"].lower() for word in ["attendance", "present", "absent", "student", "hajri", "mark"])
        assert data.get("action") == "show_attendance"
        
    def test_chat_fee_status_command(self):
        """Test fee status command returns meaningful response"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "fee status batao",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test Director",
                "voice_gender": "male"
            }
        )
        data = response.json()
        assert response.status_code == 200
        assert "message" in data
        # Should contain fee-related info
        assert any(word in data["message"].lower() for word in ["fee", "pending", "paid", "collection", "baki", "record"])
        assert data.get("action") == "fee_status"
        
    def test_chat_returns_audio_base64(self):
        """Test that chat returns audio_base64 for TTS"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "hello",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test User",
                "voice_gender": "female"
            }
        )
        data = response.json()
        # audio_base64 should be present (may be None if TTS fails)
        assert "audio_base64" in data
        
    def test_chat_with_male_voice(self):
        """Test chat with male voice gender"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "namaste",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test User",
                "voice_gender": "male"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
    def test_chat_teacher_role(self):
        """Test chat with teacher role"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "meri class batao",
                "school_id": "default",
                "user_id": "test-teacher",
                "user_role": "teacher",
                "user_name": "Test Teacher",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestVoiceAssistantTTS:
    """Test voice assistant TTS endpoint"""
    
    def test_tts_endpoint_returns_200(self):
        """Test that TTS endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={
                "text": "Hello, this is a test",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        
    def test_tts_returns_audio_base64(self):
        """Test that TTS returns audio_base64"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={
                "text": "Hello, this is a test",
                "voice_gender": "female"
            }
        )
        data = response.json()
        assert "audio_base64" in data
        assert len(data["audio_base64"]) > 0
        
    def test_tts_male_voice(self):
        """Test TTS with male voice"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={
                "text": "Testing male voice",
                "voice_gender": "male"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "audio_base64" in data
        assert data.get("voice") == "male"
        
    def test_tts_female_voice(self):
        """Test TTS with female voice"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={
                "text": "Testing female voice",
                "voice_gender": "female"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "audio_base64" in data
        assert data.get("voice") == "female"


class TestVoiceAssistantCommands:
    """Test voice assistant command detection and execution"""
    
    def test_create_classes_command_requires_confirmation(self):
        """Test that create classes command requires confirmation"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "sabhi classes create karo",
                "school_id": "test-school",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test Director",
                "voice_gender": "female"
            }
        )
        data = response.json()
        assert response.status_code == 200
        # Should require confirmation for class creation
        if data.get("action") == "create_classes":
            assert data.get("requires_confirmation") == True
            
    def test_add_student_redirect(self):
        """Test that add student command returns redirect"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            json={
                "message": "naya student add karo",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "user_name": "Test Director",
                "voice_gender": "female"
            }
        )
        data = response.json()
        assert response.status_code == 200
        if data.get("action") == "add_student":
            assert data.get("action_type") == "redirect"
            assert data.get("data", {}).get("redirect") == "/app/students"


class TestVoiceAssistantExecuteCommand:
    """Test voice assistant execute-command endpoint"""
    
    def test_execute_command_endpoint(self):
        """Test execute-command endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/execute-command",
            json={
                "command": "attendance dikha do",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female",
                "confirmed": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestVoiceAssistantLegacy:
    """Test legacy process-command endpoint"""
    
    def test_process_command_legacy_endpoint(self):
        """Test legacy process-command endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "hello",
                "school_id": "default",
                "user_id": "test-user",
                "user_role": "director",
                "voice_gender": "female",
                "confirmed": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
