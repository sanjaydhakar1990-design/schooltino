"""
Schooltino Backend API Tests
Tests for: Auth, User Management, Student Admission, AI Content, Security
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teachfixed.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"

class TestHealthAndSetup:
    """Health check and setup verification tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_setup_check(self):
        """Test setup check endpoint - should show system ready"""
        response = requests.get(f"{BASE_URL}/api/auth/check-setup")
        assert response.status_code == 200
        data = response.json()
        assert data["setup_required"] == False
        assert data["message"] == "System ready"
        print(f"✓ Setup check passed: {data}")


class TestSecurityChecks:
    """Security verification tests"""
    
    def test_public_registration_disabled(self):
        """Test that public registration endpoint is disabled"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "hacker@test.com",
                "password": "test123",
                "name": "Hacker",
                "role": "director"
            }
        )
        # Should return 404 (endpoint not found) or 405 (method not allowed)
        assert response.status_code in [404, 405], f"Public registration should be disabled, got {response.status_code}"
        print(f"✓ Public registration disabled: {response.status_code}")
    
    def test_setup_director_blocked_after_first(self):
        """Test that setup-director endpoint is blocked after first director"""
        response = requests.post(
            f"{BASE_URL}/api/auth/setup-director",
            json={
                "email": "another_director@test.com",
                "password": "test123",
                "name": "Another Director",
                "role": "director"
            }
        )
        assert response.status_code == 403
        data = response.json()
        assert "Director already exists" in data["detail"]
        print(f"✓ Setup director blocked: {data['detail']}")


class TestDirectorAuth:
    """Director authentication tests"""
    
    def test_director_login_success(self):
        """Test director login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "director"
        assert data["user"]["email"] == DIRECTOR_EMAIL
        print(f"✓ Director login success: {data['user']['name']}")
        return data["access_token"]
    
    def test_director_login_invalid_password(self):
        """Test director login with invalid password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print(f"✓ Invalid password rejected: {response.json()}")
    
    def test_director_login_invalid_email(self):
        """Test login with non-existent email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "test123"}
        )
        assert response.status_code == 401
        print(f"✓ Invalid email rejected: {response.json()}")


class TestUserManagement:
    """User management tests - create, suspend, unsuspend"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get or create a school for testing
        schools_res = requests.get(f"{BASE_URL}/api/schools", headers=self.headers)
        if schools_res.status_code == 200 and len(schools_res.json()) > 0:
            self.school_id = schools_res.json()[0]["id"]
        else:
            # Create a test school
            school_res = requests.post(
                f"{BASE_URL}/api/schools",
                headers=self.headers,
                json={
                    "name": "Test School",
                    "address": "123 Test Street",
                    "board_type": "CBSE",
                    "city": "Test City",
                    "state": "Test State"
                }
            )
            self.school_id = school_res.json()["id"]
    
    def test_create_user_as_director(self):
        """Test creating a new user as director"""
        unique_email = f"TEST_teacher_{uuid.uuid4().hex[:8]}@school.com"
        response = requests.post(
            f"{BASE_URL}/api/users/create",
            headers=self.headers,
            json={
                "name": "Test Teacher",
                "email": unique_email,
                "password": "teacher123",
                "role": "teacher",
                "school_id": self.school_id,
                "created_by": "director"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == unique_email
        assert data["role"] == "teacher"
        assert data["status"] == "active"  # Director creates active users
        print(f"✓ User created: {data['name']} ({data['email']})")
        return data["id"]
    
    def test_suspend_user(self):
        """Test suspending a user"""
        # First create a user
        unique_email = f"TEST_suspend_{uuid.uuid4().hex[:8]}@school.com"
        create_res = requests.post(
            f"{BASE_URL}/api/users/create",
            headers=self.headers,
            json={
                "name": "User To Suspend",
                "email": unique_email,
                "password": "test123",
                "role": "teacher",
                "school_id": self.school_id,
                "created_by": "director"
            }
        )
        user_id = create_res.json()["id"]
        
        # Suspend the user
        suspend_res = requests.post(
            f"{BASE_URL}/api/users/{user_id}/suspend",
            headers=self.headers,
            json={
                "reason": "fees_pending",
                "reason_details": "Test suspension"
            }
        )
        assert suspend_res.status_code == 200
        assert "suspended" in suspend_res.json()["message"].lower()
        print(f"✓ User suspended: {user_id}")
        
        # Verify user is suspended
        details_res = requests.get(f"{BASE_URL}/api/users/{user_id}/details", headers=self.headers)
        assert details_res.json()["status"] == "suspended"
        print(f"✓ User status verified as suspended")
        
        return user_id
    
    def test_unsuspend_user(self):
        """Test unsuspending a user"""
        # First create and suspend a user
        unique_email = f"TEST_unsuspend_{uuid.uuid4().hex[:8]}@school.com"
        create_res = requests.post(
            f"{BASE_URL}/api/users/create",
            headers=self.headers,
            json={
                "name": "User To Unsuspend",
                "email": unique_email,
                "password": "test123",
                "role": "teacher",
                "school_id": self.school_id,
                "created_by": "director"
            }
        )
        user_id = create_res.json()["id"]
        
        # Suspend first
        requests.post(
            f"{BASE_URL}/api/users/{user_id}/suspend",
            headers=self.headers,
            json={"reason": "test", "reason_details": "Test"}
        )
        
        # Unsuspend
        unsuspend_res = requests.post(
            f"{BASE_URL}/api/users/{user_id}/unsuspend",
            headers=self.headers
        )
        assert unsuspend_res.status_code == 200
        assert "unsuspended" in unsuspend_res.json()["message"].lower()
        print(f"✓ User unsuspended: {user_id}")
        
        # Verify user is active
        details_res = requests.get(f"{BASE_URL}/api/users/{user_id}/details", headers=self.headers)
        assert details_res.json()["status"] == "active"
        print(f"✓ User status verified as active")


class TestStudentAdmission:
    """Student admission flow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token and setup school/class"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get or create school
        schools_res = requests.get(f"{BASE_URL}/api/schools", headers=self.headers)
        if schools_res.status_code == 200 and len(schools_res.json()) > 0:
            self.school_id = schools_res.json()[0]["id"]
        else:
            school_res = requests.post(
                f"{BASE_URL}/api/schools",
                headers=self.headers,
                json={
                    "name": "Test School",
                    "address": "123 Test Street",
                    "board_type": "CBSE",
                    "city": "Test City",
                    "state": "Test State"
                }
            )
            self.school_id = school_res.json()["id"]
        
        # Get or create class
        classes_res = requests.get(f"{BASE_URL}/api/classes?school_id={self.school_id}", headers=self.headers)
        if classes_res.status_code == 200 and len(classes_res.json()) > 0:
            self.class_id = classes_res.json()[0]["id"]
        else:
            class_res = requests.post(
                f"{BASE_URL}/api/classes",
                headers=self.headers,
                json={
                    "name": "Class 10",
                    "section": "A",
                    "school_id": self.school_id
                }
            )
            self.class_id = class_res.json()["id"]
    
    def test_student_admission_with_auto_id(self):
        """Test student admission with auto-generated ID and password"""
        unique_mobile = f"98765{uuid.uuid4().int % 100000:05d}"
        response = requests.post(
            f"{BASE_URL}/api/students/admit",
            headers=self.headers,
            json={
                "name": "TEST_Student Admission",
                "class_id": self.class_id,
                "school_id": self.school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": "2010-05-15",
                "gender": "male",
                "address": "123 Test Address",
                "mobile": unique_mobile
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify auto-generated student ID format: STD-YYYY-XXXXXX
        assert data["student_id"].startswith("STD-")
        assert len(data["student_id"]) > 10
        
        # Verify temporary password is generated
        assert "temporary_password" in data
        assert len(data["temporary_password"]) >= 8
        
        # Verify login_id matches student_id
        assert data["login_id"] == data["student_id"]
        
        print(f"✓ Student admitted: {data['name']}")
        print(f"  Student ID: {data['student_id']}")
        print(f"  Login ID: {data['login_id']}")
        print(f"  Temp Password: {data['temporary_password']}")
        
        return data
    
    def test_student_login_with_id_password(self):
        """Test student login with student ID and password"""
        # First admit a student
        unique_mobile = f"98764{uuid.uuid4().int % 100000:05d}"
        admit_res = requests.post(
            f"{BASE_URL}/api/students/admit",
            headers=self.headers,
            json={
                "name": "TEST_Login Student",
                "class_id": self.class_id,
                "school_id": self.school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": "2010-06-20",
                "gender": "female",
                "address": "456 Test Address",
                "mobile": unique_mobile
            }
        )
        student_data = admit_res.json()
        
        # Login with student ID and password
        login_res = requests.post(
            f"{BASE_URL}/api/students/login",
            params={
                "student_id": student_data["student_id"],
                "password": student_data["temporary_password"]
            }
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert "access_token" in login_data
        assert login_data["student"]["student_id"] == student_data["student_id"]
        print(f"✓ Student login successful: {login_data['student']['name']}")
    
    def test_student_login_with_mobile_dob(self):
        """Test student login with mobile and DOB"""
        # First admit a student
        unique_mobile = f"98763{uuid.uuid4().int % 100000:05d}"
        dob = "2010-07-25"
        admit_res = requests.post(
            f"{BASE_URL}/api/students/admit",
            headers=self.headers,
            json={
                "name": "TEST_Mobile Login Student",
                "class_id": self.class_id,
                "school_id": self.school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": dob,
                "gender": "male",
                "address": "789 Test Address",
                "mobile": unique_mobile
            }
        )
        student_data = admit_res.json()
        
        # Login with mobile and DOB
        login_res = requests.post(
            f"{BASE_URL}/api/students/login",
            params={
                "mobile": unique_mobile,
                "dob": dob
            }
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert "access_token" in login_data
        print(f"✓ Student mobile+DOB login successful: {login_data['student']['name']}")


class TestAIContentStudio:
    """AI Content Studio tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_generate_admission_pamphlet(self):
        """Test AI content generation for admission pamphlet"""
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-content",
            headers=self.headers,
            json={
                "content_type": "admission_pamphlet",
                "school_name": "ABC Public School",
                "details": {
                    "academic_year": "2025-26",
                    "classes": "Nursery to 12th",
                    "features": "Smart Classes, Sports, Computer Lab",
                    "contact": "9876543210"
                },
                "language": "english"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "text_content" in data
        assert len(data["text_content"]) > 50  # Should have substantial content
        print(f"✓ AI Pamphlet generated: {len(data['text_content'])} chars")
        print(f"  Preview: {data['text_content'][:200]}...")


class TestTeacherDashboard:
    """Teacher dashboard tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token (to create teacher) and teacher token"""
        # Login as director
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        self.director_token = response.json()["access_token"]
        self.director_headers = {"Authorization": f"Bearer {self.director_token}"}
        
        # Get school
        schools_res = requests.get(f"{BASE_URL}/api/schools", headers=self.director_headers)
        if schools_res.status_code == 200 and len(schools_res.json()) > 0:
            self.school_id = schools_res.json()[0]["id"]
        else:
            school_res = requests.post(
                f"{BASE_URL}/api/schools",
                headers=self.director_headers,
                json={
                    "name": "Test School",
                    "address": "123 Test Street",
                    "board_type": "CBSE",
                    "city": "Test City",
                    "state": "Test State"
                }
            )
            self.school_id = school_res.json()["id"]
    
    def test_teacher_dashboard_endpoint(self):
        """Test teacher dashboard endpoint"""
        # Create a teacher user
        unique_email = f"TEST_teacher_dash_{uuid.uuid4().hex[:8]}@school.com"
        create_res = requests.post(
            f"{BASE_URL}/api/users/create",
            headers=self.director_headers,
            json={
                "name": "Dashboard Teacher",
                "email": unique_email,
                "password": "teacher123",
                "role": "teacher",
                "school_id": self.school_id,
                "created_by": "director"
            }
        )
        
        # Login as teacher
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": unique_email, "password": "teacher123"}
        )
        teacher_token = login_res.json()["access_token"]
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Access teacher dashboard
        dashboard_res = requests.get(f"{BASE_URL}/api/teacher/dashboard", headers=teacher_headers)
        assert dashboard_res.status_code == 200
        data = dashboard_res.json()
        assert "my_classes" in data
        assert "total_students" in data
        print(f"✓ Teacher dashboard accessible: {data}")


class TestDashboardNavigation:
    """Dashboard and navigation tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get school
        schools_res = requests.get(f"{BASE_URL}/api/schools", headers=self.headers)
        if schools_res.status_code == 200 and len(schools_res.json()) > 0:
            self.school_id = schools_res.json()[0]["id"]
        else:
            self.school_id = None
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        if not self.school_id:
            pytest.skip("No school available for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats?school_id={self.school_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_students" in data
        assert "total_staff" in data
        assert "total_classes" in data
        print(f"✓ Dashboard stats: Students={data['total_students']}, Staff={data['total_staff']}, Classes={data['total_classes']}")
    
    def test_get_schools(self):
        """Test schools list endpoint"""
        response = requests.get(f"{BASE_URL}/api/schools", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Schools list: {len(data)} schools")
    
    def test_get_classes(self):
        """Test classes list endpoint"""
        response = requests.get(f"{BASE_URL}/api/classes", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Classes list: {len(data)} classes")
    
    def test_get_students(self):
        """Test students list endpoint"""
        response = requests.get(f"{BASE_URL}/api/students", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Students list: {len(data)} students")
    
    def test_get_notices(self):
        """Test notices list endpoint"""
        response = requests.get(f"{BASE_URL}/api/notices", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Notices list: {len(data)} notices")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
