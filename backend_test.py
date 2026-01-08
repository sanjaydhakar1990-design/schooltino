#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class SchooltinoAPITester:
    def __init__(self, base_url="https://meri-schooltino.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.school_id = None
        self.class_id = None
        self.student_id = None
        self.staff_id = None
        self.fee_plan_id = None
        self.invoice_id = None
        self.notice_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"director_{timestamp}@schooltino.com",
            "password": "TestPass123!",
            "name": f"Test Director {timestamp}",
            "role": "director"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, register_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        if not self.user_data:
            return False
            
        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_create_school(self):
        """Test school creation"""
        school_data = {
            "name": f"Test School {datetime.now().strftime('%H%M%S')}",
            "address": "123 Test Street",
            "board_type": "CBSE",
            "city": "Test City",
            "state": "Test State",
            "phone": "9876543210",
            "email": "test@school.com"
        }
        
        success, response = self.run_test("Create School", "POST", "schools", 200, school_data)
        if success and 'id' in response:
            self.school_id = response['id']
            return True
        return False

    def test_get_schools(self):
        """Test get schools"""
        return self.run_test("Get Schools", "GET", "schools", 200)[0]

    def test_create_class(self):
        """Test class creation"""
        if not self.school_id:
            return False
            
        class_data = {
            "name": "Class 5",
            "section": "A",
            "school_id": self.school_id
        }
        
        success, response = self.run_test("Create Class", "POST", "classes", 200, class_data)
        if success and 'id' in response:
            self.class_id = response['id']
            return True
        return False

    def test_get_classes(self):
        """Test get classes"""
        endpoint = f"classes?school_id={self.school_id}" if self.school_id else "classes"
        return self.run_test("Get Classes", "GET", endpoint, 200)[0]

    def test_create_staff(self):
        """Test staff creation"""
        if not self.school_id:
            return False
            
        staff_data = {
            "name": f"Test Teacher {datetime.now().strftime('%H%M%S')}",
            "employee_id": f"EMP{datetime.now().strftime('%H%M%S')}",
            "school_id": self.school_id,
            "designation": "Teacher",
            "qualification": "B.Ed",
            "joining_date": "2024-01-01",
            "mobile": "9876543210",
            "email": f"teacher_{datetime.now().strftime('%H%M%S')}@school.com",
            "address": "123 Teacher Street"
        }
        
        success, response = self.run_test("Create Staff", "POST", "staff", 200, staff_data)
        if success and 'id' in response:
            self.staff_id = response['id']
            return True
        return False

    def test_get_staff(self):
        """Test get staff"""
        endpoint = f"staff?school_id={self.school_id}" if self.school_id else "staff"
        return self.run_test("Get Staff", "GET", endpoint, 200)[0]

    def test_create_student(self):
        """Test student creation"""
        if not self.school_id or not self.class_id:
            return False
            
        student_data = {
            "name": f"Test Student {datetime.now().strftime('%H%M%S')}",
            "admission_no": f"ADM{datetime.now().strftime('%H%M%S')}",
            "class_id": self.class_id,
            "school_id": self.school_id,
            "father_name": "Test Father",
            "mother_name": "Test Mother",
            "dob": "2010-01-01",
            "gender": "male",
            "address": "123 Student Street",
            "mobile": "9876543210"
        }
        
        success, response = self.run_test("Create Student", "POST", "students", 200, student_data)
        if success and 'id' in response:
            self.student_id = response['id']
            return True
        return False

    def test_get_students(self):
        """Test get students"""
        endpoint = f"students?school_id={self.school_id}" if self.school_id else "students"
        return self.run_test("Get Students", "GET", endpoint, 200)[0]

    def test_mark_attendance(self):
        """Test attendance marking"""
        if not self.student_id or not self.class_id or not self.school_id:
            return False
            
        attendance_data = {
            "student_id": self.student_id,
            "class_id": self.class_id,
            "school_id": self.school_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": "present"
        }
        
        return self.run_test("Mark Attendance", "POST", "attendance", 200, attendance_data)[0]

    def test_bulk_attendance(self):
        """Test bulk attendance marking"""
        if not self.student_id or not self.class_id or not self.school_id:
            return False
            
        bulk_data = {
            "class_id": self.class_id,
            "school_id": self.school_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "attendance": [
                {
                    "student_id": self.student_id,
                    "status": "present"
                }
            ]
        }
        
        return self.run_test("Bulk Mark Attendance", "POST", "attendance/bulk", 200, bulk_data)[0]

    def test_get_attendance(self):
        """Test get attendance"""
        endpoint = f"attendance?school_id={self.school_id}" if self.school_id else "attendance"
        return self.run_test("Get Attendance", "GET", endpoint, 200)[0]

    def test_attendance_stats(self):
        """Test attendance stats"""
        if not self.school_id:
            return False
        endpoint = f"attendance/stats?school_id={self.school_id}"
        return self.run_test("Get Attendance Stats", "GET", endpoint, 200)[0]

    def test_create_fee_plan(self):
        """Test fee plan creation"""
        if not self.school_id or not self.class_id:
            return False
            
        plan_data = {
            "name": "Monthly Fee",
            "school_id": self.school_id,
            "class_ids": [self.class_id],
            "amount": 5000.0,
            "due_day": 10,
            "late_fee": 100.0
        }
        
        success, response = self.run_test("Create Fee Plan", "POST", "fees/plans", 200, plan_data)
        if success and 'id' in response:
            self.fee_plan_id = response['id']
            return True
        return False

    def test_get_fee_plans(self):
        """Test get fee plans"""
        endpoint = f"fees/plans?school_id={self.school_id}" if self.school_id else "fees/plans"
        return self.run_test("Get Fee Plans", "GET", endpoint, 200)[0]

    def test_create_fee_invoice(self):
        """Test fee invoice creation"""
        if not self.student_id or not self.fee_plan_id or not self.school_id:
            return False
            
        invoice_data = {
            "student_id": self.student_id,
            "fee_plan_id": self.fee_plan_id,
            "school_id": self.school_id,
            "month": datetime.now().strftime("%Y-%m"),
            "amount": 5000.0,
            "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        }
        
        success, response = self.run_test("Create Fee Invoice", "POST", "fees/invoices", 200, invoice_data)
        if success and 'id' in response:
            self.invoice_id = response['id']
            return True
        return False

    def test_get_fee_invoices(self):
        """Test get fee invoices"""
        endpoint = f"fees/invoices?school_id={self.school_id}" if self.school_id else "fees/invoices"
        return self.run_test("Get Fee Invoices", "GET", endpoint, 200)[0]

    def test_fee_payment(self):
        """Test fee payment"""
        if not self.invoice_id:
            return False
            
        payment_data = {
            "invoice_id": self.invoice_id,
            "amount": 5000.0,
            "payment_mode": "cash"
        }
        
        return self.run_test("Record Fee Payment", "POST", "fees/payments", 200, payment_data)[0]

    def test_fee_stats(self):
        """Test fee stats"""
        if not self.school_id:
            return False
        endpoint = f"fees/stats?school_id={self.school_id}"
        return self.run_test("Get Fee Stats", "GET", endpoint, 200)[0]

    def test_create_notice(self):
        """Test notice creation"""
        if not self.school_id:
            return False
            
        notice_data = {
            "title": f"Test Notice {datetime.now().strftime('%H%M%S')}",
            "content": "This is a test notice for API testing.",
            "school_id": self.school_id,
            "target_audience": ["all"],
            "priority": "normal"
        }
        
        success, response = self.run_test("Create Notice", "POST", "notices", 200, notice_data)
        if success and 'id' in response:
            self.notice_id = response['id']
            return True
        return False

    def test_get_notices(self):
        """Test get notices"""
        endpoint = f"notices?school_id={self.school_id}" if self.school_id else "notices"
        return self.run_test("Get Notices", "GET", endpoint, 200)[0]

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        if not self.school_id:
            return False
        endpoint = f"dashboard/stats?school_id={self.school_id}"
        return self.run_test("Get Dashboard Stats", "GET", endpoint, 200)[0]

    def test_audit_logs(self):
        """Test audit logs"""
        return self.run_test("Get Audit Logs", "GET", "audit-logs", 200)[0]

    # ============== TINO BRAIN TESTS ==============
    
    def test_tino_brain_status(self):
        """Test Tino Brain status endpoint"""
        return self.run_test("Tino Brain Status", "GET", "tino-brain/status", 200)[0]
    
    def test_class_intelligence_api(self):
        """Test Class Intelligence API"""
        if not self.school_id:
            return False
        
        # Test with default school and class-10
        endpoint = f"tino-brain/class-intelligence/default/class-10"
        success, response = self.run_test("Class Intelligence API", "GET", endpoint, 200)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["class_id", "class_name", "summary", "attendance", "syllabus", "weak_students", "teacher_performance"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
        
        return success
    
    def test_class_comparison_api(self):
        """Test Class Comparison API"""
        endpoint = "tino-brain/class-comparison/default"
        success, response = self.run_test("Class Comparison API", "GET", endpoint, 200)
        
        if success:
            # Check if response has rankings
            if "rankings" not in response:
                print(f"   ⚠️ Missing 'rankings' in response")
        
        return success
    
    def test_cctv_class_detection_api(self):
        """Test CCTV Class Detection API"""
        data = {
            "school_id": "default",
            "class_name": "Class 10",
            "user_id": "test-user",
            "user_role": "director"
        }
        
        success, response = self.run_test("CCTV Class Detection API", "POST", "tino-brain/class-intelligence/from-camera", 200, data)
        
        if success:
            # Check if response has class intelligence data
            expected_keys = ["class_id", "class_name", "summary"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
        
        return success
    
    def test_tino_brain_query_class_condition(self):
        """Test Enhanced Tino Brain Query - Class Condition"""
        data = {
            "query": "Class 10 ki condition batao",
            "school_id": "default",
            "user_id": "test-user",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "male"
        }
        
        success, response = self.run_test("Tino Brain Query - Class Condition", "POST", "tino-brain/query", 200, data)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["message", "data", "action_taken"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
        
        return success
    
    def test_tino_brain_query_weak_students(self):
        """Test Tino Brain Query - Weak Students"""
        data = {
            "query": "weak bachhe kaun hai Class 10 mein",
            "school_id": "default",
            "user_id": "test-user",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "male"
        }
        
        success, response = self.run_test("Tino Brain Query - Weak Students", "POST", "tino-brain/query", 200, data)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["message", "data", "action_taken"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
        
        return success
    
    def test_tino_brain_query_teacher_performance(self):
        """Test Tino Brain Query - Teacher Performance"""
        data = {
            "query": "teacher kaisa padha raha hai",
            "school_id": "default",
            "user_id": "test-user",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "male"
        }
        
        success, response = self.run_test("Tino Brain Query - Teacher Performance", "POST", "tino-brain/query", 200, data)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["message", "data", "action_taken"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
        
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Schooltino API Tests...")
        print(f"📍 Base URL: {self.base_url}")
        
        # Test sequence - Focus on Tino Brain APIs as requested
        tests = [
            ("Health Check", self.test_health_check),
            ("Tino Brain Status", self.test_tino_brain_status),
            ("Class Intelligence API", self.test_class_intelligence_api),
            ("Class Comparison API", self.test_class_comparison_api),
            ("CCTV Class Detection API", self.test_cctv_class_detection_api),
            ("Tino Brain Query - Class Condition", self.test_tino_brain_query_class_condition),
            ("Tino Brain Query - Weak Students", self.test_tino_brain_query_weak_students),
            ("Tino Brain Query - Teacher Performance", self.test_tino_brain_query_teacher_performance),
            ("User Registration", self.test_register),
            ("User Login", self.test_login),
            ("Get Current User", self.test_get_me),
            ("Create School", self.test_create_school),
            ("Get Schools", self.test_get_schools),
            ("Create Class", self.test_create_class),
            ("Get Classes", self.test_get_classes),
            ("Create Staff", self.test_create_staff),
            ("Get Staff", self.test_get_staff),
            ("Create Student", self.test_create_student),
            ("Get Students", self.test_get_students),
            ("Mark Attendance", self.test_mark_attendance),
            ("Bulk Mark Attendance", self.test_bulk_attendance),
            ("Get Attendance", self.test_get_attendance),
            ("Attendance Stats", self.test_attendance_stats),
            ("Create Fee Plan", self.test_create_fee_plan),
            ("Get Fee Plans", self.test_get_fee_plans),
            ("Create Fee Invoice", self.test_create_fee_invoice),
            ("Get Fee Invoices", self.test_get_fee_invoices),
            ("Record Fee Payment", self.test_fee_payment),
            ("Fee Stats", self.test_fee_stats),
            ("Create Notice", self.test_create_notice),
            ("Get Notices", self.test_get_notices),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Audit Logs", self.test_audit_logs)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if not result:
                    print(f"⚠️  {test_name} failed - continuing with next test")
            except Exception as e:
                print(f"💥 {test_name} crashed: {str(e)}")
                self.failed_tests.append({
                    "test": test_name,
                    "error": f"Exception: {str(e)}"
                })

        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
                print(f"   - {failure['test']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SchooltinoAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())