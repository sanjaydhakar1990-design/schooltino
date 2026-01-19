#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SchoolTinoDemoHealthCheck:
    def __init__(self, base_url="https://schoolerp-7.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                    # Print key response details for demo verification
                    if 'message' in response_data:
                        print(f"   📝 Response: {response_data['message'][:100]}...")
                    elif 'status' in response_data:
                        print(f"   📝 Status: {response_data['status']}")
                    elif 'tts_available' in response_data:
                        print(f"   📝 TTS Available: {response_data['tts_available']}, STT Available: {response_data.get('stt_available', False)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_login_api(self):
        """Test Login API with director@testschool.com credentials"""
        login_data = {
            "email": "director@testschool.com",
            "password": "password"
        }
        
        success, response = self.run_test("Login API", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   🔑 Login successful, token obtained")
            return True
        return False

    def test_tino_brain_status(self):
        """Test Tino Brain Status API"""
        success, response = self.run_test("Tino Brain Status", "GET", "tino-brain/status", 200)
        if success:
            using_emergent = response.get("using_emergent", False)
            ai_enabled = response.get("ai_enabled", False)
            print(f"   📊 AI Enabled: {ai_enabled}, Using Emergent: {using_emergent}")
        return success

    def test_tino_brain_query(self):
        """Test Tino Brain Query with Hindi query"""
        data = {
            "query": "School ka status batao",
            "school_id": "default",
            "user_id": "test-user",
            "user_role": "director",
            "user_name": "Director",
            "language": "hinglish"
        }
        
        success, response = self.run_test("Tino Brain Query (Hindi)", "POST", "tino-brain/query", 200, data)
        if success:
            message = response.get("message", "")
            if any(word in message.lower() for word in ["school", "status", "hai", "hoon"]):
                print(f"   ✅ AI responds correctly in Hinglish")
            else:
                print(f"   ⚠️ Response may not be in expected language")
        return success

    def test_voice_assistant_status(self):
        """Test Voice Assistant Status API"""
        success, response = self.run_test("Voice Assistant Status", "GET", "voice-assistant/status", 200)
        if success:
            tts_available = response.get("tts_available", False)
            stt_available = response.get("stt_available", False)
            if tts_available and stt_available:
                print(f"   ✅ Both TTS and STT services are available")
            else:
                print(f"   ⚠️ TTS: {tts_available}, STT: {stt_available}")
        return success

    def test_ai_greeting_detect(self):
        """Test AI Greeting Detection API"""
        data = {
            "school_id": "default",
            "person_type": "parent",
            "person_name": "Test Parent",
            "device_type": "cctv",
            "device_location": "main_gate",
            "entry_type": "entry"
        }
        
        success, response = self.run_test("AI Greeting Detection", "POST", "ai-greeting/detect", 200, data)
        if success:
            greeting_text = response.get("greeting_text", "")
            if greeting_text:
                print(f"   📝 Greeting Generated: {greeting_text[:50]}...")
            else:
                print(f"   ⚠️ No greeting text generated")
        return success

    def test_dashboard_stats(self):
        """Test Dashboard Stats API"""
        success, response = self.run_test("Dashboard Stats", "GET", "dashboard/stats/default", 200)
        if success:
            # Check if basic stats are present
            stats_keys = ["total_students", "total_staff", "total_classes"]
            found_keys = [key for key in stats_keys if key in response]
            print(f"   📊 Stats available: {', '.join(found_keys)}")
        return success

    def run_demo_health_check(self):
        """Run the specific health check tests requested for demo"""
        print("🎯 SCHOOLTINO DEMO HEALTH CHECK")
        print("=" * 50)
        print(f"📍 Base URL: {self.base_url}")
        print(f"🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # Critical APIs for demo as requested
        critical_tests = [
            ("1. Login API (director@testschool.com)", self.test_login_api),
            ("2. Tino Brain Status", self.test_tino_brain_status),
            ("3. Tino Brain Query (Hindi)", self.test_tino_brain_query),
            ("4. Voice Assistant Status", self.test_voice_assistant_status),
            ("5. AI Greeting Detection", self.test_ai_greeting_detect),
            ("6. Dashboard Stats", self.test_dashboard_stats),
        ]

        print("🚀 Running Critical API Tests for Demo...")
        
        for test_name, test_func in critical_tests:
            try:
                result = test_func()
                if not result:
                    print(f"⚠️  {test_name} - NEEDS ATTENTION")
            except Exception as e:
                print(f"💥 {test_name} - CRASHED: {str(e)}")
                self.failed_tests.append({
                    "test": test_name,
                    "error": f"Exception: {str(e)}"
                })

        # Print final summary
        print("\n" + "=" * 50)
        print("📊 DEMO READINESS SUMMARY")
        print("=" * 50)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL CRITICAL APIS WORKING - DEMO READY! 🎉")
            return True
        else:
            print(f"\n⚠️  ISSUES FOUND - {self.tests_run - self.tests_passed} API(s) need fixing:")
            for failure in self.failed_tests:
                error_msg = failure.get('error', f"HTTP {failure.get('actual')} (expected {failure.get('expected')})")
                print(f"   ❌ {failure['test']}: {error_msg}")
            print("\n🔧 Fix these issues before demo!")
            return False

def main():
    checker = SchoolTinoDemoHealthCheck()
    success = checker.run_demo_health_check()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())