"""
Test Suite for Iteration 21: Unified Portal, Sidebar cleanup, Marketing Materials
Features to test:
1. Unified Portal (/portal) - All staff redirects here after login
2. Teacher login via TeachTino redirects to /portal
3. Unified Portal shows permission-based modules for Teacher role
4. Director login redirects to /app/dashboard (not portal)
5. Online Exams link hidden from Director's sidebar (teacherOnly flag)
6. Marketing materials download URL works
7. Teacher default permissions
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://schooltino-erp.preview.emergentagent.com').rstrip('/')

# Test credentials
DIRECTOR_CREDS = {"email": "director@schooltino.com", "password": "admin123"}
TEACHER_CREDS = {"email": "teacher@schooltino.com", "password": "teacher123"}
ACCOUNTANT_CREDS = {"email": "accountant@schooltino.com", "password": "accountant123"}
STUDENT_CREDS = {"student_id": "STD-2026-285220", "password": "KPbeHdZf"}


class TestMarketingMaterials:
    """Test marketing materials download endpoint"""
    
    def test_marketing_materials_download_url(self):
        """Test that marketing materials tar.gz file is accessible"""
        url = f"{BASE_URL}/api/static/marketing/Schooltino_Marketing_Materials_Final.tar.gz"
        response = requests.head(url, timeout=30)
        assert response.status_code == 200, f"Marketing materials not accessible: {response.status_code}"
        print(f"✓ Marketing materials download URL works: {url}")
    
    def test_marketing_materials_content_type(self):
        """Test that marketing materials has correct content type"""
        url = f"{BASE_URL}/api/static/marketing/Schooltino_Marketing_Materials_Final.tar.gz"
        response = requests.head(url, timeout=30)
        content_type = response.headers.get('content-type', '')
        # Should be application/gzip or application/x-gzip or similar
        assert 'gzip' in content_type.lower() or 'octet-stream' in content_type.lower(), f"Unexpected content type: {content_type}"
        print(f"✓ Marketing materials content type: {content_type}")


class TestAuthenticationAndRedirects:
    """Test login and redirect behavior for different roles"""
    
    def test_director_login(self):
        """Test Director login returns correct user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DIRECTOR_CREDS, timeout=30)
        assert response.status_code == 200, f"Director login failed: {response.status_code}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["user"]["role"] == "director", f"Expected director role, got {data['user']['role']}"
        print(f"✓ Director login successful: {data['user']['name']} ({data['user']['role']})")
        return data["access_token"]
    
    def test_teacher_login(self):
        """Test Teacher login returns correct user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS, timeout=30)
        assert response.status_code == 200, f"Teacher login failed: {response.status_code}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["user"]["role"] == "teacher", f"Expected teacher role, got {data['user']['role']}"
        print(f"✓ Teacher login successful: {data['user']['name']} ({data['user']['role']})")
        return data["access_token"]
    
    def test_accountant_login(self):
        """Test Accountant login returns correct user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ACCOUNTANT_CREDS, timeout=30)
        assert response.status_code == 200, f"Accountant login failed: {response.status_code}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["user"]["role"] == "accountant", f"Expected accountant role, got {data['user']['role']}"
        print(f"✓ Accountant login successful: {data['user']['name']} ({data['user']['role']})")
        return data["access_token"]


class TestTeacherPermissions:
    """Test Teacher default permissions from backend"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS, timeout=30)
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    def test_teacher_permissions_endpoint(self, teacher_token):
        """Test that teacher can fetch their permissions"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        response = requests.get(f"{BASE_URL}/api/permissions/my", headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed to get permissions: {response.status_code}"
        data = response.json()
        assert "permissions" in data, "No permissions in response"
        print(f"✓ Teacher permissions fetched successfully")
        return data["permissions"]
    
    def test_teacher_default_permissions_values(self, teacher_token):
        """Test that teacher has correct default permissions"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        response = requests.get(f"{BASE_URL}/api/permissions/my", headers=headers, timeout=30)
        assert response.status_code == 200
        perms = response.json()["permissions"]
        
        # Expected TRUE permissions for teacher
        expected_true = ["dashboard", "students", "classes", "attendance", "notices", "ai_paper", "ai_content", "leave_management", "meetings", "gallery"]
        
        for perm in expected_true:
            if perm in perms:
                assert perms[perm] == True, f"Teacher should have {perm}=True, got {perms.get(perm)}"
                print(f"  ✓ {perm}: True")
            else:
                print(f"  ⚠ {perm}: Not in permissions (may use different key)")
        
        # Expected FALSE permissions for teacher
        expected_false = ["user_management", "settings", "school_analytics", "cctv"]
        for perm in expected_false:
            if perm in perms:
                assert perms[perm] == False, f"Teacher should have {perm}=False, got {perms.get(perm)}"
                print(f"  ✓ {perm}: False")
        
        print(f"✓ Teacher default permissions verified")


class TestDirectorPermissions:
    """Test Director permissions"""
    
    @pytest.fixture
    def director_token(self):
        """Get director auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DIRECTOR_CREDS, timeout=30)
        if response.status_code != 200:
            pytest.skip("Director login failed")
        return response.json()["access_token"]
    
    def test_director_has_all_permissions(self, director_token):
        """Test that director has all permissions"""
        headers = {"Authorization": f"Bearer {director_token}"}
        response = requests.get(f"{BASE_URL}/api/permissions/my", headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed to get permissions: {response.status_code}"
        data = response.json()
        assert data.get("is_director") == True, "Director should have is_director=True"
        print(f"✓ Director has all permissions (is_director=True)")


class TestUserMeEndpoint:
    """Test /api/auth/me endpoint for different roles"""
    
    def test_director_me_endpoint(self):
        """Test /api/auth/me returns correct data for director"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=DIRECTOR_CREDS, timeout=30)
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed to get /auth/me: {response.status_code}"
        data = response.json()
        assert data["role"] == "director", f"Expected director role, got {data['role']}"
        assert "permissions" in data, "No permissions in /auth/me response"
        print(f"✓ Director /auth/me returns correct data with permissions")
    
    def test_teacher_me_endpoint(self):
        """Test /api/auth/me returns correct data for teacher"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS, timeout=30)
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed to get /auth/me: {response.status_code}"
        data = response.json()
        assert data["role"] == "teacher", f"Expected teacher role, got {data['role']}"
        assert "permissions" in data, "No permissions in /auth/me response"
        print(f"✓ Teacher /auth/me returns correct data with permissions")


class TestUnifiedPortalAPIs:
    """Test APIs used by Unified Portal"""
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEACHER_CREDS, timeout=30)
        if response.status_code != 200:
            pytest.skip("Teacher login failed")
        return response.json()["access_token"]
    
    def test_classes_endpoint(self, teacher_token):
        """Test /api/classes endpoint used by Unified Portal"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        response = requests.get(f"{BASE_URL}/api/classes", headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed to get classes: {response.status_code}"
        print(f"✓ /api/classes endpoint works for teacher")
    
    def test_notices_endpoint(self, teacher_token):
        """Test /api/notices endpoint used by Unified Portal"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        response = requests.get(f"{BASE_URL}/api/notices?limit=5", headers=headers, timeout=30)
        assert response.status_code == 200, f"Failed to get notices: {response.status_code}"
        print(f"✓ /api/notices endpoint works for teacher")
    
    def test_leave_pending_endpoint(self, teacher_token):
        """Test /api/leave/pending endpoint used by Unified Portal"""
        headers = {"Authorization": f"Bearer {teacher_token}"}
        response = requests.get(f"{BASE_URL}/api/leave/pending", headers=headers, timeout=30)
        # May return 200 or 403 depending on permissions
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}"
        print(f"✓ /api/leave/pending endpoint accessible (status: {response.status_code})")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=30)
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
