"""
AI History API Tests - Iteration 15
Tests for AI Conversation History with Undo/Restore feature
Endpoints: /api/ai-history/save, /api/ai-history/list, /api/ai-history/stats, /api/ai-history/undo, /api/ai-history/restore
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SCHOOL_ID = "026e7121-10e0-4eb7-9208-8f105ea2aac6"
USER_ID = "bf908472-e015-4a70-83d0-8795f17d7a05"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAIHistorySave:
    """Tests for /api/ai-history/save endpoint"""
    
    def test_save_voice_conversation(self, api_client):
        """Test saving a voice type conversation"""
        payload = {
            "user_input": f"TEST_voice_command_{uuid.uuid4().hex[:8]}",
            "ai_response": "Test voice response",
            "action_type": "voice",
            "action_data": None,
            "status": "completed"
        }
        response = api_client.post(
            f"{BASE_URL}/api/ai-history/save?school_id={SCHOOL_ID}&user_id={USER_ID}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "conversation_id" in data
        assert data["message"] == "Conversation saved"
    
    def test_save_command_conversation_with_undo_data(self, api_client):
        """Test saving a command type conversation with undo data"""
        payload = {
            "user_input": f"TEST_command_{uuid.uuid4().hex[:8]}",
            "ai_response": "Test command response",
            "action_type": "command",
            "action_data": {
                "action": "create_all_classes",
                "affected_ids": ["class1", "class2"],
                "original_state": [{"name": "Class 1"}, {"name": "Class 2"}]
            },
            "status": "completed"
        }
        response = api_client.post(
            f"{BASE_URL}/api/ai-history/save?school_id={SCHOOL_ID}&user_id={USER_ID}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "conversation_id" in data
    
    def test_save_paper_conversation(self, api_client):
        """Test saving a paper type conversation"""
        payload = {
            "user_input": f"TEST_paper_{uuid.uuid4().hex[:8]}",
            "ai_response": "Test paper generated",
            "action_type": "paper",
            "action_data": {"paper_id": "test_paper_123"},
            "status": "completed"
        }
        response = api_client.post(
            f"{BASE_URL}/api/ai-history/save?school_id={SCHOOL_ID}&user_id={USER_ID}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_save_content_conversation(self, api_client):
        """Test saving a content type conversation"""
        payload = {
            "user_input": f"TEST_content_{uuid.uuid4().hex[:8]}",
            "ai_response": "Test content created",
            "action_type": "content",
            "action_data": {"content_id": "test_content_123"},
            "status": "completed"
        }
        response = api_client.post(
            f"{BASE_URL}/api/ai-history/save?school_id={SCHOOL_ID}&user_id={USER_ID}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestAIHistoryList:
    """Tests for /api/ai-history/list/{school_id} endpoint"""
    
    def test_list_all_conversations(self, api_client):
        """Test listing all conversations for a school"""
        response = api_client.get(f"{BASE_URL}/api/ai-history/list/{SCHOOL_ID}?limit=50")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        assert isinstance(data["conversations"], list)
        # Verify conversation structure
        if data["conversations"]:
            conv = data["conversations"][0]
            assert "id" in conv
            assert "user_input" in conv
            assert "ai_response" in conv
            assert "action_type" in conv
            assert "status" in conv
            assert "created_at" in conv
            assert "can_undo" in conv
    
    def test_list_with_action_type_filter(self, api_client):
        """Test filtering conversations by action type"""
        response = api_client.get(f"{BASE_URL}/api/ai-history/list/{SCHOOL_ID}?action_type=command")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        # All returned conversations should be of type 'command'
        for conv in data["conversations"]:
            assert conv["action_type"] == "command"
    
    def test_list_with_limit(self, api_client):
        """Test limiting number of conversations returned"""
        response = api_client.get(f"{BASE_URL}/api/ai-history/list/{SCHOOL_ID}?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["conversations"]) <= 2


class TestAIHistoryStats:
    """Tests for /api/ai-history/stats/{school_id} endpoint"""
    
    def test_get_stats(self, api_client):
        """Test getting AI usage statistics"""
        response = api_client.get(f"{BASE_URL}/api/ai-history/stats/{SCHOOL_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "total_conversations" in data
        assert "by_type" in data
        assert "last_7_days" in data
        assert "most_used" in data
        assert isinstance(data["total_conversations"], int)
        assert isinstance(data["by_type"], dict)
        assert isinstance(data["last_7_days"], int)


class TestAIHistoryUndoRestore:
    """Tests for /api/ai-history/undo and /api/ai-history/restore endpoints"""
    
    def test_undo_and_restore_flow(self, api_client):
        """Test complete undo and restore flow"""
        # Step 1: Create a new conversation that can be undone
        create_payload = {
            "user_input": f"TEST_undo_restore_{uuid.uuid4().hex[:8]}",
            "ai_response": "Test response for undo/restore",
            "action_type": "command",
            "action_data": {"action": "test_action"},
            "status": "completed"
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/ai-history/save?school_id={SCHOOL_ID}&user_id={USER_ID}",
            json=create_payload
        )
        assert create_response.status_code == 200
        conversation_id = create_response.json()["conversation_id"]
        
        # Step 2: Undo the conversation
        undo_payload = {
            "conversation_id": conversation_id,
            "reason": "Testing undo functionality"
        }
        undo_response = api_client.post(
            f"{BASE_URL}/api/ai-history/undo?school_id={SCHOOL_ID}",
            json=undo_payload
        )
        assert undo_response.status_code == 200
        undo_data = undo_response.json()
        assert undo_data["success"] is True
        assert undo_data["message"] == "Action undone successfully"
        
        # Step 3: Verify status changed to 'undone'
        list_response = api_client.get(f"{BASE_URL}/api/ai-history/list/{SCHOOL_ID}?limit=100")
        assert list_response.status_code == 200
        conversations = list_response.json()["conversations"]
        undone_conv = next((c for c in conversations if c["id"] == conversation_id), None)
        assert undone_conv is not None
        assert undone_conv["status"] == "undone"
        
        # Step 4: Restore the conversation
        restore_response = api_client.post(
            f"{BASE_URL}/api/ai-history/restore/{conversation_id}?school_id={SCHOOL_ID}"
        )
        assert restore_response.status_code == 200
        restore_data = restore_response.json()
        assert restore_data["success"] is True
        assert restore_data["message"] == "Action restored successfully"
    
    def test_undo_non_existent_conversation(self, api_client):
        """Test undo with non-existent conversation ID"""
        undo_payload = {
            "conversation_id": "000000000000000000000000",
            "reason": "Testing non-existent"
        }
        response = api_client.post(
            f"{BASE_URL}/api/ai-history/undo?school_id={SCHOOL_ID}",
            json=undo_payload
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_undo_voice_conversation_not_allowed(self, api_client):
        """Test that voice conversations cannot be undone"""
        # Create a voice conversation (can_undo should be False)
        create_payload = {
            "user_input": f"TEST_voice_no_undo_{uuid.uuid4().hex[:8]}",
            "ai_response": "Voice response",
            "action_type": "voice",
            "status": "completed"
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/ai-history/save?school_id={SCHOOL_ID}&user_id={USER_ID}",
            json=create_payload
        )
        conversation_id = create_response.json()["conversation_id"]
        
        # Try to undo - should fail
        undo_payload = {"conversation_id": conversation_id}
        undo_response = api_client.post(
            f"{BASE_URL}/api/ai-history/undo?school_id={SCHOOL_ID}",
            json=undo_payload
        )
        assert undo_response.status_code == 400
        assert "cannot be undone" in undo_response.json()["detail"].lower()


class TestAIHistoryClear:
    """Tests for /api/ai-history/clear/{school_id} endpoint"""
    
    def test_clear_old_history(self, api_client):
        """Test clearing old conversation history"""
        response = api_client.delete(f"{BASE_URL}/api/ai-history/clear/{SCHOOL_ID}?days_old=365")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "deleted_count" in data
        assert "message" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
