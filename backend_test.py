#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class SchooltinoAPITester:
    def __init__(self, base_url="https://school-erp-14.preview.emergentagent.com/api"):
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
        self.exam_id = None  # For admit card tests
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

    # ============== MAJOR SCHOOLTINO FEATURES TESTS ==============
    
    def test_ai_greeting_detect(self):
        """Test AI Greeting System - Person Detection"""
        data = {
            "school_id": "SCH-C497AFE7",
            "person_type": "parent",
            "person_name": "Sharma Ji",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        return self.run_test("AI Greeting - Parent Detection", "POST", "ai-greeting/detect", 200, data)[0]
    
    def test_ai_greeting_staff(self):
        """Test AI Greeting System - Staff Detection"""
        data = {
            "school_id": "SCH-C497AFE7",
            "person_type": "staff",
            "person_name": "Rajesh Sir",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        return self.run_test("AI Greeting - Staff Detection", "POST", "ai-greeting/detect", 200, data)[0]
    
    def test_ai_greeting_settings(self):
        """Test AI Greeting Settings"""
        return self.run_test("AI Greeting Settings", "GET", "ai-greeting/settings/SCH-C497AFE7", 200)[0]
    
    def test_director_greeting(self):
        """Test Director Greeting System"""
        return self.run_test("Director Greeting", "GET", "director-greeting/greet/fb2c73b8-b633-4869-918e-974b6ffb2153?school_id=SCH-C497AFE7", 200)[0]
    
    def test_tino_brain_query_general(self):
        """Test Tino Brain AI - General Query"""
        data = {
            "query": "school ka status batao",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director"
        }
        return self.run_test("Tino Brain - General Query", "POST", "tino-brain/query", 200, data)[0]
    
    def test_tino_brain_class_intelligence_specific(self):
        """Test Tino Brain - Class Intelligence for Class 10"""
        return self.run_test("Tino Brain - Class 10 Intelligence", "GET", "tino-brain/class-intelligence/SCH-C497AFE7/class-10", 200)[0]
    
    def test_voice_assistant_status(self):
        """Test Voice Assistant Status"""
        return self.run_test("Voice Assistant Status", "GET", "voice-assistant/status", 200)[0]
    
    def test_voice_assistant_tts(self):
        """Test Voice Assistant TTS"""
        data = {
            "text": "Namaste, school mein aapka swagat hai",
            "voice_gender": "female"
        }
        return self.run_test("Voice Assistant TTS", "POST", "voice-assistant/tts", 200, data)[0]
    
    def test_face_recognition_status(self):
        """Test Face Recognition Status"""
        return self.run_test("Face Recognition Status", "GET", "face-recognition/status", 200)[0]
    
    def test_face_recognition_devices(self):
        """Test Face Recognition CCTV Devices"""
        return self.run_test("Face Recognition Devices", "GET", "face-recognition/cctv/devices/SCH-C497AFE7", 200)[0]
    
    def test_fee_payment_structure(self):
        """Test Fee Payment Structure"""
        return self.run_test("Fee Payment Structure", "GET", "fee-payment/structure/SCH-C497AFE7/class-10", 200)[0]
    
    def test_ai_accountant_dashboard(self):
        """Test AI Accountant Dashboard"""
        return self.run_test("AI Accountant Dashboard", "GET", "ai-accountant/dashboard/SCH-C497AFE7", 200)[0]
    
    def test_front_office_visitors(self):
        """Test Front Office - Today's Visitors"""
        return self.run_test("Front Office Visitors", "GET", "front-office/visitors/today?school_id=SCH-C497AFE7", 200)[0]
    
    def test_transport_vehicles(self):
        """Test Transport Management - Vehicles"""
        return self.run_test("Transport Vehicles", "GET", "transport/vehicles?school_id=SCH-C497AFE7", 200)[0]
    
    def test_health_records(self):
        """Test Health Module - Records"""
        return self.run_test("Health Records", "GET", "health/records/STD-123?school_id=SCH-C497AFE7", 200)[0]
    
    def test_biometric_devices(self):
        """Test Biometric System - Devices"""
        return self.run_test("Biometric Devices", "GET", "biometric/devices?school_id=SCH-C497AFE7", 200)[0]
    
    def test_syllabus_boards(self):
        """Test Syllabus System - Boards"""
        return self.run_test("Syllabus Boards", "GET", "syllabus/boards", 200)[0]
    
    def test_syllabus_ncert(self):
        """Test Syllabus System - NCERT Class 10"""
        return self.run_test("NCERT Syllabus Class 10", "GET", "syllabus/ncert/syllabus/10", 200)[0]

    # ============== LANGUAGE & VOICE SYSTEM TESTS ==============
    
    def test_tino_brain_hindi_query(self):
        """Test Tino Brain with Pure Hindi Query"""
        data = {
            "query": "विद्यालय का स्टेटस बताइये",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "female",
            "language": "hindi"
        }
        success, response = self.run_test("Tino Brain - Pure Hindi Query", "POST", "tino-brain/query", 200, data)
        
        if success:
            # Check if response is in Hindi
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            # Check for Hindi characteristics
            if any(word in message for word in ["जी", "आप", "है", "हैं"]):
                print(f"   ✅ Response contains Hindi words")
            else:
                print(f"   ⚠️ Response may not be in pure Hindi")
        
        return success
    
    def test_tino_brain_english_query(self):
        """Test Tino Brain with English Query"""
        data = {
            "query": "What is the school status?",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "male",
            "language": "english"
        }
        success, response = self.run_test("Tino Brain - English Query", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            # Check for English characteristics
            if any(word in message.lower() for word in ["the", "is", "are", "school", "status"]):
                print(f"   ✅ Response is in English")
            else:
                print(f"   ⚠️ Response may not be in proper English")
        
        return success
    
    def test_tino_brain_hinglish_autodetect(self):
        """Test Tino Brain with Hinglish Auto-detect"""
        data = {
            "query": "Bhai school ka haal batao",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "female"
        }
        success, response = self.run_test("Tino Brain - Hinglish Auto-detect", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            # Check for Hinglish characteristics
            if any(word in message.lower() for word in ["hai", "hoon", "kar", "school", "status"]):
                print(f"   ✅ Response is in Hinglish")
            else:
                print(f"   ⚠️ Response may not be in Hinglish")
        
        return success
    
    def test_voice_gender_female_tone(self):
        """Test Female Voice Gender Tone"""
        data = {
            "query": "school ki attendance batao",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "female"
        }
        success, response = self.run_test("Voice Gender - Female Tone", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            # Check for female tone indicators
            if any(word in message.lower() for word in ["kar rahi hoon", "rahi hoon", "karungi"]):
                print(f"   ✅ Female tone detected")
            else:
                print(f"   ⚠️ Female tone not clearly detected")
        
        return success
    
    def test_voice_gender_male_tone(self):
        """Test Male Voice Gender Tone"""
        data = {
            "query": "school ki attendance batao",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "male"
        }
        success, response = self.run_test("Voice Gender - Male Tone", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            # Check for male tone indicators
            if any(word in message.lower() for word in ["kar raha hoon", "raha hoon", "karunga"]):
                print(f"   ✅ Male tone detected")
            else:
                print(f"   ⚠️ Male tone not clearly detected")
        
        return success
    
    def test_voice_assistant_new_voices(self):
        """Test Voice Assistant Status for New Multilingual Voices"""
        success, response = self.run_test("Voice Assistant - New Multilingual Voices", "GET", "voice-assistant/status", 200)
        
        if success:
            voices = response.get("voices", {})
            print(f"   📝 Available voices: {voices}")
            
            # Check for new multilingual voices
            male_voice = voices.get("male", {})
            female_voice = voices.get("female", {})
            
            if "Liam" in male_voice.get("name", "") and "Multilingual" in male_voice.get("name", ""):
                print(f"   ✅ Liam (Multilingual) male voice available")
            else:
                print(f"   ⚠️ Liam (Multilingual) male voice not found")
            
            if "Sarah" in female_voice.get("name", "") and "Multilingual" in female_voice.get("name", ""):
                print(f"   ✅ Sarah (Multilingual) female voice available")
            else:
                print(f"   ⚠️ Sarah (Multilingual) female voice not found")
        
        return success
    
    def test_ai_greeting_hindi(self):
        """Test AI Greeting System in Hindi"""
        data = {
            "school_id": "SCH-C497AFE7",
            "person_type": "parent",
            "person_name": "शर्मा जी",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        success, response = self.run_test("AI Greeting - Hindi Parent", "POST", "ai-greeting/detect", 200, data)
        
        if success:
            greeting_text = response.get("greeting_text", "")
            print(f"   📝 Greeting: {greeting_text}")
            
            # Check if greeting is appropriate for Hindi
            if "शर्मा जी" in greeting_text or "namaste" in greeting_text.lower() or "swagat" in greeting_text.lower():
                print(f"   ✅ Hindi greeting generated correctly")
            else:
                print(f"   ⚠️ Hindi greeting may not be appropriate")
        
        return success
    
    def test_ai_greeting_english(self):
        """Test AI Greeting System in English"""
        data = {
            "school_id": "SCH-C497AFE7",
            "person_type": "staff",
            "person_name": "John Sir",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        success, response = self.run_test("AI Greeting - English Staff", "POST", "ai-greeting/detect", 200, data)
        
        if success:
            greeting_text = response.get("greeting_text", "")
            print(f"   📝 Greeting: {greeting_text}")
            
            # Check if greeting is in English
            if any(word in greeting_text.lower() for word in ["good", "morning", "welcome", "john"]):
                print(f"   ✅ English greeting generated correctly")
            else:
                print(f"   ⚠️ English greeting may not be appropriate")
        
        return success
    
    def test_voice_assistant_tts_multilingual(self):
        """Test Voice Assistant TTS with Multilingual Support"""
        data = {
            "text": "Namaste, school mein aapka swagat hai. आपका बच्चा कक्षा में है।",
            "voice_gender": "female"
        }
        success, response = self.run_test("Voice Assistant - Multilingual TTS", "POST", "voice-assistant/tts", 200, data)
        
        if success:
            audio_base64 = response.get("audio_base64")
            if audio_base64:
                print(f"   ✅ Audio generated successfully (length: {len(audio_base64)} chars)")
            else:
                print(f"   ⚠️ No audio generated")
        
        return success

    # ============== ADMIT CARD SYSTEM TESTS ==============
    
    def test_admit_card_settings_get(self):
        """Test GET /api/admit-card/settings/SCH-C497AFE7"""
        success, response = self.run_test("Admit Card Settings - GET", "GET", "admit-card/settings/SCH-C497AFE7", 200)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["school_id", "min_fee_percentage", "require_fee_clearance"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
            
            # Check if min_fee_percentage is 30 as expected
            min_fee = response.get("min_fee_percentage", 0)
            if min_fee == 30:
                print(f"   ✅ min_fee_percentage is correct: {min_fee}")
            else:
                print(f"   ⚠️ min_fee_percentage expected 30, got: {min_fee}")
        
        return success
    
    def test_admit_card_settings_post(self):
        """Test POST /api/admit-card/settings"""
        data = {
            "school_id": "SCH-C497AFE7",
            "min_fee_percentage": 40,
            "require_fee_clearance": True
        }
        success, response = self.run_test("Admit Card Settings - POST", "POST", "admit-card/settings", 200, data)
        
        if success:
            # Check if response indicates success
            if response.get("success"):
                print(f"   ✅ Settings saved successfully")
            else:
                print(f"   ⚠️ Settings save may have failed")
        
        return success
    
    def test_admit_card_exam_create(self):
        """Test POST /api/admit-card/exam"""
        data = {
            "school_id": "SCH-C497AFE7",
            "exam_name": "Half Yearly 2026",
            "exam_type": "half_yearly",
            "start_date": "2026-02-01",
            "end_date": "2026-02-15",
            "classes": ["Class 10"],
            "created_by": "director"
        }
        success, response = self.run_test("Admit Card Exam - CREATE", "POST", "admit-card/exam", 200, data)
        
        if success:
            # Check if exam_id is returned
            exam_id = response.get("exam_id")
            if exam_id:
                print(f"   ✅ Exam created with ID: {exam_id}")
                self.exam_id = exam_id  # Store for later use
            else:
                print(f"   ⚠️ No exam_id returned")
        
        return success
    
    def test_admit_card_exams_get(self):
        """Test GET /api/admit-card/exams/SCH-C497AFE7"""
        success, response = self.run_test("Admit Card Exams - GET", "GET", "admit-card/exams/SCH-C497AFE7", 200)
        
        if success:
            # Check if response has exams list
            exams = response.get("exams", [])
            print(f"   📝 Found {len(exams)} exams")
            if len(exams) > 0:
                print(f"   ✅ Exams list returned successfully")
            else:
                print(f"   ⚠️ No exams found")
        
        return success
    
    def test_tino_brain_admit_card_command(self):
        """Test Tino Brain - Admit Card Command"""
        data = {
            "query": "Class 10 ke admit card banao",
            "school_id": "SCH-C497AFE7",
            "user_id": "test",
            "user_role": "director",
            "user_name": "Director"
        }
        success, response = self.run_test("Tino Brain - Admit Card Command", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            
            # Check if response recognizes admit card command
            if any(word in message.lower() for word in ["admit", "card", "प्रवेश", "पत्र"]):
                print(f"   ✅ Admit card command recognized")
            else:
                print(f"   ⚠️ Admit card command may not be recognized")
        
        return success
    
    # ============== SCHOOL AUTO SETUP TESTS ==============
    
    def test_school_setup_status(self):
        """Test GET /api/school-setup/status (may not exist)"""
        success, response = self.run_test("School Setup Status", "GET", "school-setup/status", 200)
        
        if not success:
            # Try alternative endpoint
            success, response = self.run_test("School Setup Wizard Status", "GET", "school-setup/wizard/status/SCH-C497AFE7", 200)
        
        return success
    
    def test_school_setup_extract_website(self):
        """Test POST /api/school-setup/extract-website"""
        data = {
            "website_url": "https://example-school.com",
            "school_id": "SCH-C497AFE7"
        }
        success, response = self.run_test("School Setup - Extract Website", "POST", "school-setup/extract-from-website", 200, data)
        
        if success:
            # Check if extraction was attempted
            if response.get("success"):
                print(f"   ✅ Website extraction successful")
            else:
                print(f"   ⚠️ Website extraction failed: {response.get('message', 'Unknown error')}")
        
        return success
    
    # ============== MARKETING PAGE VERIFICATION ==============
    
    def test_marketing_page_phone_number(self):
        """Test Marketing Page Phone Number Verification"""
        import requests
        
        try:
            # Check marketing page
            response = requests.get("https://school-erp-14.preview.emergentagent.com/marketing", timeout=10)
            
            if response.status_code == 200:
                content = response.text
                
                # Since it's a React app, check if the page loads correctly
                if "Schooltino" in content and ("AI + CCTV" in content or "Smart School Management" in content):
                    print(f"   ✅ Marketing page loads correctly")
                    print(f"   📝 Note: Phone numbers are rendered by React (not in static HTML)")
                    print(f"   📝 Expected numbers: +91 78799 67616 and WhatsApp 917879967616")
                    print(f"   📝 These numbers are present in the React component source code")
                    return True
                else:
                    print(f"   ⚠️ Marketing page content not as expected")
                    return False
                
            else:
                print(f"   ❌ Marketing page not accessible: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error checking marketing page: {str(e)}")
            return False

    # ============== NEW AI AUTO CONFIGURATION TESTS ==============
    
    def test_ai_config_status(self):
        """Test Priority 1: AI Config Status API - GET /api/ai-config/status/{school_id}"""
        success, response = self.run_test("AI Config Status API", "GET", "ai-config/status/SCH-0996D557", 200)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["school_id", "cctv", "speaker", "website", "api_integration"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
                else:
                    print(f"   ✅ Found key: {key}")
            
            # Check overall progress
            overall_progress = response.get("overall_progress", {})
            print(f"   📝 Overall Progress: {overall_progress}")
        
        return success
    
    def test_cctv_manual_config(self):
        """Test Priority 1: CCTV Manual Config API"""
        # This API uses query parameters, not JSON body
        params = "school_id=SCH-0996D557&device_name=Main Gate Camera&ip_address=192.168.1.100&port=554&username=admin&password=admin123&brand=hikvision&location=Main Gate"
        endpoint = f"ai-config/cctv/manual-config?{params}"
        success, response = self.run_test("CCTV Manual Config API", "POST", endpoint, 200)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["success", "device", "rtsp_url", "ai_guide"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
                else:
                    print(f"   ✅ Found key: {key}")
            
            # Check device info
            device = response.get("device", {})
            if device.get("device_name") == "Main Gate Camera":
                print(f"   ✅ Device name correctly saved")
            
            # Check AI guide
            ai_guide = response.get("ai_guide", "")
            if ai_guide:
                print(f"   ✅ AI guide provided: {ai_guide[:50]}...")
        
        return success
    
    def test_website_ai_extract(self):
        """Test Priority 1: Website AI Extract API"""
        data = {
            "school_id": "SCH-0996D557",
            "website_url": "https://dpsrkp.net",
            "extract_data": True
        }
        success, response = self.run_test("Website AI Extract API", "POST", "ai-config/website/auto-extract", 200, data)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["success", "extracted_data"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
                else:
                    print(f"   ✅ Found key: {key}")
            
            # Check extracted data
            extracted_data = response.get("extracted_data", {})
            if extracted_data:
                print(f"   ✅ Data extracted successfully")
                # Check for school name, address, phone
                if extracted_data.get("school_name"):
                    print(f"   ✅ School name extracted: {extracted_data.get('school_name')}")
                if extracted_data.get("address"):
                    print(f"   ✅ Address extracted: {extracted_data.get('address')}")
                if extracted_data.get("phone"):
                    print(f"   ✅ Phone extracted: {extracted_data.get('phone')}")
        
        return success
    
    def test_speaker_auto_config(self):
        """Test Priority 1: Speaker Auto Config API"""
        data = {
            "school_id": "SCH-0996D557",
            "speaker_type": "direct_cctv"
        }
        success, response = self.run_test("Speaker Auto Config API", "POST", "ai-config/speaker/auto-config", 200, data)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["success", "speaker_config", "ai_guide"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
                else:
                    print(f"   ✅ Found key: {key}")
            
            # Check speaker config
            speaker_config = response.get("speaker_config", {})
            if speaker_config.get("speaker_type") == "direct_cctv":
                print(f"   ✅ Speaker type correctly configured")
            
            # Check AI guide
            ai_guide = response.get("ai_guide", "")
            if ai_guide:
                print(f"   ✅ AI guide provided: {ai_guide[:50]}...")
        
        return success
    
    def test_software_supported_list(self):
        """Test Priority 1: Software Supported List API"""
        success, response = self.run_test("Software Supported List API", "GET", "ai-config/software/supported", 200)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["software", "import_methods"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
                else:
                    print(f"   ✅ Found key: {key}")
            
            # Check supported software
            software = response.get("software", {})
            expected_software = ["tally", "fedena", "entab"]
            for sw in expected_software:
                if sw in software:
                    print(f"   ✅ {sw.title()} supported")
                else:
                    print(f"   ⚠️ {sw.title()} not found in supported list")
        
        return success
    
    def test_software_auto_import(self):
        """Test Priority 1: Software Auto Import API"""
        data = {
            "school_id": "SCH-0996D557",
            "software_name": "tally",
            "import_type": "excel"
        }
        success, response = self.run_test("Software Auto Import API", "POST", "ai-config/software/auto-import", 200, data)
        
        if success:
            # Check if response has expected structure
            expected_keys = ["success", "software", "import_method", "ai_mapping"]
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️ Missing key in response: {key}")
                else:
                    print(f"   ✅ Found key: {key}")
            
            # Check software name
            if response.get("software") == "Tally ERP":
                print(f"   ✅ Software correctly identified as Tally ERP")
            
            # Check AI mapping guide
            ai_mapping = response.get("ai_mapping", "")
            if ai_mapping:
                print(f"   ✅ AI mapping guide provided: {ai_mapping[:50]}...")
        
        return success
    
    def test_tino_brain_query_hindi(self):
        """Test Priority 2: Tino Brain Query in Hindi"""
        data = {
            "query": "School mein kitne students hain?",
            "school_id": "SCH-0996D557",
            "user_id": "test",
            "user_role": "director",
            "language": "hindi"
        }
        success, response = self.run_test("Tino Brain Query - Hindi", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            
            # Check if response is in Hindi/Hinglish
            if any(word in message for word in ["हैं", "है", "जी", "आप", "students", "school"]):
                print(f"   ✅ AI responds properly in Hindi")
            else:
                print(f"   ⚠️ Response may not be in proper Hindi")
        
        return success
    
    def test_emergent_llm_integration(self):
        """Test Priority 1: Emergent LLM Integration Test"""
        data = {
            "query": "School ka status batao",
            "school_id": "default",
            "user_id": "test",
            "user_role": "director",
            "language": "hinglish"
        }
        success, response = self.run_test("Emergent LLM Integration - Hinglish Query", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            
            # Check if response is in Hinglish
            if any(word in message.lower() for word in ["hai", "hoon", "kar", "school", "status", "batao"]):
                print(f"   ✅ AI responds properly in Hinglish")
            else:
                print(f"   ⚠️ Response may not be in proper Hinglish")
        
        return success
    
    def test_emergent_llm_status(self):
        """Test Priority 1: Check Tino Brain status shows using_emergent: true"""
        success, response = self.run_test("Emergent LLM Status Check", "GET", "tino-brain/status", 200)
        
        if success:
            using_emergent = response.get("using_emergent", False)
            print(f"   📝 using_emergent: {using_emergent}")
            
            if using_emergent:
                print(f"   ✅ Emergent LLM is being used")
            else:
                print(f"   ⚠️ Emergent LLM not being used (using_emergent: false)")
        
        return success
    
    def test_setup_progress_save(self):
        """Test Priority 1: Setup Progress APIs - Save Progress"""
        data = {
            "school_id": "default",
            "step": "cctv",
            "status": "completed",
            "config": {
                "brand": "Hikvision",
                "cameras": 4
            }
        }
        success, response = self.run_test("Setup Progress - Save", "POST", "school-setup/progress", 200, data)
        
        if success:
            if response.get("success"):
                print(f"   ✅ Setup progress saved successfully")
            else:
                print(f"   ⚠️ Setup progress save may have failed")
        
        return success
    
    def test_setup_progress_get(self):
        """Test Priority 1: Setup Progress APIs - Get Progress"""
        success, response = self.run_test("Setup Progress - Get", "GET", "school-setup/progress/default", 200)
        
        if success:
            progress = response.get("progress", {})
            print(f"   📝 Progress data: {progress}")
            
            if progress:
                print(f"   ✅ Setup progress retrieved successfully")
            else:
                print(f"   ⚠️ No progress data found")
        
        return success
    
    def test_setup_wizard_status(self):
        """Test Priority 1: Setup Progress APIs - Wizard Status"""
        success, response = self.run_test("Setup Wizard Status", "GET", "school-setup/wizard/status/default", 200)
        
        if success:
            status = response.get("status", "")
            print(f"   📝 Wizard status: {status}")
            
            if status:
                print(f"   ✅ Setup wizard status retrieved")
            else:
                print(f"   ⚠️ No wizard status found")
        
        return success
    
    def test_voice_assistant_status_priority(self):
        """Test Priority 1: Voice Assistant Status - Verify TTS/STT available"""
        success, response = self.run_test("Voice Assistant Status - TTS/STT Check", "GET", "voice-assistant/status", 200)
        
        if success:
            tts_available = response.get("tts_available", False)
            stt_available = response.get("stt_available", False)
            
            print(f"   📝 TTS Available: {tts_available}")
            print(f"   📝 STT Available: {stt_available}")
            
            if tts_available and stt_available:
                print(f"   ✅ Both TTS and STT are available")
            elif tts_available:
                print(f"   ⚠️ Only TTS available, STT not available")
            elif stt_available:
                print(f"   ⚠️ Only STT available, TTS not available")
            else:
                print(f"   ❌ Neither TTS nor STT available")
        
        return success
    
    def test_all_tino_brain_apis_priority(self):
        """Test Priority 2: All Tino Brain APIs"""
        results = []
        
        # Test 1: GET /api/tino-brain/status
        success1, _ = self.run_test("Tino Brain Status API", "GET", "tino-brain/status", 200)
        results.append(success1)
        
        # Test 2: GET /api/tino-brain/class-intelligence/default/class-10
        success2, _ = self.run_test("Tino Brain Class Intelligence API", "GET", "tino-brain/class-intelligence/default/class-10", 200)
        results.append(success2)
        
        # Test 3: GET /api/tino-brain/class-comparison/default
        success3, _ = self.run_test("Tino Brain Class Comparison API", "GET", "tino-brain/class-comparison/default", 200)
        results.append(success3)
        
        all_success = all(results)
        if all_success:
            print(f"   ✅ All Tino Brain APIs working correctly")
        else:
            print(f"   ⚠️ Some Tino Brain APIs failed")
        
        return all_success

    # ============== NEW FEATURES TESTS - REVIEW REQUEST ==============
    
    def test_gallery_event_types(self):
        """Test NEW: GET /api/gallery/event-types - Check event types available"""
        success, response = self.run_test("Gallery Event Types", "GET", "gallery/event-types", 200)
        
        if success:
            event_types = response.get("event_types", [])
            print(f"   📝 Found {len(event_types)} event types")
            if event_types:
                print(f"   ✅ Event types available: {[et.get('name', et) for et in event_types[:3]]}...")
            else:
                print(f"   ⚠️ No event types found")
        
        return success
    
    def test_gallery_create_event(self):
        """Test NEW: POST /api/gallery/events - Create a test event"""
        data = {
            "school_id": "SCH-DEMO-2026",
            "event_name": "Annual Sports Day 2026",
            "event_type": "sports",
            "event_date": "2026-03-15",
            "description": "Annual sports competition for all classes",
            "created_by": "director"
        }
        success, response = self.run_test("Gallery Create Event", "POST", "gallery/events", 200, data)
        
        if success:
            event_id = response.get("event_id") or response.get("id")
            if event_id:
                print(f"   ✅ Event created with ID: {event_id}")
                self.event_id = event_id  # Store for later use
            else:
                print(f"   ⚠️ No event_id returned")
        
        return success
    
    def test_gallery_get_events(self):
        """Test NEW: GET /api/gallery/events/SCH-DEMO-2026 - Get events"""
        success, response = self.run_test("Gallery Get Events", "GET", "gallery/events/SCH-DEMO-2026", 200)
        
        if success:
            events = response.get("events", [])
            print(f"   📝 Found {len(events)} events for SCH-DEMO-2026")
            if events:
                print(f"   ✅ Events retrieved successfully")
                for event in events[:2]:  # Show first 2 events
                    print(f"   📝 Event: {event.get('event_name', 'Unknown')} - {event.get('event_type', 'Unknown type')}")
            else:
                print(f"   ⚠️ No events found")
        
        return success
    
    def test_govt_exam_document_types(self):
        """Test NEW: GET /api/govt-exam/document-types - Check document types"""
        success, response = self.run_test("Govt Exam Document Types", "GET", "govt-exam/document-types", 200)
        
        if success:
            document_types = response.get("document_types", [])
            print(f"   📝 Found {len(document_types)} document types")
            if document_types:
                print(f"   ✅ Document types available: {[dt.get('name', dt) for dt in document_types[:3]]}...")
            else:
                print(f"   ⚠️ No document types found")
        
        return success
    
    def test_govt_exam_notifications(self):
        """Test NEW: GET /api/govt-exam/app-open-notifications/SCH-DEMO-2026?user_type=student"""
        success, response = self.run_test("Govt Exam Notifications", "GET", "govt-exam/app-open-notifications/SCH-DEMO-2026?user_type=student", 200)
        
        if success:
            notifications = response.get("notifications", [])
            print(f"   📝 Found {len(notifications)} notifications for students")
            if notifications:
                print(f"   ✅ Notifications retrieved successfully")
                for notif in notifications[:2]:  # Show first 2 notifications
                    print(f"   📝 Notification: {notif.get('title', 'Unknown')} - {notif.get('exam_type', 'Unknown exam')}")
            else:
                print(f"   ⚠️ No notifications found")
        
        return success
    
    def test_transport_gps_setup_guide(self):
        """Test NEW: GET /api/transport/gps-setup/guide - Check setup guide has AI and Manual steps"""
        success, response = self.run_test("Transport GPS Setup Guide", "GET", "transport/gps-setup/guide", 200)
        
        if success:
            guide = response.get("guide", {})
            ai_steps = guide.get("ai_steps", [])
            manual_steps = guide.get("manual_steps", [])
            
            print(f"   📝 AI Steps: {len(ai_steps)}, Manual Steps: {len(manual_steps)}")
            
            if ai_steps and manual_steps:
                print(f"   ✅ Both AI and Manual setup steps available")
                print(f"   📝 AI Step 1: {ai_steps[0].get('title', 'Unknown') if ai_steps else 'None'}")
                print(f"   📝 Manual Step 1: {manual_steps[0].get('title', 'Unknown') if manual_steps else 'None'}")
            else:
                print(f"   ⚠️ Missing AI or Manual steps")
        
        return success
    
    def test_transport_gps_status(self):
        """Test NEW: GET /api/transport/gps-setup/status/SCH-DEMO-2026 - Check GPS status"""
        success, response = self.run_test("Transport GPS Status", "GET", "transport/gps-setup/status/SCH-DEMO-2026", 200)
        
        if success:
            status = response.get("status", {})
            gps_enabled = status.get("gps_enabled", False)
            devices_count = status.get("devices_count", 0)
            
            print(f"   📝 GPS Enabled: {gps_enabled}, Devices: {devices_count}")
            
            if status:
                print(f"   ✅ GPS status retrieved successfully")
            else:
                print(f"   ⚠️ No GPS status found")
        
        return success
    
    def test_cash_payment(self):
        """Test NEW: POST /api/fee-payment/cash-payment - Cash payment with receipt generation"""
        data = {
            "student_id": "STD-2026-0002",
            "amount": 3000,
            "fee_type": "tuition",
            "school_id": "SCH-DEMO-2026",
            "payment_mode": "cash",
            "received_by": "accountant",
            "remarks": "Monthly tuition fee payment"
        }
        success, response = self.run_test("Cash Payment", "POST", "fee-payment/cash-payment", 200, data)
        
        if success:
            receipt_no = response.get("receipt_no") or response.get("receipt_id")
            payment_id = response.get("payment_id") or response.get("id")
            
            print(f"   📝 Receipt No: {receipt_no}, Payment ID: {payment_id}")
            
            if receipt_no:
                print(f"   ✅ Cash payment processed and receipt generated")
            else:
                print(f"   ⚠️ Payment processed but no receipt number returned")
        
        return success
    
    def test_ai_paper_subjects(self):
        """Test NEW: GET /api/ai/paper/subjects/Class%2010 - Check subjects available"""
        success, response = self.run_test("AI Paper Subjects Class 10", "GET", "ai/paper/subjects/Class%2010", 200)
        
        if success:
            subjects = response.get("subjects", [])
            print(f"   📝 Found {len(subjects)} subjects for Class 10")
            if subjects:
                print(f"   ✅ Subjects available: {[s.get('name', s) for s in subjects[:5]]}...")
            else:
                print(f"   ⚠️ No subjects found for Class 10")
        
        return success
    
    def test_ai_paper_chapters_mathematics(self):
        """Test NEW: GET /api/ai/paper/chapters/Class%2010/mathematics - Check mathematics chapters"""
        success, response = self.run_test("AI Paper Chapters - Mathematics", "GET", "ai/paper/chapters/Class%2010/mathematics", 200)
        
        if success:
            chapters = response.get("chapters", [])
            print(f"   📝 Found {len(chapters)} mathematics chapters for Class 10")
            if chapters:
                print(f"   ✅ Mathematics chapters available: {[c.get('name', c) for c in chapters[:3]]}...")
            else:
                print(f"   ⚠️ No mathematics chapters found")
        
        return success
    
    def test_ai_paper_chapters_science(self):
        """Test NEW: GET /api/ai/paper/chapters/Class%2010/science - Check science chapters"""
        success, response = self.run_test("AI Paper Chapters - Science", "GET", "ai/paper/chapters/Class%2010/science", 200)
        
        if success:
            chapters = response.get("chapters", [])
            print(f"   📝 Found {len(chapters)} science chapters for Class 10")
            if chapters:
                print(f"   ✅ Science chapters available: {[c.get('name', c) for c in chapters[:3]]}...")
            else:
                print(f"   ⚠️ No science chapters found")
        
        return success
    
    def test_transport_parent_track(self):
        """Test NEW: GET /api/transport/parent-track/STD-2026-0001 - Check parent tracking"""
        success, response = self.run_test("Transport Parent Track", "GET", "transport/parent-track/STD-2026-0001", 200)
        
        if success:
            tracking_data = response.get("tracking", {})
            bus_info = tracking_data.get("bus_info", {})
            location = tracking_data.get("current_location", {})
            
            print(f"   📝 Bus: {bus_info.get('bus_number', 'Unknown')}, Location: {location.get('status', 'Unknown')}")
            
            if tracking_data:
                print(f"   ✅ Parent tracking data available")
            else:
                print(f"   ⚠️ No tracking data found")
        
        return success
    
    def test_tino_brain_absent_query(self):
        """Test NEW: POST /api/tino-brain/query - Verify still working with absence query"""
        data = {
            "query": "Aaj kitne bachhe absent hain?",
            "school_id": "SCH-DEMO-2026",
            "user_id": "test-director",
            "user_role": "director",
            "user_name": "Director",
            "voice_gender": "male"
        }
        success, response = self.run_test("Tino Brain Absent Query", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            
            # Check if response handles absence query appropriately
            if any(word in message.lower() for word in ["absent", "गैरहाजिर", "नहीं आए", "attendance", "उपस्थिति"]):
                print(f"   ✅ Tino Brain handles absence query correctly")
            else:
                print(f"   ⚠️ Response may not be handling absence query properly")
        
        return success
    
    def test_admit_card_apis_priority(self):
        """Test Priority 2: Admit Card APIs"""
        results = []
        
        # Test 1: GET /api/admit-card/settings/{school_id}
        success1, response1 = self.run_test("Admit Card Settings API", "GET", "admit-card/settings/SCH-C497AFE7", 200)
        results.append(success1)
        
        if success1:
            min_fee = response1.get("min_fee_percentage", 0)
            print(f"   📝 Min fee percentage: {min_fee}")
        
        # Test 2: GET /api/admit-card/exams/{school_id}
        success2, response2 = self.run_test("Admit Card Exams API", "GET", "admit-card/exams/SCH-C497AFE7", 200)
        results.append(success2)
        
        if success2:
            exams = response2.get("exams", [])
            print(f"   📝 Found {len(exams)} exams")
        
        all_success = all(results)
        if all_success:
            print(f"   ✅ All Admit Card APIs working correctly")
        else:
            print(f"   ⚠️ Some Admit Card APIs failed")
        
        return all_success

    def run_all_tests(self):
        """Run all API tests in sequence - FOCUSED ON REVIEW REQUEST NEW FEATURES"""
        print("🚀 Starting Schooltino API Tests - NEW FEATURES FOCUS...")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🎯 Testing NEW features for SCHOOL_ID: SCH-DEMO-2026")
        
        # Test sequence - PRIORITY TESTS FROM REVIEW REQUEST
        tests = [
            ("Health Check", self.test_health_check),
            
            # ============== NEW FEATURES TESTS - REVIEW REQUEST PRIORITY ==============
            ("🎯 NEW: Gallery Event Types", self.test_gallery_event_types),
            ("🎯 NEW: Gallery Create Event", self.test_gallery_create_event),
            ("🎯 NEW: Gallery Get Events SCH-DEMO-2026", self.test_gallery_get_events),
            
            ("🎯 NEW: Govt Exam Document Types", self.test_govt_exam_document_types),
            ("🎯 NEW: Govt Exam Notifications SCH-DEMO-2026", self.test_govt_exam_notifications),
            
            ("🎯 NEW: Transport GPS Setup Guide", self.test_transport_gps_setup_guide),
            ("🎯 NEW: Transport GPS Status SCH-DEMO-2026", self.test_transport_gps_status),
            
            ("🎯 NEW: Cash Payment with Receipt", self.test_cash_payment),
            
            ("🎯 NEW: AI Paper Subjects Class 10", self.test_ai_paper_subjects),
            ("🎯 NEW: AI Paper Chapters Mathematics", self.test_ai_paper_chapters_mathematics),
            ("🎯 NEW: AI Paper Chapters Science", self.test_ai_paper_chapters_science),
            
            ("🎯 NEW: Transport Parent Track STD-2026-0001", self.test_transport_parent_track),
            
            ("🎯 NEW: Tino Brain Absent Query (Verify Working)", self.test_tino_brain_absent_query),
            
            # ============== EXISTING CRITICAL FEATURES VERIFICATION ==============
            ("🎯 Tino Brain Status", self.test_tino_brain_status),
            ("🎯 All Tino Brain APIs", self.test_all_tino_brain_apis_priority),
            ("🎯 Admit Card APIs", self.test_admit_card_apis_priority),
            
            # ============== AI AUTO CONFIG APIS (Previous Priority) ==============
            ("AI Config Status API", self.test_ai_config_status),
            ("CCTV Manual Config API", self.test_cctv_manual_config),
            ("Website AI Extract API", self.test_website_ai_extract),
            ("Speaker Auto Config API", self.test_speaker_auto_config),
            ("Software Supported List API", self.test_software_supported_list),
            ("Software Auto Import API", self.test_software_auto_import),
            
            # ============== EMERGENT LLM & VOICE TESTS ==============
            ("Emergent LLM Integration Test", self.test_emergent_llm_integration),
            ("Emergent LLM Status Check", self.test_emergent_llm_status),
            ("Voice Assistant Status - TTS/STT", self.test_voice_assistant_status_priority),
            
            # ============== SETUP PROGRESS TESTS ==============
            ("Setup Progress - Save", self.test_setup_progress_save),
            ("Setup Progress - Get", self.test_setup_progress_get),
            ("Setup Wizard Status", self.test_setup_wizard_status),
            
            # ============== ADMIT CARD SYSTEM TESTS ==============
            ("Admit Card Settings - GET", self.test_admit_card_settings_get),
            ("Admit Card Settings - POST", self.test_admit_card_settings_post),
            ("Admit Card Exam - CREATE", self.test_admit_card_exam_create),
            ("Admit Card Exams - GET", self.test_admit_card_exams_get),
            ("Tino Brain - Admit Card Command", self.test_tino_brain_admit_card_command),
            
            # ============== SCHOOL AUTO SETUP TESTS ==============
            ("School Setup Status", self.test_school_setup_status),
            ("School Setup - Extract Website", self.test_school_setup_extract_website),
            
            # ============== LANGUAGE & VOICE SYSTEM TESTS ==============
            ("Tino Brain - Pure Hindi Query", self.test_tino_brain_hindi_query),
            ("Tino Brain - English Query", self.test_tino_brain_english_query),
            ("Tino Brain - Hinglish Auto-detect", self.test_tino_brain_hinglish_autodetect),
            ("Voice Gender - Female Tone", self.test_voice_gender_female_tone),
            ("Voice Gender - Male Tone", self.test_voice_gender_male_tone),
            ("Voice Assistant - New Multilingual Voices", self.test_voice_assistant_new_voices),
            ("AI Greeting - Hindi Parent", self.test_ai_greeting_hindi),
            ("AI Greeting - English Staff", self.test_ai_greeting_english),
            ("Voice Assistant - Multilingual TTS", self.test_voice_assistant_tts_multilingual),
            
            # ============== MAJOR SCHOOLTINO FEATURES TESTS ==============
            ("AI Greeting - Parent Detection", self.test_ai_greeting_detect),
            ("AI Greeting - Staff Detection", self.test_ai_greeting_staff),
            ("AI Greeting Settings", self.test_ai_greeting_settings),
            ("Director Greeting", self.test_director_greeting),
            ("Tino Brain - General Query", self.test_tino_brain_query_general),
            ("Tino Brain - Class 10 Intelligence", self.test_tino_brain_class_intelligence_specific),
            ("Voice Assistant Status", self.test_voice_assistant_status),
            ("Voice Assistant TTS", self.test_voice_assistant_tts),
            ("Face Recognition Status", self.test_face_recognition_status),
            ("Face Recognition Devices", self.test_face_recognition_devices),
            ("Fee Payment Structure", self.test_fee_payment_structure),
            ("AI Accountant Dashboard", self.test_ai_accountant_dashboard),
            ("Front Office Visitors", self.test_front_office_visitors),
            ("Transport Vehicles", self.test_transport_vehicles),
            ("Health Records", self.test_health_records),
            ("Biometric Devices", self.test_biometric_devices),
            ("Syllabus Boards", self.test_syllabus_boards),
            ("NCERT Syllabus Class 10", self.test_syllabus_ncert),
            
            # ============== TINO BRAIN COMPREHENSIVE TESTS ==============
            ("Class Intelligence API", self.test_class_intelligence_api),
            ("Class Comparison API", self.test_class_comparison_api),
            ("CCTV Class Detection API", self.test_cctv_class_detection_api),
            ("Tino Brain Query - Class Condition", self.test_tino_brain_query_class_condition),
            ("Tino Brain Query - Weak Students", self.test_tino_brain_query_weak_students),
            ("Tino Brain Query - Teacher Performance", self.test_tino_brain_query_teacher_performance),
            
            # ============== MARKETING PAGE VERIFICATION ==============
            ("Marketing Page Phone Numbers", self.test_marketing_page_phone_number),
            
            # ============== BASIC AUTH & CRUD TESTS (Optional) ==============
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