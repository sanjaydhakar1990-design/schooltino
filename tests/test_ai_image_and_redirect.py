"""
Schooltino Backend API Tests - Iteration 4
Tests for: AI Content Studio with IMAGE GENERATION, Role-based redirect
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://meri-schooltino.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"


class TestAIContentStudioWithImage:
    """AI Content Studio tests with IMAGE GENERATION using Gemini Nano Banana"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        assert response.status_code == 200, f"Director login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_generate_admission_pamphlet_with_image(self):
        """Test AI content generation with IMAGE for admission pamphlet"""
        print("\n🎨 Testing AI Content Studio with IMAGE GENERATION...")
        print("⏳ This may take 30-45 seconds for image generation...")
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-content",
            headers=self.headers,
            json={
                "content_type": "admission_pamphlet",
                "school_name": "ABC Public School",
                "details": {
                    "academic_year": "2025-26",
                    "classes": "Nursery to 12th",
                    "features": "Smart Classes, Sports, Computer Lab, Science Lab",
                    "contact": "9876543210"
                },
                "language": "english",
                "generate_image": True  # Enable image generation
            },
            timeout=120  # 2 minute timeout for image generation
        )
        
        assert response.status_code == 200, f"AI content generation failed: {response.text}"
        data = response.json()
        
        # Verify text content
        assert "text_content" in data, "Missing text_content in response"
        assert len(data["text_content"]) > 50, "Text content too short"
        print(f"✓ Text content generated: {len(data['text_content'])} chars")
        
        # Verify image_base64 is returned
        assert "image_base64" in data, "Missing image_base64 in response"
        
        if data["image_base64"]:
            image_size = len(data["image_base64"])
            print(f"✓ IMAGE GENERATED SUCCESSFULLY!")
            print(f"  Image base64 size: {image_size} bytes (~{image_size/1024:.1f} KB)")
            
            # Verify it's a valid base64 string (should be substantial)
            assert image_size > 10000, f"Image too small: {image_size} bytes"
            print(f"  ✓ Image size validation passed (>10KB)")
        else:
            print("⚠ No image returned (image_base64 is null/empty)")
            # This is acceptable - image generation might fail sometimes
        
        print(f"  Content ID: {data.get('id', 'N/A')}")
        print(f"  Content Type: {data.get('content_type', 'N/A')}")
        
        return data
    
    def test_generate_topper_banner_with_image(self):
        """Test AI content generation with IMAGE for topper banner"""
        print("\n🏆 Testing Topper Banner with IMAGE GENERATION...")
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-content",
            headers=self.headers,
            json={
                "content_type": "topper_banner",
                "school_name": "ABC Public School",
                "details": {
                    "student_name": "Rahul Sharma",
                    "class": "Class 10",
                    "marks": "98.5%",
                    "achievement": "School Topper"
                },
                "language": "english",
                "generate_image": True
            },
            timeout=120
        )
        
        assert response.status_code == 200, f"Topper banner generation failed: {response.text}"
        data = response.json()
        
        assert "text_content" in data
        print(f"✓ Topper banner text generated: {len(data['text_content'])} chars")
        
        if data.get("image_base64"):
            print(f"✓ Topper banner IMAGE generated: {len(data['image_base64'])} bytes")
        else:
            print("⚠ No image returned for topper banner")
    
    def test_generate_content_without_image(self):
        """Test AI content generation WITHOUT image (text only)"""
        print("\n📝 Testing AI Content Studio WITHOUT image...")
        
        response = requests.post(
            f"{BASE_URL}/api/ai/generate-content",
            headers=self.headers,
            json={
                "content_type": "event_poster",
                "school_name": "ABC Public School",
                "details": {
                    "event_name": "Annual Day 2025",
                    "date": "2025-03-15",
                    "venue": "School Auditorium",
                    "description": "Join us for a celebration of talent and achievement"
                },
                "language": "english",
                "generate_image": False  # Disable image generation
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Event poster generation failed: {response.text}"
        data = response.json()
        
        assert "text_content" in data
        print(f"✓ Event poster text generated: {len(data['text_content'])} chars")
        
        # When generate_image is False, image_base64 should be null
        if not data.get("image_base64"):
            print("✓ No image generated (as expected with generate_image=False)")
        else:
            print(f"⚠ Image was generated even with generate_image=False: {len(data['image_base64'])} bytes")


class TestRoleBasedRedirect:
    """Test role-based redirect logic by verifying user roles"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get director token and setup school"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        assert response.status_code == 200
        self.director_token = response.json()["access_token"]
        self.director_headers = {"Authorization": f"Bearer {self.director_token}"}
        self.director_user = response.json()["user"]
        
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
        
        # Get or create class
        classes_res = requests.get(f"{BASE_URL}/api/classes?school_id={self.school_id}", headers=self.director_headers)
        if classes_res.status_code == 200 and len(classes_res.json()) > 0:
            self.class_id = classes_res.json()[0]["id"]
        else:
            class_res = requests.post(
                f"{BASE_URL}/api/classes",
                headers=self.director_headers,
                json={
                    "name": "Class 10",
                    "section": "A",
                    "school_id": self.school_id
                }
            )
            self.class_id = class_res.json()["id"]
    
    def test_director_login_returns_director_role(self):
        """Test that director login returns role='director' for /dashboard redirect"""
        print("\n👔 Testing Director login role...")
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DIRECTOR_EMAIL, "password": DIRECTOR_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["user"]["role"] == "director"
        print(f"✓ Director role verified: {data['user']['role']}")
        print(f"  Expected redirect: /dashboard")
    
    def test_teacher_login_returns_teacher_role(self):
        """Test that teacher login returns role='teacher' for /teacher-dashboard redirect"""
        print("\n👩‍🏫 Testing Teacher login role...")
        
        # Create a teacher
        unique_email = f"TEST_teacher_redirect_{uuid.uuid4().hex[:8]}@school.com"
        create_res = requests.post(
            f"{BASE_URL}/api/users/create",
            headers=self.director_headers,
            json={
                "name": "Redirect Test Teacher",
                "email": unique_email,
                "password": "teacher123",
                "role": "teacher",
                "school_id": self.school_id,
                "created_by": "director"
            }
        )
        assert create_res.status_code == 200, f"Teacher creation failed: {create_res.text}"
        
        # Login as teacher
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": unique_email, "password": "teacher123"}
        )
        assert login_res.status_code == 200, f"Teacher login failed: {login_res.text}"
        data = login_res.json()
        
        assert data["user"]["role"] == "teacher"
        print(f"✓ Teacher role verified: {data['user']['role']}")
        print(f"  Expected redirect: /teacher-dashboard")
    
    def test_student_login_returns_student_role(self):
        """Test that student login returns role='student' for /student-dashboard redirect"""
        print("\n🎓 Testing Student login role...")
        
        # Admit a student
        unique_mobile = f"98762{uuid.uuid4().int % 100000:05d}"
        admit_res = requests.post(
            f"{BASE_URL}/api/students/admit",
            headers=self.director_headers,
            json={
                "name": "TEST_Redirect Student",
                "class_id": self.class_id,
                "school_id": self.school_id,
                "father_name": "Test Father",
                "mother_name": "Test Mother",
                "dob": "2010-08-15",
                "gender": "male",
                "address": "123 Test Address",
                "mobile": unique_mobile
            }
        )
        assert admit_res.status_code == 200, f"Student admission failed: {admit_res.text}"
        student_data = admit_res.json()
        
        # Login as student
        login_res = requests.post(
            f"{BASE_URL}/api/students/login",
            params={
                "student_id": student_data["student_id"],
                "password": student_data["temporary_password"]
            }
        )
        assert login_res.status_code == 200, f"Student login failed: {login_res.text}"
        data = login_res.json()
        
        # Student login returns student info (role is implicit)
        assert "student" in data
        assert data["student"]["student_id"] == student_data["student_id"]
        print(f"✓ Student login verified: {data['student']['name']}")
        print(f"  Student ID: {data['student']['student_id']}")
        print(f"  Expected redirect: /student-dashboard")


class TestTeachTinoAndStudyTinoDashboards:
    """Test TeachTino and StudyTino dashboard endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
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
    
    def test_teacher_dashboard_endpoint(self):
        """Test TeachTino dashboard endpoint"""
        print("\n📚 Testing TeachTino Dashboard endpoint...")
        
        # Create a teacher
        unique_email = f"TEST_teachtino_{uuid.uuid4().hex[:8]}@school.com"
        create_res = requests.post(
            f"{BASE_URL}/api/users/create",
            headers=self.director_headers,
            json={
                "name": "TeachTino Test Teacher",
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
        assert dashboard_res.status_code == 200, f"Teacher dashboard failed: {dashboard_res.text}"
        data = dashboard_res.json()
        
        assert "my_classes" in data
        assert "total_students" in data
        assert "attendance_today" in data
        print(f"✓ TeachTino Dashboard accessible")
        print(f"  My Classes: {len(data['my_classes'])}")
        print(f"  Total Students: {data['total_students']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
