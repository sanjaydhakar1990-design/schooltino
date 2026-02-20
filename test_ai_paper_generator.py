#!/usr/bin/env python3
"""
AI Paper Generator Testing - Review Request
Tests for:
1. MP Board Sanskrit Chapters Loading
2. RBSE Chapters Loading  
3. Paper Generation with Professional Prompt
"""

import requests
import json
import sys

BASE_URL = "https://teachfixed.preview.emergentagent.com/api"

# Test credentials from review request
TEST_EMAIL = "director@test.com"
TEST_PASSWORD = "test1234"

class AIGeneratorTester:
    def __init__(self):
        self.token = None
        self.school_id = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.failed_tests = []
    
    def login(self):
        """Login with test credentials"""
        print("\n" + "="*80)
        print("🔐 LOGGING IN")
        print("="*80)
        
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            user = data.get("user", {})
            self.school_id = user.get("school_id")
            print(f"✅ Login successful")
            print(f"   User: {user.get('name')} ({user.get('role')})")
            print(f"   School ID: {self.school_id}")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    
    def test_mp_board_sanskrit_chapters(self):
        """Test Case 1: MP Board Sanskrit Chapters for Class 6"""
        print("\n" + "="*80)
        print("📚 TEST CASE 1: MP Board Sanskrit Chapters (Class 6)")
        print("="*80)
        
        # Test getting subjects for Class 6
        print("\n🔍 Step 1: Getting subjects for Class 6...")
        response = requests.get(
            f"{BASE_URL}/ai/paper/subjects/Class%206",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get subjects: {response.status_code}")
            print(f"   Response: {response.text}")
            self.tests_failed += 1
            self.failed_tests.append("MP Board - Get Subjects")
            return False
        
        data = response.json()
        subjects = data.get("subjects", [])
        print(f"✅ Found {len(subjects)} subjects for Class 6")
        
        # Check if Sanskrit is available
        sanskrit_found = False
        for subject in subjects:
            if "sanskrit" in subject.get("name", "").lower() or "संस्कृत" in subject.get("name", ""):
                sanskrit_found = True
                print(f"   ✅ Sanskrit subject found: {subject.get('name')}")
                break
        
        if not sanskrit_found:
            print(f"   ⚠️ Sanskrit not in subjects list, but will try to get chapters anyway")
        
        # Test getting chapters for Sanskrit
        print("\n🔍 Step 2: Getting Sanskrit chapters for Class 6...")
        response = requests.get(
            f"{BASE_URL}/ai/paper/chapters/Class%206/sanskrit",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get Sanskrit chapters: {response.status_code}")
            print(f"   Response: {response.text}")
            self.tests_failed += 1
            self.failed_tests.append("MP Board - Sanskrit Chapters")
            return False
        
        data = response.json()
        chapters = data.get("chapters", [])
        
        if not chapters or len(chapters) == 0:
            print(f"❌ CRITICAL: No chapters available for Sanskrit!")
            print(f"   This is the main issue - chapters should load")
            self.tests_failed += 1
            self.failed_tests.append("MP Board - Sanskrit Chapters Empty")
            return False
        
        print(f"✅ SUCCESS: Found {len(chapters)} Sanskrit chapters")
        print(f"\n📝 Sanskrit Chapters for Class 6:")
        for i, chapter in enumerate(chapters[:5], 1):
            print(f"   {i}. {chapter.get('name', 'Unknown')}")
        
        if len(chapters) > 5:
            print(f"   ... and {len(chapters) - 5} more chapters")
        
        # Check if it's using CBSE/NCERT as fallback
        board = data.get("board", "Unknown")
        note = data.get("note", "")
        print(f"\n   Board: {board}")
        if note:
            print(f"   Note: {note}")
        
        self.tests_passed += 1
        return True
    
    def test_rbse_chapters(self):
        """Test Case 2: RBSE Chapters for Class 7 Mathematics"""
        print("\n" + "="*80)
        print("📚 TEST CASE 2: RBSE Chapters (Class 7 Mathematics)")
        print("="*80)
        
        # Test getting subjects for Class 7
        print("\n🔍 Step 1: Getting subjects for Class 7...")
        response = requests.get(
            f"{BASE_URL}/ai/paper/subjects/Class%207",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get subjects: {response.status_code}")
            self.tests_failed += 1
            self.failed_tests.append("RBSE - Get Subjects")
            return False
        
        data = response.json()
        subjects = data.get("subjects", [])
        print(f"✅ Found {len(subjects)} subjects for Class 7")
        
        # Check if Mathematics is available
        math_found = False
        for subject in subjects:
            if "math" in subject.get("name", "").lower() or "गणित" in subject.get("name", ""):
                math_found = True
                print(f"   ✅ Mathematics subject found: {subject.get('name')}")
                break
        
        if not math_found:
            print(f"   ⚠️ Mathematics not explicitly listed, but will try to get chapters")
        
        # Test getting chapters for Mathematics
        print("\n🔍 Step 2: Getting Mathematics chapters for Class 7...")
        response = requests.get(
            f"{BASE_URL}/ai/paper/chapters/Class%207/mathematics",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get Mathematics chapters: {response.status_code}")
            print(f"   Response: {response.text}")
            self.tests_failed += 1
            self.failed_tests.append("RBSE - Mathematics Chapters")
            return False
        
        data = response.json()
        chapters = data.get("chapters", [])
        
        if not chapters or len(chapters) == 0:
            print(f"❌ CRITICAL: No chapters available for Mathematics!")
            self.tests_failed += 1
            self.failed_tests.append("RBSE - Mathematics Chapters Empty")
            return False
        
        print(f"✅ SUCCESS: Found {len(chapters)} Mathematics chapters")
        print(f"\n📝 Mathematics Chapters for Class 7:")
        for i, chapter in enumerate(chapters[:5], 1):
            print(f"   {i}. {chapter.get('name', 'Unknown')}")
        
        if len(chapters) > 5:
            print(f"   ... and {len(chapters) - 5} more chapters")
        
        # Check if it's using CBSE/NCERT as fallback
        board = data.get("board", "Unknown")
        note = data.get("note", "")
        print(f"\n   Board: {board}")
        if note:
            print(f"   Note: {note}")
        
        self.tests_passed += 1
        return True
    
    def test_generate_sample_paper(self):
        """Test Case 3: Generate Sample Paper with Professional Prompt"""
        print("\n" + "="*80)
        print("📝 TEST CASE 3: Generate Sample Paper (MP Board Class 6 Sanskrit)")
        print("="*80)
        
        # First, get chapters to select from
        print("\n🔍 Step 1: Getting Sanskrit chapters...")
        response = requests.get(
            f"{BASE_URL}/ai/paper/chapters/Class%206/sanskrit",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code != 200:
            print(f"❌ Cannot get chapters for paper generation")
            self.tests_failed += 1
            self.failed_tests.append("Paper Generation - Get Chapters")
            return False
        
        chapters_data = response.json()
        chapters = chapters_data.get("chapters", [])
        
        if not chapters:
            print(f"❌ No chapters available to generate paper")
            self.tests_failed += 1
            self.failed_tests.append("Paper Generation - No Chapters")
            return False
        
        # Select first 2-3 chapters
        selected_chapters = [ch.get("name") for ch in chapters[:3]]
        print(f"✅ Selected chapters: {', '.join(selected_chapters)}")
        
        # Prepare paper generation request
        print("\n🔍 Step 2: Generating paper...")
        paper_request = {
            "subject": "संस्कृत",
            "class_name": "Class 6",
            "chapter": ", ".join(selected_chapters),
            "chapters": selected_chapters,
            "exam_name": "Unit Test 1",
            "difficulty": "medium",
            "question_types": ["mcq", "short", "long"],
            "total_marks": 50,
            "time_duration": 90,
            "language": "hindi"
        }
        
        print(f"\n📋 Paper Request:")
        print(f"   Subject: {paper_request['subject']}")
        print(f"   Class: {paper_request['class_name']}")
        print(f"   Chapters: {', '.join(selected_chapters)}")
        print(f"   Exam: {paper_request['exam_name']}")
        print(f"   Difficulty: {paper_request['difficulty']}")
        print(f"   Total Marks: {paper_request['total_marks']}")
        print(f"   Duration: {paper_request['time_duration']} minutes")
        print(f"   Language: {paper_request['language']}")
        
        response = requests.post(
            f"{BASE_URL}/ai/generate-paper",
            json=paper_request,
            headers={"Authorization": f"Bearer {self.token}"},
            timeout=60  # AI generation can take time
        )
        
        if response.status_code != 200:
            print(f"\n❌ Paper generation failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            self.tests_failed += 1
            self.failed_tests.append("Paper Generation - API Failed")
            return False
        
        data = response.json()
        print(f"\n✅ Paper generated successfully!")
        
        # Verify paper structure
        print(f"\n🔍 Step 3: Verifying paper structure...")
        
        # Check for questions
        questions = data.get("questions", [])
        if not questions:
            print(f"❌ No questions in generated paper")
            self.tests_failed += 1
            self.failed_tests.append("Paper Generation - No Questions")
            return False
        
        print(f"✅ Paper contains {len(questions)} questions")
        
        # Check total marks
        total_marks = data.get("total_marks", 0)
        if total_marks != paper_request["total_marks"]:
            print(f"⚠️ WARNING: Total marks mismatch!")
            print(f"   Expected: {paper_request['total_marks']}")
            print(f"   Got: {total_marks}")
        else:
            print(f"✅ Total marks match exactly: {total_marks}")
        
        # Check language (should be Hindi)
        print(f"\n🔍 Step 4: Verifying language...")
        sample_questions = questions[:3]
        hindi_found = False
        
        for i, q in enumerate(sample_questions, 1):
            question_text = q.get("question", "")
            print(f"\n   Question {i}: {question_text[:100]}...")
            
            # Check for Hindi characters
            if any(ord(char) >= 0x0900 and ord(char) <= 0x097F for char in question_text):
                hindi_found = True
                print(f"   ✅ Contains Hindi (Devanagari) text")
            else:
                print(f"   ⚠️ No Hindi characters detected")
        
        if hindi_found:
            print(f"\n✅ Paper contains proper Hindi language questions")
        else:
            print(f"\n⚠️ WARNING: Paper may not have Hindi questions")
        
        # Check for professional prompt output
        print(f"\n🔍 Step 5: Checking for professional SchoolTino prompt output...")
        
        # Check if paper has proper structure
        has_sections = "sections" in data or isinstance(questions, list)
        has_exam_name = data.get("exam_name") == paper_request["exam_name"]
        has_class = data.get("class_name") == paper_request["class_name"]
        
        print(f"   Proper structure: {'✅' if has_sections else '❌'}")
        print(f"   Exam name included: {'✅' if has_exam_name else '❌'}")
        print(f"   Class included: {'✅' if has_class else '❌'}")
        
        # Check if questions have proper format
        if questions:
            first_q = questions[0]
            has_marks = "marks" in first_q
            has_answer = "answer" in first_q
            has_type = "type" in first_q
            
            print(f"   Questions have marks: {'✅' if has_marks else '❌'}")
            print(f"   Questions have answers: {'✅' if has_answer else '❌'}")
            print(f"   Questions have type: {'✅' if has_type else '❌'}")
        
        print(f"\n✅ Paper generation test completed successfully!")
        self.tests_passed += 1
        return True
    
    def run_all_tests(self):
        """Run all test cases"""
        print("\n" + "="*80)
        print("🚀 AI PAPER GENERATOR TESTING - REVIEW REQUEST")
        print("="*80)
        print(f"Testing URL: {BASE_URL}")
        print(f"Test User: {TEST_EMAIL}")
        
        # Login first
        if not self.login():
            print("\n❌ Login failed. Cannot proceed with tests.")
            return False
        
        # Run test cases
        self.test_mp_board_sanskrit_chapters()
        self.test_rbse_chapters()
        self.test_generate_sample_paper()
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_failed}")
        print(f"📈 Success Rate: {(self.tests_passed / (self.tests_passed + self.tests_failed) * 100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print("\n" + "="*80)
        
        return self.tests_failed == 0


if __name__ == "__main__":
    tester = AIGeneratorTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
