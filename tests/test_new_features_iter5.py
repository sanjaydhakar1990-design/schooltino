"""
Test Suite for Schooltino New Features - Iteration 5
Tests: Voice Assistant, SMS Center, Image Gallery, Website Integration, QR Code, Report Cards
"""
import pytest
import requests
import os
import json
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tinoai-dashboard.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"


class TestAuthentication:
    """Authentication tests for getting tokens"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get director auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_director_login(self):
        """Test director login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "director"
        print(f"✓ Director login successful: {data['user']['name']}")


class TestSMSCenter:
    """SMS Center API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_sms_templates(self):
        """Test SMS templates endpoint"""
        response = requests.get(f"{BASE_URL}/api/sms/templates", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        templates = data["templates"]
        assert len(templates) >= 4
        
        # Verify expected templates
        template_ids = [t["id"] for t in templates]
        assert "fee_reminder" in template_ids, "Fee Reminder template missing"
        assert "attendance_alert" in template_ids, "Attendance Alert template missing"
        assert "exam_notice" in template_ids, "Exam Notice template missing"
        assert "result_declared" in template_ids, "Result Declared template missing"
        
        print(f"✓ SMS templates loaded: {len(templates)} templates")
        for t in templates:
            print(f"  - {t['name']}: {t['id']}")
    
    def test_send_sms_all_parents(self):
        """Test sending SMS to all parents (mock)"""
        response = requests.post(f"{BASE_URL}/api/sms/send", 
            headers=self.headers,
            json={
                "recipient_type": "all_parents",
                "message": "TEST: This is a test message from Schooltino"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "recipients_count" in data
        assert data["status"] == "sent"
        print(f"✓ SMS sent to all parents: {data['recipients_count']} recipients")
    
    def test_send_sms_individual(self):
        """Test sending SMS to individual number (mock)"""
        response = requests.post(f"{BASE_URL}/api/sms/send",
            headers=self.headers,
            json={
                "recipient_type": "individual",
                "mobile": "9876543210",
                "message": "TEST: Individual SMS test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        print(f"✓ Individual SMS sent: ID {data['id']}")


class TestVoiceAssistant:
    """Voice Assistant API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_voice_command_dashboard(self):
        """Test voice command for dashboard navigation"""
        response = requests.post(f"{BASE_URL}/api/ai/voice-command",
            headers=self.headers,
            json={"command": "dashboard dikhao"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        assert "message" in data
        print(f"✓ Voice command processed: action={data['action']}, message={data['message'][:50]}...")
    
    def test_voice_command_students(self):
        """Test voice command for students list"""
        response = requests.post(f"{BASE_URL}/api/ai/voice-command",
            headers=self.headers,
            json={"command": "students ki list dikhao"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        print(f"✓ Voice command (students): action={data['action']}")
    
    def test_voice_command_fee_reminder(self):
        """Test voice command for fee reminder"""
        response = requests.post(f"{BASE_URL}/api/ai/voice-command",
            headers=self.headers,
            json={"command": "fee reminder bhejo sabko"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        print(f"✓ Voice command (fee reminder): action={data['action']}")


class TestImageGallery:
    """Image Gallery API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_images(self):
        """Test listing images"""
        response = requests.get(f"{BASE_URL}/api/images", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Images list: {len(data)} images found")
    
    def test_upload_image(self):
        """Test image upload"""
        # Create a simple test image (1x1 red pixel PNG)
        import io
        
        # Minimal PNG file (1x1 red pixel)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xDD,
            0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,  # IEND chunk
            0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {
            'file': ('test_image.png', io.BytesIO(png_data), 'image/png')
        }
        data = {
            'category': 'gallery',
            'title': 'TEST_Upload_Image'
        }
        
        # Remove Content-Type from headers for multipart
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(f"{BASE_URL}/api/images/upload",
            headers=headers,
            files=files,
            data=data
        )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        result = response.json()
        assert "id" in result
        assert "url" in result
        assert result["category"] == "gallery"
        print(f"✓ Image uploaded: {result['filename']}, URL: {result['url']}")
        
        # Store for cleanup
        self.uploaded_image_id = result["id"]
        return result["id"]
    
    def test_delete_image(self):
        """Test image deletion"""
        # First upload an image
        import io
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xDD,
            0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
            0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('delete_test.png', io.BytesIO(png_data), 'image/png')}
        data = {'category': 'gallery', 'title': 'TEST_Delete_Image'}
        headers = {"Authorization": f"Bearer {self.token}"}
        
        upload_response = requests.post(f"{BASE_URL}/api/images/upload",
            headers=headers, files=files, data=data)
        assert upload_response.status_code == 200
        image_id = upload_response.json()["id"]
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/images/{image_id}",
            headers=self.headers)
        assert delete_response.status_code == 200
        print(f"✓ Image deleted: {image_id}")


class TestQRCode:
    """QR Code API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create test student"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_generate_student_qr(self):
        """Test QR code generation for student"""
        # First get a student
        students_response = requests.get(f"{BASE_URL}/api/students", headers=self.headers)
        if students_response.status_code == 200 and len(students_response.json()) > 0:
            student = students_response.json()[0]
            student_id = student["id"]
            
            # Generate QR
            qr_response = requests.get(f"{BASE_URL}/api/qr/student/{student_id}",
                headers=self.headers)
            assert qr_response.status_code == 200
            data = qr_response.json()
            assert "qr_code" in data
            assert "student_id" in data
            assert "name" in data
            
            # Verify QR code is valid base64
            try:
                decoded = base64.b64decode(data["qr_code"])
                assert len(decoded) > 0
                print(f"✓ QR code generated for student: {data['name']} ({data['student_id']})")
            except Exception as e:
                pytest.fail(f"Invalid QR code base64: {e}")
        else:
            pytest.skip("No students available for QR test")


class TestReportCard:
    """Report Card API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_generate_report_card(self):
        """Test report card generation"""
        # First get a student
        students_response = requests.get(f"{BASE_URL}/api/students", headers=self.headers)
        if students_response.status_code == 200 and len(students_response.json()) > 0:
            student = students_response.json()[0]
            student_id = student["id"]
            
            # Generate report card
            report_data = {
                "student_id": student_id,
                "exam_name": "TEST_Mid_Term_Exam",
                "subjects": [
                    {"subject": "Mathematics", "marks_obtained": 85, "total_marks": 100, "grade": "A"},
                    {"subject": "Science", "marks_obtained": 78, "total_marks": 100, "grade": "B+"},
                    {"subject": "English", "marks_obtained": 92, "total_marks": 100, "grade": "A+"},
                    {"subject": "Hindi", "marks_obtained": 88, "total_marks": 100, "grade": "A"},
                    {"subject": "Social Studies", "marks_obtained": 75, "total_marks": 100, "grade": "B"}
                ],
                "remarks": "Good performance. Keep it up!",
                "class_teacher_name": "Mrs. Sharma"
            }
            
            response = requests.post(f"{BASE_URL}/api/reports/generate",
                headers=self.headers,
                json=report_data)
            assert response.status_code == 200, f"Report generation failed: {response.text}"
            data = response.json()
            
            assert "id" in data
            assert "student_name" in data
            assert "percentage" in data
            assert "grade" in data
            assert data["exam_name"] == "TEST_Mid_Term_Exam"
            
            print(f"✓ Report card generated: {data['student_name']}")
            print(f"  - Total: {data['obtained_marks']}/{data['total_marks']}")
            print(f"  - Percentage: {data['percentage']}%")
            print(f"  - Grade: {data['grade']}")
        else:
            pytest.skip("No students available for report card test")


class TestWebsiteIntegration:
    """Website Integration API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_website_config(self):
        """Test getting website configuration"""
        response = requests.get(f"{BASE_URL}/api/website/config", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # May be empty if not configured
        print(f"✓ Website config retrieved: {'configured' if data.get('website_url') else 'not configured'}")
    
    def test_configure_website(self):
        """Test configuring website sync"""
        config_data = {
            "website_url": "https://test-school.example.com",
            "sync_notices": True,
            "sync_events": True,
            "sync_gallery": True,
            "sync_results": False
        }
        
        response = requests.post(f"{BASE_URL}/api/website/configure",
            headers=self.headers,
            json=config_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "api_key" in data
        assert "embed_code" in data
        print(f"✓ Website configured: API key generated")
        print(f"  - Embed code: {data['embed_code'][:50]}...")


class TestPublicAPIs:
    """Public API endpoints for website integration"""
    
    def test_public_school_info(self):
        """Test public school info endpoint"""
        # First get a school ID
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        schools_response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if schools_response.status_code == 200 and len(schools_response.json()) > 0:
            school_id = schools_response.json()[0]["id"]
            
            # Test public endpoint
            public_response = requests.get(f"{BASE_URL}/api/public/school/{school_id}/info")
            assert public_response.status_code == 200
            data = public_response.json()
            assert "name" in data
            print(f"✓ Public school info: {data['name']}")
        else:
            pytest.skip("No schools available for public API test")
    
    def test_public_notices(self):
        """Test public notices endpoint"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        schools_response = requests.get(f"{BASE_URL}/api/schools", headers=headers)
        if schools_response.status_code == 200 and len(schools_response.json()) > 0:
            school_id = schools_response.json()[0]["id"]
            
            public_response = requests.get(f"{BASE_URL}/api/public/school/{school_id}/notices")
            assert public_response.status_code == 200
            data = public_response.json()
            assert "notices" in data
            print(f"✓ Public notices: {len(data['notices'])} notices")
        else:
            pytest.skip("No schools available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
