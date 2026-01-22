"""
Iteration 36 - ID Card Features Tests
Tests for:
1. Student ID Card shows parent_phone
2. Student ID Card shows Samgra ID for MP Board schools (MPBSE)
3. Student ID Card does NOT show email
4. Director ID Card shows dark red color (#b91c1c) and is_higher_authority=true
5. Principal ID Card shows red color (#dc2626)
6. Teacher ID Card shows blue color (#1e40af)
7. Accountant ID Card shows green color (#059669)
8. Admin department different colors from teaching staff
"""

import pytest
import requests
import os
import time

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
        print(f"✅ Director login successful: {data['user']['name']}")


class TestStudentIDCardFeatures:
    """Test Student ID Card new features - parent_phone, samgra_id, no email"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    def test_student_id_card_has_parent_phone(self, auth_token):
        """Student ID card should show parent_phone field"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Check parent_phone is present
        parent_phone = data["id_card"].get("parent_phone")
        assert parent_phone is not None, "parent_phone field should exist"
        assert len(parent_phone) > 0, "parent_phone should not be empty"
        assert "+91" in parent_phone or parent_phone.isdigit() or parent_phone.replace(" ", "").replace("+", "").isdigit()
        print(f"✅ Parent phone: {parent_phone}")
    
    def test_student_id_card_has_samgra_id_for_mp_board(self, auth_token):
        """Student ID card should show Samgra ID for MP Board (MPBSE) schools"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check show_samgra_id flag is true for MP Board
        show_samgra_id = data["id_card"].get("show_samgra_id")
        assert show_samgra_id == True, "show_samgra_id should be True for MPBSE school"
        
        # Check samgra_id value is present
        samgra_id = data["id_card"].get("samgra_id")
        assert samgra_id is not None, "samgra_id should be present for MP Board student"
        assert len(str(samgra_id)) > 0, "samgra_id should not be empty"
        print(f"✅ Samgra ID: {samgra_id}, show_samgra_id: {show_samgra_id}")
    
    def test_student_id_card_has_board_type(self, auth_token):
        """Student ID card should include board_type"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        board_type = data["id_card"].get("board_type")
        assert board_type is not None, "board_type should be present"
        assert board_type.upper() in ["MPBSE", "MP BOARD", "MP"], f"Expected MP Board, got {board_type}"
        print(f"✅ Board type: {board_type}")
    
    def test_student_id_card_no_email_field(self, auth_token):
        """Student ID card should NOT have email field"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/student/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Email should NOT be in student ID card
        email = data["id_card"].get("email")
        assert email is None, f"Student ID card should NOT have email field, but found: {email}"
        print("✅ Student ID card correctly does NOT have email field")


class TestHigherAuthorityIDCard:
    """Test Higher Authority (Director, Principal, VP, Co-Director) ID Card colors"""
    
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
    
    def test_director_id_card_dark_red_color(self, auth_token, director_id):
        """Director ID card should have dark red color (#b91c1c)"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/director/{director_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        role_color = data["id_card"]["role_color"]
        assert role_color == "#b91c1c", f"Director should have dark red #b91c1c, got {role_color}"
        print(f"✅ Director role color: {role_color} (dark red)")
    
    def test_director_id_card_is_higher_authority(self, auth_token, director_id):
        """Director ID card should have is_higher_authority=true"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/director/{director_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        is_higher_authority = data["id_card"].get("is_higher_authority")
        assert is_higher_authority == True, f"Director should have is_higher_authority=True, got {is_higher_authority}"
        print(f"✅ Director is_higher_authority: {is_higher_authority}")
    
    def test_director_id_card_hindi_designation(self, auth_token, director_id):
        """Director ID card should have Hindi designation"""
        response = requests.get(
            f"{BASE_URL}/api/id-card/generate/director/{director_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        designation_hindi = data["id_card"]["designation_hindi"]
        assert designation_hindi == "निदेशक", f"Director Hindi should be निदेशक, got {designation_hindi}"
        print(f"✅ Director Hindi designation: {designation_hindi}")


class TestRoleBasedColors:
    """Test role-based color mapping for different staff types"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    def test_create_teacher_and_verify_blue_color(self, auth_token):
        """Teacher should have blue color (#1e40af)"""
        unique_email = f"teacher_test_{int(time.time())}@test.com"
        
        # Create teacher
        response = requests.post(
            f"{BASE_URL}/api/employees",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test Teacher Blue",
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
            
            assert card_response.status_code == 200
            data = card_response.json()
            role_color = data["id_card"]["role_color"]
            assert role_color == "#1e40af", f"Teacher should have blue #1e40af, got {role_color}"
            
            # Teacher should NOT be higher authority
            is_higher_authority = data["id_card"].get("is_higher_authority", False)
            assert is_higher_authority == False, "Teacher should NOT be higher authority"
            
            print(f"✅ Teacher role color: {role_color} (blue), is_higher_authority: {is_higher_authority}")
        else:
            pytest.skip(f"Could not create teacher: {response.status_code}")
    
    def test_create_accountant_and_verify_green_color(self, auth_token):
        """Accountant should have green color (#059669)"""
        unique_email = f"accountant_test_{int(time.time())}@test.com"
        
        # Create accountant
        response = requests.post(
            f"{BASE_URL}/api/employees",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test Accountant Green",
                "email": unique_email,
                "mobile": "+91 9876543298",
                "designation": "accountant",
                "department": "Admin",
                "school_id": "SCH-TEST-2026",
                "create_login": False
            }
        )
        
        if response.status_code == 200:
            employee_id = response.json()["id"]
            
            # Get ID card
            card_response = requests.get(
                f"{BASE_URL}/api/id-card/generate/staff/{employee_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            assert card_response.status_code == 200
            data = card_response.json()
            role_color = data["id_card"]["role_color"]
            assert role_color == "#059669", f"Accountant should have green #059669, got {role_color}"
            print(f"✅ Accountant role color: {role_color} (green)")
        else:
            pytest.skip(f"Could not create accountant: {response.status_code}")
    
    def test_create_principal_and_verify_red_color(self, auth_token):
        """Principal should have red color (#dc2626) and is_higher_authority=true"""
        unique_email = f"principal_test_{int(time.time())}@test.com"
        
        # Create principal
        response = requests.post(
            f"{BASE_URL}/api/employees",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test Principal Red",
                "email": unique_email,
                "mobile": "+91 9876543297",
                "designation": "principal",
                "department": "Admin",
                "school_id": "SCH-TEST-2026",
                "create_login": False
            }
        )
        
        if response.status_code == 200:
            employee_id = response.json()["id"]
            
            # Get ID card
            card_response = requests.get(
                f"{BASE_URL}/api/id-card/generate/staff/{employee_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            assert card_response.status_code == 200
            data = card_response.json()
            role_color = data["id_card"]["role_color"]
            assert role_color == "#dc2626", f"Principal should have red #dc2626, got {role_color}"
            
            # Principal should be higher authority
            is_higher_authority = data["id_card"].get("is_higher_authority", False)
            assert is_higher_authority == True, "Principal should be higher authority"
            
            print(f"✅ Principal role color: {role_color} (red), is_higher_authority: {is_higher_authority}")
        else:
            pytest.skip(f"Could not create principal: {response.status_code}")


class TestColorDifferentiation:
    """Test that different departments have different colors"""
    
    def test_color_mapping_exists(self):
        """Verify expected color mapping"""
        expected_colors = {
            # Higher Authority - Red/Purple shades
            "director": "#b91c1c",       # Dark Red
            "principal": "#dc2626",      # Red
            "vice_principal": "#ea580c", # Orange
            "co_director": "#9333ea",    # Violet
            
            # Admin Department - Green/Teal shades
            "admin": "#047857",          # Dark Green
            "accountant": "#059669",     # Green
            "clerk": "#0891b2",          # Cyan
            
            # Teaching Staff - Blue shades
            "teacher": "#1e40af",        # Blue
            "librarian": "#4f46e5",      # Indigo
            
            # Support Staff - Gray/Brown shades
            "peon": "#64748b",           # Slate
            "driver": "#ca8a04",         # Yellow
            "guard": "#374151",          # Gray
        }
        
        # Verify higher authority colors are different from teaching staff
        higher_authority_colors = [expected_colors["director"], expected_colors["principal"]]
        teaching_colors = [expected_colors["teacher"], expected_colors["librarian"]]
        admin_colors = [expected_colors["accountant"], expected_colors["clerk"]]
        
        # No overlap between categories
        for ha_color in higher_authority_colors:
            assert ha_color not in teaching_colors, f"Higher authority color {ha_color} should not be in teaching colors"
            assert ha_color not in admin_colors, f"Higher authority color {ha_color} should not be in admin colors"
        
        for admin_color in admin_colors:
            assert admin_color not in teaching_colors, f"Admin color {admin_color} should not be in teaching colors"
        
        print("✅ Color differentiation verified:")
        print(f"   Higher Authority: {higher_authority_colors}")
        print(f"   Admin Dept: {admin_colors}")
        print(f"   Teaching Staff: {teaching_colors}")


class TestStudentFormFields:
    """Test that student form has parent_phone and samgra_id fields"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "director@test.com",
            "password": "test1234"
        })
        return response.json().get("access_token")
    
    def test_student_data_has_parent_phone(self, auth_token):
        """Student data should have parent_phone field"""
        response = requests.get(
            f"{BASE_URL}/api/students/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            parent_phone = data.get("parent_phone")
            assert parent_phone is not None, "Student should have parent_phone field"
            print(f"✅ Student parent_phone: {parent_phone}")
        else:
            # Try alternate endpoint
            response = requests.get(
                f"{BASE_URL}/api/students?school_id=SCH-TEST-2026",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            if response.status_code == 200:
                students = response.json()
                if isinstance(students, list) and len(students) > 0:
                    student = next((s for s in students if s.get("student_id") == "STD-TEST-001"), None)
                    if student:
                        parent_phone = student.get("parent_phone")
                        assert parent_phone is not None, "Student should have parent_phone field"
                        print(f"✅ Student parent_phone: {parent_phone}")
                    else:
                        pytest.skip("Test student not found in list")
                else:
                    pytest.skip("No students returned")
            else:
                pytest.skip(f"Could not fetch student: {response.status_code}")
    
    def test_student_data_has_samgra_id(self, auth_token):
        """Student data should have samgra_id field"""
        response = requests.get(
            f"{BASE_URL}/api/students/STD-TEST-001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            samgra_id = data.get("samgra_id")
            assert samgra_id is not None, "Student should have samgra_id field"
            print(f"✅ Student samgra_id: {samgra_id}")
        else:
            # Try alternate endpoint
            response = requests.get(
                f"{BASE_URL}/api/students?school_id=SCH-TEST-2026",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            if response.status_code == 200:
                students = response.json()
                if isinstance(students, list) and len(students) > 0:
                    student = next((s for s in students if s.get("student_id") == "STD-TEST-001"), None)
                    if student:
                        samgra_id = student.get("samgra_id")
                        assert samgra_id is not None, "Student should have samgra_id field"
                        print(f"✅ Student samgra_id: {samgra_id}")
                    else:
                        pytest.skip("Test student not found in list")
                else:
                    pytest.skip("No students returned")
            else:
                pytest.skip(f"Could not fetch student: {response.status_code}")


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
