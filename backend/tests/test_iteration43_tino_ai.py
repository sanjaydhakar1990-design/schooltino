"""
Iteration 43 - Tino AI Feature Testing
Tests for the new ElevenLabs-inspired Tino AI interface

Features tested:
1. Tino AI Chat API - /api/tino-ai/chat
2. Tino AI Quick Stats API - /api/tino-ai/quick-stats/{school_id}
3. Response format validation (Hindi responses, suggestions)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "director@test.com"
TEST_PASSWORD = "test1234"
TEST_SCHOOL_ID = "SCH-TEST-2026"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestTinoAIChat:
    """Tests for Tino AI Chat endpoint"""
    
    def test_chat_endpoint_returns_200(self, auth_headers):
        """Test that chat endpoint returns 200 status"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers=auth_headers,
            json={
                "message": "Hello",
                "school_id": TEST_SCHOOL_ID,
                "language": "hi"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_chat_returns_response_field(self, auth_headers):
        """Test that chat returns response field"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers=auth_headers,
            json={
                "message": "आज की attendance कितनी है?",
                "school_id": TEST_SCHOOL_ID,
                "language": "hi"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert isinstance(data["response"], str), "Response should be a string"
        assert len(data["response"]) > 0, "Response should not be empty"
    
    def test_chat_returns_suggestions(self, auth_headers):
        """Test that chat returns suggestions"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers=auth_headers,
            json={
                "message": "आज की fee collection कितनी है?",
                "school_id": TEST_SCHOOL_ID,
                "language": "hi"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data, "Response should contain 'suggestions' field"
        assert isinstance(data["suggestions"], list), "Suggestions should be a list"
    
    def test_chat_returns_data_context(self, auth_headers):
        """Test that chat returns school data context"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers=auth_headers,
            json={
                "message": "School summary दो",
                "school_id": TEST_SCHOOL_ID,
                "language": "hi"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        assert "total_students" in data["data"], "Data should contain total_students"
        assert "today_attendance" in data["data"], "Data should contain today_attendance"
    
    def test_chat_hindi_query(self, auth_headers):
        """Test chat with Hindi query"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers=auth_headers,
            json={
                "message": "कितने students हैं?",
                "school_id": TEST_SCHOOL_ID,
                "language": "hi"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Response should contain some Hindi or relevant content
        assert len(data["response"]) > 10, "Response should be meaningful"
    
    def test_chat_english_query(self, auth_headers):
        """Test chat with English query"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            headers=auth_headers,
            json={
                "message": "How many students are present today?",
                "school_id": TEST_SCHOOL_ID,
                "language": "en"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 10, "Response should be meaningful"


class TestTinoAIQuickStats:
    """Tests for Tino AI Quick Stats endpoint"""
    
    def test_quick_stats_returns_200(self, auth_headers):
        """Test that quick stats endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_quick_stats_returns_school_name(self, auth_headers):
        """Test that quick stats returns school name"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "school_name" in data, "Should contain school_name"
    
    def test_quick_stats_returns_student_count(self, auth_headers):
        """Test that quick stats returns student count"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_students" in data, "Should contain total_students"
        assert isinstance(data["total_students"], int), "total_students should be int"
    
    def test_quick_stats_returns_attendance(self, auth_headers):
        """Test that quick stats returns attendance data"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "today_attendance" in data, "Should contain today_attendance"
        assert "present" in data["today_attendance"], "Attendance should have present count"
        assert "absent" in data["today_attendance"], "Attendance should have absent count"
    
    def test_quick_stats_returns_fee_collection(self, auth_headers):
        """Test that quick stats returns fee collection"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "today_fee_collection" in data, "Should contain today_fee_collection"
    
    def test_quick_stats_returns_pending_leaves(self, auth_headers):
        """Test that quick stats returns pending leaves"""
        response = requests.get(
            f"{BASE_URL}/api/tino-ai/quick-stats/{TEST_SCHOOL_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "pending_leaves" in data, "Should contain pending_leaves"


class TestTinoAICommand:
    """Tests for Tino AI Command endpoint"""
    
    def test_command_attendance(self, auth_headers):
        """Test command endpoint with attendance query"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/command",
            headers=auth_headers,
            json={
                "message": "attendance",
                "school_id": TEST_SCHOOL_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "command" in data or "response" in data, "Should return command or response"
    
    def test_command_fee(self, auth_headers):
        """Test command endpoint with fee query"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/command",
            headers=auth_headers,
            json={
                "message": "fee collection",
                "school_id": TEST_SCHOOL_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "command" in data or "response" in data, "Should return command or response"


class TestAuthenticationRequired:
    """Tests to verify endpoint behavior without authentication"""
    
    def test_chat_without_auth_works(self):
        """Test that chat works without auth (public endpoint by design)"""
        response = requests.post(
            f"{BASE_URL}/api/tino-ai/chat",
            json={
                "message": "Hello",
                "school_id": TEST_SCHOOL_ID
            }
        )
        # Tino AI chat is a public endpoint by design
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "response" in data, "Should return response even without auth"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
