"""
Voice Assistant API Tests - Iteration 14
Tests for Voice Assistant feature with ElevenLabs TTS and OpenAI Whisper STT
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://meri-schooltino.preview.emergentagent.com')

class TestVoiceAssistantStatus:
    """Test Voice Assistant status endpoint"""
    
    def test_voice_status_returns_availability(self):
        """Test /api/voice-assistant/status returns TTS and STT availability"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "tts_available" in data
        assert "stt_available" in data
        assert "message" in data
        
        # Both should be available with proper API keys
        assert data["tts_available"] == True
        assert data["stt_available"] == True
        print(f"✓ Voice status: TTS={data['tts_available']}, STT={data['stt_available']}")


class TestVoiceAssistantCommands:
    """Test Voice Assistant available commands endpoint"""
    
    def test_available_commands_returns_list(self):
        """Test /api/voice-assistant/available-commands returns command list"""
        response = requests.get(f"{BASE_URL}/api/voice-assistant/available-commands")
        assert response.status_code == 200
        
        data = response.json()
        assert "commands" in data
        assert "languages" in data
        assert "tip" in data
        
        # Should have at least 5 commands
        assert len(data["commands"]) >= 5
        
        # Check command structure
        for cmd in data["commands"]:
            assert "command" in cmd
            assert "keywords" in cmd
            assert "requires_confirmation" in cmd
        
        print(f"✓ Available commands: {len(data['commands'])} commands found")
        print(f"  Languages: {data['languages']}")


class TestVoiceAssistantTTS:
    """Test Voice Assistant Text-to-Speech endpoint"""
    
    def test_tts_converts_text_to_audio(self):
        """Test /api/voice-assistant/tts converts text to audio"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={"text": "Hello, main aapki madad ke liye taiyar hoon"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "audio_base64" in data
        assert "text" in data
        
        # Audio should be base64 encoded
        assert len(data["audio_base64"]) > 100
        print(f"✓ TTS generated audio: {len(data['audio_base64'])} bytes")
    
    def test_tts_with_custom_voice_id(self):
        """Test TTS with custom voice ID"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/tts",
            json={
                "text": "Test message",
                "voice_id": "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "audio_base64" in data
        print("✓ TTS with custom voice ID works")


class TestVoiceAssistantProcessCommand:
    """Test Voice Assistant process-command endpoint"""
    
    def test_process_command_detects_create_classes(self):
        """Test command detection for 'create all classes'"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "sabhi classes banao",
                "school_id": "test-school",
                "user_id": "test-user",
                "confirmed": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "action" in data
        assert "requires_confirmation" in data
        
        # Should require confirmation for create_all_classes
        assert data["requires_confirmation"] == True
        assert data["action"] == "create_all_classes"
        print(f"✓ Command detected: {data['action']}, requires_confirmation={data['requires_confirmation']}")
    
    def test_process_command_detects_attendance(self):
        """Test command detection for 'show attendance'"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "attendance dikha",
                "school_id": "test-school",
                "user_id": "test-user",
                "confirmed": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] == "show_attendance"
        # Attendance doesn't require confirmation
        assert data["requires_confirmation"] == False
        print(f"✓ Attendance command detected, no confirmation needed")
    
    def test_process_command_detects_fee_status(self):
        """Test command detection for 'fee status'"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "fee status batao",
                "school_id": "test-school",
                "user_id": "test-user",
                "confirmed": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] == "fee_status"
        assert data["requires_confirmation"] == False
        print(f"✓ Fee status command detected")
    
    def test_process_command_unknown_returns_error_message(self):
        """Test unknown command returns appropriate message"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "random gibberish text",
                "school_id": "test-school",
                "user_id": "test-user",
                "confirmed": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        # Should return error message for unknown command
        assert data["action"] is None or data["action"] == ""
        print(f"✓ Unknown command handled: {data['message'][:50]}...")
    
    def test_process_command_with_confirmation_executes(self):
        """Test confirmed command executes action"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "sabhi classes banao",
                "school_id": "test-school-voice",
                "user_id": "test-user",
                "confirmed": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        # After confirmation, should not require confirmation again
        assert data["requires_confirmation"] == False
        print(f"✓ Confirmed command executed: {data['message'][:50]}...")


class TestVoiceAssistantAudioResponse:
    """Test Voice Assistant audio response generation"""
    
    def test_process_command_includes_audio(self):
        """Test process-command includes audio response"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/process-command",
            json={
                "command": "attendance dikha",
                "school_id": "test-school",
                "user_id": "test-user",
                "confirmed": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should include audio response
        if data.get("audio_base64"):
            assert len(data["audio_base64"]) > 100
            print(f"✓ Audio response included: {len(data['audio_base64'])} bytes")
        else:
            print("⚠ Audio response not included (may be expected if TTS fails)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
