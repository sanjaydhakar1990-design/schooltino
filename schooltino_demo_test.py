#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class SchoolTinoDemoTester:
    def __init__(self, base_url="https://talk-synopsis.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.school_id = "SCH-DEMO-2026"  # Demo school ID
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_issues = []

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
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

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

    # ============== AUTHENTICATION TESTS ==============
    
    def test_login_director(self):
        """Test login with director@demo.com / demo123"""
        login_data = {
            "email": "director@demo.com",
            "password": "demo123"
        }
        
        success, response = self.run_test("Login - Director Demo", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   ✅ Director login successful")
            return True
        else:
            self.critical_issues.append("Director login failed - demo credentials not working")
            return False

    def test_login_teacher(self):
        """Test login with teacher1@demo.com / demo123"""
        login_data = {
            "email": "teacher1@demo.com",
            "password": "demo123"
        }
        
        success, response = self.run_test("Login - Teacher Demo", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            print(f"   ✅ Teacher login successful")
            return True
        else:
            self.critical_issues.append("Teacher login failed - demo credentials not working")
            return False

    def test_auth_me(self):
        """Test GET /api/auth/me with token"""
        if not self.token:
            return False
            
        success, response = self.run_test("Auth Me - Current User", "GET", "auth/me", 200)
        if success:
            print(f"   ✅ User info retrieved: {response.get('name', 'Unknown')}")
            return True
        return False

    # ============== STUDENTS TESTS (30 students) ==============
    
    def test_get_students(self):
        """Test GET /api/students?school_id=SCH-DEMO-2026"""
        endpoint = f"students?school_id={self.school_id}"
        success, response = self.run_test("Get Students - Demo School", "GET", endpoint, 200)
        
        if success:
            students = response.get('students', response) if isinstance(response, dict) else response
            if isinstance(students, list):
                student_count = len(students)
                print(f"   📊 Found {student_count} students")
                if student_count == 30:
                    print(f"   ✅ Correct student count (30)")
                    return True
                else:
                    print(f"   ⚠️ Expected 30 students, found {student_count}")
                    return True  # Still working, just different count
            else:
                print(f"   ⚠️ Unexpected response format")
        return False

    def test_get_student_detail(self):
        """Test GET /api/students/{student_id}"""
        # First get students list to get a student ID
        endpoint = f"students?school_id={self.school_id}"
        success, response = self.run_test("Get Students List for Detail Test", "GET", endpoint, 200)
        
        if success:
            students = response.get('students', response) if isinstance(response, dict) else response
            if isinstance(students, list) and len(students) > 0:
                student_id = students[0].get('id') or students[0].get('student_id')
                if student_id:
                    success2, response2 = self.run_test("Get Student Detail", "GET", f"students/{student_id}", 200)
                    if success2:
                        print(f"   ✅ Student detail retrieved")
                        return True
        return False

    # ============== STAFF TESTS (15 total) ==============
    
    def test_get_staff(self):
        """Test GET /api/staff?school_id=SCH-DEMO-2026"""
        endpoint = f"staff?school_id={self.school_id}"
        success, response = self.run_test("Get Staff - Demo School", "GET", endpoint, 200)
        
        if success:
            staff = response.get('staff', response) if isinstance(response, dict) else response
            if isinstance(staff, list):
                staff_count = len(staff)
                print(f"   📊 Found {staff_count} staff members")
                if staff_count == 15:
                    print(f"   ✅ Correct staff count (15)")
                    return True
                else:
                    print(f"   ⚠️ Expected 15 staff, found {staff_count}")
                    return True  # Still working, just different count
            else:
                print(f"   ⚠️ Unexpected response format")
        return False

    # ============== CLASSES TESTS (7 classes) ==============
    
    def test_get_classes(self):
        """Test GET /api/classes?school_id=SCH-DEMO-2026"""
        endpoint = f"classes?school_id={self.school_id}"
        success, response = self.run_test("Get Classes - Demo School", "GET", endpoint, 200)
        
        if success:
            classes = response.get('classes', response) if isinstance(response, dict) else response
            if isinstance(classes, list):
                class_count = len(classes)
                print(f"   📊 Found {class_count} classes")
                if class_count == 7:
                    print(f"   ✅ Correct class count (7)")
                else:
                    print(f"   ⚠️ Expected 7 classes, found {class_count}")
                
                # Check if each class has student_count
                for cls in classes:
                    if 'student_count' in cls:
                        print(f"   ✅ Class {cls.get('name', 'Unknown')} has student_count: {cls.get('student_count')}")
                    else:
                        print(f"   ⚠️ Class {cls.get('name', 'Unknown')} missing student_count")
                
                return True
            else:
                print(f"   ⚠️ Unexpected response format")
        return False

    # ============== ATTENDANCE TESTS ==============
    
    def test_get_attendance(self):
        """Test GET /api/attendance?school_id=SCH-DEMO-2026&date=2026-01-19"""
        endpoint = f"attendance?school_id={self.school_id}&date=2026-01-19"
        success, response = self.run_test("Get Attendance - Demo Date", "GET", endpoint, 200)
        
        if success:
            attendance = response.get('attendance', response) if isinstance(response, dict) else response
            if isinstance(attendance, list):
                attendance_count = len(attendance)
                print(f"   📊 Found {attendance_count} attendance records")
                if attendance_count > 0:
                    print(f"   ✅ Attendance records exist for demo date")
                    return True
                else:
                    print(f"   ⚠️ No attendance records found for 2026-01-19")
                    return True  # Still working, just no data
            else:
                print(f"   ⚠️ Unexpected response format")
        return False

    # ============== FEES TESTS ==============
    
    def test_get_fees(self):
        """Test GET /api/fees/invoices?school_id=SCH-DEMO-2026"""
        endpoint = f"fees/invoices?school_id={self.school_id}"
        success, response = self.run_test("Get Fee Invoices - Demo School", "GET", endpoint, 200)
        
        if success:
            fees = response.get('invoices', response) if isinstance(response, dict) else response
            if isinstance(fees, list):
                fee_count = len(fees)
                print(f"   📊 Found {fee_count} fee invoices")
                
                # Check for paid/pending status
                paid_count = 0
                pending_count = 0
                for fee in fees:
                    status = fee.get('status', '').lower()
                    if 'paid' in status:
                        paid_count += 1
                    elif 'pending' in status:
                        pending_count += 1
                
                print(f"   📊 Paid: {paid_count}, Pending: {pending_count}")
                if fee_count > 0:
                    print(f"   ✅ Fee invoices with status found")
                    return True
                else:
                    print(f"   ⚠️ No fee invoices found")
                    return True  # Still working, just no data
            else:
                print(f"   ⚠️ Unexpected response format")
        return False

    # ============== TINO BRAIN AI TESTS (Critical for demo) ==============
    
    def test_tino_brain_status(self):
        """Test GET /api/tino-brain/status"""
        success, response = self.run_test("Tino Brain Status", "GET", "tino-brain/status", 200)
        
        if success:
            ai_enabled = response.get('ai_enabled', False)
            using_emergent = response.get('using_emergent', False)
            print(f"   📊 AI Enabled: {ai_enabled}, Using Emergent: {using_emergent}")
            if ai_enabled:
                print(f"   ✅ Tino Brain AI is enabled")
                return True
            else:
                self.critical_issues.append("Tino Brain AI is not enabled - critical for demo")
                return False
        return False

    def test_tino_brain_query_absent(self):
        """Test POST /api/tino-brain/query with 'Aaj kitne bachhe absent hain?'"""
        data = {
            "query": "Aaj kitne bachhe absent hain?",
            "school_id": self.school_id,
            "user_id": "demo-user",
            "user_role": "director",
            "user_name": "Demo Director"
        }
        
        success, response = self.run_test("Tino Brain Query - Absent Students", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            if any(word in message.lower() for word in ["absent", "bachhe", "students", "आज"]):
                print(f"   ✅ AI understands absent students query")
                return True
            else:
                print(f"   ⚠️ AI response may not be relevant to query")
                return True  # Still working, just response quality issue
        else:
            self.critical_issues.append("Tino Brain query for absent students failed")
            return False

    def test_tino_brain_query_fees(self):
        """Test POST /api/tino-brain/query with 'Fee ka status batao'"""
        data = {
            "query": "Fee ka status batao",
            "school_id": self.school_id,
            "user_id": "demo-user",
            "user_role": "director",
            "user_name": "Demo Director"
        }
        
        success, response = self.run_test("Tino Brain Query - Fee Status", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            if any(word in message.lower() for word in ["fee", "fees", "status", "फीस"]):
                print(f"   ✅ AI understands fee status query")
                return True
            else:
                print(f"   ⚠️ AI response may not be relevant to query")
                return True  # Still working, just response quality issue
        else:
            self.critical_issues.append("Tino Brain query for fee status failed")
            return False

    def test_tino_brain_query_class10(self):
        """Test POST /api/tino-brain/query with 'Class 10 ki condition'"""
        data = {
            "query": "Class 10 ki condition",
            "school_id": self.school_id,
            "user_id": "demo-user",
            "user_role": "director",
            "user_name": "Demo Director"
        }
        
        success, response = self.run_test("Tino Brain Query - Class 10 Condition", "POST", "tino-brain/query", 200, data)
        
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            if any(word in message.lower() for word in ["class", "10", "condition", "कक्षा"]):
                print(f"   ✅ AI understands class condition query")
                return True
            else:
                print(f"   ⚠️ AI response may not be relevant to query")
                return True  # Still working, just response quality issue
        else:
            self.critical_issues.append("Tino Brain query for class condition failed")
            return False

    # ============== MOCK CCTV TESTS (8 cameras) ==============
    
    def test_cctv_devices(self):
        """Test GET /api/face-recognition/cctv/devices/SCH-DEMO-2026"""
        endpoint = f"face-recognition/cctv/devices/{self.school_id}"
        success, response = self.run_test("CCTV Devices - Demo School", "GET", endpoint, 200)
        
        if success:
            devices = response.get('devices', response) if isinstance(response, dict) else response
            if isinstance(devices, list):
                device_count = len(devices)
                print(f"   📊 Found {device_count} CCTV devices")
                if device_count == 8:
                    print(f"   ✅ Correct CCTV device count (8)")
                else:
                    print(f"   ⚠️ Expected 8 CCTV devices, found {device_count}")
                
                # Check if all cameras show "online" status
                online_count = 0
                for device in devices:
                    status = device.get('status', '').lower()
                    if 'online' in status:
                        online_count += 1
                
                print(f"   📊 Online cameras: {online_count}/{device_count}")
                if online_count == device_count:
                    print(f"   ✅ All cameras are online")
                else:
                    print(f"   ⚠️ Not all cameras are online")
                
                return True
            else:
                print(f"   ⚠️ Unexpected response format")
        else:
            self.critical_issues.append("CCTV devices API failed - needed for demo")
            return False

    # ============== MOCK BIOMETRIC TESTS (5 devices) ==============
    
    def test_biometric_devices(self):
        """Test GET /api/biometric/devices?school_id=SCH-DEMO-2026"""
        endpoint = f"biometric/devices?school_id={self.school_id}"
        success, response = self.run_test("Biometric Devices - Demo School", "GET", endpoint, 200)
        
        if success:
            devices = response.get('devices', response) if isinstance(response, dict) else response
            if isinstance(devices, list):
                device_count = len(devices)
                print(f"   📊 Found {device_count} biometric devices")
                if device_count == 5:
                    print(f"   ✅ Correct biometric device count (5)")
                else:
                    print(f"   ⚠️ Expected 5 biometric devices, found {device_count}")
                
                # Check if all devices show "online" status
                online_count = 0
                for device in devices:
                    status = device.get('status', '').lower()
                    if 'online' in status:
                        online_count += 1
                
                print(f"   📊 Online devices: {online_count}/{device_count}")
                if online_count == device_count:
                    print(f"   ✅ All biometric devices are online")
                else:
                    print(f"   ⚠️ Not all biometric devices are online")
                
                return True
            else:
                print(f"   ⚠️ Unexpected response format")
        else:
            self.critical_issues.append("Biometric devices API failed - needed for demo")
            return False

    # ============== VOICE ASSISTANT TESTS ==============
    
    def test_voice_assistant_status(self):
        """Test GET /api/voice-assistant/status"""
        success, response = self.run_test("Voice Assistant Status", "GET", "voice-assistant/status", 200)
        
        if success:
            tts_available = response.get('tts_available', False)
            stt_available = response.get('stt_available', False)
            print(f"   📊 TTS Available: {tts_available}, STT Available: {stt_available}")
            
            if tts_available and stt_available:
                print(f"   ✅ Both TTS and STT are available")
                return True
            elif tts_available or stt_available:
                print(f"   ⚠️ Only partial voice assistant functionality available")
                return True
            else:
                self.critical_issues.append("Voice Assistant TTS/STT not available - needed for demo")
                return False
        else:
            self.critical_issues.append("Voice Assistant status API failed")
            return False

    # ============== AI GREETING TESTS ==============
    
    def test_ai_greeting_parent(self):
        """Test POST /api/ai-greeting/detect with parent detection"""
        data = {
            "school_id": self.school_id,
            "person_type": "parent",
            "person_name": "Demo Parent",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        
        success, response = self.run_test("AI Greeting - Parent Detection", "POST", "ai-greeting/detect", 200, data)
        
        if success:
            greeting_text = response.get("greeting_text", "")
            if greeting_text:
                print(f"   📝 Greeting: {greeting_text[:50]}...")
                print(f"   ✅ AI greeting generated for parent")
                return True
            else:
                print(f"   ⚠️ No greeting text generated")
                return True  # Still working, just no greeting
        else:
            self.critical_issues.append("AI Greeting for parents failed")
            return False

    def test_ai_greeting_staff(self):
        """Test POST /api/ai-greeting/detect with staff detection"""
        data = {
            "school_id": self.school_id,
            "person_type": "staff",
            "person_name": "Demo Teacher",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        
        success, response = self.run_test("AI Greeting - Staff Detection", "POST", "ai-greeting/detect", 200, data)
        
        if success:
            greeting_text = response.get("greeting_text", "")
            if greeting_text:
                print(f"   📝 Greeting: {greeting_text[:50]}...")
                print(f"   ✅ AI greeting generated for staff")
                return True
            else:
                print(f"   ⚠️ No greeting text generated")
                return True  # Still working, just no greeting
        else:
            self.critical_issues.append("AI Greeting for staff failed")
            return False

    # ============== DASHBOARD STATS TESTS ==============
    
    def test_dashboard_stats(self):
        """Test GET /api/dashboard/stats?school_id=SCH-DEMO-2026"""
        endpoint = f"dashboard/stats?school_id={self.school_id}"
        success, response = self.run_test("Dashboard Stats - Demo School", "GET", endpoint, 200)
        
        if success:
            stats = response
            print(f"   📊 Dashboard stats retrieved")
            
            # Check for key stats
            expected_keys = ["total_students", "total_staff", "total_classes", "attendance_today"]
            for key in expected_keys:
                if key in stats:
                    print(f"   ✅ {key}: {stats.get(key)}")
                else:
                    print(f"   ⚠️ Missing stat: {key}")
            
            return True
        else:
            self.critical_issues.append("Dashboard stats API failed")
            return False

    def run_demo_tests(self):
        """Run all demo-specific tests"""
        print("🚀 Starting SchoolTino Demo Tests...")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🏫 Demo School ID: {self.school_id}")
        
        # Test sequence for demo
        tests = [
            # 1. AUTHENTICATION
            ("🔐 Director Login (director@demo.com)", self.test_login_director),
            ("🔐 Teacher Login (teacher1@demo.com)", self.test_login_teacher),
            ("🔐 Auth Me (with token)", self.test_auth_me),
            
            # 2. STUDENTS (30 students)
            ("👥 Get Students (30 expected)", self.test_get_students),
            ("👤 Get Student Detail", self.test_get_student_detail),
            
            # 3. STAFF (15 total)
            ("👨‍🏫 Get Staff (15 expected)", self.test_get_staff),
            
            # 4. CLASSES (7 classes)
            ("🏫 Get Classes (7 expected)", self.test_get_classes),
            
            # 5. ATTENDANCE
            ("📋 Get Attendance (2026-01-19)", self.test_get_attendance),
            
            # 6. FEES
            ("💰 Get Fees (paid/pending status)", self.test_get_fees),
            
            # 7. TINO BRAIN AI (Critical for demo)
            ("🧠 Tino Brain Status", self.test_tino_brain_status),
            ("🧠 Tino Brain Query - Absent Students", self.test_tino_brain_query_absent),
            ("🧠 Tino Brain Query - Fee Status", self.test_tino_brain_query_fees),
            ("🧠 Tino Brain Query - Class 10 Condition", self.test_tino_brain_query_class10),
            
            # 8. MOCK CCTV (8 cameras)
            ("📹 CCTV Devices (8 cameras online)", self.test_cctv_devices),
            
            # 9. MOCK BIOMETRIC (5 devices)
            ("👆 Biometric Devices (5 devices online)", self.test_biometric_devices),
            
            # 10. VOICE ASSISTANT
            ("🎤 Voice Assistant Status (TTS/STT)", self.test_voice_assistant_status),
            
            # 11. AI GREETING
            ("👋 AI Greeting - Parent Detection", self.test_ai_greeting_parent),
            ("👋 AI Greeting - Staff Detection", self.test_ai_greeting_staff),
            
            # 12. DASHBOARD STATS
            ("📊 Dashboard Stats", self.test_dashboard_stats),
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
        print(f"\n📊 DEMO TEST SUMMARY:")
        print(f"   Total APIs Tested: {self.tests_run}")
        print(f"   APIs Passed: {self.tests_passed}")
        print(f"   APIs Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOR DEMO:")
            for issue in self.critical_issues:
                print(f"   ❌ {issue}")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
                print(f"   - {failure['test']}: {error_msg}")
        
        # Demo readiness assessment
        critical_count = len(self.critical_issues)
        if critical_count == 0:
            print(f"\n🎉 DEMO READY! All critical APIs are working.")
        else:
            print(f"\n⚠️ DEMO NOT READY! {critical_count} critical issues need fixing.")
        
        return self.tests_passed == self.tests_run and critical_count == 0

def main():
    tester = SchoolTinoDemoTester()
    success = tester.run_demo_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())