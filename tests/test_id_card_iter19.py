"""
Iteration 19: ID Card Generation API Tests
- Student ID card generation
- Staff ID card generation
- Text format download
- Staff photo retrieval
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learnmaster-8.preview.emergentagent.com')

# Test student ID from the review request
TEST_STUDENT_ID = "STD-2026-285220"


class TestStudentIDCard:
    """Student ID Card API Tests"""
    
    def test_generate_student_id_card_success(self):
        """Test generating student ID card data"""
        response = requests.get(f"{BASE_URL}/api/id-card/generate/student/{TEST_STUDENT_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        
        # Verify ID card structure
        id_card = data.get("id_card")
        assert id_card is not None, "id_card should be present"
        assert id_card.get("card_type") == "STUDENT ID CARD", "Card type should be STUDENT ID CARD"
        assert id_card.get("id_number") == TEST_STUDENT_ID, f"ID number should be {TEST_STUDENT_ID}"
        assert id_card.get("name") is not None, "Name should be present"
        assert id_card.get("valid_until") is not None, "Valid until should be present"
        
        # Verify school info
        school = data.get("school")
        assert school is not None, "School info should be present"
        assert school.get("name") is not None, "School name should be present"
        
        # Verify QR data
        assert data.get("qr_data") is not None, "QR data should be present"
        assert "SCHOOLTINO|STUDENT" in data.get("qr_data"), "QR data should contain SCHOOLTINO|STUDENT"
        
        print(f"✓ Student ID card generated for: {id_card.get('name')}")
        print(f"  - ID: {id_card.get('id_number')}")
        print(f"  - Class: {id_card.get('class')}")
        print(f"  - Valid until: {id_card.get('valid_until')}")
    
    def test_generate_student_id_card_not_found(self):
        """Test generating ID card for non-existent student"""
        response = requests.get(f"{BASE_URL}/api/id-card/generate/student/INVALID-STUDENT-ID")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Returns 404 for non-existent student")
    
    def test_student_id_card_text_format(self):
        """Test downloading student ID card as text"""
        response = requests.get(f"{BASE_URL}/api/id-card/text/student/{TEST_STUDENT_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert data.get("card_text") is not None, "card_text should be present"
        assert data.get("filename") is not None, "filename should be present"
        
        # Verify text content
        card_text = data.get("card_text")
        assert "STUDENT ID CARD" in card_text, "Text should contain STUDENT ID CARD"
        assert TEST_STUDENT_ID in card_text, f"Text should contain {TEST_STUDENT_ID}"
        assert "IF FOUND, PLEASE RETURN TO SCHOOL" in card_text, "Text should contain return message"
        
        # Verify filename format
        filename = data.get("filename")
        assert filename.startswith("ID_Card_"), "Filename should start with ID_Card_"
        assert filename.endswith(".txt"), "Filename should end with .txt"
        
        print(f"✓ Text format ID card generated: {filename}")
        print(f"  - Card text length: {len(card_text)} characters")


class TestStaffIDCard:
    """Staff ID Card API Tests"""
    
    def test_generate_staff_id_card_invalid_type(self):
        """Test generating ID card with invalid person type"""
        response = requests.get(f"{BASE_URL}/api/id-card/generate/invalid_type/test-id")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Returns 400 for invalid person type")
    
    def test_get_staff_photos_empty(self):
        """Test getting photos for staff with no photos"""
        response = requests.get(f"{BASE_URL}/api/id-card/staff-photos/test-staff-id")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("staff_id") == "test-staff-id", "staff_id should match"
        assert data.get("total_photos") == 0, "total_photos should be 0 for non-existent staff"
        assert data.get("photos") == [], "photos should be empty list"
        
        print("✓ Staff photos endpoint returns empty list for non-existent staff")
    
    def test_generate_teacher_id_card_not_found(self):
        """Test generating ID card for non-existent teacher"""
        response = requests.get(f"{BASE_URL}/api/id-card/generate/teacher/INVALID-TEACHER-ID")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Returns 404 for non-existent teacher")


class TestIDCardValidation:
    """ID Card Validation Tests"""
    
    def test_valid_person_types(self):
        """Test that valid person types are accepted"""
        valid_types = ["student", "teacher", "staff", "director", "admin"]
        
        for person_type in valid_types:
            response = requests.get(f"{BASE_URL}/api/id-card/generate/{person_type}/test-id")
            # Should return 404 (not found) not 400 (bad request)
            assert response.status_code in [200, 404], f"Type '{person_type}' should be valid, got {response.status_code}"
        
        print(f"✓ All valid person types accepted: {valid_types}")
    
    def test_id_card_has_qr_data(self):
        """Test that ID card includes QR code data for verification"""
        response = requests.get(f"{BASE_URL}/api/id-card/generate/student/{TEST_STUDENT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        qr_data = data.get("qr_data")
        assert qr_data is not None, "QR data should be present"
        
        # QR data format: SCHOOLTINO|TYPE|ID|NAME
        parts = qr_data.split("|")
        assert len(parts) >= 3, "QR data should have at least 3 parts"
        assert parts[0] == "SCHOOLTINO", "QR data should start with SCHOOLTINO"
        assert parts[1] == "STUDENT", "QR data should contain person type"
        
        print(f"✓ QR data format verified: {qr_data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
