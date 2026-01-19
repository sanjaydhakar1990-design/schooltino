#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NewFeaturesAPITester:
    def __init__(self, base_url="https://schoolerp-7.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)

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

    def test_new_features(self):
        """Test all NEW features from review request"""
        print("🚀 Testing NEW Features for SCH-DEMO-2026...")
        
        # 1. GALLERY/EVENT PHOTOS
        print("\n📸 GALLERY/EVENT PHOTOS TESTS")
        
        success, response = self.run_test("Gallery Event Types", "GET", "gallery/event-types", 200)
        if success:
            event_types = response.get("event_types", [])
            print(f"   📝 Found {len(event_types)} event types")
        
        # Create event
        event_data = {
            "school_id": "SCH-DEMO-2026",
            "event_name": "Annual Sports Day 2026",
            "event_type": "sports",
            "event_date": "2026-03-15",
            "description": "Annual sports competition",
            "created_by": "director"
        }
        success, response = self.run_test("Gallery Create Event", "POST", "gallery/events", 200, event_data)
        
        # Get events
        success, response = self.run_test("Gallery Get Events", "GET", "gallery/events/SCH-DEMO-2026", 200)
        if success:
            events = response.get("events", [])
            print(f"   📝 Found {len(events)} events for SCH-DEMO-2026")
        
        # 2. GOVT EXAM DOCUMENTS
        print("\n📋 GOVT EXAM DOCUMENTS TESTS")
        
        success, response = self.run_test("Govt Exam Document Types", "GET", "govt-exam/document-types", 200)
        if success:
            doc_types = response.get("document_types", [])
            print(f"   📝 Found {len(doc_types)} document types")
        
        success, response = self.run_test("Govt Exam Notifications", "GET", "govt-exam/app-open-notifications/SCH-DEMO-2026?user_type=student", 200)
        if success:
            notifications = response.get("notifications", [])
            print(f"   📝 Found {len(notifications)} notifications")
        
        # 3. GPS TRANSPORT SETUP
        print("\n🚌 GPS TRANSPORT SETUP TESTS")
        
        success, response = self.run_test("Transport GPS Setup Guide", "GET", "transport/gps-setup/guide", 200)
        if success:
            guide = response.get("guide", {})
            ai_steps = guide.get("ai_steps", [])
            manual_steps = guide.get("manual_steps", [])
            print(f"   📝 AI Steps: {len(ai_steps)}, Manual Steps: {len(manual_steps)}")
        
        success, response = self.run_test("Transport GPS Status", "GET", "transport/gps-setup/status/SCH-DEMO-2026", 200)
        if success:
            status = response.get("status", {})
            print(f"   📝 GPS Status: {status}")
        
        # 4. CASH PAYMENT (Fixed)
        print("\n💰 CASH PAYMENT TESTS")
        
        payment_data = {
            "student_id": "STD-2026-0002",
            "amount": 3000,
            "fee_type": "tuition",
            "school_id": "SCH-DEMO-2026",
            "payment_mode": "cash",
            "collected_by": "accountant",  # Fixed: added required field
            "remarks": "Monthly tuition fee payment"
        }
        success, response = self.run_test("Cash Payment", "POST", "fee-payment/cash-payment", 200, payment_data)
        if success:
            receipt_no = response.get("receipt_no") or response.get("receipt_id")
            print(f"   📝 Receipt generated: {receipt_no}")
        
        # 5. AI PAPER GENERATOR - CHAPTER SELECTION
        print("\n📝 AI PAPER GENERATOR TESTS")
        
        success, response = self.run_test("AI Paper Subjects Class 10", "GET", "ai/paper/subjects/Class%2010", 200)
        if success:
            subjects = response.get("subjects", [])
            print(f"   📝 Found {len(subjects)} subjects for Class 10")
        
        success, response = self.run_test("AI Paper Chapters Mathematics", "GET", "ai/paper/chapters/Class%2010/mathematics", 200)
        if success:
            chapters = response.get("chapters", [])
            print(f"   📝 Found {len(chapters)} mathematics chapters")
        
        success, response = self.run_test("AI Paper Chapters Science", "GET", "ai/paper/chapters/Class%2010/science", 200)
        if success:
            chapters = response.get("chapters", [])
            print(f"   📝 Found {len(chapters)} science chapters")
        
        # 6. TRANSPORT PARENT NOTIFICATIONS (Fixed)
        print("\n👨‍👩‍👧‍👦 TRANSPORT PARENT NOTIFICATIONS TESTS")
        
        success, response = self.run_test("Transport Parent Track", "GET", "transport/parent-track/STD-2026-0001?school_id=SCH-DEMO-2026", 200)
        if success:
            tracking = response.get("tracking", {})
            print(f"   📝 Tracking data: {tracking}")
        
        # 7. TINO BRAIN (Verify still working)
        print("\n🧠 TINO BRAIN VERIFICATION TESTS")
        
        query_data = {
            "query": "Aaj kitne bachhe absent hain?",
            "school_id": "SCH-DEMO-2026",
            "user_id": "test-director",
            "user_role": "director",
            "user_name": "Director"
        }
        success, response = self.run_test("Tino Brain Absent Query", "POST", "tino-brain/query", 200, query_data)
        if success:
            message = response.get("message", "")
            print(f"   📝 Response: {message[:100]}...")
            if any(word in message.lower() for word in ["absent", "गैरहाजिर", "attendance"]):
                print(f"   ✅ Tino Brain handles absence query correctly")

    def run_all_tests(self):
        """Run all new feature tests"""
        self.test_new_features()
        
        # Print summary
        print(f"\n📊 NEW FEATURES Test Summary:")
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
    tester = NewFeaturesAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())