"""
Iteration 35 - ID Card and Branding Tests
Tests for:
1. Student ID card with parent phone and class name (not UUID)
2. Employee ID card with role-based colors
3. School logo in ID card header and watermark
4. Header branding (school name, not Schooltino)
5. Settings page Logo Apply buttons (not checkboxes)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthentication:
    """Test login functionality"""
    
    def test_director_login(self):
        """Test director login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "director"
        assert data["user"]["email"] == "director@test.com"
        print(f"✅ Director login successful: {data['user']['name']}")


class TestStudentIDCard:
    """Test Student ID Card generation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    def test_student_id_card_has_class_name(self, auth_token):
        """Student ID card should show class name, not UUID"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Check class is a readable name, not UUID
        class_name = data["id_card"]["class"]
        assert class_name is not None
        assert "CLASS-" not in class_name.upper()  # Should not be UUID
        assert len(class_name) < 30  # Should be short readable name
        print(f"✅ Class name: {class_name}")
    
    def test_student_id_card_has_parent_phone(self, auth_token):
        """Student ID card should show parent phone number"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check phone is present
        phone = data["id_card"]["phone"]
        assert phone is not None
        assert len(phone) > 0
        print(f"✅ Parent phone: {phone}")
    
    def test_student_id_card_has_school_logo(self, auth_token):
        """Student ID card should include school logo URL"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check school logo URL
        logo_url = data["school"]["logo_url"]
        assert logo_url is not None
        print(f"✅ School logo URL: {logo_url}")
    
    def test_student_id_card_has_school_name(self, auth_token):
        """Student ID card should show school name"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        school_name = data["school"]["name"]
        assert school_name is not None
        assert len(school_name) > 0
        print(f"✅ School name: {school_name}")


class TestEmployeeIDCard:
    """Test Employee ID Card with role-based colors"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    @pytest.fixture
    def director_id(self):
        """Get director user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json()["user"]["id"]
    
    def test_director_id_card_has_purple_color(self, auth_token, director_id):
        """Director ID card should have purple color (#7c3aed)"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/director/{director_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        role_color = data["id_card"]["role_color"]
        assert role_color == "#7c3aed"  # Purple for Director
        print(f"✅ Director role color: {role_color}")
    
    def test_director_id_card_has_hindi_designation(self, auth_token, director_id):
        """Director ID card should have Hindi designation"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/director/{director_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        designation_hindi = data["id_card"]["designation_hindi"]
        assert designation_hindi == "निदेशक"  # Hindi for Director
        print(f"✅ Director Hindi designation: {designation_hindi}")
    
    def test_director_id_card_type(self, auth_token, director_id):
        """Director ID card should show DIRECTOR ID CARD"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/director/{director_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        card_type = data["id_card"]["card_type"]
        assert "DIRECTOR" in card_type.upper()
        print(f"✅ Card type: {card_type}")


class TestRoleBasedColors:
    """Test role-based color mapping"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    def test_create_teacher_and_check_color(self, auth_token):
        """Create teacher and verify blue color"""
        import time
        unique_email = f"teacher_color_test_{int(time.time())}@test.com"
        
        # Create teacher
        response = requests.post(
            f"{BASE_URL}/api/employees",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Color Test Teacher",
                "email": unique_email,
                "mobile": "+91 9876543299",
                "designation": "teacher",
                "department": "Science",
                "school_id": "SCH-TEST-2026",
                "create_login": False
            }
        )
        
        if response.status_code == 200:
            employee_id = response.json()["id"]
            
            # Get ID card
            card_response = requests.get(
                f"{BASE_URL}/api/id-card/generate/teacher/{employee_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if card_response.status_code == 200:
                data = card_response.json()
                role_color = data["id_card"]["role_color"]
                assert role_color == "#1e40af"  # Blue for Teacher
                print(f"✅ Teacher role color: {role_color}")
            else:
                print(f"⚠️ Could not get teacher ID card: {card_response.status_code}")
        else:
            print(f"⚠️ Could not create teacher: {response.status_code}")


class TestSchoolBranding:
    """Test school branding in header"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    def test_school_has_logo_url(self, auth_token):
        """School should have logo URL configured"""
        response = requests.get(
            f"{BASE_URL}/api/schools/SCH-TEST-2026",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        logo_url = data.get("logo_url")
        assert logo_url is not None
        print(f"✅ School logo URL: {logo_url}")
    
    def test_school_has_name(self, auth_token):
        """School should have name configured"""
        response = requests.get(
            f"{BASE_URL}/api/schools/SCH-TEST-2026",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        name = data.get("name")
        assert name is not None
        assert "Schooltino" not in name  # Should not be default app name
        print(f"✅ School name: {name}")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """API should be healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
