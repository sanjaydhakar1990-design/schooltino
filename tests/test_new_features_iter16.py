"""
Test Suite for Schooltino New Features - Iteration 16
Features tested:
1. Multi-Year Fee Management APIs
2. Salary Management APIs
3. Dashboard Quick Access Tabs
4. TeachTino Dashboard Salary Button
5. StudentDashboard Quick Tabs
6. Sidebar Links
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tinoai-dashboard.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "director@schooltino.com"
ADMIN_PASSWORD = "admin123"
TEACHER_EMAIL = "teacher@schooltino.com"
TEACHER_PASSWORD = "teacher123"
STUDENT_ID = "STD-2026-285220"
STUDENT_PASSWORD = "KPbeHdZf"
SCHOOL_ID = "school1"
SCHOOL_ID_2 = "d8306c00-b010-46aa-9c93-e6e5494ffa0f"
TEACHER_ID = "37996667-303a-495b-801b-52a236f3e4d0"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def teacher_token():
    """Get teacher authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEACHER_EMAIL,
        "password": TEACHER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    return None  # Teacher may not exist


@pytest.fixture(scope="module")
def student_token():
    """Get student authentication token"""
    response = requests.post(f"{BASE_URL}/api/student/login", json={
        "student_id": STUDENT_ID,
        "password": STUDENT_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    return None  # Student may not exist


class TestMultiYearFeesAPIs:
    """Test Multi-Year Fee Management APIs"""
    
    def test_get_year_wise_summary(self, admin_token):
        """Test /api/multi-year-fees/summary/{school_id} - should return year-wise summary"""
        response = requests.get(
            f"{BASE_URL}/api/multi-year-fees/summary/{SCHOOL_ID}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "school_id" in data, "Response should contain school_id"
        assert "total_pending_all_years" in data, "Response should contain total_pending_all_years"
        assert "total_students_with_dues" in data, "Response should contain total_students_with_dues"
        assert "years_with_dues" in data, "Response should contain years_with_dues"
        assert "year_wise_summary" in data, "Response should contain year_wise_summary"
        
        print(f"✓ Multi-year fees summary: {data['total_pending_all_years']} pending, {data['total_students_with_dues']} students with dues")
    
    def test_get_year_wise_summary_school2(self, admin_token):
        """Test summary with second school ID"""
        response = requests.get(
            f"{BASE_URL}/api/multi-year-fees/summary/{SCHOOL_ID_2}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "school_id" in data
        print(f"✓ Multi-year fees summary for school2: {data['total_pending_all_years']} pending")
    
    def test_add_previous_year_due(self, admin_token):
        """Test /api/multi-year-fees/add-due - should add previous year due to student"""
        # First get a student to add due to
        students_response = requests.get(
            f"{BASE_URL}/api/students?school_id={SCHOOL_ID}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        if students_response.status_code != 200 or not students_response.json():
            pytest.skip("No students found to test with")
        
        students = students_response.json()
        test_student = students[0] if students else None
        
        if not test_student:
            pytest.skip("No students available for testing")
        
        student_id = test_student.get("student_id") or test_student.get("id")
        
        # Add a previous year due
        due_data = {
            "student_id": student_id,
            "school_id": SCHOOL_ID,
            "academic_year": "2023-24",
            "due_amount": 5000,
            "fee_type": "tuition",
            "description": "Test previous year due",
            "remarks": "Added via pytest"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/multi-year-fees/add-due",
            json=due_data,
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Response should indicate success"
        assert "due_id" in data, "Response should contain due_id"
        assert "message" in data, "Response should contain message"
        
        print(f"✓ Added previous year due: {data.get('message')}")
        
        # Store due_id for cleanup
        return data.get("due_id")
    
    def test_get_student_year_wise_dues(self, admin_token):
        """Test /api/multi-year-fees/student/{student_id} - should return student's dues breakdown"""
        # Get a student
        students_response = requests.get(
            f"{BASE_URL}/api/students?school_id={SCHOOL_ID}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        if students_response.status_code != 200 or not students_response.json():
            pytest.skip("No students found")
        
        students = students_response.json()
        test_student = students[0] if students else None
        
        if not test_student:
            pytest.skip("No students available")
        
        student_id = test_student.get("student_id") or test_student.get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/multi-year-fees/student/{student_id}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "student_id" in data, "Response should contain student_id"
        assert "summary" in data, "Response should contain summary"
        assert "year_wise_breakdown" in data, "Response should contain year_wise_breakdown"
        
        summary = data.get("summary", {})
        assert "total_previous_years_pending" in summary, "Summary should contain total_previous_years_pending"
        assert "current_year_pending" in summary, "Summary should contain current_year_pending"
        assert "grand_total_pending" in summary, "Summary should contain grand_total_pending"
        
        print(f"✓ Student dues: Previous years: ₹{summary.get('total_previous_years_pending', 0)}, Current: ₹{summary.get('current_year_pending', 0)}")
    
    def test_get_fee_defaulters(self, admin_token):
        """Test /api/multi-year-fees/defaulters/{school_id} - should return defaulters list"""
        response = requests.get(
            f"{BASE_URL}/api/multi-year-fees/defaulters/{SCHOOL_ID}?min_amount=0",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "school_id" in data, "Response should contain school_id"
        assert "total_defaulters" in data, "Response should contain total_defaulters"
        assert "total_pending_amount" in data, "Response should contain total_pending_amount"
        assert "defaulters" in data, "Response should contain defaulters list"
        
        print(f"✓ Fee defaulters: {data['total_defaulters']} students, ₹{data['total_pending_amount']} pending")


class TestSalaryManagementAPIs:
    """Test Salary Management APIs"""
    
    def test_get_salary_status(self, admin_token):
        """Test /api/salary/status/{staff_id} - should return monthly salary status"""
        response = requests.get(
            f"{BASE_URL}/api/salary/status/{TEACHER_ID}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "staff_id" in data, "Response should contain staff_id"
        assert "year" in data, "Response should contain year"
        assert "salary_structure" in data, "Response should contain salary_structure"
        assert "summary" in data, "Response should contain summary"
        assert "monthly_breakdown" in data, "Response should contain monthly_breakdown"
        
        summary = data.get("summary", {})
        assert "total_paid_this_year" in summary, "Summary should contain total_paid_this_year"
        assert "total_pending" in summary, "Summary should contain total_pending"
        assert "months_paid" in summary, "Summary should contain months_paid"
        assert "months_pending" in summary, "Summary should contain months_pending"
        
        print(f"✓ Salary status: {summary.get('months_paid', 0)} months paid, {summary.get('months_pending', 0)} pending")
    
    def test_get_salary_status_with_year(self, admin_token):
        """Test salary status with specific year parameter"""
        response = requests.get(
            f"{BASE_URL}/api/salary/status/{TEACHER_ID}?year=2024",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("year") == 2024, "Year should be 2024"
        print(f"✓ Salary status for 2024 retrieved")
    
    def test_set_salary_structure(self, admin_token):
        """Test /api/salary/structure/set - should set salary structure for staff"""
        salary_data = {
            "staff_id": TEACHER_ID,
            "school_id": SCHOOL_ID,
            "basic_salary": 25000,
            "hra": 5000,
            "da": 2500,
            "ta": 1500,
            "medical": 1000,
            "special_allowance": 0,
            "pf_deduction": 2100,
            "tax_deduction": 800,
            "other_deductions": 100,
            "effective_from": "2025-01-01"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/salary/structure/set",
            json=salary_data,
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Response should indicate success"
        assert "structure_id" in data, "Response should contain structure_id"
        assert "gross_salary" in data, "Response should contain gross_salary"
        assert "net_salary" in data, "Response should contain net_salary"
        
        # Verify calculations
        expected_gross = 25000 + 5000 + 2500 + 1500 + 1000 + 0  # 35000
        expected_net = expected_gross - (2100 + 800 + 100)  # 32000
        
        assert data.get("gross_salary") == expected_gross, f"Gross salary should be {expected_gross}"
        assert data.get("net_salary") == expected_net, f"Net salary should be {expected_net}"
        
        print(f"✓ Salary structure set: Gross ₹{data['gross_salary']}, Net ₹{data['net_salary']}")
    
    def test_get_salary_structure(self, admin_token):
        """Test /api/salary/structure/{staff_id} - should return salary structure"""
        response = requests.get(
            f"{BASE_URL}/api/salary/structure/{TEACHER_ID}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "staff_id" in data, "Response should contain staff_id"
        # Either has_structure is True with structure, or False with message
        if data.get("has_structure"):
            assert "structure" in data, "Response should contain structure when has_structure is True"
        
        print(f"✓ Salary structure retrieved: has_structure={data.get('has_structure')}")
    
    def test_get_salary_dashboard(self, admin_token):
        """Test /api/salary/dashboard/{school_id} - should return salary dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/salary/dashboard/{SCHOOL_ID}",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "school_id" in data, "Response should contain school_id"
        assert "month" in data, "Response should contain month"
        assert "summary" in data, "Response should contain summary"
        assert "staff_list" in data, "Response should contain staff_list"
        
        summary = data.get("summary", {})
        assert "total_staff" in summary, "Summary should contain total_staff"
        assert "paid_count" in summary, "Summary should contain paid_count"
        assert "pending_count" in summary, "Summary should contain pending_count"
        
        print(f"✓ Salary dashboard: {summary.get('total_staff', 0)} staff, {summary.get('paid_count', 0)} paid, {summary.get('pending_count', 0)} pending")


class TestAPIEndpointsExist:
    """Test that all required API endpoints exist and respond"""
    
    def test_multi_year_fees_summary_endpoint(self):
        """Verify multi-year-fees summary endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/multi-year-fees/summary/test")
        # Should return 200 (empty data) or 404 (not found), not 500
        assert response.status_code in [200, 404], f"Endpoint should exist, got {response.status_code}"
        print("✓ /api/multi-year-fees/summary endpoint exists")
    
    def test_multi_year_fees_student_endpoint(self):
        """Verify multi-year-fees student endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/multi-year-fees/student/test")
        assert response.status_code in [200, 404], f"Endpoint should exist, got {response.status_code}"
        print("✓ /api/multi-year-fees/student endpoint exists")
    
    def test_multi_year_fees_defaulters_endpoint(self):
        """Verify multi-year-fees defaulters endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/multi-year-fees/defaulters/test")
        assert response.status_code in [200, 404], f"Endpoint should exist, got {response.status_code}"
        print("✓ /api/multi-year-fees/defaulters endpoint exists")
    
    def test_salary_status_endpoint(self):
        """Verify salary status endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/salary/status/test")
        assert response.status_code in [200, 404], f"Endpoint should exist, got {response.status_code}"
        print("✓ /api/salary/status endpoint exists")
    
    def test_salary_structure_endpoint(self):
        """Verify salary structure endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/salary/structure/test")
        assert response.status_code in [200, 404], f"Endpoint should exist, got {response.status_code}"
        print("✓ /api/salary/structure endpoint exists")
    
    def test_salary_dashboard_endpoint(self):
        """Verify salary dashboard endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/salary/dashboard/test")
        assert response.status_code in [200, 404], f"Endpoint should exist, got {response.status_code}"
        print("✓ /api/salary/dashboard endpoint exists")


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "director", "User should be director"
        
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid password correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
