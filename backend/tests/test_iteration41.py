"""
Iteration 41 - Testing New Features:
1. Timetable Management APIs (/api/timetables, /api/timetables/slot)
2. Certificate Generator APIs (/api/certificates, /api/certificates/count)
3. Exam & Report Card APIs (/api/exams, /api/marks, /api/marks/bulk)
4. Fee Management APIs (already tested in iter40, quick verification)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "director@test.com"
TEST_PASSWORD = "test1234"
SCHOOL_ID = "SCH-TEST-2026"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestTimetableManagement:
    """Test Timetable Management APIs"""
    
    def test_get_timetables(self, headers):
        """Test GET /api/timetables"""
        response = requests.get(
            f"{BASE_URL}/api/timetables?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        print(f"✓ GET /api/timetables - Status: {response.status_code}")
    
    def test_save_timetable_slot(self, headers):
        """Test POST /api/timetables/slot"""
        slot_data = {
            "school_id": SCHOOL_ID,
            "class_id": "test-class-1",
            "day": "Monday",
            "period_id": 1,
            "subject_id": "hindi",
            "subject_name": "Hindi",
            "teacher_id": "test-teacher-1",
            "teacher_name": "Test Teacher",
            "room": "Room 101"
        }
        response = requests.post(
            f"{BASE_URL}/api/timetables/slot",
            headers=headers,
            json=slot_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        print(f"✓ POST /api/timetables/slot - Status: {response.status_code}")
    
    def test_get_timetables_with_class_filter(self, headers):
        """Test GET /api/timetables with class_id filter"""
        response = requests.get(
            f"{BASE_URL}/api/timetables?school_id={SCHOOL_ID}&class_id=test-class-1",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/timetables with class filter - Status: {response.status_code}")
    
    def test_delete_timetable_slot(self, headers):
        """Test DELETE /api/timetables/slot"""
        response = requests.delete(
            f"{BASE_URL}/api/timetables/slot?school_id={SCHOOL_ID}&class_id=test-class-1&day=Monday&period_id=1",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        print(f"✓ DELETE /api/timetables/slot - Status: {response.status_code}")


class TestCertificateGenerator:
    """Test Certificate Generator APIs"""
    
    def test_get_certificate_count(self, headers):
        """Test GET /api/certificates/count"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/count?school_id={SCHOOL_ID}&type=tc",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "count" in data, "Response should have 'count' field"
        print(f"✓ GET /api/certificates/count - Status: {response.status_code}, Count: {data.get('count')}")
    
    def test_get_certificates(self, headers):
        """Test GET /api/certificates"""
        response = requests.get(
            f"{BASE_URL}/api/certificates?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/certificates - Status: {response.status_code}, Count: {len(data)}")
    
    def test_create_certificate(self, headers):
        """Test POST /api/certificates"""
        cert_data = {
            "school_id": SCHOOL_ID,
            "student_id": f"test-student-{uuid.uuid4().hex[:8]}",
            "type": "character",  # Using character cert to avoid marking student as left
            "data": {
                "conduct": "Good",
                "remarks": "Test certificate"
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/certificates",
            headers=headers,
            json=cert_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "id" in data, "Response should have 'id' field"
        print(f"✓ POST /api/certificates - Status: {response.status_code}, ID: {data.get('id')}")


class TestExamReportCard:
    """Test Exam & Report Card APIs"""
    
    exam_id = None
    
    def test_get_exams(self, headers):
        """Test GET /api/exams"""
        response = requests.get(
            f"{BASE_URL}/api/exams?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/exams - Status: {response.status_code}, Count: {len(data)}")
    
    def test_create_exam(self, headers):
        """Test POST /api/exams"""
        exam_data = {
            "school_id": SCHOOL_ID,
            "name": f"Test Exam {uuid.uuid4().hex[:6]}",
            "type": "unit1",
            "class_id": "test-class-1",
            "start_date": "2026-01-20",
            "end_date": "2026-01-25",
            "max_marks": 100
        }
        response = requests.post(
            f"{BASE_URL}/api/exams",
            headers=headers,
            json=exam_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "id" in data, "Response should have 'id' field"
        TestExamReportCard.exam_id = data.get("id")
        print(f"✓ POST /api/exams - Status: {response.status_code}, ID: {data.get('id')}")
    
    def test_get_marks(self, headers):
        """Test GET /api/marks"""
        exam_id = TestExamReportCard.exam_id or "test-exam-1"
        response = requests.get(
            f"{BASE_URL}/api/marks?school_id={SCHOOL_ID}&class_id=test-class-1&exam_id={exam_id}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/marks - Status: {response.status_code}, Count: {len(data)}")
    
    def test_save_bulk_marks(self, headers):
        """Test POST /api/marks/bulk"""
        exam_id = TestExamReportCard.exam_id or "test-exam-1"
        marks_data = {
            "school_id": SCHOOL_ID,
            "class_id": "test-class-1",
            "exam_id": exam_id,
            "marks": [
                {"student_id": "test-student-1", "subject_id": "hindi", "marks": 85},
                {"student_id": "test-student-1", "subject_id": "english", "marks": 78},
                {"student_id": "test-student-1", "subject_id": "math", "marks": 92}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/marks/bulk",
            headers=headers,
            json=marks_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert data.get("saved_count") == 3, "Expected saved_count=3"
        print(f"✓ POST /api/marks/bulk - Status: {response.status_code}, Saved: {data.get('saved_count')}")
    
    def test_verify_marks_saved(self, headers):
        """Verify marks were actually saved"""
        exam_id = TestExamReportCard.exam_id or "test-exam-1"
        response = requests.get(
            f"{BASE_URL}/api/marks?school_id={SCHOOL_ID}&class_id=test-class-1&exam_id={exam_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3, f"Expected at least 3 marks, got {len(data)}"
        print(f"✓ Marks verification - Found {len(data)} marks records")


class TestSubjects:
    """Test Subjects API"""
    
    def test_get_subjects(self, headers):
        """Test GET /api/subjects"""
        response = requests.get(
            f"{BASE_URL}/api/subjects?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/subjects - Status: {response.status_code}, Count: {len(data)}")


class TestFeeManagementQuickCheck:
    """Quick verification of Fee Management APIs (already tested in iter40)"""
    
    def test_fee_structures(self, headers):
        """Test GET /api/fee-structures"""
        response = requests.get(
            f"{BASE_URL}/api/fee-structures?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/fee-structures - Status: {response.status_code}")
    
    def test_fee_collections(self, headers):
        """Test GET /api/fee-collections"""
        response = requests.get(
            f"{BASE_URL}/api/fee-collections?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/fee-collections - Status: {response.status_code}")
    
    def test_old_dues(self, headers):
        """Test GET /api/old-dues"""
        response = requests.get(
            f"{BASE_URL}/api/old-dues?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/old-dues - Status: {response.status_code}")


class TestClassesAndStudents:
    """Test Classes and Students APIs for frontend integration"""
    
    def test_get_classes(self, headers):
        """Test GET /api/classes"""
        response = requests.get(
            f"{BASE_URL}/api/classes?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/classes - Status: {response.status_code}, Count: {len(data)}")
    
    def test_get_students(self, headers):
        """Test GET /api/students"""
        response = requests.get(
            f"{BASE_URL}/api/students?school_id={SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/students - Status: {response.status_code}, Count: {len(data)}")
    
    def test_get_school(self, headers):
        """Test GET /api/schools/{school_id}"""
        response = requests.get(
            f"{BASE_URL}/api/schools/{SCHOOL_ID}",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data or "name" in data, "Response should have school data"
        print(f"✓ GET /api/schools/{SCHOOL_ID} - Status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
