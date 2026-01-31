"""
Iteration 30 - Testing SchoolTino ERP Bug Fixes:
1. PWA Install button visibility in header after login
2. School data scoping - logged in user should only see their own school data in /api/schools
3. School settings API should only return user's school settings
4. Online Exam System page loads correctly
5. Online Exam API returns exams list (even if empty)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://edutracker-165.preview.emergentagent.com').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@demo.com"
DIRECTOR_PASSWORD = "demo123"
TEACHER_EMAIL = "teacher@demo.com"
TEACHER_PASSWORD = "demo123"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API Health: {data}")


class TestDirectorLogin:
    """Test director login and get token"""
    
    def test_director_login(self):
        """Test director login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "director"
        print(f"✓ Director login successful: {data['user']['name']}")
        return data["access_token"], data["user"]


class TestSchoolDataScoping:
    """Test that users can only see their own school data"""
    
    @pytest.fixture
    def director_auth(self):
        """Get director authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["access_token"],
            "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['access_token']}"}
        }
    
    @pytest.fixture
    def teacher_auth(self):
        """Get teacher authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login not available")
        data = response.json()
        return {
            "token": data["access_token"],
            "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['access_token']}"}
        }
    
    def test_get_schools_returns_only_user_school(self, director_auth):
        """Test GET /api/schools returns only the user's school"""
        response = requests.get(
            f"{BASE_URL}/api/schools",
            headers=director_auth["headers"]
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        schools = response.json()
        
        user_school_id = director_auth["user"].get("school_id")
        print(f"User school_id: {user_school_id}")
        print(f"Schools returned: {len(schools)}")
        
        # Verify all returned schools match user's school_id
        for school in schools:
            print(f"  - School: {school.get('name')} (ID: {school.get('id')})")
            if user_school_id:
                assert school.get("id") == user_school_id, \
                    f"School {school.get('id')} should not be visible to user with school_id {user_school_id}"
        
        print(f"✓ School scoping working - returned {len(schools)} school(s) for user's school_id")
    
    def test_get_single_school_requires_authorization(self, director_auth):
        """Test GET /api/schools/{school_id} requires proper authorization"""
        user_school_id = director_auth["user"].get("school_id")
        
        if user_school_id:
            # Should be able to access own school
            response = requests.get(
                f"{BASE_URL}/api/schools/{user_school_id}",
                headers=director_auth["headers"]
            )
            assert response.status_code == 200, f"Failed to access own school: {response.text}"
            print(f"✓ Can access own school: {user_school_id}")
        
        # Try to access a fake school ID - should fail
        fake_school_id = "FAKE-SCHOOL-12345"
        response = requests.get(
            f"{BASE_URL}/api/schools/{fake_school_id}",
            headers=director_auth["headers"]
        )
        # Should return 403 (not authorized) or 404 (not found)
        assert response.status_code in [403, 404], \
            f"Expected 403/404 for unauthorized school access, got {response.status_code}"
        print(f"✓ Cannot access other school: {fake_school_id} (status: {response.status_code})")


class TestSchoolSettings:
    """Test school settings API scoping"""
    
    @pytest.fixture
    def director_auth(self):
        """Get director authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["access_token"],
            "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['access_token']}"}
        }
    
    def test_get_school_settings_own_school(self, director_auth):
        """Test GET /api/school/settings returns settings for user's school"""
        user_school_id = director_auth["user"].get("school_id")
        
        if not user_school_id:
            pytest.skip("User has no school_id")
        
        response = requests.get(
            f"{BASE_URL}/api/school/settings",
            params={"school_id": user_school_id},
            headers=director_auth["headers"]
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        settings = response.json()
        
        # Verify settings are for the correct school
        assert settings.get("school_id") == user_school_id, \
            f"Settings school_id {settings.get('school_id')} doesn't match user's {user_school_id}"
        
        print(f"✓ School settings returned for school: {user_school_id}")
        print(f"  - State: {settings.get('state')}")
        print(f"  - Board: {settings.get('board')}")
        print(f"  - Session: {settings.get('current_session')}")
    
    def test_get_school_settings_other_school_blocked(self, director_auth):
        """Test GET /api/school/settings blocks access to other schools"""
        fake_school_id = "OTHER-SCHOOL-99999"
        
        response = requests.get(
            f"{BASE_URL}/api/school/settings",
            params={"school_id": fake_school_id},
            headers=director_auth["headers"]
        )
        
        # Should return 403 (not authorized)
        assert response.status_code == 403, \
            f"Expected 403 for other school settings, got {response.status_code}: {response.text}"
        
        print(f"✓ Cannot access other school's settings (status: {response.status_code})")


class TestOnlineExamSystem:
    """Test Online Exam System API"""
    
    @pytest.fixture
    def director_auth(self):
        """Get director authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return {
            "token": data["access_token"],
            "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['access_token']}"}
        }
    
    @pytest.fixture
    def teacher_auth(self):
        """Get teacher authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Teacher login not available")
        data = response.json()
        return {
            "token": data["access_token"],
            "user": data["user"],
            "headers": {"Authorization": f"Bearer {data['access_token']}"}
        }
    
    def test_get_exams_list(self, director_auth):
        """Test GET /api/exams returns exams list (even if empty)"""
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers=director_auth["headers"]
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        exams = response.json()
        
        # Should return a list (can be empty)
        assert isinstance(exams, list), f"Expected list, got {type(exams)}"
        
        print(f"✓ Exams API working - returned {len(exams)} exam(s)")
        for exam in exams[:5]:  # Show first 5
            print(f"  - {exam.get('title')} ({exam.get('subject')}) - Status: {exam.get('status')}")
    
    def test_get_exams_with_teacher(self, teacher_auth):
        """Test GET /api/exams works for teacher role"""
        response = requests.get(
            f"{BASE_URL}/api/exams",
            headers=teacher_auth["headers"]
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        exams = response.json()
        
        assert isinstance(exams, list), f"Expected list, got {type(exams)}"
        print(f"✓ Teacher can access exams - returned {len(exams)} exam(s)")


class TestAuthMe:
    """Test /api/auth/me endpoint"""
    
    def test_auth_me_returns_user_data(self):
        """Test GET /api/auth/me returns current user data"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        user = response.json()
        
        assert user.get("email") == DIRECTOR_EMAIL
        assert user.get("role") == "director"
        assert "school_id" in user
        
        print(f"✓ Auth/me working:")
        print(f"  - Name: {user.get('name')}")
        print(f"  - Role: {user.get('role')}")
        print(f"  - School ID: {user.get('school_id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
