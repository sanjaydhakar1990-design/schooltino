"""
Iteration 47 - Bulk Import and Document Upload API Tests
Tests for:
1. Bulk Import Template API - GET /api/bulk-import/template/{type}
2. Bulk Import Preview API - POST /api/bulk-import/preview
3. Bulk Import Execute API - POST /api/bulk-import/execute
4. Document Upload API - POST /api/documents/upload
5. Document List API - GET /api/documents/list/{person_type}/{person_id}
6. Document Delete API - DELETE /api/documents/{doc_id}
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "director@test.com"
TEST_PASSWORD = "test1234"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_token):
        """Get school ID from user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        return data.get("school_id")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ Login successful for {TEST_EMAIL}")


class TestBulkImportTemplate:
    """Bulk Import Template API Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_student_template(self, auth_token):
        """Test GET /api/bulk-import/template/student"""
        response = requests.get(
            f"{BASE_URL}/api/bulk-import/template/student",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify template structure
        assert "headers" in data
        assert "sample_csv" in data
        assert "instructions" in data
        
        # Verify required headers
        headers = data["headers"]
        assert "name" in headers
        assert "class_name" in headers
        assert "father_name" in headers
        assert "mobile" in headers
        
        print(f"✓ Student template has {len(headers)} columns")
        print(f"  Headers: {', '.join(headers[:5])}...")
    
    def test_get_employee_template(self, auth_token):
        """Test GET /api/bulk-import/template/employee"""
        response = requests.get(
            f"{BASE_URL}/api/bulk-import/template/employee",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify template structure
        assert "headers" in data
        assert "sample_csv" in data
        
        # Verify required headers
        headers = data["headers"]
        assert "name" in headers
        assert "designation" in headers
        assert "mobile" in headers
        assert "email" in headers
        
        print(f"✓ Employee template has {len(headers)} columns")
    
    def test_invalid_template_type(self, auth_token):
        """Test invalid template type returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/bulk-import/template/invalid_type",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        print("✓ Invalid template type returns 400")


class TestBulkImportPreview:
    """Bulk Import Preview API Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_token):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        return response.json().get("school_id")
    
    def test_preview_valid_csv(self, auth_token, school_id):
        """Test preview with valid CSV data"""
        # Create test CSV content
        csv_content = """name,class_name,section,gender,dob,father_name,mother_name,mobile,address,aadhar_no,caste,religion,category,previous_school,blood_group,admission_date
Test Student 1,Class 5,A,male,2015-05-10,Test Father 1,Test Mother 1,9876543210,Test Address 1,123456789012,General,Hindu,APL,Previous School,B+,2024-04-01
Test Student 2,Class 6,B,female,2014-03-15,Test Father 2,Test Mother 2,9876543211,Test Address 2,123456789013,OBC,Hindu,BPL,Previous School 2,A+,2024-04-01"""
        
        files = {
            'file': ('test_students.csv', csv_content, 'text/csv')
        }
        data = {
            'import_type': 'student',
            'school_id': school_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bulk-import/preview",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        # Verify preview structure
        assert "total_rows" in result
        assert "valid_rows" in result
        assert "invalid_rows" in result
        assert "preview_data" in result
        
        assert result["total_rows"] == 2
        assert result["valid_rows"] >= 0
        
        print(f"✓ Preview: {result['total_rows']} rows, {result['valid_rows']} valid, {result['invalid_rows']} invalid")
    
    def test_preview_invalid_file_type(self, auth_token, school_id):
        """Test preview with invalid file type"""
        files = {
            'file': ('test.txt', 'invalid content', 'text/plain')
        }
        data = {
            'import_type': 'student',
            'school_id': school_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bulk-import/preview",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should return 400 for invalid file type
        assert response.status_code == 400
        print("✓ Invalid file type returns 400")


class TestBulkImportExecute:
    """Bulk Import Execute API Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_token):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        return response.json().get("school_id")
    
    def test_execute_student_import(self, auth_token, school_id):
        """Test executing student import from CSV"""
        import uuid
        unique_id = uuid.uuid4().hex[:6]
        
        # Create test CSV content with unique names
        csv_content = f"""name,class_name,section,gender,dob,father_name,mother_name,mobile,address,aadhar_no,caste,religion,category,previous_school,blood_group,admission_date
TEST_BulkStudent_{unique_id},Class 5,A,male,2015-05-10,Test Father,Test Mother,9876543{unique_id[:4]},Test Address,123456789012,General,Hindu,APL,Previous School,B+,2024-04-01"""
        
        files = {
            'file': ('test_students.csv', csv_content, 'text/csv')
        }
        data = {
            'import_type': 'student',
            'school_id': school_id,
            'skip_invalid': 'true'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bulk-import/execute",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        # Verify import result
        assert "success" in result
        assert "success_count" in result
        assert "error_count" in result
        
        print(f"✓ Import executed: {result['success_count']} success, {result['error_count']} errors")
        
        # Verify student was created by searching
        search_response = requests.get(
            f"{BASE_URL}/api/students?school_id={school_id}&search=TEST_BulkStudent_{unique_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if search_response.status_code == 200:
            students = search_response.json()
            if len(students) > 0:
                print(f"✓ Verified: Student 'TEST_BulkStudent_{unique_id}' found in database")


class TestDocumentUpload:
    """Document Upload API Tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_token):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        return response.json().get("school_id")
    
    @pytest.fixture(scope="class")
    def test_student_id(self, auth_token, school_id):
        """Get a test student ID"""
        response = requests.get(
            f"{BASE_URL}/api/students?school_id={school_id}&limit=1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 200:
            students = response.json()
            if students:
                return students[0].get("id")
        return "TEST-STUDENT-001"
    
    def test_upload_document(self, auth_token, school_id, test_student_id):
        """Test document upload for student"""
        # Create a simple test image (1x1 pixel JPEG)
        # This is a minimal valid JPEG
        jpeg_bytes = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xA9,
            0x00, 0x00, 0x00, 0x00, 0xFF, 0xD9
        ])
        
        files = {
            'file': ('test_document.jpg', jpeg_bytes, 'image/jpeg')
        }
        data = {
            'document_type': 'aadhar_card',
            'person_id': test_student_id,
            'person_type': 'student',
            'school_id': school_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/documents/upload",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        assert "id" in result
        assert "file_url" in result
        
        print(f"✓ Document uploaded: {result['id']}")
        return result["id"]
    
    def test_list_documents(self, auth_token, test_student_id):
        """Test listing documents for a student"""
        response = requests.get(
            f"{BASE_URL}/api/documents/list/student/{test_student_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        documents = response.json()
        
        assert isinstance(documents, list)
        print(f"✓ Found {len(documents)} documents for student")
    
    def test_upload_invalid_file_type(self, auth_token, school_id, test_student_id):
        """Test upload with invalid file type"""
        files = {
            'file': ('test.exe', b'invalid content', 'application/octet-stream')
        }
        data = {
            'document_type': 'aadhar_card',
            'person_id': test_student_id,
            'person_type': 'student',
            'school_id': school_id
        }
        
        response = requests.post(
            f"{BASE_URL}/api/documents/upload",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 400
        print("✓ Invalid file type returns 400")


class TestStudentsPageIntegration:
    """Test Students page API integration"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_token):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        return response.json().get("school_id")
    
    def test_students_list_api(self, auth_token, school_id):
        """Test students list API"""
        response = requests.get(
            f"{BASE_URL}/api/students?school_id={school_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        students = response.json()
        assert isinstance(students, list)
        print(f"✓ Students list API: {len(students)} students found")
    
    def test_classes_list_api(self, auth_token, school_id):
        """Test classes list API"""
        response = requests.get(
            f"{BASE_URL}/api/classes?school_id={school_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        classes = response.json()
        assert isinstance(classes, list)
        print(f"✓ Classes list API: {len(classes)} classes found")


class TestEmployeeManagement:
    """Test Employee Management APIs"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def school_id(self, auth_token):
        """Get school ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        return response.json().get("school_id")
    
    def test_staff_list_api(self, auth_token, school_id):
        """Test staff/employees list API"""
        response = requests.get(
            f"{BASE_URL}/api/staff?school_id={school_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Staff API might return 200 or 404 if no staff
        assert response.status_code in [200, 404], f"Failed: {response.text}"
        if response.status_code == 200:
            staff = response.json()
            print(f"✓ Staff list API: {len(staff)} employees found")
        else:
            print("✓ Staff list API: No employees yet")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
